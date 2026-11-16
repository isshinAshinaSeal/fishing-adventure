// FishingSystem: State machine, cast arc validation, bite detection, tension minigame,
// difficulty levels, bait profiles, fish stamina/behavior, and perfect-catch bonuses.

import * as THREE from 'three';
import { Config } from '../config.js';
import { FishDatabase, BaitTypes, RarityTiers } from './FishDatabase.js';

export const FishingState = {
  IDLE: 'IDLE',
  CASTING: 'CASTING',
  WAITING: 'WAITING',
  BITING: 'BITING',
  REELING: 'REELING',
  CATCH_SUCCESS: 'CATCH_SUCCESS',
  CATCH_FAILED: 'CATCH_FAILED',
};

const BEHAVIOR_PULL = {
  schooling: 0.6,
  drift: 0.8,
  steady: 1.0,
  darter: 1.5,
  erratic: 1.9,
  powerful: 2.2,
};

export class FishingSystem {
  constructor(config = Config.fishing) {
    this.config = config;

    this.state = FishingState.IDLE;
    this.activePlayer = null;
    this.activeSpot = null;
    this.currentFish = null;

    // Timers
    this.stateTimer = 0.0;
    this.waitDuration = 0.0;
    this.biteDuration = config.biteWindowDuration || 2.2;

    // Minigame State
    this.tension = 50.0;            // 0 to 100
    this.targetSweetSpot = [35, 75]; // safe range (difficulty dependent)
    this.catchProgress = 0.0;       // 0 to 100
    this.minigameElapsed = 0.0;
    this.isReelHeld = false;

    // Difficulty, bait, fish stamina, perfect catch
    this.difficulty = config.defaultDifficulty || 'standard';
    this.bait = config.defaultBait || 'worm';
    this.hookedFish = null;
    this.fishStamina = 0;
    this.fishStaminaMax = 0;
    this.behaviorPull = 1.0;
    this.isPerfectCatch = false;
    this.autoStore = true;
    this.worldClock = null;
    this.toolManager = null;

    // Expansion 8.0 casting/roll telemetry.
    this.castDistance = 6.5;
    this.lastRollOptions = null;
    this.hooksetQuality = null;
    this.hooksetBonus = 1;

    // Bobber & Line 3D representation
    this.bobberPosition = new THREE.Vector3();
    this.targetBobberPos = new THREE.Vector3();
    this.bobberMesh = this._createBobberMesh();
    this.lineMesh = this._createLineMesh();
    this.zoneManager = null;
    this.questManager = null;

    // Event hooks
    this.onStateChange = null;
    this.onBite = null;
    this.onCatchSuccess = null;
    this.onCatchFailed = null;
    this.onNotification = null;

    this._applyDifficulty(this.difficulty);
  }

  _createBobberMesh() {
    const group = new THREE.Group();
    group.name = 'FishingBobber';

    const redMat = new THREE.MeshLambertMaterial({ color: 0xee2222 });
    const whiteMat = new THREE.MeshLambertMaterial({ color: 0xffffff });

    const topGeom = new THREE.SphereGeometry(0.12, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2);
    const top = new THREE.Mesh(topGeom, redMat);
    group.add(top);

    const bottomGeom = new THREE.SphereGeometry(0.12, 12, 8, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2);
    const bottom = new THREE.Mesh(bottomGeom, whiteMat);
    group.add(bottom);

    group.visible = false;
    return group;
  }

  _createLineMesh() {
    const points = [new THREE.Vector3(0, 0, 0), new THREE.Vector3(0, 0, 0)];
    const geom = new THREE.BufferGeometry().setFromPoints(points);
    const mat = new THREE.LineBasicMaterial({ color: 0xdddddd, transparent: true, opacity: 0.75 });
    const line = new THREE.Line(geom, mat);
    line.name = 'FishingLine';
    line.visible = false;
    return line;
  }

  setDifficulty(difficultyId) {
    const list = this.config.difficulties || {};
    if (!list[difficultyId]) return false;
    this.difficulty = difficultyId;
    this._applyDifficulty(difficultyId);
    return true;
  }

