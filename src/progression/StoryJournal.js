// StoryJournal: the living "book of story" for the archipelago.
//
// Ten chapters unlock from real campaign metrics (catches, discoveries, fleet
// size, frontier travel, boss defeats). Unlocking a chapter pays its reward once
// and records the moment in the journal. Progress is fully serializable so the
// book survives save/load and never pays a reward twice.

export const StoryChapters = [
  {
    id: 'chapter_first_cast',
    title: 'The First Cast',
    subtitle: 'Driftwood Harbor',
    entry: 'The tide pulled the line tight and the whole island seemed to lean in. Every legend starts with one fish.',
    metric: 'catches',
    target: 1,
    rewardCoins: 250,
    rewardGems: 1,
    rewardXp: 60,
  },
  {
    id: 'chapter_harbor_regular',
    title: 'A Familiar Face at the Pier',
    subtitle: 'Driftwood Harbor',
    entry: 'Captain Finn stopped calling you "newcomer". The harbor keeps its regulars, and now it keeps you.',
    metric: 'catches',
    target: 10,
    rewardCoins: 500,
    rewardGems: 1,
    rewardXp: 120,
  },
  {
    id: 'chapter_reef_cartographer',
    title: 'Charting the Reef',
    subtitle: 'Coral Reach',
    entry: 'Five zones, five shorelines, five different songs in the water. The map is no longer blank.',
    metric: 'zones',
    target: 5,
    rewardCoins: 750,
    rewardGems: 2,
    rewardXp: 180,
  },
  {
    id: 'chapter_first_hull',
    title: 'A Hull of Your Own',
    subtitle: 'The Shipyard',
    entry: 'The dockmaster handed over the keys with a grin. Beyond the breakwater, the real ocean begins.',
    metric: 'boats',
    target: 1,
    rewardCoins: 1000,
    rewardGems: 2,
    rewardXp: 160,
  },
  {
    id: 'chapter_rod_collector',
    title: 'The Rod Rack',
    subtitle: 'Tackle Workshop',
    entry: 'Five rods on the wall, each one for a different tide. Anglers come to admire the rack now.',
    metric: 'rods',
    target: 5,
    rewardCoins: 1200,
    rewardGems: 2,
    rewardXp: 200,
  },
  {
    id: 'chapter_frontier_voyager',
    title: 'Beyond the Shipping Lanes',
    subtitle: 'Frontier Archipelago',
    entry: 'The storm-glass spire rose out of the squall exactly as the old charts promised. The frontier is real.',
    metric: 'islands',
    target: 1,
    rewardCoins: 1800,
    rewardGems: 3,
    rewardXp: 260,
  },
  {
    id: 'chapter_leviathan_slayer',
    title: 'The Leviathan Answers',
    subtitle: 'Open Ocean',
    entry: 'The cannon smoke cleared and the water went still. The leviathan had answered, and the answer was yours.',
    metric: 'bosses',
    target: 1,
    rewardCoins: 2500,
    rewardGems: 5,
    rewardXp: 320,
  },
  {
    id: 'chapter_species_scholar',
    title: 'Fifty Fins',
    subtitle: 'Aurelia Aquarium',
    entry: 'Fifty species in the index, each with a name and a story. The aquarium wants a wing built in your honour.',
    metric: 'species',
    target: 50,
    rewardCoins: 4200,
    rewardGems: 6,
    rewardXp: 420,
  },
  {
    id: 'chapter_archipelago_master',
    title: 'All Four Horizons',
    subtitle: 'Frontier Archipelago',
    entry: 'Tempest, aurora, glasswind and serpent reef. Four horizons, four outposts, one unbroken wake behind you.',
    metric: 'islands',
    target: 4,
    rewardCoins: 9000,
    rewardGems: 12,
    rewardXp: 700,
  },
  {
    id: 'chapter_ocean_legend',
    title: 'The Ocean Legend',
    subtitle: 'Everywhere At Once',
    entry: 'They tell the story in every harbor now: the angler who fished every tide and came back with the sea itself.',
    metric: 'catches',
    target: 100,
    rewardCoins: 15000,
    rewardGems: 20,
    rewardXp: 1500,
  },
];

