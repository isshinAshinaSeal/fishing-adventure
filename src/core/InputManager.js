// InputManager: Maps keyboard, mouse, and touch events to high-level game actions.
// Operates safely in both browser DOM and headless test environments.

export class InputManager {
  constructor(domElement = null) {
    this.domElement = domElement;
    this.keys = new Map();
    this.mouseDelta = { x: 0, y: 0 };
    this.mouseButtons = new Map();
    this.isPointerLocked = false;
    this.jumpRequested = false;
    this.restartRequested = false;
    this.interactRequested = false;
    this.equipToggleRequested = false;
    this.inventoryToggleRequested = false;
    this.mountToggleRequested = false;
    this.travelToggleRequested = false;
    this.fishIndexToggleRequested = false;
    this.dismountRequested = false;
    this.backpackToggleRequested = false;
    this.wardrobeToggleRequested = false;
    this.housingToggleRequested = false;
    this.radarToggleRequested = false;
    this.combatToggleRequested = false;
    this.aimModeToggleRequested = false;
    this.fireRequested = false;
    this.storyToggleRequested = false;
    this.isDragging = false;
    this.lastMousePos = { x: 0, y: 0 };

    this._onKeyDown = this._onKeyDown.bind(this);
    this._onKeyUp = this._onKeyUp.bind(this);
    this._onMouseMove = this._onMouseMove.bind(this);
    this._onMouseDown = this._onMouseDown.bind(this);
    this._onMouseUp = this._onMouseUp.bind(this);
    this._onWheel = this._onWheel.bind(this);
    this._onPointerLockChange = this._onPointerLockChange.bind(this);

    if (typeof window !== 'undefined') {
      this.attach();
    }
  }

  attach() {
    window.addEventListener('keydown', this._onKeyDown);
    window.addEventListener('keyup', this._onKeyUp);
    window.addEventListener('mousemove', this._onMouseMove);
    window.addEventListener('mousedown', this._onMouseDown);
    window.addEventListener('mouseup', this._onMouseUp);
    window.addEventListener('wheel', this._onWheel, { passive: true });
    document.addEventListener('pointerlockchange', this._onPointerLockChange);

    if (this.domElement) {
      this.domElement.addEventListener('click', () => {
        if (!this.isPointerLocked && this.domElement.requestPointerLock) {
          this.domElement.requestPointerLock();
        }
      });
    }
  }

  detach() {
    if (typeof window === 'undefined') return;
    window.removeEventListener('keydown', this._onKeyDown);
    window.removeEventListener('keyup', this._onKeyUp);
    window.removeEventListener('mousemove', this._onMouseMove);
    window.removeEventListener('mousedown', this._onMouseDown);
    window.removeEventListener('mouseup', this._onMouseUp);
    window.removeEventListener('wheel', this._onWheel);
    document.removeEventListener('pointerlockchange', this._onPointerLockChange);
  }

