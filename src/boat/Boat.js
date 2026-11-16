// Boat.js: 3D aquatic vessel entity with realistic buoyancy, throttle, steering physics,
// and shoreline land-collision avoidance preventing boats from driving on dry ground.

import * as THREE from 'three';
import { Interactable } from '../interaction/Interactable.js';
import { createVesselModel } from './VesselModelFactory.js';

export class Boat extends Interactable {
  constructor(options = {}) {
    const config = options.config || options || {};
    super({
      id: options.id || config.id || 'boat_rowboat',
      name: options.name || config.name || 'Wooden Boat',
      type: 'boat',
      promptAction: 'Board',
      interactionRange: 4.8,
      position: options.position || { x: 5.0, y: 0.0, z: -18.0 },
      ...options,
    });

    this.config = config;
    this.tier = options.tier || config.tier || 1;
    this.maxSpeed = options.maxSpeed || config.maxSpeed || 5.0;
    this.reverseSpeed = options.reverseSpeed || config.reverseSpeed || 2.2;
    this.acceleration = options.acceleration || config.acceleration || 3.5;
    this.deceleration = options.deceleration || config.deceleration || 2.5;
    this.turnRate = options.turnRate || config.turnRate || 1.3;
    this.rudderResponse = options.rudderResponse || config.rudderResponse || 3.4;
    this.capacity = options.capacity || config.capacity || 1;
    this.storageCapacity = options.storageCapacity || config.storageCapacity || 15;
    this.maxHealth = options.maxHealth || config.maxHealth || 100;
    this.health = this.maxHealth;
    this.hasFishingDeck = Boolean(options.hasFishingDeck || config.hasFishingDeck);
    this.hasRadar = Boolean(options.hasRadar || config.hasRadar);
    this.hasSonar = Boolean(options.hasSonar || config.hasSonar);
    this.hasCannons = Boolean(options.hasCannons || config.hasCannons);
    this.style = options.style || config.style || null;
    this.upgradeLevels = options.upgradeLevels || config.upgradeLevels || {};
    this.hullColor = options.hullColor || config.hullColor || 0x8a5229;

    this.waterLevel = options.waterLevel || 0.0;
    this.position.y = this.waterLevel;

    this.yaw = options.yaw || 0.0;
    this.speed = 0.0;
    this.isOwned = options.isOwned || false;
    this.isMounted = false;
    this.mountedPlayer = null;
    this.bobTime = Math.random() * 10;

    // Steering model: a smoothed rudder, speed-scaled authority, lateral drift
    // and a rechargeable boost reserve. These make the helm feel like a real
    // vessel instead of a directly rotated camera.
    this.steerInput = 0;
    this.throttleInput = 0;
    this.rudderAngle = 0;
    this.sideSlip = 0;
    this.isBoosting = false;
    this.boostEnergy = 100;
    this.maxBoostEnergy = options.maxBoostEnergy || config.maxBoostEnergy || 100;
    this.boostDrain = options.boostDrain || config.boostDrain || 26;
    this.boostRecharge = options.boostRecharge || config.boostRecharge || 9;
    this.boostMultiplier = options.boostMultiplier || config.boostMultiplier || 1.45;
    this.collisionCount = 0;
    this.lastBlocked = false;

    // Last valid dock/exit anchor for clean disembarkation
    this.dockAnchor = options.dockAnchor || { x: 3.5, y: 1.0, z: -15.0 };

    this.mesh = this._createBoatMesh();
  }

  _createBoatMesh() {
    const model = createVesselModel({
      ...this.config,
      id: this.id,
      name: this.name,
      hullColor: this.hullColor,
      tier: this.tier,
      style: this.style,
      hasRadar: this.hasRadar,
      hasSonar: this.hasSonar,
      hasCannons: this.hasCannons,
    });
    this.vesselParts = model.parts;
    this.style = model.style;
    this.hullMesh = model.parts.hull;
    this.flagMesh = model.parts.flag;
    this.wheelMesh = model.parts.wheel;
    this.propellerMesh = model.parts.propeller;
    const group = model.group;
    group.name = `Boat_${this.id}`;
    group.position.copy(this.position);
    group.rotation.y = this.yaw;
    return group;
  }

