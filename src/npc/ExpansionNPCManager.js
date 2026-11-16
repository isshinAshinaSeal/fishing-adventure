// ExpansionNPCManager: named harbor NPCs with schedules, friendship,
// daily conversations, gift-giving and service access.

import { NPC } from '../entities/NPC.js';
import { ExpansionNpcDefinitions, ExpansionNpcQuests } from '../expansion/content.js';

const FRIENDSHIP_LEVELS = [
  { at: 0, name: 'Stranger' },
  { at: 2, name: 'Acquaintance' },
  { at: 5, name: 'Friend' },
  { at: 10, name: 'Close Friend' },
  { at: 20, name: 'Confidant' },
];

export class ExpansionNPCManager {
  constructor() {
    this.npcs = new Map();
    this.state = {};
    this.onNotification = null;
    this.onService = null;
  }

  spawn(def, building, service, scene = null) {
    if (!def || !building) return null;
    const angle = Math.random() * Math.PI * 2;
    const pos = {
      x: building.position.x + Math.cos(angle) * 2.1,
      y: building.position.y,
      z: building.position.z + 2.6 + Math.sin(angle) * 0.5,
    };
    const npc = new NPC({
      id: def.id,
      name: def.name,
      title: def.title,
      position: pos,
      facingAngle: Math.PI,
      coatColor: def.color,
      isPirate: Boolean(def.isPirate),
      interactionRange: 3.4,
      promptAction: 'Talk to',
      dialogue: def.lines || [],
    });
    npc.homePosition = { ...pos };
    npc.isPirate = Boolean(def.isPirate);
    npc.service = service;
    npc.buildingId = building.id;
    // Expansion 8.0: talking is dialogue-first. The service panel opens only
    // after the player reaches the end of the conversation and picks it.
    npc.onInteractHandler = (player, context) => {
      const dialogue = this.getDialogue(def.id);
      if (context && typeof context.openDialogue === 'function') {
        context.openDialogue(npc, dialogue);
      } else {
        this.talk(def.id);
      }
      return true;
    };
    this.npcs.set(def.id, npc);
    this.state[def.id] = {
      friendship: 0,
      lastTalkDay: -1,
      giftCount: 0,
      serviceId: service,
      lines: def.lines || [],
      quest: { progress: 0, claimed: false },
    };
    if (scene && npc.mesh) scene.add(npc.mesh);
    return npc;
  }

  getNPC(id) {
    return this.npcs.get(id) || null;
  }

  getAllNPCs() {
    return Array.from(this.npcs.values());
  }

  getFriendship(id) {
    const entry = this.state[id];
    if (!entry) return null;
    const level = [...FRIENDSHIP_LEVELS].reverse().find((l) => entry.friendship >= l.at) || FRIENDSHIP_LEVELS[0];
    return { points: entry.friendship, level: level.name };
  }

  talk(id, day = 0) {
    const entry = this.state[id];
    if (!entry) return { success: false, reason: 'NPC not found' };
    const newFriendship = this.recordTalk(id, day);
    if (typeof this.onService === 'function') this.onService(entry.serviceId, id);
    return {
      success: true,
      npc: this.npcs.get(id),
      friendship: this.getFriendship(id),
      newFriendship,
    };
  }

  /**
   * Records the daily friendship gain without opening a service. Used by the
   * dialogue-first interaction flow.
   */
  recordTalk(id, day = 0) {
    const entry = this.state[id];
    if (!entry) return false;
    if (entry.lastTalkDay === day) return false;
    entry.lastTalkDay = day;
    entry.friendship += 1;
    return true;
  }

  static getServiceLabel(serviceId) {
    const labels = {
      guild: 'Fishing Guild',
      crafting: 'Crafting Bench',
      market: 'Fish Market',
      shipyard: 'Shipyard',
      mounts: 'Mount Stable',
      travel: 'Fast Travel',
      auction: 'Auction House',
      aquarium: 'Aquarium',
      wardrobe: 'Wardrobe',
      housing: 'Housing Office',
      backpack: 'Backpack Shop',
      rods: 'Rod Workshop',
      tools: 'Tackle Bench',
      consumables: 'Consumables',
      farming: 'Farm',
      gathering: 'Gathering',
      city_boats: 'City Marina',
      frontier: 'Frontier Charts',
      gacha: 'Fortune Gacha',
      crew: 'Crew Board',
      radar: 'Ocean Radar',
    };
    return labels[serviceId] || 'Services';
  }

  /**
   * Builds a complete dialogue payload with real choice buttons. The Game
   * resolves the choice kind (service / quest / gift) when the UI selects it.
   */
  getDialogue(id, day = 0) {
    const npc = this.npcs.get(id);
    const entry = this.state[id];
    if (!npc || !entry) return null;
    const serviceLabel = ExpansionNPCManager.getServiceLabel(entry.serviceId);
    const choices = [
      {
        id: 'service',
        kind: 'service',
        serviceId: entry.serviceId,
        npcId: id,
        label: `Open ${serviceLabel}`,
      },
    ];
    const quest = this.getQuest(id);
    if (quest) {
      choices.push({
        id: 'quest',
        kind: 'quest',
        npcId: id,
        label: quest.canClaim
          ? `Claim reward: ${quest.name}`
          : `Ask about work (${quest.progress}/${quest.target})`,
      });
    }
    choices.push({
      id: 'gift',
      kind: 'gift',
      npcId: id,
      label: 'Give a gift',
    });
    choices.push({ id: 'leave', kind: 'leave', npcId: id, label: 'Just chatting — leave' });

    return {
      npcId: id,
      speaker: npc.name,
      title: npc.title,
      lines: entry.lines && entry.lines.length > 0 ? entry.lines : npc.dialogue,
      choices,
    };
  }

