// WildlifeManager: Coordinates ambient marine fauna, pelagic predators, and sea creatures.

import * as THREE from 'three';
import { SharkAI } from './SharkAI.js';

export class WildlifeManager {
  constructor(options = {}) {
    this.waterLevel = options.waterLevel || 0.0;
    this.creatures = [];
    this.container = new THREE.Group();
    this.container.name = 'OceanWildlifeContainer';

    this._spawnDefaultOceanFauna();
  }

  _spawnDefaultOceanFauna() {
    // 1. North Apex Great White Shark (Deep open ocean)
    const greatWhite = new SharkAI({
      id: 'shark_apex_north',
      species: 'Great White Shark',
      waterLevel: this.waterLevel,
      position: { x: 0, y: this.waterLevel - 3.5, z: -340 },
      centerAnchor: { x: 0, z: -340 },
      patrolRadius: 50.0,
      patrolSpeed: 2.6,
      targetDepth: 3.8,
    });
    this.addCreature(greatWhite);

    // 2. East Outer Reef Hammerhead Shark
    const hammerhead = new SharkAI({
      id: 'shark_hammerhead_east',
      species: 'Hammerhead Shark',
      waterLevel: this.waterLevel,
      position: { x: 330, y: this.waterLevel - 4.0, z: 0 },
      centerAnchor: { x: 330, z: 0 },
      patrolRadius: 42.0,
      patrolSpeed: 2.8,
      targetDepth: 4.2,
    });
    this.addCreature(hammerhead);

    // 3. Southern Deep Trench Tiger Shark
    const tigerShark = new SharkAI({
      id: 'shark_tiger_south',
      species: 'Tiger Shark',
      waterLevel: this.waterLevel,
      position: { x: -240, y: this.waterLevel - 3.2, z: 250 },
      centerAnchor: { x: -240, z: 250 },
      patrolRadius: 38.0,
      patrolSpeed: 2.4,
      targetDepth: 3.5,
    });
    this.addCreature(tigerShark);
  }

  addCreature(creature) {
    if (!creature) return;
    this.creatures.push(creature);
    if (creature.mesh) {
      this.container.add(creature.mesh);
    }
  }

  getCreatures() {
    return [...this.creatures];
  }

  getNearestShark(pos) {
    if (!pos || this.creatures.length === 0) return null;
    let nearest = null;
    let minDist = Infinity;

    for (const c of this.creatures) {
      const d = c.position.distanceTo(pos);
      if (d < minDist) {
        minDist = d;
        nearest = c;
      }
    }

    return { creature: nearest, distance: minDist };
  }

  update(dt, player = null, boat = null, terrainCollider = null) {
    const playerPos = player ? player.position : null;
    const boatPos = boat ? boat.position : null;

    for (const creature of this.creatures) {
      creature.update(dt, playerPos, boatPos, terrainCollider);
    }
  }

  reset() {
    for (const c of this.creatures) {
      if (c.mesh && c.mesh.parent) {
        c.mesh.parent.remove(c.mesh);
      }
    }
    this.creatures = [];
    this._spawnDefaultOceanFauna();
  }
}

export default WildlifeManager;
