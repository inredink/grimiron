# Project Status: GrimIron

## Current Status: Milestone 10 (Complete Settings System for the Workout RPG) Completed ✅

**Date**: October 2026
**Framework**: React Native with Expo SDK 57, TypeScript, Expo Router, expo-sqlite, expo-keep-awake, expo-image-picker, expo-file-system, and Supabase (Auth, Postgres, RLS, Realtime).

---

### What Works Right Now

1. **Complete Tactical Settings System (`app/settings.tsx`)**:
   - **Accessible Navigation**: Quick-access gear icons in the top terminal header on both the Character Home Screen (`app/(tabs)/index.tsx`) and Workout Mission Screen (`app/(tabs)/workout.tsx`), accessible immediately without scrolling.
   - **Centralized Preference Engine (`src/services/database/settingsRepository.ts`, `src/types/settings.ts`)**:
     - Idempotent SQLite key-value persistence in `app_settings` with namespaced keys, typed defaults, and immediate reactivity via `AppContext`.
     - Seven distinct organized categories with segmented pills and dedicated cards:
       1. **Workout & Logging**: W1 Weight Units (lbs/kg non-destructive conversion & display formatting), W2 Distance Units (miles/km), W4 Default Rest Duration presets, W5 Auto-start Rest Timer, W6 Keep Screen Awake (prevents display sleep during active workout), W9 Continuous Draft Auto-Saving, W10 Finish-Workout Confirmation, W11 Unsaved Changes Warning, W13 Independent Timer Sound & Vibration Alerts, W14 Exercise Library Sorting (A-Z, Muscle, Recent) & Pinned Favorites, W15 Default Weight Entry Behavior (weighted, bodyweight, assisted).
       2. **Training Programs & Scheduling**: T1 Weekly Workout Goal (2-6 days), T2 Preferred Training Days with multi-day circular toggles, T3 Week Starts On (Monday vs Sunday calendar boundaries), T6 Recovery-Day Preference (Rest/Active/Deload) & Bounded Recovery XP (+50 XP) with anti-farming protection and one-tap claim action, T7 Missed-Session Handling (reschedule suggestion, neutral reminder, keep schedule, manual), T8 Program Reminders, T10 Deload & Recovery Block Reminders.
       3. **RPG, Faction & Campaign**: G7 Mission Objective Alerts, G8 Weekly Raid Spawn Day (Friday vs Saturday schedule alignment), G9 Raid Cycle Expiration Reminders, G10 Battle Result Presentation (Full AAR Dossier vs Concise Summary), G11 Co-op Squad Contribution Visibility (Full Damage Share vs Minimal Co-op).
       4. **Notifications & Reminders**: N1 Workout Reminders, N7 Achievement Unlock Toasts, N8 Rank Promotion Alerts, N9 Weekly Tactical Performance Summary, N10 Quiet Hours silence window supporting overnight intervals crossing midnight (e.g. 22:00 to 08:00).
       5. **Appearance & Accessibility**: A1 App Theme (Dark, System, Light), A2 Curated Accessible Accent Palette (Plasma Cyan, Auramite Gold, Blood Crimson, Vulkan Emerald, Warp Purple, Mars Rust), A3 Text Size scaling, A5 Sound Effects master toggle, A6 Haptic Feedback master toggle with live bridge control, A7 High Contrast mode, A9 Language specification (English US lore specification), A10 Date Formatting (YYYY-MM-DD, MM/DD/YYYY, DD/MM/YYYY) and 12h/24h time formatting without mutating UTC timestamps.
       6. **Privacy, Account & Multiplayer**: P1 Workout Detail Privacy (Private by default, Squad Only, Public), P2 Share Co-op Battle Contributions, P3 Tactical Profile Visibility, P4 Custom Subfaction Visibility, P5 Squad Invitation Policy, P7 Account Management status, P8 Safe Cloud Session Sign-Out, P9 Irreversible 2-Step Account Purge Workflow requiring typing "DELETE".
       7. **Help, Troubleshooting & App Information**: H1 App Overview & Tactical Guidance Modal, H2 Workout Logging Field Manual Modal, H3 Interactive Problem Reporting Form with category selector and safe diagnostics exporter, H4 Real-Time System Diagnostics Modal (SQLite record counts, WAL engine status, sync status), H5 Reset Onboarding Directives without deleting records, H6 App Version badge derived from `app.json` (v1.0.0), H7 Privacy & Data Storage Disclosure Modal.

