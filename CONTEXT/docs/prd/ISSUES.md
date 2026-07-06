# Issues: Browser Battle Royale MVP

Dependency-ordered tracer-bullet slices. Each issue is a vertical slice delivering playable value. Issues touching invariants restate them in acceptance criteria. Each has a machine-checkable `Verification-command`.

**Convention**: `N-XX` = issue number. `→ depends on` = must be merged first.

---

## N-01: Project scaffold, build pipeline, CI

**Tracer bullet**: A player opens `index.html`, sees a black canvas rendering at 60fps, with a build pipeline that produces a ≤500 KB gz bundle.

**Scope**:
- Vite + TypeScript + Three.js project.
- `index.html`, `src/main.ts`, `src/renderer.ts` (clears canvas).
- ESLint, Prettier, Vitest configured.
- GitHub Actions: lint + typecheck + test + build on push.
- Lighthouse CI stub asserting bundle size (INV-3).

**Invariants**: INV-3 (bundle ≤500 KB gz, TTI ≤8s).

**Acceptance**:
- `npm run build` produces bundle ≤ 500 KB gz.
- `npm run lint`, `npm run typecheck`, `npm test` all exit 0.
- CI green on push.

**Verification-command**: `npm run build && npm run lint && npm run typecheck && npm test`

**Depends on**: nothing.

---

## N-02: Three.js render core + camera + blockout scene

**Tracer bullet**: A player sees a 3D blockout terrain with a few buildings, orbiting third-person camera, at ≥60 fps on mid-range.

**Scope**:
- `Scene`, `PerspectiveCamera`, `WebGLRenderer` setup.
- Blockout: 1x1 km ground plane, 4 POI clusters of box buildings, instanced props.
- Third-person orbit camera (mouse look, scroll zoom).
- Quality presets (low/medium) toggling pixel ratio + shadow map size.
- Headless render benchmark (Puppeteer, 10s fps counter).

**Invariants**: INV-1 (≥30 fps low / ≥60 fps mid).

**Acceptance**:
- Headless benchmark on low preset ≥ 30 fps median.
- Headless benchmark on medium preset ≥ 60 fps median (on reference machine).
- Camera orbits smoothly, no jitter.

**Verification-command**: `npm run bench:render`

**Depends on**: N-01.

---

## N-03: Player controller (movement, physics, camera modes)

**Tracer bullet**: A player walks, sprints, crouches, jumps, and aims (TPS ↔ FPS) on the blockout terrain.

**Scope**:
- `Player` entity: position, velocity, health, state (stand/crouch/sprint/jump).
- Capsule collider + raycast ground check.
- WASD + mouse look + shift + ctrl + space.
- Third-person shoulder cam; aim-down-sights → first-person.
- Simple gravity + jump arc.
- Local-only (no netcode yet).

**Invariants**: INV-1 (movement must not drop fps below floor).

**Acceptance**:
- Player can traverse full 1x1 km map without falling through ground.
- Camera transitions TPS↔FPS with no clipping.
- Render benchmark still meets INV-1 with player active.

**Verification-command**: `npm run bench:render`

**Depends on**: N-02.

---

## N-04: Local combat prototype (hitscan, damage, inventory)

**Tracer bullet**: Two players (1 local + 1 dummy) can shoot each other, deal damage, and die. Loot pickups grant weapons/ammo.

**Scope**:
- Weapons: rifle (hitscan), pistol (hitscan), grenade (projectile).
- Recoil, spread, reload, ammo magazine.
- Hit detection (raycast vs capsule), damage zones (head x2, body x1, limb x0.5).
- Health 100, death state, respawn (local prototype).
- Inventory: 2 weapon slots, ammo counts, armor slot.
- Loot pickups on ground (spawn from N-08 deferred — use hardcoded spawns here).

**Invariants**: INV-4 (server-authoritative is N-07; here local-only).

**Acceptance**:
- Shooting dummy in head deals 2x body damage.
- Reload interrupts fire; ammo depletes correctly.
- Grenade arc + AoE damage works.

