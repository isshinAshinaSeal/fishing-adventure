// PlayerController: Kinematic 3D third-person character controller.
// Handles 8-directional movement, walk/run transitions, jumping, and terrain clamping.

import * as THREE from 'three';
import { Config } from '../config.js';
import { FishingRod } from '../fishing/FishingRod.js';
import { InventoryManager } from '../inventory/InventoryManager.js';
import { EconomyManager } from '../economy/EconomyManager.js';
import { StorageManager } from '../storage/StorageManager.js';
import { ProgressionManager } from '../progression/ProgressionManager.js';
import { createAvatar } from './AvatarFactory.js';

export class PlayerController {
  constructor(config = Config.player) {
    this.config = config;

    // Kinematic state
    this.position = new THREE.Vector3(
      config.spawnPosition.x,
      config.spawnPosition.y,
      config.spawnPosition.z
    );
    this.velocity = new THREE.Vector3(0, 0, 0);
    this.horizontalVelocity = new THREE.Vector2(0, 0);
    this.facingAngle = 0.0; // Radians
    this.targetFacingAngle = 0.0;

    // Movement status flags
    this.isGrounded = false;
    this.isMoving = false;
    this.isSprinting = false;
    this.airTime = 0.0;
    this.animTime = 0.0;
    this.maxHealth = 100;
    this.health = 100;
    this.maxStamina = 100;
    this.stamina = 100;
    this.maxOxygen = 60;
    this.oxygen = 60;
    this.warmth = 100;
    this.speedMultiplier = 1.0;
    this.appearance = {
      skinColor: 0xffccaa,
      shirtColor: 0x3377aa,
      pantsColor: 0x334455,
      hatColor: 0xddbb77,
      bandColor: 0xaa3333,
      faceStyle: 'oval',
      hairStyle: 'short',
      facialHair: 'none',
      backpackStyle: 'expedition',
      hatStyle: 'straw',
    };

    // Equipment, Inventory & Fishing State
    this.isRodEquipped = false;
    this.isMountedBoat = false;
    this.activeBoat = null;
    this.isMountedMount = false;
    this.activeMount = null;
    this.fishingState = 'IDLE'; // 'IDLE' | 'CASTING' | 'WAITING' | 'REELING'
    this.rod = new FishingRod();
    this.inventory = new InventoryManager(Config.inventory);
    this.economy = new EconomyManager(Config.economy);
    this.storage = new StorageManager(Config.storage);
    this.progression = new ProgressionManager();

    // Visual Mesh Hierarchy (created if THREE.Group is available)
    this.mesh = this._createDetailedCharacterMesh();
  }

  /**
   * Applies a partial appearance palette and keeps the live avatar in sync.
   */
  setAppearance(patch = {}) {
    const colorKeys = ['skinColor', 'shirtColor', 'pantsColor', 'hatColor', 'bandColor'];
    const styleKeys = ['faceStyle', 'hairStyle', 'facialHair', 'backpackStyle', 'hatStyle'];
    let structuralChange = false;
    for (const key of colorKeys) {
      if (patch[key] === undefined) continue;
      const value = Number(patch[key]);
      if (Number.isFinite(value)) this.appearance[key] = value;
    }
    for (const key of styleKeys) {
      if (patch[key] === undefined || typeof patch[key] !== 'string') continue;
      if (this.appearance[key] !== patch[key]) {
        this.appearance[key] = patch[key];
        structuralChange = true;
      }
    }
    if (structuralChange && this.mesh) {
      this._rebuildAvatar();
    } else {
      this._syncAvatarColors();
    }
    return this.getAppearance();
  }

