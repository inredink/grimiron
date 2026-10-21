# Architecture Specifications: GrimIron

## 1. High-Level System Architecture

GrimIron is built around a unidirectional data flow and clean separation of concerns. The fictional setting (Warhammer 40,000 in Milestone 1) is completely decoupled from the workout logging and progression math.

```
┌─────────────────────────────────────────────────────────────┐
│                       UI Layer (React Native)               │
│  app/(tabs): index (Dossier), workout (Logger),              │
│              history (Archives), factions (Codex)           │
│  src/components: Reusable Dark Military Sci-Fi UI tokens    │
└──────────────────────────────┬──────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────┐
│                    Application State Layer                  │
│  src/context/AppContext.tsx                                 │
│  - Active session state & workout-in-progress buffer        │
│  - Reactive subscribers & cache invalidation                │
└──────────────┬──────────────────────────────┬───────────────┘
               │                              │
               ▼                              ▼
┌──────────────────────────────┐ ┌────────────────────────────┐
│    Domain Progression Layer  │ │  Universe & Content Layer  │
│  src/services/progression/   │ │  src/content/              │
│  - xpCalculator.ts           │ │  - types.ts (UniverseAgn.) │
│  - rankEngine.ts             │ │  - warhammer40k/           │
└──────────────┬───────────────┘ └────────────┬───────────────┘
               │                              │
               ▼                              ▼
┌─────────────────────────────────────────────────────────────┐
│                     Local Persistence Layer                 │
│  src/services/database/                                     │
│  - db.ts (expo-sqlite migration engine)                     │
│  - workoutRepository.ts (CRUD sessions, exercises, sets)    │
│  - characterRepository.ts (Profile, XP, Career aggregation) │
└─────────────────────────────────────────────────────────────┘
```

---

## 2. Universe-Agnostic Content System

To ensure the app does not remain permanently coupled to Warhammer 40,000 lore, all universe content adheres to generic interfaces defined in `src/content/types.ts`:

- **`UniverseCatalog`**: Root registry object containing universe id, name, description, default factions, and faction lists.
- **`Faction`**: Allegiance group with theme colors, vector icon identifiers, subfactions, rank ladders, and inclusion criteria notes.
- **`Subfaction`**: Specialized subdivisions (e.g. Chapters, Regiments, Clans, Dynasties) with primary/secondary/accent color palettes and mottos.
- **`RankTier`**: Linear progression tiers with minimum required XP thresholds, canonical lore descriptions, and flags distinguishing established lore from game-modeled ranks.

A future universe (such as Fantasy, Cyberpunk, or an original IP) can be added simply by creating a parallel content directory (e.g., `src/content/cyberpunk/`) that implements `UniverseCatalog`, without altering UI or database code.

---

## 3. Database Schema & Migration Strategy

Storage is handled by **SQLite** using Expo's modern synchronous API (`openDatabaseSync`).

### Migration Engine (`schema_migrations`)
Every schema change is tracked by integer version in `schema_migrations`. Subsequent migrations run in numerical order and check `version` to prevent breaking existing user data.

### Tables & Relationships
1. **`character_profile`**:
   - `id INTEGER PRIMARY KEY CHECK (id = 1)`
   - `universe_id TEXT NOT NULL`
   - `faction_id TEXT NOT NULL`
   - `subfaction_id TEXT`
   - `character_name TEXT NOT NULL`
   - `total_xp INTEGER NOT NULL DEFAULT 0`
   - `current_level INTEGER NOT NULL DEFAULT 1`
   - `created_at TEXT`, `updated_at TEXT`
2. **`workout_sessions`**:
   - `id TEXT PRIMARY KEY`
   - `title TEXT NOT NULL`
   - `started_at TEXT NOT NULL`, `finished_at TEXT`
   - `notes TEXT`
   - `total_xp_earned INTEGER NOT NULL DEFAULT 0`
   - `is_completed INTEGER NOT NULL DEFAULT 0`
3. **`workout_exercises`**:
   - `id TEXT PRIMARY KEY`
   - `session_id TEXT NOT NULL REFERENCES workout_sessions(id) ON DELETE CASCADE`
   - `name TEXT NOT NULL`
   - `sort_order INTEGER NOT NULL DEFAULT 0`
   - `notes TEXT`
