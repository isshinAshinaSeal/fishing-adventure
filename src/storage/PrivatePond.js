// PrivatePond: Circular stone tranquil pond where player can house live caught fish.
// Simulates procedural 3D swimming fish paths strictly bounded inside the pond perimeter.

import * as THREE from 'three';
import { Interactable } from '../interaction/Interactable.js';
import { Config } from '../config.js';

export class PrivatePond extends Interactable {
  constructor(options = {}) {
    super({
      id: options.id || 'private_pond_seaside',
      name: options.name || 'Private Fish Pond',
      type: 'pond',
      promptAction: 'Manage',
      interactionRange: 4.2,
      position: options.position || { x: 14.0, y: 0.2, z: -3.0 },
      ...options,
    });

    this.capacity = options.capacity || Config.storage.pondCapacity || 8;
    this.pondRadius = options.pondRadius || Config.storage.pondRadius || 2.6;
    this.waterElevation = this.position.y + 0.35;

    this.liveFish = [];
    this.fishMeshes = new Map(); // instanceId -> THREE.Group

    // 3D Visual Mesh
    this.mesh = this._createPondMesh();
  }

  _createPondMesh() {
    const group = new THREE.Group();
    group.name = `PrivatePond_${this.id}`;

    // Stone Basin Rim
    const stoneMat = new THREE.MeshLambertMaterial({ color: 0x777b84 });
    const rimGeom = new THREE.CylinderGeometry(this.pondRadius + 0.35, this.pondRadius + 0.45, 0.7, 24);
    const rim = new THREE.Mesh(rimGeom, stoneMat);
    rim.position.y = 0.35;
    rim.castShadow = true;
    rim.receiveShadow = true;
    group.add(rim);

    // Pond Water Surface
    const waterMat = new THREE.MeshBasicMaterial({
      color: 0x1b9aaa,
      transparent: true,
      opacity: 0.85,
    });
    const waterGeom = new THREE.CircleGeometry(this.pondRadius, 24);
    waterGeom.rotateX(-Math.PI / 2);
    const water = new THREE.Mesh(waterGeom, waterMat);
    water.position.y = 0.55;
    group.add(water);

    // Decorative Lilypads
    const padMat = new THREE.MeshLambertMaterial({ color: 0x3d8b44 });
    for (let i = 0; i < 4; i++) {
      const padGeom = new THREE.CircleGeometry(0.28, 8);
      padGeom.rotateX(-Math.PI / 2);
      const pad = new THREE.Mesh(padGeom, padMat);
      const padAngle = i * 1.6;
      const padDist = 0.8 + (i % 2) * 0.9;
      pad.position.set(Math.cos(padAngle) * padDist, 0.56, Math.sin(padAngle) * padDist);
      group.add(pad);
    }

    // Container for swimming fish meshes
    this.fishContainer = new THREE.Group();
    this.fishContainer.name = 'SwimmingFishContainer';
    group.add(this.fishContainer);

    group.position.copy(this.position);
    return group;
  }

  isFull() {
    return this.liveFish.length >= this.capacity;
  }

  getCount() {
    return this.liveFish.length;
  }

  getCapacity() {
    return this.capacity;
  }

  getFishList() {
    return [...this.liveFish];
  }

  /**
   * Places a fish from the player's bucket into the pond.
   * Enforces acceptance tests:
   * 1. Fish can be placed in private pond.
   * 2. Pond capacity is strictly enforced.
   */
  placeFishFromBucket(inventory, instanceId) {
    if (!inventory || !instanceId) {
      return { success: false, reason: 'Invalid parameters' };
    }
    if (this.isFull()) {
      return { success: false, reason: `Pond is full (Capacity: ${this.capacity} Fish)` };
    }

    const fish = inventory.removeFish(instanceId);
    if (!fish) {
      return { success: false, reason: 'Fish not found in bucket' };
    }

    // Initialize physical swimming attributes
    const swimState = {
      ...fish,
      angle: Math.random() * Math.PI * 2,
      orbitRadius: 0.6 + Math.random() * (this.pondRadius - 1.1),
      speed: 0.7 + Math.random() * 0.6,
      depth: 0.35 + Math.random() * 0.15,
      direction: Math.random() > 0.5 ? 1 : -1,
      tailPhase: Math.random() * 10,
    };

    this.liveFish.push(swimState);
    this._createSwimmingFishMesh(swimState);

    return { success: true, fish: swimState };
  }

  /**
   * Retrieves a fish from the pond back into player's bucket.
   */
  retrieveFishToBucket(inventory, instanceId) {
    if (!inventory || !instanceId) {
      return { success: false, reason: 'Invalid parameters' };
    }
    if (inventory.isFull()) {
      return { success: false, reason: 'Fish bucket is full' };
    }

    const idx = this.liveFish.findIndex((f) => f.instanceId === instanceId);
    if (idx === -1) {
      return { success: false, reason: 'Fish not found in pond' };
    }

    const fish = this.liveFish.splice(idx, 1)[0];
    const addResult = inventory.addFish(fish);

    if (!addResult.success) {
      this.liveFish.push(fish);
      return { success: false, reason: addResult.reason };
    }

    // Remove 3D swimming mesh
    this._removeSwimmingFishMesh(instanceId);

    return { success: true, fish };
  }

