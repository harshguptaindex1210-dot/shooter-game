import * as THREE from 'three';
import { createScene, type QualityPreset } from './scene';
import { createPlayer } from './player';
import { createInputManager } from './input';
import { updateCamera } from './camera';
import { createRobotModel, transitionAnim, updateRobotAnim } from './robot';
import { showLobby } from './lobby';

function attachRifle(robotGroup: THREE.Group) {
  const rifleMat = new THREE.MeshStandardMaterial({
    color: 0x333333,
    metalness: 0.5,
    roughness: 0.4,
  });
  const barrel = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.035, 0.8, 6), rifleMat);
  barrel.rotation.x = Math.PI / 2;
  barrel.position.set(0.55, 0.85, -0.15);
  robotGroup.add(barrel);

  const body = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.12, 0.3), rifleMat);
  body.position.set(0.55, 0.85, 0.05);
  robotGroup.add(body);

  const grip = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.1, 0.06), rifleMat);
  grip.position.set(0.55, 0.75, 0.08);
  robotGroup.add(grip);
}

function spawnBot(position: THREE.Vector3, scene: THREE.Scene) {
  const bot = createRobotModel();
  bot.group.position.copy(position);
  bot.group.position.y = -0.8;
  const metalMat = new THREE.MeshStandardMaterial({
    color: 0x884444,
    metalness: 0.6,
    roughness: 0.3,
  });
  const label = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.3, 0.3), metalMat);
  label.position.set(0, 1.4, 0.25);
  bot.group.add(label);
  scene.add(bot.group);
  return bot;
}

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
  attachRifle(robot.group);

  scene.add(player.capsule);
  player.capsule.visible = false;

  const bots = [
    spawnBot(new THREE.Vector3(5, 0, -5), scene),
    spawnBot(new THREE.Vector3(-5, 0, -8), scene),
    spawnBot(new THREE.Vector3(8, 0, 3), scene),
  ];
  for (const b of bots) b.anim.actions.idle.play();

  const input = createInputManager(canvas);

  let lastTime = performance.now();
  let gameStarted = false;

  showLobby(
    { level: 1, xp: 0, wins: 0, kills: 0, matches: 0 },
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
      robot.group.rotation.y = player.yaw;

      const animMap: Record<string, string> = {
        stand: 'idle',
        sprint: 'run',
        crouch: 'crouch',
        jump: 'jump',
      };
      transitionAnim(robot.anim, animMap[player.state] || 'idle');
      updateRobotAnim(robot.anim, dt);

      for (const b of bots) updateRobotAnim(b.anim, dt);

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
