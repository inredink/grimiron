import {
  GeneratedBossIdentity,
  BossPhaseDefinition,
  BossDifficultyTier,
  EncounterModifier,
} from '../../types/warfront';

/**
 * Seeded pseudo-random generator (Mulberry32 derived)
 * Guarantees 100% deterministic generation from any seed string.
 */
export function createDeterministicPrng(seedStr: string): () => number {
  let h = 1779033703 ^ seedStr.length;
  for (let i = 0; i < seedStr.length; i++) {
    h = Math.imul(h ^ seedStr.charCodeAt(i), 3432918353);
    h = (h << 13) | (h >>> 19);
  }
  return function () {
    h = Math.imul(h ^ (h >>> 16), 2246822507);
    h = Math.imul(h ^ (h >>> 13), 3266489909);
    return ((h ^= h >>> 16) >>> 0) / 4294967296;
  };
}

export interface BossArchetypeDefinition {
  id: string;
  name: string;
  combatRole: string; // e.g. "Frontline Bruiser", "Stealth Duelist", "Heavy Siege", "Synaptic Commander"
  weapon: string;
  trait: string;
  glyph: string;
  tacticalDescription: string;
  modifier: EncounterModifier;
}

export interface FactionSubfactionMeta {
  id: string;
  name: string;
  primaryColor: string;
  accentColor: string;
}

export interface FactionBossCatalog {
  factionId: string;
  factionName: string;
  namingGrammar: (
    nameRoot: string,
    epithet: string,
    title: string,
    subfactionName?: string
  ) => { name: string; title: string };
  nameRoots: string[];
  epithets: string[];
  titles: string[];
  honorifics: string[];
  archetypes: BossArchetypeDefinition[];
  subfactions: FactionSubfactionMeta[];
  primaryColor: string;
  accentColor: string;
  loreTemplates: string[];
}

