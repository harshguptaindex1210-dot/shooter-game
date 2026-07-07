export type MatchPhase = 'lobby' | 'dropping' | 'playing' | 'ended' | 'results';

export interface MatchState {
  phase: MatchPhase;
  players: Record<string, { alive: boolean; kills: number; damage: number; placement: number }>;
  aliveCount: number;
  startTime: number;
  dropTime: number;
  endTime: number;
  winnerId: string | null;
}

export function createMatch(playerIds: string[]): MatchState {
  const players: Record<
    string,
    { alive: boolean; kills: number; damage: number; placement: number }
  > = {};
  for (const id of playerIds) {
    players[id] = { alive: true, kills: 0, damage: 0, placement: 0 };
  }
  return {
    phase: 'lobby',
    players,
    aliveCount: playerIds.length,
    startTime: Date.now(),
    dropTime: 0,
    endTime: 0,
    winnerId: null,
  };
}

export function startDrop(match: MatchState) {
  match.phase = 'dropping';
}

export function startPlay(match: MatchState) {
  match.phase = 'playing';
}

export function killPlayer(match: MatchState, victimId: string, killerId: string | null) {
  if (!match.players[victimId]?.alive) return;
  match.players[victimId].alive = false;
  match.players[victimId].placement = match.aliveCount;
  match.aliveCount--;
  if (killerId && match.players[killerId]) {
    match.players[killerId].kills++;
  }
  if (match.aliveCount <= 1) {
    endMatch(match);
  }
}

export function endMatch(match: MatchState) {
  match.phase = 'ended';
  match.endTime = Date.now();
  for (const [id, p] of Object.entries(match.players)) {
    if (p.alive) {
      p.placement = 1;
      match.winnerId = id;
    }
  }
}

export function calculateXP(match: MatchState, playerId: string): number {
  const p = match.players[playerId];
  if (!p) return 0;
  const placementXP = Math.max(0, (match.aliveCount - p.placement + 1) * 10);
  const killXP = p.kills * 25;
  return placementXP + killXP;
}
