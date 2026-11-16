// TreasureManager: buried and wreck treasures with compass hints, proximity
// discovery and persistent collection records.

import * as THREE from 'three';

const TREASURES = [
  { id: 'treasure_pier', name: 'Pier Salvage Crate', x: -20, z: -220, coins: 180, item: 'mat_rope' },
  { id: 'treasure_reef', name: 'Coral Wreck Chest', x: 205, z: -90, coins: 340, item: 'mat_coral' },
  { id: 'treasure_jungle', name: 'Jungle River Cache', x: -250, z: -10, coins: 260, item: 'mat_wood' },
  { id: 'treasure_frozen', name: 'Frozen Captain’s Lockbox', x: -190, z: -190, coins: 480, item: 'mat_crystal' },
  { id: 'treasure_volcano', name: 'Obsidian Strongbox', x: 185, z: -190, coins: 620, item: 'mat_ancient' },
  { id: 'treasure_ruins', name: 'Sunken Reliquary', x: 285, z: -250, coins: 820, item: 'mat_pearl' },
  { id: 'treasure_abyss', name: 'Abyssal Hoard', x: 330, z: -310, coins: 1200, item: 'mat_ancient' },
  { id: 'treasure_celestial', name: 'Celestial Offering', x: -70, z: -260, coins: 1500, item: 'mat_pearl' },
];

export class TreasureManager {
  constructor(options = {}) {
    this.treasures = TREASURES.map((t) => ({
      ...t,
      position: new THREE.Vector3(t.x, 0, t.z),
      claimed: false,
      mesh: null,
    }));
    this.scene = null;
    this.onClaim = null;
    this.onNotification = null;
  }

  attach(scene) {
    this.scene = scene;
    if (!scene) return;
    for (const treasure of this.treasures) {
      if (treasure.claimed || treasure.mesh) continue;
      const group = new THREE.Group();
      const chest = new THREE.Mesh(
        new THREE.BoxGeometry(1.4, 0.9, 1.0),
        new THREE.MeshLambertMaterial({ color: 0x6b3f1d })
      );
      chest.position.y = 0.55;
      group.add(chest);
      const lid = new THREE.Mesh(
        new THREE.BoxGeometry(1.45, 0.25, 1.05),
        new THREE.MeshLambertMaterial({ color: 0xd4af37 })
      );
      lid.position.y = 1.05;
      group.add(lid);
      const glow = new THREE.PointLight(0xffd166, 0.7, 8);
      glow.position.y = 1.4;
      group.add(glow);
      group.position.set(treasure.x, this._groundHeight(treasure.x, treasure.z), treasure.z);
      treasure.mesh = group;
      scene.add(group);
    }
  }

  _groundHeight(x, z) {
    // Approximate shoreline height; chests are intentionally visible markers.
    return Math.max(0.4, 2.2 - Math.max(0, (Math.abs(z) - 200)) * 0.02);
  }

  update(player, onAutoClaim = null) {
    if (!player) return null;
    for (const treasure of this.treasures) {
      if (treasure.claimed || !treasure.mesh) continue;
      const dist = Math.hypot(player.position.x - treasure.x, player.position.z - treasure.z);
      if (dist < 4.5) {
        treasure.claimed = true;
        if (treasure.mesh.parent) treasure.mesh.parent.remove(treasure.mesh);
        const result = { treasure, coins: treasure.coins, item: treasure.item };
        this._notify(`Treasure found: ${treasure.name} (+${treasure.coins} coins)`);
        if (typeof onAutoClaim === 'function') onAutoClaim(result);
        if (typeof this.onClaim === 'function') this.onClaim(result);
        return result;
      }
    }
    return null;
  }

  getNearestHint(playerPosition) {
    if (!playerPosition) return null;
    const remaining = this.treasures.filter((t) => !t.claimed);
    if (remaining.length === 0) return null;
    const nearest = remaining.reduce((best, t) => {
      const d = Math.hypot(t.x - playerPosition.x, t.z - playerPosition.z);
      return !best || d < best.distance ? { treasure: t, distance: d } : best;
    }, null);
    const dx = nearest.treasure.x - playerPosition.x;
    const dz = nearest.treasure.z - playerPosition.z;
    const direction = Math.abs(dx) > Math.abs(dz)
      ? (dx > 0 ? 'east' : 'west')
      : (dz > 0 ? 'south' : 'north');
    return {
      name: nearest.treasure.name,
      distance: nearest.distance,
      direction,
      position: { x: nearest.treasure.x, z: nearest.treasure.z },
    };
  }

  getCollection() {
    return this.treasures.map((t) => ({
      id: t.id,
      name: t.claimed ? t.name : 'Undiscovered Treasure',
      claimed: t.claimed,
      coins: t.coins,
    }));
  }

  serialize() {
    return this.treasures.map((t) => ({ id: t.id, claimed: t.claimed }));
  }

  deserialize(data) {
    if (!Array.isArray(data)) return;
    for (const saved of data) {
      const treasure = this.treasures.find((t) => t.id === saved.id);
      if (!treasure) continue;
      treasure.claimed = Boolean(saved.claimed);
      if (treasure.claimed && treasure.mesh && treasure.mesh.parent) {
        treasure.mesh.parent.remove(treasure.mesh);
      }
    }
  }

  reset() {
    for (const treasure of this.treasures) {
      treasure.claimed = false;
      if (treasure.mesh && this.scene && !treasure.mesh.parent) this.scene.add(treasure.mesh);
    }
  }

  _notify(message) {
    if (typeof this.onNotification === 'function') this.onNotification(message);
  }
}

export default TreasureManager;
