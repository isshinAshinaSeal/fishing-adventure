// FishDatabase: Authoritative catalog of catchable species, rarity tiers, habitats,
// bait/time preferences, and condition-aware catch generation.

import { FrontierSpecies } from './frontierSpecies.js';

// Legacy core species (kept as a stable back-compat export used by older systems).
export const FishSpecies = [
  {
    id: 'sardine',
    name: 'Driftwood Sardine',
    rarity: 'Common',
    category: 'Tropical Fish',
    weightRange: [0.15, 0.45],
    basePrice: 6,
    icon: '🐟',
    habitat: ['pier', 'shallow', 'coast'],
    preferredBait: 'worm',
    activeTime: ['dawn', 'day', 'dusk'],
    depth: 'surface',
    behavior: 'schooling',
    difficulty: 1,
    description: 'A tiny, shimmering fish commonly schooling near sunny wooden pilings.',
  },
  {
    id: 'mackerel',
    name: 'Atlantic Mackerel',
    rarity: 'Common',
    category: 'Tropical Fish',
    weightRange: [0.4, 1.3],
    basePrice: 14,
    icon: '🐟',
    habitat: ['pier', 'coast', 'ocean'],
    preferredBait: 'shrimp',
    activeTime: ['dawn', 'day', 'dusk'],
    depth: 'surface',
    behavior: 'darter',
    difficulty: 1,
    description: 'Fast swimmer with green tiger stripes along its back. Plentiful and lively.',
  },
  {
    id: 'seabass',
    name: 'Black Sea Bass',
    rarity: 'Uncommon',
    category: 'Tropical Fish',
    weightRange: [1.2, 3.8],
    basePrice: 32,
    icon: '🐠',
    habitat: ['pier', 'coast', 'reef'],
    preferredBait: 'shrimp',
    activeTime: ['dusk', 'night', 'dawn'],
    depth: 'mid',
    behavior: 'steady',
    difficulty: 2,
    description: 'A hardy coastal fish that puts up a fierce, tugging fight when hooked.',
  },
  {
    id: 'red_snapper',
    name: 'Ruby Snapper',
    rarity: 'Uncommon',
    category: 'Tropical Fish',
    weightRange: [1.8, 5.2],
    basePrice: 48,
    icon: '🐠',
    habitat: ['coast', 'ocean', 'reef', 'pirate'],
    preferredBait: 'minnow',
    activeTime: ['day', 'dusk', 'night'],
    depth: 'mid',
    behavior: 'steady',
    difficulty: 2,
    description: 'Prized by tavern chefs for its brilliant crimson scales and succulent flavor.',
  },
  {
    id: 'bluefin',
    name: 'Bluefin Bass',
    rarity: 'Rare',
    category: 'Tropical Fish',
    weightRange: [4.0, 11.5],
    basePrice: 85,
    icon: '🐡',
    habitat: ['coast', 'ocean', 'pirate'],
    preferredBait: 'minnow',
    activeTime: ['dawn', 'day'],
    depth: 'deep',
    behavior: 'powerful',
    difficulty: 3,
    description: 'A powerhouse predator of the open tides with electric blue fin tips.',
  },
  {
    id: 'golden_trout',
    name: 'Golden Sun Trout',
    rarity: 'Legendary',
    category: 'Mythical Fish',
    weightRange: [5.5, 16.0],
    basePrice: 240,
    icon: '✨',
    habitat: ['pier', 'coast', 'secret', 'pirate'],
    preferredBait: 'golden',
    activeTime: ['dawn', 'day'],
    depth: 'mid',
    behavior: 'powerful',
    difficulty: 4,
    description: 'A mythical fish glowing like spun gold under the sunlight. Said to bring fortune.',
  },
];

