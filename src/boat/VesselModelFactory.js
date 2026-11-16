// VesselModelFactory: detailed, class-aware ship models. Hulls are lofted from
// cross-sections instead of boxes, with gunwales, deck planks, cabins, masts,
// rigging, sails, rails, lanterns, cargo and class-specific equipment.

import * as THREE from 'three';

const CACHE = {
  plank: new THREE.BoxGeometry(1, 0.025, 0.08),
  railPost: new THREE.CylinderGeometry(0.022, 0.026, 0.34, 7),
  cabinWindow: new THREE.BoxGeometry(0.24, 0.16, 0.025),
  crate: new THREE.BoxGeometry(0.34, 0.28, 0.3),
  barrel: new THREE.CylinderGeometry(0.14, 0.14, 0.32, 10),
  barrelBand: new THREE.TorusGeometry(0.142, 0.012, 5, 12),
  cleat: new THREE.BoxGeometry(0.09, 0.05, 0.05),
  fender: new THREE.SphereGeometry(0.09, 8, 7),
  lantern: new THREE.SphereGeometry(0.075, 8, 7),
  wheel: new THREE.TorusGeometry(0.18, 0.022, 6, 14),
  wheelSpoke: new THREE.CylinderGeometry(0.012, 0.012, 0.34, 6),
  anchorRing: new THREE.TorusGeometry(0.075, 0.018, 5, 12),
  anchorArm: new THREE.CylinderGeometry(0.018, 0.018, 0.28, 6),
  line: new THREE.CylinderGeometry(0.008, 0.008, 1, 4),
  radarDish: new THREE.SphereGeometry(0.16, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2),
};

function mat(color, options = {}) {
  return new THREE.MeshStandardMaterial({
    color,
    roughness: options.roughness ?? 0.72,
    metalness: options.metalness ?? 0.04,
    transparent: Boolean(options.transparent),
    opacity: options.opacity ?? 1,
    side: options.side || THREE.FrontSide,
    emissive: options.emissive ?? 0x000000,
    emissiveIntensity: options.emissiveIntensity ?? 0,
  });
}

function add(parent, geometry, material, name, position = [0, 0, 0], rotation = [0, 0, 0], scale = [1, 1, 1]) {
  const mesh = new THREE.Mesh(geometry, material);
  mesh.name = name;
  mesh.position.set(position[0], position[1], position[2]);
  mesh.rotation.set(rotation[0], rotation[1], rotation[2]);
  mesh.scale.set(scale[0], scale[1], scale[2]);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  parent.add(mesh);
  return mesh;
}

export function detectVesselStyle(id = '', explicitStyle = null) {
  if (explicitStyle) return explicitStyle;
  const key = String(id);
  if (key.includes('catamaran')) return 'catamaran';
  if (key.includes('submarine')) return 'submarine';
  if (key.includes('galleon') || key.includes('manowar') || key.includes('pirate') || key.includes('corsair') || key.includes('revenant') || key.includes('tempest')) return 'galleon';
  if (key.includes('yacht') || key.includes('steamer') || key.includes('clipper') || key.includes('celestial') || key.includes('abyssal')) return 'yacht';
  if (key.includes('trawler') || key.includes('icebreaker') || key.includes('ironclad') || key.includes('expedition') || key.includes('tidebreaker') || key.includes('surveyor')) return 'workboat';
  if (key.includes('rowboat')) return 'rowboat';
  return 'motor';
}

function hullWidthAt(t, beam) {
  const body = 0.53 + 0.47 * Math.sin(Math.PI * Math.pow(t, 0.9));
  const bow = t > 0.78 ? 1 - 0.82 * Math.pow((t - 0.78) / 0.22, 1.35) : 1;
  const stern = t < 0.10 ? 0.82 + 0.18 * (t / 0.10) : 1;
  return Math.max(0.045, (beam / 2) * body * bow * stern);
}

function createHullFootprint(length, beam, segments = 16) {
  const rows = [];
  for (let i = 0; i <= segments; i++) {
    const t = i / segments;
    const z = -length / 2 + t * length;
    rows.push({ t, z, width: hullWidthAt(t, beam) });
  }
  return rows;
}

