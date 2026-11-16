// FishIndex: Fish Index 2.0 — discovery percentages, category progress,
// personal records, filtering/search, and habitat travel routing.

import { FishDatabase, RarityTiers } from './FishDatabase.js';

export class FishIndex {
  constructor(inventory = null) {
    this.inventory = inventory;
  }

  _species() {
    return FishDatabase.getFullCatalog();
  }

  _records() {
    return (this.inventory && this.inventory.encyclopedia) || {};
  }

  getSummary() {
    const species = this._species();
    const records = this._records();
    const categories = this.getCategories();

    let biggest = null;
    let rarest = null;
    let mostCaught = null;
    let discovered = 0;

    for (const sp of species) {
      const record = records[sp.id];
      if (!record) continue;
      discovered += 1;
      if (!biggest || record.maxWeight > biggest.weight) {
        biggest = { speciesId: sp.id, name: sp.name, icon: sp.icon, weight: record.maxWeight };
      }
      const order = (RarityTiers[sp.rarity] || RarityTiers.Common).order;
      if (!rarest || order > rarest.order) {
        rarest = { speciesId: sp.id, name: sp.name, icon: sp.icon, rarity: sp.rarity, order };
      }
      if (!mostCaught || record.timesCaught > mostCaught.timesCaught) {
        mostCaught = {
          speciesId: sp.id,
          name: sp.name,
          icon: sp.icon,
          timesCaught: record.timesCaught,
        };
      }
    }

    const total = species.length;
    return {
      discovered,
      total,
      catalogValue: species.reduce((sum, sp) => sum + (sp.basePrice || 0), 0),
      percent: total > 0 ? Math.round((discovered / total) * 100) : 0,
      categories,
      habitats: this.getHabitatProgress(),
      rarities: this.getRarityProgress(),
      milestones: this.getCompletionMilestones(),
      biggest,
      rarest,
      mostCaught,
      firstDiscovery: this._firstDiscovery(),
    };
  }

