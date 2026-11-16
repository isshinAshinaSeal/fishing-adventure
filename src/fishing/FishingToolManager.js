// FishingToolManager: permanent fishing tools, equipment modifiers and
// deployable traps. Tools are not rods: they add active/passive utility on top
// of the equipped rod and can be used from the Tools service tab.

import { FishingToolDefinitions } from '../expansion/content.js';
import { ExpeditionToolDefinitions } from './expeditionTools.js';
import { FishDatabase } from './FishDatabase.js';

const MAX_TRAPS = 3;

export class FishingToolManager {
  constructor(options = {}) {
    this.catalog = [...FishingToolDefinitions, ...ExpeditionToolDefinitions];
    this.ownedToolIds = new Set(['tool_basic_kit']);
    this.equippedToolId = 'tool_basic_kit';
    this.traps = [];
    this.onNotification = null;
    this.maxTraps = options.maxTraps || MAX_TRAPS;
    this._trapId = 0;
  }

  getTool(id) {
    return this.catalog.find((tool) => tool.id === id) || null;
  }

  getCatalog() {
    return this.catalog.map((tool) => ({
      ...tool,
      isOwned: this.ownedToolIds.has(tool.id),
      isEquipped: this.equippedToolId === tool.id,
      deployable: Boolean(tool.trap),
    }));
  }

  getEquippedTool() {
    return this.getTool(this.equippedToolId);
  }

  buyTool(id, economy) {
    const tool = this.getTool(id);
    if (!tool) return { success: false, reason: 'Unknown fishing tool' };
    if (this.ownedToolIds.has(id)) return { success: false, reason: 'Tool already owned' };
    if (!economy) return { success: false, reason: 'Economy unavailable' };

    // Gem-locked expedition gear cannot be bought with coins.
    if (tool.gemCost) {
      if (!economy.canAffordGems(tool.gemCost)) {
        return { success: false, reason: `Need ${tool.gemCost} gems` };
      }
      if (!economy.spendGems(tool.gemCost)) return { success: false, reason: 'Gem transaction failed' };
      this.ownedToolIds.add(id);
      if (!this.equippedToolId) this.equippedToolId = id;
      this._notify(`${tool.name} purchased with ${tool.gemCost} gems`);
      return { success: true, tool, spentGems: tool.gemCost, newBalance: economy.getCoins(), gems: economy.getGems() };
    }

    if (!economy.canAfford(tool.cost)) return { success: false, reason: `Need ${tool.cost} coins` };
    if (!economy.spendCoins(tool.cost)) return { success: false, reason: 'Transaction failed' };
    this.ownedToolIds.add(id);
    if (!this.equippedToolId) this.equippedToolId = id;
    this._notify(`${tool.name} purchased`);
    return { success: true, tool, newBalance: economy.getCoins(), gems: economy.getGems() };
  }

  equip(id) {
    if (!this.ownedToolIds.has(id)) return { success: false, reason: 'Tool not owned' };
    const tool = this.getTool(id);
    if (!tool) return { success: false, reason: 'Unknown fishing tool' };
    this.equippedToolId = id;
    return { success: true, tool };
  }

  getModifiers() {
    const tool = this.getEquippedTool();
    const mods = { luck: 0, lineStrength: 0, quality: 0, waitReduction: 0, multiCatch: 0, baitBonus: 0, finder: 0 };
    if (!tool?.modifiers) return mods;
    for (const [key, value] of Object.entries(tool.modifiers)) {
      if (key in mods) mods[key] = Number(value) || 0;
    }
    return mods;
  }

  getTrapCapacity() {
    return this.maxTraps;
  }

  getTraps(now = Date.now()) {
    return this.traps.map((trap) => {
      const remaining = Math.max(0, Math.ceil((trap.readyAt - now) / 1000));
      return { ...trap, remaining, ready: remaining <= 0 };
    });
  }

