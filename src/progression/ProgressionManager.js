// ProgressionManager: Manages player angler level, XP curves, and milestone unlocks.

export class ProgressionManager {
  constructor(options = {}) {
    this.level = options.level || 1;
    this.xp = options.xp || 0;
    this.totalXpEarned = options.totalXpEarned || 0;

    // Event hooks
    this.onLevelUp = null; // (newLevel, rewards) => void
    this.onXpGain = null;  // (amount, currentXp, nextLevelXp) => void
  }

  getXpForNextLevel(lvl = this.level) {
    return Math.round(90 * Math.pow(lvl, 1.42));
  }

  getLevel() {
    return this.level;
  }

  getXp() {
    return this.xp;
  }

  /**
   * Awards XP to the player and handles multi-level up overflows.
   * Enforces acceptance tests:
   * 1. Catching fish grants XP.
   * 2. Reaching XP threshold triggers Level Up.
   */
  addXp(amount) {
    if (amount <= 0) return { levelsGained: 0, currentLevel: this.level };

    const gained = Math.round(amount);
    this.xp += gained;
    this.totalXpEarned += gained;

    let levelsGained = 0;
    while (this.xp >= this.getXpForNextLevel(this.level)) {
      this.xp -= this.getXpForNextLevel(this.level);
      this.level += 1;
      levelsGained += 1;

      if (typeof this.onLevelUp === 'function') {
        this.onLevelUp(this.level, {
          coinBonus: this.level * 25,
          level: this.level,
        });
      }
    }

    if (typeof this.onXpGain === 'function') {
      this.onXpGain(gained, this.xp, this.getXpForNextLevel(this.level));
    }

    return {
      levelsGained,
      currentLevel: this.level,
      currentXp: this.xp,
      nextLevelXp: this.getXpForNextLevel(this.level),
    };
  }

  getProgressPercent() {
    const required = this.getXpForNextLevel(this.level);
    if (required <= 0) return 0;
    return Math.min(100, Math.floor((this.xp / required) * 100));
  }

  serialize() {
    return {
      level: this.level,
      xp: this.xp,
      totalXpEarned: this.totalXpEarned,
    };
  }

  deserialize(data) {
    if (!data) return;
    this.level = Number(data.level) || 1;
    this.xp = Number(data.xp) || 0;
    this.totalXpEarned = Number(data.totalXpEarned) || 0;
  }

  reset() {
    this.level = 1;
    this.xp = 0;
    this.totalXpEarned = 0;
  }
}

export default ProgressionManager;
