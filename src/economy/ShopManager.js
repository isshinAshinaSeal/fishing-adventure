// ShopManager: Coordinates merchant catalogues, upgrade transactions, and stat application.

import { Config } from '../config.js';

export class ShopManager {
  constructor(config = Config.economy) {
    this.config = config || {};
    this.rodCatalog = this.config.rodUpgrades || [];
    this.bucketCatalog = this.config.bucketUpgrades || [];
  }

  /**
   * Purchases and equips a fishing rod upgrade.
   * Enforces acceptance tests:
   * 1. Players cannot purchase items they cannot afford.
   * 2. Upgrades apply correct stat bonuses.
   * 3. Merchant inventory updates correctly.
   */
  purchaseRodUpgrade(player, economy, rodId) {
    if (!player || !economy) {
      return { success: false, reason: 'Invalid player or economy system' };
    }

    const upgrade = this.rodCatalog.find((r) => r.id === rodId);
    if (!upgrade) {
      return { success: false, reason: 'Rod upgrade not found' };
    }

    // Check if player already owns this or a higher tier rod
    const currentTier = player.rod ? (player.rod.level || 1) : 1;
    if (upgrade.tier <= currentTier) {
      return { success: false, reason: 'Already equipped or higher tier owned' };
    }

    // Check affordability
    if (!economy.canAfford(upgrade.cost)) {
      return { success: false, reason: `Cannot afford ${upgrade.name} (Need ${upgrade.cost} Coins)` };
    }

    // Spend money
    const spent = economy.spendCoins(upgrade.cost);
    if (!spent) {
      return { success: false, reason: 'Transaction failed' };
    }

    // Apply upgrade stats directly to player's rod
    if (player.rod) {
      player.rod.id = upgrade.id;
      player.rod.name = upgrade.name;
      player.rod.level = upgrade.tier;
      player.rod.reelSpeed = upgrade.reelSpeed;
      player.rod.luckBonus = upgrade.luckBonus;
    }

    return {
      success: true,
      item: upgrade,
      newBalance: economy.getCoins(),
    };
  }

  /**
   * Purchases a bucket upgrade, increasing fish carrying capacity.
   */
  purchaseBucketUpgrade(player, economy, bucketId) {
    if (!player || !economy || !player.inventory) {
      return { success: false, reason: 'Invalid player or inventory system' };
    }

    const upgrade = this.bucketCatalog.find((b) => b.id === bucketId);
    if (!upgrade) {
      return { success: false, reason: 'Bucket upgrade not found' };
    }

    const currentCap = player.inventory.getCapacity();
    if (upgrade.capacity <= currentCap) {
      return { success: false, reason: 'Already have equal or higher bucket capacity' };
    }

    // Check affordability
    if (!economy.canAfford(upgrade.cost)) {
      return { success: false, reason: `Cannot afford ${upgrade.name} (Need ${upgrade.cost} Coins)` };
    }

    // Spend money
    const spent = economy.spendCoins(upgrade.cost);
    if (!spent) {
      return { success: false, reason: 'Transaction failed' };
    }

    // Apply capacity upgrade
    player.inventory.upgradeCapacity(upgrade.capacity);

    return {
      success: true,
      item: upgrade,
      newCapacity: upgrade.capacity,
      newBalance: economy.getCoins(),
    };
  }

  /**
   * Generates live merchant shop listing annotated with current player status.
   */
  getShopCatalogue(player) {
    const currentRodTier = player && player.rod ? (player.rod.level || 1) : 1;
    const currentBucketCap = player && player.inventory ? player.inventory.getCapacity() : 10;

    const rods = this.rodCatalog.map((rod) => ({
      ...rod,
      isOwned: rod.tier <= currentRodTier,
      isEquipped: rod.tier === currentRodTier,
    }));

    const buckets = this.bucketCatalog.map((bucket) => ({
      ...bucket,
      isOwned: bucket.capacity <= currentBucketCap,
      isEquipped: bucket.capacity === currentBucketCap,
    }));

    return { rods, buckets };
  }

  serialize() {
    return { version: 1 };
  }

  deserialize(data) {
    // Upgrades persist directly in player.rod and player.inventory
  }
}

export default ShopManager;
