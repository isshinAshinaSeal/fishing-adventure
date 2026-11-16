import { test, describe, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { EconomyManager } from '../src/economy/EconomyManager.js';
import { ShopManager } from '../src/economy/ShopManager.js';
import { InventoryManager } from '../src/inventory/InventoryManager.js';
import { PlayerController } from '../src/entities/PlayerController.js';
import { Config } from '../src/config.js';

describe('EconomyManager & Merchant Shop System (Phase 5)', () => {
  let economy;
  let shopManager;
  let inventory;
  let player;

  beforeEach(() => {
    economy = new EconomyManager({ startingCoins: 50 });
    shopManager = new ShopManager(Config.economy);
    inventory = new InventoryManager({ defaultCapacity: 10 });
    player = new PlayerController();
    player.economy = economy;
    player.inventory = inventory;
  });

  test('TC-29: Selling a fish removes it from bucket and credits correct coin value', () => {
    const fish = {
      speciesId: 'seabass',
      name: 'Black Sea Bass',
      weight: 2.5,
      value: 35,
    };
    const addResult = inventory.addFish(fish);
    const instanceId = addResult.item.instanceId;

    assert.strictEqual(economy.getCoins(), 50);
    assert.strictEqual(inventory.getCount(), 1);

    const sellResult = economy.sellFish(inventory, instanceId);

    assert.strictEqual(sellResult.success, true);
    assert.strictEqual(sellResult.earned, 35);
    assert.strictEqual(sellResult.newBalance, 85);
    assert.strictEqual(economy.getCoins(), 85, 'Economy balance must reflect added sale price');
    assert.strictEqual(inventory.getCount(), 0, 'Fish must be removed from bucket');
  });

  test('TC-30: Selling the same fish twice is strictly impossible', () => {
    const fish = { speciesId: 'sardine', name: 'Sardine', value: 10 };
    const addResult = inventory.addFish(fish);
    const instanceId = addResult.item.instanceId;

    // First sale -> success
    const firstSale = economy.sellFish(inventory, instanceId);
    assert.strictEqual(firstSale.success, true);
    assert.strictEqual(economy.getCoins(), 60);

    // Attempt second sale of same instanceId
    const secondSale = economy.sellFish(inventory, instanceId);
    assert.strictEqual(secondSale.success, false, 'Selling identical fish twice must fail');
    assert.ok(secondSale.reason.includes('already sold') || secondSale.reason.includes('not found'));
    assert.strictEqual(economy.getCoins(), 60, 'Coins must not increment on duplicate sale attempt');
  });

  test('TC-31: Sell All Fish computes accurate aggregate sum and empties bucket', () => {
    inventory.addFish({ speciesId: 'sardine', name: 'Sardine 1', value: 5 });
    inventory.addFish({ speciesId: 'sardine', name: 'Sardine 2', value: 8 });
    inventory.addFish({ speciesId: 'mackerel', name: 'Mackerel', value: 15 });

    assert.strictEqual(inventory.getCount(), 3);
    const result = economy.sellAllFish(inventory);

    assert.strictEqual(result.success, true);
    assert.strictEqual(result.earned, 28);
    assert.strictEqual(result.count, 3);
    assert.strictEqual(economy.getCoins(), 78); // 50 + 28
    assert.strictEqual(inventory.getCount(), 0);
  });

  test('TC-32: Players cannot purchase items they cannot afford', () => {
    // Starting coins = 50. Titanium rod costs 350 Coins.
    assert.strictEqual(economy.getCoins(), 50);

    const buyTitaniumResult = shopManager.purchaseRodUpgrade(player, economy, 'rod_titanium');
    assert.strictEqual(buyTitaniumResult.success, false, 'Should reject purchase due to insufficient coins');
    assert.ok(buyTitaniumResult.reason.includes('Cannot afford'));
    assert.strictEqual(economy.getCoins(), 50, 'Balance must not change on rejected purchase');

    // Bucket cooler costs 220 Coins
    const buyCoolerResult = shopManager.purchaseBucketUpgrade(player, economy, 'bucket_cooler');
    assert.strictEqual(buyCoolerResult.success, false, 'Should reject bucket purchase');
    assert.strictEqual(player.inventory.getCapacity(), 10, 'Capacity must remain unchanged');
  });

  test('TC-33: Upgrades apply correct stat bonuses to equipment', () => {
    // Give player enough coins for Fiberglass rod (cost 120)
    economy.addCoins(100); // 50 + 100 = 150
    assert.strictEqual(economy.getCoins(), 150);

    const purchaseResult = shopManager.purchaseRodUpgrade(player, economy, 'rod_fiberglass');
    assert.strictEqual(purchaseResult.success, true);
    assert.strictEqual(economy.getCoins(), 30); // 150 - 120

    // Verify stat bonuses on player's rod
    assert.strictEqual(player.rod.id, 'rod_fiberglass');
    assert.strictEqual(player.rod.level, 2);
    assert.strictEqual(player.rod.reelSpeed, 1.35, 'Reel speed must be upgraded to 1.35x');
    assert.strictEqual(player.rod.luckBonus, 0.12, 'Luck bonus must be upgraded to +12%');
  });

  test('TC-34: Bucket upgrades expand player carrying capacity', () => {
    // Wooden bucket costs 80 Coins, expands capacity to 20
    economy.addCoins(50); // 50 + 50 = 100
    assert.strictEqual(economy.getCoins(), 100);

    const upgradeResult = shopManager.purchaseBucketUpgrade(player, economy, 'bucket_wooden');
    assert.strictEqual(upgradeResult.success, true);
    assert.strictEqual(economy.getCoins(), 20); // 100 - 80

    assert.strictEqual(player.inventory.getCapacity(), 20, 'Capacity should now be 20');

    // Verify player can now hold more than 10 fish
    for (let i = 0; i < 15; i++) {
      const res = player.inventory.addFish({ speciesId: 'sardine', name: `Sardine ${i}`, value: 5 });
      assert.strictEqual(res.success, true);
    }
    assert.strictEqual(player.inventory.getCount(), 15);
    assert.strictEqual(player.inventory.isFull(), false);
  });

  test('TC-35: Merchant inventory updates correctly (owned vs unowned status)', () => {
    // Initial catalogue state
    let catalogue = shopManager.getShopCatalogue(player);
    const starterRod = catalogue.rods.find((r) => r.id === 'rod_starter');
    const fiberglassRod = catalogue.rods.find((r) => r.id === 'rod_fiberglass');

    assert.strictEqual(starterRod.isOwned, true);
    assert.strictEqual(starterRod.isEquipped, true);
    assert.strictEqual(fiberglassRod.isOwned, false);

    // Purchase fiberglass rod
    economy.addCoins(200);
    shopManager.purchaseRodUpgrade(player, economy, 'rod_fiberglass');

    // Re-query catalogue
    catalogue = shopManager.getShopCatalogue(player);
    const updatedFiberglass = catalogue.rods.find((r) => r.id === 'rod_fiberglass');
    assert.strictEqual(updatedFiberglass.isOwned, true, 'Fiberglass rod must now be marked owned');
    assert.strictEqual(updatedFiberglass.isEquipped, true, 'Fiberglass rod must now be marked equipped');
  });
});