function createDeckGeometry(length, beam, deckY = 0.45) {
  const rows = createHullFootprint(length, beam);
  const vertices = [];
  const indices = [];
  for (const row of rows) {
    vertices.push(-row.width, deckY, row.z, 0, deckY + 0.012, row.z, row.width, deckY, row.z);
  }
  for (let i = 0; i < rows.length - 1; i++) {
    const a = i * 3;
    const b = (i + 1) * 3;
    indices.push(a, a + 1, b, a + 1, b + 1, b);
    indices.push(a + 1, a + 2, b + 1, a + 2, b + 2, b + 1);
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  return geometry;
}

function createHullGeometry(length, beam, depth = 0.44) {
  const rows = createHullFootprint(length, beam, 18);
  const vertices = [];
  const indices = [];
  for (const row of rows) {
    const w = row.width;
    vertices.push(
      -w, 0.44, row.z,
      -w * 0.86, 0.04, row.z,
      0, -depth, row.z,
      w * 0.86, 0.04, row.z,
      w, 0.44, row.z,
    );
  }
  for (let i = 0; i < rows.length - 1; i++) {
    for (let j = 0; j < 4; j++) {
      const a = i * 5 + j;
      const b = (i + 1) * 5 + j;
      const c = a + 1;
      const d = b + 1;
      indices.push(a, b, c, c, b, d);
    }
  }
  // Close the transom and bow with fan triangles.
  for (const rowIndex of [0, rows.length - 1]) {
    const base = rowIndex * 5;
    const centerZ = rows[rowIndex].z;
    const centerIndex = vertices.length / 3;
    vertices.push(0, 0.02, centerZ);
    const flip = rowIndex === 0 ? 1 : -1;
    for (let j = 0; j < 4; j++) {
      if (flip > 0) indices.push(base + j, centerIndex, base + j + 1);
      else indices.push(base + j + 1, centerIndex, base + j);
    }
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  return geometry;
}

function makeCurve(points) {
  return new THREE.CatmullRomCurve3(points.map((p) => new THREE.Vector3(p[0], p[1], p[2])));
}

function addGunwale(group, length, beam, mats) {
  const rows = createHullFootprint(length, beam, 18);
  const leftPoints = rows.map((row) => [-row.width, 0.46, row.z]);
  const rightPoints = rows.map((row) => [row.width, 0.46, row.z]);
  const left = new THREE.Mesh(new THREE.TubeGeometry(makeCurve(leftPoints), 28, 0.032, 5, false), mats.trim);
  left.name = 'PortGunwale';
  left.castShadow = true;
  group.add(left);
  const right = new THREE.Mesh(new THREE.TubeGeometry(makeCurve(rightPoints), 28, 0.032, 5, false), mats.trim);
  right.name = 'StarboardGunwale';
  right.castShadow = true;
  group.add(right);
}

function addDeckPlanks(group, length, beam, mats) {
  const plankCount = Math.max(5, Math.round(length * 2.2));
  for (let i = 0; i < plankCount; i++) {
    const z = -length / 2 + (i + 0.5) * (length / plankCount);
    const t = (z + length / 2) / length;
    const width = hullWidthAt(t, beam) * 1.7;
    add(group, CACHE.plank, mats.deckDark, `DeckSeam${i}`, [0, 0.458, z], [0, 0, 0], [width, 1, 1]);
  }
}

function addCabin(group, length, beam, mats, variant = 'workboat') {
  const cabin = new THREE.Group();
  cabin.name = 'Cabin';
  group.add(cabin);
  const width = Math.min(beam * 0.62, 1.45);
  const cabinLength = variant === 'yacht' ? length * 0.43 : length * 0.27;
  const height = variant === 'yacht' ? 0.72 : 0.52;
  const z = variant === 'galleon' ? -length * 0.23 : -length * 0.08;
  add(cabin, new THREE.BoxGeometry(width, height, cabinLength), mats.cabin, 'CabinBody', [0, 0.45 + height / 2, z]);
  add(cabin, new THREE.BoxGeometry(width + 0.12, 0.07, cabinLength + 0.1), mats.cabinRoof, 'CabinRoof', [0, 0.45 + height + 0.035, z]);
  const windowCount = variant === 'yacht' ? 3 : 2;
  for (let i = 0; i < windowCount; i++) {
    const wx = -width * 0.34 + (i / Math.max(1, windowCount - 1)) * width * 0.68;
    add(cabin, CACHE.cabinWindow, mats.window, `CabinWindow${i}`, [wx, 0.45 + height * 0.62, z + cabinLength / 2 + 0.014]);
    add(cabin, CACHE.cabinWindow, mats.window, `CabinWindowPort${i}`, [-width / 2 - 0.014, 0.45 + height * 0.62, z - cabinLength * 0.18 + i * 0.22], [0, Math.PI / 2, 0]);
  }
  if (variant === 'yacht' || variant === 'workboat' || variant === 'expedition') {
    add(cabin, new THREE.BoxGeometry(width * 0.92, 0.045, cabinLength * 0.9), mats.trim, 'UpperDeck', [0, 0.45 + height + 0.09, z]);
    for (const side of [-1, 1]) {
      add(cabin, CACHE.line, mats.metal, side < 0 ? 'UpperRailLeft' : 'UpperRailRight', [side * width * 0.42, 0.45 + height + 0.22, z], [0, 0, 0], [1, cabinLength * 0.78, 1]);
    }
  }
  if (variant === 'yacht') {
    const dish = add(cabin, CACHE.radarDish, mats.metal, 'RadarDish', [0, 0.45 + height + 0.19, z - cabinLength * 0.18], [0.2, 0, 0], [1, 1, 1]);
    dish.rotation.x = Math.PI / 2;
    add(cabin, CACHE.line, mats.metal, 'RadarStem', [0, 0.45 + height + 0.14, z - cabinLength * 0.18], [0, 0, 0], [1, 0.25, 1]);
  }
  return cabin;
}

function addMast(group, x, z, height, mats, sailColor) {
  const mast = add(group, new THREE.CylinderGeometry(0.025, 0.038, height, 8), mats.mast, 'Mast', [x, 0.48 + height / 2, z]);
  add(group, new THREE.SphereGeometry(0.045, 8, 6), mats.gold, 'MastCap', [x, 0.5 + height, z]);
  add(group, new THREE.TorusGeometry(0.16, 0.012, 4, 10), mats.mast, 'CrowsNest', [x, 0.48 + height * 0.76, z], [Math.PI / 2, 0, 0]);

  const sailGeo = new THREE.PlaneGeometry(1.55, height * 0.48, 8, 8);
  const positions = sailGeo.attributes.position;
  for (let i = 0; i < positions.count; i++) {
    const px = positions.getX(i);
    const py = positions.getY(i);
    positions.setZ(i, Math.sin(((px + 0.8) / 1.6) * Math.PI) * 0.12 + Math.max(0, py) * 0.015);
  }
  sailGeo.computeVertexNormals();
  const sail = add(group, sailGeo, mat(sailColor, { roughness: 0.95, side: THREE.DoubleSide }), 'Sail', [x + 0.68, 0.88 + height * 0.5, z], [0, 0, 0]);
  sail.castShadow = true;
  add(group, new THREE.CylinderGeometry(0.012, 0.012, 1.45, 5), mats.mast, 'SailYard', [x + 0.68, 0.88 + height * 0.5 + height * 0.24, z], [0, 0, Math.PI / 2]);
  return { mast, sail };
}

function addRigging(group, points, mats) {
  for (const [a, b] of points) {
    const start = new THREE.Vector3(a[0], a[1], a[2]);
    const end = new THREE.Vector3(b[0], b[1], b[2]);
    const mid = start.clone().add(end).multiplyScalar(0.5);
    const dir = end.clone().sub(start);
    const line = add(group, CACHE.line, mats.rope, 'Rigging', [mid.x, mid.y, mid.z]);
    line.scale.y = dir.length();
    line.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.normalize());
  }
}

function addWheel(group, z, mats) {
  const wheel = new THREE.Group();
  wheel.name = 'HelmWheel';
  wheel.position.set(0, 0.83, z);
  add(wheel, CACHE.wheel, mats.trim, 'WheelRim', [0, 0, 0], [0, 0, 0]);
  for (let i = 0; i < 4; i++) {
    add(wheel, CACHE.wheelSpoke, mats.trim, 'WheelSpoke', [0, 0, 0], [0, 0, (i / 4) * Math.PI]);
  }
  add(wheel, new THREE.CylinderGeometry(0.04, 0.04, 0.06, 8), mats.gold, 'WheelHub', [0, 0, 0], [Math.PI / 2, 0, 0]);
  group.add(wheel);
  return wheel;
}

function addDetails(group, length, beam, mats, style) {
  // Rails and stanchions along the forward half of the deck.
  for (const side of [-1, 1]) {
    for (let i = 0; i < 3; i++) {
      const z = length * 0.04 + i * length * 0.13;
      add(group, CACHE.railPost, mats.metal, `RailPost${side}_${i}`, [side * (beam * 0.33), 0.62, z]);
      add(group, CACHE.railPost, mats.metal, `RailPostInner${side}_${i}`, [side * (beam * 0.25), 0.62, z + length * 0.06]);
    }
    add(group, CACHE.line, mats.metal, side < 0 ? 'PortRail' : 'StarboardRail', [side * beam * 0.33, 0.78, length * 0.18], [0, 0, 0], [1, length * 0.36, 1]);
    add(group, CACHE.fender, mats.rope, side < 0 ? 'PortFenderA' : 'StarboardFenderA', [side * (beam * 0.53), 0.23, -length * 0.08], [0, 0, 0], [1.1, 0.9, 1.1]);
    add(group, CACHE.fender, mats.rope, side < 0 ? 'PortFenderB' : 'StarboardFenderB', [side * (beam * 0.48), 0.2, length * 0.2], [0, 0, 0], [0.9, 0.8, 1.1]);
  }

  // Anchor at the bow.
  add(group, CACHE.anchorRing, mats.metal, 'AnchorRing', [0, 0.61, length * 0.43]);
  add(group, CACHE.anchorArm, mats.metal, 'AnchorStem', [0.05, 0.56, length * 0.43], [0.3, 0, 0.28]);
  add(group, CACHE.anchorArm, mats.metal, 'AnchorFluke', [0.13, 0.48, length * 0.43], [0, 0, 1.0]);

  // Cargo and lanterns.
  add(group, CACHE.crate, mats.crate, 'DeckCrate', [-beam * 0.21, 0.59, -length * 0.28]);
  add(group, CACHE.crate, mats.crate, 'DeckCrateSmall', [-beam * 0.18, 0.76, -length * 0.28], [0, 0.12, 0], [0.7, 0.7, 0.7]);
  add(group, CACHE.barrel, mats.barrel, 'DeckBarrel', [beam * 0.21, 0.61, -length * 0.30]);
  add(group, CACHE.barrelBand, mats.metal, 'BarrelBand', [beam * 0.21, 0.61, -length * 0.30], [Math.PI / 2, 0, 0]);
  for (const side of [-1, 1]) {
    add(group, CACHE.cleat, mats.metal, side < 0 ? 'PortCleat' : 'StarboardCleat', [side * beam * 0.34, 0.49, -length * 0.42]);
  }
  const lanternMat = mat(0xffd27a, { emissive: 0xffa62b, emissiveIntensity: 1.2, roughness: 0.3 });
  add(group, CACHE.lantern, lanternMat, 'BowLantern', [0, 0.88, length * 0.35]);
  add(group, new THREE.CylinderGeometry(0.01, 0.01, 0.15, 5), mats.metal, 'LanternPost', [0, 0.73, length * 0.35]);

  if (style === 'galleon') {
    for (const side of [-1, 1]) {
      add(group, new THREE.CylinderGeometry(0.05, 0.065, 0.46, 8), mats.cannon, 'CannonBarrel', [side * beam * 0.36, 0.62, -length * 0.08], [0, 0, side * Math.PI / 2]);
      add(group, new THREE.CylinderGeometry(0.09, 0.09, 0.05, 10), mats.cannon, 'CannonMuzzle', [side * beam * 0.5, 0.62, -length * 0.08], [0, 0, Math.PI / 2]);
      add(group, new THREE.BoxGeometry(0.16, 0.12, 0.18), mats.cannon, 'CannonMount', [side * beam * 0.27, 0.53, -length * 0.08]);
    }
  }
}

function createSailboatHull(group, length, beam, mats, style) {
  const hull = new THREE.Mesh(createHullGeometry(length, beam), mats.hull);
  hull.name = 'LoftedHull';
  hull.castShadow = true;
  hull.receiveShadow = true;
  hull.material.side = THREE.DoubleSide;
  group.add(hull);
  addGunwale(group, length, beam, mats);
  const deck = new THREE.Mesh(createDeckGeometry(length, beam), mats.deck);
  deck.name = 'SmoothDeck';
  deck.receiveShadow = true;
  group.add(deck);
  addDeckPlanks(group, length, beam, mats);
  addDetails(group, length, beam, mats, style);
  return hull;
}

function createSubmarine(group, length, mats, parts) {
  const hull = new THREE.Mesh(new THREE.CapsuleGeometry(0.55, length * 0.65, 8, 18), mats.hull);
  hull.name = 'SubmarinePressureHull';
  hull.rotation.x = Math.PI / 2;
  hull.position.y = 0.28;
  hull.castShadow = true;
  group.add(hull);
  add(group, new THREE.CylinderGeometry(0.23, 0.3, 0.65, 14), mats.cabin, 'ConningTower', [0, 0.78, -0.2]);
  add(group, new THREE.CylinderGeometry(0.035, 0.035, 0.8, 8), mats.metal, 'Periscope', [0, 1.38, -0.2]);
  add(group, new THREE.CylinderGeometry(0.03, 0.03, 0.65, 8), mats.metal, 'PeriscopeCross', [0.24, 1.58, -0.2], [0, 0, Math.PI / 2]);
  add(group, new THREE.SphereGeometry(0.17, 12, 8), mats.window, 'Viewport', [0, 0.55, length * 0.38], [0, 0, 0], [1.1, 0.8, 0.4]);
  for (const side of [-1, 1]) {
    add(group, new THREE.BoxGeometry(0.5, 0.05, 0.24), mats.metal, side < 0 ? 'DivePlaneLeft' : 'DivePlaneRight', [side * 0.72, 0.32, length * 0.25], [0, 0, side * 0.12]);
    add(group, new THREE.BoxGeometry(0.35, 0.05, 0.55), mats.metal, side < 0 ? 'SternFinLeft' : 'SternFinRight', [side * 0.34, 0.3, -length * 0.43], [0, 0, 0.1]);
  }
  add(group, new THREE.CylinderGeometry(0.05, 0.05, 0.35, 8), mats.metal, 'PropellerShaft', [0, 0.3, -length * 0.49], [Math.PI / 2, 0, 0]);
  const prop = new THREE.Group();
  prop.name = 'Propeller';
  prop.position.set(0, 0.3, -length * 0.53);
  for (let i = 0; i < 4; i++) {
    add(prop, new THREE.BoxGeometry(0.34, 0.035, 0.11), mats.gold, 'PropellerBlade', [0, 0, 0], [0, 0, (i / 4) * Math.PI]);
  }
  group.add(prop);
  parts.propeller = prop;
  return hull;
}

/**
 * Builds a class-specific vessel model at the origin.
 */
export function createVesselModel(options = {}) {
  const style = detectVesselStyle(options.id, options.style);
  const hullColor = options.hullColor ?? 0x8a5229;
  const group = new THREE.Group();
  group.name = `Vessel_${options.id || style}`;
  group.userData.vesselClass = style;

  const mats = {
    hull: mat(hullColor, { roughness: 0.66 }),
    trim: mat(new THREE.Color(hullColor).multiplyScalar(1.22), { roughness: 0.58, metalness: 0.08 }),
    hullDark: mat(new THREE.Color(hullColor).multiplyScalar(0.48), { roughness: 0.75 }),
    deck: mat(0x9a7249, { roughness: 0.88 }),
    deckDark: mat(0x5b3b24, { roughness: 0.94 }),
    cabin: mat(options.cabinColor ?? 0xe5e0d1, { roughness: 0.74 }),
    cabinRoof: mat(0x4b5560, { roughness: 0.62 }),
    mast: mat(0x59402a, { roughness: 0.9 }),
    metal: mat(0xbac4ca, { roughness: 0.34, metalness: 0.65 }),
    gold: mat(0xd9a441, { roughness: 0.3, metalness: 0.68 }),
    window: mat(0x7fd6e8, { roughness: 0.18, metalness: 0.2, emissive: 0x0c5c70, emissiveIntensity: 0.55 }),
    crate: mat(0x8b673f, { roughness: 0.94 }),
    barrel: mat(0x6f4d2e, { roughness: 0.92 }),
    rope: mat(0xb08a52, { roughness: 0.98 }),
    cannon: mat(0x2b3036, { roughness: 0.42, metalness: 0.55 }),
  };

  const parts = { style, sails: [], lanterns: [] };
  let length = 4.2;
  let beam = 1.55;

  if (style === 'submarine') {
    length = 5.0;
    beam = 1.1;
    parts.hull = createSubmarine(group, length, mats, parts);
    parts.deck = group.getObjectByName('ConningTower');
  } else if (style === 'catamaran') {
    length = 4.6;
    beam = 2.0;
    const outriggers = [];
    for (const side of [-1, 1]) {
      const hullGroup = new THREE.Group();
      hullGroup.position.x = side * 0.78;
      group.add(hullGroup);
      const hull = createSailboatHull(hullGroup, length, 0.82, mats, style);
      outriggers.push(hull);
      if (side < 0) parts.hull = hull;
    }
    add(group, new THREE.BoxGeometry(2.05, 0.13, 1.45), mats.deck, 'TrampolineDeck', [0, 0.48, 0.05]);
    add(group, new THREE.BoxGeometry(0.14, 0.1, 1.6), mats.trim, 'CrossbeamA', [0, 0.59, -1.1]);
    add(group, new THREE.BoxGeometry(0.14, 0.1, 1.6), mats.trim, 'CrossbeamB', [0, 0.59, 1.15]);
    parts.deck = group.getObjectByName('TrampolineDeck');
    parts.hullGroup = group;
    addCabin(group, length, beam, mats, 'expedition');
  } else {
    if (style === 'yacht') {
      length = 5.4;
      beam = 2.0;
    } else if (style === 'galleon') {
      length = 5.8;
      beam = 2.15;
    } else if (style === 'workboat') {
      length = 4.9;
      beam = 1.85;
    } else if (style === 'expedition') {
      length = 5.2;
      beam = 1.95;
    } else if (style === 'rowboat') {
      length = 3.2;
      beam = 1.25;
    }
    parts.hull = createSailboatHull(group, length, beam, mats, style);
    parts.deck = group.getObjectByName('SmoothDeck');
  }

  if (style === 'rowboat') {
    for (const z of [-0.8, 0.15, 1.0]) {
      add(group, new THREE.BoxGeometry(beam * 1.1, 0.08, 0.22), mats.deckDark, 'RowboatBench', [0, 0.55, z]);
    }
    for (const side of [-1, 1]) {
      add(group, new THREE.CylinderGeometry(0.026, 0.026, 2.7, 7), mats.mast, 'Oar', [side * beam * 0.72, 0.61, 0], [0.1, 0, side * 0.18]);
    }
    add(group, CACHE.anchorRing, mats.rope, 'MooringRing', [0, 0.54, length * 0.42]);
  } else if (style === 'motor') {
    add(group, new THREE.BoxGeometry(0.4, 0.52, 0.34), mats.metal, 'OutboardMotor', [0, 0.62, -length * 0.47]);
    add(group, new THREE.BoxGeometry(0.5, 0.035, 0.28), mats.trim, 'MotorCowl', [0, 0.9, -length * 0.47]);
    add(group, new THREE.BoxGeometry(0.06, 0.3, 0.42), mats.metal, 'PropellerLeg', [0, 0.22, -length * 0.48], [0.2, 0, 0]);
    add(group, new THREE.TorusGeometry(0.09, 0.012, 4, 10), mats.gold, 'PropellerRing', [0, 0.12, -length * 0.51], [Math.PI / 2, 0, 0]);
  } else if (style === 'workboat' || style === 'yacht' || style === 'expedition') {
    addCabin(group, length, beam, mats, style);
    if (style === 'workboat') {
      add(group, new THREE.CylinderGeometry(0.035, 0.045, 1.25, 7), mats.metal, 'CranePost', [0, 1.05, -length * 0.27]);
      add(group, new THREE.CylinderGeometry(0.028, 0.028, 1.0, 6), mats.metal, 'CraneArm', [0.33, 1.5, -length * 0.27], [0, 0, Math.PI / 2]);
      add(group, CACHE.anchorRing, mats.rope, 'CraneHook', [0.82, 1.38, -length * 0.27]);
    }
    if (style === 'expedition') {
      for (let i = 0; i < 2; i++) {
        add(group, new THREE.CylinderGeometry(0.025, 0.03, 1.0, 7), mats.metal, 'RodHolder', [-0.35 + i * 0.2, 0.85, -length * 0.16], [0.1, 0, -0.12 + i * 0.2]);
      }
      add(group, new THREE.CylinderGeometry(0.055, 0.08, 0.16, 10), mats.metal, 'SonarDome', [0, 1.25, -length * 0.18]);
    }
  } else if (style === 'galleon') {
    addCabin(group, length, beam, mats, 'galleon');
    const masts = [
      { x: 0.02, z: -1.45, height: 3.2, color: 0x2a2520 },
      { x: 0.02, z: 0.25, height: 3.9, color: 0x3d3027 },
      { x: 0.0, z: 1.78, height: 2.7, color: 0x2a2520 },
    ];
    for (const mast of masts) {
      const built = addMast(group, mast.x, mast.z, mast.height, mats, mast.color);
      parts.sails.push(built.sail);
      if (!parts.mast) parts.mast = built.mast;
    }
    addRigging(group, [
      [[0, 3.6, -1.45], [0, 4.3, 0.25]],
      [[0, 4.3, 0.25], [0, 3.0, 1.78]],
      [[0, 4.3, 0.25], [0, 0.9, -length / 2]],
      [[0, 4.3, 0.25], [0, 0.9, length / 2]],
    ], mats);
    add(group, new THREE.CylinderGeometry(0.03, 0.05, 1.5, 8), mats.mast, 'Bowsprit', [0, 0.75, length * 0.55], [1.22, 0, 0]);
    add(group, new THREE.PlaneGeometry(1.0, 0.45), mat(0x17181d, { side: THREE.DoubleSide }), 'SkullFlag', [0.55, 4.45, 0.25]);
    const skull = add(group, new THREE.BoxGeometry(0.16, 0.14, 0.02), mats.deck, 'FlagSkull', [0.55, 4.45, 0.26]);
    skull.rotation.z = 0.1;
    parts.flag = group.getObjectByName('SkullFlag');
  } else {
    addCabin(group, length, beam, mats, style);
  }

  if (style === 'motor' || style === 'yacht' || style === 'workboat' || style === 'galleon' || style === 'expedition') {
    parts.wheel = addWheel(group, -length * 0.10, mats);
  }

  // A polished bow cap reads as a metal cutwater on every metal/wooden vessel.
  add(group, new THREE.ConeGeometry(0.09, 0.42, 6), mats.gold, 'BowCutwater', [0, 0.26, length * 0.52], [Math.PI / 2, 0, 0]);
  add(group, new THREE.CylinderGeometry(0.018, 0.018, 0.65, 6), mats.metal, 'FlagStaff', [0, 1.0, -length * 0.43]);
  if (!parts.flag) {
    parts.flag = add(group, new THREE.PlaneGeometry(0.62, 0.3), mat(hullColor, { side: THREE.DoubleSide }), 'SternPennant', [0.31, 1.22, -length * 0.43]);
  }

  parts.group = group;
  parts.length = length;
  parts.beam = beam;
  group.traverse((child) => {
    if (child.isMesh) {
      child.castShadow = true;
      child.receiveShadow = true;
    }
  });
  group.userData.vesselParts = parts;
  return { group, parts, style };
}

export default createVesselModel;
