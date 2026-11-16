// Headless smoke test for Expansion 7.0 frontier islands, species and fishing.
import { Game } from '../src/core/Game.js';
import { FrontierIslands } from '../src/world/frontierIslands.js';
import { FrontierSpecies } from '../src/fishing/frontierSpecies.js';
import { FishDatabase } from '../src/fishing/FishDatabase.js';
import { FishingState } from '../src/fishing/FishingSystem.js';

const results = [];
const check = (name, condition, detail = '') => {
  results.push({ name, ok: Boolean(condition), detail });
  if (!condition) console.error(`FAIL ${name}${detail ? ` — ${detail}` : ''}`);
};

function landFish(game, spot) {
  game.fishingSystem.reset();
  game.player.equipRod();
  game.player.position.set(spot.position.x, spot.position.y, spot.position.z);
  const cast = game.fishingSystem.quickCast(game.player, spot);
  if (!cast.success) return { error: cast.reason || 'cast failed' };

  game.fishingSystem.update(0.7);
  game.fishingSystem.stateTimer = game.fishingSystem.waitDuration + 0.1;
  game.fishingSystem.update(0.01);
  if (game.fishingSystem.state !== FishingState.BITING) return { error: 'no bite' };
  if (!game.fishingSystem.strike()) return { error: 'strike failed' };

  const hooked = game.fishingSystem.hookedFish;
  game.fishingSystem.isReelHeld = false;
  game.fishingSystem.fishStamina = 0;
  game.fishingSystem.tension = 50;
  game.fishingSystem.catchProgress = 99.9;
  game.fishingSystem.update(0.05);
  return { hooked, state: game.fishingSystem.state };
}

const game = new Game();
check('game constructs', Boolean(game.player));
check('4 frontier islands', FrontierIslands.length === 4, String(FrontierIslands.length));
check('4 frontier zones', game.zoneManager.zones.length === 19, String(game.zoneManager.zones.length));
check('4 outposts', game.frontierBuildings.length === 4, String(game.frontierBuildings.length));
check('4 residents', game.frontierNpcs.length === 4, String(game.frontierNpcs.length));
check('8 frontier fishing spots', game.frontierFishingSpots.length === 8, String(game.frontierFishingSpots.length));
check('8 frontier ferries', game.frontierFerries.length === 8, String(game.frontierFerries.length));
check('24 frontier species', FrontierSpecies.length === 24, String(FrontierSpecies.length));
check('combined catalog 164', FishDatabase.getFullCatalog().length === 164, String(FishDatabase.getFullCatalog().length));
check('classic catalog stays 140', FishDatabase.getExpandedSpecies().length === 140);
check('fish index total 164', game.fishIndex.getSummary().total === 164, String(game.fishIndex.getSummary().total));

// --- Every island is real, walkable terrain in its own zone ---
for (const island of FrontierIslands) {
  const height = game.terrainCollider.sampleHeight(island.center.x, island.center.z);
  check(`${island.name} has terrain`, height > 8, String(height));
  const zone = game.zoneManager.getZoneAt(island.center.x, island.center.z);
  check(`${island.name} has its zone`, zone.id === island.zoneId, zone.id);
}

// --- Ferry to every island, then land a fish on both platforms ---
game.player.economy.addCoins(250);
const coins = game.player.economy.getCoins();
let landed = 0;
for (const island of FrontierIslands) {
  const travel = game.travelToFrontier(island.id);
  check(`ferry to ${island.name}`, travel.success, travel.reason || '');
  check(`${island.name} visit recorded`, game.visitedFrontierIslands.has(island.id));
  check(`coins preserved at ${island.name}`, game.player.economy.getCoins() === coins);

  const spots = game.frontierFishingSpots.filter((spot) => spot.islandId === island.id);
  check(`${island.name} has two platforms`, spots.length === 2, String(spots.length));
  for (const spot of spots) {
    const result = landFish(game, spot);
    const ok = result.state === FishingState.CATCH_SUCCESS && result.hooked?.frontier === true;
    check(`fish landed at ${spot.name}`, ok, result.error || result.hooked?.name || '');
    if (ok) landed += 1;
  }
}
check('all 8 frontier platforms produce fish', landed === 8, String(landed));
check('frontier catch counter', game.frontierCatches === 8, String(game.frontierCatches));
check('bucket holds 8 frontier fish', game.player.inventory.getCount() === 8, String(game.player.inventory.getCount()));
check('index discovers frontier fish', game.fishIndex.getSummary().discovered >= 4, String(game.fishIndex.getSummary().discovered));

// --- Save/load frontier progress ---
const data = game.saveManager.exportSavePayload(game);
check('save contains expansion7 frontier', Boolean(data.expansion7?.frontier));
const restored = new Game();
const load = restored.saveManager.loadGame(restored, data);
check('frontier save loads', load.success, load.reason || '');
check('restored visits', restored.visitedFrontierIslands.size === 4, String(restored.visitedFrontierIslands.size));
check('restored catches', restored.frontierCatches === 8, String(restored.frontierCatches));

// --- Habitat travel routes frontier species to their island ---
const auroraFish = FrontierSpecies.find((fish) => fish.habitat.includes('aurora'));
const route = restored.travelToFishHabitat(auroraFish.id);
check('frontier habitat travel works', route.success && restored.visitedFrontierIslands.has('aurora_isle'), JSON.stringify(route));

// --- Stability ---
for (let i = 0; i < 120; i++) game.update(1 / 60);
check('120 update frames stable', Number.isFinite(game.player.position.x) && Number.isFinite(game.player.position.y));

const failed = results.filter((entry) => !entry.ok);
console.log(`${results.length - failed.length}/${results.length} smoke checks passed`);
if (failed.length) {
  console.error(failed.map((entry) => `- ${entry.name}: ${entry.detail}`).join('\n'));
  process.exit(1);
}
