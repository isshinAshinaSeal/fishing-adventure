// FastTravelManager: Unlockable teleport network with cooldowns, favorites,
// habitat routing, and validation against discovered destinations.

export const TravelDestinations = [
  {
    id: 'harbor',
    name: 'Main Harbor',
    icon: '⚓',
    position: { x: 5.0, y: 1.0, z: -12.0 },
    habitat: 'pier',
    habitats: ['pier', 'coast'],
    requiredZone: null,
    requiredLevel: 1,
    description: 'The starter marina boardwalk, tackle hut, and fishmonger pier.',
  },
  {
    id: 'coral_gate',
    name: 'Coral Gate',
    icon: '🪸',
    position: { x: 205.0, y: 0, z: -55.0 },
    habitat: 'reef',
    habitats: ['reef', 'azure'],
    requiredZone: 'coral_reef',
    requiredLevel: 1,
    description: 'A salt-worn arch above the turquoise coral shelf and its reef fishing spot.',
  },
  {
    id: 'jungle_portal',
    name: 'Jungle Portal',
    icon: '🌿',
    position: { x: -238.0, y: 0, z: 0.0 },
    habitat: 'jungle',
    habitats: ['jungle', 'secret'],
    requiredZone: 'highland_springs',
    requiredLevel: 1,
    description: 'Moss-covered stones beside the highland spring and jungle river mouth.',
  },
  {
    id: 'frozen_gate',
    name: 'Frozen Gate',
    icon: '❄️',
    position: { x: -166.0, y: 0, z: -166.0 },
    habitat: 'frozen',
    habitats: ['frozen'],
    requiredZone: 'misty_atoll',
    requiredLevel: 2,
    description: 'A frost-rimmed gate where the northern fjord ice meets the sea.',
  },
  {
    id: 'volcano_gate',
    name: 'Volcano Gate',
    icon: '🌋',
    position: { x: 166.0, y: 0, z: -166.0 },
    habitat: 'volcanic',
    habitats: ['volcanic', 'pirate'],
    requiredZone: null,
    requiredLevel: 3,
    description: 'Black basalt pillars overlooking the steaming ember coast.',
  },
  {
    id: 'deep_sea_gate',
    name: 'Deep Sea Gate',
    icon: '🌊',
    position: { x: 330.0, y: 0, z: -320.0 },
    habitat: 'abyss',
    habitats: ['abyss', 'ocean', 'deep_sea'],
    requiredZone: 'abyssal_trench',
    requiredLevel: 4,
    description: 'A wind-lashed platform at the edge of the midnight abyss.',
  },
  {
    id: 'ancient_gate',
    name: 'Ancient Gate',
    icon: '🏛️',
    position: { x: 280.0, y: 0, z: -266.0 },
    habitat: 'ruins',
    habitats: ['ruins'],
    requiredZone: 'pirate_cove',
    requiredLevel: 5,
    description: 'Sunken ruin stones on Smuggler’s Atoll, humming with old sea magic.',
  },
  {
    id: 'verdant_gate',
    name: 'Verdant Crown Gate',
    icon: '🌿',
    position: { x: 430.0, y: 0, z: 285.0 },
    habitat: 'kelp',
    habitats: ['kelp', 'mangrove', 'jungle'],
    requiredZone: 'verdant_crown',
    requiredLevel: 3,
    description: 'A root-woven gate on the warm outer island of kelp forests and mangroves.',
  },
  {
    id: 'frostfall_gate',
    name: 'Frostfall Gate',
    icon: '❄️',
    position: { x: -430.0, y: 0, z: -212.0 },
    habitat: 'polar',
    habitats: ['polar', 'frozen'],
    requiredZone: 'frostfall_isle',
    requiredLevel: 5,
    description: 'A blue-ice arch on the polar island beyond the northern shipping lanes.',
  },
  {
    id: 'ember_gate',
    name: 'Ember Isle Gate',
    icon: '🌋',
    position: { x: 430.0, y: 0, z: -215.0 },
    habitat: 'volcanic',
    habitats: ['volcanic', 'ember'],
    requiredZone: 'ember_isle',
    requiredLevel: 4,
    description: 'A basalt gate above the glowing vents of the eastern volcanic island.',
  },
  {
    id: 'sunspire_gate',
    name: 'Sunspire Cay Gate',
    icon: '🌴',
    position: { x: 330.0, y: 0, z: 144.0 },
    habitat: 'kelp',
    habitats: ['kelp', 'shallow'],
    requiredZone: 'sunspire_cay',
    requiredLevel: 1,
    description: 'A driftwood gate on a sunny little cay with a palm grove and kelp shelf.',
  },
  {
    id: 'mistveil_gate',
    name: 'Mistveil Cay Gate',
    icon: '🌫️',
    position: { x: -320.0, y: 0, z: 162.0 },
    habitat: 'mangrove',
    habitats: ['mangrove', 'jungle'],
    requiredZone: 'mistveil_cay',
    requiredLevel: 2,
    description: 'A fog-softened gate among mangrove roots and quiet channels.',
  },
  {
    id: 'glassice_gate',
    name: 'Glassice Cay Gate',
    icon: '🧊',
    position: { x: -300.0, y: 0, z: 12.0 },
    habitat: 'polar',
    habitats: ['polar', 'frozen'],
    requiredZone: 'glassice_cay',
    requiredLevel: 3,
    description: 'A clear-ice gate on a tiny polar cay with glassy fishing holes.',
  },
  {
    id: 'cinder_gate',
    name: 'Cinder Cay Gate',
    icon: '🔥',
    position: { x: 320.0, y: 0, z: -2.0 },
    habitat: 'volcanic',
    habitats: ['volcanic', 'ember'],
    requiredZone: 'cinder_cay',
    requiredLevel: 2,
    description: 'A black obsidian gate on a smouldering little volcanic cay.',
  },
  {
    id: 'celestial_gate',
    name: 'Celestial Portal',
    icon: '🌟',
    position: { x: -68.0, y: 0, z: -226.0 },
    habitat: 'celestial',
    habitats: ['celestial'],
    requiredZone: 'highland_springs',
    requiredLevel: 8,
    description: 'A rune ring on the central ridge that opens only to veteran anglers.',
  },
];

