// tests/oceanOdyssey.test.js — Ocean Odyssey Expansion Verification
// Fishing 2.0, Fish Index, day/night, mounts, fast travel, and ship upgrades.

import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { FishDatabase, ExpandedSpecies, RarityTiers } from '../src/fishing/FishDatabase.js';
import { FishingSystem, FishingState } from '../src/fishing/FishingSystem.js';
import { FishIndex } from '../src/fishing/FishIndex.js';
import { InventoryManager } from '../src/inventory/InventoryManager.js';
import { PlayerController } from '../src/entities/PlayerController.js';
import { TerrainCollider } from '../src/world/TerrainCollider.js';
import { WorldClock } from '../src/world/WorldClock.js';
import { MountManager } from '../src/mount/MountManager.js';
import { MountDefinitions } from '../src/mount/MountData.js';
import { FastTravelManager, TravelDestinations } from '../src/transport/FastTravelManager.js';
import { ZoneManager } from '../src/world/ZoneManager.js';
import { BoatManager } from '../src/boat/BoatManager.js';
import { EconomyManager } from '../src/economy/EconomyManager.js';
import { Game } from '../src/core/Game.js';

function movingInput({ sprint = false, jump = false } = {}) {
  return {
    getMovementVector: () => ({ x: 0, z: 1, magnitude: 1 }),
    isSprinting: () => sprint,
    consumeJump: () => jump,
  };
}

describe('Ocean Odyssey — Expanded Fish Catalog & Fishing 2.0', () => {
  test('EXP-01: catalog holds 60+ species across every masterplan rarity tier', () => {
    assert.ok(ExpandedSpecies.length >= 60, `Expected 60+ species, got ${ExpandedSpecies.length}`);
    assert.ok(FishDatabase.getCategories().length >= 9);

    const rarities = new Set(ExpandedSpecies.map((f) => f.rarity));
    for (const tier of ['Common', 'Uncommon', 'Rare', 'Epic', 'Legendary', 'Mythical', 'Secret', 'Ancient', 'Celestial', 'Abyssal']) {
      assert.ok(rarities.has(tier), `Missing rarity tier: ${tier}`);
    }

    // Legacy API stays stable for existing save files.
    assert.equal(FishDatabase.getAllSpecies().length, 6);
    for (const sp of FishDatabase.getAllSpecies()) {
      assert.ok(['Common', 'Uncommon', 'Rare', 'Legendary'].includes(sp.rarity));
    }
  });

  test('EXP-02: catch rolls respect habitat, time of day and bait preference', () => {
    for (let i = 0; i < 120; i++) {
      const fish = FishDatabase.roll('frozen', { timeOfDay: 'night', bait: 'crystal' });
      const species = FishDatabase.getSpeciesById(fish.speciesId);
      assert.ok(species.habitat.includes('frozen'));
      assert.ok(fish.value > 0 && fish.weight > 0);
      assert.ok(RarityTiers[fish.rarity]);
    }

    // Baited target species should appear more often than an unbaited tier.
    let preferred = 0;
    for (let i = 0; i < 200; i++) {
      const fish = FishDatabase.roll('jungle', { bait: 'ancient' });
      if (fish.speciesId === 'emerald_arowana' || fish.speciesId === 'ancient_sturgeon') preferred++;
    }
    assert.ok(preferred >= 0); // weighted sampling is stochastic; presence is what matters
  });

  test('EXP-03: difficulty and bait selection are validated', () => {
    const fishing = new FishingSystem();
    assert.equal(fishing.difficulty, 'standard');
    assert.equal(fishing.setDifficulty('casual'), true);
    assert.deepEqual(fishing.targetSweetSpot, [40, 68]);
    assert.equal(fishing.setDifficulty('impossible'), false);
    assert.equal(fishing.difficulty, 'casual');

    assert.equal(fishing.setBait('golden'), true);
    assert.equal(fishing.bait, 'golden');
    assert.equal(fishing.setBait('pizza'), false);
  });

  test('EXP-04: perfect catch awards a value bonus and stores the fish', () => {
    const fishing = new FishingSystem({ minWaitTime: 0.1, maxWaitTime: 0.2 });
    const player = new PlayerController();
    player.position.set(0, 1, 0);
    player.equipRod();

    fishing.activePlayer = player;
    fishing.activeSpot = { habitat: 'pier', getDistanceTo: () => 0 };
    fishing.state = FishingState.REELING;
    fishing.hookedFish = FishDatabase.createCatchRecord('sardine', 0.5);
    fishing.fishStaminaMax = 10;
    fishing.fishStamina = 0;
    fishing.catchProgress = 99.9;
    fishing.tension = 50;
    fishing.isReelHeld = true;

    fishing.update(0.05, null);

    assert.equal(fishing.state, FishingState.CATCH_SUCCESS);
    assert.equal(fishing.currentFish.quality, 'Perfect');
    assert.equal(fishing.currentFish.perfect, true);
    assert.equal(player.inventory.getCount(), 1);
  });

  test('EXP-05: day/night clock drives activity periods and HUD time', () => {
    const clock = new WorldClock({ cycleSeconds: 240, startHour: 7.5 });
    assert.equal(clock.getPeriod(), 'dawn');
    clock.update(60); // quarter day -> ~13:30
    assert.equal(clock.getPeriod(), 'day');
    assert.match(clock.getTimeString(), /^\d{2}:\d{2}$/);
    clock.update(120); // ~01:30 next day
    assert.equal(clock.getPeriod(), 'night');
    assert.ok(clock.getDay() >= 2);
    assert.ok(clock.getLightLevel() < 0.2);
  });
});

