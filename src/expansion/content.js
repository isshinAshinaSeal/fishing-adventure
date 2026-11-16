// Expansion 2.0 content catalog: backpacks, rods, consumables, housing,
// service buildings, NPCs, ocean creatures, cannons, bosses and cosmetics.
// Keeping definitions here makes new content data-only additions.

export const BackpackDefinitions = [
  { id: 'bag_small', name: 'Small Bag', slots: 20, weight: 40, cost: 0, icon: '🎒' },
  { id: 'bag_explorer', name: 'Explorer Bag', slots: 35, weight: 70, cost: 450, icon: '🎒' },
  { id: 'bag_fisherman', name: "Fisherman's Pack", slots: 50, weight: 100, cost: 1200, icon: '🧳' },
  { id: 'bag_ocean', name: 'Ocean Backpack', slots: 75, weight: 140, cost: 2800, icon: '🎒' },
  { id: 'bag_pirate', name: 'Pirate Backpack', slots: 100, weight: 180, cost: 5200, icon: '🏴‍☠️' },
  { id: 'bag_deep', name: 'Deep Sea Carrier', slots: 150, weight: 240, cost: 9000, icon: '🌊' },
  { id: 'bag_legendary', name: 'Legendary Pack', slots: 200, weight: 320, cost: 15000, icon: '👑' },
];

// Fishing tools are permanent equipment with active and passive uses. Traps are
// deployed in the world and collected after their timer elapses.
export const FishingToolDefinitions = [
  { id: 'tool_basic_kit', name: 'Angler Tool Kit', icon: '🧰', rarity: 'Common', cost: 0, description: 'A dependable kit with a spare hook, sinkers and a line cutter.', modifiers: { lineStrength: 2 } },
  { id: 'tool_braided_line', name: 'Braided Tide Line', icon: '🧵', rarity: 'Uncommon', cost: 900, description: 'Low-stretch braid raises line strength and reduces snap risk.', modifiers: { lineStrength: 14 } },
  { id: 'tool_tackle_box', name: 'Master Tackle Box', icon: '🪝', rarity: 'Uncommon', cost: 1400, description: 'Organized lures make every bait more effective.', modifiers: { baitBonus: 0.18 } },
  { id: 'tool_cast_net', name: 'Shore Cast Net', icon: '🕸️', rarity: 'Rare', cost: 1900, description: 'A wide net that can land a bonus fish alongside your main catch.', modifiers: { multiCatch: 0.22 }, habitat: 'shallow' },
  { id: 'tool_reef_spear', name: 'Coral Reef Spear', icon: '🔱', rarity: 'Rare', cost: 2200, description: 'Precision spear for shallow reef fish. Raises catch quality.', modifiers: { quality: 0.14 }, habitat: 'reef' },
  { id: 'tool_sonar_scope', name: 'Sonar Scope', icon: '📡', rarity: 'Epic', cost: 2800, description: 'Reads the shoal beneath the boat and improves rare-fish luck.', modifiers: { luck: 0.09, finder: 0.15 } },
  { id: 'tool_fish_trap', name: 'Baited Fish Trap', icon: '🪤', rarity: 'Rare', cost: 3200, description: 'Deploy in calm water. Collect after 90 seconds for 2-3 fish.', trap: { duration: 90, yield: 2, rarity: 0.02 } },
  { id: 'tool_crab_pot', name: 'Deep Crab Pot', icon: '🦀', rarity: 'Epic', cost: 4200, description: 'Deploy offshore. Collect after 2 minutes for high-quality catches.', trap: { duration: 120, yield: 2, quality: 0.2 } },
  { id: 'tool_eel_trap', name: 'Eel Weir', icon: '🪱', rarity: 'Epic', cost: 5200, description: 'A woven weir that draws rare and legendary eels from dark water.', trap: { duration: 180, yield: 3, rarity: 0.08 } },
  { id: 'tool_fish_finder', name: 'Fish Finder', icon: '📟', rarity: 'Legendary', cost: 6800, description: 'Cuts waiting time by a quarter and reveals the next likely habitat.', modifiers: { waitReduction: 0.25, finder: 0.25 } },
  { id: 'tool_glow_lure', name: 'Abyssal Glow Lure', icon: '🔮', rarity: 'Legendary', cost: 7600, description: 'A bioluminescent lure that pulls rare deep-sea species toward the hook.', modifiers: { luck: 0.16, quality: 0.08 } },
  { id: 'tool_leviathan_net', name: 'Leviathan Tow Net', icon: '🪢', rarity: 'Mythical', cost: 11000, description: 'A reinforced tow net for giant catches and bonus landings.', modifiers: { multiCatch: 0.32, lineStrength: 10, quality: 0.1 } },
  { id: 'tool_barbed_hooks', name: 'Barbed Tide Hooks', icon: '🪝', rarity: 'Uncommon', cost: 1100, description: 'Hand-forged barbed hooks that hold powerful fish and improve catch quality.', modifiers: { quality: 0.08, lineStrength: 6 } },
  { id: 'tool_polarized_glasses', name: 'Polarized Glass Lenses', icon: '🕶️', rarity: 'Rare', cost: 2400, description: 'Cut glare from the water to reveal shoals and improve fish finding.', modifiers: { finder: 0.22, luck: 0.03 } },
  { id: 'tool_tide_compass', name: 'Tide Compass', icon: '🧭', rarity: 'Rare', cost: 3600, description: 'Tracks current lines and cuts dead time between bites.', modifiers: { waitReduction: 0.12, finder: 0.18, luck: 0.05 } },
  { id: 'tool_bait_cannon', name: 'Bait Cannon', icon: '🎯', rarity: 'Epic', cost: 4800, description: 'Scatters a precise bait cloud that draws multiple fish into the swim.', modifiers: { baitBonus: 0.25, multiCatch: 0.12 } },
  { id: 'tool_sonar_drone', name: 'Sonar Drone', icon: '🛰️', rarity: 'Legendary', cost: 7800, description: 'An autonomous sonar buoy that maps the shoal beneath your hull.', modifiers: { finder: 0.35, luck: 0.12, waitReduction: 0.08 } },
  { id: 'tool_leviathan_harpoon', name: 'Leviathan Harpoon', icon: '🔱', rarity: 'Mythical', cost: 12500, description: 'A deck-mounted harpoon for giant catches, with a reinforced line and superb control.', modifiers: { quality: 0.2, lineStrength: 22, multiCatch: 0.08 } },
  { id: 'tool_titan_rig', name: 'Titan Angler Rig', icon: '⚙️', rarity: 'Celestial', cost: 18000, description: 'The complete endgame rig: titan line, precision reel and a multi-hook spread.', modifiers: { lineStrength: 30, multiCatch: 0.2, quality: 0.15, finder: 0.15 } },
  { id: 'tool_skyline_net', name: 'Skyline Cast Net', icon: '🕸️', rarity: 'Rare', cost: 2900, description: 'A broad city net tuned for canal outfalls and pier shadows.', modifiers: { multiCatch: 0.26 }, habitat: 'coast' },
  { id: 'tool_rooftop_sonar', name: 'Rooftop Sonar', icon: '📡', rarity: 'Epic', cost: 3400, description: 'A compact sonar that reads the shelf below the city lights.', modifiers: { finder: 0.2, waitReduction: 0.1 } },
  { id: 'tool_city_finder', name: 'Boulevard Fish Finder', icon: '📟', rarity: 'Epic', cost: 3600, description: 'Live shoal tracking from the boulevard to the ferry lane.', modifiers: { finder: 0.3, waitReduction: 0.12 } },
  { id: 'tool_quarry_sinker', name: 'Quarry Sinkers', icon: '⚓', rarity: 'Uncommon', cost: 1300, description: 'Heavy stone sinkers that hold bait down in a fast city current.', modifiers: { lineStrength: 12, baitBonus: 0.08 } },
  { id: 'tool_neon_lure', name: 'Neon Tide Lure', icon: '💡', rarity: 'Legendary', cost: 7200, description: 'A pulsing neon lure that pulls night fish out of the dark water.', modifiers: { luck: 0.18, quality: 0.1 } },
  { id: 'tool_harbor_drone', name: 'Harbor Sonar Drone', icon: '🛰️', rarity: 'Epic', cost: 5200, description: 'An autonomous drone that maps the harbor while you fish.', modifiers: { finder: 0.28, multiCatch: 0.08 } },
  { id: 'tool_crystal_line', name: 'Crystal Braid Line', icon: '🧵', rarity: 'Rare', cost: 2700, description: 'A crystalline braid with exceptional snap resistance.', modifiers: { lineStrength: 20 } },
  { id: 'tool_orchard_bait', name: 'Orchard Bait Press', icon: '🍎', rarity: 'Rare', cost: 2300, description: 'Presses rooftop fruit into a bait paste that fish cannot resist.', modifiers: { baitBonus: 0.2, multiCatch: 0.08 } },
  { id: 'tool_sky_pier_kit', name: 'Sky Pier Kit', icon: '🧰', rarity: 'Rare', cost: 3100, description: 'A pier-side kit with precision hooks and a line finder.', modifiers: { quality: 0.12, finder: 0.1 } },
  { id: 'tool_ferry_trap', name: 'Ferry Trap', icon: '🪤', rarity: 'Epic', cost: 4400, description: 'Deploy from the ferry lane. Collect after 2.5 minutes for quality catches.', trap: { duration: 150, yield: 3, quality: 0.15 } },
  { id: 'tool_observatory_scope', name: 'Observatory Scope', icon: '🔭', rarity: 'Legendary', cost: 8200, description: 'Reads surface shadows from high above the skyline.', modifiers: { finder: 0.4, luck: 0.08 } },
  { id: 'tool_aurelia_rig', name: 'Aurelia Master Rig', icon: '⚜️', rarity: 'Celestial', cost: 19500, description: 'The city’s master rig: skyline line, crystal guides and a multi-hook spread.', modifiers: { lineStrength: 32, multiCatch: 0.22, quality: 0.18, finder: 0.2 } },
];

