// tests/expansion5.test.js — detailed avatars, expedition ships and new tools.

import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { Game } from '../src/core/Game.js';
import { Boat } from '../src/boat/Boat.js';
import { BoatManager } from '../src/boat/BoatManager.js';
import { PlayerController } from '../src/entities/PlayerController.js';
import { createAvatar } from '../src/entities/AvatarFactory.js';
import { CharacterPalettes } from '../src/customization/CharacterCustomization.js';
import { FishingToolManager } from '../src/fishing/FishingToolManager.js';
import { EconomyManager } from '../src/economy/EconomyManager.js';

function countMeshes(object) {
  let count = 0;
  object.traverse((child) => {
    if (child.isMesh) count++;
  });
  return count;
}

describe('Expansion 5.0 — detailed faces, gear and expedition fleet', () => {
  test('E5-01: every NPC has a face, ears, nose, eyes, mouth, belt and backpack', () => {
    const game = new Game();
    assert.ok(game.npcs.length >= 10);
    for (const npc of game.npcs) {
      assert.ok(npc.avatar, `${npc.id} is missing an avatar`);
      assert.ok(npc.avatar.parts.nose, `${npc.id} is missing a nose`);
      assert.ok(npc.avatar.parts.earLeft && npc.avatar.parts.earRight, `${npc.id} is missing ears`);
      assert.ok(npc.avatar.parts.eyeGroup, `${npc.id} is missing an eye group`);
      assert.ok(npc.avatar.parts.mouth, `${npc.id} is missing a mouth`);
      assert.ok(npc.avatar.parts.belt, `${npc.id} is missing a tool belt`);
      assert.ok(npc.avatar.parts.backpack.children.length > 0, `${npc.id} is missing a backpack`);
      assert.ok(countMeshes(npc.mesh) >= 55, `${npc.id} avatar is still too low-detail`);
    }
  });

  test('E5-02: NPC looks are deterministic and distinct by role', () => {
    const finn = createAvatar({ id: 'captain_finn', name: 'Captain Finn', hatStyle: 'captain' });
    const finnAgain = createAvatar({ id: 'captain_finn', name: 'Captain Finn', hatStyle: 'captain' });
    const sable = createAvatar({ id: 'quartermaster_sable', name: 'Sable', isPirate: true });
    assert.equal(finn.faceStyle, finnAgain.faceStyle);
    assert.equal(finn.hairStyle, finnAgain.hairStyle);
    assert.equal(sable.backpackStyle, 'pirate');
    assert.notEqual(finn.group.children.length, 0);
  });

  test('E5-03: player can customize face, hair, facial hair, hat and backpack', () => {
    const player = new PlayerController();
    assert.ok(player.avatar.parts.nose);
    assert.ok(player.avatar.parts.backpack.children.length > 0);

    player.setAppearance({
      faceStyle: 'square',
      hairStyle: 'long',
      facialHair: 'beard',
      hatStyle: 'tricorn',
      backpackStyle: 'pirate',
    });
    assert.equal(player.avatar.faceStyle, 'square');
    assert.equal(player.avatar.hairStyle, 'long');
    assert.equal(player.avatar.backpackStyle, 'pirate');
    assert.ok(player.mesh.getObjectByName('TricornSkull'));
    assert.ok(player.mesh.getObjectByName('BeardBase'));

    const restored = new PlayerController();
    restored.deserialize(player.serialize());
    assert.equal(restored.appearance.faceStyle, 'square');
    assert.equal(restored.getAppearance().backpackStyle, 'pirate');
    assert.ok(CharacterPalettes.backpackStyle.some((entry) => entry.id === 'pirate'));
  });

  test('E5-04: harbor and pirate catalogues now contain 30 fully modelled ships', () => {
    const manager = new BoatManager();
    assert.equal(manager.getCatalog().length, 30);
    assert.equal(manager.getCatalog('harbor').length, 21);
    assert.equal(manager.getPirateCatalog().length, 9);

    const economy = new EconomyManager({ startingCoins: 60000 });
    const bought = manager.purchaseBoat('boat_tidebreaker', economy);
    assert.equal(bought.success, true);
    assert.equal(manager.getActiveBoat().hasFishingDeck, true);
    assert.equal(manager.getActiveBoat().hasSonar, true);
    assert.equal(manager.getActiveBoat().style, 'expedition');
    assert.ok(manager.getActiveBoat().vesselParts.hull);
    assert.ok(manager.getActiveBoat().mesh.getObjectByName('PortGunwale'));
    assert.ok(manager.getActiveBoat().mesh.getObjectByName('Cabin'));

    const pirate = new Boat({ id: 'boat_pirate_tempest', style: 'galleon', hullColor: 0x3a1f4a });
    assert.ok(pirate.mesh.getObjectByName('SkullFlag'));
    assert.ok(pirate.vesselParts.sails.length >= 3);
    const cat = new Boat({ id: 'boat_catamaran', style: 'catamaran', hullColor: 0xe6a119 });
    assert.ok(cat.mesh.getObjectByName('TrampolineDeck'));
  });

  test('E5-05: new fishing tools can be bought, equipped and expose finder modifiers', () => {
    const tools = new FishingToolManager();
    assert.ok(tools.getCatalog().length >= 19);
    assert.ok(tools.getTool('tool_tide_compass'));
    assert.ok(tools.getTool('tool_sonar_drone'));
    assert.ok(tools.getTool('tool_leviathan_harpoon'));

    const economy = new EconomyManager({ startingCoins: 5000 });
    const bought = tools.buyTool('tool_tide_compass', economy);
    assert.equal(bought.success, true);
    assert.equal(tools.equip('tool_tide_compass').success, true);
    const mods = tools.getModifiers();
    assert.ok(mods.finder > 0);
    assert.ok(mods.waitReduction > 0);
  });
});
