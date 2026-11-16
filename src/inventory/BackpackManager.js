// BackpackManager: real slot and weight enforcement, backpack upgrades,
// quick-use supplies, and integration with the fish bucket and cargo hold.

import { BackpackDefinitions, ConsumableDefinitions, MaterialDefinitions } from '../expansion/content.js';

const ALL_ITEMS = new Map();
for (const item of [...ConsumableDefinitions, ...MaterialDefinitions]) {
  ALL_ITEMS.set(item.id, item);
}

export function getBackpackDefinition(id) {
  return BackpackDefinitions.find((b) => b.id === id) || BackpackDefinitions[0];
}

export function getItemDefinition(id) {
  return ALL_ITEMS.get(id) || null;
}

export function getAllItemDefinitions() {
  return Array.from(ALL_ITEMS.values());
}

export class BackpackManager {
  constructor(options = {}) {
    this.ownedBackpackIds = new Set(['bag_small']);
    this.equippedBackpackId = 'bag_small';
    this.items = []; // { uid, itemId, qty }
    this.maxSlots = options.maxSlots || null;
    this.maxWeight = options.maxWeight || null;
    this.onChange = null;
    this._uid = 0;
  }

  getBackpack() {
    return getBackpackDefinition(this.equippedBackpackId);
  }

  getCapacitySlots() {
    return this.maxSlots || this.getBackpack().slots;
  }

  getCapacityWeight() {
    return this.maxWeight || this.getBackpack().weight;
  }

  getItemSlotsUsed() {
    return this.items.reduce((sum, stack) => sum + 1, 0);
  }

  getSlotsUsed(inventory = null) {
    return this.getItemSlotsUsed() + (inventory ? inventory.getCount() : 0);
  }

  getItemWeight() {
    return Number(this.items.reduce((sum, stack) => {
      const def = getItemDefinition(stack.itemId);
      return sum + (def ? def.weight * stack.qty : 0);
    }, 0).toFixed(2));
  }

  getTotalWeight(inventory = null) {
    return Number((this.getItemWeight() + (inventory ? inventory.getTotalWeight() : 0)).toFixed(2));
  }

  getLoad(inventory = null) {
    const weight = this.getTotalWeight(inventory);
    const capacityWeight = this.getCapacityWeight();
    const slots = this.getSlotsUsed(inventory);
    const capacitySlots = this.getCapacitySlots();
    const weightPercent = capacityWeight > 0 ? (weight / capacityWeight) * 100 : 0;
    const slotPercent = capacitySlots > 0 ? (slots / capacitySlots) * 100 : 0;
    let status = 'normal';
    let speedMultiplier = 1;
    if (weightPercent >= 100 || slotPercent >= 100) {
      status = 'overweight';
      speedMultiplier = 0;
    } else if (weightPercent >= 90) {
      status = 'heavy';
      speedMultiplier = 0.8;
    } else if (weightPercent >= 70) {
      status = 'light';
      speedMultiplier = 0.92;
    }
    return {
      weight,
      capacityWeight,
      slots,
      capacitySlots,
      weightPercent: Math.round(weightPercent),
      slotPercent: Math.round(slotPercent),
      status,
      speedMultiplier,
    };
  }

  /**
   * Checks whether an item stack can fit. `inventory` lets encumbrance include fish.
   */
  canAdd(itemId, qty = 1, inventory = null, extraWeight = 0) {
    const def = getItemDefinition(itemId);
    if (!def) return { allowed: false, reason: 'Unknown item' };
    const existing = this.items.find((s) => s.itemId === itemId && s.qty < (def.stack || 99));
    const newSlots = existing ? 0 : 1;
    const load = this.getLoad(inventory);
    if (load.slots + newSlots > load.capacitySlots) {
      return { allowed: false, reason: 'Backpack has no free slots' };
    }
    const addedWeight = def.weight * qty + extraWeight;
    if (load.weight + addedWeight > load.capacityWeight) {
      return { allowed: false, reason: `Backpack overweight (${(load.weight + addedWeight).toFixed(1)} / ${load.capacityWeight} kg)` };
    }
    return { allowed: true };
  }

