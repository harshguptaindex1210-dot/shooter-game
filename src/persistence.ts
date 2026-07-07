export interface PlayerStats {
  wins: number;
  kills: number;
  matches: number;
  xp: number;
  level: number;
  damage: number;
}

export interface StoredData {
  playerStats: PlayerStats;
  inventory: Record<string, number>;
}

const STORAGE_COLLECTION = 'player_data';

export function defaultStats(): PlayerStats {
  return { wins: 0, kills: 0, matches: 0, xp: 0, level: 1, damage: 0 };
}

export function addXP(stats: PlayerStats, amount: number): PlayerStats {
  stats.xp += amount;
  stats.level = Math.floor(stats.xp / 1000) + 1;
  return stats;
}

export function recordMatch(
  stats: PlayerStats,
  won: boolean,
  kills: number,
  damage: number,
  xpGained: number
): PlayerStats {
  stats.matches++;
  if (won) stats.wins++;
  stats.kills += kills;
  stats.damage += damage;
  return addXP(stats, xpGained);
}

export function createWriteId(): string {
  return `write_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

export function createStorageKey(userId: string): string {
  return `${STORAGE_COLLECTION}_${userId}`;
}
