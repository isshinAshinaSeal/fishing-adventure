// ConsumableManager: timed gameplay buffs, per-item cooldowns, instant
// consumable effects, cooking/crafting recipes, and quick-use support.

import {
  ConsumableDefinitions,
  RecipeDefinitions,
  MaterialDefinitions,
} from '../expansion/content.js';

export const MAX_ACTIVE_BUFFS = 4;

const ITEM_MAP = new Map([
  ...ConsumableDefinitions.map((i) => [i.id, i]),
  ...MaterialDefinitions.map((i) => [i.id, i]),
]);

export class ConsumableManager {
  constructor() {
    this.activeBuffs = []; // { key, value, name, icon, remaining, duration }
    this.cooldowns = {}; // itemId -> seconds remaining
    this.onNotification = null;
    this.onChange = null;
  }

  getItem(id) {
    return ITEM_MAP.get(id) || null;
  }

  getCatalog(category = 'consumable') {
    return Array.from(ITEM_MAP.values()).filter((i) => !category || i.category === category);
  }

  getActiveBuffs() {
    return this.activeBuffs.map((b) => ({ ...b }));
  }

  getCooldown(itemId) {
    return Number((this.cooldowns[itemId] || 0).toFixed(1));
  }

  /**
   * Applies an already paid-for item. Consumables are removed by the caller.
   */
  applyItem(itemId, context = {}) {
    const def = this.getItem(itemId);
    if (!def) return { success: false, reason: 'Unknown item' };
    if (this.getCooldown(itemId) > 0) {
      return { success: false, reason: `${def.name} is cooling down (${this.getCooldown(itemId)}s)` };
    }

    const result = this._resolveEffect(def, itemId, context);
    if (!result.success) return result;

    if (def.cooldown) this.cooldowns[itemId] = def.cooldown;
    this._changed();
    return { success: true, item: def, effect: result.effect };
  }

  useFromBackpack(itemId, context = {}) {
    const backpack = context.backpack;
    if (!backpack || backpack.getCount(itemId) <= 0) {
      return { success: false, reason: 'Item is not in your backpack' };
    }
    const result = this.applyItem(itemId, context);
    if (result.success) backpack.removeItem(itemId, 1);
    return result;
  }

  buy(itemId, economy, backpack, inventory = null) {
    const def = this.getItem(itemId);
    if (!def) return { success: false, reason: 'Unknown item' };
    if (!economy || !economy.canAfford(def.price)) return { success: false, reason: `Need ${def.price} coins` };
    const check = backpack.canAdd(itemId, 1, inventory);
    if (!check.allowed) return { success: false, reason: check.reason };
    if (!economy.spendCoins(def.price)) return { success: false, reason: 'Transaction failed' };
    backpack.addItem(itemId, 1, inventory);
    return { success: true, item: def, newBalance: economy.getCoins() };
  }

  craft(recipeId, context = {}) {
    const recipe = RecipeDefinitions.find((r) => r.id === recipeId);
    if (!recipe) return { success: false, reason: 'Unknown recipe' };
    const { inventory, backpack, economy } = context;
    if (!backpack || !inventory) return { success: false, reason: 'Missing inventory' };
    if (recipe.coins && economy && !economy.canAfford(recipe.coins)) {
      return { success: false, reason: `Need ${recipe.coins} coins` };
    }
    if (!backpack.canAdd(recipe.output, recipe.outputQty, inventory).allowed) {
      return { success: false, reason: backpack.canAdd(recipe.output, recipe.outputQty, inventory).reason };
    }

    if (recipe.fish && recipe.fish.length) {
      const available = recipe.fish.find((speciesId) => inventory.bucket.some((f) => f.speciesId === speciesId));
      if (!available) return { success: false, reason: `Requires a caught ${recipe.fish.join(' or ')}` };
      const rare = inventory.bucket.some((f) => recipe.fish.includes(f.speciesId) && ['Legendary', 'Mythical', 'Celestial', 'Ancient', 'Abyssal'].includes(f.rarity));
      if (rare && !context.confirmRare) {
        return { success: false, requiresConfirmation: true, reason: 'This recipe uses a rare fish. Confirm to consume it.' };
      }
      const fish = inventory.bucket.find((f) => f.speciesId === available);
      inventory.removeFish(fish.instanceId);
    } else if (recipe.material) {
      if (backpack.getCount(recipe.material) < recipe.materialQty) {
        return { success: false, reason: `Requires ${recipe.materialQty} ${recipe.material}` };
      }
      backpack.removeItem(recipe.material, recipe.materialQty);
    } else if (recipe.materials && typeof recipe.materials === 'object') {
      // Multi-material recipes: validate the whole ingredient list before any
      // item is removed so a failed craft never consumes partial materials.
      const entries = Object.entries(recipe.materials);
      for (const [itemId, qty] of entries) {
        const needed = Math.max(1, Math.floor(Number(qty) || 1));
        if (backpack.getCount(itemId) < needed) {
          const def = this.getItem(itemId);
          return { success: false, reason: `Requires ${needed} × ${def ? def.name : itemId}` };
        }
      }
      for (const [itemId, qty] of entries) {
        backpack.removeItem(itemId, Math.max(1, Math.floor(Number(qty) || 1)));
      }
    }

    if (recipe.coins && economy) {
      if (!economy.canAfford(recipe.coins)) return { success: false, reason: `Need ${recipe.coins} coins` };
      economy.spendCoins(recipe.coins);
    }

    const add = backpack.addItem(recipe.output, recipe.outputQty, inventory);
    if (!add.success) return { success: false, reason: add.reason };
    this.cooldowns[recipe.output] = this.cooldowns[recipe.output] || 0;
    this._changed();
    return { success: true, recipe, output: recipe.output, qty: recipe.outputQty };
  }

