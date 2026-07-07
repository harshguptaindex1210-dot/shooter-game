import { describe, it, expect } from 'vitest';
import { createMatch, startDrop, startPlay, killPlayer, calculateXP } from '../src/match';

describe('match lifecycle', () => {
  it('starts in lobby phase', () => {
    const m = createMatch(['p1', 'p2', 'p3']);
    expect(m.phase).toBe('lobby');
    expect(m.aliveCount).toBe(3);
  });

  it('transitions through phases', () => {
    const m = createMatch(['p1', 'p2']);
    startDrop(m);
    expect(m.phase).toBe('dropping');
    startPlay(m);
    expect(m.phase).toBe('playing');
  });

  it('kill reduces alive count', () => {
    const m = createMatch(['p1', 'p2', 'p3']);
    killPlayer(m, 'p2', 'p1');
    expect(m.aliveCount).toBe(2);
    expect(m.players.p2.alive).toBe(false);
    expect(m.players.p1.kills).toBe(1);
  });

  it('ends when one player remains', () => {
    const m = createMatch(['p1', 'p2']);
    killPlayer(m, 'p2', 'p1');
    expect(m.phase).toBe('ended');
    expect(m.winnerId).toBe('p1');
    expect(m.players.p2.placement).toBe(2);
  });

  it('calculates XP from placement and kills', () => {
    const m = createMatch(['p1', 'p2', 'p3']);
    killPlayer(m, 'p3', 'p1');
    killPlayer(m, 'p2', 'p1');
    const xp = calculateXP(m, 'p1');
    expect(xp).toBeGreaterThan(0);
  });
});
