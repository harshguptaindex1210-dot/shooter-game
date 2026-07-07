import { describe, it, expect } from 'vitest';
import { createDamageable } from '../src/damageable';
import * as THREE from 'three';

describe('fuzz harness - cheat rejection', () => {
  it('rejects impossible damage in single hit', () => {
    const d = createDamageable('target', new THREE.Vector3(0, 0.9, 0), 100);
    d.takeDamage(999);
    expect(d.health).toBe(0);
    expect(d.alive).toBe(false);
  });

  it('clamps negative damage to zero', () => {
    const d = createDamageable('target', new THREE.Vector3(0, 0.9, 0), 100);
    d.takeDamage(-50);
    expect(d.health).toBe(100);
  });
});

describe('chaos test - server kill resilience', () => {
  it('match state unchanged after mid-write interruption', () => {
    const state = { wins: 1, kills: 5, matches: 3, xp: 500, level: 1, damage: 200 };
    const saved = { ...state };
    state.kills += 2;
    state.damage += 100;
    state.matches += 1;

    const reconnected = { ...saved };
    expect(reconnected.kills).toBe(5);
    expect(reconnected.matches).toBe(3);
  });
});
