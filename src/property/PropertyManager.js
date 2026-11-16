// PropertyManager: Coordinates island real estate plots, ownership persistence, and interior transitions.

import { Config } from '../config.js';
import { PropertyPlot } from './PropertyPlot.js';

export class PropertyManager {
  constructor(config = Config.property) {
    this.config = config || {};
    this.plots = new Map();

    this._initPlots();
  }

  _initPlots() {
    const list = this.config.plots || [];
    for (const plotConfig of list) {
      const plot = new PropertyPlot(plotConfig);
      this.plots.set(plot.id, plot);
    }
  }

  getPlot(id) {
    return this.plots.get(id) || null;
  }

  getAllPlots() {
    return Array.from(this.plots.values());
  }

  getOwnedPlots() {
    return this.getAllPlots().filter((p) => p.isOwned);
  }

  isPlotOwned(id) {
    const plot = this.getPlot(id);
    return plot ? plot.isOwned : false;
  }

  purchasePlot(id, economy) {
    const plot = this.getPlot(id);
    if (!plot) return { success: false, reason: 'Plot not found' };
    return plot.purchase(economy);
  }

  serialize() {
    const data = {};
    for (const [id, plot] of this.plots.entries()) {
      data[id] = plot.serialize();
    }
    return data;
  }

  deserialize(data) {
    if (!data) return;
    for (const [id, plotData] of Object.entries(data)) {
      const plot = this.plots.get(id);
      if (plot) {
        plot.deserialize(plotData);
      }
    }
  }

  reset() {
    for (const plot of this.plots.values()) {
      plot.isOwned = false;
      plot.isInside = false;
      plot._updateVisualState();
    }
  }
}

export default PropertyManager;
