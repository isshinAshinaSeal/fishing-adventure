// Gathering content: axe/pickaxe tiers, harvestable tree and rock templates,
// drop tables and the fixed world placements for every resource node.

export const GatheringToolDefinitions = [
  {
    id: 'axe_rusty', name: 'Rusty Hatchet', type: 'axe', icon: '🪓', tier: 1, power: 1,
    cost: 0, description: 'A chipped harbor hatchet. Fells soft trees; bounces off hard wood.',
  },
  {
    id: 'axe_iron', name: 'Iron Wood Axe', type: 'axe', icon: '🪓', tier: 2, power: 2,
    cost: 650, description: 'A heavier iron head that opens ironwood and drops more timber.',
  },
  {
    id: 'axe_steel', name: 'Steel Felling Axe', type: 'axe', icon: '🪓', tier: 3, power: 3,
    cost: 1800, description: 'Tempered steel for crystal trees and city park timber.',
  },
  {
    id: 'axe_crystal', name: 'Crystal Edge Axe', type: 'axe', icon: '💎', tier: 4, power: 4,
    cost: 4200, description: 'A crystal-edged axe that cuts skywood without splintering it.',
  },
  {
    id: 'axe_mythril', name: 'Mythril Grove Axe', type: 'axe', icon: '🌳', tier: 5, power: 5,
    cost: 8800, description: 'The grove-keeper’s axe. Every felled tree yields a bonus drop.',
  },
  {
    id: 'pickaxe_rusty', name: 'Rusty Pickaxe', type: 'pickaxe', icon: '⛏️', tier: 1, power: 1,
    cost: 0, description: 'A borrowed pickaxe. Good enough for loose stone and soft copper.',
  },
  {
    id: 'pickaxe_iron', name: 'Iron Miner’s Pick', type: 'pickaxe', icon: '⛏️', tier: 2, power: 2,
    cost: 650, description: 'A balanced iron pick that cracks copper and iron seams.',
  },
  {
    id: 'pickaxe_steel', name: 'Steel Quarry Pick', type: 'pickaxe', icon: '⛏️', tier: 3, power: 3,
    cost: 1800, description: 'Quarry-grade steel for gold veins and stubborn stone.',
  },
  {
    id: 'pickaxe_obsidian', name: 'Obsidian Breaker', type: 'pickaxe', icon: '🌑', tier: 4, power: 4,
    cost: 4200, description: 'A volcanic pick that splits obsidian seams cleanly.',
  },
  {
    id: 'pickaxe_mythril', name: 'Mythril Seam Pick', type: 'pickaxe', icon: '✨', tier: 5, power: 5,
    cost: 8800, description: 'The only pick that can read a mythril seam. Also finds sky crystal.',
  },
];

