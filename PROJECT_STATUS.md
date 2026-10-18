# Project Status: GrimIron

## Current Status: Milestone 7 (Warfront — Daily Battles, Procedural Enemies & Weekly Raids) Completed ✅

**Date**: October 2026
**Framework**: React Native with Expo SDK 57, TypeScript, Expo Router, expo-sqlite, and Supabase (Auth, Postgres, RLS, Realtime).

---

### What Works Right Now

1. **Warfront: Daily Engagements & Battle Board (`WarfrontDailyBoardModal.tsx`)**:
   - **Stable 3-Card Date Rotation**: Offerings are seeded by calendar date (`YYYY-MM-DD`) and persisted in SQLite (`daily_rotations`). Rerolls on app refresh or tab switching are strictly prevented.
   - **14-Day History Buffer**: Tracks recent encounters to eliminate stale repeats and ensure continuous daily variety.
   - **8 Operational Categories**: Filterable by Recon, Assault, Defense, Sabotage, Hunting, Special Ops, Escalating, and Co-op Raids.
   - **Direct Deployment**: Deploys the encounter's mission and hostile directly into standard workout logging. Completed workouts automatically mark daily encounters as completed and credit bonus rewards.

2. **110+ Encounter Templates Catalog (`src/content/encounters/`)**:
   - **110 Thematic Templates**: Full modular catalog spanning all 8 operational categories and representing all 20 Warhammer 40k factions with lore-accurate enemies, briefings, tactical objectives, recommended sets/intensity, base HP, glory XP, and combat modifiers.

3. **Deterministic Procedural Boss Generator (`bossGenerator.ts`)**:
   - **Mulberry32 PRNG**: Generates reproducible, seed-based enemy commanders without external LLM/API dependencies.
   - **Curated 20-Faction Pools**: Faction-tailored names, honorific titles, signature wargear, combat traits, and lore.
   - **3 Dynamic Boss Phases**: Distinct phase thresholds (Phase 1 at 100% HP, Phase 2 Enraged at 66% HP, Phase 3 Overload at 33% HP) with dynamic tactical taunts and damage profiles.

4. **Weekly Raid Boss System (`WeeklyRaidModal.tsx`)**:
   - **Configurable Spawn Day**: User-selected Friday vs. Saturday deployment preference stored in `warfront_settings`.
   - **Smart Health Scaling**: 2,400 HP for individual solo operatives vs. 7,500 HP for cooperative squads.
   - **Idempotent Damage & Rewards**: Atomic damage tracking with cumulative participant leaderboards and single-claim glory rewards (+500 XP).
   - **Unresolved Boss Policy**: Cleanly marks expired, undefeated bosses as `'escaped'` (not `'defeated'`), preserving all battle contributions without false victories.
   - **SQLite Persistence & Migration 8**: Tables `daily_rotations`, `weekly_raids`, `recent_encounters_history`, and `warfront_settings`.

5. **Structured Training Programs & Program Center (`ProgramCenterModal.tsx`)**:
   - 7 Core Program Categories (GVT, PPL, Upper/Lower, Full-Body, 5×5, Hypertrophy, Calisthenics) + Custom.
   - Separation of plan from actual performance (`isCompleted: false` until user logged).
   - Planned rest day bio-recovery without adherence penalties.

6. **Planetary Campaign Map & Directed Graph Theater (`CampaignMapModal.tsx`)**:
   - Directed acyclic graph with sequential routes, branch choices, and convergence boss nodes.
   - Multi-program compatibility across squads.

7. **Faction-Specific Missions & Mission Center (`MissionCenterModal.tsx`)**:
   - 63 Lore-Accurate Missions across all 20 factions.
   - Tracks 10+ real-world workout objective metrics.

8. **Battle History & 3-Scope Achievement System**:
   - Immutable combat encounter snapshots in `battle_history`.
   - 220 persistent achievements across User, Character, and Squad scopes.

9. **Quality Assurance**:
   - 100% clean TypeScript check (`npm run typecheck` passes with 0 errors).
   - Automated test suite (`npm test`) covering **14 comprehensive test suites** and 100+ assertions with 100% green output.

---

### Incomplete / Explicitly Deferred to Future Milestones

- Live synchronized multiplayer voice chat and global competitive leaderboards.
- Push notifications for boss defeats.
- In-app purchases, microtransactions, or paywalls.
- 3D character models and heavy graphics shaders.
- Rest day consistency bonuses and habit tracking.