// id, name, rarity, category, habitats, weight range, price, icon, bait, active time, depth, behavior
const CATALOG_ROWS = [
  // Tropical Ocean
  ['clownfish', 'Clownfish', 'Common', 'Tropical Fish', ['reef', 'azure'], [0.1, 0.6], 9, '🐠', 'shrimp', ['day', 'dusk'], 'surface', 'darter'],
  ['blue_tang', 'Blue Tang', 'Common', 'Tropical Fish', ['reef', 'azure'], [0.2, 0.9], 12, '🐠', 'worm', ['day'], 'surface', 'schooling'],
  ['parrotfish', 'Coral Parrotfish', 'Uncommon', 'Tropical Fish', ['reef', 'azure'], [0.6, 2.2], 26, '🐠', 'shrimp', ['day', 'dusk'], 'mid', 'steady'],
  ['angelfish', 'Emperor Angelfish', 'Uncommon', 'Tropical Fish', ['reef'], [0.4, 1.6], 30, '🐠', 'crystal', ['dawn', 'day'], 'mid', 'darter'],
  ['pufferfish', 'Spotted Pufferfish', 'Uncommon', 'Tropical Fish', ['reef', 'azure'], [0.5, 2.0], 34, '🐡', 'shrimp', ['day', 'dusk'], 'mid', 'erratic'],
  ['lionfish', 'Banded Lionfish', 'Rare', 'Tropical Fish', ['reef'], [1.0, 3.5], 62, '🐡', 'glow', ['dusk', 'night'], 'mid', 'erratic'],
  ['mahi_mahi', 'Mahi-Mahi', 'Rare', 'Tropical Fish', ['azure', 'ocean'], [3.0, 9.0], 92, '🐟', 'minnow', ['dawn', 'day'], 'surface', 'darter'],
  ['moray_eel', 'Ribbon Moray Eel', 'Rare', 'Tropical Fish', ['reef', 'ruins'], [2.0, 7.0], 78, '🐍', 'ancient', ['night'], 'deep', 'erratic'],
  ['swordfish', 'Swordfish', 'Epic', 'Tropical Fish', ['azure', 'ocean'], [12.0, 40.0], 280, '🗡️', 'minnow', ['dawn', 'day'], 'deep', 'powerful'],
  ['marlin', 'Azure Marlin', 'Epic', 'Tropical Fish', ['azure', 'ocean'], [15.0, 48.0], 320, '🐟', 'golden', ['dawn'], 'deep', 'powerful'],

  // Deep Sea
  ['lanternfish', 'Lanternfish', 'Common', 'Deep Sea', ['abyss', 'ocean'], [0.2, 1.0], 18, '🐟', 'glow', ['night'], 'deep', 'schooling'],
  ['viperfish', 'Viperfish', 'Uncommon', 'Deep Sea', ['abyss'], [1.0, 3.0], 44, '🐟', 'glow', ['night'], 'deep', 'darter'],
  ['anglerfish', 'Anglerfish', 'Rare', 'Deep Sea', ['abyss', 'ocean'], [3.0, 9.0], 110, '🐡', 'deep_sea', ['night'], 'abyss', 'erratic'],
  ['gulper_eel', 'Gulper Eel', 'Rare', 'Deep Sea', ['abyss'], [4.0, 12.0], 120, '🐍', 'deep_sea', ['night'], 'abyss', 'steady'],
  ['glow_jellyfish', 'Glow Jellyfish', 'Epic', 'Deep Sea', ['abyss', 'reef'], [1.0, 4.0], 160, '🪼', 'glow', ['night'], 'mid', 'drift'],
  ['vampire_squid', 'Vampire Squid', 'Epic', 'Deep Sea', ['abyss'], [5.0, 15.0], 210, '🦑', 'deep_sea', ['night'], 'abyss', 'erratic'],
  ['giant_squid', 'Giant Squid', 'Legendary', 'Deep Sea', ['abyss', 'ocean'], [40.0, 120.0], 620, '🦑', 'mythical', ['night'], 'abyss', 'powerful'],
  ['abyssal_dragonfish', 'Abyssal Dragonfish', 'Mythical', 'Deep Sea', ['abyss'], [8.0, 24.0], 780, '🐉', 'mythical', ['night'], 'abyss', 'erratic'],
  ['eternal_angler', 'Eternal Angler', 'Abyssal', 'Mythical Fish', ['abyss'], [60.0, 180.0], 1800, '🏮', 'mythical', ['night'], 'abyss', 'powerful'],

  // Freshwater
  ['golden_carp', 'Golden Carp', 'Common', 'Freshwater Fish', ['secret', 'jungle'], [0.8, 3.0], 16, '🐟', 'worm', ['dawn', 'day'], 'mid', 'steady'],
  ['silver_koi', 'Silver Koi', 'Uncommon', 'Freshwater Fish', ['secret', 'jungle'], [0.6, 2.4], 38, '🐟', 'crystal', ['dawn', 'dusk'], 'mid', 'drift'],
  ['river_catfish', 'River Catfish', 'Uncommon', 'Freshwater Fish', ['secret', 'jungle'], [2.0, 8.0], 42, '🐟', 'worm', ['night'], 'bottom', 'steady'],
  ['rainbow_trout', 'Rainbow Trout', 'Uncommon', 'Freshwater Fish', ['secret', 'jungle'], [1.0, 4.0], 46, '🐠', 'minnow', ['dawn'], 'mid', 'darter'],
  ['giant_pike', 'Giant Pike', 'Rare', 'Freshwater Fish', ['secret', 'jungle'], [5.0, 16.0], 96, '🐟', 'minnow', ['dawn', 'dusk'], 'mid', 'powerful'],
  ['electric_eel', 'Electric Eel', 'Rare', 'Freshwater Fish', ['jungle'], [3.0, 11.0], 108, '⚡', 'glow', ['night'], 'bottom', 'erratic'],
  ['crystal_bass', 'Crystal Bass', 'Epic', 'Freshwater Fish', ['jungle', 'secret'], [4.0, 13.0], 190, '💎', 'crystal', ['dawn', 'night'], 'deep', 'darter'],
  ['moonlight_salmon', 'Moonlight Salmon', 'Epic', 'Freshwater Fish', ['secret'], [6.0, 18.0], 220, '🌙', 'crystal', ['night'], 'mid', 'powerful'],
  ['emerald_arowana', 'Emerald Arowana', 'Legendary', 'Freshwater Fish', ['jungle'], [7.0, 22.0], 460, '🐉', 'ancient', ['dusk', 'night'], 'mid', 'powerful'],
  ['ancient_sturgeon', 'Ancient Sturgeon', 'Ancient', 'Freshwater Fish', ['jungle', 'secret'], [30.0, 90.0], 900, '🦕', 'ancient', ['night'], 'bottom', 'powerful'],

  // Frozen Region
  ['ice_salmon', 'Ice Salmon', 'Common', 'Frozen Fish', ['frozen'], [1.0, 4.0], 22, '🐟', 'worm', ['day'], 'mid', 'steady'],
  ['frost_trout', 'Frost Trout', 'Uncommon', 'Frozen Fish', ['frozen'], [1.5, 5.0], 48, '🐟', 'crystal', ['dawn', 'day'], 'mid', 'darter'],
  ['snowflake_koi', 'Snowflake Koi', 'Uncommon', 'Frozen Fish', ['frozen', 'secret'], [0.8, 3.0], 54, '❄️', 'crystal', ['day'], 'surface', 'drift'],
  ['glacier_pike', 'Glacier Pike', 'Rare', 'Frozen Fish', ['frozen'], [6.0, 18.0], 118, '🐟', 'minnow', ['dawn'], 'mid', 'powerful'],
  ['crystal_icefish', 'Crystal Icefish', 'Rare', 'Frozen Fish', ['frozen'], [1.0, 4.0], 124, '💠', 'glow', ['night'], 'deep', 'drift'],
  ['frozen_sturgeon', 'Frozen Sturgeon', 'Epic', 'Frozen Fish', ['frozen'], [25.0, 70.0], 380, '🐟', 'ancient', ['night'], 'bottom', 'powerful'],
  ['arctic_phantom', 'Arctic Phantom Fish', 'Mythical', 'Frozen Fish', ['frozen'], [10.0, 30.0], 820, '👻', 'mythical', ['night'], 'deep', 'erratic'],
  ['frost_serpent', 'Frost Serpent', 'Ancient', 'Boss Creatures', ['frozen'], [80.0, 220.0], 2200, '🐍', 'mythical', ['night'], 'abyss', 'powerful'],

  // Volcanic Region
  ['emberfin', 'Emberfin', 'Common', 'Volcanic Fish', ['volcanic'], [0.5, 2.0], 24, '🔥', 'worm', ['day', 'dusk'], 'surface', 'darter'],
  ['ashen_koi', 'Ashen Koi', 'Uncommon', 'Volcanic Fish', ['volcanic'], [1.0, 3.5], 56, '🐟', 'crystal', ['dawn', 'dusk'], 'mid', 'drift'],
  ['magma_eel', 'Magma Eel', 'Rare', 'Volcanic Fish', ['volcanic'], [4.0, 12.0], 132, '🌋', 'glow', ['night'], 'deep', 'erratic'],
  ['scorching_bass', 'Scorching Bass', 'Rare', 'Volcanic Fish', ['volcanic', 'pirate'], [5.0, 15.0], 140, '🐟', 'minnow', ['day'], 'mid', 'steady'],
  ['lava_catfish', 'Lava Catfish', 'Epic', 'Volcanic Fish', ['volcanic'], [8.0, 24.0], 300, '🐟', 'deep_sea', ['night'], 'bottom', 'steady'],
  ['volcanic_dragonfish', 'Volcanic Dragonfish', 'Legendary', 'Volcanic Fish', ['volcanic'], [15.0, 45.0], 680, '🐉', 'mythical', ['night'], 'abyss', 'powerful'],
  ['magma_kraken', 'Magma Kraken', 'Ancient', 'Boss Creatures', ['volcanic'], [150.0, 400.0], 3200, '🦑', 'mythical', ['night'], 'abyss', 'powerful'],

  // Ancient Ruins & Secret
  ['ruin_guppy', 'Ruin Guppy', 'Common', 'Secret Fish', ['ruins'], [0.1, 0.5], 20, '🐟', 'worm', ['day', 'night'], 'surface', 'schooling'],
  ['relic_perch', 'Relic Perch', 'Uncommon', 'Secret Fish', ['ruins'], [1.0, 4.0], 58, '🐟', 'ancient', ['dusk', 'night'], 'mid', 'steady'],
  ['sunken_idol_fish', 'Sunken Idol Fish', 'Rare', 'Secret Fish', ['ruins'], [2.0, 6.0], 150, '🗿', 'ancient', ['night'], 'deep', 'drift'],
  ['ghost_koi', 'Ghost Koi', 'Epic', 'Secret Fish', ['ruins', 'secret'], [1.0, 5.0], 260, '👻', 'glow', ['night'], 'mid', 'drift'],
  ['shadow_pike', 'Shadow Pike', 'Epic', 'Secret Fish', ['ruins'], [6.0, 20.0], 290, '🐟', 'ancient', ['night'], 'deep', 'powerful'],
  ['veiled_seerfish', 'Veiled Seerfish', 'Secret', 'Secret Fish', ['ruins', 'celestial'], [3.0, 9.0], 640, '🔮', 'ancient', ['night'], 'deep', 'drift'],
  ['mirage_ray', 'Mirage Ray', 'Secret', 'Secret Fish', ['azure', 'celestial'], [8.0, 26.0], 700, '🛸', 'mythical', ['dusk', 'night'], 'mid', 'drift'],
  ['ancient_leviathan', 'Ancient Leviathan', 'Ancient', 'Boss Creatures', ['ruins', 'abyss'], [300.0, 900.0], 5000, '🐋', 'mythical', ['night'], 'abyss', 'powerful'],
  ['coral_guardian', 'Coral Guardian', 'Ancient', 'Boss Creatures', ['reef'], [100.0, 300.0], 2600, '🪸', 'mythical', ['dawn'], 'deep', 'powerful'],

  // Celestial / Mythical
  ['star_herring', 'Star Herring', 'Uncommon', 'Mythical Fish', ['celestial'], [0.5, 2.0], 66, '⭐', 'glow', ['night'], 'surface', 'schooling'],
  ['comet_fish', 'Comet Fish', 'Rare', 'Mythical Fish', ['celestial'], [2.0, 7.0], 175, '☄️', 'crystal', ['night'], 'mid', 'darter'],
  ['celestial_koi', 'Celestial Koi', 'Legendary', 'Mythical Fish', ['celestial', 'secret'], [4.0, 14.0], 720, '🌟', 'mythical', ['night'], 'mid', 'drift'],
  ['ocean_phoenix', 'Ocean Phoenix', 'Mythical', 'Mythical Fish', ['celestial', 'azure'], [20.0, 60.0], 1500, '🔥', 'mythical', ['dawn'], 'surface', 'powerful'],
  ['moonlight_serpent', 'Moonlight Serpent', 'Mythical', 'Mythical Fish', ['celestial', 'abyss'], [35.0, 100.0], 1700, '🌙', 'mythical', ['night'], 'abyss', 'powerful'],
  ['ancient_sea_dragon', 'Ancient Sea Dragon', 'Ancient', 'Mythical Fish', ['celestial', 'ruins'], [120.0, 380.0], 3600, '🐉', 'mythical', ['night'], 'abyss', 'powerful'],
  ['crystal_leviathan', 'Crystal Leviathan', 'Celestial', 'Mythical Fish', ['celestial'], [200.0, 600.0], 4500, '💎', 'mythical', ['dawn', 'dusk'], 'abyss', 'powerful'],
  ['golden_leviathan', 'Golden Leviathan', 'Celestial', 'Mythical Fish', ['celestial', 'ocean'], [250.0, 700.0], 5200, '👑', 'golden', ['day'], 'abyss', 'powerful'],
  ['ocean_emperor', 'Ocean Emperor', 'Celestial', 'Boss Creatures', ['celestial'], [300.0, 800.0], 6000, '🔱', 'mythical', ['dusk'], 'abyss', 'powerful'],
  ['abyssal_emperor', 'Abyssal Emperor', 'Abyssal', 'Mythical Fish', ['abyss'], [180.0, 500.0], 3800, '🖤', 'mythical', ['night'], 'abyss', 'powerful'],

  // Event / seasonal
  ['festival_koi', 'Festival Koi', 'Rare', 'Event Fish', ['azure', 'secret'], [1.0, 5.0], 160, '🎏', 'golden', ['day'], 'surface', 'drift'],
  ['ember_spirit', 'Ember Spirit Fish', 'Epic', 'Event Fish', ['volcanic'], [2.0, 8.0], 340, '✨', 'golden', ['night'], 'mid', 'darter'],
  ['spectral_mariner', 'Spectral Mariner', 'Legendary', 'Event Fish', ['ruins', 'abyss'], [8.0, 26.0], 800, '👻', 'mythical', ['night'], 'deep', 'erratic'],
  ['sunrise_snapper', 'Sunrise Snapper', 'Rare', 'Event Fish', ['azure'], [2.0, 7.0], 150, '🌅', 'golden', ['dawn'], 'mid', 'steady'],

  // Expansion 3.0: Verdant Crown kelp forests
  ['tidepool_blenny', 'Tidepool Blenny', 'Common', 'Kelp Forest', ['kelp', 'shallow'], [0.1, 0.5], 14, '🐟', 'worm', ['day'], 'surface', 'darter'],
  ['emerald_kelpfish', 'Emerald Kelpfish', 'Common', 'Kelp Forest', ['kelp', 'jungle'], [0.3, 1.2], 20, '🐟', 'worm', ['day'], 'surface', 'schooling'],
  ['kelp_seahorse', 'Kelp Seahorse', 'Uncommon', 'Kelp Forest', ['kelp', 'reef'], [0.2, 0.9], 40, '🐠', 'shrimp', ['day', 'dusk'], 'surface', 'drift'],
  ['sunlit_garibaldi', 'Sunlit Garibaldi', 'Uncommon', 'Kelp Forest', ['kelp', 'reef'], [0.8, 3.0], 60, '🐠', 'shrimp', ['day'], 'mid', 'darter'],
  ['giant_kelp_crab', 'Giant Kelp Crab', 'Rare', 'Kelp Forest', ['kelp'], [3.0, 9.0], 150, '🦀', 'deep_sea', ['night'], 'bottom', 'steady'],
  ['abalone_ray', 'Abalone Ray', 'Epic', 'Kelp Forest', ['kelp', 'reef'], [5.0, 16.0], 330, '🐟', 'crystal', ['night'], 'bottom', 'drift'],
  ['kelp_dragon', 'Kelp Dragon', 'Legendary', 'Kelp Forest', ['kelp'], [8.0, 24.0], 760, '🐉', 'ancient', ['dusk', 'night'], 'mid', 'powerful'],
  ['forest_leviathan', 'Forest Leviathan', 'Ancient', 'Kelp Forest', ['kelp', 'jungle'], [70.0, 220.0], 2300, '🐋', 'mythical', ['night'], 'deep', 'powerful'],

  // Expansion 3.0: Verdant Crown mangrove channels
  ['mangrove_goby', 'Mangrove Goby', 'Common', 'Mangrove Fish', ['mangrove', 'jungle'], [0.1, 0.6], 18, '🐟', 'worm', ['day'], 'surface', 'schooling'],
  ['mudskipper', 'Mudskipper', 'Uncommon', 'Mangrove Fish', ['mangrove'], [0.2, 1.0], 36, '🐟', 'worm', ['dawn', 'day'], 'surface', 'erratic'],
  ['root_crab', 'Root Crab', 'Uncommon', 'Mangrove Fish', ['mangrove'], [1.0, 4.0], 48, '🦀', 'deep_sea', ['night'], 'bottom', 'steady'],
  ['mangrove_snapper', 'Mangrove Snapper', 'Uncommon', 'Mangrove Fish', ['mangrove', 'jungle'], [1.5, 5.0], 56, '🐠', 'shrimp', ['dusk', 'night'], 'mid', 'steady'],
  ['brackish_barracuda', 'Brackish Barracuda', 'Rare', 'Mangrove Fish', ['mangrove', 'coast'], [5.0, 15.0], 140, '🐟', 'minnow', ['dawn', 'day'], 'mid', 'darter'],
  ['mangrove_gharial', 'Mangrove Gharial', 'Epic', 'Mangrove Fish', ['mangrove', 'jungle'], [18.0, 55.0], 420, '🐊', 'ancient', ['night'], 'deep', 'powerful'],
  ['ancient_mangrove_eel', 'Ancient Mangrove Eel', 'Legendary', 'Mangrove Fish', ['mangrove'], [12.0, 36.0], 690, '🐍', 'glow', ['night'], 'bottom', 'erratic'],

  // Expansion 3.0: Frostfall polar waters
  ['polar_cod', 'Polar Cod', 'Common', 'Polar Fish', ['polar', 'frozen'], [1.0, 4.0], 26, '🐟', 'worm', ['day'], 'mid', 'steady'],
  ['frost_haddock', 'Frost Haddock', 'Common', 'Polar Fish', ['polar'], [0.5, 2.0], 22, '🐟', 'worm', ['day'], 'mid', 'schooling'],
  ['snowfin_tuna', 'Snowfin Tuna', 'Uncommon', 'Polar Fish', ['polar'], [4.0, 12.0], 72, '🐟', 'minnow', ['dawn'], 'mid', 'darter'],
  ['aurora_char', 'Aurora Char', 'Uncommon', 'Polar Fish', ['polar'], [1.0, 5.0], 66, '🐠', 'crystal', ['dusk', 'night'], 'mid', 'darter'],
  ['glacier_halibut', 'Glacier Halibut', 'Rare', 'Polar Fish', ['polar', 'frozen'], [12.0, 40.0], 180, '🐟', 'minnow', ['night'], 'bottom', 'steady'],
  ['ice_squid', 'Ice Squid', 'Rare', 'Polar Fish', ['polar', 'abyss'], [3.0, 10.0], 165, '🦑', 'glow', ['night'], 'deep', 'drift'],
  ['frostjaw_cod', 'Frostjaw Cod', 'Epic', 'Polar Fish', ['polar'], [15.0, 48.0], 360, '🐟', 'deep_sea', ['night'], 'deep', 'powerful'],
  ['aurora_whale_shark', 'Aurora Whale Shark', 'Ancient', 'Polar Fish', ['polar', 'celestial'], [100.0, 300.0], 2800, '🦈', 'mythical', ['night'], 'deep', 'powerful'],
  ['eternal_icefish', 'Eternal Icefish', 'Celestial', 'Polar Fish', ['polar'], [5.0, 18.0], 1900, '💠', 'mythical', ['night'], 'abyss', 'drift'],
  ['frozen_angler', 'Frozen Angler', 'Mythical', 'Polar Fish', ['polar'], [8.0, 25.0], 980, '🏮', 'glow', ['night'], 'abyss', 'erratic'],

  // Expansion 3.0: Ember Isle volcanic coast
  ['cinder_sardine', 'Cinder Sardine', 'Common', 'Volcanic Fish', ['volcanic', 'ember'], [0.1, 0.5], 16, '🐟', 'worm', ['day'], 'surface', 'schooling'],
  ['ember_koi', 'Ember Koi', 'Uncommon', 'Volcanic Fish', ['volcanic', 'secret'], [0.5, 2.0], 58, '🐠', 'crystal', ['dusk'], 'mid', 'drift'],
  ['obsidian_grouper', 'Obsidian Grouper', 'Uncommon', 'Volcanic Fish', ['volcanic'], [2.0, 7.0], 64, '🐟', 'shrimp', ['dusk'], 'mid', 'steady'],
  ['lava_ray', 'Lava Ray', 'Rare', 'Volcanic Fish', ['volcanic'], [6.0, 20.0], 190, '🐟', 'glow', ['night'], 'deep', 'drift'],
  ['volcano_lobster', 'Volcano Lobster', 'Rare', 'Volcanic Fish', ['volcanic'], [2.0, 8.0], 175, '🦞', 'deep_sea', ['night'], 'bottom', 'steady'],
  ['ashfall_pike', 'Ashfall Pike', 'Rare', 'Volcanic Fish', ['volcanic'], [4.0, 14.0], 155, '🐟', 'minnow', ['day'], 'mid', 'darter'],
  ['cinder_eel', 'Cinder Eel', 'Epic', 'Volcanic Fish', ['volcanic'], [7.0, 22.0], 285, '⚡', 'glow', ['night'], 'deep', 'erratic'],
  ['ash_marlin', 'Ash Marlin', 'Epic', 'Volcanic Fish', ['volcanic', 'ocean'], [20.0, 60.0], 430, '🐟', 'minnow', ['dawn'], 'surface', 'powerful'],
  ['phoenix_fin', 'Phoenix Fin', 'Mythical', 'Volcanic Fish', ['volcanic', 'celestial'], [10.0, 30.0], 1300, '🔥', 'golden', ['dawn'], 'surface', 'powerful'],
  ['magma_serpent', 'Magma Serpent', 'Ancient', 'Volcanic Fish', ['volcanic'], [90.0, 260.0], 2500, '🐍', 'mythical', ['night'], 'abyss', 'powerful'],

  // Expansion 3.0: deeper trench records
  ['twilight_hatchetfish', 'Twilight Hatchetfish', 'Uncommon', 'Deep Sea', ['abyss', 'ocean'], [0.2, 1.0], 52, '🐟', 'glow', ['night'], 'deep', 'schooling'],
  ['glass_octopus', 'Glass Octopus', 'Rare', 'Deep Sea', ['abyss'], [2.0, 8.0], 195, '🐙', 'crystal', ['night'], 'abyss', 'drift'],
  ['midnight_whale_shark', 'Midnight Whale Shark', 'Ancient', 'Deep Sea', ['abyss', 'ocean'], [120.0, 320.0], 2900, '🦈', 'mythical', ['night'], 'deep', 'powerful'],
  ['trench_angler', 'Trench Angler', 'Abyssal', 'Deep Sea', ['abyss'], [25.0, 80.0], 3100, '🏮', 'mythical', ['night'], 'abyss', 'powerful'],

  // Expansion 3.0: outer-isle festival fish
  ['tidefest_carp', 'Tidefest Carp', 'Rare', 'Event Fish', ['kelp', 'secret'], [2.0, 7.0], 180, '🎏', 'golden', ['day'], 'surface', 'drift'],
  ['aurora_salmon', 'Aurora Salmon', 'Epic', 'Event Fish', ['polar'], [4.0, 15.0], 390, '🌌', 'golden', ['night'], 'mid', 'darter'],
  ['emberfest_perch', 'Emberfest Perch', 'Rare', 'Event Fish', ['volcanic', 'ember'], [1.0, 4.0], 170, '🎇', 'golden', ['night'], 'mid', 'steady'],
  ['moonfest_koi', 'Moonfest Koi', 'Legendary', 'Event Fish', ['mangrove', 'celestial'], [3.0, 10.0], 760, '🌙', 'golden', ['night'], 'surface', 'drift'],

  // Expansion 4.0: Pirate Waters (Smuggler's Atoll and corsair coves)
  ['bilge_rat_goby', 'Bilge Rat Goby', 'Common', 'Pirate Waters', ['pirate', 'coast'], [0.2, 0.9], 18, '🐟', 'worm', ['day', 'dusk'], 'surface', 'schooling'],
  ['pegleg_perch', 'Pegleg Perch', 'Common', 'Pirate Waters', ['pirate', 'coast'], [0.8, 2.5], 24, '🐟', 'shrimp', ['dawn', 'day'], 'mid', 'steady'],
  ['smuggler_sardine', 'Smuggler Sardine', 'Common', 'Pirate Waters', ['pirate', 'ocean'], [0.1, 0.6], 16, '🐟', 'worm', ['dawn', 'day', 'dusk'], 'surface', 'schooling'],
  ['blackpowder_bream', 'Blackpowder Bream', 'Uncommon', 'Pirate Waters', ['pirate', 'volcanic'], [1.5, 4.5], 52, '🐠', 'minnow', ['dusk', 'night'], 'mid', 'darter'],
  ['cannonball_crab', 'Cannonball Crab', 'Uncommon', 'Pirate Waters', ['pirate'], [2.0, 6.0], 58, '🦀', 'deep_sea', ['night'], 'bottom', 'steady'],
  ['cutlass_fish', 'Cutlass Fish', 'Rare', 'Pirate Waters', ['pirate', 'ocean'], [4.0, 12.0], 118, '🗡️', 'minnow', ['dawn', 'dusk'], 'mid', 'darter'],
  ['corsair_marlin', 'Corsair Marlin', 'Rare', 'Pirate Waters', ['pirate', 'ocean'], [12.0, 35.0], 210, '🐟', 'minnow', ['dawn'], 'surface', 'powerful'],
  ['ghost_galleon_grouper', 'Ghost Galleon Grouper', 'Epic', 'Pirate Waters', ['pirate', 'abyss'], [15.0, 45.0], 380, '👻', 'glow', ['night'], 'deep', 'steady'],
  ['kraken_ink_eel', 'Kraken Ink Eel', 'Epic', 'Pirate Waters', ['pirate', 'abyss'], [10.0, 30.0], 420, '🐙', 'deep_sea', ['night'], 'abyss', 'erratic'],
  ['redbeard_ray', 'Redbeard Ray', 'Legendary', 'Pirate Waters', ['pirate'], [30.0, 90.0], 920, '🏴‍☠️', 'ancient', ['dusk', 'night'], 'deep', 'powerful'],
  ['pirate_king_leviathan', 'Pirate King Leviathan', 'Mythical', 'Pirate Waters', ['pirate', 'abyss'], [90.0, 260.0], 2400, '🐋', 'mythical', ['night'], 'abyss', 'powerful'],
  ['ghost_fleet_serpent', 'Ghost Fleet Serpent', 'Ancient', 'Pirate Waters', ['pirate', 'abyss'], [120.0, 350.0], 3400, '🐍', 'mythical', ['night'], 'abyss', 'powerful'],

  // Expansion 4.0: Coral Reef sanctuaries
  ['neon_goby', 'Neon Goby', 'Common', 'Coral Reef', ['reef', 'azure'], [0.1, 0.4], 14, '🐠', 'worm', ['day'], 'surface', 'schooling'],
  ['harlequin_wrasse', 'Harlequin Wrasse', 'Common', 'Coral Reef', ['reef'], [0.3, 1.2], 20, '🐠', 'shrimp', ['dawn', 'day'], 'surface', 'darter'],
  ['fire_coral_shrimp', 'Fire Coral Shrimp', 'Uncommon', 'Coral Reef', ['reef'], [0.1, 0.5], 40, '🦐', 'shrimp', ['dusk', 'night'], 'bottom', 'drift'],
  ['mandarin_dragonet', 'Mandarin Dragonet', 'Uncommon', 'Coral Reef', ['reef', 'azure'], [0.2, 0.8], 48, '🐠', 'crystal', ['dawn', 'dusk'], 'mid', 'drift'],
  ['reef_hammerhead', 'Reef Hammerhead', 'Rare', 'Coral Reef', ['reef', 'ocean'], [15.0, 40.0], 190, '🦈', 'minnow', ['dawn', 'day'], 'deep', 'powerful'],
  ['crown_of_thorns', 'Crown-of-Thorns Starfish', 'Rare', 'Coral Reef', ['reef'], [0.5, 2.0], 160, '⭐', 'deep_sea', ['night'], 'bottom', 'steady'],
  ['giant_clam_guardian', 'Giant Clam Guardian', 'Epic', 'Coral Reef', ['reef'], [8.0, 22.0], 360, '🦪', 'crystal', ['day'], 'bottom', 'steady'],
  ['rainbow_parrotfish', 'Rainbow Parrotfish', 'Epic', 'Coral Reef', ['reef', 'azure'], [4.0, 12.0], 300, '🐠', 'crystal', ['day', 'dusk'], 'mid', 'darter'],
  ['pearl_serpent', 'Pearl Serpent', 'Legendary', 'Coral Reef', ['reef', 'abyss'], [18.0, 45.0], 780, '🐍', 'glow', ['night'], 'deep', 'powerful'],
  ['coral_empress', 'Coral Empress', 'Mythical', 'Coral Reef', ['reef', 'celestial'], [25.0, 70.0], 1600, '🪸', 'mythical', ['dawn', 'dusk'], 'mid', 'drift'],
  ['reef_worldheart', 'Reef Worldheart', 'Ancient', 'Coral Reef', ['reef'], [80.0, 220.0], 2800, '🪸', 'ancient', ['night'], 'deep', 'steady'],
  ['living_reef_dragon', 'Living Reef Dragon', 'Celestial', 'Coral Reef', ['reef', 'celestial'], [100.0, 280.0], 4200, '🐉', 'mythical', ['dawn', 'dusk'], 'abyss', 'powerful'],
];

