// BossManager: giant sea boss encounters with live phases, ship attacks,
// vulnerability windows, cannon damage resolution, HUD data and rewards.

import * as THREE from 'three';
import { BossDefinitions } from '../expansion/content.js';

const PHASE_SECONDS = 7;

export class BossManager {
  constructor() {
    this.activeBoss = null;
    this.records = {};
    this.onNotification = null;
    this.onPhase = null;
    this.onAttack = null;
    this.onDefeat = null;
    this.onFail = null;
    this.onChange = null;
  }

  getBosses() {
    return BossDefinitions.map((def) => ({
      ...def,
      record: this.records[def.id] || null,
    }));
  }

  getBossDef(id) {
    return BossDefinitions.find((b) => b.id === id) || null;
  }

  startEncounter(bossId, boat, scene, player = null) {
    if (this.activeBoss) return { success: false, reason: 'A boss encounter is already active' };
    const def = this.getBossDef(bossId);
    if (!def) return { success: false, reason: 'Unknown boss' };
    if (!boat) return { success: false, reason: 'You need an active ship to fight a world boss' };
    if (boat.health <= 0) return { success: false, reason: 'Repair your ship first' };

    const boss = {
      definition: def,
      health: def.maxHealth,
      maxHealth: def.maxHealth,
      phase: 1,
      phaseTimer: 0,
      attackTimer: def.attackInterval,
      elapsed: 0,
      vulnerability: false,
      slowRemaining: 0,
      interrupted: false,
      captureProgress: 0,
      contributions: 0,
      position: new THREE.Vector3(boat.position.x, 0, boat.position.z - 34),
      orbitAngle: Math.PI,
      mesh: null,
    };
    boss.mesh = this._createBossMesh(def);
    boss.mesh.position.copy(boss.position);
    if (scene) scene.add(boss.mesh);
    this.activeBoss = boss;

    if (typeof this.onNotification === 'function') {
      this.onNotification(`${def.name} has surfaced! ${def.title} — ${def.location}`);
    }
    this._changed();
    return { success: true, boss: this.getHudState(boat) };
  }