  _applyDifficulty(difficultyId) {
    const diff = (this.config.difficulties && this.config.difficulties[difficultyId]) || null;
    if (!diff) return;
    this.targetSweetSpot = [...diff.sweetSpot];
  }

  getDifficultyConfig() {
    return (this.config.difficulties && this.config.difficulties[this.difficulty])
      || { id: 'standard', label: 'Standard', sweetSpot: [36, 72], progressRate: 34, staminaDrain: 22, tensionRise: 42, tensionFall: 35, pullStrength: 4.0, valueMul: 1, xpMul: 1, rarityMul: 1 };
  }

  getBaitTypes() {
    return BaitTypes;
  }

  setBait(baitId) {
    if (!BaitTypes.some((b) => b.id === baitId)) return false;
    this.bait = baitId;
    return true;
  }

  /**
   * Cast range comes from the equipped rod's castDistance stat (40-112),
   * mapped onto a 5.5-13.5 m arc. Longer rods reach deeper ledges.
   */
  getCastDistance(player = this.activePlayer) {
    const rod = player ? player.rod : null;
    const stat = rod && Number.isFinite(rod.castDistance) ? rod.castDistance : 45;
    return Number(Math.max(5.5, Math.min(13.5, 5.5 + (stat / 100) * 7)).toFixed(2));
  }

  /** Full rod/tool profile used by the HUD and acceptance tests. */
  getCastingProfile(player = this.activePlayer) {
    const rod = player ? player.rod : null;
    const bonus = (rod && rod.bonus) || {};
    return {
      castDistance: this.getCastDistance(player),
      habitat: bonus.habitat || null,
      rarityBonus: Number(bonus.rarity) || 0,
      largeFish: Number(bonus.largeFish) || 0,
      giant: Number(bonus.giant) || 0,
      quality: (Number(bonus.quality) || 0) + (this.getToolModifiers().quality || 0),
      bait: this.bait,
    };
  }

  _buildRollOptions(habitat) {
    const rod = this.activePlayer ? this.activePlayer.rod : null;
    const bonus = (rod && rod.bonus) || {};
    const rodLuck = rod ? rod.luckBonus || 0 : 0;
    const buffLuck = this.buffManager ? this.buffManager.getFishingModifier('luck') : 0;
    const attract = this.buffManager ? this.buffManager.getFishingModifier('attract') : 0;
    const toolMods = this.getToolModifiers();
    const diff = this.getDifficultyConfig();

    const options = {
      timeOfDay: this.worldClock ? this.worldClock.getPeriod() : 'day',
      bait: this.bait,
      luck: rodLuck + buffLuck + attract * 0.35 + (toolMods.luck || 0) + (toolMods.baitBonus || 0) * 0.5,
      difficultyMul: diff.rarityMul || 1,
      allowExtended: true,
      rarityBonus: (Number(bonus.rarity) || 0) + (toolMods.baitBonus || 0) * 0.25,
      largeFish: Number(bonus.largeFish) || 0,
      giant: Number(bonus.giant) || 0,
      preferHabitat: bonus.habitat || null,
      speciesBonus: {
        ancient: Number(bonus.ancient) || 0,
        celestial: Number(bonus.celestial) || 0,
        legendary: Number(bonus.legendary) || 0,
      },
    };

    const catalog = this._activeCatalog();
    if (catalog) options.catalog = catalog;
    this.lastRollOptions = options;
    return options;
  }

  /**
   * Quick cast: equips the rod if needed, then casts immediately at the spot.
   */
  quickCast(player, fishingSpot = null) {
    if (player && !player.isRodEquipped) player.equipRod();
    return this.startCasting(player, fishingSpot);
  }

  canStartCasting(player, fishingSpot = null) {
    if (this.state !== FishingState.IDLE) {
      return { allowed: false, reason: 'Already fishing' };
    }
    if (!player || !player.isRodEquipped) {
      return { allowed: false, reason: 'Equip a fishing rod first (F)' };
    }
    if (player.isMountedMount) {
      return { allowed: false, reason: 'Dismount before fishing' };
    }
    if (player.inventory && player.inventory.isFull()) {
      return { allowed: false, reason: 'Fish bucket is full! Empty bucket first.' };
    }

    if (fishingSpot) {
      const dist = fishingSpot.getDistanceTo(player.position);
      if (dist > fishingSpot.interactionRange + 0.5) {
        return { allowed: false, reason: 'Too far from fishing spot' };
      }
    } else {
      const distToWater = player.position.y - Config.world.waterLevel;
      if (distToWater > this.config.maxDistanceToWater || distToWater < -2.0) {
        return { allowed: false, reason: 'Too far from open water' };
      }
    }

    return { allowed: true };
  }

