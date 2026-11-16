// FarmingManager: owns every crop bed in the world, advances growth, handles
// planting/watering/harvesting, farm tool upgrades and persistence.

import { CropDefinitions, FarmToolDefinitions, getCropDefinition, getFarmToolDefinition } from './crops.js';
import { FarmPlot } from './FarmPlot.js';
import { CityIsland } from '../world/cityIsland.js';

const STARTER_BASE = { x: -58, z: 46 };
const CITY_BASE = { x: CityIsland.center.x - 40, z: CityIsland.center.z + 35 };
const STARTER_COLUMNS = 3;
const CITY_COLUMNS = 4;

function randomInt(min, max) {
  const lo = Math.ceil(Number(min) || 0);
  const hi = Math.floor(Number(max) || lo);
  if (hi <= lo) return lo;
  return lo + Math.floor(Math.random() * (hi - lo + 1));
}

export class FarmingManager {
  constructor(options = {}) {
    this.cropCatalog = CropDefinitions;
    this.toolCatalog = FarmToolDefinitions;
    this.ownedToolIds = new Set(['farm_can_tin', 'farm_hoe_wood']);
    this.equippedCanId = 'farm_can_tin';
    this.equippedHoeId = 'farm_hoe_wood';
    this.selectedCropId = 'turnip';
    this.stats = { planted: 0, harvested: 0, produce: 0, coinsEarned: 0 };
    this.onNotification = null;
    this.onHarvest = null;
    this.sampleHeight = typeof options.sampleHeight === 'function'
      ? options.sampleHeight
      : () => 0;
    this.plots = [];
    this._createPlots();
  }

  _createPlots() {
    for (let index = 0; index < 6; index++) {
      const col = index % STARTER_COLUMNS;
      const row = Math.floor(index / STARTER_COLUMNS);
      const x = STARTER_BASE.x + col * 4.6;
      const z = STARTER_BASE.z + row * 4.8;
      this.plots.push(new FarmPlot({
        id: `plot_starter_${index + 1}`,
        name: `Harbor Farm Bed ${index + 1}`,
        zone: 'starter',
        zoneLabel: 'Driftwood Harbor Farm',
        position: { x, y: this.sampleHeight(x, z), z },
      }));
    }

    for (let index = 0; index < 8; index++) {
      const col = index % CITY_COLUMNS;
      const row = Math.floor(index / CITY_COLUMNS);
      const x = CITY_BASE.x + col * 4.2;
      const z = CITY_BASE.z + row * 4.2;
      this.plots.push(new FarmPlot({
        id: `plot_city_${index + 1}`,
        name: `Aurelia Rooftop Bed ${index + 1}`,
        zone: 'city',
        zoneLabel: 'Aurelia Rooftop Farm',
        position: { x, y: this.sampleHeight(x, z), z },
      }));
    }
  }

  getPlot(plotId) {
    return this.plots.find((plot) => plot.id === plotId) || null;
  }

  getPlots() {
    const tool = this.getEquippedCan();
    return this.plots.map((plot) => plot.getState(tool));
  }

  getCropCatalog() {
    return this.cropCatalog.map((crop) => ({
      ...crop,
      isSelected: crop.id === this.selectedCropId,
      canAfford: true,
    }));
  }

  getToolCatalog() {
    return this.toolCatalog.map((tool) => ({
      ...tool,
      isOwned: this.ownedToolIds.has(tool.id),
      isEquipped: tool.type === 'watering_can'
        ? this.equippedCanId === tool.id
        : this.equippedHoeId === tool.id,
    }));
  }

  getEquippedCan() {
    return getFarmToolDefinition(this.equippedCanId);
  }

  getEquippedHoe() {
    return getFarmToolDefinition(this.equippedHoeId);
  }

  getGrowthBonus() {
    return Number(this.getEquippedCan()?.growthBonus) || 0;
  }

  getYieldBonus() {
    return Number(this.getEquippedHoe()?.yieldBonus) || 0;
  }

  selectCrop(cropId) {
    if (!getCropDefinition(cropId)) return { success: false, reason: 'Unknown crop' };
    this.selectedCropId = cropId;
    return { success: true, crop: getCropDefinition(cropId) };
  }

