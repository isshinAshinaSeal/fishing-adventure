// tests/zones.test.js — Phase 11: Open-World Biomes & Zone Exploration Verification

import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { ZoneManager, WorldZones } from '../src/world/ZoneManager.js';
import { FishingSystem, FishingState } from '../src/fishing/FishingSystem.js';
import { PlayerController } from '../src/entities/PlayerController.js';
import { FishDatabase } from '../src/fishing/FishDatabase.js';

describe('Open-World Biomes & Zone Expansion (Phase 11)', () => {
  test('TC-64: ZoneManager identifies correct zone for given world coordinates', () => {
    const zm = new ZoneManager();

    // 1. Starter Harbor (5, -15)
    const harbor = zm.getZoneAt(5.0, -15.0);
    assert.equal(harbor.id, 'starter_harbor');
    assert.equal(harbor.habitat, 'pier');

    // 2. Highland Springs (0, 0)
    const highlands = zm.getZoneAt(0.0, 0.0);
    assert.equal(highlands.id, 'highland_springs');
    assert.equal(highlands.habitat, 'secret');

    // 3. Whispering Shallows (0, -220)
    const shallows = zm.getZoneAt(0.0, -220.0);
    assert.equal(shallows.id, 'whispering_shallows');
    assert.equal(shallows.habitat, 'shallow');

    // 4. Sunken Coral Shelf (260, 0)
    const reef = zm.getZoneAt(260.0, 0.0);
    assert.equal(reef.id, 'coral_reef');
    assert.equal(reef.habitat, 'reef');

    // 5. Far offshore deep sea (0, -450)
    const abyss = zm.getZoneAt(0.0, -450.0);
    assert.equal(abyss.id, 'abyssal_trench');
    assert.equal(abyss.habitat, 'ocean');
  });

  test('TC-65: First-time entry into a zone triggers new discovery and tracks history', () => {
    const zm = new ZoneManager();
    const discoveries = [];

    zm.onZoneEnter = (zone, isNew) => {
      if (isNew) discoveries.push(zone.id);
    };

    // Initially at harbor (already discovered)
    zm.update({ x: 5.0, z: -15.0 });
    assert.equal(discoveries.length, 0);

    // Travel to Coral Reef
    zm.update({ x: 260.0, z: 0.0 });
    assert.equal(discoveries.length, 1);
    assert.equal(discoveries[0], 'coral_reef');
    assert.ok(zm.getDiscoveredZones().includes('coral_reef'));
  });

  test('TC-66: Re-entering an already discovered zone does not duplicate discovery', () => {
    const zm = new ZoneManager();
    let newDiscoveries = 0;

    zm.onZoneEnter = (zone, isNew) => {
      if (isNew) newDiscoveries++;
    };

    // Enter Coral Reef
    zm.update({ x: 260.0, z: 0.0 });
    assert.equal(newDiscoveries, 1);

    // Walk back to Harbor
    zm.update({ x: 5.0, z: -15.0 });
    assert.equal(newDiscoveries, 1);

    // Walk back to Coral Reef again (already discovered)
    zm.update({ x: 260.0, z: 0.0 });
    assert.equal(newDiscoveries, 1); // Does not increment
  });

  test('TC-67: Exploration percentage calculates correctly across total zones', () => {
    const zm = new ZoneManager();
    const totalCount = WorldZones.length;

    // Initially 1 zone discovered out of total
    const initialExpected = Math.round((1 / totalCount) * 100);
    assert.equal(zm.getExplorationPercentage(), initialExpected);

    // Discover 2 more zones
    zm.update({ x: 260.0, z: 0.0 }); // Coral Reef
    zm.update({ x: 0.0, z: 0.0 });   // Highland Springs

    assert.equal(zm.getDiscoveredZones().length, 3);
    const threeExpected = Math.round((3 / totalCount) * 100);
    assert.equal(zm.getExplorationPercentage(), threeExpected);
  });

  test('TC-68: Fish caught in a specific zone use the zone designated habitat pool', () => {
    const zm = new ZoneManager();
    const fishing = new FishingSystem();
    fishing.zoneManager = zm;

    const player = new PlayerController();
    fishing.activePlayer = player;

    // Simulate bobber in Sunken Coral Reef
    fishing.bobberPosition.set(260.0, -0.5, 0.0);
    fishing.state = FishingState.REELING;
    fishing.catchProgress = 100.0;

    // Complete catch
    fishing._succeedCatch();

    assert.equal(fishing.state, FishingState.CATCH_SUCCESS);
    assert.ok(fishing.currentFish, 'Fish must be caught');

    // Verify fish species belongs to the reef habitat (e.g. seabass, red_snapper)
    const species = FishDatabase.getSpeciesById(fishing.currentFish.speciesId);
    assert.ok(species.habitat.includes('reef'), `Caught fish (${species.name}) must have 'reef' in habitat`);
  });
});
