import * as THREE from 'three';

export interface ZonePhase {
  radius: number;
  damagePerSec: number;
  duration: number;
  center: THREE.Vector3;
}

export class ZoneSystem {
  phases: ZonePhase[] = [];
  currentPhase = 0;
  phaseTime = 0;
  totalTime = 0;
  finalCenter = new THREE.Vector3(0, 0, 0);
  ring: THREE.Mesh;
  ringPos = new THREE.Vector3(0, 50, 0);

  constructor(scene: THREE.Scene) {
    const geo = new THREE.RingGeometry(450, 500, 64);
    const mat = new THREE.MeshBasicMaterial({
      color: 0x4488ff,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.2,
    });
    this.ring = new THREE.Mesh(geo, mat);
    this.ring.rotation.x = -Math.PI / 2;
    this.ring.position.copy(this.ringPos);
    scene.add(this.ring);

    this.phases = [
      { radius: 400, damagePerSec: 1, duration: 180, center: new THREE.Vector3(0, 0, 0) },
      { radius: 300, damagePerSec: 2, duration: 150, center: new THREE.Vector3(0, 0, 0) },
      { radius: 200, damagePerSec: 4, duration: 120, center: new THREE.Vector3(0, 0, 0) },
      { radius: 100, damagePerSec: 8, duration: 90, center: new THREE.Vector3(0, 0, 0) },
      { radius: 10, damagePerSec: 16, duration: 60, center: new THREE.Vector3(0, 0, 0) },
    ];
  }

  update(dt: number) {
    this.totalTime += dt;
    const phase = this.phases[this.currentPhase];
    if (!phase) return;
    this.phaseTime += dt;

    const shrinkEnd = 5;
    const shrink = Math.min(this.phaseTime / shrinkEnd, 1);
    const innerRadius = phase.radius * (1 - shrink * 0.7);

    const positions = this.ring.geometry.attributes.position;
    const outerR = Math.max(phase.radius, 10);
    const thetaSegments = 64;
    for (let i = 0; i <= thetaSegments; i++) {
      const angle = (i / thetaSegments) * Math.PI * 2;
      const innerIdx = i * 2;
      const outerIdx = i * 2 + 1;
      if (innerIdx < positions.count) {
        positions.setXYZ(innerIdx, Math.cos(angle) * innerRadius, 0, Math.sin(angle) * innerRadius);
      }
      if (outerIdx < positions.count) {
        positions.setXYZ(outerIdx, Math.cos(angle) * outerR, 0, Math.sin(angle) * outerR);
      }
    }
    positions.needsUpdate = true;

    if (this.phaseTime >= phase.duration && this.currentPhase < this.phases.length - 1) {
      this.currentPhase++;
      this.phaseTime = 0;
    }
  }

  isOutsideZone(pos: THREE.Vector3): boolean {
    const phase = this.phases[this.currentPhase];
    if (!phase) return false;
    const innerRadius = phase.radius * 0.3;
    const dist = pos.distanceTo(phase.center);
    return dist > innerRadius;
  }

  getDamagePerSec(): number {
    const phase = this.phases[this.currentPhase];
    return phase ? phase.damagePerSec : 0;
  }
}