export const RarityTiers = {
  Common: { weight: 100, valueMul: 1.0, order: 1 },
  Uncommon: { weight: 45, valueMul: 1.15, order: 2 },
  Rare: { weight: 16, valueMul: 1.4, order: 3 },
  Epic: { weight: 6, valueMul: 1.9, order: 4 },
  Legendary: { weight: 2.2, valueMul: 2.6, order: 5 },
  Mythical: { weight: 0.7, valueMul: 3.4, order: 6 },
  Secret: { weight: 0.35, valueMul: 4.0, order: 7 },
  Ancient: { weight: 0.15, valueMul: 5.0, order: 8 },
  Celestial: { weight: 0.08, valueMul: 6.5, order: 9 },
  Abyssal: { weight: 0.12, valueMul: 7.5, order: 10 },
};

export const BaitTypes = [
  { id: 'worm', name: 'Worm Bait', icon: '🪱', cost: 0, rarityBonus: {} },
  { id: 'shrimp', name: 'Shrimp Bait', icon: '🦐', cost: 0, rarityBonus: { Uncommon: 1.1 } },
  { id: 'minnow', name: 'Minnow Lure', icon: '🐟', cost: 0, rarityBonus: { Rare: 1.15 } },
  { id: 'golden', name: 'Golden Bait', icon: '🟡', cost: 0, rarityBonus: { Rare: 1.3, Epic: 1.25, Legendary: 1.2 } },
  { id: 'crystal', name: 'Crystal Bait', icon: '💎', cost: 0, rarityBonus: { Rare: 1.25, Epic: 1.3 } },
  { id: 'glow', name: 'Glow Bait', icon: '✨', cost: 0, rarityBonus: { Uncommon: 1.2, Rare: 1.2, Mythical: 1.15 } },
  { id: 'deep_sea', name: 'Deep Sea Bait', icon: '🌊', cost: 0, rarityBonus: { Rare: 1.3, Epic: 1.2, Abyssal: 1.2 } },
  { id: 'ancient', name: 'Ancient Bait', icon: '🏺', cost: 0, rarityBonus: { Epic: 1.25, Ancient: 1.35 } },
  { id: 'mythical', name: 'Mythical Bait', icon: '🔮', cost: 0, rarityBonus: { Legendary: 1.3, Mythical: 1.35, Celestial: 1.3 } },
  // Expansion 8.0 frontier baits. Each one is tuned to a single outer habitat
  // and stacks with the rod's habitat bonus.
  { id: 'storm_lure', name: 'Storm Lure', icon: '⚡', cost: 0, rarityBonus: { Rare: 1.2, Epic: 1.25, Legendary: 1.15 }, habitatBonus: 'tempest' },
  { id: 'aurora_spark', name: 'Aurora Spark', icon: '🌌', cost: 0, rarityBonus: { Epic: 1.2, Legendary: 1.25, Celestial: 1.3, Ancient: 1.2 }, habitatBonus: 'aurora' },
  { id: 'glasswind_moth', name: 'Glasswind Moth', icon: '🦋', cost: 0, rarityBonus: { Rare: 1.25, Epic: 1.2, Mythical: 1.15 }, habitatBonus: 'glasswind' },
  { id: 'serpent_scale', name: 'Serpent Scale', icon: '🐍', cost: 0, rarityBonus: { Rare: 1.2, Epic: 1.3, Legendary: 1.2, Abyssal: 1.25 }, habitatBonus: 'serpent_reef' },
];

