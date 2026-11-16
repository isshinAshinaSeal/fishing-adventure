// GiantFishManager: spawns and updates giant roaming creatures, world
// encounters, ocean radar readings and habitat migration.

import { GiantCreature } from './GiantCreature.js';
import { GiantCreatureDefinitions } from '../expansion/content.js';

const ANCHORS = {
  blue_whale: { x: -120, z: -300 },
  ancient_megalodon: { x: 300, z: -340 },
  giant_manta: { x: 250, z: -80 },
  sea_serpent: { x: -300, z: -180 },
  golden_marlin: { x: 80, z: -360 },
  crystal_whale: { x: -280, z: -330 },
  abyssal_shark: { x: 340, z: -260 },
  ancient_turtle: { x: -180, z: -240 },
  storm_ray: { x: 180, z: -320 },
  leviathan_world: { x: 0, z: -380 },
  verdant_colossus: { x: 430, z: 240 },
  mangrove_hydra: { x: 470, z: 290 },
  frostfall_leviathan: { x: -430, z: -250 },
  aurora_whale: { x: -500, z: -180 },
  ember_behemoth: { x: 430, z: -250 },
  obsidian_serpent: { x: 490, z: -210 },
  celestial_stingray: { x: 350, z: 360 },
  world_turtle: { x: 430, z: 180 },
};

export class GiantFishManager {
  constructor(options = {}) {
    this.creatures = [];
    this.trackedId = null;
    this.scene = null;
    this.onNotification = null;
    this.onEncounter = null;
    this.onDiscover = null;
    this.onSurface = null;
    this.radarBonus = 0;
    this.maxActive = options.maxActive || 6;
    this._createCreatures();
  }

  _createCreatures() {
    for (const def of GiantCreatureDefinitions) {
      const anchor = ANCHORS[def.id] || { x: 0, z: -300 };
      this.creatures.push(new GiantCreature(def, { anchor: { x: anchor.x, y: -4, z: anchor.z } }));
    }
  }

  attach(scene) {
    this.scene = scene;
    if (!scene) return;
    for (const creature of this.creatures) {
      if (creature.mesh.parent !== scene) scene.add(creature.mesh);
    }
  }

  getCreatures() {
    return [...this.creatures];
  }

  getCreature(id) {
    return this.creatures.find((c) => c.id === id) || null;
  }

  update(dt, context = {}) {
    const player = context.player || null;
    const boat = context.boat || null;
    const playerPos = boat ? boat.position : player ? player.position : null;
    for (const creature of this.creatures) {
      // Distance-based AI budget: distant creatures update at a lower cadence.
      const dist = playerPos
        ? Math.hypot(playerPos.x - creature.position.x, playerPos.z - creature.position.z)
        : Infinity;
      creature._updateAccumulator = (creature._updateAccumulator || 0) + dt;
      const interval = dist < 140 ? 0 : 0.25;
      if (dist > 140 && creature._updateAccumulator < interval) continue;
      const step = dist > 140 ? creature._updateAccumulator : dt;
      creature._updateAccumulator = 0;
      creature.update(step, {
        player,
        boat,
        onEncounter: (c) => this._encounter(c),
        onDiscover: (c) => {
          if (typeof this.onDiscover === 'function') this.onDiscover(c);
        },
        onSurface: (c) => {
          if (typeof this.onSurface === 'function') this.onSurface(c);
        },
      });
    }
  }

  _encounter(creature) {
    if (typeof this.onNotification === 'function') {
      this.onNotification(`World encounter: ${creature.name} (${creature.definition.sizeClass}) is nearby!`);
    }
    if (typeof this.onEncounter === 'function') this.onEncounter(creature);
  }

  setRadarBonus(bonus) {
    this.radarBonus = Math.max(0, bonus);
  }

  getRadar(playerPosition, options = {}) {
    if (!playerPosition) return [];
    const range = options.range || 220 + this.radarBonus;
    return this.creatures
      .map((creature) => {
        const dx = creature.position.x - playerPosition.x;
        const dz = creature.position.z - playerPosition.z;
        const distance = Math.hypot(dx, dz);
        const bearing = (Math.atan2(dx, dz) * 180 / Math.PI + 360) % 360;
        const directions = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
        const direction = directions[Math.round(bearing / 45) % 8];
        return {
          id: creature.id,
          name: creature.discovered ? creature.name : 'Unknown Giant',
          icon: creature.discovered ? creature.definition.icon : '❓',
          category: creature.definition.sizeClass,
          state: creature.state,
          stateLabel: creature.getStatus().stateLabel,
          depth: creature.definition.depth,
          distance: Number(distance.toFixed(1)),
          distanceBand: distance < 60 ? 'Very close' : distance < 120 ? 'Near' : distance < 220 ? 'Distant' : 'Far',
          direction,
          bearing: Math.round(bearing),
          status: creature.isEncountered ? 'Encounter' : creature.discovered ? 'Tracked' : 'Unidentified',
          canEngage: Boolean(creature.definition.bossId) && distance < 140,
          bossId: creature.definition.bossId || null,
          isTracked: creature.id === this.trackedId,
          inRange: distance <= range,
        };
      })
      .filter((r) => r.inRange)
      .sort((a, b) => a.distance - b.distance);
  }

  track(id) {
    this.trackedId = id;
    const creature = this.getCreature(id);
    if (!creature) return { success: false, reason: 'Creature not found' };
    creature.discovered = true;
    if (typeof this.onNotification === 'function') this.onNotification(`Tracking ${creature.name}`);
    return { success: true, creature: creature.getStatus() };
  }

  getTracked() {
    return this.trackedId ? this.getCreature(this.trackedId) : null;
  }

  reset() {
    this.trackedId = null;
    for (const creature of this.creatures) creature.reset();
  }

  serialize() {
    return {
      trackedId: this.trackedId,
      creatures: this.creatures.map((c) => ({
        id: c.id,
        discovered: c.discovered,
        isEncountered: c.isEncountered,
      })),
    };
  }

  deserialize(data) {
    if (!data) return;
    this.trackedId = data.trackedId || null;
    if (Array.isArray(data.creatures)) {
      for (const saved of data.creatures) {
        const creature = this.getCreature(saved.id);
        if (creature) {
          creature.discovered = Boolean(saved.discovered);
          creature.isEncountered = Boolean(saved.isEncountered);
        }
      }
    }
  }
}

export default GiantFishManager;
