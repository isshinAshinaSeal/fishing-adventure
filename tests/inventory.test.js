import { test, describe, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { InventoryManager } from '../src/inventory/InventoryManager.js';
import { FishDatabase, FishSpecies } from '../src/fishing/FishDatabase.js';

describe('InventoryManager & Fish Encyclopedia (Phase 4)', () => {
  let inventory;

  beforeEach(() => {
    inventory = new InventoryManager({ defaultCapacity: 5 });
  });

  test('TC-22: Correct fish is added after catching and count increments', () => {
    const testFish = {
      speciesId: 'seabass',
      name: 'Black Sea Bass',
      rarity: 'Uncommon',
      weight: 2.45,
      value: 32,
      icon: '🐠',
    };

    const result = inventory.addFish(testFish);
    assert.strictEqual(result.success, true);
    assert.strictEqual(inventory.getCount(), 1);

    const storedList = inventory.bucket;
    assert.strictEqual(storedList.length, 1);
    assert.strictEqual(storedList[0].speciesId, 'seabass');
    assert.strictEqual(storedList[0].name, 'Black Sea Bass');
    assert.ok(storedList[0].instanceId, 'Fish must be assigned a unique instanceId');
  });

  test('TC-23: Bucket capacity is strictly respected (rejects excess fish)', () => {
    const cap = inventory.getCapacity(); // 5
    assert.strictEqual(cap, 5);

    // Fill to exactly capacity
    for (let i = 0; i < cap; i++) {
      const fish = FishDatabase.generateCatch('coast');
      const res = inventory.addFish(fish);
      assert.strictEqual(res.success, true);
    }

    assert.strictEqual(inventory.getCount(), 5);
    assert.strictEqual(inventory.isFull(), true);

    // Attempt to add 6th fish
    const overflowFish = FishDatabase.generateCatch('coast');
    const overflowRes = inventory.addFish(overflowFish);

    assert.strictEqual(overflowRes.success, false, 'Adding beyond capacity must fail');
    assert.strictEqual(overflowRes.reason, 'Bucket is full');
    assert.strictEqual(inventory.getCount(), 5, 'Count must not exceed capacity');
  });

  test('TC-24: Fish data (weight, rarity, value, timestamp) is preserved intact', () => {
    const originalFish = {
      speciesId: 'goldentrout',
      name: 'Golden Sun Trout',
      rarity: 'Legendary',
      weight: 12.85,
      value: 240,
      icon: '✨',
      description: 'Mythical fish.',
      caughtAt: 1700000000000,
    };

    inventory.addFish(originalFish);
    const stored = inventory.bucket[0];

    assert.strictEqual(stored.speciesId, originalFish.speciesId);
    assert.strictEqual(stored.name, originalFish.name);
    assert.strictEqual(stored.rarity, originalFish.rarity);
    assert.strictEqual(stored.weight, 12.85);
    assert.strictEqual(stored.value, 240);
    assert.strictEqual(stored.icon, originalFish.icon);
    assert.strictEqual(stored.caughtAt, 1700000000000);
  });

  test('TC-25: Inventory displays correct quantities, total weight, and market value', () => {
    inventory.addFish({ speciesId: 'sardine', name: 'Driftwood Sardine', rarity: 'Common', weight: 0.3, value: 6 });
    inventory.addFish({ speciesId: 'sardine', name: 'Driftwood Sardine', rarity: 'Common', weight: 0.4, value: 8 });
    inventory.addFish({ speciesId: 'mackerel', name: 'Atlantic Mackerel', rarity: 'Common', weight: 1.0, value: 14 });

    assert.strictEqual(inventory.getCount(), 3);
    assert.strictEqual(inventory.getTotalWeight(), 1.7);
    assert.strictEqual(inventory.getTotalValue(), 28);

    // Verify species grouping
    const grouped = inventory.getGroupedBySpecies();
    assert.strictEqual(grouped.length, 2);

    const sardineGroup = grouped.find((g) => g.speciesId === 'sardine');
    assert.ok(sardineGroup);
    assert.strictEqual(sardineGroup.count, 2);
    assert.strictEqual(sardineGroup.totalWeight, 0.7);
    assert.strictEqual(sardineGroup.totalValue, 14);
  });

  test('TC-26: Fish rarity and values match the database schema', () => {
    const allDbSpecies = FishDatabase.getAllSpecies();

    for (const species of allDbSpecies) {
      assert.ok(['Common', 'Uncommon', 'Rare', 'Legendary'].includes(species.rarity));
      assert.ok(species.basePrice > 0);
      assert.ok(species.weightRange[0] < species.weightRange[1]);
    }

    // Generated catches match database bounds
    for (let i = 0; i < 30; i++) {
      const generated = FishDatabase.generateCatch('ocean');
      const dbMatch = FishDatabase.getSpeciesById(generated.speciesId);
      assert.ok(dbMatch, `Species ${generated.speciesId} must exist in database`);
      assert.strictEqual(generated.rarity, dbMatch.rarity);
      assert.ok(generated.weight >= dbMatch.weightRange[0] - 0.01);
      assert.ok(generated.weight <= dbMatch.weightRange[1] + 0.01);
    }
  });

  test('TC-27: Encyclopedia records discoveries, catch count, and personal records', () => {
    assert.strictEqual(inventory.getDiscoveryCount(), 0);

    // Catch smaller sardine
    inventory.addFish({ speciesId: 'sardine', name: 'Driftwood Sardine', rarity: 'Common', weight: 0.25, value: 6 });
    assert.strictEqual(inventory.getDiscoveryCount(), 1);

    // Catch heavier sardine
    inventory.addFish({ speciesId: 'sardine', name: 'Driftwood Sardine', rarity: 'Common', weight: 0.42, value: 9 });
    assert.strictEqual(inventory.getDiscoveryCount(), 1); // same species

    const ency = inventory.getEncyclopediaData();
    const sardineRecord = ency.find((s) => s.id === 'sardine');

    assert.strictEqual(sardineRecord.discovered, true);
    assert.strictEqual(sardineRecord.timesCaught, 2);
    assert.strictEqual(sardineRecord.maxWeight, 0.42);
    assert.strictEqual(sardineRecord.minWeight, 0.25);

    // Undiscovered species remain obfuscated
    const undiscovered = ency.find((s) => s.id === 'golden_trout');
    assert.strictEqual(undiscovered.discovered, false);
    assert.strictEqual(undiscovered.name, '???');
  });

  test('TC-28: Removing individual fish or clearing bucket updates state accurately', () => {
    const res1 = inventory.addFish({ speciesId: 'sardine', name: 'Sardine', weight: 0.2, value: 5 });
    const res2 = inventory.addFish({ speciesId: 'mackerel', name: 'Mackerel', weight: 0.8, value: 12 });

    const removed = inventory.removeFish(res1.item.instanceId);
    assert.strictEqual(removed.instanceId, res1.item.instanceId);
    assert.strictEqual(inventory.getCount(), 1);
    assert.strictEqual(inventory.bucket[0].speciesId, 'mackerel');

    inventory.clearBucket();
    assert.strictEqual(inventory.getCount(), 0);
    assert.strictEqual(inventory.getTotalValue(), 0);
  });
});
