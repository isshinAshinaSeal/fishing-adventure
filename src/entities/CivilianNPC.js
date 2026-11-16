// CivilianNPC: Autonomous wandering villager/angler populating the island civilization.
// Traverses designated patrol paths, pauses to look around, and halts to converse when approached.

import * as THREE from 'three';
import { NPC } from './NPC.js';

export const CivilianState = {
  WALKING: 'WALKING',
  PAUSED: 'PAUSED',
  TALKING: 'TALKING',
};

export class CivilianNPC extends NPC {
  constructor(options = {}) {
    super({
      id: options.id || 'civilian_villager',
      name: options.name || 'Islander',
      title: options.title || 'Villager',
      promptAction: 'Talk to',
      interactionRange: options.interactionRange || 3.0,
      coatColor: options.coatColor || 0x3d7044,
      pantsColor: options.pantsColor || 0x3b3329,
      ...options,
    });

    this.waypoints = Array.isArray(options.waypoints) && options.waypoints.length > 0
      ? options.waypoints
      : [
          { x: this.position.x, z: this.position.z },
          { x: this.position.x + 8, z: this.position.z + 6 },
        ];

    this.currentWaypointIndex = 0;
    // If starting exactly on waypoint 0, target waypoint 1 so walking begins promptly
    const w0 = this.waypoints[0];
    if (Math.hypot(w0.x - this.position.x, w0.z - this.position.z) <= 1.2 && this.waypoints.length > 1) {
      this.currentWaypointIndex = 1;
    }

    this.walkSpeed = options.walkSpeed || 1.6; // meters per second
    this.turnRate = options.turnRate || 3.5;   // rad/s
    this.pauseDuration = options.pauseDuration !== undefined ? options.pauseDuration : 4.0;
    this.pauseTimer = 0;
    this.state = CivilianState.WALKING;
  }

  getCurrentTarget() {
    return this.waypoints[this.currentWaypointIndex];
  }

  advanceWaypoint() {
    this.currentWaypointIndex = (this.currentWaypointIndex + 1) % this.waypoints.length;
  }

  /**
   * Updates autonomous path navigation, terrain clamping, and interaction halt.
   */
  update(dt, playerPosition = null, terrainCollider = null) {
    // 1. Proximity check with player
    const distToPlayer = playerPosition ? this.getHorizontalDistanceTo(playerPosition) : 999;
    const isPlayerGreeting = distToPlayer < 2.8;

    if (isPlayerGreeting) {
      // Pause walking to greet player
      this.isWalking = false;
      this.state = CivilianState.TALKING;

      // Face toward player smoothly
      const dx = playerPosition.x - this.position.x;
      const dz = playerPosition.z - this.position.z;
      const targetAngle = Math.atan2(dx, dz);
      this._rotateTowards(targetAngle, dt * 5.0);
    } else {
      if (this.state === CivilianState.TALKING) {
        this.state = CivilianState.WALKING;
      }

      if (this.state === CivilianState.PAUSED) {
        this.isWalking = false;
        this.pauseTimer -= dt;
        if (this.pauseTimer <= 0) {
          this.state = CivilianState.WALKING;
        }
      } else if (this.state === CivilianState.WALKING) {
        const target = this.getCurrentTarget();
        const dx = target.x - this.position.x;
        const dz = target.z - this.position.z;
        const dist = Math.hypot(dx, dz);

        if (dist <= 1.2) {
          // Arrived at waypoint -> pause briefly, then advance to next waypoint
          this.state = CivilianState.PAUSED;
          this.pauseTimer = this.pauseDuration;
          this.advanceWaypoint();
          this.isWalking = false;
        } else {
          // Steer towards target waypoint
          const targetAngle = Math.atan2(dx, dz);
          this._rotateTowards(targetAngle, dt * this.turnRate);

          // Move forward along facing angle
          const step = this.walkSpeed * dt;
          this.position.x += Math.sin(this.facingAngle) * step;
          this.position.z += Math.cos(this.facingAngle) * step;
          this.isWalking = true;
        }
      }
    }

    // 2. Clamp elevation to terrain
    if (terrainCollider) {
      this.position.y = terrainCollider.sampleHeight(this.position.x, this.position.z);
    }

    // 3. Synchronize Three.js visual mesh transform
    if (this.mesh) {
      this.mesh.position.set(this.position.x, this.position.y, this.position.z);
      this.mesh.rotation.y = this.facingAngle;
    }

    // 4. Update parent animation cycle (legs/arms swing, breathing, head tracking)
    super.update(dt, playerPosition);
  }

  _rotateTowards(targetAngle, maxDelta) {
    let diff = targetAngle - this.facingAngle;
    while (diff > Math.PI) diff -= Math.PI * 2;
    while (diff < -Math.PI) diff += Math.PI * 2;

    const change = Math.max(-maxDelta, Math.min(maxDelta, diff));
    this.facingAngle += change;
  }
}

export default CivilianNPC;
