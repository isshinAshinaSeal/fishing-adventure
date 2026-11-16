// ResourceNode: a physical tree or rock seam. It is both an interactable world
// object and a small HP pool advanced one strike at a time by GatheringManager.

import * as THREE from 'three';
import { Interactable } from '../interaction/Interactable.js';

export class ResourceNode extends Interactable {
  constructor(options = {}) {
    super({
      id: options.id,
      name: options.name || 'Resource Node',
      type: 'resource_node',
      promptAction: options.kind === 'tree' ? 'Chop' : 'Mine',
      interactionRange: options.interactionRange || 4.0,
      position: options.position || { x: 0, y: 0, z: 0 },
      ...options,
    });
    this.template = options.template;
    this.kind = options.template.kind;
    this.zone = options.zone || 'harbor';
    this.zoneLabel = this.zone === 'city' ? 'Aurelia Heights' : 'Driftwood Harbor';
    this.maxHp = options.template.hp;
    this.hp = this.maxHp;
    this.respawnRemaining = 0;
    this.timesHarvested = 0;
    this.onStrike = null;
    this.toolProvider = null;
    this.mesh = options.mesh === false ? null : this._createMesh();
  }

  get tier() {
    return this.template.requiredTier;
  }

  get isDepleted() {
    return this.hp <= 0;
  }

  getEquippedTool() {
    return typeof this.toolProvider === 'function' ? this.toolProvider(this.kind) : null;
  }

  canHarvest() {
    if (this.isDepleted) return false;
    const tool = this.getEquippedTool();
    return Boolean(tool) && tool.tier >= this.template.requiredTier;
  }

  strike(tool, multiplier = 1) {
    if (this.isDepleted) return { success: false, reason: 'This node is already depleted' };
    if (!tool) return { success: false, reason: 'No gathering tool equipped' };
    if (tool.tier < this.template.requiredTier) {
      return {
        success: false,
        reason: `Requires a tier ${this.template.requiredTier} ${this.kind === 'tree' ? 'axe' : 'pickaxe'}`,
      };
    }
    const damage = Math.max(1, Math.round(Number(tool.power) * multiplier));
    this.hp = Math.max(0, this.hp - damage);
    if (this.isDepleted) {
      this.respawnRemaining = this.template.respawn;
      this.timesHarvested++;
      this._setDepleted(true);
    }
    return { success: true, damage, hp: this.hp, depleted: this.isDepleted };
  }

  respawn() {
    this.hp = this.maxHp;
    this.respawnRemaining = 0;
    this._setDepleted(false);
  }

  refreshPrompt() {
    // getPromptText reads live tool/respawn state; nothing cached to update.
  }

  getPromptText() {
    if (this.isDepleted) {
      return `⏳ ${this.name} resprouts in ${Math.ceil(this.respawnRemaining)}s`;
    }
    const tool = this.getEquippedTool();
    if (!tool) {
      return `🔒 ${this.name} · equip a ${this.kind === 'tree' ? 'axe' : 'pickaxe'}`;
    }
    if (tool.tier < this.template.requiredTier) {
      return `🔒 ${this.name} · requires tier ${this.template.requiredTier} ${this.kind === 'tree' ? 'axe' : 'pickaxe'}`;
    }
    const verb = this.kind === 'tree' ? 'Chop' : 'Mine';
    return `${this.template.icon} ${verb} ${this.name} · ${this.hp}/${this.maxHp} HP`;
  }

  onInteract(player, context) {
    if (typeof this.onStrike === 'function') {
      return this.onStrike(this, player, context);
    }
    return super.onInteract(player, context);
  }

  update(dt, elapsed = 0) {
    if (!this.mesh || this.isDepleted) return;
    if (this.crown) {
      this.crown.rotation.z = Math.sin(elapsed * 1.1 + this.position.x * 0.1) * 0.02;
    }
    if (this.oreGlow) {
      this.oreGlow.opacity = 0.55 + Math.sin(elapsed * 2.2 + this.position.z) * 0.2;
    }
  }

  getState(tool = null) {
    return {
      id: this.id,
      name: this.name,
      kind: this.kind,
      icon: this.template.icon,
      zone: this.zone,
      zoneLabel: this.zoneLabel,
      position: { x: this.position.x, y: this.position.y, z: this.position.z },
      hp: this.hp,
      maxHp: this.maxHp,
      requiredTier: this.template.requiredTier,
      depleted: this.isDepleted,
      respawnRemaining: Math.ceil(this.respawnRemaining),
      timesHarvested: this.timesHarvested,
      canHarvest: Boolean(tool) && tool.tier >= this.template.requiredTier && !this.isDepleted,
      drops: this.template.drops.map((drop) => ({ ...drop })),
    };
  }

  serialize() {
    return {
      id: this.id,
      hp: this.hp,
      respawnRemaining: Number(this.respawnRemaining.toFixed(2)),
      timesHarvested: this.timesHarvested,
    };
  }