export const ResourceTemplates = {
  driftwood_tree: {
    id: 'driftwood_tree', name: 'Driftwood Tree', kind: 'tree', icon: '🌳',
    requiredTier: 1, hp: 3, respawn: 45, xp: 8, color: 0x6f9b4e, trunkColor: 0x6e5239,
    drops: [
      { itemId: 'mat_wood', min: 2, max: 3, chance: 1 },
      { itemId: 'mat_resin', min: 0, max: 1, chance: 0.5 },
    ],
  },
  oak_tree: {
    id: 'oak_tree', name: 'Harbor Oak', kind: 'tree', icon: '🌳',
    requiredTier: 1, hp: 4, respawn: 60, xp: 12, color: 0x3f8f4a, trunkColor: 0x5c4326,
    drops: [
      { itemId: 'mat_wood', min: 3, max: 5, chance: 1 },
      { itemId: 'mat_resin', min: 1, max: 2, chance: 0.7 },
      { itemId: 'mat_fiber', min: 1, max: 2, chance: 0.8 },
    ],
  },
  ironwood_tree: {
    id: 'ironwood_tree', name: 'Ironwood Tree', kind: 'tree', icon: '🌲',
    requiredTier: 2, hp: 6, respawn: 80, xp: 22, color: 0x2f6b3a, trunkColor: 0x4a3a2a,
    drops: [
      { itemId: 'mat_ironwood', min: 2, max: 3, chance: 1 },
      { itemId: 'mat_resin', min: 1, max: 2, chance: 0.8 },
      { itemId: 'mat_fiber', min: 1, max: 2, chance: 0.6 },
    ],
  },
  crystal_tree: {
    id: 'crystal_tree', name: 'Crystal Planter Tree', kind: 'tree', icon: '🌴',
    requiredTier: 3, hp: 8, respawn: 100, xp: 36, color: 0x7dd3fc, trunkColor: 0x44515f,
    drops: [
      { itemId: 'mat_crystal_shard', min: 2, max: 3, chance: 1 },
      { itemId: 'mat_wood', min: 1, max: 2, chance: 1 },
      { itemId: 'mat_quartz', min: 0, max: 1, chance: 0.4 },
    ],
  },
  skywood_tree: {
    id: 'skywood_tree', name: 'Skywood Tree', kind: 'tree', icon: '🌲',
    requiredTier: 4, hp: 10, respawn: 120, xp: 58, color: 0x22d3ee, trunkColor: 0x3a4b5c,
    drops: [
      { itemId: 'mat_skywood', min: 2, max: 4, chance: 1 },
      { itemId: 'mat_resin', min: 2, max: 3, chance: 1 },
      { itemId: 'mat_sky_crystal', min: 0, max: 1, chance: 0.25 },
    ],
  },
  stone_outcrop: {
    id: 'stone_outcrop', name: 'Stone Outcrop', kind: 'rock', icon: '🪨',
    requiredTier: 1, hp: 3, respawn: 50, xp: 8, color: 0x8e99a8,
    drops: [
      { itemId: 'mat_stone', min: 2, max: 4, chance: 1 },
      { itemId: 'mat_flint', min: 0, max: 1, chance: 0.5 },
    ],
  },
  copper_vein: {
    id: 'copper_vein', name: 'Copper Vein', kind: 'rock', icon: '🪙',
    requiredTier: 1, hp: 4, respawn: 65, xp: 14, color: 0xb87333,
    drops: [
      { itemId: 'mat_copper', min: 2, max: 3, chance: 1 },
      { itemId: 'mat_stone', min: 1, max: 2, chance: 0.8 },
    ],
  },
  iron_vein: {
    id: 'iron_vein', name: 'Iron Vein', kind: 'rock', icon: '⚙️',
    requiredTier: 2, hp: 6, respawn: 85, xp: 24, color: 0x6f7a86,
    drops: [
      { itemId: 'mat_iron', min: 2, max: 3, chance: 1 },
      { itemId: 'mat_stone', min: 2, max: 3, chance: 1 },
      { itemId: 'mat_flint', min: 0, max: 1, chance: 0.4 },
    ],
  },
  gold_vein: {
    id: 'gold_vein', name: 'Gold Vein', kind: 'rock', icon: '🏅',
    requiredTier: 3, hp: 7, respawn: 105, xp: 38, color: 0xd4af37,
    drops: [
      { itemId: 'mat_gold', min: 1, max: 2, chance: 1 },
      { itemId: 'mat_quartz', min: 1, max: 2, chance: 0.7 },
      { itemId: 'mat_stone', min: 1, max: 2, chance: 0.6 },
    ],
  },
  obsidian_seam: {
    id: 'obsidian_seam', name: 'Obsidian Seam', kind: 'rock', icon: '🌑',
    requiredTier: 4, hp: 9, respawn: 125, xp: 52, color: 0x1f2430,
    drops: [
      { itemId: 'mat_obsidian', min: 2, max: 3, chance: 1 },
      { itemId: 'mat_crystal_shard', min: 1, max: 2, chance: 0.7 },
      { itemId: 'mat_stone', min: 1, max: 2, chance: 0.5 },
    ],
  },
  mythril_vein: {
    id: 'mythril_vein', name: 'Mythril Seam', kind: 'rock', icon: '✨',
    requiredTier: 5, hp: 12, respawn: 150, xp: 85, color: 0x8fbcff,
    drops: [
      { itemId: 'mat_mythril', min: 1, max: 2, chance: 1 },
      { itemId: 'mat_sky_crystal', min: 1, max: 2, chance: 1 },
      { itemId: 'mat_gold', min: 1, max: 2, chance: 0.6 },
    ],
  },
};

