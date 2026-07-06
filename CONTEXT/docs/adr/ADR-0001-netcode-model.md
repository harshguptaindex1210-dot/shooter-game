# ADR-0001: Netcode Model for Browser BR

**Status**: Pending (decision gate at N-06)
**Date**: 2026-07-06

## Context

The user chose rollback/GGPO-style netcode for a browser battle royale targeting 10 players (MVP), scaling to 50 (post-MVP). Rollback is proven for 2-player fighting games but **unproven at BR scale** in browsers. The risk is material: if rollback can't stabilize at 10 players, the MVP cannot ship.

## Decision

**Defer the final netcode decision to the N-06 decision gate.**

1. Build N-06 (rollback prototype at 2 players) as the first real netcode test.
2. If N-06 passes at 2 players with ≤200ms rollback window → proceed to N-07 (scale to 10).
3. If N-07 fails at 10 players → cap MVP at 2-4 players OR switch to **lockstep-with-reconciliation** (simpler, higher input lag, but stable).
4. If N-06 fails even at 2 players → switch to lockstep immediately, re-plan N-07+.

## Consequences

- Rollback (if it works): best feel, ≤16ms local input, but complex and CPU-heavy in browser.
- Lockstep fallback: simpler, stable, but input lag = RTT; less responsive.
- Either way, server stays authoritative (INV-4 holds).

## Alternatives Considered

- **Authoritative server + client prediction (no rollback)**: simpler, but rubber-banding on reconciliation. Fallback if both above fail.
- **Host-based (WebRTC)**: rejected — host can cheat, no anti-cheat in MVP makes this unsafe.
