// HousingManager: buy/enter/upgrade/decorate houses, per-house storage,
// aquarium and trophy displays, dock/mount parking and personal travel point.

import * as THREE from 'three';
import { HousingDefinitions, FurnitureDefinitions } from '../expansion/content.js';
import { getItemDefinition } from '../inventory/BackpackManager.js';

export class HousingManager {
  constructor(propertyManager = null) {
    this.propertyManager = propertyManager;
    this.definitions = HousingDefinitions;
    this.state = {};
    this.onNotification = null;
    this.onFurniturePlaced = null;
    this._initState();
  }

  _initState() {
    for (const house of this.definitions) {
      if (!this.state[house.id]) {
        this.state[house.id] = {
          level: house.level || 1,
          furniture: [],
          storageFish: [],
          storageItems: {},
          aquarium: [],
          trophies: [],
          rodDisplay: null,
          visitorAllowed: false,
          color: house.color,
          homeSet: false,
          dockUnlocked: false,
        };
      }
    }
  }

  getDefinition(id) {
    return this.definitions.find((h) => h.id === id) || null;
  }

  getHouseState(id) {
    this._initState();
    return this.state[id];
  }

  getProperty(id) {
    return this.propertyManager ? this.propertyManager.getPlot(id) : null;
  }

  getHouses() {
    return this.definitions.map((def) => {
      const plot = this.getProperty(def.id);
      const state = this.getHouseState(def.id);
      return {
        ...def,
        isOwned: Boolean(plot && plot.isOwned),
        isInside: Boolean(plot && plot.isInside),
        level: state.level,
        maxLevel: def.maxLevel || 5,
        furnitureCount: state.furniture.length,
        aquariumCount: state.aquarium.length,
        storageCount: state.storageFish.length + Object.values(state.storageItems).reduce((a, b) => a + b, 0),
        dockUnlocked: state.level >= 5 || state.dockUnlocked,
        homeSet: state.homeSet,
        visitorAllowed: state.visitorAllowed,
        plotCost: plot ? plot.cost : def.cost,
        upgradeCost: this.getUpgradeCost(def.id),
      };
    });
  }

  canPurchase(id) {
    const house = this.getHouses().find((h) => h.id === id);
    return Boolean(house && !house.isOwned);
  }

  purchase(id, playerOrEconomy) {
    if (!this.propertyManager) return { success: false, reason: 'Housing unavailable' };
    const plot = this.getProperty(id);
    if (!plot) return { success: false, reason: 'House plot not found' };
    const result = plot.purchase(playerOrEconomy);
    if (result.success) {
      this._applyVisuals(plot);
      this._notify(`${plot.name} purchased!`);
    }
    return result;
  }

  enter(id, player) {
    const plot = this.getProperty(id);
    if (!plot) return { success: false, reason: 'House not found' };
    return plot.enter(player);
  }

  exit(id, player) {
    const plot = this.getProperty(id);
    if (!plot) return { success: false, reason: 'House not found' };
    return plot.exit(player);
  }

  getUpgradeCost(id) {
    const state = this.getHouseState(id);
    if (state.level >= 5) return null;
    return 650 + state.level * 550;
  }

  getUpgradeRequirements(id) {
    const state = this.getHouseState(id);
    const next = state.level + 1;
    const requirements = { coins: this.getUpgradeCost(id), furniture: 0 };
    if (next === 2) requirements.furniture = 2;
    if (next === 3) requirements.furniture = 5;
    if (next === 4) requirements.furniture = 8;
    if (next === 5) requirements.furniture = 12;
    return requirements;
  }