2. **Custom Subfaction Creator & Emblem Uploader (Migration 13)**:
   - **Dedicated Management Modal (`CustomSubfactionManagerModal.tsx`)**: Easily accessible from Faction Codex (`app/(tabs)/factions.tsx`) and Character Terminal (`app/(tabs)/index.tsx`). Displays active subfactions, allegiance state, and actions to create, switch, edit, duplicate, archive, or delete.
   - **Comprehensive Subfaction Builder Form (`CustomSubfactionModal.tsx`)**:
     - **Required Fields**: Custom Name (trimmed, max 40 chars, client-side & database duplicate check per user) and Parent Faction (selected from all 20 major armies).
     - **Optional Narrative & Lore Fields**: Custom lore/background story, battle motto/cry, adaptive homeworld/stronghold field (customizes label based on parent faction: Fortress-Monastery, Tomb World, Sept World, Craftworld, Forge World, etc.), and 10 tactical doctrine tags.
     - **Configurable Accent Theme**: Primary, secondary, and accent color palette presets.
   - **Reliable User-Uploaded Subfaction Icons**:
     - Optional image upload directly from the device's photo library via `expo-image-picker`.
     - Aspect-ratio-preserving square preview with instant toggle between `contain` (un-cropped emblem) and `cover` (circular avatar fill) modes.
     - Automatic validation: supports transparent PNG, JPEG, and WebP, enforces max 5 MB file size and max 4096px dimensions.
     - Device-local persistence: Copies uploaded images to local app documents directory (`subfaction_icons/`) using `expo-file-system/legacy` (no heavy base64 strings in SQLite).
     - Full lifecycle actions: Upload picture, preview, replace with new picture, or remove custom picture and return cleanly to the official verified parent faction symbol fallback.
   - **Codex & Dossier Seamless Integration**:
     - Custom subfactions appear directly inside the parent army's subfaction grid alongside official subfactions with `[CUSTOM]` badges and "+ FOUND NEW" creation chips.
     - Swearing allegiance updates character profile, tactical dossier, and app theme.
     - Inherits 100% of parent faction combat attacks, weapon compatibility, and ranking ladders with zero duplicate systems.
   - **Subfaction Lifecycle & Safeguards**:
     - Duplicate subfaction creates an independent copy with unique ID.
     - Archiving hides subfactions without deleting historical data.
     - Permanent deletion prompts confirmation and cleans up local image files from disk.

2. **In-Progress Workout Auto-Save & Crash Recovery (Migration 9)**:
   - Persists active workout draft state (including exercises, completed sets, reps, weights, units, and linked mission/encounter IDs) to SQLite table `active_workout_draft`.
   - Automatically restores active workouts across sudden crashes, background app termination, or device restarts.
   - Idempotently clears draft storage upon explicit workout completion or cancellation.

2. **Training Program Rest Day Controller & Non-Penalizing Progression**:
   - **Rest Day Recovery Logging**: Generates completed recovery records with zero required sets and zero lifting tonnage, explicitly honoring central nervous system and joint restoration.
   - Dedicated "LOG RECOVERY DAY & ADVANCE" controller rendered in `ProgramCenterModal.tsx` unblocks users on scheduled rest days and advances program session index without assessing adherence penalties.

3. **Co-op Raid Victory Settlement & Glory Distribution**:
   - Inscribes slain cooperative raid bosses into `battle_history` with cooperative encounter mode, calculating participant damage shares and breakdown across squad members.
   - Automatically awards Glory XP (+500 XP) to the player upon boss defeat with idempotent protection against duplicate claims.

