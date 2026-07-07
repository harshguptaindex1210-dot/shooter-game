import * as THREE from 'three';

export type WeaponType = 'rifle' | 'pistol' | 'grenade';

export interface WeaponDef {
  type: WeaponType;
  damage: number;
  fireRate: number;
  magSize: number;
  reloadTime: number;
  spread: number;
  recoil: number;
  range: number;
  projectileSpeed?: number;
  aoeRadius?: number;
  isProjectile: boolean;
}

export const WEAPON_DEFS: Record<WeaponType, WeaponDef> = {
  rifle: {
    type: 'rifle',
    damage: 25,
    fireRate: 0.1,
    magSize: 30,
    reloadTime: 2,
    spread: 0.02,
    recoil: 0.03,
    range: 500,
    isProjectile: false,
  },
  pistol: {
    type: 'pistol',
    damage: 18,
    fireRate: 0.25,
    magSize: 15,
    reloadTime: 1.5,
    spread: 0.04,
    recoil: 0.05,
    range: 300,
    isProjectile: false,
  },
  grenade: {
    type: 'grenade',
    damage: 100,
    fireRate: 0.8,
    magSize: 1,
    reloadTime: 3,
    spread: 0.1,
    recoil: 0.1,
    range: 80,
    projectileSpeed: 20,
    aoeRadius: 5,
    isProjectile: true,
  },
};

export interface WeaponState {
  def: WeaponDef;
  ammo: number;
  lastFireTime: number;
  reloading: boolean;
  reloadStart: number;
  recoilAccum: number;
}

export function createWeapon(type: WeaponType): WeaponState {
  const def = WEAPON_DEFS[type];
  return {
    def,
    ammo: def.magSize,
    lastFireTime: -def.fireRate,
    reloading: false,
    reloadStart: 0,
    recoilAccum: 0,
  };
}

export interface FireResult {
  hit: boolean;
  damage: number;
  position: THREE.Vector3;
  hitZone?: 'head' | 'body' | 'limb';
  entityId?: string;
}

export function fireWeapon(
  weapon: WeaponState,
  origin: THREE.Vector3,
  direction: THREE.Vector3,
  targets: { id: string; position: THREE.Vector3; capsuleHeight: number; capsuleRadius: number }[],
  time: number
): FireResult[] {
  const results: FireResult[] = [];

  if (weapon.reloading) return results;
  if (time - weapon.lastFireTime < weapon.def.fireRate) return results;
  if (weapon.ammo <= 0) return results;

  weapon.lastFireTime = time;
  weapon.ammo--;
  weapon.recoilAccum += weapon.def.recoil;

  if (weapon.def.isProjectile) {
    const end = origin.clone().add(direction.clone().multiplyScalar(weapon.def.range));
    const closest = findClosestHit(origin, end, targets);
    if (closest) {
      const dz = getDamageZone(origin, closest.position, closest.capsuleHeight);
      results.push({
        hit: true,
        damage: dz.mult * weapon.def.damage,
        position: closest.position.clone(),
        hitZone: dz.zone,
        entityId: closest.id,
      });
      if (weapon.def.aoeRadius) {
        for (const t of targets) {
          if (
            t.id !== closest.id &&
            t.position.distanceTo(closest.position) <= weapon.def.aoeRadius!
          ) {
            results.push({
              hit: true,
              damage: weapon.def.damage * 0.5,
              position: t.position.clone(),
              hitZone: 'body',
              entityId: t.id,
            });
          }
        }
      }
    }
    return results;
  }

  const spreadAngle = (Math.random() - 0.5) * weapon.def.spread * 2;
  const spreadDir = direction.clone();
  const up = new THREE.Vector3(0, 1, 0);
  const right = new THREE.Vector3().crossVectors(spreadDir, up).normalize();
  const spreadUp = new THREE.Vector3().crossVectors(right, spreadDir).normalize();
  spreadDir.applyAxisAngle(spreadUp, spreadAngle);
  spreadDir.applyAxisAngle(right, (Math.random() - 0.5) * weapon.def.spread * 2);

  const end = origin.clone().add(spreadDir.clone().multiplyScalar(weapon.def.range));
  const closest = findClosestHit(origin, end, targets);
  if (closest) {
    const dz = getDamageZone(origin, closest.position, closest.capsuleHeight);
    results.push({
      hit: true,
      damage: dz.mult * weapon.def.damage,
      position: closest.position.clone(),
      hitZone: dz.zone,
      entityId: closest.id,
    });
  }

  return results;
}

export function reloadWeapon(weapon: WeaponState, time: number): boolean {
  if (weapon.reloading || weapon.ammo === weapon.def.magSize) return false;
  weapon.reloading = true;
  weapon.reloadStart = time;
  return true;
}

export function updateReload(weapon: WeaponState, time: number) {
  if (!weapon.reloading) return;
  if (time - weapon.reloadStart >= weapon.def.reloadTime) {
    weapon.ammo = weapon.def.magSize;
    weapon.reloading = false;
    weapon.recoilAccum = 0;
  }
}

function findClosestHit(
  origin: THREE.Vector3,
  end: THREE.Vector3,
  targets: { id: string; position: THREE.Vector3; capsuleHeight: number; capsuleRadius: number }[]
): { id: string; position: THREE.Vector3; capsuleHeight: number; capsuleRadius: number } | null {
  let closest: {
    id: string;
    position: THREE.Vector3;
    capsuleHeight: number;
    capsuleRadius: number;
  } | null = null;
  let closestDist = Infinity;
  const dir = end.clone().sub(origin).normalize();
  const maxDist = origin.distanceTo(end);

  for (const t of targets) {
    const toTarget = t.position.clone().sub(origin);
    const proj = toTarget.dot(dir);
    if (proj < 0 || proj > maxDist) continue;
    const closestPt = origin.clone().add(dir.clone().multiplyScalar(proj));
    const dist = closestPt.distanceTo(t.position);
    if (dist <= t.capsuleRadius && proj < closestDist) {
      closestDist = proj;
      closest = t;
    }
  }

  return closest;
}

function getDamageZone(
  origin: THREE.Vector3,
  targetPos: THREE.Vector3,
  height: number
): { zone: 'head' | 'body' | 'limb'; mult: number } {
  const hitY = origin.y;
  const baseY = targetPos.y - height / 2;
  const relY = hitY - baseY;
  const ratio = relY / height;
  if (ratio > 0.75) return { zone: 'head', mult: 2 };
  if (ratio > 0.3) return { zone: 'body', mult: 1 };
  return { zone: 'limb', mult: 0.5 };
}
