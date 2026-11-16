// FishingRod: Equippable tool representation, 3D visual model, and tip attachment coordinates.

import * as THREE from 'three';

export class FishingRod {
  constructor(options = {}) {
    this.id = options.id || 'rod_starter';
    this.name = options.name || 'Bamboo Practice Rod';
    this.level = options.level || 1;
    this.luckBonus = options.luckBonus || 0.0;
    this.reelSpeed = options.reelSpeed || 1.0;
    this.lineStrength = options.lineStrength || 45;
    this.fishControl = options.fishControl || 40;
    this.castDistance = options.castDistance || 40;
    this.rarity = options.rarity || 'Common';
    this.ability = options.ability || 'Basic fishing';
    this.styleColor = options.styleColor || 0x3d2b1f;

    this.isEquipped = false;
    this.mesh = this._createStylizedRodMesh();
  }

  _createStylizedRodMesh() {
    const group = new THREE.Group();
    group.name = 'FishingRodMesh';

    // Materials
    const corkMat = new THREE.MeshLambertMaterial({ color: 0xcca872 }); // Cork grip
    const blankMat = new THREE.MeshLambertMaterial({ color: this.styleColor }); // Rod blank / cosmetic skin
    const reelMat = new THREE.MeshStandardMaterial({ color: 0xbfa15f, metalness: 0.8, roughness: 0.3 }); // Brass reel
    this.blankMaterial = blankMat;
    this.reelMaterial = reelMat;
    const ringMat = new THREE.MeshBasicMaterial({ color: 0xcccccc });

    // 1. Handle (Cork grip)
    const handleGeom = new THREE.CylinderGeometry(0.032, 0.035, 0.5, 8);
    const handle = new THREE.Mesh(handleGeom, corkMat);
    handle.position.y = 0.25;
    group.add(handle);

    // 2. Spinning Reel
    const reelGeom = new THREE.CylinderGeometry(0.055, 0.055, 0.07, 10);
    reelGeom.rotateZ(Math.PI / 2);
    const reel = new THREE.Mesh(reelGeom, reelMat);
    reel.position.set(0.06, 0.42, 0.04);
    group.add(reel);

    // 3. Rod Blank (Tapered long rod extending forward-upward)
    const rodLength = 2.4;
    const blankGeom = new THREE.CylinderGeometry(0.012, 0.028, rodLength, 8);
    blankGeom.translate(0, rodLength / 2, 0);

    const blank = new THREE.Mesh(blankGeom, blankMat);
    blank.position.y = 0.5;
    blank.rotation.x = -0.22; // subtle forward tilt
    group.add(blank);

    // 4. Line Guide Rings along blank
    for (let i = 1; i <= 4; i++) {
      const ringGeom = new THREE.TorusGeometry(0.025 - i * 0.003, 0.004, 6, 12);
      const ring = new THREE.Mesh(ringGeom, ringMat);
      ring.position.set(0, 0.5 + i * 0.52, -(i * 0.12));
      ring.rotation.y = Math.PI / 2;
      group.add(ring);
    }

    // 5. Tip attachment point marker
    this.tipMarker = new THREE.Object3D();
    this.tipMarker.position.set(0, 0.5 + rodLength, -0.55);
    group.add(this.tipMarker);

    return group;
  }

  /**
   * Applies a cosmetic / rarity colour while keeping the rod mesh intact.
   */
  setVisualStyle({ color, rarity } = {}) {
    if (color !== undefined && this.blankMaterial) {
      this.blankMaterial.color.setHex(color);
      this.styleColor = color;
    }
    if (rarity) this.rarity = rarity;
    if (this.reelMaterial && rarity) {
      const rarityColors = {
        Common: 0xbfa15f, Uncommon: 0x7ed6a5, Rare: 0x5e9cff,
        Epic: 0xb07cff, Legendary: 0xffc857, Mythical: 0x59e3ff,
        Celestial: 0xfff0a6, Ancient: 0x9bd3a2, Abyssal: 0x7b6cff,
      };
      this.reelMaterial.color.setHex(rarityColors[rarity] || 0xbfa15f);
    }
  }

  /**
   * Retrieves the world-space coordinate of the rod tip.
   */
  getTipWorldPosition() {
    const tipPos = new THREE.Vector3();
    if (this.tipMarker) {
      this.tipMarker.getWorldPosition(tipPos);
    } else if (this.mesh) {
      this.mesh.getWorldPosition(tipPos);
      tipPos.y += 2.2;
    }
    return tipPos;
  }
}

export default FishingRod;
