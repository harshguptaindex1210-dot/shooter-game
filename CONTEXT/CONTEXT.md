# Project Context — Browser Battle Royale

## Effort

A browser-based, 3D battle royale game inspired by BGMI, with open-world (GTA-style) and driving (NFS-style) influences. Solo-developed. MVP targets the core BR loop.

## Locked Decisions

| # | Decision | Choice | Notes |
|---|----------|--------|-------|
| D1 | Genre pillar | Battle Royale (BGMI-style) | GTA/NFS influences deferred post-MVP |
| D2 | Platform | Browser (WebGL 2) | No native client in MVP |
| D3 | Render engine | Three.js | Custom GLSL where needed |
| D4 | Backend / multiplayer | Nakama (authoritative) | Accounts, matchmaking, storage |
| D5 | Netcode model | Rollback (GGPO-style) | **RISK**: hard at 50 players; capped at 10 for MVP, scale later |
| D6 | Visual style | Realistic tactical | Muted palette, military aesthetic |
| D7 | Map size | ~2x2 km, 50 players target | MVP ships 1x1 km, 10 players |
| D8 | Vehicles | Full physics-based driving (NFS-style) | Arcade-realistic hybrid |
| D9 | Performance budget | Scalable 30-60 fps | See invariants below |
| D10 | Asset pipeline | Programmer art (primitives) first | Replace iteratively |
| D11 | Anti-cheat | None in MVP | Server-authoritative validation only |
| D12 | Monetization | Ad-supported (between matches) | No pay-to-win |
| D13 | Persistence | Full — Nakama accounts + storage | Stats, inventory, progression |
| D14 | Team | Solo developer | Scope must fit one person |

## MVP Scope Cut

To fit a solo dev in a browser, the MVP is **scoped down** from the full vision:

- **10 players** (not 50) per match
- **1x1 km map** (not 2x2 km)
- **Solo queue only** (no duos/squads)
- **1 map** (no map rotation)
- **Rollback netcode validated at 10 players** before scaling
- **Programmer-art blockout** (no purchased/custom assets)
- **No anti-cheat** (server validation only)
- **Ad slots stubbed** (no real ad SDK in MVP)

The full vision (50 players, 2x2 km, duos/squads, multiple maps, realistic assets, NFS/GTA fusion modes) is a **post-MVP roadmap**.

## Invariants

These are testable, non-negotiable constraints. Every issue that touches one must restate it in acceptance criteria.

### INV-1: Frame Rate Floor
- Client must sustain **≥ 30 fps** on a machine with integrated GPU (Intel UHD 620 equivalent) at 720p, low quality preset.
- Client must sustain **≥ 60 fps** on a mid-range GPU (GTX 1650 / M1) at 1080p, medium preset.
- **Verification**: Automated headless render benchmark (Puppeteer + `requestAnimationFrame` counter) over 10 s; median fps must meet floor.

### INV-2: Network Latency Budget
- Input-to-prediction local feedback: **≤ 16 ms** (1 frame @ 60 fps).
- Client-to-server RTT target: **≤ 80 ms** for playable feel; **≤ 150 ms** hard cap before disconnect.
- Server tick rate: **≥ 20 Hz** (50 ms per tick); rollback window: **≤ 200 ms**.
- **Verification**: Integration test spins up server + 2 bot clients with artificial latency; assert no desync > 200 ms.

### INV-3: Bundle Size & Load Time
- Initial JS bundle (gzipped): **≤ 500 KB** (engine + core loop). Assets stream after first interactive frame.
- Time-to-first-interactive (TTI) on 4G throttle: **≤ 8 s**.
- **Verification**: Lighthouse CI run on build artifact; fail if TTI > 8 s or bundle > 500 KB gz.

### INV-4: Match Integrity (Server Authority)
- All combat, movement, and looting state is **server-authoritative**. Client may predict but never decide.
- A modified client must not be able to: move through walls, instant-headshot, spawn items, see through fog-of-war.
- **Verification**: Fuzz harness sends malformed client inputs (speed hack, wall clip, impossible damage); server rejects all.

### INV-5: Match Lifecycle
- A match must **always terminate** within **25 minutes** (zone shrink + sudden death). No match can hang forever.
- On server crash mid-match: players are returned to lobby within **10 s** with match invalidated (no stat loss).
- **Verification**: Chaos test kills server process mid-match; assert clients reach lobby state in ≤ 10 s.

### INV-6: Persistence Safety
- Player progression (XP, inventory) writes are **idempotent and retried**. No lost levels on transient network failure.
- A player must never lose inventory due to a server restart; all writes are durable before the "saved" ack.
- **Verification**: Kill server during a write; on reconnect, assert last confirmed state intact.

### INV-7: Browser Compatibility
- Must run on latest Chrome, Edge, Firefox, Safari (desktop). No native plugins. WebGL 2 required.
- Must degrade gracefully on WebGL 1-only devices (fallback to simpler shaders, not a hard fail).
- **Verification**: Playwright matrix test across 4 browsers; assert canvas renders and one match completes.

## Failure Modes (per external dependency)

| Dependency | Down | Slow | Rate-limited | Bad data |
|------------|------|------|-------------|----------|
| Nakama server | Client shows "reconnecting…" 10s, then lobby | Rollback window expands to cap, then rubberband | Queue inputs, drop at 150ms RTT | Client re-syncs from last server snapshot |
| Asset CDN | Game loads with primitive fallback geometry | Stream lazily, block high-LOD only | Use cached / lower-LOD | Re-fetch with backoff |
| Ad SDK | No ad shown, skip to next match | Skip ad after 5s timeout | Defer ad to post-match | Ignore, continue |
| Auth provider | Guest play allowed, no progression | Retry 3x then guest | Exponential backoff | Force re-login |

## Risk Register

| Risk | Severity | Mitigation |
|------|----------|------------|
| Rollback netcode at scale is research-grade | **Critical** | Cap MVP at 10 players. If rollback proves unstable at 10, fall back to lockstep-with-reconciliation. Decision gate after Issue N-06. |
| Solo dev scope | High | Strict MVP cut. No assets, no anti-cheat, 1 map, 10 players. |
| Realistic tactical art with programmer art | Medium | Blockout must read well silhouetted; gameplay-first. |
| Browser memory ceiling | Medium | Profile with Chrome DevTools; target ≤ 512 MB heap. |

## Out of Scope (MVP)

- Duos / squads (solo only)
- Multiple maps
- 50-player matches
- Realistic 3D assets
- Anti-cheat beyond server validation
- Mobile / touch controls (desktop only)
- Ranking / leaderboards
- Spectator mode
- Replay system
- GTA-style missions / open-world free roam
- NFS-style car customization (only driving physics)
