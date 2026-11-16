// FishingSpot: Designated fishing zone along pier docks or coastlines with water ripples.

import * as THREE from 'three';
import { Interactable } from '../interaction/Interactable.js';

// Ring geometries never change per spot, so all fishing spots share the same
// three buffers instead of allocating (and uploading) duplicates.
const RIPPLE_GEOMETRIES = [0, 1, 2].map((index) => {
  const geometry = new THREE.RingGeometry(0.3 + index * 0.35, 0.42 + index * 0.35, 24);
  geometry.rotateX(-Math.PI / 2);
  return geometry;
});

export class FishingSpot extends Interactable {
  constructor(options = {}) {
    super({
      id: options.id || 'fishing_spot_default',
      name: options.name || 'Fishing Spot',
      type: 'fishing_spot',
      promptAction: options.promptAction || 'Cast Line',
      interactionRange: options.interactionRange || 3.8,
      position: options.position || { x: 0, y: 0.5, z: -10 },
      ...options,
    });

    this.habitat = options.habitat || 'pier';
    // Frontier spots pass 'frontier' so FishingSystem rolls from the separate
    // frontier catalog while sharing the exact same cast/reel loop.
    this.catalog = options.catalog || null;
    this.islandId = options.islandId || null;
    this.waterElevation = options.waterElevation || 0.0;
    this.targetWaterPos = options.targetWaterPos || new THREE.Vector3(
      this.position.x,
      this.waterElevation,
      this.position.z - 4.0
    );

    this.animTime = Math.random() * 5;
    this.mesh = this._createRippleMesh();
  }

  _createRippleMesh() {
    const group = new THREE.Group();
    group.name = `FishingSpot_${this.id}`;

    // Concentric shimmering water ripple rings
    const ringMat = new THREE.MeshBasicMaterial({
      color: 0x88eeff,
      transparent: true,
      opacity: 0.65,
      side: THREE.DoubleSide,
    });

    this.rippleRings = [];
    for (let i = 0; i < 3; i++) {
      const ring = new THREE.Mesh(RIPPLE_GEOMETRIES[i], ringMat.clone());
      ring.position.set(this.targetWaterPos.x, this.waterElevation + 0.03, this.targetWaterPos.z);
      group.add(ring);
      this.rippleRings.push(ring);
    }

    return group;
  }

  update(dt) {
    this.animTime += dt;

    // Animate pulsating ripple rings expanding and fading
    if (this.rippleRings) {
      for (let i = 0; i < this.rippleRings.length; i++) {
        const ring = this.rippleRings[i];
        const phase = (this.animTime * 1.2 + i * 0.7) % 2.0;
        const scale = 0.8 + phase * 0.8;
        ring.scale.set(scale, 1.0, scale);
        ring.material.opacity = Math.max(0, 0.65 * (1.0 - phase / 2.0));
      }
    }
  }

  getPromptText(player = null) {
    if (player && !player.isRodEquipped) {
      return `Equip Rod & Cast at ${this.name}`;
    }
    return `${this.promptAction} at ${this.name}`;
  }

  /**
   * Fishing spots stay interactable even without a rod so the prompt can teach
   * the player to equip one. The cast itself auto-equips through quickCast.
   */
  canInteract(player) {
    return Boolean(this.enabled && player);
  }

  onInteract(player, context) {
    // Game supplies the real cast handler. This is the path that was silently
    // skipped before, leaving E presses near a fishing spot with no effect.
    if (typeof this.onInteractHandler === 'function') {
      return this.onInteractHandler(player, context);
    }
    if (context && typeof context.startFishingAtSpot === 'function') {
      return context.startFishingAtSpot(this);
    }
    return false;
  }
}

export default FishingSpot;
