// PropertyPlot: Claimable real estate plot with 3D cottage exterior, interior, and purchase state.

import * as THREE from 'three';
import { Interactable } from '../interaction/Interactable.js';

export class PropertyPlot extends Interactable {
  constructor(options = {}) {
    super({
      id: options.id || 'plot_default',
      name: options.name || 'Fisherman Cottage',
      type: 'property',
      promptAction: 'Purchase',
      interactionRange: 4.2,
      position: options.position || { x: 18, y: 0, z: -6 },
      ...options,
    });

    this.cost = options.cost !== undefined ? options.cost : 150;
    this.isOwned = options.isOwned || false;
    this.isInside = false;

    this.outsidePos = new THREE.Vector3(
      options.outsidePosition ? options.outsidePosition.x : this.position.x,
      options.outsidePosition ? options.outsidePosition.y : this.position.y,
      options.outsidePosition ? options.outsidePosition.z : this.position.z + 3.0
    );

    this.interiorPos = new THREE.Vector3(
      options.interiorPosition ? options.interiorPosition.x : this.position.x,
      options.interiorPosition ? options.interiorPosition.y : this.position.y + 1.0,
      options.interiorPosition ? options.interiorPosition.z : this.position.z - 3.0
    );

    // 3D Visual Mesh
    this.mesh = this._createPropertyMesh();
    this._updateVisualState();
  }

  _createPropertyMesh() {
    const group = new THREE.Group();
    group.name = `Property_${this.id}`;

    // 1. "FOR SALE" Signpost (Shown when unowned)
    const signGroup = new THREE.Group();
    signGroup.name = 'ForSaleSign';

    const postMat = new THREE.MeshLambertMaterial({ color: 0x6e4a2c });
    const boardMat = new THREE.MeshLambertMaterial({ color: 0xdeb887 });
    const bannerMat = new THREE.MeshLambertMaterial({ color: 0x22c55e });

    const postGeom = new THREE.CylinderGeometry(0.08, 0.08, 1.8, 8);
    const post = new THREE.Mesh(postGeom, postMat);
    post.position.y = 0.9;
    post.castShadow = true;
    signGroup.add(post);

    const boardGeom = new THREE.BoxGeometry(1.4, 0.8, 0.1);
    const board = new THREE.Mesh(boardGeom, boardMat);
    board.position.set(0, 1.4, 0.06);
    signGroup.add(board);

    const bannerGeom = new THREE.BoxGeometry(1.2, 0.25, 0.12);
    const banner = new THREE.Mesh(bannerGeom, bannerMat);
    banner.position.set(0, 1.55, 0.08);
    signGroup.add(banner);

    group.add(signGroup);
    this.signMesh = signGroup;

    // 2. Cozy Fisherman's Cottage Exterior & Interior (Shown when owned)
    const houseGroup = new THREE.Group();
    houseGroup.name = 'CottageStructure';

    // Materials
    const wallMat = new THREE.MeshLambertMaterial({ color: 0xc8a27a }); // Timber log walls
    const roofMat = new THREE.MeshLambertMaterial({ color: 0x8b3a2b }); // Terracotta tile roof
    const doorMat = new THREE.MeshLambertMaterial({ color: 0x4a2e18 });
    const porchMat = new THREE.MeshLambertMaterial({ color: 0x5a3e24 });
    const floorMat = new THREE.MeshLambertMaterial({ color: 0x7c5332 });
    const hearthMat = new THREE.MeshLambertMaterial({ color: 0x555555 }); // Stone fireplace
    const rugMat = new THREE.MeshLambertMaterial({ color: 0x2563eb });

    // Foundation & Porch Deck
    const porchGeom = new THREE.BoxGeometry(6.4, 0.4, 6.4);
    const porch = new THREE.Mesh(porchGeom, porchMat);
    porch.position.y = 0.2;
    porch.receiveShadow = true;
    houseGroup.add(porch);

    // Main House Walls (Exterior Box)
    const wallGeom = new THREE.BoxGeometry(5.2, 3.2, 4.8);
    const walls = new THREE.Mesh(wallGeom, wallMat);
    walls.position.set(0, 1.8, -0.4);
    walls.castShadow = true;
    walls.receiveShadow = true;
    houseGroup.add(walls);

    // Gabled Roof
    const roofGeom = new THREE.ConeGeometry(4.2, 2.0, 4);
    roofGeom.rotateY(Math.PI / 4);
    const roof = new THREE.Mesh(roofGeom, roofMat);
    roof.position.set(0, 4.2, -0.4);
    roof.castShadow = true;
    houseGroup.add(roof);

    // Stone Chimney
    const chimneyGeom = new THREE.BoxGeometry(0.7, 3.8, 0.7);
    const chimney = new THREE.Mesh(chimneyGeom, hearthMat);
    chimney.position.set(1.8, 3.6, -1.2);
    chimney.castShadow = true;
    houseGroup.add(chimney);

    // Front Entrance Door
    const doorGeom = new THREE.BoxGeometry(1.2, 2.2, 0.15);
    const door = new THREE.Mesh(doorGeom, doorMat);
    door.position.set(0, 1.3, 2.05);
    houseGroup.add(door);

    // Front Porch Lantern (Warm glowing accent)
    const lanternGeom = new THREE.BoxGeometry(0.25, 0.35, 0.25);
    const lanternMat = new THREE.MeshBasicMaterial({ color: 0xffe066 });
    const lantern = new THREE.Mesh(lanternGeom, lanternMat);
    lantern.position.set(0.9, 2.2, 2.1);
    houseGroup.add(lantern);

    // Cozy Interior Props (Inside hearth & rug)
    const rugGeom = new THREE.CylinderGeometry(1.4, 1.4, 0.04, 16);
    const rug = new THREE.Mesh(rugGeom, rugMat);
    rug.position.set(0, 0.43, -1.2);
    houseGroup.add(rug);

    const hearthGeom = new THREE.BoxGeometry(1.6, 1.4, 0.8);
    const hearth = new THREE.Mesh(hearthGeom, hearthMat);
    hearth.position.set(1.7, 1.0, -1.8);
    houseGroup.add(hearth);

    group.add(houseGroup);
    this.houseMesh = houseGroup;

    group.position.copy(this.position);
    return group;
  }

