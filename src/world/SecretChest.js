// SecretChest: a one-time world chest hidden inside the Driftwood tackle hut.
//
// It holds the 20,000-coin "starter fortune" that lets a new angler reach the
// expedition fleet without grinding the first few hours. The opened flag is
// persisted so it can only be looted once per save (and resets on a full
// restart, just like the player's starting purse).

import * as THREE from 'three';
import { Interactable } from '../interaction/Interactable.js';

export class SecretChest extends Interactable {
  constructor(options = {}) {
    super({
      id: options.id || 'secret_chest_tackle_hut',
      name: options.name || "Old Angler's Chest",
      type: 'chest',
      promptAction: 'Open',
      interactionRange: options.interactionRange || 2.6,
      position: options.position || { x: -12.4, y: 0, z: 6.4 },
    });

    this.rewardCoins = options.rewardCoins !== undefined ? options.rewardCoins : 20000;
    this.rewardGems = options.rewardGems !== undefined ? options.rewardGems : 0;
    this.opened = Boolean(options.opened);
    this.onOpen = null;
    this.mesh = this._createMesh();
    this._applyOpenedVisual();
  }

  _createMesh() {
    const group = new THREE.Group();
    group.name = `SecretChest_${this.id}`;

    const woodMat = new THREE.MeshLambertMaterial({ color: 0x6b4a2a });
    const bandMat = new THREE.MeshLambertMaterial({ color: 0xd4af37 });
    const base = new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.62, 0.72), woodMat);
    base.position.y = 0.31;
    base.castShadow = true;
    group.add(base);

    const lid = new THREE.Mesh(new THREE.BoxGeometry(1.14, 0.26, 0.76), woodMat);
    lid.position.y = 0.75;
    lid.castShadow = true;
    group.add(lid);
    this.lidMesh = lid;

    for (const x of [-0.34, 0.34]) {
      const band = new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.66, 0.78), bandMat);
      band.position.set(x, 0.36, 0);
      group.add(band);
    }

    const lock = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.2, 0.08), bandMat);
    lock.position.set(0, 0.5, 0.4);
    group.add(lock);

    group.position.copy(this.position);
    return group;
  }

  _applyOpenedVisual() {
    if (this.lidMesh) {
      this.lidMesh.rotation.x = this.opened ? -0.85 : 0;
      this.lidMesh.position.y = this.opened ? 0.82 : 0.75;
    }
    this.promptAction = this.opened ? 'Opened' : 'Open';
    this.enabled = !this.opened;
  }

  getPromptText() {
    return this.opened ? `${this.name} (Empty)` : `Open ${this.name}`;
  }

  canInteract() {
    return !this.opened;
  }

  onInteract(player, context) {
    return this.open(player, context);
  }

  open(player = null, context = null) {
    if (this.opened) {
      return { success: false, reason: 'The chest is already empty' };
    }
    this.opened = true;
    this._applyOpenedVisual();

    const result = {
      success: true,
      chest: this,
      coins: this.rewardCoins,
      gems: this.rewardGems,
    };

    const economy = player && player.economy ? player.economy : null;
    if (economy) {
      if (this.rewardCoins > 0) economy.addCoins(this.rewardCoins);
      if (this.rewardGems > 0 && typeof economy.addGems === 'function') economy.addGems(this.rewardGems);
    }

    if (typeof this.onOpen === 'function') this.onOpen(result, player, context);
    return result;
  }

  reset() {
    this.opened = false;
    this._applyOpenedVisual();
  }

  serialize() {
    return { opened: this.opened };
  }

  deserialize(data = {}) {
    this.opened = Boolean(data.opened);
    this._applyOpenedVisual();
  }
}

export default SecretChest;
