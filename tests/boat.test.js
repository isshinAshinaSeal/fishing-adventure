// tests/boat.test.js — Phase 9: Boat System Verification

import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { BoatManager } from '../src/boat/BoatManager.js';
import { Boat } from '../src/boat/Boat.js';
import { EconomyManager } from '../src/economy/EconomyManager.js';
import { PlayerController } from '../src/entities/PlayerController.js';
import { TerrainCollider } from '../src/world/TerrainCollider.js';

describe('Boat System & Aquatic Navigation (Phase 9)', () => {
  function createMockInput(keysDown = []) {
    const set = new Set(keysDown);
    return {
      isKeyDown: (key) => set.has(key),
      isActionJustPressed: (key) => set.has(key),
    };
  }

  test('TC-53: Player can purchase a boat from dealership with sufficient coins', () => {
    const economy = new EconomyManager({ startingCoins: 500 });
    const boatManager = new BoatManager();

    assert.equal(boatManager.isBoatOwned('boat_rowboat'), false);

    // Purchase Rowboat (cost 150)
    const result = boatManager.purchaseBoat('boat_rowboat', economy);
    assert.equal(result.success, true);
    assert.equal(result.boat.id, 'boat_rowboat');
    assert.equal(economy.getCoins(), 350);
    assert.equal(boatManager.isBoatOwned('boat_rowboat'), true);

    // Active boat is spawned and ready at dock
    const active = boatManager.getActiveBoat();
    assert.ok(active, 'Active boat must be spawned upon purchase');
    assert.equal(active.isOwned, true);
    assert.equal(active.name, result.boat.name);
  });

  test('TC-54: Unowned boats cannot be mounted, and purchase fails with insufficient coins', () => {
    const economy = new EconomyManager({ startingCoins: 50 });
    const boatManager = new BoatManager();
    const player = new PlayerController();

    // Attempt to buy luxury yacht (cost 7500) with 50 coins
    const failPurchase = boatManager.purchaseBoat('boat_yacht', economy);
    assert.equal(failPurchase.success, false);
    assert.match(failPurchase.reason, /insufficient/i);
    assert.equal(economy.getCoins(), 50); // Unchanged

    // Create an unowned boat and attempt to mount
    const unownedBoat = new Boat({
      id: 'boat_unowned',
      name: 'Forbidden Skiff',
      isOwned: false,
    });

    const mountResult = unownedBoat.mount(player);
    assert.equal(mountResult.success, false);
    assert.match(mountResult.reason, /do not own/i);
    assert.equal(player.isMountedBoat, false);
  });

  test('TC-55: Player can mount and dismount boat at water dock', () => {
    const player = new PlayerController();
    const boat = new Boat({
      id: 'boat_dinghy',
      name: 'Outboard Dinghy',
      isOwned: true,
      position: { x: 5.0, y: 0.0, z: -18.0 },
      dockAnchor: { x: 3.5, y: 1.0, z: -14.5 },
    });

    assert.equal(boat.isMounted, false);
    assert.equal(player.isMountedBoat, false);

    // Mount
    const mountRes = boat.mount(player);
    assert.equal(mountRes.success, true);
    assert.equal(boat.isMounted, true);
    assert.equal(player.isMountedBoat, true);
    assert.equal(player.activeBoat, boat);

    // Dismount
    const dismountRes = boat.dismount(player);
    assert.equal(dismountRes.success, true);
    assert.equal(boat.isMounted, false);
    assert.equal(player.isMountedBoat, false);
    assert.equal(player.activeBoat, null);

    // Verify player safely placed at dock land anchor
    assert.equal(player.position.x, 3.5);
    assert.equal(player.position.z, -14.5);
  });

  test('TC-56: Mounted boat navigates across water with throttle and steering physics', () => {
    const player = new PlayerController();
    const boat = new Boat({
      id: 'boat_skiff',
      name: 'Coastal Bay Skiff',
      isOwned: true,
      position: { x: 0.0, y: 0.0, z: -320.0 }, // Deep open ocean (radius > 280)
      maxSpeed: 10.0,
      acceleration: 5.0,
      turnRate: 1.0,
    });
    const terrain = new TerrainCollider();

    boat.mount(player);
    const startZ = boat.position.z;

    // Apply Forward Throttle (KeyW) for 2 seconds
    const forwardInput = createMockInput(['KeyW']);
    for (let i = 0; i < 20; i++) {
      boat.update(0.1, forwardInput, terrain);
    }

    assert.ok(boat.speed > 0, 'Boat speed must accelerate with throttle');
    assert.ok(boat.position.z > startZ, 'Boat must move forward in positive facing direction');

    // Apply Steering (KeyA)
    const startYaw = boat.yaw;
    const steerInput = createMockInput(['KeyA']);
    for (let i = 0; i < 10; i++) {
      boat.update(0.1, steerInput, terrain);
    }
    assert.ok(boat.yaw > startYaw, 'Steering left must increment yaw');
  });

  test('TC-57: Boat cannot drive onto land (stops at water-land shoreline boundary)', () => {
    const player = new PlayerController();
    // Place boat in the coastal surf (z = -262, seabed is underwater at ~ -0.62m)
    // facing +Z directly toward the dry beach (z >= -255)
    const boat = new Boat({
      id: 'boat_rowboat',
      name: 'Timber Drift Rowboat',
      isOwned: true,
      position: { x: 0.0, y: 0.0, z: -262.0 },
      yaw: 0.0, // Facing +Z directly into the island
      maxSpeed: 8.0,
      acceleration: 10.0,
    });
    const terrain = new TerrainCollider();

    assert.ok(
      terrain.sampleHeight(boat.position.x, boat.position.z) < boat.waterLevel,
      'Starting position must be in the water'
    );

    boat.mount(player);

    // Try driving straight towards the dry island land for 5 seconds
    const throttleInput = createMockInput(['KeyW']);
    for (let i = 0; i < 50; i++) {
      boat.update(0.1, throttleInput, terrain);
    }

    // Verify boat elevation stays on water surface and did not drive onto high dry ground
    const finalGround = terrain.sampleHeight(boat.position.x, boat.position.z);
    assert.ok(
      finalGround <= boat.waterLevel + 0.1,
      `Boat position (x: ${boat.position.x}, z: ${boat.position.z}) ground height (${finalGround}) must stay at or below water level`
    );
    assert.equal(boat.speed, 0, 'Boat forward speed must be blocked/zeroed upon hitting shoreline');
  });

  test('TC-58: Dismounting safely deposits player on land/dock and releases helm', () => {
    const player = new PlayerController();
    const boat = new Boat({
      id: 'boat_dinghy',
      name: 'Dinghy',
      isOwned: true,
      position: { x: 5.0, y: 0.0, z: -18.0 },
      dockAnchor: { x: 3.0, y: 1.2, z: -14.0 },
    });

    boat.mount(player);
    assert.equal(player.isMountedBoat, true);

    const result = boat.dismount(player);
    assert.equal(result.success, true);
    assert.equal(player.isMountedBoat, false);
    assert.equal(player.position.x, 3.0);
    assert.equal(player.position.z, -14.0);
    assert.equal(player.isGrounded, true);
  });
});
