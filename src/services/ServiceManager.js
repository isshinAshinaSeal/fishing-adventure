// ServiceManager: guild ranks, research samples, auction sales,
// faction reputation and daily harbor activities.

import { GuildRanks, ResearchRewards, BackpackDefinitions } from '../expansion/content.js';
import { getItemDefinition } from '../inventory/BackpackManager.js';

const RARITY_SAMPLES = {
  Common: 1, Uncommon: 2, Rare: 4, Epic: 7, Legendary: 11,
  Mythical: 16, Celestial: 22, Ancient: 26, Abyssal: 30, Secret: 8,
};

export class ServiceManager {
  constructor() {
    this.reputation = {
      fishing_guild: 0,
      pirate_crew: 0,
      ocean_researchers: 0,
      island_merchants: 0,
      ancient_guardians: 0,
      harbor_community: 0,
    };
    this.claimedRanks = new Set();
    this.researchSamples = 0;
    this.researchClaims = new Set();
    this.daily = { day: null, catches: 0, claimed: false };
    this.onNotification = null;
  }

  getReputationLevel(faction) {
    const points = this.reputation[faction] || 0;
    if (points >= 500) return { level: 5, name: 'Legend', points, next: null };
    if (points >= 300) return { level: 4, name: 'Exalted', points, next: 500 };
    if (points >= 150) return { level: 3, name: 'Trusted', points, next: 300 };
    if (points >= 60) return { level: 2, name: 'Friendly', points, next: 150 };
    if (points >= 20) return { level: 1, name: 'Known', points, next: 60 };
    return { level: 0, name: 'Neutral', points, next: 20 };
  }

  addReputation(faction, amount) {
    if (!(faction in this.reputation)) return { success: false, reason: 'Unknown faction' };
    this.reputation[faction] = Math.max(0, this.reputation[faction] + amount);
    return { success: true, faction, points: this.reputation[faction], level: this.getReputationLevel(faction) };
  }

  getReputations() {
    return Object.keys(this.reputation).map((faction) => {
      const level = this.getReputationLevel(faction);
      return {
        faction,
        label: faction.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
        ...level,
        progress: level.next ? Math.round((level.points / level.next) * 100) : 100,
      };
    });
  }

  getGuildState(inventory) {
    const totalCatches = inventory
      ? Object.values(inventory.encyclopedia).reduce((sum, r) => sum + (r.timesCaught || 0), 0)
      : 0;
    const rank = [...GuildRanks].reverse().find((r) => totalCatches >= r.minCatches) || GuildRanks[0];
    const next = GuildRanks[GuildRanks.indexOf(rank) + 1] || null;
    return {
      rank,
      next,
      totalCatches,
      progress: next ? Math.round(((totalCatches - rank.minCatches) / (next.minCatches - rank.minCatches)) * 100) : 100,
      canClaim: !this.claimedRanks.has(rank.id) && rank.reward > 0,
      reward: rank.reward,
    };
  }

  claimGuildRank(inventory, economy) {
    const state = this.getGuildState(inventory);
    if (!state.canClaim) {
      return { success: false, reason: state.reward <= 0 ? 'Reach Angler rank to claim a reward' : 'Rank reward already claimed' };
    }
    economy.addCoins(state.reward);
    this.claimedRanks.add(state.rank.id);
    this.addReputation('fishing_guild', 30);
    this._notify(`Guild rank reward claimed: ${state.reward} coins`);
    return { success: true, rank: state.rank, coins: state.reward };
  }

  sampleFish(inventory, instanceId) {
    const fish = inventory.bucket.find((f) => f.instanceId === instanceId);
    if (!fish) return { success: false, reason: 'Fish not found' };
    const samples = RARITY_SAMPLES[fish.rarity] || 1;
    inventory.removeFish(instanceId);
    this.researchSamples += samples;
    this.addReputation('ocean_researchers', 2);
    this._notify(`Research sample collected (+${samples})`);
    return { success: true, samples, total: this.researchSamples };
  }

