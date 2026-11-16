// BoatManager: Dealership purchases, owned fleet catalog, ship upgrade tree,
// effective stats, spawning active vessels, and persistence.

import { Config } from '../config.js';
import { Boat } from './Boat.js';
import { CityBoatCatalog } from '../expansion/cityContent.js';
import { ExpeditionBoatCatalog, getExpeditionMooring } from './expeditionBoats.js';

export class BoatManager {
  constructor(config = Config.boats) {
    this.catalog = Array.isArray(config) ? config : (Config.boats || []);
    this.cityCatalog = CityBoatCatalog;
    this.expeditionCatalog = ExpeditionBoatCatalog;
    this.upgradeCatalog = Config.boatUpgrades || [];
    this.ownedBoatIds = new Set();
    this.upgrades = {}; // boatId -> { upgradeId: level }
    this.activeBoat = null;

    this.dockMooring = { x: 5.0, y: 0.0, z: -18.0 };
    this.dockLandAnchor = { x: 3.5, y: 1.0, z: -14.5 };
    this.pirateMooring = { x: 235.0, y: 0.0, z: -215.0 };
    this.pirateLandAnchor = { x: 230.0, y: 1.0, z: -212.0 };
  }

  getCatalog(vendor = null) {
    const boats = vendor
      ? this.catalog.filter((boat) => (boat.vendor || 'harbor') === vendor)
      : this.catalog;
    return boats.map((boat) => ({
      ...boat,
      vendor: boat.vendor || 'harbor',
      ...this.getBoatUpgrades(boat.id),
      isOwned: this.isBoatOwned(boat.id),
    }));
  }

  /** Convenience accessor used by Quartermaster Sable's Pirate Dock. */
  getPirateCatalog() {
    return this.getCatalog('pirate');
  }

  /** Aurelia Heights' own dealership. Kept separate from the 30 harbor/pirate boats. */
  getCityCatalog() {
    return this.cityCatalog.map((boat) => ({
      ...boat,
      vendor: 'city',
      ...this.getBoatUpgrades(boat.id),
      isOwned: this.isBoatOwned(boat.id),
    }));
  }

  /**
   * Expansion 8.0 expedition fleet. Each hull lists the frontier mooring it is
   * delivered to, so the UI can tell the player where to collect it.
   */
  getExpeditionCatalog() {
    return this.expeditionCatalog.map((boat) => {
      const mooring = getExpeditionMooring(boat.homeIsland);
      return {
        ...boat,
        vendor: 'expedition',
        homeIslandName: mooring ? mooring.islandName : boat.homeIsland,
        mooring: mooring ? { ...mooring.position } : null,
        ...this.getBoatUpgrades(boat.id),
        isOwned: this.isBoatOwned(boat.id),
      };
    });
  }

  getBoatDef(boatId) {
    return this.catalog.find((b) => b.id === boatId)
      || this.cityCatalog.find((b) => b.id === boatId)
      || this.expeditionCatalog.find((b) => b.id === boatId)
      || null;
  }

  isBoatOwned(boatId) {
    return this.ownedBoatIds.has(boatId);
  }

  purchaseBoat(boatId, economy, spawnOptions = null) {
    const boatDef = this.getBoatDef(boatId);
    if (!boatDef) return { success: false, reason: 'Unknown boat model' };
    if (this.isBoatOwned(boatId)) return { success: false, reason: 'Boat is already owned' };
    if (!economy) return { success: false, reason: 'Invalid economy system' };
    if (!economy.canAfford(boatDef.cost)) {
      return {
        success: false,
        reason: `Insufficient coins. Need ${boatDef.cost} coins, but only have ${economy.getCoins()}`,
      };
    }
    if (!economy.deductCoins(boatDef.cost)) {
      return { success: false, reason: 'Transaction failed' };
    }

    this.ownedBoatIds.add(boatId);
    const position = spawnOptions && spawnOptions.position ? spawnOptions.position : null;
    const anchor = spawnOptions && spawnOptions.anchor ? spawnOptions.anchor : null;
    this.spawnBoat(boatId, position, anchor);
    return { success: true, boat: boatDef, activeBoat: this.activeBoat, remainingCoins: economy.getCoins() };
  }

  getUpgradeCatalog() {
    return this.upgradeCatalog.map((u) => ({ ...u }));
  }

  getUpgradeLevels(boatId) {
    return { ...(this.upgrades[boatId] || {}) };
  }

  getUpgradeCost(boatId, upgradeId) {
    const def = this.upgradeCatalog.find((u) => u.id === upgradeId);
    if (!def) return null;
    const level = this.getUpgradeLevels(boatId)[upgradeId] || 0;
    if (level >= def.maxLevel) return null;
    return def.baseCost + def.perLevelCost * level;
  }

