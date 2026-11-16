// ServiceBuilding: a physical, interactable harbor building. Every building
// opens a working service panel; none are decorative shells.

import * as THREE from 'three';
import { Interactable } from '../interaction/Interactable.js';

export class ServiceBuilding extends Interactable {
  constructor(options = {}) {
    super({
      id: options.id,
      name: options.name,
      type: 'building',
      promptAction: 'Enter',
      interactionRange: options.interactionRange || 4.6,
      position: options.position || { x: 0, y: 0, z: 0 },
      ...options,
    });
    this.service = options.service;
    this.icon = options.icon || '🏠';
    this.color = options.color || 0x8a5229;
    this.description = options.description || '';
    this.variant = options.variant || 'building';
    this.mesh = this._createMesh();
    this.light = null;
  }

  _createMesh() {
    const group = new THREE.Group();
    group.name = `ServiceBuilding_${this.id}`;
    const isHut = this.variant === 'hut';
    const wallMat = new THREE.MeshLambertMaterial({ color: isHut ? 0xc9a878 : 0xd8c3a5 });
    const trimMat = new THREE.MeshLambertMaterial({ color: this.color });
    const roofMat = new THREE.MeshLambertMaterial({ color: isHut ? 0x9c7738 : 0x5d3a2a });
    const glassMat = new THREE.MeshLambertMaterial({ color: 0x9bd7e8, transparent: true, opacity: 0.8 });
    const goldMat = new THREE.MeshBasicMaterial({ color: 0xffe066 });

    const floor = new THREE.Mesh(new THREE.BoxGeometry(4.4, 0.3, 3.6), trimMat);
    floor.position.y = 0.15;
    group.add(floor);

    const walls = new THREE.Mesh(new THREE.BoxGeometry(4.0, 2.8, 3.2), wallMat);
    walls.position.y = 1.65;
    walls.castShadow = true;
    group.add(walls);

    const roof = new THREE.Mesh(
      new THREE.ConeGeometry(isHut ? 3.15 : 3.0, isHut ? 1.8 : 1.5, isHut ? 8 : 4),
      roofMat
    );
    roof.rotation.y = isHut ? 0 : Math.PI / 4;
    roof.position.y = isHut ? 3.55 : 3.75;
    roof.castShadow = true;
    group.add(roof);

    if (isHut) {
      // A small stone chimney and a hanging door lantern make the island huts
      // readable from the trail without adding another UI sprite.
      const chimney = new THREE.Mesh(new THREE.BoxGeometry(0.45, 1.4, 0.45), new THREE.MeshLambertMaterial({ color: 0x6d6a63 }));
      chimney.position.set(-1.35, 3.3, -0.8);
      group.add(chimney);
      const doorLantern = new THREE.Mesh(new THREE.SphereGeometry(0.15, 8, 6), goldMat);
      doorLantern.position.set(0.75, 2.2, 1.75);
      group.add(doorLantern);
    }

    const door = new THREE.Mesh(new THREE.BoxGeometry(0.9, 1.9, 0.14), trimMat);
    door.position.set(0, 1.2, 1.63);
    group.add(door);

    const windowMesh = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.8, 0.1), glassMat);
    windowMesh.position.set(-1.2, 1.9, 1.64);
    group.add(windowMesh);
    const windowMesh2 = windowMesh.clone();
    windowMesh2.position.x = 1.2;
    group.add(windowMesh2);

    // Icon sign above the door.
    const sign = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.6, 0.12), new THREE.MeshBasicMaterial({ color: 0xfff1b8 }));
    sign.position.set(0, 3.0, 1.72);
    group.add(sign);
    const marker = new THREE.Mesh(new THREE.SphereGeometry(0.12, 8, 8), goldMat);
    marker.position.set(0, 3.55, 1.6);
    group.add(marker);
    this.marker = marker;

    const lamp = new THREE.PointLight(0xffc966, 0.8, 6);
    lamp.position.set(0, 2.4, 1.9);
    group.add(lamp);
    this.light = lamp;

    group.position.copy(this.position);
    return group;
  }

  getPromptText() {
    return `${this.icon} Enter ${this.name}`;
  }

  update(dt, elapsed = 0) {
    if (this.marker) {
      this.marker.position.y = 3.55 + Math.sin(elapsed * 2 + this.position.x) * 0.08;
    }
    if (this.light) {
      this.light.intensity = 0.65 + Math.sin(elapsed * 1.7 + this.position.z) * 0.15;
    }
  }
}

export default ServiceBuilding;
