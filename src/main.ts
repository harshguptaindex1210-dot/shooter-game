import * as THREE from 'three';
import { createScene, type QualityPreset } from './scene';
import { createPlayer } from './player';
import { createInputManager } from './input';
import { updateCamera } from './camera';
import { createRobotModel, transitionAnim, updateRobotAnim } from './robot';
import { showLobby } from './lobby';

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

  const player = createPlayer(new THREE.Vector3(0, 0.9, 0));
  const robot = createRobotModel();
  robot.group.position.copy(player.position);
  robot.group.position.y = -0.8;
  scene.add(robot.group);

  scene.add(player.capsule);
  player.capsule.visible = false;

  const input = createInputManager(canvas);

  let lastTime = performance.now();
  let gameStarted = false;

  showLobby(
    {
      level: 1,
      xp: 0,
      wins: 0,
      kills: 0,
      matches: 0,
    },
    {
      onStartMatch() {
        gameStarted = true;
        canvas.requestPointerLock();
      },
      onSettingsChange(settings) {
        const q = settings.quality as QualityPreset;
        if (q) document.documentElement.dataset.quality = q;
      },
    }
  );

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

    if (gameStarted) {
      const inp = input.getInput();
      player.update(inp, dt, 0);

      robot.group.position.copy(player.position);
      robot.group.position.y = -0.8;
      robot.group.rotation.y = -player.yaw;

      const animMap: Record<string, string> = {
        stand: 'idle',
        sprint: 'run',
        crouch: 'crouch',
        jump: 'jump',
      };
      transitionAnim(robot.anim, animMap[player.state] || 'idle');
      updateRobotAnim(robot.anim, dt);

      updateCamera(
        camera,
        player.yaw,
        player.pitch,
        player.getEyeHeight(),
        player.cameraMode,
        player.position,
        dt
      );
    }

    renderer.render(scene, camera);
  }

  animate();
}

init();