  _createSwimmingFishMesh(fish) {
    const group = new THREE.Group();
    group.name = `SwimmingFish_${fish.instanceId}`;

    // Rarity colors
    let color = 0x3377aa;
    if (fish.rarity === 'Uncommon') color = 0x22aa66;
    if (fish.rarity === 'Rare') color = 0x3388dd;
    if (fish.rarity === 'Legendary') color = 0xffbb22;

    const fishMat = new THREE.MeshLambertMaterial({ color });
    const bodyGeom = new THREE.ConeGeometry(0.08, 0.35, 6);
    bodyGeom.rotateX(Math.PI / 2);
    const body = new THREE.Mesh(bodyGeom, fishMat);
    group.add(body);

    const tailGeom = new THREE.BoxGeometry(0.02, 0.12, 0.12);
    const tail = new THREE.Mesh(tailGeom, fishMat);
    tail.position.z = -0.22;
    group.add(tail);
    group.tailMesh = tail;

    if (this.fishContainer) {
      this.fishContainer.add(group);
    }
    this.fishMeshes.set(fish.instanceId, group);
  }

  _removeSwimmingFishMesh(instanceId) {
    const mesh = this.fishMeshes.get(instanceId);
    if (mesh) {
      if (mesh.parent) mesh.parent.remove(mesh);
      this.fishMeshes.delete(instanceId);
    }
  }

  /**
   * Main simulation loop: advances swimming fish and clamps inside pond boundaries.
   * Enforces acceptance test: Fish swim inside pond boundaries.
   */
  update(dt) {
    for (const fish of this.liveFish) {
      fish.tailPhase += dt * 14.0;
      fish.angle += (fish.direction * (fish.speed / Math.max(0.5, fish.orbitRadius))) * dt;

      // Ensure orbit radius stays strictly within physical circular pond boundary
      const maxAllowedRadius = this.pondRadius - 0.35;
      const minAllowedRadius = 0.4;
      fish.orbitRadius = Math.max(minAllowedRadius, Math.min(maxAllowedRadius, fish.orbitRadius));

      // Calculate relative coordinates from pond center
      const localX = Math.cos(fish.angle) * fish.orbitRadius;
      const localZ = Math.sin(fish.angle) * fish.orbitRadius;
      const localY = fish.depth;

      // Verify distance constraint
      const distFromPondCenter = Math.hypot(localX, localZ);
      fish.currentDistFromCenter = distFromPondCenter;

      const mesh = this.fishMeshes.get(fish.instanceId);
      if (mesh) {
        mesh.position.set(localX, localY, localZ);
        // Face tangential swimming direction
        const heading = fish.direction > 0 ? fish.angle + Math.PI / 2 : fish.angle - Math.PI / 2;
        mesh.rotation.y = -heading;

        // Tail wagging animation
        if (mesh.tailMesh) {
          mesh.tailMesh.rotation.y = Math.sin(fish.tailPhase) * 0.4;
        }
      }
    }
  }

  getPromptText() {
    return `Manage ${this.name} (${this.liveFish.length}/${this.capacity} Fish)`;
  }

  serialize() {
    return this.liveFish.map((f) => ({
      speciesId: f.speciesId,
      name: f.name,
      rarity: f.rarity,
      weight: f.weight,
      value: f.value,
      icon: f.icon,
      instanceId: f.instanceId,
    }));
  }

  deserialize(data) {
    if (Array.isArray(data)) {
      this.liveFish = [];
      if (this.fishContainer) {
        while (this.fishContainer.children.length > 0) {
          this.fishContainer.remove(this.fishContainer.children[0]);
        }
      }
      this.fishMeshes.clear();

      for (const item of data) {
        const swimState = {
          ...item,
          angle: Math.random() * Math.PI * 2,
          orbitRadius: 0.6 + Math.random() * (this.pondRadius - 1.1),
          speed: 0.7 + Math.random() * 0.6,
          depth: 0.35 + Math.random() * 0.15,
          direction: Math.random() > 0.5 ? 1 : -1,
          tailPhase: Math.random() * 10,
        };
        this.liveFish.push(swimState);
        this._createSwimmingFishMesh(swimState);
      }
    }
  }

  reset() {
    this.liveFish = [];
    if (this.fishContainer) {
      while (this.fishContainer.children.length > 0) {
        this.fishContainer.remove(this.fishContainer.children[0]);
      }
    }
    this.fishMeshes.clear();
  }
}

export default PrivatePond;