  startCasting(player, fishingSpot = null) {
    const check = this.canStartCasting(player, fishingSpot);
    if (!check.allowed) {
      return { success: false, reason: check.reason };
    }

    this.activePlayer = player;
    this.activeSpot = fishingSpot;
    this.state = FishingState.CASTING;
    this.stateTimer = 0.0;
    this.catchProgress = 0.0;
    this.tension = 50.0;
    this.hookedFish = null;
    this.isPerfectCatch = false;
    this.fishStamina = 0;
    this.hooksetQuality = null;
    this.hooksetBonus = 1;
    this.lastRollOptions = null;
    this.castDistance = this.getCastDistance(player);

    if (fishingSpot && fishingSpot.targetWaterPos) {
      this.targetBobberPos.copy(fishingSpot.targetWaterPos);
    } else {
      const angle = player.facingAngle;
      this.targetBobberPos.set(
        player.position.x + Math.sin(angle) * this.castDistance,
        Config.world.waterLevel + 0.05,
        player.position.z + Math.cos(angle) * this.castDistance
      );
    }

    if (player.rod) {
      this.bobberPosition.copy(player.rod.getTipWorldPosition());
    } else {
      this.bobberPosition.set(player.position.x, player.position.y + 1.8, player.position.z);
    }

    if (this.bobberMesh) {
      this.bobberMesh.position.copy(this.bobberPosition);
      this.bobberMesh.visible = true;
    }
    if (this.lineMesh) this.lineMesh.visible = true;

    player.fishingState = 'CASTING';

    const minW = this.config.minWaitTime || 1.2;
    const maxW = this.config.maxWaitTime || 3.6;
    this.waitDuration = minW + Math.random() * (maxW - minW);
    const toolMods = this.getToolModifiers();
    if (toolMods.waitReduction) {
      this.waitDuration *= Math.max(0.45, 1 - toolMods.waitReduction);
    }

    this._notifyStateChange();
    return { success: true };
  }

  /**
   * Strike / hook trigger: rolls the actual fish and begins the reeling minigame.
   */
  strike() {
    if (this.state === FishingState.BITING) {
      // Hookset timing: strike within 0.5s of the bite for a perfect set,
      // within 1.2s for a clean set, anything later is a weak set.
      const reaction = this.stateTimer;
      if (reaction <= 0.5) {
        this.hooksetQuality = 'perfect';
        this.hooksetBonus = 1.18;
        if (typeof this.onNotification === 'function') this.onNotification('Perfect hookset! +18% reeling speed');
      } else if (reaction <= 1.2) {
        this.hooksetQuality = 'clean';
        this.hooksetBonus = 1.06;
      } else {
        this.hooksetQuality = 'late';
        this.hooksetBonus = 0.9;
      }

      this.state = FishingState.REELING;
      this.stateTimer = 0.0;
      this.tension = 50.0;
      this.catchProgress = 15.0 * this.hooksetBonus;

      const habitat = this._resolveHabitat();
      const rollOptions = this._buildRollOptions(habitat);
      this.hookedFish = FishDatabase.roll(habitat, rollOptions);
      const rarityOrder = (RarityTiers[this.hookedFish.rarity] || RarityTiers.Common).order;
      this.fishStaminaMax = Math.round(38 + this.hookedFish.weight * 3.2 + rarityOrder * 7);
      this.fishStamina = this.fishStaminaMax;
      this.behaviorPull = BEHAVIOR_PULL[this._speciesBehavior()] || 1.0;
      this.isPerfectCatch = false;

      if (this.activePlayer) this.activePlayer.fishingState = 'REELING';
      this._notifyStateChange();
      return true;
    }

    if (this.state === FishingState.WAITING) {
      this._failCatch('Struck too early! The fish swam away.');
      return false;
    }

    return false;
  }