  _onKeyDown(e) {
    const code = e.code;
    if (!this.keys.get(code)) {
      if (code === 'Space') {
        this.jumpRequested = true;
      }
      if (code === 'KeyR') {
        this.restartRequested = true;
      }
      if (code === 'KeyE') {
        this.interactRequested = true;
      }
      if (code === 'KeyF') {
        this.equipToggleRequested = true;
      }
      if (code === 'KeyB' || code === 'KeyI') {
        this.inventoryToggleRequested = true;
      }
      if (code === 'KeyM') {
        this.mountToggleRequested = true;
      }
      if (code === 'KeyT') {
        this.travelToggleRequested = true;
      }
      if (code === 'KeyJ') {
        this.fishIndexToggleRequested = true;
      }
      if (code === 'KeyQ') {
        this.dismountRequested = true;
      }
      if (code === 'KeyK') {
        this.backpackToggleRequested = true;
      }
      if (code === 'KeyV') {
        this.wardrobeToggleRequested = true;
      }
      if (code === 'KeyH') {
        this.housingToggleRequested = true;
      }
      if (code === 'KeyO') {
        this.radarToggleRequested = true;
      }
      if (code === 'KeyC') {
        this.combatToggleRequested = true;
      }
      if (code === 'KeyX') {
        this.aimModeToggleRequested = true;
      }
      if (code === 'KeyL') {
        this.storyToggleRequested = true;
      }
      if (code === 'Space') {
        this.fireRequested = true;
      }
    }
    this.keys.set(code, true);

    // Prevent scrolling with Space/Arrows
    if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(code)) {
      if (e.preventDefault && typeof e.preventDefault === 'function') {
        e.preventDefault();
      }
    }
  }

  _onKeyUp(e) {
    this.keys.set(e.code, false);
  }

  _onMouseDown(e) {
    this.mouseButtons.set(e.button, true);
    if (e.button === 0) this.fireRequested = true;
    this.isDragging = true;
    this.lastMousePos.x = e.clientX;
    this.lastMousePos.y = e.clientY;
  }

  _onMouseUp(e) {
    this.mouseButtons.set(e.button, false);
    this.isDragging = false;
  }

  _onMouseMove(e) {
    if (this.isPointerLocked) {
      this.mouseDelta.x += e.movementX || 0;
      this.mouseDelta.y += e.movementY || 0;
    } else if (this.isDragging) {
      const dx = e.clientX - this.lastMousePos.x;
      const dy = e.clientY - this.lastMousePos.y;
      this.mouseDelta.x += dx;
      this.mouseDelta.y += dy;
      this.lastMousePos.x = e.clientX;
      this.lastMousePos.y = e.clientY;
    }
  }

  _onWheel(e) {
    this.wheelDelta = (e.deltaY || 0) * 0.005;
  }

  _onPointerLockChange() {
    this.isPointerLocked = (document.pointerLockElement === this.domElement);
  }

  /**
   * Returns normalized 2D movement vector (x = right/left, y = forward/back).
   */
  getMovementVector() {
    let forward = 0;
    let right = 0;

    if (this.keys.get('KeyW') || this.keys.get('ArrowUp')) forward += 1;
    if (this.keys.get('KeyS') || this.keys.get('ArrowDown')) forward -= 1;
    if (this.keys.get('KeyD') || this.keys.get('ArrowRight')) right += 1;
    if (this.keys.get('KeyA') || this.keys.get('ArrowLeft')) right -= 1;

    const len = Math.hypot(right, forward);
    if (len > 0.001) {
      return { x: right / len, z: forward / len, magnitude: 1.0 };
    }
    return { x: 0, z: 0, magnitude: 0 };
  }

  isSprinting() {
    return Boolean(this.keys.get('ShiftLeft') || this.keys.get('ShiftRight'));
  }

  consumeJump() {
    if (this.jumpRequested) {
      this.jumpRequested = false;
      return true;
    }
    return false;
  }

  consumeRestart() {
    if (this.restartRequested) {
      this.restartRequested = false;
      return true;
    }
    return false;
  }

  consumeInteract() {
    if (this.interactRequested) {
      this.interactRequested = false;
      return true;
    }
    return false;
  }

  consumeEquipToggle() {
    if (this.equipToggleRequested) {
      this.equipToggleRequested = false;
      return true;
    }
    return false;
  }

  consumeInventoryToggle() {
    if (this.inventoryToggleRequested) {
      this.inventoryToggleRequested = false;
      return true;
    }
    return false;
  }

  consumeMountToggle() {
    if (this.mountToggleRequested) {
      this.mountToggleRequested = false;
      return true;
    }
    return false;
  }

  consumeTravelToggle() {
    if (this.travelToggleRequested) {
      this.travelToggleRequested = false;
      return true;
    }
    return false;
  }

  consumeFishIndexToggle() {
    if (this.fishIndexToggleRequested) {
      this.fishIndexToggleRequested = false;
      return true;
    }
    return false;
  }

  consumeDismount() {
    if (this.dismountRequested) {
      this.dismountRequested = false;
      return true;
    }
    return false;
  }

  consumeBackpackToggle() {
    if (this.backpackToggleRequested) { this.backpackToggleRequested = false; return true; }
    return false;
  }

  consumeWardrobeToggle() {
    if (this.wardrobeToggleRequested) { this.wardrobeToggleRequested = false; return true; }
    return false;
  }

  consumeHousingToggle() {
    if (this.housingToggleRequested) { this.housingToggleRequested = false; return true; }
    return false;
  }

  consumeRadarToggle() {
    if (this.radarToggleRequested) { this.radarToggleRequested = false; return true; }
    return false;
  }

  consumeCombatToggle() {
    if (this.combatToggleRequested) { this.combatToggleRequested = false; return true; }
    return false;
  }

  consumeAimModeToggle() {
    if (this.aimModeToggleRequested) { this.aimModeToggleRequested = false; return true; }
    return false;
  }

  consumeFire() {
    if (this.fireRequested) { this.fireRequested = false; return true; }
    return false;
  }

  consumeStoryToggle() {
    if (this.storyToggleRequested) { this.storyToggleRequested = false; return true; }
    return false;
  }

  /**
   * Compatibility helper for systems that poll a key's current held state.
   */
  isActionJustPressed(code) {
    return Boolean(this.keys.get(code));
  }

  isKeyDown(code) {
    return Boolean(this.keys.get(code));
  }

  consumeMouseDelta() {
    const delta = { x: this.mouseDelta.x, y: this.mouseDelta.y };
    this.mouseDelta.x = 0;
    this.mouseDelta.y = 0;
    return delta;
  }

  consumeWheelDelta() {
    const delta = this.wheelDelta || 0;
    this.wheelDelta = 0;
    return delta;
  }

  reset() {
    this.keys.clear();
    this.mouseButtons.clear();
    this.mouseDelta.x = 0;
    this.mouseDelta.y = 0;
    this.jumpRequested = false;
    this.restartRequested = false;
    this.interactRequested = false;
    this.equipToggleRequested = false;
    this.inventoryToggleRequested = false;
    this.mountToggleRequested = false;
    this.travelToggleRequested = false;
    this.fishIndexToggleRequested = false;
    this.dismountRequested = false;
    this.backpackToggleRequested = false;
    this.wardrobeToggleRequested = false;
    this.housingToggleRequested = false;
    this.radarToggleRequested = false;
    this.combatToggleRequested = false;
    this.aimModeToggleRequested = false;
    this.fireRequested = false;
    this.storyToggleRequested = false;
    this.isDragging = false;
  }
}

export default InputManager;