4. **`workout_sets`**:
   - `id TEXT PRIMARY KEY`
   - `exercise_id TEXT NOT NULL REFERENCES workout_exercises(id) ON DELETE CASCADE`
   - `set_number INTEGER NOT NULL`
   - `reps INTEGER NOT NULL DEFAULT 0`
   - `weight REAL NOT NULL DEFAULT 0`
   - `unit TEXT NOT NULL DEFAULT 'lbs'`
   - `is_completed INTEGER NOT NULL DEFAULT 0`
5. **`xp_transactions`**:
   - `id TEXT PRIMARY KEY`
   - `session_id TEXT REFERENCES workout_sessions(id) ON DELETE CASCADE`
   - `amount INTEGER NOT NULL`
   - `source_type TEXT NOT NULL`
   - `details_json TEXT`
   - `created_at TEXT NOT NULL`

---

## 4. Experience (XP) & Progression Formulation

All XP calculations are centralized in `src/services/progression/xpCalculator.ts`.

### Mathematical Formulation

$$\text{Total Session XP} = \min\left(\text{Base} + \text{Sets} + \text{Reps} + \text{Volume}, \text{MaxCap}\right)$$

Where:
- $\text{Base} = 100 \text{ XP}$ (awarded only if $\ge 1$ set is completed).
- $\text{Sets} = \min(20 \times N_{\text{completed\_sets}}, 400)$.
- $\text{Reps} = \min(1 \times N_{\text{completed\_reps}}, 150)$.
- $\text{Volume} = \min\left(\sum \min\left(2 \times \sqrt{\text{reps} \times \text{weight}_{\text{kg}}}, 25\right), 250\right)$.
- $\text{MaxCap} = 1,000 \text{ XP}$.

### Level Progression Formula

$$\text{Cumulative XP required for Level } L = \lfloor 200 \times (L - 1)^{1.5} + 100 \times (L - 1) \rfloor$$

This produces a gentle, rewarding polynomial curve:
- Level 1: 0 XP
- Level 2: 300 XP (~1-2 workouts)
- Level 3: 765 XP (~3-4 workouts)
- Level 4: 1,339 XP
- Level 5: 2,000 XP
- Level 10: 6,289 XP
- Level 20: 18,018 XP

---

## 5. Battle History System & Immutable Snapshot Architecture

To guarantee that combat encounters can be revisited with 100% fidelity even if future app updates modify enemy balance or faction catalogs, every completed or abandoned encounter stores an immutable snapshot in SQLite table `battle_history`:

- **Immutable Snapshot (`snapshot_json`)**:
  - Captures enemy attributes (name, glyph, faction, initial and final health).
  - Captures the complete chronological combat timeline (`battle_started`, `strike_landed`, `critical_strike`, `phase_change`, `enemy_slain`, `tactical_retreat`) with ISO timestamps and individual attack names.
  - Captures participant roster (`battle_participants`) with callsigns, faction snapshots, total attacks, damage dealt, and exact damage share %.
  - Preserves privacy: raw workout weights, repetitions, and personal notes remain local. Only aggregate combat descriptors are stored.
  - Links directly to local training session ID (`session_id`) to correlate physical effort with combat outcomes.
- **Filtering & Career Telemetry**:
  - `battleHistoryRepository.ts` provides multi-criterion querying: outcomes (`victory`, `defeat`, `abandoned`), encounter modes (`solo`, `coop`), and sorting (`recent`, `highest_damage`).

---

## 6. Multi-Scope Persistent Achievement Architecture

The achievement system tracks real-life consistency, in-game character honors, and collaborative squad achievements across 11 thematic categories with 220 distinct definitions:

```
┌─────────────────────────────────────────────────────────────┐
│                      Achievement Scopes                     │
├─────────────────┬──────────────────────────┬────────────────┤
│   User Scope    │     Character Scope      │  Squad Scope   │
│ (Account-wide   │ (Faction rank, level,    │ (Co-op raids,  │
│  PRs, volume,   │  solo boss purges,       │  shared boss   │
│  streak habits) │  customizations)         │  damage)       │
└────────┬────────┴────────────┬─────────────┴────────┬───────┘
         │                     │                      │
         ▼                     ▼                      ▼
┌─────────────────────────────────────────────────────────────┐
│           Pure Functional Evaluator & Metric Resolver       │
│  src/services/progression/achievementEvaluator.ts           │
│  - Evaluates AchievementEvaluationContext metrics           │
│  - Decoupled from native SQLite for Node CLI verification   │
└──────────────────────────────┬──────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────┐
│             Database Persistence & Idempotency              │
│  src/services/database/achievementRepository.ts             │
│  - UNIQUE(achievement_id, scope, target_id)                 │
│  - Atomic award insertion (no duplicate XP or popups)       │
│  - Live progress caching (achievement_progress)             │
│  - Offline notification queue (pending_notifications)       │
└─────────────────────────────────────────────────────────────┘
```

