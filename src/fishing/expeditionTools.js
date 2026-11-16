// Expansion 8.0 — Expedition fishing tools.
//
// Kept separate from the 31-entry FishingToolDefinitions array so the
// Expansion 6.0 exact-count contract stays valid. FishingToolManager merges
// both catalogs, so every tool here is buyable, equippable and fully wired to
// the FishingSystem modifier pipeline.
//
// Two entries are gem-locked: they cannot be bought with coins at any price.

export const ExpeditionToolDefinitions = [
  {
    id: 'tool_barbed_tide_net',
    name: 'Barbed Tide Net',
    icon: '🕸️',
    rarity: 'Rare',
    cost: 4200,
    description: 'A barbed shore net that reliably lands a second fish on the same cast.',
    modifiers: { multiCatch: 0.3, lineStrength: 10 },
    habitat: 'coast',
  },
  {
    id: 'tool_storm_brace',
    name: 'Stormbrace Rod Collar',
    icon: '⚡',
    rarity: 'Epic',
    cost: 5600,
    description: 'A lightning-braced collar that keeps the rod loaded in tempest weather.',
    modifiers: { lineStrength: 26, quality: 0.12, luck: 0.04 },
    habitat: 'tempest',
  },
  {
    id: 'tool_aurora_lens',
    name: 'Aurora Prism Lens',
    icon: '🌌',
    rarity: 'Legendary',
    cost: 9200,
    description: 'Prismatic lenses read aurora-lit shoals and pull celestial fish closer.',
    modifiers: { luck: 0.2, finder: 0.3 },
    habitat: 'aurora',
  },
  {
    id: 'tool_glasswind_float',
    name: 'Glasswind Float',
    icon: '🪶',
    rarity: 'Rare',
    cost: 3800,
    description: 'A near-weightless float that drifts bait onto glasswind fish lanes.',
    modifiers: { waitReduction: 0.2, baitBonus: 0.15 },
    habitat: 'glasswind',
  },
  {
    id: 'tool_serpent_gaff',
    name: 'Serpentreef Gaff',
    icon: '🪝',
    rarity: 'Epic',
    cost: 6800,
    description: 'A hooked gaff built to lift heavy reef serpents without tearing the line.',
    modifiers: { quality: 0.18, lineStrength: 18 },
    habitat: 'serpent_reef',
  },
  {
    id: 'tool_frontier_trap',
    name: 'Frontier Expedition Trap',
    icon: '🪤',
    rarity: 'Legendary',
    cost: 8600,
    description: 'Deploy in frontier water. Collect after 2 minutes for three quality fish.',
    trap: { duration: 120, yield: 3, rarity: 0.1, quality: 0.15 },
  },
  {
    id: 'tool_tidecaller_flute',
    name: 'Tidecaller Flute',
    icon: '🎶',
    rarity: 'Epic',
    cost: 6100,
    description: 'A low carved note that calls fish into the swim and shortens the wait.',
    modifiers: { waitReduction: 0.35, finder: 0.12 },
  },
  {
    id: 'tool_abyss_sinker',
    name: 'Abyss Sinker Stack',
    icon: '⚓',
    rarity: 'Rare',
    cost: 3300,
    description: 'Dense abyssal sinkers hold bait steady in a racing deep current.',
    modifiers: { lineStrength: 22, quality: 0.06 },
  },
  {
    id: 'tool_celestial_sonar',
    name: 'Celestial Sonar Array',
    icon: '🛰️',
    rarity: 'Mythical',
    cost: 16000,
    description: 'A full sonar array that maps the shoal and marks the rarest signature in range.',
    modifiers: { finder: 0.45, luck: 0.2, multiCatch: 0.15 },
  },
  {
    id: 'tool_worldheart_rig',
    name: 'Worldheart Master Rig',
    icon: '🌍',
    rarity: 'Celestial',
    cost: 24000,
    description: 'The complete worldheart rig: titan braid, gem guides and a six-hook spread.',
    modifiers: { lineStrength: 38, multiCatch: 0.28, quality: 0.22, finder: 0.25 },
  },
  {
    id: 'tool_prism_net',
    name: 'Prism Gem Net',
    icon: '💎',
    rarity: 'Mythical',
    cost: 0,
    gemCost: 12,
    description: 'A gem-cut net that splits light through the water and doubles every landing chance. Gem-locked.',
    modifiers: { multiCatch: 0.5, baitBonus: 0.3, quality: 0.1 },
  },
  {
    id: 'tool_gem_finder',
    name: 'Gemfinder Array',
    icon: '🔮',
    rarity: 'Legendary',
    cost: 0,
    gemCost: 8,
    description: 'A gemstone resonator that reads the rarest signature in the water. Gem-locked.',
    modifiers: { finder: 0.5, luck: 0.25, waitReduction: 0.1 },
  },
];

export const ExpeditionToolIds = ExpeditionToolDefinitions.map((tool) => tool.id);
export const ExpeditionToolCount = ExpeditionToolDefinitions.length;

export default ExpeditionToolDefinitions;