  getResearchState(inventory) {
    return {
      samples: this.researchSamples,
      rewards: ResearchRewards.map((r, i) => ({
        ...r,
        isClaimed: this.researchClaims.has(i),
        canClaim: this.researchSamples >= r.samples && !this.researchClaims.has(i),
      })),
      bucket: inventory ? [...inventory.bucket] : [],
      speciesFound: inventory ? inventory.getDiscoveryCount() : 0,
    };
  }

  claimResearch(index, inventory, economy) {
    const reward = ResearchRewards[index];
    if (!reward) return { success: false, reason: 'Unknown research reward' };
    if (this.researchClaims.has(index)) return { success: false, reason: 'Already claimed' };
    if (this.researchSamples < reward.samples) return { success: false, reason: `Need ${reward.samples} samples` };
    this.researchSamples -= reward.samples;
    this.researchClaims.add(index);
    if (economy) economy.addCoins(reward.coins);
    this._notify(`${reward.label} completed (+${reward.coins} coins)`);
    return { success: true, reward, coins: reward.coins };
  }

  getAuctionItems(backpack) {
    return backpack.getItems().filter((stack) =>
      ['treasure', 'material', 'misc'].includes(stack.def.category) &&
      !['quest'].includes(stack.def.category)
    );
  }

  sellAuctionItem(itemId, backpack, economy) {
    const def = getItemDefinition(itemId);
    if (!def || !['treasure', 'material', 'misc'].includes(def.category)) {
      return { success: false, reason: 'This item is not eligible for auction' };
    }
    if (backpack.getCount(itemId) < 1) return { success: false, reason: 'None in backpack' };
    const price = Math.round(def.price * 1.35);
    backpack.removeItem(itemId, 1);
    economy.addCoins(price);
    this.addReputation('island_merchants', 2);
    this._notify(`Auction sold ${def.name} for ${price} coins`);
    return { success: true, coins: price, newBalance: economy.getCoins() };
  }

  updateDaily(day, catches) {
    if (this.daily.day !== day) {
      this.daily = { day, catches: 0, claimed: false };
    }
    this.daily.catches = catches;
  }

  getDailyState() {
    return {
      ...this.daily,
      target: 3,
      canClaim: this.daily.catches >= 3 && !this.daily.claimed,
      reward: 220,
    };
  }

  claimDaily(economy) {
    const state = this.getDailyState();
    if (!state.canClaim) return { success: false, reason: 'Daily challenge not complete' };
    this.daily.claimed = true;
    economy.addCoins(state.reward);
    this.addReputation('harbor_community', 25);
    this._notify(`Daily harbor challenge complete: +${state.reward} coins`);
    return { success: true, coins: state.reward };
  }

  getBackpackUpgradeEstimate(current) {
    return BackpackDefinitions.filter((b) => b.slots > current.slots);
  }

  serialize() {
    return {
      reputation: { ...this.reputation },
      claimedRanks: Array.from(this.claimedRanks),
      researchSamples: this.researchSamples,
      researchClaims: Array.from(this.researchClaims),
      daily: { ...this.daily },
    };
  }

  deserialize(data) {
    if (!data) return;
    if (data.reputation) this.reputation = { ...this.reputation, ...data.reputation };
    this.claimedRanks = new Set(Array.isArray(data.claimedRanks) ? data.claimedRanks : []);
    this.researchSamples = Number(data.researchSamples) || 0;
    this.researchClaims = new Set(Array.isArray(data.researchClaims) ? data.researchClaims : []);
    this.daily = data.daily && typeof data.daily === 'object' ? { ...data.daily } : { day: null, catches: 0, claimed: false };
  }

  reset() {
    this.reputation = {
      fishing_guild: 0, pirate_crew: 0, ocean_researchers: 0,
      island_merchants: 0, ancient_guardians: 0, harbor_community: 0,
    };
    this.claimedRanks.clear();
    this.researchSamples = 0;
    this.researchClaims.clear();
    this.daily = { day: null, catches: 0, claimed: false };
  }

  _notify(message) {
    if (typeof this.onNotification === 'function') this.onNotification(message);
  }
}

export default ServiceManager;