export const ItemCategories = [
  { id: 'fish', name: 'Fish', icon: '🐟' },
  { id: 'equipment', name: 'Fishing Equipment', icon: '🎣' },
  { id: 'consumable', name: 'Consumables', icon: '🧪' },
  { id: 'material', name: 'Materials', icon: '🪵' },
  { id: 'produce', name: 'Produce', icon: '🥕' },
  { id: 'treasure', name: 'Treasure', icon: '💎' },
  { id: 'cosmetic', name: 'Cosmetics', icon: '✨' },
  { id: 'quest', name: 'Quest Items', icon: '📜' },
  { id: 'misc', name: 'Miscellaneous', icon: '📦' },
];

// First four entries of each family are the base rod and three improved marks.
const RodFamilies = [
  {
    key: 'bamboo', name: "Fisherman's Bamboo", rarity: 'Common', price: 0,
    ability: 'Basic fishing', stats: { reelSpeed: 1.0, luckBonus: 0.0, lineStrength: 45, fishControl: 40, castDistance: 40 }, color: 0xb08a4f,
  },
  {
    key: 'coral', name: 'Coral Branch Rod', rarity: 'Uncommon', price: 260,
    ability: 'Reef fishing bonus', stats: { reelSpeed: 1.08, luckBonus: 0.05, lineStrength: 52, fishControl: 48, castDistance: 46 }, color: 0xff7f6f, habitatBonus: 'reef',
  },
  {
    key: 'sailor', name: "Sailor's Rod", rarity: 'Uncommon', price: 380,
    ability: 'Ocean stability', stats: { reelSpeed: 1.12, luckBonus: 0.04, lineStrength: 58, fishControl: 56, castDistance: 52 }, color: 0x4f7fb0, habitatBonus: 'ocean',
  },
  {
    key: 'golden_hook', name: 'Golden Hook Rod', rarity: 'Rare', price: 720,
    ability: 'Improved catch quality', stats: { reelSpeed: 1.16, luckBonus: 0.1, lineStrength: 60, fishControl: 55, castDistance: 55 }, color: 0xd4af37, qualityBonus: 0.08,
  },
  {
    key: 'pirate_hunter', name: 'Pirate Hunter Rod', rarity: 'Rare', price: 980,
    ability: 'Large fish control', stats: { reelSpeed: 1.14, luckBonus: 0.08, lineStrength: 72, fishControl: 68, castDistance: 58 }, color: 0x8b1e1e, largeFishBonus: 0.12,
  },
  {
    key: 'abyssal', name: 'Abyssal Rod', rarity: 'Epic', price: 1500,
    ability: 'Deep-sea fishing', stats: { reelSpeed: 1.22, luckBonus: 0.14, lineStrength: 74, fishControl: 72, castDistance: 62 }, color: 0x2b1d4f, habitatBonus: 'abyss',
  },
  {
    key: 'stormcaller', name: 'Stormcaller Rod', rarity: 'Epic', price: 1750,
    ability: 'Storm fishing bonus', stats: { reelSpeed: 1.25, luckBonus: 0.16, lineStrength: 70, fishControl: 74, castDistance: 74 }, color: 0x5e7ce2, weatherBonus: true,
  },
  {
    key: 'frostbite', name: 'Frostbite Rod', rarity: 'Epic', price: 1900,
    ability: 'Ice-region fishing', stats: { reelSpeed: 1.2, luckBonus: 0.15, lineStrength: 78, fishControl: 75, castDistance: 58 }, color: 0xbde8ff, habitatBonus: 'frozen',
  },
  {
    key: 'magma', name: 'Magma Rod', rarity: 'Legendary', price: 3200,
    ability: 'Volcanic fishing', stats: { reelSpeed: 1.32, luckBonus: 0.22, lineStrength: 85, fishControl: 82, castDistance: 64 }, color: 0xe25822, habitatBonus: 'volcanic',
  },
  {
    key: 'leviathan', name: 'Leviathan Rod', rarity: 'Mythical', price: 5200,
    ability: 'Giant fish specialization', stats: { reelSpeed: 1.36, luckBonus: 0.27, lineStrength: 95, fishControl: 90, castDistance: 68 }, color: 0x227c9d, giantBonus: 0.2,
  },
  {
    key: 'celestial', name: 'Celestial Rod', rarity: 'Celestial', price: 7800,
    ability: 'Unique fish attraction', stats: { reelSpeed: 1.42, luckBonus: 0.36, lineStrength: 92, fishControl: 94, castDistance: 78 }, color: 0xf4d03f, celestialBonus: 0.15,
  },
  {
    key: 'ancient_trident', name: 'Ancient Trident Rod', rarity: 'Ancient', price: 9800,
    ability: 'Ancient species bonus', stats: { reelSpeed: 1.4, luckBonus: 0.32, lineStrength: 100, fishControl: 88, castDistance: 66 }, color: 0x8fbc8f, ancientBonus: 0.22,
  },
  {
    key: 'tideforged', name: 'Tideforged Harpoon', rarity: 'Abyssal', price: 12500,
    ability: 'Tidal control', stats: { reelSpeed: 1.48, luckBonus: 0.4, lineStrength: 104, fishControl: 98, castDistance: 82 }, color: 0x0b3954, tidalBonus: 0.18,
  },
  {
    key: 'skyline', name: 'Skyline Carbon Rod', rarity: 'Epic', price: 2400,
    ability: 'City skyline casting', stats: { reelSpeed: 1.28, luckBonus: 0.18, lineStrength: 80, fishControl: 78, castDistance: 90 }, color: 0x7dd3fc,
  },
  {
    key: 'rooftop', name: 'Rooftop Bamboo Rod', rarity: 'Rare', price: 1250,
    ability: 'Rooftop farm fishing', stats: { reelSpeed: 1.18, luckBonus: 0.12, lineStrength: 66, fishControl: 62, castDistance: 70 }, color: 0x8fbf6a,
  },
  {
    key: 'quarry', name: 'Quarrystone Rod', rarity: 'Epic', price: 2100,
    ability: 'Rocky shore bonus', stats: { reelSpeed: 1.24, luckBonus: 0.17, lineStrength: 84, fishControl: 70, castDistance: 58 }, color: 0x9a8f80,
  },
  {
    key: 'neon', name: 'Neon Tide Rod', rarity: 'Legendary', price: 4600,
    ability: 'Night fishing bonus', stats: { reelSpeed: 1.34, luckBonus: 0.24, lineStrength: 88, fishControl: 86, castDistance: 76 }, color: 0xff5da2,
  },
  {
    key: 'orchard', name: 'Orchard Bloom Rod', rarity: 'Legendary', price: 3900,
    ability: 'Harvest-tide casting', stats: { reelSpeed: 1.3, luckBonus: 0.23, lineStrength: 82, fishControl: 88, castDistance: 72 }, color: 0xe07a1f,
  },
  {
    key: 'aurelia', name: 'Aurelia Skyline Rod', rarity: 'Abyssal', price: 15200,
    ability: 'City legend', stats: { reelSpeed: 1.5, luckBonus: 0.42, lineStrength: 105, fishControl: 100, castDistance: 88 }, color: 0x1e6f8f,
  },
];

const MARK_LABELS = ['', 'Mk II', 'Mk III', 'Mk IV'];
const MARK_RARITIES = ['Common', 'Rare', 'Epic', 'Mythical'];
const RARITY_ORDER = ['Common', 'Uncommon', 'Rare', 'Epic', 'Legendary', 'Mythical', 'Celestial', 'Ancient', 'Abyssal'];

function nextRarity(rarity, steps) {
  const idx = Math.max(0, RARITY_ORDER.indexOf(rarity));
  return RARITY_ORDER[Math.min(RARITY_ORDER.length - 1, idx + steps)];
}

export const RodDefinitions = [];
for (const family of RodFamilies) {
  for (let mark = 0; mark < 4; mark++) {
    const scale = 1 + mark * 0.14;
    const suffix = mark === 0 ? '' : ` ${MARK_LABELS[mark]}`;
    const rarity = mark === 0 ? family.rarity : nextRarity(family.rarity, mark);
    RodDefinitions.push({
      id: `rod_${family.key}_${mark + 1}`,
      name: `${family.name}${suffix}`,
      family: family.key,
      mark: mark + 1,
      rarity,
      price: Math.round(family.price * (1 + mark * 0.75)),
      ability: family.ability,
      color: family.color,
      weight: Number((2.0 + mark * 0.15).toFixed(2)),
      levelRequirement: 1 + mark * 6,
      stats: {
        reelSpeed: Number((family.stats.reelSpeed + mark * 0.07).toFixed(2)),
        luckBonus: Number((family.stats.luckBonus + mark * 0.035).toFixed(2)),
        lineStrength: Math.min(100, Math.round(family.stats.lineStrength * scale)),
        fishControl: Math.min(100, Math.round(family.stats.fishControl * scale)),
        castDistance: Math.min(100, Math.round(family.stats.castDistance * scale)),
      },
      bonus: {
        habitat: family.habitatBonus || null,
        quality: family.qualityBonus || 0,
        largeFish: family.largeFishBonus || 0,
        giant: family.giantBonus || 0,
        ancient: family.ancientBonus || 0,
        celestial: family.celestialBonus || 0,
        weather: Boolean(family.weatherBonus),
      },
      skills: [
        { id: 'deep_current', name: 'Deep Current', description: '+10% line strength while reeling.', requiredLevel: 3, maxRank: 3 },
        { id: 'heavy_catch', name: 'Heavy Catch', description: '+8% control over large fish.', requiredLevel: 6, maxRank: 3 },
        { id: 'ocean_focus', name: 'Ocean Focus', description: 'Widens the perfect-catch window.', requiredLevel: 10, maxRank: 2 },
        { id: 'ancient_resonance', name: 'Ancient Resonance', description: '+6% luck with ancient species.', requiredLevel: 15, maxRank: 2 },
      ],
    });
  }
}

