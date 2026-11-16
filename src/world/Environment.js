// Environment: Stylized 3D Open-World Island, Ocean Water, Lighting & Props.

import * as THREE from 'three';
import { Config } from '../config.js';
import { OuterIslands } from './islands.js';
import { CityIsland } from './cityIsland.js';
import { FrontierIslands } from './frontierIslands.js';
import { CityEnvironment } from './CityEnvironment.js';

export class Environment {
  constructor(scene, terrainCollider) {
    this.scene = scene;
    this.collider = terrainCollider;
    this.config = Config.environment;
    this.worldConfig = Config.world;

    this.waterMesh = null;
    this.terrainMesh = null;
    this.cityEnvironment = null;
    // Shared material/geometry caches: island props are highly repetitive, and
    // every shared object saves a GPU upload plus JS bookkeeping.
    this._materialCache = new Map();
    this._geometryCache = new Map();
    this.propsGroup = new THREE.Group();
    this.propsGroup.name = 'EnvironmentProps';
    this.scene.add(this.propsGroup);

    this._setupLighting();
    this._createTerrainMesh();
    this._createOceanWater();
    this._createStarterVillageProps();
  }

  _material(key, factory) {
    if (!this._materialCache.has(key)) this._materialCache.set(key, factory());
    return this._materialCache.get(key);
  }

  _geometry(key, factory) {
    if (!this._geometryCache.has(key)) this._geometryCache.set(key, factory());
    return this._geometryCache.get(key);
  }

  _setupLighting() {
    // Atmospheric Fog
    this.scene.fog = new THREE.Fog(
      this.config.skyColor,
      this.config.fogNear,
      this.config.fogFar
    );
    this.scene.background = new THREE.Color(this.config.skyColor);

    // Hemisphere Ambient Light
    const hemiLight = new THREE.HemisphereLight(
      this.config.ambientColor,
      this.config.ambientGroundColor,
      this.config.ambientIntensity
    );
    this.scene.add(hemiLight);

    // Sunlight (Directional Light with warm tone)
    const sunLight = new THREE.DirectionalLight(
      this.config.sunColor,
      this.config.sunIntensity
    );
    sunLight.position.set(120, 180, 90);
    sunLight.castShadow = true;
    sunLight.shadow.mapSize.width = 2048;
    sunLight.shadow.mapSize.height = 2048;
    sunLight.shadow.camera.near = 10;
    sunLight.shadow.camera.far = 400;

    const shadowDist = 120;
    sunLight.shadow.camera.left = -shadowDist;
    sunLight.shadow.camera.right = shadowDist;
    sunLight.shadow.camera.top = shadowDist;
    sunLight.shadow.camera.bottom = -shadowDist;
    sunLight.shadow.bias = -0.0005;

    this.scene.add(sunLight);
    this.sunLight = sunLight;
  }

  _createTerrainMesh() {
    const size = this.worldConfig.worldSize;
    const res = this.worldConfig.terrainResolution;
    const geom = new THREE.PlaneGeometry(size, size, res, res);
    geom.rotateX(-Math.PI / 2);

    const posAttr = geom.attributes.position;
    const count = posAttr.count;

    // Create vertex colors based on height and slope
    const colors = new Float32Array(count * 3);

    // Color definitions
    const sandCol = new THREE.Color(0xd8c28a);   // Warm beach sand
    const grassCol = new THREE.Color(0x5ca850);  // Lush island grass
    const darkGrass = new THREE.Color(0x3d7e34); // Forest grass
    const rockCol = new THREE.Color(0x828489);   // Mountain rock
    const seabedCol = new THREE.Color(0x8f8365); // Underwater sand

    for (let i = 0; i < count; i++) {
      const vx = posAttr.getX(i);
      const vz = posAttr.getZ(i);

      // Sample procedural elevation
      const vy = this.collider.sampleHeight(vx, vz);
      posAttr.setY(i, vy);

      // Compute normal to check steepness
      const norm = this.collider.sampleNormal(vx, vz);
      const slope = 1.0 - norm.y; // 0 = flat, 1 = sheer cliff

      let finalCol = new THREE.Color();

      if (vy < this.worldConfig.waterLevel) {
        // Underwater seabed
        finalCol.copy(seabedCol);
      } else if (vy <= this.worldConfig.sandElevation) {
        // Beach line
        finalCol.copy(sandCol);
      } else if (slope > 0.45) {
        // Steep cliff/rock face
        finalCol.copy(rockCol);
      } else if (vy < this.worldConfig.grassElevation) {
        // Rolling grass plain
        const blend = (vy - this.worldConfig.sandElevation) / (this.worldConfig.grassElevation - this.worldConfig.sandElevation);
        finalCol.lerpColors(sandCol, grassCol, Math.min(1.0, blend * 1.5));
      } else {
        // High hills
        finalCol.lerpColors(grassCol, darkGrass, 0.5);
      }

      colors[i * 3 + 0] = finalCol.r;
      colors[i * 3 + 1] = finalCol.g;
      colors[i * 3 + 2] = finalCol.b;
    }

    geom.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    geom.computeVertexNormals();

    const mat = new THREE.MeshLambertMaterial({
      vertexColors: true,
      flatShading: true,
    });

    const mesh = new THREE.Mesh(geom, mat);
    mesh.receiveShadow = true;
    mesh.name = 'IslandTerrain';
    this.scene.add(mesh);
    this.terrainMesh = mesh;
  }

