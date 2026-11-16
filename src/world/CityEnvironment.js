// CityEnvironment: the physical skyline of Aurelia Heights. Towers, avenues,
// a central plaza, waterfront and street furniture are all built from simple
// Three.js primitives so the city remains cheap to render alongside the ocean.

import * as THREE from 'three';
import { CityIsland } from './cityIsland.js';

const TOWER_DEFS = [
  { x: -50, z: 47, w: 15, d: 15, h: 150, color: 0x9bd7e8, accent: 0x7dd3fc, crown: 'spire' },
  { x: -35, z: 24, w: 12, d: 12, h: 132, color: 0xbfe3f0, accent: 0x38bdf8, crown: 'antenna' },
  { x: -62, z: 6, w: 14, d: 13, h: 118, color: 0xc8d7e8, accent: 0x60a5fa, crown: 'spire' },
  { x: 50, z: 47, w: 14, d: 14, h: 104, color: 0xd9e6f2, accent: 0x38bdf8, crown: 'antenna' },
  { x: 35, z: 24, w: 11, d: 12, h: 98, color: 0xa9c6da, accent: 0x7dd3fc, crown: 'flat' },
  { x: 62, z: 4, w: 15, d: 14, h: 92, color: 0xbfd6e6, accent: 0x22d3ee, crown: 'spire' },
  { x: -50, z: -46, w: 13, d: 14, h: 88, color: 0xc4d8e8, accent: 0x60a5fa, crown: 'antenna' },
  { x: -30, z: -62, w: 12, d: 12, h: 82, color: 0x9fc3d8, accent: 0x38bdf8, crown: 'flat' },
  { x: 50, z: -46, w: 14, d: 13, h: 76, color: 0xcfe0ee, accent: 0x7dd3fc, crown: 'spire' },
  { x: 30, z: -62, w: 12, d: 12, h: 68, color: 0xa8c4d8, accent: 0x22d3ee, crown: 'flat' },
  { x: -63, z: -28, w: 10, d: 10, h: 60, color: 0xd8c3a5, accent: 0xfbbf24, crown: 'flat' },
  { x: 63, z: -28, w: 10, d: 10, h: 54, color: 0xd8c3a5, accent: 0xfbbf24, crown: 'flat' },
  { x: -18, z: 66, w: 12, d: 11, h: 48, color: 0xc9a878, accent: 0xffd166, crown: 'flat' },
  { x: 18, z: 66, w: 12, d: 11, h: 42, color: 0xc9a878, accent: 0xffd166, crown: 'flat' },
  { x: -66, z: 30, w: 9, d: 9, h: 38, color: 0xbfb6a8, accent: 0xfbbf24, crown: 'flat' },
  { x: 66, z: 30, w: 9, d: 9, h: 30, color: 0xbfb6a8, accent: 0xfbbf24, crown: 'flat' },
];

const LAMP_POSITIONS = [
  [-55, 21], [-30, 21], [0, 21], [30, 21], [55, 21],
  [-55, -21], [-30, -21], [0, -21], [30, -21], [55, -21],
  [-21, -55], [-21, -30], [-21, 0], [-21, 30], [-21, 55],
  [21, -55], [21, -30], [21, 0], [21, 30], [21, 55],
];

export class CityEnvironment {
  constructor(container, collider) {
    this.container = container;
    this.collider = collider;
    this.group = new THREE.Group();
    this.group.name = 'CityEnvironment_Aurelia';
    this.animTime = 0;
    this.antennaMarkers = [];
    this._build();
    this.container.add(this.group);
  }

  _point(x, z) {
    return { x: CityIsland.center.x + x, z: CityIsland.center.z + z };
  }

  _build() {
    this._buildAvenues();
    this._buildPlaza();
    this._buildTowers();
    this._buildStreetLamps();
    this._buildWaterfront();
    this._buildCityGreenery();
  }

