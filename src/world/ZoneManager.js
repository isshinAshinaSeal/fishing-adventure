// ZoneManager: Tracks open-world geographic regions, dynamic habitat associations,
// exploration milestones, and zone entry notifications.

import { OuterIslands } from './islands.js';
import { CityIsland } from './cityIsland.js';

export const WorldZones = [
  {
    id: 'starter_harbor',
    name: 'Emerald Cove & Pier',
    habitat: 'pier',
    center: { x: 5.0, z: -15.0 },
    radius: 75.0,
    description: 'The bustling wooden boardwalk and tranquil sheltered docks of the starting cove.',
  },
  {
    id: 'highland_springs',
    name: 'Highland Emerald Springs',
    habitat: 'secret',
    center: { x: 0.0, z: 0.0 },
    radius: 65.0,
    description: 'A serene alpine lake high up on the central mountain plateau, teeming with golden trout.',
  },
  {
    id: 'whispering_shallows',
    name: 'Whispering Shallows',
    habitat: 'shallow',
    center: { x: 0.0, z: -220.0 },
    radius: 95.0,
    description: 'Sunny white sands and gentle surf where drift sardines school near the tide lines.',
  },
  {
    id: 'coral_reef',
    name: 'Sunken Coral Shelf',
    habitat: 'reef',
    center: { x: 260.0, z: 0.0 },
    radius: 110.0,
    description: 'Vibrant turquoise shallows filled with colorful coral pillars and fighting snapper.',
  },
  {
    id: 'misty_atoll',
    name: 'Misty Outer Atolls',
    habitat: 'coast',
    center: { x: -240.0, z: -160.0 },
    radius: 110.0,
    description: 'Windswept rocky sea-stacks shrouded in fog where seasoned sea bass thrive.',
  },
  {
    id: 'pirate_cove',
    name: "Smuggler's Atoll & Pirate Cove",
    habitat: 'pirate',
    center: { x: 280.0, z: -320.0 },
    radius: 75.0,
    description: 'A secluded skull-shaped pirate haven across the open sea, frequented by smugglers, privateers, and boatwrights.',
  },
  ...OuterIslands.map((island) => ({
    id: island.id,
    name: island.name,
    habitat: island.habitat,
    center: { ...island.center },
    radius: island.radius + 55,
    description: island.description,
  })),
  {
    id: CityIsland.id,
    name: CityIsland.name,
    habitat: CityIsland.habitat,
    center: { ...CityIsland.center },
    radius: CityIsland.radius + 40,
    description: CityIsland.description,
  },
  {
    id: 'abyssal_trench',
    name: 'The Midnight Abyss',
    habitat: 'ocean',
    center: { x: 0.0, z: -350.0 },
    radius: 999.0, // Fallback outer ocean
    description: 'Inky, bottomless oceanic depths patrolled by pelagic predators and legendary bluefin.',
  },
];

export class ZoneManager {
  constructor(zones = WorldZones) {
    this.zones = Array.isArray(zones) ? zones : WorldZones;
    this.currentZone = this.zones[0];
    this.discoveredZones = new Set(['starter_harbor']);

    // Spatial hash: zone lookups happen every frame for fishing, travel and
    // HUD updates. Bucketing zones once by a coarse grid avoids scanning the
    // whole catalog (including distant frontier islands) for every query.
    this._cellSize = 128;
    this._cells = new Map();
    this._fallbackZone = null;
    this._buildSpatialIndex();

    // Event hooks
    this.onZoneEnter = null; // (zone, isNewDiscovery) => void
  }

  _buildSpatialIndex() {
    this._cells.clear();
    const size = this._cellSize;

    for (const zone of this.zones) {
      if (!zone || zone.id === 'abyssal_trench') continue;
      const minX = Math.floor((zone.center.x - zone.radius) / size);
      const maxX = Math.floor((zone.center.x + zone.radius) / size);
      const minZ = Math.floor((zone.center.z - zone.radius) / size);
      const maxZ = Math.floor((zone.center.z + zone.radius) / size);

      for (let cx = minX; cx <= maxX; cx++) {
        for (let cz = minZ; cz <= maxZ; cz++) {
          const key = `${cx}:${cz}`;
          let bucket = this._cells.get(key);
          if (!bucket) {
            bucket = [];
            this._cells.set(key, bucket);
          }
          bucket.push(zone);
        }
      }
    }
  }

  getZoneAt(x, z) {
    const size = this._cellSize;
    const key = `${Math.floor(x / size)}:${Math.floor(z / size)}`;
    const candidates = this._cells.get(key);

    if (candidates) {
      let closestZone = null;
      let minDistanceSq = Infinity;

      for (const zone of candidates) {
        const dx = x - zone.center.x;
        const dz = z - zone.center.z;
        const distanceSq = dx * dx + dz * dz;
        if (distanceSq <= zone.radius * zone.radius && distanceSq < minDistanceSq) {
          minDistanceSq = distanceSq;
          closestZone = zone;
        }
      }

      if (closestZone) return closestZone;
    }

    // Default to ocean abyss if beyond island bounds.
    if (!this._fallbackZone) {
      this._fallbackZone = this.zones.find((z) => z.id === 'abyssal_trench') || null;
    }
    return this._fallbackZone || this.zones[0];
  }

  update(position) {
    if (!position) return this.currentZone;

    const detected = this.getZoneAt(position.x, position.z);
    if (!this.currentZone || detected.id !== this.currentZone.id) {
      const isNew = !this.discoveredZones.has(detected.id);
      this.discoveredZones.add(detected.id);
      this.currentZone = detected;

      if (typeof this.onZoneEnter === 'function') {
        this.onZoneEnter(detected, isNew);
      }
    }

    return this.currentZone;
  }

  getCurrentZone() {
    return this.currentZone;
  }

  getDiscoveredZones() {
    return Array.from(this.discoveredZones);
  }

  getExplorationPercentage() {
    const total = this.zones.length;
    if (total === 0) return 100;
    return Math.round((this.discoveredZones.size / total) * 100);
  }

  serialize() {
    return {
      currentZoneId: this.currentZone ? this.currentZone.id : 'starter_harbor',
      discoveredZones: Array.from(this.discoveredZones),
    };
  }

  deserialize(data) {
    if (!data) return;
    this.discoveredZones.clear();
    if (Array.isArray(data.discoveredZones)) {
      for (const id of data.discoveredZones) {
        this.discoveredZones.add(id);
      }
    }
    if (data.currentZoneId) {
      const found = this.zones.find((z) => z.id === data.currentZoneId);
      if (found) this.currentZone = found;
    }
  }

  reset() {
    this.discoveredZones.clear();
    this.discoveredZones.add('starter_harbor');
    this.currentZone = this.zones[0];
  }
}

export default ZoneManager;
