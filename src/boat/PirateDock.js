// PirateDock: the physical corsair pier where Quartermaster Sable sells the
// pirate fleet. It is a real interactable world landmark, not a menu shortcut.

import * as THREE from 'three';
import { Interactable } from '../interaction/Interactable.js';

export class PirateDock extends Interactable {
  constructor(options = {}) {
    super({
      id: options.id || 'pirate_dock',
      name: options.name || 'Corsair Dock',
      type: 'pirate_dock',
      promptAction: options.promptAction || 'Trade at',
      interactionRange: options.interactionRange || 4.5,
      position: options.position || { x: -26, y: 0, z: -16 },
      onInteract: options.onInteract || null,
    });

    this.mesh = this._createMesh();
  }

  _createMesh() {
    const group = new THREE.Group();
    group.name = 'PirateDock';
    group.position.copy(this.position);

    const timber = new THREE.MeshLambertMaterial({ color: 0x4b2f21 });
    const deck = new THREE.MeshLambertMaterial({ color: 0x795337 });
    const dark = new THREE.MeshLambertMaterial({ color: 0x241811 });
    const red = new THREE.MeshLambertMaterial({ color: 0x8b1e1e });
    const bone = new THREE.MeshLambertMaterial({ color: 0xe8dfc8 });
    const gold = new THREE.MeshLambertMaterial({ color: 0xd9a441 });

    // Broad landing deck with a step down toward the beach.
    const platform = new THREE.Mesh(new THREE.BoxGeometry(9.0, 0.35, 6.2), deck);
    platform.position.y = 0.25;
    platform.castShadow = true;
    platform.receiveShadow = true;
    group.add(platform);

    const step = new THREE.Mesh(new THREE.BoxGeometry(5.0, 0.28, 2.2), timber);
    step.position.set(0, 0.08, 4.0);
    group.add(step);

    for (let x = -4.0; x <= 4.0; x += 2.0) {
      for (const z of [-2.5, 2.5]) {
        const pile = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.24, 2.8, 7), dark);
        pile.position.set(x, -1.0, z);
        pile.castShadow = true;
        group.add(pile);
      }
    }

    // Railings and bollards.
    const railGeom = new THREE.BoxGeometry(0.16, 0.16, 5.6);
    for (const x of [-4.35, 4.35]) {
      const rail = new THREE.Mesh(railGeom, timber);
      rail.position.set(x, 1.25, 0);
      group.add(rail);
      for (const z of [-2.5, 0, 2.5]) {
        const post = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.11, 1.1, 7), timber);
        post.position.set(x, 0.8, z);
        group.add(post);
      }
    }

    for (const x of [-3.2, 3.2]) {
      const bollard = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.23, 0.65, 8), dark);
      bollard.position.set(x, 0.65, 2.25);
      group.add(bollard);
    }

    // Pirate mast and black flag.
    const mast = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.18, 7.2, 8), timber);
    mast.position.set(3.2, 3.7, -1.5);
    mast.castShadow = true;
    group.add(mast);

    const flag = new THREE.Mesh(new THREE.PlaneGeometry(2.5, 1.35), new THREE.MeshLambertMaterial({ color: 0x17181d, side: THREE.DoubleSide }));
    flag.position.set(1.95, 6.45, -1.5);
    flag.rotation.y = Math.PI * 0.45;
    group.add(flag);

    const skull = new THREE.Mesh(new THREE.BoxGeometry(0.44, 0.4, 0.08), bone);
    skull.position.set(1.95, 6.55, -1.43);
    skull.rotation.y = Math.PI * 0.45;
    group.add(skull);

    const crossboneGeom = new THREE.BoxGeometry(0.85, 0.09, 0.08);
    for (const angle of [-0.6, 0.6]) {
      const boneBar = new THREE.Mesh(crossboneGeom, bone);
      boneBar.position.set(1.95, 6.12, -1.42);
      boneBar.rotation.set(0, Math.PI * 0.45, angle);
      group.add(boneBar);
    }

    // Counter, chests and lantern glow.
    const counter = new THREE.Mesh(new THREE.BoxGeometry(3.6, 1.0, 1.1), timber);
    counter.position.set(-1.9, 0.9, 1.3);
    counter.castShadow = true;
    group.add(counter);

    const awning = new THREE.Mesh(new THREE.BoxGeometry(4.4, 0.12, 2.3), red);
    awning.position.set(-1.9, 2.45, 1.25);
    awning.rotation.x = 0.12;
    group.add(awning);
    for (const x of [-3.8, 0.0]) {
      for (const z of [0.4, 2.1]) {
        const post = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.07, 2.35, 6), timber);
        post.position.set(x, 1.35, z);
        group.add(post);
      }
    }

    const chest = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.75, 0.85), timber);
    chest.position.set(2.1, 0.8, 0.9);
    group.add(chest);
    const chestBand = new THREE.Mesh(new THREE.BoxGeometry(1.25, 0.08, 0.9), gold);
    chestBand.position.set(2.1, 0.93, 0.9);
    group.add(chestBand);

    const lanternMat = new THREE.MeshBasicMaterial({ color: 0xffc857 });
    for (const position of [[-3.8, 2.55, 2.0], [3.9, 2.55, 1.8]]) {
      const lantern = new THREE.Mesh(new THREE.SphereGeometry(0.16, 8, 8), lanternMat);
      lantern.position.set(position[0], position[1], position[2]);
      group.add(lantern);
      const light = new THREE.PointLight(0xffb347, 1.2, 14);
      light.position.copy(lantern.position);
      group.add(light);
    }

    // A billboard sign that stays readable from the harbor path.
    if (typeof document !== 'undefined') {
      const canvas = document.createElement('canvas');
      canvas.width = 640;
      canvas.height = 180;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = 'rgba(16, 10, 7, 0.92)';
        ctx.strokeStyle = '#d9a441';
        ctx.lineWidth = 7;
        ctx.beginPath();
        ctx.roundRect(12, 12, canvas.width - 24, canvas.height - 24, 24);
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = '#ffc857';
        ctx.font = 'bold 24px "Trebuchet MS", sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('☠  CORSAIR DOCK  ☠', canvas.width / 2, 62);
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 43px "Trebuchet MS", sans-serif';
        ctx.fillText('PIRATE VESSELS', canvas.width / 2, 120);
        ctx.fillStyle = '#c9b18a';
        ctx.font = '21px "Trebuchet MS", sans-serif';
        ctx.fillText('Quartermaster Sable · 50 / 150 / 400 coins', canvas.width / 2, 152);
        const texture = new THREE.CanvasTexture(canvas);
        texture.minFilter = THREE.LinearFilter;
        if ('colorSpace' in texture) texture.colorSpace = THREE.SRGBColorSpace;
        const sprite = new THREE.Sprite(new THREE.SpriteMaterial({
          map: texture,
          transparent: true,
          depthTest: false,
          depthWrite: false,
        }));
        sprite.position.set(0, 6.9, 0.2);
        sprite.scale.set(12.5, 3.5, 1);
        sprite.renderOrder = 25;
        group.add(sprite);
      }
    }

    return group;
  }
}

export default PirateDock;
