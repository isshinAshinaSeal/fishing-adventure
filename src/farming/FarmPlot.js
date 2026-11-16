// FarmPlot: a single plantable bed. Growth is advanced by FarmingManager in
// gameplay seconds; watering permanently speeds the current crop until harvest.

import * as THREE from 'three';
import { Interactable } from '../interaction/Interactable.js';
import { getCropDefinition } from './crops.js';

const STAGE_LABELS = ['Empty', 'Sprout', 'Growing', 'Nearly ripe', 'Ready'];

export class FarmPlot extends Interactable {
  constructor(options = {}) {
    super({
      id: options.id,
      name: options.name || 'Farm Plot',
      type: 'farm_plot',
      promptAction: 'Tend',
      interactionRange: options.interactionRange || 3.4,
      position: options.position || { x: 0, y: 0, z: 0 },
      ...options,
    });
    this.zone = options.zone || 'starter';
    this.zoneLabel = options.zoneLabel || (this.zone === 'city' ? 'Aurelia Rooftop' : 'Harbor Farm');
    this.cropId = null;
    this.growth = 0;
    this.watered = false;
    this.harvestCount = 0;
    this.actionHandler = null;
    this.mesh = options.mesh === false ? null : this._createMesh();
  }

  get crop() {
    return getCropDefinition(this.cropId);
  }

  get isReady() {
    const crop = this.crop;
    return Boolean(crop) && this.growth >= crop.growTime;
  }

  get stage() {
    if (!this.crop) return 0;
    if (this.isReady) return 4;
    const ratio = this.growth / this.crop.growTime;
    if (ratio < 0.34) return 1;
    if (ratio < 0.7) return 2;
    return 3;
  }

  getGrowthRate(tool = null) {
    const wateringBonus = this.watered ? 0.5 + (Number(tool?.growthBonus) || 0) : 0;
    return 1 + Math.max(0, wateringBonus);
  }

  plant(cropId) {
    const crop = getCropDefinition(cropId);
    if (!crop) return { success: false, reason: 'Unknown crop' };
    if (this.cropId) return { success: false, reason: 'This plot is already planted' };
    this.cropId = crop.id;
    this.growth = 0;
    this.watered = false;
    this._refreshVisual();
    return { success: true, crop, plot: this };
  }

  water() {
    if (!this.cropId) return { success: false, reason: 'Plant a crop first' };
    if (this.watered) return { success: false, reason: 'This plot is already watered' };
    this.watered = true;
    this._refreshVisual();
    return { success: true, plot: this, crop: this.crop };
  }

  updateGrowth(dt, tool = null, multiplier = 1) {
    if (!this.cropId || this.isReady) return false;
    const beforeStage = this.stage;
    this.growth = Math.min(
      this.crop.growTime,
      this.growth + Math.max(0, dt) * this.getGrowthRate(tool) * Math.max(0, multiplier)
    );
    if (this.stage !== beforeStage) this._refreshVisual();
    return true;
  }

  getProgress() {
    if (!this.crop) return 0;
    return Math.min(100, (this.growth / this.crop.growTime) * 100);
  }

  getRemainingSeconds(tool = null, multiplier = 1) {
    if (!this.crop || this.isReady) return 0;
    const rate = this.getGrowthRate(tool) * Math.max(0.01, multiplier);
    return Math.max(0, Math.ceil((this.crop.growTime - this.growth) / rate));
  }

  getState(tool = null, multiplier = 1) {
    const crop = this.crop;
    return {
      id: this.id,
      name: this.name,
      zone: this.zone,
      zoneLabel: this.zoneLabel,
      position: { x: this.position.x, y: this.position.y, z: this.position.z },
      cropId: this.cropId,
      crop: crop ? { ...crop } : null,
      growth: Math.round(this.growth),
      growTime: crop ? crop.growTime : 0,
      progress: Math.round(this.getProgress()),
      stage: this.stage,
      stageLabel: STAGE_LABELS[this.stage],
      ready: this.isReady,
      watered: this.watered,
      remaining: this.getRemainingSeconds(tool, multiplier),
      harvestCount: this.harvestCount,
    };
  }

  getPromptText() {
    if (!this.crop) return `🌱 Plant at ${this.name}`;
    if (this.isReady) return `🧺 Harvest ${this.crop.name}`;
    if (!this.watered) return `💧 Water ${this.crop.name}`;
    return `🌿 ${this.crop.name} · ${Math.round(this.getProgress())}%`;
  }

