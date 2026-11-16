// AvatarFactory: shared, high-detail character rig used by the player and every
// NPC. Built from smooth primitives with real facial anatomy, layered clothing,
// hair, tools, belts, satchels and backpacks. Geometry is cached and shared so
// a detailed look stays affordable with dozens of villagers on screen.

import * as THREE from 'three';

export const AvatarOptions = {
  faceStyle: [
    { id: 'oval', label: 'Oval' },
    { id: 'square', label: 'Strong Jaw' },
    { id: 'round', label: 'Round' },
  ],
  hairStyle: [
    { id: 'short', label: 'Short Crop' },
    { id: 'wavy', label: 'Sea Wavy' },
    { id: 'long', label: 'Long Tides' },
    { id: 'ponytail', label: 'Ponytail' },
    { id: 'bald', label: 'Bald' },
  ],
  facialHair: [
    { id: 'none', label: 'Clean Shaven' },
    { id: 'stubble', label: 'Stubble' },
    { id: 'moustache', label: 'Moustache' },
    { id: 'beard', label: 'Full Beard' },
  ],
  backpackStyle: [
    { id: 'none', label: 'No Pack' },
    { id: 'satchel', label: 'Leather Satchel' },
    { id: 'expedition', label: 'Expedition Pack' },
    { id: 'fishing', label: 'Angler Pack' },
    { id: 'pirate', label: 'Corsair Bag' },
  ],
  hatStyle: [
    { id: 'straw', label: 'Straw Hat' },
    { id: 'captain', label: 'Captain Cap' },
    { id: 'tricorn', label: 'Tricorne' },
    { id: 'merchant', label: 'Merchant Cap' },
    { id: 'none', label: 'No Hat' },
  ],
};

const GEO = {
  head: new THREE.SphereGeometry(0.25, 24, 18),
  jaw: new THREE.SphereGeometry(0.19, 18, 14),
  eye: new THREE.SphereGeometry(0.045, 14, 10),
  iris: new THREE.SphereGeometry(0.021, 12, 8),
  pupil: new THREE.SphereGeometry(0.0105, 10, 8),
  glint: new THREE.SphereGeometry(0.0045, 6, 5),
  nose: new THREE.ConeGeometry(0.058, 0.13, 10),
  noseTip: new THREE.SphereGeometry(0.047, 10, 8),
  ear: new THREE.SphereGeometry(0.09, 12, 10),
  neck: new THREE.CylinderGeometry(0.105, 0.12, 0.17, 12),
  torso: new THREE.CapsuleGeometry(0.285, 0.36, 5, 14),
  hips: new THREE.CapsuleGeometry(0.255, 0.12, 4, 12),
  upperArm: new THREE.CapsuleGeometry(0.076, 0.23, 4, 10),
  forearm: new THREE.CapsuleGeometry(0.064, 0.21, 4, 10),
  hand: new THREE.SphereGeometry(0.082, 12, 10),
  finger: new THREE.CapsuleGeometry(0.017, 0.065, 3, 6),
  thigh: new THREE.CapsuleGeometry(0.105, 0.28, 4, 10),
  calf: new THREE.CapsuleGeometry(0.084, 0.24, 4, 10),
  boot: new THREE.SphereGeometry(0.105, 12, 9),
  bootShaft: new THREE.CylinderGeometry(0.086, 0.103, 0.22, 10),
  belt: new THREE.TorusGeometry(0.277, 0.026, 6, 20),
  buckle: new THREE.BoxGeometry(0.09, 0.075, 0.026),
  pouch: new THREE.CapsuleGeometry(0.072, 0.08, 4, 9),
  pack: new THREE.CapsuleGeometry(0.185, 0.25, 5, 12),
  packFlap: new THREE.SphereGeometry(0.19, 14, 10),
  strap: new THREE.BoxGeometry(0.052, 0.5, 0.025),
  smallStrap: new THREE.BoxGeometry(0.035, 0.18, 0.022),
  bedroll: new THREE.CylinderGeometry(0.075, 0.075, 0.38, 10),
  hairCap: new THREE.SphereGeometry(0.257, 20, 12, 0, Math.PI * 2, 0, Math.PI * 0.58),
  curl: new THREE.SphereGeometry(0.075, 10, 8),
  brow: new THREE.BoxGeometry(0.078, 0.016, 0.018),
  mouth: new THREE.TorusGeometry(0.057, 0.0085, 6, 18, Math.PI),
  lip: new THREE.SphereGeometry(0.045, 10, 7),
  hatBrim: new THREE.CylinderGeometry(0.45, 0.47, 0.045, 20),
  hatCrown: new THREE.CylinderGeometry(0.235, 0.275, 0.22, 14),
  hatBand: new THREE.CylinderGeometry(0.276, 0.278, 0.052, 14),
  capCrown: new THREE.CylinderGeometry(0.27, 0.29, 0.17, 14),
  capVisor: new THREE.BoxGeometry(0.33, 0.035, 0.2),
  tricornCrown: new THREE.CylinderGeometry(0.245, 0.275, 0.22, 12),
  tricornBrim: new THREE.BoxGeometry(0.72, 0.075, 0.26),
  button: new THREE.SphereGeometry(0.018, 8, 6),
  box: new THREE.BoxGeometry(1, 1, 1),
  torus: new THREE.TorusGeometry(1, 0.08, 6, 18),
  rope: new THREE.TorusGeometry(0.07, 0.016, 6, 14),
  knifeBlade: new THREE.BoxGeometry(0.035, 0.19, 0.014),
  knifeHandle: new THREE.CylinderGeometry(0.022, 0.024, 0.1, 8),
  coatTail: new THREE.SphereGeometry(1, 12, 10),
  buckleGold: new THREE.BoxGeometry(0.055, 0.045, 0.02),
  badge: new THREE.CylinderGeometry(0.04, 0.04, 0.01, 14),
  skull: new THREE.BoxGeometry(0.075, 0.07, 0.025),
  glasses: new THREE.TorusGeometry(0.043, 0.008, 5, 14),
  compass: new THREE.CylinderGeometry(0.045, 0.045, 0.018, 14),
  spyglass: new THREE.CylinderGeometry(0.025, 0.035, 0.21, 10),
  fishHook: new THREE.TorusGeometry(0.04, 0.008, 5, 10, Math.PI * 1.35),
};

