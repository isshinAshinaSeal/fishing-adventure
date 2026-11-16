import { test, describe, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import { PlayerController } from '../src/entities/PlayerController.js';
import { ThirdPersonCamera } from '../src/camera/ThirdPersonCamera.js';
import { TerrainCollider } from '../src/world/TerrainCollider.js';
import { InputManager } from '../src/core/InputManager.js';
import { Config } from '../src/config.js';

describe('PlayerController — Kinematic 3D Character Physics & Movement', () => {
  let player;
  let collider;
  let camera;
  let input;

  beforeEach(() => {
    player = new PlayerController(Config.player);
    collider = new TerrainCollider(Config.world);
    const mockCamera = new THREE.PerspectiveCamera(60, 1, 0.1, 1000);
    camera = new ThirdPersonCamera(mockCamera, Config.camera);
    input = new InputManager(null); // Headless input
  });

  test('TC-01: Player moves accurately in 8 directions relative to camera', () => {
    camera.reset(player.position); // yaw = 0, camera faces -Z

    // 1. Forward (KeyW -> move along -Z)
    input.keys.set('KeyW', true);
    for (let i = 0; i < 20; i++) {
      player.update(0.05, input, camera, collider);
    }
    assert.ok(player.velocity.z < -2.0, `Player should move forward along -Z (got ${player.velocity.z})`);
    assert.ok(Math.abs(player.velocity.x) < 0.1, `Player should not drift laterally on X during forward move`);
    input.reset();

    // 2. Right (KeyD -> move along +X)
    player.reset({ x: 0, y: 10, z: 0 });
    input.keys.set('KeyD', true);
    for (let i = 0; i < 20; i++) {
      player.update(0.05, input, camera, collider);
    }
    assert.ok(player.velocity.x > 2.0, `Player should move right along +X (got ${player.velocity.x})`);
    input.reset();

    // 3. Diagonal Forward-Left (KeyW + KeyA)
    player.reset({ x: 0, y: 10, z: 0 });
    input.keys.set('KeyW', true);
    input.keys.set('KeyA', true);
    for (let i = 0; i < 20; i++) {
      player.update(0.05, input, camera, collider);
    }
    assert.ok(player.velocity.z < -1.0, 'Diagonal movement should have negative Z velocity');
    assert.ok(player.velocity.x < -1.0, 'Diagonal movement should have negative X velocity');
    const speed = Math.hypot(player.velocity.x, player.velocity.z);
    assert.ok(Math.abs(speed - Config.player.walkSpeed) < 0.5, 'Diagonal speed should match normalized walk speed');
    input.reset();
  });

  test('TC-02: Walk vs Sprint speeds match configured balance parameters', () => {
    camera.reset(player.position);

    // Normal Walk
    input.keys.set('KeyW', true);
    for (let i = 0; i < 30; i++) {
      player.update(0.05, input, camera, collider);
    }
    const walkSpeed = Math.hypot(player.velocity.x, player.velocity.z);
    assert.ok(
      Math.abs(walkSpeed - Config.player.walkSpeed) < 0.2,
      `Walk speed should stabilize at approx ${Config.player.walkSpeed} (got ${walkSpeed})`
    );

    // Sprinting (Shift + W)
    input.keys.set('ShiftLeft', true);
    for (let i = 0; i < 30; i++) {
      player.update(0.05, input, camera, collider);
    }
    const runSpeed = Math.hypot(player.velocity.x, player.velocity.z);
    assert.ok(
      Math.abs(runSpeed - Config.player.runSpeed) < 0.2,
      `Run speed should stabilize at approx ${Config.player.runSpeed} (got ${runSpeed})`
    );
    assert.ok(runSpeed > walkSpeed * 1.5, 'Sprinting speed must be significantly faster than walking');
  });

  test('TC-03: Jump applies impulse, gravity decelerates, and player lands grounded', () => {
    const groundH = collider.sampleHeight(0, 0);
    player.reset({ x: 0, y: groundH, z: 0 });
    player.isGrounded = true;

    // Trigger jump
    input.jumpRequested = true;
    player.update(0.02, input, camera, collider);

    assert.strictEqual(player.isGrounded, false, 'Player should be in air immediately after jumping');
    assert.strictEqual(player.velocity.y, Config.player.jumpForce, 'Upward velocity must match jumpForce');

    // Simulate airborne arc under gravity
    let peakReached = false;
    let initialY = player.position.y;
    let maxApexY = initialY;

    for (let i = 0; i < 60; i++) {
      player.update(0.02, input, camera, collider);
      if (player.position.y > maxApexY) {
        maxApexY = player.position.y;
      }
      if (player.velocity.y <= 0) {
        peakReached = true;
      }
      if (player.isGrounded) break;
    }

    assert.ok(peakReached, 'Player jump arc must reach an apex before falling');
    assert.ok(maxApexY > initialY + 1.0, `Jump apex (${maxApexY}) must be significantly higher than ground launch (${initialY})`);

    // Simulate until landing
    for (let i = 0; i < 80; i++) {
      if (player.isGrounded) break;
      player.update(0.02, input, camera, collider);
    }

    assert.strictEqual(player.isGrounded, true, 'Player must land safely and become grounded');
    assert.strictEqual(player.velocity.y, 0, 'Vertical velocity must be zeroed upon landing');
    assert.ok(
      Math.abs(player.position.y - groundH) < 0.05,
      `Player elevation must rest on terrain after landing (ground: ${groundH}, player: ${player.position.y})`
    );
  });
});
