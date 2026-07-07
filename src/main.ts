import * as THREE from 'three';
import { createScene, type QualityPreset } from './scene';
import { createPlayer } from './player';
import { createInputManager } from './input';
import { updateCamera } from './camera';

function init() {
  const canvas = document.querySelector<HTMLCanvasElement>('#game');
  if (!canvas) throw new Error('Canvas #game not found');
  if (!(canvas instanceof HTMLCanvasElement)) throw new Error('#game is not a canvas element');

  const params = new URLSearchParams(window.location.search);
  const quality: QualityPreset = (params.get('quality') as QualityPreset) ?? 'medium';

  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  canvas.style.width = window.innerWidth + 'px';
  canvas.style.height = window.innerHeight + 'px';

  const { scene, camera, renderer, controls } = createScene(canvas, quality);

  controls.enabled = false;

  const player = createPlayer(new THREE.Vector3(0, 1.8, 0));
  scene.add(player.capsule);
  scene.add(player.mesh);

  const input = createInputManager(canvas);

  let lastTime = performance.now();

  function resize() {
    const w = window.innerWidth;
    const h = window.innerHeight;
    canvas!.width = w;
    canvas!.height = h;
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    renderer.setSize(w, h);
  }

  window.addEventListener('resize', resize);

  function animate() {
    requestAnimationFrame(animate);

    const now = performance.now();
    const dt = Math.min((now - lastTime) / 1000, 0.05);
    lastTime = now;

    const inp = input.getInput();
    player.update(inp, dt, 0);

    updateCamera(
      camera,
      player.yaw,
      player.pitch,
      player.getEyeHeight(),
      player.cameraMode,
      player.position,
      dt
    );

    renderer.render(scene, camera);
  }

  animate();
}

init();
