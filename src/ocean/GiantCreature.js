// GiantCreature: a genuinely roaming world creature with ten AI states,
// migration waypoints, surface/dive behavior, and encounter triggers.

import * as THREE from 'three';

const STATE_LABELS = {
  idle: 'Idle Swimming',
  roam: 'Roaming',
  migrate: 'Migration',
  feed: 'Feeding',
  surface: 'Surface Breathing',
  curious: 'Curious Approach',
  escape: 'Escape',
  encounter: 'Encounter',
  boss: 'Boss Mode',
  despawn: 'Return to Habitat',
};

export class GiantCreature {
  constructor(definition, options = {}) {
    this.definition = definition;
    this.id = definition.id;
    this.name = definition.name;
    this.anchor = new THREE.Vector3(
      options.anchor?.x || 0,
      options.anchor?.y || -4,
      options.anchor?.z || -300
    );
    this.position = this.anchor.clone();
    this.position.y = this._depthY(definition.depth);
    this.yaw = Math.random() * Math.PI * 2;
    this.speed = definition.speed || 1.5;
    this.state = 'idle';
    this.stateTimer = 0;
    this.stateDuration = 3 + Math.random() * 4;
    this.target = this.position.clone();
    this.scale = definition.scale || 3;
    this.detectionRadius = definition.rare ? 42 : 60;
    this.encounterRadius = 18;
    this.isEncountered = false;
    this.hasTriggeredBoss = false;
    this.discovered = false;
    this.timeAlive = Math.random() * 100;
    this.mesh = this._createMesh();
    this.mesh.position.copy(this.position);
    this.mesh.rotation.y = this.yaw;
    this._pickWaypoint();
  }

  _depthY(depth) {
    if (depth === 'surface') return -1.0;
    if (depth === 'deep') return -7.5;
    return -4.0;
  }

