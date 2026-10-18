import { FactionMissionDefinition } from '../../types/mission';

/**
 * Data-Driven Faction Mission Catalog for GrimIron.
 * Covers ALL 20 Warhammer 40k factions and cataloged subfactions with thematic lore,
 * multi-tier rank progression, diverse objective categories, and authentic rewards.
 */
export const FACTION_MISSION_CATALOG: FactionMissionDefinition[] = [
  // =========================================================================
  // 1. ADEPTUS ASTARTES (SPACE MARINES)
  // =========================================================================
  {
    id: 'mis_sm_initiation',
    title: 'Trial of the Neophyte',
    shortDescription: 'Undergo rigorous physical trials to prove your transhuman fortitude.',
    briefing:
      'Before a warrior can don ceramite power armor, his body must be forged in iron discipline. Execute foundational compound sets to establish your worthiness among the Chapter.',
    factionId: 'adeptus-astartes',
    category: 'training',
    difficulty: 'patrol',
    minRankTier: 1,
    objectives: [
      { id: 'obj_sm_init_wo', type: 'complete_workouts', description: 'Complete 1 full training deployment', targetValue: 1 },
      { id: 'obj_sm_init_sets', type: 'complete_sets', description: 'Log 5 completed working sets', targetValue: 5 },
    ],
    rewards: [
      { type: 'xp', amount: 150, description: '+150 Chapter Glory XP' },
      { type: 'title', title: 'Initiate of the Chapter', description: 'Earned the title: Initiate of the Chapter' },
    ],
    isCanonical: true,
    sourceNote: 'Codex: Space Marines Neophyte Rites',
    iconName: 'shield-outline',
  },
  {
    id: 'mis_sm_patrol',
    title: 'Perimeter Reconnaissance Sweep',
    shortDescription: 'Patrol forward imperial battlements and eliminate wandering hostiles.',
    briefing:
      'Scout squads have detected vanguard probes near the drop-pod LZ. Engage the hostiles with controlled volleys and decisive kinetic force.',
    factionId: 'adeptus-astartes',
    category: 'patrol',
    difficulty: 'patrol',
    minRankTier: 1,
    prerequisites: ['mis_sm_initiation'],
    objectives: [
      { id: 'obj_sm_patrol_sets', type: 'complete_sets', description: 'Log 8 completed working sets', targetValue: 8 },
      { id: 'obj_sm_patrol_dmg', type: 'combat_damage', description: 'Inflict 400 total combat damage', targetValue: 400 },
    ],
    rewards: [
      { type: 'xp', amount: 200, description: '+200 Chapter Glory XP' },
      { type: 'equipment_ref', targetRefId: 'wargear_astartes_combat_blade', description: 'Unlocked Wargear: Astartes Combat Blade' },
    ],
    isCanonical: true,
    sourceNote: 'Codex: Space Marines Vanguard Operations',
    iconName: 'compass-outline',
  },
  {
    id: 'mis_sm_drop_pod_assault',
    title: 'Drop Pod Spearhead Assault',
    shortDescription: 'Deploy from low orbit directly into the enemy stronghold.',
    briefing:
      'The drop-pod retros fire at the last microsecond. The hatch blows open and bolters bark in rhythmic devastation. Move massive volume to clear the enemy killzone.',
    factionId: 'adeptus-astartes',
    category: 'assault',
    difficulty: 'skirmish',
    minRankTier: 2,
    prerequisites: ['mis_sm_patrol'],
    objectives: [
      { id: 'obj_sm_assault_vol', type: 'volume_kg', description: 'Move 3,000 kg total training volume', targetValue: 3000 },
      { id: 'obj_sm_assault_atks', type: 'combat_attacks', description: 'Deliver 10 combat attacks', targetValue: 10 },
    ],
    rewards: [
      { type: 'xp', amount: 350, description: '+350 Chapter Glory XP' },
      { type: 'title', title: 'Drop-Pod Veteran', description: 'Earned the title: Drop-Pod Veteran' },
    ],
    isCanonical: true,
    sourceNote: 'Codex: Space Marines Drop Pod Assault Doctrines',
    iconName: 'flame-outline',
  },
  {
    id: 'mis_sm_boss_helbrute',
    title: 'Purge the Iron Daemon',
    shortDescription: 'Shatter a corrupted Helbrute daemon engine in singular combat.',
    briefing:
      'A screeching Chaos Helbrute threatens the Chapter perimeter. Stand firm, channel your superhuman resolve, and strike down this abominable warmachine.',
    factionId: 'adeptus-astartes',
    category: 'boss',
    difficulty: 'boss',
    minRankTier: 3,
    prerequisites: ['mis_sm_drop_pod_assault'],
    enemyId: 'enemy_chaos_helbrute',
    objectives: [
      { id: 'obj_sm_boss_kill', type: 'defeat_enemy', description: 'Neutralize the Chaos Helbrute', targetValue: 1 },
      { id: 'obj_sm_boss_dmg', type: 'combat_damage', description: 'Deal 1,500 damage to heavy armor', targetValue: 1500 },
    ],
    rewards: [
      { type: 'xp', amount: 600, description: '+600 Chapter Glory XP' },
      { type: 'title', title: 'Slayer of Helbrutes', description: 'Earned the title: Slayer of Helbrutes' },
      { type: 'equipment_ref', targetRefId: 'relic_iron_halo_mk7', description: 'Awarded Relic: Iron Halo of the First Company' },
    ],
    isCanonical: true,
    sourceNote: 'Imperial Armor: Siege of Vraks',
    iconName: 'skull-outline',
  },
  // Subfaction: Ultramarines
  {
    id: 'mis_sm_ultra_discipline',
    title: 'Codex Astartes Tactical Mastery',
    shortDescription: 'Demonstrate flawless adherence to Guilliman\'s military doctrines.',
    briefing:
      'True strength is not merely brute fury, but disciplined execution. Execute balanced pushing and pulling working sets without deviation from optimal form.',
    factionId: 'adeptus-astartes',
    subfactionId: 'ultramarines',
    category: 'special',
    difficulty: 'skirmish',
    minRankTier: 2,
    objectives: [
      { id: 'obj_ultra_sets', type: 'complete_sets', description: 'Complete 12 working sets with strict form', targetValue: 12 },
      { id: 'obj_ultra_reps', type: 'target_reps', description: 'Log 100 disciplined repetitions', targetValue: 100 },
    ],
    rewards: [
      { type: 'xp', amount: 400, description: '+400 Ultramar Glory XP' },
      { type: 'title', title: 'Scion of Guilliman', description: 'Earned the title: Scion of Guilliman' },
    ],
    isCanonical: true,
    sourceNote: 'Codex Astartes Vol. IV',
    iconName: 'ribbon-outline',
  },
  // Subfaction: Space Wolves
  {
    id: 'mis_sm_wolves_morkai',
    title: 'Trial of Morkai',
    shortDescription: 'Endure the frost-bitten endurance trials of the Wolf Priests.',
    briefing:
      'Across the glacial wastes of Asaheim, the Fenrisian sons hunt. Push your physical endurance to its breaking point and unleash your inner wolf.',
    factionId: 'adeptus-astartes',
    subfactionId: 'space-wolves',
    category: 'special',
    difficulty: 'incursion',
    minRankTier: 2,
    objectives: [
      { id: 'obj_wolves_vol', type: 'volume_kg', description: 'Surpass 4,000 kg moved in heavy compounds', targetValue: 4000 },
      { id: 'obj_wolves_atks', type: 'combat_attacks', description: 'Execute 15 fierce combat strikes', targetValue: 15 },
    ],
    rewards: [
      { type: 'xp', amount: 450, description: '+450 Fenrisian Glory XP' },
      { type: 'title', title: 'Wolf Guard Vanguard', description: 'Earned the title: Wolf Guard Vanguard' },
    ],
    isCanonical: true,
    sourceNote: 'Codex: Space Wolves Chapter Lore',
    iconName: 'paw-outline',
  },
  // Subfaction: Blood Angels
  {
    id: 'mis_sm_ba_thirst',
    title: 'Vow of Sanguinary Restraint',
    shortDescription: 'Channel the tragic fury of the Red Thirst into heroic battle endurance.',
    briefing:
      'The blood of the Great Angel sings in your veins. Restrain the madness of the Flaw through unyielding physical focus and explosive lifting power.',
    factionId: 'adeptus-astartes',
    subfactionId: 'blood-angels',
    category: 'special',
    difficulty: 'skirmish',
    minRankTier: 2,
    objectives: [
      { id: 'obj_ba_dmg', type: 'combat_damage', description: 'Deal 1,000 furious combat damage', targetValue: 1000 },
      { id: 'obj_ba_sets', type: 'complete_sets', description: 'Complete 10 explosive working sets', targetValue: 10 },
    ],
    rewards: [
      { type: 'xp', amount: 400, description: '+400 Baalite Glory XP' },
      { type: 'title', title: 'Blade of the Angel', description: 'Earned the title: Blade of the Angel' },
    ],
    isCanonical: true,
    sourceNote: 'Codex: Blood Angels Sons of Sanguinius',
    iconName: 'water-outline',
  },

  // =========================================================================
  // 2. ASTRA MILITARUM (IMPERIAL GUARD)
  // =========================================================================
  {
    id: 'mis_am_induction',
    title: 'The Emperor\'s Tithe: Boot Camp',
    shortDescription: 'Survive the grueling drilling regimen of the Departmento Munitorum.',
    briefing:
      'You are one of countless billions, but your resolve must not falter. Log your mandatory training sets and prove that humanity\'s spirit remains unbreakable.',
    factionId: 'astra-militarum',
    category: 'training',
    difficulty: 'patrol',
    minRankTier: 1,
    objectives: [
      { id: 'obj_am_ind_wo', type: 'complete_workouts', description: 'Complete 1 standard training deployment', targetValue: 1 },
      { id: 'obj_am_ind_sets', type: 'complete_sets', description: 'Log 6 drill sergeant working sets', targetValue: 6 },
    ],
    rewards: [
      { type: 'xp', amount: 120, description: '+120 Regimental Glory XP' },
      { type: 'title', title: 'Trooper of the Line', description: 'Earned the title: Trooper of the Line' },
    ],
    isCanonical: true,
    sourceNote: 'The Imperial Infantryman\'s Uplifting Primer',
    iconName: 'locate-outline',
  },
  {
    id: 'mis_am_trench_hold',
    title: 'Hold the Barbed Wire Trench',
    shortDescription: 'Defend fortified positions against relentless waves of hostile forces.',
    briefing:
      'Artillery shells crater the mud around your bunker. Fix bayonets and hold the line through sheer sustained repetition and mental discipline.',
    factionId: 'astra-militarum',
    category: 'defense',
    difficulty: 'skirmish',
    minRankTier: 1,
    prerequisites: ['mis_am_induction'],
    objectives: [
      { id: 'obj_am_trench_sets', type: 'complete_sets', description: 'Hold ground for 10 working sets', targetValue: 10 },
      { id: 'obj_am_trench_reps', type: 'target_reps', description: 'Fire 80 rapid-fire repetitions', targetValue: 80 },
    ],
    rewards: [
      { type: 'xp', amount: 250, description: '+250 Regimental Glory XP' },
      { type: 'equipment_ref', targetRefId: 'wargear_trench_entrenching_tool', description: 'Issued: Reinforced Entrenching Tool' },
    ],
    isCanonical: true,
    sourceNote: 'Codex: Astra Militarum Defensive Doctrine',
    iconName: 'shield-half-outline',
  },
  {
    id: 'mis_am_artillery_barrage',
    title: 'Basilisks Rolling Barrage',
    shortDescription: 'Haul heavy artillery shells to feed the grand battery.',
    briefing:
      'The big guns require tons of munitions every minute. Lift and move immense cumulative tonnage to maintain continuous bombardment on enemy coordinates.',
    factionId: 'astra-militarum',
    category: 'logistics',
    difficulty: 'incursion',
    minRankTier: 2,
    prerequisites: ['mis_am_trench_hold'],
    objectives: [
      { id: 'obj_am_art_vol', type: 'volume_kg', description: 'Haul 5,000 kg of heavy shell volume', targetValue: 5000 },
    ],
    rewards: [
      { type: 'xp', amount: 450, description: '+450 Regimental Glory XP' },
      { type: 'title', title: 'Master of Ordnance', description: 'Earned the title: Master of Ordnance' },
    ],
    isCanonical: true,
    sourceNote: 'Imperial Armor: Siege of Vraks Art. Logs',
    iconName: 'barbell-outline',
  },
  // Subfaction: Death Korps of Krieg
  {
    id: 'mis_am_krieg_siege',
    title: 'Krieg Attrition Protocol',
    shortDescription: 'Accept no surrender and advance through toxic noman\'s land.',
    briefing:
      'In life, shame. In death, atonement. The Korps calculates victory in liters of sweat and metric tons of iron moved. Refuse to quit.',
    factionId: 'astra-militarum',
    subfactionId: 'death-korps-of-krieg',
    category: 'special',
    difficulty: 'incursion',
    minRankTier: 2,
    objectives: [
      { id: 'obj_krieg_vol', type: 'volume_kg', description: 'Endure 6,000 kg attrition volume', targetValue: 6000 },
      { id: 'obj_krieg_sets', type: 'complete_sets', description: 'Complete 15 punishing trench sets', targetValue: 15 },
    ],
    rewards: [
      { type: 'xp', amount: 500, description: '+500 Krieg Atonement XP' },
      { type: 'title', title: 'Grenadier of Krieg', description: 'Earned the title: Grenadier of Krieg' },
    ],
    isCanonical: true,
    sourceNote: 'Imperial Armor Vol. 5: Siege of Vraks',
    iconName: 'skull-outline',
  },

  // =========================================================================
  // 3. ADEPTUS MECHANICUS
  // =========================================================================
  {
    id: 'mis_admech_calibration',
    title: 'Canticle of Binaric Calibration',
    shortDescription: 'Attune biological muscles and mechanical actuators to the Machine God.',
    briefing:
      'The flesh is weak, but with sacred grease and mathematically optimized torque, biological components can serve the Machine Spirit. Execute precise working sets.',
    factionId: 'adeptus-mechanicus',
    category: 'training',
    difficulty: 'patrol',
    minRankTier: 1,
    objectives: [
      { id: 'obj_admech_cal_wo', type: 'complete_workouts', description: 'Complete 1 calibration session', targetValue: 1 },
      { id: 'obj_admech_cal_sets', type: 'complete_sets', description: 'Perform 6 calculated working sets', targetValue: 6 },
    ],
    rewards: [
      { type: 'xp', amount: 150, description: '+150 Omnissiah Glory XP' },
      { type: 'title', title: 'Tech-Adept Initiate', description: 'Earned the title: Tech-Adept Initiate' },
    ],
    isCanonical: true,
    sourceNote: 'Codex: Adeptus Mechanicus Doctrina Imperatives',
    iconName: 'cog-outline',
  },
  {
    id: 'mis_admech_relic_recovery',
    title: 'Archaeotech Sub-Vault Excavation',
    shortDescription: 'Extract lost Standard Template Construct data from subterranean ruins.',
    briefing:
      'Deep beneath the ash wastes, sealed vaults hold sacred STC fragments. Deploy Skitarii phalanxes, shift tons of debris, and secure the data-cores.',
    factionId: 'adeptus-mechanicus',
    category: 'logistics',
    difficulty: 'skirmish',
    minRankTier: 2,
    prerequisites: ['mis_admech_calibration'],
    objectives: [
      { id: 'obj_admech_excav_vol', type: 'volume_kg', description: 'Lift 3,500 kg of vault debris', targetValue: 3500 },
      { id: 'obj_admech_excav_dmg', type: 'combat_damage', description: 'Purge scavengers for 500 damage', targetValue: 500 },
    ],
    rewards: [
      { type: 'xp', amount: 350, description: '+350 Omnissiah Glory XP' },
      { type: 'equipment_ref', targetRefId: 'relic_stc_cogitator_shard', description: 'Uncovered: STC Cogitator Shard' },
    ],
    isCanonical: true,
    sourceNote: 'Codex: Adeptus Mechanicus Quest for Knowledge',
    iconName: 'hardware-chip-outline',
  },
  {
    id: 'mis_admech_mars_purge',
    title: 'Fabricator-General\'s Mandate',
    shortDescription: 'Defeat scrap-corrupted abominations threatening the sacred forge.',
    briefing:
      'Dark Mechanicum heretics have unleashed scrap-code monstrosities upon the factory lines. Purge them with radium beams, phosphor volleys, and unrelenting iron will.',
    factionId: 'adeptus-mechanicus',
    category: 'boss',
    difficulty: 'boss',
    minRankTier: 3,
    prerequisites: ['mis_admech_relic_recovery'],
    objectives: [
      { id: 'obj_admech_boss_dmg', type: 'combat_damage', description: 'Inflict 2,000 thermal/kinetic damage', targetValue: 2000 },
      { id: 'obj_admech_boss_sets', type: 'complete_sets', description: 'Sustain 12 heavy forge sets', targetValue: 12 },
    ],
    rewards: [
      { type: 'xp', amount: 650, description: '+650 Omnissiah Glory XP' },
      { type: 'title', title: 'Magos Dominus of the Forge', description: 'Earned the title: Magos Dominus of the Forge' },
    ],
    isCanonical: true,
    sourceNote: 'Codex: Adeptus Mechanicus Cybernetica Protocols',
    iconName: 'flame-outline',
  },

  // =========================================================================
  // 4. ADEPTA SORORITAS (SISTERS OF BATTLE)
  // =========================================================================
  {
    id: 'mis_sor_vigil',
    title: 'Vigil of the Sacred Martyr',
    shortDescription: 'Kneel in steadfast prayer and rise with sacred zeal in your heart.',
    briefing:
      'The Emperor protects those who temper faith with bodily discipline. Log your prayerful working sets to purify the shrine world from heretical taint.',
    factionId: 'adepta-sororitas',
    category: 'training',
    difficulty: 'patrol',
    minRankTier: 1,
    objectives: [
      { id: 'obj_sor_vigil_wo', type: 'complete_workouts', description: 'Complete 1 vigil workout', targetValue: 1 },
      { id: 'obj_sor_vigil_sets', type: 'complete_sets', description: 'Perform 6 consecrated sets', targetValue: 6 },
    ],
    rewards: [
      { type: 'xp', amount: 150, description: '+150 Ecclesiarchal Glory XP' },
      { type: 'title', title: 'Sister Novitiate', description: 'Earned the title: Sister Novitiate' },
    ],
    isCanonical: true,
    sourceNote: 'Codex: Adepta Sororitas Acts of Faith',
    iconName: 'heart-outline',
  },
  {
    id: 'mis_sor_purifying_flame',
    title: 'Baptism of Holy Promethium',
    shortDescription: 'Cleanse heresy with holy bolters, flamers, and relentless fury.',
    briefing:
      'Covenant cathedrals have fallen under dark influence. Cleanse the desecrators with sacred flamer fuel and heavy volume strikes.',
    factionId: 'adepta-sororitas',
    category: 'assault',
    difficulty: 'skirmish',
    minRankTier: 2,
    prerequisites: ['mis_sor_vigil'],
    objectives: [
      { id: 'obj_sor_flame_dmg', type: 'combat_damage', description: 'Purge with 800 holy combat damage', targetValue: 800 },
      { id: 'obj_sor_flame_vol', type: 'volume_kg', description: 'Shift 3,000 kg consecrated volume', targetValue: 3000 },
    ],
    rewards: [
      { type: 'xp', amount: 350, description: '+350 Ecclesiarchal Glory XP' },
      { type: 'title', title: 'Seraphim of the Cleansing Flame', description: 'Earned the title: Seraphim of the Cleansing Flame' },
    ],
    isCanonical: true,
    sourceNote: 'Codex: Adepta Sororitas Holy Trinity Doctrine',
    iconName: 'flame-outline',
  },
  {
    id: 'mis_sor_saint_intervention',
    title: 'Saint Celestine\'s Miraculous Intervention',
    shortDescription: 'Manifest divine acts of faith and defeat heretical champions.',
    briefing:
      'When darkness chokes the battlefield, faith summons angelic retribution. Channel divine zeal through heavy working sets and purge blasphemous fiends.',
    factionId: 'adepta-sororitas',
    category: 'boss',
    difficulty: 'boss',
    minRankTier: 3,
    prerequisites: ['mis_sor_purifying_flame'],
    objectives: [
      { id: 'obj_sor_celest_dmg', type: 'combat_damage', description: 'Deliver 1,800 holy fury damage', targetValue: 1800 },
      { id: 'obj_sor_celest_sets', type: 'complete_sets', description: 'Log 12 fervent working sets', targetValue: 12 },
    ],
    rewards: [
      { type: 'xp', amount: 650, description: '+650 Ecclesiarchal Glory XP' },
      { type: 'title', title: 'Living Saint of the Emperor', description: 'Earned the title: Living Saint of the Emperor' },
    ],
    isCanonical: true,
    sourceNote: 'Codex: Adepta Sororitas Miracles and Relics',
    iconName: 'sparkles-outline',
  },

  // =========================================================================
  // 5. ADEPTUS CUSTODES
  // =========================================================================
  {
    id: 'mis_custodes_blood_game',
    title: 'The Blood Games of the Palace',
    shortDescription: 'Infiltrate the Imperial Palace security grid to test Terra\'s defenses.',
    briefing:
      'Every Custodian must periodically hunt his own brothers in deadly simulated infiltration. Demonstrate peak transhuman perfection across heavy lifts.',
    factionId: 'adeptus-custodes',
    category: 'training',
    difficulty: 'incursion',
    minRankTier: 1,
    objectives: [
      { id: 'obj_cust_bg_vol', type: 'volume_kg', description: 'Lift 4,000 kg of auramite tonnage', targetValue: 4000 },
      { id: 'obj_cust_bg_pr', type: 'pr_broken', description: 'Establish 1 personal lifting record', targetValue: 1 },
    ],
    rewards: [
      { type: 'xp', amount: 300, description: '+300 Golden Throne Glory XP' },
      { type: 'title', title: 'Guardian of the Throneworld', description: 'Earned the title: Guardian of the Throneworld' },
    ],
    isCanonical: true,
    sourceNote: 'Codex: Adeptus Custodes Blood Games Lore',
    iconName: 'diamond-outline',
  },
  {
    id: 'mis_custodes_shadowkeepers',
    title: 'Shadowkeepers: Dark Cells Containment',
    shortDescription: 'Pursue and recapture eldritch horrors that have escaped the Imperial Palace sub-levels.',
    briefing:
      'Locked away since the Age of Strife, horrors beneath the Throne room must never see the light of day. Execute precise pursuit drills and neutralize escaped anomalies.',
    factionId: 'adeptus-custodes',
    category: 'elimination',
    difficulty: 'skirmish',
    minRankTier: 2,
    prerequisites: ['mis_custodes_blood_game'],
    objectives: [
      { id: 'obj_cust_sk_dmg', type: 'combat_damage', description: 'Subdue entities for 1,200 auric damage', targetValue: 1200 },
      { id: 'obj_cust_sk_sets', type: 'complete_sets', description: 'Execute 10 perfect form working sets', targetValue: 10 },
    ],
    rewards: [
      { type: 'xp', amount: 450, description: '+450 Golden Throne Glory XP' },
      { type: 'title', title: 'Warden of the Dark Cells', description: 'Earned the title: Warden of the Dark Cells' },
    ],
    isCanonical: true,
    sourceNote: 'Codex: Adeptus Custodes Shadowkeepers Lore',
    iconName: 'shield-checkmark-outline',
  },
  {
    id: 'mis_custodes_dread_host',
    title: 'Dread Host: Decapitation Strike',
    shortDescription: 'Deploy via teleportarium to annihilate colossal threats to Holy Terra.',
    briefing:
      'The Dread Host exists to remind the galaxy why the Emperor created transhumans. Deliver an overwhelming display of transhuman power against a boss adversary.',
    factionId: 'adeptus-custodes',
    category: 'boss',
    difficulty: 'boss',
    minRankTier: 3,
    prerequisites: ['mis_custodes_shadowkeepers'],
    objectives: [
      { id: 'obj_cust_dh_dmg', type: 'combat_damage', description: 'Inflict 2,500 guardian spear damage', targetValue: 2500 },
      { id: 'obj_cust_dh_vol', type: 'volume_kg', description: 'Move 6,000 kg mastercrafted volume', targetValue: 6000 },
    ],
    rewards: [
      { type: 'xp', amount: 800, description: '+800 Golden Throne Glory XP' },
      { type: 'title', title: 'Shield-Captain of the Ten Thousand', description: 'Earned the title: Shield-Captain of the Ten Thousand' },
    ],
    isCanonical: true,
    sourceNote: 'Codex: Adeptus Custodes Dread Host Protocols',
    iconName: 'flame-outline',
  },

  // =========================================================================
  // 6. GREY KNIGHTS
  // =========================================================================
  {
    id: 'mis_gk_ward_ritual',
    title: 'Inscribing the Aegis Wards',
    shortDescription: 'Forge silver psychic wards into your armor through iron willpower.',
    briefing:
      'Daemonkind smells weakness in the Warp. Channel your supreme mental fortitude and physically rigorous discipline to seal the breach.',
    factionId: 'grey-knights',
    category: 'defense',
    difficulty: 'skirmish',
    minRankTier: 1,
    objectives: [
      { id: 'obj_gk_ward_sets', type: 'complete_sets', description: 'Inscribe 8 warding sets', targetValue: 8 },
      { id: 'obj_gk_ward_dmg', type: 'combat_damage', description: 'Banish warp foes for 600 damage', targetValue: 600 },
    ],
    rewards: [
      { type: 'xp', amount: 250, description: '+250 Titan Glory XP' },
      { type: 'title', title: 'Knight of Titan', description: 'Earned the title: Knight of Titan' },
    ],
    isCanonical: true,
    sourceNote: 'Codex: Grey Knights Aegis Armor',
    iconName: 'flash-outline',
  },
  {
    id: 'mis_gk_nemesis_assault',
    title: 'Swordbearers Nemesis Force Spearhead',
    shortDescription: 'Channel psychic power into Nemesis force halberds during an armored assault.',
    briefing:
      'A psychic conduit requires immense physical stamina. Channel warp energy safely through clean, disciplined working sets while carving through warp spawns.',
    factionId: 'grey-knights',
    category: 'assault',
    difficulty: 'incursion',
    minRankTier: 2,
    prerequisites: ['mis_gk_ward_ritual'],
    objectives: [
      { id: 'obj_gk_force_dmg', type: 'combat_damage', description: 'Channel 1,400 psychic combat damage', targetValue: 1400 },
      { id: 'obj_gk_force_vol', type: 'volume_kg', description: 'Shift 4,000 kg sanctified volume', targetValue: 4000 },
    ],
    rewards: [
      { type: 'xp', amount: 450, description: '+450 Titan Glory XP' },
      { type: 'title', title: 'Brother-Captain of Titan', description: 'Earned the title: Brother-Captain of Titan' },
    ],
    isCanonical: true,
    sourceNote: 'Codex: Grey Knights 1st Brotherhood',
    iconName: 'shield-outline',
  },
  {
    id: 'mis_gk_banish_greater_daemon',
    title: 'Rite of True Name Banishing',
    shortDescription: 'Speak the forbidden True Name of a Greater Daemon and cast it back to the Warp.',
    briefing:
      'The Greater Daemon of Chaos has breached realspace. Only supreme spiritual purity and unrelenting physical effort can hold the banishment circle unbroken.',
    factionId: 'grey-knights',
    category: 'boss',
    difficulty: 'boss',
    minRankTier: 3,
    prerequisites: ['mis_gk_nemesis_assault'],
    objectives: [
      { id: 'obj_gk_boss_dmg', type: 'combat_damage', description: 'Banish hostile for 2,200 holy damage', targetValue: 2200 },
      { id: 'obj_gk_boss_sets', type: 'complete_sets', description: 'Hold ritual across 14 working sets', targetValue: 14 },
    ],
    rewards: [
      { type: 'xp', amount: 750, description: '+750 Titan Glory XP' },
      { type: 'title', title: 'Grand Master of the Ordo Malleus', description: 'Earned the title: Grand Master of the Ordo Malleus' },
    ],
    isCanonical: true,
    sourceNote: 'Codex: Grey Knights Banishment Rites',
    iconName: 'skull-outline',
  },

  // =========================================================================
  // 7. IMPERIAL KNIGHTS
  // =========================================================================
  {
    id: 'mis_ik_titans_strides',
    title: 'Strides of the Questoris Titan',
    shortDescription: 'Channel the colossal kinetic output of a walking god-machine.',
    briefing:
      'The Throne Mechanicum demands immense neurological and physical power from its pilot. Move colossal working volume to march across the warzone.',
    factionId: 'imperial-knights',
    category: 'logistics',
    difficulty: 'incursion',
    minRankTier: 1,
    objectives: [
      { id: 'obj_ik_vol', type: 'volume_kg', description: 'Move 6,000 kg titan-scale volume', targetValue: 6000 },
      { id: 'obj_ik_sets', type: 'complete_sets', description: 'Log 12 pilot endurance sets', targetValue: 12 },
    ],
    rewards: [
      { type: 'xp', amount: 400, description: '+400 Chivalric Glory XP' },
      { type: 'title', title: 'Noble Scion of the Lance', description: 'Earned the title: Noble Scion of the Lance' },
    ],
    isCanonical: true,
    sourceNote: 'Codex: Imperial Knights Chivalric Code',
    iconName: 'construct-outline',
  },
  {
    id: 'mis_ik_house_terryn_lance',
    title: 'House Terryn Chivalric Charge',
    shortDescription: 'Lead a thunderous Knight cavalry spearhead into the enemy battle lines.',
    briefing:
      'Noble blood pulses with honor. Lower your ion shields, sound the battle horns, and grind enemy fortifications beneath hydraulic strides.',
    factionId: 'imperial-knights',
    category: 'assault',
    difficulty: 'skirmish',
    minRankTier: 2,
    prerequisites: ['mis_ik_titans_strides'],
    objectives: [
      { id: 'obj_ik_charge_dmg', type: 'combat_damage', description: 'Inflict 1,500 thermal cannon damage', targetValue: 1500 },
      { id: 'obj_ik_charge_vol', type: 'volume_kg', description: 'Move 5,000 kg cavalry charge volume', targetValue: 5000 },
    ],
    rewards: [
      { type: 'xp', amount: 450, description: '+450 Chivalric Glory XP' },
      { type: 'title', title: 'Knight Baron of the Realm', description: 'Earned the title: Knight Baron of the Realm' },
    ],
    isCanonical: true,
    sourceNote: 'Codex: Imperial Knights House Terryn',
    iconName: 'shield-outline',
  },
  {
    id: 'mis_ik_reaper_chainsword_duel',
    title: 'Duel of the Titanic Behemoths',
    shortDescription: 'Slay a gargantuan enemy war engine in honorable single combat.',
    briefing:
      'The monstrous bio-titan or chaos reaver stands unchallenged. Engage the colossus face-to-face with your reaper chainsword and claim battlefield supremacy.',
    factionId: 'imperial-knights',
    category: 'boss',
    difficulty: 'boss',
    minRankTier: 3,
    prerequisites: ['mis_ik_house_terryn_lance'],
    objectives: [
      { id: 'obj_ik_duel_dmg', type: 'combat_damage', description: 'Tear enemy war engine for 2,500 damage', targetValue: 2500 },
      { id: 'obj_ik_duel_sets', type: 'complete_sets', description: 'Survive 15 titan melee working sets', targetValue: 15 },
    ],
    rewards: [
      { type: 'xp', amount: 800, description: '+800 Chivalric Glory XP' },
      { type: 'title', title: 'High King of the Household', description: 'Earned the title: High King of the Household' },
    ],
    isCanonical: true,
    sourceNote: 'Codex: Imperial Knights Reaper Chainsword',
    iconName: 'trophy-outline',
  },

  // =========================================================================
  // 8. HERETIC ASTARTES (CHAOS SPACE MARINES)
  // =========================================================================
  {
    id: 'mis_csm_dark_rite',
    title: 'Black Crusade Blood Oath',
    shortDescription: 'Swear eternal vengeance against the Corpse-Emperor.',
    briefing:
      'Ten thousand years of bitter exile end today. Channel your unyielding hatred into ferocious physical training and spill imperial blood.',
    factionId: 'heretic-astartes',
    category: 'training',
    difficulty: 'patrol',
    minRankTier: 1,
    objectives: [
      { id: 'obj_csm_wo', type: 'complete_workouts', description: 'Complete 1 black crusade workout', targetValue: 1 },
      { id: 'obj_csm_sets', type: 'complete_sets', description: 'Complete 6 brutal working sets', targetValue: 6 },
    ],
    rewards: [
      { type: 'xp', amount: 150, description: '+150 Dark Gods Favor XP' },
      { type: 'title', title: 'Vanguard of the Traitor Legions', description: 'Earned the title: Vanguard of the Traitor Legions' },
    ],
    isCanonical: true,
    sourceNote: 'Codex: Chaos Space Marines Black Crusades',
    iconName: 'flame-outline',
  },
  {
    id: 'mis_csm_pillaging_assault',
    title: 'Raid on Imperial Munitions Depot',
    shortDescription: 'Plunder loyalist ammunition and weapon caches to fuel your warband.',
    briefing:
      'The warp engines thirst for raw material. Storm the Imperial Guard supply lines, tear down their barricades, and carry off heavy munitions.',
    factionId: 'heretic-astartes',
    category: 'assault',
    difficulty: 'skirmish',
    minRankTier: 2,
    prerequisites: ['mis_csm_dark_rite'],
    objectives: [
      { id: 'obj_csm_plunder_vol', type: 'volume_kg', description: 'Plunder 3,500 kg iron munitions', targetValue: 3500 },
      { id: 'obj_csm_plunder_dmg', type: 'combat_damage', description: 'Inflict 800 combat damage', targetValue: 800 },
    ],
    rewards: [
      { type: 'xp', amount: 350, description: '+350 Dark Gods Favor XP' },
      { type: 'equipment_ref', targetRefId: 'wargear_chaos_combi_bolter', description: 'Looted Wargear: Spiked Combi-Bolter' },
    ],
    isCanonical: true,
    sourceNote: 'Codex: Chaos Space Marines Warband Raids',
    iconName: 'skull-outline',
  },
  {
    id: 'mis_csm_iron_siege',
    title: 'Iron Within: Decimation Siege Battery',
    shortDescription: 'Crush fortified bastions beneath unrelenting artillery tonnage.',
    briefing:
      'The Iron Warriors calculate war in shells fired and blood spilled. Break through enemy siege lines through colossal tonnage moved.',
    factionId: 'heretic-astartes',
    category: 'logistics',
    difficulty: 'incursion',
    minRankTier: 3,
    prerequisites: ['mis_csm_pillaging_assault'],
    objectives: [
      { id: 'obj_csm_siege_vol', type: 'volume_kg', description: 'Move 5,500 kg siege ammunition volume', targetValue: 5500 },
      { id: 'obj_csm_siege_dmg', type: 'combat_damage', description: 'Bombard fortifications for 1,600 damage', targetValue: 1600 },
    ],
    rewards: [
      { type: 'xp', amount: 600, description: '+600 Dark Gods Favor XP' },
      { type: 'title', title: 'Warsmith of the Iron Trenches', description: 'Earned the title: Warsmith of the Iron Trenches' },
    ],
    isCanonical: true,
    sourceNote: 'Codex: Chaos Space Marines Iron Warriors',
    iconName: 'construct-outline',
  },

  // =========================================================================
  // 9. DEATH GUARD
  // =========================================================================
  {
    id: 'mis_dg_resilience',
    title: 'Gift of Disgusting Resilience',
    shortDescription: 'Shrug off fatigue, pain, and strain through supernatural endurance.',
    briefing:
      'Grandfather Nurgle loves all who endure without complaint. Complete high-volume, unrelenting sets without pausing or breaking form.',
    factionId: 'death-guard',
    category: 'training',
    difficulty: 'patrol',
    minRankTier: 1,
    objectives: [
      { id: 'obj_dg_sets', type: 'complete_sets', description: 'Endure 10 grueling working sets', targetValue: 10 },
      { id: 'obj_dg_reps', type: 'target_reps', description: 'Grind through 90 slow, steady reps', targetValue: 90 },
    ],
    rewards: [
      { type: 'xp', amount: 200, description: '+200 Nurgle Blessing XP' },
      { type: 'title', title: 'Plague Marine Stoic', description: 'Earned the title: Plague Marine Stoic' },
    ],
    isCanonical: true,
    sourceNote: 'Codex: Death Guard Disgustingly Resilient',
    iconName: 'shield-outline',
  },
  {
    id: 'mis_dg_harbingers_plague',
    title: 'The Harbingers: Destroyer Hive Inundation',
    shortDescription: 'Unleash swarms of droning plague flies and relentless attrition.',
    briefing:
      'Typhus leads the First Company across ruined worlds. Refuse to relent under intense burning muscle fatigue.',
    factionId: 'death-guard',
    category: 'assault',
    difficulty: 'skirmish',
    minRankTier: 2,
    prerequisites: ['mis_dg_resilience'],
    objectives: [
      { id: 'obj_dg_hive_dmg', type: 'combat_damage', description: 'Inflict 1,100 toxic combat damage', targetValue: 1100 },
      { id: 'obj_dg_hive_vol', type: 'volume_kg', description: 'Grind through 3,500 kg diseased volume', targetValue: 3500 },
    ],
    rewards: [
      { type: 'xp', amount: 400, description: '+400 Nurgle Blessing XP' },
      { type: 'title', title: 'Vector of the Destroyer Plague', description: 'Earned the title: Vector of the Destroyer Plague' },
    ],
    isCanonical: true,
    sourceNote: 'Codex: Death Guard 1st Company',
    iconName: 'bug-outline',
  },
  {
    id: 'mis_dg_mortarions_anvil',
    title: 'Mortarion\'s Anvil: Immovable Bulwark',
    shortDescription: 'Hold the frontline against an overwhelming boss counter-offensive.',
    briefing:
      'The Primarch\'s third company never yields ground. Stand immovable like a rusted monolith and defeat the hostile champion.',
    factionId: 'death-guard',
    category: 'boss',
    difficulty: 'boss',
    minRankTier: 3,
    prerequisites: ['mis_dg_harbingers_plague'],
    objectives: [
      { id: 'obj_dg_anvil_dmg', type: 'combat_damage', description: 'Endure and deal 2,200 decay damage', targetValue: 2200 },
      { id: 'obj_dg_anvil_sets', type: 'complete_sets', description: 'Hold ground for 14 working sets', targetValue: 14 },
    ],
    rewards: [
      { type: 'xp', amount: 750, description: '+750 Nurgle Blessing XP' },
      { type: 'title', title: 'Lord of Contagion', description: 'Earned the title: Lord of Contagion' },
    ],
    isCanonical: true,
    sourceNote: 'Codex: Death Guard Mortarion\'s Anvil',
    iconName: 'shield-outline',
  },

  // =========================================================================
  // 10. THOUSAND SONS
  // =========================================================================
  {
    id: 'mis_tsons_magic',
    title: 'Weaving the Sorcerous Filament',
    shortDescription: 'Focus mental acuity and mind-muscle synchronization.',
    briefing:
      'All is dust, but the will of Magnus endures. Execute your sets with surgical concentration, aligning every muscle fiber with sorcerous intent.',
    factionId: 'thousand-sons',
    category: 'training',
    difficulty: 'patrol',
    minRankTier: 1,
    objectives: [
      { id: 'obj_tsons_wo', type: 'complete_workouts', description: 'Complete 1 focused workout', targetValue: 1 },
      { id: 'obj_tsons_dmg', type: 'combat_damage', description: 'Cast warp fire for 500 damage', targetValue: 500 },
    ],
    rewards: [
      { type: 'xp', amount: 180, description: '+180 Sorcerous Knowledge XP' },
      { type: 'title', title: 'Acolyte of Tzeentch', description: 'Earned the title: Acolyte of Tzeentch' },
    ],
    isCanonical: true,
    sourceNote: 'Codex: Thousand Sons Rubric Rites',
    iconName: 'eye-outline',
  },
  {
    id: 'mis_tsons_warpfire_barrage',
    title: 'Pyrocult Sorcerous Warpfire Barrage',
    shortDescription: 'Incinerate heretical and loyalist flesh with iridescent psychic flame.',
    briefing:
      'Channel the mutative fires of Tzeentch. Let every repetition feed the warp spell until the enemy line dissolves into kaleidoscopic embers.',
    factionId: 'thousand-sons',
    category: 'assault',
    difficulty: 'skirmish',
    minRankTier: 2,
    prerequisites: ['mis_tsons_magic'],
    objectives: [
      { id: 'obj_tsons_fire_dmg', type: 'combat_damage', description: 'Burn foes for 1,200 warpfire damage', targetValue: 1200 },
      { id: 'obj_tsons_fire_reps', type: 'target_reps', description: 'Channel 100 sorcerous reps', targetValue: 100 },
    ],
    rewards: [
      { type: 'xp', amount: 420, description: '+420 Sorcerous Knowledge XP' },
      { type: 'title', title: 'Pyrocult Sorcerer', description: 'Earned the title: Pyrocult Sorcerer' },
    ],
    isCanonical: true,
    sourceNote: 'Codex: Thousand Sons Cult of Magic',
    iconName: 'flame-outline',
  },
  {
    id: 'mis_tsons_cult_duplicity',
    title: 'Cult of Duplicity: Temporal Breach',
    shortDescription: 'Manipulate time and space to outmaneuver a colossal enemy boss.',
    briefing:
      'Fate is a tapestry woven by the Great Conspirator. Warp the flow of time through high-tempo sets and obliterate the enemy warlord.',
    factionId: 'thousand-sons',
    category: 'boss',
    difficulty: 'boss',
    minRankTier: 3,
    prerequisites: ['mis_tsons_warpfire_barrage'],
    objectives: [
      { id: 'obj_tsons_dup_dmg', type: 'combat_damage', description: 'Inflict 2,100 psychic doom damage', targetValue: 2100 },
      { id: 'obj_tsons_dup_sets', type: 'complete_sets', description: 'Execute 12 precise temporal sets', targetValue: 12 },
    ],
    rewards: [
      { type: 'xp', amount: 700, description: '+700 Sorcerous Knowledge XP' },
      { type: 'title', title: 'Exalted Sorcerer of the Rubric', description: 'Earned the title: Exalted Sorcerer of the Rubric' },
    ],
    isCanonical: true,
    sourceNote: 'Codex: Thousand Sons Cult of Duplicity',
    iconName: 'eye-outline',
  },

  // =========================================================================
  // 11. WORLD EATERS
  // =========================================================================
  {
    id: 'mis_we_butchers_nails',
    title: 'The Butcher\'s Nails Sing',
    shortDescription: 'Unleash absolute explosive aggression in the lifting pit.',
    briefing:
      'The Nails bite deep into the brain stem. Blood for the Blood God! Skulls for the Skull Throne! Channel pure primal rage into max-effort working sets.',
    factionId: 'world-eaters',
    category: 'assault',
    difficulty: 'skirmish',
    minRankTier: 1,
    objectives: [
      { id: 'obj_we_dmg', type: 'combat_damage', description: 'Cleave foes for 1,200 melee damage', targetValue: 1200 },
      { id: 'obj_we_sets', type: 'complete_sets', description: 'Rage through 10 furious sets', targetValue: 10 },
    ],
    rewards: [
      { type: 'xp', amount: 300, description: '+300 Khorne Favor XP' },
      { type: 'title', title: 'Berserker of the Red Sands', description: 'Earned the title: Berserker of the Red Sands' },
    ],
    isCanonical: true,
    sourceNote: 'Codex: World Eaters Butcher\'s Nails Lore',
    iconName: 'flash-outline',
  },
  {
    id: 'mis_we_chainaxe_massacre',
    title: 'Eightfold Path of Chainaxe Slaughter',
    shortDescription: 'Carve through defending infantry with roaring, blood-slick chainaxes.',
    briefing:
      'Khorne does not care from whence the blood flows, so long as it flows. Maximize your lifting intensity and harvest skulls.',
    factionId: 'world-eaters',
    category: 'assault',
    difficulty: 'incursion',
    minRankTier: 2,
    prerequisites: ['mis_we_butchers_nails'],
    objectives: [
      { id: 'obj_we_axe_dmg', type: 'combat_damage', description: 'Reap 1,800 visceral melee damage', targetValue: 1800 },
      { id: 'obj_we_axe_vol', type: 'volume_kg', description: 'Tear through 4,500 kg slaughter volume', targetValue: 4500 },
    ],
    rewards: [
      { type: 'xp', amount: 500, description: '+500 Khorne Favor XP' },
      { type: 'title', title: 'Khorne Berzerker Champion', description: 'Earned the title: Khorne Berzerker Champion' },
    ],
    isCanonical: true,
    sourceNote: 'Codex: World Eaters Chainaxe Combat',
    iconName: 'cut-outline',
  },
  {
    id: 'mis_we_champion_of_khorne',
    title: 'Trial of the Skull Harvest',
    shortDescription: 'Behead an enemy warlord in the sacred gladiator pits of the World Eaters.',
    briefing:
      'A champion of the Emperor or Xenos beast dares challenge the Red God. Sever its neck with supreme furious force.',
    factionId: 'world-eaters',
    category: 'boss',
    difficulty: 'boss',
    minRankTier: 3,
    prerequisites: ['mis_we_chainaxe_massacre'],
    objectives: [
      { id: 'obj_we_boss_dmg', type: 'combat_damage', description: 'Deal 2,600 furious combat damage', targetValue: 2600 },
      { id: 'obj_we_boss_sets', type: 'complete_sets', description: 'Fight through 14 unrelenting sets', targetValue: 14 },
    ],
    rewards: [
      { type: 'xp', amount: 850, description: '+850 Khorne Favor XP' },
      { type: 'title', title: 'Master of the Red Path', description: 'Earned the title: Master of the Red Path' },
    ],
    isCanonical: true,
    sourceNote: 'Codex: World Eaters Skull Throne Rites',
    iconName: 'skull-outline',
  },

  // =========================================================================
  // 12. CHAOS DAEMONS
  // =========================================================================
  {
    id: 'mis_daemons_warp_breach',
    title: 'Warp Storm Manifestation',
    shortDescription: 'Tear open the veil between realspace and the Immaterium.',
    briefing:
      'The veil thins wherever intense kinetic struggle takes place. Feed the warp storm with unrelenting repetitions and overwhelming tonnage.',
    factionId: 'chaos-daemons',
    category: 'special',
    difficulty: 'skirmish',
    minRankTier: 1,
    objectives: [
      { id: 'obj_daemon_vol', type: 'volume_kg', description: 'Manifest 3,000 kg warp volume', targetValue: 3000 },
      { id: 'obj_daemon_atks', type: 'combat_attacks', description: 'Unleash 12 warp strikes', targetValue: 12 },
    ],
    rewards: [
      { type: 'xp', amount: 250, description: '+250 Immaterium Surge XP' },
      { type: 'title', title: 'Herald of the Ruinous Powers', description: 'Earned the title: Herald of the Ruinous Powers' },
    ],
    isCanonical: true,
    sourceNote: 'Codex: Chaos Daemons Warp Storm Rules',
    iconName: 'nuclear-outline',
  },
  {
    id: 'mis_daemons_blood_harvest',
    title: 'Bloodletter Hellblade Incursion',
    shortDescription: 'Summon hellblade-wielding legions to soak the battlefield in gore.',
    briefing:
      'The Brass Citadel rings with the bellows of daemonic hordes. Feed the Warp with high-velocity reps and combat slaughter.',
    factionId: 'chaos-daemons',
    category: 'assault',
    difficulty: 'skirmish',
    minRankTier: 2,
    prerequisites: ['mis_daemons_warp_breach'],
    objectives: [
      { id: 'obj_daemon_blade_dmg', type: 'combat_damage', description: 'Inflict 1,300 hellblade damage', targetValue: 1300 },
      { id: 'obj_daemon_blade_sets', type: 'complete_sets', description: 'Execute 10 ferocious working sets', targetValue: 10 },
    ],
    rewards: [
      { type: 'xp', amount: 420, description: '+420 Immaterium Surge XP' },
      { type: 'title', title: 'Bloodletter Packleader', description: 'Earned the title: Bloodletter Packleader' },
    ],
    isCanonical: true,
    sourceNote: 'Codex: Chaos Daemons Bloodletters',
    iconName: 'flame-outline',
  },
  {
    id: 'mis_daemons_greater_manifestation',
    title: 'Greater Daemon of the Warp Incarnate',
    shortDescription: 'Manifest a towering Greater Daemon entity to swallow the mortal realm.',
    briefing:
      'Bloodthirster, Lord of Change, Great Unclean One, or Keeper of Secrets. Tear open the rift and unleash cosmic madness.',
    factionId: 'chaos-daemons',
    category: 'boss',
    difficulty: 'boss',
    minRankTier: 3,
    prerequisites: ['mis_daemons_blood_harvest'],
    objectives: [
      { id: 'obj_daemon_boss_dmg', type: 'combat_damage', description: 'Deal 2,400 primordial warp damage', targetValue: 2400 },
      { id: 'obj_daemon_boss_vol', type: 'volume_kg', description: 'Move 6,000 kg reality-rending volume', targetValue: 6000 },
    ],
    rewards: [
      { type: 'xp', amount: 800, description: '+800 Immaterium Surge XP' },
      { type: 'title', title: 'Prince of the Immaterium', description: 'Earned the title: Prince of the Immaterium' },
    ],
    isCanonical: true,
    sourceNote: 'Codex: Chaos Daemons Greater Daemons',
    iconName: 'skull-outline',
  },

  // =========================================================================
  // 13. AELDARI (CRAFTWORLDS)
  // =========================================================================
  {
    id: 'mis_aeldari_path_warrior',
    title: 'Walking the Warrior Path',
    shortDescription: 'Embrace the lethal grace of the Aspect Shrines.',
    briefing:
      'The Aeldari survive on the knife-edge of doom. Every strike must be executed with flawless velocity, agility, and economy of movement.',
    factionId: 'aeldari',
    category: 'training',
    difficulty: 'patrol',
    minRankTier: 1,
    objectives: [
      { id: 'obj_aeldari_wo', type: 'complete_workouts', description: 'Complete 1 Path of the Warrior drill', targetValue: 1 },
      { id: 'obj_aeldari_reps', type: 'target_reps', description: 'Execute 75 graceful repetitions', targetValue: 75 },
    ],
    rewards: [
      { type: 'xp', amount: 150, description: '+150 Asuryani Grace XP' },
      { type: 'title', title: 'Aspect Warrior Initiate', description: 'Earned the title: Aspect Warrior Initiate' },
    ],
    isCanonical: true,
    sourceNote: 'Codex: Aeldari Path System',
    iconName: 'leaf-outline',
  },
  {
    id: 'mis_aeldari_howling_banshee',
    title: 'Howling Banshee War Cry Strike',
    shortDescription: 'Disorient enemies with supersonic acoustic shrieks and swift power swords.',
    briefing:
      'A banshee mask magnifies vocal energy into a weapon. Channel high-velocity intensity across rapid working sets.',
    factionId: 'aeldari',
    category: 'assault',
    difficulty: 'skirmish',
    minRankTier: 2,
    prerequisites: ['mis_aeldari_path_warrior'],
    objectives: [
      { id: 'obj_banshee_dmg', type: 'combat_damage', description: 'Deliver 1,100 sonic blade damage', targetValue: 1100 },
      { id: 'obj_banshee_sets', type: 'complete_sets', description: 'Perform 10 acrobatic working sets', targetValue: 10 },
    ],
    rewards: [
      { type: 'xp', amount: 380, description: '+380 Asuryani Grace XP' },
      { type: 'title', title: 'Exarch of the Howling Shrine', description: 'Earned the title: Exarch of the Howling Shrine' },
    ],
    isCanonical: true,
    sourceNote: 'Codex: Aeldari Howling Banshees',
    iconName: 'flash-outline',
  },
  {
    id: 'mis_aeldari_avatar_of_khaine',
    title: 'Awakening the Avatar of Khaine',
    shortDescription: 'Sacrifice complacency to ignite the living molten iron god of war.',
    briefing:
      'The iron statue breathes molten brass and smoke. Channel ancient warrior fury through heavy tonnage moved and defeat the monstrous adversary.',
    factionId: 'aeldari',
    category: 'boss',
    difficulty: 'boss',
    minRankTier: 3,
    prerequisites: ['mis_aeldari_howling_banshee'],
    objectives: [
      { id: 'obj_khaine_dmg', type: 'combat_damage', description: 'Wield the Wailing Doom for 2,200 damage', targetValue: 2200 },
      { id: 'obj_khaine_vol', type: 'volume_kg', description: 'Move 4,500 kg molten iron volume', targetValue: 4500 },
    ],
    rewards: [
      { type: 'xp', amount: 750, description: '+750 Asuryani Grace XP' },
      { type: 'title', title: 'Hand of the Bloody-Handed God', description: 'Earned the title: Hand of the Bloody-Handed God' },
    ],
    isCanonical: true,
    sourceNote: 'Codex: Aeldari Avatar of Khaine',
    iconName: 'flame-outline',
  },

  // =========================================================================
  // 14. DRUKHARI (DARK ELDAR)
  // =========================================================================
  {
    id: 'mis_drukhari_raid',
    title: 'Commorragh Realspace Raid',
    shortDescription: 'Strike from webway portals to harvest pain and vital essence.',
    briefing:
      'The Dark City starves without the torment of lesser beings. Blitz into realspace, execute vicious strikes, and vanish before reinforcements arrive.',
    factionId: 'drukhari',
    category: 'assault',
    difficulty: 'skirmish',
    minRankTier: 1,
    objectives: [
      { id: 'obj_drukhari_dmg', type: 'combat_damage', description: 'Inflict 700 agonizing damage', targetValue: 700 },
      { id: 'obj_drukhari_sets', type: 'complete_sets', description: 'Execute 8 lightning-speed sets', targetValue: 8 },
    ],
    rewards: [
      { type: 'xp', amount: 220, description: '+220 Commorrite Pain XP' },
      { type: 'title', title: 'Kabalite Raider', description: 'Earned the title: Kabalite Raider' },
    ],
    isCanonical: true,
    sourceNote: 'Codex: Drukhari Realspace Raids',
    iconName: 'cut-outline',
  },
  {
    id: 'mis_drukhari_wych_arena',
    title: 'Crucible of the Wych Cult Gladiators',
    shortDescription: 'Dance through monomolecular razor-wire and decapitate arena beasts.',
    briefing:
      'The arenas of Commorragh crave spectacle and blood. Execute high-repetition agile sets under harrowing cardiovascular strain.',
    factionId: 'drukhari',
    category: 'assault',
    difficulty: 'skirmish',
    minRankTier: 2,
    prerequisites: ['mis_drukhari_raid'],
    objectives: [
      { id: 'obj_wych_dmg', type: 'combat_damage', description: 'Carve beasts for 1,200 combat damage', targetValue: 1200 },
      { id: 'obj_wych_reps', type: 'target_reps', description: 'Log 90 lightning repetitions', targetValue: 90 },
    ],
    rewards: [
      { type: 'xp', amount: 400, description: '+400 Commorrite Pain XP' },
      { type: 'title', title: 'Succubus of the Arena', description: 'Earned the title: Succubus of the Arena' },
    ],
    isCanonical: true,
    sourceNote: 'Codex: Drukhari Wych Cults',
    iconName: 'flash-outline',
  },
  {
    id: 'mis_drukhari_talos_pain_engine',
    title: 'Unleashing the Talos Pain Engine',
    shortDescription: 'Harvest agony from an enemy champion using biomechanical torturers.',
    briefing:
      'Crafted by the Haemonculi, the Talos drains vital ichor to preserve your soul. Overcome the hostile colossus with heavy volume.',
    factionId: 'drukhari',
    category: 'boss',
    difficulty: 'boss',
    minRankTier: 3,
    prerequisites: ['mis_drukhari_wych_arena'],
    objectives: [
      { id: 'obj_talos_dmg', type: 'combat_damage', description: 'Drain 2,000 vital essence damage', targetValue: 2000 },
      { id: 'obj_talos_vol', type: 'volume_kg', description: 'Sustain 4,000 kg biomechanical volume', targetValue: 4000 },
    ],
    rewards: [
      { type: 'xp', amount: 750, description: '+750 Commorrite Pain XP' },
      { type: 'title', title: 'Archon of the High Kabal', description: 'Earned the title: Archon of the High Kabal' },
    ],
    isCanonical: true,
    sourceNote: 'Codex: Drukhari Covens and Pain Engines',
    iconName: 'skull-outline',
  },

  // =========================================================================
  // 15. NECRONS
  // =========================================================================
  {
    id: 'mis_necrons_awakening',
    title: 'The Great Awakening of the Crypt',
    shortDescription: 'Reboot subterranean tomb networks and revive the slumbering phalanxes.',
    briefing:
      'For sixty million years our dynastic tombs have waited. Send power conduits surging through heavy deadlifts and presses to awaken the army.',
    factionId: 'necrons',
    category: 'training',
    difficulty: 'patrol',
    minRankTier: 1,
    objectives: [
      { id: 'obj_necron_wo', type: 'complete_workouts', description: 'Complete 1 tomb revival workout', targetValue: 1 },
      { id: 'obj_necron_sets', type: 'complete_sets', description: 'Execute 8 living metal sets', targetValue: 8 },
    ],
    rewards: [
      { type: 'xp', amount: 160, description: '+160 Dynastic Glory XP' },
      { type: 'title', title: 'Awakened Immortal', description: 'Earned the title: Awakened Immortal' },
    ],
    isCanonical: true,
    sourceNote: 'Codex: Necrons Awakening Protocols',
    iconName: 'hourglass-outline',
  },
  {
    id: 'mis_necrons_monolith',
    title: 'Powering the Doomsday Monolith',
    shortDescription: 'Channel colossal wattage through heavy compound lifting tonnage.',
    briefing:
      'The Monolith is the floating fortress of the Phaeron. Move heavy mass to charge its particle whip and vaporize the biological vermin.',
    factionId: 'necrons',
    category: 'logistics',
    difficulty: 'incursion',
    minRankTier: 2,
    prerequisites: ['mis_necrons_awakening'],
    objectives: [
      { id: 'obj_necron_vol', type: 'volume_kg', description: 'Power grid with 4,500 kg volume', targetValue: 4500 },
      { id: 'obj_necron_dmg', type: 'combat_damage', description: 'Disintegrate hostiles for 1,000 damage', targetValue: 1000 },
    ],
    rewards: [
      { type: 'xp', amount: 450, description: '+450 Dynastic Glory XP' },
      { type: 'title', title: 'Lord of the Tomb World', description: 'Earned the title: Lord of the Tomb World' },
    ],
    isCanonical: true,
    sourceNote: 'Codex: Necrons Heavy War Engines',
    iconName: 'cube-outline',
  },
  {
    id: 'mis_necrons_dynasty_purge',
    title: 'C\'tan Shard Reality Warp Protocol',
    shortDescription: 'Unchain a shard of the Star Gods to disintegrate an invading boss army.',
    briefing:
      'The transcendent C\'tan bends physics to the Phaeron\'s command. Shift immense gravitational tonnage and vaporize the biological vermin.',
    factionId: 'necrons',
    category: 'boss',
    difficulty: 'boss',
    minRankTier: 3,
    prerequisites: ['mis_necrons_monolith'],
    objectives: [
      { id: 'obj_ctan_dmg', type: 'combat_damage', description: 'Disintegrate hostiles for 2,400 antimatter damage', targetValue: 2400 },
      { id: 'obj_ctan_vol', type: 'volume_kg', description: 'Anchor 6,000 kg gravity volume', targetValue: 6000 },
    ],
    rewards: [
      { type: 'xp', amount: 800, description: '+800 Dynastic Glory XP' },
      { type: 'title', title: 'Phaeron of the Infinite Empire', description: 'Earned the title: Phaeron of the Infinite Empire' },
    ],
    isCanonical: true,
    sourceNote: 'Codex: Necrons C\'tan Shards',
    iconName: 'nuclear-outline',
  },

  // =========================================================================
  // 16. ORKS
  // =========================================================================
  {
    id: 'mis_orks_krumpin',
    title: 'Da Great Krumpin\' Rite',
    shortDescription: 'Bash heads, flex green muscles, and yell WAAAGH at the top of your lungs.',
    briefing:
      'Orks don\'t mess about with delicate book-learnin\'. Get stuck in, pick up da heaviest iron in da scrap-pile, and clobber anything in your path!',
    factionId: 'orks',
    category: 'training',
    difficulty: 'patrol',
    minRankTier: 1,
    objectives: [
      { id: 'obj_ork_wo', type: 'complete_workouts', description: 'Complete 1 proppa Boyz workout', targetValue: 1 },
      { id: 'obj_ork_reps', type: 'target_reps', description: 'Chop through 60 smashin\' reps', targetValue: 60 },
    ],
    rewards: [
      { type: 'xp', amount: 150, description: '+150 Waaagh Teef & Glory XP' },
      { type: 'title', title: 'Proppa Boy', description: 'Earned the title: Proppa Boy' },
    ],
    isCanonical: true,
    sourceNote: 'Codex: Orks Waaagh! Energy',
    iconName: 'hammer-outline',
  },
  {
    id: 'mis_orks_scrap_truk',
    title: 'Lootin\' da Humie Scrap Yard',
    shortDescription: 'Carry off heavy scrap iron to build bigger shootas and choppas.',
    briefing:
      'Da Mekboy needs tons of iron plates to armor up the battlewagons. Carry immense weight back to camp and krump anyone who objects.',
    factionId: 'orks',
    category: 'logistics',
    difficulty: 'skirmish',
    minRankTier: 2,
    prerequisites: ['mis_orks_krumpin'],
    objectives: [
      { id: 'obj_ork_vol', type: 'volume_kg', description: 'Loot 3,500 kg scrap iron volume', targetValue: 3500 },
      { id: 'obj_ork_dmg', type: 'combat_damage', description: 'Smash humies for 750 damage', targetValue: 750 },
    ],
    rewards: [
      { type: 'xp', amount: 350, description: '+350 Waaagh Teef & Glory XP' },
      { type: 'title', title: 'Nob of the Mob', description: 'Earned the title: Nob of the Mob' },
    ],
    isCanonical: true,
    sourceNote: 'Codex: Orks Looted Wagons',
    iconName: 'construct-outline',
  },
  {
    id: 'mis_orks_waaagh_stomp',
    title: 'The Great WAAAGH! Boss Stomp',
    shortDescription: 'Smash an enemy commander to pieces and prove you\'re da biggest and strongest.',
    briefing:
      'Green is best! Bosses only respect one thing: bigger choppas, louder roars, and sheer brute strength. Batter the biggest foe on the field!',
    factionId: 'orks',
    category: 'boss',
    difficulty: 'boss',
    minRankTier: 3,
    prerequisites: ['mis_orks_scrap_truk'],
    objectives: [
      { id: 'obj_ork_stomp_dmg', type: 'combat_damage', description: 'Deliver 2,500 skull-bustin\' damage', targetValue: 2500 },
      { id: 'obj_ork_stomp_vol', type: 'volume_kg', description: 'Haul 5,500 kg heavy scrap iron volume', targetValue: 5500 },
    ],
    rewards: [
      { type: 'xp', amount: 800, description: '+800 Waaagh Teef & Glory XP' },
      { type: 'title', title: 'Warlord of da Great WAAAGH!', description: 'Earned the title: Warlord of da Great WAAAGH!' },
    ],
    isCanonical: true,
    sourceNote: 'Codex: Orks Warboss Decapitation',
    iconName: 'skull-outline',
  },

  // =========================================================================
  // 17. T'AU EMPIRE
  // =========================================================================
  {
    id: 'mis_tau_greater_good',
    title: 'For the Greater Good: Fire Caste Drill',
    shortDescription: 'Train with coordinated pulse volleys and tactical discipline.',
    briefing:
      'The Greater Good demands synchronized cooperation and relentless technical discipline. Train your body so your pulse rifle strikes with flawless accuracy.',
    factionId: 'tau-empire',
    category: 'training',
    difficulty: 'patrol',
    minRankTier: 1,
    objectives: [
      { id: 'obj_tau_wo', type: 'complete_workouts', description: 'Complete 1 Fire Caste training mission', targetValue: 1 },
      { id: 'obj_tau_sets', type: 'complete_sets', description: 'Complete 6 disciplined working sets', targetValue: 6 },
    ],
    rewards: [
      { type: 'xp', amount: 150, description: '+150 Greater Good XP' },
      { type: 'title', title: 'Shas\'la Fire Warrior', description: 'Earned the title: Shas\'la Fire Warrior' },
    ],
    isCanonical: true,
    sourceNote: 'Codex: T\'au Empire Fire Caste Doctrines',
    iconName: 'planet-outline',
  },
  {
    id: 'mis_tau_kauyon',
    title: 'The Patient Hunter (Kauyon)',
    shortDescription: 'Lure the enemy into an inescapable crossfire through calculated sets.',
    briefing:
      'Commander Shadowsun teaches patience before devastation. Build tension through controlled working sets, then wipe out the enemy vanguard.',
    factionId: 'tau-empire',
    category: 'defense',
    difficulty: 'skirmish',
    minRankTier: 2,
    prerequisites: ['mis_tau_greater_good'],
    objectives: [
      { id: 'obj_tau_dmg', type: 'combat_damage', description: 'Inflict 850 concentrated pulse damage', targetValue: 850 },
      { id: 'obj_tau_reps', type: 'target_reps', description: 'Log 80 precision repetitions', targetValue: 80 },
    ],
    rewards: [
      { type: 'xp', amount: 300, description: '+300 Greater Good XP' },
      { type: 'title', title: 'Master of Kauyon', description: 'Earned the title: Master of Kauyon' },
    ],
    isCanonical: true,
    sourceNote: 'Codex: T\'au Empire Kauyon Strategy',
    iconName: 'eye-outline',
  },
  // Subfaction: Farsight Enclaves
  {
    id: 'mis_tau_farsight_montka',
    title: 'Mont\'ka: The Killing Blow',
    shortDescription: 'Execute Commander Farsight\'s aggressive close-quarters assault.',
    briefing:
      'Break away from Etherial passivity. Strike directly at the enemy command structure with fierce aggression, dawn blade sweeps, and heavy compound volume.',
    factionId: 'tau-empire',
    subfactionId: 'farsight-enclaves',
    category: 'special',
    difficulty: 'incursion',
    minRankTier: 2,
    objectives: [
      { id: 'obj_farsight_dmg', type: 'combat_damage', description: 'Deliver 1,200 Mont\'ka strike damage', targetValue: 1200 },
      { id: 'obj_farsight_vol', type: 'volume_kg', description: 'Move 3,500 kg close-combat volume', targetValue: 3500 },
    ],
    rewards: [
      { type: 'xp', amount: 450, description: '+450 Enclave Glory XP' },
      { type: 'title', title: 'Warrior of the Eight', description: 'Earned the title: Warrior of the Eight' },
    ],
    isCanonical: true,
    sourceNote: 'Farsight Enclaves: The Eight Codices',
    iconName: 'flash-outline',
  },

  // =========================================================================
  // 18. TYRANIDS
  // =========================================================================
  {
    id: 'mis_tyranids_assimilation',
    title: 'Biomass Harvest Protocol',
    shortDescription: 'Consume all organic matter and channel it into evolutionary growth.',
    briefing:
      'The Hive Mind directs millions of bio-forms into the fray. Consume raw energy through relentless workout repetitions to feed the birthing pools.',
    factionId: 'tyranids',
    category: 'training',
    difficulty: 'patrol',
    minRankTier: 1,
    objectives: [
      { id: 'obj_tyranid_wo', type: 'complete_workouts', description: 'Complete 1 biomass ingestion session', targetValue: 1 },
      { id: 'obj_tyranid_reps', type: 'target_reps', description: 'Consume 80 biomass repetitions', targetValue: 80 },
    ],
    rewards: [
      { type: 'xp', amount: 150, description: '+150 Hive Mind Growth XP' },
      { type: 'title', title: 'Gaunt of the Brood', description: 'Earned the title: Gaunt of the Brood' },
    ],
    isCanonical: true,
    sourceNote: 'Codex: Tyranids Biomass Assimilation',
    iconName: 'bug-outline',
  },
  {
    id: 'mis_tyranids_gaunt_swarm',
    title: 'Hormagaunt Swarm Inundation',
    shortDescription: 'Overwhelm enemy positions with an endless tide of relentless biological fury.',
    briefing:
      'A single bio-form is easily crushed, but a surging swarm of thousands drowns all resistance. Perform high-volume repetitions and claw through enemy battle lines.',
    factionId: 'tyranids',
    category: 'assault',
    difficulty: 'skirmish',
    minRankTier: 2,
    prerequisites: ['mis_tyranids_assimilation'],
    objectives: [
      { id: 'obj_tyranid_dmg', type: 'combat_damage', description: 'Inflict 1,200 swarm assault damage', targetValue: 1200 },
      { id: 'obj_tyranid_rep_count', type: 'target_reps', description: 'Log 120 rapid bio-strike repetitions', targetValue: 120 },
    ],
    rewards: [
      { type: 'xp', amount: 400, description: '+400 Hive Mind Growth XP' },
      { type: 'title', title: 'Synaptic Broodlord', description: 'Earned the title: Synaptic Broodlord' },
    ],
    isCanonical: true,
    sourceNote: 'Codex: Tyranids Swarm Rules',
    iconName: 'flame-outline',
  },
  {
    id: 'mis_tyranids_carnifex_ram',
    title: 'Carnifex: Living Battering Ram',
    shortDescription: 'Unleash monstrous bio-titans to shatter heavy bunkers and armor.',
    briefing:
      'The synapse command requires a catastrophic blunt-force breakthrough. Channel monstrous physical power into maximal tonnage and crush the largest target.',
    factionId: 'tyranids',
    category: 'boss',
    difficulty: 'boss',
    minRankTier: 3,
    prerequisites: ['mis_tyranids_gaunt_swarm'],
    objectives: [
      { id: 'obj_tyranid_boss_dmg', type: 'combat_damage', description: 'Deliver 2,400 crushing bio-titan damage', targetValue: 2400 },
      { id: 'obj_tyranid_heavy_vol', type: 'volume_kg', description: 'Haul 5,500 kg chitinous mass volume', targetValue: 5500 },
    ],
    rewards: [
      { type: 'xp', amount: 800, description: '+800 Hive Mind Growth XP' },
      { type: 'title', title: 'Apex Hive Tyrant', description: 'Earned the title: Apex Hive Tyrant' },
    ],
    isCanonical: true,
    sourceNote: 'Codex: Tyranids Carnifex Siege Bio-morphs',
    iconName: 'skull-outline',
  },

  // =========================================================================
  // 19. GENESTEALER CULTS
  // =========================================================================
  {
    id: 'mis_gsc_uprising',
    title: 'The Day of Ascension Dawns',
    shortDescription: 'Rise from the subterranean mines to overthrow the oppressors.',
    briefing:
      'Generations of hard labor in the mining tunnels have prepared your body for this moment. Swing rock saws and heavy picks with revolutionary fervor.',
    factionId: 'genestealer-cults',
    category: 'assault',
    difficulty: 'patrol',
    minRankTier: 1,
    objectives: [
      { id: 'obj_gsc_wo', type: 'complete_workouts', description: 'Complete 1 uprising training session', targetValue: 1 },
      { id: 'obj_gsc_sets', type: 'complete_sets', description: 'Execute 7 mining working sets', targetValue: 7 },
    ],
    rewards: [
      { type: 'xp', amount: 150, description: '+150 Ascension Glory XP' },
      { type: 'title', title: 'Brother of the Cult', description: 'Earned the title: Brother of the Cult' },
    ],
    isCanonical: true,
    sourceNote: 'Codex: Genestealer Cults Cult Ambush Rules',
    iconName: 'git-network-outline',
  },
  {
    id: 'mis_gsc_sabotage',
    title: 'Power Conduit Mining Demolition',
    shortDescription: 'Detonate seismic charges and sever hive spire supply lines from below.',
    briefing:
      'The planetary defense forces rely on deep subterranean reactors. Carry heavy seismic munitions and dismantle their fortified perimeter.',
    factionId: 'genestealer-cults',
    category: 'logistics',
    difficulty: 'skirmish',
    minRankTier: 2,
    prerequisites: ['mis_gsc_uprising'],
    objectives: [
      { id: 'obj_gsc_vol', type: 'volume_kg', description: 'Move 3,500 kg seismic charge volume', targetValue: 3500 },
      { id: 'obj_gsc_dmg', type: 'combat_damage', description: 'Deal 900 structural sabotage damage', targetValue: 900 },
    ],
    rewards: [
      { type: 'xp', amount: 380, description: '+380 Ascension Glory XP' },
      { type: 'title', title: 'Acolyte Saboteur', description: 'Earned the title: Acolyte Saboteur' },
    ],
    isCanonical: true,
    sourceNote: 'Codex: Genestealer Cults Subterranean Ambush',
    iconName: 'construct-outline',
  },
  {
    id: 'mis_gsc_patriarch_decree',
    title: 'The Patriarch\'s Brood Purge',
    shortDescription: 'Lead the final insurrection strike alongside the Purestrain Patriarch.',
    briefing:
      'The Grandfather calls from the deepest catacombs. Overthrow the planetary governor\'s redoubt with overwhelming combat fury and unbreakable discipline.',
    factionId: 'genestealer-cults',
    category: 'boss',
    difficulty: 'boss',
    minRankTier: 3,
    prerequisites: ['mis_gsc_sabotage'],
    objectives: [
      { id: 'obj_gsc_boss_dmg', type: 'combat_damage', description: 'Inflict 2,200 Patriarch wrath damage', targetValue: 2200 },
      { id: 'obj_gsc_sets_purge', type: 'complete_sets', description: 'Complete 12 fanatical working sets', targetValue: 12 },
    ],
    rewards: [
      { type: 'xp', amount: 750, description: '+750 Ascension Glory XP' },
      { type: 'title', title: 'Magus of the Star Children', description: 'Earned the title: Magus of the Star Children' },
    ],
    isCanonical: true,
    sourceNote: 'Codex: Genestealer Cults Patriarch Broodmind',
    iconName: 'skull-outline',
  },

  // =========================================================================
  // 20. LEAGUES OF VOTANN
  // =========================================================================
  {
    id: 'mis_votann_prospect',
    title: 'Prospecting the Deep Core',
    shortDescription: 'Excavate precious mineral veins from high-gravity asteroids.',
    briefing:
      'The Ancestors are watching. In the high gravity of the galactic core, only the sturdy survive. Move heavy iron plates and return with raw wealth.',
    factionId: 'leagues-of-votann',
    category: 'logistics',
    difficulty: 'patrol',
    minRankTier: 1,
    objectives: [
      { id: 'obj_votann_wo', type: 'complete_workouts', description: 'Complete 1 prospecting workout', targetValue: 1 },
      { id: 'obj_votann_vol', type: 'volume_kg', description: 'Excavate 2,500 kg heavy ore volume', targetValue: 2500 },
    ],
    rewards: [
      { type: 'xp', amount: 175, description: '+175 Ancestor Worth XP' },
      { type: 'title', title: 'Hearthkyn Prospector', description: 'Earned the title: Hearthkyn Prospector' },
    ],
    isCanonical: true,
    sourceNote: 'Codex: Leagues of Votann Eye of the Ancestors',
    iconName: 'cube-outline',
  },
  {
    id: 'mis_votann_ancestor_judgment',
    title: 'The Ancestor\'s Eye of Judgment',
    shortDescription: 'Mark and dismantle high-threat hostiles with heavy magna-rail weapons.',
    briefing:
      'Any grudge unfulfilled is a stain upon the League. Mark the adversary with judgment tokens and deliver crushing, high-damage working sets.',
    factionId: 'leagues-of-votann',
    category: 'elimination',
    difficulty: 'skirmish',
    minRankTier: 2,
    prerequisites: ['mis_votann_prospect'],
    objectives: [
      { id: 'obj_votann_dmg', type: 'combat_damage', description: 'Inflict 1,000 magna-rail damage', targetValue: 1000 },
      { id: 'obj_votann_sets', type: 'complete_sets', description: 'Log 10 sturdy working sets', targetValue: 10 },
    ],
    rewards: [
      { type: 'xp', amount: 350, description: '+350 Ancestor Worth XP' },
      { type: 'title', title: 'Kin Thegn of the Hold', description: 'Earned the title: Kin Thegn of the Hold' },
    ],
    isCanonical: true,
    sourceNote: 'Codex: Leagues of Votann Judgment Tokens',
    iconName: 'shield-outline',
  },
  {
    id: 'mis_votann_core_excavation',
    title: 'Hearthguard Deep Core Fortress Excavation',
    shortDescription: 'Deploy Einhyr Hearthguard exo-armor to break through super-dense bedrock and eliminate subterranean threats.',
    briefing:
      'A massive core repository has been detected under catastrophic tectonic pressure. Don the exo-armor, lift astronomical tonnage, and break any warlord standing between the Kin and the Ancestors\' prize.',
    factionId: 'leagues-of-votann',
    category: 'boss',
    difficulty: 'boss',
    minRankTier: 3,
    prerequisites: ['mis_votann_ancestor_judgment'],
    objectives: [
      { id: 'obj_votann_boss_vol', type: 'volume_kg', description: 'Move 6,000 kg dense core tonnage volume', targetValue: 6000 },
      { id: 'obj_votann_boss_dmg', type: 'combat_damage', description: 'Deliver 2,200 heavy exo-armor ordnance damage', targetValue: 2200 },
    ],
    rewards: [
      { type: 'xp', amount: 800, description: '+800 Ancestor Worth XP' },
      { type: 'title', title: 'Kâhl of the Greater Thurian League', description: 'Earned the title: Kâhl of the Greater Thurian League' },
    ],
    isCanonical: true,
    sourceNote: 'Codex: Leagues of Votann Einhyr Hearthguard',
    iconName: 'trophy-outline',
  },
];

/**
 * Returns all missions available for a specific faction and optional subfaction.
 * Subfaction missions and parent faction missions are returned together.
 */
export function getMissionsForFaction(
  factionId: string,
  subfactionId?: string
): FactionMissionDefinition[] {
  return FACTION_MISSION_CATALOG.filter((m) => {
    if (m.factionId !== factionId) return false;
    // If mission has a subfaction restriction, it only matches if player has that subfaction
    if (m.subfactionId && m.subfactionId !== subfactionId) return false;
    return true;
  });
}

/**
 * Retrieves a single mission definition by its unique ID.
 */
export function getMissionDefinitionById(
  missionId: string
): FactionMissionDefinition | undefined {
  return FACTION_MISSION_CATALOG.find((m) => m.id === missionId);
}

export const getMissionById = getMissionDefinitionById;
