import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { createRenderer } from './renderer';

export type QualityPreset = 'low' | 'medium';

export interface SceneBundle {
  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera;
  renderer: THREE.WebGLRenderer;
  controls: OrbitControls;
  pois: { name: string; group: THREE.Group; position: THREE.Vector3 }[];
}

export function createScene(
  canvas: HTMLCanvasElement,
  quality: QualityPreset = 'medium'
): SceneBundle {
  const renderer = createRenderer(canvas, quality);

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x1a1a2e);
  scene.fog = new THREE.Fog(0x1a1a2e, 200, 600);

  const camera = new THREE.PerspectiveCamera(75, canvas.width / canvas.height, 0.1, 2000);
  camera.position.set(0, 50, 100);

  const controls = new OrbitControls(camera, renderer.domElement);
  controls.target.set(0, 0, 0);
  controls.enableDamping = true;
  controls.dampingFactor = 0.1;
  controls.minDistance = 10;
  controls.maxDistance = 300;
  controls.maxPolarAngle = Math.PI / 2.1;

  // Lighting — PUBG-style warm directional + cool ambient
  const ambientLight = new THREE.AmbientLight(0x40406a, 0.6);
  scene.add(ambientLight);

  const dirLight = new THREE.DirectionalLight(0xffcc88, 1.5);
  dirLight.position.set(150, 200, 100);
  if (quality === 'medium') {
    dirLight.castShadow = true;
    dirLight.shadow.mapSize.set(2048, 2048);
    dirLight.shadow.camera.left = -500;
    dirLight.shadow.camera.right = 500;
    dirLight.shadow.camera.top = 500;
    dirLight.shadow.camera.bottom = -500;
    dirLight.shadow.camera.far = 700;
  }
  scene.add(dirLight);

  const hemiLight = new THREE.HemisphereLight(0x87ceeb, 0x1a1a2e, 0.5);
  scene.add(hemiLight);

  // Ground — textured grid
  const groundGeo = new THREE.PlaneGeometry(1000, 1000);
  const groundMat = new THREE.MeshStandardMaterial({
    color: 0x556644,
    roughness: 0.8,
    metalness: 0.1,
    flatShading: true,
  });
  const ground = new THREE.Mesh(groundGeo, groundMat);
  ground.rotation.x = -Math.PI / 2;
  ground.receiveShadow = quality === 'medium';
  scene.add(ground);

  // Grid helper
  const gridHelper = new THREE.GridHelper(1000, 40, 0x334433, 0x223322);
  scene.add(gridHelper);

  // Road circles connecting POIs
  for (let i = 0; i < 4; i++) {
    const angle = (i / 4) * Math.PI * 2;
    const x = Math.cos(angle) * 300;
    const z = Math.sin(angle) * 300;
    const roadMat = new THREE.MeshStandardMaterial({ color: 0x333344, roughness: 0.9 });
    const road = new THREE.Mesh(new THREE.PlaneGeometry(4, 420), roadMat);
    road.rotation.x = -Math.PI / 2;
    road.position.set(x / 2, 0.05, z / 2);
    road.lookAt(0, 0.05, 0);
    scene.add(road);
  }

  // Vegetation scatter — simple cylinders
  if (quality === 'medium') {
    const trunkMat = new THREE.MeshStandardMaterial({ color: 0x3a5a3a, roughness: 0.9 });
    const leafMat = new THREE.MeshStandardMaterial({ color: 0x2a4a2a, roughness: 0.8 });
    const trunkGeo = new THREE.CylinderGeometry(0.15, 0.25, 2, 4);
    const leafGeo = new THREE.SphereGeometry(0.8, 4, 4);

    for (let i = 0; i < 200; i++) {
      const angle = Math.random() * Math.PI * 2;
      const dist = 30 + Math.random() * 450;
      const x = Math.cos(angle) * dist;
      const z = Math.sin(angle) * dist;

      // Skip if near a POI
      const poiCoords: [number, number][] = [];
      for (let i = 0; i < 4; i++) {
        const a = (i / 4) * Math.PI * 2;
        poiCoords.push([Math.cos(a) * 300, Math.sin(a) * 300]);
      }
      const nearPoi = poiCoords.some(([px, pz]) => Math.abs(x - px) < 40 && Math.abs(z - pz) < 40);
      if (nearPoi) continue;

      const tree = new THREE.Group();
      const trunk = new THREE.Mesh(trunkGeo, trunkMat);
      trunk.position.y = 1;
      tree.add(trunk);
      const leaf = new THREE.Mesh(leafGeo, leafMat);
      leaf.position.y = 2.8 + Math.random() * 0.5;
      leaf.scale.set(1, 0.8 + Math.random() * 0.4, 1);
      tree.add(leaf);
      tree.position.set(x, 0, z);
      scene.add(tree);
    }
  }

  // POIs — detailed buildings
  const pois: { name: string; group: THREE.Group; position: THREE.Vector3 }[] = [];
  const names = ['Town', 'Factory', 'Docks', 'Hilltop'];
  const colors = [0x8b7355, 0x666677, 0x7a5a3a, 0x887755];

  for (let i = 0; i < names.length; i++) {
    const angle = (i / names.length) * Math.PI * 2;
    const x = Math.cos(angle) * 300;
    const z = Math.sin(angle) * 300;
    const group = new THREE.Group();
    group.position.set(x, 0, z);
    group.userData.name = names[i];

    const wallMat = new THREE.MeshStandardMaterial({ color: colors[i], roughness: 0.7 });
    const roofMat = new THREE.MeshStandardMaterial({ color: 0x444455, roughness: 0.8 });
    const accentMat = new THREE.MeshStandardMaterial({
      color: 0x555566,
      roughness: 0.6,
      metalness: 0.3,
    });

    // Main building
    const mainH = 25 + Math.random() * 15;
    const mainGeo = new THREE.BoxGeometry(30, mainH, 25);
    const main = new THREE.Mesh(mainGeo, wallMat);
    main.position.y = mainH / 2;
    main.castShadow = quality === 'medium';
    main.receiveShadow = quality === 'medium';
    group.add(main);

    // Roof
    const roof = new THREE.Mesh(new THREE.BoxGeometry(28, 2, 23), roofMat);
    roof.position.y = mainH + 1;
    group.add(roof);

    // Windows
    const winMat = new THREE.MeshStandardMaterial({
      color: 0x88ccff,
      emissive: 0x88ccff,
      emissiveIntensity: 0.1,
    });
    for (let w = 0; w < 4; w++) {
      const win = new THREE.Mesh(new THREE.BoxGeometry(2, 3, 0.1), winMat);
      const wx = -10 + w * 7;
      win.position.set(wx, mainH * 0.6, 12.6);
      group.add(win);
    }

    // Side building
    const sideH = 12 + Math.random() * 8;
    const side = new THREE.Mesh(new THREE.BoxGeometry(15, sideH, 15), accentMat);
    side.position.set(22, sideH / 2, 5);
    side.castShadow = quality === 'medium';
    group.add(side);

    // Ground pad
    const pad = new THREE.Mesh(
      new THREE.BoxGeometry(50, 0.5, 40),
      new THREE.MeshStandardMaterial({ color: 0x444455, roughness: 0.9 })
    );
    pad.position.y = -0.25;
    group.add(pad);

    scene.add(group);
    pois.push({ name: names[i], group, position: new THREE.Vector3(x, 0, z) });
  }

  return { scene, camera, renderer, controls, pois };
}
