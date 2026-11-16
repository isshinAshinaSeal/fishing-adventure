// Farming content: crops, growth times, harvest values and farm tool upgrades.
// Produce item ids are registered in the shared material catalog so harvests
// flow through the backpack, recipes and the auction like any other item.

export const CropDefinitions = [
  {
    id: 'turnip', name: 'Harbor Turnip', icon: '🥬', rarity: 'Common',
    cost: 25, growTime: 55, yieldMin: 2, yieldMax: 3, produceId: 'produce_turnip',
    xp: 8, coinReward: 12, color: 0x8fbf6a,
    description: 'A fast, forgiving rooftop crop. Perfect for a first harvest.',
  },
  {
    id: 'carrot', name: 'Sunlit Carrot', icon: '🥕', rarity: 'Common',
    cost: 35, growTime: 75, yieldMin: 2, yieldMax: 4, produceId: 'produce_carrot',
    xp: 10, coinReward: 16, color: 0xf08a24,
    description: 'Sweet city carrots that grow straight and bright.',
  },
  {
    id: 'potato', name: 'Cloud Potato', icon: '🥔', rarity: 'Common',
    cost: 40, growTime: 90, yieldMin: 3, yieldMax: 5, produceId: 'produce_potato',
    xp: 12, coinReward: 20, color: 0xb98a5a,
    description: 'A dependable staple. Stores well and sells even better.',
  },
  {
    id: 'wheat', name: 'Skyline Wheat', icon: '🌾', rarity: 'Uncommon',
    cost: 50, growTime: 120, yieldMin: 3, yieldMax: 5, produceId: 'produce_wheat',
    xp: 16, coinReward: 26, color: 0xe0c060,
    description: 'Golden grain for the city’s bakeries and taverns.',
  },
  {
    id: 'tomato', name: 'Rooftop Tomato', icon: '🍅', rarity: 'Uncommon',
    cost: 70, growTime: 140, yieldMin: 3, yieldMax: 6, produceId: 'produce_tomato',
    xp: 20, coinReward: 34, color: 0xe04b38,
    description: 'Vine-ripened under the city sun. The cafe buys every crate.',
  },
  {
    id: 'corn', name: 'Golden Corn', icon: '🌽', rarity: 'Uncommon',
    cost: 65, growTime: 150, yieldMin: 2, yieldMax: 4, produceId: 'produce_corn',
    xp: 20, coinReward: 36, color: 0xf2c14e,
    description: 'Tall stalks that love the open rooftop wind.',
  },
  {
    id: 'rice', name: 'Terrace Rice', icon: '🌱', rarity: 'Rare',
    cost: 80, growTime: 170, yieldMin: 4, yieldMax: 6, produceId: 'produce_rice',
    xp: 25, coinReward: 44, color: 0x9fd18a,
    description: 'A thirsty crop, but a generous one when watered well.',
  },
  {
    id: 'strawberry', name: 'Glasshouse Strawberry', icon: '🍓', rarity: 'Rare',
    cost: 90, growTime: 180, yieldMin: 4, yieldMax: 7, produceId: 'produce_strawberry',
    xp: 28, coinReward: 50, color: 0xe23b5a,
    description: 'Fragile, fragrant and worth a small fortune at market.',
  },
  {
    id: 'chili', name: 'Ember Chili', icon: '🌶️', rarity: 'Rare',
    cost: 120, growTime: 210, yieldMin: 3, yieldMax: 5, produceId: 'produce_chili',
    xp: 34, coinReward: 66, color: 0xc62828,
    description: 'The cafe uses these in a stew that can wake a sleeping harbor.',
  },
  {
    id: 'pumpkin', name: 'Harvest Pumpkin', icon: '🎃', rarity: 'Epic',
    cost: 110, growTime: 220, yieldMin: 1, yieldMax: 2, produceId: 'produce_pumpkin',
    xp: 38, coinReward: 78, color: 0xe07a1f,
    description: 'A heavy, slow crop with a festival-sized price tag.',
  },
  {
    id: 'grape', name: 'Skyvine Grape', icon: '🍇', rarity: 'Epic',
    cost: 140, growTime: 240, yieldMin: 4, yieldMax: 6, produceId: 'produce_grape',
    xp: 42, coinReward: 88, color: 0x7b3f9e,
    description: 'Trellised city grapes with a bright, expensive sweetness.',
  },
  {
    id: 'sunflower', name: 'Aurelia Sunflower', icon: '🌻', rarity: 'Legendary',
    cost: 250, growTime: 300, yieldMin: 2, yieldMax: 3, produceId: 'produce_sunflower',
    xp: 70, coinReward: 150, color: 0xffd54f,
    description: 'The signature crop of Aurelia Heights. Slow, tall and lucrative.',
  },
];

export const FarmToolDefinitions = [
  {
    id: 'farm_can_tin', name: 'Tin Watering Can', type: 'watering_can', icon: '🪣', tier: 1,
    cost: 0, growthBonus: 0.0, description: 'A basic can. Watering speeds growth by 50%.',
  },
  {
    id: 'farm_can_copper', name: 'Copper Watering Can', type: 'watering_can', icon: '🪣', tier: 2,
    cost: 700, growthBonus: 0.15, description: 'A wider rose and a tighter spout. +15% watered growth.',
  },
  {
    id: 'farm_can_brass', name: 'Brass Irrigation Can', type: 'watering_can', icon: '🚿', tier: 3,
    cost: 2200, growthBonus: 0.35, description: 'Pressurised brass irrigation. +35% watered growth.',
  },
  {
    id: 'farm_can_sky', name: 'Skyline Mist Can', type: 'watering_can', icon: '🌫️', tier: 4,
    cost: 6500, growthBonus: 0.6, description: 'A fine mist system that nearly doubles watered growth.',
  },
  {
    id: 'farm_hoe_wood', name: 'Wooden Hoe', type: 'hoe', icon: '🪓', tier: 1,
    cost: 0, yieldBonus: 0, description: 'A plain hoe. Harvests exactly what the plot grew.',
  },
  {
    id: 'farm_hoe_iron', name: 'Iron Garden Hoe', type: 'hoe', icon: '⚒️', tier: 2,
    cost: 900, yieldBonus: 1, description: 'A deeper cut that adds +1 produce to every harvest.',
  },
  {
    id: 'farm_hoe_steel', name: 'Steel Harvest Hoe', type: 'hoe', icon: '⛏️', tier: 3,
    cost: 2800, yieldBonus: 2, description: 'Tempered steel. +2 produce to every harvest.',
  },
  {
    id: 'farm_hoe_golden', name: 'Golden Harvest Hoe', type: 'hoe', icon: '🏆', tier: 4,
    cost: 7500, yieldBonus: 3, description: 'The city’s finest hoe. +3 produce to every harvest.',
  },
];

export function getCropDefinition(id) {
  return CropDefinitions.find((crop) => crop.id === id) || null;
}

export function getFarmToolDefinition(id) {
  return FarmToolDefinitions.find((tool) => tool.id === id) || null;
}

export default CropDefinitions;
