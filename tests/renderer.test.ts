import { describe, it, expect, beforeEach, vi } from 'vitest';

describe('createRenderer', () => {
  let canvas: HTMLCanvasElement;

  beforeEach(() => {
    canvas = document.createElement('canvas');
    canvas.width = 1024;
    canvas.height = 576;
  });

  it('creates renderer sized to canvas with clamped pixel ratio', async () => {
    const setSize = vi.fn();
    const setPixelRatio = vi.fn();
    const FakeRenderer = vi.fn().mockImplementation(() => ({
      domElement: canvas,
      setSize,
      setPixelRatio,
      getPixelRatio: () => Math.min(window.devicePixelRatio, 2),
    }));

    vi.doMock('three', async () => {
      const actual = await vi.importActual<typeof import('three')>('three');
      return {
        ...actual,
        WebGLRenderer: FakeRenderer,
      };
    });

    const { createRenderer } = await import('../src/renderer');
    const renderer = createRenderer(canvas);

    expect(FakeRenderer).toHaveBeenCalledWith({ canvas, antialias: true });
    expect(setSize).toHaveBeenCalledWith(1024, 576);
    expect(setPixelRatio).toHaveBeenCalledWith(Math.min(window.devicePixelRatio, 2));
    expect(renderer.domElement).toBe(canvas);
  });
});