**Verification-command**: `npm test -- --filter combat`

**Depends on**: N-03.

---

## N-05: Nakama backend + accounts + matchmaker stub

**Tracer bullet**: A player authenticates (guest or email), sees a lobby, and the matchmaker places 2+ players into a match session stub.

**Scope**:
- Nakama server (Docker compose) running locally.
- Client SDK integration (`src/net/nakama.ts`).
- Authenticate: anonymous guest + email.
- Matchmaker: queue → match found → session token.
- Match handler stub (server-side Lua/TS): assigns match ID, no gameplay yet.
- Reconnect: 10s window with session resume.
- `.env` config for local + staging.

**Invariants**: INV-5 (crash → lobby ≤10s), INV-6 (writes durable).

**Acceptance**:
- 2 browser tabs can queue and be matched together.
- Server kill → both clients return to lobby ≤ 10s.
- Account write survives server restart.

**Verification-command**: `docker compose up -d nakama && npm run test:e2e -- --filter lobby`

**Depends on**: N-01.

---

## N-06: Rollback netcode prototype at 2 players — DECISION GATE

**Tracer bullet**: 2 clients move + shoot, with client prediction + server authority + rollback reconciliation. **This is the gate**: if rollback is unstable at 2 players, fall back to lockstep+reconciliation before scaling.

**Scope**:
- Input encoding (per-tick input frame).
- Client prediction: apply own inputs locally immediately.
- Server authority: server simulates all players, sends snapshots @ ≥20 Hz.
- Rollback: on snapshot arrival, rewind to snapshot tick, re-simulate to present.
- Reconciliation: apply corrected state; preserve client-side effects (visual only).
- Lag simulation: artificial delay 50/100/150 ms in tests.
- 2-player integration test: assert no desync > 200 ms over 60s.

**Invariants**: INV-2 (≤16ms local, ≤80ms RTT target, ≤150ms cap, ≥20Hz tick, ≤200ms rollback).

**Acceptance**:
- 2 clients with 80ms artificial RTT: positions converge within 200ms window.
- At 150ms RTT: no hard desync; at >150ms: client disconnects cleanly.
- Snapshot tick ≥ 20 Hz under load.

**Verification-command**: `npm run test:netcode -- --players 2 --duration 60`

**Depends on**: N-04, N-05.

**⚠️ DECISION GATE**: If this fails to stabilize at 2 players, switch netcode model to lockstep+reconciliation and re-plan N-07. Document decision as ADR-0001.

---

## N-07: Scale netcode to 10 players + server-authoritative combat

**Tracer bullet**: 10 players (1 human + 9 bots) fight in a match with server-authoritative hit registration and no desyncs.

**Scope**:
- Server-side simulation loop (authoritative positions, health, hits).
- Bot clients (headless) that move + shoot.
- Combat netcode: client predicts shots, server validates hits, rollback reconciles.
- Fuzz harness: malformed inputs (speed hack, wall clip, impossible damage) → server rejects.
- Interest management: only send snapshots for nearby players (reduce bandwidth).

**Invariants**: INV-2, INV-4 (fuzz rejects all cheats).

**Acceptance**:
- 10-player match 5 min: no desync > 200ms.
- Fuzz harness rejects all cheat inputs (exit 0 = no cheat succeeded).
- Bandwidth per client ≤ 100 KB/s at 10 players.

**Verification-command**: `npm run test:netcode -- --players 10 --duration 300 && npm run test:fuzz`

**Depends on**: N-06.

---

## N-08: Map blockout (1x1 km, POIs, loot spawning)

**Tracer bullet**: The match map has 4 named POIs with blockout buildings and loot spawns weighted by POI.

**Scope**:
- Terrain: 1x1 km heightmap (flat-ish with gentle hills).
- 4 POIs: "Town", "Factory", "Docks", "Hilltop" — distinct building layouts (boxes).
- Loot spawn points: per-POI weighted tiers (common/rare/epic).
- Loot entity: weapon, ammo, armor, heal, fuel canister.
- Loot interaction: walk over / press E to pick up.

