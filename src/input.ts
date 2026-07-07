import type { PlayerInput } from './player';

export interface InputManager {
  getInput: () => PlayerInput;
  dispose: () => void;
}

export function createInputManager(canvas: HTMLCanvasElement): InputManager {
  const keys: Set<string> = new Set();
  let mouseX = 0;
  let mouseY = 0;

  function onKeyDown(e: KeyboardEvent) {
    keys.add(e.code);
  }

  function onKeyUp(e: KeyboardEvent) {
    keys.delete(e.code);
  }

  function onMouseMove(e: MouseEvent) {
    mouseX += e.movementX;
    mouseY += e.movementY;
  }

  window.addEventListener('keydown', onKeyDown);
  window.addEventListener('keyup', onKeyUp);

  canvas.addEventListener('mousemove', onMouseMove);

  document.addEventListener('pointerlockchange', () => {
    if (!document.pointerLockElement) {
      keys.clear();
    }
  });

  canvas.addEventListener('click', () => {
    canvas.requestPointerLock();
  });

  function getInput(): PlayerInput {
    const input: PlayerInput = {
      forward: keys.has('KeyW') || keys.has('ArrowUp'),
      backward: keys.has('KeyS') || keys.has('ArrowDown'),
      left: keys.has('KeyA') || keys.has('ArrowLeft'),
      right: keys.has('KeyD') || keys.has('ArrowRight'),
      sprint: keys.has('ShiftLeft') || keys.has('ShiftRight'),
      crouch: keys.has('ControlLeft') || keys.has('ControlRight'),
      jump: keys.has('Space'),
      aim: keys.has('MouseRight') || keys.has('KeyQ'),
      mouseX,
      mouseY,
    };

    mouseX = 0;
    mouseY = 0;

    return input;
  }

  function dispose() {
    window.removeEventListener('keydown', onKeyDown);
    window.removeEventListener('keyup', onKeyUp);
    canvas.removeEventListener('mousemove', onMouseMove);
  }

  return { getInput, dispose };
}
