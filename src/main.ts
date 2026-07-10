import * as THREE from 'three';
import { createScene, type QualityPreset } from './scene';
import { createPlayer } from './player';
import { createInputManager } from './input';
import { updateCamera } from './camera';
import { createRobotModel, transitionAnim, updateRobotAnim } from './robot';
import { createWeapon, fireWeapon, reloadWeapon, updateReload, type WeaponState } from './weapons';
import { createDamageable } from './damageable';
import { showLobby } from './lobby';
import { createHUD, createMinimap } from './hud';

const WEAPON_SLOTS: ('rifle' | 'pistol' | 'grenade')[] = ['rifle', 'pistol', 'grenade'];

function attachRifle(robotGroup: THREE.Group) {
  const m = new THREE.MeshStandardMaterial({ color: 0x333333, metalness: 0.5, roughness: 0.4 });
  const barrel = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.035, 0.8, 6), m);
  barrel.rotation.x = Math.PI / 2;
  barrel.position.set(0.55, 0.85, -0.15);
  robotGroup.add(barrel);
  const body = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.12, 0.3), m);
  body.position.set(0.55, 0.85, 0.05);
  robotGroup.add(body);
  const grip = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.1, 0.06), m);
  grip.position.set(0.55, 0.75, 0.08);
  robotGroup.add(grip);
}

function spawnBot(position: THREE.Vector3, scene: THREE.Scene) {
  const bot = createRobotModel();
  bot.group.position.copy(position);
  bot.group.position.y = -0.8;
  const cloth = new THREE.Mesh(
    new THREE.BoxGeometry(0.5, 0.15, 0.3),
    new THREE.MeshStandardMaterial({ color: 0xcc4444, roughness: 0.9 })
  );
  cloth.position.set(0, 1.4, -0.15);
  bot.group.add(cloth);
  const mark = new THREE.Mesh(
    new THREE.BoxGeometry(0.15, 0.15, 0.02),
    new THREE.MeshStandardMaterial({ color: 0xff6600, emissive: 0xff6600, emissiveIntensity: 0.2 })
  );
  mark.position.set(0.55, 1.4, 0.31);
  bot.group.add(mark);
  const hp = createDamageable(`bot_${Date.now()}_${Math.random()}`, position.clone(), 100);
  scene.add(bot.group);
  return { bot, hp, group: bot.group };
}

