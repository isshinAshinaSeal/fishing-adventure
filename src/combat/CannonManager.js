// CannonManager: cannon collection, upgrades, ammunition, aiming modes,
// reload timing, deck integration and visible firing effects.

import * as THREE from 'three';
import {
  CannonDefinitions,
  CannonUpgradeBranches,
  AmmoDefinitions,
} from '../expansion/content.js';

export class CannonManager {
  constructor(options = {}) {
    this.ownedCannonIds = new Set(['cannon_basic']);
    this.equippedCannonId = 'cannon_basic';
    this.upgrades = { cannon_basic: {} };
    this.ammo = { standard: 30, frost: 4, shock: 3, coral: 2 };
    this.selectedAmmo = 'standard';
    this.mode = 'assisted';
    this.aimAngle = 0;
    this.reloadRemaining = 0;
    this.isAiming = false;
    this.boat = null;
    this.scene = null;
    this.cannonMesh = null;
    this.tracers = [];
    this.onNotification = null;
    this.crewBonusProvider = null;
    this.onChange = null;
    this._muzzleFlash = null;
  }

  getCannon(id = this.equippedCannonId) {
    return CannonDefinitions.find((c) => c.id === id) || null;
  }

  getCatalog() {
    return CannonDefinitions.map((cannon) => ({
      ...cannon,
      isOwned: this.ownedCannonIds.has(cannon.id),
      isEquipped: cannon.id === this.equippedCannonId,
      upgradeLevel: this._totalUpgradeLevels(cannon.id),
      upgrades: this.getUpgrades(cannon.id),
    }));
  }

  getUpgrades(cannonId = this.equippedCannonId) {
    const levels = this.upgrades[cannonId] || {};
    return CannonUpgradeBranches.map((branch) => {
      const level = levels[branch.id] || 0;
      return {
        ...branch,
        level,
        isMax: level >= branch.maxLevel,
        cost: level >= branch.maxLevel ? null : branch.baseCost + branch.perLevelCost * level,
      };
    });
  }

  _totalUpgradeLevels(cannonId) {
    return Object.values(this.upgrades[cannonId] || {}).reduce((a, b) => a + b, 0);
  }

  getStats(cannonId = this.equippedCannonId) {
    const cannon = this.getCannon(cannonId);
    if (!cannon) return null;
    const levels = this.upgrades[cannonId] || {};
    const crewReload = this.crewBonusProvider ? this.crewBonusProvider('reload') : 0;
    const crewAccuracy = this.crewBonusProvider ? this.crewBonusProvider('accuracy') : 0;
    return {
      ...cannon,
      damage: Math.round(cannon.damage * (1 + (levels.impact || 0) * 0.08) * 10) / 10,
      reload: Math.max(0.55, cannon.reload * (1 - (levels.reload || 0) * 0.07) * (1 - crewReload)),
      accuracy: Math.min(0.98, cannon.accuracy + (levels.precision || 0) * 0.05 + crewAccuracy),
      stability: (levels.stability || 0) * 0.08,
      specialization: levels.specialization || 0,
      upgradeLevel: this._totalUpgradeLevels(cannonId),
      upgrades: { ...levels },
    };
  }

  purchaseCannon(id, economy) {
    const cannon = this.getCannon(id);
    if (!cannon) return { success: false, reason: 'Unknown cannon' };
    if (this.ownedCannonIds.has(id)) return { success: false, reason: 'Cannon already owned' };
    if (!economy || !economy.canAfford(cannon.cost)) return { success: false, reason: `Need ${cannon.cost} coins` };
    if (!economy.spendCoins(cannon.cost)) return { success: false, reason: 'Transaction failed' };
    this.ownedCannonIds.add(id);
    this.upgrades[id] = this.upgrades[id] || {};
    this._notify(`${cannon.name} installed`);
    this._changed();
    return { success: true, cannon, newBalance: economy.getCoins() };
  }

  equipCannon(id) {
    if (!this.ownedCannonIds.has(id)) return { success: false, reason: 'Cannon not owned' };
    this.equippedCannonId = id;
    this._rebuildCannonMesh();
    this._changed();
    return { success: true, cannon: this.getCannon(id), stats: this.getStats(id) };
  }