### Key Architectural Safeguards
1. **Strict Idempotency**:
   - SQLite table `achievement_awards` enforces `CONSTRAINT uq_ach_award UNIQUE(achievement_id, scope, target_id)`.
   - Re-running evaluation on app boot, workout completion, or screen refresh never grants duplicate XP or triggers duplicate banners.
2. **Historical Backfill**:
   - `backfillHistoricalAchievements()` evaluates career metrics against historical workout sessions, sets, and combat encounters, automatically conferring retroactive honors to existing users.
3. **Decoupled Evaluator**:
   - The evaluation engine is pure TypeScript and can run headlessly in test suites without mock SQLite drivers. Database persistence is handled via modular repository handlers.

---

## 7. Faction-Specific Mission System & Command Terminal Architecture

The Mission System connects real-world workout effort directly to narrative Warhammer 40,000 faction operations, combat objectives, promotions, and rank titles.

```
┌─────────────────────────────────────────────────────────────┐
│                    Command Terminal UI                      │
│  MissionCenterModal.tsx / MissionCard.tsx / DetailModal     │
│  - Futuristic military sci-fi HUD                           │
│  - Dynamic filters: ALL, AVAILABLE, ACTIVE, COMPLETED, LOCKED│
│  - Category tabs: Assault, Defense, Patrol, Boss, Special   │
└──────────────────────────────┬──────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────┐
│                 Domain Progression Evaluator                │
│  src/services/progression/missionEvaluator.ts               │
│  - Evaluates eligibility (rank tier, subfaction, prereqs)   │
│  - Tracks 10+ physical & combat metrics against targets     │
│  - Pure TypeScript (zero native dependencies for test CLI)  │
└──────────────────────────────┬──────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────┐
│                 Engine & Repository Layer                   │
│  src/services/database/missionEngine.ts                     │
│  src/services/database/missionRepository.ts                 │
│  - Evaluates active missions upon finishing workouts        │
│  - Atomic reward claim & XP distribution                    │
│  - SQLite Migration 6: table mission_progress               │
│    UNIQUE(character_id, mission_id) ensures idempotency    │
└─────────────────────────────────────────────────────────────┘
```

### Key Architectural Tenets
1. **Universal Faction Coverage & Multi-Tier Progression**:
   - Comprehensive data catalog (`src/content/missions/catalog.ts`) featuring **63 lore-accurate missions** spanning all 20 Warhammer 40,000 factions and iconic subfactions (e.g. Space Wolves, Ultramarines, Farsight Enclaves).
   - Multi-tier ladder per faction: Tier 1 (Initiate/Patrol) → Tier 2 (Veteran/Incursion/Skirmish) → Tier 3 (Master Rites/Decapitation/Boss purge).
2. **Real-World Workout Metric Mapping**:
   - Objective types cleanly map physical training to battlefield telemetry:
     - `complete_workouts`: Deployments completed.
     - `complete_sets`: Discipline and working set volume.
     - `volume_kg`: Heavy ordnance and payload tonnage hauled.
     - `target_reps`: Rapid weapon fire and relentless repetitions.
     - `exercise_category_sets`: Targeted muscle training (e.g. chest, legs, back).
     - `combat_damage`: Kinetic or psychic damage delivered to enemies.
     - `combat_attacks`: Volleys fired during solo or co-op encounters.
     - `defeat_enemy`: Warlords and strike leaders neutralized.
     - `personal_records`: Feats of transhuman strength.
3. **Faction Switching & Historical Allegiance Integrity**:
   - `mission_progress` persists `faction_id` alongside the character record.
   - If a player switches faction, all completed missions and unlocked titles for their previous faction remain permanently preserved in the database.
4. **Strict Idempotency & Duplicate Prevention**:
   - SQLite table `mission_progress` enforces `CONSTRAINT uq_char_mission UNIQUE (character_id, mission_id)`.
   - Rewards and XP grants can only be claimed once (`is_claimed = 1`), preventing double-claiming on re-evaluation or network retries.

