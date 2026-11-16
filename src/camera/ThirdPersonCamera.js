// ThirdPersonCamera: Smooth spherical orbital follow camera with terrain collision avoidance.

import * as THREE from 'three';
import { Config } from '../config.js';

export class ThirdPersonCamera {
  constructor(camera, config = Config.camera) {
    this.camera = camera;
    this.config = config;

    // Spherical coordinates
    this.distance = config.defaultDistance;
    this.targetDistance = config.defaultDistance;
    this.yaw = 0.0;             // Horizontal angle in radians
    this.pitch = config.defaultPitch; // Vertical angle in radians

    // Damped follow target
    this.currentLookAt = new THREE.Vector3(0, config.headOffset.y, 0);
    this.currentPosition = new THREE.Vector3(0, config.headOffset.y + 2, config.defaultDistance);
  }

  /**
   * Applies mouse / controller rotational delta.
   */
  handleInput(deltaX, deltaY) {
    const sens = this.config.mouseSensitivity;
    this.yaw -= deltaX * sens;
    this.pitch += deltaY * sens;

    // Clamp vertical angle to prevent flipping
    this.pitch = Math.max(this.config.minPitch, Math.min(this.config.maxPitch, this.pitch));
  }

  /**
   * Adjusts zoom distance (e.g. from mouse scroll wheel).
   */
  adjustDistance(delta) {
    this.targetDistance = Math.max(
      this.config.minDistance,
      Math.min(this.config.maxDistance, this.targetDistance + delta)
    );
  }

  /**
   * Updates camera position, collision, and orientation.
   * @param {number} dt - Delta time in seconds.
   * @param {{x: number, y: number, z: number}} targetPos - Player world position.
   * @param {TerrainCollider} [terrainCollider] - Optional terrain collider for clearance.
   */
  update(dt, targetPos, terrainCollider) {
    const headOffset = this.config.headOffset;
    const targetLookAt = new THREE.Vector3(
      targetPos.x + headOffset.x,
      targetPos.y + headOffset.y,
      targetPos.z + headOffset.z
    );

    // Smoothly interpolate lookAt position
    const lookAtLerp = 1.0 - Math.exp(-dt * 18.0);
    this.currentLookAt.lerp(targetLookAt, lookAtLerp);

    // Smoothly interpolate distance zoom
    const distLerp = 1.0 - Math.exp(-dt * 12.0);
    this.distance += (this.targetDistance - this.distance) * distLerp;

    // Calculate ideal spherical camera offset
    const cosPitch = Math.cos(this.pitch);
    const sinPitch = Math.sin(this.pitch);
    const sinYaw = Math.sin(this.yaw);
    const cosYaw = Math.cos(this.yaw);

    const idealOffsetX = this.distance * cosPitch * sinYaw;
    const idealOffsetY = this.distance * sinPitch;
    const idealOffsetZ = this.distance * cosPitch * cosYaw;

    const idealCamPos = new THREE.Vector3(
      this.currentLookAt.x + idealOffsetX,
      this.currentLookAt.y + idealOffsetY,
      this.currentLookAt.z + idealOffsetZ
    );

    // Terrain clearance check: pull camera inward/upward if terrain obstructs
    let actualCamPos = idealCamPos;
    if (terrainCollider && typeof terrainCollider.sampleHeight === 'function') {
      const terrainH = terrainCollider.sampleHeight(idealCamPos.x, idealCamPos.z);
      const minCamY = terrainH + this.config.terrainClearance;

      if (idealCamPos.y < minCamY) {
        // Line-of-sight clearance check
        idealCamPos.y = minCamY;
      }
      actualCamPos = idealCamPos;
    }

    // Smooth camera position follow
    const posLerp = 1.0 - Math.exp(-dt * 16.0);
    this.currentPosition.lerp(actualCamPos, posLerp);

    if (this.camera) {
      this.camera.position.copy(this.currentPosition);
      this.camera.lookAt(this.currentLookAt);
    }
  }

  /**
   * Returns horizontal forward vector of camera (flattened onto X-Z plane).
   */
  getHorizontalForward() {
    const sinYaw = Math.sin(this.yaw);
    const cosYaw = Math.cos(this.yaw);
    return new THREE.Vector3(-sinYaw, 0, -cosYaw).normalize();
  }

  /**
   * Returns horizontal right vector of camera (flattened onto X-Z plane).
   */
  getHorizontalRight() {
    const sinYaw = Math.sin(this.yaw);
    const cosYaw = Math.cos(this.yaw);
    return new THREE.Vector3(cosYaw, 0, -sinYaw).normalize();
  }

  /**
   * Resets camera back to default angle behind target.
   */
  reset(targetPos) {
    this.yaw = 0.0;
    this.pitch = this.config.defaultPitch;
    this.distance = this.config.defaultDistance;
    this.targetDistance = this.config.defaultDistance;

    const headOffset = this.config.headOffset;
    if (targetPos) {
      this.currentLookAt.set(
        targetPos.x + headOffset.x,
        targetPos.y + headOffset.y,
        targetPos.z + headOffset.z
      );
      this.currentPosition.set(
        targetPos.x,
        targetPos.y + headOffset.y + 2,
        targetPos.z + this.distance
      );
    }
  }
}

export default ThirdPersonCamera;