const DEFAULT_ACTIVE_TIME = ['dawn', 'day', 'dusk', 'night'];

function makeSpecies(row) {
  const [
    id, name, rarity, category, habitat, weightRange, basePrice,
    icon, preferredBait, activeTime, depth, behavior,
  ] = row;
  return {
    id,
    name,
    rarity,
    category,
    habitat,
    weightRange,
    basePrice,
    icon,
    preferredBait,
    activeTime,
    depth,
    behavior,
    difficulty: RarityTiers[rarity] ? RarityTiers[rarity].order : 1,
    description: `${name} — a ${rarity.toLowerCase()} ${category.toLowerCase()} species found in ${habitat.join(', ')} waters.`,
  };
}

export const ExpandedSpecies = [
  ...FishSpecies,
  ...CATALOG_ROWS.map(makeSpecies),
];

// The full discovery catalog combines the 140 classic species with the
// Expansion 7.0 frontier fish. ExpandedSpecies itself stays untouched for the
// exact-count contracts used by earlier expansions.
export const FullSpeciesCatalog = [...ExpandedSpecies, ...FrontierSpecies];

const SPECIES_BY_ID = new Map();
for (const species of FullSpeciesCatalog) {
  if (!SPECIES_BY_ID.has(species.id)) SPECIES_BY_ID.set(species.id, species);
}