  upgrade(id, economy) {
    const state = this.getHouseState(id);
    if (!this.getProperty(id)?.isOwned) return { success: false, reason: 'Purchase this house first' };
    const cost = this.getUpgradeCost(id);
    if (cost === null) return { success: false, reason: 'House is already level 5' };
    const requirements = this.getUpgradeRequirements(id);
    if (state.furniture.length < requirements.furniture) {
      return { success: false, reason: `Place ${requirements.furniture - state.furniture.length} more furniture items first` };
    }
    if (!economy || !economy.canAfford(cost)) return { success: false, reason: `Need ${cost} coins` };
    if (!economy.spendCoins(cost)) return { success: false, reason: 'Transaction failed' };
    state.level++;
    if (state.level >= 5) state.dockUnlocked = true;
    const plot = this.getProperty(id);
    if (plot) this._applyVisuals(plot);
    this._notify(`House upgraded to level ${state.level}`);
    return { success: true, level: state.level, cost, newBalance: economy.getCoins() };
  }

  getFurnitureCatalog() {
    return FurnitureDefinitions.map((f) => ({ ...f }));
  }

  buyFurniture(furnitureId, economy) {
    const def = FurnitureDefinitions.find((f) => f.id === furnitureId);
    if (!def) return { success: false, reason: 'Unknown furniture' };
    if (!economy || !economy.canAfford(def.cost)) return { success: false, reason: `Need ${def.cost} coins` };
    if (!economy.spendCoins(def.cost)) return { success: false, reason: 'Transaction failed' };
    return { success: true, furniture: def, newBalance: economy.getCoins() };
  }

  placeFurniture(houseId, furnitureId, economy = null) {
    const state = this.getHouseState(houseId);
    const plot = this.getProperty(houseId);
    if (!plot || !plot.isOwned) return { success: false, reason: 'Purchase this house first' };
    const def = FurnitureDefinitions.find((f) => f.id === furnitureId);
    if (!def) return { success: false, reason: 'Unknown furniture' };
    if (economy) {
      const purchase = this.buyFurniture(furnitureId, economy);
      if (!purchase.success) return purchase;
    }
    if (state.furniture.includes(furnitureId)) return { success: false, reason: 'Furniture already placed' };
    state.furniture.push(furnitureId);
    this._applyVisuals(plot);
    if (typeof this.onFurniturePlaced === 'function') this.onFurniturePlaced(def);
    return { success: true, furniture: def };
  }

  removeFurniture(houseId, furnitureId) {
    const state = this.getHouseState(houseId);
    const idx = state.furniture.indexOf(furnitureId);
    if (idx < 0) return { success: false, reason: 'Furniture not placed' };
    state.furniture.splice(idx, 1);
    const plot = this.getProperty(houseId);
    if (plot) this._applyVisuals(plot);
    return { success: true };
  }

  setHouseColor(houseId, color) {
    const state = this.getHouseState(houseId);
    state.color = color;
    const plot = this.getProperty(houseId);
    if (plot) this._applyVisuals(plot);
    return { success: true, color };
  }

  toggleVisitors(houseId) {
    const state = this.getHouseState(houseId);
    state.visitorAllowed = !state.visitorAllowed;
    return { success: true, allowed: state.visitorAllowed };
  }

  setHome(houseId) {
    if (!this.getProperty(houseId)?.isOwned) return { success: false, reason: 'Purchase this house first' };
    for (const id of Object.keys(this.state)) this.state[id].homeSet = false;
    this.getHouseState(houseId).homeSet = true;
    this._notify('Personal teleport point set to this house');
    return { success: true };
  }

  getHomeHouse() {
    const entry = Object.entries(this.state).find(([, state]) => state.homeSet);
    return entry ? this.getDefinition(entry[0]) : null;
  }

  teleportHome(player) {
    const house = this.getHomeHouse();
    if (!house || !player) return { success: false, reason: 'Set a home teleport point first' };
    const plot = this.getProperty(house.id);
    if (!plot) return { success: false, reason: 'Home not found' };
    player.position.copy(plot.outsidePos);
    player.isGrounded = true;
    return { success: true, house };
  }

  stockAquarium(houseId, inventory, instanceId) {
    const state = this.getHouseState(houseId);
    if (!this.getProperty(houseId)?.isOwned) return { success: false, reason: 'Purchase this house first' };
    if (state.level < 4) return { success: false, reason: 'Upgrade to level 4 for an aquarium room' };
    if (state.aquarium.length >= 12) return { success: false, reason: 'Aquarium is full' };
    const fish = inventory.bucket.find((f) => f.instanceId === instanceId);
    if (!fish) return { success: false, reason: 'Fish not found' };
    inventory.removeFish(instanceId);
    state.aquarium.push(fish);
    return { success: true, fish };
  }

