# PRD: Robot BR Visual Pass

## Overview

Take the existing browser battle royale MVP (all game systems complete) and replace programmer art with PUBG-style semi-realistic visuals, Titanfall-style humanoid robot characters, add melee weapons (bat/knife/pan), and build a lobby UI.

## Theme

**Robot apocalypse** — robotic fighters battle for supremacy in a world where machines took over. Titanfall-style humanoid robots with glowing optics, metal chassis, and military-grade weaponry.

## Visual Direction

| Aspect | Target | Source |
|--------|--------|--------|
| Character | Titanfall-style humanoid robot | Free GLB/GLTF from Sketchfab/Poly Pizza |
| Animations | Idle, walk, run, jump, crouch | Mixamo |
| World | PUBG-style semi-realistic (textured terrain, detailed buildings, trees) | Free CC0 texture + model packs |
| Lighting | Atmospheric — warm directional + cool ambient | Three.js tweaks |
| UI | Simple lobby with start/stats/settings | HTML/CSS overlay |

## Scope

1. **Robot character** — Source + integrate free Titanfall-style robot model, rig with Mixamo locomotion animations
2. **World visual pass** — Textured terrain, detailed POI buildings, vegetation scatter
3. **Melee weapons** — Bat (slow/strong), knife (fast/weak), pan (medium) with swing mechanics
4. **Lobby UI** — Start Match, Player Stats, Settings

## Out of Scope (this phase)

- Vehicles (deferred)
- Full combat animation set (deferred)
- Full melee arsenal beyond bat/knife/pan
- Realistic assets from paid stores
- Audio/Music

## Issues

| # | Title | Type | Depends On |
|---|-------|------|------------|
| #18 | Find and integrate robot character model + animations | Research | — |
| #19 | Add melee weapons: bat, knife, pan | Prototype | #18 (needs robot model for weapon attach) |
| #20 | Create lobby/home screen UI | Prototype | — |
| #21 | World visual pass: textured terrain + detailed buildings | Prototype | — |

## Verification

- `npm test` — all existing 58 tests still pass
- `npm run bench:render` — fps floors maintained
- `npm run build` — bundle under 512KB
- Visual review: robot visible with animations, world looks PUBG-style, lobby shows, melee weapons work