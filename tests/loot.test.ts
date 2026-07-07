import { describe, it, expect } from 'vitest';
import * as THREE from 'three';
import { generateLoot, collectLoot } from '../src/loot';

describe('loot system', () => {
  it('generates loot at POIs', () => {
    const scene = new THREE.Scene();
    const pois = [
      { name: 'Town', position: new THREE.Vector3(300, 0, 0) },
      { name: 'Factory', position: new THREE.Vector3(0, 0, 300) },
    ];
    const spawns = generateLoot(scene, pois);
    expect(spawns.length).toBeGreaterThanOrEqual(4);
  });

  it('collects loot within range', () => {
    const scene = new THREE.Scene();
    const pois = [{ name: 'Town', position: new THREE.Vector3(0, 0, 0) }];
    const spawns = generateLoot(scene, pois);
    const playerPos = spawns[0].position.clone();
    const loot = collectLoot(spawns, playerPos, 5);
    expect(loot).not.toBeNull();
    expect(spawns[0].collected).toBe(true);
  });

  it('returns null when no loot in range', () => {
    const scene = new THREE.Scene();
    const pois = [{ name: 'Town', position: new THREE.Vector3(0, 0, 0) }];
    const spawns = generateLoot(scene, pois);
    const loot = collectLoot(spawns, new THREE.Vector3(999, 0, 999), 2);
    expect(loot).toBeNull();
  });
});
