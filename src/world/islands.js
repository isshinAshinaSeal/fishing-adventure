// Outer island definitions shared by terrain, props, zones and travel.
// The isles are intentionally compact so a fishing trip never becomes a hike.
// Keeping these in one data module prevents visual terrain and gameplay
// habitats from drifting apart.

export const OuterIslands = [
  {
    id: 'verdant_crown',
    name: 'Verdant Crown',
    center: { x: 430, z: 240 },
    radius: 64,
    peakHeight: 17,
    habitat: 'kelp',
    biome: 'jungle',
    labelY: 25,
    description: 'A compact warm-water island of kelp coves and mangrove channels.',
    palette: { trunk: 0x6e5239, foliage: 0x2e7d32, accent: 0x8fd14f, dock: 0x75512f },
  },
  {
    id: 'frostfall_isle',
    name: 'Frostfall Isle',
    center: { x: -430, z: -250 },
    radius: 58,
    peakHeight: 15,
    habitat: 'polar',
    biome: 'frozen',
    labelY: 23,
    description: 'A small snow-capped isle with blue glacier shelves and silent coves.',
    palette: { trunk: 0x5c5147, foliage: 0x9bd7e8, accent: 0xe8f8ff, dock: 0x66737d },
  },
  {
    id: 'ember_isle',
    name: 'Ember Isle',
    center: { x: 430, z: -250 },
    radius: 55,
    peakHeight: 14,
    habitat: 'volcanic',
    biome: 'volcanic',
    labelY: 22,
    description: 'A tight basalt isle of glowing vents and ash-fed fishing grounds.',
    palette: { trunk: 0x332b29, foliage: 0x9e382b, accent: 0xff7b2e, dock: 0x3a302d },
  },
  {
    id: 'sunspire_cay',
    name: 'Sunspire Cay',
    center: { x: 330, z: 120 },
    radius: 34,
    peakHeight: 8,
    habitat: 'kelp',
    biome: 'jungle',
    labelY: 15,
    description: 'A sunny little sand cay with a palm grove and a shallow kelp shelf.',
    palette: { trunk: 0x7c5a36, foliage: 0x3f9444, accent: 0xffd166, dock: 0x8a6438 },
  },
  {
    id: 'mistveil_cay',
    name: 'Mistveil Cay',
    center: { x: -320, z: 140 },
    radius: 30,
    peakHeight: 7,
    habitat: 'mangrove',
    biome: 'jungle',
    labelY: 14,
    description: 'A fog-wrapped mangrove cay with roots, reeds and quiet channels.',
    palette: { trunk: 0x5f4a33, foliage: 0x5d8f54, accent: 0xa8d8c6, dock: 0x6a563c },
  },
  {
    id: 'glassice_cay',
    name: 'Glassice Cay',
    center: { x: -300, z: -10 },
    radius: 32,
    peakHeight: 7,
    habitat: 'polar',
    biome: 'frozen',
    labelY: 14,
    description: 'A tiny glassy isle of ice shelves and clear polar fishing holes.',
    palette: { trunk: 0x58606a, foliage: 0xb8e6f2, accent: 0xffffff, dock: 0x6b7a88 },
  },
  {
    id: 'cinder_cay',
    name: 'Cinder Cay',
    center: { x: 320, z: -20 },
    radius: 28,
    peakHeight: 7,
    habitat: 'volcanic',
    biome: 'volcanic',
    labelY: 14,
    description: 'A smouldering black cay ringed by warm vents and glassy obsidian.',
    palette: { trunk: 0x2b2523, foliage: 0xb74a30, accent: 0xff8c42, dock: 0x3a302d },
  },
];

export function getOuterIsland(id) {
  return OuterIslands.find((island) => island.id === id) || null;
}

export function sampleOuterIslandHeight(island, x, z) {
  if (!island) return null;
  const distance = Math.hypot(x - island.center.x, z - island.center.z);
  if (distance >= island.radius) return null;

  const norm = distance / island.radius;
  const rockVar = Math.sin(x * 0.055 + island.center.x) * Math.cos(z * 0.05 + island.center.z);
  if (norm <= 0.48) {
    const t = 1 - norm / 0.48;
    return island.peakHeight * (0.35 + t * 0.65) + rockVar * 0.9;
  }
  if (norm <= 0.84) {
    const t = (norm - 0.48) / 0.36;
    return island.peakHeight * 0.35 * (1 - t) + 2.0 * t + rockVar * 0.7;
  }
  const t = (norm - 0.84) / 0.16;
  return 2.0 * (1 - t) + (-1.8) * t + rockVar * 0.2;
}

export default OuterIslands;
