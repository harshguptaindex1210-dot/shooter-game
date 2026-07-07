import { describe, it, expect, beforeEach, vi } from 'vitest';

vi.mock('three', async (importOriginal) => {
  const actual = await importOriginal<typeof import('three')>();
  return {
    ...actual,
    WebGLRenderer: vi.fn().mockImplementation(() => ({
      domElement: document.createElement('canvas'),
      setSize: vi.fn(),
      setPixelRatio: vi.fn(),
      shadowMap: { enabled: false, type: 0 },
      getPixelRatio: () => 2,
    })),
  };
});

describe('createRenderer', () => {
  let canvas: HTMLCanvasElement;

  beforeEach(() => {
    canvas = document.createElement('canvas');
    canvas.width = 1024;
    canvas.height = 576;
  });

  it('creates renderer sized to canvas with medium preset', async () => {
    const { createRenderer } = await import('../src/renderer');
    const renderer = createRenderer(canvas, 'medium');

    const { WebGLRenderer } = await import('three');
    expect(WebGLRenderer).toHaveBeenCalledWith({ canvas, antialias: true });
    expect(renderer.setSize).toHaveBeenCalledWith(1024, 576);
    expect(renderer.setPixelRatio).toHaveBeenCalledWith(Math.min(window.devicePixelRatio, 2));
    expect(renderer.domElement).toBeDefined();
  });

  it('creates renderer with low preset (pixelRatio=1, no shadows)', async () => {
    const { createRenderer } = await import('../src/renderer');
    const renderer = createRenderer(canvas, 'low');

    expect(renderer.setPixelRatio).toHaveBeenCalledWith(1);
    expect(renderer.shadowMap.enabled).toBe(false);
  });
});
