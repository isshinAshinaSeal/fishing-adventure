// InventoryManager: Manages player fish bucket capacity, item storage, and fish encyclopedia records.

import { Config } from '../config.js';
import { FishDatabase } from '../fishing/FishDatabase.js';

export class InventoryManager {
  constructor(config = Config.inventory) {
    this.config = config || {};
    this.capacity = this.config.defaultCapacity || this.config.bucketCapacity || 10;
    this.bucket = [];
    this.encyclopedia = {}; // speciesId -> record

    // Optional expansion hook for external weight/slot limits.
    this.externalCapacityCheck = null;

    // Event hooks
    this.onChange = null;
  }

  /**
   * Adds caught fish to the bucket and records in encyclopedia.
   * Enforces acceptance test: Bucket capacity is strictly respected.
   */
  addFish(fish) {
    if (!fish) {
      return { success: false, reason: 'Invalid fish data' };
    }

    if (this.isFull()) {
      return { success: false, reason: 'Bucket is full' };
    }

    if (typeof this.externalCapacityCheck === 'function') {
      const check = this.externalCapacityCheck(fish, this);
      if (check && check.allowed === false) {
        return { success: false, reason: check.reason || 'Not enough carrying capacity' };
      }
    }

    // Preserve full fish data with unique instance identifier
    const fishInstance = {
      instanceId: fish.instanceId || `fish_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
      speciesId: fish.speciesId,
      name: fish.name,
      rarity: fish.rarity,
      weight: Number(fish.weight),
      value: Number(fish.value),
      icon: fish.icon,
      description: fish.description || '',
      caughtAt: fish.caughtAt || Date.now(),
    };

    this.bucket.push(fishInstance);
    this._recordToEncyclopedia(fishInstance);

    if (typeof this.onChange === 'function') {
      this.onChange(this.getState());
    }

    return { success: true, item: fishInstance };
  }

  /**
   * Removes specific fish by unique instanceId.
   */
  removeFish(instanceId) {
    const idx = this.bucket.findIndex((f) => f.instanceId === instanceId);
    if (idx !== -1) {
      const removed = this.bucket.splice(idx, 1)[0];
      if (typeof this.onChange === 'function') {
        this.onChange(this.getState());
      }
      return removed;
    }
    return null;
  }

  /**
   * Empties the bucket (e.g. when selling all fish at fish market).
   */
  clearBucket() {
    const cleared = [...this.bucket];
    this.bucket = [];
    if (typeof this.onChange === 'function') {
      this.onChange(this.getState());
    }
    return cleared;
  }

  /**
   * Returns whether the bucket has reached maximum capacity.
   */
  isFull() {
    return this.bucket.length >= this.capacity;
  }

  getCount() {
    return this.bucket.length;
  }

  getCapacity() {
    return this.capacity;
  }

  upgradeCapacity(newCapacity) {
    if (newCapacity > this.capacity) {
      this.capacity = newCapacity;
      if (typeof this.onChange === 'function') {
        this.onChange(this.getState());
      }
      return true;
    }
    return false;
  }

  getTotalWeight() {
    const sum = this.bucket.reduce((acc, f) => acc + (f.weight || 0), 0);
    return Number(sum.toFixed(2));
  }

  getTotalValue() {
    return this.bucket.reduce((acc, f) => acc + (f.value || 0), 0);
  }

  /**
   * Returns list of fish grouped by species for UI inventory display.
   */
  getGroupedBySpecies() {
    const grouped = {};
    for (const fish of this.bucket) {
      if (!grouped[fish.speciesId]) {
        grouped[fish.speciesId] = {
          speciesId: fish.speciesId,
          name: fish.name,
          rarity: fish.rarity,
          icon: fish.icon,
          count: 0,
          totalWeight: 0,
          totalValue: 0,
          items: [],
        };
      }
      grouped[fish.speciesId].count++;
      grouped[fish.speciesId].totalWeight += fish.weight;
      grouped[fish.speciesId].totalValue += fish.value;
      grouped[fish.speciesId].items.push(fish);
    }

    // Format totals
    for (const key of Object.keys(grouped)) {
      grouped[key].totalWeight = Number(grouped[key].totalWeight.toFixed(2));
    }

    return Object.values(grouped);
  }

  /**
   * Records a discovery without storing a physical fish. Used by boss
   * encounters and research discoveries so the index is never lost.
   */
  recordDiscovery(fish) {
    if (!fish || !fish.speciesId) return null;
    const existing = this.encyclopedia[fish.speciesId];
    if (existing) {
      existing.timesCaught = Math.max(1, existing.timesCaught || 1);
      return existing;
    }
    this.encyclopedia[fish.speciesId] = {
      speciesId: fish.speciesId,
      name: fish.name,
      rarity: fish.rarity,
      icon: fish.icon,
      discovered: true,
      firstCaughtAt: fish.caughtAt || Date.now(),
      timesCaught: 1,
      maxWeight: Number(fish.weight) || 0,
      minWeight: Number(fish.weight) || 0,
    };
    if (typeof this.onChange === 'function') this.onChange(this.getState());
    return this.encyclopedia[fish.speciesId];
  }

  /**
   * Updates player's personal catch records in the encyclopedia.
   */
  _recordToEncyclopedia(fish) {
    const spId = fish.speciesId;
    if (!this.encyclopedia[spId]) {
      this.encyclopedia[spId] = {
        speciesId: spId,
        name: fish.name,
        rarity: fish.rarity,
        icon: fish.icon,
        discovered: true,
        firstCaughtAt: fish.caughtAt || Date.now(),
        timesCaught: 1,
        maxWeight: fish.weight,
        minWeight: fish.weight,
      };
    } else {
      const entry = this.encyclopedia[spId];
      entry.timesCaught++;
      if (fish.weight > entry.maxWeight) entry.maxWeight = fish.weight;
      if (fish.weight < entry.minWeight) entry.minWeight = fish.weight;
    }
  }

  /**
   * Returns all known species in the game and whether player has discovered them.
   */
  getEncyclopediaData() {
    const allSpecies = FishDatabase.getExpandedSpecies();
    return allSpecies.map((species) => {
      const record = this.encyclopedia[species.id];
      if (record) {
        return {
          ...species,
          discovered: true,
          timesCaught: record.timesCaught,
          maxWeight: record.maxWeight,
          minWeight: record.minWeight,
          firstCaughtAt: record.firstCaughtAt,
        };
      }
      return {
        id: species.id,
        name: '???',
        rarity: species.rarity,
        icon: '❔',
        description: 'Species not yet discovered. Cast in new waters to discover!',
        habitat: species.habitat,
        weightRange: species.weightRange,
        basePrice: species.basePrice,
        discovered: false,
        timesCaught: 0,
      };
    });
  }

  getDiscoveryCount() {
    return Object.keys(this.encyclopedia).length;
  }

  getTotalSpeciesCount() {
    return FishDatabase.getExpandedSpecies().length;
  }

  getState() {
    return {
      count: this.bucket.length,
      capacity: this.capacity,
      isFull: this.isFull(),
      totalWeight: this.getTotalWeight(),
      totalValue: this.getTotalValue(),
      bucket: [...this.bucket],
      discoveredCount: this.getDiscoveryCount(),
      totalSpecies: this.getTotalSpeciesCount(),
    };
  }

  serialize() {
    return {
      capacity: this.capacity,
      bucket: [...this.bucket],
      encyclopedia: { ...this.encyclopedia },
    };
  }

  deserialize(data) {
    if (!data) return;
    if (data.capacity) this.capacity = Number(data.capacity);
    if (Array.isArray(data.bucket)) this.bucket = [...data.bucket];
    if (data.encyclopedia && typeof data.encyclopedia === 'object') {
      this.encyclopedia = { ...data.encyclopedia };
    }
  }

  reset() {
    this.bucket = [];
    this.encyclopedia = {};
  }
}

export default InventoryManager;
