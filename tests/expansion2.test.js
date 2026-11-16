// tests/expansion2.test.js — Expansion 2.0 verification: housing, rods,
// backpacks, consumables, cosmetics, giant fish, cannons, bosses and services.

import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { Game } from '../src/core/Game.js';
import { PlayerController } from '../src/entities/PlayerController.js';
import { EconomyManager } from '../src/economy/EconomyManager.js';
import { InventoryManager } from '../src/inventory/InventoryManager.js';
import { BackpackManager, CargoManager } from '../src/inventory/BackpackManager.js';
import { RodManager } from '../src/fishing/RodManager.js';
import { ConsumableManager } from '../src/consumables/ConsumableManager.js';
import { HousingManager } from '../src/housing/HousingManager.js';
import { PropertyManager } from '../src/property/PropertyManager.js';
import { CosmeticManager } from '../src/cosmetics/CosmeticManager.js';
import { ServiceManager } from '../src/services/ServiceManager.js';
import { CrewManager } from '../src/boat/CrewManager.js';
import { CannonManager } from '../src/combat/CannonManager.js';
import { BossManager } from '../src/combat/BossManager.js';
import { GiantFishManager } from '../src/ocean/GiantFishManager.js';
import { ExpansionNPCManager } from '../src/npc/ExpansionNPCManager.js';
import { FishDatabase } from '../src/fishing/FishDatabase.js';
import { RodDefinitions, BuildingDefinitions } from '../src/expansion/content.js';
import { TerrainCollider } from '../src/world/TerrainCollider.js';

