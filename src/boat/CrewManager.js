// CrewManager: recruit crew, assign them to the active ship, and apply
// real bonuses to reload, repair, radar range and cargo capacity.

import { CrewDefinitions, CrewRoles } from '../expansion/content.js';

export class CrewManager {
  constructor() {
    this.ownedIds = new Set();
    this.assigned = {}; // role -> crewId
    this.onNotification = null;
  }

  getCatalog() {
    return CrewDefinitions.map((crew) => ({
      ...crew,
      roleInfo: CrewRoles.find((r) => r.id === crew.role),
      isOwned: this.ownedIds.has(crew.id),
      isAssigned: Object.values(this.assigned).includes(crew.id),
    }));
  }

  getRoles() {
    return CrewRoles.map((r) => ({ ...r })).map((role) => ({
      ...role,
      crew: this.assigned[role.id]
        ? CrewDefinitions.find((c) => c.id === this.assigned[role.id]) || null
        : null,
    }));
  }

  recruit(id, economy) {
    const crew = CrewDefinitions.find((c) => c.id === id);
    if (!crew) return { success: false, reason: 'Unknown crew member' };
    if (this.ownedIds.has(id)) return { success: false, reason: 'Already recruited' };
    if (!economy || !economy.canAfford(crew.cost)) return { success: false, reason: `Need ${crew.cost} coins` };
    if (!economy.spendCoins(crew.cost)) return { success: false, reason: 'Transaction failed' };
    this.ownedIds.add(id);
    this._notify(`${crew.name} joined your crew`);
    return { success: true, crew, newBalance: economy.getCoins() };
  }

  assign(id) {
    const crew = CrewDefinitions.find((c) => c.id === id);
    if (!crew) return { success: false, reason: 'Unknown crew member' };
    if (!this.ownedIds.has(id)) return { success: false, reason: 'Recruit this crew member first' };
    this.assigned[crew.role] = id;
    this._notify(`${crew.name} assigned as ${crew.role}`);
    return { success: true, role: crew.role, crew };
  }

  unassign(role) {
    if (!this.assigned[role]) return { success: false, reason: 'No crew assigned' };
    delete this.assigned[role];
    return { success: true };
  }

  getBonus(key) {
    let total = 0;
    for (const id of Object.values(this.assigned)) {
      const crew = CrewDefinitions.find((c) => c.id === id);
      if (!crew) continue;
      if (key === 'reload' && crew.role === 'gunner') total += crew.skill * 0.04;
      if (key === 'accuracy' && crew.role === 'gunner') total += crew.skill * 0.025;
      if (key === 'repair' && crew.role === 'engineer') total += crew.skill * 4;
      if (key === 'radar' && (crew.role === 'lookout' || crew.role === 'navigator')) total += crew.skill * 12;
      if (key === 'cargo' && crew.role === 'quartermaster') total += crew.skill * 20;
      if (key === 'fishing' && crew.role === 'fisherman') total += crew.skill * 0.05;
      if (key === 'heal' && crew.role === 'medic') total += crew.skill * 5;
    }
    return total;
  }

  serialize() {
    return { ownedIds: Array.from(this.ownedIds), assigned: { ...this.assigned } };
  }

  deserialize(data) {
    if (!data) return;
    this.ownedIds = new Set(Array.isArray(data.ownedIds) ? data.ownedIds : []);
    this.assigned = data.assigned && typeof data.assigned === 'object' ? { ...data.assigned } : {};
  }

  reset() {
    this.ownedIds.clear();
    this.assigned = {};
  }

  _notify(message) {
    if (typeof this.onNotification === 'function') this.onNotification(message);
  }
}

export default CrewManager;
