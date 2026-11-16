// tests/civilization.test.js — Verification of Shopkeeper Hut, Marina Dock,
// Civilization NPC Wandering, Second Island (Pirate Atoll), and Captain Redbeard.

import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { Game } from '../src/core/Game.js';
import { TerrainCollider } from '../src/world/TerrainCollider.js';
import { ZoneManager } from '../src/world/ZoneManager.js';
import { CivilianNPC, CivilianState } from '../src/entities/CivilianNPC.js';
import { NPC } from '../src/entities/NPC.js';

describe('Civilization, Shopkeeper Hut, Marina Dock & Pirate Island Expansion', () => {
  const collider = new TerrainCollider();
  const zoneManager = new ZoneManager();

  test('TC-EXP-01: Second Island (Pirate Atoll) has solid terrain elevation above water level', () => {
    const center = collider.pirateIsland.center;
    const peakHeight = collider.sampleHeight(center.x, center.z);
    assert.ok(peakHeight > 8.0, `Pirate Island peak must be elevated well above water (got ${peakHeight})`);

    // Shoreline elevation
    const beachH = collider.sampleHeight(center.x + 45, center.z);
    assert.ok(beachH > 0.0, `Pirate beach should be above water level (got ${beachH})`);

    // Open sea between Main Island and Pirate Island (210, -230)
    const openSeaH = collider.sampleHeight(210, -230);
    assert.ok(openSeaH < 0.0, `Water channel between islands must be submerged (got ${openSeaH})`);
  });

  test('TC-EXP-02: ZoneManager identifies Smuggler’s Atoll & Pirate Cove correctly', () => {
    const pirateZone = zoneManager.getZoneAt(280.0, -320.0);
    assert.ok(pirateZone, 'Must return a zone for Pirate Island coordinates');
    assert.equal(pirateZone.id, 'pirate_cove');
    assert.equal(pirateZone.habitat, 'pirate');
  });

  test('TC-EXP-03: Shopkeeper Silas is placed inside the hut with valid interaction and dialogue', () => {
    const game = new Game();
    game.start();

    const silas = game.npcs.find((n) => n.id === 'merchant_silas');
    assert.ok(silas, 'Shopkeeper Silas must exist in game world');
    assert.equal(silas.name, 'Shopkeeper Silas');
    assert.ok(silas.dialogue.length >= 2, 'Shopkeeper must have welcoming dialogue');

    // Inside hut location check (around x: -10, z: 4.8)
    assert.ok(Math.abs(silas.position.x - (-10.0)) < 1.0, 'Silas must be located inside the shop hut');
    assert.ok(Math.abs(silas.position.z - 4.8) < 1.0, 'Silas must be positioned behind the shop counter');
  });

  test('TC-EXP-04: Marina Master Vance and boat mooring are aligned at the Harbor Dock', () => {
    const game = new Game();
    game.start();

    const vance = game.npcs.find((n) => n.id === 'merchant_vance');
    assert.ok(vance, 'Marina Master Vance must exist on harbor dock');
    assert.ok(vance.position.z < -12.0, 'Vance must be positioned on the marina dock pier');

    // Dock mooring point check
    assert.ok(game.boatManager.dockMooring.z <= -18.0, 'Mooring must be in water alongside dock');
    assert.ok(game.boatManager.pirateMooring, 'Pirate dock mooring must be configured');
  });

  test('TC-EXP-05: Captain Redbeard is stationed at Pirate Island with pirate attributes and boat shop', () => {
    const game = new Game();
    game.start();

    const redbeard = game.npcs.find((n) => n.id === 'captain_redbeard');
    assert.ok(redbeard, 'Captain Redbeard must be spawned in game world');
    assert.equal(redbeard.name, 'Captain Redbeard');
    assert.ok(redbeard.dialogue.some((line) => line.includes('Ahoy')), 'Must have pirate dialogue');

    // Stationed at Pirate Island (x ~ 275, z ~ -275)
    assert.ok(redbeard.position.x > 250, 'Redbeard must be stationed on Pirate Island');
    assert.ok(redbeard.position.z < -250, 'Redbeard must be located at pirate cove');
  });

  test('TC-EXP-06: Autonomous Civilization NPCs traverse waypoints and clamp to terrain', () => {
    const testWaypoints = [
      { x: 10.0, z: 10.0 },
      { x: 18.0, z: 10.0 },
      { x: 10.0, z: 18.0 },
    ];
    const civilian = new CivilianNPC({
      id: 'test_villager',
      name: 'Test Villager',
      waypoints: testWaypoints,
      position: { x: 10.0, y: 5.0, z: 10.0 },
      walkSpeed: 4.0,
      pauseDuration: 0.1,
    });

    assert.equal(civilian.state, CivilianState.WALKING);

    // Simulate several frames of walking
    for (let f = 0; f < 30; f++) {
      civilian.update(0.1, { x: 999, y: 0, z: 999 }, collider);
    }

    // Must have moved from initial position towards target
    assert.notEqual(civilian.position.x, 10.0, 'Villager position must change while walking');
    assert.ok(civilian.isWalking, 'Villager must be marked isWalking while navigating');
    assert.ok(Number.isFinite(civilian.position.y), 'Elevation must be finite clamped to terrain');
  });

  test('TC-EXP-07: Civilization NPCs halt walking and face the player when approached', () => {
    const civilian = new CivilianNPC({
      id: 'test_villager_greet',
      name: 'Test Villager 2',
      waypoints: [{ x: 50.0, z: 50.0 }],
      position: { x: 0.0, y: 0.0, z: 0.0 },
    });

    // Player walks up close (< 2.5m)
    civilian.update(0.1, { x: 1.0, y: 0.0, z: 1.0 }, collider);

    assert.equal(civilian.state, CivilianState.TALKING);
    assert.equal(civilian.isWalking, false, 'Must halt walking when player approaches');
  });
});
