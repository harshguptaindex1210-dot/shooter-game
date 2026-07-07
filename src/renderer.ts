import * as THREE from 'three';
import type { QualityPreset } from './scene';

export function createRenderer(
  canvas: HTMLCanvasElement,
  quality: QualityPreset = 'medium'
): THREE.WebGLRenderer {
  const pixelRatio = quality === 'low' ? 1 : Math.min(window.devicePixelRatio, 2);
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
  renderer.setSize(canvas.width, canvas.height);
  renderer.setPixelRatio(pixelRatio);

  if (quality === 'medium') {
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  }

  return renderer;
}
