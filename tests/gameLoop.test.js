import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { Game } from '../src/core/Game.js';
import { Config } from '../src/config.js';

describe('Game Engine Lifecycle, Diagnostics & Scene Restart', () => {
  test('TC-08: Game initializes cleanly and runs headless update frames without errors', () => {
    const game = new Game(null); // Headless setup
    assert.ok(game.scene, 'Three.js scene must be created');
    assert.ok(game.camera, 'Camera must be created');
    assert.ok(game.player, 'PlayerController must be created');
    assert.ok(game.terrainCollider, 'TerrainCollider must be created');

    // Run several update steps with simulated delta time
    for (let frame = 0; frame < 60; frame++) {
      game.update(0.016);
    }

    const diag = game.getDiagnostics();
    assert.strictEqual(typeof diag.fps, 'number', 'FPS should be a valid number');
    assert.strictEqual(typeof diag.speed, 'string', 'Speed should be formatted string');
    assert.strictEqual(typeof diag.isGrounded, 'boolean', 'isGrounded should be boolean');
    assert.ok(Number.isFinite(Number(diag.position.x)), 'Position X should be finite');
    assert.ok(Number.isFinite(Number(diag.position.y)), 'Position Y should be finite');
    assert.ok(Number.isFinite(Number(diag.position.z)), 'Position Z should be finite');

    game.dispose();
  });

  test('TC-07: restart() resets player position, velocity, and camera without corruption', () => {
    const game = new Game(null);

    // Displace player away from spawn
    game.player.position.set(125, 40, -85);
    game.player.velocity.set(5, -2, 4);
    game.inputManager.keys.set('KeyW', true);
    game.inputManager.jumpRequested = true;

    // Trigger restart
    game.restart();

    // Verify spawn coordinates match config
    const spawnX = Config.player.spawnPosition.x;
    const spawnZ = Config.player.spawnPosition.z;
    const expectedGround = game.terrainCollider.sampleHeight(spawnX, spawnZ);

    assert.strictEqual(game.player.position.x, spawnX, 'Player X must be reset to spawn coordinate');
    assert.strictEqual(game.player.position.z, spawnZ, 'Player Z must be reset to spawn coordinate');
    assert.ok(
      Math.abs(game.player.position.y - expectedGround) < 0.2,
      `Player Y must be clamped to spawn ground elevation (expected ~${expectedGround}, got ${game.player.position.y})`
    );
    assert.strictEqual(game.player.velocity.x, 0, 'Velocity X must be zeroed');
    assert.strictEqual(game.player.velocity.y, 0, 'Velocity Y must be zeroed');
    assert.strictEqual(game.player.velocity.z, 0, 'Velocity Z must be zeroed');
    assert.strictEqual(game.player.isGrounded, true, 'Player must be grounded at spawn');
    assert.strictEqual(game.inputManager.jumpRequested, false, 'Stuck jump inputs must be cleared');

    // Consecutive restarts should be safe
    for (let i = 0; i < 5; i++) {
      game.restart();
    }
    assert.strictEqual(game.player.position.x, spawnX);

    game.dispose();
  });
});
