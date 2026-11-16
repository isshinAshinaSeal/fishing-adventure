// Interactable: Base contract for any world entity that can be interacted with.
// Decoupled from rendering so it runs seamlessly in headless test suites and WebGL.

import * as THREE from 'three';
import { Config } from '../config.js';

export class Interactable {
  constructor(options = {}) {
    this.id = options.id || `interactable_${Math.random().toString(36).substr(2, 9)}`;
    this.name = options.name || 'Object';
    this.type = options.type || 'generic';
    this.promptAction = options.promptAction || 'Interact';
    this.promptKey = options.promptKey || Config.interaction.promptKey || 'E';
    this.interactionRange = options.interactionRange || Config.interaction.defaultRange || 3.2;

    this.position = new THREE.Vector3(
      options.position ? options.position.x || 0 : 0,
      options.position ? options.position.y || 0 : 0,
      options.position ? options.position.z || 0 : 0
    );

    this.enabled = options.enabled !== undefined ? options.enabled : true;
    this.onInteractHandler = options.onInteract || null;
    this.mesh = options.mesh || null;
  }

  /**
   * Evaluates whether interaction is currently permitted.
   * Can be overridden by subclasses (e.g. quests, inventory prerequisites).
   */
  canInteract(player) {
    return this.enabled;
  }

  /**
   * Formats user-facing prompt string.
   */
  getPromptText() {
    if (this.name && this.name !== 'Object') {
      return `${this.promptAction} ${this.name}`;
    }
    return this.promptAction;
  }

  /**
   * Calculates distance from interactable position to a given target position.
   */
  getDistanceTo(targetPos) {
    const dx = this.position.x - targetPos.x;
    const dy = this.position.y - targetPos.y;
    const dz = this.position.z - targetPos.z;
    return Math.hypot(dx, dy, dz);
  }

  /**
   * Calculates 2D horizontal distance (X-Z plane).
   */
  getHorizontalDistanceTo(targetPos) {
    const dx = this.position.x - targetPos.x;
    const dz = this.position.z - targetPos.z;
    return Math.hypot(dx, dz);
  }

  /**
   * Main interaction trigger.
   */
  onInteract(player, context) {
    if (this.onInteractHandler) {
      return this.onInteractHandler(player, context);
    }
    return null;
  }

  dispose() {
    this.enabled = false;
    this.onInteractHandler = null;
    this.mesh = null;
  }
}

export default Interactable;