const BASE_CATEGORIES = [...new Set(ExpandedSpecies.map((fish) => fish.category))];
const FRONTIER_CATEGORIES = [...new Set(FrontierSpecies.map((fish) => fish.category))];
const FRONTIER_HABITATS = new Set(FrontierSpecies.flatMap((fish) => fish.habitat));

// Per-catalog habitat pools are computed once. Rolls are frequent (every
// strike, bonus catch and trap collection), so filtering the whole catalog on
// each call is unnecessary work.
const HABITAT_POOL_CACHE = new WeakMap();

function habitatPool(catalog, habitat) {
  let pools = HABITAT_POOL_CACHE.get(catalog);
  if (!pools) {
    pools = new Map();
    HABITAT_POOL_CACHE.set(catalog, pools);
  }

  const key = habitat || HABITAT_FALLBACK[0];
  if (pools.has(key)) return pools.get(key);

  let pool = catalog.filter((fish) => fish.habitat.includes(key));
  if (pool.length === 0) {
    pool = catalog.filter((fish) => fish.habitat.includes(HABITAT_FALLBACK[0]));
  }
  if (pool.length === 0) pool = catalog;
  pools.set(key, pool);
  return pool;
}

const HABITAT_FALLBACK = ['coast'];

export class FishDatabase {
  /**
   * Legacy catalog accessor. Older systems/tests rely on the six core species.
   */
  static getAllSpecies() {
    return FishSpecies;
  }

