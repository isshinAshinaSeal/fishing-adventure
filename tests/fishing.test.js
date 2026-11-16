import { test, describe, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import { FishingSystem, FishingState } from '../src/fishing/FishingSystem.js';
import { FishingSpot } from '../src/fishing/FishingSpot.js';
import { FishingRod } from '../src/fishing/FishingRod.js';
import { FishDatabase } from '../src/fishing/FishDatabase.js';
import { PlayerController } from '../src/entities/PlayerController.js';
import { InputManager } from '../src/core/InputManager.js';
import { Config } from '../src/config.js';

describe('FishingSystem — Rod Equipment, Casting, Bites & Reeling Minigame (Phase 3)', () => {
  let fishingSystem;
  let player;
  let spot;
  let input;

  beforeEach(() => {
    fishingSystem = new FishingSystem({
      minWaitTime: 0.1, // Quick timers for deterministic unit tests
      maxWaitTime: 0.2,
      biteWindowDuration: 1.5,
      maxDistanceToWater: 6.0,
    });
    player = new PlayerController();
    player.position.set(0, 1.0, 0); // close to water level (0.0)
    input = new InputManager(null);

    spot = new FishingSpot({
      id: 'spot_test',
      name: 'Pier Test Spot',
      position: { x: 0, y: 1.0, z: -2.0 },
      targetWaterPos: new THREE.Vector3(0, 0, -6.0),
      interactionRange: 3.5,
      waterElevation: 0.0,
    });
  });

  test('TC-15: Player can equip and unequip fishing rod', () => {
    assert.strictEqual(player.isRodEquipped, false, 'Rod should start unequipped');

    // Equip
    player.equipRod();
    assert.strictEqual(player.isRodEquipped, true, 'Rod should be equipped after equipRod()');

    // Unequip
    player.unequipRod();
    assert.strictEqual(player.isRodEquipped, false, 'Rod should be unequipped after unequipRod()');

    // Toggle
    player.toggleRod();
    assert.strictEqual(player.isRodEquipped, true, 'Toggle should equip when unequipped');
    player.toggleRod();
    assert.strictEqual(player.isRodEquipped, false, 'Toggle should unequip when equipped');
  });

  test('TC-16: Player can cast near water when rod is equipped', () => {
    player.equipRod();

    const castResult = fishingSystem.startCasting(player, spot);
    assert.strictEqual(castResult.success, true, 'Casting should succeed at valid spot near water');
    assert.strictEqual(fishingSystem.state, FishingState.CASTING);
    assert.strictEqual(player.fishingState, 'CASTING');
    assert.strictEqual(fishingSystem.bobberMesh.visible, true);
  });

  test('TC-17: Fish bites occur correctly after wait time', () => {
    player.equipRod();
    fishingSystem.startCasting(player, spot);

    let biteTriggered = false;
    fishingSystem.onBite = () => {
      biteTriggered = true;
    };

    // Step 1: Simulate cast completion into water (0.7s)
    fishingSystem.update(0.7, input);
    assert.strictEqual(fishingSystem.state, FishingState.WAITING, 'State should transition to WAITING once bobber lands');

    // Step 2: Simulate waiting until fish bites
    fishingSystem.update(0.3, input);
    assert.strictEqual(fishingSystem.state, FishingState.BITING, 'State should transition to BITING');
    assert.strictEqual(biteTriggered, true, 'onBite event must be dispatched');
    assert.strictEqual(player.fishingState, 'BITING');
  });

  test('TC-18: Player can strike during bite window and successfully catch fish', () => {
    player.equipRod();
    fishingSystem.startCasting(player, spot);

    // Advance to biting state
    fishingSystem.update(0.7, input); // into waiting
    fishingSystem.update(0.3, input); // into biting
    assert.strictEqual(fishingSystem.state, FishingState.BITING);

    // Strike within bite window
    const struck = fishingSystem.strike();
    assert.strictEqual(struck, true, 'Strike during biting window must succeed');
    assert.strictEqual(fishingSystem.state, FishingState.REELING, 'State should advance to REELING minigame');

    let caughtFish = null;
    fishingSystem.onCatchSuccess = (fish) => {
      caughtFish = fish;
    };

    // Simulate reeling while maintaining tension inside sweet spot
    for (let frame = 0; frame < 80; frame++) {
      // Keep tension around 50 (in sweet spot 35-75)
      fishingSystem.tension = 52.0;
      fishingSystem.update(0.05, input);
      if (fishingSystem.state === FishingState.CATCH_SUCCESS) break;
    }

    assert.strictEqual(fishingSystem.state, FishingState.CATCH_SUCCESS, 'Reeling to 100% must trigger CATCH_SUCCESS');
    assert.ok(caughtFish, 'Catch success event must return caught fish object');
    assert.ok(caughtFish.name, 'Fish must have a valid species name');
    assert.ok(caughtFish.weight > 0, 'Fish must have positive weight');
    assert.ok(caughtFish.value > 0, 'Fish must have monetary value');
    assert.ok(['Common', 'Uncommon', 'Rare', 'Legendary'].includes(caughtFish.rarity));
  });

  test('TC-19: Invalid fishing locations and unequipped casts are strictly rejected', () => {
    // 1. Rejection: Rod not equipped
    player.unequipRod();
    const noRodResult = fishingSystem.startCasting(player, spot);
    assert.strictEqual(noRodResult.success, false, 'Casting without rod equipped must be rejected');
    assert.ok(noRodResult.reason.includes('rod'), 'Rejection reason should mention rod');

    // 2. Rejection: Too far from water (high inland mountain elevation, e.g. y = 25m)
    player.equipRod();
    player.position.set(0, 25.0, 0); // 25 meters above water level (0.0)
    const farWaterResult = fishingSystem.startCasting(player, null);
    assert.strictEqual(farWaterResult.success, false, 'Casting far from water must be rejected');
    assert.ok(farWaterResult.reason.includes('water'), 'Rejection reason should mention water');

    // 3. Rejection: Too far from target fishing spot
    player.position.set(50.0, 1.0, 50.0);
    const farSpotResult = fishingSystem.startCasting(player, spot);
    assert.strictEqual(farSpotResult.success, false, 'Casting outside spot range must be rejected');
  });

  test('TC-20: Fishing cannot start while another fishing action is active', () => {
    player.equipRod();
    player.position.set(0, 1.0, 0);

    const firstCast = fishingSystem.startCasting(player, spot);
    assert.strictEqual(firstCast.success, true, 'First cast should succeed');

    // Attempt second concurrent cast while already active
    const secondCast = fishingSystem.startCasting(player, spot);
    assert.strictEqual(secondCast.success, false, 'Concurrent cast must be rejected');
    assert.strictEqual(secondCast.reason, 'Already fishing');

    // Advance to waiting
    fishingSystem.update(0.7, input);
    const thirdCast = fishingSystem.startCasting(player, spot);
    assert.strictEqual(thirdCast.success, false, 'Cast while waiting must be rejected');

    // Clean up
    fishingSystem.cancelFishing();
    assert.strictEqual(fishingSystem.state, FishingState.IDLE);
    const castAfterCancel = fishingSystem.startCasting(player, spot);
    assert.strictEqual(castAfterCancel.success, true, 'Cast after cancel must succeed');
  });

  test('TC-21: Premature strike or line snap handles escape appropriately', () => {
    player.equipRod();
    fishingSystem.startCasting(player, spot);
    fishingSystem.update(0.7, input); // WAITING state

    let failReason = null;
    fishingSystem.onCatchFailed = (reason) => {
      failReason = reason;
    };

    // Strike while WAITING (before bite) -> fish scared away
    const struckEarly = fishingSystem.strike();
    assert.strictEqual(struckEarly, false);
    assert.strictEqual(fishingSystem.state, FishingState.CATCH_FAILED);
    assert.ok(failReason.includes('early'));
  });
});