export const FACTION_BOSS_CATALOGS: Record<string, FactionBossCatalog> = {
  // ==========================================
  // 1. ORKS
  // ==========================================
  'orks': {
    factionId: 'orks',
    factionName: 'Orks',
    namingGrammar: (root, epithet, title) => ({
      name: `${root} ${epithet}`,
      title: `${title}`,
    }),
    nameRoots: ['Gorzod', 'Skagbad', 'Uzgob', 'Gorbag', 'Grimlok', 'Dakkagut', 'Skullkrumpa', 'Mek-Boss Zogg'],
    epithets: ['Iron-Teeth', 'Bone-Breaka', 'Da Waaagh-Maker', 'Ash-Scourge', 'Trukk-Smasher', 'Gore-Cleaver'],
    titles: ['Warlord of da Ironjawz', 'Supreme Krumpa', 'Grand Burna-King', 'Terror of the Ash Wastes', 'Scourge of the Rifts'],
    honorifics: ["Da Meanest an' Biggest", 'Gork\'s Chosen Anvil', 'Choppa of Mork', 'Scourge of Armageddon'],
    archetypes: [
      {
        id: 'mega_warlord',
        name: 'Mega-Armored Warlord',
        combatRole: 'Frontline Bruiser',
        weapon: 'Piston-Driven Power Klaw',
        trait: 'Waaagh! Ferocity (+20% strike fury under heavy strain)',
        glyph: 'hammer',
        tacticalDescription: 'Heavily armored brute that absorbs kinetic impact and hits with concussive force.',
        modifier: { id: 'mod_waaagh_surge', name: 'Waaagh! Surge', description: 'Damage output increases as battle progresses.', iconName: 'flash', color: '#FF9800' },
      },
      {
        id: 'speed_deffkilla',
        name: 'Speed-Freak Deffkilla',
        combatRole: 'Shock Striker',
        weapon: 'Twin-Linked Kombi-Shoota & Spiked Ram',
        trait: 'High-Velocity Blitz (High dodge and sudden momentum surges)',
        glyph: 'speedometer',
        tacticalDescription: 'High-speed war machine commander that demands rapid, explosive interval sets.',
        modifier: { id: 'mod_turbo_boost', name: 'Kustom Turbo-Boost', description: 'Requires fast, explosive repetitions.', iconName: 'rocket', color: '#E65100' },
      },
      {
        id: 'burna_pyro',
        name: 'Burna-King Pyromaniac',
        combatRole: 'Area Denial Saboteur',
        weapon: 'Kustom Mega-Skorcha & Gas Bombs',
        trait: 'Scorched Earth (Inflicts compounding muscle burn over time)',
        glyph: 'flame',
        tacticalDescription: 'Spews sustained torrents of promethium. Consistency under fatigue is essential.',
        modifier: { id: 'mod_scorched_earth', name: 'Scorched Earth', description: 'Endurance threshold escalates with each round.', iconName: 'flame', color: '#FF3D00' },
      },
    ],
    subfactions: [
      { id: 'goffs', name: 'Goffs', primaryColor: '#212121', accentColor: '#D50000' },
      { id: 'bad-moons', name: 'Bad Moons', primaryColor: '#FBC02D', accentColor: '#212121' },
      { id: 'evil-sunz', name: 'Evil Sunz', primaryColor: '#C62828', accentColor: '#FFD600' },
    ],
    primaryColor: '#1B5E20',
    accentColor: '#FF9800',
    loreTemplates: [
      'A massive towering greenskin warlord clad in scrap-welded mega-armor, bellowing deafening war cries across the warzone.',
      'A cunning greenskin warlord who has butchered countless garrisons, leading an unstoppable stampede of war machines.',
    ],
  },

  // ==========================================
  // 2. NECRONS
  // ==========================================
  'necrons': {
    factionId: 'necrons',
    factionName: 'Necrons',
    namingGrammar: (root, epithet, title, subfaction) => ({
      name: `${root} the ${epithet}`,
      title: `${title} of the ${subfaction || 'Nihilakh'} Dynasty`,
    }),
    nameRoots: ['Khepren-Ra', 'Szarekhar', 'Thokt-Nekh', 'Amun-Set', 'Nihilakh-Ur', 'Nephrek-Vor', 'Sautekh-Zul'],
    epithets: ['Undying', 'Eternal Architect', 'Star-Cleanser', 'Soulless', 'Stasis Warden', 'Cosmic Sovereign'],
    titles: ['Overlord', 'Nemesor', 'Phaeron', 'Royal Warden', 'High Chronomancer'],
    honorifics: ['He Who Sleeps No More', 'Master of the Infinite Tombs', 'Scourge of Biological Life'],
    archetypes: [
      {
        id: 'dynastic_phaeron',
        name: 'Dynastic Overlord',
        combatRole: 'Reanimation Tactician',
        weapon: 'Staff of the Destroyer & Resurrection Orb',
        trait: 'Living Metal (Continuous nanite self-repair across rounds)',
        glyph: 'hardware-chip',
        tacticalDescription: 'Ancient android commander who continually repairs damaged necrodermis.',
        modifier: { id: 'mod_living_metal', name: 'Living Metal Nanites', description: 'Requires heavy volume to outpace self-repair.', iconName: 'sync', color: '#00E676' },
      },
      {
        id: 'skorpekh_slayer',
        name: 'Skorpekh Destroyer Lord',
        combatRole: 'Heavy Kinetic Duelist',
        weapon: 'Hyperphase Harvester & Enmitic Annihilator',
        trait: 'Phase Shifter (Intermittent physical invulnerability frames)',
        glyph: 'shield-checkmark',
        tacticalDescription: 'Three-legged mechanical slaughterer optimized solely for physical decimation.',
        modifier: { id: 'mod_phase_barrier', name: 'Phase Shielding', description: 'Deflects glancing blows; full lockouts required.', iconName: 'shield', color: '#00B0FF' },
      },
      {
        id: 'chronomancer_overseer',
        name: 'Cryptek Chronomancer',
        combatRole: 'Temporal Disruptor',
        weapon: 'Aeonstave & Chronometron',
        trait: 'Entropic Time-Warp (Disrupts player tempo and cadence)',
        glyph: 'time',
        tacticalDescription: 'Manipulates local space-time to slow muscular reaction and sap power.',
        modifier: { id: 'mod_chronos_drain', name: 'Entropic Stasis', description: 'Sets must maintain strict tempo pacing.', iconName: 'hourglass', color: '#76FF03' },
      },
    ],
    subfactions: [
      { id: 'szarekhan', name: 'Szarekhan', primaryColor: '#8D6E63', accentColor: '#00E676' },
      { id: 'sautekh', name: 'Sautekh', primaryColor: '#37474F', accentColor: '#76FF03' },
      { id: 'nihilakh', name: 'Nihilakh', primaryColor: '#006064', accentColor: '#FFD700' },
    ],
    primaryColor: '#1B5E20',
    accentColor: '#00E676',
    loreTemplates: [
      'An ancient dynastic ruler whose necrodermis shell has stood unyielding against sixty million years of cosmic decay.',
      'A cold, calculating mechanical lord commanding legions of reanimated immortals to purge biological vermin.',
    ],
  },

  // ==========================================
  // 3. TYRANIDS
  // ==========================================
  'tyranids': {
    factionId: 'tyranids',
    factionName: 'Tyranids',
    namingGrammar: (root, epithet, title, subfaction) => ({
      name: `${root} (${epithet})`,
      title: `${title} of Hive Fleet ${subfaction || 'Leviathan'}`,
    }),
    nameRoots: ['Apex Synapse Tyrant', 'Bio-Titan Dread-Matrix', 'Gorgon-Strain Alpha', 'Behemoth-Spawn', 'Kraken-Reaver'],
    epithets: ['Bio-Extinction Vector', 'Herald of Devouring', 'Synaptic Nexus', 'Chitinous Devourer', 'Shadow-Carapace'],
    titles: ['Prime Organism', 'Apex Bioform', 'Swarm Conductor', 'Living Extinction Event'],
    honorifics: ['The All-Consuming', 'Shadow in the Warp Incarnate', 'Biological Apocalypse'],
    archetypes: [
      {
        id: 'hive_tyrant',
        name: 'Apex Hive Tyrant',
        combatRole: 'Synaptic Commander',
        weapon: 'Twin Heavy Boneswords & Bio-Plasma',
        trait: 'Synaptic Imperative (Psychic bio-shielding dampens damage)',
        glyph: 'git-pull-request',
        tacticalDescription: 'Central intelligence directing thousands of organisms with hyper-evolved malice.',
        modifier: { id: 'mod_synapse_link', name: 'Synaptic Ward', description: 'Requires sustained compound movement volume.', iconName: 'pulse', color: '#CE93D8' },
      },
      {
        id: 'carnifex_battering',
        name: 'Carnifex Bio-Ram',
        combatRole: 'Frontline Juggernaut',
        weapon: 'Crushing Claws & Heavy Venom Cannon',
        trait: 'Hyper-Adaptive Carapace (Evolving dermal resistance)',
        glyph: 'shield',
        tacticalDescription: 'Living siege engine capable of breaking plasteel battle gates with pure mass.',
        modifier: { id: 'mod_adaptive_hide', name: 'Chitin Hardening', description: 'High tonnage required to crack thick shell.', iconName: 'barbell', color: '#AB47BC' },
      },
    ],
    subfactions: [
      { id: 'leviathan', name: 'Leviathan', primaryColor: '#311B92', accentColor: '#CE93D8' },
      { id: 'kraken', name: 'Kraken', primaryColor: '#B71C1C', accentColor: '#FFF8E1' },
      { id: 'behemoth', name: 'Behemoth', primaryColor: '#0D47A1', accentColor: '#D50000' },
    ],
    primaryColor: '#4A148C',
    accentColor: '#CE93D8',
    loreTemplates: [
      'A terrifyingly intelligent apex organism orchestrating millions of bioforms with cold, hive-minded perfection.',
      'A towering biological war-engine whose heavy boneswords slice through tank armor with bio-plasma energy.',
    ],
  },

  // ==========================================
  // 4. HERETIC ASTARTES
  // ==========================================
  'heretic-astartes': {
    factionId: 'heretic-astartes',
    factionName: 'Heretic Astartes',
    namingGrammar: (root, epithet, title) => ({
      name: `Lord ${root}`,
      title: `${title}, ${epithet}`,
    }),
    nameRoots: ['Korvax', 'Malakor', 'Valgar', 'Drakon-Null', 'Sevatar-Vex', 'Balthazar-Mor', 'Kroll'],
    epithets: ['Bane of the False Emperor', 'Breaker of Cadia', 'Champion of the Long War', 'Soul-Reaver'],
    titles: ['Chaos Terminator Lord', 'Dark Apostle', 'Havoc War-Smith', 'Iron Champion'],
    honorifics: ['Vanguard of the Black Crusade', 'Warp-Forged Slayer', 'Castellan of Damnation'],
    archetypes: [
      {
        id: 'terminator_lord',
        name: 'Chaos Terminator Lord',
        combatRole: 'Heavy Kinetic Duelist',
        weapon: 'Daemon-Forged Chainaxe & Combi-Melta',
        trait: 'Veterans of the Long War (Relentless tactical malice and counter-attacks)',
        glyph: 'skull',
        tacticalDescription: 'Ancient veteran of ten millennia clad in spiked, corrupted terminator plate.',
        modifier: { id: 'mod_long_war', name: 'Malicious Vengeance', description: 'Counter-strikes hit hard when rests are rushed.', iconName: 'skull', color: '#FF5252' },
      },
      {
        id: 'dark_apostle',
        name: 'Dark Apostle',
        combatRole: 'Unholy Tactician',
        weapon: 'Accursed Crozius & Demonic Grimoire',
        trait: 'Dark Zealotry (Aura of dark devotion dampens incoming hits)',
        glyph: 'bonfire',
        tacticalDescription: 'Corrupted chaplain chanting blasphemous battle prayers that bend reality.',
        modifier: { id: 'mod_dark_prayer', name: 'Unholy Prayers', description: 'Demands intense focus and controlled tempo.', iconName: 'flame', color: '#D50000' },
      },
    ],
    subfactions: [
      { id: 'black-legion', name: 'Black Legion', primaryColor: '#212121', accentColor: '#FFD700' },
      { id: 'iron-warriors', name: 'Iron Warriors', primaryColor: '#546E7A', accentColor: '#F57F17' },
      { id: 'alpha-legion', name: 'Alpha Legion', primaryColor: '#006064', accentColor: '#00E5FF' },
    ],
    primaryColor: '#37474F',
    accentColor: '#FF5252',
    loreTemplates: [
      'A bitter veteran of ten millennia of war against the Imperium, adorned in spiked ceramite and trophies of slain warriors.',
      'A dark warlord commanding daemon engines and renegade warbands in relentless service to the Ruinous Powers.',
    ],
  },

  // ==========================================
  // 5. DEATH GUARD
  // ==========================================
  'death-guard': {
    factionId: 'death-guard',
    factionName: 'Death Guard',
    namingGrammar: (root, epithet, title) => ({
      name: `Pus-Lord ${root}`,
      title: `${title}, ${epithet}`,
    }),
    nameRoots: ['Kholerax', 'Malgoth', 'Gorgan', 'Festus', 'Morbax', 'Pustulor', 'Vermin-Breeder'],
    epithets: ['Vector of the Seventh Blight', 'Blight-Reaper', 'Castellan of Rust', 'Harvester of Pus'],
    titles: ['Lord of Contagion', 'Malignant Plaguecaster', 'Blightlord Champion', 'Keeper of the Cauldron'],
    honorifics: ['Beloved of Nurgle', 'Unbroken Rot-Lord', 'Bringer of Sweet Decay'],
    archetypes: [
      {
        id: 'lord_of_contagion',
        name: 'Lord of Contagion',
        combatRole: 'Toxic Juggernaut',
        weapon: 'Manreaper War Scythe & Blight Grenades',
        trait: 'Disgustingly Resilient (Immense structural damage dampening)',
        glyph: 'pulse',
        tacticalDescription: 'Bloated terminator champion whose armor weeps viral ichor, immune to pain.',
        modifier: { id: 'mod_rot_aura', name: 'Aura of Decay', description: 'Requires heavy volume to overcome damage negation.', iconName: 'water', color: '#AED581' },
      },
    ],
    subfactions: [
      { id: 'harbingers', name: 'The Harbingers', primaryColor: '#33691E', accentColor: '#7CB342' },
      { id: 'inexorable', name: 'The Inexorable', primaryColor: '#558B2F', accentColor: '#C0CA33' },
    ],
    primaryColor: '#33691E',
    accentColor: '#AED581',
    loreTemplates: [
      'A bloated champion whose rusted armor weeps pus and viral ichor, completely immune to mortal fatigue.',
      'A lord of rot whose presence rusts plasteel and rots flesh within seconds of stepping onto the warfront.',
    ],
  },

  // ==========================================
  // 6. WORLD EATERS
  // ==========================================
  'world-eaters': {
    factionId: 'world-eaters',
    factionName: 'World Eaters',
    namingGrammar: (root, epithet, title) => ({
      name: `Slaughter-Master ${root}`,
      title: `${title}, ${epithet}`,
    }),
    nameRoots: ['Varkas', 'Skane', 'Azrakh', 'Karrack', 'Vorzhak', 'Gore-Hound', 'Kragh'],
    epithets: ['Cleaver of the Eightfold Path', 'Skull-Taker', 'Herald of Khorne', 'Lord of Gore'],
    titles: ['Master of Executions', 'Eightbound Champion', 'Berzerker War-Leader', 'Red Butcher'],
    honorifics: ["Master of the Butcher's Nails", 'Slayer of Champions', 'Blood-Sworn Reaver'],
    archetypes: [
      {
        id: 'execution_master',
        name: 'Master of Executions',
        combatRole: 'Berserk Duelist',
        weapon: 'Dual Chainaxes & Heavy Cleaver',
        trait: "Butcher's Nails Frenzy (Strikes accelerate wildly at lower health)",
        glyph: 'flame',
        tacticalDescription: 'Ferocious melee champion driven to unstoppable slaughter by neural implants.',
        modifier: { id: 'mod_blood_frenzy', name: 'Blood Frenzy', description: 'Boss deals compounding counter-damage in Phase 2 & 3.', iconName: 'flame', color: '#FF1744' },
      },
    ],
    subfactions: [
      { id: 'gladiator-cadre', name: 'Gladiator Cadre 331', primaryColor: '#B71C1C', accentColor: '#FFD700' },
      { id: 'hound-pack', name: 'The Blood Hounds', primaryColor: '#880E4F', accentColor: '#FF5252' },
    ],
    primaryColor: '#B71C1C',
    accentColor: '#FF1744',
    loreTemplates: [
      "A ferocious butcher-lord whose Butcher's Nails pulse with agony that can only be silenced by the death of worthy foes.",
      'Clad in brass and crimson plate, this champion revs paired chainaxes with enough kinetic fury to sunder tanks.',
    ],
  },

  // ==========================================
  // 7. THOUSAND SONS
  // ==========================================
  'thousand-sons': {
    factionId: 'thousand-sons',
    factionName: 'Thousand Sons',
    namingGrammar: (root, epithet, title) => ({
      name: `Magister ${root}`,
      title: `${title}, ${epithet}`,
    }),
    nameRoots: ['Tolkhet', 'Iskandar-Zul', 'Phosis-Amon', 'Tolkhor', 'Amon-Ptah', 'Khepri-Thoth'],
    epithets: ['Weaver of the Prism', 'Architect of Dust', 'Lord of Mutating Fates', 'Keeper of Secrets'],
    titles: ['Exalted Sorcerer', 'Infernal Master', 'Master of the Silver Tower', 'Grand Magister'],
    honorifics: ['Architect of Rubricae', 'Eye of Change', 'Sorcerer-King of Prospero'],
    archetypes: [
      {
        id: 'exalted_sorcerer',
        name: 'Exalted Sorcerer',
        combatRole: 'Sorcerous Overlord',
        weapon: 'Force Staff & Warpflame Pistol',
        trait: 'Sorcerous Ward (Deflective psychic barrier that negates light attacks)',
        glyph: 'eye',
        tacticalDescription: 'Master of empyrean sorcery commanding hollow suits of living Rubric armor.',
        modifier: { id: 'mod_warp_flux', name: 'Warp-Flux Shielding', description: 'Requires heavy working sets to pierce psychic wards.', iconName: 'flash', color: '#00E5FF' },
      },
    ],
    subfactions: [
      { id: 'cult-of-magic', name: 'Cult of Magic', primaryColor: '#01579B', accentColor: '#FFD700' },
      { id: 'cult-of-time', name: 'Cult of Time', primaryColor: '#006064', accentColor: '#80D8FF' },
    ],
    primaryColor: '#01579B',
    accentColor: '#FFD700',
    loreTemplates: [
      'A master of empyrean sorcery commanding legions of hollow Rubricae whose bodies are dust sealed within armor.',
      'A sorcerer-lord who weaves illusions and blue warp flame to incinerate the bodies and souls of mortal challengers.',
    ],
  },

  // ==========================================
  // 8. CHAOS DAEMONS
  // ==========================================
  'chaos-daemons': {
    factionId: 'chaos-daemons',
    factionName: 'Chaos Daemons',
    namingGrammar: (root, epithet, title) => ({
      name: `${root}`,
      title: `${title}, ${epithet}`,
    }),
    nameRoots: ["Xar'goth the Rend-Master", 'Vorath of the Rot-Pool', 'Kaelith the Agonist', 'Fate-Render Chronos', 'Bile-Fiend Gor'],
    epithets: ['Terror of Realspace', 'Embodied Nightmare', 'Render of Dimensions', 'Devourer of Mortal Will'],
    titles: ['Exalted Warp Titan', 'Herald of Primordial Chaos', 'Emissary of the Ruinous Rift', 'Abyssal Lord'],
    honorifics: ['Scourge of Mortal Minds', 'Bringer of Ruin', 'Embodied Nightmare'],
    archetypes: [
      {
        id: 'warp_titan',
        name: 'Warp-Rift Horror',
        combatRole: 'Colossal Warp Juggernaut',
        weapon: 'Blade of Dimensional Cleaves',
        trait: 'Warp Instability (Phasing invulnerability requiring relentless consistency)',
        glyph: 'triangle',
        tacticalDescription: 'Colossal entity manifested through a dimensional tear, fueled by battle fury.',
        modifier: { id: 'mod_warp_instability', name: 'Warp Phasing', description: 'Requires unbroken session adherence to maintain damage.', iconName: 'flash', color: '#FF5252' },
      },
    ],
    subfactions: [
      { id: 'khorne-daemons', name: 'Legions of Blood', primaryColor: '#B71C1C', accentColor: '#FFD700' },
      { id: 'nurgle-daemons', name: 'Plague Host', primaryColor: '#33691E', accentColor: '#AED581' },
    ],
    primaryColor: '#880E4F',
    accentColor: '#FF5252',
    loreTemplates: [
      'A colossal warp entity materialized through a dimensional rift, feeding on the fear and blood of the battlefield.',
      'An ancient daemon lord whose very presence bends gravity, lighting the sky with purple and crimson fire.',
    ],
  },

  // ==========================================
  // 9. AELDARI
  // ==========================================
  'aeldari': {
    factionId: 'aeldari',
    factionName: 'Aeldari',
    namingGrammar: (root, epithet, title, subfaction) => ({
      name: `Autarch ${root}`,
      title: `${title} of Craftworld ${subfaction || 'Biel-Tan'}, ${epithet}`,
    }),
    nameRoots: ['Ythan-Vane', 'Kaelen-El', 'Talas-Mor', 'Iyanna-Syl', 'Eladris-Lir', 'Morai-Thal', 'Fhaer-Il'],
    epithets: ['Blade of Destiny', 'Guardian of the Webway', 'The Unbroken Path', 'Sword of Asuryan'],
    titles: ['Grand Autarch', 'Aspect Exarch Commander', 'Voice of the Ancestors', 'Master of the War-Host'],
    honorifics: ['Weaver of Destiny', 'Defender of the Shrine', 'Champion of Asuryan'],
    archetypes: [
      {
        id: 'autarch_tactician',
        name: 'Craftworld Autarch',
        combatRole: 'Precision Duelist',
        weapon: 'Star Glaive & Fusion Gun',
        trait: 'Battle Focus (Acrobatic evasion that punishes slow or loose sets)',
        glyph: 'leaf',
        tacticalDescription: 'Centuries of martial mastery across Aspect Paths allow rapid prediction of strikes.',
        modifier: { id: 'mod_battle_focus', name: 'Battle Focus', description: 'Strict form and cadence required to hit evasive commander.', iconName: 'locate', color: '#4DB6AC' },
      },
    ],
    subfactions: [
      { id: 'biel-tan', name: 'Biel-Tan', primaryColor: '#00695C', accentColor: '#FFFFFF' },
      { id: 'ulthwe', name: 'Ulthwé', primaryColor: '#212121', accentColor: '#FFE082' },
      { id: 'saim-hann', name: 'Saim-Hann', primaryColor: '#C62828', accentColor: '#FFFFFF' },
    ],
    primaryColor: '#00695C',
    accentColor: '#4DB6AC',
    loreTemplates: [
      'A noble warrior whose centuries of mastery across multiple Aspect Paths allow him to predict and counter every blow.',
      'A grand Autarch clad in lightweight wraithbone armor, dancing through combat with peerless grace.',
    ],
  },

  // ==========================================
  // 10. DRUKHARI
  // ==========================================
  'drukhari': {
    factionId: 'drukhari',
    factionName: 'Drukhari',
    namingGrammar: (root, epithet, title, subfaction) => ({
      name: `Archon ${root}`,
      title: `${title} of the ${subfaction || 'Flayed Skull'}, ${epithet}`,
    }),
    nameRoots: ['Vraxx', 'Malix', 'Kruell', 'Sylph-Agon', 'Xyrak-Venom', 'Kael-Varn', 'Morval'],
    epithets: ['Connoisseur of Pain', 'Tyrant of Commorragh', 'Lacerator of Souls', 'Master of Agony'],
    titles: ['Hierarch of the High Spire', 'Arena Overlord', 'Kabalite Sovereign', 'Grand Flayer'],
    honorifics: ['Connoisseur of Agony', 'Bane of the Mon-keigh', 'Lord of Shattered Souls'],
    archetypes: [
      {
        id: 'archon_tyrant',
        name: 'Kabalite Archon',
        combatRole: 'Agony Exploiter',
        weapon: 'Huskblade & Blast Pistol',
        trait: 'Power from Pain (Damage scaling intensifies as combat is prolonged)',
        glyph: 'flash',
        tacticalDescription: 'Sadistic warlord whose armor feeds directly on physical struggle and exertion.',
        modifier: { id: 'mod_power_from_pain', name: 'Power from Pain', description: 'Pushes player into high-intensity bursts to end encounter quickly.', iconName: 'pulse', color: '#1DE9B6' },
      },
    ],
    subfactions: [
      { id: 'black-heart', name: 'Kabal of the Black Heart', primaryColor: '#004D40', accentColor: '#80CBC4' },
      { id: 'flayed-skull', name: 'Kabal of the Flayed Skull', primaryColor: '#B71C1C', accentColor: '#212121' },
    ],
    primaryColor: '#004D40',
    accentColor: '#1DE9B6',
    loreTemplates: [
      'A sadistic Archon whose armor feeds directly on the physical suffering and terror of his opponents.',
      'A lightning-fast arena master who turns combat into a gruesome theater of precision lacerations.',
    ],
  },

  // ==========================================
  // 11. T'AU EMPIRE
  // ==========================================
  'tau-empire': {
    factionId: 'tau-empire',
    factionName: "T'au Empire",
    namingGrammar: (root, epithet, title, subfaction) => ({
      name: `${root}`,
      title: `${title} of Sept ${subfaction || "Vior'la"}, ${epithet}`,
    }),
    nameRoots: ["Shas'o Kaelen", "Shas'el Mont'yr", "Shas'vre Tor'kan", "Commander Kais'tor", "Shas'o Shovah-Vane"],
    epithets: ['Master of the Mont\'ka', 'Sword of Tau\'va', 'Hero of the Third Sphere', 'Patient Hunter of the Kauyon'],
    titles: ['Coldstar Battlesuit Commander', 'Crisis Wing Strike-Leader', 'Fire Caste Paragon', 'Vanguard Strategist'],
    honorifics: ['Bane of the Orks', 'Pinnacle of the Fire Caste', 'Champion of the Greater Good'],
    archetypes: [
      {
        id: 'coldstar_commander',
        name: 'Coldstar Battlesuit Commander',
        combatRole: 'Mobile Kinetic Artillery',
        weapon: 'High-Yield Missile Pod & Fusion Blades',
        trait: 'Vectored Retro-Thrusters (Rapid repositioning and heavy strafing)',
        glyph: 'locate',
        tacticalDescription: 'Pilots an experimental XV86 Coldstar suit capable of supersonic low-altitude strafing.',
        modifier: { id: 'mod_montka', name: 'Mont\'ka Doctrine', description: 'Requires decisive high-power sets to break defensive lines.', iconName: 'locate', color: '#80DEEA' },
      },
    ],
    subfactions: [
      { id: 'viorla', name: "Vior'la", primaryColor: '#E0E0E0', accentColor: '#D32F2F' },
      { id: 'tau-sept', name: "T'au Sept", primaryColor: '#8D6E63', accentColor: '#FFFFFF' },
      { id: 'sacea', name: "Sa'cea", primaryColor: '#455A64', accentColor: '#FF9800' },
    ],
    primaryColor: '#00838F',
    accentColor: '#80DEEA',
    loreTemplates: [
      'A decorated Fire Caste commander piloting an experimental XV86 Coldstar suit capable of supersonic strafing.',
      'A brilliant tactical theorist applying the Mont\'ka killing blow doctrine with overwhelming technological firepower.',
    ],
  },

  // ==========================================
  // 12. GENESTEALER CULTS
  // ==========================================
  'genestealer-cults': {
    factionId: 'genestealer-cults',
    factionName: 'Genestealer Cults',
    namingGrammar: (root, epithet, title) => ({
      name: `Primus ${root}`,
      title: `${title}, ${epithet}`,
    }),
    nameRoots: ['Vance', 'Grendel', 'Silas', 'Jedediah', 'Karrick', 'Thorne-Brood'],
    epithets: ['Voice of the Four-Armed Ascension', 'Prophet of the Stars', 'Master of the Warrens', 'Herald of the Void'],
    titles: ['Insurrection Commander', 'Brood Leader', 'Subterranean Overlord', 'Hero of the Day of Ascension'],
    honorifics: ['First-Born of the Brood', 'Bane of the Imperial Overseers', 'Breaker of the Sump Mines'],
    archetypes: [
      {
        id: 'cult_primus',
        name: 'Cult Primus Leader',
        combatRole: 'Flanking Ambush Specialist',
        weapon: 'Bonesword & Needle Pistol',
        trait: 'Ambush from Below (Flanking surprise strikes that test player resilience)',
        glyph: 'people',
        tacticalDescription: 'Charismatic general who subverted planetary industrial guilds into a fanatical host.',
        modifier: { id: 'mod_cult_ambush', name: 'Industrial Insurrection', description: 'Unpredictable attack rhythms; strict set discipline needed.', iconName: 'people', color: '#CE93D8' },
      },
    ],
    subfactions: [
      { id: 'rusted-claw', name: 'The Rusted Claw', primaryColor: '#E65100', accentColor: '#6A1B9A' },
      { id: 'four-armed-emperor', name: 'The Cult of the Four-Armed Emperor', primaryColor: '#4A148C', accentColor: '#00BCD4' },
    ],
    primaryColor: '#6A1B9A',
    accentColor: '#CE93D8',
    loreTemplates: [
      'A charismatic leader who has subverted entire planetary industrial guilds into a fanatical army of the Four-Armed Emperor.',
      'A mutant monstrosity rising from the deep sump-mines to lead the promised day of ascension.',
    ],
  },

  // ==========================================
  // 13. LEAGUES OF VOTANN
  // ==========================================
  'leagues-of-votann': {
    factionId: 'leagues-of-votann',
    factionName: 'Leagues of Votann',
    namingGrammar: (root, epithet, title, subfaction) => ({
      name: `High Kâhl ${root}`,
      title: `${title} of the ${subfaction || 'Greater Thurian League'}, ${epithet}`,
    }),
    nameRoots: ['Olrik', 'Doran', 'Torak', 'Brokk', 'Varek', 'Gurn', 'Kael-Hearth'],
    epithets: ['The Unbending', 'Keeper of Kin Oaths', 'Master of Magna-Forges', 'Shield of the Deep Core'],
    titles: ['Champion of the Hearth', 'Warden of the Deep Core', 'Forge-Master Sovereign', 'Voice of the Ancestors'],
    honorifics: ['The Rock-Firm', 'Keeper of the Kin Oaths', 'Master of Magna-Forges'],
    archetypes: [
      {
        id: 'exo_kahl',
        name: 'Exo-Armored High Kâhl',
        combatRole: 'Dense Kinetic Juggernaut',
        weapon: 'Mass Gauntlet & Concussion Hammer',
        trait: 'Void Armor Plating (Dense kinetic deflection requiring compound power)',
        glyph: 'hammer',
        tacticalDescription: 'Heavily armored Kâhl whose exo-armor has weathered tectonic collapses and brutal void clashes.',
        modifier: { id: 'mod_void_plate', name: 'Void Armor Matrix', description: 'Requires heavy compound movement tonnage to penetrate.', iconName: 'hammer', color: '#FFB74D' },
      },
    ],
    subfactions: [
      { id: 'greater-thurian', name: 'Greater Thurian League', primaryColor: '#00695C', accentColor: '#FFB74D' },
      { id: 'trans-hyperian', name: 'Trans-Hyperian Alliance', primaryColor: '#E65100', accentColor: '#FFFFFF' },
    ],
    primaryColor: '#D84315',
    accentColor: '#FFB74D',
    loreTemplates: [
      'A heavily armored Kâhl whose exo-armor has weathered tectonic collapses and brutal void skirmishes without a scratch.',
      'A stoic champion fighting under the gaze of the ancient Votann Ancestor Cores, yielding not a single foot of ground.',
    ],
  },

  // ==========================================
  // 14. ADEPTUS ASTARTES
  // ==========================================
  'adeptus-astartes': {
    factionId: 'adeptus-astartes',
    factionName: 'Adeptus Astartes',
    namingGrammar: (root, epithet, title, subfaction) => ({
      name: `Captain ${root}`,
      title: `${title} of the ${subfaction || 'Ultramarines'}, ${epithet}`,
    }),
    nameRoots: ['Severus-Vorn', 'Titus-Kael', 'Lysander-Rex', 'Castor-Val', 'Balthazar', 'Vanguard-Thane'],
    epithets: ['Shield of the Chapter', 'Hero of the First War', 'Knight of the Sanctum', 'Sword of the Primarch'],
    titles: ['Strike Force Commander', 'Vanguard Master', 'Terminator Captain', 'Master of the Sanctum'],
    honorifics: ['Angels of Death Exemplar', 'Knight of Terra', 'Bane of Heretics'],
    archetypes: [
      {
        id: 'terminator_captain',
        name: 'Terminator Strike Captain',
        combatRole: 'Transhuman Juggernaut',
        weapon: 'Master-Crafted Thunder Hammer & Relic Storm Shield',
        trait: 'And They Shall Know No Fear (Immunity to panic and endurance breakdown)',
        glyph: 'shield',
        tacticalDescription: 'Transhuman warrior in ancient Indomitus terminator plate leading from the frontline.',
        modifier: { id: 'mod_transhuman_grit', name: 'Transhuman Grit', description: 'Consistent volume and strict form required.', iconName: 'shield', color: '#FFD700' },
      },
    ],
    subfactions: [
      { id: 'ultramarines', name: 'Ultramarines', primaryColor: '#0D47A1', accentColor: '#FFD700' },
      { id: 'blood-angels', name: 'Blood Angels', primaryColor: '#B71C1C', accentColor: '#FFD700' },
      { id: 'dark-angels', name: 'Dark Angels', primaryColor: '#1B5E20', accentColor: '#B71C1C' },
    ],
    primaryColor: '#0D47A1',
    accentColor: '#FFD700',
    loreTemplates: [
      'A transhuman commander whose ceramite armor bears the heraldry of centuries of glorious victories for the Emperor.',
      'A seasoned strike force captain leading by example from the frontline with thunder hammer and storm shield.',
    ],
  },

  // ==========================================
  // 15. ASTRA MILITARUM
  // ==========================================
  'astra-militarum': {
    factionId: 'astra-militarum',
    factionName: 'Astra Militarum',
    namingGrammar: (root, epithet, title, subfaction) => ({
      name: `General ${root}`,
      title: `${title} of the ${subfaction || 'Cadian'} Shock Troops, ${epithet}`,
    }),
    nameRoots: ['Sterling', 'Vance-Drake', 'Karrack-Cole', 'Vorn-Holt', 'Grizmund-Null', 'Trench-Master Hall'],
    epithets: ['Iron Hand of the Guard', 'Scourge of the Ash Wastes', 'Hero of the Trench-Line', 'Shield of Trillions'],
    titles: ['Lord Castellan Commander', 'Heavy Armor Strike-Master', 'Field Marshal', 'Vanguard Commissar'],
    honorifics: ['The Unyielding Trenchmaster', 'Hero of the Imperium', 'Shield of the Trillions'],
    archetypes: [
      {
        id: 'castellan_general',
        name: 'Trench-Line Castellan',
        combatRole: 'Massed Firepower Commander',
        weapon: 'Bionic Power Claw & Master-Crafted Bolt Pistol',
        trait: 'Take Aim! (Relentless disciplined firepower that punishes hesitation)',
        glyph: 'locate',
        tacticalDescription: 'Cold tactical genius holding the frontline against galactic horrors through iron discipline.',
        modifier: { id: 'mod_take_aim', name: 'Disciplined Salvo', description: 'Requires fast set transitions and tight rest intervals.', iconName: 'locate', color: '#81C784' },
      },
    ],
    subfactions: [
      { id: 'cadian', name: 'Cadian Shock Troops', primaryColor: '#2E7D32', accentColor: '#81C784' },
      { id: 'catachan', name: 'Catachan Jungle Fighters', primaryColor: '#558B2F', accentColor: '#FF5722' },
      { id: 'krieg', name: 'Death Korps of Krieg', primaryColor: '#37474F', accentColor: '#ECEFF1' },
    ],
    primaryColor: '#2E7D32',
    accentColor: '#81C784',
    loreTemplates: [
      'A battlefield commander whose cold tactical genius and relentless willpower hold the frontline against monstrous nightmares.',
      'A hardened trench veteran who has looked into the eyes of xenos titans and held the line without taking a step back.',
    ],
  },

  // ==========================================
  // 16. ADEPTUS MECHANICUS
  // ==========================================
  'adeptus-mechanicus': {
    factionId: 'adeptus-mechanicus',
    factionName: 'Adeptus Mechanicus',
    namingGrammar: (root, epithet, title, subfaction) => ({
      name: `Archmagos ${root}`,
      title: `${title} of Forge World ${subfaction || 'Mars'}, ${epithet}`,
    }),
    nameRoots: ['Rho-7', 'Faustinus-Beta', 'Skane-Zeta', 'Lexico-9', 'Korvan-Mu', 'Omnis-Theta'],
    epithets: ['Voice of the Machine God', 'Keeper of the Sacred Cog', 'Purifier of Biological Flaw', 'Lord of Holy Bionics'],
    titles: ['Archmagos Dominus', 'Master of the Cybernetica', 'Explorator Sovereign', 'Grand Magos Biologis'],
    honorifics: ['Keeper of the Sacred Cog', 'Purifier of the Flesh', 'Lord of Holy Bionics'],
    archetypes: [
      {
        id: 'archmagos_dominus',
        name: 'Archmagos Dominus',
        combatRole: 'Cybernetic Juggernaut',
        weapon: 'Omnissian Power Axe & Eradication Ray',
        trait: 'Canticles of the Omnissiah (Bionic power surges that trigger automated repairs)',
        glyph: 'hardware-chip',
        tacticalDescription: 'Augmented master of Mars floating on mechadendrites, more steel than flesh.',
        modifier: { id: 'mod_canticles', name: 'Canticles of the Machine', description: 'Requires high volume to outpace bionic self-repair.', iconName: 'hardware-chip', color: '#FF8A80' },
      },
    ],
    subfactions: [
      { id: 'mars', name: 'Mars', primaryColor: '#B71C1C', accentColor: '#FFFFFF' },
      { id: 'lucius', name: 'Lucius', primaryColor: '#3E2723', accentColor: '#FF5722' },
    ],
    primaryColor: '#B71C1C',
    accentColor: '#FF8A80',
    loreTemplates: [
      'A towering cybernetic Archmagos floating on mechanical mechadendrites, reciting binary canticles to the Omnissiah.',
      'A master of Mars whose augmented body is more machinery than flesh, radiating holy gamma energy.',
    ],
  },

  // ==========================================
  // 17. ADEPTA SORORITAS
  // ==========================================
  'adepta-sororitas': {
    factionId: 'adepta-sororitas',
    factionName: 'Adepta Sororitas',
    namingGrammar: (root, epithet, title) => ({
      name: `Canoness ${root}`,
      title: `${title}, ${epithet}`,
    }),
    nameRoots: ['Vael', 'Erika-Marie', 'Amalia-Rose', 'Genevieve-Thal', 'Veridyan-Sol', 'Lucia'],
    epithets: ['Flame of the Righteous', 'Beacon of Holy Faith', 'Purifier of Shrines', 'Sword of the Emperor'],
    titles: ['Canoness Superior', 'Palatine Commander', 'Flame-Bearer of the Shrine', 'Order Matriarch'],
    honorifics: ['The Purifying Flame', 'Bride of the Emperor', 'Vessel of Miracles'],
    archetypes: [
      {
        id: 'canoness_superior',
        name: 'Canoness Superior',
        combatRole: 'Zealous Melee Striker',
        weapon: 'Blessed Blade & Holy Brazier of Judgement',
        trait: 'Acts of Faith (Spiritual surges that fuel miraculous stamina recovery)',
        glyph: 'flame',
        tacticalDescription: 'Fearless commander whose prayers manifest blinding holy fire and miraculous defense.',
        modifier: { id: 'mod_act_of_faith', name: 'Act of Faith', description: 'Surges with holy energy during phase transitions.', iconName: 'flame', color: '#FFD700' },
      },
    ],
    subfactions: [
      { id: 'our-martyred-lady', name: 'Our Martyred Lady', primaryColor: '#212121', accentColor: '#B71C1C' },
      { id: 'valorous-heart', name: 'Valorous Heart', primaryColor: '#212121', accentColor: '#FFFFFF' },
    ],
    primaryColor: '#880E4F',
    accentColor: '#FFD700',
    loreTemplates: [
      'A fearless Canoness whose prayers unleash blazing pillars of holy fire, inspiring mortal warriors to transcendent feats.',
      'A veteran of hundreds of purges whose faith in the God-Emperor shields her from enemy blades and sorcery.',
    ],
  },

  // ==========================================
  // 18. ADEPTUS CUSTODES
  // ==========================================
  'adeptus-custodes': {
    factionId: 'adeptus-custodes',
    factionName: 'Adeptus Custodes',
    namingGrammar: (root, epithet, title) => ({
      name: `Shield-Captain ${root}`,
      title: `${title}, ${epithet}`,
    }),
    nameRoots: ['Heraclas-Vorn', 'Achallor-Gold', 'Valerian-Thal', 'Marcus-Aurelius', 'Castor-Pax'],
    epithets: ['Guardian of the Golden Throne', 'Sword of the Emperor', 'First of the Ten Thousand', 'Golden Demigod'],
    titles: ['Shield-Captain', 'Blade Champion', 'Tribune', 'Custodian Paragon'],
    honorifics: ['The Golden Demigod', "Imperator's Bodyguard", 'Pinnacle of Human Perfection'],
    archetypes: [
      {
        id: 'blade_champion',
        name: 'Blade Champion',
        combatRole: 'Peerless Martial Juggernaut',
        weapon: 'Guardian Spear of Auramite & Praesidium Shield',
        trait: 'Auramite Invulnerability (Unbreakable defensive discipline and flawless parries)',
        glyph: 'trophy',
        tacticalDescription: 'Nine-foot-tall auramite-clad demigod moving with sublime speed and world-shattering power.',
        modifier: { id: 'mod_auramite_shield', name: 'Auramite Aegis', description: 'High set completion quality required to breach gold defense.', iconName: 'trophy', color: '#FFD700' },
      },
    ],
    subfactions: [
      { id: 'dread-host', name: 'Dread Host', primaryColor: '#B71C1C', accentColor: '#FFD700' },
      { id: 'shadowkeepers', name: 'Shadowkeepers', primaryColor: '#212121', accentColor: '#FFD700' },
    ],
    primaryColor: '#FFD700',
    accentColor: '#B71C1C',
    loreTemplates: [
      'A nine-foot-tall auramite-clad demigod whose martial prowess surpasses anything mortal warriors can comprehend.',
      'The ultimate creation of the Emperor\'s genetic mastery, moving with sublime speed and world-shattering power.',
    ],
  },

  // ==========================================
  // 19. GREY KNIGHTS
  // ==========================================
  'grey-knights': {
    factionId: 'grey-knights',
    factionName: 'Grey Knights',
    namingGrammar: (root, epithet, title) => ({
      name: `Grand Master ${root}`,
      title: `${title}, ${epithet}`,
    }),
    nameRoots: ['Alaric', 'Garrick-Stern', 'Volden', 'Kael-Thas', 'Severus-Titan', 'Justicar-Thane'],
    epithets: ['Daemon-Slayer of Titan', 'Hammer of the Empyrean', 'The Incorruptible', 'Shield of Titan'],
    titles: ['Grand Master', 'Paladin Commander', 'Castellan of the Sanctum', 'Brother-Captain'],
    honorifics: ['The Incorruptible', 'Shield Against the Warp', 'Knight of Titan'],
    archetypes: [
      {
        id: 'grand_master_titan',
        name: 'Grand Master of Titan',
        combatRole: 'Psychic Force Duelist',
        weapon: 'Nemesis Force Halberd & Storm Bolter',
        trait: 'Aegis Armor Resonance (Psychic field that deflects corrupted momentum)',
        glyph: 'flash',
        tacticalDescription: 'Silver-clad psychic warrior channeling empyrean wrath through crackling Nemesis force weapons.',
        modifier: { id: 'mod_aegis_resonance', name: 'Aegis Resonance', description: 'Demands precise pacing and form adherence.', iconName: 'shield', color: '#90CAF9' },
      },
    ],
    subfactions: [
      { id: 'swordbearers', name: 'Swordbearers', primaryColor: '#455A64', accentColor: '#ECEFF1' },
      { id: 'wardmakers', name: 'Wardmakers', primaryColor: '#37474F', accentColor: '#B0BEC5' },
    ],
    primaryColor: '#455A64',
    accentColor: '#B0BEC5',
    loreTemplates: [
      'A silver-clad psychic warrior trained in absolute secrecy on the moon of Titan to fight the horrors of the Immaterium.',
      'His mind is an iron fortress of purity, channeling purified psychic wrath through crackling Nemesis force weapons.',
    ],
  },

  // ==========================================
  // 20. IMPERIAL KNIGHTS
  // ==========================================
  'imperial-knights': {
    factionId: 'imperial-knights',
    factionName: 'Imperial Knights',
    namingGrammar: (root, epithet, title, subfaction) => ({
      name: `Baron ${root}`,
      title: `${title} of House ${subfaction || 'Terryn'}, ${epithet}`,
    }),
    nameRoots: ['Darius', 'Teresa-Scion', 'Roland-Lance', 'Danith', 'Val-Terryn', 'Hekhtur-Null'],
    epithets: ['The Freeblade of Renown', 'Chivalric Shield of Vassals', 'The Ironclad Paragon', 'Breaker of Sieges'],
    titles: ['High Baron of the Keep', 'Lance Commander', 'Chivalric Paragon', 'Castellan Vanguard'],
    honorifics: ['The Ironclad Hero', 'Honor of the Noble Throne', 'Shield of the Vassal Worlds'],
    archetypes: [
      {
        id: 'knight_paladin',
        name: 'Knight Paladin Pilot',
        combatRole: 'Colossal Titanic Engine',
        weapon: 'Rapid-Fire Battle Cannon & Reaper Chainsword',
        trait: 'Ion Shield Matrix (Directional damage reduction requiring sustained compound pressure)',
        glyph: 'cube',
        tacticalDescription: 'Colossal multi-story bipedal engine of war bound to a noble pilot via ancient Throne mechanics.',
        modifier: { id: 'mod_ion_shield', name: 'Ion Shield Matrix', description: 'Requires relentless compound volume to puncture kinetic shields.', iconName: 'shield', color: '#FFD700' },
      },
    ],
    subfactions: [
      { id: 'terryn', name: 'House Terryn', primaryColor: '#0D47A1', accentColor: '#FFD700' },
      { id: 'hawkshroud', name: 'House Hawkshroud', primaryColor: '#F57F17', accentColor: '#212121' },
      { id: 'raven', name: 'House Raven', primaryColor: '#B71C1C', accentColor: '#212121' },
    ],
    primaryColor: '#0D47A1',
    accentColor: '#FFD700',
    loreTemplates: [
      'A noble pilot bound by ancient neural Throne Mechanics to a colossal multi-story bipedal engine of war.',
      'Guiding a legendary chivalric chassis that has broken enemy sieges and trampled xenos hordes for generations.',
    ],
  },
};

