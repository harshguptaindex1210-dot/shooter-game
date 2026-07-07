import { describe, it, expect } from 'vitest';
import {
  defaultStats,
  recordMatch,
  addXP,
  createWriteId,
  createStorageKey,
} from '../src/persistence';

describe('persistence', () => {
  it('creates default stats', () => {
    const s = defaultStats();
    expect(s.wins).toBe(0);
    expect(s.level).toBe(1);
  });

  it('adds XP and levels up at 1000', () => {
    const s = defaultStats();
    addXP(s, 1000);
    expect(s.xp).toBe(1000);
    expect(s.level).toBe(2);
  });

  it('records match stats', () => {
    const s = defaultStats();
    recordMatch(s, true, 5, 200, 150);
    expect(s.matches).toBe(1);
    expect(s.wins).toBe(1);
    expect(s.kills).toBe(5);
    expect(s.damage).toBe(200);
    expect(s.xp).toBe(150);
  });

  it('generates unique write IDs', () => {
    const id1 = createWriteId();
    const id2 = createWriteId();
    expect(id1).not.toBe(id2);
  });

  it('creates storage key from userId', () => {
    const key = createStorageKey('user123');
    expect(key).toContain('user123');
    expect(key).toContain('player_data');
  });
});
