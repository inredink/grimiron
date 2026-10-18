import { GeneratedBossIdentity, BossPhaseDefinition } from '../../types/warfront';

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

interface FactionBossPool {
  factionId: string;
  factionName: string;
  names: string[];
  titles: string[];
  honorifics: string[];
  weapons: string[];
  traits: string[];
  glyphs: string[];
  primaryColor: string;
  accentColor: string;
  loreTemplates: string[];
}

const FACTION_BOSS_POOLS: Record<string, FactionBossPool> = {
  'orks': {
    factionId: 'orks',
    factionName: 'Orks',
    names: ['Gorgutz', 'Nazdreg', 'Skagbad', 'Kaptin Badrukk', 'Uzgob', 'Snikrot', 'Zogwort', 'Gorbag'],
    titles: ['Da Skullkrakka', 'Warlord of da Ironjawz', 'Klaw of Gork', 'Burna-King', 'Grand Krumpa', 'Terror of Armageddon'],
    honorifics: ['Da Biggest an\' Meanest', 'Scourge of the Wastes', 'Gork\'s Anointed Chopper', 'Burna Master'],
    weapons: ['Piston-Driven Power Klaw', 'Twin-Linked Kombi-Shoota', 'Custom Mega-Choppa', 'Supa-Stikkbomb Rack'],
    traits: ['Waaagh! Ferocity (+20% fury under heavy strain)', 'Lead-Belcher Plate (Absorbs light kinetic hits)', 'Gork\'s Blessing (Relentless endurance)'],
    glyphs: ['hammer', 'skull', 'bonfire', 'flame'],
    primaryColor: '#1B5E20',
    accentColor: '#FF9800',
    loreTemplates: [
      'A massive towering warlord clad in scrap-welded mega-armor, bellowing deafening war cries across the ash wastes.',
      'A cunning greenskin warlord who has butchered countless garrisons, leading an unstoppable stampede of war machines.',
    ],
  },
  'necrons': {
    factionId: 'necrons',
    factionName: 'Necrons',
    names: ['Anankhet', 'Zahndrekh', 'Obyron', 'Szarrekhan', 'Thokt', 'Nihilakh', 'Imotekh', 'Szeras'],
    titles: ['The Undying Phaeron', 'Architect of the Celestial Orrery', 'Cleanser of Stars', 'Harvester of Souls', 'Sovereign of the Tomb'],
    honorifics: ['He Who Sleeps No More', 'Master of the Infinite Tombs', 'Scourge of the Flesh'],
    weapons: ['Staff of the Destroyer', 'Hyperphase Glaive', 'Gauss Obliterator', 'Voidblade of Eternity'],
    traits: ['Living Metal (Accelerated self-repair)', 'Phase Shifter (Intermittent physical invulnerability)', 'Resurrection Matrix (Defiant revival)'],
    glyphs: ['hardware-chip', 'shield-checkmark', 'diamond', 'pulse'],
    primaryColor: '#1B5E20',
    accentColor: '#00E676',
    loreTemplates: [
      'An ancient dynastic ruler whose necrodermis shell has stood unyielding against sixty million years of cosmic decay.',
      'A cold, calculating mechanical lord commanding legions of reanimated immortals to purge biological vermin.',
    ],
  },
  'tyranids': {
    factionId: 'tyranids',
    factionName: 'Tyranids',
    names: ['The Dreadbeast of Dagon', 'Apex Swarm-Lord', 'The Bio-Devourer', 'Synaptic Tyrant', 'Behemoth Alpha', 'Leviathan Prime'],
    titles: ['Herald of the Great Devourer', 'Synaptic Nexus of the Swarm', 'Butcher of Ultramar', 'Living Extinction Event'],
    honorifics: ['The All-Consuming', 'Apex Bioform', 'Shadow in the Warp Incarnate'],
    weapons: ['Twin Heavy Boneswords', 'Bio-Plasma Vent Cannon', 'Scything Talons of Chitin', 'Heavy Venom Cannon'],
    traits: ['Synaptic Imperative (Psychic shielding)', 'Hyper-Adaptive Carapace (Evolving resistance)', 'Adrenaline Glands (Explosive speed)'],
    glyphs: ['bug', 'skull', 'nuclear', 'layers'],
    primaryColor: '#4A148C',
    accentColor: '#CE93D8',
    loreTemplates: [
      'A terrifyingly intelligent apex organism orchestrating millions of bioforms with cold, hive-minded perfection.',
      'A towering biological war-engine whose heavy boneswords slice through tank armor with bio-plasma energy.',
    ],
  },
  'heretic-astartes': {
    factionId: 'heretic-astartes',
    factionName: 'Heretic Astartes',
    names: ['Lord Malakor', 'Volkmar the Defiler', 'Valgar the Flayed', 'Lord Korvax', 'Drakon the Warmaster', 'Sevatarion'],
    titles: ['Bane of Cadia', 'Champion of the Ruinous Powers', 'Siegebreaker of the Long War', 'Soul-Reaver'],
    honorifics: ['Vanguard of the Black Crusade', 'Bane of the False Emperor', 'Warp-Forged Slayer'],
    weapons: ['Daemon-Forged Chainaxe', 'Cursed Combi-Plasma', 'Accursed Crozius', 'Power Scythe of Malice'],
    traits: ['Mark of Chaos (Warp-empowered fury)', 'Veterans of the Long War (Cold tactical malice)', 'Demonic Resilience (Damage negation)'],
    glyphs: ['skull', 'bonfire', 'flame', 'flash'],
    primaryColor: '#37474F',
    accentColor: '#FF5252',
    loreTemplates: [
      'A bitter veteran of ten millennia of war against the Imperium, adorned in spiked ceramite and trophies of slain Astartes.',
      'A dark warlord commanding daemon engines and renegade warbands in relentless service to the Chaos gods.',
    ],
  },
  'death-guard': {
    factionId: 'death-guard',
    factionName: 'Death Guard',
    names: ['Lord Kholerax', 'Pus-Lord Malgoth', 'Typhus the Corrupted', 'Plague-Bringer Gorgan', 'Lord Festus'],
    titles: ['Vector of the Seventh Plague', 'Blight-Reaper of Nurgle', 'Harvester of Rotten Flesh', 'Castellan of the Garden'],
    honorifics: ['Beloved of Grandfather Nurgle', 'Unbroken Rot-Lord', 'Bringer of Sweet Decay'],
    weapons: ['Manreaper War Scythe', 'Plague-Spitter Flamer', 'Blight Grenade Cluster', 'Rusted Bident of Rust'],
    traits: ['Disgustingly Resilient (Immense damage dampening)', 'Aura of Pestilence (Lactic burn escalation)', 'Contagion Field (Endurance drain)'],
    glyphs: ['skull', 'water', 'warning', 'nuclear'],
    primaryColor: '#33691E',
    accentColor: '#AED581',
    loreTemplates: [
      'A bloated terminator champion whose rusted armor weeps pus and viral ichor, completely immune to mortal pain.',
      'A lord of rot whose presence rusts plasteel and rots flesh within seconds of stepping onto the warfront.',
    ],
  },
  'world-eaters': {
    factionId: 'world-eaters',
    factionName: 'World Eaters',
    names: ['Khârn the Bloody', 'Lord Varkas', 'Lord Skane', 'Blood-Master Azrakh', 'Karrack the Red'],
    titles: ['Executioner of Khorne', 'Reaper of the Brass Throne', 'Lord of the Eightfold Cleave', 'Champion of Endless Gore'],
    honorifics: ['Master of the Butcher\'s Nails', 'Slayer of Champions', 'Blood-Sworn Reaver'],
    weapons: ['Dual Gorechild Cleavers', 'Chain-Glaive of Wrath', 'Spiked Brass Knuckles', 'Heavy Plasma Pistol'],
    traits: ['Blood Frenzy (Attack speed surges at low health)', 'Butcher\'s Nails Surge (Uncontrollable aggression)', 'Brass Collar of Khorne (Psychic immunity)'],
    glyphs: ['bonfire', 'flame', 'skull', 'cut'],
    primaryColor: '#B71C1C',
    accentColor: '#FF1744',
    loreTemplates: [
      'A ferocious butcher-lord whose Butcher\'s Nails pulse with agony that can only be silenced by the death of worthy foes.',
      'Clad in brass and crimson plate, this champion revs paired chainaxes with enough kinetic fury to sunder tanks.',
    ],
  },
  'thousand-sons': {
    factionId: 'thousand-sons',
    factionName: 'Thousand Sons',
    names: ['Ahriman the Exile', 'Magister Iskandar', 'Sorcerer Tolkhet', 'Phosis T\'kar', 'Amon of the Pyre'],
    titles: ['Grand Magister of Tzeentch', 'Weaver of the Prism', 'Master of the Silver Tower', 'Lord of Mutating Fates'],
    honorifics: ['Architect of Rubricae', 'Keeper of the Black Library Secrets', 'Eye of Change'],
    weapons: ['Force Staff of Tzeentch', 'Warpflame Pistol', 'Ritual Khopesh', 'Tome of Transmutation'],
    traits: ['Sorcerous Ward (Deflective psychic barrier)', 'Time-Bending Hexes (Cadence disruption)', 'All is Dust (Immune to bleeding effects)'],
    glyphs: ['eye', 'sparkles', 'color-wand', 'sync'],
    primaryColor: '#01579B',
    accentColor: '#FFD700',
    loreTemplates: [
      'A master of empyrean sorcery commanding legions of hollow Rubricae whose bodies are dust sealed within armor.',
      'A sorcerer-lord who weaves illusions and blue warp flame to incinerate the bodies and souls of mortal challengers.',
    ],
  },
  'chaos-daemons': {
    factionId: 'chaos-daemons',
    factionName: 'Chaos Daemons',
    names: ['Skarbrand the Exiled', 'Rotigus Rainfather', 'Kairos Fateweaver', 'Shalaxi Hellbane', 'Lord of Change Xar'],
    titles: ['Exalted Lord of the Warp', 'Avatar of Primordial Chaos', 'Terror of Realspace', 'Render of Realities'],
    honorifics: ['Scourge of Mortal Minds', 'Bringer of Ruin', 'Embodied Nightmare'],
    weapons: ['Warp-Forged Blade of Khorne', 'Plague Flail of Nurgle', 'Wand of Tzeentchian Flux', 'Blade of Slaanesh'],
    traits: ['Warp Instability (Phasing invulnerability)', 'Terrifying Aura (Focus breakdown)', 'Unholy Regeneration (Continuous recovery)'],
    glyphs: ['bonfire', 'flash', 'planet', 'skull'],
    primaryColor: '#880E4F',
    accentColor: '#FF5252',
    loreTemplates: [
      'A colossal warp entity materialized through a dimensional rift, feeding on the fear and blood of the battlefield.',
      'An ancient daemon lord whose very presence bends gravity, lighting the sky with purple and crimson fire.',
    ],
  },
  'aeldari': {
    factionId: 'aeldari',
    factionName: 'Aeldari',
    names: ['Autarch Ythan', 'Farseer Eldrad', 'Exarch Karandras', 'Autarch Iyanna', 'Visarch of Biel-Tan'],
    titles: ['Master of the Craftworld Host', 'Voice of the Ancestor Stones', 'Sword of the Asuryani', 'Guardian of Fate'],
    honorifics: ['Weaver of Destiny', 'Defender of the Shrine', 'Champion of Asuryan'],
    weapons: ['Diresword of Precision', 'Star Glaive', 'Shuriken Cannon Array', 'Mirror Sword of Morai-Heg'],
    traits: ['Blinding Acrobatic Evasion (Dynamic dodge)', 'Battle Focus (Zero momentum loss)', 'Ancient Runes of Warding (Force mitigation)'],
    glyphs: ['sparkles', 'body', 'key', 'shield-checkmark'],
    primaryColor: '#00695C',
    accentColor: '#4DB6AC',
    loreTemplates: [
      'A noble warrior whose centuries of mastery across multiple Aspect Paths allow him to predict and counter every blow.',
      'A grand Autarch clad in lightweight wraithbone armor, dancing through combat with peerless grace.',
    ],
  },
  'drukhari': {
    factionId: 'drukhari',
    factionName: 'Drukhari',
    names: ['Archon Malix', 'Urien Rakarth', 'Kabalite Lord Vraxx', 'Lelith of the Arena', 'Haemonculus Kruell'],
    titles: ['Tyrant of the Dark City', 'Hierarch of the Flayed Skull', 'Grand Master of Pain', 'Sovereign of the Webway'],
    honorifics: ['Connoisseur of Agony', 'Bane of the Mon-keigh', 'Lord of Shattered Souls'],
    weapons: ['Huskblade of Despair', 'Agonizer Whip', 'Blast Pistol of Dark Light', 'Venom Blade'],
    traits: ['Power from Pain (Damage scales as combat prolongs)', 'Shadowfield (High deflect chance)', 'Splinter Toxins (Stamina sapping)'],
    glyphs: ['cut', 'skull', 'moon', 'shield-half'],
    primaryColor: '#004D40',
    accentColor: '#1DE9B6',
    loreTemplates: [
      'A sadistic Archon whose armor feeds directly on the physical suffering and terror of his opponents.',
      'A lightning-fast arena master who turns combat into a gruesome theater of precision lacerations.',
    ],
  },
  'tau-empire': {
    factionId: 'tau-empire',
    factionName: "T'au Empire",
    names: ['Shas\'o Kais', 'Commander Farsight', 'Commander Shadowsun', 'Shas\'o O\'Vesa', 'Shas\'vre Mont\'yr'],
    titles: ['Coldstar Strike Commander', 'Hero of the Third Sphere', 'Master of the Mont\'ka', 'Sword of the Greater Good'],
    honorifics: ['Bane of the Orks', 'Pinnacle of the Fire Caste', 'Champion of Tau\'va'],
    weapons: ['High-Yield Missile Pod', 'Fusion Blades', 'Prototype Rail Rifle', 'Cyclic Ion Blaster'],
    traits: ['Kauyon Master (Retaliatory counter-strikes)', 'Vectored Retro-Thrusters (Rapid repositioning)', 'Targeting Subroutines (Pinpoint precision)'],
    glyphs: ['locate', 'rocket', 'airplane', 'radio'],
    primaryColor: '#00838F',
    accentColor: '#80DEEA',
    loreTemplates: [
      'A decorated Fire Caste commander piloting an experimental XV86 Coldstar suit capable of supersonic low-altitude strafing.',
      'A brilliant tactical theorist applying the Mont\'ka killing blow doctrine with overwhelming technological firepower.',
    ],
  },
  'genestealer-cults': {
    factionId: 'genestealer-cults',
    factionName: 'Genestealer Cults',
    names: ['The Magus of Deliverance', 'Patriarch Grendel', 'Primus Vance', 'Kelermorph Joe', 'The Abominant'],
    titles: ['Voice of the Four-Armed Emperor', 'Herald of the Void Children', 'Leader of the Holy Insurrection', 'Master of the Mines'],
    honorifics: ['Prophet of the Stars', 'First-Born of the Brood', 'Bane of the Imperial Overseers'],
    weapons: ['Bonesword of the Brood', 'Heavy Mining Laser', 'Cultist Autopistol Trio', 'Power Sledge of the Warrens'],
    traits: ['Unquestioning Devotion (Meatshield bodyguards)', 'Ambush from Below (Flanking surprise)', 'Psychic Hypnosis (Mind numbing)'],
    glyphs: ['finger-print', 'people', 'construct', 'egg'],
    primaryColor: '#6A1B9A',
    accentColor: '#CE93D8',
    loreTemplates: [
      'A charismatic leader who has subverted entire planetary industrial guilds into a fanatical army of the Four-Armed Emperor.',
      'A mutant monstrosity rising from the deep sump-mines to lead the promised day of ascension.',
    ],
  },
  'leagues-of-votann': {
    factionId: 'leagues-of-votann',
    factionName: 'Leagues of Votann',
    names: ['Kâhl Olrik', 'The Ancestor Core Envoy', 'Hearthkyn Doran', 'Einher Champion Torak', 'Forge-Master Brokk'],
    titles: ['Warden of the Deep Core', 'High Kâhl of the Greater Thurian League', 'Champion of the Hearth', 'Voice of the Votann'],
    honorifics: ['The Rock-Firm', 'Keeper of the Kin Oaths', 'Master of Magna-Forges'],
    weapons: ['Mass Gauntlet', 'Concussion Hammer', 'Magna-Rail Rifle', 'Plasma Axe of the Ancestors'],
    traits: ['Eye of the Ancestors (Calculated weakness targeting)', 'Void Armor Plating (Dense kinetic deflection)', 'Kin Tenacity (Unshakable morale)'],
    glyphs: ['hammer', 'shield', 'diamond', 'construct'],
    primaryColor: '#D84315',
    accentColor: '#FFB74D',
    loreTemplates: [
      'A heavily armored Kâhl whose exo-armor has weathered tectonic collapses and brutal void skirmishes without a scratch.',
      'A stoic champion fighting under the gaze of the ancient Votann Ancestor Cores, yielding not a single foot of ground.',
    ],
  },
  'adeptus-astartes': {
    factionId: 'adeptus-astartes',
    factionName: 'Adeptus Astartes',
    names: ['Captain Severus', 'Vanguard Master Titus', 'Brother-Captain Lysander', 'Castellan Crowe', 'Lord Logan'],
    titles: ['Hero of Macragge', 'Master of the Sanctum', 'Sword of the Chapter', 'Shield of Humanity'],
    honorifics: ['Angels of Death Exemplar', 'Knight of Terra', 'Bane of Heretics'],
    weapons: ['Master-Crafted Power Sword', 'Relic Storm Shield', 'Combi-Melta of Purity', 'Thunder Hammer of the Primarch'],
    traits: ['And They Shall Know No Fear (Immune to panic)', 'Combat Doctrines (Tactical adaptability)', 'Transhuman Physiology (Extreme stamina)'],
    glyphs: ['shield', 'ribbon', 'trophy', 'walk'],
    primaryColor: '#0D47A1',
    accentColor: '#FFD700',
    loreTemplates: [
      'A transhuman commander whose ceramite armor bears the heraldry of centuries of glorious victories for the Emperor.',
      'A seasoned strike force captain leading by example from the frontline with thunder hammer and storm shield.',
    ],
  },
  'astra-militarum': {
    factionId: 'astra-militarum',
    factionName: 'Astra Militarum',
    names: ['Lord Castellan Creed', 'Colonel-Commissar Gaunt', 'General Vance Stubbs', 'Colonel Straken', 'General Grizmund'],
    titles: ['Hero of Cadia', 'Castellan of the Western Front', 'Bane of Tyrants', 'Iron Hand of the Astra Militarum'],
    honorifics: ['The Unyielding Trenchmaster', 'Hero of the Imperium', 'Shield of the Trillions'],
    weapons: ['Bionic Power Claw', 'Master-Crafted Bolt Pistol', 'Officer\'s Sabre of Honour', 'Plasma Pistol of Cadia'],
    traits: ['Take Aim! (Pinpoint ballistic focus)', 'Fix Bayonets! (Aggressive charge)', 'Cadia Stands (Indomitable grit)'],
    glyphs: ['locate', 'shield-half', 'car-sport', 'alert-circle'],
    primaryColor: '#2E7D32',
    accentColor: '#81C784',
    loreTemplates: [
      'A battlefield commander whose cold tactical genius and relentless willpower hold the frontline against monstrous nightmares.',
      'A hardened trench veteran who has looked into the eyes of xenos titans and held the line without taking a step back.',
    ],
  },
  'adeptus-mechanicus': {
    factionId: 'adeptus-mechanicus',
    factionName: 'Adeptus Mechanicus',
    names: ['Archmagos Dominus Belisarius', 'Tech-Priest Manipulus Rho', 'Magos Biologis Skane', 'Dominus Faustinus', 'Magos Lexico'],
    titles: ['Architect of the Omnissiah', 'Master of the Cybernetica', 'Vanguard of Mars', 'Voice of the Machine God'],
    honorifics: ['Keeper of the Sacred Cog', 'Purifier of the Flesh', 'Lord of Holy Bionics'],
    weapons: ['Omnissian Power Axe', 'Eradication Ray', 'Phosphor Serpenta', 'Macrostubber'],
    traits: ['Canticles of the Omnissiah (Bionic power surges)', 'Master of Machines (Automated repairs)', 'Bionic Resilience (Flesh is replaced by steel)'],
    glyphs: ['hardware-chip', 'settings', 'nuclear', 'cog'],
    primaryColor: '#B71C1C',
    accentColor: '#FF8A80',
    loreTemplates: [
      'A towering cybernetic Archmagos floating on mechanical mechadendrites, reciting binary canticles to the Omnissiah.',
      'A master of Mars whose augmented body is more machinery than flesh, radiating holy gamma energy.',
    ],
  },
  'adepta-sororitas': {
    factionId: 'adepta-sororitas',
    factionName: 'Adepta Sororitas',
    names: ['Canoness Veridyan', 'Sister Superior Amalia', 'Palatine Erika', 'Saint Celestine', 'Canoness Junith'],
    titles: ['Hero of the Ecclesiarchy', 'Flame of the Righteous', 'Beacon of Holy Faith', 'Avenger of the Shrine'],
    honorifics: ['The Purifying Flame', 'Bride of the Emperor', 'Vessel of Miracles'],
    weapons: ['Blessed Blade of Sanity', 'Holy Brazier of Judgement', 'Condemnor Boltgun', 'Heavy Flamer of Absolution'],
    traits: ['Acts of Faith (Miraculous stamina bursts)', 'Shield of Faith (Invulnerable spiritual warding)', 'Zealous Conviction (Unflinching willpower)'],
    glyphs: ['flame', 'sparkles', 'cut', 'home'],
    primaryColor: '#880E4F',
    accentColor: '#FFD700',
    loreTemplates: [
      'A fearless Canoness whose prayers unleash blazing pillars of holy fire, inspiring mortal warriors to transcendent feats.',
      'A veteran of hundreds of purges whose faith in the God-Emperor shields her from enemy blades and sorcery.',
    ],
  },
  'adeptus-custodes': {
    factionId: 'adeptus-custodes',
    factionName: 'Adeptus Custodes',
    names: ['Captain-General Trajann', 'Shield-Captain Valerian', 'Blade Champion Achallor', 'Custodian Tribune Heraclas', 'Shield-Captain Marcus'],
    titles: ['First of the Ten Thousand', 'Guardian of the Golden Throne', 'Master of the Blood Games', 'Sword of the Emperor'],
    honorifics: ['The Golden Demigod', 'Imperator\'s Bodyguard', 'Pinnacle of Human Perfection'],
    weapons: ['Guardian Spear of Auramite', 'Castellan Axe', 'Sentinel Blade', 'Praesidium Shield'],
    traits: ['Auramite Invulnerability (Unbreakable defense)', 'Peerless Martial Mastery (Flawless technique)', 'The Emperor\'s Chosen (Total mental resistance)'],
    glyphs: ['trophy', 'ribbon', 'shield', 'star'],
    primaryColor: '#FFD700',
    accentColor: '#B71C1C',
    loreTemplates: [
      'A nine-foot-tall auramite-clad demigod whose martial prowess surpasses anything mortal warriors can comprehend.',
      'The ultimate creation of the Emperor\'s genetic mastery, moving with sublime speed and world-shattering power.',
    ],
  },
  'grey-knights': {
    factionId: 'grey-knights',
    factionName: 'Grey Knights',
    names: ['Grand Master Voldus', 'Brother-Captain Stern', 'Justicar Alaric', 'Castellan Garran', 'Grand Master Vorn'],
    titles: ['Daemon-Slayer of Titan', 'Warden of the Sacred Secrets', 'Master of the Silver Purge', 'Blade of the Emperor\'s Gift'],
    honorifics: ['The Incorruptible', 'Shield Against the Warp', 'Knight of Titan'],
    weapons: ['Nemesis Force Halberd', 'Nemesis Daemon Hammer', 'Incinerator of Holy Fire', 'Storm Bolter of Titan'],
    traits: ['Aegis Armor (Psychic shield resonance)', 'Purge the Unclean (Bonus damage to corrupt forces)', 'Rites of Exorcism (Mind over matter)'],
    glyphs: ['shield-checkmark', 'sparkles', 'lock-closed', 'hammer'],
    primaryColor: '#455A64',
    accentColor: '#B0BEC5',
    loreTemplates: [
      'A silver-clad psychic warrior trained in absolute secrecy on the moon of Titan to fight the horrors of the Immaterium.',
      'His mind is an iron fortress of purity, channeling purified psychic wrath through crackling Nemesis force weapons.',
    ],
  },
  'imperial-knights': {
    factionId: 'imperial-knights',
    factionName: 'Imperial Knights',
    names: ['Sir Hekhtur the Chainbreaker', 'Baron Roland', 'Knight Scion Teresa', 'Lord Darius of Terryn', 'Lady Danith'],
    titles: ['The Freeblade of Renown', 'Baron of the High Keep', 'Lance Commander', 'Chivalric Paragon of the Realm'],
    honorifics: ['The Ironclad Hero', 'Honor of the Noble Throne', 'Shield of the Vassal Worlds'],
    weapons: ['Reaper Chainsword of Chivalry', 'Rapid-Fire Battle Cannon', 'Thermal Cannon', 'Avenger Gatling Cannon'],
    traits: ['Ion Shield Matrix (Directional damage reduction)', 'Titanic Tread (Crushing impact)', 'Noble Chivalry (Moral steadfastness)'],
    glyphs: ['cog', 'shield', 'trophy', 'car-sport'],
    primaryColor: '#0D47A1',
    accentColor: '#FFD700',
    loreTemplates: [
      'A noble pilot bound by ancient neural Throne Mechanics to a colossal multi-story bipedal engine of war.',
      'Guiding a legendary chivalric chassis that has broken enemy sieges and trampled xenos hordes for generations.',
    ],
  },
};

