import * as THREE from 'three';

export interface LootDef {
  type: 'weapon' | 'ammo' | 'armor' | 'heal';
  subtype: string;
  amount: number;
}

export interface LootSpawn {
  position: THREE.Vector3;
  loot: LootDef;
  mesh: THREE.Mesh;
  collected: boolean;
}

const LOOT_TIERS: Record<string, LootDef[]> = {
  Town: [
    { type: 'weapon', subtype: 'rifle', amount: 1 },
    { type: 'weapon', subtype: 'pistol', amount: 1 },
    { type: 'ammo', subtype: 'rifle', amount: 30 },
  ],
  Factory: [
    { type: 'weapon', subtype: 'grenade', amount: 1 },
    { type: 'armor', subtype: 'vest', amount: 50 },
    { type: 'ammo', subtype: 'pistol', amount: 15 },
  ],
  Docks: [
    { type: 'weapon', subtype: 'pistol', amount: 1 },
    { type: 'heal', subtype: 'medkit', amount: 50 },
    { type: 'ammo', subtype: 'rifle', amount: 30 },
  ],
  Hilltop: [
    { type: 'weapon', subtype: 'rifle', amount: 1 },
    { type: 'armor', subtype: 'vest', amount: 30 },
    { type: 'heal', subtype: 'medkit', amount: 25 },
  ],
};

export function generateLoot(
  scene: THREE.Scene,
  pois: { name: string; position: THREE.Vector3 }[]
): LootSpawn[] {
  const spawns: LootSpawn[] = [];

  for (const poi of pois) {
    const tier = LOOT_TIERS[poi.name] || LOOT_TIERS.Town;
    for (let i = 0; i < tier.length; i++) {
      const angle = Math.random() * Math.PI * 2;
      const dist = 10 + Math.random() * 20;
      const pos = new THREE.Vector3(
        poi.position.x + Math.cos(angle) * dist,
        0.5,
        poi.position.z + Math.sin(angle) * dist
      );

      const color =
        tier[i].type === 'weapon'
          ? 0xff4444
          : tier[i].type === 'ammo'
            ? 0xffaa00
            : tier[i].type === 'armor'
              ? 0x4444ff
              : 0x44ff44;
      const geo = new THREE.BoxGeometry(0.4, 0.2, 0.4);
      const mat = new THREE.MeshStandardMaterial({
        color,
        emissive: color,
        emissiveIntensity: 0.3,
      });
      const mesh = new THREE.Mesh(geo, mat);
      mesh.position.copy(pos);
      mesh.userData.lootIndex = spawns.length;
      scene.add(mesh);

      spawns.push({ position: pos, loot: tier[i], mesh, collected: false });
    }
  }

  return spawns;
}

export function collectLoot(
  spawns: LootSpawn[],
  playerPos: THREE.Vector3,
  pickupRange: number = 2
): LootDef | null {
  for (const s of spawns) {
    if (s.collected) continue;
    if (s.position.distanceTo(playerPos) <= pickupRange) {
      s.collected = true;
      s.mesh.visible = false;
      return s.loot;
    }
  }
  return null;
}
