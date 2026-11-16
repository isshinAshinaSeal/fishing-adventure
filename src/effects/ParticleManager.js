// ParticleManager: Procedural particle effects (water splashes, boat wakes, catch confetti).
// Object pooling ensures deterministic performance and 0 memory leaks across long sessions.

import * as THREE from 'three';

export class ParticleManager {
  constructor(scene = null, maxParticles = 120) {
    this.scene = scene;
    this.maxParticles = maxParticles;
    this.pool = [];
    this.activeParticles = [];

    this.container = new THREE.Group();
    this.container.name = 'ParticleSystemContainer';
    if (this.scene) {
      this.scene.add(this.container);
    }

    this._initPool();
  }

  _initPool() {
    const geom = new THREE.SphereGeometry(0.08, 4, 4);
    const mat = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.9,
    });

    for (let i = 0; i < this.maxParticles; i++) {
      const mesh = new THREE.Mesh(geom, mat.clone());
      mesh.visible = false;
      this.container.add(mesh);
      this.pool.push({
        mesh,
        position: new THREE.Vector3(),
        velocity: new THREE.Vector3(),
        gravity: -9.8,
        drag: 0.98,
        life: 0,
        maxLife: 1.0,
        active: false,
      });
    }
  }

  _acquireParticle() {
    for (const p of this.pool) {
      if (!p.active) {
        p.active = true;
        p.mesh.visible = true;
        this.activeParticles.push(p);
        return p;
      }
    }
    // Recycle oldest active particle if pool exhausted
    if (this.activeParticles.length > 0) {
      return this.activeParticles[0];
    }
    return null;
  }

  /**
   * Spawns radiant water droplet splash when casting or bobber hits water.
   */
  spawnSplash(position, count = 12) {
    if (!position) return;
    for (let i = 0; i < count; i++) {
      const p = this._acquireParticle();
      if (!p) break;

      p.position.set(
        position.x + (Math.random() - 0.5) * 0.3,
        position.y + 0.1,
        position.z + (Math.random() - 0.5) * 0.3
      );
      const angle = Math.random() * Math.PI * 2;
      const speed = 1.8 + Math.random() * 2.2;
      p.velocity.set(
        Math.cos(angle) * speed * 0.5,
        2.5 + Math.random() * 2.0,
        Math.sin(angle) * speed * 0.5
      );
      p.gravity = -12.0;
      p.drag = 0.96;
      p.life = 0.6 + Math.random() * 0.4;
      p.maxLife = p.life;
      p.mesh.material.color.setHex(0xaae8f5);
      p.mesh.scale.setScalar(1.0);
    }
  }

  /**
   * Spawns trailing bubbly boat wake behind active vessels.
   */
  spawnBoatWake(position, count = 4) {
    if (!position) return;
    for (let i = 0; i < count; i++) {
      const p = this._acquireParticle();
      if (!p) break;

      p.position.set(
        position.x + (Math.random() - 0.5) * 0.8,
        position.y + 0.05,
        position.z + (Math.random() - 0.5) * 0.8
      );
      p.velocity.set(
        (Math.random() - 0.5) * 0.4,
        0.1,
        (Math.random() - 0.5) * 0.4
      );
      p.gravity = 0.0;
      p.drag = 0.92;
      p.life = 0.8 + Math.random() * 0.5;
      p.maxLife = p.life;
      p.mesh.material.color.setHex(0xffffff);
      p.mesh.scale.setScalar(1.2);
    }
  }

  /**
   * Spawns celebratory golden catch sparkles.
   */
  spawnCatchConfetti(position, count = 16) {
    if (!position) return;
    const colors = [0xffd700, 0x38bdf8, 0xec4899, 0x10b981];

    for (let i = 0; i < count; i++) {
      const p = this._acquireParticle();
      if (!p) break;

      p.position.set(position.x, position.y + 1.2, position.z);
      const angle = Math.random() * Math.PI * 2;
      const speed = 2.0 + Math.random() * 2.5;
      p.velocity.set(
        Math.cos(angle) * speed,
        3.0 + Math.random() * 2.5,
        Math.sin(angle) * speed
      );
      p.gravity = -8.0;
      p.drag = 0.95;
      p.life = 1.0 + Math.random() * 0.5;
      p.maxLife = p.life;
      p.mesh.material.color.setHex(colors[i % colors.length]);
      p.mesh.scale.setScalar(1.4);
    }
  }

  update(dt) {
    for (let i = this.activeParticles.length - 1; i >= 0; i--) {
      const p = this.activeParticles[i];
      p.life -= dt;

      if (p.life <= 0) {
        p.active = false;
        p.mesh.visible = false;
        this.activeParticles.splice(i, 1);
        continue;
      }

      // Physics integration
      p.velocity.y += p.gravity * dt;
      p.velocity.x *= p.drag;
      p.velocity.z *= p.drag;

      p.position.x += p.velocity.x * dt;
      p.position.y += p.velocity.y * dt;
      p.position.z += p.velocity.z * dt;

      // Update mesh
      p.mesh.position.copy(p.position);
      const alpha = Math.max(0, p.life / p.maxLife);
      p.mesh.material.opacity = alpha * 0.85;
      p.mesh.scale.setScalar(alpha);
    }
  }

  getActiveCount() {
    return this.activeParticles.length;
  }

  reset() {
    for (const p of this.pool) {
      p.active = false;
      p.mesh.visible = false;
    }
    this.activeParticles = [];
  }
}

export default ParticleManager;