  _speciesBehavior() {
    if (!this.hookedFish) return 'steady';
    const sp = FishDatabase.getSpeciesById(this.hookedFish.speciesId);
    return sp ? sp.behavior : 'steady';
  }

  _resolveHabitat() {
    // A designated fishing spot defines its own habitat; otherwise use the zone.
    if (this.activeSpot && this.activeSpot.habitat) return this.activeSpot.habitat;
    if (this.zoneManager && this.bobberPosition) {
      const zone = this.zoneManager.getZoneAt(this.bobberPosition.x, this.bobberPosition.z);
      if (zone && zone.habitat) return zone.habitat;
    }
    return 'coast';
  }

  /**
   * Frontier fishing spots declare their own species catalog. Returning null
   * keeps the classic 140-species pool for every other habitat.
   */
  _activeCatalog() {
    if (this.activeSpot) {
      if (Array.isArray(this.activeSpot.catalog)) return this.activeSpot.catalog;
      if (this.activeSpot.catalog === 'frontier') return FishDatabase.getFrontierSpecies();
    }

    // Open-water and shoreline casts inside a frontier zone also use the
    // frontier pool, so boats and beach anglers see the same species.
    if (this.zoneManager && this.bobberPosition) {
      const zone = this.zoneManager.getZoneAt(this.bobberPosition.x, this.bobberPosition.z);
      if (zone && FishDatabase.isFrontierHabitat(zone.habitat)) {
        return FishDatabase.getFrontierSpecies();
      }
    }
    return null;
  }

  update(dt, input = null) {
    if (this.state === FishingState.IDLE) return;
    this.stateTimer += dt;

    if (input) {
      this.isReelHeld = Boolean(
        input.keys.get('KeyE') ||
        input.keys.get('Space') ||
        input.mouseButtons.get(0)
      );

      if (input.consumeInteract() && this.state === FishingState.BITING) {
        this.strike();
        return;
      }
    }

    switch (this.state) {
      case FishingState.CASTING: {
        const castDuration = 0.65;
        const t = Math.min(1.0, this.stateTimer / castDuration);
        this.bobberPosition.lerpVectors(this.activePlayer.position, this.targetBobberPos, t);
        this.bobberPosition.y += Math.sin(t * Math.PI) * 2.2;

        if (t >= 1.0) {
          this.state = FishingState.WAITING;
          this.stateTimer = 0.0;
          if (this.activePlayer) this.activePlayer.fishingState = 'WAITING';
          this._notifyStateChange();
        }
        break;
      }

      case FishingState.WAITING: {
        this.bobberPosition.copy(this.targetBobberPos);
        this.bobberPosition.y = Config.world.waterLevel + Math.sin(this.stateTimer * 3.0) * 0.06;

        if (this.stateTimer >= this.waitDuration) {
          this.state = FishingState.BITING;
          this.stateTimer = 0.0;
          if (this.activePlayer) this.activePlayer.fishingState = 'BITING';
          if (typeof this.onBite === 'function') this.onBite();
          this._notifyStateChange();
        }
        break;
      }

      case FishingState.BITING: {
        this.bobberPosition.copy(this.targetBobberPos);
        this.bobberPosition.y = Config.world.waterLevel - 0.22 + Math.sin(this.stateTimer * 14.0) * 0.08;

        if (this.stateTimer >= this.biteDuration) {
          this._failCatch('The fish stole your bait and slipped away!');
        }
        break;
      }

      case FishingState.REELING: {
        const diff = this.getDifficultyConfig();
        const rodSpeed = this.activePlayer && this.activePlayer.rod ? this.activePlayer.rod.reelSpeed : 1.0;
        const rod = this.activePlayer ? this.activePlayer.rod : null;
        const toolMods = this.getToolModifiers();
        const lineStrength = (rod && rod.lineStrength ? rod.lineStrength : 45) + toolMods.lineStrength;
        const fishControl = rod && rod.fishControl ? rod.fishControl : 40;
        const reelBuff = this.buffManager ? this.buffManager.getFishingModifier('reel') : 0;
        const lineFactor = Math.max(0.72, 1.18 - lineStrength / 320);

        // Tension responds to reeling and to the fish's struggle.
        if (this.isReelHeld) {
          this.tension += (diff.tensionRise || 42) * rodSpeed * lineFactor * dt;
        } else {
          this.tension -= (diff.tensionFall || 35) * dt;
        }
        const staminaRatio = this.fishStaminaMax > 0 ? this.fishStamina / this.fishStaminaMax : 1;
        const pull = (diff.pullStrength || 4.0) * this.behaviorPull * (0.4 + staminaRatio);
        this.tension += Math.sin(this.stateTimer * 7.5) * pull * dt;
        this.tension = Math.max(0, Math.min(100, this.tension));

        const inSweetSpot = this.tension >= this.targetSweetSpot[0] && this.tension <= this.targetSweetSpot[1];

        if (inSweetSpot) {
          // Exhaust the fish, then land it faster.
          const drain = (diff.staminaDrain || 22)
            * (1 + (rarityMultiplier(this.hookedFish) - 1) * 0.5)
            * (1 + (this.getCastingProfile().largeFish || 0) * 0.5);
          this.fishStamina = Math.max(0, this.fishStamina - drain * dt);
          const exhaustedBonus = this.fishStamina <= 0 ? 1.35 : 1.0;
          const controlBonus = 0.82 + fishControl / 250 + reelBuff;
          this.catchProgress += (diff.progressRate || 34) * exhaustedBonus * controlBonus
            * (this.hooksetBonus || 1) * dt;
        } else {
          this.catchProgress -= 12.0 * dt;
          if (this.fishStamina < this.fishStaminaMax) {
            this.fishStamina = Math.min(this.fishStaminaMax, this.fishStamina + 6 * dt);
          }
        }
        this.catchProgress = Math.max(0, this.catchProgress);

        if (this.tension >= 99.5) {
          this._failCatch('Line snapped! Tension was too high.');
          break;
        }

        this.bobberPosition.copy(this.targetBobberPos);
        this.bobberPosition.x += Math.sin(this.stateTimer * 10.0) * 0.25;
        this.bobberPosition.z += Math.cos(this.stateTimer * 8.0) * 0.25;

        if (this.catchProgress >= 100.0) {
          this.isPerfectCatch = inSweetSpot && this.fishStamina <= 0;
          this._succeedCatch();
        }
        break;
      }
    }

    this._updateVisuals();
  }