  addItem(itemId, qty = 1, inventory = null) {
    const def = getItemDefinition(itemId);
    const count = Math.max(1, Math.floor(Number(qty) || 1));
    const check = this.canAdd(itemId, count, inventory);
    if (!check.allowed) return { success: false, reason: check.reason };

    let remaining = count;
    const maxStack = def.stack || 99;
    for (const stack of this.items) {
      if (remaining <= 0) break;
      if (stack.itemId !== itemId || stack.qty >= maxStack) continue;
      const room = maxStack - stack.qty;
      const moved = Math.min(room, remaining);
      stack.qty += moved;
      remaining -= moved;
    }
    while (remaining > 0) {
      const batch = Math.min(maxStack, remaining);
      this.items.push({ uid: `item_${++this._uid}`, itemId, qty: batch });
      remaining -= batch;
    }
    this._changed();
    return { success: true, itemId, qty: count };
  }

  removeItem(itemId, qty = 1) {
    let remaining = Math.max(1, Math.floor(Number(qty) || 1));
    let removed = 0;
    for (let i = this.items.length - 1; i >= 0 && remaining > 0; i--) {
      const stack = this.items[i];
      if (stack.itemId !== itemId) continue;
      const take = Math.min(stack.qty, remaining);
      stack.qty -= take;
      removed += take;
      remaining -= take;
      if (stack.qty <= 0) this.items.splice(i, 1);
    }
    if (removed > 0) this._changed();
    return removed;
  }

  getCount(itemId) {
    return this.items.filter((i) => i.itemId === itemId).reduce((sum, i) => sum + i.qty, 0);
  }

  has(itemId, qty = 1) {
    return this.getCount(itemId) >= qty;
  }

  getItems(category = null) {
    return this.items
      .map((stack) => ({ ...stack, def: getItemDefinition(stack.itemId) }))
      .filter((stack) => stack.def && (!category || stack.def.category === category));
  }

  getConsumables() {
    return this.getItems('consumable');
  }

  purchaseBackpack(id, economy) {
    const def = BackpackDefinitions.find((b) => b.id === id);
    if (!def) return { success: false, reason: 'Unknown backpack' };
    if (this.ownedBackpackIds.has(id)) return { success: false, reason: 'Backpack already owned' };
    if (!economy || !economy.canAfford(def.cost)) return { success: false, reason: `Need ${def.cost} coins` };
    if (!economy.spendCoins(def.cost)) return { success: false, reason: 'Transaction failed' };
    this.ownedBackpackIds.add(id);
    this.equippedBackpackId = id;
    this._changed();
    return { success: true, backpack: def, newBalance: economy.getCoins() };
  }

  equipBackpack(id) {
    if (!this.ownedBackpackIds.has(id)) return { success: false, reason: 'Backpack not owned' };
    this.equippedBackpackId = id;
    this._changed();
    return { success: true, backpack: getBackpackDefinition(id) };
  }

  getCatalog() {
    const equipped = this.getBackpack();
    return BackpackDefinitions.map((b) => ({
      ...b,
      isOwned: this.ownedBackpackIds.has(b.id),
      isEquipped: b.id === equipped.id,
      isNext: b.slots > equipped.slots,
    }));
  }

  serialize() {
    return {
      ownedBackpackIds: Array.from(this.ownedBackpackIds),
      equippedBackpackId: this.equippedBackpackId,
      items: this.items.map((i) => ({ uid: i.uid, itemId: i.itemId, qty: i.qty })),
      uid: this._uid,
    };
  }

  deserialize(data) {
    if (!data) return;
    this.ownedBackpackIds = new Set(Array.isArray(data.ownedBackpackIds) ? data.ownedBackpackIds : ['bag_small']);
    this.equippedBackpackId = data.equippedBackpackId || 'bag_small';
    this.items = Array.isArray(data.items) ? data.items.map((i) => ({ ...i })) : [];
    this._uid = data.uid || this.items.length;
  }

  reset() {
    this.ownedBackpackIds = new Set(['bag_small']);
    this.equippedBackpackId = 'bag_small';
    this.items = [];
    this._uid = 0;
  }

  _changed() {
    if (typeof this.onChange === 'function') this.onChange(this.getLoad());
  }
}

export class CargoManager {
  constructor() {
    this.cargo = {}; // boatId -> { fish: [], items: { itemId: qty } }
    this.classCapacity = {
      rowboat: 50, dinghy: 70, skiff: 100, trawler: 150, catamaran: 120,
      yacht: 400, steamer: 500, pirate: 500, coral: 350, icebreaker: 420, submarine: 300,
    };
  }

