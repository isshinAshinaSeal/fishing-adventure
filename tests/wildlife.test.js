// tests/wildlife.test.js — Phase 10: Sharks & Ocean Wildlife AI Verification

import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { SharkAI, SharkState } from '../src/wildlife/SharkAI.js';
import { WildlifeManager } from '../src/wildlife/WildlifeManager.js';
import { TerrainCollider } from '../src/world/TerrainCollider.js';

describe('Sharks & Wildlife AI (Phase 10)', () => {
  test('TC-59: Sharks and wildlife spawn in ocean waters at valid submerged depths', () => {
    const wm = new WildlifeManager({ waterLevel: 0.0 });
    const creatures = wm.getCreatures();

    assert.ok(creatures.length >= 3, 'Default ocean must spawn at least 3 marine creatures');

    for (const c of creatures) {
      assert.ok(c.position.y < 0.0, `Creature ${c.id} must be submerged below water level (y < 0)`);
      assert.ok(
        Math.hypot(c.position.x, c.position.z) > 200,
        `Creature ${c.id} must be positioned in outer ocean waters`
      );
    }
  });

  test('TC-60: Shark AI follows patrol waypoints in absence of nearby players', () => {
    const shark = new SharkAI({
      id: 'shark_patrol_test',
      waterLevel: 0.0,
      position: { x: 0, y: -3.5, z: -320 },
      centerAnchor: { x: 0, z: -320 },
      patrolRadius: 40.0,
      patrolSpeed: 3.0,
    });
    const terrain = new TerrainCollider();

    assert.equal(shark.state, SharkState.PATROL);
    const initialPos = shark.position.clone();

    // Simulate 3 seconds with no player around
    for (let i = 0; i < 30; i++) {
      shark.update(0.1, null, null, terrain);
    }

    assert.equal(shark.state, SharkState.PATROL);
    const movedDist = shark.position.distanceTo(initialPos);
    assert.ok(movedDist > 4.0, `Shark should patrol along orbit, moved ${movedDist.toFixed(2)}m`);
  });

  test('TC-61: Shark transitions to CURIOUS state when player enters detection radius', () => {
    const shark = new SharkAI({
      id: 'shark_curious_test',
      waterLevel: 0.0,
      position: { x: 0, y: -3.0, z: -300 },
      detectionRadius: 25.0,
      fleeRadius: 6.0,
    });
    const terrain = new TerrainCollider();

    assert.equal(shark.state, SharkState.PATROL);

    // Place player at 18 meters distance (inside detectionRadius 25m, outside fleeRadius 6m)
    const playerPos = { x: 0, y: 0, z: -318 };
    shark.update(0.1, playerPos, null, terrain);

    assert.equal(shark.state, SharkState.CURIOUS, 'Shark should enter CURIOUS observation state');
  });

  test('TC-62: Shark transitions to FLEE state with burst speed when player comes too close', () => {
    const shark = new SharkAI({
      id: 'shark_flee_test',
      waterLevel: 0.0,
      position: { x: 0, y: -3.0, z: -300 },
      detectionRadius: 25.0,
      fleeRadius: 8.0,
      fleeSpeed: 6.5,
    });
    const terrain = new TerrainCollider();

    // Place boat at 4 meters distance (inside fleeRadius 8m)
    const boatPos = { x: 0, y: 0, z: -304 };
    const prevZ = shark.position.z;

    shark.update(0.1, null, boatPos, terrain);

    assert.equal(shark.state, SharkState.FLEE, 'Shark should transition to FLEE state');

    // Step flee for 1.5 seconds
    for (let i = 0; i < 15; i++) {
      shark.update(0.1, null, boatPos, terrain);
    }

    // Shark should have fled away from z = -304 (towards +z or -z away from boat)
    const distNow = shark.position.distanceTo(boatPos);
    assert.ok(distNow > 8.0, `Shark should have burst fled beyond 8m, current distance: ${distNow}`);
  });

  test('TC-63: Shark elevation strictly remains submerged below water level and above seabed', () => {
    const shark = new SharkAI({
      id: 'shark_depth_test',
      waterLevel: 0.0,
      position: { x: 0, y: -2.0, z: -320 },
      targetDepth: 3.5,
    });
    const terrain = new TerrainCollider();

    // Simulate 10 seconds of active swimming
    for (let i = 0; i < 100; i++) {
      shark.update(0.1, null, null, terrain);

      const seabed = terrain.sampleHeight(shark.position.x, shark.position.z);
      assert.ok(
        shark.position.y <= shark.waterLevel - 0.4,
        `Shark elevation (${shark.position.y}) must stay below surface ceiling`
      );
      assert.ok(
        shark.position.y >= seabed + 0.5,
        `Shark elevation (${shark.position.y}) must stay above seabed (${seabed})`
      );
    }
  });
});