export const ConsumableDefinitions = [
  { id: 'potion_luck', name: 'Fishing Luck Potion', icon: '🍀', category: 'consumable', price: 120, weight: 0.4, stack: 9, cooldown: 30, duration: 120, buff: { key: 'luck', value: 0.25, name: 'Lucky Waters' }, description: '+25% rare fish luck for 2 minutes.' },
  { id: 'reel_boost', name: 'Reel Boost', icon: '⚡', category: 'consumable', price: 90, weight: 0.3, stack: 9, cooldown: 20, duration: 90, buff: { key: 'reel', value: 0.3, name: 'Quick Reel' }, description: '+30% reeling progress for 90 seconds.' },
  { id: 'fish_attractor', name: 'Fish Attractor', icon: '🌀', category: 'consumable', price: 160, weight: 0.5, stack: 5, cooldown: 60, duration: 120, buff: { key: 'attract', value: 0.2, name: 'Attractor Cloud' }, description: 'Improves all fish attraction for 2 minutes.' },
  { id: 'ocean_bait', name: 'Ocean Bait', icon: '🪱', category: 'consumable', price: 35, weight: 0.5, stack: 20, cooldown: 2, duration: 0, effect: 'bait_ocean', description: 'Consume to switch to ocean bait.' },
  { id: 'deep_sea_bait', name: 'Deep Sea Bait', icon: '🌊', category: 'consumable', price: 70, weight: 0.5, stack: 20, cooldown: 2, duration: 0, effect: 'bait_deep', description: 'Consume to switch to deep-sea bait.' },
  { id: 'stamina_snack', name: 'Stamina Snack', icon: '🍪', category: 'consumable', price: 45, weight: 0.2, stack: 12, cooldown: 8, duration: 0, effect: 'stamina', description: 'Restores 35 player stamina and 25 mount stamina.' },
  { id: 'energy_drink', name: 'Energy Drink', icon: '🥤', category: 'consumable', price: 60, weight: 0.3, stack: 9, cooldown: 25, duration: 45, buff: { key: 'speed', value: 0.22, name: 'Wind Runner' }, description: '+22% movement speed for 45 seconds.' },
  { id: 'healing_food', name: 'Healing Food', icon: '🍲', category: 'consumable', price: 80, weight: 0.6, stack: 9, cooldown: 15, duration: 0, effect: 'heal', description: 'Restores 45 health.' },
  { id: 'ship_repair', name: 'Ship Repair Kit', icon: '🔧', category: 'consumable', price: 180, weight: 3.0, stack: 5, cooldown: 10, duration: 0, effect: 'repair_ship', description: 'Repairs 60 hull health on the active ship.' },
  { id: 'cannon_crate', name: 'Cannon Reload Crate', icon: '💣', category: 'consumable', price: 140, weight: 2.5, stack: 5, cooldown: 8, duration: 0, effect: 'ammo', description: 'Restocks 6 standard cannon rounds.' },
  { id: 'treasure_compass', name: 'Treasure Compass', icon: '🧭', category: 'consumable', price: 220, weight: 0.3, stack: 3, cooldown: 60, duration: 0, effect: 'compass', description: 'Reveals the nearest hidden treasure.' },
  { id: 'weather_charm', name: 'Weather Charm', icon: '🌦️', category: 'consumable', price: 90, weight: 0.2, stack: 5, cooldown: 30, duration: 60, buff: { key: 'weather', value: 1, name: 'Aurora Charm' }, description: 'Summons a cosmetic aurora for 1 minute.' },
  { id: 'warm_soup', name: 'Warm Soup', icon: '🥣', category: 'consumable', price: 70, weight: 0.5, stack: 9, cooldown: 10, duration: 180, buff: { key: 'warmth', value: 0.5, name: 'Warmth' }, description: 'Protects against cold for 3 minutes.' },
  { id: 'oxygen_pack', name: 'Diving Oxygen Pack', icon: '🫧', category: 'consumable', price: 110, weight: 1.2, stack: 5, cooldown: 15, duration: 90, buff: { key: 'oxygen', value: 0.5, name: 'Oxygen Reserve' }, description: 'Extends underwater oxygen for 90 seconds.' },
  { id: 'farm_feast', name: 'Harvest Feast', icon: '🥘', category: 'consumable', price: 120, weight: 0.7, stack: 9, cooldown: 20, duration: 300, buff: { key: 'farming', value: 0.3, name: 'Green Thumb' }, description: '+30% crop growth for 5 minutes. Made from rooftop produce.' },
  { id: 'miner_stew', name: 'Quarry Stew', icon: '🍲', category: 'consumable', price: 110, weight: 0.8, stack: 9, cooldown: 20, duration: 240, buff: { key: 'gathering', value: 0.25, name: 'Stonebreaker' }, description: '+25% gathering power for 4 minutes.' },
  { id: 'produce_smoothie', name: 'Sunrise Smoothie', icon: '🥤', category: 'consumable', price: 95, weight: 0.4, stack: 9, cooldown: 18, duration: 90, buff: { key: 'speed', value: 0.15, name: 'Orchard Sprint' }, description: '+15% movement speed for 90 seconds.' },
];

export const MaterialDefinitions = [
  { id: 'mat_wood', name: 'Driftwood Plank', icon: '🪵', category: 'material', price: 18, weight: 1.5, stack: 50 },
  { id: 'mat_coral', name: 'Coral Shard', icon: '🪸', category: 'material', price: 32, weight: 0.5, stack: 50 },
  { id: 'mat_crystal', name: 'Sea Crystal', icon: '💠', category: 'material', price: 75, weight: 0.4, stack: 30 },
  { id: 'mat_scale', name: 'Leviathan Scale', icon: '🐋', category: 'material', price: 140, weight: 0.7, stack: 30 },
  { id: 'mat_ancient', name: 'Ancient Relic Fragment', icon: '🏺', category: 'material', price: 210, weight: 0.8, stack: 20 },
  { id: 'mat_pearl', name: 'Black Pearl', icon: '🖤', category: 'treasure', price: 300, weight: 0.2, stack: 20 },
  { id: 'mat_coin_cache', name: 'Sunken Coin Cache', icon: '💰', category: 'treasure', price: 450, weight: 6.0, stack: 10 },
  { id: 'quest_seal', name: 'Harbor Seal', icon: '📜', category: 'quest', price: 0, weight: 0.1, stack: 10 },
  { id: 'misc_rope', name: 'Tarred Rope', icon: '🪢', category: 'misc', price: 12, weight: 1.0, stack: 25 },
  // Farming produce: harvested from the harbor beds and Aurelia rooftop plots.
  { id: 'produce_turnip', name: 'Harbor Turnip', icon: '🥬', category: 'produce', price: 22, weight: 0.3, stack: 50 },
  { id: 'produce_carrot', name: 'Sunlit Carrot', icon: '🥕', category: 'produce', price: 30, weight: 0.3, stack: 50 },
  { id: 'produce_potato', name: 'Cloud Potato', icon: '🥔', category: 'produce', price: 36, weight: 0.4, stack: 50 },
  { id: 'produce_wheat', name: 'Skyline Wheat', icon: '🌾', category: 'produce', price: 46, weight: 0.2, stack: 50 },
  { id: 'produce_tomato', name: 'Rooftop Tomato', icon: '🍅', category: 'produce', price: 62, weight: 0.3, stack: 50 },
  { id: 'produce_corn', name: 'Golden Corn', icon: '🌽', category: 'produce', price: 58, weight: 0.5, stack: 50 },
  { id: 'produce_rice', name: 'Terrace Rice', icon: '🌱', category: 'produce', price: 74, weight: 0.3, stack: 50 },
  { id: 'produce_strawberry', name: 'Glasshouse Strawberry', icon: '🍓', category: 'produce', price: 84, weight: 0.2, stack: 50 },
  { id: 'produce_chili', name: 'Ember Chili', icon: '🌶️', category: 'produce', price: 110, weight: 0.2, stack: 50 },
  { id: 'produce_pumpkin', name: 'Harvest Pumpkin', icon: '🎃', category: 'produce', price: 140, weight: 1.8, stack: 30 },
  { id: 'produce_grape', name: 'Skyvine Grape', icon: '🍇', category: 'produce', price: 120, weight: 0.3, stack: 40 },
  { id: 'produce_sunflower', name: 'Aurelia Sunflower', icon: '🌻', category: 'produce', price: 260, weight: 0.4, stack: 30 },
  // Gathering materials: timber, fibre, ore and city quarry finds.
  { id: 'mat_stone', name: 'Cut Stone', icon: '🪨', category: 'material', price: 14, weight: 1.8, stack: 50 },
  { id: 'mat_flint', name: 'Flint Shard', icon: '🔪', category: 'material', price: 20, weight: 0.3, stack: 50 },
  { id: 'mat_resin', name: 'Tree Resin', icon: '🫗', category: 'material', price: 24, weight: 0.4, stack: 50 },
  { id: 'mat_fiber', name: 'Plant Fibre', icon: '🧵', category: 'material', price: 16, weight: 0.2, stack: 50 },
  { id: 'mat_copper', name: 'Copper Ore', icon: '🪙', category: 'material', price: 38, weight: 0.9, stack: 50 },
  { id: 'mat_iron', name: 'Iron Ore', icon: '⚙️', category: 'material', price: 64, weight: 1.1, stack: 50 },
  { id: 'mat_gold', name: 'Gold Ore', icon: '🏅', category: 'material', price: 120, weight: 1.0, stack: 40 },
  { id: 'mat_quartz', name: 'Quartz Cluster', icon: '🔮', category: 'material', price: 90, weight: 0.5, stack: 40 },
  { id: 'mat_ironwood', name: 'Ironwood Log', icon: '🌲', category: 'material', price: 70, weight: 2.2, stack: 40 },
  { id: 'mat_obsidian', name: 'Obsidian Shard', icon: '🌑', category: 'material', price: 150, weight: 1.0, stack: 30 },
  { id: 'mat_crystal_shard', name: 'Crystal Shard', icon: '💠', category: 'material', price: 110, weight: 0.5, stack: 40 },
  { id: 'mat_skywood', name: 'Skywood Log', icon: '🌴', category: 'material', price: 180, weight: 2.0, stack: 30 },
  { id: 'mat_mythril', name: 'Mythril Ore', icon: '✨', category: 'material', price: 320, weight: 0.8, stack: 20 },
  { id: 'mat_sky_crystal', name: 'Sky Crystal', icon: '🔷', category: 'material', price: 260, weight: 0.4, stack: 20 },
];

