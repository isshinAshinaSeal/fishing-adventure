// SharkAI.js: Pelagic shark with 3-state behavior (Patrol, Curious, Flee),
// realistic fin articulation kinematics, and strict ocean depth clamping.

import * as THREE from 'three';

export const SharkState = {
  PATROL: 'PATROL',
  CURIOUS: 'CURIOUS',
  FLEE: 'FLEE',
};

export class SharkAI {
  constructor(options = {}) {
    this.id = options.id || `shark_${Math.random().toString(36).substr(2, 6)}`;
    this.species = options.species || 'Great White';
    this.waterLevel = options.waterLevel || 0.0;

    // Movement speeds (m/s)
    this.patrolSpeed = options.patrolSpeed || 2.4;
    this.curiousSpeed = options.curiousSpeed || 3.2;
    this.fleeSpeed = options.fleeSpeed || 6.2;
    this.turnSpeed = options.turnSpeed || 1.8;

    // Detection radii (meters)
    this.detectionRadius = options.detectionRadius || 24.0;
    this.fleeRadius = options.fleeRadius || 6.5;

    // State
    this.state = SharkState.PATROL;
    this.position = new THREE.Vector3(
      options.position ? options.position.x : 0,
      options.position ? options.position.y : this.waterLevel - 3.5,
      options.position ? options.position.z : -320
    );
    this.velocity = new THREE.Vector3(0, 0, 0);
    this.yaw = options.yaw || Math.random() * Math.PI * 2;
    this.pitch = 0.0;
    this.animTime = Math.random() * 10;

    // Waypoints for patrol loop
    this.centerAnchor = options.centerAnchor || { x: this.position.x, z: this.position.z };
    this.patrolRadius = options.patrolRadius || 45.0;
    this.orbitAngle = Math.random() * Math.PI * 2;

    // Target depth below surface
    this.targetDepth = options.targetDepth || 3.2;

    this.mesh = this._createSharkMesh();
  }

  _createSharkMesh() {
    const group = new THREE.Group();
    group.name = `Shark_${this.id}`;

    // Shark Torpedo Body (streamlined slate-grey hull)
    const bodyMat = new THREE.MeshLambertMaterial({ color: 0x475569 });
    const bodyGeom = new THREE.ConeGeometry(0.7, 3.2, 8);
    bodyGeom.rotateX(Math.PI / 2);
    const body = new THREE.Mesh(bodyGeom, bodyMat);
    body.castShadow = true;
    group.add(body);

    // Shark Belly (lighter pale underbelly)
    const bellyMat = new THREE.MeshLambertMaterial({ color: 0xe2e8f0 });
    const bellyGeom = new THREE.BoxGeometry(0.8, 0.2, 2.4);
    const belly = new THREE.Mesh(bellyGeom, bellyMat);
    belly.position.set(0, -0.32, 0.2);
    group.add(belly);

    // Iconic Dorsal Fin
    const dorsalGeom = new THREE.ConeGeometry(0.35, 0.9, 4);
    dorsalGeom.rotateZ(-Math.PI / 6);
    const dorsal = new THREE.Mesh(dorsalGeom, bodyMat);
    dorsal.position.set(0, 0.65, 0.2);
    group.add(dorsal);

    // Pectoral Fins (Left & Right)
    const finGeom = new THREE.BoxGeometry(1.6, 0.08, 0.6);
    const pectoralFins = new THREE.Mesh(finGeom, bodyMat);
    pectoralFins.position.set(0, -0.15, 0.5);
    group.add(pectoralFins);

    // Tail / Caudal Fin Pivot
    this.tailPivot = new THREE.Group();
    this.tailPivot.position.set(0, 0, -1.6);
    const tailGeom = new THREE.BoxGeometry(0.12, 1.3, 0.7);
    const tailMesh = new THREE.Mesh(tailGeom, bodyMat);
    tailMesh.position.set(0, 0, -0.35);
    this.tailPivot.add(tailMesh);
    group.add(this.tailPivot);

    group.position.copy(this.position);
    return group;
  }

