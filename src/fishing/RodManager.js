// RodManager: merged base + expedition rod collection, equip/buy flow,
// per-rod XP progression, skill trees with diminishing returns, and stat
// application to the player rod.

import { RodDefinitions } from '../expansion/content.js';
import { ExpeditionRodDefinitions } from './expeditionRods.js';

const MAX_ROD_LEVEL = 30;

export class RodManager {
  constructor(player = null) {
    this.player = player;
    this.catalog = [...RodDefinitions, ...ExpeditionRodDefinitions];
    this.ownedRodIds = new Set(['rod_bamboo_1']);
    this.equippedRodId = 'rod_bamboo_1';
    this.progress = {}; // rodId -> { xp, level, skills: { skillId: rank } }
    this._initProgress();
    this.onChange = null;
    if (player) this.applyEquippedToPlayer();
  }

  _initProgress() {
    for (const rod of this.catalog) {
      if (!this.progress[rod.id]) {
        this.progress[rod.id] = { xp: 0, level: 1, skills: {} };
      }
    }
  }

  getRod(id) {
    return this.catalog.find((r) => r.id === id) || null;
  }

  getEquippedRod() {
    return this.getRod(this.equippedRodId);
  }

  getProgress(id) {
    if (!this.progress[id]) this.progress[id] = { xp: 0, level: 1, skills: {} };
    return this.progress[id];
  }

  getXpForNextLevel(level) {
    return Math.round(80 + Math.pow(level, 1.55) * 24);
  }

  getCatalog(playerLevel = 1) {
    return this.catalog.map((rod) => {
      const progress = this.getProgress(rod.id);
      return {
        ...rod,
        isOwned: this.ownedRodIds.has(rod.id),
        isEquipped: rod.id === this.equippedRodId,
        level: progress.level,
        xp: progress.xp,
        xpForNext: this.getXpForNextLevel(progress.level),
        meetsLevel: playerLevel >= rod.levelRequirement,
        skills: rod.skills.map((skill) => ({
          ...skill,
          rank: progress.skills[skill.id] || 0,
          unlocked: progress.level >= skill.requiredLevel,
        })),
      };
    });
  }

  buyRod(id, economy, playerLevel = 1) {
    const rod = this.getRod(id);
    if (!rod) return { success: false, reason: 'Unknown rod' };
    if (this.ownedRodIds.has(id)) return { success: false, reason: 'Rod already owned' };
    if (playerLevel < rod.levelRequirement) {
      return { success: false, reason: `Requires angler level ${rod.levelRequirement}` };
    }
    if (!economy || !economy.canAfford(rod.price)) {
      return { success: false, reason: `Need ${rod.price} coins` };
    }
    if (!economy.spendCoins(rod.price)) return { success: false, reason: 'Transaction failed' };
    this.ownedRodIds.add(id);
    this._changed();
    return { success: true, rod, newBalance: economy.getCoins() };
  }

  equipRod(id) {
    if (!this.ownedRodIds.has(id)) return { success: false, reason: 'Rod not owned' };
    const rod = this.getRod(id);
    if (!rod) return { success: false, reason: 'Unknown rod' };
    this.equippedRodId = id;
    this.applyEquippedToPlayer();
    this._changed();
    return { success: true, rod };
  }

  addXp(amount) {
    const id = this.equippedRodId;
    const progress = this.getProgress(id);
    progress.xp += Math.max(0, amount);
    let leveled = false;
    while (progress.level < MAX_ROD_LEVEL && progress.xp >= this.getXpForNextLevel(progress.level)) {
      progress.xp -= this.getXpForNextLevel(progress.level);
      progress.level++;
      leveled = true;
    }
    if (progress.level >= MAX_ROD_LEVEL) progress.xp = 0;
    this.applyEquippedToPlayer();
    this._changed();
    return { level: progress.level, xp: progress.xp, leveled };
  }

