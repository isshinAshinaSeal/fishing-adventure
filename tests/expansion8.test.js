// tests/expansion8.test.js — Expansion 8.0: expedition fleet, gems, story book,
// secret chest, pirate patrol, real boat steering and deeper fishing mechanics.
//
// Every earlier exact-count contract is asserted first so this suite also guards
// the merged catalogs against regressions.

import { test, describe } from 'node:test';
import assert from 'node:assert/strict';

import { Game } from '../src/core/Game.js';
import { Config } from '../src/config.js';
import { Boat } from '../src/boat/Boat.js';
import { PlayerController } from '../src/entities/PlayerController.js';
import { PiratePatrol } from '../src/boat/PiratePatrol.js';
import { getExpeditionMooring } from '../src/boat/expeditionBoats.js';
import { FishingState } from '../src/fishing/FishingSystem.js';
import { FishDatabase, BaitTypes } from '../src/fishing/FishDatabase.js';
import { RodDefinitions, FishingToolDefinitions } from '../src/expansion/content.js';
import { ExpeditionRodDefinitions } from '../src/fishing/expeditionRods.js';
import { ExpeditionToolDefinitions } from '../src/fishing/expeditionTools.js';
import { ExpeditionBoatCatalog } from '../src/boat/expeditionBoats.js';
import { GemOffers, getGemOffer } from '../src/economy/gemShop.js';
import { StoryChapters } from '../src/progression/StoryJournal.js';
import { WorldZones } from '../src/world/ZoneManager.js';
import { OuterIslands } from '../src/world/islands.js';
import { TravelDestinations } from '../src/transport/FastTravelManager.js';
import { ExpandedSpecies } from '../src/fishing/FishDatabase.js';

function mockInput(keysDown = []) {
  const set = new Set(keysDown);
  return {
    isKeyDown: (key) => set.has(key),
    isActionJustPressed: (key) => set.has(key),
  };
}

/** Runs one full cast until the bite window is open, then returns the system. */
function reachBite(game) {
  const fishing = game.fishingSystem;
  fishing.reset();
  game.player.equipRod();
  const spot = game.fishingSpots[0];
  game.player.position.set(spot.position.x, spot.position.y, spot.position.z);
  const cast = fishing.quickCast(game.player, spot);
  assert.equal(cast.success, true, 'cast should start');
  fishing.update(0.7);
  assert.equal(fishing.state, FishingState.WAITING);
  fishing.stateTimer = fishing.waitDuration + 0.01;
  fishing.update(0.001);
  assert.equal(fishing.state, FishingState.BITING);
  return fishing;
}

function unlockStoryWithCatches(game, catches = 1) {
  game.player.inventory.encyclopedia = {
    test_species: { timesCaught: catches },
  };
  return game.storyJournal.update(game);
}