  _createMesh() {
    const group = new THREE.Group();
    group.name = `Giant_${this.id}`;
    const color = this.definition.color || 0x406fa8;
    const bodyMat = new THREE.MeshLambertMaterial({ color });
    const bellyMat = new THREE.MeshLambertMaterial({ color: 0xddeeff });
    const eyeMat = new THREE.MeshBasicMaterial({ color: 0x101820 });
    const finMat = new THREE.MeshLambertMaterial({ color: new THREE.Color(color).multiplyScalar(0.7) });

    const body = new THREE.Mesh(new THREE.SphereGeometry(1, 12, 10), bodyMat);
    body.scale.set(1.2, 0.85, 2.7);
    body.castShadow = true;
    group.add(body);

    const belly = new THREE.Mesh(new THREE.SphereGeometry(0.9, 10, 8), bellyMat);
    belly.scale.set(1.0, 0.5, 2.1);
    belly.position.y = -0.35;
    group.add(belly);

    const tail = new THREE.Mesh(new THREE.ConeGeometry(0.7, 1.8, 4), finMat);
    tail.rotation.x = Math.PI / 2;
    tail.position.z = -2.8;
    group.add(tail);
    this.tail = tail;

    const dorsal = new THREE.Mesh(new THREE.ConeGeometry(0.35, 1.1, 4), finMat);
    dorsal.position.set(0, 0.9, 0.1);
    dorsal.rotation.x = 0.2;
    group.add(dorsal);

    const leftFin = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.08, 0.7), finMat);
    leftFin.position.set(-1.2, -0.2, 0.6);
    leftFin.rotation.z = -0.2;
    group.add(leftFin);
    const rightFin = leftFin.clone();
    rightFin.position.x = 1.2;
    rightFin.rotation.z = 0.2;
    group.add(rightFin);

    for (const side of [-1, 1]) {
      const eye = new THREE.Mesh(new THREE.SphereGeometry(0.09, 6, 6), eyeMat);
      eye.position.set(side * 0.55, 0.2, 1.7);
      group.add(eye);
    }

    group.scale.setScalar(this.scale);
    group.userData.creature = this;
    return group;
  }

  _pickWaypoint() {
    const angle = Math.random() * Math.PI * 2;
    const radius = 35 + Math.random() * 80;
    this.target.set(
      this.anchor.x + Math.cos(angle) * radius,
      this._depthY(this.definition.depth) + (Math.random() - 0.5) * 2,
      this.anchor.z + Math.sin(angle) * radius
    );
  }

  _setState(state, duration = 4) {
    this.state = state;
    this.stateTimer = 0;
    this.stateDuration = duration;
  }

  update(dt, context = {}) {
    this.timeAlive += dt;
    this.stateTimer += dt;
    const player = context.player;
    const boat = context.boat;
    const playerPos = boat ? boat.position : player ? player.position : null;

    let distanceToPlayer = Infinity;
    if (playerPos) {
      distanceToPlayer = Math.hypot(playerPos.x - this.position.x, playerPos.z - this.position.z);
    }

    if (!this.discovered && distanceToPlayer < this.detectionRadius) {
      this.discovered = true;
      if (typeof context.onDiscover === 'function') context.onDiscover(this);
    }

    if (distanceToPlayer < this.encounterRadius && !this.isEncountered) {
      this.isEncountered = true;
      this._setState('curious', 6);
      if (typeof context.onEncounter === 'function') context.onEncounter(this);
    }

    if (this.isEncountered && distanceToPlayer > this.detectionRadius * 2.5) {
      this.isEncountered = false;
      this._setState('roam', 8);
    }

    if (this.stateTimer >= this.stateDuration) {
      if (this.isEncountered) {
        this._setState('curious', 6);
      } else {
        const roll = Math.random();
        if (roll < 0.18) this._setState('idle', 3 + Math.random() * 3);
        else if (roll < 0.4) this._setState('migrate', 8 + Math.random() * 8);
        else if (roll < 0.58) this._setState('feed', 5 + Math.random() * 4);
        else if (roll < 0.7) this._setState('surface', 4 + Math.random() * 3);
        else this._setState('roam', 6 + Math.random() * 6);
        this._pickWaypoint();
      }
    }

    let moveSpeed = this.speed;
    let targetY = this.position.y;
    switch (this.state) {
      case 'idle':
        moveSpeed = 0.15;
        targetY = this._depthY(this.definition.depth);
        break;
      case 'feed':
        moveSpeed = this.speed * 0.45;
        targetY = this.position.y + Math.sin(this.timeAlive * 2) * 0.4;
        break;
      case 'surface':
        moveSpeed = this.speed * 0.5;
        targetY = -0.8;
        break;
      case 'curious':
        moveSpeed = this.speed * 0.9;
        if (playerPos) {
          this.target.set(playerPos.x + Math.sin(this.timeAlive) * 12, -2.5, playerPos.z + Math.cos(this.timeAlive) * 12);
        }
        break;
      case 'escape':
        moveSpeed = this.speed * 1.8;
        break;
      case 'boss':
        moveSpeed = this.speed * 0.6;
        targetY = -2.0;
        break;
      default:
        moveSpeed = this.speed;
        targetY = this.target.y;
    }

    const dx = this.target.x - this.position.x;
    const dz = this.target.z - this.position.z;
    const dist = Math.hypot(dx, dz);
    if (dist > 1.5) {
      const desiredYaw = Math.atan2(dx, dz);
      let diff = (desiredYaw - this.yaw + Math.PI) % (Math.PI * 2) - Math.PI;
      this.yaw += diff * Math.min(1, dt * 0.8);
      this.position.x += Math.sin(this.yaw) * moveSpeed * dt;
      this.position.z += Math.cos(this.yaw) * moveSpeed * dt;
    } else if (this.state !== 'curious') {
      this._pickWaypoint();
    }
    this.position.y += (targetY - this.position.y) * Math.min(1, dt * 0.6);

    // Keep the creature inside the expanded archipelago bounds.
    this.position.x = Math.max(-620, Math.min(620, this.position.x));
    this.position.z = Math.max(-620, Math.min(620, this.position.z));

    if (this.mesh) {
      this.mesh.position.copy(this.position);
      this.mesh.rotation.y = this.yaw;
      this.mesh.rotation.z = Math.sin(this.timeAlive * 1.2) * 0.04;
      this.mesh.position.y += Math.sin(this.timeAlive * 1.8 + this.scale) * 0.12;
      if (this.tail) this.tail.rotation.z = Math.sin(this.timeAlive * 3.2) * 0.35;
      // Surface breathing / boss arrival splash.
      if ((this.state === 'surface' || this.state === 'boss') && typeof context.onSurface === 'function' && Math.random() < dt * 2) {
        context.onSurface(this);
      }
    }
    return this;
  }

  getStatus() {
    return {
      id: this.id,
      name: this.name,
      icon: this.definition.icon,
      sizeClass: this.definition.sizeClass,
      behavior: this.definition.behavior,
      state: this.state,
      stateLabel: STATE_LABELS[this.state] || this.state,
      position: { x: this.position.x, y: this.position.y, z: this.position.z },
      discovered: this.discovered,
      isEncountered: this.isEncountered,
      bossId: this.definition.bossId || null,
    };
  }

  reset() {
    this.position.copy(this.anchor);
    this.position.y = this._depthY(this.definition.depth);
    this.state = 'idle';
    this.stateTimer = 0;
    this.stateDuration = 3;
    this.isEncountered = false;
    this.discovered = false;
    this.hasTriggeredBoss = false;
    this._pickWaypoint();
  }
}

export default GiantCreature;
