// SoundManager: Procedural Web Audio synthesizer for tactile gamedev juice & audio cues.
// Runs seamlessly in WebGL browsers and safely mocks in headless test environments.

export class SoundManager {
  constructor(options = {}) {
    this.masterVolume = options.masterVolume !== undefined ? options.masterVolume : 0.7;
    this.isMuted = Boolean(options.isMuted);

    this.audioCtx = null;
    this.soundHistory = [];

    this._initAudioContext();
  }

  _initAudioContext() {
    if (typeof window !== 'undefined') {
      const AudioCtxClass = window.AudioContext || window.webkitAudioContext;
      if (AudioCtxClass) {
        try {
          this.audioCtx = new AudioCtxClass();
        } catch {
          this.audioCtx = null;
        }
      }
    }
  }

  _resumeContext() {
    if (this.audioCtx && this.audioCtx.state === 'suspended') {
      this.audioCtx.resume().catch(() => {});
    }
  }

  setMasterVolume(val) {
    this.masterVolume = Math.max(0, Math.min(1, Number(val) || 0));
    return this.masterVolume;
  }

  toggleMute() {
    this.isMuted = !this.isMuted;
    return this.isMuted;
  }

  _recordSound(name) {
    this.soundHistory.push({ name, time: Date.now() });
    if (this.soundHistory.length > 50) this.soundHistory.shift();
  }

  /**
   * Procedural splash sound when casting bobber or jumping into water.
   */
  playCastSplash() {
    this._recordSound('cast_splash');
    if (this.isMuted || !this.audioCtx) return;
    this._resumeContext();

    try {
      const now = this.audioCtx.currentTime;
      const osc = this.audioCtx.createOscillator();
      const gain = this.audioCtx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(320, now);
      osc.frequency.exponentialRampToValueAtTime(70, now + 0.22);

      gain.gain.setValueAtTime(this.masterVolume * 0.45, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);

      osc.connect(gain);
      gain.connect(this.audioCtx.destination);

      osc.start(now);
      osc.stop(now + 0.22);
    } catch {}
  }

  /**
   * High-pitched urgent nibble alert when fish strikes the bait.
   */
  playBiteAlert() {
    this._recordSound('bite_alert');
    if (this.isMuted || !this.audioCtx) return;
    this._resumeContext();

    try {
      const now = this.audioCtx.currentTime;
      const osc = this.audioCtx.createOscillator();
      const gain = this.audioCtx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(580, now);
      osc.frequency.setValueAtTime(880, now + 0.08);

      gain.gain.setValueAtTime(this.masterVolume * 0.5, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);

      osc.connect(gain);
      gain.connect(this.audioCtx.destination);

      osc.start(now);
      osc.stop(now + 0.18);
    } catch {}
  }

  /**
   * Mechanical ratchet click when reeling in line during tension minigame.
   */
  playReelTick() {
    this._recordSound('reel_tick');
    if (this.isMuted || !this.audioCtx) return;
    this._resumeContext();

    try {
      const now = this.audioCtx.currentTime;
      const osc = this.audioCtx.createOscillator();
      const gain = this.audioCtx.createGain();

      osc.type = 'square';
      osc.frequency.setValueAtTime(1400, now);

      gain.gain.setValueAtTime(this.masterVolume * 0.18, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.03);

      osc.connect(gain);
      gain.connect(this.audioCtx.destination);

      osc.start(now);
      osc.stop(now + 0.03);
    } catch {}
  }

  /**
   * Harmonious major chord fanfare when successfully catching fish.
   */
  playCatchSuccess() {
    this._recordSound('catch_success');
    if (this.isMuted || !this.audioCtx) return;
    this._resumeContext();

    try {
      const now = this.audioCtx.currentTime;
      const frequencies = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6

      frequencies.forEach((freq, idx) => {
        const osc = this.audioCtx.createOscillator();
        const gain = this.audioCtx.createGain();
        const start = now + idx * 0.08;

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, start);

        gain.gain.setValueAtTime(this.masterVolume * 0.35, start);
        gain.gain.exponentialRampToValueAtTime(0.001, start + 0.35);

        osc.connect(gain);
        gain.connect(this.audioCtx.destination);

        osc.start(start);
        osc.stop(start + 0.35);
      });
    } catch {}
  }

  /**
   * Dull thud when line snaps or fish escapes.
   */
  playCatchFailed() {
    this._recordSound('catch_failed');
    if (this.isMuted || !this.audioCtx) return;
    this._resumeContext();

    try {
      const now = this.audioCtx.currentTime;
      const osc = this.audioCtx.createOscillator();
      const gain = this.audioCtx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(220, now);
      osc.frequency.exponentialRampToValueAtTime(80, now + 0.28);

      gain.gain.setValueAtTime(this.masterVolume * 0.4, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.28);

      osc.connect(gain);
      gain.connect(this.audioCtx.destination);

      osc.start(now);
      osc.stop(now + 0.28);
    } catch {}
  }

  /**
   * Crisp metal bell chime when earning or spending coins.
   */
  playCoinSound() {
    this._recordSound('coin_clink');
    if (this.isMuted || !this.audioCtx) return;
    this._resumeContext();

    try {
      const now = this.audioCtx.currentTime;
      const osc = this.audioCtx.createOscillator();
      const gain = this.audioCtx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(987.77, now); // B5
      osc.frequency.setValueAtTime(1318.51, now + 0.06); // E6

      gain.gain.setValueAtTime(this.masterVolume * 0.35, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.24);

      osc.connect(gain);
      gain.connect(this.audioCtx.destination);

      osc.start(now);
      osc.stop(now + 0.24);
    } catch {}
  }

  /**
   * Triumphant level up fanfare.
   */
  playLevelUp() {
    this._recordSound('level_up');
    if (this.isMuted || !this.audioCtx) return;
    this._resumeContext();

    try {
      const now = this.audioCtx.currentTime;
      const chord = [440, 554.37, 659.25, 880]; // A Major
      chord.forEach((freq, i) => {
        const osc = this.audioCtx.createOscillator();
        const gain = this.audioCtx.createGain();
        const start = now + i * 0.06;

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, start);

        gain.gain.setValueAtTime(this.masterVolume * 0.4, start);
        gain.gain.exponentialRampToValueAtTime(0.001, start + 0.45);

        osc.connect(gain);
        gain.connect(this.audioCtx.destination);

        osc.start(start);
        osc.stop(start + 0.45);
      });
    } catch {}
  }
}

export default SoundManager;
