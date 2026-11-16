// CharacterCustomization: appearance palettes for the start lobby plus a
// direct-purchase outfit shop. Cosmetics are visual only and never alter stats.

import { AvatarOptions } from '../entities/AvatarFactory.js';

export const CharacterPalettes = {
  skin: [
    { id: 'peach', label: 'Peach', color: 0xffccaa },
    { id: 'sand', label: 'Warm Sand', color: 0xe6b98a },
    { id: 'amber', label: 'Amber', color: 0xc98a5e },
    { id: 'umber', label: 'Umber', color: 0x8d5a3b },
    { id: 'deep', label: 'Deep Bronze', color: 0x5f3a28 },
    { id: 'cool', label: 'Cool Ivory', color: 0xf2d7c4 },
  ],
  shirt: [
    { id: 'harbor_blue', label: 'Harbor Blue', color: 0x3377aa },
    { id: 'coral', label: 'Coral Red', color: 0xc94f4f },
    { id: 'sea_green', label: 'Sea Green', color: 0x2e8b73 },
    { id: 'mustard', label: 'Mustard', color: 0xd9a441 },
    { id: 'plum', label: 'Storm Plum', color: 0x6a4a7a },
    { id: 'charcoal', label: 'Charcoal', color: 0x37414d },
    { id: 'cream', label: 'Sail Cream', color: 0xe6dfc8 },
    { id: 'pirate_red', label: 'Pirate Red', color: 0x8b1e1e },
  ],
  pants: [
    { id: 'navy', label: 'Navy', color: 0x334455 },
    { id: 'brown', label: 'Deck Brown', color: 0x5b4031 },
    { id: 'olive', label: 'Olive', color: 0x556b3f },
    { id: 'black', label: 'Black', color: 0x222222 },
    { id: 'denim', label: 'Faded Denim', color: 0x4f6d8a },
    { id: 'sand', label: 'Sand', color: 0xb09a78 },
  ],
  hat: [
    { id: 'straw', label: 'Straw', color: 0xddbb77 },
    { id: 'black', label: 'Black Tricorne', color: 0x24242a },
    { id: 'red', label: 'Crimson Hat', color: 0x9e2b25 },
    { id: 'teal', label: 'Teal Cap', color: 0x2e8b8b },
    { id: 'cream', label: 'Cream Sunhat', color: 0xefe4c3 },
    { id: 'pirate', label: 'Pirate Leather', color: 0x4b3628 },
  ],
  band: [
    { id: 'red', label: 'Red Band', color: 0xaa3333 },
    { id: 'gold', label: 'Gold Band', color: 0xd9a441 },
    { id: 'blue', label: 'Blue Band', color: 0x3b6ea8 },
    { id: 'green', label: 'Green Band', color: 0x3f7f52 },
    { id: 'black', label: 'Black Band', color: 0x1f1f24 },
    { id: 'white', label: 'White Band', color: 0xf0ead8 },
  ],
  faceStyle: AvatarOptions.faceStyle,
  hairStyle: AvatarOptions.hairStyle,
  facialHair: AvatarOptions.facialHair,
  backpackStyle: AvatarOptions.backpackStyle,
  hatStyle: AvatarOptions.hatStyle,
};

export const SkinShopCatalog = [
  {
    id: 'outfit_deckhand',
    name: 'Deckhand Starter',
    icon: '🧢',
    price: 0,
    description: 'The reliable harbor look: sun-faded blue, sturdy trousers and a straw hat.',
    appearance: { skinColor: 0xffccaa, shirtColor: 0x3377aa, pantsColor: 0x334455, hatColor: 0xddbb77, bandColor: 0xaa3333 },
  },
  {
    id: 'outfit_coral',
    name: 'Coral Coast Angler',
    icon: '🪸',
    price: 50,
    description: 'A bright coral shirt with sand-coloured trousers for long days on the reef.',
    appearance: { skinColor: 0xe6b98a, shirtColor: 0xc94f4f, pantsColor: 0xb09a78, hatColor: 0xefe4c3, bandColor: 0x3b6ea8 },
  },
  {
    id: 'outfit_kelp',
    name: 'Kelp Forest Ranger',
    icon: '🌿',
    price: 150,
    description: 'Muted sea-green layers that disappear into the kelp beds.',
    appearance: { skinColor: 0xc98a5e, shirtColor: 0x2e8b73, pantsColor: 0x556b3f, hatColor: 0x4b3628, bandColor: 0xd9a441 },
  },
  {
    id: 'outfit_storm',
    name: 'Storm Captain',
    icon: '⛈️',
    price: 300,
    description: 'A dark storm-plum coat, charcoal trousers and a gold band for the helm.',
    appearance: { skinColor: 0x8d5a3b, shirtColor: 0x6a4a7a, pantsColor: 0x222222, hatColor: 0x24242a, bandColor: 0xd9a441 },
  },
  {
    id: 'outfit_pirate',
    name: 'Corsair Quartermaster',
    icon: '🏴‍☠️',
    price: 600,
    description: 'Red coat, deck-brown trousers and a leather tricorne. Sable may even salute.',
    appearance: { skinColor: 0x8d5a3b, shirtColor: 0x8b1e1e, pantsColor: 0x5b4031, hatColor: 0x24242a, bandColor: 0xd9a441 },
  },
  {
    id: 'outfit_ice',
    name: 'Frostfall Expedition',
    icon: '🧊',
    price: 1200,
    description: 'Cream thermal layers and cool ivory skin for the polar shelf.',
    appearance: { skinColor: 0xf2d7c4, shirtColor: 0xe6dfc8, pantsColor: 0x4f6d8a, hatColor: 0xefe4c3, bandColor: 0x3b6ea8 },
  },
  {
    id: 'outfit_celestial',
    name: 'Celestial Navigator',
    icon: '🌌',
    price: 2500,
    description: 'A storm-plum navigator coat with teal cap and a gold constellation band.',
    appearance: { skinColor: 0x5f3a28, shirtColor: 0x6a4a7a, pantsColor: 0x334455, hatColor: 0x2e8b8b, bandColor: 0xd9a441 },
  },
  {
    id: 'outfit_golden',
    name: 'Golden Leviathan',
    icon: '👑',
    price: 5000,
    description: 'The legendary look: sail-cream shirt, black trousers and a crimson captain’s hat.',
    appearance: { skinColor: 0xc98a5e, shirtColor: 0xe6dfc8, pantsColor: 0x222222, hatColor: 0x9e2b25, bandColor: 0xd9a441 },
  },
];

