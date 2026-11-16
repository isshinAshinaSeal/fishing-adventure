// Aurelia Heights city content: service buildings, residents, strolling
// civilians and the city marina fleet. Kept separate from the harbor catalogs
// so existing exact-count tests stay valid.

import { CityIsland } from '../world/cityIsland.js';

const C = CityIsland.center;

function cityPoint(x, z) {
  return { x: C.x + x, z: C.z + z };
}

export const CityBuildingDefinitions = [
  {
    id: 'bld_city_hall', name: 'Aurelia City Hall', service: 'guild', icon: '🏛️', color: 0x4d6a8a,
    position: cityPoint(0, 32), npc: 'mayor_aurelia',
    description: 'City permits, citizen requests and the Aurelia civic honor board.',
  },
  {
    id: 'bld_sky_marina', name: 'Sky Marina', service: 'city_boats', icon: '🛥️', color: 0x1e6f8f,
    position: cityPoint(0, -32), npc: 'broker_cecelia',
    description: 'Aurelia’s own boat dealership: fast commuters, glasshull explorers and a flagship.',
  },
  {
    id: 'bld_rooftop_farm', name: 'Rooftop Farm', service: 'farming', icon: '🌱', color: 0x3f8f4a,
    position: cityPoint(-28, 22), npc: 'farmer_rosa',
    description: 'A working rooftop farm with plots, crops, watering and harvest upgrades.',
  },
  {
    id: 'bld_quarry_guild', name: 'Quarry Guild', service: 'gathering', icon: '⛏️', color: 0x6b6258,
    position: cityPoint(28, 22), npc: 'foreman_gideon',
    description: 'Axes, pickaxes, mining contracts and the island resource exchange.',
  },
  {
    id: 'bld_city_market', name: 'Boulevard Market', service: 'market', icon: '🛒', color: 0x9e6b3a,
    position: cityPoint(-28, -22), npc: 'trader_otto',
    description: 'A busy street market buying fish, produce and expedition surplus.',
  },
  {
    id: 'bld_city_rodworks', name: 'Spire Rodworks', service: 'rods', icon: '🎣', color: 0x8a5229,
    position: cityPoint(28, -22), npc: 'sky_angler_niko',
    description: 'Skyline-tuned rods and the full 76-rod collection.',
  },
  {
    id: 'bld_city_toolworks', name: 'Aurelia Toolworks', service: 'tools', icon: '🧰', color: 0x5f6f52,
    position: cityPoint(-37, 0), npc: 'engineer_vex',
    description: 'City-finished nets, sonar scopes, traps and specialised fishing tools.',
  },
  {
    id: 'bld_sky_cafe', name: 'Skyline Café', service: 'potions', icon: '☕', color: 0xb7791f,
    position: cityPoint(37, 0), npc: 'chef_maribel',
    description: 'Hot meals, rooftop-grown ingredients and buffs for long voyages.',
  },
  {
    id: 'bld_city_aquarium', name: 'Aurelia Aquarium', service: 'aquarium', icon: '🐠', color: 0x1f8a9e,
    position: cityPoint(-22, 37), npc: 'curator_lyra',
    description: 'A glass-domed aquarium displaying the rarest catches in the archipelago.',
  },
  {
    id: 'bld_city_bank', name: 'Tide Bank & Auction', service: 'auction', icon: '🏦', color: 0x6b4c9a,
    position: cityPoint(22, 37), npc: 'banker_quill',
    description: 'Vault storage, appraisals and a premium auction counter.',
  },
  {
    id: 'bld_city_workshop', name: 'Skyline Workshop', service: 'crafting', icon: '🛠️', color: 0x607d8b,
    position: cityPoint(-22, -37), npc: 'artisan_juno',
    description: 'City crafting benches for tools, tonics, timber and metalwork.',
  },
  {
    id: 'bld_city_observatory', name: 'Aurelia Observatory', service: 'radar', icon: '🔭', color: 0x4a6070,
    position: cityPoint(22, -37), npc: 'astronomer_vega',
    description: 'Tracks giants, storms and distant bosses from above the skyline.',
  },
];