/**
 * Procedurally generates a unique, faction-appropriate Boss Identity
 * given a deterministic seed string (e.g. weekly cycle ID "2026_W42").
 */
export function generateProceduralBoss(
  seedStr: string,
  targetFactionId?: string
): GeneratedBossIdentity {
  const prng = createDeterministicPrng(seedStr);

  const availableFactions = Object.keys(FACTION_BOSS_POOLS);
  const factionKey =
    targetFactionId && FACTION_BOSS_POOLS[targetFactionId]
      ? targetFactionId
      : availableFactions[Math.floor(prng() * availableFactions.length)];

  const pool = FACTION_BOSS_POOLS[factionKey] || FACTION_BOSS_POOLS['orks'];

  const name = pool.names[Math.floor(prng() * pool.names.length)];
  const title = pool.titles[Math.floor(prng() * pool.titles.length)];
  const honorific = pool.honorifics[Math.floor(prng() * pool.honorifics.length)];
  const weapon = pool.weapons[Math.floor(prng() * pool.weapons.length)];
  const trait = pool.traits[Math.floor(prng() * pool.traits.length)];
  const glyph = pool.glyphs[Math.floor(prng() * pool.glyphs.length)];
  const lore = pool.loreTemplates[Math.floor(prng() * pool.loreTemplates.length)];

  // Scale base health deterministically between 2,500 and 3,500 HP
  const baseHealth = 2500 + Math.floor(prng() * 1000);

  const phases: BossPhaseDefinition[] = [
    {
      phaseNumber: 1,
      title: 'Phase I: Armored Frontline',
      hpThresholdPercent: 100,
      description: `${name} advances in full defensive posture behind their ${weapon}. Form and consistency are paramount.`,
      visualColor: pool.primaryColor,
      taunt: `Tremble, mortal! You face ${name}, ${title}!`,
    },
    {
      phaseNumber: 2,
      title: 'Phase II: Enraged Retaliation',
      hpThresholdPercent: 66,
      description: `${name}'s armor is breached! They enter an aggressive stance, activating ${trait}.`,
      visualColor: pool.accentColor,
      taunt: `Is that the best you have?! I shall grind your bones to dust!`,
    },
    {
      phaseNumber: 3,
      title: 'Phase III: Desperate Last Stand',
      hpThresholdPercent: 33,
      description: `${name} unleashes all remaining reserves in a catastrophic overload! Push through the burn!`,
      visualColor: '#D50000',
      taunt: `If I fall, I take everything down with me! DIE!`,
    },
  ];

  const taunts = [
    `Your strikes are pathetic against ${title}!`,
    `Feel the fury of my ${weapon}!`,
    `You are merely biological chaff before my might!`,
    `Stand down or be broken upon the anvil of war!`,
  ];

  const defeatQuote = `By the stars... How could my strength falter before you...?`;

  return {
    bossKey: `boss_${factionKey}_${seedStr}`,
    name,
    title,
    factionId: pool.factionId,
    factionName: pool.factionName,
    honorific,
    signatureWeapon: weapon,
    combatTrait: trait,
    tacticalDescription: `Armed with a ${weapon} and fortified by ${trait}. Requires relentless compound damage to crack all 3 combat phases.`,
    loreDescription: `${name}, ${title}. ${honorific}. ${lore}`,
    baseHealth,
    glyph,
    primaryColor: pool.primaryColor,
    accentColor: pool.accentColor,
    phases,
    taunts,
    defeatQuote,
  };
}