  _createBossMesh(def) {
    const group = new THREE.Group();
    group.name = `Boss_${def.id}`;
    const color = def.id.includes('kraken') ? 0x5d2a6e
      : def.id.includes('serpent') ? 0x3f7f6f
      : def.id.includes('emperor') ? 0xf2c14e
      : 0x1f5f7a;
    const bodyMat = new THREE.MeshLambertMaterial({ color });
    const eyeMat = new THREE.MeshBasicMaterial({ color: 0xffdd55 });
    const darkMat = new THREE.MeshLambertMaterial({ color: new THREE.Color(color).multiplyScalar(0.55) });

    const body = new THREE.Mesh(new THREE.SphereGeometry(2.4, 14, 12), bodyMat);
    body.scale.set(1.5, 1.0, 2.8);
    group.add(body);
    const head = new THREE.Mesh(new THREE.SphereGeometry(1.6, 12, 10), bodyMat);
    head.position.set(0, 0.6, 4.4);
    group.add(head);

    for (const side of [-1, 1]) {
      const eye = new THREE.Mesh(new THREE.SphereGeometry(0.24, 8, 8), eyeMat);
      eye.position.set(side * 0.8, 1.0, 5.6);
      group.add(eye);
    }

    if (def.id.includes('kraken')) {
      for (let i = 0; i < 8; i++) {
        const tentacle = new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.7, 7, 8), darkMat);
        const angle = (i / 8) * Math.PI * 2;
        tentacle.position.set(Math.cos(angle) * 3.3, -1.8, -1 + Math.sin(angle) * 2);
        tentacle.rotation.z = Math.cos(angle) * 0.55;
        tentacle.rotation.x = Math.sin(angle) * 0.55;
        tentacle.userData.base = { x: tentacle.rotation.x, z: tentacle.rotation.z };
        group.add(tentacle);
        if (!group.userData.tentacles) group.userData.tentacles = [];
        group.userData.tentacles.push(tentacle);
      }
    } else {
      const dorsal = new THREE.Mesh(new THREE.ConeGeometry(0.8, 2.8, 5), darkMat);
      dorsal.position.set(0, 2.2, -0.4);
      group.add(dorsal);
      const tail = new THREE.Mesh(new THREE.ConeGeometry(1.4, 5, 6), bodyMat);
      tail.rotation.x = Math.PI / 2;
      tail.position.z = -7.4;
      group.add(tail);
      group.userData.tail = tail;
    }

    const glow = new THREE.PointLight(0x66ccff, 1.0, 18);
    glow.position.set(0, 1, 3);
    group.add(glow);
    group.scale.setScalar(2.1);
    return group;
  }

  update(dt, boat) {
    const boss = this.activeBoss;
    if (!boss || !boat) return;
    boss.elapsed += dt;
    boss.phaseTimer += dt;
    if (boss.slowRemaining > 0) boss.slowRemaining = Math.max(0, boss.slowRemaining - dt);

    const phaseWindow = Math.floor(boss.phaseTimer / PHASE_SECONDS);
    const nextPhase = Math.min(5, 1 + phaseWindow);
    if (nextPhase !== boss.phase) {
      boss.phase = nextPhase;
      boss.vulnerability = boss.phase === 4;
      if (typeof this.onPhase === 'function') this.onPhase(boss.phase, boss.definition.phaseNames[boss.phase - 1]);
      if (typeof this.onNotification === 'function') {
        this.onNotification(`Phase ${boss.phase}: ${boss.definition.phaseNames[boss.phase - 1]}`);
      }
      this._changed();
    }

    // Boss circles the ship; slowed creatures orbit more slowly.
    const orbitSpeed = (0.22 + boss.phase * 0.025) * (boss.slowRemaining > 0 ? 0.45 : 1);
    boss.orbitAngle += dt * orbitSpeed;
    const radius = 26 + Math.sin(boss.elapsed * 0.4) * 5;
    boss.position.x = boat.position.x + Math.sin(boss.orbitAngle) * radius;
    boss.position.z = boat.position.z + Math.cos(boss.orbitAngle) * radius;
    boss.position.y = -0.4 + Math.sin(boss.elapsed * 0.8) * 0.5;
    if (boss.mesh) {
      boss.mesh.position.copy(boss.position);
      let yaw = Math.atan2(boat.position.x - boss.position.x, boat.position.z - boss.position.z);
      boss.mesh.rotation.y += (yaw - boss.mesh.rotation.y) * Math.min(1, dt * 1.5);
      boss.mesh.position.y += Math.sin(boss.elapsed * 1.2) * 0.2;
      if (boss.mesh.userData.tail) boss.mesh.userData.tail.rotation.z = Math.sin(boss.elapsed * 2.2) * 0.25;
      if (boss.mesh.userData.tentacles) {
        boss.mesh.userData.tentacles.forEach((t, i) => {
          t.rotation.x = t.userData.base.x + Math.sin(boss.elapsed * 1.5 + i) * 0.2;
          t.rotation.z = t.userData.base.z + Math.cos(boss.elapsed * 1.2 + i) * 0.18;
        });
      }
    }

    // Attack the ship. Vulnerability phases are safer; special phases hit harder.
    boss.attackTimer -= dt;
    if (boss.attackTimer <= 0 && !boss.vulnerability && boat.health > 0) {
      boss.attackTimer = boss.definition.attackInterval;
      const multiplier = boss.phase === 3 ? 1.6 : boss.phase === 5 ? 1.35 : 1;
      const stability = boss.lastStability || 0;
      const damage = Math.round(boss.definition.shipDamage * multiplier * (1 - stability));
      boat.health = Math.max(0, boat.health - damage);
      if (typeof this.onAttack === 'function') {
        this.onAttack({ damage, health: boat.health, maxHealth: boat.maxHealth, phase: boss.phase });
      }
      if (typeof this.onNotification === 'function') this.onNotification(`${boss.definition.name} strikes the hull for ${damage} damage!`);
      if (boss.health <= 0) this._defeat(boat);
      else if (boat.health <= 0) this._fail(boat);
    }
  }

  /**
   * Resolves cannon damage against the active boss. Called after CannonManager.fire.
   */
  applyDamage(amount, ammoDef = null, options = {}) {
    const boss = this.activeBoss;
    if (!boss) return { success: false, reason: 'No active boss' };
    const ammo = ammoDef || { damageMul: 1 };
    let damage = amount * (ammo.damageMul || 1);
    if (boss.vulnerability) damage *= 1.8;
    if (ammo.pierce && boss.vulnerability) damage *= 1.15;
    if (ammo.bossArmor && boss.phase >= 4) damage *= 1.2;
    if (boss.definition.id.includes('emperor') && boss.phase <= 2) damage *= 0.7;
    if (options.capture) {
      boss.captureProgress = Math.min(100, boss.captureProgress + 8);
      damage *= 0.25;
    }
    damage = Math.max(1, Math.round(damage));
    boss.health = Math.max(0, boss.health - damage);
    boss.contributions += damage;
    if (ammo.slow) boss.slowRemaining = 4;
    if (ammo.interrupt) boss.interrupted = true;
    if (options.stability) boss.lastStability = options.stability;

    if (typeof this.onNotification === 'function') {
      this.onNotification(`${boss.vulnerability ? 'Vulnerable hit! ' : ''}${damage} damage to ${boss.definition.name}`);
    }
    if (boss.health <= 0) {
      this._defeat(options.boat || null);
    }
    this._changed();
    return {
      success: true,
      damage,
      health: boss.health,
      maxHealth: boss.maxHealth,
      defeated: boss.health <= 0,
      captureProgress: boss.captureProgress,
    };
  }

  _cleanupMesh() {
    if (this.activeBoss && this.activeBoss.mesh && this.activeBoss.mesh.parent) {
      this.activeBoss.mesh.parent.remove(this.activeBoss.mesh);
    }
  }

  _defeat(boat) {
    const boss = this.activeBoss;
    if (!boss) return;
    const def = boss.definition;
    const now = Date.now();
    const record = this.records[def.id] || { defeats: 0, firstDefeatedAt: now, bestTime: null };
    record.defeats++;
    record.lastDefeatedAt = now;
    record.bestTime = record.bestTime === null ? boss.elapsed : Math.min(record.bestTime, boss.elapsed);
    this.records[def.id] = record;
    this._cleanupMesh();
    this.activeBoss = null;
    if (typeof this.onNotification === 'function') {
      this.onNotification(`${def.name} defeated! ${def.rewards.coins} coins and a boss record awarded.`);
    }
    if (typeof this.onDefeat === 'function') {
      this.onDefeat({ boss: def, record, duration: boss.elapsed, boat });
    }
    this._changed();
  }

  _fail() {
    const boss = this.activeBoss;
    if (!boss) return;
    this._cleanupMesh();
    this.activeBoss = null;
    if (typeof this.onNotification === 'function') {
      this.onNotification(`Your ship was crippled by ${boss.definition.name}. Repair and try again.`);
    }
    if (typeof this.onFail === 'function') this.onFail({ boss: boss.definition });
    this._changed();
  }

  retreat() {
    if (!this.activeBoss) return { success: false, reason: 'No active encounter' };
    const name = this.activeBoss.definition.name;
    this._cleanupMesh();
    this.activeBoss = null;
    if (typeof this.onNotification === 'function') this.onNotification(`Retreated from ${name}`);
    this._changed();
    return { success: true };
  }

  getHudState(boat = null) {
    if (!this.activeBoss) return null;
    const boss = this.activeBoss;
    return {
      id: boss.definition.id,
      name: boss.definition.name,
      title: boss.definition.title,
      phase: boss.phase,
      phaseName: boss.definition.phaseNames[boss.phase - 1],
      vulnerability: boss.vulnerability,
      health: boss.health,
      maxHealth: boss.maxHealth,
      healthPercent: Math.round((boss.health / boss.maxHealth) * 100),
      shipHealth: boat ? boat.health : 0,
      shipMaxHealth: boat ? boat.maxHealth : 0,
      shipPercent: boat && boat.maxHealth ? Math.round((boat.health / boat.maxHealth) * 100) : 0,
      duration: Number(boss.elapsed.toFixed(1)),
      contributions: boss.contributions,
      slowRemaining: Number(boss.slowRemaining.toFixed(1)),
    };
  }

  serialize() {
    return { records: JSON.parse(JSON.stringify(this.records)) };
  }

  deserialize(data) {
    if (data && data.records) this.records = JSON.parse(JSON.stringify(data.records));
  }

  reset() {
    if (this.activeBoss) this._cleanupMesh();
    this.activeBoss = null;
    this.records = {};
  }

  _changed() {
    if (typeof this.onChange === 'function') this.onChange();
  }
}

export default BossManager;
