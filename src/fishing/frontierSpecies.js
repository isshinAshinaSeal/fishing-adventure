// Expansion 7.0 — Frontier fish catalog.
//
// These species live in their own module so the Expansion 3.0/4.0 catalogs
// keep their exact 140-entry contract. FishDatabase merges this list only for
// frontier fishing spots and the Fish Index.

const ROWS = [
  // --- Tempest Reach -------------------------------------------------------
  {
    id: 'stormglass_mackerel', name: 'Stormglass Mackerel', rarity: 'Common', category: 'Stormfront',
    weightRange: [0.6, 2.2], basePrice: 22, icon: '🐟', habitat: ['tempest'],
    preferredBait: 'shrimp', activeTime: ['dawn', 'day', 'dusk'], depth: 'surface',
    behavior: 'schooling', difficulty: 1,
    description: 'A quick silver mackerel whose scales hold a faint static charge.',
  },
  {
    id: 'thunderfin_barracuda', name: 'Thunderfin Barracuda', rarity: 'Uncommon', category: 'Stormfront',
    weightRange: [3, 8], basePrice: 70, icon: '🐟', habitat: ['tempest'],
    preferredBait: 'minnow', activeTime: ['dawn', 'day'], depth: 'mid',
    behavior: 'darter', difficulty: 2,
    description: 'It hunts the surge beneath thunderclouds, striking before the rain lands.',
  },
  {
    id: 'squallwing_ray', name: 'Squallwing Ray', rarity: 'Rare', category: 'Stormfront',
    weightRange: [12, 26], basePrice: 210, icon: '🐠', habitat: ['tempest'],
    preferredBait: 'golden', activeTime: ['day', 'dusk'], depth: 'mid',
    behavior: 'drift', difficulty: 3,
    description: 'Its broad wings ride the squall line like a living kite.',
  },
  {
    id: 'lightning_serpent', name: 'Lightning Serpent', rarity: 'Epic', category: 'Stormfront',
    weightRange: [55, 120], basePrice: 780, icon: '🐍', habitat: ['tempest'],
    preferredBait: 'crystal', activeTime: ['dusk', 'night'], depth: 'deep',
    behavior: 'erratic', difficulty: 4,
    description: 'A coiled predator that flashes white whenever it turns in the dark water.',
  },
  {
    id: 'tempest_leviathan', name: 'Tempest Leviathan', rarity: 'Legendary', category: 'Stormfront',
    weightRange: [260, 520], basePrice: 3400, icon: '🐋', habitat: ['tempest'],
    preferredBait: 'golden', activeTime: ['night'], depth: 'deep',
    behavior: 'powerful', difficulty: 5,
    description: 'Old sailors say every storm in Tempest Reach is the leviathan breathing.',
  },
  {
    id: 'eye_of_the_storm', name: 'Eye of the Storm', rarity: 'Celestial', category: 'Stormfront',
    weightRange: [40, 90], basePrice: 7600, icon: '🌩️', habitat: ['tempest'],
    preferredBait: 'crystal', activeTime: ['dawn'], depth: 'deep',
    behavior: 'powerful', difficulty: 5,
    description: 'A perfectly round stormfish that appears only in the calm centre of the gale.',
  },

  // --- Aurora Shelf --------------------------------------------------------
  {
    id: 'aurora_smelt', name: 'Aurora Smelt', rarity: 'Common', category: 'Aurora Deep',
    weightRange: [0.4, 1.4], basePrice: 20, icon: '🐟', habitat: ['aurora'],
    preferredBait: 'worm', activeTime: ['dawn', 'day', 'dusk'], depth: 'surface',
    behavior: 'schooling', difficulty: 1,
    description: 'Tiny smelt that glitter with the colours of the southern lights.',
  },
  {
    id: 'prism_herring', name: 'Prism Herring', rarity: 'Uncommon', category: 'Aurora Deep',
    weightRange: [1, 3], basePrice: 48, icon: '🐟', habitat: ['aurora'],
    preferredBait: 'shrimp', activeTime: ['dawn', 'dusk'], depth: 'surface',
    behavior: 'schooling', difficulty: 2,
    description: 'A herring whose scales split the aurora into shifting rainbow bands.',
  },
  {
    id: 'veilfin_koi', name: 'Veilfin Koi', rarity: 'Rare', category: 'Aurora Deep',
    weightRange: [6, 14], basePrice: 190, icon: '🐠', habitat: ['aurora'],
    preferredBait: 'minnow', activeTime: ['dusk', 'night'], depth: 'mid',
    behavior: 'steady', difficulty: 3,
    description: 'Long translucent fins trail behind it like curtains of green light.',
  },
  {
    id: 'borealis_sturgeon', name: 'Borealis Sturgeon', rarity: 'Epic', category: 'Aurora Deep',
    weightRange: [70, 150], basePrice: 900, icon: '🐟', habitat: ['aurora'],
    preferredBait: 'golden', activeTime: ['night'], depth: 'deep',
    behavior: 'powerful', difficulty: 4,
    description: 'An armoured glacial sturgeon that swims beneath the frozen aurora shelf.',
  },
  {
    id: 'polaris_whale', name: 'Polaris Whale', rarity: 'Legendary', category: 'Aurora Deep',
    weightRange: [300, 650], basePrice: 4200, icon: '🐋', habitat: ['aurora'],
    preferredBait: 'crystal', activeTime: ['night'], depth: 'deep',
    behavior: 'powerful', difficulty: 5,
    description: 'A pale whale with star-like markings that always points north.',
  },
  {
    id: 'aurora_seraph', name: 'Aurora Seraph', rarity: 'Mythical', category: 'Aurora Deep',
    weightRange: [60, 130], basePrice: 8800, icon: '✨', habitat: ['aurora'],
    preferredBait: 'crystal', activeTime: ['dawn', 'night'], depth: 'deep',
    behavior: 'erratic', difficulty: 5,
    description: 'A winged apparition of light that some anglers refuse to believe is a fish.',
  },

  // --- Glasswind Sound -----------------------------------------------------
  {
    id: 'glasswing_minnow', name: 'Glasswing Minnow', rarity: 'Common', category: 'Glasswind',
    weightRange: [0.3, 1.1], basePrice: 18, icon: '🐟', habitat: ['glasswind'],
    preferredBait: 'worm', activeTime: ['dawn', 'day', 'dusk'], depth: 'surface',
    behavior: 'schooling', difficulty: 1,
    description: 'So transparent that its shadow is usually spotted before the fish itself.',
  },
  {
    id: 'crystal_perch', name: 'Crystal Perch', rarity: 'Uncommon', category: 'Glasswind',
    weightRange: [1.2, 3.8], basePrice: 58, icon: '🐟', habitat: ['glasswind'],
    preferredBait: 'shrimp', activeTime: ['day'], depth: 'mid',
    behavior: 'steady', difficulty: 2,
    description: 'Its crystalline spines chime softly when the tide changes.',
  },
  {
    id: 'mirrorscale_eel', name: 'Mirrorscale Eel', rarity: 'Rare', category: 'Glasswind',
    weightRange: [8, 18], basePrice: 230, icon: '🐍', habitat: ['glasswind'],
    preferredBait: 'minnow', activeTime: ['dusk', 'night'], depth: 'mid',
    behavior: 'darter', difficulty: 3,
    description: 'A mirror-flat eel that hides in plain sight along the glass cliffs.',
  },
  {
    id: 'shardback_tuna', name: 'Shardback Tuna', rarity: 'Epic', category: 'Glasswind',
    weightRange: [90, 180], basePrice: 1100, icon: '🐟', habitat: ['glasswind'],
    preferredBait: 'golden', activeTime: ['dawn', 'day'], depth: 'deep',
    behavior: 'powerful', difficulty: 4,
    description: 'Its dorsal ridge is a row of razor-clear crystal plates.',
  },
  {
    id: 'prismatic_sturgeon', name: 'Prismatic Sturgeon', rarity: 'Legendary', category: 'Glasswind',
    weightRange: [240, 480], basePrice: 3900, icon: '🐟', habitat: ['glasswind'],
    preferredBait: 'crystal', activeTime: ['night'], depth: 'deep',
    behavior: 'powerful', difficulty: 5,
    description: 'A living prism that scatters the moon into a dozen colours across the sound.',
  },
  {
    id: 'glasswind_phantom', name: 'Glasswind Phantom', rarity: 'Secret', category: 'Glasswind',
    weightRange: [30, 70], basePrice: 9200, icon: '👻', habitat: ['glasswind'],
    preferredBait: 'crystal', activeTime: ['night'], depth: 'deep',
    behavior: 'erratic', difficulty: 5,
    description: 'Only its outline appears in the water, and only when nobody is looking directly at it.',
  },

  // --- Serpent Reef --------------------------------------------------------
  {
    id: 'reef_serpent_fry', name: 'Reef Serpent Fry', rarity: 'Common', category: 'Serpent Reef',
    weightRange: [0.5, 1.5], basePrice: 16, icon: '🐟', habitat: ['serpent_reef'],
    preferredBait: 'worm', activeTime: ['dawn', 'day', 'dusk'], depth: 'surface',
    behavior: 'schooling', difficulty: 1,
    description: 'A finger-length fry already striped like the reef’s great serpents.',
  },
  {
    id: 'coral_viperfish', name: 'Coral Viperfish', rarity: 'Uncommon', category: 'Serpent Reef',
    weightRange: [2, 5], basePrice: 62, icon: '🐠', habitat: ['serpent_reef'],
    preferredBait: 'shrimp', activeTime: ['dusk', 'night'], depth: 'mid',
    behavior: 'darter', difficulty: 2,
    description: 'It nests inside branching coral and darts out at anything that glitters.',
  },
  {
    id: 'emerald_moray', name: 'Emerald Moray', rarity: 'Rare', category: 'Serpent Reef',
    weightRange: [10, 24], basePrice: 240, icon: '🐍', habitat: ['serpent_reef'],
    preferredBait: 'minnow', activeTime: ['night'], depth: 'mid',
    behavior: 'erratic', difficulty: 3,
    description: 'A jade-green moray that guards the coiled lagoons of the atoll.',
  },
  {
    id: 'serpent_king_grouper', name: 'Serpent King Grouper', rarity: 'Epic', category: 'Serpent Reef',
    weightRange: [80, 160], basePrice: 1050, icon: '🐟', habitat: ['serpent_reef'],
    preferredBait: 'golden', activeTime: ['dawn', 'dusk'], depth: 'deep',
    behavior: 'powerful', difficulty: 4,
    description: 'The lagoon’s armoured monarch, with a jaw wide enough to swallow a bucket.',
  },
  {
    id: 'coilscale_dragon', name: 'Coilscale Dragon', rarity: 'Mythical', category: 'Serpent Reef',
    weightRange: [180, 360], basePrice: 7200, icon: '🐉', habitat: ['serpent_reef'],
    preferredBait: 'crystal', activeTime: ['night'], depth: 'deep',
    behavior: 'powerful', difficulty: 5,
    description: 'A serpentine reef dragon whose scales form an unbroken spiral pattern.',
  },
  {
    id: 'abyssal_serpent', name: 'Abyssal Serpent', rarity: 'Abyssal', category: 'Serpent Reef',
    weightRange: [220, 440], basePrice: 9800, icon: '🐍', habitat: ['serpent_reef'],
    preferredBait: 'crystal', activeTime: ['night'], depth: 'abyss',
    behavior: 'erratic', difficulty: 5,
    description: 'It rises from the drop-off only on the darkest tides, trailing cold blue light.',
  },
];

function makeFrontierSpecies(row) {
  return {
    ...row,
    frontier: true,
    weightRange: [...row.weightRange],
    habitat: [...row.habitat],
    activeTime: [...row.activeTime],
  };
}

export const FrontierSpecies = ROWS.map(makeFrontierSpecies);

export const FrontierCategories = [...new Set(FrontierSpecies.map((fish) => fish.category))];

export const FrontierHabitats = [...new Set(FrontierSpecies.map((fish) => fish.habitat[0]))];

export function getFrontierSpeciesByHabitat(habitat) {
  return FrontierSpecies.filter((fish) => fish.habitat.includes(habitat));
}

export default FrontierSpecies;
