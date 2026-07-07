import * as THREE from 'three';

export type VehicleType = 'sedan' | 'buggy';

export interface VehicleState {
  type: VehicleType;
  position: THREE.Vector3;
  rotation: number;
  speed: number;
  health: number;
  occupied: boolean;
}

const VEHICLE_DEFS = {
  sedan: { maxSpeed: 30, accel: 15, brake: 25, turnSpeed: 1.5, health: 200 },
  buggy: { maxSpeed: 40, accel: 20, brake: 20, turnSpeed: 2.0, health: 150 },
};

export function createVehicle(
  type: VehicleType,
  pos: THREE.Vector3
): { state: VehicleState; mesh: THREE.Group } {
  const def = VEHICLE_DEFS[type];
  const state: VehicleState = {
    type,
    position: pos.clone(),
    rotation: 0,
    speed: 0,
    health: def.health,
    occupied: false,
  };

  const group = new THREE.Group();
  group.position.copy(pos);

  const bodyMat = new THREE.MeshStandardMaterial({ color: type === 'sedan' ? 0xcc4444 : 0x44cc44 });
  const body = new THREE.Mesh(new THREE.BoxGeometry(2, 0.8, 4), bodyMat);
  body.position.y = 0.5;
  group.add(body);

  const wheelMat = new THREE.MeshStandardMaterial({ color: 0x222222 });
  for (let i = 0; i < 4; i++) {
    const wx = (i % 2 === 0 ? -1 : 1) * 1.1;
    const wz = i < 2 ? -1.3 : 1.3;
    const wheel = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.3, 0.2, 8), wheelMat);
    wheel.rotation.z = Math.PI / 2;
    wheel.position.set(wx, 0.3, wz * 1.5);
    group.add(wheel);
  }

  return { state, mesh: group };
}

export function updateVehicle(
  vehicle: VehicleState,
  throttle: number,
  steer: number,
  dt: number,
  groundY: number
) {
  const def = VEHICLE_DEFS[vehicle.type];
  if (throttle > 0) {
    vehicle.speed = Math.min(vehicle.speed + def.accel * dt, def.maxSpeed);
  } else if (throttle < 0) {
    vehicle.speed = Math.max(vehicle.speed - def.brake * dt, -def.maxSpeed * 0.3);
  } else {
    vehicle.speed *= 0.98;
    if (Math.abs(vehicle.speed) < 0.1) vehicle.speed = 0;
  }

  vehicle.rotation += steer * def.turnSpeed * dt * (vehicle.speed / def.maxSpeed);

  vehicle.position.x += Math.sin(vehicle.rotation) * vehicle.speed * dt;
  vehicle.position.z += Math.cos(vehicle.rotation) * vehicle.speed * dt;
  vehicle.position.y = groundY + 0.5;
}

export function findNearbyVehicle(
  vehicles: { state: VehicleState; mesh: THREE.Group }[],
  pos: THREE.Vector3,
  range: number = 3
): (typeof vehicles)[0] | null {
  for (const v of vehicles) {
    if (v.state.occupied) continue;
    if (v.state.position.distanceTo(pos) <= range) return v;
  }
  return null;
}