---

## 8. Structured Training Programs & Planetary Campaign Map Architecture

The Training Programs and Campaign Map subsystem unifies structured real-world training regimens with overarching tactical sector conquest, multi-branch routes, and cooperative battle progression.

```
┌─────────────────────────────────────────────────────────────┐
│                 Training Program Center HUD                 │
│  ProgramCenterModal.tsx / CampaignMapModal.tsx              │
│  - Active program enrollment dashboard & schedule           │
│  - 7 standard categories (GVT, PPL, Upper/Lower, 5×5, etc.) │
│  - Planned Rest Day window ("Rest & Bio-Recovery")          │
│  - Directed graph campaign theater map with branch routes   │
└──────────────────────────────┬──────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────┐
│                 Domain Engine & Evaluator                   │
│  src/services/progression/programEngine.ts                  │
│  src/services/progression/campaignEvaluator.ts              │
│  - Prepopulates workout logger (planned sets NOT completed) │
│  - Evaluates session adherence & records deviations         │
│  - Evaluates topological unlock criteria and branch forks   │
│  - Program-independent criteria enable multi-program squads │
└──────────────────────────────┬──────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────┐
│                Database Persistence (Migration 7)           │
│  src/services/database/programRepository.ts                 │
│  src/services/database/campaignRepository.ts                │
│  - user_programs: immutable program snapshot, current block │
│  - program_session_records: actual vs prescribed volume     │
│  - campaign_node_progress: UNIQUE(character_id, node_id)    │
│  - custom_training_programs: user-defined splits            │
└─────────────────────────────────────────────────────────────┘
```

### Key Architectural Tenets
1. **Planned vs Actual Workout Decoupling**:
   - `populateWorkoutFromScheduledSession()` populates the workout logger with planned exercises, target sets, and prescribed repetitions or rest intervals.
   - **Critical Rule**: All prepopulated sets have `isCompleted: false` and `weight: 0`. Planned sets are never presented as completed until logged by the user.
2. **Responsible Recovery & Rest Day Dignity**:
   - Scheduled rest days (`isRestDay: true`) have no lifting exercises and emphasize hydration, sleep, and central nervous system repair.
   - Rest days do not deduct adherence or trigger missed-workout penalties.
3. **Multi-Program Campaign Compatibility**:
   - Campaign nodes use program-independent criteria (eligible completed workouts, volume tonnage, combat damage, enemy defeats).
   - Player 1 (GVT), Player 2 (PPL), and Player 3 (5×5) can all participate in the same crusade campaign and contribute to shared encounters.
4. **Graph Navigation & Branching Routes**:
   - Represented as a directed acyclic graph (DAG) with prerequisites and successors.
   - Branch points allow tactical choices (e.g., Subterranean Sabotage vs Orbital Uplink Spire), with either branch path satisfying convergence prerequisites to unlock fortress boss battles.

---

## 9. Warfront: Daily Engagements & Weekly Raid System

The Warfront subsystem introduces dynamic, date-driven daily tactical engagements, procedural enemy commander generation, and recurring weekly raid boss encounters that link directly to workout sessions.

