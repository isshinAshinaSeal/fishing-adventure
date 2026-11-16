// TerrainCollider: Fast analytical procedural heightmap, raycasting, and collision resolution.
// Fully deterministic and runnable in both WebGL browser and headless Node.js test runners.

import { Config } from '../config.js';
import { OuterIslands, sampleOuterIslandHeight } from './islands.js';
import { CityIsland, sampleCityIslandHeight } from './cityIsland.js';
import { sampleFrontierIslandHeight } from './frontierIslands.js';

export class TerrainCollider {
  constructor(config = Config.world) {
    this.islandRadius = config.islandRadius || 280;
    this.maxHeight = config.maxHeight || 28.0;
    this.waterLevel = config.waterLevel || 0.0;
    this.seabedDepth = -14.0;

    // Second Island: Smuggler's Atoll & Pirate's Haven
    this.pirateIsland = {
      center: { x: 280, z: -320 },
      radius: 68.0,
      peakHeight: 14.5,
    };
  }

  /**
   * Samples procedural ground elevation at world coordinates (x, z).
   * Generates a circular main island, an archipelago shelf, and a second
   * pirate atoll across open water traversable by boat.
   */
  sampleHeight(x, z) {
    // 1. Main Island Height
    const distFromOrigin = Math.sqrt(x * x + z * z);
    const normDist = distFromOrigin / this.islandRadius;

    // Multi-octave natural variation
    const octave1 = Math.sin(x * 0.015) * Math.cos(z * 0.015) * 4.5;
    const octave2 = Math.sin(x * 0.04 + 1.2) * Math.cos(z * 0.035 + 0.8) * 2.2;
    const octave3 = Math.cos((x + z) * 0.08) * 0.8;
    const variation = octave1 + octave2 + octave3;

    let mainHeight;
    if (normDist <= 0.45) {
      // Central plateau and gentle hill
      const hillFactor = 1.0 - (normDist / 0.45);
      const hill = Math.sin(hillFactor * Math.PI * 0.5) * (this.maxHeight - 6.0);
      mainHeight = Math.max(this.waterLevel + 2.0, 8.0 + hill + variation);
    } else if (normDist <= 0.85) {
      // Grassy lowlands sloping toward beach
      const t = (normDist - 0.45) / 0.40;
      const baseH = 8.0 * (1.0 - t) + 1.2 * t;
      mainHeight = Math.max(this.waterLevel + 0.8, baseH + variation * (1.0 - t * 0.5));
    } else if (normDist <= 1.0) {
      // Sandy shoreline transitioning through water level
      const t = (normDist - 0.85) / 0.15;
      const beachH = 1.2 * (1.0 - t) + (-1.5) * t;
      mainHeight = beachH + variation * 0.2;
    } else {
      // Ocean seabed shelf
      const offshoreDist = (normDist - 1.0) * this.islandRadius;
      const depth = -1.5 - Math.min(offshoreDist * 0.18, Math.abs(this.seabedDepth));
      mainHeight = depth + Math.sin(x * 0.02) * Math.cos(z * 0.02) * 0.7;
    }

    let height = mainHeight;

    // 2. Second Island: Pirate's Cove & Smuggler's Atoll
    const pdx = x - this.pirateIsland.center.x;
    const pdz = z - this.pirateIsland.center.z;
    if (Math.abs(pdx) < this.pirateIsland.radius && Math.abs(pdz) < this.pirateIsland.radius) {
      const pDist = Math.hypot(pdx, pdz);
      if (pDist < this.pirateIsland.radius) {
        const pNorm = pDist / this.pirateIsland.radius;
        let pirateHeight;
        if (pNorm <= 0.45) {
          // High rocky plateau & pirate lookout
          const t = 1.0 - (pNorm / 0.45);
          pirateHeight = 8.0 + t * 6.5;
        } else if (pNorm <= 0.85) {
          // Sloping sandy grassland
          const t = (pNorm - 0.45) / 0.40;
          pirateHeight = 8.0 * (1.0 - t) + 1.8 * t;
        } else {
          // Sandy beach transitioning into surf
          const t = (pNorm - 0.85) / 0.15;
          pirateHeight = 1.8 * (1.0 - t) + (-1.5) * t;
        }
        const rockVar = Math.sin(x * 0.09) * Math.cos(z * 0.09) * 1.2;
        height = Math.max(height, pirateHeight + rockVar * (1.0 - pNorm * 0.5));
      }
    }

    // 3. Expansion 3.0 outer islands: each one is a real landmass with its
    // own peak, shoreline and fishing habitat. Taking the maximum keeps the
    // islands independent when their shallow shelves meet open ocean.
    for (const island of OuterIslands) {
      const dx = x - island.center.x;
      const dz = z - island.center.z;
      if (Math.abs(dx) >= island.radius || Math.abs(dz) >= island.radius) continue;
      const islandHeight = sampleOuterIslandHeight(island, x, z);
      if (islandHeight !== null) height = Math.max(height, islandHeight);
    }

    // 4. Aurelia Heights, the skyline city island. It is independent of the
    // outer-island catalog so travel/zone tests keep their exact counts.
    const cdx = x - CityIsland.center.x;
    const cdz = z - CityIsland.center.z;
    if (Math.abs(cdx) < CityIsland.radius && Math.abs(cdz) < CityIsland.radius) {
      const cityHeight = sampleCityIslandHeight(x, z);
      if (cityHeight !== null) height = Math.max(height, cityHeight);
    }

    // 5. Expansion 7.0 frontier archipelago. These islands are the farthest
    // fishable landmasses and are sampled from their own catalog.
    const frontierHeight = sampleFrontierIslandHeight(x, z);
    if (frontierHeight !== null) height = Math.max(height, frontierHeight);

    return height;
  }

  /**
   * Computes the surface normal at (x, z) using finite differences.
   */
  sampleNormal(x, z) {
    const eps = 0.2;
    const hL = this.sampleHeight(x - eps, z);
    const hR = this.sampleHeight(x + eps, z);
    const hD = this.sampleHeight(x, z - eps);
    const hU = this.sampleHeight(x, z + eps);

    const nx = (hL - hR) / (2 * eps);
    const ny = 1.0;
    const nz = (hD - hU) / (2 * eps);

    const len = Math.hypot(nx, ny, nz);
    return { x: nx / len, y: ny / len, z: nz / len };
  }

  /**
   * Tests and clamps an entity position to guarantee it never penetrates terrain.
   * @param {{x: number, y: number, z: number}} pos - Mutable position object.
   * @param {number} footOffset - Distance from entity center to feet (typically half height).
   * @param {boolean} [isMovingUpward=false] - Whether entity has upward vertical velocity.
   * @returns {{grounded: boolean, groundHeight: number, penetration: number}}
   */
  resolveCollision(pos, footOffset = 0.0, isMovingUpward = false) {
    const groundH = this.sampleHeight(pos.x, pos.z);
    const minAllowedY = groundH + footOffset;

    if (pos.y <= minAllowedY) {
      const penetration = minAllowedY - pos.y;
      pos.y = minAllowedY;
      return { grounded: true, groundHeight: groundH, penetration };
    }

    // Small snap tolerance for walking down gentle slopes smoothly (suppressed during upward jump)
    const groundSnapThreshold = 0.22;
    if (!isMovingUpward && (pos.y - minAllowedY <= groundSnapThreshold)) {
      pos.y = minAllowedY;
      return { grounded: true, groundHeight: groundH, penetration: 0 };
    }

    return { grounded: false, groundHeight: groundH, penetration: 0 };
  }
}

export default TerrainCollider;