function init() {
  const canvas = document.querySelector<HTMLCanvasElement>('#game');
  if (!canvas) throw new Error('Canvas #game not found');

  const quality: QualityPreset =
    (new URLSearchParams(window.location.search).get('quality') as QualityPreset) ?? 'medium';
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

  const weapons: WeaponState[] = [
    createWeapon('rifle'),
    createWeapon('pistol'),
    createWeapon('grenade'),
  ];
  let currentWeapon = 0;
  let kills = 0;
  let playerHealth = 100;
  let lastHitTime = 0;
  const buildings: { mesh: THREE.Mesh; size: number }[] = [];

  scene.traverse((child) => {
    if (
      child instanceof THREE.Mesh &&
      child.geometry.type === 'BoxGeometry' &&
      child.position.y > 5
    ) {
      buildings.push({ mesh: child, size: 10 });
    }
  });

  const bots = [
    spawnBot(new THREE.Vector3(5, 0, -5), scene),
    spawnBot(new THREE.Vector3(-5, 0, -8), scene),
    spawnBot(new THREE.Vector3(8, 0, 3), scene),
    spawnBot(new THREE.Vector3(-10, 0, 10), scene),
    spawnBot(new THREE.Vector3(15, 0, -3), scene),
  ];
  for (const b of bots) b.bot.anim.actions.idle.play();

  const input = createInputManager(canvas);
  const hud = createHUD();
  const minimap = createMinimap();

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

  window.addEventListener('resize', () => {
    canvas!.width = window.innerWidth;
    canvas!.height = window.innerHeight;
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  });

  function switchWeapon(index: number) {
    if (index >= 0 && index < weapons.length) currentWeapon = index;
  }

  function takeDamage(amount: number) {
    playerHealth = Math.max(0, playerHealth - amount);
    lastHitTime = performance.now();
    if (playerHealth <= 0) {
      playerHealth = 100;
      player.position.set(0, 0.9, 0);
    }
  }

  function animate() {
    requestAnimationFrame(animate);
    const now = performance.now();
    const dt = Math.min((now - lastTime) / 1000, 0.05);
    lastTime = now;

    if (gameStarted) {
      const inp = input.getInput();
      if (inp.weapon1) switchWeapon(0);
      if (inp.weapon2) switchWeapon(1);
      if (inp.weapon3) switchWeapon(2);
      if (inp.reload) reloadWeapon(weapons[currentWeapon], now);
      updateReload(weapons[currentWeapon], now);

      player.update(inp, dt, 0);
      robot.group.position.copy(player.position);
      robot.group.position.y = -0.8;
      robot.group.rotation.y = player.yaw;
      transitionAnim(
        robot.anim,
        { stand: 'idle', sprint: 'run', crouch: 'crouch', jump: 'jump' }[player.state] || 'idle'
      );
      updateRobotAnim(robot.anim, dt);

      // Fire
      if (inp.fire) {
        const origin = new THREE.Vector3(0, player.getEyeHeight(), 0);
        const dir = new THREE.Vector3(
          -Math.sin(player.yaw),
          -Math.sin(player.pitch),
          -Math.cos(player.yaw)
        );
        const targets = bots
          .filter((b) => b.hp.alive)
          .map((b) => ({
            id: b.hp.id,
            position: b.hp.position,
            capsuleHeight: 1.8,
            capsuleRadius: 0.4,
          }));
        for (const r of fireWeapon(weapons[currentWeapon], origin, dir, targets, now)) {
          if (r.hit && r.entityId) {
            const bot = bots.find((b) => b.hp.id === r.entityId);
            if (bot) {
              bot.hp.takeDamage(r.damage);
              if (!bot.hp.alive) {
                kills++;
                bot.group.visible = false;
                setTimeout(() => {
                  bot.hp.respawn(
                    new THREE.Vector3((Math.random() - 0.5) * 40, 0.9, (Math.random() - 0.5) * 40)
                  );
                  bot.group.position.copy(bot.hp.position);
                  bot.group.position.y = -0.8;
                  bot.group.visible = true;
                  bot.bot.anim.actions.idle.play();
                }, 3000);
              }
            }
          }
        }
      }

      // Bot AI
      for (const b of bots) {
        if (!b.hp.alive) continue;
        updateRobotAnim(b.bot.anim, dt);
        const dx = player.position.x - b.hp.position.x;
        const dz = player.position.z - b.hp.position.z;
        const dist = Math.sqrt(dx * dx + dz * dz);
        if (dist > 5 && dist < 60) {
          const speed = 3 * dt;
          b.hp.position.x += (dx / dist) * speed;
          b.hp.position.z += (dz / dist) * speed;
          b.group.position.copy(b.hp.position);
          b.group.position.y = -0.8;
          b.group.rotation.y = Math.atan2(dx, dz);
          transitionAnim(b.bot.anim, dist < 15 ? 'run' : 'walk');
        }
        if (dist < 50 && Math.random() < 0.02) takeDamage(5 + Math.random() * 10);
      }

      // Building collision
      for (const b of buildings) {
        const bp = new THREE.Vector3();
        b.mesh.getWorldPosition(bp);
        const dx = player.position.x - bp.x;
        const dz = player.position.z - bp.z;
        const dist = Math.sqrt(dx * dx + dz * dz);
        if (dist < b.size * 0.5 + 1) {
          player.position.x += (dx / dist) * 0.3;
          player.position.z += (dz / dist) * 0.3;
        }
      }

      updateCamera(
        camera,
        player.yaw,
        player.pitch,
        player.getEyeHeight(),
        player.cameraMode,
        player.position,
        dt
      );

      hud.update({
        kills,
        alive: bots.filter((b) => b.hp.alive).length + 1,
        health: playerHealth,
        weapon: WEAPON_SLOTS[currentWeapon].toUpperCase(),
        ammo: weapons[currentWeapon].ammo,
        reserve: 90,
        inStorm: Math.abs(player.position.x) > 400 || Math.abs(player.position.z) > 400,
        justHit: now - lastHitTime < 100,
      });

      minimap.update({
        px: player.position.x,
        pz: player.position.z,
        pyaw: player.yaw,
        sx: 0,
        sz: 0,
        sr: 400,
        buildings: [
          { x: 300, z: 0 },
          { x: 0, z: 300 },
          { x: -300, z: 0 },
          { x: 0, z: -300 },
        ],
        enemies: bots.map((b) => ({ x: b.hp.position.x, z: b.hp.position.z, alive: b.hp.alive })),
      });
    }

    renderer.render(scene, camera);
  }

  animate();
}

init();
