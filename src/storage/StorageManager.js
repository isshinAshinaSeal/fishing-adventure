// StorageManager: Handles long-term fish storage chest capacity and transfers to/from player bucket.

import { Config } from '../config.js';

export class StorageManager {
  constructor(config = Config.storage) {
    this.config = config || {};
    this.capacity = this.config.chestCapacity || 50;
    this.storedFish = [];

    this.onChange = null;
  }

  isFull() {
    return this.storedFish.length >= this.capacity;
  }

  getCount() {
    return this.storedFish.length;
  }

  getCapacity() {
    return this.capacity;
  }

  getStoredFish() {
    return [...this.storedFish];
  }

  /**
   * Transfers a fish from the player's bucket into the storage chest.
   * Enforces acceptance test: Fish can be moved from bucket to storage.
   */
  storeFishFromBucket(inventory, instanceId) {
    if (!inventory || !instanceId) {
      return { success: false, reason: 'Invalid parameters' };
    }
    if (this.isFull()) {
      return { success: false, reason: 'Storage chest is full' };
    }

    const fish = inventory.removeFish(instanceId);
    if (!fish) {
      return { success: false, reason: 'Fish not found in bucket' };
    }

    this.storedFish.push(fish);
    if (typeof this.onChange === 'function') {
      this.onChange(this.getState());
    }

    return { success: true, fish };
  }

  /**
   * Transfers a fish from the storage chest back to the player's bucket.
   * Enforces acceptance test: Fish can be moved from storage to bucket.
   */
  withdrawFishToBucket(inventory, instanceId) {
    if (!inventory || !instanceId) {
      return { success: false, reason: 'Invalid parameters' };
    }
    if (inventory.isFull()) {
      return { success: false, reason: 'Fish bucket is full' };
    }

    const idx = this.storedFish.findIndex((f) => f.instanceId === instanceId);
    if (idx === -1) {
      return { success: false, reason: 'Fish not found in storage chest' };
    }

    const fish = this.storedFish.splice(idx, 1)[0];
    const addResult = inventory.addFish(fish);

    if (!addResult.success) {
      // Rollback if inventory rejected
      this.storedFish.push(fish);
      return { success: false, reason: addResult.reason };
    }

    if (typeof this.onChange === 'function') {
      this.onChange(this.getState());
    }

    return { success: true, fish };
  }

  getState() {
    return {
      count: this.storedFish.length,
      capacity: this.capacity,
      isFull: this.isFull(),
      storedFish: [...this.storedFish],
    };
  }

  serialize() {
    return [...this.storedFish];
  }

  deserialize(data) {
    if (Array.isArray(data)) {
      this.storedFish = [...data];
    }
  }

  reset() {
    this.storedFish = [];
  }
}

export default StorageManager;