  _ensure(boatId) {
    if (!this.cargo[boatId]) this.cargo[boatId] = { fish: [], items: {} };
    return this.cargo[boatId];
  }

  getCapacity(boat) {
    if (!boat) return 100;
    const id = String(boat.id || '');
    for (const [key, cap] of Object.entries(this.classCapacity)) {
      if (id.includes(key)) return cap + ((boat.upgradeLevels?.storage || 0) * 50);
    }
    return Math.max(100, (boat.storageCapacity || 15) * 10);
  }

  getUsedWeight(boat) {
    const cargo = this._ensure(boat ? boat.id : 'none');
    const fishWeight = cargo.fish.reduce((sum, f) => sum + (Number(f.weight) || 0), 0);
    const itemWeight = Object.entries(cargo.items).reduce((sum, [id, qty]) => {
      const def = getItemDefinition(id);
      return sum + (def ? def.weight * qty : 0);
    }, 0);
    return Number((fishWeight + itemWeight).toFixed(2));
  }

  getState(boat) {
    if (!boat) return { fish: [], items: {}, usedWeight: 0, capacity: 0, percent: 0 };
    const cargo = this._ensure(boat.id);
    const usedWeight = this.getUsedWeight(boat);
    const capacity = this.getCapacity(boat);
    return {
      boatId: boat.id,
      fish: [...cargo.fish],
      items: { ...cargo.items },
      usedWeight,
      capacity,
      percent: capacity ? Math.round((usedWeight / capacity) * 100) : 0,
    };
  }

  depositFish(boat, inventory, instanceId) {
    if (!boat || !inventory) return { success: false, reason: 'No active ship or inventory' };
    const fish = inventory.bucket.find((f) => f.instanceId === instanceId);
    if (!fish) return { success: false, reason: 'Fish not found in bucket' };
    if (this.getUsedWeight(boat) + Number(fish.weight || 0) > this.getCapacity(boat)) {
      return { success: false, reason: 'Ship cargo is full' };
    }
    inventory.removeFish(instanceId);
    this._ensure(boat.id).fish.push(fish);
    return { success: true, fish };
  }

  withdrawFish(boat, inventory, instanceId) {
    if (!boat || !inventory) return { success: false, reason: 'No active ship or inventory' };
    const cargo = this._ensure(boat.id);
    const idx = cargo.fish.findIndex((f) => f.instanceId === instanceId);
    if (idx < 0) return { success: false, reason: 'Fish not in cargo' };
    const fish = cargo.fish[idx];
    const added = inventory.addFish(fish);
    if (!added.success) return { success: false, reason: added.reason };
    cargo.fish.splice(idx, 1);
    return { success: true, fish };
  }

  depositItem(boat, backpack, itemId, qty = 1) {
    if (!boat || !backpack) return { success: false, reason: 'No active ship or backpack' };
    const def = getItemDefinition(itemId);
    if (!def) return { success: false, reason: 'Unknown item' };
    const have = backpack.getCount(itemId);
    const count = Math.min(have, Math.max(1, Math.floor(qty)));
    if (count <= 0) return { success: false, reason: 'None in backpack' };
    if (this.getUsedWeight(boat) + def.weight * count > this.getCapacity(boat)) {
      return { success: false, reason: 'Ship cargo is full' };
    }
    backpack.removeItem(itemId, count);
    const cargo = this._ensure(boat.id);
    cargo.items[itemId] = (cargo.items[itemId] || 0) + count;
    return { success: true, itemId, qty: count };
  }

  withdrawItem(boat, backpack, itemId, qty = 1) {
    if (!boat || !backpack) return { success: false, reason: 'No active ship or backpack' };
    const cargo = this._ensure(boat.id);
    const have = cargo.items[itemId] || 0;
    const count = Math.min(have, Math.max(1, Math.floor(qty)));
    if (count <= 0) return { success: false, reason: 'None in cargo' };
    const added = backpack.addItem(itemId, count, null);
    if (!added.success) return { success: false, reason: added.reason };
    cargo.items[itemId] -= count;
    if (cargo.items[itemId] <= 0) delete cargo.items[itemId];
    return { success: true, itemId, qty: count };
  }

  serialize() {
    return JSON.parse(JSON.stringify(this.cargo));
  }

  deserialize(data) {
    this.cargo = data && typeof data === 'object' ? JSON.parse(JSON.stringify(data)) : {};
  }

  reset() {
    this.cargo = {};
  }
}

export default BackpackManager;