export const CityNpcDefinitions = [
  {
    id: 'mayor_aurelia', name: 'Mayor Aurelia', title: 'Mayor of Aurelia Heights',
    position: cityPoint(-4, 18), facingAngle: Math.PI, coatColor: 0x2f4f6f,
    hatStyle: 'captain', backpackStyle: 'satchel', hairStyle: 'short', service: 'guild',
    dialogue: [
      'Welcome to Aurelia Heights, angler. The skyline is tall, but the harbor is still the heart of this city.',
      'Our rooftop farm and quarry guild keep the city fed and built. Try a plot — the soil is excellent.',
      'The Sky Marina sells vessels the harbor has never seen. Take the ferry back whenever you like.',
    ],
  },
  {
    id: 'broker_cecelia', name: 'Cecelia', title: 'Sky Marina Broker',
    position: cityPoint(3, -24), facingAngle: 0.2, coatColor: 0x1e6f8f,
    hatStyle: 'captain', hairStyle: 'long', backpackStyle: 'satchel', service: 'city_boats',
    dialogue: [
      'Fast commuters, glasshull explorers, a racing skiff and the Aurelia Flagship. Pick your hull.',
      'Every city vessel is fitted for open water. The flagship even carries radar, sonar and cannons.',
    ],
  },
  {
    id: 'farmer_rosa', name: 'Rosa', title: 'Rooftop Farmer',
    position: cityPoint(-25, 17), facingAngle: 0.6, coatColor: 0x3f8f4a,
    hatStyle: 'straw', backpackStyle: 'expedition', hairStyle: 'wavy', service: 'farming',
    dialogue: [
      'Plant a crop, water it, and come back when the leaves shine. The city grows its own lunch up here.',
      'Better watering cans shorten every crop cycle. Better hoes bring in bigger harvests.',
      'Golden sunflowers take patience, but they pay for a new boat hull.',
    ],
  },
  {
    id: 'foreman_gideon', name: 'Gideon', title: 'Quarry Foreman',
    position: cityPoint(25, 17), facingAngle: -0.5, coatColor: 0x6b6258,
    beardColor: 0x4b3a2a, facialHair: 'beard', backpackStyle: 'expedition', hairStyle: 'short', service: 'gathering',
    dialogue: [
      'Trees drop timber and resin. Rocks drop stone, copper, iron and stranger things deeper in.',
      'A rusty hatchet opens soft wood. Iron, steel, crystal and mythril axes open the rest.',
      'Buy a better pickaxe before you swing at an obsidian seam. Your knuckles will thank you.',
    ],
  },
  {
    id: 'trader_otto', name: 'Otto', title: 'Boulevard Trader',
    position: cityPoint(-25, -18), facingAngle: 2.2, coatColor: 0x9e6b3a,
    apron: true, glasses: true, backpackStyle: 'satchel', service: 'market',
    dialogue: [
      'Fish, produce, ore, surplus expedition gear — the boulevard buys it all at a fair price.',
      'Rosa’s turnips and Gideon’s copper are moving fast this week.',
    ],
  },
  {
    id: 'sky_angler_niko', name: 'Niko', title: 'Skyline Angler',
    position: cityPoint(25, -18), facingAngle: -2.2, coatColor: 0x8a5229,
    hatStyle: 'straw', backpackStyle: 'fishing', hairStyle: 'wavy', service: 'rods',
    dialogue: [
      'The city rods are tuned for long casts between towers. The Skyline Carbon is my favourite.',
      'Seventy-six rods in the collection now. Every family has four marks, and every mark has a skill tree.',
    ],
  },
  {
    id: 'engineer_vex', name: 'Vex', title: 'Toolworks Engineer',
    position: cityPoint(-33, -3), facingAngle: 1.4, coatColor: 0x5f6f52,
    glasses: true, backpackStyle: 'expedition', service: 'tools',
    dialogue: [
      'City tools are built for precision: skyline sonar, rooftop cast nets and a harbourmaster’s finder.',
      'A tool is not a rodskin. Equip one and it changes how the whole fishing session plays out.',
    ],
  },
  {
    id: 'chef_maribel', name: 'Maribel', title: 'Skyline Chef',
    position: cityPoint(33, 3), facingAngle: -1.4, coatColor: 0xb7791f,
    apron: true, hairStyle: 'long', backpackStyle: 'satchel', service: 'potions',
    dialogue: [
      'Everything on the menu starts on Rosa’s roof or in Gideon’s quarry smokehouse.',
      'Take a warm bowl before the ferry. The wind between islands is colder than it looks.',
    ],
  },
  {
    id: 'curator_lyra', name: 'Lyra', title: 'Aquarium Curator',
    position: cityPoint(-18, 33), facingAngle: Math.PI * 0.8, coatColor: 0x1f8a9e,
    hairStyle: 'long', backpackStyle: 'satchel', service: 'aquarium',
    dialogue: [
      'The glass dome holds fish from every habitat in the archipelago. Bring me a rare one.',
      'A living collection is better than a trophy wall. Stop by the aquarium any time.',
    ],
  },
  {
    id: 'banker_quill', name: 'Quill', title: 'Tide Bank Auctioneer',
    position: cityPoint(18, 33), facingAngle: Math.PI * 0.2, coatColor: 0x6b4c9a,
    glasses: true, backpackStyle: 'satchel', service: 'auction',
    dialogue: [
      'Vault space, appraisals and a premium auction. The city does not haggle in the street.',
      'Bring in the strange things you pull from the deep. Somebody will pay for them.',
    ],
  },
  {
    id: 'artisan_juno', name: 'Juno', title: 'Skyline Artisan',
    position: cityPoint(-18, -33), facingAngle: 0.8, coatColor: 0x607d8b,
    apron: true, glasses: true, backpackStyle: 'expedition', service: 'crafting',
    dialogue: [
      'Timber, fibre, ore and a hot bench. That is how a city turns a fish trip into a trade.',
      'The new multi-material recipes are posted inside. Bring the whole ingredient list.',
    ],
  },
  {
    id: 'astronomer_vega', name: 'Vega', title: 'City Astronomer',
    position: cityPoint(18, -33), facingAngle: -0.8, coatColor: 0x4a6070,
    hatStyle: 'merchant', hairStyle: 'short', backpackStyle: 'expedition', service: 'radar',
    dialogue: [
      'From this height I can see the giants move between islands like weather systems.',
      'The observatory radar tracks bosses, wrecks and storms. Use it before you sail blindly.',
    ],
  },
];