  giveGift(id, itemId, backpack) {
    const entry = this.state[id];
    if (!entry) return { success: false, reason: 'NPC not found' };
    if (!backpack || backpack.getCount(itemId) < 1) return { success: false, reason: 'Gift item not in backpack' };
    backpack.removeItem(itemId, 1);
    entry.giftCount++;
    // Rare materials are more meaningful gifts.
    const value = itemId.includes('pearl') || itemId.includes('ancient') ? 4 : itemId.includes('crystal') ? 3 : 1;
    entry.friendship += value;
    this._notify(`Gift received. Friendship +${value}`);
    return { success: true, friendship: this.getFriendship(id), gained: value };
  }

  getQuest(npcId) {
    const definition = ExpansionNpcQuests.find((quest) => quest.npcId === npcId);
    const state = this.state[npcId];
    if (!definition || !state) return null;
    const progress = state.quest?.progress || 0;
    return {
      ...definition,
      progress: Math.min(progress, definition.target),
      percent: Math.min(100, Math.round((progress / definition.target) * 100)),
      completed: progress >= definition.target,
      claimed: Boolean(state.quest?.claimed),
      canClaim: progress >= definition.target && !state.quest?.claimed,
    };
  }

  recordCatch(fish) {
    this._progress('catches', 1);
    if (!fish) return;
    const rareTiers = ['Rare', 'Epic', 'Legendary', 'Mythical', 'Celestial', 'Ancient', 'Abyssal', 'Secret'];
    const legendaryTiers = ['Legendary', 'Mythical', 'Celestial', 'Ancient', 'Abyssal'];
    if (rareTiers.includes(fish.rarity)) this._progress('rareCatches', 1);
    if (legendaryTiers.includes(fish.rarity)) this._progress('legendaryCatches', 1);
  }

  recordBossDefeat() {
    this._progress('bossDefeats', 1);
  }

  recordFurniture() {
    this._progress('furniture', 1);
  }

  _progress(metric, amount = 1) {
    for (const quest of ExpansionNpcQuests) {
      if (quest.metric !== metric) continue;
      const state = this.state[quest.npcId];
      if (!state?.quest || state.quest.claimed) continue;
      state.quest.progress = Math.min(quest.target, state.quest.progress + amount);
    }
  }

  claimQuest(npcId, economy, progression) {
    const quest = this.getQuest(npcId);
    if (!quest) return { success: false, reason: 'NPC quest not found' };
    if (quest.claimed) return { success: false, reason: 'Quest reward already claimed' };
    if (!quest.completed) return { success: false, reason: `Quest incomplete: ${quest.description}` };
    if (!economy) return { success: false, reason: 'Economy unavailable' };
    economy.addCoins(quest.reward);
    if (progression && quest.xp > 0) progression.addXp(quest.xp);
    this.state[npcId].quest.claimed = true;
    this.state[npcId].friendship += quest.friendship;
    this._notify(`${quest.name} completed! +${quest.reward} coins, +${quest.xp} XP`);
    return { success: true, quest, coins: quest.reward, xp: quest.xp, friendship: this.getFriendship(npcId) };
  }

  update(dt, worldClock = null) {
    if (!worldClock) return;
    const period = worldClock.getPeriod();
    for (const npc of this.npcs.values()) {
      if (npc._lastPeriod === period) continue;
      npc._lastPeriod = period;
      if (period === 'night') {
        npc.isNight = true;
        npc.enabled = false;
        if (npc.mesh) npc.mesh.visible = false;
      } else {
        npc.isNight = false;
        npc.enabled = true;
        if (npc.mesh) {
          npc.mesh.visible = true;
          npc.mesh.position.copy(npc.position);
        }
      }
    }
  }

  getStateList() {
    return Array.from(this.npcs.values()).map((npc) => ({
      id: npc.id,
      name: npc.name,
      title: npc.title,
      service: npc.service,
      friendship: this.getFriendship(npc.id),
      ...this.state[npc.id],
    }));
  }

  serialize() {
    return JSON.parse(JSON.stringify(this.state));
  }

  deserialize(data) {
    if (!data || typeof data !== 'object') return;
    for (const [id, state] of Object.entries(data)) {
      if (!this.state[id]) continue;
      this.state[id] = {
        ...this.state[id],
        ...state,
        quest: { progress: 0, claimed: false, ...(state.quest || {}) },
      };
    }
  }

  reset() {
    for (const state of Object.values(this.state)) {
      state.friendship = 0;
      state.lastTalkDay = -1;
      state.giftCount = 0;
      state.quest = { progress: 0, claimed: false };
    }
  }

  _notify(message) {
    if (typeof this.onNotification === 'function') this.onNotification(message);
  }
}

export default ExpansionNPCManager;
