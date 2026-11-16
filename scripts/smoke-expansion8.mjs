// Headless smoke test for Expansion 8.0: expedition fleet, gems, story book,
// secret chest, pirate patrol, real steering and deeper fishing mechanics.
import { Game } from '../src/core/Game.js';
import { Config } from '../src/config.js';
import { Boat } from '../src/boat/Boat.js';
import { PlayerController } from '../src/entities/PlayerController.js';
import { FishingState } from '../src/fishing/FishingSystem.js';
import { getExpeditionMooring } from '../src/boat/expeditionBoats.js';
import { GemOffers } from '../src/economy/gemShop.js';

const results = [];
const check = (name, condition, detail = '') => {
  results.push({ name, ok: Boolean(condition), detail });
  if (!condition) console.error(`FAIL ${name}${detail ? ` — ${detail}` : ''}`);
};

function mockInput(keysDown = []) {
  const set = new Set(keysDown);
  return {
    isKeyDown: (key) => set.has(key),
    isActionJustPressed: (key) => set.has(key),
  };
}

function landFish(game, spot) {
  const fishing = game.fishingSystem;
  fishing.reset();
  game.player.equipRod();
  game.player.position.set(spot.position.x, spot.position.y, spot.position.z);
  const cast = fishing.quickCast(game.player, spot);
  if (!cast.success) return { error: cast.reason || 'cast failed' };

  fishing.update(0.7);
  fishing.stateTimer = fishing.waitDuration + 0.1;
  fishing.update(0.01);
  if (fishing.state !== FishingState.BITING) return { error: 'no bite' };
  // Strike inside the perfect-hookset window.
  fishing.stateTimer = 0.25;
  if (!fishing.strike()) return { error: 'strike failed' };

  const hooked = fishing.hookedFish;
  const quality = fishing.hooksetQuality;
  fishing.isReelHeld = false;
  fishing.fishStamina = 0;
  fishing.tension = 50;
  fishing.catchProgress = 99.9;
  fishing.update(0.05);
  return { hooked, quality, state: fishing.state };
}

const game = new Game();
check('game constructs', Boolean(game.player));
check('starter purse is 1,000 coins', game.player.economy.getCoins() === 1000, String(game.player.economy.getCoins()));
check('starter gems are 0', game.player.economy.getGems() === 0, String(game.player.economy.getGems()));
check('92 live rods', game.rodManager.catalog.length === 92, String(game.rodManager.catalog.length));
check('43 live fishing tools', game.fishingToolManager.getCatalog().length === 43, String(game.fishingToolManager.getCatalog().length));
check('8 expedition boats', game.boatManager.getExpeditionCatalog().length === 8, String(game.boatManager.getExpeditionCatalog().length));
check('8 gem offers', GemOffers.length === 8, String(GemOffers.length));
check('10 story chapters', game.storyJournal.getSummary().total === 10, String(game.storyJournal.getSummary().total));

// --- Secret chest in the fishing hut ---
const chest = game.secretChest;
check('secret chest exists', Boolean(chest));
check('secret chest is interactable', game.interactionManager.interactables.has(chest));
const coinsBeforeChest = game.player.economy.getCoins();
const chestOpen = chest.open(game.player);
check('chest opens', chestOpen.success, chestOpen.reason || '');
check('chest pays 20,000 coins', game.player.economy.getCoins() === coinsBeforeChest + 20000, String(game.player.economy.getCoins()));
check('chest pays 2 gems', game.player.economy.getGems() === 2, String(game.player.economy.getGems()));
check('chest cannot be farmed', chest.open(game.player).success === false);

// --- Story book reacts to a real caught fish ---
const classicSpot = game.fishingSpots[0];
const catchResult = landFish(game, classicSpot);
check('perfect hookset', catchResult.quality === 'perfect', catchResult.quality || catchResult.error || '');
check('fish landed for story', catchResult.state === FishingState.CATCH_SUCCESS, catchResult.state || '');
const unlocked = game.storyJournal.update(game);
check('story chapter unlocked', game.storyJournal.getSummary().unlocked >= 1, String(game.storyJournal.getSummary().unlocked));
check('story paid a gem', game.player.economy.getGems() >= 3, String(game.player.economy.getGems()));
check('story marked read', game.storyJournal.markRead('chapter_first_cast').success);

// --- Gem Exchange ---
game.player.economy.addGems(8);
const gemBuy = game.purchaseGemOffer('gem_tool_gem_finder');
check('gem offer purchased', gemBuy.success, gemBuy.reason || '');
check('gem tool owned', game.fishingToolManager.ownedToolIds.has('tool_gem_finder'));
check('gem offer is one-time', game.purchaseGemOffer('gem_tool_gem_finder').success === false);