describe('Expansion 8.0 — Expedition Fleet, Gems & Story', () => {
  test('E8-01: merged catalogs keep every earlier count while adding new content', () => {
    // Exact legacy contracts.
    assert.equal(RodDefinitions.length, 76);
    assert.equal(FishingToolDefinitions.length, 31);
    assert.equal(WorldZones.length, 15);
    assert.equal(OuterIslands.length, 7);
    assert.equal(TravelDestinations.length, 15);
    assert.equal(ExpandedSpecies.length, 140);
    assert.equal(FishDatabase.getCategories().length, 14);

    // New content.
    assert.equal(ExpeditionRodDefinitions.length, 16);
    assert.equal(ExpeditionToolDefinitions.length, 12);
    assert.equal(ExpeditionBoatCatalog.length, 8);
    assert.equal(StoryChapters.length, 10);
    assert.equal(GemOffers.length, 8);

    const game = new Game();
    assert.equal(game.rodManager.catalog.length, 76 + 16);
    assert.equal(game.fishingToolManager.getCatalog().length, 31 + 12);
    assert.equal(game.boatManager.getCatalog().length, 30);
    assert.equal(game.boatManager.getCityCatalog().length, 10);
    assert.equal(game.boatManager.getExpeditionCatalog().length, 8);
    assert.equal(game.boatManager.getCatalog().length + game.boatManager.getCityCatalog().length, 40);
  });

  test('E8-02: the starter purse is 1,000 coins and gems are a separate hard currency', () => {
    const game = new Game();
    const economy = game.player.economy;

    assert.equal(Config.economy.startingCoins, 1000);
    assert.equal(economy.getCoins(), 1000);
    assert.equal(economy.getGems(), 0);

    assert.equal(economy.canAffordGems(1), false);
    economy.addGems(3);
    assert.equal(economy.getGems(), 3);
    assert.equal(economy.canAffordGems(3), true);
    assert.equal(economy.spendGems(2), true);
    assert.equal(economy.getGems(), 1);
    assert.equal(economy.spendGems(5), false, 'cannot overspend gems');
    assert.equal(economy.getGems(), 1, 'failed gem spend must not change balance');

    // Coins and gems never leak into each other.
    const coinsBefore = economy.getCoins();
    economy.addGems(10);
    assert.equal(economy.getCoins(), coinsBefore);

    economy.reset();
    assert.equal(economy.getCoins(), 1000);
    assert.equal(economy.getGems(), 0);
  });

  test('E8-03: the secret chest in the tackle hut pays 20,000 coins and 2 gems exactly once', () => {
    const game = new Game();
    const chest = game.secretChest;
    assert.ok(chest, 'secret chest must exist');
    assert.equal(chest.rewardCoins, 20000);
    assert.equal(chest.rewardGems, 2);
    assert.ok(Math.abs(chest.position.x - (-12.4)) < 0.6);
    assert.ok(Math.abs(chest.position.z - 6.4) < 0.6);
    assert.ok(game.interactionManager.interactables.has(chest), 'chest must be a real interactable');

    const before = game.player.economy.getCoins();
    const first = chest.open(game.player);
    assert.equal(first.success, true);
    assert.equal(first.coins, 20000);
    assert.equal(first.gems, 2);
    assert.equal(game.player.economy.getCoins(), before + 20000);
    assert.equal(game.player.economy.getGems(), 2);

    const second = chest.open(game.player);
    assert.equal(second.success, false);
    assert.equal(game.player.economy.getCoins(), before + 20000, 'chest cannot pay twice');
    assert.equal(chest.canInteract(), false);

    // Serialization round-trip keeps the chest empty.
    const saved = chest.serialize();
    chest.reset();
    assert.equal(chest.opened, false);
    chest.deserialize(saved);
    assert.equal(chest.opened, true);
    assert.equal(chest.canInteract(), false, 'restored empty chest stays empty');
  });

  test('E8-04: story chapters unlock from live metrics, pay once, and persist read state', () => {
    const game = new Game();
    const journal = game.storyJournal;
    assert.equal(journal.getSummary().total, 10);
    assert.equal(journal.getSummary().unlocked, 0);

    const coinsBefore = game.player.economy.getCoins();
    const unlocked = unlockStoryWithCatches(game, 1);
    assert.equal(unlocked.length, 1);
    assert.equal(unlocked[0].id, 'chapter_first_cast');
    assert.equal(game.player.economy.getCoins(), coinsBefore + 250);
    assert.equal(game.player.economy.getGems(), 1);

    // A second update with the same metric must not pay again.
    journal.update(game);
    assert.equal(game.player.economy.getCoins(), coinsBefore + 250);
    assert.equal(game.player.economy.getGems(), 1);

    const summary = journal.getSummary();
    assert.equal(summary.unlocked, 1);
    assert.equal(summary.active.id, 'chapter_first_cast');

    const read = journal.markRead('chapter_first_cast');
    assert.equal(read.success, true);
    assert.equal(journal.getSummary().read, 1);
    assert.equal(journal.markRead('chapter_ocean_legend').success, false, 'locked chapters cannot be read');

    const objectives = journal.getObjectiveLines(2);
    assert.equal(objectives.length, 2);
    assert.ok(objectives.every((line) => line.target > 0 && line.percent >= 0 && line.percent <= 100));

    // Serialize → reset → deserialize restores unlocked and read state.
    const saved = journal.serialize();
    journal.reset();
    assert.equal(journal.getSummary().unlocked, 0);
    journal.deserialize(saved);
    assert.equal(journal.getSummary().unlocked, 1);
    assert.equal(journal.getSummary().read, 1);
  });

  test('E8-05: exactly one lowest-tier pirate ship circles the main island', () => {
    const game = new Game();
    assert.ok(game.piratePatrol instanceof PiratePatrol, 'the game owns one pirate patrol');
    const patrol = game.piratePatrol;
    assert.equal(patrol.shipId, 'boat_pirate_jolly');
    assert.equal(patrol.radius, Config.world.islandRadius + 46);

    const pirateBoats = Config.boats.filter((boat) => boat.isPirate || boat.vendor === 'pirate');
    const lowestTier = Math.min(...pirateBoats.map((boat) => boat.tier));
    const jolly = pirateBoats.find((boat) => boat.id === 'boat_pirate_jolly');
    assert.ok(jolly, 'Jolly Bilge Skiff must exist');
    assert.equal(jolly.tier, lowestTier, 'the patrolling ship must be the lowest-tier pirate hull');
    assert.equal(patrol.tier, lowestTier);

    // It really circles: angle advances, radius stays fixed.
    const startAngle = patrol.angle;
    for (let i = 0; i < 20; i++) patrol.update(0.1);
    assert.notEqual(patrol.angle, startAngle);
    assert.ok(Math.abs(patrol.getDistanceFromCenter() - patrol.radius) < 0.001);
    assert.ok(patrol.position.x !== 0 || patrol.position.z !== 0);

    patrol.reset();
    assert.equal(patrol.angle, Math.PI * 0.25);
    assert.ok(Math.abs(patrol.getDistanceFromCenter() - patrol.radius) < 0.001);
  });

  test('E8-06: the helm is a real mechanism — rudder easing, speed authority, slip and boost', () => {
    const player = new PlayerController();
    const boat = new Boat({
      id: 'boat_exp_tidecat',
      name: 'Tempest Tidecat',
      isOwned: true,
      position: { x: 0, y: 0, z: -400 },
      yaw: 0,
      maxSpeed: 14,
      acceleration: 7,
      turnRate: 2.4,
      rudderResponse: 3.4,
    });
    const openWater = { sampleHeight: () => -5 };

    boat.mount(player);
    const initial = boat.getSteeringState();
    assert.equal(initial.rudderAngle, 0);
    assert.equal(initial.speed, 0);

    // Throttle forward.
    for (let i = 0; i < 20; i++) boat.update(0.1, mockInput(['KeyW']), openWater);
    const cruising = boat.getSteeringState();
    assert.ok(cruising.speed > 0, 'throttle must move the hull');

    // Steering eases the rudder toward the input instead of snapping yaw.
    const yawBefore = boat.yaw;
    boat.update(0.1, mockInput(['KeyW', 'KeyA']), openWater);
    const turning = boat.getSteeringState();
    assert.ok(turning.rudderAngle > 0 && turning.rudderAngle < 1, 'rudder must ease toward the input');
    assert.ok(boat.yaw > yawBefore, 'rudder authority must turn the hull');
    assert.ok(Math.abs(turning.sideSlip) > 0, 'a hard turn must produce lateral slip');

    // Boost burns the reserve and raises the speed cap.
    const energyBefore = boat.boostEnergy;
    for (let i = 0; i < 20; i++) boat.update(0.1, mockInput(['KeyW', 'ShiftLeft']), openWater);
    const boosted = boat.getSteeringState();
    assert.equal(boosted.isBoosting, true);
    assert.ok(boosted.boostEnergy < energyBefore, 'boost must drain reserve');
    assert.ok(boosted.speed > boat.maxSpeed, 'boost must exceed normal top speed');

    // Releasing everything settles the rudder back to centre.
    for (let i = 0; i < 80; i++) boat.update(0.1, mockInput([]), openWater);
    assert.equal(boat.getSteeringState().rudderAngle, 0);
  });

  test('E8-07: cast distance and hookset timing now depend on the rod and player reaction', () => {
    const game = new Game();
    const fishing = game.fishingSystem;

    const baseProfile = fishing.getCastingProfile(game.player);
    game.player.economy.addCoins(5000);
    const bought = game.rodManager.buyRod('rod_tidewatch_2', game.player.economy, 30);
    assert.equal(bought.success, true);
    assert.equal(game.rodManager.equipRod('rod_tidewatch_2').success, true);
    const longProfile = fishing.getCastingProfile(game.player);
    assert.ok(longProfile.castDistance > baseProfile.castDistance, 'longer rod stats must extend the cast');
    assert.equal(longProfile.habitat, 'coast');

    // Perfect: strike within 0.5s.
    let system = reachBite(game);
    system.stateTimer = 0.3;
    assert.equal(system.strike(), true);
    assert.equal(system.state, FishingState.REELING);
    assert.equal(system.hooksetQuality, 'perfect');
    assert.ok(Math.abs(system.catchProgress - 15 * 1.18) < 0.001);

    // Clean: 0.5s–1.2s.
    system = reachBite(game);
    system.stateTimer = 0.9;
    system.strike();
    assert.equal(system.hooksetQuality, 'clean');
    assert.ok(system.hooksetBonus > 1 && system.hooksetBonus < 1.18);

    // Late: past 1.2s.
    system = reachBite(game);
    system.stateTimer = 1.5;
    system.strike();
    assert.equal(system.hooksetQuality, 'late');
    assert.ok(system.hooksetBonus < 1);

    // The roll profile carries the frontier baits and rod bonuses.
    const frontierBaits = BaitTypes.filter((bait) => bait.habitatBonus);
    assert.equal(frontierBaits.length, 4);
    const habitats = new Set(frontierBaits.map((bait) => bait.habitatBonus));
    for (const habitat of ['tempest', 'aurora', 'glasswind', 'serpent_reef']) {
      assert.ok(habitats.has(habitat), `expected a ${habitat} bait`);
    }

    system = reachBite(game);
    system.strike();
    assert.ok(system.lastRollOptions, 'strike must build roll options');
    assert.equal(system.lastRollOptions.allowExtended, true);
    assert.equal(system.lastRollOptions.preferHabitat, 'coast');
  });

  test('E8-08: the Gem Exchange spends gems on rewards coins cannot buy', () => {
    const game = new Game();
    const economy = game.player.economy;

    assert.ok(getGemOffer('gem_tool_gem_finder'));
    assert.equal(getGemOffer('missing_offer'), null);

    // Insufficient gems fail cleanly.
    const poor = game.purchaseGemOffer('gem_tool_gem_finder');
    assert.equal(poor.success, false);
    assert.match(poor.reason, /gem/i);

    // Gem-locked tools reject a coin-only purse, even with millions of coins.
    economy.addCoins(1_000_000);
    const coinAttempt = game.fishingToolManager.buyTool('tool_gem_finder', economy);
    assert.equal(coinAttempt.success, false);
    assert.match(coinAttempt.reason, /gem/i);
    assert.equal(game.fishingToolManager.ownedToolIds.has('tool_gem_finder'), false);

    // Buying with gems works and cannot be repeated.
    economy.addGems(8);
    const bought = game.purchaseGemOffer('gem_tool_gem_finder');
    assert.equal(bought.success, true);
    assert.equal(economy.getGems(), 0);
    assert.equal(game.fishingToolManager.ownedToolIds.has('tool_gem_finder'), true);
    assert.equal(game.purchaseGemOffer('gem_tool_gem_finder').success, false);

    // Coins→gem conversion offer adds coins and drains one gem.
    economy.addGems(1);
    const coinsBefore = economy.getCoins();
    const pouch = game.purchaseGemOffer('gem_coins_pouch');
    assert.equal(pouch.success, true);
    assert.equal(economy.getCoins(), coinsBefore + 250);
    assert.equal(economy.getGems(), 0);
  });

  test('E8-09: NPCs are dialogue-first and their choices drive real shops and services', () => {
    const game = new Game();

    // Silas: dialogue opens over the shop tab and offers the real catalog.
    const silas = game.npcs.find((npc) => npc.id === 'merchant_silas');
    assert.ok(silas);
    const silasDialogue = silas.getDialogue();
    assert.ok(silasDialogue.lines.length >= 2);
    assert.ok(Array.isArray(silasDialogue.choices));
    assert.ok(silasDialogue.choices.some((choice) => choice.kind === 'shop'));

    silas.onInteract(game.player, game.interactionManager);
    assert.ok(game.interactionManager.activeDialogue, 'talking to Silas must open dialogue');
    assert.equal(game.interactionManager.activeDialogue.speaker, 'Shopkeeper Silas');
    assert.equal(game.isShopOpen, false, 'the shop waits for the player to choose it');
    const silasManager = game.interactionManager;
    while (!silasManager.isDialogueChoiceReady()) silasManager.advanceDialogue();
    const shopIndex = silasManager.getDialogueChoices().findIndex((choice) => choice.kind === 'shop');
    assert.ok(shopIndex >= 0, 'Silas must offer the shop choice');
    assert.equal(game.chooseDialogue(shopIndex).success, true);
    assert.equal(game.isShopOpen, true, 'choosing the shop really opens it');
    game.closeShop();

    // Every expansion NPC exposes service, quest and gift choices.
    const npc = game.expansionNpcManager.getAllNPCs()[0];
    assert.ok(npc, 'expansion NPCs exist');
    const dialogue = game.expansionNpcManager.getDialogue(npc.id);
    assert.ok(dialogue && dialogue.lines.length > 0);
    const kinds = dialogue.choices.map((choice) => choice.kind);
    assert.ok(kinds.includes('service'));
    assert.ok(kinds.includes('quest'));
    assert.ok(kinds.includes('gift'));
    assert.ok(kinds.includes('leave'));

    npc.onInteract(game.player, game.interactionManager);
    assert.ok(game.interactionManager.activeDialogue, 'expansion NPC opens dialogue');
    const manager = game.interactionManager;
    let guard = 0;
    while (!manager.isDialogueChoiceReady() && guard++ < 20) manager.advanceDialogue();
    assert.equal(manager.isDialogueChoiceReady(), true);

    const serviceIndex = manager.getDialogueChoices().findIndex((choice) => choice.kind === 'service');
    const chosen = game.chooseDialogue(serviceIndex);
    assert.equal(chosen.success, true);
    assert.equal(manager.activeDialogue, null, 'choosing a service closes the dialogue');
    assert.equal(game.isExpansionOpen, true, 'the chosen service must really open');
    game.closeExpansion();

    // Gift choice consumes a real backpack item.
    game.backpackManager.addItem('mat_pearl', 2);
    npc.onInteract(game.player, game.interactionManager);
    while (!manager.isDialogueChoiceReady()) manager.advanceDialogue();
    const giftIndex = manager.getDialogueChoices().findIndex((choice) => choice.kind === 'gift');
    const gift = game.chooseDialogue(giftIndex);
    assert.equal(gift.success, true);
    assert.equal(game.backpackManager.getCount('mat_pearl'), 1);
  });

  test('E8-10: expedition boats can be bought with coins or gems and launch at their home mooring', () => {
    const game = new Game();

    // Coin purchase (Tempest Tidecat, 4,200).
    game.player.economy.addCoins(5000);
    const purchase = game.purchaseExpeditionBoat('boat_exp_tidecat');
    assert.equal(purchase.success, true);
    assert.equal(game.boatManager.isBoatOwned('boat_exp_tidecat'), true);
    assert.equal(game.boatManager.getExpeditionCatalog().find((b) => b.id === 'boat_exp_tidecat').isOwned, true);

    const active = game.boatManager.getActiveBoat();
    const mooring = getExpeditionMooring('tempest_spire');
    assert.ok(active, 'purchased hull must spawn');
    assert.ok(Math.abs(active.position.x - mooring.position.x) < 1.0);
    assert.ok(Math.abs(active.position.z - mooring.position.z) < 1.0);

    // Gem purchase (Leviathan Hunter, 40 gems).
    game.player.economy.addGems(40);
    const gemPurchase = game.purchaseGemOffer('gem_boat_leviathan');
    assert.equal(gemPurchase.success, true);
    assert.equal(game.player.economy.getGems(), 0);
    assert.equal(game.boatManager.isBoatOwned('boat_exp_leviathan_hunter'), true);
    assert.ok(gemPurchase.spawnedBoat, 'gem hull must actually spawn');

    // Buying it again must not charge or duplicate the hull.
    game.player.economy.addGems(40);
    const duplicate = game.purchaseGemOffer('gem_boat_leviathan');
    assert.equal(duplicate.success, false);
    assert.equal(game.player.economy.getGems(), 40, 'failed duplicate must not spend gems');
  });

  test('E8-11: Expansion 8.0 state survives a full save/load round-trip', () => {
    const game1 = new Game();

    // Open the secret chest and unlock the first story chapter.
    game1.secretChest.open(game1.player);
    unlockStoryWithCatches(game1, 1);
    game1.storyJournal.markRead('chapter_first_cast');

    const savedCoins = game1.player.economy.getCoins();
    const savedGems = game1.player.economy.getGems();
    assert.equal(savedGems, 3, '2 chest gems + 1 story gem');

    const save = game1.saveGame();
    assert.equal(save.success, true);
    assert.ok(save.payload.expansion8, 'payload must include the Expansion 8.0 section');
    assert.equal(save.payload.expansion8.secretChest.opened, true);

    const game2 = new Game();
    assert.equal(game2.secretChest.opened, false);
    assert.equal(game2.storyJournal.getSummary().unlocked, 0);

    const load = game2.loadGame(save.payload);
    assert.equal(load.success, true);
    assert.equal(game2.secretChest.opened, true, 'chest must stay looted after load');
    assert.equal(game2.storyJournal.getSummary().unlocked, 1);
    assert.equal(game2.storyJournal.getSummary().read, 1);
    assert.equal(game2.player.economy.getCoins(), savedCoins);
    assert.equal(game2.player.economy.getGems(), savedGems);
    assert.equal(game2.secretChest.open(game2.player).success, false, 'loaded chest cannot be farmed');
  });

  test('E8-12: restart resets the expedition season, chest and pirate patrol together', () => {
    const game = new Game();
    game.secretChest.open(game.player);
    unlockStoryWithCatches(game, 1);
    game.player.economy.addGems(5);
    const startAngle = game.piratePatrol.angle;
    for (let i = 0; i < 10; i++) game.piratePatrol.update(0.1);
    assert.notEqual(game.piratePatrol.angle, startAngle);

    game.restart();

    assert.equal(game.player.economy.getCoins(), 1000, 'restart restores the starter purse');
    assert.equal(game.player.economy.getGems(), 0, 'restart clears gems');
    assert.equal(game.secretChest.opened, false, 'restart re-seals the chest');
    assert.equal(game.storyJournal.getSummary().unlocked, 0, 'restart clears story progress');
    assert.equal(game.piratePatrol.angle, Math.PI * 0.25, 'patrol returns to its start bearing');

    // The chest is lootable again and pays exactly the same reward.
    const reopened = game.secretChest.open(game.player);
    assert.equal(reopened.success, true);
    assert.equal(game.player.economy.getCoins(), 1000 + 20000);
  });
});