  /**
   * Applies ship upgrades into concrete vessel stats.
   */
  getEffectiveStats(boatId) {
    const def = this.getBoatDef(boatId);
    if (!def) return null;
    const levels = this.getUpgradeLevels(boatId);
    const engine = levels.engine || 0;
    const hull = levels.hull || 0;
    const storage = levels.storage || 0;
    return {
      ...def,
      maxSpeed: Number((def.maxSpeed * (1 + engine * 0.12)).toFixed(2)),
      turnRate: Number((def.turnRate * (1 + engine * 0.04)).toFixed(2)),
      acceleration: Number((def.acceleration * (1 + engine * 0.08)).toFixed(2)),
      capacity: (def.capacity || 1) + storage * 2,
      storageCapacity: 15 + storage * 5,
      maxHealth: 100 + hull * 40,
      hasFishingDeck: Boolean(def.hasFishingDeck) || (levels.fishing_deck || 0) > 0,
      hasRadar: Boolean(def.hasRadar) || (levels.radar || 0) > 0,
      hasSonar: Boolean(def.hasSonar) || (levels.sonar || 0) > 0,
      hasCannons: Boolean(def.hasCannons),
      upgradeLevels: levels,
    };
  }

  getBoatUpgrades(boatId) {
    const levels = this.getUpgradeLevels(boatId);
    const stats = this.getEffectiveStats(boatId);
    return {
      upgradeLevels: levels,
      effectiveStats: stats,
      upgrades: this.upgradeCatalog.map((u) => {
        const level = levels[u.id] || 0;
        return {
          ...u,
          level,
          isMax: level >= u.maxLevel,
          cost: level >= u.maxLevel ? null : u.baseCost + u.perLevelCost * level,
        };
      }),
    };
  }

  purchaseUpgrade(boatId, upgradeId, economy) {
    const def = this.getBoatDef(boatId);
    if (!def) return { success: false, reason: 'Unknown boat' };
    if (!this.isBoatOwned(boatId)) return { success: false, reason: 'Purchase this vessel first' };
    const upgradeDef = this.upgradeCatalog.find((u) => u.id === upgradeId);
    if (!upgradeDef) return { success: false, reason: 'Unknown ship upgrade' };
    if (!economy) return { success: false, reason: 'Invalid economy system' };

    const levels = this.upgrades[boatId] || {};
    const current = levels[upgradeId] || 0;
    if (current >= upgradeDef.maxLevel) return { success: false, reason: 'Upgrade already maxed' };
    const cost = upgradeDef.baseCost + upgradeDef.perLevelCost * current;
    if (!economy.canAfford(cost)) return { success: false, reason: `Need ${cost} coins` };
    if (!economy.spendCoins(cost)) return { success: false, reason: 'Transaction failed' };

    levels[upgradeId] = current + 1;
    this.upgrades[boatId] = levels;

    if (this.activeBoat && this.activeBoat.id === boatId) {
      const stats = this.getEffectiveStats(boatId);
      this.activeBoat.applyStats(stats);
    }

    return {
      success: true,
      boatId,
      upgradeId,
      level: current + 1,
      cost,
      newBalance: economy.getCoins(),
      stats: this.getEffectiveStats(boatId),
    };
  }

  spawnBoat(boatId, position = null, anchor = null) {
    const boatDef = this.getBoatDef(boatId);
    if (!boatDef) return null;

    const stats = this.getEffectiveStats(boatId) || boatDef;
    const spawnPos = position || { ...this.dockMooring };
    const dockAnchor = anchor || { ...this.dockLandAnchor };
    this.activeBoat = new Boat({
      id: boatDef.id,
      name: boatDef.name,
      config: { ...boatDef, ...stats },
      isOwned: this.isBoatOwned(boatId),
      position: spawnPos,
      dockAnchor,
    });

    if (typeof this.onSpawn === 'function') this.onSpawn(this.activeBoat);
    return this.activeBoat;
  }

  getActiveBoat() {
    return this.activeBoat;
  }

  serialize() {
    return {
      ownedBoatIds: Array.from(this.ownedBoatIds),
      activeBoatId: this.activeBoat ? this.activeBoat.id : null,
      upgrades: JSON.parse(JSON.stringify(this.upgrades)),
    };
  }

  deserialize(data) {
    if (!data) return;
    this.ownedBoatIds.clear();
    if (Array.isArray(data.ownedBoatIds)) {
      for (const id of data.ownedBoatIds) this.ownedBoatIds.add(id);
    }
    this.upgrades = {};
    if (data.upgrades && typeof data.upgrades === 'object') {
      for (const [boatId, levels] of Object.entries(data.upgrades)) {
        this.upgrades[boatId] = { ...levels };
      }
    }
    if (data.activeBoatId && this.isBoatOwned(data.activeBoatId)) {
      this.spawnBoat(data.activeBoatId);
    }
  }

  reset() {
    this.ownedBoatIds.clear();
    this.upgrades = {};
    if (this.activeBoat) {
      this.activeBoat.reset();
      this.activeBoat = null;
    }
  }
}

export default BoatManager;