// --- Expedition boat purchase and delivery ---
const boatPurchase = game.purchaseExpeditionBoat('boat_exp_tidecat');
check('expedition boat purchased', boatPurchase.success, boatPurchase.reason || '');
check('expedition boat owned', game.boatManager.isBoatOwned('boat_exp_tidecat'));
const mooring = getExpeditionMooring('tempest_spire');
const activeBoat = game.boatManager.getActiveBoat();
check('expedition boat at home mooring',
  Math.abs(activeBoat.position.x - mooring.position.x) < 1 && Math.abs(activeBoat.position.z - mooring.position.z) < 1);

// --- Pirate patrol circles the main island ---
const patrol = game.piratePatrol;
check('one pirate patrol', Boolean(patrol));
check('patrol uses the lowest-tier hull', patrol.shipId === 'boat_pirate_jolly', patrol.shipId);
const startAngle = patrol.angle;
for (let i = 0; i < 100; i++) patrol.update(0.05);
check('patrol advances around the island', patrol.angle !== startAngle);
check('patrol keeps its radius', Math.abs(patrol.getDistanceFromCenter() - patrol.radius) < 0.001);
check('patrol radius clears the island', patrol.radius > Config.world.islandRadius, String(patrol.radius));

// --- Real helm physics ---
const sailor = new PlayerController();
const helmBoat = new Boat({ id: 'boat_exp_tidecat', name: 'Tempest Tidecat', isOwned: true, position: { x: 0, y: 0, z: -400 }, maxSpeed: 14, turnRate: 2.4 });
const openWater = { sampleHeight: () => -5 };
helmBoat.mount(sailor);
for (let i = 0; i < 20; i++) helmBoat.update(0.1, mockInput(['KeyW']), openWater);
const yawBefore = helmBoat.yaw;
helmBoat.update(0.1, mockInput(['KeyW', 'KeyA']), openWater);
const steer = helmBoat.getSteeringState();
check('rudder eases instead of snapping', steer.rudderAngle > 0 && steer.rudderAngle < 1, String(steer.rudderAngle));
check('helm turns the hull', helmBoat.yaw > yawBefore);
check('turn produces lateral slip', Math.abs(steer.sideSlip) > 0);
for (let i = 0; i < 20; i++) helmBoat.update(0.1, mockInput(['KeyW', 'ShiftLeft']), openWater);
check('boost exceeds normal top speed', helmBoat.speed > helmBoat.maxSpeed, String(helmBoat.speed));

// --- NPC dialogue choice wiring ---
const npc = game.expansionNpcManager.getAllNPCs()[0];
const dialogue = game.expansionNpcManager.getDialogue(npc.id);
check('NPC dialogue has real choices', dialogue.choices.some((choice) => choice.kind === 'service'));
game.interactionManager.closeDialogue();
npc.onInteract(game.player, game.interactionManager);
check('NPC interaction opens dialogue', Boolean(game.interactionManager.activeDialogue));
while (!game.interactionManager.isDialogueChoiceReady()) game.interactionManager.advanceDialogue();
const serviceIndex = game.interactionManager.getDialogueChoices().findIndex((choice) => choice.kind === 'service');
check('service choice opens a real service', game.chooseDialogue(serviceIndex).success && game.isExpansionOpen);
game.closeExpansion();

// --- Save/load the expansion season ---
const coinsBeforeSave = game.player.economy.getCoins();
const gemsBeforeSave = game.player.economy.getGems();
const payload = game.saveManager.exportSavePayload(game);
check('save has expansion8 section', Boolean(payload.expansion8));
const restored = new Game();
const load = restored.loadGame(payload);
check('expansion8 save loads', load.success, load.reason || '');
check('restored chest stays open', restored.secretChest.opened === true);
check('restored story progress', restored.storyJournal.getSummary().unlocked >= 1);
check('restored coins', restored.player.economy.getCoins() === coinsBeforeSave, String(restored.player.economy.getCoins()));
check('restored gems', restored.player.economy.getGems() === gemsBeforeSave, String(restored.player.economy.getGems()));

// --- Stability ---
for (let i = 0; i < 120; i++) game.update(1 / 60);
check('120 update frames stable', Number.isFinite(game.player.position.x) && Number.isFinite(game.player.position.y));

const failed = results.filter((entry) => !entry.ok);
console.log(`${results.length - failed.length}/${results.length} smoke checks passed`);
if (failed.length) {
  console.error(failed.map((entry) => `- ${entry.name}: ${entry.detail}`).join('\n'));
  process.exit(1);
}