export class FastTravelManager {
  constructor(options = {}) {
    this.destinations = options.destinations || TravelDestinations;
    this.cooldownSeconds = options.cooldownSeconds !== undefined ? options.cooldownSeconds : 4;
    this.unlockedIds = new Set(['harbor']);
    this.favorites = new Set();
    this.cooldownRemaining = 0;
    this.lastDestinationId = null;
    this.travelCount = 0;

    // Event hooks
    this.onUnlock = null; // (destination) => void
    this.onTravel = null; // (destination, player) => void
  }

  getDestination(id) {
    return this.destinations.find((d) => d.id === id) || null;
  }

  isUnlocked(id) {
    return this.unlockedIds.has(id);
  }

  /**
   * Unlocks destinations whose required zone has been discovered,
   * plus level-gated destinations for sufficiently veteran anglers.
   */
  updateDiscoveries(zoneManager, playerLevel = 1) {
    if (!zoneManager) return [];
    const discovered = new Set(zoneManager.getDiscoveredZones());
    const newlyUnlocked = [];
    for (const dest of this.destinations) {
      if (this.unlockedIds.has(dest.id)) continue;
      const zoneOk = !dest.requiredZone || discovered.has(dest.requiredZone);
      const levelOk = playerLevel >= (dest.requiredLevel || 1);
      if (zoneOk && levelOk) {
        this.unlockedIds.add(dest.id);
        newlyUnlocked.push(dest);
        if (typeof this.onUnlock === 'function') this.onUnlock(dest);
      }
    }
    return newlyUnlocked;
  }

  /**
   * Physical proximity also unlocks a gate (walking there counts as discovering it).
   */
  updateProximity(player, terrain = null) {
    if (!player) return [];
    const newlyUnlocked = [];
    for (const dest of this.destinations) {
      if (this.unlockedIds.has(dest.id)) continue;
      const dx = player.position.x - dest.position.x;
      const dz = player.position.z - dest.position.z;
      if (Math.hypot(dx, dz) <= 7.5) {
        this.unlockedIds.add(dest.id);
        newlyUnlocked.push(dest);
        if (typeof this.onUnlock === 'function') this.onUnlock(dest);
      }
    }
    return newlyUnlocked;
  }

  update(dt) {
    if (this.cooldownRemaining > 0) {
      this.cooldownRemaining = Math.max(0, this.cooldownRemaining - (dt || 0));
    }
  }

