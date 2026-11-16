// SaveManager: Robust JSON serialization, persistent storage adapter,
// and state restoration for all open-world fishing systems.

export class SaveManager {
  constructor(options = {}) {
    this.storageKey = options.storageKey || 'open_world_fishing_save_v2';
    this.schemaVersion = 2;

    // Use Web Storage if available, else internal in-memory fallback
    this.memoryStore = new Map();
  }

  _getStorage() {
    if (typeof globalThis !== 'undefined' && globalThis.localStorage) {
      return globalThis.localStorage;
    }
    return {
      getItem: (key) => this.memoryStore.get(key) || null,
      setItem: (key, val) => this.memoryStore.set(key, String(val)),
      removeItem: (key) => this.memoryStore.delete(key),
      clear: () => this.memoryStore.clear(),
    };
  }

  hasSaveFile() {
    try {
      const store = this._getStorage();
      const raw = store.getItem(this.storageKey);
      return Boolean(raw && raw.length > 5);
    } catch {
      return false;
    }
  }

  deleteSaveFile() {
    try {
      const store = this._getStorage();
      store.removeItem(this.storageKey);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Generates a complete serialized state payload from the game instance.
   * Enforces acceptance test: Save creates schema-valid, complete payload.
   */
  exportSavePayload(game) {
    if (!game) return null;

    const payload = {
      version: this.schemaVersion,
      timestamp: Date.now(),
      savedAt: new Date().toISOString(),
      player: game.player ? game.player.serialize() : null,
      property: game.propertyManager ? game.propertyManager.serialize() : null,
      pond: game.privatePond ? game.privatePond.serialize() : null,
      passiveIncome: game.passiveIncomeManager ? game.passiveIncomeManager.serialize() : null,
      boats: game.boatManager ? game.boatManager.serialize() : null,
      zones: game.zoneManager ? game.zoneManager.serialize() : null,
      quests: game.questManager ? game.questManager.serialize() : null,
      shops: game.shopManager ? game.shopManager.serialize() : null,
      mounts: game.mountManager ? game.mountManager.serialize() : null,
      fastTravel: game.fastTravelManager ? game.fastTravelManager.serialize() : null,
      clock: game.worldClock ? game.worldClock.serialize() : null,
      expansion2: {
        backpack: game.backpackManager ? game.backpackManager.serialize() : null,
        cargo: game.cargoManager ? game.cargoManager.serialize() : null,
        rods: game.rodManager ? game.rodManager.serialize() : null,
        tools: game.fishingToolManager ? game.fishingToolManager.serialize() : null,
        consumables: game.consumableManager ? game.consumableManager.serialize() : null,
        housing: game.housingManager ? game.housingManager.serialize() : null,
        cosmetics: game.cosmeticManager ? game.cosmeticManager.serialize() : null,
        customization: game.characterCustomization ? game.characterCustomization.serialize() : null,
        services: game.serviceManager ? game.serviceManager.serialize() : null,
        crew: game.crewManager ? game.crewManager.serialize() : null,
        cannon: game.cannonManager ? game.cannonManager.serialize() : null,
        giants: game.giantFishManager ? game.giantFishManager.serialize() : null,
        treasures: game.treasureManager ? game.treasureManager.serialize() : null,
        titles: game.unlockedTitles ? Array.from(game.unlockedTitles) : [],
        dailyCatches: game.expansionDailyCatches || 0,
        npcFriendship: game.expansionNpcManager ? game.expansionNpcManager.serialize() : null,
        bosses: game.bossManager ? game.bossManager.serialize() : null,
      },
      expansion6: {
        farm: game.farmingManager ? game.farmingManager.serialize() : null,
        gathering: game.gatheringManager ? game.gatheringManager.serialize() : null,
      },
      expansion7: {
        frontier: {
          visited: game.visitedFrontierIslands ? Array.from(game.visitedFrontierIslands) : [],
          catches: game.frontierCatches || 0,
        },
      },
      expansion8: {
        story: game.storyJournal ? game.storyJournal.serialize() : null,
        secretChest: game.secretChest ? game.secretChest.serialize() : null,
        piratePatrol: game.piratePatrol ? { angle: game.piratePatrol.angle } : null,
      },
    };

    return payload;
  }

  /**
   * Saves game state to persistent storage.
   */
  saveGame(game) {
    if (!game) {
      return { success: false, reason: 'Invalid game instance' };
    }

    try {
      const payload = this.exportSavePayload(game);
      const json = JSON.stringify(payload);
      const store = this._getStorage();
      store.setItem(this.storageKey, json);
      return { success: true, payload };
    } catch (err) {
      return { success: false, reason: err.message };
    }
  }

  /**
   * Deserializes and restores game state from persistent storage or provided payload.
   * Enforces acceptance tests:
   * 1. Reload restores exact position, coins, items, and quests.
   * 2. Corrupt or missing save handles gracefully with default state.
   */
  loadGame(game, forcedPayload = null) {
    if (!game) {
      return { success: false, reason: 'Invalid game instance' };
    }

    let payload = forcedPayload;
    if (!payload) {
      try {
        const store = this._getStorage();
        const raw = store.getItem(this.storageKey);
        if (!raw) {
          return { success: false, reason: 'No save file found' };
        }
        payload = JSON.parse(raw);
      } catch (err) {
        return { success: false, reason: `Corrupted save file: ${err.message}` };
      }
    }

    // Schema Validation
    if (!payload || typeof payload !== 'object' || !payload.version) {
      return { success: false, reason: 'Invalid save schema or missing version' };
    }

    try {
      // 1. Restore Player (position, inventory, coins, storage, progression)
      if (payload.player && game.player) {
        game.player.deserialize(payload.player);
      }

      // 2. Restore Properties
      if (payload.property && game.propertyManager) {
        game.propertyManager.deserialize(payload.property);
      }

      // 3. Restore Private Pond
      if (payload.pond && game.privatePond) {
        game.privatePond.deserialize(payload.pond);
      }

      // 4. Restore Passive Income
      if (payload.passiveIncome && game.passiveIncomeManager) {
        game.passiveIncomeManager.deserialize(payload.passiveIncome);
      }

      // 5. Restore Boats
      if (payload.boats && game.boatManager) {
        game.boatManager.deserialize(payload.boats);
      }

      // 6. Restore Zones & Exploration
      if (payload.zones && game.zoneManager) {
        game.zoneManager.deserialize(payload.zones);
      }

      // 7. Restore Quests
      if (payload.quests && game.questManager) {
        game.questManager.deserialize(payload.quests);
      }

      // 8. Restore Shop Purchases
      if (payload.shops && game.shopManager) {
        game.shopManager.deserialize(payload.shops);
      }

      // 9. Restore day/night clock
      if (payload.clock && game.worldClock) {
        game.worldClock.deserialize(payload.clock);
      }

      // 10. Restore fast-travel network
      if (payload.fastTravel && game.fastTravelManager) {
        game.fastTravelManager.deserialize(payload.fastTravel);
      }

      // 11. Restore mounts (after player position and zones)
      if (payload.mounts && game.mountManager) {
        game.mountManager.deserialize(payload.mounts, game.player, game.terrainCollider);
      }

      // 12. Expansion 2.0 systems
      const ex = payload.expansion2;
      if (ex && typeof ex === 'object') {
        if (ex.backpack && game.backpackManager) game.backpackManager.deserialize(ex.backpack);
        if (ex.cargo && game.cargoManager) game.cargoManager.deserialize(ex.cargo);
        if (ex.rods && game.rodManager) game.rodManager.deserialize(ex.rods);
        if (ex.tools && game.fishingToolManager) game.fishingToolManager.deserialize(ex.tools);
        if (ex.consumables && game.consumableManager) game.consumableManager.deserialize(ex.consumables);
        if (ex.housing && game.housingManager) game.housingManager.deserialize(ex.housing, game.propertyManager);
        if (ex.cosmetics && game.cosmeticManager) game.cosmeticManager.deserialize(ex.cosmetics);
        if (ex.customization && game.characterCustomization) game.characterCustomization.deserialize(ex.customization);
        if (ex.services && game.serviceManager) game.serviceManager.deserialize(ex.services);
        if (ex.crew && game.crewManager) game.crewManager.deserialize(ex.crew);
        if (ex.cannon && game.cannonManager) game.cannonManager.deserialize(ex.cannon);
        if (ex.giants && game.giantFishManager) game.giantFishManager.deserialize(ex.giants);
        if (ex.treasures && game.treasureManager) game.treasureManager.deserialize(ex.treasures);
        if (Array.isArray(ex.titles) && game.unlockedTitles) {
          game.unlockedTitles = new Set(ex.titles);
        }
        if (ex.dailyCatches !== undefined) game.expansionDailyCatches = Number(ex.dailyCatches) || 0;
        if (ex.npcFriendship && game.expansionNpcManager) game.expansionNpcManager.deserialize(ex.npcFriendship);
        if (ex.bosses && game.bossManager) game.bossManager.deserialize(ex.bosses);
      }

      // 13. Expansion 6.0: farming and gathering
      const ex6 = payload.expansion6;
      if (ex6 && typeof ex6 === 'object') {
        if (ex6.farm && game.farmingManager) game.farmingManager.deserialize(ex6.farm);
        if (ex6.gathering && game.gatheringManager) game.gatheringManager.deserialize(ex6.gathering);
      }

      // 14. Expansion 7.0: frontier expedition progress
      const ex7 = payload.expansion7;
      if (ex7 && typeof ex7 === 'object' && ex7.frontier && typeof ex7.frontier === 'object') {
        const visited = Array.isArray(ex7.frontier.visited) ? ex7.frontier.visited : [];
        if (game.visitedFrontierIslands) {
          game.visitedFrontierIslands = new Set(visited.filter((id) => typeof id === 'string'));
        }
        game.frontierCatches = Number(ex7.frontier.catches) || 0;
      }

      // 15. Expansion 8.0: story journal, secret chest and ambient patrol
      const ex8 = payload.expansion8;
      if (ex8 && typeof ex8 === 'object') {
        if (ex8.story && game.storyJournal) game.storyJournal.deserialize(ex8.story);
        if (ex8.secretChest && game.secretChest) game.secretChest.deserialize(ex8.secretChest);
        if (ex8.piratePatrol && game.piratePatrol && Number.isFinite(ex8.piratePatrol.angle)) {
          game.piratePatrol.angle = ex8.piratePatrol.angle;
          game.piratePatrol._place();
        }
        if (game.storyJournal) game.storyJournal.snapshot(game);
      }
      if (game._updateCarrySpeed) game._updateCarrySpeed();
      if (game.rodManager) game.rodManager.applyEquippedToPlayer();

      return { success: true, payload };
    } catch (err) {
      return { success: false, reason: `Failed to restore game state: ${err.message}` };
    }
  }
}

export default SaveManager;