const METRIC_DEFAULTS = {
  catches: 0,
  species: 0,
  zones: 0,
  islands: 0,
  boats: 0,
  rods: 0,
  tools: 0,
  bosses: 0,
  quests: 0,
  furniture: 0,
};

export class StoryJournal {
  constructor() {
    this.chapters = StoryChapters;
    this.progress = {};
    this.metrics = { ...METRIC_DEFAULTS };
    this.onNotification = null;
    this.onUpdate = null;
    this._initProgress();
  }

  _initProgress() {
    for (const chapter of this.chapters) {
      if (!this.progress[chapter.id]) {
        this.progress[chapter.id] = {
          unlocked: false,
          read: false,
          rewarded: false,
          unlockedAt: null,
        };
      }
    }
  }

  getChapter(chapterId) {
    const chapter = this.chapters.find((entry) => entry.id === chapterId);
    if (!chapter) return null;
    return this._decorate(chapter);
  }

  getChapters() {
    return this.chapters.map((chapter) => this._decorate(chapter));
  }

  _decorate(chapter) {
    const state = this.progress[chapter.id] || {};
    const current = Math.min(chapter.target, Number(this.metrics[chapter.metric]) || 0);
    return {
      ...chapter,
      current,
      percent: chapter.target > 0 ? Math.min(100, Math.round((current / chapter.target) * 100)) : 100,
      unlocked: Boolean(state.unlocked),
      read: Boolean(state.read),
      rewarded: Boolean(state.rewarded),
      unlockedAt: state.unlockedAt || null,
    };
  }

  /**
   * Rebuilds the metric snapshot from live managers. Safe to call every frame,
   * but the HUD throttles it to once per second.
   */
  snapshot(game) {
    if (!game) return { ...this.metrics };
    const inventory = game.player ? game.player.inventory : null;
    const records = inventory && inventory.encyclopedia ? inventory.encyclopedia : {};
    let catches = 0;
    for (const record of Object.values(records)) {
      catches += Number(record.timesCaught) || 0;
    }

    const summary = game.fishIndex ? game.fishIndex.getSummary() : null;
    const zones = game.zoneManager && game.zoneManager.discoveredZones
      ? game.zoneManager.discoveredZones.size
      : 0;

    let bosses = 0;
    if (game.bossManager && game.bossManager.records) {
      for (const record of Object.values(game.bossManager.records)) {
        bosses += Number(record.defeats) || 0;
      }
    }

    let furniture = 0;
    if (game.housingManager && typeof game.housingManager.getHouses === 'function') {
      furniture = game.housingManager.getHouses().reduce((sum, house) => sum + (house.furnitureCount || 0), 0);
    }

    this.metrics = {
      catches,
      species: summary ? summary.discovered : 0,
      zones,
      islands: game.visitedFrontierIslands ? game.visitedFrontierIslands.size : 0,
      boats: game.boatManager && game.boatManager.ownedBoatIds ? game.boatManager.ownedBoatIds.size : 0,
      rods: game.rodManager && game.rodManager.ownedRodIds ? game.rodManager.ownedRodIds.size : 0,
      tools: game.fishingToolManager && game.fishingToolManager.ownedToolIds
        ? game.fishingToolManager.ownedToolIds.size
        : 0,
      bosses,
      quests: game.questManager && typeof game.questManager.getCompletedQuests === 'function'
        ? game.questManager.getCompletedQuests().length
        : 0,
      furniture,
    };
    return this.metrics;
  }

  /**
   * Checks every chapter against the live metrics and unlocks newly completed
   * ones. Returns the chapters that unlocked during this call.
   */
  update(game) {
    this.snapshot(game);
    const unlocked = [];
    for (const chapter of this.chapters) {
      const state = this.progress[chapter.id];
      if (state.unlocked) continue;
      if ((this.metrics[chapter.metric] || 0) < chapter.target) continue;
      state.unlocked = true;
      state.unlockedAt = Date.now();
      this._grantReward(chapter, game, state);
      unlocked.push(this._decorate(chapter));
      this._notify(`Story chapter unlocked: ${chapter.title}`);
    }
    if (typeof this.onUpdate === 'function') this.onUpdate(this.getSummary());
    return unlocked;
  }

