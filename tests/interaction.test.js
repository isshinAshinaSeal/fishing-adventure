import { test, describe, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { InteractionManager } from '../src/interaction/InteractionManager.js';
import { Interactable } from '../src/interaction/Interactable.js';
import { NPC } from '../src/entities/NPC.js';
import { InputManager } from '../src/core/InputManager.js';
import { PlayerController } from '../src/entities/PlayerController.js';

describe('InteractionManager & NPC Interaction System (Phase 2)', () => {
  let interactionManager;
  let player;
  let input;
  let testNpc;

  beforeEach(() => {
    interactionManager = new InteractionManager({
      defaultRange: 3.0,
      debounceTime: 0.2, // 200ms debounce
    });
    player = new PlayerController();
    player.position.set(0, 0, 0);

    input = new InputManager(null);

    testNpc = new NPC({
      id: 'npc_test_finn',
      name: 'Captain Finn',
      title: 'Harbor Master',
      interactionRange: 3.0,
      position: { x: 2.0, y: 0, z: 0 }, // 2.0m away from player (0,0,0)
      dialogue: [
        'Welcome to Driftwood Island!',
        'Grab a fishing rod and cast into the ripples.',
      ],
    });
    interactionManager.register(testNpc);
  });

  test('TC-09: Interaction prompt appears when player is within correct distance', () => {
    let prompted = null;
    interactionManager.onPromptChange = (item) => {
      prompted = item;
    };

    // Player is at (0, 0, 0), NPC is at (2, 0, 0) -> distance is 2.0m <= 3.0m
    interactionManager.update(0.016, player, input);

    assert.ok(interactionManager.activeInteractable, 'Active interactable should be set');
    assert.strictEqual(interactionManager.activeInteractable.id, 'npc_test_finn');
    assert.strictEqual(prompted?.id, 'npc_test_finn', 'onPromptChange event should emit NPC');
    assert.strictEqual(interactionManager.activeInteractable.getPromptText(), 'Talk to Captain Finn');
  });

  test('TC-10: Prompt disappears immediately when player moves beyond interaction range', () => {
    let prompted = null;
    interactionManager.onPromptChange = (item) => {
      prompted = item;
    };

    // Step 1: In range
    interactionManager.update(0.016, player, input);
    assert.ok(interactionManager.activeInteractable);

    // Step 2: Player walks away to (10, 0, 0) -> distance 8.0m > 3.0m
    player.position.set(10, 0, 0);
    interactionManager.update(0.016, player, input);

    assert.strictEqual(interactionManager.activeInteractable, null, 'Active interactable should be cleared');
    assert.strictEqual(prompted, null, 'onPromptChange event should emit null');
  });

  test('TC-11: Player can interact with NPC via interact key (KeyE), opening dialogue', () => {
    let openedDialogue = null;
    interactionManager.onDialogueChange = (dialogueState) => {
      openedDialogue = dialogueState;
    };

    // Ensure in range
    interactionManager.update(0.016, player, input);

    // Press E key
    input.interactRequested = true;
    interactionManager.update(0.016, player, input);

    assert.strictEqual(interactionManager.isInteracting(), true, 'isInteracting should be true during dialogue');
    assert.ok(openedDialogue, 'Dialogue state should be emitted');
    assert.strictEqual(openedDialogue.speaker, 'Captain Finn');
    assert.strictEqual(openedDialogue.lines.length, 2);
    assert.strictEqual(openedDialogue.lines[0], 'Welcome to Driftwood Island!');
  });

  test('TC-12: Interactions do not trigger multiple times accidentally (Debounce verification)', () => {
    let triggerCount = 0;
    const testObject = new Interactable({
      id: 'test_chest',
      name: 'Treasure Chest',
      position: { x: 1, y: 0, z: 0 },
      interactionRange: 3.0,
      onInteract: () => {
        triggerCount++;
      },
    });
    interactionManager.register(testObject);

    // Put player closer to testObject
    player.position.set(0.5, 0, 0);
    interactionManager.update(0.016, player, input);
    assert.strictEqual(interactionManager.activeInteractable.id, 'test_chest');

    // Simulate rapid repeated interaction calls (e.g. key repeat or mouse click spam)
    const res1 = interactionManager.triggerInteract(player);
    const res2 = interactionManager.triggerInteract(player);
    const res3 = interactionManager.triggerInteract(player);
    const res4 = interactionManager.triggerInteract(player);

    assert.strictEqual(res1, true, 'First interaction should succeed');
    assert.strictEqual(res2, false, 'Second rapid interaction must be blocked by debounce');
    assert.strictEqual(res3, false, 'Third rapid interaction must be blocked by debounce');
    assert.strictEqual(res4, false, 'Fourth rapid interaction must be blocked by debounce');
    assert.strictEqual(triggerCount, 1, 'Interact handler must execute exactly ONCE');
  });

  test('TC-13: Ineligible or disabled interactable does not prompt or trigger', () => {
    testNpc.enabled = false;

    interactionManager.update(0.016, player, input);
    assert.strictEqual(interactionManager.activeInteractable, null, 'Disabled NPC must not be active');

    input.interactRequested = true;
    const result = interactionManager.triggerInteract(player);
    assert.strictEqual(result, false, 'Interaction trigger must fail when no active interactable');
  });

  test('TC-14: Dialogue advances across pages and closes cleanly, restoring normal state', () => {
    interactionManager.update(0.016, player, input);

    // Open dialogue
    input.interactRequested = true;
    interactionManager.update(0.016, player, input);
    assert.strictEqual(interactionManager.activeDialogue.currentIndex, 0);

    // Advance to page 2 (simulating elapsed debounce)
    interactionManager.lastInteractTime = 0;
    interactionManager.advanceDialogue();
    assert.strictEqual(interactionManager.activeDialogue.currentIndex, 1);
    assert.strictEqual(interactionManager.activeDialogue.lines[1], 'Grab a fishing rod and cast into the ripples.');

    // Advance beyond end -> should close dialogue
    interactionManager.advanceDialogue();
    assert.strictEqual(interactionManager.isInteracting(), false, 'Dialogue must close after last line');
    assert.strictEqual(interactionManager.activeDialogue, null);
  });
});
