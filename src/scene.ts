import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { createRenderer } from './renderer';

export type QualityPreset = 'low' | 'medium';

export interface SceneBundle {
  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera;
  renderer: THREE.WebGLRenderer;
  controls: OrbitControls;
  pois: THREE.Group[];
}

export function createScene(
  canvas: HTMLCanvasElement,
  quality: QualityPreset = 'medium'
): SceneBundle {
  const renderer = createRenderer(canvas, quality);

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x87ceeb);

  const camera = new THREE.PerspectiveCamera(75, canvas.width / canvas.height, 0.1, 2000);
  camera.position.set(0, 50, 100);
  camera.lookAt(0, 0, 0);

  const controls = new OrbitControls(camera, renderer.domElement);
  controls.target.set(0, 0, 0);
  controls.enableDamping = true;
  controls.dampingFactor = 0.1;
  controls.minDistance = 10;
  controls.maxDistance = 300;
  controls.maxPolarAngle = Math.PI / 2.1;

  const ambientLight = new THREE.AmbientLight(0x404060, 0.5);
  scene.add(ambientLight);

  const dirLight = new THREE.DirectionalLight(0xffffff, 1.2);
  dirLight.position.set(100, 200, 100);
  if (quality === 'medium') {
    dirLight.castShadow = true;
    dirLight.shadow.mapSize.set(2048, 2048);
    dirLight.shadow.camera.left = -500;
    dirLight.shadow.camera.right = 500;
    dirLight.shadow.camera.top = 500;
    dirLight.shadow.camera.bottom = -500;
    dirLight.shadow.camera.far = 500;
  }
  scene.add(dirLight);

  const hemiLight = new THREE.HemisphereLight(0x87ceeb, 0x223344, 0.4);
  scene.add(hemiLight);

  const groundGeo = new THREE.PlaneGeometry(1000, 1000);
  const groundMat = new THREE.MeshStandardMaterial({ color: 0x4a7c59, roughness: 0.9 });
  const ground = new THREE.Mesh(groundGeo, groundMat);
  ground.rotation.x = -Math.PI / 2;
  ground.receiveShadow = quality === 'medium';
  scene.add(ground);

  const gridHelper = new THREE.GridHelper(1000, 20, 0x888888, 0x444444);
  scene.add(gridHelper);

  const pois: THREE.Group[] = [];
  const names = ['Town', 'Factory', 'Docks', 'Hilltop'];
  const colors = [0x8b4513, 0x555555, 0x6b4423, 0x778844];

  for (let i = 0; i < names.length; i++) {
    const angle = (i / names.length) * Math.PI * 2;
    const x = Math.cos(angle) * 300;
    const z = Math.sin(angle) * 300;
    const group = new THREE.Group();
    group.position.set(x, 0, z);
    group.userData.name = names[i];

    const buildingMat = new THREE.MeshStandardMaterial({ color: colors[i], roughness: 0.7 });
    const buildingGeo = new THREE.BoxGeometry(20, 30, 20);

    const instancedMesh = new THREE.InstancedMesh(buildingGeo, buildingMat, 3);
    const dummy = new THREE.Object3D();
    for (let j = 0; j < 3; j++) {
      const height = 30 + j * 10;
      dummy.position.set(j * 25, height / 2, 0);
      dummy.scale.set(1, 1 + j * 0.33, 1);
      dummy.updateMatrix();
      instancedMesh.setMatrixAt(j, dummy.matrix);
    }
    instancedMesh.instanceMatrix.needsUpdate = true;
    if (quality === 'medium') {
      instancedMesh.castShadow = true;
      instancedMesh.receiveShadow = true;
    }
    group.add(instancedMesh);

    scene.add(group);
    pois.push(group);
  }

  return { scene, camera, renderer, controls, pois };
}
