import { test, describe, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { PropertyManager } from '../src/property/PropertyManager.js';
import { PropertyPlot } from '../src/property/PropertyPlot.js';
import { EconomyManager } from '../src/economy/EconomyManager.js';
import { PlayerController } from '../src/entities/PlayerController.js';
import { Config } from '../src/config.js';

describe('Property & House Ownership System (Phase 6)', () => {
  let propertyManager;
  let economy;
  let player;
  let plot;

  beforeEach(() => {
    propertyManager = new PropertyManager(Config.property);
    economy = new EconomyManager({ startingCoins: 50 });
    player = new PlayerController();
    player.economy = economy;
    plot = propertyManager.getPlot('plot_seaside');
  });

  test('TC-36: Unowned plot shows purchase prompt with exact cost', () => {
    assert.ok(plot, 'Seaside plot must exist in property manager');
    assert.strictEqual(plot.isOwned, false, 'Plot must start unowned');

    const promptText = plot.getPromptText();
    assert.strictEqual(promptText, 'Purchase Seaside Fisherman Cottage (150 Coins)');
  });

  test('TC-37: Plot purchase is rejected when player has insufficient coins', () => {
    assert.strictEqual(economy.getCoins(), 50); // 50 < 150 cost

    const result = plot.purchase(player, economy);
    assert.strictEqual(result.success, false, 'Purchase must be rejected');
    assert.ok(result.reason.includes('Insufficient coins'));
    assert.strictEqual(plot.isOwned, false);
    assert.strictEqual(economy.getCoins(), 50, 'Coins must not be deducted');
  });

  test('TC-38: Plot can be purchased with sufficient money, deducting coins and setting ownership', () => {
    economy.addCoins(120); // 50 + 120 = 170 coins
    assert.strictEqual(economy.getCoins(), 170);

    const result = plot.purchase(player, economy);
    assert.strictEqual(result.success, true);
    assert.strictEqual(plot.isOwned, true);
    assert.strictEqual(economy.getCoins(), 20, '150 Coins must be deducted (170 - 150 = 20)');

    // Attempting to purchase again must fail
    const duplicatePurchase = plot.purchase(player, economy);
    assert.strictEqual(duplicatePurchase.success, false);
  });

  test('TC-39: Exterior 3D visual state reflects ownership transition', () => {
    // Unowned state: Sign visible, house hidden
    assert.strictEqual(plot.signMesh.visible, true, 'Signboard must be visible when unowned');
    assert.strictEqual(plot.houseMesh.visible, false, 'Cottage structure must be hidden when unowned');

    // Purchase
    economy.addCoins(200);
    plot.purchase(player, economy);

    // Owned state: Sign hidden, house visible
    assert.strictEqual(plot.signMesh.visible, false, 'Signboard must hide once cottage is purchased');
    assert.strictEqual(plot.houseMesh.visible, true, 'Cottage structure must become visible once purchased');
    assert.strictEqual(plot.getPromptText(), 'Enter Seaside Fisherman Cottage');
  });

  test('TC-40: Owned house can be entered and exited, updating player position', () => {
    economy.addCoins(200);
    plot.purchase(player, economy);

    // Initial position outside
    player.position.copy(plot.outsidePos);

    // 1. Enter House
    const enterResult = plot.enter(player);
    assert.strictEqual(enterResult.success, true);
    assert.strictEqual(plot.isInside, true);
    assert.strictEqual(player.position.x, plot.interiorPos.x);
    assert.strictEqual(player.position.y, plot.interiorPos.y);
    assert.strictEqual(player.position.z, plot.interiorPos.z);
    assert.strictEqual(plot.getPromptText(), 'Exit to Island');

    // 2. Exit House
    const exitResult = plot.exit(player);
    assert.strictEqual(exitResult.success, true);
    assert.strictEqual(plot.isInside, false);
    assert.strictEqual(player.position.x, plot.outsidePos.x);
    assert.strictEqual(player.position.y, plot.outsidePos.y);
    assert.strictEqual(player.position.z, plot.outsidePos.z);
    assert.strictEqual(plot.getPromptText(), 'Enter Seaside Fisherman Cottage');
  });

  test('TC-41: Non-owners cannot enter an unowned house', () => {
    assert.strictEqual(plot.isOwned, false);

    const enterResult = plot.enter(player);
    assert.strictEqual(enterResult.success, false, 'Entering unowned house must be rejected');
    assert.ok(enterResult.reason.includes('do not own'));
    assert.strictEqual(plot.isInside, false);
  });

  test('TC-42: House ownership state serializes and deserializes accurately (persistence)', () => {
    economy.addCoins(200);
    plot.purchase(player, economy);
    assert.strictEqual(plot.isOwned, true);

    // Serialize all plots
    const savedData = propertyManager.serialize();
    assert.strictEqual(savedData['plot_seaside'].isOwned, true);
    assert.strictEqual(savedData['plot_hilltop'].isOwned, false);

    // Reset world state
    propertyManager.reset();
    assert.strictEqual(propertyManager.getPlot('plot_seaside').isOwned, false);

    // Restore saved state
    propertyManager.deserialize(savedData);
    const restoredPlot = propertyManager.getPlot('plot_seaside');
    assert.strictEqual(restoredPlot.isOwned, true, 'Ownership must persist after deserialization');
    assert.strictEqual(restoredPlot.houseMesh.visible, true, 'Visual mesh must update after deserialization');
  });
});