  buyTool(toolId, economy) {
    const tool = getFarmToolDefinition(toolId);
    if (!tool) return { success: false, reason: 'Unknown farm tool' };
    if (this.ownedToolIds.has(toolId)) return { success: false, reason: 'Farm tool already owned' };
    if (!economy || !economy.canAfford(tool.cost)) return { success: false, reason: `Need ${tool.cost} coins` };
    if (!economy.spendCoins(tool.cost)) return { success: false, reason: 'Transaction failed' };
    this.ownedToolIds.add(toolId);
    this._equipTool(tool);
    this._notify(`${tool.name} purchased and equipped`);
    return { success: true, tool, newBalance: economy.getCoins() };
  }

  equipTool(toolId) {
    const tool = getFarmToolDefinition(toolId);
    if (!tool) return { success: false, reason: 'Unknown farm tool' };
    if (!this.ownedToolIds.has(toolId)) return { success: false, reason: 'Farm tool not owned' };
    this._equipTool(tool);
    return { success: true, tool };
  }

  _equipTool(tool) {
    if (tool.type === 'watering_can') this.equippedCanId = tool.id;
    else this.equippedHoeId = tool.id;
  }

  plant(plotId, cropId = this.selectedCropId, economy = null) {
    const plot = this.getPlot(plotId);
    if (!plot) return { success: false, reason: 'Unknown farm plot' };
    if (plot.cropId) return { success: false, reason: 'This plot is already planted' };
    const crop = getCropDefinition(cropId);
    if (!crop) return { success: false, reason: 'Unknown crop' };
    if (economy) {
      if (!economy.canAfford(crop.cost)) {
        return { success: false, reason: `Need ${crop.cost} coins for ${crop.name} seed` };
      }
      if (!economy.spendCoins(crop.cost)) return { success: false, reason: 'Transaction failed' };
    }
    const result = plot.plant(crop.id);
    if (!result.success) return result;
    this.stats.planted++;
    this._notify(`Planted ${crop.name} in ${plot.name}`);
    return { success: true, crop, plot, cost: crop.cost };
  }

  water(plotId) {
    const plot = this.getPlot(plotId);
    if (!plot) return { success: false, reason: 'Unknown farm plot' };
    const result = plot.water();
    if (!result.success) return result;
    this._notify(`${plot.name} watered — growth +${Math.round((0.5 + this.getGrowthBonus()) * 100)}%`);
    return result;
  }

  harvest(plotId, context = {}) {
    const plot = this.getPlot(plotId);
    if (!plot) return { success: false, reason: 'Unknown farm plot' };
    if (!plot.crop) return { success: false, reason: 'Nothing is planted in this plot' };
    if (!plot.isReady) {
      return { success: false, reason: `${plot.crop.name} is still growing (${Math.round(plot.getProgress())}%)` };
    }

    const crop = plot.crop;
    const qty = Math.max(1, randomInt(crop.yieldMin, crop.yieldMax) + this.getYieldBonus());
    const backpack = context.backpack || null;
    if (backpack) {
      const added = backpack.addItem(crop.produceId, qty, context.inventory || null);
      if (!added.success) return { success: false, reason: added.reason };
    }

    const coins = crop.coinReward;
    const xp = crop.xp;
    if (context.economy) context.economy.addCoins(coins);
    if (context.progression && typeof context.progression.addXp === 'function') {
      context.progression.addXp(xp);
    }

    plot.harvestCount++;
    plot.reset();
    this.stats.harvested++;
    this.stats.produce += qty;
    this.stats.coinsEarned += coins;

    const payload = {
      success: true,
      plotId: plot.id,
      crop,
      produceId: crop.produceId,
      qty,
      coins,
      xp,
    };
    this._notify(`Harvested ${qty} × ${crop.name} (+${coins} coins, +${xp} XP)`);
    if (typeof this.onHarvest === 'function') this.onHarvest(payload);
    return payload;
  }