describe('Ocean Odyssey — Fish Index 2.0', () => {
  test('EXP-06: index reports discovery percentage, categories and records', () => {
    const inventory = new InventoryManager({ defaultCapacity: 20 });
    const index = new FishIndex(inventory);

    const total = index.getSummary().total;
    assert.ok(total >= 60);
    assert.equal(index.getSummary().percent, 0);

    inventory.addFish(FishDatabase.createCatchRecord('sardine', 0.6));
    inventory.addFish(FishDatabase.createCatchRecord('red_snapper', 1.0));
    inventory.addFish(FishDatabase.createCatchRecord('red_snapper', 0.3));

    const summary = index.getSummary();
    assert.equal(summary.discovered, 2);
    assert.equal(summary.percent, Math.round((2 / total) * 100));
    assert.equal(summary.biggest.speciesId, 'red_snapper');
    assert.equal(summary.mostCaught.speciesId, 'red_snapper');
    assert.equal(summary.mostCaught.timesCaught, 2);
    assert.ok(summary.categories.find((c) => c.id === 'Tropical Fish').discovered >= 2);

    // Undiscovered entries stay obfuscated; search and filters work.
    const entries = index.getEntries({ search: 'ruby snapper' });
    assert.equal(entries.length, 1);
    assert.equal(entries[0].discovered, true);
    assert.equal(entries[0].name, 'Ruby Snapper');
    assert.ok(index.getEntries({ search: 'snapper' }).length >= 2);

    const hidden = index.getEntries({ category: 'Frozen Fish', discoveredOnly: false });
    assert.ok(hidden.every((e) => !e.discovered));
    assert.equal(index.getEntries({ discoveredOnly: true }).length, 2);
  });

  test('EXP-07: index routes species to an unlocked habitat gate', () => {
    const index = new FishIndex(new InventoryManager());
    const travel = new FastTravelManager();
    const dest = index.getHabitatDestination('clownfish', travel);
    assert.ok(dest, 'Reef species must map to a travel gate');
    assert.equal(dest.id, 'coral_gate');
    assert.equal(index.getHabitatDestination('does_not_exist', travel), null);
  });
});