```
┌─────────────────────────────────────────────────────────────┐
│                    Warfront UI Layer                        │
│  - WarfrontDailyBoardModal.tsx (3-card daily briefing board)│
│  - WeeklyRaidModal.tsx (3-phase boss gauge, spawn schedule) │
│  - app/(tabs)/index.tsx & workout.tsx (quick launches)      │
└──────────────────────────────┬──────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────┐
│                  Warfront Domain Engine                     │
│  src/services/progression/warfrontEngine.ts                 │
│  - Date-based deterministic rotation (locked per date)      │
│  - 14-day history buffer (prevents repetitive offerings)    │
│  - Weekly cycle timing calculation (Friday vs Saturday)     │
│  - Unresolved boss policy ('escaped' status, no false wins) │
│  - Idempotent raid damage accumulation & reward claims      │
└──────────────┬──────────────────────────────┬───────────────┘
               │                              │
               ▼                              ▼
┌──────────────────────────────┐ ┌────────────────────────────┐
│   Procedural Boss Generator  │ │  Encounter Catalog (110+)  │
│  src/services/progression/   │ │  src/content/encounters/   │
│  bossGenerator.ts            │ │  - recon (14 templates)    │
│  - Seeded Mulberry32 PRNG    │ │  - assault (18 templates)  │
│  - 20 faction naming pools   │ │  - defense (14 templates)  │
│  - Signature wargear & traits│ │  - sabotage (14 templates) │
│  - 3 dynamic combat phases   │ │  - hunting (14 templates)  │
│    (100%, 66%, 33% HP tiers) │ │  - special_ops (12 templ.) │
│                              │ │  - escalating (12 templ.)  │
│                              │ │  - coop (12 templates)     │
└──────────────┬───────────────┘ └────────────┬───────────────┘
               │                              │
               ▼                              ▼
┌─────────────────────────────────────────────────────────────┐
│              Database & Storage Layer (Migration 8)         │
│  src/services/database/warfrontRepository.ts                │
│  - daily_rotations: rotation_date PRIMARY KEY, offered_ids  │
│  - weekly_raids: cycle_id PRIMARY KEY, boss_data, status    │
│  - recent_encounters_history: encounter_id, selected_date   │
│  - warfront_settings: preferred_spawn_day ('friday'/'sat')  │
│  - Pluggable WarfrontStorageAdapter: in-memory & SQLite     │
└─────────────────────────────────────────────────────────────┘
```

### Core Architectural Decisions:

1. **Refresh-Proof Daily Rotation**:
   - Daily offerings are generated using a deterministic date seed (`daily_YYYY-MM-DD`) and persisted in `daily_rotations`.
   - Reloading the app, navigating between tabs, or restarting the client reads the persisted record, guaranteeing that today's 3 offered missions never reroll or alter during the day.
2. **14-Day Anti-Repetition Buffer**:
   - `recent_encounters_history` tracks templates selected in the last 14 days, filtering them out of future selection pools to ensure ongoing freshness and variety.
3. **Deterministic Procedural Boss Generator**:
   - Given a week cycle seed (e.g., `2026_W42`), a Mulberry32 PRNG deterministically selects commander names, honorific titles, signature weapons, combat traits, and lore from tailored pools covering all 20 Warhammer 40,000 factions without external API dependencies.
   - Bosses possess 3 distinct combat phases (Phase 1 Frontline at 100%, Phase 2 Enraged at 66%, Phase 3 Overload at 33%), each featuring unique taunts and tactical status descriptors.
4. **Weekly Raid Lifecycle & Unresolved Boss Policy**:
   - Players can configure their preferred weekly raid spawn day (Friday vs. Saturday).
   - Boss HP scales intelligently: 2,400 HP for individual solo operatives vs. 7,500 HP for cooperative squads.
   - When a raid cycle expires, `reconcileExpiredRaids` automatically marks un-defeated bosses as `'escaped'` rather than `'defeated'`, preserving historical damage and participant logs without generating false victories.
5. **Pluggable Storage Adapter**:
   - `WarfrontStorageAdapter` provides complete separation between domain logic and SQLite. Node.js unit tests run against `inMemoryWarfrontStorage`, while the React Native application binds `sqliteWarfrontStorage` at startup.

---

## 11. Custom Subfaction Architecture & User-Uploaded Insignias (Migration 13)