const CIVILIAN_NAMES = [
  ['city_ava', 'Ava', 'Boulevard Courier'],
  ['city_ben', 'Ben', 'Rooftop Gardener'],
  ['city_cara', 'Cara', 'Tram Conductor'],
  ['city_dan', 'Dan', 'Quarry Hauler'],
  ['city_elle', 'Elle', 'Glassblower'],
  ['city_finn', 'Finn Jr.', 'Junior Angler'],
  ['city_gaia', 'Gaia', 'Market Florist'],
  ['city_hugo', 'Hugo', 'Street Musician'],
  ['city_ines', 'Ines', 'City Surveyor'],
  ['city_jade', 'Jade', 'Cafe Server'],
  ['city_kai', 'Kai', 'Dock Runner'],
  ['city_lena', 'Lena', 'Observatory Clerk'],
  ['city_milo', 'Milo', 'Tool Apprentice'],
  ['city_nessa', 'Nessa', 'Fishmonger'],
  ['city_omar', 'Omar', 'Ferry Hand'],
  ['city_pia', 'Pia', 'Artist'],
  ['city_quin', 'Quin', 'Aquarium Guide'],
  ['city_rhea', 'Rhea', 'Night Watch'],
];

const CIVILIAN_COLORS = [0x2e7d32, 0x1e3a5f, 0x8a5229, 0x6b4c9a, 0x1f8a9e, 0x9e382b];