export const RecipeDefinitions = [
  { id: 'cook_grilled_salmon', name: 'Grilled Salmon', icon: '🍣', output: 'healing_food', outputQty: 2, fish: ['sardine', 'mackerel'], coins: 25, description: 'Restores health. Uses common fish.' },
  { id: 'cook_tropical_soup', name: 'Tropical Fish Soup', icon: '🥣', output: 'warm_soup', outputQty: 1, fish: ['clownfish', 'angelfish'], coins: 40, description: 'Cold-weather comfort food.' },
  { id: 'cook_golden_sushi', name: 'Golden Sushi', icon: '🍱', output: 'potion_luck', outputQty: 1, fish: ['golden_trout', 'golden_marlin'], coins: 120, description: 'A lucky meal made from golden fish.' },
  { id: 'cook_seafood_platter', name: 'Ocean Seafood Platter', icon: '🦞', output: 'stamina_snack', outputQty: 3, fish: ['red_snapper', 'seabass'], coins: 60, description: 'Restores stamina for long voyages.' },
  { id: 'cook_magma_stew', name: 'Spicy Magma Stew', icon: '🌶️', output: 'energy_drink', outputQty: 1, fish: ['magma_kraken', 'ember_eel'], coins: 150, description: 'A fiery drink for volcanic waters.' },
  { id: 'craft_repair', name: 'Ship Repair Kit', icon: '🔧', output: 'ship_repair', outputQty: 1, material: 'mat_wood', materialQty: 2, coins: 90, description: 'Craft hull repairs from driftwood.' },
  { id: 'craft_cannon_ammo', name: 'Standard Cannon Core', icon: '💣', output: 'ammo_standard', outputQty: 4, material: 'mat_scale', materialQty: 1, coins: 50, description: 'Craft standard cannon ammunition.' },
  { id: 'craft_attractor', name: 'Fish Attractor', icon: '🌀', output: 'fish_attractor', outputQty: 1, material: 'mat_coral', materialQty: 3, coins: 70, description: 'Blend coral oil into a fish attractor.' },
  { id: 'craft_resin_lure', name: 'Resin Luck Charm', icon: '🍀', output: 'potion_luck', outputQty: 1, materials: { mat_resin: 2, mat_fiber: 1 }, coins: 40, description: 'Tree resin and fibre pressed into a lucky charm.' },
  { id: 'craft_stone_repair', name: 'Stone-Braced Repair Kit', icon: '🛠️', output: 'ship_repair', outputQty: 1, materials: { mat_stone: 2, mat_resin: 1 }, coins: 60, description: 'Stone braces and resin make a rugged hull patch.' },
  { id: 'craft_copper_charm', name: 'Copper Tide Charm', icon: '🪙', output: 'potion_luck', outputQty: 2, materials: { mat_copper: 2, mat_quartz: 1 }, coins: 80, description: 'A copper-and-quartz charm for lucky water.' },
  { id: 'craft_iron_gear', name: 'Iron Gear Kit', icon: '⚙️', output: 'ship_repair', outputQty: 2, materials: { mat_iron: 2, mat_wood: 1 }, coins: 100, description: 'Iron fittings and timber for serious hull work.' },
  { id: 'craft_crystal_lens', name: 'Crystal Weather Lens', icon: '🔮', output: 'weather_charm', outputQty: 1, materials: { mat_crystal_shard: 2, mat_quartz: 1 }, coins: 90, description: 'A crystal lens that coaxes an aurora out of the sky.' },
  { id: 'craft_mythril_repair', name: 'Mythril Repair Crate', icon: '✨', output: 'ship_repair', outputQty: 2, materials: { mat_mythril: 1, mat_iron: 2 }, coins: 200, description: 'Mythril-banded repairs for a flagship hull.' },
  { id: 'cook_harvest_stew', name: 'Harvest Stew', icon: '🥘', output: 'farm_feast', outputQty: 1, materials: { produce_potato: 2, produce_carrot: 1 }, coins: 30, description: 'A farmhouse stew that speeds every crop cycle.' },
  { id: 'cook_rooftop_salad', name: 'Rooftop Salad', icon: '🥗', output: 'produce_smoothie', outputQty: 2, materials: { produce_tomato: 1, produce_turnip: 1 }, coins: 35, description: 'Fresh rooftop greens blended into a sunrise drink.' },
  { id: 'cook_sunflower_oil', name: 'Sunflower Oil', icon: '🌻', output: 'healing_food', outputQty: 2, materials: { produce_sunflower: 1 }, coins: 60, description: 'Golden oil that makes every meal restorative.' },
  { id: 'cook_quarry_stew', name: 'Quarry Stew', icon: '🍲', output: 'miner_stew', outputQty: 1, materials: { produce_potato: 1, mat_stone: 1 }, coins: 45, description: 'A miner’s stew, thick enough to break stone.' },
];

export const CannonDefinitions = [
  { id: 'cannon_basic', name: 'Basic Deck Cannon', rarity: 'Common', cost: 0, damage: 22, reload: 2.4, accuracy: 0.65, ammo: 'standard', description: 'Reliable standard projectile.' },
  { id: 'cannon_heavy', name: 'Heavy Cannon', rarity: 'Uncommon', cost: 1400, damage: 38, reload: 3.3, accuracy: 0.58, description: 'High-impact broadside cannon.' },
  { id: 'cannon_rapid', name: 'Rapid Cannon', rarity: 'Rare', cost: 2200, damage: 18, reload: 1.25, accuracy: 0.68, description: 'Fast-firing pressure cannon.' },
  { id: 'cannon_frost', name: 'Frost Cannon', rarity: 'Rare', cost: 2600, damage: 24, reload: 2.2, accuracy: 0.7, ammo: 'frost', slow: 0.35, description: 'Slows a boss with every hit.' },
  { id: 'cannon_electric', name: 'Electric Cannon', rarity: 'Epic', cost: 3800, damage: 26, reload: 2.0, accuracy: 0.72, ammo: 'shock', chain: 0.35, description: 'Chains damage through nearby targets.' },
  { id: 'cannon_coral', name: 'Coral Cannon', rarity: 'Epic', cost: 4400, damage: 30, reload: 2.6, accuracy: 0.66, ammo: 'coral', splash: 0.4, description: 'Area-effect coral burst.' },
  { id: 'cannon_phantom', name: 'Phantom Cannon', rarity: 'Legendary', cost: 6200, damage: 40, reload: 2.2, accuracy: 0.8, ammo: 'phantom', description: 'Spectral shot that pierces armor.' },
  { id: 'cannon_ancient', name: 'Ancient Cannon', rarity: 'Mythical', cost: 8500, damage: 46, reload: 2.8, accuracy: 0.74, ammo: 'ancient', description: 'Ancient boss-breaking ordnance.' },
  { id: 'cannon_leviathan', name: 'Leviathan Cannon', rarity: 'Celestial', cost: 11000, damage: 55, reload: 3.0, accuracy: 0.78, ammo: 'ancient', description: 'Endgame cannon built from leviathan bone.' },
  { id: 'cannon_celestial', name: 'Celestial Cannon', rarity: 'Abyssal', cost: 14500, damage: 62, reload: 3.2, accuracy: 0.84, ammo: 'phantom', description: 'Fires a star-forged projectile.' },
];

export const AmmoDefinitions = [
  { id: 'standard', name: 'Standard Core', icon: '⚫', damageMul: 1.0, description: 'Normal boss damage.' },
  { id: 'frost', name: 'Frost Orb', icon: '🔵', damageMul: 0.85, slow: 0.35, description: 'Slows boss movement.' },
  { id: 'shock', name: 'Shock Orb', icon: '🟣', damageMul: 0.8, interrupt: true, description: 'Interrupts boss special actions.' },
  { id: 'coral', name: 'Coral Burst', icon: '🟠', damageMul: 1.1, splash: true, description: 'Area damage around impact.' },
  { id: 'phantom', name: 'Phantom Orb', icon: '👻', damageMul: 1.25, pierce: true, description: 'Ignores armor during vulnerability.' },
  { id: 'ancient', name: 'Ancient Core', icon: '🏺', damageMul: 1.4, bossArmor: true, description: 'Strong against armored bosses.' },
  { id: 'capture', name: 'Capture Orb', icon: '🕸️', damageMul: 0.25, capture: true, description: 'Starts a non-damaging capture phase.' },
];

export const CannonUpgradeBranches = [
  { id: 'impact', name: 'Impact', maxLevel: 5, baseCost: 500, perLevelCost: 400, description: '+8% cannon damage per level.' },
  { id: 'reload', name: 'Reload', maxLevel: 5, baseCost: 450, perLevelCost: 350, description: '-7% reload time per level.' },
  { id: 'precision', name: 'Precision', maxLevel: 5, baseCost: 420, perLevelCost: 330, description: '+5% aim assist per level.' },
  { id: 'stability', name: 'Stability', maxLevel: 3, baseCost: 600, perLevelCost: 500, description: 'Reduces ship damage while firing.' },
  { id: 'specialization', name: 'Specialization', maxLevel: 3, baseCost: 900, perLevelCost: 700, description: 'Unlocks special ammunition effects.' },
];