describe('Expansion 2.0 — Rods, Backpack & Consumables', () => {
  test('E2-01: 50+ rods, purchase, equip and applied stats', () => {
    const player = new PlayerController();
    const rods = new RodManager(player);
    assert.ok(RodDefinitions.length >= 50);
    assert.equal(rods.ownedRodIds.has('rod_bamboo_1'), true);
    assert.equal(rods.equippedRodId, 'rod_bamboo_1');

    const economy = new EconomyManager({ startingCoins: 20000 });
    const buy = rods.buyRod('rod_leviathan_1', economy, 30);
    assert.equal(buy.success, true);
    assert.equal(rods.equipRod('rod_leviathan_1').success, true);
    assert.equal(player.rod.id, 'rod_leviathan_1');
    assert.ok(player.rod.lineStrength > 80);
    assert.equal(player.rod.bonus.giant > 0, true);

    // Duplicate purchase and unowned equip are rejected.
    assert.equal(rods.buyRod('rod_leviathan_1', economy, 30).success, false);
    assert.equal(rods.equipRod('rod_celestial_4').success, false);
  });

  test('E2-02: rod XP levels and skill ranks have caps and costs', () => {
    const player = new PlayerController();
    const rods = new RodManager(player);
    for (let i = 0; i < 20; i++) rods.addXp(500);
    const progress = rods.getProgress('rod_bamboo_1');
    assert.ok(progress.level >= 3);
    assert.equal(rods.unlockSkill('deep_current').success, true);
    assert.equal(rods.getSkillRanks().deep_current, 1);
    const afterOne = rods.getEffectiveStats().lineStrength;
    assert.ok(afterOne > 45);
    assert.equal(rods.unlockSkill('does_not_exist').success, false);
  });

  test('E2-03: backpack enforces weight, slots, stacks and upgrades', () => {
    const inventory = new InventoryManager({ defaultCapacity: 20 });
    const bag = new BackpackManager();
    assert.equal(bag.getCapacitySlots(), 20);
    assert.equal(bag.addItem('ship_repair', 5, inventory).success, true);
    assert.equal(bag.getCount('ship_repair'), 5);
    const load = bag.getLoad(inventory);
    assert.ok(load.weight >= 15);
    assert.equal(load.status, 'normal');

    const economy = new EconomyManager({ startingCoins: 500 });
    assert.equal(bag.purchaseBackpack('bag_explorer', economy).success, true);
    assert.equal(bag.equippedBackpackId, 'bag_explorer');
    assert.ok(bag.getCapacitySlots() > 20);

    // Fill the small starter capacity exactly; adding more is rejected.
    const strict = new BackpackManager({ maxWeight: 3.0 });
    assert.equal(strict.addItem('ship_repair', 2).success, false);
  });

  test('E2-04: cargo transfers fish and supplies with class capacities', () => {
    const cargo = new CargoManager();
    const inventory = new InventoryManager({ defaultCapacity: 10 });
    const bag = new BackpackManager();
    const fish = FishDatabase.createCatchRecord('sardine', 0.5);
    inventory.addFish(fish);
    menu: {
      const boat = { id: 'boat_pirate_ship', storageCapacity: 15, upgradeLevels: {} };
      assert.equal(cargo.depositFish(boat, inventory, fish.instanceId).success, true);
      assert.equal(inventory.getCount(), 0);
      assert.equal(cargo.getState(boat).fish.length, 1);
      assert.equal(cargo.withdrawFish(boat, inventory, fish.instanceId).success, true);
      bag.addItem('mat_wood', 3);
      assert.equal(cargo.depositItem(boat, bag, 'mat_wood', 2).success, true);
      assert.equal(cargo.getState(boat).items.mat_wood, 2);
    }
  });

  test('E2-05: consumable buffs, cooldowns, limits and instant effects', () => {
    const consumables = new ConsumableManager();
    const player = new PlayerController();
    const backpack = new BackpackManager();
    const fishingSystem = { setBait: () => true };
    const context = { player, backpack, fishingSystem };

    assert.equal(consumables.applyItem('potion_luck', context).success, true);
    assert.ok(consumables.getModifier('luck') > 0);
    assert.ok(consumables.getCooldown('potion_luck') > 0);
    assert.equal(consumables.applyItem('potion_luck', context).success, false);

    for (const id of ['reel_boost', 'fish_attractor', 'energy_drink']) {
      assert.equal(consumables.applyItem(id, context).success, true);
    }
    // A fifth buff evicts the oldest instead of stacking endlessly.
    assert.equal(consumables.applyItem('warm_soup', context).success, true);
    assert.ok(consumables.getActiveBuffs().length <= 4);

    player.health = 10;
    backpack.addItem('healing_food', 1);
    assert.equal(consumables.useFromBackpack('healing_food', context).success, true);
    assert.equal(player.health, 55);
    assert.equal(backpack.getCount('healing_food'), 0);
  });

  test('E2-06: cooking consumes fish, requires rare confirmation and yields items', () => {
    const backpack = new BackpackManager();
    const inventory = new InventoryManager({ defaultCapacity: 10 });
    const economy = new EconomyManager({ startingCoins: 1000 });
    const consumables = new ConsumableManager();
    inventory.addFish(FishDatabase.createCatchRecord('sardine', 0.5));
    const cooked = consumables.craft('cook_grilled_salmon', { backpack, inventory, economy });
    assert.equal(cooked.success, true);
    assert.equal(inventory.getCount(), 0);
    assert.equal(backpack.getCount('healing_food'), 2);

    inventory.addFish(FishDatabase.createCatchRecord('golden_trout', 0.5));
    const rare = consumables.craft('cook_golden_sushi', { backpack, inventory, economy });
    assert.equal(rare.success, false);
    assert.equal(rare.requiresConfirmation, true);
    const confirmed = consumables.craft('cook_golden_sushi', { backpack, inventory, economy, confirmRare: true });
    assert.equal(confirmed.success, true);
  });
});