The Custom Subfaction system empowers players to forge their own military identities under any of the 20 official parent armies (e.g., T'au Empire "The Obsidian Spear", Space Marines "The Ashen Wardens", Orks "Da Ironbreakaz", Necrons "The Sepulchral Dynasty") while cleanly preserving existing progression, combat mechanics, and official lore catalogs.

### Architectural Principles:
1. **Zero Catalog Mutation**: Official faction catalogs in `src/content/warhammer40k/factions.ts` remain immutable constants. Custom subfactions extend the universe without polluting or overwriting baseline data.
2. **View Adapter Pattern (`toSubfactionView`)**: Custom records are translated into standard `Subfaction` objects with `isCustom: true` and `customIconUri`. Existing UI components (`PlaceholderPortrait.tsx`, `TerminalButton.tsx`) consume custom subfactions transparently.
3. **Parent Faction Combat Baseline**: Custom subfactions inherit 100% of their parent army's attack catalog, weapon classifications, and combat multipliers. `resolveFactionAttack()` matches against the parent `factionId`, requiring no custom attack boilerplate.
4. **Reliable Local Device Icon Storage**:
   - Uses `expo-image-picker` to select photos from the user's mobile photo library.
   - Files are copied to a dedicated local directory (`<documentDirectory>/subfaction_icons/`) using `expo-file-system/legacy`.
   - File paths (not heavy base64 strings) are stored in SQLite.
   - Max file size (5 MB) and dimension bounds (4096px) are strictly enforced.
   - Supports PNG, JPEG, and WebP, with full alpha-channel transparency preservation for clean sci-fi insignia overlays.
   - Aspect ratio toggle: users can switch between `contain` (un-cropped emblem fit) and `cover` (circular fill).
   - Graceful fallback: If no image is provided, or if an icon is removed, the app automatically renders the verified monochrome SVG/PNG symbol of the parent army.

```
┌─────────────────────────────────────────────────────────────┐
│                 Custom Subfaction Architecture              │
├─────────────────────────────────────────────────────────────┤
│ User Creation Form (`CustomSubfactionModal.tsx`)            │
│ ├─ Required: Name (trimmed, <=40 chars), Parent Faction ID  │
│ ├─ Optional: Lore, Motto, Adaptive Homeworld, Doctrine Tags │
│ └─ Optional: Photo Picker -> Local copy to subfaction_icons/│
│                                │                            │
│                                ▼                            │
│ SQLite Persistence Layer (`custom_subfactions` table)       │
│ ├─ Migration 13 with indexes on user_id & parent_faction_id │
│ └─ Fast CRUD: create, update, duplicate, archive, delete    │
│                                │                            │
│                                ▼                            │
│ Pure View Adapter (`toSubfactionView()`)                    │
│ ├─ Maps record to standard `Subfaction` schema              │
│ ├─ Sets `isCustom: true` and binds `customIconUri`          │
│ └─ Resolves through `getSubfactionById()`                   │
│                                │                            │
│                                ▼                            │
│ Consumption Across Core App                                 │
│ ├─ Codex (`factions.tsx`): [CUSTOM] badge in army subgrid   │
│ ├─ Dossier (`index.tsx`): Live emblem, motto, and homeworld │
│ └─ Combat Engine: Inherits parent army attack catalog       │
└─────────────────────────────────────────────────────────────┘
```

---

## 12. Dedicated Character Arsenal, Equipment Slots, Faction Progression & Raid Loot (Migration 15)

The Equipment and Wargear system introduces an MMORPG-style itemization model where physical training powers combat attacks, while equipped wargear modulates strike damage, precision, and tactical utility.

```
┌─────────────────────────────────────────────────────────────┐
│             Character Arsenal UI (app/(tabs)/index.tsx)     │
│  - EquipmentSlotCard: 7-slot MMORPG grid & combat stat sums │
│  - EquipmentInventoryModal: Filter, Inspect, Equip/Unequip  │
└──────────────────────────────┬──────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────┐
│                 Domain Progression Service                  │
│  src/services/progression/equipmentService.ts               │
│  - calculateEquipmentBonuses (Hard anti-runaway caps)       │
│  - isItemEquipEligible (Faction, Level, Rank checks)        │
│  - Pluggable EquipmentStorageAdapter (Memory vs SQLite)     │
└──────────────┬──────────────────────────────┬───────────────┘
               │                              │
               ▼                              ▼
┌──────────────────────────────┐ ┌────────────────────────────┐
│      Combat Engine Bridge    │ │    Raid Boss Loot Engine   │
│  src/services/combat/        │ │  src/services/progression/ │
│  - damageCalculator.ts       │ │  - raidLootEngine.ts       │
│  - attackEngine.ts           │ │  - warfrontEngine.ts       │
└──────────────┬───────────────┘ └────────────┬───────────────┘
               │                              │
               ▼                              ▼
┌─────────────────────────────────────────────────────────────┐
│             SQLite Persistence Layer (Migration 15)         │
│  - character_inventory (Items owned by player)              │
│  - character_equipment_loadout (Active equipped slots)      │
│  - raid_loot_history (Idempotent drops per weekly raid)     │
└─────────────────────────────────────────────────────────────┘
```

### 1. Equipment Slot Architecture & Faction Slot Configurations
Seven equipment slots are supported (`src/types/equipment.ts`):
- `primary_weapon`
- `secondary_weapon`
- `armor`
- `helmet`
- `insignia`
- `tactical`
- `platform` (Faction-specific Exosuit / Battlesuit / Chassis / Mutation)

The 7th slot dynamically adapts its label and allowed platform archetype to the character's active faction (`src/content/equipment/factionArchetypes.ts`):
- **T'au Empire**: *"BATTLESUIT FRAME"* (`xv25_stealth_suit`, `xv8_crisis_battlesuit`)
- **Space Marines / Grey Knights**: *"TERMINATOR / DREADNOUGHT"* (`terminator_armor`, `centurion_warsuit`)
- **Orks**: *"MEGA-ARMOR RIG"* (`mega_armor_chassis`)
- **Necrons**: *"DESTROYER BODY"* (`destroyer_chassis`)
- **Adeptus Mechanicus**: *"CYBERNETICA CHASSIS"* (`kastelan_rig`)
- **Leagues of Votann**: *"EXOSUIT RIG"* (`exo_frame`)
- **Tyranids**: *"BIOMORPH MUTATION"* (`tyrant_carapace`)

### 2. Pilot Progression Arc (T'au Empire Reference Model)
Progression models how a line recruit ascends through military rank and high-tier raids into an elite battlesuit commander:
- **Tier 1 (Shas'la)**: Standard Fire Warrior wargear (Pulse Rifle, Combat Armor, Sensor Helmet, Photon Grenades).
- **Tier 2 (Shas'ui)**: Pulse Carbine, Reinforced Carapace.
- **Tier 3 (Pathfinder / Vanguard)**: Pulse Blaster, Rail Rifle, EMP Grenades.
- **Tier 4 (Stealth Pilot)**: Level 14+, Rank 4+ (Shas'vre), requires Challenging raid victory. Equips XV25 Stealth Battlesuit (`+45 flat DMG, +12% DMG, +10% Crit`).
- **Tier 5 (Crisis Battlesuit Pilot)**: Level 20+, Rank 6+ (Shas'el), requires Legendary raid victory. Equips XV8 Crisis Battlesuit with Dual Plasma Rifles and Missile Pods (`+75 flat DMG, +20% DMG, +15% Crit`).

### 3. Combat Damage Integration & Anti-Stacking Safeguards
Equipment modifiers are fed directly into combat calculations (`calculateSetDamage` and `createAttackFromSet`) without modifying base workout telemetry:

$$\text{Final Damage} = \left(\text{Base Effort} + \text{Equipped Flat DMG}\right) \times \text{Class Multiplier} \times \left(1 + \text{Equipped Mult}\right) \times \text{Crit Multiplier}$$

To prevent power creep and preserve workout effort as the primary driver of victory, strict anti-stacking caps are enforced:
- **Max Flat Damage Bonus**: `+150`
- **Max Damage Multiplier**: `+35%` (`0.35`)
- **Max Precision Crit Chance**: `+20%` (`0.20`)

### 4. Raid Boss Loot Tables & Claim Idempotency
- Weekly raid boss drops are mapped across three difficulty tiers: `standard`, `challenging`, and `legendary`.
- Drops match the player's active faction and are filtered by level and rank clearance so underleveled or recruit-tier players cannot bypass progression gates.
- Every claimed drop is recorded in SQLite table `raid_loot_history(character_id, raid_id, item_id, claimed_at)` with duplicate protection.
- Inventory is decoupled from faction switches: changing allegiances provisions the new army's basic kit while permanently retaining previously acquired wargear in `character_inventory`.

---

## 11. MMORPG Character Progression, 7-Tier Raid Ladder & Endgame Advancement

```
┌─────────────────────────────────────────────────────────────┐
│                 4 Core Progression Vectors                  │
├──────────────────────────────┬──────────────────────────────┤
│ 1. Character Level           │ 2. Faction Military Rank     │
│ Cumulative workout XP curve  │ Military title hierarchy     │
│ Configurable daily XP cap    │ Gated by Promotion Trials    │
├──────────────────────────────┼──────────────────────────────┤
│ 3. Equipment Gear Power      │ 4. Raid Progression Tier     │
│ Pure equipped-only score     │ 7 structured clearance tiers │
│ Unequipped inventory = 0     │ Authoritative gating checks  │
└──────────────────────────────┴──────────────────────────────┘
```

### 1. Distinction Among the Four Core Progression Concepts
1. **Character Level**: Represents physical training volume and discipline over time. Progresses via cumulative XP along an exponential curve, bounded by the configurable daily training XP cap.
2. **Faction Rank**: Canonical military hierarchy within the sworn army. Advancement requires meeting both minimum XP and completing Promotion Trials.
3. **Equipment Tier & Gear Power**: Tactical potency score derived strictly from *currently equipped* wargear. Items stored in inventory contribute exactly 0 Gear Power.
4. **Raid Progression Tier**: A 7-rung clearance ladder with increasing tactical demands, boss health, and glory rewards.

### 2. The 7-Tier Raid Progression Ladder
```
Tier 1: Initiation Raids    (Level 1+, Rank 1+, 0 GP, Solo HP 1.8k / Squad HP 5k, +300 XP)
   │
   ▼ (Tier 1 Clear)
Tier 2: Field Operations    (Level 5+, Rank 2+, 140 GP, Solo HP 2.8k / Squad HP 8k, +450 XP)
   │
   ▼ (Tier 2 Clear)
Tier 3: Veteran Raids       (Level 10+, Rank 3+, 270 GP, Solo HP 4.2k / Squad HP 13k, +600 XP)
   │
   ▼ (Tier 3 Clear)
Tier 4: Elite Raids         (Level 15+, Rank 4+, 410 GP, Solo HP 6.0k / Squad HP 19k, +800 XP)
   │
   ▼ (Tier 4 Clear)
Tier 5: Champion Raids      (Level 20+, Rank 5+, 550 GP, Solo HP 8.5k / Squad HP 27k, +1,000 XP)
   │
   ▼ (Tier 5 Clear)
Tier 6: Legendary Raids     (Level 25+, Rank 6+, 690 GP, Solo HP 12k / Squad HP 38k, +1,300 XP)
   │
   ▼ (Tier 6 Clear)
Tier 7: Endgame Crusade     (Level 30+, Rank 7+, 840 GP, Solo HP 16k / Squad HP 52k, +1,600 XP)
```

### 3. Authoritative Eligibility Verification & Anti-Carry Gating
- Pure evaluation function `evaluateRaidTierEligibility(tierId, context)` independently validates:
  1. Minimum Character Level
  2. Minimum Faction Military Rank Tier
  3. Minimum Gear Power Score
  4. Prerequisite Raid Clearance
- Returns `{ isEligible, unmetRequirements, primaryLockReason, checks }`.
- **Squad Co-op Gating (`evaluateMultiplayerRaidEligibility`)**: Iterates through every squad participant. If any operative fails any requirement, the deployment is blocked and individual deficiency reports are generated. Undergeared or recruit players cannot enter high-tier raids simply because they have a high-ranked squadmate.

### 4. Promotion Trials Attuned to Raid Clears
- Progression engine `calculateProgression(totalXp, faction, defeatedRaidTiers)` integrates milestone requirements:
  - Rank 3 requires Initiation clear (`tier_1_initiation`).
  - Rank 4 requires Field Operations clear (`tier_2_field_ops`).
  - Rank 5 requires Veteran clear (`tier_3_veteran`).
  - Rank 6 requires Elite clear (`tier_4_elite`).
  - Rank 7 requires Champion clear (`tier_5_champion`).
- Warriors who meet the XP requirement but have not cleared the required trial are held at the trial boundary with `isRankTrialPending: true` and an explicit directive.

### 5. SQLite Persistence: Migration 16 Schema
```sql
CREATE TABLE IF NOT EXISTS character_raid_progression (
  id TEXT PRIMARY KEY,
  character_id TEXT NOT NULL,
  highest_tier_unlocked TEXT NOT NULL DEFAULT 'tier_1_initiation',
  total_raid_victories INTEGER NOT NULL DEFAULT 0,
  last_defeated_tier TEXT,
  last_victory_at TEXT,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS character_raid_summary (
  id TEXT PRIMARY KEY,
  character_id TEXT NOT NULL,
  tier_id TEXT NOT NULL,
  victory_count INTEGER NOT NULL DEFAULT 0,
  first_cleared_at TEXT NOT NULL,
  last_cleared_at TEXT NOT NULL,
  UNIQUE(character_id, tier_id)
);

CREATE TABLE IF NOT EXISTS character_progression_milestones (
  id TEXT PRIMARY KEY,
  character_id TEXT NOT NULL,
  milestone_type TEXT NOT NULL,
  milestone_key TEXT NOT NULL,
  unlocked_at TEXT NOT NULL,
  UNIQUE(character_id, milestone_type, milestone_key)
);
```






