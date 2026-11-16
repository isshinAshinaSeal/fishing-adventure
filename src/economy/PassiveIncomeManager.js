// PassiveIncomeManager: Manages real-time & offline passive coin generation from private pond fish.

import { Config } from '../config.js';

export class PassiveIncomeManager {
  constructor(config = Config.passiveIncome) {
    this.config = config || {};
    this.incomeMultiplier = this.config.incomeMultiplier || 0.015; // 1.5% of value/sec
    this.maxAccumulationSeconds = this.config.maxAccumulationSeconds || 28800; // 8 hours
    this.maxCoinCap = this.config.maxCoinCap || 600;

    this.accumulatedCoins = 0.0;
    this.lastTimestamp = Date.now();
  }

  /**
   * Calculates current coin generation rate per second.
   * Enforces acceptance tests:
   * 1. Empty pond generates no money (0 coins/sec).
   * 2. Rate scales with fish rarity and value.
   */
  calculatePerSecondRate(pond) {
    if (!pond) return 0.0;
    const fishList = pond.getFishList ? pond.getFishList() : [];
    if (fishList.length === 0) return 0.0;

    let totalValue = 0;
    for (const fish of fishList) {
      totalValue += (fish.value || 0);
    }

    return Number((totalValue * this.incomeMultiplier).toFixed(3));
  }

  /**
   * Active real-time per-frame update loop.
   * Enforces acceptance test: Pond fish generate money over time.
   */
  update(dt, pond) {
    if (!pond) return;
    const rate = this.calculatePerSecondRate(pond);
    if (rate <= 0) return;

    this.accumulatedCoins += rate * dt;
    this.accumulatedCoins = Math.min(this.maxCoinCap, this.accumulatedCoins);
    this.lastTimestamp = Date.now();
  }

  /**
   * Calculates earnings accumulated while the player was away.
   * Enforces acceptance test: Offline time generates money up to cap.
   */
  processOfflineEarnings(pond, elapsedSeconds = null) {
    const now = Date.now();
    let secondsAway = elapsedSeconds;

    if (secondsAway === null || secondsAway === undefined) {
      secondsAway = Math.max(0, (now - this.lastTimestamp) / 1000);
    }

    // Clamp offline elapsed time to maximum allowed accumulation window
    const clampedSeconds = Math.min(this.maxAccumulationSeconds, secondsAway);
    const rate = this.calculatePerSecondRate(pond);
    const earned = rate * clampedSeconds;

    this.accumulatedCoins += earned;
    this.accumulatedCoins = Math.min(this.maxCoinCap, this.accumulatedCoins);
    this.lastTimestamp = now;

    return {
      elapsedSeconds: clampedSeconds,
      earned: Math.round(earned),
      totalAccumulated: Math.floor(this.accumulatedCoins),
    };
  }

  /**
   * Collects all accumulated passive income and transfers to player economy.
   * Enforces acceptance test: Collecting money adds to player balance.
   */
  collectEarnings(economy) {
    if (!economy) {
      return { success: false, reason: 'Invalid economy' };
    }

    const collectable = Math.floor(this.accumulatedCoins);
    if (collectable <= 0) {
      return { success: false, reason: 'No coins accumulated yet' };
    }

    economy.addCoins(collectable);
    this.accumulatedCoins -= collectable;

    return {
      success: true,
      collected: collectable,
      newBalance: economy.getCoins(),
    };
  }

  getAccumulatedCoins() {
    return Math.floor(this.accumulatedCoins);
  }

  serialize() {
    return {
      accumulatedCoins: this.accumulatedCoins,
      lastTimestamp: this.lastTimestamp,
    };
  }

  deserialize(data) {
    if (data) {
      this.accumulatedCoins = Number(data.accumulatedCoins || 0);
      this.lastTimestamp = Number(data.lastTimestamp || Date.now());
    }
  }

  reset() {
    this.accumulatedCoins = 0.0;
    this.lastTimestamp = Date.now();
  }
}

export default PassiveIncomeManager;
