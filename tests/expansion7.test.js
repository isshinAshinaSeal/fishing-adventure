// tests/expansion7.test.js — Frontier Archipelago, frontier species and
// fishing mechanics on every remote island.

import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { Game } from '../src/core/Game.js';
import { FrontierIslands, FrontierZones, sampleFrontierIslandHeight } from '../src/world/frontierIslands.js';
import { FrontierSpecies, FrontierCategories } from '../src/fishing/frontierSpecies.js';
import { ExpandedSpecies, FishDatabase } from '../src/fishing/FishDatabase.js';
import { OuterIslands } from '../src/world/islands.js';
import { WorldZones } from '../src/world/ZoneManager.js';
import { TravelDestinations } from '../src/transport/FastTravelManager.js';
import {
  FrontierBuildingDefinitions,
  FrontierNpcDefinitions,
  FrontierFishingSpotDefinitions,
  FrontierFerryDefinitions,
} from '../src/expansion/frontierContent.js';
import { FishingState } from '../src/fishing/FishingSystem.js';

function landFish(game, spot) {
  game.fishingSystem.reset();
  game.player.equipRod();
  game.player.position.set(spot.position.x, spot.position.y, spot.position.z);

  const cast = game.fishingSystem.quickCast(game.player, spot);
  assert.equal(cast.success, true, `cast should start at ${spot.id}`);

  // Finish the cast arc, then force the bite window open.
  game.fishingSystem.update(0.7);
  assert.equal(game.fishingSystem.state, FishingState.WAITING);
  game.fishingSystem.stateTimer = game.fishingSystem.waitDuration + 0.1;
  game.fishingSystem.update(0.01);
  assert.equal(game.fishingSystem.state, FishingState.BITING);

  assert.equal(game.fishingSystem.strike(), true);
  assert.equal(game.fishingSystem.state, FishingState.REELING);

  const hooked = game.fishingSystem.hookedFish;
  assert.ok(hooked, 'a hooked fish is rolled');
  assert.equal(hooked.frontier, true, 'frontier spots only roll frontier species');

  // Land the fish through the real reeling update path.
  game.fishingSystem.isReelHeld = false;
  game.fishingSystem.fishStamina = 0;
  game.fishingSystem.tension = 50;
  game.fishingSystem.catchProgress = 99.9;
  game.fishingSystem.update(0.05);
  assert.equal(game.fishingSystem.state, FishingState.CATCH_SUCCESS);
  return hooked;
}

