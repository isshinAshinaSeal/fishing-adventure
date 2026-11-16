// Expansion 7.0 — Frontier Archipelago.
//
// Four remote islands sit in the four corners of the world sheet, beyond the
// original seven outer isles. They are deliberately kept in their own catalog
// so the Expansion 3.0 exact-count assertions (OuterIslands.length === 7) stay
// valid while the terrain, zones, props and fishing spots all share one source
// of truth.

const BLUEPRINTS = [
  {
    id: 'tempest_spire',
    name: 'Tempest Spire',
    center: { x: 525, z: -525 },
    radius: 64,
    peakHeight: 26,
    habitat: 'tempest',
    biome: 'storm',
    zoneId: 'tempest_reach',
    zoneName: 'Tempest Reach',
    labelY: 38,
    description: 'A storm-scoured basalt spire ringed by lightning glass and violent green surf.',
    zoneDescription: 'Thunderheads circle a black spire while storm-fed currents churn the fishing ledges below.',
    palette: { trunk: 0x3b4650, foliage: 0x527383, accent: 0x7de3ff, dock: 0x39424e },
    shoreAngle: 135,
    spotAngles: [135, 160],
    spotNames: ['Stormbreak Ledge', 'Thunderhead Drop'],
  },
  {
    id: 'aurora_isle',
    name: 'Aurora Isle',
    center: { x: 525, z: 525 },
    radius: 60,
    peakHeight: 22,
    habitat: 'aurora',
    biome: 'aurora',
    zoneId: 'aurora_shelf',
    zoneName: 'Aurora Shelf',
    labelY: 34,
    description: 'A luminous polar isle where prismatic ice cliffs glow under a permanent aurora.',
    zoneDescription: 'A shimmering shelf of glacial glass and aurora-lit water far beyond the southern shipping lanes.',
    palette: { trunk: 0x53627a, foliage: 0x9f8cff, accent: 0xb8f2ff, dock: 0x5a6878 },
    shoreAngle: 225,
    spotAngles: [225, 200],
    spotNames: ['Prism Ice Hole', 'Borealis Shelf'],
  },
  {
    id: 'glasswind_cay',
    name: 'Glasswind Cay',
    center: { x: -525, z: -525 },
    radius: 52,
    peakHeight: 17,
    habitat: 'glasswind',
    biome: 'glass',
    zoneId: 'glasswind_sound',
    zoneName: 'Glasswind Sound',
    labelY: 29,
    description: 'A crystalline cay of mirror-smooth coves, wind-carved arches and translucent reefs.',
    zoneDescription: 'Glass cliffs ring a silent sound where the water is so clear the fish cast their own reflections.',
    palette: { trunk: 0x6d7f8a, foliage: 0x8fe8f2, accent: 0xd8fbff, dock: 0x60727e },
    shoreAngle: 315,
    spotAngles: [315, 340],
    spotNames: ['Mirrorglass Cove', 'Windcarved Arch'],
  },
  {
    id: 'serpent_reef',
    name: 'Serpent Reef',
    center: { x: 40, z: 525 },
    radius: 68,
    peakHeight: 20,
    habitat: 'serpent_reef',
    biome: 'reef',
    zoneId: 'serpent_reef_zone',
    zoneName: 'Serpent Reef',
    labelY: 32,
    description: 'A coiled coral atoll of emerald lagoons and serpent-shaped sandbars.',
    zoneDescription: 'A living reef of coiled coral ridges, warm lagoons and deep blue drop-offs patrolled by serpentine fish.',
    palette: { trunk: 0x5d4635, foliage: 0x2fbf8f, accent: 0x7dffc4, dock: 0x73563a },
    shoreAngle: 270,
    spotAngles: [270, 245],
    spotNames: ['Coil Lagoon', 'Serpent Drop-Off'],
  },
];

function shorePoint(island, angleDegrees, norm) {
  const angle = (angleDegrees * Math.PI) / 180;
  return {
    x: Number((island.center.x + Math.cos(angle) * island.radius * norm).toFixed(2)),
    z: Number((island.center.z + Math.sin(angle) * island.radius * norm).toFixed(2)),
  };
}

export const FrontierIslands = BLUEPRINTS.map((island) => {
  const arrival = shorePoint(island, island.shoreAngle, 0.76);
  const dock = shorePoint(island, island.shoreAngle, 0.84);
  const fishingSpots = island.spotAngles.map((angle, index) => ({
    id: `spot_${island.id}_${index + 1}`,
    islandId: island.id,
    name: island.spotNames[index],
    habitat: island.habitat,
    position: shorePoint(island, angle, 0.87),
    target: shorePoint(island, angle, 1.14),
  }));

  return {
    ...island,
    arrival,
    dock,
    fishingSpots,
  };
});

// Zone definitions are merged into ZoneManager at runtime rather than appended
// to WorldZones, preserving default-zone tests while making the frontier fully
// discoverable in the live game.
export const FrontierZones = FrontierIslands.map((island) => ({
  id: island.zoneId,
  name: island.zoneName,
  habitat: island.habitat,
  center: { ...island.center },
  radius: island.radius + 70,
  description: island.zoneDescription,
}));

export function getFrontierIsland(id) {
  return FrontierIslands.find((island) => island.id === id) || null;
}

/**
 * Samples the highest frontier-island surface at (x, z), or null over open
 * ocean. Each island is a compact hill with a plateau, a sloping shoulder and
 * a narrow beach, matching the walkable profile of the outer isles.
 */
export function sampleFrontierIslandHeight(x, z) {
  let height = null;

  for (const island of FrontierIslands) {
    const dx = x - island.center.x;
    const dz = z - island.center.z;
    const radius = island.radius;

    // Bounding-box rejection is much cheaper than hypot for the vast ocean
    // samples taken while building the terrain mesh.
    if (Math.abs(dx) >= radius || Math.abs(dz) >= radius) continue;
    const distanceSq = dx * dx + dz * dz;
    if (distanceSq >= radius * radius) continue;

    const norm = Math.sqrt(distanceSq) / radius;
    const rockVar =
      Math.sin(x * 0.063 + island.center.x) * Math.cos(z * 0.057 + island.center.z);

    let islandHeight;
    if (norm <= 0.5) {
      const t = 1 - norm / 0.5;
      islandHeight = island.peakHeight * (0.52 + t * 0.48) + rockVar * 1.0;
    } else if (norm <= 0.84) {
      const t = (norm - 0.5) / 0.34;
      islandHeight =
        island.peakHeight * 0.52 * (1 - t) + 2.1 * t + rockVar * 0.8 * (1 - t * 0.5);
    } else {
      const t = (norm - 0.84) / 0.16;
      islandHeight = 2.1 * (1 - t) - 1.8 * t + rockVar * 0.2 * (1 - t);
    }

    height = height === null ? islandHeight : Math.max(height, islandHeight);
  }

  return height;
}

export default FrontierIslands;