  deserialize(data) {
    if (!data) return;
    this.timesHarvested = Math.max(0, Number(data.timesHarvested) || 0);
    const hp = Number(data.hp);
    this.hp = Number.isFinite(hp) ? Math.max(0, Math.min(this.maxHp, hp)) : this.maxHp;
    this.respawnRemaining = Math.max(0, Number(data.respawnRemaining) || 0);
    if (this.hp <= 0) {
      if (this.respawnRemaining <= 0) this.respawnRemaining = this.template.respawn;
      this._setDepleted(true);
    } else {
      this.respawnRemaining = 0;
      this._setDepleted(false);
    }
  }

  _createMesh() {
    const group = new THREE.Group();
    group.name = `ResourceNode_${this.id}`;
    group.position.copy(this.position);
    this.visual = new THREE.Group();
    group.add(this.visual);

    if (this.kind === 'tree') {
      this._buildTree(group);
    } else {
      this._buildRock(group);
    }

    const stump = new THREE.Group();
    const stumpMat = new THREE.MeshLambertMaterial({
      color: this.kind === 'tree' ? 0x5c4326 : 0x555b63,
    });
    if (this.kind === 'tree') {
      const cut = new THREE.Mesh(new THREE.CylinderGeometry(0.34, 0.42, 0.55, 7), stumpMat);
      cut.position.y = 0.28;
      stump.add(cut);
    } else {
      const rubble = new THREE.Mesh(new THREE.DodecahedronGeometry(0.65, 0), stumpMat);
      rubble.position.y = 0.35;
      rubble.scale.set(1.2, 0.45, 1);
      stump.add(rubble);
    }
    stump.visible = false;
    group.add(stump);
    this.stump = stump;

    const marker = new THREE.Mesh(
      new THREE.OctahedronGeometry(0.14, 0),
      new THREE.MeshBasicMaterial({ color: 0xffe066 })
    );
    marker.position.y = this.kind === 'tree' ? 4.3 : 1.9;
    marker.visible = false;
    group.add(marker);
    this.marker = marker;
    return group;
  }

  _buildTree(group) {
    const trunkMat = new THREE.MeshLambertMaterial({ color: this.template.trunkColor || 0x6e5239 });
    const leafMat = new THREE.MeshLambertMaterial({ color: this.template.color || 0x3f8f4a, flatShading: true });
    const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.42, 2.6, 7), trunkMat);
    trunk.position.y = 1.3;
    trunk.castShadow = true;
    this.visual.add(trunk);

    const crown = new THREE.Group();
    crown.position.y = 2.7;
    const layers = this.template.id === 'skywood_tree' || this.template.id === 'ironwood_tree' ? 3 : 2;
    for (let i = 0; i < layers; i++) {
      const cone = new THREE.Mesh(
        new THREE.ConeGeometry(1.8 - i * 0.35, 1.7 - i * 0.18, 7),
        leafMat
      );
      cone.position.y = i * 0.85;
      cone.castShadow = true;
      crown.add(cone);
    }
    this.visual.add(crown);
    this.crown = crown;

    if (this.template.id === 'crystal_tree' || this.template.id === 'skywood_tree') {
      const crystalMat = new THREE.MeshBasicMaterial({
        color: this.template.id === 'skywood_tree' ? 0x22d3ee : 0x9be7ff,
        transparent: true,
        opacity: 0.8,
      });
      for (let i = 0; i < 3; i++) {
        const shard = new THREE.Mesh(new THREE.OctahedronGeometry(0.2, 0), crystalMat);
        shard.position.set(Math.cos(i * 2.1) * 1.1, 3.2 + i * 0.3, Math.sin(i * 2.1) * 1.1);
        this.visual.add(shard);
      }
      this.oreGlow = crystalMat;
    }
  }

  _buildRock(group) {
    const baseMat = new THREE.MeshLambertMaterial({ color: 0x6d737c, flatShading: true });
    const oreMat = new THREE.MeshLambertMaterial({ color: this.template.color || 0x8e99a8, flatShading: true });
    const base = new THREE.Mesh(new THREE.DodecahedronGeometry(1.35, 0), baseMat);
    base.position.y = 1.0;
    base.scale.set(1.25, 0.85, 1.1);
    base.castShadow = true;
    this.visual.add(base);

    for (let i = 0; i < 4; i++) {
      const ore = new THREE.Mesh(new THREE.DodecahedronGeometry(0.38, 0), oreMat);
      ore.position.set(
        Math.cos(i * 1.7) * 0.9,
        0.8 + (i % 2) * 0.55,
        Math.sin(i * 1.7) * 0.9
      );
      ore.rotation.set(i * 0.4, i * 0.7, i * 0.2);
      this.visual.add(ore);
    }

    if (this.template.id === 'mythril_vein' || this.template.id === 'obsidian_seam') {
      const glowMat = new THREE.MeshBasicMaterial({
        color: this.template.id === 'mythril_vein' ? 0x8fbcff : 0xa855f7,
        transparent: true,
        opacity: 0.7,
      });
      const glow = new THREE.Mesh(new THREE.OctahedronGeometry(0.3, 0), glowMat);
      glow.position.set(0.4, 1.55, -0.2);
      this.visual.add(glow);
      this.oreGlow = glowMat;
    }
  }

  _setDepleted(depleted) {
    if (this.visual) this.visual.visible = !depleted;
    if (this.stump) this.stump.visible = depleted;
    if (this.marker) this.marker.visible = depleted;
  }
}

export default ResourceNode;
