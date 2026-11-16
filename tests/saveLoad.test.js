// tests/saveLoad.test.js — Phase 13: Save & Load System Verification

import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { Game } from '../src/core/Game.js';
import { SaveManager } from '../src/core/SaveManager.js';
import { FishDatabase } from '../src/fishing/FishDatabase.js';

describe('Save & Load Persistence System (Phase 13)', () => {
  test('TC-74: Save creates schema-valid, complete payload with timestamp and version', () => {
    const game = new Game();
    const saveManager = new SaveManager();

    const result = saveManager.saveGame(game);
    assert.equal(result.success, true);

    const payload = result.payload;
    assert.equal(payload.version, 2);
    assert.ok(payload.timestamp > 0);
    assert.ok(payload.savedAt);
    assert.ok(payload.player);
    assert.ok(payload.property);
    assert.ok(payload.boats);
    assert.ok(payload.zones);
    assert.ok(payload.quests);
  });

  test('TC-75: Loading restores player coins, position, and equipped items exactly', () => {
    const game1 = new Game();
    // Modify player state
    game1.player.position.set(42.5, 12.3, -88.9);
    game1.player.facingAngle = 1.45;
    game1.player.economy.addCoins(750);
    game1.player.equipRod();

    const saveResult = game1.saveGame();
    assert.equal(saveResult.success, true);

    // Create fresh game instance with default spawn state
    const game2 = new Game();
    assert.notEqual(game2.player.position.x, 42.5);

    // Load saved game
    const loadResult = game2.loadGame(saveResult.payload);
    assert.equal(loadResult.success, true);

    // Verify exact restoration
    assert.equal(game2.player.position.x, 42.5);
    assert.equal(game2.player.position.y, 12.3);
    assert.equal(game2.player.position.z, -88.9);
    assert.equal(game2.player.facingAngle, 1.45);
    assert.equal(game2.player.economy.getCoins(), game1.player.economy.getCoins());
    assert.equal(game2.player.isRodEquipped, true);
  });

  test('TC-76: Loading restores bucket, storage chest, and private pond fish with full metadata', () => {
    const game1 = new Game();

    // Add caught fish to bucket
    const fish1 = FishDatabase.createCatchRecord('golden_trout', 0.95);
    const fish2 = FishDatabase.createCatchRecord('red_snapper', 0.6);
    const fish3 = FishDatabase.createCatchRecord('bluefin', 0.8);

    game1.player.inventory.addFish(fish1);
    game1.player.inventory.addFish(fish2);
    game1.player.inventory.addFish(fish3);

    // Move fish2 into storage chest
    game1.player.storage.storeFishFromBucket(game1.player.inventory, fish2.instanceId);

    // Move fish3 into private pond
    game1.privatePond.placeFishFromBucket(game1.player.inventory, fish3.instanceId);

    assert.equal(game1.player.inventory.getCount(), 1);
    assert.equal(game1.player.storage.getCount(), 1);
    assert.equal(game1.privatePond.getCount(), 1);

    // Save
    const saveRes = game1.saveGame();
    assert.equal(saveRes.success, true);

    // Restore into fresh Game instance
    const game2 = new Game();
    assert.equal(game2.player.inventory.getCount(), 0);
    assert.equal(game2.player.storage.getCount(), 0);
    assert.equal(game2.privatePond.getCount(), 0);

    const loadRes = game2.loadGame(saveRes.payload);
    assert.equal(loadRes.success, true);

    // Verify fish preserved across all 3 containers
    assert.equal(game2.player.inventory.getCount(), 1);
    assert.equal(game2.player.inventory.bucket[0].name, fish1.name);

    assert.equal(game2.player.storage.getCount(), 1);
    assert.equal(game2.player.storage.getStoredFish()[0].name, fish2.name);

    assert.equal(game2.privatePond.getCount(), 1);
    assert.equal(game2.privatePond.getFishList()[0].name, fish3.name);
  });

  test('TC-77: Loading restores owned properties, boats, discovered zones, level, and quest progress', () => {
    const game1 = new Game();

    // Buy seaside cottage
    game1.player.economy.addCoins(1000);
    game1.propertyManager.purchasePlot('plot_seaside', game1.player.economy);
    assert.equal(game1.propertyManager.isPlotOwned('plot_seaside'), true);

    // Buy skiff boat
    game1.boatManager.purchaseBoat('boat_skiff', game1.player.economy);
    assert.equal(game1.boatManager.isBoatOwned('boat_skiff'), true);

    // Discover 2 new zones
    game1.zoneManager.update({ x: 260.0, z: 0.0 }); // coral_reef
    game1.zoneManager.update({ x: 0.0, z: 0.0 });   // highland_springs

    // Gain XP to reach level 2
    game1.player.progression.addXp(250);
    assert.ok(game1.player.progression.getLevel() >= 2);

    // Advance quest
    const quest = game1.questManager.getQuest('quest_first_cast');
    quest.current = 1;
    quest.isCompleted = true;

    // Save
    const saveRes = game1.saveGame();

    // Load into new Game
    const game2 = new Game();
    const loadRes = game2.loadGame(saveRes.payload);
    assert.equal(loadRes.success, true);

    // Verify all subsystems restored
    assert.equal(game2.propertyManager.isPlotOwned('plot_seaside'), true);
    assert.equal(game2.boatManager.isBoatOwned('boat_skiff'), true);
    assert.ok(game2.zoneManager.getDiscoveredZones().includes('coral_reef'));
    assert.ok(game2.zoneManager.getDiscoveredZones().includes('highland_springs'));
    assert.equal(game2.player.progression.getLevel(), game1.player.progression.getLevel());

    const restoredQuest = game2.questManager.getQuest('quest_first_cast');
    assert.equal(restoredQuest.isCompleted, true);
  });

  test('TC-78: Missing or corrupted save data handles gracefully without crashing or throwing', () => {
    const game = new Game();
    const saveManager = new SaveManager({ storageKey: 'non_existent_key_123' });

    // 1. Loading with no save file
    const noSave = saveManager.loadGame(game);
    assert.equal(noSave.success, false);
    assert.match(noSave.reason, /no save/i);

    // 2. Loading with corrupt non-object payload
    const corrupt1 = saveManager.loadGame(game, 'not_valid_json');
    assert.equal(corrupt1.success, false);

    // 3. Loading with missing schema version
    const corrupt2 = saveManager.loadGame(game, { someRandomData: 123 });
    assert.equal(corrupt2.success, false);
    assert.match(corrupt2.reason, /invalid save schema/i);
  });
});
