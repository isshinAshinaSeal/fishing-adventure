// TeleportStation: Glowing fast-travel arch and interactable world gate.
// Only functional destinations are registered by Game; locked gates show as dormant.

import * as THREE from 'three';
import { Interactable } from '../interaction/Interactable.js';

export class TeleportStation extends Interactable {
  constructor(options = {}) {
    super({
      id: options.id || 'teleport_station',
      name: options.name || 'Teleport Gate',
      type: 'teleport_station',
      promptAction: options.promptAction || 'Fast Travel at',
      interactionRange: options.interactionRange || 4.0,
      position: options.position || { x: 0, y: 0, z: 0 },
      ...options,
    });

    this.destinationId = options.destinationId || null;
    this.icon = options.icon || '🌀';
    this.isUnlocked = options.isUnlocked !== undefined ? options.isUnlocked : true;
    this.animTime = 0;
    this.mesh = this._createMesh();
  }

  _createMesh() {
    const group = new THREE.Group();
    group.name = `TeleportStation_${this.id}`;

    const stoneMat = new THREE.MeshLambertMaterial({ color: 0x55606e });
    const glowMat = new THREE.MeshBasicMaterial({
      color: 0x66ddff,
      transparent: true,
      opacity: 0.35,
      side: THREE.DoubleSide,
    });

    // Stone archway
    const pillarGeom = new THREE.BoxGeometry(0.55, 3.2, 0.55);
    const left = new THREE.Mesh(pillarGeom, stoneMat);
    left.position.set(-1.1, 1.6, 0);
    left.castShadow = true;
    group.add(left);

    const right = new THREE.Mesh(pillarGeom, stoneMat);
    right.position.set(1.1, 1.6, 0);
    right.castShadow = true;
    group.add(right);

    const lintel = new THREE.Mesh(new THREE.BoxGeometry(2.9, 0.55, 0.6), stoneMat);
    lintel.position.set(0, 3.35, 0);
    lintel.castShadow = true;
    group.add(lintel);

    // Base ring
    const base = new THREE.Mesh(new THREE.CylinderGeometry(1.35, 1.5, 0.25, 12), stoneMat);
    base.position.y = 0.12;
    group.add(base);

    // Portal shimmer
    const portal = new THREE.Mesh(new THREE.CircleGeometry(0.95, 24), glowMat);
    portal.position.set(0, 1.75, 0);
    group.add(portal);
    this.portalMesh = portal;

    const runeMat = new THREE.MeshBasicMaterial({ color: 0xaaddff });
    for (let i = 0; i < 4; i++) {
      const rune = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.12, 0.08), runeMat);
      const angle = (i / 4) * Math.PI * 2;
      rune.position.set(Math.cos(angle) * 0.75, 1.75 + Math.sin(angle) * 0.75, 0.02);
      group.add(rune);
    }

    group.position.copy(this.position);
    return group;
  }

  getPromptText() {
    if (!this.isUnlocked) {
      return `Locked Portal (${this.name})`;
    }
    return `Fast Travel at ${this.name}`;
  }

  canInteract(player) {
    return this.enabled && Boolean(player);
  }

  onInteract(player, context) {
    if (context && typeof context.openTravel === 'function') {
      return context.openTravel(this.destinationId);
    }
    return null;
  }

  update(dt) {
    this.animTime += dt || 0;
    if (this.portalMesh) {
      this.portalMesh.material.opacity = 0.24 + Math.sin(this.animTime * 2.5) * 0.12;
      this.portalMesh.rotation.z = this.animTime * 0.25;
    }
  }
}

export default TeleportStation;