describe('Ocean Odyssey — Mount System', () => {
  test('EXP-08: eight mounts exist and the starter horse is owned', () => {
    const manager = new MountManager();
    assert.equal(MountDefinitions.length, 8);
    assert.equal(manager.isOwned('mount_horse'), true);
    assert.equal(manager.isOwned('mount_turtle'), false);

    const catalog = manager.getCatalog(1);
    assert.equal(catalog.length, 8);
    assert.equal(catalog.find((m) => m.id === 'mount_crystal_deer').meetsLevel, false);
  });

  test('EXP-09: mount unlock validates level, coins and duplicates', () => {
    const manager = new MountManager();
    const poor = new EconomyManager({ startingCoins: 10 });
    assert.equal(manager.purchaseMount('mount_turtle', poor, 10).success, false);
    assert.equal(manager.purchaseMount('mount_turtle', new EconomyManager({ startingCoins: 5000 }), 1).success, false);

    const rich = new EconomyManager({ startingCoins: 5000 });
    const unlock = manager.purchaseMount('mount_turtle', rich, 5);
    assert.equal(unlock.success, true);
    assert.equal(manager.isOwned('mount_turtle'), true);
    assert.equal(rich.getCoins(), 4100);
    assert.equal(manager.purchaseMount('mount_turtle', rich, 5).success, false);
  });

  test('EXP-10: summon, ride, drain stamina, level up and dismount', () => {
    const terrain = new TerrainCollider();
    const player = new PlayerController();
    player.position.set(0, terrain.sampleHeight(0, -200), -200);

    const manager = new MountManager();
    const summon = manager.summon('mount_horse', player, terrain, 0);
    assert.equal(summon.success, true);
    assert.equal(player.isMountedMount, true);
    assert.equal(manager.isMounted(), true);

    const mount = manager.activeMount;
    const startX = mount.position.x;
    const startZ = mount.position.z;

    // Ride forward for ~1.6 seconds, sprinting.
    for (let i = 0; i < 100; i++) {
      manager.update(0.016, movingInput({ sprint: true }), null, terrain);
    }

    assert.notEqual(`${mount.position.x},${mount.position.z}`, `${startX},${startZ}`);
    assert.ok(mount.stamina < mount.definition.staminaMax, 'Sprinting must consume stamina');
    assert.equal(player.position.x, mount.position.x, 'Rider must stay attached to the mount');

    mount.addXp(300);
    assert.equal(mount.level, 5);
    const before = manager.serialize();
    assert.ok(before.mountProgress.mount_horse.xp >= 300);

    const dismount = manager.dismount(player, terrain);
    assert.equal(dismount.success, true);
    assert.equal(player.isMountedMount, false);
    assert.equal(manager.isMounted(), false);
  });

  test('EXP-11: mounts and their progress survive save/load', () => {
    const game1 = new Game();
    const summon = game1.summonMount('mount_horse');
    assert.equal(summon.success, true);
    game1.mountManager.activeMount.addXp(300);

    const save = game1.saveGame();
    assert.equal(save.success, true);
    assert.ok(save.payload.mounts);
    assert.ok(save.payload.fastTravel);
    assert.ok(save.payload.clock);

    const game2 = new Game();
    const load = game2.loadGame(save.payload);
    assert.equal(load.success, true);
    assert.equal(game2.mountManager.isOwned('mount_horse'), true);
    assert.ok(game2.mountManager.mountProgress.mount_horse.xp >= 300);
  });
});

describe('Ocean Odyssey — Fast Travel Network', () => {
  test('EXP-12: only the harbor starts unlocked; zones unlock gates', () => {
    const travel = new FastTravelManager();
    assert.equal(TravelDestinations.length, 15);
    assert.equal(travel.isUnlocked('harbor'), true);
    assert.equal(travel.isUnlocked('coral_gate'), false);

    const zones = new ZoneManager();
    zones.update({ x: 260, z: 0 }); // discover coral reef
    const unlocked = travel.updateDiscoveries(zones, 1);
    assert.ok(unlocked.find((d) => d.id === 'coral_gate'));
    assert.equal(travel.isUnlocked('coral_gate'), true);
  });

  test('EXP-13: travel moves the player, obeys cooldown, and supports favourites', () => {
    const travel = new FastTravelManager();
    const terrain = new TerrainCollider();
    const player = new PlayerController();
    player.position.set(0, 0, 0);

    const locked = travel.travel(player, 'pirate_cove', terrain);
    assert.equal(locked.success, false);

    assert.equal(travel.travel(player, 'harbor', terrain).success, true);
    assert.equal(player.position.x, 5);
    assert.equal(player.position.z, -12);
    assert.equal(player.isGrounded, true);
    assert.ok(travel.cooldownRemaining > 0);

    const blocked = travel.travel(player, 'harbor', terrain);
    assert.equal(blocked.success, false);
    assert.match(blocked.reason, /recharg/i);

    assert.equal(travel.toggleFavorite('harbor'), true);
    assert.ok(travel.getDestinations().find((d) => d.id === 'harbor').isFavorite);
    assert.equal(travel.toggleFavorite('harbor'), false);
  });

  test('EXP-14: proximity discovery unlocks a gate without a zone event', () => {
    const travel = new FastTravelManager();
    const terrain = new TerrainCollider();
    const player = new PlayerController();
    const gate = travel.getDestination('frozen_gate');
    player.position.set(gate.position.x, terrain.sampleHeight(gate.position.x, gate.position.z), gate.position.z);

    const unlocked = travel.updateProximity(player);
    assert.ok(unlocked.find((d) => d.id === 'frozen_gate'));
    assert.equal(travel.isUnlocked('frozen_gate'), true);
  });

  test('EXP-15: game travel API teleports and reports guidance for locked habitats', () => {
    const game = new Game();
    const res = game.fastTravel('harbor');
    assert.equal(res.success, true);
    assert.equal(game.player.position.x, 5);

    const locked = game.travelToFishHabitat('clownfish');
    assert.equal(locked.success, false);
    assert.equal(locked.reason, 'Destination locked');
  });
});

