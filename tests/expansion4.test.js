// tests/expansion4.test.js — Pirate Dock, paid fleet, lobby and character studio.

import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { Game } from '../src/core/Game.js';
import { BoatManager } from '../src/boat/BoatManager.js';
import { EconomyManager } from '../src/economy/EconomyManager.js';
import { FishDatabase, ExpandedSpecies } from '../src/fishing/FishDatabase.js';
import { FishIndex } from '../src/fishing/FishIndex.js';
import { InventoryManager } from '../src/inventory/InventoryManager.js';
import { CharacterCustomization, CharacterPalettes } from '../src/customization/CharacterCustomization.js';

describe('Expansion 4.0 — pirate fleet, lobby and character studio', () => {
  test('E4-01: new Pirate Waters and Coral Reef catalogues feed the index', () => {
    assert.equal(ExpandedSpecies.length, 140);
    assert.equal(FishDatabase.getCategories().length, 14);
    assert.ok(FishDatabase.getCategories().includes('Pirate Waters'));
    assert.ok(FishDatabase.getCategories().includes('Coral Reef'));
    assert.ok(FishDatabase.getSpeciesById('ghost_fleet_serpent'));
    assert.ok(FishDatabase.getSpeciesById('living_reef_dragon'));

    const index = new FishIndex(new InventoryManager());
    const pirate = index.getEntries({ category: 'Pirate Waters' });
    const coral = index.getEntries({ category: 'Coral Reef' });
    assert.equal(pirate.length, 12);
    assert.equal(coral.length, 12);
    const byValue = index.getEntries({ sort: 'value' });
    for (let i = 1; i < byValue.length; i++) {
      assert.ok(byValue[i - 1].basePrice >= byValue[i].basePrice);
    }
    assert.ok(index.getSummary().catalogValue > 0);
  });

  test('E4-02: pirate fleet exposes the 50/150/400 coin tiers at 10/12/15 m/s', () => {
    const manager = new BoatManager();
    assert.equal(manager.getCatalog().length, 30);
    assert.equal(manager.getPirateCatalog().length, 9);

    const expected = [
      ['boat_pirate_jolly', 50, 10],
      ['boat_pirate_runner', 150, 12],
      ['boat_pirate_cutter', 400, 15],
    ];
    for (const [id, cost, speed] of expected) {
      const boat = manager.getPirateCatalog().find((entry) => entry.id === id);
      assert.ok(boat, `Missing ${id}`);
      assert.equal(boat.vendor, 'pirate');
      assert.equal(boat.cost, cost);
      assert.ok(boat.maxSpeed >= speed, `${id} should reach at least ${speed} m/s`);
    }
  });

  test('E4-03: pirate vessels can be bought with exact coin costs and become active', () => {
    for (const [id, cost] of [['boat_pirate_jolly', 50], ['boat_pirate_runner', 150], ['boat_pirate_cutter', 400]]) {
      const economy = new EconomyManager({ startingCoins: cost });
      const manager = new BoatManager();
      const result = manager.purchaseBoat(id, economy);
      assert.equal(result.success, true);
      assert.equal(economy.getCoins(), 0);
      assert.equal(manager.getActiveBoat().id, id);
    }
  });

  test('E4-04: the Corsair Dock is a real interactable with Quartermaster Sable', () => {
    const game = new Game();
    assert.ok(game.pirateDock, 'Pirate Dock must be spawned');
    assert.ok(game.pirateNpc, 'Pirate NPC must be spawned');
    assert.equal(game.pirateNpc.name, 'Quartermaster Sable');
    assert.equal(game.pirateNpc.isPirate, true);
    assert.ok(game.interactionManager.interactables.has(game.pirateDock));
    assert.ok(game.interactionManager.interactables.has(game.pirateNpc));
    game.player.position.set(game.pirateNpc.position.x, game.pirateNpc.position.y, game.pirateNpc.position.z);
    game.interactionManager.lastInteractTime = -9999;
    game.inputManager.interactRequested = true;
    game.interactionManager.update(0.016, game.player, game.inputManager);
    assert.equal(game.isShopOpen, true);
  });

  test('E4-05: lobby state blocks the avatar until Start is pressed', () => {
    const game = new Game();
    game.openLobby();
    assert.equal(game.isLobbyOpen, true);
    game.beginAdventure();
    assert.equal(game.isLobbyOpen, false);
  });

  test('E4-06: skin shop purchase and customization update the live character and persist', () => {
    const game = new Game();
    const starter = game.player.getAppearance();
    assert.equal(starter.shirtColor, 0x3377aa);

    const result = game.characterCustomization.purchaseSkin('outfit_coral', game.player.economy);
    assert.equal(result.success, true);
    assert.equal(game.characterCustomization.equippedSkinId, 'outfit_coral');
    assert.equal(game.player.getAppearance().shirtColor, 0xc94f4f);

    const custom = game.applyCharacterAppearance({ shirtColor: CharacterPalettes.shirt[3].color });
    assert.equal(custom.shirtColor, CharacterPalettes.shirt[3].color);
    assert.equal(game.characterCustomization.equippedSkinId, null);

    const restoredPlayer = new Game().player;
    game.player.serialize();
    const data = game.player.serialize();
    restoredPlayer.deserialize(data);
    assert.equal(restoredPlayer.getAppearance().shirtColor, CharacterPalettes.shirt[3].color);
  });

  test('E4-07: owned skins serialize through the character customization manager', () => {
    const manager = new CharacterCustomization();
    manager.purchaseSkin('outfit_coral', new EconomyManager({ startingCoins: 50 }));
    const restored = new CharacterCustomization();
    restored.deserialize(manager.serialize());
    assert.equal(restored.ownedSkinIds.has('outfit_coral'), true);
    assert.equal(restored.getEquippedSkin().id, 'outfit_coral');
    assert.equal(restored.getCatalog().length, 8);
  });
});
