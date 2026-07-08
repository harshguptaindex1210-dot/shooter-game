import { describe, it, expect } from 'vitest';
import * as THREE from 'three';
import { createMeleeWeapon, startMeleeSwing, updateMeleeSwing, checkMeleeHit } from '../src/melee';

describe('melee weapons', () => {
  it('creates bat with correct stats', () => {
    const m = createMeleeWeapon('bat');
    expect(m.def.damage).toBe(40);
    expect(m.def.range).toBe(3);
    expect(m.def.cooldown).toBe(0.8);
  });

  it('creates knife with correct stats', () => {
    const m = createMeleeWeapon('knife');
    expect(m.def.damage).toBe(15);
    expect(m.def.range).toBe(1.5);
    expect(m.def.swingTime).toBe(0.15);
  });

  it('creates pan with correct stats', () => {
    const m = createMeleeWeapon('pan');
    expect(m.def.damage).toBe(25);
    expect(m.def.range).toBe(2);
  });

  it('starts swing when not on cooldown', () => {
    const m = createMeleeWeapon('bat');
    expect(startMeleeSwing(m, 1000)).toBe(true);
    expect(m.swinging).toBe(true);
  });

  it('rejects swing during cooldown', () => {
    const m = createMeleeWeapon('knife');
    startMeleeSwing(m, 1000);
    updateMeleeSwing(m, 1001);
    expect(startMeleeSwing(m, 1001)).toBe(false);
  });

  it('allows swing after cooldown expires', () => {
    const m = createMeleeWeapon('knife');
    startMeleeSwing(m, 1000);
    updateMeleeSwing(m, 1200);
    expect(startMeleeSwing(m, 1600)).toBe(true);
  });

  it('returns hit at end of swing', () => {
    const m = createMeleeWeapon('knife');
    startMeleeSwing(m, 1000);
    const result = updateMeleeSwing(m, 1000 + m.def.swingTime * 1000 + 1);
    expect(result).toBe('hit');
  });

  it('returns swinging during animation', () => {
    const m = createMeleeWeapon('bat');
    startMeleeSwing(m, 1000);
    const result = updateMeleeSwing(m, 1100);
    expect(result).toBe('swinging');
  });

  it('detects hit on nearby target in arc', () => {
    const m = createMeleeWeapon('bat');
    const attacker = new THREE.Vector3(0, 0, 0);
    const target = {
      id: 'bot',
      position: new THREE.Vector3(0, 0.9, -2),
      capsuleRadius: 0.4,
      capsuleHeight: 1.8,
    };
    const result = checkMeleeHit(m, attacker, 0, [target]);
    expect(result.hit).toBe(true);
    expect(result.targetId).toBe('bot');
    expect(result.damage).toBe(40);
  });

  it('misses target out of range', () => {
    const m = createMeleeWeapon('knife');
    const attacker = new THREE.Vector3(0, 0, 0);
    const target = {
      id: 'far',
      position: new THREE.Vector3(0, 0.9, -10),
      capsuleRadius: 0.4,
      capsuleHeight: 1.8,
    };
    const result = checkMeleeHit(m, attacker, 0, [target]);
    expect(result.hit).toBe(false);
  });

  it('misses target behind player', () => {
    const m = createMeleeWeapon('bat');
    const attacker = new THREE.Vector3(0, 0, 0);
    const target = {
      id: 'behind',
      position: new THREE.Vector3(0, 0.9, 3),
      capsuleRadius: 0.4,
      capsuleHeight: 1.8,
    };
    const result = checkMeleeHit(m, attacker, 0, [target]);
    expect(result.hit).toBe(false);
  });
});
