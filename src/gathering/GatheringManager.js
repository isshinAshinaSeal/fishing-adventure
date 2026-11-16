// GatheringManager: axe/pickaxe ownership, node HP, drops, respawn timers,
// gathering XP and persistence for every tree and rock seam in the world.

import {
  GatheringToolDefinitions,
  ResourceNodeDefinitions,
  getGatheringToolDefinition,
  getResourceTemplate,
} from './resources.js';
import { ResourceNode } from './ResourceNode.js';

function randomInt(min, max) {
  const lo = Math.ceil(Number(min) || 0);
  const hi = Math.floor(Number(max) || lo);
  if (hi <= lo) return lo;
  return lo + Math.floor(Math.random() * (hi - lo + 1));
}

export class GatheringManager {
  constructor(options = {}) {
    this.toolCatalog = GatheringToolDefinitions;
    this.ownedToolIds = new Set(['axe_rusty', 'pickaxe_rusty']);
    this.equippedAxeId = 'axe_rusty';
    this.equippedPickaxeId = 'pickaxe_rusty';
    this.stats = { strikes: 0, nodesFelled: 0, itemsGathered: 0, xpEarned: 0 };
    this.nodes = [];
    this.onNotification = null;
    this.onResource = null;
    this.contextProvider = null;
    this.sampleHeight = typeof options.sampleHeight === 'function'
      ? options.sampleHeight
      : () => 0;
    this._createNodes();
  }

  _createNodes() {
    for (const def of ResourceNodeDefinitions) {
      const template = getResourceTemplate(def.templateId);
      if (!template) continue;
      const node = new ResourceNode({
        id: def.id,
        name: template.name,
        template,
        zone: def.zone,
        position: {
          x: def.x,
          y: this.sampleHeight(def.x, def.z),
          z: def.z,
        },
      });
      node.toolProvider = (kind) => this.getEquippedToolFor(kind);
      node.onStrike = (target) => this.strike(target.id);
      this.nodes.push(node);
    }
  }

  getNode(nodeId) {
    return this.nodes.find((node) => node.id === nodeId) || null;
  }

  getNodes() {
    return this.nodes.map((node) => node.getState(this.getEquippedToolFor(node.kind)));
  }

  getToolCatalog() {
    return this.toolCatalog.map((tool) => ({
      ...tool,
      isOwned: this.ownedToolIds.has(tool.id),
      isEquipped: tool.type === 'axe'
        ? this.equippedAxeId === tool.id
        : this.equippedPickaxeId === tool.id,
    }));
  }

  getEquippedAxe() {
    return getGatheringToolDefinition(this.equippedAxeId);
  }

  getEquippedPickaxe() {
    return getGatheringToolDefinition(this.equippedPickaxeId);
  }

  getEquippedToolFor(kind) {
    return kind === 'tree' ? this.getEquippedAxe() : this.getEquippedPickaxe();
  }

  buyTool(toolId, economy) {
    const tool = getGatheringToolDefinition(toolId);
    if (!tool) return { success: false, reason: 'Unknown gathering tool' };
    if (this.ownedToolIds.has(toolId)) return { success: false, reason: 'Gathering tool already owned' };
    if (!economy || !economy.canAfford(tool.cost)) return { success: false, reason: `Need ${tool.cost} coins` };
    if (!economy.spendCoins(tool.cost)) return { success: false, reason: 'Transaction failed' };
    this.ownedToolIds.add(toolId);
    this._equipTool(tool);
    this._notify(`${tool.name} purchased and equipped`);
    return { success: true, tool, newBalance: economy.getCoins() };
  }

  equipTool(toolId) {
    const tool = getGatheringToolDefinition(toolId);
    if (!tool) return { success: false, reason: 'Unknown gathering tool' };
    if (!this.ownedToolIds.has(toolId)) return { success: false, reason: 'Gathering tool not owned' };
    this._equipTool(tool);
    return { success: true, tool };
  }

  _equipTool(tool) {
    if (tool.type === 'axe') this.equippedAxeId = tool.id;
    else this.equippedPickaxeId = tool.id;
  }

