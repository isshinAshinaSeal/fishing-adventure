// QuestManager: Coordinates fishing contracts, exploration missions, and milestone rewards.

export const DefaultQuests = [
  {
    id: 'quest_first_cast',
    title: 'First Cast of the Day',
    description: 'Hook and reel in any catch from the harbor waters.',
    type: 'CATCH_ANY',
    target: 1,
    rewardCoins: 35,
    rewardXp: 50,
  },
  {
    id: 'quest_ruby_bounty',
    title: 'Crimson Bounty',
    description: 'Catch 2 Ruby Snappers from coastal reefs or deep waters.',
    type: 'CATCH_SPECIES',
    speciesId: 'red_snapper',
    target: 2,
    rewardCoins: 95,
    rewardXp: 120,
  },
  {
    id: 'quest_heavy_catch',
    title: 'Hefty Haul',
    description: 'Land a powerhouse fish weighing at least 4.0 kilograms.',
    type: 'CATCH_WEIGHT',
    minWeight: 4.0,
    target: 1,
    rewardCoins: 130,
    rewardXp: 160,
  },
  {
    id: 'quest_explore_reef',
    title: 'Sunken Reef Expedition',
    description: 'Set sail east and discover the Sunken Coral Shelf.',
    type: 'EXPLORE_ZONE',
    zoneId: 'coral_reef',
    target: 1,
    rewardCoins: 85,
    rewardXp: 100,
  },
  {
    id: 'quest_golden_legend',
    title: 'The Gilded Legend',
    description: 'Capture the mythical Golden Sun Trout in alpine waters.',
    type: 'CATCH_SPECIES',
    speciesId: 'golden_trout',
    target: 1,
    rewardCoins: 450,
    rewardXp: 550,
  },
];

export class QuestManager {
  constructor(questDefs = DefaultQuests) {
    this.catalog = Array.isArray(questDefs) ? questDefs : DefaultQuests;
    this.quests = new Map();

    this.onQuestComplete = null; // (quest) => void
    this.onQuestProgress = null; // (quest) => void

    this._initializeQuests();
  }

  _initializeQuests() {
    this.quests.clear();
    for (const def of this.catalog) {
      this.quests.set(def.id, {
        ...def,
        current: 0,
        isCompleted: false,
        isClaimed: false,
      });
    }
  }

  getQuest(id) {
    return this.quests.get(id) || null;
  }

  getAllQuests() {
    return Array.from(this.quests.values());
  }

  getActiveQuests() {
    return Array.from(this.quests.values()).filter((q) => !q.isClaimed);
  }

  getCompletedQuests() {
    return Array.from(this.quests.values()).filter((q) => q.isCompleted);
  }

  /**
   * Called when any fish is successfully caught.
   * Enforces acceptance test: Quests track progress when criteria met.
   */
  notifyFishCaught(fish) {
    if (!fish) return;

    for (const quest of this.quests.values()) {
      if (quest.isCompleted) continue;

      let advanced = false;

      // 1. Any fish catch
      if (quest.type === 'CATCH_ANY') {
        quest.current += 1;
        advanced = true;
      }
      // 2. Specific species match
      else if (quest.type === 'CATCH_SPECIES' && quest.speciesId === fish.speciesId) {
        quest.current += 1;
        advanced = true;
      }
      // 3. Weight threshold challenge
      else if (quest.type === 'CATCH_WEIGHT' && Number(fish.weight) >= quest.minWeight) {
        quest.current += 1;
        advanced = true;
      }

      if (advanced) {
        this._checkCompletion(quest);
      }
    }
  }

  /**
   * Called when a player visits a new open-world zone.
   */
  notifyZoneDiscovered(zoneId) {
    if (!zoneId) return;

    for (const quest of this.quests.values()) {
      if (quest.isCompleted) continue;

      if (quest.type === 'EXPLORE_ZONE' && quest.zoneId === zoneId) {
        quest.current = 1;
        this._checkCompletion(quest);
      }
    }
  }

  _checkCompletion(quest) {
    if (quest.current >= quest.target && !quest.isCompleted) {
      quest.current = quest.target;
      quest.isCompleted = true;

      if (typeof this.onQuestComplete === 'function') {
        this.onQuestComplete(quest);
      }
    } else if (typeof this.onQuestProgress === 'function') {
      this.onQuestProgress(quest);
    }
  }

  /**
   * Claims rewards for a completed quest.
   * Enforces acceptance tests:
   * 1. Turning in completed quest grants rewards (coins + XP).
   * 2. Already completed quests cannot be claimed twice.
   * 3. Incomplete quests cannot be claimed.
   */
  claimReward(questId, economy, progression) {
    const quest = this.getQuest(questId);
    if (!quest) {
      return { success: false, reason: 'Quest not found' };
    }
    if (!quest.isCompleted) {
      return { success: false, reason: 'Quest objectives not yet completed' };
    }
    if (quest.isClaimed) {
      return { success: false, reason: 'Quest reward has already been claimed' };
    }

    quest.isClaimed = true;

    // Award Coins
    if (economy && quest.rewardCoins > 0) {
      economy.addCoins(quest.rewardCoins);
    }

    // Award XP
    if (progression && quest.rewardXp > 0) {
      progression.addXp(quest.rewardXp);
    }

    return {
      success: true,
      quest,
      coinsAwarded: quest.rewardCoins,
      xpAwarded: quest.rewardXp,
    };
  }

  serialize() {
    return Array.from(this.quests.values()).map((q) => ({
      id: q.id,
      current: q.current,
      isCompleted: q.isCompleted,
      isClaimed: q.isClaimed,
    }));
  }

  deserialize(data) {
    if (!Array.isArray(data)) return;
    for (const saved of data) {
      const q = this.quests.get(saved.id);
      if (q) {
        q.current = Number(saved.current) || 0;
        q.isCompleted = Boolean(saved.isCompleted);
        q.isClaimed = Boolean(saved.isClaimed);
      }
    }
  }

  reset() {
    this._initializeQuests();
  }
}

export default QuestManager;