  _createOceanWater() {
    const waterGeom = new THREE.PlaneGeometry(1600, 1600, 96, 96);
    waterGeom.rotateX(-Math.PI / 2);

    const waterMat = new THREE.MeshPhongMaterial({
      color: this.config.waterColor,
      transparent: true,
      opacity: this.config.waterOpacity,
      shininess: 90,
      specular: 0x88ccff,
      flatShading: true,
    });

    const water = new THREE.Mesh(waterGeom, waterMat);
    water.position.y = this.worldConfig.waterLevel;
    water.name = 'OceanWater';
    this.scene.add(water);
    this.waterMesh = water;
  }

  _createStarterVillageProps() {
    // 1. Main Harbor Marina & Fishing Pier (where player, NPCs, and boats spawn)
    this._createMainHarborDock();

    // 2. Shopkeeper's Hut / Tackle Cabin (Walk-in store on village green)
    this._createShopkeeperHut({ x: -10.0, z: 6.0 });

    // 3. Pirate's Cove & Smuggler's Atoll Props (Second Island across the water)
    this._createPirateIslandProps();

    // 4. Expansion 3.0 outer islands: real distant landmasses with beacons,
    // biome props and floating waypoint names.
    this._createOuterIslandProps();

    // 4b. Expansion 7.0 frontier archipelago: four remote island outposts.
    this._createFrontierIslandProps();

    // 5. The starter isle and pirate atoll get the same waypoint treatment.
    const mainY = this.collider.sampleHeight(0, 0);
    this._createWorldLabel('Driftwood Isle', 0, mainY + 30, 0, 0x8fd14f);
    const pirateY = this.collider.sampleHeight(280, -320);
    this._createWorldLabel("Smuggler's Atoll", 280, pirateY + 24, -320, 0xffc857);

    // 6. Aurelia Heights: a full skyline island with avenues, towers and a
    // working waterfront. It is built separately from the outer-island loop.
    this.cityEnvironment = new CityEnvironment(this.propsGroup, this.collider);
    const cityY = this.collider.sampleHeight(CityIsland.center.x, CityIsland.center.z);
    this._createWorldLabel(
      CityIsland.name,
      CityIsland.center.x,
      cityY + CityIsland.labelY,
      CityIsland.center.z,
      CityIsland.palette.accent
    );

    // 7. Stylized Low-Poly Pine & Palm Trees across the island
    this._scatterIslandTrees();
  }

  /**
   * Billboard-style waypoint label drawn onto a canvas sprite. Sprites always
   * face the camera, so every island name stays readable from a boat.
   */
  _createWorldLabel(text, x, y, z, accent = 0x8fd14f) {
    if (typeof document === 'undefined') return null;

    const canvas = document.createElement('canvas');
    canvas.width = 640;
    canvas.height = 160;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    const accentCss = `#${accent.toString(16).padStart(6, '0')}`;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = 'rgba(8, 24, 32, 0.86)';
    ctx.strokeStyle = accentCss;
    ctx.lineWidth = 6;
    const radius = 28;
    const left = 18;
    const top = 18;
    const width = canvas.width - 36;
    const height = 104;
    ctx.beginPath();
    ctx.moveTo(left + radius, top);
    ctx.lineTo(left + width - radius, top);
    ctx.quadraticCurveTo(left + width, top, left + width, top + radius);
    ctx.lineTo(left + width, top + height - radius);
    ctx.quadraticCurveTo(left + width, top + height, left + width - radius, top + height);
    ctx.lineTo(left + radius, top + height);
    ctx.quadraticCurveTo(left, top + height, left, top + height - radius);
    ctx.lineTo(left, top + radius);
    ctx.quadraticCurveTo(left, top, left + radius, top);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = accentCss;
    ctx.font = 'bold 24px "Trebuchet MS", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('◆  ISLAND WAYPOINT  ◆', canvas.width / 2, 56);
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 46px "Trebuchet MS", sans-serif';
    ctx.fillText(text, canvas.width / 2, 106);

    const texture = new THREE.CanvasTexture(canvas);
    texture.minFilter = THREE.LinearFilter;
    if ('colorSpace' in texture) texture.colorSpace = THREE.SRGBColorSpace;
    const material = new THREE.SpriteMaterial({
      map: texture,
      transparent: true,
      depthTest: false,
      depthWrite: false,
    });
    const sprite = new THREE.Sprite(material);
    sprite.position.set(x, y, z);
    sprite.scale.set(20, 5, 1);
    sprite.renderOrder = 20;
    this.propsGroup.add(sprite);
    return sprite;
  }

  _createOuterIslandProps() {
    for (const island of OuterIslands) {
      const group = new THREE.Group();
      group.name = `OuterIsland_${island.id}`;
      const centerY = this.collider.sampleHeight(island.center.x, island.center.z);
      const palette = island.palette || {};

      const dockMat = new THREE.MeshLambertMaterial({ color: palette.dock || 0x6e4a2c });
      const beaconMat = new THREE.MeshLambertMaterial({ color: palette.accent || 0xffe066 });
      const stoneMat = new THREE.MeshLambertMaterial({ color: 0x6d6a63 });

      // Landing deck and beacon make each island readable from the water.
      const deck = new THREE.Mesh(new THREE.BoxGeometry(7.0, 0.4, 5.0), dockMat);
      deck.position.set(island.center.x, centerY + 0.2, island.center.z + 8);
      deck.receiveShadow = true;
      group.add(deck);

      const tower = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.9, 7.0, 8), stoneMat);
      tower.position.set(island.center.x, centerY + 3.6, island.center.z);
      tower.castShadow = true;
      group.add(tower);

      const beacon = new THREE.Mesh(new THREE.SphereGeometry(0.65, 10, 8), beaconMat);
      beacon.position.set(island.center.x, centerY + 7.3, island.center.z);
      group.add(beacon);

