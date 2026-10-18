# Project Status: GrimIron

## Current Status: Milestone 3 (Asynchronous Cooperative Boss Battles) Completed ✅

**Date**: October 2026
**Framework**: React Native with Expo SDK 57, TypeScript, Expo Router, expo-sqlite, and Supabase (Auth, Postgres, RLS, Realtime).

---

### What Works Right Now

1. **Cooperative Crusade Squad Battles (Supabase Backend)**:
   - **Friends Groups & Revocable Invitations**: Users can create private Crusade Squads. Leaders can view and securely regenerate unique 8-character invite ciphers (e.g. `CRUSADE-7F9A`) at any time.
   - **Shared Raid Boss Encounters**: Groups share an active raid target (e.g. *Warboss Skullkrakka - Raid Titan*, 10,000 HP) with synchronized health, lore title, visual glyph, and campaign victory state.
   - **Asynchronous Damage Contributions**: Friends work out independently at different times. Every completed set linked to the active raid produces an attack that damages the shared enemy.
   - **Atomic Server-Side Damage RPC**: Clients NEVER write to `current_hp` directly. The PostgreSQL stored procedure `record_coop_attack` acquires a row lock (`FOR UPDATE`), validates group membership, and calculates the new boss health atomically.
   - **Strict Idempotency**: A PostgreSQL unique constraint `CONSTRAINT uq_coop_boss_set UNIQUE (group_boss_id, client_set_id)` and exception handling ensures network retries or duplicate set saves never double-damage the boss.
   - **Supabase Realtime Synchronization**: Subscribes to Postgres change feeds on `group_bosses` and `coop_attacks` to instantly refresh connected devices with live health updates and friend combat tickers.
   - **Privacy by Design**: Raw weights, repetitions, notes, and RPE are **strictly excluded** from network payloads and stay 100% private on the local device. Only sanitized attack descriptors (`exercise_name`, `attack_name`, `style_name`, `damage`) are shared.
   - **Offline Resilience & Attack Queue**: If offline or Supabase credentials are not yet configured, attacks buffer safely into local SQLite (`coop_attack_queue`) and reconcile automatically via `flushOfflineQueue()`.
   - **Decoupled Architecture**: Online cooperative combat is completely decoupled from local workout history and solo RPG systems. Local workout logging never stalls or blocks on network state.

2. **Solo Combat & Mission Encounter System**:
   - **Hostile Enemy Catalog**: Scalable enemies across multiple factions with unique health pools, difficulty tiers, and defeat quotes.
   - **Mission Objectives**: Structured combat missions with recommended set thresholds and victory Glory Bonus XP.
   - **Interactive Combat HUD**: Real-time enemy health bar with dynamic color transitions (Green $\rightarrow$ Amber $\rightarrow$ Red), purge status, and overkill damage counter.
   - **Thematic Attack Styles**: Movement patterns map to sci-fi strikes (Heavy Seismic Strike, Armor-Piercing Volley, Serrated Cleave, Precision Strike, Bulwark Reposition).
   - **Configurable Damage Engine**: Balanced formula combining effort foundation (50 base dmg), volume scaling (10 dmg/rep), calibrated bodyweight baseline (65 kg equivalent), square-root diminishing returns on heavy external load, and set classification multipliers.
   - **After-Action Report (AAR)**: Full military debriefing modal with mission outcome, hostile dossier, munitions tonnage, combat damage, Glory Bonus XP, promotion progress bar, and battle honors.
   - **Decoupled Progression**: 100% of earned workout XP, level progression, and exercise history are preserved independently of enemy survival.

3. **Workout Logging & Exercise Armory**:
   - **107-Exercise Armory Catalog**: Categorized by 9 equipment types (Barbell, Dumbbell, Bodyweight, Cable, Machine, Kettlebell, Band, Smith Machine) and 10 muscle groups.
   - **Search & Aliases**: Instant filtering matching names, acronyms, and common terms (e.g., 'rdl', 'ohp', 'bench press', 'bss').
   - **Custom Exercises & Favorites**: Users can create custom exercises directly in SQLite and star favorite exercises for 1-tap filtering.
   - **Fast Set Logging & Classifications**: Tap to cycle between Working (`W`), Warm-up (`WU`), and Drop Set (`D`).
   - **Bodyweight Exercise Handling**: Clean "BW" representation without requiring arbitrary external weights.
   - **1-Tap Set Duplication**: Duplicate previous set values instantly.
   - **Tactical Rest Timer HUD**: Floating sci-fi timer with presets (30s, 60s, 90s, 120s, 180s), pause/play, +30s extensions, and auto-trigger on set completion.
   - **Repeat Past Workouts**: Re-run recent workouts from the empty state or any archived session in History with pre-populated target sets.
   - **Real-Time Live XP**: Estimated reward ticker dynamically calculates earned XP as sets are logged.

4. **Persistent SQLite Storage**:
   - Version-tracked database migration runner (`schema_migrations`, up to Migration 4).
   - Relational tables: `character_profile`, `workout_sessions`, `workout_exercises`, `workout_sets`, `xp_transactions`, `custom_exercises`, `exercise_favorites`, `combat_encounters`, `coop_attack_queue`, and `coop_active_raid`.
   - Data persists across app restarts, background kills, and device reboots.

5. **Character Progression & Warhammer 40K Lore**:
   - Polynomial level curve ($L = 1$ to $100$) in `src/services/progression/rankEngine.ts`.
   - Full catalog covering **20 major Warhammer 40K factions** (Imperium, Chaos, and Xenos).
   - Searchable and filterable faction codex with live allegiance pledging.

6. **Quality Assurance**:
   - 100% clean TypeScript type check (`npm run typecheck` passes with 0 errors).
   - Automated test suite (`npm test`) covering **8 test suites** (XP formulas, rank engine, faction catalog, 107-exercise catalog, search/aliases, workout cloning, solo combat damage/idempotency, and co-op battle privacy/idempotency).

---

### Incomplete / Explicitly Deferred to Future Milestones

- Live synchronized multiplayer sessions, voice chat, and global competitive leaderboards (asynchronous raid design is intentionally lightweight and async).
- Push notifications for boss defeats.
- In-app purchases, microtransactions, or paywalls.
- 3D character models and heavy graphics shaders.
- Equipment inventory equipping and cosmetic loadouts.
- Rest day consistency bonuses and habit tracking.

---

### Recommended Next Milestone: Milestone 4

1. **Equipment & Cosmetic Unlocks System**:
   - Create an equipment catalog (Armor, Weapons, Insignias, Purity Seals, Banners).
   - Award specific equipment items when completing squad raids or reaching rank promotions.
2. **Personal Records & Exercise History**:
   - Detect and celebrate personal records (e.g. highest weight on Bench Press or highest reps on Pull-ups).
   - Add historical PR indicators on the workout logger.
3. **Rest & Streak Tracking**:
   - Track workout streak consistency while rewarding scheduled rest days to prevent overtraining.
