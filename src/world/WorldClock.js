// WorldClock: Lightweight in-game day/night cycle used by fish activity,
// NPC schedules, and the HUD. Runs identically headless and in the browser.

export class WorldClock {
  constructor(options = {}) {
    this.cycleSeconds = options.cycleSeconds || 600; // 10 real minutes per full day
    this.hour = options.startHour !== undefined ? options.startHour : 7.5;
    this.day = options.startDay || 1;
    this.totalDays = options.totalDays || 0;
  }

  update(dt) {
    if (!dt || dt <= 0) return this.hour;
    this.hour += (dt / this.cycleSeconds) * 24;
    while (this.hour >= 24) {
      this.hour -= 24;
      this.day += 1;
      this.totalDays += 1;
    }
    return this.hour;
  }

  getHour() {
    return this.hour;
  }

  getDay() {
    return this.day;
  }

  getPeriod() {
    const h = this.hour;
    if (h >= 5 && h < 8) return 'dawn';
    if (h >= 8 && h < 17) return 'day';
    if (h >= 17 && h < 20) return 'dusk';
    return 'night';
  }

  isNight() {
    return this.getPeriod() === 'night';
  }

  getTimeString() {
    const totalMinutes = Math.floor((this.hour % 24) * 60);
    const hh = String(Math.floor(totalMinutes / 60)).padStart(2, '0');
    const mm = String(totalMinutes % 60).padStart(2, '0');
    return `${hh}:${mm}`;
  }

  getLightLevel() {
    // 1 = full daylight, 0 = deep night. Useful for future lighting hooks.
    const h = this.hour;
    if (h >= 8 && h <= 17) return 1;
    if (h > 17 && h < 20) return 1 - (h - 17) / 3;
    if (h >= 20 || h < 5) return 0;
    return (h - 5) / 3;
  }

  serialize() {
    return { hour: this.hour, day: this.day, totalDays: this.totalDays };
  }

  deserialize(data) {
    if (!data) return;
    this.hour = Number(data.hour) || 0;
    this.day = Number(data.day) || 1;
    this.totalDays = Number(data.totalDays) || 0;
  }

  reset() {
    this.hour = 7.5;
    this.day = 1;
    this.totalDays = 0;
  }
}

export default WorldClock;