export const GiantCreatureDefinitions = [
  { id: 'blue_whale', name: 'Blue Whale', icon: '🐋', sizeClass: 'Colossal', zone: 'ocean', color: 0x406fa8, scale: 4.8, speed: 1.3, behavior: 'Slow migration', depth: 'surface' },
  { id: 'ancient_megalodon', name: 'Ancient Megalodon', icon: '🦈', sizeClass: 'Colossal', zone: 'abyss', color: 0x4d5b69, scale: 4.2, speed: 2.2, behavior: 'Deep ocean patrol', depth: 'deep' },
  { id: 'giant_manta', name: 'Giant Manta', icon: '🐟', sizeClass: 'Massive', zone: 'reef', color: 0x355c7d, scale: 3.4, speed: 1.8, behavior: 'Reef migration', depth: 'mid' },
  { id: 'sea_serpent', name: 'Sea Serpent', icon: '🐍', sizeClass: 'Colossal', zone: 'abyss', color: 0x2e8b57, scale: 4.5, speed: 2.4, behavior: 'Deep-water roaming', depth: 'deep' },
  { id: 'golden_marlin', name: 'Golden Marlin', icon: '🐟', sizeClass: 'Giant', zone: 'ocean', color: 0xf2c14e, scale: 2.6, speed: 4.2, behavior: 'Fast ocean movement', depth: 'surface' },
  { id: 'crystal_whale', name: 'Crystal Whale', icon: '💎', sizeClass: 'Colossal', zone: 'celestial', color: 0x9be7ff, scale: 4.6, speed: 1.1, behavior: 'Rare appearance', depth: 'mid', rare: true },
  { id: 'abyssal_shark', name: 'Abyssal Shark', icon: '🦈', sizeClass: 'Massive', zone: 'abyss', color: 0x1f2a44, scale: 3.8, speed: 2.8, behavior: 'Deep sea hunting', depth: 'deep' },
  { id: 'ancient_turtle', name: 'Ancient Turtle', icon: '🐢', sizeClass: 'Colossal', zone: 'coast', color: 0x6b8e23, scale: 4.0, speed: 0.8, behavior: 'Slow coastal migration', depth: 'surface' },
  { id: 'storm_ray', name: 'Storm Ray', icon: '⚡', sizeClass: 'Massive', zone: 'storm', color: 0x6a5acd, scale: 3.6, speed: 2.0, behavior: 'Storm-related appearance', depth: 'surface', rare: true },
  { id: 'leviathan_world', name: 'Leviathan', icon: '🌊', sizeClass: 'World Boss', zone: 'abyss', color: 0x0b3954, scale: 5.6, speed: 1.6, behavior: 'World boss encounter', depth: 'deep', bossId: 'boss_leviathan' },
  { id: 'verdant_colossus', name: 'Verdant Colossus', icon: '🌿', sizeClass: 'Colossal', zone: 'kelp', color: 0x2f6b3a, scale: 4.9, speed: 1.2, behavior: 'Kelp forest migration', depth: 'mid' },
  { id: 'mangrove_hydra', name: 'Mangrove Hydra', icon: '🐍', sizeClass: 'Massive', zone: 'mangrove', color: 0x526b32, scale: 4.1, speed: 1.9, behavior: 'Root-channel ambush', depth: 'surface' },
  { id: 'frostfall_leviathan', name: 'Frostfall Leviathan', icon: '🧊', sizeClass: 'Colossal', zone: 'polar', color: 0x9bd7e8, scale: 5.2, speed: 1.1, behavior: 'Glacier wall patrol', depth: 'deep' },
  { id: 'aurora_whale', name: 'Aurora Whale', icon: '🌌', sizeClass: 'Colossal', zone: 'polar', color: 0x6a5acd, scale: 5.0, speed: 1.0, behavior: 'Night sky migration', depth: 'surface', rare: true },
  { id: 'ember_behemoth', name: 'Ember Behemoth', icon: '🌋', sizeClass: 'Colossal', zone: 'volcanic', color: 0xb63b1f, scale: 4.7, speed: 1.7, behavior: 'Vent hunting', depth: 'deep' },
  { id: 'obsidian_serpent', name: 'Obsidian Serpent', icon: '🔥', sizeClass: 'Massive', zone: 'volcanic', color: 0x2a1c1a, scale: 4.3, speed: 2.6, behavior: 'Volcanic rim patrol', depth: 'mid' },
  { id: 'celestial_stingray', name: 'Celestial Stingray', icon: '✨', sizeClass: 'Massive', zone: 'celestial', color: 0xf4d03f, scale: 3.9, speed: 2.1, behavior: 'Star-lit gliding', depth: 'surface', rare: true },
  { id: 'world_turtle', name: 'Worldback Turtle', icon: '🐢', sizeClass: 'World Boss', zone: 'jungle', color: 0x5e7f46, scale: 5.8, speed: 0.7, behavior: 'Ancient island wanderer', depth: 'surface' },
];

export const BossDefinitions = [
  {
    id: 'boss_leviathan', name: 'The Ancient Leviathan', title: 'World Boss', location: 'Abyssal Trench', difficulty: 'Extreme',
    icon: '🐋', maxHealth: 2400, shipDamage: 9, attackInterval: 4.5, phases: 6, rewardSpecies: 'ancient_leviathan',
    phaseNames: ['Roaming Encounter', 'Circling the Ship', 'Special Movement', 'Cannon Vulnerability', 'Final Challenge', 'Defeat'],
    rewards: { coins: 3200, xp: 1400, cosmetic: 'ship_phantom', title: 'Leviathan Slayer', materials: { mat_scale: 4, mat_ancient: 2 } },
  },
  {
    id: 'boss_kraken', name: 'The Kraken', title: 'World Boss', location: 'Haunted Waters', difficulty: 'Extreme',
    icon: '🦑', maxHealth: 2800, shipDamage: 11, attackInterval: 3.8, phases: 6, rewardSpecies: 'magma_kraken',
    phaseNames: ['Tentacle Rising', 'Tentacle Targets', 'Ship Grapple', 'Vulnerability Window', 'Final Onslaught', 'Defeat'],
    rewards: { coins: 3600, xp: 1600, cosmetic: 'mount_kraken', title: 'Kraken Breaker', materials: { mat_ancient: 3, mat_pearl: 2 } },
  },
  {
    id: 'boss_storm_serpent', name: 'Storm Serpent', title: 'World Boss', location: 'Storm Ocean', difficulty: 'Hard',
    icon: '🐍', maxHealth: 1900, shipDamage: 8, attackInterval: 4.0, phases: 5, rewardSpecies: 'frost_serpent',
    phaseNames: ['Storm Approach', 'Lightning Run', 'Electric Vulnerability', 'Ship Coordination', 'Defeat'],
    rewards: { coins: 2400, xp: 1100, cosmetic: 'rod_stormcaller_4', title: 'Storm Rider', materials: { mat_crystal: 4, mat_scale: 2 } },
  },
  {
    id: 'boss_golden_emperor', name: 'The Golden Emperor', title: 'Mythical Boss', location: 'Celestial Isles', difficulty: 'Mythical',
    icon: '👑', maxHealth: 3600, shipDamage: 13, attackInterval: 3.4, phases: 6, rewardSpecies: 'golden_leviathan',
    phaseNames: ['Golden Shield', 'Shield Break', 'Emperor Stage', 'Environmental Surge', 'Mythical Vulnerability', 'Defeat'],
    rewards: { coins: 5000, xp: 2200, cosmetic: 'rod_celestial_4', title: 'Emperor of Tides', materials: { mat_ancient: 5, mat_pearl: 4 } },
  },
];

export const BuildingDefinitions = [
  { id: 'bld_fishing_guild', name: 'Fishing Guild', service: 'guild', icon: '🎖️', npc: 'guildmaster_marina', color: 0x2e6644, description: 'Guild ranks, daily requests and fishing contracts.' },
  { id: 'bld_shipyard', name: 'Shipyard', service: 'shipyard', icon: '⛵', npc: 'engineer_bolt', color: 0x24588a, description: 'Buy vessels and install ship upgrades.' },
  { id: 'bld_rod_workshop', name: 'Rod Workshop', service: 'rods', icon: '🎣', npc: 'marina_wells', color: 0x8a5229, description: 'Craft, equip and train 76 fishing rods.' },
  { id: 'bld_bait_lab', name: 'Bait Laboratory', service: 'crafting', icon: '🧪', npc: 'professor_coral', color: 0x2f9e9e, description: 'Cook fish and craft bait, repair kits and ammunition.' },
  { id: 'bld_fish_market', name: 'Fish Market', service: 'market', icon: '🐟', npc: 'fishmonger_pete', color: 0x9e382b, description: 'Sell fish, process catches and stock the aquarium.' },
  { id: 'bld_auction', name: 'Auction House', service: 'auction', icon: '⚖️', npc: 'quartermaster_jack', color: 0x6b4c9a, description: 'Trade eligible treasures and cosmetics for coins.' },
  { id: 'bld_backpack_store', name: 'Backpack Store', service: 'backpack', icon: '🎒', npc: 'isabella', color: 0x7c4d28, description: 'Upgrade slots and weight capacity.' },
  { id: 'bld_potion_shop', name: 'Potion Shop', service: 'potions', icon: '🧴', npc: 'luna', color: 0x9b59b6, description: 'Buy consumables, buffs and quick-use supplies.' },
  { id: 'bld_housing_office', name: 'Housing Office', service: 'housing', icon: '🏠', npc: 'isabella_house', color: 0xb7791f, description: 'Buy, enter, upgrade and furnish houses.' },
  { id: 'bld_mount_stable', name: 'Mount Stable', service: 'mounts', icon: '🐎', npc: 'ranger_ash', color: 0x6e4a2c, description: 'Manage unlocked mounts and riding gear.' },
  { id: 'bld_aquarium', name: 'Aquarium Center', service: 'aquarium', icon: '🐠', npc: 'luna_aqua', color: 0x1f8a9e, description: 'Display catches and care for aquarium fish.' },
  { id: 'bld_boutique', name: 'Cosmetic Boutique', service: 'wardrobe', icon: '✨', npc: 'mira', color: 0xc45a86, description: 'Equip owned rods, ships, mounts and outfits.' },
  { id: 'bld_gacha', name: 'Gacha Pavilion', service: 'gacha', icon: '🎁', npc: 'mira_gacha', color: 0x8e44ad, description: 'Cosmetic draws with transparent odds and pity.' },
  { id: 'bld_cannon', name: 'Cannon Workshop', service: 'cannons', icon: '💣', npc: 'captain_blackfin', color: 0x4a4a4a, description: 'Upgrade cannons, ammunition and combat gear.' },
  { id: 'bld_research', name: 'Research Center', service: 'research', icon: '🔬', npc: 'professor_coral_research', color: 0x16a085, description: 'Study fish samples and reveal undiscovered species.' },
  { id: 'bld_tool_shed', name: 'Tool Shed', service: 'tools', icon: '🧰', npc: 'toolsmith_haru', color: 0x5f6f52, description: 'Buy, equip and train nets, traps, sonar and specialised fishing tools.' },
  { id: 'bld_cartography', name: 'Cartographer’s Loft', service: 'travel', icon: '🗺️', npc: 'cartographer_ines', color: 0x3f6f8f, description: 'Chart the outer islands and unlock the expanded fast-travel network.' },
  { id: 'bld_tavern', name: 'Salty Gull Tavern', service: 'potions', icon: '🍲', npc: 'tavern_marlow', color: 0x8f4f2f, description: 'Hot meals, warming brews, and rumours from every outer island.' },
  { id: 'bld_hatchery', name: 'Island Hatchery', service: 'aquarium', icon: '🐠', npc: 'hatchery_neri', color: 0x2b8f7f, description: 'Raise rare fry and prepare aquarium centerpieces.' },
  { id: 'bld_quest_board', name: 'Quest Board', service: 'guild', icon: '📜', npc: 'questmaster_orson', color: 0x8a6a2f, description: 'Take on island surveys, giant hunts and collection contracts.' },
  { id: 'bld_lighthouse', name: 'Outer Light Lighthouse', service: 'radar', icon: '🗼', npc: 'lighthouse_sable', color: 0x4a6070, description: 'Scan distant waters, track giants and spot incoming storms.' },
];