  getRecipes() {
    return RecipeDefinitions.map((r) => ({ ...r }));
  }

  update(dt) {
    let changed = false;
    for (const [id, remaining] of Object.entries(this.cooldowns)) {
      const next = Math.max(0, remaining - dt);
      if (next === 0) {
        delete this.cooldowns[id];
        changed = true;
      } else {
        this.cooldowns[id] = next;
      }
    }
    for (let i = this.activeBuffs.length - 1; i >= 0; i--) {
      const buff = this.activeBuffs[i];
      buff.remaining = Math.max(0, buff.remaining - dt);
      if (buff.remaining <= 0) {
        this.activeBuffs.splice(i, 1);
        changed = true;
        this._notify(`${buff.name} expired`);
      }
    }
    if (changed) this._changed();
  }

  getModifier(key) {
    return this.activeBuffs
      .filter((b) => b.key === key)
      .reduce((sum, b) => sum + Number(b.value || 0), 0);
  }

  getFishingModifier(key) {
    if (key === 'luck') return this.getModifier('luck');
    if (key === 'reel') return this.getModifier('reel');
    if (key === 'attract') return this.getModifier('attract');
    return 0;
  }

  getSpeedMultiplier() {
    return 1 + this.getModifier('speed');
  }

  _addBuff(def, itemId) {
    const buffDef = def.buff;
    if (!buffDef) return true;
    if (this.activeBuffs.length >= MAX_ACTIVE_BUFFS && !this.activeBuffs.find((b) => b.key === buffDef.key)) {
      const oldest = this.activeBuffs.shift();
      this._notify(`${oldest.name} faded to make room for ${buffDef.name}`);
    }
    const existing = this.activeBuffs.find((b) => b.key === buffDef.key);
    if (existing) {
      existing.remaining = buffDef.duration;
      existing.duration = buffDef.duration;
      existing.value = buffDef.value;
    } else {
      this.activeBuffs.push({
        key: buffDef.key,
        value: buffDef.value,
        name: buffDef.name,
        icon: def.icon,
        itemId,
        remaining: buffDef.duration,
        duration: buffDef.duration,
      });
    }
    this._notify(`${buffDef.name} active for ${buffDef.duration}s`);
    return true;
  }

  _resolveEffect(def, itemId, context) {
    const { player, fishingSystem, boat, cannonManager, mountManager, game } = context;

    if (def.buff && def.duration > 0) {
      this._addBuff(def, itemId);
      if (def.buff.key === 'weather' && game) game.activeWeather = 'aurora';
      return { success: true, effect: 'buff' };
    }

    switch (def.effect) {
      case 'bait_ocean':
        if (!fishingSystem || !fishingSystem.setBait('shrimp')) return { success: false, reason: 'No bait system available' };
        this._notify('Ocean bait equipped');
        return { success: true, effect: 'bait' };
      case 'bait_deep':
        if (!fishingSystem || !fishingSystem.setBait('deep_sea')) return { success: false, reason: 'No bait system available' };
        this._notify('Deep-sea bait equipped');
        return { success: true, effect: 'bait' };
      case 'stamina':
        if (player && typeof player.restoreStamina === 'function') player.restoreStamina(35);
        if (mountManager && mountManager.activeMount) {
          mountManager.activeMount.stamina = Math.min(mountManager.activeMount.staminaMax, mountManager.activeMount.stamina + 25);
        }
        this._notify('Stamina restored');
        return { success: true, effect: 'stamina' };
      case 'heal':
        if (!player) return { success: false, reason: 'No player' };
        player.health = Math.min(player.maxHealth || 100, (player.health || 100) + 45);
        this._notify('Health restored');
        return { success: true, effect: 'heal' };
      case 'repair_ship': {
        const ship = boat || (game && game.boatManager ? game.boatManager.getActiveBoat() : null);
        if (!ship) return { success: false, reason: 'No active ship to repair' };
        ship.health = Math.min(ship.maxHealth, ship.health + 60);
        this._notify(`Hull repaired to ${Math.round(ship.health)} / ${ship.maxHealth}`);
        return { success: true, effect: 'repair' };
      }
      case 'ammo': {
        if (!cannonManager) return { success: false, reason: 'No cannon system available' };
        cannonManager.addAmmo('standard', 6);
        this._notify('Cannon ammunition restocked (+6)');
        return { success: true, effect: 'ammo' };
      }
      case 'compass': {
        if (!game || !game.treasureManager) return { success: false, reason: 'No treasure chart available' };
        const hint = game.treasureManager.getNearestHint(player ? player.position : null);
        if (!hint) return { success: false, reason: 'No treasure remains undiscovered' };
        this._notify(`Treasure: ${hint.distance.toFixed(0)}m ${hint.direction} — ${hint.name}`);
        return { success: true, effect: 'compass' };
      }
      default:
        return { success: false, reason: 'This item has no usable effect here' };
    }
  }

  _notify(message) {
    if (typeof this.onNotification === 'function') this.onNotification(message);
  }

  _changed() {
    if (typeof this.onChange === 'function') this.onChange();
  }

  serialize() {
    return {
      activeBuffs: this.activeBuffs.map((b) => ({ ...b })),
      cooldowns: { ...this.cooldowns },
    };
  }

  deserialize(data) {
    if (!data) return;
    this.activeBuffs = Array.isArray(data.activeBuffs) ? data.activeBuffs.map((b) => ({ ...b })) : [];
    this.cooldowns = data.cooldowns && typeof data.cooldowns === 'object' ? { ...data.cooldowns } : {};
  }

  reset() {
    this.activeBuffs = [];
    this.cooldowns = {};
  }
}

export default ConsumableManager;