  getPromptText() {
    if (!this.isOwned) {
      return `Locked (${this.name})`;
    }
    if (this.isMounted) {
      return this.hasFishingDeck ? `Fish or Disembark ${this.name}` : `Dismount ${this.name}`;
    }
    return `Board ${this.name}`;
  }

  applyStats(stats = {}) {
    if (stats.maxSpeed !== undefined) this.maxSpeed = stats.maxSpeed;
    if (stats.reverseSpeed !== undefined) this.reverseSpeed = stats.reverseSpeed;
    if (stats.turnRate !== undefined) this.turnRate = stats.turnRate;
    if (stats.acceleration !== undefined) this.acceleration = stats.acceleration;
    if (stats.deceleration !== undefined) this.deceleration = stats.deceleration;
    if (stats.rudderResponse !== undefined) this.rudderResponse = stats.rudderResponse;
    if (stats.maxBoostEnergy !== undefined) {
      this.maxBoostEnergy = stats.maxBoostEnergy;
      this.boostEnergy = Math.min(this.boostEnergy, this.maxBoostEnergy);
    }
    if (stats.boostMultiplier !== undefined) this.boostMultiplier = stats.boostMultiplier;
    if (stats.boostDrain !== undefined) this.boostDrain = stats.boostDrain;
    if (stats.boostRecharge !== undefined) this.boostRecharge = stats.boostRecharge;
    if (stats.capacity !== undefined) this.capacity = stats.capacity;
    if (stats.storageCapacity !== undefined) this.storageCapacity = stats.storageCapacity;
    if (stats.maxHealth !== undefined) this.maxHealth = stats.maxHealth;
    if (stats.hasFishingDeck !== undefined) this.hasFishingDeck = stats.hasFishingDeck;
    if (stats.hasRadar !== undefined) this.hasRadar = stats.hasRadar;
    if (stats.hasSonar !== undefined) this.hasSonar = stats.hasSonar;
    if (stats.hasCannons !== undefined) this.hasCannons = stats.hasCannons;
    if (stats.upgradeLevels !== undefined) this.upgradeLevels = stats.upgradeLevels;
    return this;
  }

  mount(player) {
    if (!this.isOwned) {
      return { success: false, reason: 'You do not own this boat' };
    }
    if (this.isMounted && this.mountedPlayer !== player) {
      return { success: false, reason: 'Boat is already occupied' };
    }

    this.isMounted = true;
    this.mountedPlayer = player;
    this.promptAction = 'Dismount';

    if (player) {
      player.isMountedBoat = true;
      player.activeBoat = this;
      player.position.set(this.position.x, this.position.y + 0.5, this.position.z);
    }

    return { success: true };
  }

  dismount(player, exitPos = null) {
    if (!this.isMounted) {
      return { success: false, reason: 'Boat is not currently mounted' };
    }

    const disembarkTarget = exitPos || this.dockAnchor;
    this.isMounted = false;
    this.speed = 0;
    this.promptAction = 'Board';

    if (this.mountedPlayer) {
      this.mountedPlayer.isMountedBoat = false;
      this.mountedPlayer.activeBoat = null;
      if (disembarkTarget) {
        this.mountedPlayer.position.set(disembarkTarget.x, disembarkTarget.y, disembarkTarget.z);
        this.mountedPlayer.isGrounded = true;
      }
    }

    this.mountedPlayer = null;
    return { success: true, exitPosition: disembarkTarget };
  }

  /**
   * Leaves the helm. Kept as a named action so deck-fishing controls can
   * distinguish "step ashore" from other vessel interactions.
   */
  disembarkOrDock(player, exitPos = null) {
    return this.dismount(player, exitPos);
  }

