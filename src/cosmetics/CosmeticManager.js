// CosmeticManager: transparent cosmetic draws using earned coins, duplicate
// protection, pity milestones, collection index, wardrobe equip/unequip,
// and token exchange. Cosmetics never affect gameplay power.

import {
  CosmeticDefinitions,
  CosmeticBanners,
  CosmeticDrops,
} from '../expansion/content.js';

const PITY_MILESTONE = 10;
const SINGLE_COST = 120;
const MULTI_COST = 1080;

export class CosmeticManager {
  constructor(options = {}) {
    this.rng = options.rng || Math.random;
    this.ownedIds = new Set();
    this.equipped = {}; // slot -> cosmeticId
    this.pity = 0;
    this.tokens = 0;
    this.history = [];
    this.totalDraws = 0;
    this.onNotification = null;
    this.onEquip = null;
    this.onChange = null;
  }

  getBanners() {
    return CosmeticBanners.map((banner) => ({
      ...banner,
      poolSize: CosmeticDefinitions.filter((c) => c.banner === banner.id).length,
      ownedCount: CosmeticDefinitions.filter((c) => c.banner === banner.id && this.ownedIds.has(c.id)).length,
    }));
  }

  getPool(bannerId) {
    return CosmeticDefinitions.filter((c) => c.banner === bannerId);
  }

  getDropRates() {
    return { ...CosmeticDrops };
  }

  getPreview(bannerId) {
    const pool = this.getPool(bannerId);
    const byRarity = {};
    for (const cosmetic of pool) {
      if (!byRarity[cosmetic.rarity]) byRarity[cosmetic.rarity] = [];
      byRarity[cosmetic.rarity].push(cosmetic);
    }
    return {
      banner: bannerId,
      odds: this.getDropRates(),
      pool: byRarity,
      pity: this.pity,
      pityMilestone: PITY_MILESTONE,
      tokens: this.tokens,
      singleCost: SINGLE_COST,
      multiCost: MULTI_COST,
    };
  }

  draw(bannerId, count, economy) {
    const banner = CosmeticBanners.find((b) => b.id === bannerId);
    if (!banner) return { success: false, reason: 'Unknown banner' };
    if (count !== 1 && count !== 10) return { success: false, reason: 'Draw 1 or 10 at a time' };
    const cost = count === 10 ? MULTI_COST : SINGLE_COST;
    if (!economy || !economy.canAfford(cost)) return { success: false, reason: `Need ${cost} coins` };
    if (!economy.spendCoins(cost)) return { success: false, reason: 'Transaction failed' };

    const rewards = [];
    for (let i = 0; i < count; i++) {
      this.pity++;
      this.totalDraws++;
      let cosmetic = null;
      if (this.pity >= PITY_MILESTONE) {
        cosmetic = this._pickFeatured(bannerId);
        this.pity = 0;
      } else {
        cosmetic = this._pickWeighted(bannerId);
      }
      const isDuplicate = this.ownedIds.has(cosmetic.id);
      let tokens = 0;
      if (isDuplicate) {
        tokens = this._duplicateTokens(cosmetic.rarity);
        this.tokens += tokens;
      } else {
        this.ownedIds.add(cosmetic.id);
      }
      const entry = { ...cosmetic, isDuplicate, tokens };
      rewards.push(entry);
      this.history.unshift({
        id: cosmetic.id,
        name: cosmetic.name,
        rarity: cosmetic.rarity,
        banner: bannerId,
        duplicate: isDuplicate,
        tokens,
        at: Date.now(),
      });
    }
    this.history = this.history.slice(0, 50);
    this._notify(`Cosmetic draw complete: ${rewards.filter((r) => !r.isDuplicate).length} new item(s)`);
    this._changed();
    return {
      success: true,
      rewards,
      cost,
      newBalance: economy.getCoins(),
      pity: this.pity,
      tokens: this.tokens,
    };
  }

  _pickWeighted(bannerId) {
    const roll = this.rng();
    let cumulative = 0;
    let chosenRarity = 'Common';
    for (const [rarity, chance] of Object.entries(CosmeticDrops)) {
      cumulative += chance;
      if (roll <= cumulative) {
        chosenRarity = rarity;
        break;
      }
    }
    const pool = this.getPool(bannerId);
    let candidates = pool.filter((c) => c.rarity === chosenRarity);
    if (candidates.length === 0) candidates = pool;
    return candidates[Math.floor(this.rng() * candidates.length)] || pool[0];
  }