export interface BossGenerationOptions {
  targetFactionId?: string;
  subfactionId?: string;
  recentBossKeys?: string[];
  forceDifficulty?: BossDifficultyTier;
  scope?: 'squad' | 'individual';
}

/**
 * Procedurally generates a unique, faction-appropriate Boss Identity.
 *
 * Guarantees:
 * - Deterministic: Given the same seed string, produces the exact same boss.
 * - Non-Canonical Originality: Never copies established named lore characters.
 * - Faction-Specific Grammar: Different naming formulas per faction tradition.
 * - Substantial Variety: Varies archetypes, weapons, combat roles, traits, and modifiers.
 * - 12-Cycle Duplicate Avoidance: Avoids recently rolled boss keys/archetypes.
 */
export function generateProceduralBoss(
  seedStr: string,
  targetFactionOrOptions?: string | BossGenerationOptions
): GeneratedBossIdentity {
  const prng = createDeterministicPrng(seedStr);

  const options: BossGenerationOptions =
    typeof targetFactionOrOptions === 'string'
      ? { targetFactionId: targetFactionOrOptions }
      : targetFactionOrOptions || {};

  const availableFactions = Object.keys(FACTION_BOSS_CATALOGS);
  const factionKey =
    options.targetFactionId && FACTION_BOSS_CATALOGS[options.targetFactionId]
      ? options.targetFactionId
      : availableFactions[Math.floor(prng() * availableFactions.length)];

  const catalog = FACTION_BOSS_CATALOGS[factionKey] || FACTION_BOSS_CATALOGS['orks'];

  // Subfaction selection
  let subfaction = catalog.subfactions.find((s) => s.id === options.subfactionId);
  if (!subfaction && catalog.subfactions.length > 0) {
    subfaction = catalog.subfactions[Math.floor(prng() * catalog.subfactions.length)];
  }

  // Archetype selection (with duplicate avoidance against recent keys)
  let candidateArchetypes = [...catalog.archetypes];
  if (options.recentBossKeys && options.recentBossKeys.length > 0) {
    const unrecent = candidateArchetypes.filter(
      (a) => !options.recentBossKeys?.some((k) => k.includes(a.id))
    );
    if (unrecent.length > 0) {
      candidateArchetypes = unrecent;
    }
  }
  const archetype = candidateArchetypes[Math.floor(prng() * candidateArchetypes.length)];

  // Name, title, and honorific generation using faction grammar
  const rootName = catalog.nameRoots[Math.floor(prng() * catalog.nameRoots.length)];
  const epithet = catalog.epithets[Math.floor(prng() * catalog.epithets.length)];
  const rawTitle = catalog.titles[Math.floor(prng() * catalog.titles.length)];
  const honorific = catalog.honorifics[Math.floor(prng() * catalog.honorifics.length)];

  const { name, title } = catalog.namingGrammar(
    rootName,
    epithet,
    rawTitle,
    subfaction?.name
  );

  const lore = catalog.loreTemplates[Math.floor(prng() * catalog.loreTemplates.length)];

  // Difficulty Tier Distribution: 50% Standard, 35% Challenging, 15% Legendary
  let difficultyTier: BossDifficultyTier = options.forceDifficulty || 'standard';
  if (!options.forceDifficulty) {
    const diffRoll = prng();
    if (diffRoll < 0.5) {
      difficultyTier = 'standard';
    } else if (diffRoll < 0.85) {
      difficultyTier = 'challenging';
    } else {
      difficultyTier = 'legendary';
    }
  }

  // Health scaling: Baseline with difficulty multiplier
  const tierMultiplier =
    difficultyTier === 'legendary' ? 1.4 : difficultyTier === 'challenging' ? 1.2 : 1.0;
  const baseHealth = Math.round((2400 + Math.floor(prng() * 600)) * tierMultiplier);

  const primaryColor = subfaction?.primaryColor || catalog.primaryColor;
  const accentColor = subfaction?.accentColor || catalog.accentColor;

  const phases: BossPhaseDefinition[] = [
    {
      phaseNumber: 1,
      title: 'Phase I: Battle Readiness',
      hpThresholdPercent: 100,
      description: `${name} deploys behind their ${archetype.weapon}. Strict technique and focused reps are required.`,
      visualColor: primaryColor,
      taunt: `Bow before the might of ${name}, ${title}!`,
    },
    {
      phaseNumber: 2,
      title: 'Phase II: Enraged Tactical Shift',
      hpThresholdPercent: 66,
      description: `${name}'s defenses are cracked! They activate ${archetype.trait}, accelerating strike velocity.`,
      visualColor: accentColor,
      taunt: `Insolent warrior! Your resistance only fuels my fury!`,
    },
    {
      phaseNumber: 3,
      title: 'Phase III: Desperate Last Stand',
      hpThresholdPercent: 33,
      description: `${name} channels every ounce of remaining reserve into an all-out assault! Push through the burn!`,
      visualColor: '#D50000',
      taunt: `Even if I fall, I shall drag this entire sector down into ruin with me!`,
    },
  ];

  const taunts = [
    `Your strikes are futile against ${title}!`,
    `Feel the devastating impact of my ${archetype.weapon}!`,
    `You are merely biological chaff before our conquest!`,
    `Yield now, or be broken upon the anvil of war!`,
  ];

  const defeatQuote = `By the stars... How could my strength falter before you...?`;

  const bossKey = `raid_${factionKey}_${archetype.id}_${seedStr}`;

  return {
    bossKey,
    name,
    title,
    factionId: catalog.factionId,
    factionName: catalog.factionName,
    subfactionId: subfaction?.id,
    subfactionName: subfaction?.name,
    archetype: archetype.name,
    combatRole: archetype.combatRole,
    difficultyTier,
    honorific,
    signatureWeapon: archetype.weapon,
    combatTrait: archetype.trait,
    tacticalDescription: `${archetype.tacticalDescription} Armed with ${archetype.weapon}. Fortified by ${archetype.trait}.`,
    loreDescription: `${name}, ${title}. ${honorific}. ${lore}`,
    baseHealth,
    glyph: archetype.glyph,
    primaryColor,
    accentColor,
    phases,
    taunts,
    defeatQuote,
    generationSeed: seedStr,
    version: '2.0.0',
  };
}
