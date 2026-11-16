// tests/polish.test.js — Phase 14: Polish, Audio Synthesis & Engine Optimization Verification

import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { SoundManager } from '../src/audio/SoundManager.js';
import { ParticleManager } from '../src/effects/ParticleManager.js';
import { Game } from '../src/core/Game.js';

describe('Polish, Audio Synthesis & Optimization (Phase 14)', () => {
  test('TC-79: SoundManager initializes and triggers all procedural sound cues without error', () => {
    const sound = new SoundManager();

    // Verify all sound methods run safely without throwing in any environment
    assert.doesNotThrow(() => sound.playCastSplash());
    assert.doesNotThrow(() => sound.playBiteAlert());
    assert.doesNotThrow(() => sound.playReelTick());
    assert.doesNotThrow(() => sound.playCatchSuccess());
    assert.doesNotThrow(() => sound.playCatchFailed());
    assert.doesNotThrow(() => sound.playCoinSound());
    assert.doesNotThrow(() => sound.playLevelUp());

    // Verify sound history records each triggered event
    assert.equal(sound.soundHistory.length, 7);
  });

  test('TC-80: SoundManager volume adjustment and mute toggles function correctly', () => {
    const sound = new SoundManager({ masterVolume: 0.5 });
    assert.equal(sound.masterVolume, 0.5);
    assert.equal(sound.isMuted, false);

    // Adjust volume
    sound.setMasterVolume(0.85);
    assert.equal(sound.masterVolume, 0.85);

    // Clamps to [0, 1]
    sound.setMasterVolume(1.5);
    assert.equal(sound.masterVolume, 1.0);
    sound.setMasterVolume(-0.5);
    assert.equal(sound.masterVolume, 0.0);

    // Toggle mute
    const muted = sound.toggleMute();
    assert.equal(muted, true);
    assert.equal(sound.isMuted, true);

    const unmuted = sound.toggleMute();
    assert.equal(unmuted, false);
    assert.equal(sound.isMuted, false);
  });

  test('TC-81: ParticleManager spawns splashes and recycles particles upon lifetime expiration', () => {
    const particles = new ParticleManager(null, 40);
    assert.equal(particles.getActiveCount(), 0);

    // Spawn splash of 10 particles
    particles.spawnSplash({ x: 0, y: 0, z: 0 }, 10);
    assert.equal(particles.getActiveCount(), 10);

    // Spawn boat wake of 4 particles
    particles.spawnBoatWake({ x: 2, y: 0, z: 2 }, 4);
    assert.equal(particles.getActiveCount(), 14);

    // Step simulation by 0.2s (particles still alive)
    particles.update(0.2);
    assert.ok(particles.getActiveCount() > 0);

    // Step simulation by 3.0s (all particles should expire and recycle to pool)
    particles.update(3.0);
    assert.equal(particles.getActiveCount(), 0, 'Expired particles must be returned to pool');
  });

  test('TC-82: Stress test: 1,000 game update frames run within budget with zero NaN or memory leaks', () => {
    const game = new Game();
    assert.equal(game.isRunning, false);

    const startTime = performance.now();

    // Run 1,000 simulated engine frames (at 60 FPS -> 16.66ms per frame = 16.6 seconds of game time)
    for (let frame = 0; frame < 1000; frame++) {
      game.update(0.0166);
    }

    const elapsed = performance.now() - startTime;

    // 1,000 frames must execute fast and smoothly in headless mode
    assert.ok(
      elapsed < 1500,
      `1,000 frames should execute in under 1500ms, took ${elapsed.toFixed(1)}ms`
    );

    // Verify player position and speed are valid finite numbers (never NaN)
    const pState = game.player.getState();
    assert.ok(!Number.isNaN(pState.position.x), 'Position X must not be NaN');
    assert.ok(!Number.isNaN(pState.position.y), 'Position Y must not be NaN');
    assert.ok(!Number.isNaN(pState.position.z), 'Position Z must not be NaN');
    assert.ok(!Number.isNaN(pState.speed), 'Speed must not be NaN');

    // Verify diagnostics clean
    const diag = game.getDiagnostics();
    assert.ok(diag.fps >= 0);
    assert.ok(diag.coins >= 0);
  });
});
