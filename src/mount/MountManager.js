// MountManager: Ownership, unlocking, summoning, leveling, and persistence for land mounts.

import { MountDefinitions, getMountDefinition } from './MountData.js';
import { Mount } from './Mount.js';

export class MountManager {
  constructor(definitions = MountDefinitions) {
    this.definitions = definitions;
    this.ownedMountIds = new Set(['mount_horse']);
    this.mountProgress = {}; // id -> { level, xp }
    this.staminaByMount = {}; // id -> current stamina
    this.activeMount = null;
    this.lastActiveMountId = null;

    // Event hooks
    this.onSummon = null; // (mount, mesh) => void
    this.onDismount = null; // (mount) => void
    this.onLevelUp = null; // (mount, level) => void
    this.onUnlock = null; // (definition) => void
  }

  getDefinition(id) {
    return getMountDefinition(id);
  }

  getCatalog(playerLevel = 1) {
    return this.definitions.map((def) => {
      const progress = this.mountProgress[def.id] || { level: 1, xp: 0 };
      return {
        ...def,
        isOwned: this.ownedMountIds.has(def.id),
        isActive: this.activeMount && this.activeMount.id === def.id,
        level: progress.level,
        xp: Math.round(progress.xp),
        meetsLevel: playerLevel >= def.requiredLevel,
      };
    });
  }

  isOwned(id) {
    return this.ownedMountIds.has(id);
  }

  /**
   * Unlocks a mount with coins and an angler-level requirement.
   */
  purchaseMount(id, economy, playerLevel = 1) {
    const def = this.getDefinition(id);
    if (!def) return { success: false, reason: 'Unknown mount' };
    if (this.ownedMountIds.has(id)) return { success: false, reason: 'Mount already unlocked' };
    if (!economy) return { success: false, reason: 'Invalid economy system' };
    if (playerLevel < def.requiredLevel) {
      return { success: false, reason: `Requires Angler level ${def.requiredLevel}` };
    }
    if (!economy.canAfford(def.cost)) {
      return { success: false, reason: `Not enough coins (need ${def.cost})` };
    }
    if (def.cost > 0 && !economy.spendCoins(def.cost)) {
      return { success: false, reason: 'Transaction failed' };
    }

    this.ownedMountIds.add(id);
    this.mountProgress[id] = this.mountProgress[id] || { level: 1, xp: 0 };
    if (typeof this.onUnlock === 'function') this.onUnlock(def);
    return { success: true, mount: def, remainingCoins: economy.getCoins() };
  }

  /**
   * Summons an owned mount beneath the player and mounts it immediately.
   */
  summon(id, player, terrain, waterLevel = 0) {
    const def = this.getDefinition(id);
    if (!def) return { success: false, reason: 'Unknown mount' };
    if (!this.ownedMountIds.has(id)) return { success: false, reason: 'Mount not unlocked yet' };
    if (this.activeMount && this.activeMount.isMounted) {
      if (this.activeMount.id === id) {
        return { success: false, reason: 'Already riding this mount' };
      }
      return { success: false, reason: 'Dismount your current mount first' };
    }
    if (!player) return { success: false, reason: 'Invalid player' };

    const baseX = player.position.x + Math.sin(player.facingAngle + Math.PI) * 1.2;
    const baseZ = player.position.z + Math.cos(player.facingAngle + Math.PI) * 1.2;
    const ground = terrain ? terrain.sampleHeight(baseX, baseZ) : player.position.y;
    if (ground < waterLevel - 0.1) {
      return { success: false, reason: 'Cannot summon a land mount over deep water' };
    }

    const progress = this.mountProgress[id] || { level: 1, xp: 0 };
    const mount = new Mount({
      definition: def,
      position: { x: baseX, y: ground, z: baseZ },
      level: progress.level,
      xp: progress.xp,
      facingAngle: player.facingAngle,
      waterLevel,
      stamina: this.staminaByMount[id],
    });
    mount.onLevelUp = (m, level) => {
      this.mountProgress[id] = { level, xp: m.xp };
      if (typeof this.onLevelUp === 'function') this.onLevelUp(m, level);
    };
    mount.mount(player);

    this.activeMount = mount;
    this.lastActiveMountId = id;
    if (typeof this.onSummon === 'function') this.onSummon(mount, mount.mesh);
    return { success: true, mount };
  }

  dismount(player, terrain = null) {
    if (!this.activeMount) return { success: false, reason: 'No active mount' };
    const mount = this.activeMount;
    this._persistMount(mount);
    const result = mount.dismount(player, terrain);
    this.activeMount = null;
    if (typeof this.onDismount === 'function') this.onDismount(mount);
    return result;
  }

  isMounted() {
    return Boolean(this.activeMount && this.activeMount.isMounted);
  }

  update(dt, input, cameraRig, terrain) {
    if (!this.activeMount) return;
    this.activeMount.update(dt, input, cameraRig, terrain);
    if (this.activeMount && !this.activeMount.isMounted) {
      this._persistMount(this.activeMount);
      const finished = this.activeMount;
      this.activeMount = null;
      if (typeof this.onDismount === 'function') this.onDismount(finished);
    }
  }

  _persistMount(mount) {
    this.mountProgress[mount.id] = { level: mount.level, xp: mount.xp };
    this.staminaByMount[mount.id] = mount.stamina;
  }

  serialize() {
    if (this.activeMount) this._persistMount(this.activeMount);
    return {
      ownedMountIds: Array.from(this.ownedMountIds),
      mountProgress: { ...this.mountProgress },
      staminaByMount: { ...this.staminaByMount },
      activeMountId: this.activeMount ? this.activeMount.id : this.lastActiveMountId,
      wasMounted: this.isMounted(),
    };
  }

  deserialize(data, player = null, terrain = null) {
    if (!data) return;
    this.ownedMountIds.clear();
    if (Array.isArray(data.ownedMountIds) && data.ownedMountIds.length > 0) {
      for (const id of data.ownedMountIds) this.ownedMountIds.add(id);
    } else {
      this.ownedMountIds.add('mount_horse');
    }
    // Never drop the starter horse from a save.
    this.ownedMountIds.add('mount_horse');

    this.mountProgress = {};
    if (data.mountProgress && typeof data.mountProgress === 'object') {
      for (const [id, progress] of Object.entries(data.mountProgress)) {
        this.mountProgress[id] = {
          level: Number(progress.level) || 1,
          xp: Number(progress.xp) || 0,
        };
      }
    }
    this.staminaByMount = {};
    if (data.staminaByMount && typeof data.staminaByMount === 'object') {
      this.staminaByMount = { ...data.staminaByMount };
    }

    this.activeMount = null;
    if (data.wasMounted && player && data.activeMountId && player.position) {
      this.summon(data.activeMountId, player, terrain, terrain ? terrain.waterLevel : 0);
    }
  }

  reset() {
    if (this.activeMount) {
      this.activeMount.isMounted = false;
      this.activeMount.rider = null;
      this.activeMount = null;
    }
    this.ownedMountIds.clear();
    this.ownedMountIds.add('mount_horse');
    this.mountProgress = {};
    this.staminaByMount = {};
    this.lastActiveMountId = null;
  }
}

export default MountManager;
