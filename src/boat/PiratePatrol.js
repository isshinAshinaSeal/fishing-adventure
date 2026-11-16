// PiratePatrol: one ambient pirate ship — the lowest-tier Jolly Bilge Skiff —
// endlessly circling the starter island. It is scenery, not a purchasable hull:
// it never docks, never despawns and never leaves the ring around Driftwood Isle.

import * as THREE from 'three';
import { createVesselModel } from './VesselModelFactory.js';
import { Config } from '../config.js';

export class PiratePatrol {
  constructor(options = {}) {
    this.id = options.id || 'pirate_patrol_jolly';
    this.name = options.name || 'Jolly Bilge Patrol';
    this.shipId = options.shipId || 'boat_pirate_jolly'; // lowest-level pirate ship
    this.tier = options.tier || 19;
    this.center = options.center || { x: 0, z: 0 };
    this.radius = options.radius || (Config.world.islandRadius + 46);
    this.speed = options.speed || 7.2;
    this.angle = options.angle !== undefined ? options.angle : Math.PI * 0.25;
    this.waterLevel = options.waterLevel !== undefined ? options.waterLevel : Config.world.waterLevel;
    this.elapsed = 0;
    this.position = new THREE.Vector3();
    this.yaw = 0;

    const model = createVesselModel({
      id: this.shipId,
      name: this.name,
      hullColor: 0x4a2f24,
      tier: this.tier,
      style: 'motor',
      hasCannons: false,
    });
    this.mesh = model.group;
    this.mesh.name = `PiratePatrol_${this.id}`;
    this.mesh.userData.isPiratePatrol = true;
    this.parts = model.parts;

    this._place();
  }

  _place() {
    this.position.set(
      this.center.x + Math.cos(this.angle) * this.radius,
      this.waterLevel + Math.sin(this.elapsed * 1.8) * 0.1,
      this.center.z + Math.sin(this.angle) * this.radius
    );
    // Tangent heading for increasing angle: derivative is (-sin, cos).
    this.yaw = Math.atan2(-Math.sin(this.angle), Math.cos(this.angle));
    if (this.mesh) {
      this.mesh.position.copy(this.position);
      this.mesh.rotation.y = this.yaw;
      this.mesh.rotation.z = Math.sin(this.elapsed * 1.1) * 0.035;
    }
    if (this.parts?.flag) this.parts.flag.rotation.y = Math.sin(this.elapsed * 3.1) * 0.18;
    if (this.parts?.propeller) this.parts.propeller.rotation.z += 0.12 + this.speed * 0.02;
  }

  update(dt) {
    if (!Number.isFinite(dt) || dt <= 0) return;
    this.elapsed += dt;
    this.angle += (this.speed / Math.max(1, this.radius)) * dt;
    if (this.angle > Math.PI * 2) this.angle -= Math.PI * 2;
    this._place();
  }

  getDistanceFromCenter() {
    const dx = this.position.x - this.center.x;
    const dz = this.position.z - this.center.z;
    return Math.sqrt(dx * dx + dz * dz);
  }

  getState() {
    return {
      id: this.id,
      name: this.name,
      shipId: this.shipId,
      tier: this.tier,
      angle: this.angle,
      radius: this.radius,
      speed: this.speed,
      heading: this.yaw,
      position: { x: this.position.x, y: this.position.y, z: this.position.z },
      distanceFromCenter: this.getDistanceFromCenter(),
    };
  }

  reset() {
    this.elapsed = 0;
    this.angle = Math.PI * 0.25;
    this._place();
  }
}

export default PiratePatrol;