  _syncAvatarColors() {
    if (!this.avatar || !this.avatar.materials) return;
    const mats = this.avatar.materials;
    const colors = this.appearance;
    const pairs = [
      ['skin', colors.skinColor], ['shirt', colors.shirtColor], ['pants', colors.pantsColor],
      ['hat', colors.hatColor], ['band', colors.bandColor],
    ];
    for (const [key, value] of pairs) {
      if (mats[key]) mats[key].color.setHex(value);
    }
    if (mats.skinShadow) mats.skinShadow.color.setHex(colors.skinColor).multiplyScalar(0.82);
    if (mats.shirtLight) mats.shirtLight.color.setHex(colors.shirtColor).multiplyScalar(1.12);
    if (mats.shirtDark) mats.shirtDark.color.setHex(colors.shirtColor).multiplyScalar(0.68);
    if (mats.hatDark) mats.hatDark.color.setHex(colors.hatColor).multiplyScalar(0.62);
    this.skinMaterial = mats.skin || this.skinMaterial;
    this.shirtMaterial = mats.shirt || this.shirtMaterial;
    this.pantsMaterial = mats.pants || this.pantsMaterial;
    this.hatMaterial = mats.hat || this.hatMaterial;
    this.hatBandMaterial = mats.band || this.hatBandMaterial;
  }

  _applyAvatar(avatar) {
    this.avatar = avatar;
    this.torsoMesh = avatar.parts.torso;
    this.headMesh = avatar.parts.headGroup;
    this.leftArm = avatar.parts.leftArm;
    this.rightArm = avatar.parts.rightArm;
    this.leftLeg = avatar.parts.leftLeg;
    this.rightLeg = avatar.parts.rightLeg;
    this.skinMaterial = avatar.materials.skin;
    this.shirtMaterial = avatar.materials.shirt;
    this.pantsMaterial = avatar.materials.pants;
    this.hatMaterial = avatar.materials.hat;
    this.hatBandMaterial = avatar.materials.band;
  }

  _rebuildAvatar() {
    if (!this.mesh) return;
    const wasRodEquipped = this.isRodEquipped;
    if (this.rod && this.rod.mesh && this.rod.mesh.parent) {
      this.rod.mesh.parent.remove(this.rod.mesh);
    }
    while (this.mesh.children.length) this.mesh.remove(this.mesh.children[0]);
    const avatar = createAvatar({
      ...this.appearance,
      id: 'player_angler',
      name: 'PlayerAngler',
      isPlayer: true,
    });
    this.mesh.add(avatar.group);
    this._applyAvatar(avatar);
    if (wasRodEquipped) this.equipRod();
  }

  getAppearance() {
    return { ...this.appearance };
  }

  equipRod() {
    this.isRodEquipped = true;
    if (this.rod && this.rod.mesh && this.rightArm) {
      this.rod.mesh.position.set(0, -0.58, 0.1);
      this.rod.mesh.rotation.set(0.6, 0, 0);
      if (this.rod.mesh.parent !== this.rightArm) {
        this.rightArm.add(this.rod.mesh);
      }
    }
  }

  unequipRod() {
    this.isRodEquipped = false;
    if (this.rod && this.rod.mesh && this.rod.mesh.parent) {
      this.rod.mesh.parent.remove(this.rod.mesh);
    }
  }

  toggleRod() {
    if (this.isRodEquipped) {
      this.unequipRod();
    } else {
      this.equipRod();
    }
    return this.isRodEquipped;
  }

  /**
   * Constructs the detailed player rig with a real face, hair, layered clothes,
   * belt tools and an equipment backpack.
   */
  _createDetailedCharacterMesh() {
    const group = new THREE.Group();
    group.name = 'PlayerCharacter';
    const avatar = createAvatar({
      ...this.appearance,
      id: 'player_angler',
      name: 'PlayerAngler',
      isPlayer: true,
    });
    group.add(avatar.group);
    this._applyAvatar(avatar);
    group.position.copy(this.position);
    return group;
  }

