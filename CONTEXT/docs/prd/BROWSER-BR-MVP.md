# PRD: Browser Battle Royale (MVP)

**Status**: Ready for agent
**Owner**: Solo dev
**Created**: 2026-07-06

## Problem

There is no accessible, browser-native, 3D battle royale with driving and tactical shooting. Existing BRs (BGMI, PUBG, Apex) require native installs or mobile. A browser BR removes friction: one URL, instant play, ad-supported, no download.

## Vision

A browser-based 3D battle royale: drop into a 1x1 km map with 9 other players, loot weapons, drive vehicles, fight, survive a shrinking zone, be the last one standing. Realistic tactical aesthetic. Solo queue. Accounts track stats and progression.

The full vision fuses BGMI (BR loop), GTA (open-world feel), and NFS (driving physics) — but the MVP is the **BR core only**. GTA/NFS fusion is post-MVP.

## MVP Scope

| In | Out |
|----|-----|
| 10-player solo BR match | 50 players, duos/squads |
| 1x1 km blockout map | Multiple maps, 2x2 km |
| Server-authoritative combat + movement | Anti-cheat beyond server validation |
| Rollback netcode (validated at 10) | Scale to 50 (post-MVP gate) |
| 2-3 weapons, 2 vehicle types | Full arsenal, car customization |
| Loot spawning | Ranking, replays, spectator |
| Zone shrink + sudden death | GTA missions, open-world free roam |
| Nakama accounts, stats, inventory | Mobile/touch (desktop only) |
| Ad slots stubbed | Real ad SDK integration |
| Programmer-art blockout | Realistic assets |

## User Stories

1. **As a player**, I open a URL, see a lobby, and queue for a match without installing anything.
2. **As a player**, I drop into a 3D map with 9 others, find a weapon, and fight.
3. **As a player**, I can enter and drive a vehicle with arcade-realistic physics.
4. **As a player**, I must stay inside a shrinking zone or take damage.
5. **As a player**, the last one alive wins; I see a victory screen.
6. **As a player**, my wins, kills, and XP persist across sessions.
7. **As a player**, if I disconnect, I can rejoin within 10s or return to lobby without losing progress.

## Functional Requirements

### FR-1: Rendering (Three.js)
- 3D scene with terrain, buildings (blockout), props (primitives).
- Camera: third-person over-the-shoulder + first-person aim.
- LOD system, frustum culling, instanced rendering for repeated props.
- Quality presets: low (720p, 30fps floor), medium (1080p, 60fps floor).

### FR-2: Player Controller
- WASD movement, mouse look, shift sprint, ctrl crouch, space jump.
- First-person aim-down-sights, third-person hip-fire.
- Health (100 HP), damage zones (head/body/limb), downed state (no revives in solo — instant death).

### FR-3: Combat
- Hitscan weapons (rifle, pistol) + 1 projectile (grenade).
- Recoil pattern, spread, reload, ammo inventory.
- Server-authoritative hit registration with client-side prediction + rollback reconciliation.

### FR-4: Vehicles
- 2 types: 4-door sedan (balanced), dune buggy (fast, fragile).
- Arcade-realistic handling: acceleration, braking, steering, drift, suspension.
- Enter/exit animation (simple), seated player camera, drive-by not in MVP.
- Vehicle takes damage, can explode (AoE).

### FR-5: Map & Loot
- 1x1 km terrain with 3-4 named POIs (blockout buildings).
- Loot spawns at POIs: weapons, ammo, armor, heals, fuel.
- Loot tiering (common/rare/epic) by POI weighting.

### FR-6: Zone (Blue Zone)
- Circular zone shrinks in phases (5 phases over ~15 min).
- Damage per second outside zone scales per phase.
- Final phase = sudden death (constant shrink to 0 radius).

### FR-7: Match Lifecycle
- Lobby → matchmaking (Nakama matchmaker) → drop → play → end → results.
- Match max 25 min. On timeout, lowest-HP-survivor-loses tiebreak.
- Disconnect: 10s reconnect window; if missed, player eliminated, return to lobby.

### FR-8: Persistence (Nakama)
- Account: guest (anonymous) or email.
- Storage: XP, level, wins, kills, matches, inventory (cosmetics stub).
- Leaderboard: deferred (post-MVP).

### FR-9: Netcode (Rollback)
- Client predicts own movement + shooting; server authoritative.
- Rollback window ≤ 200 ms; reconcile to last server snapshot.
- **Decision gate after Issue N-06**: if rollback unstable at 10 players, fall back to lockstep+reconciliation.

### FR-10: Ads
- Stub: 10s "ad break" placeholder between matches. No real SDK.

## Non-Functional Requirements (from invariants)

- **INV-1**: ≥30 fps low-end / ≥60 fps mid-range.
- **INV-2**: ≤16 ms local input, ≤80 ms RTT target, ≤150 ms hard cap, ≥20 Hz server tick.
- **INV-3**: ≤500 KB gz initial bundle, ≤8 s TTI on 4G.
- **INV-4**: Server-authoritative; fuzz test rejects all cheats.
- **INV-5**: Match terminates ≤25 min; crash → lobby in ≤10 s.
- **INV-6**: Progression writes idempotent and durable.
- **INV-7**: Chrome, Edge, Firefox, Safari; WebGL 2 (WebGL 1 fallback).

## Acceptance Constraints

The MVP is done when **all** of these pass:

1. A 10-player match completes start-to-finish with ≤200 ms rollback window, no desyncs.
2. Headless render benchmark meets INV-1 fps floors.
3. Lighthouse CI on build artifact meets INV-3 (bundle + TTI).
4. Fuzz harness (INV-4) rejects all cheat inputs.
5. Chaos test (INV-5): server killed mid-match → all clients in lobby ≤10 s.
6. Persistence test (INV-6): server killed mid-write → no progression loss.
7. Playwright matrix (INV-7): match completes on 4 browsers.
8. Manual: a player can drop, loot, drive, shoot, win, and see stats persist.

## Post-MVP Roadmap (not in scope)

1. Scale to 50 players (pending rollback gate).
2. Duos / squads.
3. Additional maps, 2x2 km.
4. Realistic asset pass.
5. GTA-style open-world free roam mode.
6. NFS-style car customization, more vehicle types.
7. Ranking / leaderboards / replays.
8. Mobile / touch controls.
9. Real ad SDK.
10. Anti-cheat (server-side heuristics).
