// EconomyManager: Handles player coins, transactions, and authoritative fish selling.

import { Config } from '../config.js';

export class EconomyManager {
  constructor(config = Config.economy) {
    this.config = config || {};
    this.coins = this.config.startingCoins !== undefined ? this.config.startingCoins : 50;

    // Gems are the hard currency: they are never dropped by ordinary fish and
    // only come from story milestones, world bosses and rare caches. They buy
    // expedition-grade rewards that coins cannot.
    this.gems = this.config.startingGems !== undefined ? this.config.startingGems : 0;

    // Track sold fish instance IDs to strictly prevent double-spending or duplication exploits
    this.soldFishHistory = new Set();

    // Event hooks
    this.onChange = null;
    this.onGemChange = null;
  }

  getCoins() {
    return this.coins;
  }

  getGems() {
    return this.gems;
  }

  canAffordGems(cost) {
    return this.gems >= cost;
  }

  addGems(amount) {
    const value = Math.round(Number(amount) || 0);
    if (value <= 0) return this.gems;
    this.gems += value;
    if (typeof this.onGemChange === 'function') this.onGemChange(this.gems);
    return this.gems;
  }

  spendGems(amount) {
    const value = Math.round(Number(amount) || 0);
    if (value < 0 || this.gems < value) return false;
    this.gems -= value;
    if (typeof this.onGemChange === 'function') this.onGemChange(this.gems);
    return true;
  }

  deductGems(amount) {
    return this.spendGems(amount);
  }

  canAfford(cost) {
    return this.coins >= cost;
  }

  addCoins(amount) {
    if (amount <= 0) return this.coins;
    this.coins += Math.round(amount);

    if (typeof this.onChange === 'function') {
      this.onChange(this.coins);
    }
    return this.coins;
  }

  /**
   * Attempts to spend coins.
   * Enforces acceptance test: Players cannot purchase items they cannot afford.
   */
  spendCoins(amount) {
    if (amount < 0) return false;
    if (this.coins < amount) {
      return false; // Cannot afford
    }

    this.coins -= Math.round(amount);

    if (typeof this.onChange === 'function') {
      this.onChange(this.coins);
    }
    return true;
  }

  deductCoins(amount) {
    return this.spendCoins(amount);
  }

  /**
   * Authoritatively sells an individual fish from the player's bucket.
   * Enforces acceptance tests:
   * 1. Selling fish adds the correct money.
   * 2. Selling the same fish twice is strictly impossible.
   */
  sellFish(inventory, instanceId) {
    if (!inventory || !instanceId) {
      return { success: false, reason: 'Invalid inventory or item reference' };
    }

    // Verify fish has not already been sold
    if (this.soldFishHistory.has(instanceId)) {
      return { success: false, reason: 'Fish already sold' };
    }

    // Authoritative removal from inventory bucket
    const fish = inventory.removeFish(instanceId);
    if (!fish) {
      return { success: false, reason: 'Fish not found in bucket' };
    }

    // Record to history and add money
    this.soldFishHistory.add(instanceId);
    const earned = fish.value || 0;
    this.addCoins(earned);

    return {
      success: true,
      earned,
      fish,
      newBalance: this.coins,
    };
  }

  /**
   * Sells all fish currently in the player's bucket.
   */
  sellAllFish(inventory) {
    if (!inventory) {
      return { success: false, reason: 'Invalid inventory' };
    }

    const fishList = inventory.clearBucket();
    if (fishList.length === 0) {
      return { success: true, earned: 0, count: 0, newBalance: this.coins };
    }

    let totalEarned = 0;
    for (const fish of fishList) {
      if (!this.soldFishHistory.has(fish.instanceId)) {
        this.soldFishHistory.add(fish.instanceId);
        totalEarned += fish.value || 0;
      }
    }

    this.addCoins(totalEarned);

    return {
      success: true,
      earned: totalEarned,
      count: fishList.length,
      newBalance: this.coins,
    };
  }

  getState() {
    return {
      coins: this.coins,
      gems: this.gems,
      totalSold: this.soldFishHistory.size,
    };
  }

  serialize() {
    return {
      coins: this.coins,
      gems: this.gems,
      soldFishHistory: Array.from(this.soldFishHistory),
    };
  }

  deserialize(data) {
    if (!data) return;
    const coins = Number(data.coins);
    this.coins = Number.isFinite(coins)
      ? coins
      : (this.config.startingCoins !== undefined ? this.config.startingCoins : 50);
    const gems = Number(data.gems);
    this.gems = Number.isFinite(gems)
      ? Math.max(0, gems)
      : (this.config.startingGems !== undefined ? this.config.startingGems : 0);
    this.soldFishHistory.clear();
    if (Array.isArray(data.soldFishHistory)) {
      for (const id of data.soldFishHistory) {
        this.soldFishHistory.add(id);
      }
    }
  }

  reset() {
    this.coins = this.config.startingCoins !== undefined ? this.config.startingCoins : 50;
    this.gems = this.config.startingGems !== undefined ? this.config.startingGems : 0;
    this.soldFishHistory.clear();
  }
}

export default EconomyManager;
