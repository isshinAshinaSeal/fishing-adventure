import { test, describe, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import { ThirdPersonCamera } from '../src/camera/ThirdPersonCamera.js';
import { TerrainCollider } from '../src/world/TerrainCollider.js';
import { Config } from '../src/config.js';

describe('ThirdPersonCamera — Spherical Orbital Rig & Terrain Collision Clearance', () => {
  let cameraRig;
  let mockThreeCam;
  let collider;

  beforeEach(() => {
    mockThreeCam = new THREE.PerspectiveCamera(60, 16 / 9, 0.1, 1000);
    cameraRig = new ThirdPersonCamera(mockThreeCam, Config.camera);
    collider = new TerrainCollider(Config.world);
  });

  test('TC-05.1: Yaw and pitch respond to mouse deltas with configured sensitivity', () => {
    const initialYaw = cameraRig.yaw;
    const initialPitch = cameraRig.pitch;

    cameraRig.handleInput(100, -50);

    assert.notStrictEqual(cameraRig.yaw, initialYaw, 'Yaw should update after horizontal mouse delta');
    assert.notStrictEqual(cameraRig.pitch, initialPitch, 'Pitch should update after vertical mouse delta');
  });

  test('TC-05.2: Pitch is strictly clamped within configured limits to prevent gimbal flips', () => {
    // Attempt extreme upward pitch
    cameraRig.handleInput(0, 99999);
    assert.ok(
      cameraRig.pitch <= Config.camera.maxPitch,
      `Pitch must not exceed maxPitch (${Config.camera.maxPitch}, got ${cameraRig.pitch})`
    );

    // Attempt extreme downward pitch
    cameraRig.handleInput(0, -999999);
    assert.ok(
      cameraRig.pitch >= Config.camera.minPitch,
      `Pitch must not fall below minPitch (${Config.camera.minPitch}, got ${cameraRig.pitch})`
    );
  });

  test('TC-05.3: Camera horizontal forward and right vectors rotate consistently with yaw', () => {
    cameraRig.yaw = 0;
    let forward = cameraRig.getHorizontalForward();
    let right = cameraRig.getHorizontalRight();
    assert.ok(Math.abs(forward.z - (-1.0)) < 0.01, 'At yaw=0, forward should be -Z');
    assert.ok(Math.abs(right.x - 1.0) < 0.01, 'At yaw=0, right should be +X');

    // Turn 90 degrees right (yaw = -PI/2)
    cameraRig.yaw = -Math.PI / 2;
    forward = cameraRig.getHorizontalForward();
    right = cameraRig.getHorizontalRight();
    assert.ok(Math.abs(forward.x - 1.0) < 0.01, 'At yaw=-90 deg, forward should be +X');
    assert.ok(Math.abs(right.z - 1.0) < 0.01, 'At yaw=-90 deg, right should be +Z');
  });

  test('TC-06.1: adjustDistance clamps within minDistance and maxDistance bounds', () => {
    // Zoom in past minimum
    cameraRig.adjustDistance(-100);
    assert.strictEqual(cameraRig.targetDistance, Config.camera.minDistance, 'Target distance must clamp to minDistance');

    // Zoom out past maximum
    cameraRig.adjustDistance(200);
    assert.strictEqual(cameraRig.targetDistance, Config.camera.maxDistance, 'Target distance must clamp to maxDistance');
  });

  test('TC-06.2: Camera elevates to maintain minimum clearance above terrain', () => {
    const targetPos = { x: 0, y: 10, z: 0 };
    cameraRig.reset(targetPos);

    // Mock steep pitch looking upward that would position camera low to ground
    cameraRig.pitch = -0.6; // looking up, camera placed low behind target

    // Tick camera update
    for (let i = 0; i < 40; i++) {
      cameraRig.update(0.05, targetPos, collider);
    }

    const terrainH = collider.sampleHeight(cameraRig.currentPosition.x, cameraRig.currentPosition.z);
    assert.ok(
      cameraRig.currentPosition.y >= terrainH + Config.camera.terrainClearance - 0.1,
      `Camera elevation (${cameraRig.currentPosition.y}) must stay above terrain (${terrainH}) + clearance`
    );
  });
});