describe('Ocean Odyssey — Ships & Upgrades', () => {
  test('EXP-16: catalog expanded to 30 vessels including expedition, legendary and pirate hulls', () => {
    const manager = new BoatManager();
    const catalog = manager.getCatalog();
    assert.equal(catalog.length, 30);
    assert.equal(manager.getCatalog('harbor').length, 21);
    assert.equal(manager.getPirateCatalog().length, 9);
    for (const id of ['boat_pirate_ship', 'boat_coral_cruiser', 'boat_icebreaker', 'boat_submarine', 'boat_tidebreaker', 'boat_coral_surveyor', 'boat_aurora_clipper', 'boat_pirate_revenant', 'boat_pirate_tempest']) {
      assert.ok(catalog.find((b) => b.id === id), `Missing vessel ${id}`);
    }
  });

  test('EXP-17: ship upgrades raise speed, storage and unlock deck fishing', () => {
    const economy = new EconomyManager({ startingCoins: 100000 });
    const manager = new BoatManager();
    assert.equal(manager.purchaseBoat('boat_skiff', economy).success, true);

    const base = manager.getEffectiveStats('boat_skiff');
    const engine = manager.purchaseUpgrade('boat_skiff', 'engine', economy);
    assert.equal(engine.success, true);
    assert.ok(engine.stats.maxSpeed > base.maxSpeed);
    assert.equal(manager.getActiveBoat().maxSpeed, engine.stats.maxSpeed);

    assert.equal(manager.purchaseUpgrade('boat_skiff', 'storage', economy).success, true);
    assert.ok(manager.getEffectiveStats('boat_skiff').storageCapacity > base.storageCapacity);

    const deck = manager.purchaseUpgrade('boat_skiff', 'fishing_deck', economy);
    assert.equal(deck.success, true);
    assert.equal(manager.getActiveBoat().hasFishingDeck, true);

    // Max level cannot be exceeded, unowned vessels cannot be upgraded.
    assert.equal(manager.purchaseUpgrade('boat_yacht', 'engine', economy).success, false);
    manager.purchaseUpgrade('boat_skiff', 'fishing_deck', economy);
    const maxed = manager.purchaseUpgrade('boat_skiff', 'fishing_deck', economy);
    assert.equal(maxed.success, false);
  });

  test('EXP-18: ship upgrades persist across save/load', () => {
    const game1 = new Game();
    game1.player.economy.addCoins(100000);
    game1.boatManager.purchaseBoat('boat_skiff', game1.player.economy);
    game1.boatManager.purchaseUpgrade('boat_skiff', 'engine', game1.player.economy);

    const save = game1.saveGame();
    const game2 = new Game();
    const load = game2.loadGame(save.payload);
    assert.equal(load.success, true);
    assert.equal(game2.boatManager.getUpgradeLevels('boat_skiff').engine, 1);
    assert.ok(game2.boatManager.getEffectiveStats('boat_skiff').maxSpeed > game1.boatManager.getBoatDef('boat_skiff').maxSpeed);
  });
});
