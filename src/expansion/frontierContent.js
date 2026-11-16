// Expansion 7.0 frontier content: island outposts, resident NPCs, fishing
// platforms and expedition ferries. Kept apart from the city/harbor catalogs so
// existing exact-count expansion tests continue to describe the original hub.

import { FrontierIslands } from '../world/frontierIslands.js';

const OUTPOSTS = {
  tempest_spire: {
    id: 'bld_tempest_outpost', name: 'Stormwatch Outpost', service: 'rods', icon: '⚡', color: 0x3b4d63,
    offset: { x: 6, z: -4 },
    description: 'A lightning-braced rod workshop above the Stormbreak Ledge.',
    npc: {
      id: 'stormwarden_kai', name: 'Stormwarden Kai', title: 'Tempest Rodwarden',
      offset: { x: -3, z: 4 }, facingAngle: Math.PI * 0.75,
      coatColor: 0x27435a, hatStyle: 'captain', hairStyle: 'short', backpackStyle: 'expedition',
      dialogue: [
        'You made it through the squall line. Most anglers turn back before the spire.',
        'The stormfish bite hardest when the thunder rolls. Try the Stormbreak Ledge at dawn.',
        'A Tempest Leviathan took my best rod once. I still fish here every week.',
      ],
    },
  },
  aurora_isle: {
    id: 'bld_aurora_outpost', name: 'Aurora Light', service: 'potions', icon: '🌌', color: 0x4a4f8a,
    offset: { x: 6, z: -4 },
    description: 'A prism-lit lighthouse brewing aurora tonics for the long polar night.',
    npc: {
      id: 'aurora_keeper_elara', name: 'Keeper Elara', title: 'Aurora Light Keeper',
      offset: { x: -3, z: 4 }, facingAngle: Math.PI * 0.25,
      coatColor: 0x5b4a8a, hairStyle: 'long', backpackStyle: 'satchel',
      dialogue: [
        'The aurora is bright tonight. The smelt rise to the surface to watch it.',
        'Borealis Sturgeon sleep under the shelf. Bring golden bait and patience.',
        'Some say the Aurora Seraph is a piece of the sky that fell in love with the sea.',
      ],
    },
  },
  glasswind_cay: {
    id: 'bld_glasswind_outpost', name: 'Glasswind Workshop', service: 'crafting', icon: '💎', color: 0x4f7a86,
    offset: { x: 6, z: -4 },
    description: 'A crystal-cutting workshop that turns glasswind shards into fishing gear.',
    npc: {
      id: 'glasswright_mira', name: 'Glasswright Mira', title: 'Glasswind Artisan',
      offset: { x: -3, z: 4 }, facingAngle: Math.PI * 0.9,
      coatColor: 0x3c6470, hairStyle: 'wavy', backpackStyle: 'crafting',
      dialogue: [
        'Mind the reflections. Half the fish you see in Glasswind Sound are not there.',
        'Mirrorscale Eels are shy at noon but reckless after dusk.',
        'Bring me crystal and I will cut a lure that can tempt a phantom.',
      ],
    },
  },
  serpent_reef: {
    id: 'bld_serpent_outpost', name: 'Serpent Reef Market', service: 'market', icon: '🐍', color: 0x2f7a5f,
    offset: { x: 6, z: -4 },
    description: 'A stilted reef market trading the atoll’s serpentine catch.',
    npc: {
      id: 'reefkeeper_soren', name: 'Reefkeeper Soren', title: 'Serpent Reef Warden',
      offset: { x: -3, z: 4 }, facingAngle: Math.PI * 1.1,
      coatColor: 0x25664f, hatStyle: 'straw', hairStyle: 'short', backpackStyle: 'fishing',
      dialogue: [
        'The lagoon looks calm, but the Coilscale Dragon owns the drop-off.',
        'Emerald Morays love the reef caves. Cast close to the coral and hold on.',
        'Every serpent on this atoll answers to the tide. Fish with it, not against it.',
      ],
    },
  },
};

function offsetPoint(island, offset) {
  return { x: island.arrival.x + offset.x, z: island.arrival.z + offset.z };
}

export const FrontierBuildingDefinitions = FrontierIslands.map((island) => {
  const outpost = OUTPOSTS[island.id];
  return {
    id: outpost.id,
    name: outpost.name,
    service: outpost.service,
    icon: outpost.icon,
    color: outpost.color,
    description: outpost.description,
    islandId: island.id,
    position: offsetPoint(island, outpost.offset),
  };
});

export const FrontierNpcDefinitions = FrontierIslands.map((island) => {
  const outpost = OUTPOSTS[island.id];
  return {
    ...outpost.npc,
    service: outpost.service,
    islandId: island.id,
    position: offsetPoint(island, outpost.npc.offset),
  };
});

export const FrontierFishingSpotDefinitions = FrontierIslands.flatMap((island) =>
  island.fishingSpots.map((spot) => ({
    ...spot,
    catalog: 'frontier',
  }))
);

export const FrontierFerryDefinitions = FrontierIslands.flatMap((island, index) => [
  {
    id: `ferry_frontier_${island.id}`,
    name: `${island.name} Expedition`,
    destination: island.id,
    position: { x: 14 + index * 3.5, z: -2 },
    prompt: `Sail to ${island.name}`,
    arrival: { ...island.arrival },
    frontier: true,
  },
  {
    id: `ferry_${island.id}_return`,
    name: `${island.name} Return Ferry`,
    destination: 'harbor',
    position: { ...island.dock },
    prompt: 'Return to Driftwood Harbor',
    arrival: { x: 12, z: -22 },
    frontier: true,
  },
]);

export const FrontierOutposts = OUTPOSTS;

export default {
  FrontierBuildingDefinitions,
  FrontierNpcDefinitions,
  FrontierFishingSpotDefinitions,
  FrontierFerryDefinitions,
};
