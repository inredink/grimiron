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