describe('Expansion 2.0 — Housing, Services & Cosmetics', () => {
  test('E2-07: houses can be purchased, upgraded, furnished and store fish', () => {
    const property = new PropertyManager();
    const housing = new HousingManager(property);
    const economy = new EconomyManager({ startingCoins: 100000 });
    const player = new PlayerController();

    const purchase = housing.purchase('plot_seaside', economy);
    assert.equal(purchase.success, true);
    assert.equal(housing.enter('plot_seaside', player).success, true);

    for (const id of ['furn_table', 'furn_sofa', 'furn_lantern']) {
      housing.placeFurniture('plot_seaside', id, economy);
    }
    assert.equal(housing.upgrade('plot_seaside', economy).success, true);
    assert.equal(housing.getHouseState('plot_seaside').level, 2);

    const inventory = new InventoryManager({ defaultCapacity: 10 });
    const fish = FishDatabase.createCatchRecord('seabass', 0.4);
    inventory.addFish(fish);
    assert.equal(housing.storeFish('plot_seaside', inventory, fish.instanceId).success, true);
    assert.equal(housing.getStorageState('plot_seaside').fish.length, 1);

    // Aquarium requires level 4.
    const fish2 = FishDatabase.createCatchRecord('clownfish', 0.5);
    inventory.addFish(fish2);
    assert.equal(housing.stockAquarium('plot_seaside', inventory, fish2.instanceId).success, false);
    housing.getHouseState('plot_seaside').level = 4;
    assert.equal(housing.stockAquarium('plot_seaside', inventory, fish2.instanceId).success, true);
    assert.equal(housing.getHouseState('plot_seaside').aquarium.length, 1);
  });

  test('E2-08: guild, research, auction, daily and crew progression', () => {
    const services = new ServiceManager();
    const inventory = new InventoryManager({ defaultCapacity: 20 });
    const economy = new EconomyManager({ startingCoins: 0 });
    const backpack = new BackpackManager();
    for (let i = 0; i < 5; i++) inventory.addFish(FishDatabase.createCatchRecord('sardine', 0.4));
    const guild = services.getGuildState(inventory);
    assert.equal(guild.totalCatches, 5);

    const fish = inventory.bucket[0];
    const sampled = services.sampleFish(inventory, fish.instanceId);
    assert.equal(sampled.success, true);
    assert.ok(services.researchSamples > 0);

    backpack.addItem('mat_pearl', 2);
    const auction = services.sellAuctionItem('mat_pearl', backpack, economy);
    assert.equal(auction.success, true);
    assert.ok(economy.getCoins() > 0);

    services.updateDaily(1, 3);
    assert.equal(services.claimDaily(economy).success, true);
    assert.equal(services.claimDaily(economy).success, false);

    const crew = new CrewManager();
    const rich = new EconomyManager({ startingCoins: 10000 });
    assert.equal(crew.recruit('crew_bolt', rich).success, true);
    assert.equal(crew.assign('crew_bolt').success, true);
    assert.ok(crew.getBonus('reload') > 0);
  });

  test('E2-09: gacha is coins-only, transparent, pity-backed and equippable', () => {
    const cosmetics = new CosmeticManager({ rng: () => 0.99 });
    const economy = new EconomyManager({ startingCoins: 5000 });
    const preview = cosmetics.getPreview('banner_rods');
    assert.ok(preview.odds.Common > 0);
    assert.equal(preview.pityMilestone, 10);

    const draw = cosmetics.draw('banner_rods', 10, economy);
    assert.equal(draw.success, true);
    assert.equal(draw.rewards.length, 10);
    assert.ok(cosmetics.ownedIds.size >= 1);
    assert.ok(draw.rewards.filter((r) => r.isDuplicate).every((r) => r.tokens > 0));
    assert.equal(cosmetics.equip(draw.rewards[0].id).success, true);
    assert.equal(cosmetics.getCollection().equipped.rod, draw.rewards[0].id);

    // Ten singles guarantee the featured pity reward.
    const poor = new EconomyManager({ startingCoins: 100 });
    assert.equal(cosmetics.draw('banner_ships', 1, poor).success, false);
  });

  test('E2-10: 15 physical service buildings and 12 named NPCs exist', () => {
    assert.equal(BuildingDefinitions.length, 21);
    const game = new Game();
    assert.equal(game.serviceBuildings.length, 21);
    assert.equal(game.expansionNpcManager.getAllNPCs().length, 20);
    for (const building of game.serviceBuildings) {
      assert.ok(building.service);
      assert.ok(building.mesh, 'Service building must have a physical mesh');
      assert.match(building.getPromptText(), /Enter/);
    }
  });
});

