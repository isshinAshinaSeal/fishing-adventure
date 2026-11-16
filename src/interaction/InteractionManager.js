// InteractionManager: Coordinates proximity detection, prompt events, debounced triggers, and dialogue modal state.

import { Config } from '../config.js';

export class InteractionManager {
  constructor(config = Config.interaction) {
    this.config = config;
    this.interactables = new Set();
    this.activeInteractable = null;
    this.activeDialogue = null;

    // Debounce state
    this.lastInteractTime = -9999;
    this.debounceTime = config.debounceTime || 0.35; // seconds
    this.totalInteractionsTriggered = 0;

    // Event callbacks
    this.onPromptChange = null;   // (interactable | null) => void
    this.onDialogueChange = null; // (dialogueState | null) => void
  }

  /**
   * Registers a world interactable.
   */
  register(interactable) {
    if (interactable) {
      this.interactables.add(interactable);
    }
    return interactable;
  }

  /**
   * Unregisters an interactable.
   */
  unregister(interactable) {
    this.interactables.delete(interactable);
    if (this.activeInteractable === interactable) {
      this._setActiveInteractable(null);
    }
  }

  /**
   * Returns whether player is in a blocking interaction (e.g. open dialogue or modal).
   */
  isInteracting() {
    return Boolean(this.activeDialogue);
  }

  /**
   * Main per-frame update loop.
   * @param {number} dt - Delta time in seconds.
   * @param {PlayerController} player - Player instance.
   * @param {InputManager} input - Input system.
   */
  update(dt, player, input) {
    if (!player) return;

    // While piloting a vessel, world interactions are handled by the boat
    // (deck fishing / disembark) so the interact key is not consumed here.
    if (player.isMountedBoat) {
      if (this.activeInteractable) this._setActiveInteractable(null);
      return;
    }

    // 1. Proximity detection: identify closest valid candidate
    let bestCandidate = null;
    let closestDistSq = Infinity;

    // If already in modal dialogue, do not look for other interactables
    if (!this.activeDialogue) {
      for (const item of this.interactables) {
        if (!item || !item.canInteract(player)) continue;

        const dist = item.getDistanceTo(player.position);
        if (dist <= item.interactionRange) {
          const distSq = dist * dist;
          if (distSq < closestDistSq) {
            closestDistSq = distSq;
            bestCandidate = item;
          }
        }
      }
    }

    // 2. Update active candidate and dispatch prompt change events
    if (bestCandidate !== this.activeInteractable) {
      this._setActiveInteractable(bestCandidate);
    }

    // 3. Process interact button input
    if (input && input.consumeInteract()) {
      this.triggerInteract(player);
    }
  }

  _setActiveInteractable(candidate) {
    this.activeInteractable = candidate;
    if (typeof this.onPromptChange === 'function') {
      this.onPromptChange(this.activeInteractable);
    }
  }

  /**
   * Triggers interaction with debouncing against accidental double-clicks or key repeats.
   */
  triggerInteract(player) {
    const now = (typeof performance !== 'undefined') ? performance.now() / 1000 : Date.now() / 1000;
    if (now - this.lastInteractTime < this.debounceTime) {
      // Debounced: ignore rapid duplicate input
      return false;
    }
    this.lastInteractTime = now;

    // If dialogue is active, advance or dismiss dialogue
    if (this.activeDialogue) {
      this.advanceDialogue();
      return true;
    }

    // If an interactable is in range, trigger its onInteract
    if (this.activeInteractable) {
      this.totalInteractionsTriggered++;
      this.activeInteractable.onInteract(player, this);
      return true;
    }

    return false;
  }

  /**
   * Starts a dialogue modal sequence with an NPC.
   */
  openDialogue(npc, dialogueData) {
    if (!dialogueData || !dialogueData.lines || dialogueData.lines.length === 0) {
      return;
    }

    this.activeDialogue = {
      npcId: dialogueData.npcId || (npc ? npc.id : 'unknown'),
      speaker: dialogueData.speaker || (npc ? npc.name : 'Unknown'),
      title: dialogueData.title || (npc ? npc.title : ''),
      lines: dialogueData.lines,
      currentIndex: 0,
      // Expansion 8.0: dialogue can end in real service/quest choices.
      // Each choice is { id, label, hint?, action? } and the UI renders the
      // list when the final line is reached.
      choices: Array.isArray(dialogueData.choices) ? dialogueData.choices : null,
    };

    // Hide prompt while dialogue is open
    this._setActiveInteractable(null);

    if (typeof this.onDialogueChange === 'function') {
      this.onDialogueChange(this.activeDialogue);
    }
  }

  /**
   * Advances dialogue to next sentence, or closes if at end.
   */
  advanceDialogue() {
    if (!this.activeDialogue) return;

    const dialogue = this.activeDialogue;
    // With choices attached, the last line stays on screen until the player
    // picks a real action instead of silently closing the conversation.
    if (dialogue.choices && dialogue.choices.length > 0) {
      const lastIndex = dialogue.lines.length - 1;
      if (dialogue.currentIndex >= lastIndex) {
        if (typeof this.onDialogueChange === 'function') {
          this.onDialogueChange(dialogue);
        }
        return;
      }
    }

    dialogue.currentIndex++;
    if (dialogue.currentIndex >= dialogue.lines.length) {
      this.closeDialogue();
    } else {
      if (typeof this.onDialogueChange === 'function') {
        this.onDialogueChange(dialogue);
      }
    }
  }

  /** True when the dialogue has reached its final line and offers choices. */
  isDialogueChoiceReady() {
    const dialogue = this.activeDialogue;
    if (!dialogue || !dialogue.choices || dialogue.choices.length === 0) return false;
    return dialogue.currentIndex >= dialogue.lines.length - 1;
  }

  getDialogueChoices() {
    return this.activeDialogue && this.activeDialogue.choices
      ? this.activeDialogue.choices
      : [];
  }

  /**
   * Resolves a dialogue choice. Returns the choice descriptor so the caller can
   * execute service/quest actions outside the interaction layer.
   */
  chooseDialogue(index) {
    const dialogue = this.activeDialogue;
    if (!dialogue || !Array.isArray(dialogue.choices)) return null;
    if (!this.isDialogueChoiceReady()) return null;
    const choice = dialogue.choices[index];
    if (!choice) return null;
    this.closeDialogue();
    return choice;
  }

  /**
   * Closes open dialogue modal.
   */
  closeDialogue() {
    this.activeDialogue = null;
    if (typeof this.onDialogueChange === 'function') {
      this.onDialogueChange(null);
    }
  }

  /**
   * Cleans up all interactables and state.
   */
  reset() {
    this.activeInteractable = null;
    this.closeDialogue();
    this.lastInteractTime = -9999;
  }

  dispose() {
    this.reset();
    this.interactables.clear();
    this.onPromptChange = null;
    this.onDialogueChange = null;
  }
}

export default InteractionManager;