export const ExpansionNpcDefinitions = [
  { id: 'captain_blackfin', name: 'Captain Blackfin', title: 'Cannon Master', building: 'bld_cannon', color: 0x1a1a1a, isPirate: true, lines: ['Every leviathan has a blind spot. Find it, and hold your fire until the vulnerability phase.', 'A cannon is only as good as its gunner. Upgrade impact, reload and precision before chasing world bosses.'] },
  { id: 'marina_wells', name: 'Marina Wells', title: 'Rod Artisan', building: 'bld_rod_workshop', color: 0x2e6644, lines: ['Seventy-six rods, each with its own temperament. Equip the right tool and the ocean answers.', 'Rod skills grow with use. Deep Current, Heavy Catch and Ocean Focus are worth every point.'] },
  { id: 'professor_coral', name: 'Professor Coral', title: 'Marine Researcher', building: 'bld_research', color: 0x16a085, lines: ['We still have much to learn. Bring me samples and I will help reveal the index.', 'The deep abyss holds species older than the harbor itself.'] },
  { id: 'old_finn', name: 'Old Fisherman Finn', title: 'Rare Fish Hunter', building: 'bld_fishing_guild', color: 0x884422, lines: ['Rare fish do not chase lures. They follow the tide, the moon, and patience.', 'Try the deep drop after dusk. Something ancient moves down there.'] },
  { id: 'engineer_bolt', name: 'Engineer Bolt', title: 'Shipwright', building: 'bld_shipyard', color: 0x24588a, lines: ['Hull first, engine second, glory last. A floating wreck catches no fish.', 'Cargo capacity is not decoration. Load your hold before a long voyage.'] },
  { id: 'isabella', name: 'Isabella', title: 'Housing Agent', building: 'bld_housing_office', color: 0xb7791f, lines: ['A home is more than four walls. Fill it with trophies, fish and stories.', 'Upgrade to level five and you get a private dock, trophy hall and aquarium.'] },
  { id: 'quartermaster_jack', name: 'Quartermaster Jack', title: 'Auctioneer', building: 'bld_auction', color: 0x6b4c9a, lines: ['One captain’s junk is another captain’s treasure. Let us make a deal.', 'Treasures and spare cosmetics move fast at auction.'] },
  { id: 'luna', name: 'Luna', title: 'Aquarium Keeper', building: 'bld_aquarium', color: 0x1f8a9e, lines: ['Your rarest catches deserve more than a bucket. Give them a home in glass.', 'A healthy aquarium draws curious fish to the harbor.'] },
  { id: 'ranger_ash', name: 'Ranger Ash', title: 'Expedition Ranger', building: 'bld_mount_stable', color: 0x6e4a2c, lines: ['The island is bigger than the road. A good mount changes everything.', 'Keep your mount fed and rested. Stamina is not infinite.'] },
  { id: 'captain_frost', name: 'Captain Frost', title: 'Frozen Harbor Captain', building: 'bld_fishing_guild', color: 0x9bd7e8, lines: ['Cold water sharpens the senses. Frozen fish fight differently.', 'Warm soup before you sail north. The fjord does not forgive.'] },
  { id: 'mira', name: 'Mira', title: 'Cosmetic Curator', building: 'bld_boutique', color: 0xc45a86, lines: ['Style is its own reward. Every cosmetic is earned with in-game coins only.', 'Duplicates become tokens. The collection meter guarantees a featured item.'] },
  { id: 'harbor_master', name: 'Harbor Master', title: 'Travel & Services', building: 'bld_shipyard', color: 0x1e3a5f, lines: ['All harbor services are open. Follow the lanterns.', 'The fast-travel gates connect every habitat we have charted.'] },
  { id: 'toolsmith_haru', name: 'Haru', title: 'Toolsmith', building: 'bld_tool_shed', color: 0x5f6f52, lines: ['A rod is only half the craft. Nets, traps and sonar are the other half.', 'Deploy a trap before you sail on. The sea works while you do.'] },
  { id: 'cartographer_ines', name: 'Ines', title: 'Outer Isles Cartographer', building: 'bld_cartography', color: 0x3f6f8f, lines: ['Three new landmasses are on the chart: Verdant Crown, Frostfall and Ember Isle.', 'Sail close to a new shore and your map will remember it forever.'] },
  { id: 'tavern_marlow', name: 'Marlow', title: 'Tavern Keeper', building: 'bld_tavern', color: 0x8f4f2f, lines: ['Hot stew before a cold voyage. No captain ever regretted a full belly.', 'The outer islands have their own fish, their own weather, and their own legends.'] },
  { id: 'hatchery_neri', name: 'Neri', title: 'Hatchery Keeper', building: 'bld_hatchery', color: 0x2b8f7f, lines: ['Bring me a living rarity and I will raise a whole shoal for the aquarium.', 'The kelp beds are full of small fish with very large attitudes.'] },
  { id: 'questmaster_orson', name: 'Orson', title: 'Contract Master', building: 'bld_quest_board', color: 0x8a6a2f, lines: ['Every island has a request. Every request has a reward.', 'Survey contracts pay best when you bring back something nobody has seen.'] },
  { id: 'lighthouse_sable', name: 'Sable', title: 'Lighthouse Keeper', building: 'bld_lighthouse', color: 0x4a6070, lines: ['From this light I can see giants move between islands like slow storms.', 'The radar picks up more than wrecks. Watch the outer horizon.'] },
  { id: 'florist_mae', name: 'Mae', title: 'Island Florist', building: 'bld_housing_office', color: 0x9f5f8f, lines: ['A house becomes a home when something living is growing inside it.', 'Kelp planters and geode lamps are all the rage this season.'] },
  { id: 'fishmonger_greg', name: 'Old Greg', title: 'Outer Isles Fishmonger', building: 'bld_fish_market', color: 0x9e6b3a, lines: ['Kelp-fed fish taste sweeter. Trust an old buyer.', 'Bring me a frostfin and I will make it worth the crossing.'] },
];

// Free, built-in island huts. They are always present in the world (never
// purchased), each one has a resident outside, and the hut door opens a real
// service panel. This keeps the island populated instead of feeling like a
// menu with a few expensive plots.
export const IslandHutDefinitions = [
  {
    id: 'hut_welcome', name: 'Driftwood Welcome Hut', service: 'guild', icon: '🛖', color: 0x8a6a3f,
    npcId: 'hut_elowen', resident: 'Elowen', title: 'Island Greeter', position: { x: 28, z: 20 },
    lines: ['Welcome to Driftwood Isle! Every hut on this island is open to you.', 'Step inside the welcome hut for guild work, or fish right off the nearby pier.'],
  },
  {
    id: 'hut_kelp_weaver', name: 'Kelp Weaver Hut', service: 'crafting', icon: '🛖', color: 0x527f45,
    npcId: 'hut_nessa', resident: 'Nessa', title: 'Kelp Weaver', position: { x: -60, z: 0 },
    lines: ['I weave the kelp before it dries. The loom inside is free to use.', 'Bring me a bright strand and I will show you a stronger fishing line.'],
  },
  {
    id: 'hut_shell_trader', name: 'Shell Trader Hut', service: 'market', icon: '🛖', color: 0xb27a45,
    npcId: 'hut_pell', resident: 'Pell', title: 'Shell Trader', position: { x: 100, z: -20 },
    lines: ['Shells, scales, and a fair price. No plot fee, no harbor tax.', 'The market counter inside buys whatever you haul in.'],
  },
  {
    id: 'hut_cliff_lookout', name: 'Cliff Lookout Hut', service: 'tools', icon: '🛖', color: 0x5f6f52,
    npcId: 'hut_bram', resident: 'Bram', title: 'Cliff Lookout', position: { x: -100, z: -60 },
    lines: ['From this cliff I can see three islands before breakfast.', 'Take a net or trap from the hut. The shallow shelf below is full of fish.'],
  },
  {
    id: 'hut_meadow_forager', name: 'Meadow Forager Hut', service: 'potions', icon: '🛖', color: 0x9b6b3d,
    npcId: 'hut_juniper', resident: 'Juniper', title: 'Meadow Forager', position: { x: 30, z: 95 },
    lines: ['Herbs, mushrooms, warm tea. The little hut keeps the kettle on.', 'A warm soup makes the north wind feel much less serious.'],
  },
  {
    id: 'hut_southshore', name: 'Southshore Carpenter Hut', service: 'housing', icon: '🛖', color: 0xb7791f,
    npcId: 'hut_orla', resident: 'Orla', title: 'Southshore Carpenter', position: { x: -10, z: -120 },
    lines: ['I built half the roofs on this coast, and I will build yours too.', 'The housing desk inside is open. No appointment and no entry fee.'],
  },
  {
    id: 'hut_east_grove', name: 'East Grove Ranger Hut', service: 'mounts', icon: '🛖', color: 0x6e4a2c,
    npcId: 'hut_fenn', resident: 'Fenn', title: 'Grove Ranger', position: { x: 130, z: 80 },
    lines: ['The grove paths are gentler on a good mount. The stable desk is inside.', 'Keep to the trail and the island will feel much smaller.'],
  },
  {
    id: 'hut_west_farm', name: 'West Farm Hatchery Hut', service: 'aquarium', icon: '🛖', color: 0x2b8f7f,
    npcId: 'hut_tilda', resident: 'Tilda', title: 'Island Farmer', position: { x: -150, z: 80 },
    lines: ['The ponds behind this hut are for young fish, not dinner.', 'Bring a rare catch and we will give it a proper tank.'],
  },
];

