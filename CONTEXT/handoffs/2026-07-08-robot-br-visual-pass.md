# Handoff: Robot BR Visual Pass — Map Charted

## Objective
Replace programmer art with PUBG-style visuals, Titanfall-style robot characters, add melee weapons, and build a lobby UI. The game systems are all complete — this is a visual + content pass.

## Map
- **Map issue**: #17 — Robot BR Visual Pass wayfinder map
- **Tickets**:
  - #18 — Find and integrate robot character model + animations (research, frontier)
  - #19 — Add melee weapons: bat, knife, pan (prototype, blocked by #18)
  - #20 — Create lobby/home screen UI (prototype, frontier)
  - #21 — World visual pass: textured terrain + detailed buildings (prototype, frontier)

## Repo
- Branch: `main`
- Remote: `origin` → `https://github.com/harshguptaindex1210-dot/shooter-game.git`
- Last commit: `d4502e1` (W/S camera fix)
- Map: https://github.com/harshguptaindex1210-dot/shooter-game/issues/17

## Locked Decisions
| # | Decision | Choice |
|---|----------|--------|
| D10 | Asset pipeline | Free web-sourced assets (CC0/CC-BY) |
| D11 | Character model | Titanfall-style humanoid robot |
| D12 | Animations | Basic locomotion only (idle/walk/run/jump/crouch) |
| D13 | Weapons | Guns + melee (bat/knife/pan) + grenades |
| D14 | Lobby | Simple 2D UI overlay |
| D8 | Vehicles | Deferred |

## Frontier (unblocked tickets to claim)
1. #18 — Find robot model (research: search Sketchfab/Poly Pizza for Titanfall-style GLB)
2. #20 — Build lobby HTML/CSS overlay
3. #21 — Texture terrain + detailed POI buildings

## Gate
- `npm test` (58 tests), `npm run build` (506KB bundle), `npm run lint`

## Suggested Skills
- `/part2` to implement a ticket
- `cavecrew-investigator` for code location
- `caveman-commit` for commits