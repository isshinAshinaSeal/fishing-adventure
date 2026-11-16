// tests/expansion3.test.js — compact isles, built-in huts, fishing tools and
// the expanded fish index.

import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { Game } from '../src/core/Game.js';
import { EconomyManager } from '../src/economy/EconomyManager.js';
import { InventoryManager } from '../src/inventory/InventoryManager.js';
import { FishingToolManager } from '../src/fishing/FishingToolManager.js';
import { FishIndex } from '../src/fishing/FishIndex.js';
import { FishDatabase, ExpandedSpecies } from '../src/fishing/FishDatabase.js';
import { OuterIslands } from '../src/world/islands.js';
import { TravelDestinations } from '../src/transport/FastTravelManager.js';
import { WorldZones } from '../src/world/ZoneManager.js';
import { IslandHutDefinitions } from '../src/expansion/content.js';

describe('Expansion 3.0 — compact isles, huts and fishing tools', () => {
  test('E3-01: seven compact isles are charted as real zones and travel gates', () => {
    assert.equal(OuterIslands.length, 7);
    assert.equal(TravelDestinations.length, 15);
    for (const island of OuterIslands) {
      assert.ok(island.radius <= 65, `${island.name} should stay compact`);
      assert.ok(WorldZones.find((zone) => zone.id === island.id), `Missing zone ${island.id}`);
      assert.ok(TravelDestinations.find((dest) => dest.requiredZone === island.id), `Missing gate for ${island.id}`);
    }
  });

  test('E3-02: island huts are free, interactive and have resident NPCs', () => {
    const game = new Game();
    assert.equal(IslandHutDefinitions.length, 8);
    assert.equal(game.islandHuts.length, 8);
    assert.equal(game.islandHutNpcs.length, 8);
    for (const hut of game.islandHuts) {
      assert.ok(hut.service);
      assert.equal(hut.cost, undefined, 'Built-in huts must not be purchasable');
      assert.ok(game.interactionManager.interactables.has(hut));
    }
    for (const npc of game.islandHutNpcs) {
      assert.ok(game.interactionManager.interactables.has(npc));
    }
  });

  test('E3-03: E at a fishing spot auto-equips the rod and starts a cast', () => {
    const game = new Game();
    const spot = game.fishingSpots.find((entry) => entry.id === 'spot_pier');
    game.player.unequipRod();
    game.player.position.set(spot.position.x, spot.position.y, spot.position.z);
    game.inputManager.interactRequested = true;
    game.interactionManager.update(0.016, game.player, game.inputManager);
    assert.equal(game.player.isRodEquipped, true);
    assert.equal(game.fishingSystem.state, 'CASTING');
    game.fishingSystem.cancelFishing();
  });

  test('E3-04: tools can be bought, equipped, deployed and collected', () => {
    const manager = new FishingToolManager();
    const economy = new EconomyManager({ startingCoins: 5000 });
    assert.equal(manager.buyTool('tool_fish_trap', economy).success, true);
    assert.equal(manager.equip('tool_fish_trap').success, true);
    const deployed = manager.deployTrap('tool_fish_trap', 'kelp', null, 1000);
    assert.equal(deployed.success, true);
    const inventory = new InventoryManager({ defaultCapacity: 10 });
    const collected = manager.collectReady(inventory, 1000 + 90 * 1000);
    assert.equal(collected.success, true);
    assert.equal(collected.catches.length, 2);
    assert.equal(inventory.getCount(), 2);

    const restored = new FishingToolManager();
    restored.deserialize(manager.serialize());
    assert.equal(restored.ownedToolIds.has('tool_fish_trap'), true);
    assert.equal(restored.equippedToolId, 'tool_fish_trap');
  });

  test('E3-05: the expanded index filters by habitat and rarity; 140 fish exist', () => {
    assert.equal(ExpandedSpecies.length, 140);
    assert.equal(FishDatabase.getCategories().length, 14);
    const index = new FishIndex(new InventoryManager());
    const kelp = index.getEntries({ habitat: 'kelp' });
    assert.ok(kelp.length > 0);
    assert.ok(kelp.every((entry) => entry.habitat.includes('kelp')));
    const legendary = index.getEntries({ rarity: 'Legendary' });
    assert.ok(legendary.length > 0);
    assert.ok(legendary.every((entry) => entry.rarity === 'Legendary'));
    const summary = index.getSummary();
    assert.ok(summary.habitats.find((entry) => entry.id === 'kelp'));
    assert.ok(summary.rarities.find((entry) => entry.id === 'Legendary'));
    assert.equal(summary.milestones.length, 5);
  });
});
