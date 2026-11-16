// Mount: Rideable land creature with procedural 3D body, terrain-aware movement,
// stamina, sprinting, jumping, and rider synchronization.

import * as THREE from 'three';
import { getMountStatMultiplier, getMountLevelForXp } from './MountData.js';

export class Mount {
  constructor(options = {}) {
    this.definition = options.definition || null;
    if (!this.definition) throw new Error('Mount requires a definition');

    this.id = this.definition.id;
    this.name = options.name || this.definition.name;
    this.position = new THREE.Vector3(
      options.position ? options.position.x : 0,
      options.position ? options.position.y : 0,
      options.position ? options.position.z : 0
    );
    this.waterLevel = options.waterLevel !== undefined ? options.waterLevel : 0.0;

    this.level = options.level || 1;
    this.xp = options.xp || 0;
    this.stamina = options.stamina !== undefined ? options.stamina : this.definition.staminaMax;
    this.exhausted = false;

    this.speed = 0;
    this.verticalVelocity = 0;
    this.isGrounded = true;
    this.facingAngle = options.facingAngle || 0;
    this.animTime = 0;

    this.isMounted = false;
    this.rider = null;
    this.distanceTraveled = 0;

    // Event hooks
    this.onLevelUp = null;

    this.mesh = this._createMesh();
    this.mesh.position.copy(this.position);
  }