  /**
   * Reads the helm controls: W/S throttle, A/D steering, Shift boost.
   * Exposed separately so the HUD can render a live rudder/throttle gauge.
   */
  readHelmInput(inputManager) {
    const throttle = inputManager.isKeyDown('KeyW') || inputManager.isKeyDown('ArrowUp')
      ? 1
      : (inputManager.isKeyDown('KeyS') || inputManager.isKeyDown('ArrowDown') ? -1 : 0);
    const steer = inputManager.isKeyDown('KeyA') || inputManager.isKeyDown('ArrowLeft')
      ? 1
      : (inputManager.isKeyDown('KeyD') || inputManager.isKeyDown('ArrowRight') ? -1 : 0);
    const boost = Boolean(
      inputManager.isKeyDown('ShiftLeft') ||
      inputManager.isKeyDown('ShiftRight') ||
      (typeof inputManager.isShiftDown === 'function' && inputManager.isShiftDown())
    );
    return { throttle, steer, boost };
  }

  /**
   * Updates boat motion, steering, hydrodynamic drag, and terrain collision.
   * Enforces acceptance tests:
   * 1. Boat moves across water with throttle and steering.
   * 2. Boat cannot drive on land (strictly bounded by shoreline elevation).
   *
   * The helm is a real mechanism: the rudder angle eases toward the input,
   * steering authority scales with speed (and flips in reverse), the hull
   * carries lateral slip through turns, and boost burns a rechargeable reserve.
   */
  update(dt, inputManager, terrainCollider) {
    this.bobTime += dt;
    this.lastBlocked = false;

    if (this.isMounted && this.mountedPlayer && inputManager) {
      const { throttle, steer, boost } = this.readHelmInput(inputManager);
      this.throttleInput = throttle;
      this.steerInput = steer;

      // Rudder easing: heavy vessels take a moment to answer the wheel.
      const rudderStep = Math.min(1, Math.max(0.001, this.rudderResponse) * Math.max(0.0001, dt));
      this.rudderAngle += (steer - this.rudderAngle) * rudderStep;
      if (steer === 0 && Math.abs(this.rudderAngle) < 0.002) this.rudderAngle = 0;

      // Speed-scaled steering authority: a stationary hull barely turns,
      // while a hull at cruise answers the rudder fully.
      const speedRatio = Math.min(1, Math.abs(this.speed) / Math.max(0.001, this.maxSpeed));
      const authority = 0.22 + 0.78 * Math.min(1, speedRatio * 1.6);
      const reverseSign = this.speed < -0.01 ? -1 : 1;
      this.yaw += this.rudderAngle * this.turnRate * authority * reverseSign * dt;
      this.yaw = Math.atan2(Math.sin(this.yaw), Math.cos(this.yaw));

      // Boost: burns reserve while held, recharges while not.
      const wantsBoost = boost && throttle > 0 && this.boostEnergy > 0.5;
      this.isBoosting = wantsBoost;
      if (wantsBoost) {
        this.boostEnergy = Math.max(0, this.boostEnergy - this.boostDrain * dt);
      } else {
        this.boostEnergy = Math.min(
          this.maxBoostEnergy,
          this.boostEnergy + this.boostRecharge * dt
        );
      }

      // Accelerate / Decelerate
      const targetSpeed = this.maxSpeed * (wantsBoost ? this.boostMultiplier : 1);
      if (throttle > 0) {
        const accel = this.acceleration * (wantsBoost ? 1.35 : 1);
        this.speed = Math.min(targetSpeed, this.speed + accel * dt);
      } else if (throttle < 0) {
        this.speed = Math.max(-this.reverseSpeed, this.speed - this.acceleration * dt);
      } else {
        // Hydrodynamic water drag slowing boat to rest
        if (this.speed > 0) {
          this.speed = Math.max(0, this.speed - this.deceleration * dt);
        } else if (this.speed < 0) {
          this.speed = Math.min(0, this.speed + this.deceleration * dt);
        }
      }

      // Lateral slip: the stern washes outward through a turn, then settles.
      const slipTarget = -this.rudderAngle * this.speed * 0.06 * authority;
      this.sideSlip += (slipTarget - this.sideSlip) * Math.min(1, dt * 3.2);
      if (Math.abs(this.speed) < 0.05 && Math.abs(this.sideSlip) < 0.01) this.sideSlip = 0;

      // Check Intended Displacement & Prevent Driving onto Solid Land
      if (Math.abs(this.speed) > 0.001 || Math.abs(this.sideSlip) > 0.001) {
        const forwardX = Math.sin(this.yaw);
        const forwardZ = Math.cos(this.yaw);
        const rightX = Math.cos(this.yaw);
        const rightZ = -Math.sin(this.yaw);

        const nextX = this.position.x + forwardX * this.speed * dt + rightX * this.sideSlip * dt;
        const nextZ = this.position.z + forwardZ * this.speed * dt + rightZ * this.sideSlip * dt;

        // Query ground height at candidate position
        const groundHeight = terrainCollider ? terrainCollider.sampleHeight(nextX, nextZ) : -5.0;

        // Shoreline boundary: if ground rises near or above water level, block forward driving
        if (groundHeight >= this.waterLevel - 0.2) {
          // Rebound / stop at shoreline so boat stays safely in the water
          this.speed = 0;
          this.sideSlip = 0;
          this.lastBlocked = true;
          this.collisionCount += 1;
        } else {
          this.position.x = nextX;
          this.position.z = nextZ;
        }
      }

      // Synchronize mounted player position and heading
      if (this.mountedPlayer) {
        this.mountedPlayer.position.set(this.position.x, this.position.y + 0.55, this.position.z);
        this.mountedPlayer.facingAngle = this.yaw;
        this.mountedPlayer.velocity.set(0, 0, 0);
        this.mountedPlayer.isGrounded = true;
      }
    } else {
      // Unmanned vessels settle: bleed speed, centre the rudder, recharge boost.
      this.throttleInput = 0;
      this.steerInput = 0;
      this.isBoosting = false;
      this.rudderAngle += (0 - this.rudderAngle) * Math.min(1, dt * 2.5);
      this.sideSlip += (0 - this.sideSlip) * Math.min(1, dt * 2.5);
      this.boostEnergy = Math.min(this.maxBoostEnergy, this.boostEnergy + this.boostRecharge * dt);
      if (Math.abs(this.speed) > 0.01) {
        this.speed *= Math.max(0, 1 - this.deceleration * dt);
      } else {
        this.speed = 0;
        this.sideSlip = 0;
      }
    }

    // Buoyant wave bobbing
    this.position.y = this.waterLevel + Math.sin(this.bobTime * 2.2) * 0.04;

    // Update 3D mesh
    if (this.mesh) {
      this.mesh.position.copy(this.position);
      this.mesh.rotation.y = this.yaw;
      // Pitch from speed, roll into the turn from the rudder and slip.
      const pitch = (this.speed / Math.max(1, this.maxSpeed)) * 0.04;
      const roll = -this.rudderAngle * 0.055 - this.sideSlip * 0.02;
      this.mesh.rotation.x = pitch;
      this.mesh.rotation.z = Math.max(-0.14, Math.min(0.14, roll));
      if (this.flagMesh) this.flagMesh.rotation.y = Math.sin(this.bobTime * 2.8) * 0.16;
      if (this.propellerMesh) this.propellerMesh.rotation.z += dt * (2 + Math.abs(this.speed) * 1.4);
      if (this.wheelMesh) this.wheelMesh.rotation.z = this.rudderAngle * 0.6;
    }
  }

  /** Live steering telemetry for the HUD and diagnostics. */
  getSteeringState() {
    return {
      heading: this.yaw,
      speed: this.speed,
      maxSpeed: this.maxSpeed,
      reverseSpeed: this.reverseSpeed,
      throttleInput: this.throttleInput,
      steerInput: this.steerInput,
      rudderAngle: this.rudderAngle,
      sideSlip: this.sideSlip,
      isBoosting: this.isBoosting,
      boostEnergy: this.boostEnergy,
      boostPercent: this.maxBoostEnergy
        ? Math.round((this.boostEnergy / this.maxBoostEnergy) * 100)
        : 0,
      collisionCount: this.collisionCount,
      lastBlocked: this.lastBlocked,
    };
  }

  reset() {
    this.isMounted = false;
    this.speed = 0;
    this.mountedPlayer = null;
    this.steerInput = 0;
    this.throttleInput = 0;
    this.rudderAngle = 0;
    this.sideSlip = 0;
    this.isBoosting = false;
    this.boostEnergy = this.maxBoostEnergy;
    this.lastBlocked = false;
  }
}

export default Boat;
