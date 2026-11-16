// Aurelia Heights: a separate skyline island to the south-west of the starter
// harbor. The island is a raised plateau ringed by a short beach so the city
// can sit on flat, walkable ground while the ferry still reaches open water.

export const CityIsland = {
  id: 'aurelia_city',
  name: 'Aurelia Heights',
  center: { x: -430, z: 430 },
  radius: 112,
  peakHeight: 12,
  habitat: 'city',
  biome: 'city',
  labelY: 34,
  description: 'A gleaming island metropolis of skyscrapers, rooftop farms, a sky marina and busy boulevards.',
  palette: {
    trunk: 0x6e5239,
    foliage: 0x3f9444,
    accent: 0x7dd3fc,
    dock: 0x5a6472,
    glass: 0x9bd7e8,
    road: 0x2f3542,
    plaza: 0x8e99a8,
  },
  // Areas used by Game and the city environment. All coordinates are absolute.
  arrival: { x: -430, z: 505 },
  dock: { x: -430, z: 532 },
  ferry: { x: -430, z: 538 },
  plaza: { x: -430, z: 430 },
};

/**
 * Returns the Aurelia Heights ground height at (x, z), or null when the point
 * is outside the island. The flat plateau covers most of the island; the last
 * ring slopes down through a narrow beach into the sea.
 */
export function sampleCityIslandHeight(x, z) {
  const distance = Math.hypot(x - CityIsland.center.x, z - CityIsland.center.z);
  if (distance >= CityIsland.radius) return null;

  const norm = distance / CityIsland.radius;
  const variation =
    Math.sin(x * 0.045) * Math.cos(z * 0.045) * 0.42 +
    Math.sin((x + z) * 0.11) * 0.18;

  // 1. Raised city plateau.
  if (norm <= 0.68) {
    const t = norm / 0.68;
    return CityIsland.peakHeight * (1.0 - t * 0.04) + variation;
  }

  // 2. Terraced edge where the boulevards descend toward the waterfront.
  if (norm <= 0.9) {
    const t = (norm - 0.68) / 0.22;
    return CityIsland.peakHeight * (0.96 - t * 0.82) + 1.6 * t + variation * (1 - t * 0.6);
  }

  // 3. Narrow beach and shallow shelf.
  const t = (norm - 0.9) / 0.1;
  return 1.6 * (1 - t) - 1.8 * t + variation * 0.15;
}

export default CityIsland;