export class CharacterCustomization {
  constructor(player = null) {
    this.player = player;
    this.ownedSkinIds = new Set(['outfit_deckhand']);
    this.equippedSkinId = null;
    this.onNotification = null;
    this.onChange = null;
  }

  getCatalog() {
    return SkinShopCatalog.map((item) => ({
      ...item,
      isOwned: this.ownedSkinIds.has(item.id),
      isEquipped: this.equippedSkinId === item.id,
    }));
  }

  purchaseSkin(skinId, economy) {
    const skin = SkinShopCatalog.find((item) => item.id === skinId);
    if (!skin) return { success: false, reason: 'Unknown outfit' };
    if (this.ownedSkinIds.has(skinId)) return { success: false, reason: 'Outfit already owned' };
    if (!economy) return { success: false, reason: 'Invalid economy system' };
    if (!economy.canAfford(skin.price)) {
      return { success: false, reason: `Need ${skin.price} coins, but only have ${economy.getCoins()}` };
    }
    if (!economy.spendCoins(skin.price)) return { success: false, reason: 'Transaction failed' };

    this.ownedSkinIds.add(skinId);
    this.equipSkin(skinId);
    this._notify(`${skin.name} purchased and equipped`);
    this._changed();
    return { success: true, skin, remainingCoins: economy.getCoins() };
  }

  equipSkin(skinId) {
    const skin = SkinShopCatalog.find((item) => item.id === skinId);
    if (!skin) return { success: false, reason: 'Unknown outfit' };
    if (!this.ownedSkinIds.has(skinId)) return { success: false, reason: 'Outfit not owned' };
    if (this.player) this.player.setAppearance(skin.appearance);
    this.equippedSkinId = skinId;
    this._changed();
    return { success: true, skin };
  }

  applyCustom(patch) {
    if (!this.player) return null;
    this.equippedSkinId = null;
    const appearance = this.player.setAppearance(patch);
    this._changed();
    return appearance;
  }

  getEquippedSkin() {
    return SkinShopCatalog.find((item) => item.id === this.equippedSkinId) || null;
  }

  serialize() {
    return {
      ownedSkinIds: Array.from(this.ownedSkinIds),
      equippedSkinId: this.equippedSkinId,
    };
  }

  deserialize(data) {
    if (!data || typeof data !== 'object') return;
    this.ownedSkinIds = new Set(Array.isArray(data.ownedSkinIds) ? data.ownedSkinIds : ['outfit_deckhand']);
    this.ownedSkinIds.add('outfit_deckhand');
    this.equippedSkinId = typeof data.equippedSkinId === 'string' ? data.equippedSkinId : null;
    if (this.equippedSkinId) {
      const skin = SkinShopCatalog.find((item) => item.id === this.equippedSkinId);
      if (skin && this.player) this.player.setAppearance(skin.appearance);
    }
  }

  reset() {
    this.ownedSkinIds = new Set(['outfit_deckhand']);
    this.equippedSkinId = null;
    if (this.player) this.player.setAppearance(SkinShopCatalog[0].appearance);
  }

  _notify(message) {
    if (typeof this.onNotification === 'function') this.onNotification(message);
  }

  _changed() {
    if (typeof this.onChange === 'function') this.onChange();
  }
}

export default CharacterCustomization;