  canTravel(id) {
    const dest = this.getDestination(id);
    if (!dest) return { allowed: false, reason: 'Unknown destination' };
    if (!this.unlockedIds.has(id)) return { allowed: false, reason: 'Destination not yet discovered' };
    if (this.cooldownRemaining > 0) {
      return { allowed: false, reason: `Teleport recharging (${this.cooldownRemaining.toFixed(1)}s)` };
    }
    return { allowed: true, destination: dest };
  }

  /**
   * Teleports the player to a discovered destination, clamped to solid ground.
   */
  travel(player, id, terrain = null) {
    const check = this.canTravel(id);
    if (!check.allowed) return { success: false, reason: check.reason };
    if (!player || !player.position) return { success: false, reason: 'Invalid player' };

    const dest = check.destination;
    let y = dest.position.y;
    if (terrain) {
      const ground = terrain.sampleHeight(dest.position.x, dest.position.z);
      y = Math.max(ground, terrain.waterLevel || 0) + 0.1;
    } else if (player.position && dest.position.y === 0) {
      y = 0.1;
    }

    player.position.set(dest.position.x, y, dest.position.z);
    if (player.velocity) player.velocity.set(0, 0, 0);
    if (player.horizontalVelocity) player.horizontalVelocity.set(0, 0);
    player.isGrounded = true;
    player.facingAngle = 0.0;
    player.targetFacingAngle = 0.0;

    this.cooldownRemaining = this.cooldownSeconds;
    this.lastDestinationId = id;
    this.travelCount += 1;

    if (typeof this.onTravel === 'function') this.onTravel(dest, player);
    return { success: true, destination: dest, position: { x: dest.position.x, y, z: dest.position.z } };
  }

  /**
   * Routes the player to the nearest destination that matches a fish habitat.
   * Used by Fish Index "Travel to Habitat".
   */
  findDestinationForHabitat(habitat) {
    if (!habitat) return null;
    const habitats = Array.isArray(habitat) ? habitat : [habitat];
    let best = null;
    for (const dest of this.destinations) {
      const destHabitats = dest.habitats || [dest.habitat];
      if (!habitats.some((h) => destHabitats.includes(h))) continue;
      if (!best || (dest.requiredLevel || 1) < (best.requiredLevel || 1)) best = dest;
    }
    return best;
  }

  travelToHabitat(player, habitat, terrain = null) {
    const dest = this.findDestinationForHabitat(habitat);
    if (!dest) return { success: false, reason: 'No travel gate near this habitat' };
    if (!this.isUnlocked(dest.id)) {
      return { success: false, reason: `Discover ${dest.name} first` };
    }
    return this.travel(player, dest.id, terrain);
  }

  toggleFavorite(id) {
    if (!this.getDestination(id)) return false;
    if (this.favorites.has(id)) {
      this.favorites.delete(id);
      return false;
    }
    this.favorites.add(id);
    return true;
  }

  getDestinations() {
    return this.destinations.map((dest) => ({
      ...dest,
      isUnlocked: this.unlockedIds.has(dest.id),
      isFavorite: this.favorites.has(dest.id),
      isLastVisited: this.lastDestinationId === dest.id,
    }));
  }

  serialize() {
    return {
      unlockedIds: Array.from(this.unlockedIds),
      favorites: Array.from(this.favorites),
      lastDestinationId: this.lastDestinationId,
      travelCount: this.travelCount,
    };
  }

  deserialize(data) {
    if (!data) return;
    this.unlockedIds.clear();
    this.unlockedIds.add('harbor');
    if (Array.isArray(data.unlockedIds)) {
      for (const id of data.unlockedIds) {
        if (this.getDestination(id)) this.unlockedIds.add(id);
      }
    }
    this.favorites.clear();
    if (Array.isArray(data.favorites)) {
      for (const id of data.favorites) {
        if (this.getDestination(id)) this.favorites.add(id);
      }
    }
    this.lastDestinationId = data.lastDestinationId || null;
    this.travelCount = Number(data.travelCount) || 0;
    this.cooldownRemaining = 0;
  }

  reset() {
    this.unlockedIds.clear();
    this.unlockedIds.add('harbor');
    this.favorites.clear();
    this.cooldownRemaining = 0;
    this.lastDestinationId = null;
    this.travelCount = 0;
  }
}

export default FastTravelManager;
