import * as THREE from 'three';

export interface InputFrame {
  seq: number;
  forward: boolean;
  backward: boolean;
  left: boolean;
  right: boolean;
  sprint: boolean;
  jump: boolean;
  aim: boolean;
  mouseX: number;
  mouseY: number;
  fire: boolean;
}

export interface Snapshot {
  tick: number;
  entities: Record<string, { pos: THREE.Vector3; vel: THREE.Vector3; health: number }>;
}

export interface EntityState {
  pos: THREE.Vector3;
  vel: THREE.Vector3;
  health: number;
}

export class RollbackEngine {
  tick = 0;
  inputs: InputFrame[] = [];
  snapshots: Snapshot[] = [];
  localState: EntityState;
  predictedStates: EntityState[] = [];

  constructor(
    public entityId: string,
    startPos: THREE.Vector3
  ) {
    this.localState = { pos: startPos.clone(), vel: new THREE.Vector3(), health: 100 };
  }

  applyInput(input: InputFrame, dt: number, groundY: number) {
    this.inputs.push(input);
    const speed = input.sprint ? 9 : 6;
    const forward = new THREE.Vector3(0, 0, -1);
    const right = new THREE.Vector3(1, 0, 0);
    const move = new THREE.Vector3();
    if (input.forward) move.add(forward);
    if (input.backward) move.sub(forward);
    if (input.left) move.sub(right);
    if (input.right) move.add(right);
    if (move.length() > 0) move.normalize().multiplyScalar(speed);

    this.localState.vel.x = move.x;
    this.localState.vel.z = move.z;
    if (input.jump && this.localState.pos.y <= groundY + 0.9) {
      this.localState.vel.y = 5;
    }
    this.localState.vel.y -= 20 * dt;

    this.localState.pos.x += this.localState.vel.x * dt;
    this.localState.pos.y += this.localState.vel.y * dt;
    this.localState.pos.z += this.localState.vel.z * dt;

    if (this.localState.pos.y < groundY + 0.9) {
      this.localState.pos.y = groundY + 0.9;
      this.localState.vel.y = 0;
    }

    this.tick++;
  }

  applySnapshot(snapshot: Snapshot) {
    this.snapshots.push(snapshot);
    const serverEnt = snapshot.entities[this.entityId];
    if (!serverEnt) return;

    const local = this.localState;
    const server = serverEnt;
    const diff = local.pos.distanceTo(server.pos);

    if (diff > 0.5) {
      local.pos.copy(server.pos);
      local.vel.copy(server.vel);
      local.health = server.health;

      const staleInputs = this.inputs.filter((i) => i.seq > snapshot.tick);
      for (const inp of staleInputs) {
        this.applyInput(inp, 1 / 20, 0);
      }
    }
  }
}

export function createBotInput(
  seq: number,
  targetPos: THREE.Vector3,
  currentPos: THREE.Vector3
): InputFrame {
  const dx = targetPos.x - currentPos.x;
  const dz = targetPos.z - currentPos.z;
  return {
    seq,
    forward: dz < 0,
    backward: dz > 0,
    left: dx < 0,
    right: dx > 0,
    sprint: false,
    jump: false,
    aim: false,
    mouseX: 0,
    mouseY: 0,
    fire: false,
  };
}