      const beaconLight = new THREE.PointLight(palette.accent || 0xffe066, 1.4, 38);
      beaconLight.position.copy(beacon.position);
      group.add(beaconLight);

      const arch = new THREE.Mesh(new THREE.TorusGeometry(2.4, 0.22, 6, 14), beaconMat);
      arch.position.set(island.center.x, centerY + 2.4, island.center.z + 8);
      arch.rotation.x = Math.PI / 2;
      group.add(arch);

      this._createWorldLabel(
        island.name,
        island.center.x,
        centerY + (island.labelY || 20),
        island.center.z,
        palette.accent || 0xffe066
      );

      // Deterministic biome scatter, sampled against the actual island height.
      const offsets = [
        [-46, -28], [-30, 24], [-16, -46], [8, 36], [24, -20], [42, 14],
        [-56, 8], [34, 52], [54, -36], [0, -58], [-40, 50], [56, 2],
      ];
      offsets.forEach(([ox, oz], index) => {
        const x = island.center.x + ox;
        const z = island.center.z + oz;
        const y = this.collider.sampleHeight(x, z);
        if (y <= 1.0) return;
        if (index % 4 === 0) {
          const rock = new THREE.Mesh(
            new THREE.DodecahedronGeometry(1.1 + (index % 3) * 0.35, 0),
            stoneMat
          );
          rock.position.set(x, y + 0.7, z);
          rock.rotation.set(index * 0.4, index * 0.8, index * 0.2);
          rock.castShadow = true;
          group.add(rock);
          return;
        }
        const tree = this._createBiomeTree(island.biome, palette, index);
        tree.position.set(x, y, z);
        tree.rotation.y = index * 1.31;
        group.add(tree);
      });

