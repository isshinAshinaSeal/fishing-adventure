// Gem Exchange — the hard-currency sink.
//
// Gems are earned from story chapters, world bosses and rare caches. This
// catalog turns them into things coins cannot buy: expedition-grade tools, the
// two celestial hulls and the final rod.

export const GemOffers = [
  {
    id: 'gem_coins_pouch',
    name: 'Coin Pouch',
    icon: '💰',
    gems: 1,
    description: 'Exchange one gem for 250 coins. The honest way to turn a hard currency into a soft one.',
    grant: { coins: 250 },
  },
  {
    id: 'gem_coins_chest',
    name: 'Coin Chest',
    icon: '🧰',
    gems: 5,
    description: 'Exchange five gems for 1,600 coins — a better rate for a bigger purse.',
    grant: { coins: 1600 },
  },
  {
    id: 'gem_xp_tide_chart',
    name: 'Tide Chart of Ages',
    icon: '📜',
    gems: 3,
    description: 'An annotated chart of every tide. Grants 600 angler XP instantly.',
    grant: { xp: 600 },
  },
  {
    id: 'gem_tool_gem_finder',
    name: 'Gemfinder Array',
    icon: '🔮',
    gems: 8,
    description: 'Unlocks the gem-locked Gemfinder Array fishing tool (+50% finder, +25% luck).',
    grant: { tool: 'tool_gem_finder' },
  },
  {
    id: 'gem_tool_prism_net',
    name: 'Prism Gem Net',
    icon: '💎',
    gems: 12,
    description: 'Unlocks the gem-locked Prism Gem Net (+50% bonus-catch chance).',
    grant: { tool: 'tool_prism_net' },
  },
  {
    id: 'gem_rod_worldheart',
    name: 'Worldheart Celestial Rod',
    icon: '🎣',
    gems: 25,
    description: 'Unlocks the final expedition rod: every habitat, every rarity, every tide.',
    grant: { rod: 'rod_worldheart_2' },
  },
  {
    id: 'gem_boat_leviathan',
    name: 'Leviathan Hunter',
    icon: '🚢',
    gems: 40,
    description: 'Unlocks the serpent-reef flagship and delivers it to the Serpent Reef mooring.',
    grant: { boat: 'boat_exp_leviathan_hunter' },
  },
  {
    id: 'gem_boat_aurora_flagship',
    name: 'Aurora Expedition Flagship',
    icon: '🛳️',
    gems: 60,
    description: 'Unlocks the aurora flagship with sonar, radar, cannons and ten berths.',
    grant: { boat: 'boat_exp_aurora_flagship' },
  },
];

export function getGemOffer(offerId) {
  return GemOffers.find((offer) => offer.id === offerId) || null;
}

export default GemOffers;