  unlockSkill(skillId) {
    const rod = this.getEquippedRod();
    if (!rod) return { success: false, reason: 'No rod equipped' };
    const skill = rod.skills.find((s) => s.id === skillId);
    if (!skill) return { success: false, reason: 'Unknown rod skill' };
    const progress = this.getProgress(rod.id);
    if (progress.level < skill.requiredLevel) {
      return { success: false, reason: `Rod level ${skill.requiredLevel} required` };
    }
    const rank = progress.skills[skillId] || 0;
    if (rank >= skill.maxRank) return { success: false, reason: 'Skill already mastered' };
    // Diminishing returns: each rank costs an increasing amount of rod XP.
    const cost = Math.round(90 * Math.pow(1.65, rank));
    if (progress.xp < cost) return { success: false, reason: `Need ${cost} rod XP` };
    progress.xp -= cost;
    progress.skills[skillId] = rank + 1;
    this.applyEquippedToPlayer();
    this._changed();
    return { success: true, skillId, rank: rank + 1, cost };
  }

  getSkillRanks(id = this.equippedRodId) {
    return { ...(this.getProgress(id).skills || {}) };
  }

  /**
   * Effective stats combine base rod stats with levels and skills.
   */
  getEffectiveStats(id = this.equippedRodId) {
    const rod = this.getRod(id);
    if (!rod) return null;
    const progress = this.getProgress(id);
    const skills = progress.skills || {};
    const levelMul = 1 + Math.min(0.3, (progress.level - 1) * 0.01);
    const deep = skills.deep_current || 0;
    const heavy = skills.heavy_catch || 0;
    const focus = skills.ocean_focus || 0;
    const resonance = skills.ancient_resonance || 0;
    return {
      reelSpeed: Number((rod.stats.reelSpeed * levelMul * (1 + focus * 0.04)).toFixed(3)),
      luckBonus: Number((rod.stats.luckBonus + resonance * 0.03).toFixed(3)),
      lineStrength: Math.min(120, Math.round(rod.stats.lineStrength * levelMul + deep * 8)),
      fishControl: Math.min(120, Math.round(rod.stats.fishControl * levelMul + heavy * 7)),
      castDistance: Math.min(120, Math.round(rod.stats.castDistance * levelMul)),
      ability: rod.ability,
      bonus: { ...rod.bonus },
      level: progress.level,
      skills,
    };
  }

  applyEquippedToPlayer() {
    if (!this.player || !this.player.rod) return;
    const rod = this.getEquippedRod();
    const stats = this.getEffectiveStats();
    if (!rod || !stats) return;
    this.player.rod.id = rod.id;
    this.player.rod.name = rod.name;
    this.player.rod.level = stats.level;
    this.player.rod.luckBonus = stats.luckBonus;
    this.player.rod.reelSpeed = stats.reelSpeed;
    this.player.rod.lineStrength = stats.lineStrength;
    this.player.rod.fishControl = stats.fishControl;
    this.player.rod.castDistance = stats.castDistance;
    this.player.rod.rarity = rod.rarity;
    this.player.rod.ability = rod.ability;
    this.player.rod.bonus = { ...stats.bonus };
    if (typeof this.player.rod.setVisualStyle === 'function') {
      this.player.rod.setVisualStyle({ color: rod.color, rarity: rod.rarity });
    }
  }

  serialize() {
    return {
      ownedRodIds: Array.from(this.ownedRodIds),
      equippedRodId: this.equippedRodId,
      progress: JSON.parse(JSON.stringify(this.progress)),
    };
  }

  deserialize(data) {
    if (!data) return;
    this.ownedRodIds = new Set(Array.isArray(data.ownedRodIds) && data.ownedRodIds.length ? data.ownedRodIds : ['rod_bamboo_1']);
    this.equippedRodId = this.ownedRodIds.has(data.equippedRodId) ? data.equippedRodId : 'rod_bamboo_1';
    if (data.progress && typeof data.progress === 'object') {
      this.progress = JSON.parse(JSON.stringify(data.progress));
    }
    this._initProgress();
    this.applyEquippedToPlayer();
  }

  reset() {
    this.ownedRodIds = new Set(['rod_bamboo_1']);
    this.equippedRodId = 'rod_bamboo_1';
    this.progress = {};
    this._initProgress();
    this.applyEquippedToPlayer();
  }

  _changed() {
    if (typeof this.onChange === 'function') this.onChange();
  }
}

export default RodManager;
