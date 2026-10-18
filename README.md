# GrimIron: The Gamified Warhammer 40,000 Workout Tracker & RPG

> *"I trained in real life, improved my fitness, and advanced my character."*

GrimIron is a cross-platform mobile fitness tracker built with **React Native**, **Expo (SDK 57)**, **TypeScript**, and **expo-sqlite**. It turns everyday physical training into RPG character progression, featuring a dark military sci-fi terminal interface, persistent offline database storage, and a data-driven content catalog representing all 20 major Warhammer 40,000 factions and recognized subfactions.

---

## ⚡ Quick Start: How to Run the App

### Prerequisites
- [Node.js](https://nodejs.org/) (v18+ or v20+)
- [Expo Go app](https://expo.dev/go) installed on your physical iOS or Android phone, OR an emulator/simulator.

### Step 1: Open the Project Directory
```powershell
cd C:\Users\patri\.gemini\antigravity\scratch\grimiron
```
*(Tip: Set this directory as your active workspace folder in your editor).*

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

Run the automated test suite and type checker anytime with:
```bash
# Run the automated core unit test suite (XP math, level curve, faction integrity)
npm test

# Run the TypeScript type checker across the entire project
npm run typecheck
```

---

## 📱 Features in Milestone 1

### 1. 🛡️ Character Terminal (`/(tabs)/index`)
- Tactical military sci-fi dossier displaying current character details.
- 2D placeholder portrait system featuring dynamic faction/subfaction color schemas, tactical reticle crosshairs, and rank tier badges.
- Dynamic faction-specific Rank title and tier (e.g. *Space Marine: Neophyte Scout → Battle-Brother → Sergeant → Captain*).
- Live Level and XP progression bars showing exact XP needed for the next level and next rank promotion.
- Career Combat Metrics dashboard: missions completed, sets logged, total reps, and total weight moved (kg).

### 2. ⚔️ Solo Combat & Mission Encounters (`/(tabs)/workout`)
- **Hostile Enemy Encounters**: Fight against scalable enemies with distinct health pools, difficulty tiers, lore taunts, defeat quotes, and visual badges (Ork Boyz, Chaos Cultists, Tyranid Warriors, Necron Immortals, Helbrute Daemon Engine, Carnifex Bio-Titan, Ork Warboss, Chaos Daemon Prince).
- **Combat Missions**: Structured objectives with target recommended sets and bonus Glory XP awarded on victory.
- **Thematic Attack Styles**: Completed sets produce distinct attacks based on movement patterns and muscle groups:
  - Compound Legs $\rightarrow$ *Heavy Seismic Strike* (`#FFB800`)
  - Upper Body Push $\rightarrow$ *Armor-Piercing Volley* (`#00F0FF`)
  - Upper Body Pull $\rightarrow$ *Serrated Cleave* (`#FF4757`)
  - Arms & Isolation $\rightarrow$ *Precision Strike* (`#A29BFE`)
  - Core & Mobility $\rightarrow$ *Bulwark Reposition* (`#2ECC71`)
- **Mathematically Balanced Damage Formula**: Documented formula balancing effort foundation (50 base dmg), volume scaling (10 dmg/rep), calibrated bodyweight baseline (65 kg equivalent), square-root diminishing returns on heavy weight, and classification multipliers (Working $1.0\times$, Dropset $1.15\times$, Warmup $0.65\times$).
- **Strict Idempotency**: Attacks are 1:1 tied to unique set IDs. Editing sets or recalculating encounters never duplicates damage.
- **Live Combat HUD**: Animated enemy health bar with dynamic color transitions (Green $\rightarrow$ Amber $\rightarrow$ Red), purge status, overkill counter, and instant visual strike feedback with damage numbers.
- **Battle Log Telemetry**: Scrollable list of every attack landed, damage dealt, and classification.
- **After-Action Report (AAR)**: Full military debriefing modal displaying mission outcome, enemy dossier, munitions tonnage, combat damage, Glory Bonus XP, promotion progress bar, and battle honors (achievements).
- **Decoupled Progression**: 100% of earned workout XP, level progression, and exercise history are preserved independently of enemy survival.

### 3. 🏋️ Exercise Armory & Tactical Logging
- **Exercise Armory Modal**: Searchable, categorized catalog of **107 common exercises** across Barbells, Dumbbells, Bodyweight, Cables, Machines, Kettlebells, and Resistance Bands.
- Filter by muscle groups (Chest, Back, Quads, Hamstrings, Glutes, Shoulders, Arms, Core) and equipment types.
- **Custom Exercises**: Easily create and persist user-defined combat exercises with custom equipment and target muscles directly in SQLite.
- **Favorites (★)**: Star your most frequent exercises for quick 1-tap access.
- **Set Classifications**: Fast toggle between **W** (Working Set), **WU** (Warm-up Set), and **D** (Drop Set).
- **Bodyweight Support**: Seamless "BW" representation without requiring external weight input.
- **1-Tap Set Duplication**: Clone sets and previous weights/reps with a single tap.
- **Tactical Rest Timer HUD**: Floating sci-fi timer bar with quick presets (30s, 60s, 90s, 120s, 180s), +30s extension, pause/play, and automatic trigger on set completion.
- **Repeat Workouts**: Re-run your most recent workout or any past archived mission with pre-populated target sets.
- **Real-Time Live XP**: Estimated reward ticker dynamically calculates earned XP as sets are logged.

### 3. 📜 Mission Archives / History (`/(tabs)/history`)
- Persistent workout logs stored locally in SQLite (`grimiron.db`).
- Historical decoupling: Exercise display names and set details are snapshotted in workout history, remaining preserved even if catalog definitions are edited.
- **Repeat Mission**: 1-tap button to redeploy any historical session into the active workout tracker.
- Chronological list of completed training sessions with date, duration, total XP, and set counts.
- Expandable set inspector detailing exact weights, reps, and classifications recorded.
- Cascading record deletion that cleans up database tables and automatically resynchronizes career XP.

### 4. 🪐 Faction Codex (`/(tabs)/factions`)
- Complete data-driven catalog covering all **20 major Warhammer 40K armies** (Imperium, Chaos, and Xenos) and recognized subfactions.
- Search bar (searches factions, subfactions, lore, or keywords) and category filter pills (**All**, **Imperium**, **Chaos**, **Xenos**).
- Full rank progression ladder with explicit annotations distinguishing canonical military ranks from game-modeled hierarchies.
- **Pledge Allegiance** switcher: switch between Space Marines, Necrons, Orks, Chaos, Sisters of Battle, and more while keeping your earned career XP intact!

---

## 📂 Project Architecture

```
scratch/grimiron/
├── app/
│   ├── _layout.tsx           # Root layout: Safe area, DB initialization, theme provider
│   └── (tabs)/
│       ├── _layout.tsx       # Bottom tab bar with dark sci-fi terminal styling
│       ├── index.tsx         # Tab 1: Character Terminal & Dossier
│       ├── workout.tsx       # Tab 2: Interactive Workout Logger & Live XP
│       ├── history.tsx       # Tab 3: Historical Workout Archives
│       └── factions.tsx      # Tab 4: Searchable Faction Codex & Allegiance Switcher
├── src/
│   ├── components/           # Reusable Sci-Fi UI components:
│   │   ├── Badge.tsx
│   │   ├── PlaceholderPortrait.tsx
│   │   ├── ProgressBar.tsx
│   │   ├── SciFiCard.tsx
│   │   ├── SetRow.tsx
│   │   └── TerminalButton.tsx
│   ├── constants/
│   │   └── theme.ts          # Dark Military Sci-Fi color tokens & spacing
│   ├── content/
│   │   ├── types.ts          # Universe-agnostic content interfaces
│   │   └── warhammer40k/     # Data-driven 40K armies, ranks, and subfactions
│   ├── context/
│   │   └── AppContext.tsx    # Global state combining SQLite with active sessions
│   ├── services/
│   │   ├── database/         # SQLite persistence via expo-sqlite
│   │   └── progression/      # XP formulas and rank progression engines
│   ├── tests/
│   │   └── verify_core.ts    # Comprehensive test suite
│   └── types/                # Domain models for Workouts, Sets, and Characters
├── scripts/
│   └── run-tests.js          # Cross-platform test execution runner
├── ARCHITECTURE.md          # Technical architectural specifications
└── PROJECT_STATUS.md        # Current milestone status and roadmap
```

---

## ⚖️ Experience (XP) Formula Design

All progression math is isolated in `src/services/progression/xpCalculator.ts` with documented constants:

$$\text{Session XP} = \text{Base XP} + \text{Sets XP} + \text{Reps XP} + \text{Tonnage XP}$$

- **Base Workout Completion**: `100 XP` (requires at least 1 completed set).
- **Working Set Bonus**: `20 XP` per completed set (capped at 20 sets / `400 XP`).
- **Repetition Effort Bonus**: `1 XP` per rep (capped at 150 reps / `150 XP`) — guarantees calisthenics & bodyweight workouts earn motivating progression.
- **Tonnage Scaling Factor**: Normalized using square root: $2 \times \sqrt{\text{reps} \times \text{weight}_{\text{kg}}}$ (capped at `25 XP` per set / `250 XP` total) to reward progressive overload while preventing extreme poundage from dominating.
- **Max Session Ceiling**: `1,000 XP` per workout session.

### 4. 👥 Asynchronous Cooperative Boss Battles (`Crusade Squads`)
- **Crusade Squads & Revocable Ciphers**: Create private friends groups and generate secure 8-character invite ciphers (e.g. `CRUSADE-7F9A`). Squad leaders can revoke and regenerate codes at any time.
- **Shared Raid Targets**: Groups fight a massive shared raid boss (e.g. *Warboss Skullkrakka - Raid Titan*, 10,000 HP).
- **Asynchronous Damage Contributions**: Friends work out independently at different times. Every completed workout set linked to the active raid produces an attack that damages the shared enemy.
- **Atomic Server-Side Damage RPC**: Clients never calculate or mutate boss HP directly. The PostgreSQL stored procedure `record_coop_attack` acquires a row lock (`FOR UPDATE`), verifies squad membership, and deducts damage atomically.
- **Strict Idempotency**: Protected by `CONSTRAINT uq_coop_boss_set UNIQUE (group_boss_id, client_set_id)`. Network retries or repeated set saves never double-damage the boss.
- **Realtime Strike Synchronization**: Uses Supabase Realtime to update connected devices live with boss health updates and attack tickers as friends complete sets.
- **Privacy by Design**: Raw weights, repetitions, notes, and RPE are **strictly kept private** on the local device. Only sanitized attack descriptors (`exercise_name`, `attack_name`, `style_name`, `damage`) are sent over the wire.
- **Offline Resilience & Buffer Queue**: If offline or credentials are not yet configured, attacks buffer safely into local SQLite (`coop_attack_queue`) and flush when connectivity returns.
- **Decoupled Progression**: Local personal workout history, XP, ranks, and achievements are completely preserved independently of boss health or cloud availability.

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
   *(This creates the tables `profiles`, `groups`, `group_members`, `group_bosses`, `coop_attacks`, stored procedures `create_crusade_group`, `join_group_by_code`, `regenerate_invite_code`, `record_coop_attack`, and registers Realtime publications).*

### Step 3: Configure Environment Variables
1. In your Supabase Dashboard, click **Project Settings** (gear icon) $\rightarrow$ **API**.
2. Find:
   - **Project URL** (e.g. `https://xyzcompany.supabase.co`)
   - **Project API Keys** $\rightarrow$ `anon` / `public` key (e.g. `eyJhbGci...`)
3. In your local project directory (`C:\Users\patri\.gemini\antigravity\scratch\grimiron`), create a file named `.env`:
   ```bash
   EXPO_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
   EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   ```
4. Restart Metro bundler (`npx expo start -c`) to load the new environment variables.

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
1. Disconnect Account B from Wi-Fi / airplane mode and complete another set.
2. Notice the strike buffers cleanly into the local SQLite `coop_attack_queue`.
3. Reconnect to Wi-Fi and tap **Sync Now**: attacks flush to Supabase.
4. If a network packet is retransmitted or retried, verify the server returns `duplicate_ignored` and does NOT deduct double damage.

---

## 🗺️ Known Limitations & Future Milestones

- **Asynchronous Design**: Cooperative battles are designed asynchronously so friends in different time zones can assault the same boss at their own convenience. Real-time voice chat and synchronized simultaneous sessions are not included.
- **Artwork**: Programmatic tactical reticle portrait placeholders with faction color schemes. Custom 2D character portrait art and boss illustrations will slot into the existing catalog keys in later milestones.
- **Rest & Habit Bonuses**: Future milestones will introduce streak consistency and recovery tracking.