  purchaseUpgrade(cannonId, branchId, economy) {
    if (!this.ownedCannonIds.has(cannonId)) return { success: false, reason: 'Install this cannon first' };
    const branch = CannonUpgradeBranches.find((b) => b.id === branchId);
    if (!branch) return { success: false, reason: 'Unknown upgrade branch' };
    const levels = this.upgrades[cannonId] || {};
    const level = levels[branchId] || 0;
    if (level >= branch.maxLevel) return { success: false, reason: 'Upgrade already maxed' };
    const cost = branch.baseCost + branch.perLevelCost * level;
    if (!economy || !economy.canAfford(cost)) return { success: false, reason: `Need ${cost} coins` };
    if (!economy.spendCoins(cost)) return { success: false, reason: 'Transaction failed' };
    levels[branchId] = level + 1;
    this.upgrades[cannonId] = levels;
    this._notify(`${branch.name} upgraded to level ${level + 1}`);
    this._changed();
    return { success: true, branchId, level: level + 1, cost, stats: this.getStats(cannonId) };
  }

  getAmmo() {
    return AmmoDefinitions.map((ammo) => ({
      ...ammo,
      count: this.ammo[ammo.id] || 0,
      isSelected: this.selectedAmmo === ammo.id,
    }));
  }

  addAmmo(type, qty) {
    if (!AmmoDefinitions.find((a) => a.id === type)) return false;
    this.ammo[type] = (this.ammo[type] || 0) + qty;
    this._changed();
    return true;
  }

  selectAmmo(type) {
    if (!AmmoDefinitions.find((a) => a.id === type)) return { success: false, reason: 'Unknown ammunition' };
    if ((this.ammo[type] || 0) <= 0) return { success: false, reason: 'No rounds of that type' };
    this.selectedAmmo = type;
    return { success: true, type };
  }

  toggleMode() {
    this.mode = this.mode === 'assisted' ? 'manual' : 'assisted';
    return this.mode;
  }

  aim(deltaRadians) {
    this.aimAngle += deltaRadians;
    this.aimAngle = ((this.aimAngle + Math.PI) % (Math.PI * 2) + Math.PI * 2) % (Math.PI * 2) - Math.PI;
    return this.aimAngle;
  }

  attachToBoat(boat, scene = null) {
    this.boat = boat;
    this.scene = scene;
    this._rebuildCannonMesh();
  }

