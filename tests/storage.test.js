// tests/storage.test.js — Phase 7: Fish Storage & Private Pond System Verification

import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { StorageManager } from '../src/storage/StorageManager.js';
import { PrivatePond } from '../src/storage/PrivatePond.js';
import { InventoryManager } from '../src/inventory/InventoryManager.js';
import { FishDatabase } from '../src/fishing/FishDatabase.js';

describe('Fish Storage & Private Pond System (Phase 7)', () => {
  function createTestFish(speciesId = 'golden_trout') {
    return FishDatabase.createCatchRecord(speciesId, 1.25);
  }

  test('TC-43: Fish can be moved from player bucket into storage chest', () => {
    const inventory = new InventoryManager({ bucketCapacity: 5 });
    const storage = new StorageManager({ chestCapacity: 10 });

    const fish1 = createTestFish('golden_trout');
    const fish2 = createTestFish('sardine');
    inventory.addFish(fish1);
    inventory.addFish(fish2);

    assert.equal(inventory.getCount(), 2);
    assert.equal(storage.getCount(), 0);

    const result = storage.storeFishFromBucket(inventory, fish1.instanceId);
    assert.equal(result.success, true);
    assert.equal(result.fish.instanceId, fish1.instanceId);

    // Verify bucket decremented and storage incremented
    assert.equal(inventory.getCount(), 1);
    assert.equal(storage.getCount(), 1);
    assert.equal(storage.getStoredFish()[0].name, fish1.name);

    // Verify non-existent fish fails cleanly
    const invalidResult = storage.storeFishFromBucket(inventory, 'non_existent_id');
    assert.equal(invalidResult.success, false);
  });

  test('TC-44: Fish can be moved from storage chest back to bucket (respecting bucket capacity)', () => {
    const inventory = new InventoryManager({ bucketCapacity: 1 });
    const storage = new StorageManager({ chestCapacity: 10 });

    const fish1 = createTestFish('seabass');
    const fish2 = createTestFish('mackerel');

    inventory.addFish(fish1);
    storage.storeFishFromBucket(inventory, fish1.instanceId);
    assert.equal(inventory.getCount(), 0);
    assert.equal(storage.getCount(), 1);

    // Withdraw back to bucket
    const withdrawResult = storage.withdrawFishToBucket(inventory, fish1.instanceId);
    assert.equal(withdrawResult.success, true);
    assert.equal(inventory.getCount(), 1);
    assert.equal(storage.getCount(), 0);

    // Put fish1 back to storage, fill bucket with fish2, attempt withdraw (should fail due to full bucket)
    storage.storeFishFromBucket(inventory, fish1.instanceId);
    inventory.addFish(fish2);
    assert.equal(inventory.isFull(), true);

    const fullWithdraw = storage.withdrawFishToBucket(inventory, fish1.instanceId);
    assert.equal(fullWithdraw.success, false);
    assert.match(fullWithdraw.reason, /full/i);
    assert.equal(storage.getCount(), 1); // Not lost
  });

  test('TC-45: Fish can be placed in private pond', () => {
    const inventory = new InventoryManager({ bucketCapacity: 5 });
    const pond = new PrivatePond({ capacity: 4, pondRadius: 2.5 });

    const fish = createTestFish('red_snapper');
    inventory.addFish(fish);

    assert.equal(pond.getCount(), 0);
    const placeResult = pond.placeFishFromBucket(inventory, fish.instanceId);

    assert.equal(placeResult.success, true);
    assert.equal(inventory.getCount(), 0);
    assert.equal(pond.getCount(), 1);
    assert.equal(pond.getFishList()[0].name, 'Ruby Snapper');
  });

  test('TC-46: Pond capacity is strictly enforced', () => {
    const inventory = new InventoryManager({ bucketCapacity: 10 });
    const pond = new PrivatePond({ capacity: 3, pondRadius: 2.5 });

    const species = ['sardine', 'mackerel', 'seabass', 'golden_trout'];
    const fishItems = species.map((id) => createTestFish(id));
    fishItems.forEach((f) => inventory.addFish(f));

    // Place 3 fish (fill pond)
    assert.equal(pond.placeFishFromBucket(inventory, fishItems[0].instanceId).success, true);
    assert.equal(pond.placeFishFromBucket(inventory, fishItems[1].instanceId).success, true);
    assert.equal(pond.placeFishFromBucket(inventory, fishItems[2].instanceId).success, true);

    assert.equal(pond.isFull(), true);
    assert.equal(pond.getCount(), 3);

    // Attempt 4th fish
    const overflowResult = pond.placeFishFromBucket(inventory, fishItems[3].instanceId);
    assert.equal(overflowResult.success, false);
    assert.match(overflowResult.reason, /full/i);
    assert.equal(inventory.getCount(), 1); // Fish remains safe in bucket
  });

  test('TC-47: Fish swim strictly inside pond boundaries without escaping', () => {
    const pond = new PrivatePond({ capacity: 5, pondRadius: 2.5 });
    const inventory = new InventoryManager({ bucketCapacity: 5 });

    for (let i = 0; i < 3; i++) {
      const f = createTestFish('golden_trout');
      inventory.addFish(f);
      pond.placeFishFromBucket(inventory, f.instanceId);
    }

    // Simulate 300 simulation steps (15 seconds of swimming)
    for (let step = 0; step < 300; step++) {
      pond.update(0.05);
    }

    // Verify all fish stay strictly within inner safe radius
    for (const fish of pond.getFishList()) {
      assert.ok(
        fish.orbitRadius < pond.pondRadius,
        `Fish orbitRadius ${fish.orbitRadius} must be less than pondRadius ${pond.pondRadius}`
      );
      assert.ok(
        fish.orbitRadius >= 0.35,
        `Fish orbitRadius ${fish.orbitRadius} must stay outside origin center`
      );
      assert.ok(!Number.isNaN(fish.angle), 'Fish angle must be valid number');
    }
  });
});