  decorateAquarium(houseId, cosmeticId) {
    const state = this.getHouseState(houseId);
    if (!state.aquariumDecor) state.aquariumDecor = [];
    if (!state.aquariumDecor.includes(cosmeticId)) state.aquariumDecor.push(cosmeticId);
    return { success: true };
  }

  addTrophy(houseId, trophy) {
    const state = this.getHouseState(houseId);
    if (!trophy) return { success: false, reason: 'Invalid trophy' };
    if (!state.trophies.find((t) => t.id === trophy.id)) {
      state.trophies.push({ ...trophy });
    }
    return { success: true };
  }

  displayRod(houseId, rodName) {
    const state = this.getHouseState(houseId);
    state.rodDisplay = rodName;
    return { success: true };
  }

  storeFish(houseId, inventory, instanceId) {
    const state = this.getHouseState(houseId);
    if (!this.getProperty(houseId)?.isOwned) return { success: false, reason: 'Purchase this house first' };
    const fish = inventory.bucket.find((f) => f.instanceId === instanceId);
    if (!fish) return { success: false, reason: 'Fish not found' };
    if (state.storageFish.length >= 100) return { success: false, reason: 'House storage is full' };
    inventory.removeFish(instanceId);
    state.storageFish.push(fish);
    return { success: true, fish };
  }

  withdrawFish(houseId, inventory, instanceId) {
    const state = this.getHouseState(houseId);
    const idx = state.storageFish.findIndex((f) => f.instanceId === instanceId);
    if (idx < 0) return { success: false, reason: 'Fish not in house storage' };
    const fish = state.storageFish[idx];
    const added = inventory.addFish(fish);
    if (!added.success) return { success: false, reason: added.reason };
    state.storageFish.splice(idx, 1);
    return { success: true, fish };
  }

  storeItem(houseId, backpack, itemId, qty = 1) {
    const state = this.getHouseState(houseId);
    if (!this.getProperty(houseId)?.isOwned) return { success: false, reason: 'Purchase this house first' };
    const count = Math.min(backpack.getCount(itemId), Math.max(1, Math.floor(qty)));
    if (count <= 0) return { success: false, reason: 'None in backpack' };
    backpack.removeItem(itemId, count);
    state.storageItems[itemId] = (state.storageItems[itemId] || 0) + count;
    return { success: true, itemId, qty: count };
  }

  withdrawItem(houseId, backpack, itemId, qty = 1) {
    const state = this.getHouseState(houseId);
    const have = state.storageItems[itemId] || 0;
    const count = Math.min(have, Math.max(1, Math.floor(qty)));
    if (count <= 0) return { success: false, reason: 'None in house storage' };
    const added = backpack.addItem(itemId, count, null);
    if (!added.success) return { success: false, reason: added.reason };
    state.storageItems[itemId] -= count;
    if (state.storageItems[itemId] <= 0) delete state.storageItems[itemId];
    return { success: true, itemId, qty: count };
  }

  getStorageState(houseId) {
    const state = this.getHouseState(houseId);
    const itemWeight = Object.entries(state.storageItems).reduce((sum, [id, qty]) => {
      const def = getItemDefinition(id);
      return sum + (def ? def.weight * qty : 0);
    }, 0);
    return {
      fish: [...state.storageFish],
      items: { ...state.storageItems },
      itemWeight: Number(itemWeight.toFixed(2)),
      capacity: 100,
    };
  }