  /**
   * One swing at a node. Final blows roll drops and award XP through the
   * configured context (backpack, inventory, progression, economy).
   */
  strike(nodeId, context = {}) {
    const node = this.getNode(nodeId);
    if (!node) return { success: false, reason: 'Unknown resource node' };
    const tool = this.getEquippedToolFor(node.kind);
    const result = node.strike(tool, context.powerMultiplier || 1);
    if (!result.success) {
      this._notify(result.reason);
      return result;
    }
    this.stats.strikes++;

    const verb = node.kind === 'tree' ? 'Chopped' : 'Mined';
    if (!result.depleted) {
      this._notify(`${verb} ${node.name} — ${result.hp}/${node.maxHp} HP`);
      return { ...result, node, drops: [], xp: 0 };
    }

    const resolved = { ...context, ...(typeof this.contextProvider === 'function' ? this.contextProvider() : {}) };
    const backpack = resolved.backpack || null;
    const inventory = resolved.inventory || null;
    const drops = [];
    const missed = [];
    for (const drop of node.template.drops) {
      if (Math.random() > Number(drop.chance ?? 1)) continue;
      const qty = randomInt(drop.min, drop.max);
      if (qty <= 0) continue;
      if (backpack) {
        const added = backpack.addItem(drop.itemId, qty, inventory);
        if (!added.success) {
          missed.push({ ...drop, qty, reason: added.reason });
          continue;
        }
      }
      drops.push({ itemId: drop.itemId, qty });
    }

    let xp = node.template.xp;
    if (resolved.progression && typeof resolved.progression.addXp === 'function') {
      resolved.progression.addXp(xp);
    }
    this.stats.nodesFelled++;
    this.stats.xpEarned += xp;
    this.stats.itemsGathered += drops.reduce((sum, drop) => sum + drop.qty, 0);

    const payload = {
      success: true,
      depleted: true,
      node,
      drops,
      missed,
      xp,
      respawn: node.template.respawn,
    };
    if (drops.length) {
      this._notify(`${verb} ${node.name} — gathered ${drops.map((d) => `${d.qty}× ${d.itemId}`).join(', ')} (+${xp} XP)`);
    } else if (missed.length) {
      this._notify(`Backpack full — ${node.name} drops were left behind.`);
    } else {
      this._notify(`${verb} ${node.name} — nothing salvageable (+${xp} XP)`);
    }
    if (typeof this.onResource === 'function') this.onResource(payload);
    return payload;
  }

  update(dt) {
    for (const node of this.nodes) {
      if (!node.isDepleted) continue;
      node.respawnRemaining = Math.max(0, node.respawnRemaining - Math.max(0, dt));
      if (node.respawnRemaining <= 0) node.respawn();
    }
  }

  getSummary() {
    let ready = 0;
    let depleted = 0;
    for (const node of this.nodes) {
      if (node.isDepleted) depleted++;
      else ready++;
    }
    return {
      totalNodes: this.nodes.length,
      ready,
      depleted,
      trees: this.nodes.filter((node) => node.kind === 'tree').length,
      rocks: this.nodes.filter((node) => node.kind === 'rock').length,
      equippedAxe: this.getEquippedAxe() ? this.getEquippedAxe().name : null,
      equippedPickaxe: this.getEquippedPickaxe() ? this.getEquippedPickaxe().name : null,
      ownedTools: this.ownedToolIds.size,
      ...this.stats,
    };
  }

  serialize() {
    return {
      nodes: this.nodes.map((node) => node.serialize()),
      ownedToolIds: Array.from(this.ownedToolIds),
      equippedAxeId: this.equippedAxeId,
      equippedPickaxeId: this.equippedPickaxeId,
      stats: { ...this.stats },
    };
  }

  deserialize(data) {
    if (!data || typeof data !== 'object') return;
    const validTools = new Set(this.toolCatalog.map((tool) => tool.id));
    const owned = Array.isArray(data.ownedToolIds)
      ? data.ownedToolIds.filter((id) => validTools.has(id))
      : [];
    this.ownedToolIds = new Set(owned.length ? owned : ['axe_rusty', 'pickaxe_rusty']);
    this.ownedToolIds.add('axe_rusty');
    this.ownedToolIds.add('pickaxe_rusty');

    const axe = getGatheringToolDefinition(data.equippedAxeId);
    this.equippedAxeId = axe && axe.type === 'axe' && this.ownedToolIds.has(axe.id)
      ? axe.id
      : 'axe_rusty';
    const pick = getGatheringToolDefinition(data.equippedPickaxeId);
    this.equippedPickaxeId = pick && pick.type === 'pickaxe' && this.ownedToolIds.has(pick.id)
      ? pick.id
      : 'pickaxe_rusty';

    if (Array.isArray(data.nodes)) {
      for (const entry of data.nodes) {
        const node = this.getNode(entry.id);
        if (node) node.deserialize(entry);
      }
    }

    this.stats = {
      strikes: Number(data.stats?.strikes) || 0,
      nodesFelled: Number(data.stats?.nodesFelled) || 0,
      itemsGathered: Number(data.stats?.itemsGathered) || 0,
      xpEarned: Number(data.stats?.xpEarned) || 0,
    };
  }

  reset() {
    for (const node of this.nodes) node.respawn();
    this.ownedToolIds = new Set(['axe_rusty', 'pickaxe_rusty']);
    this.equippedAxeId = 'axe_rusty';
    this.equippedPickaxeId = 'pickaxe_rusty';
    this.stats = { strikes: 0, nodesFelled: 0, itemsGathered: 0, xpEarned: 0 };
  }

  _notify(message) {
    if (typeof this.onNotification === 'function' && message) this.onNotification(message);
  }
}

export default GatheringManager;
