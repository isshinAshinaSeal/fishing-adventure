import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { TerrainCollider } from '../src/world/TerrainCollider.js';
import { Config } from '../src/config.js';

describe('TerrainCollider — Analytical Heightfield & Continuous Collision', () => {
  const collider = new TerrainCollider(Config.world);

  test('TC-04.1: sampleHeight produces continuous, non-NaN elevations across world bounds', () => {
    const coords = [
      { x: 0, z: 0 },
      { x: 50, z: -30 },
      { x: -100, z: 80 },
      { x: 200, z: 200 },
      { x: -280, z: 0 },
      { x: 400, z: 400 },
    ];

    for (const { x, z } of coords) {
      const h = collider.sampleHeight(x, z);
      assert.strictEqual(typeof h, 'number', `Height at (${x}, ${z}) should be a number`);
      assert.ok(!Number.isNaN(h), `Height at (${x}, ${z}) must not be NaN`);
      assert.ok(Number.isFinite(h), `Height at (${x}, ${z}) must be finite`);
    }
  });

  test('TC-04.2: Island center is elevated above water level, and outer ocean reaches seabed', () => {
    const centerH = collider.sampleHeight(0, 0);
    assert.ok(
      centerH > Config.world.waterLevel + 2.0,
      `Island center elevation (${centerH}) should be well above water level (${Config.world.waterLevel})`
    );

    const offshoreH = collider.sampleHeight(Config.world.islandRadius + 100, 0);
    assert.ok(
      offshoreH < Config.world.waterLevel,
      `Offshore elevation (${offshoreH}) should be below water level`
    );
  });

  test('TC-04.3: sampleNormal produces unit-length vectors with upward orientation', () => {
    const normal = collider.sampleNormal(25, -25);
    const len = Math.hypot(normal.x, normal.y, normal.z);
    assert.ok(Math.abs(len - 1.0) < 0.001, `Normal length should be approximately 1.0 (got ${len})`);
    assert.ok(normal.y > 0.5, `Terrain normal Y component should point upward on walkable ground (got ${normal.y})`);
  });

  test('TC-04.4: resolveCollision prevents falling through terrain (void clamp)', () => {
    // Entity placed far below ground level
    const testPos = { x: 10, y: -999.0, z: 15 };
    const groundH = collider.sampleHeight(testPos.x, testPos.z);
    const result = collider.resolveCollision(testPos, 0.0);

    assert.strictEqual(result.grounded, true, 'Player below ground must be marked grounded upon collision');
    assert.strictEqual(testPos.y, groundH, 'Entity Y position must be clamped to ground elevation');
    assert.ok(result.penetration > 900, 'Penetration depth must reflect the previous underground depth');
  });

  test('TC-04.5: resolveCollision leaves airborne entities unaffected above ground', () => {
    const groundH = collider.sampleHeight(0, 0);
    const highPos = { x: 0, y: groundH + 15.0, z: 0 };
    const result = collider.resolveCollision(highPos, 0.0);

    assert.strictEqual(result.grounded, false, 'Entity high in air must not be marked grounded');
    assert.strictEqual(highPos.y, groundH + 15.0, 'Airborne entity Y coordinate must not change');
  });
});