  /**
   * Single interaction entry point used by a FarmPlot. Uses the selected seed
   * when empty, waters a dry crop, and harvests a ripe one.
   */
  interactWithPlot(plotOrId, player = null, context = {}) {
    const plot = typeof plotOrId === 'string' ? this.getPlot(plotOrId) : plotOrId;
    if (!plot) return { success: false, reason: 'Unknown farm plot' };
    if (plot.isReady) return this.harvest(plot.id, context);
    if (!plot.crop) return this.plant(plot.id, this.selectedCropId, context.economy || null);
    if (!plot.watered) return this.water(plot.id);
    return {
      success: true,
      message: `${plot.crop.name} is growing — ${Math.round(plot.getProgress())}%`,
      plot,
    };
  }

  update(dt, multiplier = 1) {
    const tool = this.getEquippedCan();
    for (const plot of this.plots) {
      plot.updateGrowth(dt, tool, multiplier);
    }
  }

  getSummary() {
    const tool = this.getEquippedCan();
    let ready = 0;
    let growing = 0;
    let empty = 0;
    let watered = 0;
    for (const plot of this.plots) {
      if (!plot.crop) empty++;
      else if (plot.isReady) ready++;
      else growing++;
      if (plot.watered && plot.crop) watered++;
    }
    return {
      totalPlots: this.plots.length,
      ready,
      growing,
      empty,
      watered,
      selectedCropId: this.selectedCropId,
      equippedCan: tool ? tool.name : null,
      equippedHoe: this.getEquippedHoe() ? this.getEquippedHoe().name : null,
      growthBonus: this.getGrowthBonus(),
      yieldBonus: this.getYieldBonus(),
      ownedTools: this.ownedToolIds.size,
      ...this.stats,
    };
  }

  serialize() {
    return {
      plots: this.plots.map((plot) => plot.serialize()),
      ownedToolIds: Array.from(this.ownedToolIds),
      equippedCanId: this.equippedCanId,
      equippedHoeId: this.equippedHoeId,
      selectedCropId: this.selectedCropId,
      stats: { ...this.stats },
    };
  }

  deserialize(data) {
    if (!data || typeof data !== 'object') return;
    const validTools = new Set(this.toolCatalog.map((tool) => tool.id));
    const owned = Array.isArray(data.ownedToolIds)
      ? data.ownedToolIds.filter((id) => validTools.has(id))
      : [];
    this.ownedToolIds = new Set(owned.length ? owned : ['farm_can_tin', 'farm_hoe_wood']);
    this.ownedToolIds.add('farm_can_tin');
    this.ownedToolIds.add('farm_hoe_wood');

    const can = getFarmToolDefinition(data.equippedCanId);
    this.equippedCanId = can && can.type === 'watering_can' && this.ownedToolIds.has(can.id)
      ? can.id
      : 'farm_can_tin';
    const hoe = getFarmToolDefinition(data.equippedHoeId);
    this.equippedHoeId = hoe && hoe.type === 'hoe' && this.ownedToolIds.has(hoe.id)
      ? hoe.id
      : 'farm_hoe_wood';
    this.selectedCropId = getCropDefinition(data.selectedCropId) ? data.selectedCropId : 'turnip';

    if (Array.isArray(data.plots)) {
      for (const entry of data.plots) {
        const plot = this.getPlot(entry.id);
        if (plot) plot.deserialize(entry);
      }
    }

    this.stats = {
      planted: Number(data.stats?.planted) || 0,
      harvested: Number(data.stats?.harvested) || 0,
      produce: Number(data.stats?.produce) || 0,
      coinsEarned: Number(data.stats?.coinsEarned) || 0,
    };
  }

  reset() {
    for (const plot of this.plots) plot.reset();
    this.ownedToolIds = new Set(['farm_can_tin', 'farm_hoe_wood']);
    this.equippedCanId = 'farm_can_tin';
    this.equippedHoeId = 'farm_hoe_wood';
    this.selectedCropId = 'turnip';
    this.stats = { planted: 0, harvested: 0, produce: 0, coinsEarned: 0 };
  }

  _notify(message) {
    if (typeof this.onNotification === 'function' && message) this.onNotification(message);
  }
}

export default FarmingManager;