  _pickFeatured(bannerId) {
    const pool = this.getPool(bannerId);
    const unowned = pool.filter((c) => !this.ownedIds.has(c.id));
    return unowned[unowned.length - 1] || pool[pool.length - 1];
  }

  _duplicateTokens(rarity) {
    return { Common: 5, Uncommon: 8, Rare: 15, Epic: 30, Legendary: 60, Mythical: 100, Celestial: 180 }[rarity] || 5;
  }

  redeemToken(bannerId, economy = null) {
    if (this.tokens < 120) return { success: false, reason: 'Need 120 cosmetic tokens' };
    const pool = this.getPool(bannerId).filter((c) => !this.ownedIds.has(c.id) && ['Rare', 'Epic', 'Legendary', 'Mythical', 'Celestial'].includes(c.rarity));
    if (pool.length === 0) return { success: false, reason: 'No unowned rare cosmetics remain in this banner' };
    this.tokens -= 120;
    const cosmetic = pool[Math.floor(this.rng() * pool.length)];
    this.ownedIds.add(cosmetic.id);
    this.history.unshift({ id: cosmetic.id, name: cosmetic.name, rarity: cosmetic.rarity, banner: bannerId, duplicate: false, tokens: -120, at: Date.now() });
    this.history = this.history.slice(0, 50);
    this._changed();
    return { success: true, cosmetic, tokens: this.tokens };
  }

  getCollection() {
    return {
      owned: this.ownedIds.size,
      total: CosmeticDefinitions.length,
      percent: Math.round((this.ownedIds.size / CosmeticDefinitions.length) * 100),
      equipped: { ...this.equipped },
      ownedItems: CosmeticDefinitions.filter((c) => this.ownedIds.has(c.id)).map((c) => ({
        ...c,
        isEquipped: this.equipped[c.slot] === c.id,
      })),
    };
  }

  grantByName(name) {
    const cosmetic = CosmeticDefinitions.find((c) => c.name === name);
    if (!cosmetic) return null;
    this.ownedIds.add(cosmetic.id);
    this._changed();
    return cosmetic;
  }

  grant(cosmeticId) {
    const cosmetic = CosmeticDefinitions.find((c) => c.id === cosmeticId);
    if (!cosmetic) return null;
    this.ownedIds.add(cosmetic.id);
    this._changed();
    return cosmetic;
  }

  equip(cosmeticId) {
    const cosmetic = CosmeticDefinitions.find((c) => c.id === cosmeticId);
    if (!cosmetic) return { success: false, reason: 'Unknown cosmetic' };
    if (!this.ownedIds.has(cosmeticId)) return { success: false, reason: 'Cosmetic not owned' };
    this.equipped[cosmetic.slot] = cosmetic.id;
    if (typeof this.onEquip === 'function') this.onEquip(cosmetic);
    this._notify(`${cosmetic.name} equipped`);
    this._changed();
    return { success: true, cosmetic };
  }

  unequip(slot) {
    const id = this.equipped[slot];
    if (!id) return { success: false, reason: 'Nothing equipped in that slot' };
    delete this.equipped[slot];
    this._notify('Cosmetic removed');
    this._changed();
    return { success: true, slot };
  }

  getEquipped(slot) {
    const id = this.equipped[slot];
    return id ? CosmeticDefinitions.find((c) => c.id === id) || null : null;
  }

  serialize() {
    return {
      ownedIds: Array.from(this.ownedIds),
      equipped: { ...this.equipped },
      pity: this.pity,
      tokens: this.tokens,
      history: this.history.slice(0, 50),
      totalDraws: this.totalDraws,
    };
  }

  deserialize(data) {
    if (!data) return;
    this.ownedIds = new Set(Array.isArray(data.ownedIds) ? data.ownedIds : []);
    this.equipped = data.equipped && typeof data.equipped === 'object' ? { ...data.equipped } : {};
    this.pity = Number(data.pity) || 0;
    this.tokens = Number(data.tokens) || 0;
    this.history = Array.isArray(data.history) ? data.history : [];
    this.totalDraws = Number(data.totalDraws) || 0;
  }

  reset() {
    this.ownedIds.clear();
    this.equipped = {};
    this.pity = 0;
    this.tokens = 0;
    this.history = [];
    this.totalDraws = 0;
  }

  _notify(message) {
    if (typeof this.onNotification === 'function') this.onNotification(message);
  }

  _changed() {
    if (typeof this.onChange === 'function') this.onChange();
  }
}

export default CosmeticManager;