  _createMesh() {
    const def = this.definition;
    const group = new THREE.Group();
    group.name = `Mount_${this.id}`;

    const bodyMat = new THREE.MeshLambertMaterial({ color: def.bodyColor });
    const maneMat = new THREE.MeshLambertMaterial({ color: def.maneColor });
    const hoofMat = new THREE.MeshLambertMaterial({ color: 0x2a211b });

    // Torso
    const torso = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.72, 1.65), bodyMat);
    torso.position.y = 1.0;
    torso.castShadow = true;
    group.add(torso);

    // Neck and head
    const neck = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.75, 0.42), bodyMat);
    neck.position.set(0, 1.4, 0.72);
    neck.rotation.x = -0.35;
    neck.castShadow = true;
    group.add(neck);

    const head = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.4, 0.68), bodyMat);
    head.position.set(0, 1.72, 1.02);
    head.castShadow = true;
    group.add(head);

    // Snout / muzzle
    const snout = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.24, 0.32), maneMat);
    snout.position.set(0, 1.64, 1.38);
    group.add(snout);

    // Ears / horns
    const earGeom = new THREE.ConeGeometry(0.09, 0.3, 4);
    const leftEar = new THREE.Mesh(earGeom, maneMat);
    leftEar.position.set(-0.14, 1.98, 0.96);
    group.add(leftEar);
    const rightEar = new THREE.Mesh(earGeom, maneMat);
    rightEar.position.set(0.14, 1.98, 0.96);
    group.add(rightEar);

    if (def.id === 'mount_crystal_deer' || def.id === 'mount_lizard') {
      const antlerMat = new THREE.MeshBasicMaterial({ color: def.aura || 0xccffff });
      for (const side of [-1, 1]) {
        const antler = new THREE.Mesh(new THREE.ConeGeometry(0.05, 0.55, 5), antlerMat);
        antler.position.set(side * 0.13, 2.2, 0.9);
        antler.rotation.z = side * 0.35;
        group.add(antler);
      }
    }

    // Saddle
    const saddle = new THREE.Mesh(
      new THREE.BoxGeometry(0.72, 0.16, 0.65),
      new THREE.MeshLambertMaterial({ color: 0x53361c })
    );
    saddle.position.set(0, 1.4, -0.1);
    group.add(saddle);
    this.saddleOffset = new THREE.Vector3(0, 1.55, -0.1);

    // Four legs with pivots for walk animation
    this.legs = [];
    const legPositions = [
      [-0.32, 0.66, 0.62],
      [0.32, 0.66, 0.62],
      [-0.32, 0.66, -0.62],
      [0.32, 0.66, -0.62],
    ];
    for (const [x, y, z] of legPositions) {
      const pivot = new THREE.Group();
      pivot.position.set(x, y, z);
      const leg = new THREE.Mesh(new THREE.BoxGeometry(0.17, 0.75, 0.19), bodyMat);
      leg.position.y = -0.37;
      leg.castShadow = true;
      pivot.add(leg);
      const hoof = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.14, 0.24), hoofMat);
      hoof.position.set(0, -0.74, 0.02);
      pivot.add(hoof);
      group.add(pivot);
      this.legs.push(pivot);
    }

    // Tail
    const tail = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.5, 0.12), maneMat);
    tail.position.set(0, 1.15, -0.9);
    tail.rotation.x = -0.5;
    group.add(tail);
    this.tail = tail;

    if (def.aura) {
      const aura = new THREE.Mesh(
        new THREE.SphereGeometry(1.25, 12, 8),
        new THREE.MeshBasicMaterial({ color: def.aura, transparent: true, opacity: 0.12 })
      );
      aura.position.y = 1.05;
      aura.scale.set(1, 0.55, 1.45);
      group.add(aura);
      this.auraMesh = aura;
    }

    const scale = def.scale || 1.0;
    group.scale.setScalar(scale);
    return group;
  }

  mount(player) {
    if (this.isMounted && this.rider !== player) {
      return { success: false, reason: 'Mount is already in use' };
    }
    this.isMounted = true;
    this.rider = player;
    if (player) {
      player.isMountedMount = true;
      player.activeMount = this;
      this._syncRider();
    }
    return { success: true, mount: this };
  }

  dismount(player, terrain = null, exitPos = null) {
    if (!this.isMounted) {
      return { success: false, reason: 'Not currently mounted' };
    }
    const rider = player || this.rider;
    this.isMounted = false;
    this.speed = 0;
    this.verticalVelocity = 0;

    if (rider) {
      let target = exitPos;
      if (!target && terrain) {
        // Step off to the mount's right side and clamp onto solid ground.
        const sideX = this.position.x + Math.cos(this.facingAngle) * 1.4;
        const sideZ = this.position.z - Math.sin(this.facingAngle) * 1.4;
        const ground = terrain.sampleHeight(sideX, sideZ);
        target = { x: sideX, y: Math.max(ground, this.waterLevel) + 0.1, z: sideZ };
      }
      if (target) {
        rider.position.set(target.x, target.y, target.z);
        rider.isGrounded = true;
      }
      rider.isMountedMount = false;
      rider.activeMount = null;
      rider.velocity.set(0, 0, 0);
      rider.horizontalVelocity.set(0, 0);
    }

    this.rider = null;
    return { success: true };
  }

  getBiome(terrain, x, z) {
    const h = terrain ? terrain.sampleHeight(x, z) : 1;
    if (h < 2.2) return 'sand';
    if (h < 18) return 'grass';
    return 'rock';
  }

  /**
   * Advances the mount and its rider. Requires a mounted rider.
   */
  update(dt, input, cameraRig, terrain, options = {}) {
    if (!dt || dt <= 0) return;
    dt = Math.min(dt, 0.1);
    this.animTime += dt;

    const rider = this.rider;
    const levelMul = getMountStatMultiplier(this.level);
    const staminaMax = this.definition.staminaMax + (this.level >= 10 ? 30 : 0);

    if (!this.isMounted) {
      this.mesh.position.copy(this.position);
      this.mesh.rotation.y = this.facingAngle;
      this._animate(dt, 0);
      return;
    }

    let moveX = 0;
    let moveZ = 0;
    let moveMag = 0;
    let wantsSprint = false;

    if (input) {
      const move = input.getMovementVector();
      moveMag = move.magnitude;
      wantsSprint = input.isSprinting();
      let forward;
      let right;
      if (cameraRig && typeof cameraRig.getHorizontalForward === 'function') {
        forward = cameraRig.getHorizontalForward();
        right = cameraRig.getHorizontalRight();
      } else {
        forward = new THREE.Vector3(Math.sin(this.facingAngle), 0, Math.cos(this.facingAngle));
        right = new THREE.Vector3(Math.cos(this.facingAngle), 0, -Math.sin(this.facingAngle));
      }
      moveX = right.x * move.x + forward.x * move.z;
      moveZ = right.z * move.x + forward.z * move.z;
      const len = Math.hypot(moveX, moveZ);
      if (len > 0.001) {
        moveX /= len;
        moveZ /= len;
      } else {
        moveMag = 0;
      }
    }

    // Stamina gating: sprint requires stamina and a short recovery buffer.
    if (this.stamina <= 0) this.exhausted = true;
    if (this.exhausted && this.stamina >= staminaMax * 0.35) this.exhausted = false;
    const canSprint = wantsSprint && !this.exhausted && moveMag > 0;

    if (canSprint) {
      this.stamina = Math.max(0, this.stamina - this.definition.staminaDrain * dt);
    } else {
      this.stamina = Math.min(staminaMax, this.stamina + this.definition.staminaRegen * dt);
    }

    const biome = this.getBiome(terrain, this.position.x, this.position.z);
    const terrainMul = this.definition.terrains.includes(biome) ? 1.0 : 0.5;
    const baseSpeed = canSprint ? this.definition.sprintSpeed : this.definition.baseSpeed;
    const targetSpeed = moveMag * baseSpeed * levelMul * terrainMul;

    // Smooth acceleration toward target speed.
    const accel = moveMag > 0 ? 10 : 14;
    this.speed += (targetSpeed - this.speed) * Math.min(1, accel * dt);

    if (moveMag > 0.001) {
      const targetFacing = Math.atan2(moveX, moveZ);
      let diff = (targetFacing - this.facingAngle) % (Math.PI * 2);
      if (diff > Math.PI) diff -= Math.PI * 2;
      if (diff < -Math.PI) diff += Math.PI * 2;
      this.facingAngle += diff * Math.min(1, 9 * dt);
    }

    // Horizontal displacement with water and steep-slope blocking.
    if (Math.abs(this.speed) > 0.01 && terrain) {
      const dirX = Math.sin(this.facingAngle);
      const dirZ = Math.cos(this.facingAngle);
      const step = this.speed * dt;
      const nextX = this.position.x + dirX * step;
      const nextZ = this.position.z + dirZ * step;
      const currentGround = terrain.sampleHeight(this.position.x, this.position.z);
      const nextGround = terrain.sampleHeight(nextX, nextZ);
      const runoff = Math.max(0.001, Math.abs(step));
      const slope = (nextGround - currentGround) / runoff;

      const isWater = nextGround < this.waterLevel + 0.05;
      const tooSteep = slope > 1.15 && this.isGrounded;

      if (!isWater && !tooSteep) {
        this.position.x = nextX;
        this.position.z = nextZ;
        this.distanceTraveled += Math.abs(step);
        this.addXp(Math.abs(step) * (canSprint ? 2.2 : 1.4));
      } else {
        this.speed *= 0.25;
      }
    }

    // Jump and gravity.
    let groundH = terrain ? terrain.sampleHeight(this.position.x, this.position.z) : this.position.y;
    if (input && input.consumeJump && input.consumeJump() && this.isGrounded) {
      this.verticalVelocity = this.definition.jumpForce;
      this.isGrounded = false;
    }
    if (!this.isGrounded) {
      this.verticalVelocity -= 20 * dt;
      this.position.y += this.verticalVelocity * dt;
      if (this.position.y <= groundH) {
        this.position.y = groundH;
        this.verticalVelocity = 0;
        this.isGrounded = true;
      }
    } else {
      this.position.y = groundH;
    }

    // Keep the mount out of deep water entirely.
    if (groundH < this.waterLevel) {
      this.position.y = this.waterLevel;
    }

    // Rider sync
    if (rider) {
      this._syncRider();
      rider.facingAngle = this.facingAngle;
      rider.velocity.set(0, 0, 0);
      rider.horizontalVelocity.set(0, 0);
      rider.isGrounded = this.isGrounded;
      rider.isMoving = moveMag > 0.01;
      rider.isSprinting = canSprint;
    }

    this.mesh.position.copy(this.position);
    this.mesh.rotation.y = this.facingAngle;
    this._animate(dt, this.speed);
  }

  _syncRider() {
    if (!this.rider) return;
    const seat = this.saddleOffset;
    const s = this.definition.scale || 1.0;
    this.rider.position.set(
      this.position.x - Math.sin(this.facingAngle) * seat.z * s,
      this.position.y + seat.y * s,
      this.position.z - Math.cos(this.facingAngle) * seat.z * s
    );
  }

  _animate(dt, speed) {
    if (!this.legs) return;
    const isMoving = Math.abs(speed) > 0.2;
    const freq = 6.0 + Math.abs(speed) * 0.5;
    const phase = this.animTime * freq;
    const amplitude = isMoving ? 0.55 : 0.03;

    for (let i = 0; i < this.legs.length; i++) {
      const offset = i % 2 === 0 ? 0 : Math.PI;
      this.legs[i].rotation.x = Math.sin(phase + offset) * amplitude;
    }
    if (this.tail) {
      this.tail.rotation.z = Math.sin(this.animTime * 2.4) * 0.18;
    }
    if (this.auraMesh) {
      this.auraMesh.material.opacity = 0.08 + Math.sin(this.animTime * 3) * 0.04;
    }
  }

  addXp(amount) {
    if (!amount || amount <= 0) return this.level;
    this.xp += amount;
    const newLevel = getMountLevelForXp(this.xp);
    if (newLevel > this.level) {
      this.level = newLevel;
      if (typeof this.onLevelUp === 'function') {
        this.onLevelUp(this, newLevel);
      }
    }
    return this.level;
  }

  getStaminaPercent() {
    const max = this.definition.staminaMax + (this.level >= 10 ? 30 : 0);
    return Math.round((this.stamina / max) * 100);
  }

  getState() {
    return {
      id: this.id,
      name: this.name,
      level: this.level,
      xp: Math.round(this.xp),
      stamina: Math.round(this.stamina),
      staminaPercent: this.getStaminaPercent(),
      speed: Number(this.speed.toFixed(2)),
      isMounted: this.isMounted,
      position: { x: this.position.x, y: this.position.y, z: this.position.z },
    };
  }

  serialize() {
    return {
      id: this.id,
      name: this.name,
      level: this.level,
      xp: this.xp,
      stamina: this.stamina,
      position: { x: this.position.x, y: this.position.y, z: this.position.z },
      facingAngle: this.facingAngle,
      distanceTraveled: this.distanceTraveled,
    };
  }
}

export default Mount;