// One personal request per named NPC. Progress is tracked by the NPC manager,
// persisted in the save payload and claimed from the service conversation.
export const ExpansionNpcQuests = [
  { npcId: 'captain_blackfin', name: 'Proof of the Leviathan', description: 'Defeat a world boss with cannon fire.', metric: 'bossDefeats', target: 1, reward: 900, xp: 150, friendship: 4 },
  { npcId: 'marina_wells', name: 'A Rare Commission', description: 'Catch 3 Rare or better fish.', metric: 'rareCatches', target: 3, reward: 500, xp: 120, friendship: 3 },
  { npcId: 'professor_coral', name: 'Field Samples', description: 'Catch 5 Rare or better fish for study.', metric: 'rareCatches', target: 5, reward: 700, xp: 160, friendship: 3 },
  { npcId: 'old_finn', name: 'The One That Got Away', description: 'Land 1 Legendary or better fish.', metric: 'legendaryCatches', target: 1, reward: 1000, xp: 180, friendship: 4 },
  { npcId: 'engineer_bolt', name: 'Sea Trials', description: 'Catch 6 fish while testing the new hull.', metric: 'catches', target: 6, reward: 550, xp: 110, friendship: 3 },
  { npcId: 'isabella', name: 'Make It a Home', description: 'Place 3 furniture items in an owned house.', metric: 'furniture', target: 3, reward: 700, xp: 130, friendship: 3 },
  { npcId: 'quartermaster_jack', name: 'Auction Appraisal', description: 'Catch 8 fish worth putting on the block.', metric: 'catches', target: 8, reward: 750, xp: 140, friendship: 3 },
  { npcId: 'luna', name: 'Tank Centerpiece', description: 'Catch 2 Rare or better fish for the aquarium.', metric: 'rareCatches', target: 2, reward: 450, xp: 100, friendship: 3 },
  { npcId: 'ranger_ash', name: 'Island Survey', description: 'Catch 6 fish around the outer island.', metric: 'catches', target: 6, reward: 500, xp: 110, friendship: 3 },
  { npcId: 'captain_frost', name: 'Frozen Trophy', description: 'Catch 1 Legendary or better fish in the cold water.', metric: 'legendaryCatches', target: 1, reward: 1100, xp: 190, friendship: 4 },
  { npcId: 'mira', name: 'Collection Debut', description: 'Catch 10 fish to fund a new look.', metric: 'catches', target: 10, reward: 650, xp: 120, friendship: 3 },
  { npcId: 'harbor_master', name: 'Harbor Guardian', description: 'Defeat a world boss threatening the harbor.', metric: 'bossDefeats', target: 1, reward: 1200, xp: 200, friendship: 5 },
  { npcId: 'toolsmith_haru', name: 'Field Test', description: 'Catch 7 fish with the new tool kit.', metric: 'catches', target: 7, reward: 650, xp: 120, friendship: 3 },
  { npcId: 'cartographer_ines', name: 'Chart the Unknown', description: 'Catch 9 fish while surveying the outer isles.', metric: 'catches', target: 9, reward: 900, xp: 170, friendship: 4 },
  { npcId: 'tavern_marlow', name: 'A Proper Catch', description: 'Catch 1 Legendary or better fish for the tavern table.', metric: 'legendaryCatches', target: 1, reward: 850, xp: 150, friendship: 3 },
  { npcId: 'hatchery_neri', name: 'Living Treasure', description: 'Catch 4 Rare or better fish for the hatchery.', metric: 'rareCatches', target: 4, reward: 800, xp: 160, friendship: 4 },
  { npcId: 'questmaster_orson', name: 'Contract of Tides', description: 'Catch 12 fish and prove you can finish a contract.', metric: 'catches', target: 12, reward: 1000, xp: 190, friendship: 4 },
  { npcId: 'lighthouse_sable', name: 'Giant Watch', description: 'Defeat a world boss seen from the lighthouse.', metric: 'bossDefeats', target: 1, reward: 1100, xp: 200, friendship: 4 },
  { npcId: 'florist_mae', name: 'Home in Bloom', description: 'Place 5 furniture items to bring a house to life.', metric: 'furniture', target: 5, reward: 750, xp: 140, friendship: 4 },
  { npcId: 'fishmonger_greg', name: 'Outer Isles Order', description: 'Catch 10 fish that are worth crossing an ocean for.', metric: 'catches', target: 10, reward: 700, xp: 130, friendship: 3 },
];

export const HousingDefinitions = [
  { id: 'plot_seaside', name: "Fisherman's Cottage", type: 'Starter', cost: 150, level: 1, description: 'A cozy starter home near the pier.', color: 0xc8a27a, maxLevel: 5 },
  { id: 'plot_hilltop', name: 'Hilltop Angler Villa', type: 'Advanced', cost: 400, level: 1, description: 'An airy villa with a view over the bay.', color: 0xe8d5b7, maxLevel: 5 },
  { id: 'plot_ocean_villa', name: 'Ocean Villa', type: 'Advanced', cost: 950, level: 2, description: 'A balcony house overlooking the open sea.', color: 0xddeeff, maxLevel: 5 },
  { id: 'plot_pirate_residence', name: 'Pirate Residence', type: 'Special', cost: 1800, level: 2, description: 'A smuggler’s house with a hidden trophy room.', color: 0x7a1f1f, maxLevel: 5 },
  { id: 'plot_underwater_dome', name: 'Underwater Dome', type: 'Rare', cost: 3200, level: 3, description: 'A glass dome surrounded by schools of fish.', color: 0x2f9e9e, maxLevel: 5 },
  { id: 'plot_frost_cabin', name: 'Frost Cabin', type: 'Regional', cost: 4200, level: 3, description: 'A snow-roofed cabin in the frozen fjord.', color: 0xcfe4ee, maxLevel: 5 },
  { id: 'plot_island_mansion', name: 'Island Mansion', type: 'Legendary', cost: 7500, level: 4, description: 'A mansion with a private dock and trophy hall.', color: 0xd4af37, maxLevel: 5 },
  { id: 'plot_cliff_nest', name: 'Cliff Nest Retreat', type: 'Exclusive', cost: 11000, level: 3, description: 'A wind-swept retreat built into the high eastern cliffs.', color: 0xb8a48f, maxLevel: 5 },
  { id: 'plot_reef_retreat', name: 'Reefside Retreat', type: 'Waterfront', cost: 9500, level: 3, description: 'A glass-walled house whose deck hangs over the coral shelf.', color: 0x8fd8d0, maxLevel: 5 },
  { id: 'plot_mangrove_hut', name: 'Mangrove Stilt Hut', type: 'Natural', cost: 8800, level: 2, description: 'A stilted hut woven into the mangrove roots of the western shore.', color: 0x7f8f4f, maxLevel: 5 },
  { id: 'plot_volcano_forge', name: 'Volcano Forge Lodge', type: 'Industrial', cost: 12500, level: 4, description: 'A basalt lodge with its own forge, kiln and ash-garden.', color: 0x8f4f3f, maxLevel: 5 },
  { id: 'plot_sky_observatory', name: 'Sky Observatory', type: 'Celestial', cost: 15000, level: 4, description: 'A brass observatory above the clouds, built for aurora nights.', color: 0xd9c8ff, maxLevel: 5 },
];

