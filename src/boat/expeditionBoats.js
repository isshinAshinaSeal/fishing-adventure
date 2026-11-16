// Expansion 8.0 — Expedition fleet.
//
// Eight ocean-going vessels sold through the Expedition Fleet command tab.
// Each hull is delivered to a named frontier mooring so the fleet mechanically
// opens the outer archipelago to boat owners instead of ferry-only travel.
//
// Kept out of Config.boats and CityBoatCatalog so the earlier exact-count
// contracts (30 harbor/pirate boats, 10 city boats) remain intact.

import { FrontierIslands } from '../world/frontierIslands.js';

export const ExpeditionBoatCatalog = [
  {
    id: 'boat_exp_tidecat',
    name: 'Tempest Tidecat',
    tier: 22,
    cost: 4200,
    maxSpeed: 14.0,
    reverseSpeed: 4.5,
    acceleration: 7.0,
    deceleration: 4.0,
    turnRate: 2.4,
    capacity: 3,
    hullColor: 0x3b4d63,
    style: 'catamaran',
    hasFishingDeck: true,
    homeIsland: 'tempest_spire',
    description: 'A twin-hull storm runner with a stable fishing deck and room for a small crew.',
  },
  {
    id: 'boat_exp_aurora_runner',
    name: 'Aurora Runner',
    tier: 24,
    cost: 6200,
    maxSpeed: 18.0,
    reverseSpeed: 5.0,
    acceleration: 8.0,
    deceleration: 4.5,
    turnRate: 2.6,
    capacity: 4,
    hullColor: 0x53627a,
    style: 'expedition',
    hasFishingDeck: true,
    hasSonar: true,
    homeIsland: 'aurora_isle',
    description: 'A prism-lit expedition hull that reads the shelf below and fishes from the stern.',
  },
  {
    id: 'boat_exp_mirror_skiff',
    name: 'Mirrorwind Skiff',
    tier: 23,
    cost: 5200,
    maxSpeed: 19.0,
    reverseSpeed: 4.5,
    acceleration: 9.0,
    deceleration: 5.0,
    turnRate: 2.8,
    capacity: 2,
    hullColor: 0x60727e,
    style: 'motor',
    hasFishingDeck: true,
    homeIsland: 'glasswind_cay',
    description: 'A glasswind lake-skimmer that turns on a coin and casts from the bow deck.',
  },
  {
    id: 'boat_exp_serpent_dart',
    name: 'Serpent Dart',
    tier: 25,
    cost: 7400,
    maxSpeed: 23.0,
    reverseSpeed: 5.0,
    acceleration: 10.0,
    deceleration: 5.2,
    turnRate: 3.0,
    capacity: 3,
    hullColor: 0x1e9f73,
    style: 'motor',
    hasFishingDeck: true,
    homeIsland: 'serpent_reef',
    description: 'A reef-hunting dart with a razor bow and a broad, braced fishing platform.',
  },
  {
    id: 'boat_exp_glasswake',
    name: 'Glasswake Explorer',
    tier: 26,
    cost: 8800,
    maxSpeed: 21.0,
    reverseSpeed: 5.5,
    acceleration: 8.5,
    deceleration: 5.0,
    turnRate: 2.3,
    capacity: 6,
    hullColor: 0x5fc9d8,
    style: 'expedition',
    hasFishingDeck: true,
    hasSonar: true,
    hasRadar: true,
    homeIsland: 'glasswind_cay',
    description: 'A crystalline explorer with sonar, radar and a full expedition cockpit.',
  },
  {
    id: 'boat_exp_stormbreaker',
    name: 'Stormbreaker Cutter',
    tier: 28,
    cost: 12000,
    maxSpeed: 25.0,
    reverseSpeed: 6.0,
    acceleration: 10.0,
    deceleration: 5.5,
    turnRate: 2.4,
    capacity: 8,
    hullColor: 0x2f3f70,
    style: 'workboat',
    hasFishingDeck: true,
    hasSonar: true,
    hasRadar: true,
    hasCannons: true,
    homeIsland: 'tempest_spire',
    description: 'A thunder-braced cutter built to hold station in a squall and answer with cannon fire.',
  },
  {
    id: 'boat_exp_aurora_flagship',
    name: 'Aurora Expedition Flagship',
    tier: 30,
    cost: 16500,
    maxSpeed: 27.0,
    reverseSpeed: 6.5,
    acceleration: 11.0,
    deceleration: 6.0,
    turnRate: 2.2,
    capacity: 10,
    hullColor: 0x7b63e0,
    style: 'yacht',
    hasFishingDeck: true,
    hasSonar: true,
    hasRadar: true,
    hasCannons: true,
    homeIsland: 'aurora_isle',
    description: 'The aurora fleet flagship: a long-range yacht with every expedition system installed.',
  },
  {
    id: 'boat_exp_leviathan_hunter',
    name: 'Leviathan Hunter',
    tier: 32,
    cost: 22000,
    maxSpeed: 29.0,
    reverseSpeed: 7.0,
    acceleration: 12.0,
    deceleration: 6.5,
    turnRate: 2.1,
    capacity: 12,
    hullColor: 0x227c9d,
    style: 'galleon',
    hasFishingDeck: true,
    hasSonar: true,
    hasRadar: true,
    hasCannons: true,
    homeIsland: 'serpent_reef',
    description: 'A serpent-reef leviathan hunter with reinforced decks, cannon mounts and a deep-sonar suite.',
  },
].map((boat) => ({ ...boat, vendor: 'expedition' }));

function offshoreMooring(island) {
  const angle = (island.shoreAngle * Math.PI) / 180;
  const distance = island.radius * 1.18;
  return {
    x: Number((island.center.x + Math.cos(angle) * distance).toFixed(2)),
    y: 0,
    z: Number((island.center.z + Math.sin(angle) * distance).toFixed(2)),
  };
}

/**
 * Each frontier island owns a deep-water mooring just outside its dock plus a
 * dry-land anchor for a clean disembark. Boats bought for an island spawn here.
 */
export const ExpeditionMoorings = Object.fromEntries(
  FrontierIslands.map((island) => [
    island.id,
    {
      islandId: island.id,
      islandName: island.name,
      position: offshoreMooring(island),
      anchor: { ...island.arrival },
    },
  ])
);

export const ExpeditionBoatIds = ExpeditionBoatCatalog.map((boat) => boat.id);

export function getExpeditionBoatDefinition(boatId) {
  return ExpeditionBoatCatalog.find((boat) => boat.id === boatId) || null;
}

export function getExpeditionMooring(islandId) {
  return ExpeditionMoorings[islandId] || ExpeditionMoorings.tempest_spire;
}

export default ExpeditionBoatCatalog;