**Invariants**: INV-1 (POIs must not tank fps — instanced).

**Acceptance**:
- All 4 POIs render with instancing; fps still meets INV-1.
- Loot spawns at weighted points; pickups add to inventory.
- Map bounds enforced (player can't leave 1x1 km).

**Verification-command**: `npm run bench:render && npm test -- --filter loot`

**Depends on**: N-02, N-04.

---

## N-09: Zone shrink (blue zone) system

**Tracer bullet**: A match has a shrinking circular zone dealing damage outside it, with 5 phases ending in sudden death.

**Scope**:
- Zone state machine: 5 phases, each shrinks radius + increases damage.
- Visual: blue wall (shader), minimap circle (deferred minimap — use world-space marker).
- Damage tick outside zone per phase (e.g., 1→2→4→8→16 HP/s).
- Final phase: continuous shrink to 0 over 60s (sudden death).
- Server-authoritative zone timing synced to all clients.

**Invariants**: INV-5 (match terminates ≤25 min).

**Acceptance**:
- Match ends by zone within 25 min from drop, guaranteed.
- Player outside zone takes correct scaling damage.
- Zone position identical on all clients (server-synced).

**Verification-command**: `npm run test:zone -- --full-match`

**Depends on**: N-07, N-08.

---

## N-10: Vehicles (2 types, driving physics, enter/exit, damage)

**Tracer bullet**: A player enters a sedan or dune buggy, drives with arcade-realistic physics, and the vehicle can take damage and explode.

**Scope**:
- Vehicle entity: chassis, wheels, engine, health.
- Physics: acceleration, braking, steering, drift, suspension (raycast or simple raycast-wheel).
- 2 types: sedan (balanced), dune buggy (fast, fragile, off-road).
- Enter/exit: press F near vehicle, simple snap-to-seat camera.
- Damage: collisions reduce vehicle health; health 0 → explosion (AoE damage to nearby players).
- Server-authoritative vehicle state (netcode from N-07 extended).

**Invariants**: INV-2 (vehicle state synced), INV-1 (vehicles must not tank fps).

**Acceptance**:
- Player drives full map without physics glitches (no flipping underground).
- Vehicle explosion damages players within radius.
- Vehicle positions sync within rollback window.

**Verification-command**: `npm run test:vehicle && npm run bench:render`

**Depends on**: N-07, N-08.

---

## N-11: Match lifecycle (lobby → drop → play → end → results)

**Tracer bullet**: A full match flow: lobby → matchmaking → drop → play → winner → results → back to lobby.

**Scope**:
- Lobby UI: queue button, player stats, settings.
- Drop: spawn all players at altitude over map, parachute (simple descend).
- Play: zone + combat + vehicles active.
- End: last alive → victory screen; or timeout → tiebreak (lowest HP loses).
- Results: kills, placement, XP gained.
- Ad stub: 10s placeholder before returning to lobby.
- Reconnect: 10s window mid-match.

**Invariants**: INV-5 (≤25 min, crash → lobby ≤10s), INV-6 (XP write durable).

**Acceptance**:
- Full match completes ≤ 25 min.
- Server kill mid-match → all in lobby ≤ 10s, no XP loss.
- Winner sees victory; others see placement.

**Verification-command**: `npm run test:e2e -- --filter full-match`

**Depends on**: N-09, N-10.

---

## N-12: Persistence (XP, stats, inventory, idempotent writes)

**Tracer bullet**: A player's wins, kills, XP, and inventory persist across sessions, surviving server restarts.

**Scope**:
- Nakama storage: `player_stats` (wins, kills, matches, XP, level), `player_inventory` (cosmetic stubs).
- Idempotent write: write request has `write_id`; server dedupes; ack only after durable write.
- Retry queue on client: failed writes retried with backoff.
- Post-match: server writes updated stats; client shows delta in results.

**Invariants**: INV-6 (durable, idempotent, no loss on restart).

**Acceptance**:
- Kill server during post-match write → on reconnect, last confirmed state intact, no duplicate.
- Reconnect after 10s drop → stats from completed match persisted.
- Inventory unchanged across sessions.

**Verification-command**: `npm run test:e2e -- --filter persistence`

**Depends on**: N-11.

---

## N-13: Performance + bundle optimization (INV-1, INV-3)

**Tracer bullet**: The full MVP meets INV-1 (fps floors) and INV-3 (bundle + TTI) on the complete scene with 10 players + vehicles.

**Scope**:
- Profile + optimize: draw calls, instancing, shader complexity, texture streaming.
- Code-split: engine core in initial bundle; map/vehicle/combat modules lazy-loaded after first frame.
- Lighthouse CI: assert bundle ≤ 500 KB gz, TTI ≤ 8s on 4G throttle.
- Render benchmark on full match scene.

**Invariants**: INV-1, INV-3.

**Acceptance**:
- Lighthouse CI green (bundle + TTI).
- Render benchmark on full scene meets INV-1 floors.

**Verification-command**: `npm run build && npm run lighthouse && npm run bench:render`

**Depends on**: N-11.

---

## N-14: Fuzz + chaos + browser matrix tests (INV-4, INV-5, INV-6, INV-7)

**Tracer bullet**: All non-functional invariants are verified by automated tests in CI.

**Scope**:
- Fuzz harness (INV-4): speed hack, wall clip, impossible damage, item spawn — all rejected.
- Chaos test (INV-5): kill server mid-match → lobby ≤ 10s.
- Persistence test (INV-6): kill server mid-write → no loss.
- Browser matrix (INV-7): Playwright across Chrome, Edge, Firefox, Safari — one match completes each.

**Invariants**: INV-4, INV-5, INV-6, INV-7.

**Acceptance**:
- All 4 test suites exit 0 in CI.
- Fuzz rejects every cheat vector listed.
- 4 browsers each complete a match.

**Verification-command**: `npm run test:invariants`

**Depends on**: N-12, N-13.

---

## N-15: Ad stub + results polish + release

**Tracer bullet**: The MVP is shippable: ad break placeholder, polished results/lobby UI, and a deployed staging URL.

**Scope**:
- Ad stub: 10s placeholder card between matches (skippable after 10s).
- Lobby/results UI polish (loading states, error toasts).
- Staging deploy (Vercel/Netlify + Nakama hosted).
- Smoke test on staging URL.
- README: how to run locally + deploy.

**Invariants**: none new (regression only).

**Acceptance**:
- Staging URL playable end-to-end.
- Ad placeholder shows for 10s then proceeds.
- Smoke test exits 0.

**Verification-command**: `npm run test:smoke -- --url $STAGING_URL`

**Depends on**: N-14.

---

## Dependency Graph

```
N-01 ──┬── N-02 ── N-03 ── N-04 ──┐
       │                           ├── N-06 ── N-07 ──┬── N-09 ──┐
       └── N-05 ───────────────────┘                   │          ├── N-11 ── N-12 ── N-13 ── N-14 ── N-15
                              └── N-08 ─────────────────┴── N-10 ─┘
```

## Critical Path

N-01 → N-02 → N-03 → N-04 → N-06 → N-07 → N-09 → N-11 → N-12 → N-13 → N-14 → N-15

## Decision Gates

- **N-06**: Rollback netcode viability at 2 players. If fails → ADR-0001, switch to lockstep, re-plan N-07.
- **N-07**: Scale to 10. If rollback unstable at 10 → cap MVP at 2-4 players, document, defer 50-player to post-MVP.

## Suggested Labels

- `tracer-bullet`, `mvp`, `netcode`, `render`, `combat`, `vehicle`, `map`, `zone`, `persistence`, `infra`, `test`, `release`
- Priority by issue number (lower = higher priority).
