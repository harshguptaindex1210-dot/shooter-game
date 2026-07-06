import * as THREE from 'three';
import { createRenderer } from './renderer';

function init() {
  const canvas = document.querySelector<HTMLCanvasElement>('#game');
  if (!canvas) {
    throw new Error('Canvas #game not found');
  }
  if (!(canvas instanceof HTMLCanvasElement)) {
    throw new Error('#game is not a canvas element');
  }

  const renderer = createRenderer(canvas);
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x000000);

  const camera = new THREE.PerspectiveCamera(75, canvas.width / canvas.height, 0.1, 1000);
  camera.position.z = 5;

  function animate() {
    requestAnimationFrame(animate);
    renderer.render(scene, camera);
  }

  animate();
}

init();