      this.propsGroup.add(group);
    }
  }

  _createFrontierIslandProps() {
    const stoneMat = this._material('frontier_stone', () => new THREE.MeshLambertMaterial({ color: 0x6d6a63 }));
    const towerGeom = this._geometry('frontier_tower', () => new THREE.CylinderGeometry(0.55, 0.9, 8.0, 8));
    const beaconGeom = this._geometry('frontier_beacon', () => new THREE.SphereGeometry(0.7, 10, 8));
    const archGeom = this._geometry('frontier_arch', () => new THREE.TorusGeometry(2.6, 0.24, 6, 14));
    const deckGeom = this._geometry('frontier_deck', () => new THREE.BoxGeometry(7.5, 0.4, 5.2));
    const rockGeoms = [
      this._geometry('frontier_rock_1', () => new THREE.DodecahedronGeometry(1.1, 0)),
      this._geometry('frontier_rock_2', () => new THREE.DodecahedronGeometry(1.45, 0)),
      this._geometry('frontier_rock_3', () => new THREE.DodecahedronGeometry(1.8, 0)),
    ];

    for (const island of FrontierIslands) {
      const group = new THREE.Group();
      group.name = `FrontierIsland_${island.id}`;
      const centerY = this.collider.sampleHeight(island.center.x, island.center.z);
      const palette = island.palette || {};
      const dockMat = this._material(`frontier_dock_${palette.dock}`, () => new THREE.MeshLambertMaterial({ color: palette.dock || 0x5a6472 }));
      const beaconMat = this._material(`frontier_beacon_${palette.accent}`, () => new THREE.MeshLambertMaterial({ color: palette.accent || 0x7de3ff }));
      const beamLight = new THREE.PointLight(palette.accent || 0x7de3ff, 1.6, 44);
      beamLight.position.set(island.center.x, centerY + 8.2, island.center.z);
      group.add(beamLight);

      // Landing deck at the ferry dock.
      const dockY = this.collider.sampleHeight(island.dock.x, island.dock.z);
      const deck = new THREE.Mesh(deckGeom, dockMat);
      deck.position.set(island.dock.x, Math.max(dockY, 0.6) + 0.2, island.dock.z);
      deck.receiveShadow = true;
      group.add(deck);

      const tower = new THREE.Mesh(towerGeom, stoneMat);
      tower.position.set(island.center.x, centerY + 4.0, island.center.z);
      tower.castShadow = true;
      group.add(tower);

      const beacon = new THREE.Mesh(beaconGeom, beaconMat);
      beacon.position.set(island.center.x, centerY + 8.4, island.center.z);
      group.add(beacon);

      const arch = new THREE.Mesh(archGeom, beaconMat);
      arch.position.set(island.dock.x, Math.max(dockY, 0.6) + 2.4, island.dock.z);
      arch.rotation.x = Math.PI / 2;
      group.add(arch);

      this._createWorldLabel(
        island.name,
        island.center.x,
        centerY + (island.labelY || 28),
        island.center.z,
        palette.accent || 0x7de3ff
      );

      // Deterministic biome scatter. All geometry/material objects are shared
      // across the four frontier islands wherever the palette allows.
      const offsets = [
        [-30, -18], [-18, 20], [-8, -32], [10, 24], [24, -12], [32, 10],
        [-38, 4], [20, 36], [38, -24], [0, -38], [-24, 34], [40, 2],
      ];
      offsets.forEach(([ox, oz], index) => {
        const x = island.center.x + ox;
        const z = island.center.z + oz;
        const y = this.collider.sampleHeight(x, z);
        if (y <= 1.0) return;

        if (index % 4 === 0) {
          const rock = new THREE.Mesh(rockGeoms[index % rockGeoms.length], stoneMat);
          rock.position.set(x, y + 0.7, z);
          rock.rotation.set(index * 0.4, index * 0.8, index * 0.2);
          rock.castShadow = true;
          group.add(rock);
          return;
        }

        const tree = this._createBiomeTree(island.biome, palette, index);
        tree.position.set(x, y, z);
        tree.rotation.y = index * 1.31;
        group.add(tree);
      });

      this.propsGroup.add(group);
    }
  }

  _createBiomeTree(biome, palette, index) {
    const group = new THREE.Group();
    const trunkColor = palette.trunk || 0x6e5239;
    const foliageColor = palette.foliage || 0x2e7d32;
    const trunkMat = this._material(`tree_trunk_${trunkColor}`, () =>
      new THREE.MeshLambertMaterial({ color: trunkColor }));
    const leafMat = this._material(`tree_leaf_${foliageColor}_${biome}`, () => {
      if (biome === 'glass') {
        return new THREE.MeshPhongMaterial({
          color: foliageColor,
          transparent: true,
          opacity: 0.88,
          shininess: 100,
          flatShading: true,
        });
      }
      return new THREE.MeshLambertMaterial({
        color: foliageColor,
        flatShading: true,
        ...(biome === 'aurora' ? { emissive: foliageColor, emissiveIntensity: 0.22 } : {}),
      });
    });
    const height = biome === 'volcanic' ? 4.5
      : biome === 'frozen' || biome === 'glass' ? 5.5
        : biome === 'storm' ? 5.2
          : biome === 'reef' ? 4.2 : 4.8;
    const trunk = new THREE.Mesh(
      this._geometry(`tree_trunk_geom_${height}`, () => new THREE.CylinderGeometry(0.2, 0.32, height, 6)),
      trunkMat
    );
    trunk.position.y = height / 2;
    trunk.castShadow = true;
    group.add(trunk);

    if (biome === 'frozen') {
      for (let layer = 0; layer < 3; layer++) {
        const cone = new THREE.Mesh(
          this._geometry(`tree_frozen_${layer}`, () => new THREE.ConeGeometry(1.7 - layer * 0.35, 2.4, 6)),
          leafMat
        );
        cone.position.y = height * 0.55 + layer * 1.15;
        cone.castShadow = true;
        group.add(cone);
      }
    } else if (biome === 'volcanic') {
      const spire = new THREE.Mesh(
        this._geometry('tree_volcanic', () => new THREE.ConeGeometry(1.0, 3.4, 5)),
        leafMat
      );
      spire.position.y = height + 0.8;
      spire.rotation.z = 0.12;
      spire.castShadow = true;
      group.add(spire);
    } else if (biome === 'storm') {
      const spire = new THREE.Mesh(
        this._geometry('tree_storm_spire', () => new THREE.ConeGeometry(0.85, 5.0, 4)),
        leafMat
      );
      spire.position.y = height + 1.1;
      spire.rotation.z = 0.16;
      spire.castShadow = true;
      group.add(spire);

      const fork = new THREE.Mesh(
        this._geometry('tree_storm_fork', () => new THREE.ConeGeometry(0.55, 3.0, 4)),
        leafMat
      );
      fork.position.set(-1.0, height + 0.4, 0.2);
      fork.rotation.z = -0.55;
      group.add(fork);
    } else if (biome === 'aurora') {
      const crown = new THREE.Mesh(
        this._geometry('tree_aurora_crown', () => new THREE.ConeGeometry(1.9, 3.8, 6)),
        leafMat
      );
      crown.position.y = height + 1.0;
      crown.castShadow = true;
      group.add(crown);

      const halo = new THREE.Mesh(
        this._geometry('tree_aurora_halo', () => new THREE.ConeGeometry(1.25, 2.4, 6)),
        leafMat
      );
      halo.position.y = height + 2.7;
      halo.castShadow = true;
      group.add(halo);
    } else if (biome === 'glass') {
      const shard = new THREE.Mesh(
        this._geometry('tree_glass_shard', () => new THREE.ConeGeometry(1.35, 4.6, 5)),
        leafMat
      );
      shard.position.y = height + 1.2;
      shard.rotation.z = 0.08;
      shard.castShadow = true;
      group.add(shard);

      const splinter = new THREE.Mesh(
        this._geometry('tree_glass_splinter', () => new THREE.ConeGeometry(0.6, 2.8, 4)),
        leafMat
      );
      splinter.position.set(1.1, height + 0.4, -0.2);
      splinter.rotation.z = -0.32;
      group.add(splinter);
    } else if (biome === 'reef') {
      const coral = new THREE.Mesh(
        this._geometry('tree_reef_coral', () => new THREE.DodecahedronGeometry(1.55, 0)),
        leafMat
      );
      coral.position.y = height + 0.7;
      coral.castShadow = true;
      group.add(coral);

      const branch = new THREE.Mesh(
        this._geometry('tree_reef_branch', () => new THREE.ConeGeometry(0.8, 2.6, 5)),
        leafMat
      );
      branch.position.set(-0.9, height + 0.2, 0.3);
      branch.rotation.z = -0.45;
      group.add(branch);
    } else {
      const crown = new THREE.Mesh(
        this._geometry('tree_crown', () => new THREE.ConeGeometry(2.2, 2.8, 6)),
        leafMat
      );
      crown.position.y = height + 0.6;
      crown.castShadow = true;
      group.add(crown);
      const palm = new THREE.Mesh(
        this._geometry('tree_palm', () => new THREE.ConeGeometry(1.8, 1.0, 5)),
        leafMat
      );
      palm.position.y = height - 0.2;
      palm.rotation.z = 0.18;
      group.add(palm);
    }

    group.scale.setScalar(0.85 + (index % 4) * 0.1);
    return group;
  }

  _createMainHarborDock() {
    const dockGroup = new THREE.Group();
    dockGroup.name = 'MainHarborMarina';

    const woodMat = new THREE.MeshLambertMaterial({ color: 0x6e4a2c });
    const deckMat = new THREE.MeshLambertMaterial({ color: 0x826447 });
    const bollardMat = new THREE.MeshLambertMaterial({ color: 0x2b2b2b });
    const lanternMat = new THREE.MeshLambertMaterial({ color: 0xffe699, emissive: 0xffaa22, emissiveIntensity: 0.85 });

    // Main Pier Runway (from shore z: -8 out to deep water z: -26)
    const mainDeckGeom = new THREE.BoxGeometry(5.0, 0.45, 20.0);
    const mainDeck = new THREE.Mesh(mainDeckGeom, deckMat);
    mainDeck.position.set(3.5, 0.85, -17.0);
    mainDeck.castShadow = true;
    mainDeck.receiveShadow = true;
    dockGroup.add(mainDeck);

    // L-Shaped Mooring Extension (along x: 3.5 to 11.5 at z: -25)
    const extDeckGeom = new THREE.BoxGeometry(9.0, 0.45, 4.5);
    const extDeck = new THREE.Mesh(extDeckGeom, deckMat);
    extDeck.position.set(8.5, 0.85, -24.8);
    extDeck.castShadow = true;
    extDeck.receiveShadow = true;
    dockGroup.add(extDeck);

    // Dock Support Pilings
    const pileGeom = new THREE.CylinderGeometry(0.24, 0.28, 5.0, 8);
    for (let z = -9.0; z >= -26.0; z -= 4.2) {
      for (const x of [1.2, 5.8]) {
        const pile = new THREE.Mesh(pileGeom, woodMat);
        pile.position.set(x, -1.2, z);
        pile.castShadow = true;
        dockGroup.add(pile);
      }
    }
    // Extension pilings
    for (const x of [8.5, 12.5]) {
      for (const z of [-23.0, -26.5]) {
        const pile = new THREE.Mesh(pileGeom, woodMat);
        pile.position.set(x, -1.2, z);
        pile.castShadow = true;
        dockGroup.add(pile);
      }
    }

    // Mooring Bollards for Boats
    const bollardGeom = new THREE.CylinderGeometry(0.14, 0.16, 0.55, 8);
    const bollardPositions = [
      { x: 5.6, z: -14.0 }, { x: 5.6, z: -20.0 },
      { x: 8.5, z: -26.6 }, { x: 12.4, z: -26.6 },
    ];
    for (const bPos of bollardPositions) {
      const bollard = new THREE.Mesh(bollardGeom, bollardMat);
      bollard.position.set(bPos.x, 1.25, bPos.z);
      dockGroup.add(bollard);
    }

    // Dock Lantern Posts
    const postGeom = new THREE.CylinderGeometry(0.12, 0.14, 2.6, 8);
    const lampGeom = new THREE.BoxGeometry(0.38, 0.48, 0.38);

    const lampPositions = [
      { x: 1.4, z: -10.0 }, { x: 1.4, z: -22.0 }, { x: 12.6, z: -23.0 }
    ];
    for (const lp of lampPositions) {
      const post = new THREE.Mesh(postGeom, woodMat);
      post.position.set(lp.x, 2.1, lp.z);
      dockGroup.add(post);

      const lamp = new THREE.Mesh(lampGeom, lanternMat);
      lamp.position.set(lp.x, 3.2, lp.z);
      dockGroup.add(lamp);

      const light = new THREE.PointLight(0xffb84d, 1.4, 18);
      light.position.set(lp.x, 3.2, lp.z);
      dockGroup.add(light);
    }

    // Fish Market Stall on Pier
    const stallGroup = new THREE.Group();
    stallGroup.position.set(6.2, 0.85, -10.0);

    const stallCounterGeom = new THREE.BoxGeometry(2.6, 0.9, 1.2);
    const stallCounter = new THREE.Mesh(stallCounterGeom, woodMat);
    stallCounter.position.y = 0.45;
    stallGroup.add(stallCounter);

    const awningGeom = new THREE.BoxGeometry(3.0, 0.15, 2.0);
    const awningMat = new THREE.MeshLambertMaterial({ color: 0x2266aa });
    const awning = new THREE.Mesh(awningGeom, awningMat);
    awning.position.set(0, 2.4, 0);
    awning.rotation.x = 0.15;
    stallGroup.add(awning);

    // Awning posts
    const awningPostGeom = new THREE.CylinderGeometry(0.06, 0.06, 2.4, 6);
    for (const px of [-1.3, 1.3]) {
      for (const pz of [-0.8, 0.8]) {
        const p = new THREE.Mesh(awningPostGeom, woodMat);
        p.position.set(px, 1.2, pz);
        stallGroup.add(p);
      }
    }

    // Fish crates
    const crateGeom = new THREE.BoxGeometry(0.7, 0.45, 0.55);
    const crateMat = new THREE.MeshLambertMaterial({ color: 0xa07850 });
    const crate1 = new THREE.Mesh(crateGeom, crateMat);
    crate1.position.set(1.6, 0.25, -0.2);
    stallGroup.add(crate1);

    const crate2 = new THREE.Mesh(crateGeom, crateMat);
    crate2.position.set(1.6, 0.25, 0.5);
    crate2.rotation.y = 0.3;
    stallGroup.add(crate2);

    dockGroup.add(stallGroup);
    this.propsGroup.add(dockGroup);
  }

  _createShopkeeperHut(pos) {
    const hutGroup = new THREE.Group();
    hutGroup.name = 'ShopkeeperHut';

    const groundY = this.collider.sampleHeight(pos.x, pos.z);
    hutGroup.position.set(pos.x, groundY, pos.z);

    const wallMat = new THREE.MeshLambertMaterial({ color: 0x8a5a36 }); // Timber logs
    const roofMat = new THREE.MeshLambertMaterial({ color: 0x5a2d22 }); // Cedar shake shingles
    const floorMat = new THREE.MeshLambertMaterial({ color: 0x9a6842 });
    const counterMat = new THREE.MeshLambertMaterial({ color: 0x4a2a14 });
    const trimMat = new THREE.MeshLambertMaterial({ color: 0x3d2312 });
    const lanternMat = new THREE.MeshLambertMaterial({ color: 0xffdf80, emissive: 0xffaa22, emissiveIntensity: 0.9 });

    // 1. Raised Wooden Floor
    const floorGeom = new THREE.BoxGeometry(6.4, 0.3, 6.0);
    const floor = new THREE.Mesh(floorGeom, floorMat);
    floor.position.set(0, 0.15, 0);
    floor.receiveShadow = true;
    hutGroup.add(floor);

    // 2. Walls (Back wall, Left wall, Right wall, Front doorway frame)
    // Back wall
    const backWallGeom = new THREE.BoxGeometry(6.4, 3.4, 0.35);
    const backWall = new THREE.Mesh(backWallGeom, wallMat);
    backWall.position.set(0, 1.85, -2.85);
    backWall.castShadow = true;
    backWall.receiveShadow = true;
    hutGroup.add(backWall);

    // Left wall
    const sideWallGeom = new THREE.BoxGeometry(0.35, 3.4, 5.7);
    const leftWall = new THREE.Mesh(sideWallGeom, wallMat);
    leftWall.position.set(-3.05, 1.85, 0);
    leftWall.castShadow = true;
    hutGroup.add(leftWall);

    // Right wall
    const rightWall = new THREE.Mesh(sideWallGeom, wallMat);
    rightWall.position.set(3.05, 1.85, 0);
    rightWall.castShadow = true;
    hutGroup.add(rightWall);

    // Front wall Left section
    const frontSideGeom = new THREE.BoxGeometry(1.9, 3.4, 0.35);
    const frontL = new THREE.Mesh(frontSideGeom, wallMat);
    frontL.position.set(-2.1, 1.85, 2.85);
    frontL.castShadow = true;
    hutGroup.add(frontL);

    // Front wall Right section
    const frontR = new THREE.Mesh(frontSideGeom, wallMat);
    frontR.position.set(2.1, 1.85, 2.85);
    frontR.castShadow = true;
    hutGroup.add(frontR);

    // Front Doorway Header beam (leave 2.4m wide walk-in opening)
    const headerGeom = new THREE.BoxGeometry(2.6, 0.7, 0.4);
    const header = new THREE.Mesh(headerGeom, trimMat);
    header.position.set(0, 3.2, 2.85);
    hutGroup.add(header);

    // 3. Slanted Gabled Roof
    const roofLGeom = new THREE.BoxGeometry(4.2, 0.3, 6.8);
    const roofL = new THREE.Mesh(roofLGeom, roofMat);
    roofL.position.set(-1.6, 4.2, 0);
    roofL.rotation.z = 0.45;
    roofL.castShadow = true;
    hutGroup.add(roofL);

    const roofRGeom = new THREE.BoxGeometry(4.2, 0.3, 6.8);
    const roofR = new THREE.Mesh(roofRGeom, roofMat);
    roofR.position.set(1.6, 4.2, 0);
    roofR.rotation.z = -0.45;
    roofR.castShadow = true;
    hutGroup.add(roofR);

    // Roof Gable End Triangles
    const gableGeom = new THREE.ConeGeometry(3.6, 1.6, 4);
    gableGeom.rotateY(Math.PI / 4);
    const gableF = new THREE.Mesh(gableGeom, wallMat);
    gableF.position.set(0, 4.1, 2.85);
    hutGroup.add(gableF);

    const gableB = new THREE.Mesh(gableGeom, wallMat);
    gableB.position.set(0, 4.1, -2.85);
    hutGroup.add(gableB);

    // Stone Chimney
    const chimGeom = new THREE.BoxGeometry(0.8, 4.6, 0.8);
    const stoneMat = new THREE.MeshLambertMaterial({ color: 0x666666 });
    const chimney = new THREE.Mesh(chimGeom, stoneMat);
    chimney.position.set(-2.2, 2.6, -1.8);
    hutGroup.add(chimney);

    // 4. Interior Shop Furnishings
    // Shop Counter inside
    const counterGeom = new THREE.BoxGeometry(3.2, 1.0, 0.8);
    const counter = new THREE.Mesh(counterGeom, counterMat);
    counter.position.set(0, 0.8, -0.6);
    counter.castShadow = true;
    hutGroup.add(counter);

    // Brass Scale on counter
    const scaleBaseGeom = new THREE.CylinderGeometry(0.12, 0.16, 0.1, 8);
    const brassMat = new THREE.MeshLambertMaterial({ color: 0xd4af37 });
    const scaleBase = new THREE.Mesh(scaleBaseGeom, brassMat);
    scaleBase.position.set(1.0, 1.35, -0.6);
    hutGroup.add(scaleBase);

    // Back display shelf
    const shelfGeom = new THREE.BoxGeometry(4.8, 0.15, 0.5);
    for (const sy of [1.6, 2.3]) {
      const shelf = new THREE.Mesh(shelfGeom, floorMat);
      shelf.position.set(0, sy, -2.5);
      hutGroup.add(shelf);
    }

    // Warm Hanging Lantern in center of hut
    const lanternGeom = new THREE.BoxGeometry(0.35, 0.45, 0.35);
    const lantern = new THREE.Mesh(lanternGeom, lanternMat);
    lantern.position.set(0, 3.2, 0);
    hutGroup.add(lantern);

    const hutLight = new THREE.PointLight(0xffaa33, 1.6, 12);
    hutLight.position.set(0, 3.0, 0);
    hutGroup.add(hutLight);

    // Outdoor Store Sign
    const signPostGeom = new THREE.CylinderGeometry(0.08, 0.08, 2.8, 8);
    const signPost = new THREE.Mesh(signPostGeom, trimMat);
    signPost.position.set(2.4, 1.4, 3.6);
    hutGroup.add(signPost);

    const signBoardGeom = new THREE.BoxGeometry(1.6, 0.7, 0.1);
    const signBoardMat = new THREE.MeshLambertMaterial({ color: 0xdeb887 });
    const signBoard = new THREE.Mesh(signBoardGeom, signBoardMat);
    signBoard.position.set(2.4, 2.4, 3.6);
    hutGroup.add(signBoard);

    this.propsGroup.add(hutGroup);
  }

  _createPirateIslandProps() {
    const pirateGroup = new THREE.Group();
    pirateGroup.name = 'PirateIslandProps';

    const pCenter = { x: 280.0, z: -320.0 };
    const groundY = this.collider.sampleHeight(pCenter.x, pCenter.z);

    const darkWoodMat = new THREE.MeshLambertMaterial({ color: 0x3d2719 });
    const ropeMat = new THREE.MeshLambertMaterial({ color: 0x997a4d });
    const goldMat = new THREE.MeshLambertMaterial({ color: 0xf59e0b });
    const ironMat = new THREE.MeshLambertMaterial({ color: 0x222222 });
    const fireMat = new THREE.MeshLambertMaterial({ color: 0xff5500, emissive: 0xff4400, emissiveIntensity: 1.0 });

    // 1. Pirate Jetty / Dock extending into cove
    const pDockGeom = new THREE.BoxGeometry(4.0, 0.45, 16.0);
    const pDock = new THREE.Mesh(pDockGeom, darkWoodMat);
    pDock.position.set(275.0, 0.85, -275.0);
    pDock.castShadow = true;
    pDock.receiveShadow = true;
    pirateGroup.add(pDock);

    // Pirate Dock Pilings
    const pileGeom = new THREE.CylinderGeometry(0.24, 0.28, 5.0, 8);
    for (let z = -268.0; z >= -282.0; z -= 4.5) {
      for (const x of [272.8, 277.2]) {
        const pile = new THREE.Mesh(pileGeom, darkWoodMat);
        pile.position.set(x, -1.2, z);
        pirateGroup.add(pile);
      }
    }

    // Pirate Dock Torch Braziers
    const torchGeom = new THREE.CylinderGeometry(0.1, 0.12, 2.4, 8);
    const flameGeom = new THREE.BoxGeometry(0.35, 0.45, 0.35);

    for (const lp of [{ x: 272.8, z: -269.0 }, { x: 277.2, z: -281.0 }]) {
      const torch = new THREE.Mesh(torchGeom, darkWoodMat);
      torch.position.set(lp.x, 2.0, lp.z);
      pirateGroup.add(torch);

      const flame = new THREE.Mesh(flameGeom, fireMat);
      flame.position.set(lp.x, 3.2, lp.z);
      pirateGroup.add(flame);

      const flameLight = new THREE.PointLight(0xff5511, 1.8, 16);
      flameLight.position.set(lp.x, 3.2, lp.z);
      pirateGroup.add(flameLight);
    }

    // 2. Open Pirate Treasure Chest on the Beach
    const chestGroup = new THREE.Group();
    chestGroup.position.set(270.0, 1.2, -276.0);

    const chestBoxGeom = new THREE.BoxGeometry(1.2, 0.7, 0.8);
    const chestBox = new THREE.Mesh(chestBoxGeom, darkWoodMat);
    chestBox.position.y = 0.35;
    chestGroup.add(chestBox);

    // Glowing Gold pile inside chest
    const goldPileGeom = new THREE.BoxGeometry(1.0, 0.3, 0.65);
    const goldPile = new THREE.Mesh(goldPileGeom, goldMat);
    goldPile.position.set(0, 0.72, 0);
    chestGroup.add(goldPile);

    // Open lid
    const lidGeom = new THREE.BoxGeometry(1.2, 0.2, 0.8);
    const lid = new THREE.Mesh(lidGeom, darkWoodMat);
    lid.position.set(0, 0.95, -0.3);
    lid.rotation.x = -0.7;
    chestGroup.add(lid);

    pirateGroup.add(chestGroup);

    // 3. Heavy Iron Ship Anchor
    const anchorRing = new THREE.Mesh(new THREE.TorusGeometry(0.35, 0.08, 6, 12), ironMat);
    anchorRing.position.set(268.5, 1.4, -272.0);
    anchorRing.rotation.x = Math.PI / 4;
    pirateGroup.add(anchorRing);

    const anchorStock = new THREE.Mesh(new THREE.BoxGeometry(0.16, 1.6, 0.16), ironMat);
    anchorStock.position.set(268.5, 0.8, -272.0);
    anchorStock.rotation.z = 0.3;
    pirateGroup.add(anchorStock);

    // 4. Pirate Skull Flagstaff
    const flagPoleGeom = new THREE.CylinderGeometry(0.08, 0.1, 6.0, 8);
    const flagPole = new THREE.Mesh(flagPoleGeom, darkWoodMat);
    flagPole.position.set(280.0, groundY + 3.0, -320.0);
    pirateGroup.add(flagPole);

    const flagGeom = new THREE.BoxGeometry(1.8, 1.1, 0.06);
    const flagMat = new THREE.MeshLambertMaterial({ color: 0x111111 });
    const flag = new THREE.Mesh(flagGeom, flagMat);
    flag.position.set(281.0, groundY + 5.2, -320.0);
    pirateGroup.add(flag);

    // White skull motif on flag
    const skullGeom = new THREE.BoxGeometry(0.4, 0.4, 0.08);
    const skullMat = new THREE.MeshLambertMaterial({ color: 0xeeeeee });
    const skull = new THREE.Mesh(skullGeom, skullMat);
    skull.position.set(281.0, groundY + 5.2, -320.0);
    pirateGroup.add(skull);

    // 5. Tropical Palm Trees on Pirate Atoll
    this._scatterPiratePalms(pirateGroup, pCenter);

    this.propsGroup.add(pirateGroup);
  }

  _scatterPiratePalms(group, center) {
    const trunkMat = new THREE.MeshLambertMaterial({ color: 0x6e5239 });
    const palmFrondMat = new THREE.MeshLambertMaterial({ color: 0x2e7d32, flatShading: true });

    const palmPositions = [
      { x: center.x - 14, z: center.z + 12 },
      { x: center.x + 18, z: center.z - 16 },
      { x: center.x - 22, z: center.z - 18 },
      { x: center.x + 10, z: center.z + 20 },
      { x: center.x - 8, z: center.z - 28 },
    ];

    const trunkGeom = new THREE.CylinderGeometry(0.24, 0.38, 5.5, 6);
    trunkGeom.translate(0, 2.75, 0);

    const frondGeom = new THREE.ConeGeometry(2.8, 1.2, 5);
    frondGeom.translate(0, 5.5, 0);

    for (const pos of palmPositions) {
      const palmH = this.collider.sampleHeight(pos.x, pos.z);
      if (palmH > 0.5) {
        const palm = new THREE.Group();
        palm.position.set(pos.x, palmH, pos.z);

        const trunk = new THREE.Mesh(trunkGeom, trunkMat);
        trunk.rotation.z = (Math.random() * 0.15 - 0.075);
        trunk.castShadow = true;
        palm.add(trunk);

        const fronds = new THREE.Mesh(frondGeom, palmFrondMat);
        fronds.castShadow = true;
        palm.add(fronds);

        group.add(palm);
      }
    }
  }

  _scatterIslandTrees() {
    const trunkMat = new THREE.MeshLambertMaterial({ color: 0x5a3d28 });
    const foliageMat1 = new THREE.MeshLambertMaterial({ color: 0x489638, flatShading: true });
    const foliageMat2 = new THREE.MeshLambertMaterial({ color: 0x367a2a, flatShading: true });

    const treePositions = [
      { x: 14, z: 12 }, { x: -18, z: 16 }, { x: 22, z: -14 },
      { x: -30, z: -25 }, { x: 35, z: 40 }, { x: -45, z: 35 },
      { x: 12, z: 65 }, { x: -60, z: -40 }, { x: 50, z: -60 },
      { x: -15, z: -90 }, { x: 25, z: -95 }, { x: -35, z: 90 },
      { x: 65, z: 80 }, { x: -80, z: 50 }, { x: 90, z: -20 },
    ];

    const trunkGeom = new THREE.CylinderGeometry(0.28, 0.42, 3.2, 6);
    trunkGeom.translate(0, 1.6, 0);

    const foliageGeom1 = new THREE.ConeGeometry(2.2, 3.4, 6);
    foliageGeom1.translate(0, 4.0, 0);

    const foliageGeom2 = new THREE.ConeGeometry(1.6, 2.6, 6);
    foliageGeom2.translate(0, 5.5, 0);

    for (let i = 0; i < treePositions.length; i++) {
      const pos = treePositions[i];
      const groundY = this.collider.sampleHeight(pos.x, pos.z);

      if (groundY > this.worldConfig.sandElevation + 1.0) {
        const tree = new THREE.Group();
        tree.position.set(pos.x, groundY, pos.z);

        const trunk = new THREE.Mesh(trunkGeom, trunkMat);
        trunk.castShadow = true;
        tree.add(trunk);

        const folMat = (i % 2 === 0) ? foliageMat1 : foliageMat2;
        const fol1 = new THREE.Mesh(foliageGeom1, folMat);
        fol1.castShadow = true;
        tree.add(fol1);

        const fol2 = new THREE.Mesh(foliageGeom2, folMat);
        fol2.castShadow = true;
        tree.add(fol2);

        const scale = 0.85 + (i % 5) * 0.12;
        tree.scale.set(scale, scale, scale);
        tree.rotation.y = (i * 1.37);

        this.propsGroup.add(tree);
      }
    }
  }

  /**
   * Updates time-dependent environmental effects like ocean wave undulating ripples.
   */
  update(time) {
    if (this.waterMesh) {
      // Gentle ocean breathing bob
      this.waterMesh.position.y = this.worldConfig.waterLevel + Math.sin(time * 1.5) * 0.12;
    }
    if (this.cityEnvironment) {
      this.cityEnvironment.update(time);
    }
  }
}

export default Environment;