  /**
   * Full Ocean Odyssey catalog (60+ species across every category).
   */
  static getExpandedSpecies() {
    return ExpandedSpecies;
  }

  /**
   * Frontier-only catalog introduced in Expansion 7.0.
   */
  static getFrontierSpecies() {
    return FrontierSpecies;
  }

  /**
   * Combined discovery catalog used by the Fish Index, records and travel
   * hints. Does not alter the classic ExpandedSpecies array.
   */
  static getFullCatalog() {
    return FullSpeciesCatalog;
  }

  static getSpeciesById(id) {
    return SPECIES_BY_ID.get(id) || null;
  }

  static getCategories() {
    return [...BASE_CATEGORIES];
  }

  static getFrontierCategories() {
    return [...FRONTIER_CATEGORIES];
  }

  static isFrontierHabitat(habitat) {
    return FRONTIER_HABITATS.has(habitat);
  }

  static getLookupStats() {
    return {
      speciesById: SPECIES_BY_ID.size,
      frontierSpecies: FrontierSpecies.length,
      fullCatalog: FullSpeciesCatalog.length,
    };
  }

  static getBaitTypes() {
    return BaitTypes;
  }

  /**
   * Rolls a catch using habitat, time of day, bait preference and rarity weights.
   */
  static roll(habitat = 'coast', options = {}) {
    const {
      timeOfDay = null,
      bait = 'worm',
      luck = 0,
      difficultyMul = 1,
      allowExtended = true,
      catalog: overrideCatalog = null,
      rarityBonus = 0,
      largeFish = 0,
      speciesBonus = null,
      preferHabitat = null,
      giant = 0,
    } = options;

    const catalog = Array.isArray(overrideCatalog) && overrideCatalog.length > 0
      ? overrideCatalog
      : (allowExtended ? ExpandedSpecies : FishSpecies);
    const pool = habitatPool(catalog, habitat);

    const baitDef = BaitTypes.find((b) => b.id === bait) || BaitTypes[0];
    const luckMultiplier = 1 + Math.max(0, Math.min(1.5, luck));
    const rarityLift = 1 + Math.max(0, Math.min(1.5, rarityBonus));
    const sizeLift = Math.max(0, Math.min(1, giant || 0));

    let totalWeight = 0;
    const weighted = pool.map((fish) => {
      let w = (RarityTiers[fish.rarity] || RarityTiers.Common).weight;
      // Rare tier bonuses only apply to tiers at or above Rare.
      if ((RarityTiers[fish.rarity]?.order || 1) >= 3) {
        w *= (baitDef.rarityBonus[fish.rarity] || 1) * luckMultiplier * difficultyMul * rarityLift;
        if (speciesBonus && speciesBonus[fish.rarity]) w *= 1 + speciesBonus[fish.rarity];
      }
      if (fish.preferredBait === bait) w *= 1.9;
      if (baitDef.habitatBonus && fish.habitat.includes(baitDef.habitatBonus)) w *= 1.45;
      if (preferHabitat && fish.habitat.includes(preferHabitat)) w *= 1.3;
      // Giant rods favour species whose weight range can reach monster size.
      if (sizeLift > 0 && fish.weightRange[1] >= 40) w *= 1 + sizeLift * 2.5;
      if (timeOfDay && fish.activeTime && !fish.activeTime.includes(timeOfDay)) {
        w *= 0.4;
      }
      totalWeight += w;
      return { fish, weight: w };
    });

    let rnd = Math.random() * totalWeight;
    let selected = weighted[0].fish;
    for (const entry of weighted) {
      if (rnd < entry.weight) {
        selected = entry.fish;
        break;
      }
      rnd -= entry.weight;
    }

    return this._buildCatchRecord(selected, null, largeFish);
  }

