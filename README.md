# GrimIron: The Gamified Warhammer 40,000 Workout Tracker & RPG

> *"I trained in real life, improved my fitness, and advanced my character."*

GrimIron is a cross-platform mobile fitness tracker built with **React Native**, **Expo (SDK 57)**, **TypeScript**, and **expo-sqlite**. It turns everyday physical training into RPG character progression, featuring a dark military sci-fi terminal interface, persistent offline database storage, and a data-driven content catalog representing all 20 major Warhammer 40,000 factions and recognized subfactions.

---

## ⚡ Quick Start: How to Run the App

### Prerequisites
- [Node.js](https://nodejs.org/) (v18+ or v20+)
- [Expo Go app](https://expo.dev/go) installed on your physical iOS or Android phone, OR an emulator/simulator.

### Step 1: Clone the Repository and Install Dependencies
```bash
git clone https://github.com/inredink/grimiron.git
cd grimiron
npm install
```

### Step 2: Start the Expo Development Server
```bash
npm start
```
or to open directly in a browser for quick desktop inspection:
```bash
npm run web
```

### Step 3: Open on Your Phone
1. When `npm start` runs, Expo prints a large **QR code** in your terminal and opens the Metro bundler web dashboard.
2. **On Android**: Open the **Expo Go** app on your phone, tap **Scan QR code**, and point your camera at the terminal.
3. **On iOS**: Open the built-in iOS **Camera** app, point it at the QR code, and tap the banner to open in **Expo Go**.
*(Ensure your phone and computer are connected to the same Wi-Fi network).*

---

## 🧪 Testing and Verification

Run the automated test suite, type checker, or comprehensive app audit anytime with:
```bash
# Run the automated core unit test suite (XP math, level curve, faction integrity)
npm test

# Run the TypeScript type checker across the entire project
npm run typecheck

# Run the comprehensive project audit script
npm run audit
```

---

## 📱 Key Features & Systems

### 1. 🛡️ Character Terminal & Tactical Dossier
- **Tactical Military Sci-Fi Dossier**: Live overview displaying current character callsign, rank, level, sworn allegiance, and career combat honors.
- **Authentic Warhammer 40,000 Faction Heraldry**: Features all 73 official faction and subfaction insignia, meticulously vectorized into high-resolution monochrome symbols, paired with dynamic faction themes, tactical reticle crosshairs, and rank tier badges.
- **Dynamic Rank Progression**: Faction-specific canonical military ranks and titles (for example: *Space Marine: Neophyte Scout → Battle-Brother → Sergeant → Captain*).
- **Live Level and XP Meters**: Real-time progress bars showing exact experience points needed for the next level and next rank promotion.
- **Career Combat Metrics**: Telemetry tracking deployments completed, sets logged, total repetitions, and total tonnage moved in kilograms.

### 2. ⚔️ Solo Combat & Mission Encounters
- **Hostile Enemy Encounters**: Battle against scalable enemies with distinct health pools, difficulty tiers, lore taunts, defeat quotes, and visual badges (Ork Boyz, Chaos Cultists, Tyranid Warriors, Necron Immortals, Helbrute Daemon Engine, Carnifex Bio-Titan, Ork Warboss, Chaos Daemon Prince).
- **Combat Missions**: Structured objectives with recommended target sets and bonus Glory XP awarded on victory.
- **Thematic Attack Styles**: Completed sets produce distinct attacks based on movement patterns and muscle groups:
  - Compound Legs → *Heavy Seismic Strike* (Gold / Amber energy)
  - Upper Body Push → *Armor-Piercing Volley* (Cyan plasma blast)
  - Upper Body Pull → *Serrated Cleave* (Crimson slash)
  - Arms & Isolation → *Precision Strike* (Violet focus)
  - Core & Mobility → *Bulwark Reposition* (Emerald defensive ward)
- **Mathematically Balanced Damage Formula**: Documented formula balancing effort foundation (50 base damage), volume scaling (10 damage per repetition), calibrated bodyweight baseline (65 kg equivalent), square-root diminishing returns on heavy weight, and classification multipliers:
  - Working sets: 1.0x standard damage
  - Drop sets: 1.15x high-intensity bonus
  - Warm-up sets: 0.65x reduced damage
- **Strict Idempotency**: Attacks are tied directly to unique set identifiers. Editing sets or recalculating encounters never duplicates damage.
- **Live Combat HUD**: Animated enemy health bar with dynamic color transitions (Green to Amber to Red), purge status, overkill counter, and instant visual strike feedback with damage numbers.
- **Battle Log Telemetry**: Scrollable list of every attack landed, damage dealt, and set classification.
- **After-Action Report (AAR)**: Full military debriefing modal displaying mission outcome, enemy dossier, munitions tonnage, combat damage, Glory Bonus XP, promotion progress bar, and battle honors.
- **Decoupled Progression**: 100% of earned workout XP, level progression, and exercise history are preserved independently of enemy survival.

### 3. 🏋️ Exercise Armory & Tactical Workout Logger
- **Exercise Armory**: Searchable, categorized catalog of **107 common exercises** across Barbells, Dumbbells, Bodyweight, Cables, Machines, Kettlebells, and Resistance Bands.
- **Targeted Muscle Filtering**: Filter by muscle groups (Chest, Back, Quads, Hamstrings, Glutes, Shoulders, Arms, Core) and equipment types.
- **Custom Exercises**: Easily create and persist user-defined combat exercises with custom equipment and target muscles directly in the local SQLite database.
- **Favorites (★)**: Star your most frequent exercises for quick one-tap access.
- **Set Classifications**: Fast toggle between **W** (Working Set), **WU** (Warm-up Set), and **D** (Drop Set).
- **Bodyweight Support**: Seamless bodyweight representation without requiring external weight input.
- **One-Tap Set Duplication**: Clone sets and previous weights/reps with a single tap.
- **Tactical Rest Timer HUD**: Floating sci-fi timer bar with quick presets (30s, 60s, 90s, 120s, 180s), 30-second extension, pause/play, physical haptic feedback, and automatic trigger on set completion.
- **Repeat Workouts**: Re-run your most recent workout or any past archived mission with pre-populated target sets.
- **Real-Time Live XP**: Estimated reward ticker dynamically calculates earned XP as sets are logged.

### 4. 📜 Mission Archives & Workout History
- **Offline SQLite Persistence**: Complete workout logs stored locally and reliably in SQLite (`grimiron.db`).
- **Historical Decoupling**: Exercise display names and set details are snapshotted in workout history, remaining preserved even if catalog definitions are edited.
- **Repeat Mission**: One-tap button to redeploy any historical session into the active workout tracker.
- **Chronological Logs**: Chronological list of completed training sessions with date, duration, total XP, and set counts.
- **Expandable Set Inspector**: Detailed inspect view detailing exact weights, reps, and classifications recorded.
- **Cascading Deletion**: Safe record deletion that cleans up database tables and automatically resynchronizes career XP.

### 5. 🪐 Faction Codex & Allegiance Switcher
- **20 Major 40K Armies**: Complete data-driven catalog covering all 20 major Warhammer 40,000 armies across Imperium, Chaos, and Xenos, plus 53 iconic subfactions.
- **Codex Search & Filters**: Search factions, subfactions, lore, and keywords with category filter pills (**All**, **Imperium**, **Chaos**, **Xenos**).
- **Full Rank Progression Ladder**: Canonical rank titles with explicit annotations distinguishing military lore ranks from game-modeled hierarchies.
- **Pledge Allegiance Switcher**: Freely switch allegiance between Space Marines, Necrons, Orks, Chaos, Sisters of Battle, and more while keeping your earned career XP and achievements completely intact.

### 6. 👥 Asynchronous Cooperative Boss Battles (Crusade Squads)
- **Crusade Squads & Revocable Ciphers**: Create private friends groups and generate secure 8-character invite ciphers (such as `CRUSADE-7F9A`). Squad leaders can revoke and regenerate codes at any time.
- **Shared Raid Targets**: Groups fight massive shared raid bosses (for example: *Warboss Skullkrakka - Raid Titan*, 10,000 HP).
- **Asynchronous Damage Contributions**: Friends work out independently across different schedules and time zones. Every completed workout set linked to the active raid produces an attack that damages the shared enemy.
- **Atomic Server-Side Damage Processing**: Clients never calculate or mutate boss HP directly. The server-side database procedure verifies squad membership, acquires an atomic row lock to prevent race conditions, and deducts boss health reliably.
- **Strict Idempotency**: Protected by unique composite database constraints on the boss and set identifiers, ensuring network retries or repeated saves never deal duplicate damage to the raid boss.
- **Realtime Strike Synchronization**: Uses Supabase Realtime to update connected devices live with boss health updates and attack tickers as friends complete sets.
- **Privacy by Design**: Raw weights, repetitions, notes, and personal exertion ratings are **strictly kept private** on the local device. Only sanitized combat descriptors (exercise title, strike name, movement style, and damage dealt) are sent over the wire.
- **Offline Resilience & Buffer Queue**: If offline or credentials are not yet configured, attacks buffer safely into a local storage queue and flush automatically when connectivity returns.
- **Decoupled Progression**: Local personal workout history, XP, ranks, and achievements are completely preserved independently of boss health or cloud availability.

### 7. 🎖️ Campaign Academy: 90-Day Crusades & Structured Programs
- **8 Periodized Training Programs**: Built-in battle-tested programs including First Muster, The Initiate's Path, Forge of the Iron Foundation, Spearhead Protocol, Battle-Rhythm Conditioning, Tactical Athlete, Vanguard Ascendant, and The Iron Crucible.
- **90-Day Multi-Phase Roadmaps**: Phase-based structured progression with calibrated volume, progressive overload, and targeted rest days.
- **Responsible Rest Day Dignity**: Dedicated rest day logger allows users to record active recovery, hydration, and joint restoration with zero required lifting volume, advancing program schedules without penalizing adherence.
- **Campaign Quests & Boss Battles**: Milestone objectives and climax encounters that unlock as program chapters advance.

### 8. ⚔️ Warfront: Daily Operations & Weekly Raid Bosses
- **Stable Daily 3-Card Rotation**: Calendar-seeded operations that remain stable throughout the day across app restarts and tab navigations.
- **14-Day Anti-Repetition Buffer**: Memory system that prevents stale repeats and ensures ongoing tactical variety.
- **8 Operational Categories**: Reconnaissance, Assault, Planetary Defense, Sabotage, Hunter-Killer, Special Operations, Escalating Fronts, and Cooperative Raids across all 20 factions.
- **Procedural Boss Commander Generator**: Deterministic seed-based commander generation providing unique enemy names, titles, signature weapons, traits, and three dynamic combat phases (Frontline at 100%, Enraged at 66%, Overload at 33%).
- **Weekly Raid Boss Cycles**: Weekend raid events with smart health scaling (2,400 HP solo vs. 7,500 HP squad) and unresolved boss policies (expired bosses marked as escaped rather than false defeats).

### 9. 🏆 Combat Achievements & Battle History Archival
- **Multi-Scope Achievements**: 220 persistent battle honors across User (account-wide personal records and volume), Character (faction rank and solo purges), and Squad (cooperative victories and shared damage) scopes.
- **Immutable Battle History**: Complete chronological combat timeline snapshots preserving victory and defeat records, participant rosters, and strike tallies.
- **Historical Backfill**: Automatically scans and awards retroactive honors for historical workouts and achievements upon app launch.

### 10. 🎨 Custom Subfaction Creator & User-Uploaded Emblems
- **Custom Subfaction Builder**: Forge your own military identity under any of the 20 official parent armies (e.g. T'au Empire *"The Obsidian Spear"*, Space Marines *"The Ashen Wardens"*, Orks *"Da Ironbreakaz"*, Necrons *"The Sepulchral Dynasty"*).
- **Required & Optional Identity Fields**:
  - Name: Trimmed, up to 40 characters, validated against duplicate active names per user.
  - Parent Faction: Swears allegiance to any of the 20 major factions, inheriting combat attacks and equipment rules.
  - Narrative Lore & Battle Motto: Custom background lore and battle cries displayed on character dossiers.
  - Adaptive Homeworld: Context-aware label adapting to parent army (Fortress-Monastery, Tomb World, Sept World, Craftworld, Forge World, etc.).
  - Doctrine Tags: 10 tactical tags (Aggressive Shock Assault, Stalwart Fortress Defense, Rapid Reconnaissance, Ironclad Discipline, etc.).
  - Color Palette: Customizable primary, secondary, and accent color scheme presets.
- **User-Uploaded Insignia & Photo Library Picker**:
  - Select any custom picture from your device's photo library via `expo-image-picker`.
  - Supports transparent PNG, JPEG, and WebP formats up to 5 MB and 4096px.
  - Live preview with instant toggle between `contain` (emblem fits neatly) and `cover` (fills circular portrait).
  - Saved locally to app documents directory (`subfaction_icons/`) without bloating database storage with large base64 strings.
  - Replace or remove custom icons anytime with graceful fallback to the verified official parent army emblem.
- **Codex & Dossier Integration**: Appears in the Faction Codex with `[CUSTOM]` badges and "+ FOUND NEW" creation chips, and updates your character terminal upon allegiance pledge.
- **Lifecycle & Safeguards**: One-tap duplication to create variant warbands, non-destructive archiving, and permanent deletion with confirmation.

### 11. 🛡️ Character Arsenal, Faction Wargear Progression & Raid Loot
- **MMORPG-Style Equipment Grid**: Accessible directly on the Character page (`app/(tabs)/index.tsx`), displaying 7 tactical equipment slots:
  - Primary Weapon
  - Secondary Weapon
  - Body Armor
  - Tactical Helmet
  - Faction Insignia / Relic
  - Tactical Utility Gear
  - Exosuit / Platform Frame
- **Faction-Adaptive Slot Archetypes**: Platform slots and tactical labels adapt dynamically to the player's sworn allegiance:
  - T'au Empire: *"Battlesuit Frame"*
  - Space Marines / Grey Knights: *"Terminator / Dreadnought Harness"*
  - Orks: *"Mega-Armor Rig"*
  - Necrons: *"Destroyer Body Chassis"*
  - Adeptus Mechanicus: *"Cybernetica Chassis"*
  - Leagues of Votann: *"Exosuit Rig"*
  - Tyranids: *"Biomorph Mutation"*
- **Canonical T'au Empire Pilot Progression Arc**:
  - Tier 1: Fire Warrior Strike Team wargear (Pulse Rifle, Combat Armor, Sensor Helmet, Photon Grenades, Bonding Knife, Markerlight Array).
  - Tier 2 & 3: Shas'ui and Pathfinder upgrades (Pulse Carbine, Reinforced Carapace, Pulse Blaster, Rail Rifle, EMP Grenades).
  - Tier 4: XV25 Stealth Battlesuit Platform (Level 14+, Rank 4+, Challenging raid requirement) shifting role to Stealth Pilot.
  - Tier 5: XV8 Crisis Battlesuit Chassis (Level 20+, Rank 6+, Legendary raid requirement) shifting role to Crisis Battlesuit Pilot with Plasma Arrays and Missile Pods.
- **Combat Damage Integration & Anti-Stacking Safeguards**:
  - Equipped wargear flat damage bonuses and percentage multipliers directly augment workout-driven combat strikes in solo encounters and raid boss battles.
  - Strict caps prevent runaway damage inflation: Flat damage clamped at `+150`, damage multiplier clamped at `+35%`, and precision crit chance clamped at `+20%`.
  - User lifting weight, repetitions, and earned XP are completely untouched and never distorted by equipment stats.
- **Weekly Raid Boss Loot Drops & Gated Progression**:
  - Slaying weekly raid commanders drops powerful high-tier wargear filtered by difficulty tier (Standard, Challenging, Legendary) and matched to the player's active faction.
  - Tier gating requires appropriate level and military rank clearance before legendary wargear can be claimed or equipped.
  - Duplicate-safe delivery recorded in SQLite table `raid_loot_history`.
- **Zero Image Generator Dependency**: Equipment slots, item cards, and inventory drawers use high-contrast sci-fi badges, rarity colors, stats chips, and lore typography without requiring unstable AI portrait or weapon generation.
- **Persistent SQLite Inventory (Migration 15)**:
  - All collected items, loadouts, and loot drop logs are stored locally in `character_inventory`, `character_equipment_loadout`, and `raid_loot_history`.
  - Switching allegiances grants the new faction's starter gear while permanently preserving previously earned items in inventory.

---

## 📂 Project Architecture

```
grimiron/
├── app/
│   ├── _layout.tsx                 # Root layout: Safe area, DB initialization, theme provider
│   └── (tabs)/
│       ├── _layout.tsx             # Bottom tab bar with dark sci-fi styling & safe area padding
│       ├── index.tsx               # Tab 1: Character Terminal & Dossier
│       ├── workout.tsx             # Tab 2: Interactive Workout Logger & Live XP
│       ├── raid.tsx                # Tab 3: Cooperative Raid Battles & Crusade Squads
│       ├── history.tsx             # Tab 4: Historical Workout Archives & Battle Logs
│       └── factions.tsx            # Tab 5: Searchable Faction Codex & Allegiance Switcher
├── assets/
│   └── symbols/                    # 73 high-resolution monochrome faction & subfaction SVG/PNG assets
├── src/
│   ├── assets/
│   │   └── factionSymbols.ts       # Unified symbol resolver for all 73 factions and subfactions
│   ├── components/                 # Reusable Sci-Fi UI components:
│   │   ├── Badge.tsx
│   │   ├── CampaignAcademyModal.tsx
│   │   ├── CampaignMapModal.tsx
│   │   ├── CoopRaidModal.tsx
│   │   ├── EquipmentInventoryModal.tsx
│   │   ├── EquipmentSlotCard.tsx
│   │   ├── MissionCenterModal.tsx
│   │   ├── PlaceholderPortrait.tsx
│   │   ├── ProgressBar.tsx
│   │   ├── RestTimer.tsx
│   │   ├── SciFiCard.tsx
│   │   ├── SetRow.tsx
│   │   ├── TerminalButton.tsx
│   │   ├── WarfrontDailyBoardModal.tsx
│   │   └── WeeklyRaidModal.tsx
│   ├── constants/
│   │   └── theme.ts                # Dark Military Sci-Fi color tokens & spacing
│   ├── content/
│   │   ├── campaignAcademy/        # 8 periodized training programs & 90-day crusades
│   │   ├── combat/                 # Thematic faction attacks & strike styles
│   │   ├── encounters/             # 110+ lore-accurate encounter templates
│   │   ├── equipment/              # Wargear catalog & faction archetype slot configurations
│   │   ├── missions/               # 63 faction-specific narrative operations
│   │   ├── types.ts                # Universe-agnostic content interfaces
│   │   └── warhammer40k/           # Data-driven 40K armies, ranks, and subfactions
│   ├── context/
│   │   └── AppContext.tsx          # Global state combining SQLite with active sessions
│   ├── services/
│   │   ├── combat/                 # Combat engine, damage calculators, and attack resolution
│   │   ├── database/               # SQLite persistence via expo-sqlite (15 migrations)
│   │   └── progression/            # XP formulas, achievements, equipment, and raid loot
│   ├── tests/
│   │   └── verify_core.ts          # Comprehensive test suite covering all domains
│   ├── types/                      # Domain models for Workouts, Equipment, and Raids
│   └── utils/
│       └── haptics.ts              # Physical haptic feedback engine with graceful web fallback
├── scripts/
│   ├── audit_app_comprehensive.py  # Full-scope automated codebase and symbol audit
│   └── run-tests.js                # Cross-platform test execution runner
├── ARCHITECTURE.md                # Technical architectural specifications
└── PROJECT_STATUS.md              # Milestone status log and roadmap
```

---

## ⚖️ Experience (XP) Formula Design

All progression math is isolated in `src/services/progression/xpCalculator.ts` with documented constants:

**Session XP = Base XP + Sets XP + Reps XP + Tonnage XP**

- **Base Workout Completion**: 100 XP (awarded once at least 1 set is completed).
- **Working Set Bonus**: 20 XP per completed working set (capped at 20 sets / 400 XP total).
- **Repetition Effort Bonus**: 1 XP per rep (capped at 150 reps / 150 XP total) — guarantees calisthenics and bodyweight workouts earn motivating progression.
- **Tonnage Scaling Factor**: Calculated using a square-root scaling formula based on repetitions and lifted weight: `2 × √(reps × weight in kg)`, capped at 25 XP per set (250 XP total) to reward progressive overload while preventing extreme poundage from dominating.
- **Max Session Ceiling**: 1,000 XP per workout session.

### Level Progression Curve

Cumulative XP required for Level L is calculated as:
**XP = floor(200 × (L - 1)^1.5 + 100 × (L - 1))**

This produces a gentle, rewarding polynomial curve:
- Level 1: 0 XP
- Level 2: 300 XP (~1-2 workouts)
- Level 3: 765 XP (~3-4 workouts)
- Level 4: 1,339 XP
- Level 5: 2,000 XP
- Level 10: 6,289 XP
- Level 20: 18,018 XP

---

## ☁️ Backend Setup: Supabase Configuration Guide

GrimIron uses a Supabase free-tier project for authentication, private squad management, and real-time boss battles. Privileged service keys are never embedded in the client.

### Step 1: Create a Free Supabase Project
1. Go to [supabase.com](https://supabase.com) and sign in (or create a free account).
2. Click **New project** and name your project (e.g. `grimiron-crusade`).
3. Set a strong database password and select a region close to you.
4. Wait approximately 1-2 minutes for your project to provision.

### Step 2: Apply the Database Migration
1. In your Supabase Dashboard, click on the **SQL Editor** tab on the left navigation bar.
2. Open the file `supabase/migrations/20261018_coop_battles.sql` in this repository.
3. Copy the entire file contents and paste them into the Supabase SQL Editor.
4. Click **Run** (or press Ctrl+Enter).
5. Verify the execution succeeds with `Success: No rows returned`.
   *(This initializes member profiles, crusade squads, raid bosses, synchronized attack logs, atomic settlement procedures, and real-time streaming publications).*

### Step 3: Configure Environment Variables
1. In your Supabase Dashboard, click **Project Settings** (gear icon) → **API**.
2. Find:
   - **Project URL** (e.g. `https://xyzcompany.supabase.co`)
   - **Project API Keys** → **anon / public** key (e.g. `eyJhbGci...`)
3. In your local project directory, create a file named `.env`:
   ```bash
   EXPO_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
   EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   ```
4. Restart the development server (`npm start -- -c`) to load the new environment variables.

---

## 👥 Two-Account Manual Test Checklist

To verify asynchronous cooperative boss combat using two distinct user accounts:

### Account A (Squad Leader):
1. Launch the app and tap **CRUSADE SQUAD // CO-OP RAID** on the home screen or workout tab.
2. Select **Create Account** and register Account A (e.g. `captain_titus@imperium.org`, Callsign: `Captain Titus`).
3. Under **Squad Barracks**, tap **Found New Crusade Squad**, enter a squad name (e.g. `Ultramar Vanguard`), and tap **Create**.
4. Note the generated 8-character invite code (e.g. `7F9A1B2C`).
5. Go to the **Raid Encounter** tab and verify **Warboss Skullkrakka** has 10,000 / 10,000 HP.
6. Tap **Engage in Workouts** to link this raid to your training.
7. Return to the Workout tab, add an exercise (e.g. *Barbell Bench Press*), and check off Set 1 (10 reps @ 135 lbs).
8. Observe:
   - Immediate visual strike banner: `Bolter Burst [Bench Press]` deals damage (e.g. 247 DMG).
   - Boss HP decrements on the Co-op Boss Card to `9,753 / 10,000 HP`.
   - Your raw 135 lbs weight and 10 reps are saved locally in SQLite, but only sanitized strike metadata is sent to Supabase.

### Account B (Squad Member):
1. In a second device, simulator, or web window (`npm run web`), open the app.
2. Open the **CRUSADE SQUAD** modal, select **Create Account**, and register Account B (e.g. `brother_uriel@imperium.org`, Callsign: `Brother Uriel`).
3. In **Squad Barracks**, enter the invite code generated by Account A (`7F9A1B2C`) and tap **Join**.
4. Verify you see `Ultramar Vanguard` and both `Captain Titus (Leader)` and `Brother Uriel (Member)`.
5. Check the **Raid Encounter** tab: observe the current boss health is already `9,753 HP` (reflecting Account A's attack).
6. Tap **Engage in Workouts**.
7. Start a workout, add *Barbell Back Squat*, and check off a set (5 reps @ 225 lbs).
8. Observe:
   - Brother Uriel's strike lands: `Thunder Hammer [Back Squat]` deals damage (e.g. 312 DMG).
   - Boss health decreases to `9,441 HP`.
   - On Account A's screen, the live Realtime combat feed instantly shows Brother Uriel's strike!

### Offline & Idempotency Check:
1. Disconnect Account B from Wi-Fi / enable airplane mode and complete another set.
2. Notice the strike buffers cleanly into the local offline storage queue.
3. Reconnect to Wi-Fi and tap **Sync Now**: attacks flush to Supabase.
4. If a network packet is retransmitted or retried, verify the server handles it idempotently and does not deduct double damage.

---

## 🗺️ Known Limitations & Future Milestones

- **Asynchronous Design**: Cooperative battles are designed asynchronously so friends in different time zones can assault the same boss at their own convenience. Real-time voice chat and synchronized simultaneous sessions are not included.
- **Artwork**: Complete high-resolution 512x512 monochrome SVG/PNG heraldry for all 73 factions and subfactions. Future milestones will introduce custom illustrated boss cards and narrative battle backgrounds.
- **Rest & Habit Bonuses**: Future milestones will introduce streak consistency and recovery tracking.