  /**
   * Legacy stylized model retained as a fallback reference for older saves and
   * external tooling. The live player uses `_createDetailedCharacterMesh`.
   */
  _createStylizedCharacterMesh() {
    const group = new THREE.Group();
    group.name = 'PlayerCharacter';

    // Materials
    const skinMat = new THREE.MeshLambertMaterial({ color: this.appearance.skinColor });
    const shirtMat = new THREE.MeshLambertMaterial({ color: this.appearance.shirtColor }); // Fisher shirt
    const pantsMat = new THREE.MeshLambertMaterial({ color: this.appearance.pantsColor }); // Trousers
    const bootMat = new THREE.MeshLambertMaterial({ color: 0x221c18 });
    const hatMat = new THREE.MeshLambertMaterial({ color: this.appearance.hatColor });
    const hatBandMat = new THREE.MeshLambertMaterial({ color: this.appearance.bandColor });
    this.skinMaterial = skinMat;
    this.pantsMaterial = pantsMat;
    this.hatMaterial = hatMat;
    this.hatBandMaterial = hatBandMat;

    // Torso
    const torsoGeom = new THREE.BoxGeometry(0.65, 0.75, 0.4);
    const torso = new THREE.Mesh(torsoGeom, shirtMat);
    torso.position.y = 1.05;
    torso.castShadow = true;
    group.add(torso);
    this.torsoMesh = torso;
    this.shirtMaterial = shirtMat;

    // Head
    const headGeom = new THREE.BoxGeometry(0.42, 0.42, 0.4);
    const head = new THREE.Mesh(headGeom, skinMat);
    head.position.y = 1.62;
    head.castShadow = true;
    group.add(head);

    // Straw Fishing Hat (Crown + Brim)
    const brimGeom = new THREE.CylinderGeometry(0.55, 0.58, 0.06, 12);
    const brim = new THREE.Mesh(brimGeom, hatMat);
    brim.position.y = 1.84;
    group.add(brim);

    const crownGeom = new THREE.CylinderGeometry(0.28, 0.36, 0.28, 10);
    const crown = new THREE.Mesh(crownGeom, hatMat);
    crown.position.y = 2.0;
    group.add(crown);

    const bandGeom = new THREE.CylinderGeometry(0.365, 0.37, 0.08, 10);
    const band = new THREE.Mesh(bandGeom, hatBandMat);
    band.position.y = 1.9;
    group.add(band);

    // Left & Right Arms (Pivoted for procedural swinging)
    const armGeom = new THREE.BoxGeometry(0.2, 0.65, 0.2);
    armGeom.translate(0, -0.28, 0); // pivot at shoulder

    const leftArm = new THREE.Mesh(armGeom, shirtMat);
    leftArm.position.set(-0.45, 1.35, 0);
    leftArm.castShadow = true;
    group.add(leftArm);
    this.leftArm = leftArm;

    const rightArm = new THREE.Mesh(armGeom, shirtMat);
    rightArm.position.set(0.45, 1.35, 0);
    rightArm.castShadow = true;
    group.add(rightArm);
    this.rightArm = rightArm;

    // Left & Right Legs
    const legGeom = new THREE.BoxGeometry(0.24, 0.7, 0.24);
    legGeom.translate(0, -0.35, 0); // pivot at hip

    const leftLeg = new THREE.Mesh(legGeom, pantsMat);
    leftLeg.position.set(-0.2, 0.7, 0);
    leftLeg.castShadow = true;
    group.add(leftLeg);
    this.leftLeg = leftLeg;

    const rightLeg = new THREE.Mesh(legGeom, pantsMat);
    rightLeg.position.set(0.2, 0.7, 0);
    rightLeg.castShadow = true;
    group.add(rightLeg);
    this.rightLeg = rightLeg;

    // Small Boots
    const bootGeom = new THREE.BoxGeometry(0.26, 0.2, 0.34);
    const leftBoot = new THREE.Mesh(bootGeom, bootMat);
    leftBoot.position.set(0, -0.62, 0.04);
    leftLeg.add(leftBoot);

    const rightBoot = new THREE.Mesh(bootGeom, bootMat);
    rightBoot.position.set(0, -0.62, 0.04);
    rightLeg.add(rightBoot);

    group.position.copy(this.position);
    return group;
  }