  /**
   * Legacy weighted catch generator (kept for backwards compatibility).
   */
  static generateCatch(habitat = 'coast', options = {}) {
    return this.roll(habitat, { allowExtended: true, ...options });
  }

  /**
   * Creates a deterministic catch record for testing or scripted rewards.
   */
  static createCatchRecord(speciesId, weightFraction = 0.5) {
    const species = this.getSpeciesById(speciesId) || FishSpecies[0];
    return this._buildCatchRecord(species, Math.max(0, Math.min(1, weightFraction)));
  }

  static _buildCatchRecord(species, weightFraction, sizeBias = 0) {
    const minW = species.weightRange[0];
    const maxW = species.weightRange[1];
    let fraction = weightFraction === null
      ? Math.random()
      : Math.max(0, Math.min(1, weightFraction));
    // Large-fish rod bonuses shift the roll toward the top of the weight range.
    if (weightFraction === null && sizeBias > 0) {
      const bias = Math.max(0, Math.min(1, sizeBias));
      fraction = Math.min(1, fraction + (1 - fraction) * bias * 0.6);
    }
    const weight = Number((minW + fraction * (maxW - minW)).toFixed(2));
    const weightFactor = 0.85 + fraction * 0.35;
    const rarityMul = (RarityTiers[species.rarity] || RarityTiers.Common).valueMul;
    const finalValue = Math.max(1, Math.round(species.basePrice * weightFactor * (0.9 + rarityMul * 0.1)));

    return {
      instanceId: `catch_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
      speciesId: species.id,
      name: species.name,
      rarity: species.rarity,
      category: species.category,
      habitat: species.habitat,
      weight,
      value: finalValue,
      icon: species.icon,
      preferredBait: species.preferredBait,
      description: species.description,
      frontier: Boolean(species.frontier),
      caughtAt: Date.now(),
    };
  }
}

export default FishDatabase;