export const CityCivilianDefinitions = CIVILIAN_NAMES.map(([id, name, title], index) => {
  const angle = (index / CIVILIAN_NAMES.length) * Math.PI * 2;
  const radius = 18 + (index % 4) * 9;
  const sweep = 0.45 + (index % 3) * 0.18;
  const waypoints = [
    cityPoint(Math.cos(angle) * radius, Math.sin(angle) * radius),
    cityPoint(Math.cos(angle + sweep) * (radius + 5), Math.sin(angle + sweep) * (radius + 5)),
    cityPoint(Math.cos(angle + sweep * 1.6) * (radius - 4), Math.sin(angle + sweep * 1.6) * (radius - 4)),
    cityPoint(Math.cos(angle - sweep * 0.5) * (radius + 2), Math.sin(angle - sweep * 0.5) * (radius + 2)),
  ];
  return {
    id,
    name,
    title,
    coatColor: CIVILIAN_COLORS[index % CIVILIAN_COLORS.length],
    hairStyle: ['short', 'long', 'wavy'][index % 3],
    backpackStyle: index % 3 === 0 ? 'satchel' : 'expedition',
    walkSpeed: 1.3 + (index % 4) * 0.12,
    pauseDuration: 2.4 + (index % 3),
    waypoints,
    dialogue: [
      `Aurelia Heights is always building something. I am ${title.toLowerCase()} this week.`,
      'Take the ferry down to the harbor if you want quiet water. The city never really sleeps.',
      'Rooftop Farm and Quarry Guild are hiring hands. Honest work, decent coin.',
    ],
  };
});

export const CityBoatCatalog = [
  {
    id: 'boat_city_taxi', name: 'Aurelia Sky Taxi', tier: 2, cost: 420, vendor: 'city',
    maxSpeed: 9.5, reverseSpeed: 3.8, acceleration: 6.0, deceleration: 3.2, turnRate: 1.9,
    capacity: 2, hullColor: 0x2f9e9e, style: 'motor',
    description: 'A bright little commuter that threads the city canals and the harbor channel.',
  },
  {
    id: 'boat_city_commuter', name: 'Boulevard Commuter', tier: 3, cost: 980, vendor: 'city',
    maxSpeed: 12.5, reverseSpeed: 4.6, acceleration: 7.4, deceleration: 3.8, turnRate: 1.8,
    capacity: 3, hullColor: 0x24588a, style: 'motor',
    description: 'A quick, stable city runabout with a surprising amount of deck space.',
  },
  {
    id: 'boat_city_workboat', name: 'Dockside Workboat', tier: 3, cost: 1280, vendor: 'city',
    maxSpeed: 10.0, reverseSpeed: 4.2, acceleration: 5.2, deceleration: 2.6, turnRate: 1.2,
    capacity: 4, hullColor: 0x8a5229, style: 'workboat', hasFishingDeck: true,
    description: 'A broad-beamed utility hull used by the city docks and harbor crews.',
  },
  {
    id: 'boat_city_cruiser', name: 'Skyline Bay Cruiser', tier: 4, cost: 1950, vendor: 'city',
    maxSpeed: 14.0, reverseSpeed: 5.0, acceleration: 8.0, deceleration: 4.2, turnRate: 1.5,
    capacity: 4, hullColor: 0xe6a119, style: 'yacht', hasFishingDeck: true,
    description: 'A polished cruising yacht with a shaded fishing deck and a captain’s chair.',
  },
  {
    id: 'boat_city_cat', name: 'Neon Twin Cat', tier: 5, cost: 3900, vendor: 'city',
    maxSpeed: 16.5, reverseSpeed: 5.8, acceleration: 9.2, deceleration: 5.0, turnRate: 2.2,
    capacity: 4, hullColor: 0xc45a86, style: 'catamaran', hasFishingDeck: true,
    description: 'Twin hulls, neon trim and knife-edge agility. The city’s favourite weekend racer.',
  },
  {
    id: 'boat_city_glass', name: 'Glasshull Explorer', tier: 5, cost: 5800, vendor: 'city',
    maxSpeed: 15.0, reverseSpeed: 5.2, acceleration: 8.4, deceleration: 4.6, turnRate: 1.7,
    capacity: 4, hullColor: 0x8fd8d0, style: 'expedition', hasFishingDeck: true, hasSonar: true,
    description: 'A glass-bottomed expedition boat built to read the shelf beneath the city lights.',
  },
  {
    id: 'boat_city_patrol', name: 'Harbor Patrol Cutter', tier: 5, cost: 6400, vendor: 'city',
    maxSpeed: 16.0, reverseSpeed: 5.4, acceleration: 8.6, deceleration: 4.8, turnRate: 1.8,
    capacity: 4, hullColor: 0x4a4a4a, style: 'expedition', hasRadar: true, hasCannons: true,
    description: 'A fast municipal patrol hull with radar and a light broadside for offshore threats.',
  },
  {
    id: 'boat_city_yacht', name: 'Aurelia Grand Yacht', tier: 6, cost: 8200, vendor: 'city',
    maxSpeed: 18.0, reverseSpeed: 6.0, acceleration: 9.0, deceleration: 5.0, turnRate: 1.6,
    capacity: 5, hullColor: 0xf4f1de, style: 'yacht', hasFishingDeck: true, hasRadar: true,
    description: 'The mayor’s own cruiser: white hull, brass rails and a long fishing deck.',
  },
  {
    id: 'boat_city_racer', name: 'Comet Racing Skiff', tier: 6, cost: 9600, vendor: 'city',
    maxSpeed: 21.0, reverseSpeed: 6.4, acceleration: 10.2, deceleration: 5.6, turnRate: 2.4,
    capacity: 3, hullColor: 0xef476f, style: 'motor',
    description: 'A stripped-down city racing skiff. Very fast, very loud, very little storage.',
  },
  {
    id: 'boat_city_flagship', name: 'Aurelia Flagship', tier: 7, cost: 14800, vendor: 'city',
    maxSpeed: 19.5, reverseSpeed: 6.6, acceleration: 9.4, deceleration: 5.2, turnRate: 1.7,
    capacity: 6, hullColor: 0x1e3a5f, style: 'yacht',
    hasFishingDeck: true, hasRadar: true, hasSonar: true, hasCannons: true,
    description: 'The city’s ceremonial flagship, fully rigged for exploration, fishing and battle.',
  },
];

