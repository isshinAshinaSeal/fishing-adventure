// Headless smoke test for Expansion 6.0 city, farming and gathering systems.
import { Game } from '../src/core/Game.js';
import { FarmingManager } from '../src/farming/FarmingManager.js';
import { GatheringManager } from '../src/gathering/GatheringManager.js';

const results = [];
const check = (name, condition, detail = '') => {
  results.push({ name, ok: Boolean(condition), detail });
  if (!condition) console.error(`FAIL ${name}${detail ? ` — ${detail}` : ''}`);
};

const game = new Game();
check('game constructs', Boolean(game.player));
check('14 farm plots', game.farmingManager.plots.length === 14, String(game.farmingManager.plots.length));
check('21 gathering nodes', game.gatheringManager.nodes.length === 21, String(game.gatheringManager.nodes.length));
check('city buildings 12', game.cityBuildings.length === 12, String(game.cityBuildings.length));
check('city NPCs 12', game.cityNpcs.length === 12, String(game.cityNpcs.length));
check('city civilians 18', game.cityCivilians.length === 18, String(game.cityCivilians.length));
check('2 ferries registered', game.ferries.length === 2, String(game.ferries.length));
check('19 fishing spots', game.fishingSpots.length === 19, String(game.fishingSpots.length));

// --- Farming: plant -> water -> grow -> harvest ---
game.player.economy.addCoins(2000);
const plot = game.farmingManager.plots[0];
plot.reset();
const beforeCoins = game.player.economy.getCoins();
const planted = game.farmingManager.plant(plot.id, 'turnip', game.player.economy);
check('plant turnip succeeds', planted.success, planted.reason || '');
check('planting deducts seed cost', game.player.economy.getCoins() === beforeCoins - planted.crop.cost);
check('plot has crop', plot.cropId === 'turnip', String(plot.cropId));

const watered = game.farmingManager.water(plot.id);
check('water succeeds', watered.success, watered.reason || '');
check('plot is watered', plot.watered === true);

plot.growth = plot.crop.growTime;
check('plot ready after growth', plot.isReady === true, `${plot.growth}/${plot.crop.growTime}`);
const beforeHarvestCoins = game.player.economy.getCoins();
const harvested = game.farmingManager.harvest(plot.id, game._farmContext());
check('harvest succeeds', harvested.success, harvested.reason || '');
check('harvest yields produce', harvested.qty > 0, String(harvested.qty));
check('harvest pays coins', game.player.economy.getCoins() === beforeHarvestCoins + harvested.coins);
check('plot resets after harvest', plot.cropId === null);
check('produce stored in backpack', game.backpackManager.has(harvested.produceId), harvested.produceId);

// --- Gather: chop a tree until it falls ---
const tree = game.gatheringManager.nodes.find((node) => node.kind === 'tree');
let swing = null;
for (let i = 0; i < 20 && !swing?.depleted; i++) {
  swing = game.gatheringManager.strike(tree.id, { backpack: game.backpackManager });
  if (!swing.success) break;
}
check('tree can be chopped down', swing?.depleted === true, JSON.stringify(swing && { success: swing.success, reason: swing.reason, depleted: swing.depleted }));
check('tree drops materials', Array.isArray(swing?.drops) && swing.drops.length > 0, JSON.stringify(swing?.drops));
check('tree is depleted', tree.isDepleted === true);
tree.respawnRemaining = 0.01;
game.gatheringManager.update(0.05);
check('tree respawns', tree.isDepleted === false);

const rock = game.gatheringManager.nodes.find((node) => node.kind === 'rock');
let mine = null;
for (let i = 0; i < 20 && !mine?.depleted; i++) {
  mine = game.gatheringManager.strike(rock.id, { backpack: game.backpackManager });
  if (!mine.success) break;
}
check('rock can be mined out', mine?.depleted === true, JSON.stringify(mine && { success: mine.success, reason: mine.reason, depleted: mine.depleted }));

// --- Ferries both directions ---
game.travelToCity();
const cityY = game.terrainCollider.sampleHeight(game.player.position.x, game.player.position.z);
check('ferry to city moves player', Math.abs(game.player.position.x - (-430)) < 1 && Math.abs(game.player.position.z - 505) < 1, `${game.player.position.x},${game.player.position.z}`);
check('city ground elevated', cityY > 5, String(cityY));
game.travelToHarbor();
check('ferry to harbor moves player', Math.abs(game.player.position.x - 12) < 1 && Math.abs(game.player.position.z - (-22)) < 1, `${game.player.position.x},${game.player.position.z}`);

// --- City boat purchase spawns + attaches + boards ---
game.player.economy.addCoins(10000);
const cityDef = game.boatManager.getCityCatalog()[0];
const purchase = game.purchaseCityBoat(cityDef.id);
check('city boat purchased', purchase.success, purchase.reason || '');
const cityBoat = game.boatManager.getActiveBoat();
check('city boat active', Boolean(cityBoat) && cityBoat.id === cityDef.id, cityBoat?.id);
check('city boat registered for interaction', Boolean(cityBoat?.onInteractHandler));
const boarded = cityBoat.onInteractHandler();
check('city boat board via interaction', boarded.success === true, boarded.reason || '');
check('player mounted boat', game.player.isMountedBoat === true);
cityBoat.dismount(game.player);

// --- Save/load expansion6 ---
const data = game.saveManager.exportSavePayload(game);
check('save contains expansion6', Boolean(data.expansion6?.farm && data.expansion6?.gathering));
const expectedProduce = game.farmingManager.stats.harvested;
const expectedNodes = game.gatheringManager.stats.nodesFelled;
const restored = new Game();
restored.saveManager.loadGame(restored, data);
check('restored farm stats', restored.farmingManager.stats.harvested === expectedProduce, `${restored.farmingManager.stats.harvested} vs ${expectedProduce}`);
check('restored gathering stats', restored.gatheringManager.stats.nodesFelled === expectedNodes, `${restored.gatheringManager.stats.nodesFelled} vs ${expectedNodes}`);

// --- Update loop stability ---
for (let i = 0; i < 120; i++) game.update(1 / 60);
check('120 update frames stable', Number.isFinite(game.player.position.x) && !Number.isNaN(game.player.position.y));

const failed = results.filter((entry) => !entry.ok);
console.log(`${results.length - failed.length}/${results.length} smoke checks passed`);
if (failed.length) {
  console.error(failed.map((entry) => `- ${entry.name}: ${entry.detail}`).join('\n'));
  process.exit(1);
}