describe('Expansion 7.0 — Frontier Archipelago', () => {
  test('E7-01: four remote islands are real terrain, real zones and separate from the outer isles', () => {
    assert.equal(FrontierIslands.length, 4);
    assert.equal(FrontierZones.length, 4);

    // Preserve every earlier exact-count contract.
    assert.equal(OuterIslands.length, 7);
    assert.equal(WorldZones.length, 15);
    assert.equal(TravelDestinations.length, 15);
    assert.equal(ExpandedSpecies.length, 140);

    const game = new Game();
    assert.equal(game.zoneManager.zones.length, WorldZones.length + FrontierZones.length);

    for (const island of FrontierIslands) {
      assert.ok(island.radius > 45, `${island.name} must be a substantial island`);
      assert.ok(sampleFrontierIslandHeight(island.center.x, island.center.z) > 8,
        `${island.name} should rise above the water`);
      assert.ok(game.terrainCollider.sampleHeight(island.center.x, island.center.z) > 8,
        `${island.name} should be clamped by the terrain collider`);

      const zone = game.zoneManager.getZoneAt(island.center.x, island.center.z);
      assert.equal(zone.id, island.zoneId);
      assert.equal(zone.habitat, island.habitat);

      // Arrival and dock are walkable beach, not open ocean.
      assert.ok(game.terrainCollider.sampleHeight(island.arrival.x, island.arrival.z) > 0);
      assert.ok(game.terrainCollider.sampleHeight(island.dock.x, island.dock.z) > 0);
    }
  });

  test('E7-02: outposts, residents, ferries and fishing platforms are registered', () => {
    const game = new Game();
    assert.equal(FrontierBuildingDefinitions.length, 4);
    assert.equal(FrontierNpcDefinitions.length, 4);
    assert.equal(FrontierFishingSpotDefinitions.length, 8);
    assert.equal(FrontierFerryDefinitions.length, 8);

    assert.equal(game.frontierBuildings.length, 4);
    assert.equal(game.frontierNpcs.length, 4);
    assert.equal(game.frontierFishingSpots.length, 8);
    assert.equal(game.frontierFerries.length, 8);

    for (const entity of [
      ...game.frontierBuildings,
      ...game.frontierNpcs,
      ...game.frontierFishingSpots,
      ...game.frontierFerries,
    ]) {
      assert.ok(game.interactionManager.interactables.has(entity), `${entity.id} should be interactable`);
    }

    for (const spot of game.frontierFishingSpots) {
      assert.equal(spot.catalog, 'frontier');
      assert.ok(spot.islandId);
      assert.ok(spot.habitat);
    }
  });

  test('E7-03: frontier species extend the index without changing the classic catalog', () => {
    assert.equal(FrontierSpecies.length, 24);
    assert.equal(FrontierCategories.length, 4);
    assert.equal(FishDatabase.getFrontierSpecies().length, 24);
    assert.equal(FishDatabase.getFullCatalog().length, 140 + 24);
    assert.equal(FishDatabase.getExpandedSpecies().length, 140);
    assert.equal(FishDatabase.getCategories().length, 14);

    const stats = FishDatabase.getLookupStats();
    assert.equal(stats.fullCatalog, 164);
    assert.equal(stats.frontierSpecies, 24);
    assert.equal(stats.speciesById, 164);

    const game = new Game();
    const summary = game.fishIndex.getSummary();
    assert.equal(summary.total, 164);
    for (const category of FrontierCategories) {
      assert.ok(game.fishIndex.getCategories().find((entry) => entry.id === category));
      const entries = game.fishIndex.getEntries({ category });
      assert.ok(entries.length > 0);
      assert.ok(entries.every((entry) => entry.habitat.length > 0));
    }
  });

  test('E7-04: ferries travel to every frontier island and record the visit', () => {
    const game = new Game();
    assert.equal(game.visitedFrontierIslands.size, 0);

    // Ferry travel must not clear run state (the old reset-based path did).
    game.player.economy.addCoins(77);
    const coinsBefore = game.player.economy.getCoins();
    game.player.progression.addXp(25);
    const xpBefore = game.player.progression.getXp();

    for (const island of FrontierIslands) {
      const result = game.travelToFrontier(island.id);
      assert.equal(result.success, true);
      assert.equal(result.destination, island.name);
      assert.ok(game.visitedFrontierIslands.has(island.id));
      assert.ok(game.zoneManager.discoveredZones.has(island.zoneId));
      assert.ok(game.player.position.y > 0, 'arrival should be on land');
      assert.equal(game.player.economy.getCoins(), coinsBefore);
      assert.equal(game.player.progression.getXp(), xpBefore);
    }

    assert.equal(game.travelToFrontier('atlantis').success, false);
    assert.equal(game.visitedFrontierIslands.size, 4);
  });

  test('E7-05: cast, bite, hook and land frontier fish on all four islands', () => {
    const game = new Game();
    const caught = [];

    for (const island of FrontierIslands) {
      const travel = game.travelToFrontier(island.id);
      assert.equal(travel.success, true);

      const spots = game.frontierFishingSpots.filter((spot) => spot.islandId === island.id);
      assert.equal(spots.length, 2);
      for (const spot of spots) {
        const fish = landFish(game, spot);
        caught.push(fish);
        assert.ok(fish.habitat.includes(island.habitat));
      }
    }

    assert.equal(caught.length, 8);
    assert.ok(caught.every((fish) => fish.frontier === true));
    assert.equal(game.frontierCatches, 8);
    assert.equal(game.player.inventory.getCount(), 8);
    assert.equal(game.fishingSystem.state, FishingState.CATCH_SUCCESS);

    // Open-water/boat casts inside a frontier zone also use the frontier pool.
    game.fishingSystem.reset();
    game.fishingSystem.bobberPosition.set(FrontierIslands[0].center.x, 0, FrontierIslands[0].center.z);
    assert.equal(game.fishingSystem._activeCatalog().length, 24);
    game.fishingSystem.bobberPosition.set(0, 0, 0);
    assert.equal(game.fishingSystem._activeCatalog(), null);
  });

  test('E7-06: frontier progress survives save/load and habitat travel falls back to the islands', () => {
    const game = new Game();
    game.travelToFrontier('tempest_spire');
    const spot = game.frontierFishingSpots.find((entry) => entry.islandId === 'tempest_spire');
    const fish = landFish(game, spot);
    assert.equal(fish.frontier, true);
    assert.equal(game.frontierCatches, 1);

    const payload = game.saveManager.exportSavePayload(game);
    assert.deepEqual(payload.expansion7.frontier.visited, ['tempest_spire']);
    assert.equal(payload.expansion7.frontier.catches, 1);

    const restored = new Game();
    const load = restored.loadGame(payload);
    assert.equal(load.success, true);
    assert.equal(restored.frontierCatches, 1);
    assert.ok(restored.visitedFrontierIslands.has('tempest_spire'));
    assert.equal(restored.visitedFrontierIslands.size, 1);

    // A frontier-only species has no classic teleport gate; the index routing
    // should sail the player to its island instead of failing.
    const frontierSpecies = FrontierSpecies.find((entry) => entry.habitat.includes('aurora'));
    const route = restored.travelToFishHabitat(frontierSpecies.id);
    assert.equal(route.success, true);
    assert.ok(restored.visitedFrontierIslands.has('aurora_isle'));
  });
});