// Two city fishing platforms, kept at safe spouts off the plateau edge.
export const CityFishingSpots = [
  {
    id: 'spot_city_canal', name: 'Aurelia Canal Outfall', habitat: 'coast',
    position: cityPoint(92, 0), target: cityPoint(115, 0),
  },
  {
    id: 'spot_city_sky_pier', name: 'Sky Marina Pier', habitat: 'pier',
    position: cityPoint(0, -98), target: cityPoint(0, -118),
  },
];

export const CityFerryDefinitions = [
  {
    id: 'ferry_aurelia_dock', name: 'Driftwood City Ferry', destination: 'city',
    position: { x: 16, z: -24 },
    prompt: 'Sail to Aurelia Heights',
    arrival: { x: CityIsland.arrival.x, z: CityIsland.arrival.z },
  },
  {
    id: 'ferry_city_return', name: 'Aurelia Harbor Slip', destination: 'harbor',
    position: { x: CityIsland.arrival.x, z: CityIsland.arrival.z + 3 },
    prompt: 'Sail back to Driftwood Harbor',
    arrival: { x: 12, z: -22 },
  },
];

// Mooring used when a city vessel is bought at the Sky Marina. The island
// slopes into the sea at z > 540, so the hull floats off the waterfront pier
// while disembarking puts the player back on the plateau.
export const CityBoatMooring = {
  position: { x: CityIsland.center.x, y: 0, z: 543 },
  anchor: { x: CityIsland.arrival.x, y: CityIsland.peakHeight, z: CityIsland.arrival.z },
};

export default {
  CityBuildingDefinitions,
  CityNpcDefinitions,
  CityCivilianDefinitions,
  CityBoatCatalog,
  CityFishingSpots,
  CityFerryDefinitions,
  CityBoatMooring,
};
