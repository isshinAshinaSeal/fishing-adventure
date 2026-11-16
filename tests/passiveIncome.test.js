// tests/passiveIncome.test.js — Phase 8: Passive Income System Verification

import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { PassiveIncomeManager } from '../src/economy/PassiveIncomeManager.js';
import { PrivatePond } from '../src/storage/PrivatePond.js';
import { EconomyManager } from '../src/economy/EconomyManager.js';
import { InventoryManager } from '../src/inventory/InventoryManager.js';
import { FishDatabase } from '../src/fishing/FishDatabase.js';

describe('Passive Income System (Phase 8)', () => {
  function createFishWithPond(speciesList = ['golden_trout']) {
    const pond = new PrivatePond({ capacity: 8, pondRadius: 3.0 });
    const inventory = new InventoryManager({ bucketCapacity: 10 });
    for (const id of speciesList) {
      const f = FishDatabase.createCatchRecord(id, 1.0);
      inventory.addFish(f);
      pond.placeFishFromBucket(inventory, f.instanceId);
    }
    return pond;
  }

  test('TC-48: Pond fish generate money over time', () => {
    const pond = createFishWithPond(['golden_trout']);
    const passive = new PassiveIncomeManager({
      incomeMultiplier: 0.02,
      maxCoinCap: 500,
    });

    assert.equal(passive.getAccumulatedCoins(), 0);
    const expectedRate = passive.calculatePerSecondRate(pond);
    assert.ok(expectedRate > 0);

    // Simulate 5 seconds in real time
    for (let i = 0; i < 50; i++) {
      passive.update(0.1, pond);
    }

    const expectedCoins = Math.floor(expectedRate * 5.0);
    const coins = passive.getAccumulatedCoins();
    assert.ok(
      Math.abs(coins - expectedCoins) <= 1,
      `Expected ~${expectedCoins} coins, got ${coins}`
    );
  });

  test('TC-49: Collecting money adds to player balance', () => {
    const economy = new EconomyManager({ startingCoins: 100 });
    const pond = createFishWithPond(['golden_trout']);
    const passive = new PassiveIncomeManager({
      incomeMultiplier: 0.02,
      maxCoinCap: 500,
    });

    // Generate coins over 10 seconds
    passive.update(10.0, pond);
    const generated = passive.getAccumulatedCoins();
    assert.ok(generated > 0);

    // Collect
    const collectResult = passive.collectEarnings(economy);
    assert.equal(collectResult.success, true);
    assert.equal(collectResult.collected, generated);
    assert.equal(economy.getCoins(), 100 + generated);

    // Verify passive pool is emptied
    assert.equal(passive.getAccumulatedCoins(), 0);

    // Collecting again with empty pool fails cleanly
    const repeatResult = passive.collectEarnings(economy);
    assert.equal(repeatResult.success, false);
    assert.equal(economy.getCoins(), 100 + generated);
  });

  test('TC-50: Offline time generates money up to cap', () => {
    const pond = createFishWithPond(['golden_trout']);
    const passive = new PassiveIncomeManager({
      incomeMultiplier: 0.02,
      maxAccumulationSeconds: 100, // Cap at 100 seconds
      maxCoinCap: 150, // Hard coin ceiling lower than uncapped earnings
    });

    // Simulate returning after 1000 seconds offline
    const offlineResult = passive.processOfflineEarnings(pond, 1000);
    assert.equal(offlineResult.elapsedSeconds, 100); // Clamped to maxAccumulationSeconds
    assert.equal(passive.getAccumulatedCoins(), 150); // Clamped to maxCoinCap
  });

  test('TC-51: Empty pond generates zero money', () => {
    const emptyPond = new PrivatePond({ capacity: 8 });
    const passive = new PassiveIncomeManager({
      incomeMultiplier: 0.02,
      maxCoinCap: 500,
    });

    const rate = passive.calculatePerSecondRate(emptyPond);
    assert.equal(rate, 0.0);

    passive.update(10.0, emptyPond);
    assert.equal(passive.getAccumulatedCoins(), 0);

    const offlineResult = passive.processOfflineEarnings(emptyPond, 3600);
    assert.equal(offlineResult.earned, 0);
    assert.equal(passive.getAccumulatedCoins(), 0);
  });

  test('TC-52: Generation rate scales with fish rarity and value', () => {
    const passive = new PassiveIncomeManager({ incomeMultiplier: 0.01 });

    // Common fish pond (sardine)
    const commonPond = createFishWithPond(['sardine']);
    const commonRate = passive.calculatePerSecondRate(commonPond);

    // Rare/Uncommon fish pond (red_snapper)
    const rarePond = createFishWithPond(['red_snapper']);
    const rareRate = passive.calculatePerSecondRate(rarePond);

    // Legendary fish pond (golden_trout)
    const legendPond = createFishWithPond(['golden_trout']);
    const legendRate = passive.calculatePerSecondRate(legendPond);

    assert.ok(
      legendRate > rareRate,
      `Legendary rate (${legendRate}) must be higher than rare rate (${rareRate})`
    );
    assert.ok(
      rareRate > commonRate,
      `Rare rate (${rareRate}) must be higher than common rate (${commonRate})`
    );

    // Multi-fish pond sums rates
    const multiPond = createFishWithPond(['sardine', 'red_snapper']);
    const multiRate = passive.calculatePerSecondRate(multiPond);
    assert.equal(
      multiRate,
      Number((commonRate + rareRate).toFixed(3)),
      'Multiple fish should sum their values toward passive generation rate'
    );
  });
});
