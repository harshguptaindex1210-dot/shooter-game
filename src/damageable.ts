import * as THREE from 'three';

export interface Damageable {
  id: string;
  position: THREE.Vector3;
  health: number;
  maxHealth: number;
  alive: boolean;
  capsuleHeight: number;
  capsuleRadius: number;
  takeDamage: (amount: number, hitZone?: string) => void;
  respawn: (pos?: THREE.Vector3) => void;
}

export function createDamageable(id: string, pos: THREE.Vector3, maxHp: number = 100): Damageable {
  const position = pos.clone();
  let health = maxHp;
  let alive = true;

  return {
    id,
    position,
    get health() {
      return health;
    },
    get maxHealth() {
      return maxHp;
    },
    get alive() {
      return alive;
    },
    capsuleHeight: 1.8,
    capsuleRadius: 0.4,
    takeDamage(amount: number) {
      if (!alive || amount <= 0) return;
      health = Math.max(0, health - amount);
      if (health <= 0) alive = false;
    },
    respawn(pos?: THREE.Vector3) {
      health = maxHp;
      alive = true;
      if (pos) position.copy(pos);
    },
  };
}