const C = { x: -430, z: 430 };

export const ResourceNodeDefinitions = [
  // Harbor woodlands
  { id: 'node_tree_harbor_1', templateId: 'driftwood_tree', zone: 'harbor', x: -80, z: 60 },
  { id: 'node_tree_harbor_2', templateId: 'oak_tree', zone: 'harbor', x: -95, z: 30 },
  { id: 'node_tree_harbor_3', templateId: 'ironwood_tree', zone: 'harbor', x: -110, z: -20 },
  { id: 'node_tree_harbor_4', templateId: 'driftwood_tree', zone: 'harbor', x: 70, z: 70 },
  { id: 'node_tree_harbor_5', templateId: 'oak_tree', zone: 'harbor', x: 120, z: 40 },
  { id: 'node_tree_harbor_6', templateId: 'ironwood_tree', zone: 'harbor', x: 95, z: 100 },
  { id: 'node_tree_harbor_7', templateId: 'oak_tree', zone: 'harbor', x: -40, z: 95 },
  { id: 'node_tree_harbor_8', templateId: 'driftwood_tree', zone: 'harbor', x: 55, z: -95 },
  // Harbor quarry
  { id: 'node_rock_harbor_1', templateId: 'stone_outcrop', zone: 'harbor', x: -70, z: -70 },
  { id: 'node_rock_harbor_2', templateId: 'copper_vein', zone: 'harbor', x: 150, z: -40 },
  { id: 'node_rock_harbor_3', templateId: 'iron_vein', zone: 'harbor', x: -180, z: 40 },
  { id: 'node_rock_harbor_4', templateId: 'gold_vein', zone: 'harbor', x: 90, z: -130 },
  { id: 'node_rock_harbor_5', templateId: 'stone_outcrop', zone: 'harbor', x: -120, z: 120 },
  { id: 'node_rock_harbor_6', templateId: 'copper_vein', zone: 'harbor', x: 60, z: 120 },
  // Aurelia city park planters
  { id: 'node_tree_city_1', templateId: 'crystal_tree', zone: 'city', x: C.x - 10, z: C.z + 44 },
  { id: 'node_tree_city_2', templateId: 'skywood_tree', zone: 'city', x: C.x + 10, z: C.z + 44 },
  { id: 'node_tree_city_3', templateId: 'crystal_tree', zone: 'city', x: C.x - 38, z: C.z + 8 },
  { id: 'node_tree_city_4', templateId: 'skywood_tree', zone: 'city', x: C.x + 38, z: C.z - 8 },
  // Aurelia quarry terraces
  { id: 'node_rock_city_1', templateId: 'obsidian_seam', zone: 'city', x: C.x + 43, z: C.z + 34 },
  { id: 'node_rock_city_2', templateId: 'obsidian_seam', zone: 'city', x: C.x + 48, z: C.z + 31 },
  { id: 'node_rock_city_3', templateId: 'mythril_vein', zone: 'city', x: C.x + 41, z: C.z + 38 },
];

export function getResourceTemplate(templateId) {
  return ResourceTemplates[templateId] || null;
}

export function getGatheringToolDefinition(toolId) {
  return GatheringToolDefinitions.find((tool) => tool.id === toolId) || null;
}

export default ResourceNodeDefinitions;