function hashString(value) {
  let hash = 2166136261;
  const text = String(value || 'angler');
  for (let i = 0; i < text.length; i++) {
    hash ^= text.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return Math.abs(hash >>> 0);
}

function material(color, options = {}) {
  return new THREE.MeshStandardMaterial({
    color,
    roughness: options.roughness ?? 0.72,
    metalness: options.metalness ?? 0.02,
    transparent: Boolean(options.transparent),
    opacity: options.opacity ?? 1,
    side: options.side || THREE.FrontSide,
  });
}

function add(parent, geometry, mat, name, position = [0, 0, 0], scale = [1, 1, 1], rotation = [0, 0, 0]) {
  const part = new THREE.Mesh(geometry, mat);
  part.name = name;
  part.position.set(position[0], position[1], position[2]);
  part.scale.set(scale[0], scale[1], scale[2]);
  part.rotation.set(rotation[0], rotation[1], rotation[2]);
  part.castShadow = true;
  part.receiveShadow = true;
  parent.add(part);
  return part;
}

function pick(list, seed, fallback) {
  if (!list || list.length === 0) return fallback;
  const index = Math.abs(Math.trunc(Number(seed) || 0)) % list.length;
  return list[index] ?? fallback;
}

function buildHead(root, options, mats, seed) {
  const headGroup = new THREE.Group();
  headGroup.name = 'HeadGroup';
  headGroup.position.y = 1.77;
  root.add(headGroup);

  const faceStyle = options.faceStyle || pick(AvatarOptions.faceStyle.map((f) => f.id), seed, 'oval');
  const faceScale = faceStyle === 'square' ? [1.06, 0.97, 1.02] : faceStyle === 'round' ? [1.04, 0.94, 1.06] : [0.94, 1.05, 0.96];
  const head = add(headGroup, GEO.head, mats.skin, 'Head', [0, 0, 0], faceScale);
  add(headGroup, GEO.jaw, mats.skin, 'Jaw', [0, -0.115, 0.035], [0.9, 0.78, 0.86]);

  // Ears, inner ears and a nose with a bridge and tip give the silhouette real
  // facial anatomy even from the side.
  for (const side of [-1, 1]) {
    add(headGroup, GEO.ear, mats.skin, side < 0 ? 'EarLeft' : 'EarRight', [side * 0.245, 0.005, 0], [0.55, 0.92, 0.62]);
    add(headGroup, GEO.ear, mats.skinShadow, side < 0 ? 'EarInnerLeft' : 'EarInnerRight', [side * 0.25, 0.003, 0.035], [0.28, 0.52, 0.2]);
  }
  add(headGroup, GEO.nose, mats.skin, 'Nose', [0, 0.005, 0.225], [1, 0.85, 1], [Math.PI / 2, 0, 0]);
  add(headGroup, GEO.noseTip, mats.skin, 'NoseTip', [0, -0.03, 0.284], [1.05, 0.8, 0.9]);

  const eyeGroup = new THREE.Group();
  eyeGroup.name = 'EyeGroup';
  headGroup.add(eyeGroup);
  const eyeColor = options.eyeColor || pick([0x355c7d, 0x5b7c4a, 0x6b4f3a, 0x3f6e7a], seed >> 3, 0x355c7d);
  for (const side of [-1, 1]) {
    const x = side * 0.088;
    add(eyeGroup, GEO.eye, mats.eyeWhite, side < 0 ? 'EyeLeft' : 'EyeRight', [x, 0.052, 0.216], [1.0, 0.78, 0.55]);
    add(eyeGroup, GEO.iris, material(eyeColor, { roughness: 0.4 }), side < 0 ? 'IrisLeft' : 'IrisRight', [x, 0.052, 0.244], [1, 1, 0.5]);
    add(eyeGroup, GEO.pupil, mats.pupil, side < 0 ? 'PupilLeft' : 'PupilRight', [x, 0.052, 0.251], [1, 1, 0.5]);
    add(eyeGroup, GEO.glint, mats.glint, side < 0 ? 'GlintLeft' : 'GlintRight', [x - 0.007, 0.061, 0.255], [1, 1, 1]);
    add(headGroup, GEO.brow, mats.hair, side < 0 ? 'BrowLeft' : 'BrowRight', [x, 0.115, 0.228], [1, 1, 1], [0, 0, side * 0.08]);
  }

  const mouth = add(headGroup, GEO.mouth, mats.lip, 'Mouth', [0, -0.095, 0.231], [1.05, 0.82, 0.65], [0, 0, Math.PI]);
  add(headGroup, GEO.lip, mats.lip, 'LowerLip', [0, -0.119, 0.226], [0.9, 0.28, 0.38]);

  // Optional spectacles: two real rings plus a bridge.
  if (options.glasses) {
    for (const side of [-1, 1]) {
      add(headGroup, GEO.glasses, mats.metal, side < 0 ? 'GlassesLeft' : 'GlassesRight', [side * 0.09, 0.054, 0.245], [1, 0.95, 1]);
    }
    add(headGroup, GEO.smallStrap, mats.metal, 'GlassesBridge', [0, 0.056, 0.252], [0.85, 0.18, 0.35]);
  }

  const hairStyle = options.hairStyle || pick(AvatarOptions.hairStyle.map((h) => h.id), seed >> 5, 'short');
  if (hairStyle !== 'bald') {
    add(headGroup, GEO.hairCap, mats.hair, 'HairCap', [0, 0.055, -0.006], [1.03, 0.92, 1.0]);
    if (hairStyle === 'wavy' || hairStyle === 'long') {
      for (let i = 0; i < 5; i++) {
        const side = i % 2 === 0 ? -1 : 1;
        add(headGroup, GEO.curl, mats.hair, `HairCurl${i}`, [side * (0.19 + (i % 3) * 0.018), 0.11 - i * 0.045, -0.12 + (i % 2) * 0.04], [0.82, 1.05, 0.75]);
      }
    }
    if (hairStyle === 'long') {
      for (const side of [-1, 1]) {
        add(headGroup, GEO.curl, mats.hair, side < 0 ? 'HairSideLeft' : 'HairSideRight', [side * 0.225, -0.03, -0.02], [0.72, 2.0, 0.7]);
      }
    }
    if (hairStyle === 'ponytail') {
      add(headGroup, GEO.curl, mats.hair, 'Ponytail', [0, 0.02, -0.27], [0.85, 1.8, 0.8]);
      add(headGroup, GEO.hatBand, mats.band, 'HairTie', [0, 0.08, -0.265], [0.28, 0.18, 0.28]);
    }
  }

  const facialHair = options.facialHair || (options.beardColor ? 'beard' : 'none');
  if (facialHair !== 'none') {
    const beardMat = mats.beard;
    if (facialHair === 'stubble') {
      add(headGroup, GEO.jaw, beardMat, 'Stubble', [0, -0.105, 0.04], [0.92, 0.74, 0.9]);
    } else {
      add(headGroup, GEO.jaw, beardMat, 'BeardBase', [0, -0.14, 0.03], [0.88, 0.86, 0.92]);
      for (let i = 0; i < 4; i++) {
        const x = -0.12 + i * 0.08;
        add(headGroup, GEO.nose, beardMat, `BeardTuft${i}`, [x, -0.235 + Math.abs(x) * 0.22, 0.12], [0.7, 0.9, 0.55], [Math.PI, 0, 0]);
      }
      if (facialHair === 'beard') {
        for (const side of [-1, 1]) {
          add(headGroup, GEO.curl, beardMat, side < 0 ? 'SideburnLeft' : 'SideburnRight', [side * 0.19, -0.03, 0.12], [0.52, 0.9, 0.4]);
        }
      }
    }
    if (facialHair === 'moustache' || facialHair === 'beard') {
      for (const side of [-1, 1]) {
        add(headGroup, GEO.curl, beardMat, side < 0 ? 'MoustacheLeft' : 'MoustacheRight', [side * 0.048, -0.058, 0.244], [0.72, 0.24, 0.28], [0, 0, side * 0.25]);
      }
    }
  }

  const hatStyle = options.hatStyle || (options.isPirate ? 'tricorn' : options.isShopkeeper ? 'merchant' : 'captain');
  const hatGroup = new THREE.Group();
  hatGroup.name = 'HatGroup';
  headGroup.add(hatGroup);
  if (hatStyle === 'straw') {
    add(hatGroup, GEO.hatBrim, mats.hat, 'StrawBrim', [0, 0.20, 0], [1, 1, 1]);
    add(hatGroup, GEO.hatCrown, mats.hat, 'StrawCrown', [0, 0.32, 0], [1, 1, 1]);
    add(hatGroup, GEO.hatBand, mats.band, 'StrawBand', [0, 0.235, 0], [1, 1, 1]);
  } else if (hatStyle === 'captain') {
    add(hatGroup, GEO.capCrown, mats.hat, 'CaptainCrown', [0, 0.265, 0], [1, 1, 1]);
    add(hatGroup, GEO.capVisor, mats.hatDark, 'CaptainVisor', [0, 0.19, 0.15], [1, 1, 1], [0.15, 0, 0]);
    add(hatGroup, GEO.hatBand, mats.band, 'CaptainBand', [0, 0.205, 0], [0.93, 0.38, 0.93]);
    add(hatGroup, GEO.badge, mats.gold, 'CaptainBadge', [0, 0.27, 0.285], [1, 1, 1], [Math.PI / 2, 0, 0]);
  } else if (hatStyle === 'tricorn') {
    add(hatGroup, GEO.tricornCrown, mats.hat, 'TricornCrown', [0, 0.29, 0]);
    for (let i = 0; i < 3; i++) {
      const angle = (i / 3) * Math.PI * 2;
      add(hatGroup, GEO.tricornBrim, mats.hat, `TricornBrim${i}`, [Math.sin(angle) * 0.14, 0.235, Math.cos(angle) * 0.14], [1, 1, 0.72], [0, angle, 0.06]);
    }
    add(hatGroup, GEO.skull, mats.bone, 'TricornSkull', [0, 0.29, 0.255], [1, 1, 1]);
    add(hatGroup, GEO.smallStrap, mats.bone, 'TricornBoneA', [0, 0.255, 0.258], [1.4, 1, 1], [0, 0, 0.55]);
    add(hatGroup, GEO.smallStrap, mats.bone, 'TricornBoneB', [0, 0.255, 0.258], [1.4, 1, 1], [0, 0, -0.55]);
  } else if (hatStyle === 'merchant') {
    add(hatGroup, GEO.hatBrim, mats.hat, 'MerchantBrim', [0, 0.21, 0], [0.78, 0.45, 0.78]);
    add(hatGroup, GEO.capCrown, mats.hat, 'MerchantCrown', [0, 0.285, 0], [0.92, 0.6, 0.92]);
    add(hatGroup, GEO.hatBand, mats.band, 'MerchantBand', [0, 0.225, 0], [0.9, 0.35, 0.9]);
  }

  return { headGroup, head, eyeGroup, mouth, hatGroup };
}

function buildArm(parent, side, mats, isPirate) {
  const arm = new THREE.Group();
  arm.name = side < 0 ? 'LeftArm' : 'RightArm';
  arm.position.set(side * 0.375, 1.39, 0);
  parent.add(arm);

  add(arm, GEO.upperArm, mats.shirt, side < 0 ? 'UpperArmLeft' : 'UpperArmRight', [0, -0.16, 0], [1, 1, 1], [0, 0, side * 0.035]);
  add(arm, GEO.forearm, mats.skin, side < 0 ? 'ForearmLeft' : 'ForearmRight', [side * 0.008, -0.42, 0.015], [0.92, 1, 0.92]);
  add(arm, GEO.hatBand, mats.shirt, side < 0 ? 'CuffLeft' : 'CuffRight', [side * 0.008, -0.30, 0.015], [0.19, 0.22, 0.19]);
  const hand = add(arm, GEO.hand, mats.skin, side < 0 ? 'HandLeft' : 'HandRight', [side * 0.012, -0.585, 0.02], [0.95, 1.1, 0.72]);

  if (isPirate && side < 0) {
    add(arm, GEO.hatBand, mats.gold, 'HookSocket', [0, -0.625, 0.02], [0.14, 0.18, 0.14]);
    add(arm, GEO.fishHook, mats.metal, 'PirateHook', [0.02, -0.72, 0.05], [1, 1, 1], [0, 0.2, Math.PI / 2]);
    return arm;
  }

  for (let i = 0; i < 3; i++) {
    add(arm, GEO.finger, mats.skin, `Finger${side < 0 ? 'L' : 'R'}${i}`, [side * (0.012 + (i - 1) * 0.026), -0.665, 0.045 - i * 0.002], [0.85, 1, 0.85], [0.18, 0, 0]);
  }
  add(arm, GEO.finger, mats.skin, side < 0 ? 'ThumbLeft' : 'ThumbRight', [side * 0.055, -0.58, 0.065], [1.2, 0.8, 0.95], [0, 0, side * 0.85]);
  return arm;
}

function buildLeg(parent, side, mats) {
  const leg = new THREE.Group();
  leg.name = side < 0 ? 'LeftLeg' : 'RightLeg';
  leg.position.set(side * 0.155, 0.86, 0);
  parent.add(leg);

  add(leg, GEO.thigh, mats.pants, side < 0 ? 'ThighLeft' : 'ThighRight', [0, -0.2, 0], [1, 1, 1]);
  add(leg, GEO.calf, mats.pants, side < 0 ? 'CalfLeft' : 'CalfRight', [0, -0.5, 0.005], [1, 1, 1]);
  add(leg, GEO.bootShaft, mats.boot, side < 0 ? 'BootShaftLeft' : 'BootShaftRight', [0, -0.68, 0.015], [1, 1, 1]);
  add(leg, GEO.boot, mats.boot, side < 0 ? 'BootLeft' : 'BootRight', [0, -0.80, 0.065], [1.05, 0.72, 1.65]);
  add(leg, GEO.box, mats.bootDark, side < 0 ? 'SoleLeft' : 'SoleRight', [0, -0.855, 0.065], [0.19, 0.035, 0.34]);
  for (let i = 0; i < 3; i++) {
    add(leg, GEO.smallStrap, mats.metal, `BootLace${side}${i}`, [0, -0.62 - i * 0.035, 0.105], [0.7, 0.12, 0.16]);
  }
  return leg;
}

function buildBelt(parent, mats, seed) {
  add(parent, GEO.belt, mats.leather, 'Belt', [0, 0.83, 0], [1, 1, 0.76], [Math.PI / 2, 0, 0]);
  add(parent, GEO.buckle, mats.gold, 'BeltBuckle', [0, 0.83, 0.27], [1, 1, 1]);
  const pouchSide = seed % 2 === 0 ? -1 : 1;
  add(parent, GEO.pouch, mats.leather, 'BeltPouch', [pouchSide * 0.27, 0.72, 0.10], [1, 1.1, 0.8], [0, 0, pouchSide * 0.08]);
  add(parent, GEO.smallStrap, mats.leatherDark, 'PouchFlap', [pouchSide * 0.27, 0.775, 0.17], [1.25, 0.55, 0.35]);
  add(parent, GEO.buckleGold, mats.gold, 'PouchBuckle', [pouchSide * 0.27, 0.745, 0.195], [1, 1, 1]);

  // Knife sheath on the opposite hip.
  add(parent, GEO.knifeHandle, mats.leatherDark, 'KnifeHandle', [-pouchSide * 0.27, 0.68, 0.10], [1, 1, 1], [0, 0, -pouchSide * 0.16]);
  add(parent, GEO.knifeBlade, mats.metal, 'KnifeBlade', [-pouchSide * 0.27, 0.51, 0.10], [1, 1, 1], [0, 0, -pouchSide * 0.16]);
  add(parent, GEO.rope, mats.rope, 'BeltRope', [pouchSide * 0.20, 0.80, -0.20], [1, 1, 0.65], [Math.PI / 2, 0, 0]);
}

function buildPack(parent, style, mats) {
  const pack = new THREE.Group();
  pack.name = 'Backpack';
  parent.add(pack);

  if (style === 'satchel' || style === 'pirate') {
    const side = style === 'pirate' ? -1 : 1;
    add(pack, GEO.pack, mats.leather, 'SatchelBody', [side * 0.34, 0.99, 0.02], [0.7, 0.68, 0.5], [0, 0, side * 0.12]);
    add(pack, GEO.packFlap, mats.leatherDark, 'SatchelFlap', [side * 0.34, 1.10, 0.12], [0.8, 0.46, 0.45]);
    add(pack, GEO.strap, mats.leather, 'SatchelStrap', [0, 1.22, 0.22], [0.82, 1.22, 0.9], [0, 0, side * 0.53]);
    add(pack, GEO.buckleGold, mats.gold, 'SatchelBuckle', [side * 0.34, 1.04, 0.15], [1.15, 1, 1]);
    if (style === 'pirate') {
      add(pack, GEO.tricornBrim, mats.leatherDark, 'Bandolier', [0, 1.18, 0.22], [0.55, 0.75, 0.45], [0, 0, -0.6]);
      add(pack, GEO.skull, mats.bone, 'SatchelSkull', [side * 0.34, 1.08, 0.16], [1, 1, 1]);
    }
    return pack;
  }

  if (style === 'none') return pack;

  // Expedition / fishing packs sit high on the back with shoulder straps,
  // buckles, a bedroll and a hanging tool.
  add(pack, GEO.pack, style === 'fishing' ? mats.canvas : mats.leather, 'PackBody', [0, 1.17, -0.32], [1.0, 0.95, 0.72]);
  add(pack, GEO.packFlap, mats.leatherDark, 'PackFlap', [0, 1.31, -0.40], [1.0, 0.48, 0.36]);
  add(pack, GEO.bedroll, mats.canvas, 'Bedroll', [0, 1.48, -0.34], [1, 1, 1], [0, 0, Math.PI / 2]);
  add(pack, GEO.smallStrap, mats.leatherDark, 'BedrollTieA', [-0.12, 1.48, -0.34], [0.7, 1, 0.6]);
  add(pack, GEO.smallStrap, mats.leatherDark, 'BedrollTieB', [0.12, 1.48, -0.34], [0.7, 1, 0.6]);
  for (const side of [-1, 1]) {
    add(pack, GEO.strap, mats.leather, side < 0 ? 'PackStrapLeft' : 'PackStrapRight', [side * 0.19, 1.26, 0.16], [0.9, 1.25, 0.95], [0, 0, side * 0.08]);
    add(pack, GEO.buckleGold, mats.gold, side < 0 ? 'PackBuckleLeft' : 'PackBuckleRight', [side * 0.19, 1.15, 0.205], [1, 1, 1]);
  }
  add(pack, GEO.rope, mats.rope, 'PackRope', [0.23, 1.02, -0.40], [1, 1, 0.7], [Math.PI / 2, 0.3, 0]);
  if (style === 'fishing') {
    add(pack, GEO.spyglass, mats.metal, 'RodTube', [0.24, 1.30, -0.39], [1, 1.75, 1], [0.08, 0, -0.14]);
    add(pack, GEO.fishHook, mats.gold, 'PackHook', [-0.22, 1.00, -0.42], [1, 1, 1], [0, 0, 0.2]);
  } else {
    add(pack, GEO.compass, mats.gold, 'PackCompass', [0.24, 1.12, -0.45], [1, 1, 1], [Math.PI / 2, 0, 0]);
  }
  return pack;
}

function buildClothing(root, options, mats) {
  const isPirate = Boolean(options.isPirate);
  const apron = Boolean(options.apron || options.isShopkeeper);

  add(root, GEO.hips, mats.pants, 'Hips', [0, 0.82, 0], [1, 0.9, 0.78]);
  add(root, GEO.torso, mats.shirt, 'Torso', [0, 1.15, 0], [1.04, 1.0, 0.75]);
  add(root, GEO.neck, mats.skin, 'Neck', [0, 1.56, 0]);

  // Collar and a practical row of buttons.
  add(root, GEO.torus, mats.shirtLight, 'Collar', [0, 1.52, 0], [0.13, 0.13, 0.13], [Math.PI / 2, 0, 0]);
  for (let i = 0; i < 3; i++) {
    add(root, GEO.button, mats.gold, `CoatButton${i}`, [0, 1.36 - i * 0.13, 0.225], [1, 1, 1]);
  }

  if (apron) {
    const shape = new THREE.Shape();
    shape.moveTo(-0.23, 0.16);
    shape.lineTo(0.23, 0.16);
    shape.lineTo(0.18, -0.52);
    shape.lineTo(-0.18, -0.52);
    shape.closePath();
    const apronMesh = new THREE.Mesh(new THREE.ShapeGeometry(shape), mats.apron);
    apronMesh.name = 'Apron';
    apronMesh.position.set(0, 1.05, 0.245);
    root.add(apronMesh);
    add(root, GEO.smallStrap, mats.apronDark, 'ApronPocket', [0, 0.95, 0.25], [3.6, 1.5, 0.25]);
    add(root, GEO.smallStrap, mats.leatherDark, 'ApronTie', [0, 1.15, 0.25], [5.2, 0.22, 0.25]);
  }

  if (isPirate) {
    add(root, GEO.belt, mats.redSash, 'CorsairSash', [0, 0.9, 0], [0.98, 1, 0.8], [Math.PI / 2, 0, 0]);
    add(root, GEO.buckle, mats.gold, 'CorsairBuckle', [0, 0.89, 0.25], [1.15, 1.15, 1]);
    for (const side of [-1, 1]) {
      add(root, GEO.coatTail, mats.shirtDark, side < 0 ? 'CoatTailLeft' : 'CoatTailRight', [side * 0.21, 0.68, -0.14], [0.22, 0.38, 0.12], [0.18, 0, side * 0.12]);
    }
    add(root, GEO.spyglass, mats.gold, 'CorsairSpyglass', [0.29, 1.0, -0.12], [1, 1.15, 1], [0.18, 0, -0.15]);
  } else {
    // Lightweight coat tails for captains and merchants.
    for (const side of [-1, 1]) {
      add(root, GEO.coatTail, mats.shirtDark, side < 0 ? 'CoatTailLeft' : 'CoatTailRight', [side * 0.2, 0.73, -0.16], [0.2, 0.3, 0.1], [0.1, 0, side * 0.08]);
    }
  }

  // Neck scarf for cold-weather / pirate silhouettes.
  if (options.scarf || isPirate) {
    add(root, GEO.belt, mats.accent, 'NeckScarf', [0, 1.54, 0], [0.56, 0.6, 0.56], [Math.PI / 2, 0, 0]);
    add(root, GEO.smallStrap, mats.accent, 'ScarfTail', [0.14, 1.38, 0.2], [1.3, 2.2, 0.7], [0.1, 0, 0.24]);
  }
}

/**
 * Creates a complete avatar. `group` is an origin-rooted rig; the caller places
 * it in the world. `parts` exposes animation pivots and named facial details.
 */
export function createAvatar(options = {}) {
  const seed = hashString(options.id || options.name || options.seed || 'angler');
  const isPirate = Boolean(options.isPirate);
  const skinColor = options.skinColor ?? 0xffccaa;
  const shirtColor = options.shirtColor ?? (isPirate ? 0x8b1e1e : 0x3377aa);
  const pantsColor = options.pantsColor ?? (isPirate ? 0x2b2520 : 0x334455);
  const hatColor = options.hatColor ?? (isPirate ? 0x24242a : 0xddbb77);
  const bandColor = options.bandColor ?? 0xaa3333;
  const hairColor = options.hairColor ?? options.beardColor ?? 0x3a2418;

  const mats = {
    skin: material(skinColor, { roughness: 0.82 }),
    skinShadow: material(new THREE.Color(skinColor).multiplyScalar(0.82), { roughness: 0.86 }),
    hair: material(hairColor, { roughness: 0.94 }),
    beard: material(options.beardColor ?? hairColor, { roughness: 0.96, transparent: options.facialHair === 'stubble', opacity: options.facialHair === 'stubble' ? 0.4 : 1 }),
    eyeWhite: material(0xf5f0e4, { roughness: 0.5 }),
    pupil: material(0x12100e, { roughness: 0.35 }),
    glint: material(0xffffff, { roughness: 0.2, metalness: 0.0 }),
    lip: material(options.lipColor ?? new THREE.Color(skinColor).multiplyScalar(0.78), { roughness: 0.8 }),
    shirt: material(shirtColor, { roughness: 0.86 }),
    shirtLight: material(new THREE.Color(shirtColor).multiplyScalar(1.12), { roughness: 0.84 }),
    shirtDark: material(new THREE.Color(shirtColor).multiplyScalar(0.68), { roughness: 0.9 }),
    pants: material(pantsColor, { roughness: 0.9 }),
    boot: material(options.bootColor ?? 0x2d2118, { roughness: 0.93 }),
    bootDark: material(0x17110d, { roughness: 0.96 }),
    leather: material(0x6b4a2f, { roughness: 0.92 }),
    leatherDark: material(0x3d2a1d, { roughness: 0.95 }),
    canvas: material(0x856b48, { roughness: 0.98 }),
    apron: material(0xcbb08a, { roughness: 0.96 }),
    apronDark: material(0xa68a62, { roughness: 0.96 }),
    hat: material(hatColor, { roughness: 0.86 }),
    hatDark: material(new THREE.Color(hatColor).multiplyScalar(0.62), { roughness: 0.9 }),
    band: material(bandColor, { roughness: 0.75 }),
    redSash: material(0xa81c1c, { roughness: 0.8 }),
    gold: material(0xd9a441, { roughness: 0.34, metalness: 0.55 }),
    metal: material(0xb8c2c9, { roughness: 0.3, metalness: 0.8 }),
    bone: material(0xe8dfc8, { roughness: 0.78 }),
    rope: material(0xb08a52, { roughness: 0.98 }),
    accent: material(options.accentColor ?? (isPirate ? 0xa81c1c : 0x3b6ea8), { roughness: 0.8 }),
  };

  const group = new THREE.Group();
  group.name = options.name ? `Avatar_${options.name}` : 'DetailedAvatar';
  group.userData.avatar = { faceStyle: options.faceStyle || null, seed };

  const face = buildHead(group, { ...options, isPirate }, mats, seed);
  buildClothing(group, { ...options, isPirate }, mats);
  const leftArm = buildArm(group, -1, mats, isPirate);
  const rightArm = buildArm(group, 1, mats, isPirate);
  const leftLeg = buildLeg(group, -1, mats);
  const rightLeg = buildLeg(group, 1, mats);
  buildBelt(group, mats, seed);

  const backpackStyle = options.backpackStyle ?? (isPirate ? 'pirate' : options.isShopkeeper ? 'satchel' : 'expedition');
  const backpack = buildPack(group, backpackStyle, mats);

  const torso = group.getObjectByName('Torso');
  if (torso) torso.userData.baseScale = torso.scale.clone();

  return {
    group,
    parts: {
      torso,
      headGroup: face.headGroup,
      head: face.head,
      eyeGroup: face.eyeGroup,
      mouth: face.mouth,
      hatGroup: face.hatGroup,
      hat: face.hatGroup,
      nose: group.getObjectByName('Nose'),
      earLeft: group.getObjectByName('EarLeft'),
      earRight: group.getObjectByName('EarRight'),
      browLeft: group.getObjectByName('BrowLeft'),
      browRight: group.getObjectByName('BrowRight'),
      leftArm,
      rightArm,
      leftLeg,
      rightLeg,
      backpack,
      belt: group.getObjectByName('Belt'),
      faceDetails: ['Nose', 'EarLeft', 'EarRight', 'EyeLeft', 'EyeRight', 'Mouth', 'BrowLeft', 'BrowRight'].map((name) => group.getObjectByName(name)).filter(Boolean),
    },
    materials: mats,
    backpackStyle,
    faceStyle: options.faceStyle || null,
    hairStyle: options.hairStyle || null,
  };
}

export { hashString };
export default createAvatar;