  _updateVisuals() {
    if (this.bobberMesh) this.bobberMesh.position.copy(this.bobberPosition);

    if (this.lineMesh && this.activePlayer && this.activePlayer.rod) {
      const tipPos = this.activePlayer.rod.getTipWorldPosition();
      const posAttr = this.lineMesh.geometry.attributes.position;
      posAttr.setXYZ(0, tipPos.x, tipPos.y, tipPos.z);
      posAttr.setXYZ(1, this.bobberPosition.x, this.bobberPosition.y, this.bobberPosition.z);
      posAttr.needsUpdate = true;
    }
  }

  _succeedCatch() {
    const habitat = this._resolveHabitat();
    const diff = this.getDifficultyConfig();
    const rod = this.activePlayer ? this.activePlayer.rod : null;
    const rollOptions = this.lastRollOptions || this._buildRollOptions(habitat);
    const caughtFish = this.hookedFish || FishDatabase.roll(habitat, rollOptions);

    const toolMods = this.getToolModifiers();
    const qualityBonus = (rod && rod.bonus && rod.bonus.quality ? rod.bonus.quality : 0) + toolMods.quality;
    if (qualityBonus > 0) {
      caughtFish.value = Math.round((caughtFish.value || 0) * (1 + qualityBonus));
      caughtFish.quality = caughtFish.quality || 'Fine';
    }

    // Perfect catch: sweet-spot finish with an exhausted fish.
    if (this.isPerfectCatch) {
      caughtFish.value = Math.round((caughtFish.value || 0) * 1.15);
      caughtFish.quality = 'Perfect';
      caughtFish.perfect = true;
      if (typeof this.onNotification === 'function') {
        this.onNotification('Perfect catch! +15% value bonus');
      }
    }

    this.currentFish = caughtFish;
    this.state = FishingState.CATCH_SUCCESS;
    if (this.activePlayer) {
      this.activePlayer.fishingState = 'IDLE';
      if (this.activePlayer.inventory && this.autoStore) {
        this.activePlayer.inventory.addFish(caughtFish);
      }
      if (this.activePlayer.progression) {
        const baseXp = Math.max(15, (caughtFish.value || 10) * 1.5);
        this.activePlayer.progression.addXp(baseXp * (diff.xpMul || 1) * (this.isPerfectCatch ? 1.5 : 1));
      }
      if (typeof this.onRodXp === 'function') this.onRodXp(12 + (caughtFish.value || 10) * 0.08);
      if (this.questManager) this.questManager.notifyFishCaught(caughtFish);

      // Nets and tow lines can land one additional fish. Bonus catches use the
      // same table but never re-enter the full catch-modal callback.
      if (toolMods.multiCatch > 0 && Math.random() < toolMods.multiCatch) {
        const bonusOptions = {
          timeOfDay: this.worldClock ? this.worldClock.getPeriod() : 'day',
          bait: this.bait,
          luck: (rod ? rod.luckBonus : 0) + toolMods.luck + 0.08,
          allowExtended: true,
        };
        if (catalog) bonusOptions.catalog = catalog;
        const bonus = FishDatabase.roll(habitat, bonusOptions);
        const added = this.activePlayer.inventory.addFish(bonus);
        if (added && added.success !== false) {
          if (typeof this.onBonusCatch === 'function') this.onBonusCatch(bonus);
          if (typeof this.onNotification === 'function') {
            this.onNotification(`Tool bonus: ${bonus.icon} ${bonus.name} also landed!`);
          }
        }
      }
    }

    if (typeof this.onCatchSuccess === 'function') this.onCatchSuccess(caughtFish);
    this._notifyStateChange();
    this.hookedFish = null;
    this.fishStamina = 0;
    this.isPerfectCatch = false;
  }