  /**
   * Main kinematic update loop.
   * @param {number} dt - Delta time in seconds.
   * @param {InputManager} input - Action mapped input provider.
   * @param {ThirdPersonCamera} camera - Camera reference for heading-relative movement.
   * @param {TerrainCollider} terrainCollider - Analytical terrain collision solver.
   */
  update(dt, input, camera, terrainCollider) {
    if (!dt || dt <= 0) return;
    dt = Math.min(dt, 0.1); // Safety clamp against frame spikes

    // 0. Process Equip / Holster Rod Toggle
    if (input && input.consumeEquipToggle()) {
      this.toggleRod();
    }

    // 1. Gather movement input relative to camera horizontal orientation
    const moveInput = input ? input.getMovementVector() : { x: 0, z: 0, magnitude: 0 };
    this.isSprinting = input ? input.isSprinting() : false;

    const canSprint = this.isSprinting && this.stamina > 0;
    const targetSpeed = (canSprint ? this.config.runSpeed : this.config.walkSpeed) * this.speedMultiplier;
    let targetVelX = 0;
    let targetVelZ = 0;

    if (moveInput.magnitude > 0.001) {
      this.isMoving = true;

      // Calculate camera-relative movement vectors
      let camForward = camera ? camera.getHorizontalForward() : new THREE.Vector3(0, 0, -1);
      let camRight = camera ? camera.getHorizontalRight() : new THREE.Vector3(1, 0, 0);

      // Desired movement direction
      const moveDirX = camRight.x * moveInput.x + camForward.x * moveInput.z;
      const moveDirZ = camRight.z * moveInput.x + camForward.z * moveInput.z;
      const moveDirLen = Math.hypot(moveDirX, moveDirZ);

      if (moveDirLen > 0.001) {
        const normDirX = moveDirX / moveDirLen;
        const normDirZ = moveDirZ / moveDirLen;

        targetVelX = normDirX * targetSpeed;
        targetVelZ = normDirZ * targetSpeed;

        // Target rotation facing movement direction
        this.targetFacingAngle = Math.atan2(normDirX, normDirZ);
      }
    } else {
      this.isMoving = false;
    }

    // 2. Horizontal acceleration & ground friction
    const accelRate = this.isMoving ? this.config.acceleration : this.config.friction;
    this.horizontalVelocity.x += (targetVelX - this.horizontalVelocity.x) * Math.min(1.0, accelRate * dt);
    this.horizontalVelocity.y += (targetVelZ - this.horizontalVelocity.y) * Math.min(1.0, accelRate * dt);

    // Sprint stamina: sprinting drains, resting regenerates. Low stamina disables sprint.
    if (this.isMoving && canSprint) {
      this.stamina = Math.max(0, this.stamina - 18 * dt);
    } else {
      this.stamina = Math.min(this.maxStamina, this.stamina + 12 * dt);
    }

    this.velocity.x = this.horizontalVelocity.x;
    this.velocity.z = this.horizontalVelocity.y;

    // 3. Smooth Character Rotation (Shortest Angle Lerp)
    let angleDiff = (this.targetFacingAngle - this.facingAngle) % (Math.PI * 2);
    if (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
    if (angleDiff < -Math.PI) angleDiff += Math.PI * 2;
    this.facingAngle += angleDiff * Math.min(1.0, this.config.turnSpeed * dt);

    // 4. Jump & Vertical Gravity Integration
    const wantsJump = input ? input.consumeJump() : false;
    if (wantsJump && this.isGrounded) {
      this.velocity.y = this.config.jumpForce;
      this.isGrounded = false;
      this.airTime = 0.0;
    } else if (!this.isGrounded) {
      this.velocity.y -= this.config.gravity * dt;
      this.airTime += dt;
    }

    // 5. Integrate Position
    this.position.x += this.velocity.x * dt;
    this.position.y += this.velocity.y * dt;
    this.position.z += this.velocity.z * dt;

    // 6. Terrain Collision & Floor Clamping
    if (terrainCollider) {
      const isMovingUp = this.velocity.y > 0.001;
      const collision = terrainCollider.resolveCollision(this.position, 0.0, isMovingUp);
      if (collision.grounded) {
        if (!this.isGrounded && this.velocity.y <= 0) {
          this.isGrounded = true;
          this.velocity.y = 0;
          this.airTime = 0;
        }
      } else {
        this.isGrounded = false;
      }
    }

    // 7. Update Visual Mesh and Procedural Animation
    if (this.mesh) {
      this.mesh.position.copy(this.position);
      this.mesh.rotation.y = this.facingAngle;

      this._updateProceduralAnimation(dt);
    }
  }

  /**
   * Procedural arm and leg swing for walking/running.
   */
  _updateProceduralAnimation(dt) {
    if (!this.leftLeg || !this.rightLeg) return;

    // Custom fishing pose overrides
    if (this.fishingState === 'CASTING' || this.fishingState === 'WAITING' || this.fishingState === 'BITING') {
      if (this.rightArm) this.rightArm.rotation.x = -0.75;
      if (this.leftArm) this.leftArm.rotation.x = -0.42;
      this.leftLeg.rotation.x *= 0.8;
      this.rightLeg.rotation.x *= 0.8;
      return;
    } else if (this.fishingState === 'REELING') {
      this.animTime += dt * 16.0;
      if (this.rightArm) this.rightArm.rotation.x = -1.15;
      if (this.leftArm) this.leftArm.rotation.x = Math.sin(this.animTime) * 0.35 - 0.55;
      this.leftLeg.rotation.x *= 0.8;
      this.rightLeg.rotation.x *= 0.8;
      return;
    }

    const currentSpeed = Math.hypot(this.velocity.x, this.velocity.z);

    if (this.isGrounded && currentSpeed > 0.2) {
      const animFreq = this.isSprinting ? 14.0 : 9.0;
      this.animTime += dt * animFreq;
      const swingAngle = Math.sin(this.animTime) * (this.isSprinting ? 0.75 : 0.45);

      this.leftLeg.rotation.x = swingAngle;
      this.rightLeg.rotation.x = -swingAngle;

      if (this.leftArm && this.rightArm) {
        this.leftArm.rotation.x = -swingAngle * 0.8;
        this.rightArm.rotation.x = swingAngle * 0.8;
      }
    } else {
      // Smooth return to idle rest pose
      this.leftLeg.rotation.x *= 0.8;
      this.rightLeg.rotation.x *= 0.8;
      if (this.leftArm) this.leftArm.rotation.x *= 0.8;
      if (this.rightArm) this.rightArm.rotation.x *= 0.8;
    }
  }

  /**
   * Resets the player back to spawn coordinates and clears velocity.
   */
  /**
   * Repositions the player without touching inventory, economy, progression or
   * storage. Used by ferries and fast travel; `reset()` remains the full
   * restart path that intentionally clears run state.
   */
  teleport(position) {
    this.position.set(position.x, position.y, position.z);
    this.velocity.set(0, 0, 0);
    this.horizontalVelocity.set(0, 0);
    this.isGrounded = true;
    this.isMoving = false;
    this.isSprinting = false;
    this.airTime = 0.0;
    if (this.mesh) {
      this.mesh.position.copy(this.position);
    }
  }

  reset(spawnPos = this.config.spawnPosition) {
    this.position.set(spawnPos.x, spawnPos.y, spawnPos.z);
    this.velocity.set(0, 0, 0);
    this.horizontalVelocity.set(0, 0);
    this.isGrounded = false;
    this.isMoving = false;
    this.isSprinting = false;
    this.facingAngle = 0.0;
    this.targetFacingAngle = 0.0;
    this.airTime = 0.0;
    this.animTime = 0.0;
    this.fishingState = 'IDLE';
    this.isMountedBoat = false;
    this.activeBoat = null;
    this.isMountedMount = false;
    this.activeMount = null;
    if (this.inventory) {
      this.inventory.reset();
    }
    if (this.economy) {
      this.economy.reset();
    }
    if (this.storage) {
      this.storage.reset();
    }
    if (this.progression) {
      this.progression.reset();
    }

    if (this.mesh) {
      this.mesh.position.copy(this.position);
      this.mesh.rotation.y = 0;
    }
  }

  getState() {
    return {
      position: this.position.clone(),
      velocity: this.velocity.clone(),
      speed: Math.hypot(this.velocity.x, this.velocity.z),
      isGrounded: this.isGrounded,
      isMoving: this.isMoving,
      isSprinting: this.isSprinting,
      isRodEquipped: this.isRodEquipped,
      fishingState: this.fishingState,
      inventory: this.inventory ? this.inventory.getState() : null,
      coins: this.economy ? this.economy.getCoins() : 0,
      storage: this.storage ? this.storage.getState() : null,
      level: this.progression ? this.progression.getLevel() : 1,
      xp: this.progression ? this.progression.getXp() : 0,
    };
  }

  restoreStamina(amount) {
    this.stamina = Math.min(this.maxStamina, this.stamina + Number(amount || 0));
    return this.stamina;
  }

  takeDamage(amount) {
    this.health = Math.max(0, this.health - Math.max(0, Number(amount) || 0));
    return this.health;
  }

  restoreHealth(amount) {
    this.health = Math.min(this.maxHealth, this.health + Math.max(0, Number(amount) || 0));
    return this.health;
  }

  serialize() {
    return {
      position: { x: this.position.x, y: this.position.y, z: this.position.z },
      facingAngle: this.facingAngle,
      health: this.health,
      stamina: this.stamina,
      isRodEquipped: this.isRodEquipped,
      appearance: this.getAppearance(),
      rod: this.rod ? {
        id: this.rod.id,
        name: this.rod.name,
        level: this.rod.level,
        reelSpeed: this.rod.reelSpeed,
        luckBonus: this.rod.luckBonus,
      } : null,
      inventory: this.inventory ? this.inventory.serialize() : null,
      economy: this.economy ? this.economy.serialize() : null,
      storage: this.storage ? this.storage.serialize() : null,
      progression: this.progression ? this.progression.serialize() : null,
    };
  }

  deserialize(data) {
    if (!data) return;
    if (data.position) {
      this.position.set(data.position.x, data.position.y, data.position.z);
    }
    if (data.facingAngle !== undefined) this.facingAngle = Number(data.facingAngle);
    if (data.appearance) this.setAppearance(data.appearance);
    if (data.health !== undefined) this.health = Math.max(0, Math.min(this.maxHealth, Number(data.health)));
    if (data.stamina !== undefined) this.stamina = Math.max(0, Math.min(this.maxStamina, Number(data.stamina)));
    if (data.isRodEquipped) {
      this.equipRod();
    } else {
      this.unequipRod();
    }
    if (data.rod && this.rod) {
      this.rod.id = data.rod.id || this.rod.id;
      this.rod.name = data.rod.name || this.rod.name;
      this.rod.level = data.rod.level || this.rod.level;
      this.rod.reelSpeed = data.rod.reelSpeed || this.rod.reelSpeed;
      this.rod.luckBonus = data.rod.luckBonus || this.rod.luckBonus;
    }
    if (data.inventory && this.inventory) this.inventory.deserialize(data.inventory);
    if (data.economy && this.economy) this.economy.deserialize(data.economy);
    if (data.storage && this.storage) this.storage.deserialize(data.storage);
    if (data.progression && this.progression) this.progression.deserialize(data.progression);
  }
}

export default PlayerController;