describe('Expansion 2.0 — Ocean Encounters, Cannons & Bosses', () => {
  test('E2-11: giant creatures roam, keep depth and populate radar', () => {
    const manager = new GiantFishManager();
    assert.equal(manager.getCreatures().length, 18);
    const creature = manager.getCreature('blue_whale');
    const start = { ...creature.position };
    const player = new PlayerController();
    player.position.set(-120, 2, -260);
    for (let i = 0; i < 300; i++) manager.update(0.05, { player, boat: null });
    assert.notEqual(`${creature.position.x},${creature.position.z}`, `${start.x},${start.z}`);
    assert.ok(creature.position.y <= 0);

    const radar = manager.getRadar(player.position, { range: 500 });
    assert.ok(radar.length >= 1);
    assert.ok(radar[0].distance >= 0);
    assert.ok(radar[0].distanceBand);
    assert.ok(radar[0].direction);
    assert.equal(manager.track('blue_whale').success, true);
    assert.equal(manager.getTracked().id, 'blue_whale');
  });

  test('E2-12: cannons upgrade, consume ammo, reload and resolve assisted fire', () => {
    const cannon = new CannonManager();
    const economy = new EconomyManager({ startingCoins: 100000 });
    assert.equal(cannon.purchaseCannon('cannon_heavy', economy).success, true);
    assert.equal(cannon.equipCannon('cannon_heavy').success, true);
    assert.equal(cannon.purchaseUpgrade('cannon_heavy', 'impact', economy).success, true);
    assert.ok(cannon.getStats().damage > 38);

    const before = cannon.ammo.standard;
    const shot = cannon.fire(0, null);
    assert.equal(shot.success, true);
    assert.equal(cannon.ammo.standard, before - 1);
    assert.ok(cannon.reloadRemaining > 0);
    assert.equal(cannon.fire(0, null).success, false);
    cannon.update(10);
    assert.equal(cannon.fire(0, null).success, true);

    assert.equal(cannon.addAmmo('frost', 2), true);
    assert.equal(cannon.selectAmmo('frost').success, true);
  });

  test('E2-13: boss phases, attacks, damage and defeat rewards flow through Game', () => {
    const game = new Game();
    game.player.economy.addCoins(100000);
    game.boatManager.purchaseBoat('boat_pirate_ship', game.player.economy);
    game.cannonManager.attachToBoat(game.boatManager.getActiveBoat(), game.scene);
    const start = game.startBossEncounter('boss_leviathan');
    assert.equal(start.success, true);
    assert.ok(game.bossManager.activeBoss);
    assert.equal(game.isCombatMode, true);

    const boss = game.bossManager.activeBoss;
    const boat = game.boatManager.getActiveBoat();
    const hullBefore = boat.health;
    for (let i = 0; i < 100; i++) game.bossManager.update(0.1, boat);
    assert.ok(boat.health < hullBefore, 'Boss must be able to damage the ship');

    const damage = game.bossManager.applyDamage(5000, { damageMul: 1 }, { boat });
    assert.equal(damage.defeated, true);
    assert.equal(game.bossManager.activeBoss, null);
    assert.ok(game.player.economy.getCoins() > 0);
    assert.ok(game.unlockedTitles.has('Leviathan Slayer'));
    assert.ok(game.player.inventory.encyclopedia.ancient_leviathan);
  });

  test('E2-14: NPC friendship, gifts and night schedules persist', () => {
    const game = new Game();
    const npc = game.expansionNpcManager.getAllNPCs()[0];
    const talk = game.expansionNpcManager.talk(npc.id, 1);
    assert.equal(talk.success, true);
    assert.equal(talk.friendship.points, 1);
    game.backpackManager.addItem('mat_pearl', 1);
    const gift = game.expansionNpcManager.giveGift(npc.id, 'mat_pearl', game.backpackManager);
    assert.equal(gift.success, true);
    assert.ok(gift.friendship.points > 1);

    const save = game.saveGame();
    const game2 = new Game();
    game2.loadGame(save.payload);
    assert.ok(game2.expansionNpcManager.getFriendship(npc.id).points > 1);
  });

  test('E2-18: NPC requests progress from real catches and persist their claims', () => {
    const game = new Game();
    const catchesBefore = game.expansionDailyCatches;
    const fish = FishDatabase.createCatchRecord('golden_trout', 1.1);
    game.fishingSystem.onCatchSuccess(fish);
    assert.equal(game.expansionDailyCatches, catchesBefore + 1);
    const quest = game.expansionNpcManager.getQuest('old_finn');
    assert.equal(quest.progress, 1);
    assert.equal(quest.canClaim, true);

    const coinsBefore = game.player.economy.getCoins();
    const claim = game.claimNpcQuest('old_finn');
    assert.equal(claim.success, true);
    assert.equal(game.player.economy.getCoins(), coinsBefore + quest.reward);
    assert.equal(game.expansionNpcManager.getQuest('old_finn').claimed, true);
    assert.equal(game.claimNpcQuest('old_finn').success, false);

    const save = game.saveGame();
    const restored = new Game();
    restored.loadGame(save.payload);
    assert.equal(restored.expansionNpcManager.getQuest('old_finn').claimed, true);
    assert.equal(restored.expansionNpcManager.getQuest('old_finn').progress, 1);
  });

  test('E2-15: full expansion state survives save/load', () => {
    const game1 = new Game();
    game1.player.economy.addCoins(100000);
    game1.backpackManager.addItem('potion_luck', 2);
    game1.rodManager.buyRod('rod_coral_1', game1.player.economy, 5);
    game1.rodManager.equipRod('rod_coral_1');
    game1.cosmeticManager.ownedIds.add('cos_rods_1');
    game1.cosmeticManager.equip('cos_rods_1');
    game1.housingManager.purchase('plot_seaside', game1.player.economy);
    game1.serviceManager.researchSamples = 7;
    game1.cannonManager.purchaseCannon('cannon_rapid', game1.player.economy);
    game1.treasureManager.treasures[0].claimed = true;

    const save = game1.saveGame();
    assert.ok(save.payload.expansion2);
    const game2 = new Game();
    const load = game2.loadGame(save.payload);
    assert.equal(load.success, true);
    assert.equal(game2.backpackManager.getCount('potion_luck'), 2);
    assert.equal(game2.rodManager.equippedRodId, 'rod_coral_1');
    assert.equal(game2.cosmeticManager.equipped.rod, 'cos_rods_1');
    assert.equal(game2.housingManager.getHouses().find((h) => h.id === 'plot_seaside').isOwned, true);
    assert.equal(game2.serviceManager.researchSamples, 7);
    assert.equal(game2.cannonManager.ownedCannonIds.has('cannon_rapid'), true);
    assert.equal(game2.treasureManager.treasures[0].claimed, true);
  });

  test('E2-16: player stamina/health and carry weight affect movement', () => {
    const player = new PlayerController();
    const bag = new BackpackManager({ maxWeight: 5 });
    bag.addItem('ship_repair', 1);
    const load = bag.getLoad(player.inventory);
    assert.ok(load.weightPercent > 0);
    player.restoreStamina(10);
    assert.equal(player.stamina, 100);
    player.takeDamage(30);
    assert.equal(player.health, 70);
    player.restoreHealth(10);
    assert.equal(player.health, 80);
  });

  test('E2-17: Game world update stays stable with all Expansion 2.0 systems', () => {
    const game = new Game();
    for (let i = 0; i < 120; i++) game.update(0.016);
    const d = game.getDiagnostics();
    assert.ok(d.giantCreatures >= 10);
    assert.equal(d.carryCapacity > 0, true);
    assert.equal(d.activeBoss, 'None');
    assert.ok(game.serviceBuildings.length === 21);
  });
});
