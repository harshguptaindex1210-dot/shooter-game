import { createScene, type QualityPreset } from './scene';

function init() {
  const canvas = document.querySelector<HTMLCanvasElement>('#game');
  if (!canvas) throw new Error('Canvas #game not found');
  if (!(canvas instanceof HTMLCanvasElement)) throw new Error('#game is not a canvas element');

  const quality: QualityPreset =
    (document.documentElement.dataset.quality as QualityPreset) ?? 'medium';
  const { scene, camera, renderer, controls } = createScene(canvas, quality);

  function animate() {
    requestAnimationFrame(animate);
    controls.update();
    renderer.render(scene, camera);
  }

  animate();
}

init();
