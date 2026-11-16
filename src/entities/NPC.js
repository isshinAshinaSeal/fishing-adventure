// NPC: Non-Player Character entity with a high-detail shared avatar rig,
// facial animation, layered clothing, backpacks and dialogue interaction.

import { Interactable } from '../interaction/Interactable.js';
import { createAvatar } from './AvatarFactory.js';

export class NPC extends Interactable {
  constructor(options = {}) {
    super({
      id: options.id || 'npc_captain_finn',
      name: options.name || 'Captain Finn',
      type: 'npc',
      promptAction: options.promptAction || 'Talk to',
      interactionRange: options.interactionRange || 3.2,
      position: options.position || { x: 8, y: 0, z: -15 },
      ...options,
    });

    this.title = options.title || 'Harbor Master';
    this.dialogue = options.dialogue || [
      'Ahoy there, traveler! Welcome to Driftwood Island.',
      'The ocean around here is teeming with Sea Bass, Mackerel, and legendary Golden Trout.',
      'Take your fishing rod, walk up to the pier or coastline, and cast your line into the ripples.',
      'Remember: patience is an angler’s greatest virtue. Wait for the bite and reel in on time!',
    ];
    this.isPirate = Boolean(options.isPirate);
    this.isShopkeeper = Boolean(options.isShopkeeper);
    // Optional service/quest choices shown at the end of the conversation.
    this.dialogueChoices = Array.isArray(options.dialogueChoices) ? options.dialogueChoices : null;

    this.currentDialogueIndex = 0;
    this.facingAngle = options.facingAngle || 0.0;
    this.animTime = Math.random() * 10;
    this.walkAnimTime = 0;
    this.isWalking = false;
    this.blinkTimer = 1.8 + Math.random() * 3.6;
    this.blinkPhase = 0;

    this.avatar = createAvatar({
      ...options,
      id: this.id,
      name: this.name,
      isPirate: this.isPirate,
      isShopkeeper: this.isShopkeeper,
      backpackStyle: options.backpackStyle ?? (this.isPirate ? 'pirate' : this.isShopkeeper ? 'satchel' : 'expedition'),
      facialHair: options.facialHair ?? (options.beardColor ? 'beard' : undefined),
      apron: options.apron ?? this.isShopkeeper,
    });
    this.mesh = this.avatar.group;
    this.mesh.name = `NPC_${this.id}`;
    this.mesh.position.copy(this.position);
    this.mesh.rotation.y = this.facingAngle;

    this.torsoMesh = this.avatar.parts.torso;
    this.headMesh = this.avatar.parts.headGroup;
    this.eyeGroup = this.avatar.parts.eyeGroup;
    this.leftArm = this.avatar.parts.leftArm;
    this.rightArm = this.avatar.parts.rightArm;
    this.leftLeg = this.avatar.parts.leftLeg;
    this.rightLeg = this.avatar.parts.rightLeg;
    this.backpackMesh = this.avatar.parts.backpack;
  }

  /**
   * Animation loop: walk cycle, breathing, blink and local head tracking.
   */
  update(dt, playerPosition = null) {
    this.animTime += dt;

    if (this.isWalking) {
      this.walkAnimTime += dt * 7.5;
      const legSwing = Math.sin(this.walkAnimTime) * 0.45;
      const armSwing = Math.sin(this.walkAnimTime) * 0.35;
      if (this.leftLeg) this.leftLeg.rotation.x = legSwing;
      if (this.rightLeg) this.rightLeg.rotation.x = -legSwing;
      if (this.leftArm) this.leftArm.rotation.x = -armSwing;
      if (this.rightArm) this.rightArm.rotation.x = armSwing;
    } else {
      const settle = Math.max(0, 1.0 - dt * 8.0);
      if (this.leftLeg) this.leftLeg.rotation.x *= settle;
      if (this.rightLeg) this.rightLeg.rotation.x *= settle;
      if (this.leftArm) this.leftArm.rotation.x *= settle;
      if (this.rightArm) this.rightArm.rotation.x *= settle;
    }

    if (this.torsoMesh) {
      const breath = Math.sin(this.animTime * 2.2) * 0.018;
      const base = this.torsoMesh.userData.baseScale;
      if (base) {
        this.torsoMesh.scale.set(base.x * (1 + breath * 0.45), base.y * (1 + breath), base.z * (1 + breath * 0.45));
      }
    }

    if (this.eyeGroup) {
      this.blinkTimer -= dt;
      if (this.blinkPhase > 0) {
        this.blinkPhase -= dt;
        this.eyeGroup.visible = false;
        if (this.blinkPhase <= 0) this.eyeGroup.visible = true;
      } else if (this.blinkTimer <= 0) {
        this.blinkPhase = 0.11;
        this.blinkTimer = 1.8 + Math.random() * 4.2;
      }
    }

    if (playerPosition && this.headMesh) {
      const dist = this.getHorizontalDistanceTo(playerPosition);
      let targetAngle = 0;
      if (dist < 8.0) {
        const dx = playerPosition.x - this.position.x;
        const dz = playerPosition.z - this.position.z;
        targetAngle = Math.atan2(dx, dz) - this.facingAngle;
        targetAngle = Math.max(-0.8, Math.min(0.8, targetAngle));
      }
      this.headMesh.rotation.y += (targetAngle - this.headMesh.rotation.y) * Math.min(1.0, 5.0 * dt);
      this.headMesh.rotation.x = playerPosition ? Math.max(-0.12, Math.min(0.12, (this.position.y + 1.8 - playerPosition.y) * 0.02)) : 0;
    }
  }

  getDialogue() {
    return {
      npcId: this.id,
      speaker: this.name,
      title: this.title,
      lines: this.dialogue,
      choices: this.dialogueChoices,
    };
  }

  /**
   * Interaction trigger: explicit merchant/service handlers win; ordinary
   * villagers fall back to their dialogue sequence.
   */
  onInteract(player, context) {
    if (typeof this.onInteractHandler === 'function') {
      return this.onInteractHandler(player, context);
    }
    if (context && typeof context.openDialogue === 'function') {
      context.openDialogue(this, this.getDialogue());
      return true;
    }
    return super.onInteract(player, context);
  }
}

export default NPC;