  /**
   * AI Decision & Motion update loop.
   * Enforces acceptance tests:
   * 1. Patrols along ocean waypoints.
   * 2. Transitions to CURIOUS when player/boat enters detection radius.
   * 3. Transitions to FLEE with burst speed when approached too closely.
   * 4. Remains strictly submerged between waterLevel and seabed.
   */
  update(dt, playerPosition = null, boatPosition = null, terrainCollider = null) {
    this.animTime += dt;

    // Pick closest interest point (boat or swimmer)
    let target = null;
    let minDist = Infinity;

    if (playerPosition) {
      const d = this.position.distanceTo(playerPosition);
      if (d < minDist) {
        minDist = d;
        target = playerPosition;
      }
    }
    if (boatPosition) {
      const d = this.position.distanceTo(boatPosition);
      if (d < minDist) {
        minDist = d;
        target = boatPosition;
      }
    }

    // State Transitions
    if (target && minDist < this.fleeRadius) {
      this.state = SharkState.FLEE;
    } else if (target && minDist < this.detectionRadius) {
      this.state = SharkState.CURIOUS;
    } else {
      this.state = SharkState.PATROL;
    }

    // State Behaviors
    let moveSpeed = this.patrolSpeed;
    let targetYaw = this.yaw;

    if (this.state === SharkState.FLEE && target) {
      moveSpeed = this.fleeSpeed;
      // Steer directly away from target
      const awayX = this.position.x - target.x;
      const awayZ = this.position.z - target.z;
      targetYaw = Math.atan2(awayX, awayZ);
    } else if (this.state === SharkState.CURIOUS && target) {
      moveSpeed = this.curiousSpeed;
      // Circle target at tangent orbit
      const toTargetX = target.x - this.position.x;
      const toTargetZ = target.z - this.position.z;
      const angleToTarget = Math.atan2(toTargetX, toTargetZ);
      // Tangent offset for smooth circling
      targetYaw = angleToTarget + Math.PI * 0.45;
    } else {
      // PATROL: Orbit center anchor
      moveSpeed = this.patrolSpeed;
      this.orbitAngle += (moveSpeed / this.patrolRadius) * dt;
      const desiredX = this.centerAnchor.x + Math.sin(this.orbitAngle) * this.patrolRadius;
      const desiredZ = this.centerAnchor.z + Math.cos(this.orbitAngle) * this.patrolRadius;
      const dirX = desiredX - this.position.x;
      const dirZ = desiredZ - this.position.z;
      targetYaw = Math.atan2(dirX, dirZ);
    }

    // Smooth Turn Steering
    let angleDiff = (targetYaw - this.yaw) % (Math.PI * 2);
    if (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
    if (angleDiff < -Math.PI) angleDiff += Math.PI * 2;
    this.yaw += Math.sign(angleDiff) * Math.min(Math.abs(angleDiff), this.turnSpeed * dt);

    // Forward Step
    this.position.x += Math.sin(this.yaw) * moveSpeed * dt;
    this.position.z += Math.cos(this.yaw) * moveSpeed * dt;

    // Depth Clamping: Submerged below water level and above seabed
    const surfaceCeiling = this.waterLevel - 0.45;
    let seabedFloor = -18.0;
    if (terrainCollider) {
      seabedFloor = terrainCollider.sampleHeight(this.position.x, this.position.z) + 0.9;
    }

    const idealY = this.waterLevel - this.targetDepth;
    this.position.y += (idealY - this.position.y) * 2.0 * dt;
    // Strict clamp
    this.position.y = Math.min(surfaceCeiling, Math.max(seabedFloor, this.position.y));

    // Tail Fin Articulation (faster wagging during sprint flee)
    if (this.tailPivot) {
      const wagFreq = moveSpeed * 3.5;
      this.tailPivot.rotation.y = Math.sin(this.animTime * wagFreq) * 0.35;
    }

    // Sync 3D Mesh
    if (this.mesh) {
      this.mesh.position.copy(this.position);
      this.mesh.rotation.y = this.yaw;
      // Slight pitch based on vertical adjustment
      this.mesh.rotation.x = Math.sin(this.animTime * 1.5) * 0.05;
    }
  }
}

export default SharkAI;
