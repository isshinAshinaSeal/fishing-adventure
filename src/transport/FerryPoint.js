// FerryPoint: a world sign that sails the player between Driftwood Harbor and
// Aurelia Heights. Kept out of TravelDestinations so exact-count travel tests
// remain stable while the city gets a real, walk-up ferry.

import * as THREE from 'three';
import { Interactable } from '../interaction/Interactable.js';

export class FerryPoint extends Interactable {
  constructor(options = {}) {
    super({
      id: options.id,
      name: options.name || 'Ferry',
      type: 'ferry',
      promptAction: 'Sail',
      interactionRange: options.interactionRange || 5.0,
      position: options.position || { x: 0, y: 0, z: 0 },
      ...options,
    });
    this.destination = options.destination;
    this.prompt = options.prompt || 'Sail';
    this.arrival = options.arrival || null;
    this.onSail = options.onSail || null;
    this.mesh = options.mesh === false ? null : this._createMesh();
  }

  getPromptText() {
    return `⛴️ ${this.prompt}`;
  }

  onInteract(player, context) {
    if (typeof this.onSail === 'function') {
      return this.onSail(this.destination, this);
    }
    return null;
  }

  update(dt, elapsed = 0) {
    if (this.marker) {
      this.marker.position.y = 2.7 + Math.sin(elapsed * 1.8 + this.position.z) * 0.12;
      this.marker.rotation.y += dt * 0.9;
    }
  }

  _createMesh() {
    const group = new THREE.Group();
    group.name = `FerryPoint_${this.id}`;
    const postMat = new THREE.MeshLambertMaterial({ color: 0x44515f });
    const signMat = new THREE.MeshLambertMaterial({ color: 0xf4f1de });
    const goldMat = new THREE.MeshBasicMaterial({ color: 0xffe066 });

    const post = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.16, 3.0, 6), postMat);
    post.position.y = 1.5;
    post.castShadow = true;
    group.add(post);

    const sign = new THREE.Mesh(new THREE.BoxGeometry(1.9, 0.8, 0.12), signMat);
    sign.position.set(0, 2.45, 0);
    group.add(sign);

    const stripe = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.12, 0.14), new THREE.MeshBasicMaterial({ color: 0x1e6f8f }));
    stripe.position.set(0, 2.25, 0.02);
    group.add(stripe);

    const marker = new THREE.Mesh(new THREE.OctahedronGeometry(0.18, 0), goldMat);
    marker.position.y = 2.7;
    group.add(marker);
    this.marker = marker;

    group.position.copy(this.position);
    return group;
  }
}

export default FerryPoint;