  /**
   * Builds a visible furniture/trophy/aquarium layer inside the owned cottage.
   */
  _applyVisuals(plot) {
    if (!plot || !plot.houseMesh) return;
    if (plot.houseMesh.userData.expansionGroup) {
      plot.houseMesh.remove(plot.houseMesh.userData.expansionGroup);
    }
    const state = this.getHouseState(plot.id);
    const group = new THREE.Group();
    group.name = 'HousingExpansionInterior';
    const houseColor = state.color || 0xc8a27a;
    const floorMat = new THREE.MeshLambertMaterial({ color: 0x7c5332 });

    const furnitureDefs = state.furniture
      .map((id) => FurnitureDefinitions.find((f) => f.id === id))
      .filter(Boolean);
    furnitureDefs.forEach((def, index) => {
      const geom = new THREE.BoxGeometry(0.6, 0.35, 0.6);
      const mat = new THREE.MeshLambertMaterial({ color: def.color || houseColor });
      const mesh = new THREE.Mesh(geom, mat);
      const angle = (index / Math.max(1, furnitureDefs.length)) * Math.PI * 2;
      mesh.position.set(Math.cos(angle) * 1.5, 0.55, -1.0 + Math.sin(angle) * 1.2);
      mesh.castShadow = true;
      group.add(mesh);
    });

    if (state.level >= 2) {
      const wing = new THREE.Mesh(
        new THREE.BoxGeometry(2.2, 2.0, 2.4),
        new THREE.MeshLambertMaterial({ color: houseColor })
      );
      wing.position.set(-3.2, 1.5, -0.6);
      group.add(wing);
    }
    if (state.level >= 3) {
      const workshop = new THREE.Mesh(
        new THREE.BoxGeometry(1.8, 1.6, 1.8),
        new THREE.MeshLambertMaterial({ color: 0x8a5229 })
      );
      workshop.position.set(3.0, 1.4, -1.2);
      group.add(workshop);
    }
    if (state.level >= 4) {
      const tank = new THREE.Mesh(
        new THREE.BoxGeometry(2.6, 1.2, 1.0),
        new THREE.MeshLambertMaterial({ color: 0x6fd8e8, transparent: true, opacity: 0.65 })
      );
      tank.position.set(0, 1.1, -2.2);
      group.add(tank);
      for (let i = 0; i < Math.min(6, state.aquarium.length); i++) {
        const fishMesh = new THREE.Mesh(
          new THREE.ConeGeometry(0.1, 0.34, 6),
          new THREE.MeshBasicMaterial({ color: 0xffb347 })
        );
        fishMesh.rotation.z = Math.PI / 2;
        fishMesh.position.set(-1.0 + i * 0.4, 1.1, -2.0);
        group.add(fishMesh);
      }
    }
    if (state.level >= 5) {
      const dock = new THREE.Mesh(new THREE.BoxGeometry(4.0, 0.3, 2.0), floorMat);
      dock.position.set(0, 0.2, 4.0);
      group.add(dock);
      const trophyCase = new THREE.Mesh(
        new THREE.BoxGeometry(1.8, 2.0, 0.7),
        new THREE.MeshLambertMaterial({ color: 0xd4af37 })
      );
      trophyCase.position.set(0, 1.6, -3.0);
      group.add(trophyCase);
      state.trophies.slice(0, 4).forEach((trophy, i) => {
        const statue = new THREE.Mesh(
          new THREE.SphereGeometry(0.16, 8, 8),
          new THREE.MeshBasicMaterial({ color: 0xffe066 })
        );
        statue.position.set(-0.6 + i * 0.4, 1.8, -2.6);
        group.add(statue);
      });
    }

    plot.houseMesh.add(group);
    plot.houseMesh.userData.expansionGroup = group;
  }

  _notify(message) {
    if (typeof this.onNotification === 'function') this.onNotification(message);
  }

  serialize() {
    return JSON.parse(JSON.stringify(this.state));
  }

  deserialize(data, propertyManager = null) {
    if (propertyManager) this.propertyManager = propertyManager;
    if (data && typeof data === 'object') {
      for (const [id, state] of Object.entries(data)) {
        if (this.state[id]) this.state[id] = { ...this.state[id], ...state };
      }
    }
    if (this.propertyManager) {
      for (const house of this.definitions) {
        const plot = this.getProperty(house.id);
        if (plot) this._applyVisuals(plot);
      }
    }
  }

  reset() {
    this.state = {};
    this._initState();
  }
}

export default HousingManager;