  _updateVisualState() {
    if (this.signMesh) {
      this.signMesh.visible = !this.isOwned;
    }
    if (this.houseMesh) {
      this.houseMesh.visible = this.isOwned;
    }
  }

  getPromptText() {
    if (!this.isOwned) {
      return `Purchase ${this.name} (${this.cost} Coins)`;
    }
    if (this.isInside) {
      return `Exit to Island`;
    }
    return `Enter ${this.name}`;
  }

  /**
   * Purchases plot with economy deduction.
   * Enforces acceptance tests:
   * 1. Plot can be purchased with sufficient money.
   * 2. Players cannot purchase items they cannot afford.
   * 3. Exterior reflects ownership state.
   */
  purchase(playerOrEconomy, maybeEconomy) {
    let economy = maybeEconomy;
    if (!economy && playerOrEconomy && typeof playerOrEconomy.canAfford === 'function') {
      economy = playerOrEconomy;
    } else if (!economy && playerOrEconomy && playerOrEconomy.economy) {
      economy = playerOrEconomy.economy;
    }

    if (this.isOwned) {
      return { success: false, reason: 'Property is already owned' };
    }
    if (!economy || !economy.canAfford(this.cost)) {
      return { success: false, reason: `Insufficient coins (Need ${this.cost} Coins)` };
    }

    const spent = economy.spendCoins(this.cost);
    if (!spent) {
      return { success: false, reason: 'Transaction failed' };
    }

    this.isOwned = true;
    this._updateVisualState();

    return {
      success: true,
      plot: this,
      newBalance: economy.getCoins(),
    };
  }

  /**
   * Enters the house interior.
   * Enforces acceptance test: Owned house can be entered.
   */
  enter(player) {
    if (!this.isOwned) {
      return { success: false, reason: 'You do not own this property' };
    }
    this.isInside = true;
    if (player && player.position) {
      player.position.copy(this.interiorPos);
    }
    return { success: true };
  }

  /**
   * Exits the house back outside.
   */
  exit(player) {
    this.isInside = false;
    if (player && player.position) {
      player.position.copy(this.outsidePos);
    }
    return { success: true };
  }

  onInteract(player, context) {
    if (!this.isOwned) {
      if (player && player.economy) {
        return this.purchase(player, player.economy);
      }
      return false;
    }

    if (this.isInside) {
      return this.exit(player);
    } else {
      return this.enter(player);
    }
  }

  serialize() {
    return {
      id: this.id,
      isOwned: this.isOwned,
    };
  }

  deserialize(data) {
    if (data && data.isOwned !== undefined) {
      this.isOwned = Boolean(data.isOwned);
      this._updateVisualState();
    }
  }
}

export default PropertyPlot;