  deployTrap(toolId, habitat, position = null, now = Date.now()) {
    const tool = this.getTool(toolId);
    if (!tool || !tool.trap) return { success: false, reason: 'This tool cannot be deployed' };
    if (!this.ownedToolIds.has(toolId)) return { success: false, reason: 'Tool not owned' };
    if (this.traps.length >= this.maxTraps) return { success: false, reason: `All ${this.maxTraps} trap slots are occupied` };
    if (this.traps.some((trap) => trap.toolId === toolId && trap.readyAt > now)) {
      return { success: false, reason: 'This trap is already deployed' };
    }

    const trap = {
      id: `trap_${++this._trapId}_${now}`,
      toolId,
      name: tool.name,
      habitat: habitat || 'coast',
      position: position ? { x: position.x, y: position.y, z: position.z } : null,
      deployedAt: now,
      readyAt: now + tool.trap.duration * 1000,
    };
    this.traps.push(trap);
    this._notify(`${tool.name} deployed in ${trap.habitat} waters — ready in ${tool.trap.duration}s`);
    return { success: true, trap, remaining: tool.trap.duration };
  }

  /**
   * Collects every ready trap. Returns all fish caught so the caller can show
   * one combined notification and keep inventory/quest hooks in the game layer.
   */
  collectReady(inventory, now = Date.now()) {
    const ready = this.traps.filter((trap) => trap.readyAt <= now);
    if (ready.length === 0) {
      const next = this.getTraps(now).sort((a, b) => a.remaining - b.remaining)[0];
      return { success: false, reason: next ? `Next trap ready in ${next.remaining}s` : 'No traps deployed', catches: [] };
    }

    const catches = [];
    for (const trap of ready) {
      const tool = this.getTool(trap.toolId);
      const def = tool?.trap || { yield: 1, rarity: 0, quality: 0 };
      const yieldCount = Math.max(1, Number(def.yield) || 1);
      for (let i = 0; i < yieldCount; i++) {
        const fish = FishDatabase.roll(trap.habitat, {
          timeOfDay: 'day',
          bait: 'deep_sea',
          luck: 0.1 + (def.rarity || 0),
          difficultyMul: 1,
        });
        if (def.quality) {
          fish.value = Math.round(fish.value * (1 + def.quality));
          fish.quality = 'Trap-Caught';
        }
        if (inventory && typeof inventory.addFish === 'function') {
          const added = inventory.addFish(fish);
          if (!added || added.success === false) continue;
        }
        catches.push(fish);
      }
      this.traps = this.traps.filter((entry) => entry.id !== trap.id);
    }

    if (catches.length > 0) {
      this._notify(`Collected ${catches.length} trap catch${catches.length === 1 ? '' : 'es'}`);
    }
    return { success: catches.length > 0, catches };
  }

  serialize() {
    return {
      ownedToolIds: Array.from(this.ownedToolIds),
      equippedToolId: this.equippedToolId,
      traps: JSON.parse(JSON.stringify(this.traps)),
      trapId: this._trapId,
    };
  }

  deserialize(data) {
    if (!data) return;
    const validIds = new Set(this.catalog.map((tool) => tool.id));
    this.ownedToolIds = new Set(
      Array.isArray(data.ownedToolIds) && data.ownedToolIds.length
        ? data.ownedToolIds.filter((id) => validIds.has(id))
        : ['tool_basic_kit']
    );
    this.equippedToolId = this.ownedToolIds.has(data.equippedToolId) ? data.equippedToolId : 'tool_basic_kit';
    this.traps = Array.isArray(data.traps)
      ? data.traps.filter((trap) => validIds.has(trap.toolId))
      : [];
    this._trapId = Number(data.trapId) || this.traps.length;
  }

  reset() {
    this.ownedToolIds = new Set(['tool_basic_kit']);
    this.equippedToolId = 'tool_basic_kit';
    this.traps = [];
    this._trapId = 0;
  }

  _notify(message) {
    if (typeof this.onNotification === 'function') this.onNotification(message);
  }
}

export default FishingToolManager;