4. **Planetary Campaign Theater SQLite Synchronization**:
   - Automatically synchronizes evaluated campaign graph node progress to the local database table `campaign_node_progress` during workout completion and app startup.
   - Maintains persistent snapshot of unlock timestamps, completion dates, and requirement metric statuses.

5. **Multi-Account / Supabase Cloud Profile Binding**:
   - **Cloud Profile Synchronization**: Harmonizes cloud Supabase account profile data (display name and faction allegiance) with local SQLite character storage while safely preserving local level, accumulated XP, and workout history.

6. **Warfront: Daily Engagements & Battle Board (`WarfrontDailyBoardModal.tsx`)**:
   - **Stable 3-Card Date Rotation**: Seeded by calendar date (`YYYY-MM-DD`) and persisted in SQLite (`daily_rotations`). Rerolls on app refresh or tab switching are strictly prevented.
   - **14-Day History Buffer**: Tracks recent encounters to eliminate stale repeats and ensure continuous daily variety.
   - **8 Operational Categories**: Filterable by Recon, Assault, Defense, Sabotage, Hunting, Special Ops, Escalating, and Co-op Raids.
   - **Direct Deployment**: Deploys the encounter's mission and hostile directly into standard workout logging. Completed workouts automatically mark daily encounters as completed and credit bonus rewards.

7. **110+ Encounter Templates Catalog (`src/content/encounters/`)**:
   - Full modular catalog spanning all 8 operational categories and representing all 20 Warhammer 40k factions with lore-accurate enemies, briefings, tactical objectives, recommended sets/intensity, base HP, glory XP, and combat modifiers.

8. **Deterministic Procedural Boss Generator (`bossGenerator.ts`)**:
   - **Mulberry32 PRNG**: Generates reproducible, seed-based enemy commanders without external LLM/API dependencies.
   - **Curated 20-Faction Pools**: Faction-tailored names, honorific titles, signature wargear, combat traits, and lore.
   - **3 Dynamic Boss Phases**: Distinct phase thresholds (Phase 1 at 100% HP, Phase 2 Enraged at 66% HP, Phase 3 Overload at 33% HP) with dynamic tactical taunts and damage profiles.

9. **Weekly Raid Boss System (`WeeklyRaidModal.tsx`)**:
   - Configurable Friday vs. Saturday spawn day deployment preference stored in `warfront_settings`.
   - Smart Health Scaling (2,400 HP solo vs. 7,500 HP squad) with atomic damage tracking and single-claim glory rewards (+500 XP).

10. **Structured Training Programs (`ProgramCenterModal.tsx`)**:
    - 7 Core Program Categories (GVT, PPL, Upper/Lower, Full-Body, 5×5, Hypertrophy, Calisthenics) + Custom.
    - Separation of planned workouts from actual performance (sets remain uncompleted until actively logged by the user).

11. **Planetary Campaign Map & Directed Graph Theater (`CampaignMapModal.tsx`)**:
    - Directed acyclic graph with sequential routes, branch choices, and convergence boss nodes.

12. **Faction-Specific Missions & Mission Center (`MissionCenterModal.tsx`)**:
    - 63 Lore-Accurate Missions across all 20 factions tracking 10+ real-world workout objective metrics.

13. **Battle History & 3-Scope Achievement System**:
    - Immutable combat encounter snapshots in `battle_history`.
    - 220 persistent achievements across User, Character, and Squad scopes.

14. **Quality Assurance & Verification**:
    - 100% clean TypeScript check (`npm run typecheck` passes with 0 errors).
    - Automated test suite (`npm test`) covering **17 comprehensive test suites** and 170+ assertions with 100% green output.
    - Full project audit script (`npm run audit`) verifying 0 critical errors across safe area insets, 146 symbol assets, and haptic feedback architecture.

---

### Incomplete / Explicitly Deferred to Future Milestones

- Live synchronized multiplayer voice chat and global competitive leaderboards.
- Push notifications for boss defeats.
- In-app purchases, microtransactions, or paywalls.
- 3D character models and heavy graphics shaders.
