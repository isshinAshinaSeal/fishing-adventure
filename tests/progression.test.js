// tests/progression.test.js — Phase 12: Quests & Angler Progression Verification

import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { ProgressionManager } from '../src/progression/ProgressionManager.js';
import { QuestManager } from '../src/progression/QuestManager.js';
import { EconomyManager } from '../src/economy/EconomyManager.js';
import { FishingSystem, FishingState } from '../src/fishing/FishingSystem.js';
import { PlayerController } from '../src/entities/PlayerController.js';
import { FishDatabase } from '../src/fishing/FishDatabase.js';

describe('Quests & Player Progression (Phase 12)', () => {
  test('TC-69: Catching fish awards XP and updates progression', () => {
    const player = new PlayerController();
    const fishing = new FishingSystem();
    fishing.activePlayer = player;

    assert.equal(player.progression.getLevel(), 1);
    assert.equal(player.progression.getXp(), 0);

    // Simulate catching fish
    const fish = FishDatabase.createCatchRecord('red_snapper', 0.8);
    fishing.currentFish = fish;
    fishing.state = FishingState.REELING;
    fishing.catchProgress = 100.0;
    fishing._succeedCatch();

    assert.ok(player.progression.getXp() > 0, 'Player must gain XP after successfully catching fish');
  });

  test('TC-70: Accumulating sufficient XP triggers level up and expands required XP threshold', () => {
    const progression = new ProgressionManager();
    assert.equal(progression.getLevel(), 1);

    const initialRequired = progression.getXpForNextLevel(1);
    assert.ok(initialRequired > 0);

    let levelUpFired = false;
    let newLvlObserved = 1;
    progression.onLevelUp = (lvl) => {
      levelUpFired = true;
      newLvlObserved = lvl;
    };

    // Award XP just below threshold
    progression.addXp(initialRequired - 10);
    assert.equal(progression.getLevel(), 1);
    assert.equal(levelUpFired, false);

    // Award remaining XP to cross threshold
    progression.addXp(20);
    assert.equal(levelUpFired, true);
    assert.equal(progression.getLevel(), 2);
    assert.equal(newLvlObserved, 2);

    // Next level requires strictly more XP
    const nextRequired = progression.getXpForNextLevel(2);
    assert.ok(
      nextRequired > initialRequired,
      `Level 2 required XP (${nextRequired}) must be greater than Level 1 (${initialRequired})`
    );
  });

  test('TC-71: Quests track progress when corresponding actions occur', () => {
    const quests = new QuestManager();

    // 1. Catch Any Fish Quest
    const firstCast = quests.getQuest('quest_first_cast');
    assert.equal(firstCast.current, 0);
    assert.equal(firstCast.isCompleted, false);

    const sardine = FishDatabase.createCatchRecord('sardine', 0.5);
    quests.notifyFishCaught(sardine);
    assert.equal(firstCast.current, 1);
    assert.equal(firstCast.isCompleted, true);

    // 2. Catch Specific Species (Ruby Snapper x2)
    const rubyQuest = quests.getQuest('quest_ruby_bounty');
    assert.equal(rubyQuest.current, 0);

    const snapper1 = FishDatabase.createCatchRecord('red_snapper', 0.5);
    quests.notifyFishCaught(snapper1);
    assert.equal(rubyQuest.current, 1);
    assert.equal(rubyQuest.isCompleted, false);

    const snapper2 = FishDatabase.createCatchRecord('red_snapper', 0.3);
    quests.notifyFishCaught(snapper2);
    assert.equal(rubyQuest.current, 2);
    assert.equal(rubyQuest.isCompleted, true);

    // 3. Heavy Weight Challenge (>= 4.0 kg)
    const heavyQuest = quests.getQuest('quest_heavy_catch');
    assert.equal(heavyQuest.isCompleted, false);

    // Light fish (weight 1.5kg) does not trigger
    const lightFish = { ...sardine, weight: 1.5 };
    quests.notifyFishCaught(lightFish);
    assert.equal(heavyQuest.current, 0);

    // Heavy fish (weight 6.2kg) triggers
    const heavyFish = { ...snapper2, weight: 6.2 };
    quests.notifyFishCaught(heavyFish);
    assert.equal(heavyQuest.current, 1);
    assert.equal(heavyQuest.isCompleted, true);

    // 4. Exploration Quest (Discover coral_reef)
    const exploreQuest = quests.getQuest('quest_explore_reef');
    assert.equal(exploreQuest.isCompleted, false);

    quests.notifyZoneDiscovered('coral_reef');
    assert.equal(exploreQuest.current, 1);
    assert.equal(exploreQuest.isCompleted, true);
  });

  test('TC-72: Claiming a completed quest awards coins and XP, and marks it completed', () => {
    const quests = new QuestManager();
    const economy = new EconomyManager({ startingCoins: 100 });
    const progression = new ProgressionManager();

    // Complete First Cast Quest
    const fish = FishDatabase.createCatchRecord('sardine', 0.5);
    quests.notifyFishCaught(fish);

    const quest = quests.getQuest('quest_first_cast');
    assert.equal(quest.isCompleted, true);
    assert.equal(quest.isClaimed, false);

    // Claim
    const claimRes = quests.claimReward('quest_first_cast', economy, progression);
    assert.equal(claimRes.success, true);
    assert.equal(quest.isClaimed, true);

    // Verify economy credited
    assert.equal(economy.getCoins(), 100 + quest.rewardCoins);

    // Verify progression credited
    assert.equal(progression.getXp(), quest.rewardXp);
  });

  test('TC-73: Cannot claim uncompleted quest or claim the same quest twice', () => {
    const quests = new QuestManager();
    const economy = new EconomyManager({ startingCoins: 50 });
    const progression = new ProgressionManager();

    // 1. Attempt to claim incomplete quest
    const prematureClaim = quests.claimReward('quest_golden_legend', economy, progression);
    assert.equal(prematureClaim.success, false);
    assert.match(prematureClaim.reason, /not yet completed/i);
    assert.equal(economy.getCoins(), 50);

    // 2. Complete and claim first cast quest
    quests.notifyFishCaught(FishDatabase.createCatchRecord('sardine', 0.5));
    const firstClaim = quests.claimReward('quest_first_cast', economy, progression);
    assert.equal(firstClaim.success, true);

    // 3. Attempt to claim same quest second time
    const doubleClaim = quests.claimReward('quest_first_cast', economy, progression);
    assert.equal(doubleClaim.success, false);
    assert.match(doubleClaim.reason, /already been claimed/i);
  });
});