  _rebuildCannonMesh() {
    if (this.cannonMesh && this.cannonMesh.parent) {
      this.cannonMesh.parent.remove(this.cannonMesh);
    }
    if (!this.boat || !this.boat.mesh) return;
    const cannon = this.getCannon();
    const group = new THREE.Group();
    group.name = 'DeckCannon';
    const metalMat = new THREE.MeshStandardMaterial({
      color: cannon.rarity === 'Legendary' ? 0xd4af37 : cannon.rarity === 'Mythical' ? 0x59e3ff : 0x3a3f47,
      metalness: 0.75,
      roughness: 0.35,
    });
    const base = new THREE.Mesh(new THREE.CylinderGeometry(0.26, 0.32, 0.22, 10), metalMat);
    base.position.y = 0.45;
    group.add(base);
    const barrel = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.15, 1.0, 10), metalMat);
    barrel.rotation.x = Math.PI / 2;
    barrel.position.set(0, 0.62, 0.42);
    group.add(barrel);
    const muzzle = new THREE.Mesh(new THREE.TorusGeometry(0.16, 0.035, 6, 12), metalMat);
    muzzle.position.set(0, 0.62, 0.92);
    group.add(muzzle);
    group.position.set(1.0, 0.2, 0.2);
    this.boat.mesh.add(group);
    this.cannonMesh = group;
    this._muzzleFlash = new THREE.PointLight(0xffb347, 0, 8);
    this._muzzleFlash.position.set(1.0, 0.82, 0.9);
    this.boat.mesh.add(this._muzzleFlash);
  }

  update(dt) {
    if (this.reloadRemaining > 0) {
      this.reloadRemaining = Math.max(0, this.reloadRemaining - dt);
    }
    if (this.cannonMesh) {
      const desiredYaw = this.isAiming ? this.aimAngle : 0;
      this.cannonMesh.rotation.y += (desiredYaw - this.cannonMesh.rotation.y) * Math.min(1, dt * 5);
    }
    if (this._muzzleFlash) {
      this._muzzleFlash.intensity = Math.max(0, this._muzzleFlash.intensity - dt * 20);
    }
    for (let i = this.tracers.length - 1; i >= 0; i--) {
      const t = this.tracers[i];
      t.life -= dt;
      if (t.life <= 0) {
        if (t.mesh.parent) t.mesh.parent.remove(t.mesh);
        this.tracers.splice(i, 1);
        continue;
      }
      t.mesh.position.lerpVectors(t.from, t.to, 1 - t.life / t.maxLife);
      if (t.mesh.material) t.mesh.material.opacity = Math.min(1, t.life * 2.5);
    }
  }

  canFire() {
    const stats = this.getStats();
    return {
      allowed: this.reloadRemaining <= 0 && (this.ammo[this.selectedAmmo] || 0) > 0,
      reason: this.reloadRemaining > 0
        ? `Reloading ${this.reloadRemaining.toFixed(1)}s`
        : (this.ammo[this.selectedAmmo] || 0) <= 0
          ? 'Out of ammunition'
          : null,
      stats,
    };
  }

  /**
   * Fires at a target angle. Manual aim has a wider error cone; assisted aim
   * nudges toward the boss by the cannon's accuracy stat.
   */
  fire(targetAngle, targetPosition = null) {
    const check = this.canFire();
    if (!check.allowed) return { success: false, reason: check.reason };
    const stats = check.stats;
    const ammoDef = AmmoDefinitions.find((a) => a.id === this.selectedAmmo);
    let angle = this.aimAngle;
    if (this.mode === 'assisted' && targetAngle !== null && targetAngle !== undefined) {
      const error = (1 - stats.accuracy) * (Math.random() - 0.5) * 0.8;
      angle = targetAngle + error;
      this.aimAngle = angle;
    }
    const diff = Math.abs(((targetAngle || 0) - angle + Math.PI) % (Math.PI * 2) - Math.PI);
    const tolerance = this.mode === 'assisted' ? 0.25 + stats.accuracy * 0.18 : 0.13;
    const hit = targetAngle === null || targetAngle === undefined ? true : diff <= tolerance;
    const damage = hit
      ? stats.damage * (ammoDef ? ammoDef.damageMul : 1) * (0.85 + Math.random() * 0.3)
      : 0;

    this.ammo[this.selectedAmmo] = Math.max(0, (this.ammo[this.selectedAmmo] || 0) - 1);
    this.reloadRemaining = stats.reload;
    if (this._muzzleFlash) this._muzzleFlash.intensity = 2.8;

    if (targetPosition && this.boat && this.scene) {
      const from = this.boat.position.clone();
      from.y += 1.0;
      const to = new THREE.Vector3(targetPosition.x, targetPosition.y ?? 0, targetPosition.z);
      const color = this.selectedAmmo === 'frost' ? 0x8be9ff : this.selectedAmmo === 'shock' ? 0xb07cff : this.selectedAmmo === 'ancient' ? 0x9bd3a2 : 0xffb347;
      const tracer = new THREE.Mesh(
        new THREE.SphereGeometry(0.18, 6, 6),
        new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 1 })
      );
      tracer.position.copy(from);
      this.scene.add(tracer);
      this.tracers.push({ mesh: tracer, from, to, life: 0.35, maxLife: 0.35 });
    }

    this._changed();
    return {
      success: true,
      hit,
      damage: Math.round(damage * 10) / 10,
      ammo: this.selectedAmmo,
      ammoDef,
      reload: stats.reload,
      mode: this.mode,
      aimError: Number(diff.toFixed(3)),
      remainingAmmo: this.ammo[this.selectedAmmo],
    };
  }

  serialize() {
    return {
      ownedCannonIds: Array.from(this.ownedCannonIds),
      equippedCannonId: this.equippedCannonId,
      upgrades: JSON.parse(JSON.stringify(this.upgrades)),
      ammo: { ...this.ammo },
      selectedAmmo: this.selectedAmmo,
      mode: this.mode,
    };
  }

  deserialize(data) {
    if (!data) return;
    this.ownedCannonIds = new Set(Array.isArray(data.ownedCannonIds) && data.ownedCannonIds.length ? data.ownedCannonIds : ['cannon_basic']);
    this.equippedCannonId = this.ownedCannonIds.has(data.equippedCannonId) ? data.equippedCannonId : 'cannon_basic';
    this.upgrades = data.upgrades && typeof data.upgrades === 'object' ? JSON.parse(JSON.stringify(data.upgrades)) : { cannon_basic: {} };
    this.ammo = data.ammo && typeof data.ammo === 'object' ? { ...data.ammo } : { standard: 30 };
    this.selectedAmmo = data.selectedAmmo || 'standard';
    this.mode = data.mode === 'manual' ? 'manual' : 'assisted';
  }

  reset() {
    this.ownedCannonIds = new Set(['cannon_basic']);
    this.equippedCannonId = 'cannon_basic';
    this.upgrades = { cannon_basic: {} };
    this.ammo = { standard: 30, frost: 4, shock: 3, coral: 2 };
    this.selectedAmmo = 'standard';
    this.mode = 'assisted';
    this.aimAngle = 0;
    this.reloadRemaining = 0;
    this.isAiming = false;
  }

  _notify(message) {
    if (typeof this.onNotification === 'function') this.onNotification(message);
  }

  _changed() {
    if (typeof this.onChange === 'function') this.onChange();
  }
}

export default CannonManager;