  _buildAvenues() {
    const roadMat = new THREE.MeshLambertMaterial({ color: CityIsland.palette.road });
    const lineMat = new THREE.MeshBasicMaterial({ color: 0xf7e7a1 });
    const roadY = CityIsland.peakHeight + 0.35;

    // Main avenues crossing at the plaza.
    const northSouth = new THREE.Mesh(new THREE.BoxGeometry(10, 0.16, 126), roadMat);
    northSouth.position.set(CityIsland.center.x, roadY, CityIsland.center.z);
    northSouth.receiveShadow = true;
    this.group.add(northSouth);

    const eastWest = new THREE.Mesh(new THREE.BoxGeometry(126, 0.16, 10), roadMat);
    eastWest.position.set(CityIsland.center.x, roadY + 0.01, CityIsland.center.z);
    eastWest.receiveShadow = true;
    this.group.add(eastWest);

    // Outer ring roads frame the central blocks.
    for (const [dx, dz, sx, sz] of [
      [0, 58, 110, 8], [0, -58, 110, 8], [-58, 0, 8, 110], [58, 0, 8, 110],
    ]) {
      const road = new THREE.Mesh(new THREE.BoxGeometry(sx, 0.14, sz), roadMat);
      road.position.set(CityIsland.center.x + dx, roadY + 0.02, CityIsland.center.z + dz);
      road.receiveShadow = true;
      this.group.add(road);
    }

    // Painted centre dashes on the main avenues.
    for (let i = -5; i <= 5; i++) {
      if (i === 0) continue;
      const vertical = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.04, 3.2), lineMat);
      vertical.position.set(CityIsland.center.x, roadY + 0.12, CityIsland.center.z + i * 10);
      this.group.add(vertical);