  getHabitatProgress() {
    const records = this._records();
    const map = new Map();
    for (const sp of this._species()) {
      for (const habitat of sp.habitat) {
        if (!map.has(habitat)) map.set(habitat, { id: habitat, name: habitat, total: 0, discovered: 0 });
        const entry = map.get(habitat);
        entry.total += 1;
        if (records[sp.id]) entry.discovered += 1;
      }
    }
    return Array.from(map.values())
      .map((entry) => ({ ...entry, percent: entry.total ? Math.round((entry.discovered / entry.total) * 100) : 0 }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }

  getRarityProgress() {
    const records = this._records();
    const map = new Map();
    for (const sp of this._species()) {
      if (!map.has(sp.rarity)) map.set(sp.rarity, { id: sp.rarity, name: sp.rarity, total: 0, discovered: 0 });
      const entry = map.get(sp.rarity);
      entry.total += 1;
      if (records[sp.id]) entry.discovered += 1;
    }
    return Array.from(map.values())
      .map((entry) => ({ ...entry, percent: entry.total ? Math.round((entry.discovered / entry.total) * 100) : 0 }))
      .sort((a, b) => (RarityTiers[a.id]?.order || 0) - (RarityTiers[b.id]?.order || 0));
  }

  getCompletionMilestones() {
    const summary = {
      discovered: Object.keys(this._records()).length,
      total: this._species().length,
    };
    const percent = summary.total ? Math.round((summary.discovered / summary.total) * 100) : 0;
    return [10, 25, 50, 75, 100].map((threshold) => ({
      threshold,
      achieved: percent >= threshold,
    }));
  }

  getUndiscoveredHint() {
    const records = this._records();
    const candidates = this._species()
      .filter((sp) => !records[sp.id])
      .sort((a, b) => ((RarityTiers[a.rarity]?.order || 0) - (RarityTiers[b.rarity]?.order || 0)));
    if (candidates.length === 0) return null;
    const species = candidates[0];
    return {
      category: species.category,
      habitat: species.habitat,
      depth: species.depth,
      activeTime: species.activeTime,
      hint: `Try ${species.habitat.join(' / ')} waters during ${species.activeTime.join(' or ')}.`,
    };
  }

  _firstDiscovery() {
    const records = this._records();
    let earliest = null;
    for (const [id, record] of Object.entries(records)) {
      if (!earliest || (record.firstCaughtAt || 0) < earliest.firstCaughtAt) {
        earliest = { speciesId: id, firstCaughtAt: record.firstCaughtAt || 0 };
      }
    }
    if (!earliest) return null;
    const sp = FishDatabase.getSpeciesById(earliest.speciesId);
    return sp ? { speciesId: sp.id, name: sp.name, icon: sp.icon, firstCaughtAt: earliest.firstCaughtAt } : null;
  }

  getCategories() {
    const records = this._records();
    const map = new Map();
    for (const sp of this._species()) {
      if (!map.has(sp.category)) {
        map.set(sp.category, { id: sp.category, name: sp.category, total: 0, discovered: 0 });
      }
      const entry = map.get(sp.category);
      entry.total += 1;
      if (records[sp.id]) entry.discovered += 1;
    }
    return Array.from(map.values()).map((c) => ({
      ...c,
      percent: c.total > 0 ? Math.round((c.discovered / c.total) * 100) : 0,
    }));
  }

  /**
   * Returns index entries, optionally filtered/sorted.
   */
  getEntries(filters = {}) {
    const {
      search = '',
      category = 'all',
      habitat = 'all',
      rarity = 'all',
      discoveredOnly = false,
      sort = 'rarity',
    } = filters;
    const records = this._records();
    const needle = String(search).trim().toLowerCase();

    let entries = this._species().map((sp) => {
      const record = records[sp.id] || null;
      return {
        speciesId: sp.id,
        name: record ? sp.name : '???',
        trueName: sp.name,
        rarity: sp.rarity,
        rarityOrder: (RarityTiers[sp.rarity] || RarityTiers.Common).order,
        category: sp.category,
        icon: record ? sp.icon : '❔',
        discovered: Boolean(record),
        habitat: sp.habitat,
        preferredBait: sp.preferredBait,
        activeTime: sp.activeTime,
        depth: sp.depth,
        behavior: sp.behavior,
        basePrice: sp.basePrice,
        valuePerKg: sp.weightRange && sp.weightRange[1] > 0 ? Number((sp.basePrice / sp.weightRange[1]).toFixed(2)) : 0,
        description: record ? sp.description : 'Undiscovered species. Fish new habitats at different times of day.',
        timesCaught: record ? record.timesCaught : 0,
        maxWeight: record ? record.maxWeight : 0,
        minWeight: record ? record.minWeight : 0,
        firstCaughtAt: record ? record.firstCaughtAt : null,
      };
    });

    if (category !== 'all') {
      entries = entries.filter((e) => e.category === category);
    }
    if (habitat !== 'all') {
      entries = entries.filter((e) => e.habitat.includes(habitat));
    }
    if (rarity !== 'all') {
      entries = entries.filter((e) => e.rarity === rarity);
    }
    if (discoveredOnly) {
      entries = entries.filter((e) => e.discovered);
    }
    if (needle) {
      entries = entries.filter((e) => {
        const haystack = `${e.trueName} ${e.category} ${e.habitat.join(' ')} ${e.preferredBait}`.toLowerCase();
        return haystack.includes(needle);
      });
    }

    if (sort === 'name') {
      entries.sort((a, b) => a.trueName.localeCompare(b.trueName));
    } else if (sort === 'weight') {
      entries.sort((a, b) => b.maxWeight - a.maxWeight);
    } else if (sort === 'caught') {
      entries.sort((a, b) => b.timesCaught - a.timesCaught);
    } else if (sort === 'value') {
      entries.sort((a, b) => b.basePrice - a.basePrice || a.trueName.localeCompare(b.trueName));
    } else {
      entries.sort((a, b) => b.rarityOrder - a.rarityOrder || a.trueName.localeCompare(b.trueName));
    }

    return entries;
  }

  getEntry(speciesId) {
    return this.getEntries({}).find((e) => e.speciesId === speciesId) || null;
  }

  getHabitatDestination(speciesId, fastTravel) {
    if (!fastTravel) return null;
    const sp = FishDatabase.getSpeciesById(speciesId);
    if (!sp) return null;
    return fastTravel.findDestinationForHabitat(sp.habitat);
  }

  getCategoryRewards() {
    // Collection milestone definitions used by the UI / future reward claiming.
    const milestones = [25, 50, 75, 100];
    return this.getCategories().map((category) => ({
      category: category.id,
      percent: category.percent,
      milestones: milestones.map((threshold) => ({
        threshold,
        achieved: category.percent >= threshold,
      })),
    }));
  }
}

export default FishIndex;
