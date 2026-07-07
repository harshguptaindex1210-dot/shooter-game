import { describe, it, expect } from 'vitest';
import * as THREE from 'three';
import { ZoneSystem } from '../src/zone';

describe('zone system', () => {
  it('initializes with 5 phases', () => {
    const scene = new THREE.Scene();
    const z = new ZoneSystem(scene);
    expect(z.phases.length).toBe(5);
    expect(z.currentPhase).toBe(0);
  });

  it('damage starts at 1 and scales', () => {
    const scene = new THREE.Scene();
    const z = new ZoneSystem(scene);
    expect(z.getDamagePerSec()).toBe(1);
    z.update(200);
    expect(z.currentPhase).toBeGreaterThanOrEqual(1);
  });

  it('updates ring geometry', () => {
    const scene = new THREE.Scene();
    const z = new ZoneSystem(scene);
    z.update(1);
    expect(z.ring.geometry.attributes.position).toBeDefined();
  });

  it('detects inside zone', () => {
    const scene = new THREE.Scene();
    const z = new ZoneSystem(scene);
    expect(z.isOutsideZone(new THREE.Vector3(0, 0, 0))).toBe(false);
    expect(z.isOutsideZone(new THREE.Vector3(500, 0, 500))).toBe(true);
  });
});