  _grantReward(chapter, game, state) {
    if (state.rewarded) return;
    const economy = game && game.player ? game.player.economy : null;
    const progression = game && game.player ? game.player.progression : null;
    if (economy) {
      if (chapter.rewardCoins > 0) economy.addCoins(chapter.rewardCoins);
      if (chapter.rewardGems > 0 && typeof economy.addGems === 'function') {
        economy.addGems(chapter.rewardGems);
      }
    }
    if (progression && chapter.rewardXp > 0) progression.addXp(chapter.rewardXp);
    state.rewarded = true;
    if (chapter.rewardCoins > 0 || chapter.rewardGems > 0) {
      this._notify(`Chapter reward: ${chapter.rewardCoins} coins${chapter.rewardGems ? ` + ${chapter.rewardGems} gems` : ''}`);
    }
  }

  markRead(chapterId) {
    const state = this.progress[chapterId];
    if (!state || !state.unlocked) return { success: false, reason: 'Chapter is still locked' };
    state.read = true;
    if (typeof this.onUpdate === 'function') this.onUpdate(this.getSummary());
    return { success: true, chapter: this.getChapter(chapterId) };
  }

  /** The chapter the journal should open to: first unlocked unread, else next locked. */
  getActiveChapter() {
    const chapters = this.getChapters();
    return chapters.find((chapter) => chapter.unlocked && !chapter.read)
      || chapters.find((chapter) => !chapter.unlocked)
      || chapters[chapters.length - 1];
  }

  getSummary() {
    const chapters = this.getChapters();
    const unlocked = chapters.filter((chapter) => chapter.unlocked).length;
    const read = chapters.filter((chapter) => chapter.read).length;
    return {
      total: chapters.length,
      unlocked,
      read,
      percent: chapters.length ? Math.round((unlocked / chapters.length) * 100) : 0,
      active: this.getActiveChapter(),
      metrics: { ...this.metrics },
    };
  }

  /** Compact objectives feed for the top-left HUD card. */
  getObjectiveLines(limit = 2) {
    const chapters = this.getChapters()
      .filter((chapter) => !chapter.unlocked)
      .slice(0, Math.max(1, limit));
    return chapters.map((chapter) => ({
      id: chapter.id,
      title: chapter.title,
      metric: chapter.metric,
      current: chapter.current,
      target: chapter.target,
      percent: chapter.percent,
    }));
  }

  serialize() {
    return {
      progress: JSON.parse(JSON.stringify(this.progress)),
      metrics: { ...this.metrics },
      unlocked: this.getChapters().filter((chapter) => chapter.unlocked).map((chapter) => chapter.id),
    };
  }

  deserialize(data) {
    if (!data || typeof data !== 'object') return;
    this._initProgress();
    if (data.progress && typeof data.progress === 'object') {
      for (const [id, state] of Object.entries(data.progress)) {
        if (!this.progress[id]) continue;
        this.progress[id] = {
          unlocked: Boolean(state.unlocked),
          read: Boolean(state.read),
          rewarded: Boolean(state.rewarded),
          unlockedAt: state.unlockedAt || null,
        };
      }
    }
    if (data.metrics && typeof data.metrics === 'object') {
      this.metrics = { ...METRIC_DEFAULTS, ...data.metrics };
    }
  }

  reset() {
    this.metrics = { ...METRIC_DEFAULTS };
    for (const state of Object.values(this.progress)) {
      state.unlocked = false;
      state.read = false;
      state.rewarded = false;
      state.unlockedAt = null;
    }
  }

  _notify(message) {
    if (typeof this.onNotification === 'function') this.onNotification(message);
  }
}

export default StoryJournal;