  _failCatch(reason = 'The fish escaped.') {
    this.state = FishingState.CATCH_FAILED;
    if (this.activePlayer) this.activePlayer.fishingState = 'IDLE';
    this.hookedFish = null;
    if (typeof this.onCatchFailed === 'function') this.onCatchFailed(reason);
    this._notifyStateChange();
  }

  cancelFishing() {
    this.state = FishingState.IDLE;
    if (this.activePlayer) this.activePlayer.fishingState = 'IDLE';
    if (this.bobberMesh) this.bobberMesh.visible = false;
    if (this.lineMesh) this.lineMesh.visible = false;
    this.hookedFish = null;
    this.fishStamina = 0;
    this.isPerfectCatch = false;
    this._notifyStateChange();
  }

  getToolModifiers() {
    if (!this.toolManager || typeof this.toolManager.getModifiers !== 'function') {
      return { luck: 0, lineStrength: 0, quality: 0, waitReduction: 0, multiCatch: 0, baitBonus: 0, finder: 0 };
    }
    return this.toolManager.getModifiers();
  }

  _notifyStateChange() {
    if (typeof this.onStateChange === 'function') {
      this.onStateChange(this.state, {
        tension: this.tension,
        progress: this.catchProgress,
        fish: this.currentFish,
        difficulty: this.difficulty,
        bait: this.bait,
        fishStamina: this.fishStamina,
      });
    }
  }

  getState() {
    return {
      state: this.state,
      tension: this.tension,
      catchProgress: this.catchProgress,
      isReeling: this.isReelHeld,
      fish: this.currentFish,
      difficulty: this.difficulty,
      bait: this.bait,
      fishStamina: this.fishStamina,
      fishStaminaMax: this.fishStaminaMax,
      castDistance: this.castDistance,
      hooksetQuality: this.hooksetQuality,
      hooksetBonus: this.hooksetBonus,
    };
  }

  reset() {
    this.cancelFishing();
    this.activePlayer = null;
    this.activeSpot = null;
    this.currentFish = null;
    this.stateTimer = 0.0;
    this.hooksetQuality = null;
    this.hooksetBonus = 1;
    this.lastRollOptions = null;
  }
}

function rarityMultiplier(fish) {
  if (!fish) return 1;
  return (RarityTiers[fish.rarity] || RarityTiers.Common).order;
}

export default FishingSystem;