export const FurnitureDefinitions = [
  { id: 'furn_sofa', name: 'Captain’s Sofa', room: 'Living Room', icon: '🛋️', cost: 180, weight: 12, color: 0x386641 },
  { id: 'furn_table', name: 'Map Table', room: 'Living Room', icon: '🪑', cost: 120, weight: 9, color: 0x7c5332 },
  { id: 'furn_tv', name: 'Tide Projector', room: 'Living Room', icon: '📺', cost: 300, weight: 6, color: 0x222222 },
  { id: 'furn_bookshelf', name: 'Sea Library', room: 'Living Room', icon: '📚', cost: 220, weight: 14, color: 0x5a3e24 },
  { id: 'furn_bed', name: 'Driftwood Bed', room: 'Bedroom', icon: '🛏️', cost: 260, weight: 18, color: 0x88a2aa },
  { id: 'furn_wardrobe', name: 'Wardrobe', room: 'Bedroom', icon: '🚪', cost: 200, weight: 16, color: 0x6e4a2c },
  { id: 'furn_nightstand', name: 'Nightstand', room: 'Bedroom', icon: '🕯️', cost: 90, weight: 5, color: 0x9c6644 },
  { id: 'furn_rod_rack', name: 'Rod Rack', room: 'Fishing Room', icon: '🎣', cost: 240, weight: 8, color: 0xb08a4f },
  { id: 'furn_bait_cabinet', name: 'Bait Cabinet', room: 'Fishing Room', icon: '🧪', cost: 210, weight: 10, color: 0x2f9e9e },
  { id: 'furn_tackle', name: 'Tackle Table', room: 'Fishing Room', icon: '🪛', cost: 170, weight: 9, color: 0x7c5332 },
  { id: 'furn_fish_tank', name: 'Display Aquarium', room: 'Aquarium Room', icon: '🐠', cost: 650, weight: 22, color: 0x1f8a9e },
  { id: 'furn_coral_decor', name: 'Coral Sculpture', room: 'Aquarium Room', icon: '🪸', cost: 210, weight: 4, color: 0xff7f6f },
  { id: 'furn_trophy_case', name: 'Trophy Case', room: 'Trophy Room', icon: '🏆', cost: 480, weight: 12, color: 0xd4af37 },
  { id: 'furn_fish_statue', name: 'Legendary Fish Statue', room: 'Trophy Room', icon: '🐟', cost: 720, weight: 18, color: 0xd4af37 },
  { id: 'furn_lantern', name: 'Harbor Lantern', room: 'Outdoor', icon: '🏮', cost: 80, weight: 3, color: 0xffe066 },
  { id: 'furn_fountain', name: 'Shell Fountain', room: 'Outdoor', icon: '⛲', cost: 540, weight: 24, color: 0xaae8f5 },
  { id: 'furn_boat_station', name: 'Private Boat Station', room: 'Dock', icon: '⛵', cost: 900, weight: 30, color: 0x24588a },
  { id: 'furn_fishing_platform', name: 'Dock Fishing Platform', room: 'Dock', icon: '🎣', cost: 380, weight: 20, color: 0x8a5229 },
  { id: 'furn_piano', name: 'Tideworn Piano', room: 'Living Room', icon: '🎹', cost: 820, weight: 32, color: 0x2b2b2b },
  { id: 'furn_bar', name: 'Captain’s Bar', room: 'Living Room', icon: '🍸', cost: 640, weight: 26, color: 0x6b4c2f },
  { id: 'furn_kelp_planter', name: 'Living Kelp Planter', room: 'Aquarium Room', icon: '🌿', cost: 310, weight: 8, color: 0x3f8f4a },
  { id: 'furn_geode_lamp', name: 'Geode Lamp', room: 'Bedroom', icon: '💎', cost: 450, weight: 6, color: 0x8f7fd8 },
  { id: 'furn_ship_model', name: 'Galleon Model', room: 'Trophy Room', icon: '⛵', cost: 580, weight: 7, color: 0xd4af37 },
  { id: 'furn_aurora_window', name: 'Aurora Window', room: 'Trophy Room', icon: '🌌', cost: 900, weight: 15, color: 0x6a5acd },
];

export const CosmeticBanners = [
  { id: 'banner_rods', name: 'Rod Collection', icon: '🎣', description: 'Fishing rod skins and casting trails.' },
  { id: 'banner_ships', name: 'Ship Collection', icon: '⛵', description: 'Ship appearances and sail sigils.' },
  { id: 'banner_character', name: 'Character Collection', icon: '🧥', description: 'Outfits and accessories.' },
  { id: 'banner_mounts', name: 'Mount Collection', icon: '🐎', description: 'Mount appearances and saddles.' },
  { id: 'banner_backpacks', name: 'Backpack Collection', icon: '🎒', description: 'Backpack skins and charms.' },
  { id: 'banner_effects', name: 'Fishing Effects', icon: '✨', description: 'Casting and catch effects.' },
  { id: 'banner_aquarium', name: 'Aquarium Collection', icon: '🐠', description: 'Aquarium decorations and lighting.' },
  { id: 'banner_legendary', name: 'Legendary Collection', icon: '👑', description: 'Premium visual sets and animated effects.' },
];

const CosmeticNames = {
  banner_rods: ['Golden Pirate Rod', 'Stormglass Rod', 'Snowflake Rod', 'Aurora Celestial Rod', 'Coral Heart Rod', 'Abyss Ink Rod', 'Sunset Bamboo', 'Moonlit Carbon'],
  banner_ships: ['Phantom Ship', 'Tropical Speedboat', 'Haunted Pirate Ship', 'Golden Dragon Boat', 'Coral Guardian Hull', 'Frostbreaker Livery', 'Royal Tide Yacht', 'Blackfin Raider'],
  banner_character: ['Coral Guardian Outfit', 'Storm Captain Coat', 'Abyss Diver Suit', 'Harbor Admiral Uniform', 'Pirate Emporium Coat', 'Frost Ranger Parka', 'Celestial Navigator', 'Researcher’s Apron'],
  banner_mounts: ['Frost Wolf', 'Kraken Saddle', 'Golden Fox Armor', 'Crystal Antlers', 'Turtle Tide Shell', 'Abyss Lizard Scales', 'Celestial Stag', 'Pirate Boar Harness'],
  banner_backpacks: ['Crystal Backpack', 'Explorer’s Satchel', 'Pirate Chestpack', 'Deep Sea Carrier Skin', 'Mage Backpack', 'Lantern Pack', 'Trophy Hunter Pack', 'Celestial Starpack'],
  banner_effects: ['Golden Cast Trail', 'Bioluminescent Line', 'Storm Spark Splash', 'Cherry Blossom Catch', 'Abyss Ripple', 'Aurora Confetti', 'Coral Bloom', 'Phantom Hook Echo'],
  banner_aquarium: ['Coral Kingdom Set', 'Sunken Temple Set', 'Frozen Grotto Set', 'Volcanic Vent Set', 'Celestial Glow Set', 'Pirate Wreck Set', 'Kelp Forest Set', 'Abyss Lantern Set'],
  banner_legendary: ['Celestial Sovereign Set', 'Leviathan Bone Set', 'Golden Emperor Set', 'Kraken Ink Set', 'Ancient Guardian Set', 'Storm Serpent Set', 'Tideforged Set', 'Worldbreaker Set'],
};

const COSMETIC_RARITIES = ['Common', 'Uncommon', 'Rare', 'Epic', 'Legendary', 'Mythical', 'Celestial'];
export const CosmeticDefinitions = [];
for (const banner of CosmeticBanners) {
  const names = CosmeticNames[banner.id];
  names.forEach((name, index) => {
    CosmeticDefinitions.push({
      id: `${banner.id.replace('banner_', 'cos_')}_${index + 1}`,
      name,
      banner: banner.id,
      slot: banner.id.replace('banner_', '').replace('s', ''),
      rarity: COSMETIC_RARITIES[Math.min(COSMETIC_RARITIES.length - 1, index)],
      color: [0xd4af37, 0x5e7ce2, 0x9be7ff, 0xf4d03f, 0xff7f6f, 0x2b1d4f, 0xe25822, 0x8fbc8f][index % 8],
    });
  });
}

export const CosmeticDrops = {
  Common: 0.4,
  Uncommon: 0.25,
  Rare: 0.16,
  Epic: 0.1,
  Legendary: 0.055,
  Mythical: 0.025,
  Celestial: 0.01,
};

export const CrewRoles = [
  { id: 'captain', name: 'Captain', description: 'Ship management and navigation authority.', icon: '🧑‍✈️' },
  { id: 'navigator', name: 'Navigator', description: 'Improves route information and radar range.', icon: '🧭' },
  { id: 'gunner', name: 'Gunner', description: 'Improves cannon reload and accuracy.', icon: '💣' },
  { id: 'engineer', name: 'Engineer', description: 'Repairs hull between encounters.', icon: '🔧' },
  { id: 'fisherman', name: 'Fisherman', description: 'Passively catches fish while sailing.', icon: '🎣' },
  { id: 'lookout', name: 'Lookout', description: 'Detects giant creatures sooner.', icon: '🔭' },
  { id: 'quartermaster', name: 'Quartermaster', description: 'Expands effective cargo management.', icon: '📦' },
  { id: 'medic', name: 'Medic', description: 'Restores health after boss encounters.', icon: '⚕️' },
];

export const CrewDefinitions = [
  { id: 'crew_mira', name: 'Mira', role: 'navigator', skill: 3, cost: 900, icon: '🧭' },
  { id: 'crew_bolt', name: 'Bolt', role: 'gunner', skill: 4, cost: 1400, icon: '💣' },
  { id: 'crew_toby', name: 'Toby', role: 'engineer', skill: 2, cost: 600, icon: '🔧' },
  { id: 'crew_finn', name: 'Finn', role: 'fisherman', skill: 3, cost: 850, icon: '🎣' },
  { id: 'crew_ash', name: 'Ash', role: 'lookout', skill: 3, cost: 1000, icon: '🔭' },
  { id: 'crew_jack', name: 'Jack', role: 'quartermaster', skill: 4, cost: 1600, icon: '📦' },
  { id: 'crew_luna', name: 'Luna', role: 'medic', skill: 3, cost: 1200, icon: '⚕️' },
  { id: 'crew_blackfin', name: 'Blackfin', role: 'captain', skill: 5, cost: 3000, icon: '🧑‍✈️' },
];

export const GuildRanks = [
  { id: 'deckhand', name: 'Deckhand', minCatches: 0, reward: 0 },
  { id: 'angler', name: 'Angler', minCatches: 10, reward: 250 },
  { id: 'veteran', name: 'Veteran Angler', minCatches: 35, reward: 700 },
  { id: 'captain', name: 'Guild Captain', minCatches: 80, reward: 1800 },
  { id: 'legend', name: 'Living Legend', minCatches: 150, reward: 4000 },
];

export const ResearchRewards = [
  { samples: 5, coins: 150, label: 'Current Charts' },
  { samples: 15, coins: 450, label: 'Habitat Sonar' },
  { samples: 30, coins: 1000, label: 'Abyssal Depth Map' },
  { samples: 60, coins: 2500, label: 'Ancient Migration Route' },
];