  onInteract(player, context) {
    if (typeof this.actionHandler === 'function') {
      return this.actionHandler(this, player, context);
    }
    return super.onInteract(player, context);
  }

  update(dt, elapsed = 0) {
    if (!this.mesh) return;
    const sway = Math.sin(elapsed * 1.4 + this.position.x * 0.3) * 0.04;
    if (this.cropMesh) {
      this.cropMesh.rotation.z = sway;
      this.cropMesh.position.y = 0.32 + sway * 0.5;
    }
    if (this.marker) {
      this.marker.visible = this.isReady;
      if (this.marker.visible) {
        this.marker.position.y = 1.5 + Math.sin(elapsed * 3 + this.position.z) * 0.12;
        this.marker.rotation.y += dt * 1.8;
      }
    }
  }

  reset() {
    this.cropId = null;
    this.growth = 0;
    this.watered = false;
    this.harvestCount = 0;
    this._refreshVisual();
  }

  serialize() {
    return {
      id: this.id,
      cropId: this.cropId,
      growth: Number(this.growth.toFixed(3)),
      watered: Boolean(this.watered),
      harvestCount: this.harvestCount,
    };
  }

  deserialize(data) {
    if (!data) return;
    this.cropId = getCropDefinition(data.cropId) ? data.cropId : null;
    this.growth = Math.max(0, Number(data.growth) || 0);
    this.watered = Boolean(data.watered);
    this.harvestCount = Math.max(0, Number(data.harvestCount) || 0);
    if (this.cropId) this.growth = Math.min(this.growth, this.crop.growTime);
    this._refreshVisual();
  }

  _createMesh() {
    const group = new THREE.Group();
    group.name = `FarmPlot_${this.id}`;

    const borderMat = new THREE.MeshLambertMaterial({ color: 0x7a5a3a });
    const soilMat = new THREE.MeshLambertMaterial({ color: 0x4b3524 });
    const bed = new THREE.Mesh(new THREE.BoxGeometry(2.6, 0.34, 2.6), soilMat);
    bed.position.y = 0.17;
    bed.receiveShadow = true;
    group.add(bed);

    for (const [x, z, w, d] of [
      [0, 1.33, 2.7, 0.16], [0, -1.33, 2.7, 0.16],
      [1.33, 0, 0.16, 2.7], [-1.33, 0, 0.16, 2.7],
    ]) {
      const rail = new THREE.Mesh(new THREE.BoxGeometry(w, 0.26, d), borderMat);
      rail.position.set(x, 0.36, z);
      group.add(rail);
    }

    const cropGroup = new THREE.Group();
    cropGroup.position.y = 0.32;
    const stemMat = new THREE.MeshLambertMaterial({ color: 0x3f8f4a });
    for (const [x, z] of [[-0.62, -0.55], [0.58, -0.35], [-0.2, 0.6], [0.5, 0.62]]) {
      const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.06, 0.85, 5), stemMat);
      stem.position.set(x, 0.42, z);
      cropGroup.add(stem);
      const leaf = new THREE.Mesh(new THREE.SphereGeometry(0.18, 5, 4), stemMat.clone());
      leaf.position.set(x, 0.86, z);
      leaf.scale.set(1, 0.7, 1);
      cropGroup.add(leaf);
    }
    group.add(cropGroup);
    this.cropGroup = cropGroup;
    this.cropMesh = cropGroup;

    const marker = new THREE.Mesh(
      new THREE.OctahedronGeometry(0.2, 0),
      new THREE.MeshBasicMaterial({ color: 0xffe066 })
    );
    marker.position.y = 1.5;
    marker.visible = false;
    group.add(marker);
    this.marker = marker;

    group.position.copy(this.position);
    this._refreshVisual();
    return group;
  }

  _refreshVisual() {
    if (!this.cropGroup) return;
    const crop = this.crop;
    const visible = Boolean(crop);
    this.cropGroup.visible = visible;
    if (!visible) {
      if (this.marker) this.marker.visible = false;
      return;
    }
    const scaleByStage = [0.25, 0.45, 0.72, 0.95, 1.15];
    const scale = scaleByStage[this.stage] || 0.25;
    this.cropGroup.scale.set(scale, scale, scale);
    const color = crop.color || 0x8fbf6a;
    this.cropGroup.traverse((child) => {
      if (child.isMesh && child.material && child.material.color) {
        child.material = child.material.clone();
        child.material.color.setHex(color);
      }
    });
    if (this.marker) this.marker.visible = this.isReady;
  }
}

export default FarmPlot;
