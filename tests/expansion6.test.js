// tests/expansion6.test.js — Aurelia Heights, farming, gathering and city fleet.

import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { Game } from '../src/core/Game.js';
import { CityIsland } from '../src/world/cityIsland.js';
import { CropDefinitions, FarmToolDefinitions } from '../src/farming/crops.js';
import { GatheringToolDefinitions, ResourceNodeDefinitions } from '../src/gathering/resources.js';
import { RodDefinitions, FishingToolDefinitions, RecipeDefinitions, MaterialDefinitions } from '../src/expansion/content.js';

describe('Expansion 6.0 — Aurelia Heights, farming and gathering', () => {
  test('E6-01: Aurelia Heights is a real zone with a skyline, residents and its own marina', () => {
    const game = new Game();
    const zone = game.zoneManager.getZoneAt(CityIsland.center.x, CityIsland.center.z);
    assert.equal(zone.id, 'aurelia_city');
    assert.equal(zone.name, 'Aurelia Heights');
    assert.ok(game.terrainCollider.sampleHeight(CityIsland.center.x, CityIsland.center.z) > 10);

    assert.equal(game.cityBuildings.length, 12);
    assert.equal(game.cityNpcs.length, 12);
    assert.equal(game.cityCivilians.length, 18);
    assert.equal(game.npcs.length, 69);
    assert.equal(game.cityFishingSpots.length, 2);
    assert.equal(game.ferries.length, 2);
    assert.ok(game.cityBuildings.some((building) => building.service === 'farming'));
    assert.ok(game.cityBuildings.some((building) => building.service === 'gathering'));
    assert.ok(game.cityBuildings.some((building) => building.service === 'city_boats'));
    assert.ok(game.cityNpcs.some((npc) => npc.id === 'mayor_aurelia'));
    assert.ok(game.cityNpcs.some((npc) => npc.id === 'farmer_rosa'));
  });

  test('E6-02: ferries travel both ways between the harbor and the city', () => {
    const game = new Game();
    const toCity = game.travelToCity();
    assert.equal(toCity.success, true);
    assert.equal(toCity.destination, 'Aurelia Heights');
    assert.ok(Math.abs(game.player.position.x - CityIsland.arrival.x) < 0.5);
    assert.ok(Math.abs(game.player.position.z - CityIsland.arrival.z) < 0.5);
    assert.ok(game.player.position.y > 10);

    const toHarbor = game.travelToHarbor();
    assert.equal(toHarbor.success, true);
    assert.equal(toHarbor.destination, 'Driftwood Harbor');
    assert.ok(Math.abs(game.player.position.x - 12) < 0.5);
    assert.ok(Math.abs(game.player.position.z + 22) < 0.5);
  });

  test('E6-03: twelve crops and eight farm tools drive fourteen plantable beds', () => {
    const game = new Game();
    assert.equal(CropDefinitions.length, 12);
    assert.equal(FarmToolDefinitions.length, 8);

    const farming = game.farmingManager;
    assert.equal(farming.plots.length, 14);
    assert.equal(farming.plots.filter((plot) => plot.zone === 'starter').length, 6);
    assert.equal(farming.plots.filter((plot) => plot.zone === 'city').length, 8);
    assert.equal(farming.ownedToolIds.has('farm_can_tin'), true);
    assert.equal(farming.ownedToolIds.has('farm_hoe_wood'), true);
    assert.ok(farming.plots.every((plot) => plot.mesh));

    const plot = farming.getPlot('plot_starter_1');
    game.player.economy.addCoins(500);
    const before = game.player.economy.getCoins();
    const planted = farming.plant(plot.id, 'turnip', game.player.economy);
    assert.equal(planted.success, true);
    assert.equal(game.player.economy.getCoins(), before - 25);
    assert.equal(plot.cropId, 'turnip');

    assert.equal(farming.water(plot.id).success, true);
    assert.equal(farming.water(plot.id).success, false);

    const rate = plot.getGrowthRate(farming.getEquippedCan());
    assert.ok(rate > 1);
    farming.update(10);
    assert.ok(plot.growth > 10);
    assert.equal(plot.isReady, false);

    plot.growth = plot.crop.growTime;
    const coinsBeforeHarvest = game.player.economy.getCoins();
    const xpBefore = game.player.progression.getXp();
    const harvested = farming.harvest(plot.id, game._farmContext());
    assert.equal(harvested.success, true);
    assert.ok(harvested.qty >= 2);
    assert.equal(harvested.produceId, 'produce_turnip');
    assert.equal(game.backpackManager.has('produce_turnip', harvested.qty), true);
    assert.equal(game.player.economy.getCoins(), coinsBeforeHarvest + harvested.coins);
    assert.equal(game.player.progression.getXp(), xpBefore + harvested.xp);
    assert.equal(plot.cropId, null);

    // The E-interaction path routes through the same FarmingManager.
    const interactivePlot = farming.getPlot('plot_starter_2');
    const plantedByInteraction = interactivePlot.onInteract(game.player, {});
    assert.equal(plantedByInteraction.success, true);
    assert.equal(interactivePlot.cropId, 'turnip');
  });

  test('E6-04: farm tools can be upgraded for growth and yield bonuses', () => {
    const game = new Game();
    game.player.economy.addCoins(12000);
    const farming = game.farmingManager;
    assert.equal(farming.buyTool('farm_can_copper', game.player.economy).success, true);
    assert.equal(farming.buyTool('farm_hoe_iron', game.player.economy).success, true);
    assert.ok(farming.getGrowthBonus() > 0);
    assert.equal(farming.getYieldBonus(), 1);
    assert.equal(farming.equipTool('farm_can_tin').success, true);
    assert.equal(farming.getGrowthBonus(), 0);

    const summary = farming.getSummary();
    assert.equal(summary.totalPlots, 14);
    assert.equal(summary.ownedTools, 4);
    assert.ok(summary.equippedCan);
    assert.ok(summary.equippedHoe);
  });

  test('E6-05: ten gathering tools fell twenty-one tree and ore nodes', () => {
    const game = new Game();
    assert.equal(GatheringToolDefinitions.length, 10);
    assert.equal(ResourceNodeDefinitions.length, 21);

    const gathering = game.gatheringManager;
    assert.equal(gathering.nodes.length, 21);
    assert.equal(gathering.nodes.filter((node) => node.zone === 'harbor').length, 14);
    assert.equal(gathering.nodes.filter((node) => node.zone === 'city').length, 7);
    assert.equal(gathering.nodes.filter((node) => node.kind === 'tree').length, 12);
    assert.equal(gathering.nodes.filter((node) => node.kind === 'rock').length, 9);
    assert.equal(gathering.ownedToolIds.has('axe_rusty'), true);
    assert.equal(gathering.ownedToolIds.has('pickaxe_rusty'), true);

    // The starter hatchet cannot cut ironwood; the iron axe can.
    const ironwood = gathering.getNode('node_tree_harbor_3');
    const blocked = gathering.strike(ironwood.id);
    assert.equal(blocked.success, false);

    game.player.economy.addCoins(3000);
    assert.equal(gathering.buyTool('axe_iron', game.player.economy).success, true);
    let swing = null;
    for (let i = 0; i < 12 && !swing?.depleted; i++) {
      swing = gathering.strike(ironwood.id, { backpack: game.backpackManager });
      if (!swing.success) break;
    }
    assert.equal(swing.success, true);
    assert.equal(swing.depleted, true);
    assert.ok(swing.drops.some((drop) => drop.itemId === 'mat_ironwood'));
    assert.ok(swing.xp > 0);
    assert.equal(game.backpackManager.getCount('mat_ironwood') >= swing.drops.find((drop) => drop.itemId === 'mat_ironwood').qty, true);
    assert.equal(ironwood.isDepleted, true);

    ironwood.respawnRemaining = 0.01;
    gathering.update(0.05);
    assert.equal(ironwood.isDepleted, false);

    // The E-interaction path swings the currently equipped axe.
    const driftwood = gathering.getNode('node_tree_harbor_1');
    const hpBefore = driftwood.hp;
    const swingByInteraction = driftwood.onInteract(game.player, {});
    assert.equal(swingByInteraction.success, true);
    assert.ok(driftwood.hp < hpBefore);
  });

  test('E6-06: the expanded catalogs reach 76 rods, 31 fishing tools and city produce recipes', () => {
    const game = new Game();
    assert.equal(RodDefinitions.length, 76);
    assert.equal(new Set(RodDefinitions.map((rod) => rod.family)).size, 19);
    assert.ok(RodDefinitions.some((rod) => rod.family === 'aurelia'));
    assert.equal(FishingToolDefinitions.length, 31);
    assert.equal(MaterialDefinitions.filter((item) => item.category === 'produce').length, 12);
    assert.ok(RecipeDefinitions.some((recipe) => recipe.id === 'cook_quarry_stew' && recipe.materials));
    assert.ok(RecipeDefinitions.some((recipe) => recipe.id === 'cook_rooftop_salad' && recipe.materials));

    // Multi-material crafting validates the full recipe before consuming anything.
    game.player.economy.addCoins(500);
    game.backpackManager.addItem('produce_potato', 1, game.player.inventory);
    const failed = game.consumableManager.craft('cook_quarry_stew', {
      backpack: game.backpackManager,
      inventory: game.player.inventory,
      economy: game.player.economy,
    });
    assert.equal(failed.success, false);
    assert.equal(game.backpackManager.getCount('produce_potato'), 1);

    game.backpackManager.addItem('mat_stone', 1, game.player.inventory);
    const crafted = game.consumableManager.craft('cook_quarry_stew', {
      backpack: game.backpackManager,
      inventory: game.player.inventory,
      economy: game.player.economy,
    });
    assert.equal(crafted.success, true);
    assert.equal(crafted.output, 'miner_stew');
    assert.equal(game.backpackManager.getCount('produce_potato'), 0);
    assert.equal(game.backpackManager.getCount('mat_stone'), 0);
    assert.equal(game.backpackManager.has('miner_stew'), true);
  });

  test('E6-07: city boats launch from the Sky Marina and can be boarded', () => {
    const game = new Game();
    assert.equal(game.boatManager.getCatalog().length, 30);
    assert.equal(game.boatManager.getCityCatalog().length, 10);
    assert.equal(game.boatManager.getCityCatalog().length + game.boatManager.getCatalog().length, 40);

    game.player.economy.addCoins(2000);
    const bought = game.purchaseCityBoat('boat_city_taxi');
    assert.equal(bought.success, true);
    assert.equal(game.boatManager.getActiveBoat().id, 'boat_city_taxi');
    const boat = game.boatManager.getActiveBoat();
    assert.equal(typeof boat.onInteractHandler, 'function');
    assert.equal(game.interactionManager.interactables.has(boat), true);
    assert.ok(boat.interactionRange >= 6);

    const boarded = boat.onInteractHandler();
    assert.equal(boarded.success, true);
    assert.equal(game.player.isMountedBoat, true);
    boat.dismount(game.player);
    assert.equal(game.player.isMountedBoat, false);
  });

  test('E6-08: farming and gathering survive save/load', () => {
    const game = new Game();
    game.player.economy.addCoins(5000);
    const plot = game.farmingManager.getPlot('plot_city_1');
    assert.equal(game.farmingManager.plant(plot.id, 'carrot', game.player.economy).success, true);
    plot.growth = 30;
    game.farmingManager.selectCrop('sunflower');
    assert.equal(game.gatheringManager.buyTool('pickaxe_steel', game.player.economy).success, true);
    const rock = game.gatheringManager.getNode('node_rock_harbor_4');
    for (let i = 0; i < 12 && !rock.isDepleted; i++) game.gatheringManager.strike(rock.id);

    const save = game.saveGame();
    assert.equal(save.success, true);
    assert.ok(save.payload.expansion6.farm);
    assert.ok(save.payload.expansion6.gathering);

    const restored = new Game();
    assert.equal(restored.loadGame(save.payload).success, true);
    const restoredPlot = restored.farmingManager.getPlot('plot_city_1');
    assert.equal(restoredPlot.cropId, 'carrot');
    assert.equal(restoredPlot.growth, 30);
    assert.equal(restored.farmingManager.selectedCropId, 'sunflower');
    assert.equal(restored.gatheringManager.ownedToolIds.has('pickaxe_steel'), true);
    assert.equal(restored.gatheringManager.getNode('node_rock_harbor_4').isDepleted, true);
  });
});