      const horizontal = new THREE.Mesh(new THREE.BoxGeometry(3.2, 0.04, 0.35), lineMat);
      horizontal.position.set(CityIsland.center.x + i * 10, roadY + 0.13, CityIsland.center.z);
      this.group.add(horizontal);
    }
  }

  _buildPlaza() {
    const plazaMat = new THREE.MeshLambertMaterial({ color: CityIsland.palette.plaza });
    const trimMat = new THREE.MeshLambertMaterial({ color: 0xd7c9a8 });
    const waterMat = new THREE.MeshPhongMaterial({ color: 0x5ec8e5, shininess: 80, transparent: true, opacity: 0.85 });
    const baseY = CityIsland.peakHeight + 0.42;

    const plaza = new THREE.Mesh(new THREE.CylinderGeometry(20, 20.5, 0.28, 32), plazaMat);
    plaza.position.set(CityIsland.center.x, baseY, CityIsland.center.z);
    plaza.receiveShadow = true;
    this.group.add(plaza);

    const ring = new THREE.Mesh(new THREE.TorusGeometry(15.5, 0.45, 8, 40), trimMat);
    ring.position.set(CityIsland.center.x, baseY + 0.2, CityIsland.center.z);
    ring.rotation.x = Math.PI / 2;
    this.group.add(ring);

    const fountainBase = new THREE.Mesh(new THREE.CylinderGeometry(6, 6.6, 1.0, 20), trimMat);
    fountainBase.position.set(CityIsland.center.x, baseY + 0.45, CityIsland.center.z);
    this.group.add(fountainBase);

    const fountainWater = new THREE.Mesh(new THREE.CylinderGeometry(5.2, 5.2, 0.25, 20), waterMat);
    fountainWater.position.set(CityIsland.center.x, baseY + 0.98, CityIsland.center.z);
    this.group.add(fountainWater);

    const column = new THREE.Mesh(
      new THREE.CylinderGeometry(0.8, 1.2, 5.2, 10),
      new THREE.MeshLambertMaterial({ color: 0xe8dcc0 })
    );
    column.position.set(CityIsland.center.x, baseY + 3.2, CityIsland.center.z);
    column.castShadow = true;
    this.group.add(column);

    const globe = new THREE.Mesh(
      new THREE.SphereGeometry(1.1, 16, 12),
      new THREE.MeshBasicMaterial({ color: 0xffe08a })
    );
    globe.position.set(CityIsland.center.x, baseY + 6.1, CityIsland.center.z);
    this.group.add(globe);
    this.fountainGlobe = globe;

    const light = new THREE.PointLight(0x9ee8ff, 1.4, 42);
    light.position.set(CityIsland.center.x, baseY + 7.2, CityIsland.center.z);
    this.group.add(light);
  }

  _buildTowers() {
    for (let index = 0; index < TOWER_DEFS.length; index++) {
      const def = TOWER_DEFS[index];
      const point = this._point(def.x, def.z);
      const ground = this.collider.sampleHeight(point.x, point.z);
      const baseY = Math.max(CityIsland.peakHeight, ground) - 0.1;

      const group = new THREE.Group();
      group.position.set(point.x, baseY, point.z);
      group.rotation.y = (index % 4) * Math.PI * 0.06;

      const glassMat = new THREE.MeshLambertMaterial({ color: def.color, flatShading: true });
      const trimMat = new THREE.MeshLambertMaterial({ color: 0x44515f });
      const glowMat = new THREE.MeshBasicMaterial({ color: def.accent });

      const body = new THREE.Mesh(new THREE.BoxGeometry(def.w, def.h, def.d), glassMat);
      body.position.y = def.h / 2;
      body.castShadow = true;
      body.receiveShadow = true;
      group.add(body);

      const base = new THREE.Mesh(new THREE.BoxGeometry(def.w + 2.2, 2.2, def.d + 2.2), trimMat);
      base.position.y = 1.1;
      group.add(base);

      // Vertical window bands on every face.
      for (let band = 0; band < 3; band++) {
        const offset = (band - 1) * (def.w * 0.26);
        for (const [px, pz, rotY] of [
          [offset, def.d / 2 + 0.04, 0],
          [offset, -def.d / 2 - 0.04, 0],
          [def.w / 2 + 0.04, offset, Math.PI / 2],
          [-def.w / 2 - 0.04, offset, Math.PI / 2],
        ]) {
          const strip = new THREE.Mesh(
            new THREE.BoxGeometry(Math.max(0.6, def.w * 0.1), def.h * 0.82, 0.12),
            glowMat
          );
          strip.position.set(px, def.h * 0.52, pz);
          strip.rotation.y = rotY;
          group.add(strip);
        }
      }

      // Rooftop crown.
      if (def.crown === 'spire') {
        const crown = new THREE.Mesh(new THREE.ConeGeometry(def.w * 0.5, def.h * 0.08, 6), trimMat);
        crown.position.y = def.h + def.h * 0.04;
        group.add(crown);
        const spire = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.22, def.h * 0.12, 6), glowMat);
        spire.position.y = def.h + def.h * 0.13;
        group.add(spire);
        this.antennaMarkers.push(spire);
      } else if (def.crown === 'antenna') {
        const roof = new THREE.Mesh(new THREE.BoxGeometry(def.w * 0.7, 1.2, def.d * 0.7), trimMat);
        roof.position.y = def.h + 0.6;
        group.add(roof);
        const antenna = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.18, def.h * 0.18, 6), glowMat);
        antenna.position.y = def.h + def.h * 0.11;
        group.add(antenna);
        this.antennaMarkers.push(antenna);
      } else {
        const roof = new THREE.Mesh(new THREE.BoxGeometry(def.w + 1.4, 0.8, def.d + 1.4), trimMat);
        roof.position.y = def.h + 0.3;
        group.add(roof);
      }

      // A handful of lit windows near the base keep the streets readable.
      if (index % 3 === 0) {
        const lamp = new THREE.PointLight(def.accent, 1.1, 34);
        lamp.position.set(0, 7, 0);
        group.add(lamp);
      }

      this.group.add(group);
    }
  }

  _buildStreetLamps() {
    const postMat = new THREE.MeshLambertMaterial({ color: 0x2b3542 });
    const bulbMat = new THREE.MeshBasicMaterial({ color: 0xffe08a });
    for (let i = 0; i < LAMP_POSITIONS.length; i++) {
      const [dx, dz] = LAMP_POSITIONS[i];
      const point = this._point(dx, dz);
      const ground = Math.max(CityIsland.peakHeight + 0.4, this.collider.sampleHeight(point.x, point.z));
      const post = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.16, 4.2, 6), postMat);
      post.position.set(point.x, ground + 2.1, point.z);
      post.castShadow = true;
      this.group.add(post);

      const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.28, 8, 6), bulbMat);
      bulb.position.set(point.x, ground + 4.3, point.z);
      this.group.add(bulb);

      if (i % 4 === 0) {
        const light = new THREE.PointLight(0xffc966, 0.8, 16);
        light.position.copy(bulb.position);
        this.group.add(light);
      }
    }
  }

  _buildWaterfront() {
    const point = { x: CityIsland.dock.x, z: CityIsland.dock.z };
    const deckMat = new THREE.MeshLambertMaterial({ color: 0x6e5239 });
    const trimMat = new THREE.MeshLambertMaterial({ color: 0x44515f });
    const lampMat = new THREE.MeshBasicMaterial({ color: 0xffe08a });

    // The pier reaches from the beach into the channel. Its landward end is
    // allowed to meet the slope; the seaward end floats at the waterline.
    const deck = new THREE.Mesh(new THREE.BoxGeometry(7.0, 0.4, 34.0), deckMat);
    deck.position.set(point.x, 1.0, point.z - 10);
    deck.castShadow = true;
    deck.receiveShadow = true;
    this.group.add(deck);

    for (let i = 0; i < 5; i++) {
      for (const offset of [-3.4, 3.4]) {
        const pile = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.28, 4.2, 6), trimMat);
        pile.position.set(point.x + offset, -0.8, point.z - 24 + i * 7);
        pile.castShadow = true;
        this.group.add(pile);
      }
    }

    for (const offset of [-3.4, 3.4]) {
      const post = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.12, 3.0, 6), trimMat);
      post.position.set(point.x + offset, 2.6, point.z + 2.5);
      this.group.add(post);
      const lamp = new THREE.Mesh(new THREE.SphereGeometry(0.24, 8, 6), lampMat);
      lamp.position.set(point.x + offset, 4.2, point.z + 2.5);
      this.group.add(lamp);
    }

    // A small moored ferry hull completes the waterfront silhouette.
    const ferry = new THREE.Group();
    ferry.position.set(point.x, 0.15, point.z + 3.6);
    const hull = new THREE.Mesh(
      new THREE.BoxGeometry(4.0, 0.8, 8.0),
      new THREE.MeshLambertMaterial({ color: 0xf4f1de })
    );
    hull.position.y = 0.4;
    hull.castShadow = true;
    ferry.add(hull);
    const cabin = new THREE.Mesh(
      new THREE.BoxGeometry(2.4, 1.1, 3.2),
      new THREE.MeshLambertMaterial({ color: 0x1e6f8f })
    );
    cabin.position.y = 1.2;
    ferry.add(cabin);
    const stack = new THREE.Mesh(
      new THREE.CylinderGeometry(0.28, 0.34, 1.2, 8),
      new THREE.MeshLambertMaterial({ color: 0x44515f })
    );
    stack.position.set(0, 2.2, 0.8);
    ferry.add(stack);
    this.group.add(ferry);
  }

  _buildCityGreenery() {
    const trunkMat = new THREE.MeshLambertMaterial({ color: 0x6e5239 });
    const leafMat = new THREE.MeshLambertMaterial({ color: CityIsland.palette.foliage, flatShading: true });
    const planterMat = new THREE.MeshLambertMaterial({ color: 0xa59b8a });
    const offsets = [
      [-18, 18], [18, 18], [-18, -18], [18, -18],
      [-44, 34], [44, 34], [-44, -34], [44, -34],
      [-70, 18], [70, 18], [-8, 54], [8, -54],
    ];
    for (let i = 0; i < offsets.length; i++) {
      const point = this._point(offsets[i][0], offsets[i][1]);
      const ground = Math.max(CityIsland.peakHeight + 0.45, this.collider.sampleHeight(point.x, point.z));
      const planter = new THREE.Mesh(new THREE.CylinderGeometry(1.0, 0.8, 0.7, 8), planterMat);
      planter.position.set(point.x, ground + 0.35, point.z);
      this.group.add(planter);
      const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.24, 2.4, 6), trunkMat);
      trunk.position.set(point.x, ground + 1.8, point.z);
      trunk.castShadow = true;
      this.group.add(trunk);
      const crown = new THREE.Mesh(new THREE.SphereGeometry(1.5, 8, 6), leafMat);
      crown.position.set(point.x, ground + 3.5, point.z);
      crown.castShadow = true;
      this.group.add(crown);
    }
  }

  update(dt) {
    this.animTime += dt || 0;
    if (this.fountainGlobe) {
      this.fountainGlobe.position.y = CityIsland.peakHeight + 6.1 + Math.sin(this.animTime * 1.8) * 0.12;
    }
    for (let i = 0; i < this.antennaMarkers.length; i++) {
      const marker = this.antennaMarkers[i];
      marker.material.opacity = 0.75 + Math.sin(this.animTime * 2 + i) * 0.25;
    }
  }
}

export default CityEnvironment;
