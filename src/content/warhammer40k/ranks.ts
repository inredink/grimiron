import { RankTier } from '../types';

/**
 * Standard progression XP brackets:
 * Tier 1: 0 XP (Initiate / Recruit)
 * Tier 2: 600 XP (Full line combatant - ~2-3 workouts)
 * Tier 3: 1,800 XP (Veteran combatant - ~7-8 workouts)
 * Tier 4: 3,800 XP (Junior officer / specialist - ~15-18 workouts)
 * Tier 5: 7,000 XP (Senior officer / champion - ~30 workouts)
 * Tier 6: 12,000 XP (Sub-commander / hero - ~50+ workouts)
 * Tier 7: 20,000 XP (High Commander / Legend - ~85+ workouts)
 */

export const spaceMarineRanks: RankTier[] = [
  { tier: 1, title: 'Neophyte Scout', minXp: 0, description: 'Undergoing gene-seed implantation, proving endurance in light reconnaissance.', isCanonicalLore: true },
  { tier: 2, title: 'Battle-Brother', minXp: 600, description: 'Clad in full Power Armor, serving with distinction in a Battle Company.', isCanonicalLore: true },
  { tier: 3, title: 'Company Veteran', minXp: 1800, description: 'Hardened by decades of war; master of close-quarters and ranged tactics.', isCanonicalLore: true },
  { tier: 4, title: 'Sergeant', minXp: 3800, description: 'Leading a tactical combat squad with unbreakable tactical discipline.', isCanonicalLore: true },
  { tier: 5, title: 'Lieutenant', minXp: 7000, description: 'Deputy commander orchestrating company-level strikes under heavy fire.', isCanonicalLore: true },
  { tier: 6, title: 'Captain', minXp: 12000, description: 'Commanding one of the Chapter’s ten legendary fighting companies.', isCanonicalLore: true },
  { tier: 7, title: 'Chapter Master', minXp: 20000, description: 'Lord of the Chapter, answering only to the Emperor and Primarch.', isCanonicalLore: true },
];

export const imperialGuardRanks: RankTier[] = [
  { tier: 1, title: 'Conscript', minXp: 0, description: 'Issued standard flak armor and a lasgun. Learning through survival.', isCanonicalLore: true },
  { tier: 2, title: 'Guardsman', minXp: 600, description: 'Proven soldier holding the line against the galaxy’s horrors.', isCanonicalLore: true },
  { tier: 3, title: 'Hardened Veteran', minXp: 1800, description: 'A survivor of multiple warzones carrying specialized heavy ordnance.', isCanonicalLore: true },
  { tier: 4, title: 'Sergeant', minXp: 3800, description: 'Keeping morale unyielding through barked orders and iron will.', isCanonicalLore: true },
  { tier: 5, title: 'Lieutenant', minXp: 7000, description: 'Coordinating platoon-level bayonet charges and artillery batteries.', isCanonicalLore: true },
  { tier: 6, title: 'Colonel', minXp: 12000, description: 'Regimental commander orchestrating planetary siege warfare.', isCanonicalLore: true },
  { tier: 7, title: 'Lord General', minXp: 20000, description: 'Supreme Warmaster commanding entire Imperial Crusades.', isCanonicalLore: true },
];

export const mechanicusRanks: RankTier[] = [
  { tier: 1, title: 'Skitarii Vanguard', minXp: 0, description: 'Cybernetically augmented line soldier, radiated by heavy forge carbines.', isCanonicalLore: true },
  { tier: 2, title: 'Skitarii Alpha', minXp: 600, description: 'Cognis-linked squad leader receiving direct Canticles of the Omnissiah.', isCanonicalLore: true },
  { tier: 3, title: 'Tech-Priest Enginseer', minXp: 1800, description: 'Anointing and maintaining holy machine spirits under relentless fire.', isCanonicalLore: true },
  { tier: 4, title: 'Datasmith', minXp: 3800, description: 'Directing Kastelan Maniple automata with ancient doctrine wafers.', isCanonicalLore: true },
  { tier: 5, title: 'Tech-Priest Dominus', minXp: 7000, description: 'Battlefield arch-artificer orchestrating sacred macroscopic warfare.', isCanonicalLore: true },
  { tier: 6, title: 'Archmagos', minXp: 12000, description: 'Ancient keeper of forbidden forge-technologies and titan maniples.', isCanonicalLore: true },
  { tier: 7, title: 'Fabricator-General', minXp: 20000, description: 'Sovereign ruler of a Forge World, direct voice of the Machine God.', isCanonicalLore: true },
];

export const sororitasRanks: RankTier[] = [
  { tier: 1, title: 'Novitiate', minXp: 0, description: 'In training at the Schola Progenium, testing faith through trials of fire.', isCanonicalLore: true },
  { tier: 2, title: 'Battle Sister', minXp: 600, description: 'Bolter and power armor clad militant carrying the Emperor’s fury.', isCanonicalLore: true },
  { tier: 3, title: 'Celestian', minXp: 1800, description: 'Elite martial veteran chosen to guard command sanctuaries and shrines.', isCanonicalLore: true },
  { tier: 4, title: 'Sister Superior', minXp: 3800, description: 'Leading squad devotions and spearheading blessed advances.', isCanonicalLore: true },
  { tier: 5, title: 'Palatine', minXp: 7000, description: 'Battlefield lieutenant executing tactical purges with holy blade.', isCanonicalLore: true },
  { tier: 6, title: 'Canoness', minXp: 12000, description: 'Overall commander of a Convent Commandery, radiant with divine faith.', isCanonicalLore: true },
  { tier: 7, title: 'Canoness Superior', minXp: 20000, description: 'Spiritual and martial matriarch directing entire holy crusades.', isCanonicalLore: true },
];

export const custodesRanks: RankTier[] = [
  { tier: 1, title: 'Custodian Guard', minXp: 0, description: 'Genetically crafted demigod equipped with Guardian Spear and auramite.', isCanonicalLore: true },
  { tier: 2, title: 'Custodian Warden', minXp: 600, description: 'Sworn keeper of sacred oaths and imperial inner sanctuaries.', isCanonicalLore: true },
  { tier: 3, title: 'Allarus Terminator', minXp: 1800, description: 'Heavily armored titan hunter teleporting into enemy commanders’ lines.', isCanonicalLore: true },
  { tier: 4, title: 'Vertus Praetor', minXp: 3800, description: 'High-speed jetbike champion striking with interceptor lances.', isCanonicalLore: true },
  { tier: 5, title: 'Shield-Captain', minXp: 7000, description: 'Supreme warrior-diplomat guiding an autonomous Shield Company.', isCanonicalLore: true },
  { tier: 6, title: 'Tribune', minXp: 12000, description: 'Senior councilor advising the highest echelons of the Imperium.', isCanonicalLore: true },
  { tier: 7, title: 'Captain-General', minXp: 20000, description: 'Chief of the Ten Thousand, answering only to the Golden Throne.', isCanonicalLore: true },
];

export const greyKnightsRanks: RankTier[] = [
  { tier: 1, title: 'Initiate Neophyte', minXp: 0, description: 'Testing psychic purity beneath the subterranean crypts of Titan.', isCanonicalLore: true },
  { tier: 2, title: 'Strike Marine', minXp: 600, description: 'Nemesis force weapon wielding daemon-slayer shrouded in Aegis armor.', isCanonicalLore: true },
  { tier: 3, title: 'Purifier', minXp: 1800, description: 'Incorruptible spiritual beacon incinerating Warp anomalies with soul-fire.', isCanonicalLore: true },
  { tier: 4, title: 'Justicar', minXp: 3800, description: 'Squad sergeant leading focused psychic strike teams against Greater Daemons.', isCanonicalLore: true },
  { tier: 5, title: 'Paladin', minXp: 7000, description: 'Elite terminator champion serving as bodyguard to the Grand Masters.', isCanonicalLore: true },
  { tier: 6, title: 'Brother-Captain', minXp: 12000, description: 'Commands a full Brotherhood of psychic warrior-monks.', isCanonicalLore: true },
  { tier: 7, title: 'Grand Master', minXp: 20000, description: 'Supreme chapter lord possessing unimaginable anti-warp potency.', isCanonicalLore: true },
];

export const imperialKnightsRanks: RankTier[] = [
  { tier: 1, title: 'Bondsman', minXp: 0, description: 'Squire bonding neural cables with the Throne Mechanicum.', isCanonicalLore: true },
  { tier: 2, title: 'Armiger Pilot', minXp: 600, description: 'Piloting light Armiger Warglaives or Helverins on the flanks.', isCanonicalLore: true },
  { tier: 3, title: 'Scion Martial', minXp: 1800, description: 'Full Noble pilot helming Questoris-class bipedal engine.', isCanonicalLore: true },
  { tier: 4, title: 'Knight Preceptor', minXp: 3800, description: 'Master tutor teaching young nobles the Chivalric Code of War.', isCanonicalLore: true },
  { tier: 5, title: 'Knight Baron', minXp: 7000, description: 'Household commander leading lances of towering warmachines.', isCanonicalLore: true },
  { tier: 6, title: 'High Scion', minXp: 12000, description: 'Elder knight helming massive Dominus or Cerastus chassis.', isCanonicalLore: true },
  { tier: 7, title: 'High King', minXp: 20000, description: 'Sovereign of the Knight World, reigning from the ancestral citadel.', isCanonicalLore: true },
];

export const chaosSpaceMarineRanks: RankTier[] = [
  { tier: 1, title: 'Traitor Initiate', minXp: 0, description: 'Forsaking the False Emperor to seek dark glory in the Eye of Terror.', isCanonicalLore: true },
  { tier: 2, title: 'Legionary', minXp: 600, description: 'Veterans of the Long War, fueled by malice and chaotic boons.', isCanonicalLore: true },
  { tier: 3, title: 'Havoc Specialist', minXp: 1800, description: 'Wielding heavy warp-infused weaponry to shatter imperial battle lines.', isCanonicalLore: true },
  { tier: 4, title: 'Aspiring Champion', minXp: 3800, description: 'Gathering blood offerings and souls to attract the gaze of the Ruinous Powers.', isCanonicalLore: true },
  { tier: 5, title: 'Chaos Lord', minXp: 7000, description: 'Ruthless warlord commanding a warband of murderous renegades.', isCanonicalLore: true },
  { tier: 6, title: 'Daemon Prince', minXp: 12000, description: 'Ascended to immortal daemonhood, embodying chaotic fury.', isCanonicalLore: true },
  { tier: 7, title: 'Warmaster', minXp: 20000, description: 'Supreme leader directing apocalyptic Black Crusades against realspace.', isCanonicalLore: true },
];

export const deathGuardRanks: RankTier[] = [
  { tier: 1, title: 'Poxwalker', minXp: 0, description: 'Afflicted by Grandfather Nurgle’s gifts, feeling no pain or fatigue.', isCanonicalLore: false, loreNote: 'Poxwalkers are chaff in lore; included as beginner baseline.' },
  { tier: 2, title: 'Plague Marine', minXp: 600, description: 'Rotting warrior of unyielding resilience and virulent pestilence.', isCanonicalLore: true },
  { tier: 3, title: 'Blightlord Terminator', minXp: 1800, description: 'Corrupted cataphractii plate carrying plagues of catastrophic potency.', isCanonicalLore: true },
  { tier: 4, title: 'Plague Champion', minXp: 3800, description: 'Bearing diseased trophies and commanding squads of inexorable rot.', isCanonicalLore: true },
  { tier: 5, title: 'Lord of Contagion', minXp: 7000, description: 'Brutal vector of decay wielding heavy plaguereapers.', isCanonicalLore: true },
  { tier: 6, title: 'Lord of Virulence', minXp: 12000, description: 'Master of heavy toxic bombardment and siege pestilence.', isCanonicalLore: true },
  { tier: 7, title: 'Herald of Mortarion', minXp: 20000, description: 'Right hand of the Primarch of Nurgle, champion of the 7th vector.', isCanonicalLore: false, loreNote: 'Synthesized rank representing top company commanders.' },
];

export const thousandSonsRanks: RankTier[] = [
  { tier: 1, title: 'Thrall Wizard', minXp: 0, description: 'Aspiring psyker learning the preliminary rituals of Prospero.', isCanonicalLore: true },
  { tier: 2, title: 'Rubric Marine', minXp: 600, description: 'Dust bound inside enchanted armor, firing warpfire inferno bolters.', isCanonicalLore: true },
  { tier: 3, title: 'Scarab Occult Terminator', minXp: 1800, description: 'Ancient psychic cataphractii elite wielding force kopesh.', isCanonicalLore: true },
  { tier: 4, title: 'Aspiring Sorcerer', minXp: 3800, description: 'Guiding rubricae squads through mental telepathy and sorcerous bolts.', isCanonicalLore: true },
  { tier: 5, title: 'Exalted Sorcerer', minXp: 7000, description: 'Warp-weaver shaping fate and reality according to Tzeentch’s grand schemes.', isCanonicalLore: true },
  { tier: 6, title: 'Magister Templi', minXp: 12000, description: 'High priest of the cult covens, master of time and mutation.', isCanonicalLore: true },
  { tier: 7, title: 'Daemon Prince of Tzeentch', minXp: 20000, description: 'Immortal entity of endless transformation and psychic devastation.', isCanonicalLore: true },
];

export const worldEatersRanks: RankTier[] = [
  { tier: 1, title: 'Jakhal', minXp: 0, description: 'Chem-fueled frenzied cultist seeking skull offerings for Khorne.', isCanonicalLore: true },
  { tier: 2, title: 'Khorne Berzerker', minXp: 600, description: 'Chainaxe-wielding butcher consumed by the Butcher’s Nails.', isCanonicalLore: true },
  { tier: 3, title: 'Eightbound', minXp: 1800, description: 'Possessed by eight daemons of Khorne, locked in brutal physical symbiosis.', isCanonicalLore: true },
  { tier: 4, title: 'Berzerker Champion', minXp: 3800, description: 'First to cross no-man’s land, collecting warlord heads.', isCanonicalLore: true },
  { tier: 5, title: 'Exalted Eightbound', minXp: 7000, description: 'Dominant warrior who subjugated all daemons within his flesh.', isCanonicalLore: true },
  { tier: 6, title: 'Lord on Juggernaut', minXp: 12000, description: 'Mounted upon a brass war-beast trampling enemy fortifications.', isCanonicalLore: true },
  { tier: 7, title: 'Chosen of Angron', minXp: 20000, description: 'Supreme herald of blood, bathed in perpetual slaughter.', isCanonicalLore: false, loreNote: 'Game rank for top-tier slaughterlords.' },
];

export const chaosDaemonsRanks: RankTier[] = [
  { tier: 1, title: 'Minor Warp Entity', minXp: 0, description: 'Formless nightmare coalescing from mortal emotional resonance.', isCanonicalLore: true },
  { tier: 2, title: 'Lesser Daemon', minXp: 600, description: 'Manifested Bloodletter, Plaguebearer, Daemonette, or Pink Horror.', isCanonicalLore: true },
  { tier: 3, title: 'Daemonic Beast', minXp: 1800, description: 'Flesh Hound, Rot Fly, or Screamer hunting reality’s fringes.', isCanonicalLore: true },
  { tier: 4, title: 'Herald of Chaos', minXp: 3800, description: 'Empowered manifestation channeling patron god’s direct malice.', isCanonicalLore: true },
  { tier: 5, title: 'Daemon Prince', minXp: 7000, description: 'Ascended mortal granted eternal chaotic patron form.', isCanonicalLore: true },
  { tier: 6, title: 'Greater Daemon', minXp: 12000, description: 'Towering avatar of the god: Bloodthirster, Great Unclean One, Lord of Change.', isCanonicalLore: true },
  { tier: 7, title: 'Exalted Warp Lord', minXp: 20000, description: 'Favored general of the Immaterium threatening entire star sectors.', isCanonicalLore: true },
];

export const aeldariRanks: RankTier[] = [
  { tier: 1, title: 'Guardian Defender', minXp: 0, description: 'Citizen-militia mobilizing to protect the Craftworld world-ship.', isCanonicalLore: true },
  { tier: 2, title: 'Aspect Warrior', minXp: 600, description: 'Walking the Path of the Warrior (Dire Avenger, Howling Banshee, Striking Scorpion).', isCanonicalLore: true },
  { tier: 3, title: 'Exarch', minXp: 1800, description: 'High priest of the Warrior Path, permanently bonded with ancestral armor.', isCanonicalLore: true },
  { tier: 4, title: 'Warlock', minXp: 3800, description: 'Psychic warrior blending battle rage with divination runes.', isCanonicalLore: true },
  { tier: 5, title: 'Autarch', minXp: 7000, description: 'Supreme general who has mastered multiple distinct Warrior Paths.', isCanonicalLore: true },
  { tier: 6, title: 'Farseer', minXp: 12000, description: 'Master diviner navigating the skeins of fate to preserve the Eldar race.', isCanonicalLore: true },
  { tier: 7, title: 'Phoenix Lord Avatar', minXp: 20000, description: 'Living legend of the Asuryani, immortal spirit of warfare.', isCanonicalLore: false, loreNote: 'Title representing apex Eldar mastery.' },
];

export const drukhariRanks: RankTier[] = [
  { tier: 1, title: 'Kabalite / Wych Initiate', minXp: 0, description: 'Fighting in the shadowy alleys and arenas of Commorragh.', isCanonicalLore: true },
  { tier: 2, title: 'Kabalite Warrior', minXp: 600, description: 'Splinter rifle marksman feeding upon terror and suffering.', isCanonicalLore: true },
  { tier: 3, title: 'Trueborn / Bloodbride', minXp: 1800, description: 'Highborn elite wielding darklight lances with cruel precision.', isCanonicalLore: true },
  { tier: 4, title: 'Sybarite / Hekatrix', minXp: 3800, description: 'Squad overseer driving gladiators and raiding skiffs.', isCanonicalLore: true },
  { tier: 5, title: 'Dracon', minXp: 7000, description: 'Lieutenant in an overarching Kabal, plotting their leader’s assassination.', isCanonicalLore: true },
  { tier: 6, title: 'Archon / Succubus', minXp: 12000, description: 'Master of a Dark City Kabal or Wych Cult, bathed in stolen vitality.', isCanonicalLore: true },
  { tier: 7, title: 'High Overlord of the Dark City', minXp: 20000, description: 'Rival to Asdrubael Vect himself, ruling through absolute dread.', isCanonicalLore: false, loreNote: 'Game title for peak Drukhari power.' },
];

export const necronsRanks: RankTier[] = [
  { tier: 1, title: 'Necron Warrior', minXp: 0, description: 'Mindless living metal automaton reanimating after devastating blasts.', isCanonicalLore: true },
  { tier: 2, title: 'Immortal', minXp: 600, description: 'Heavily armored shock trooper retaining spark of tactical combat logic.', isCanonicalLore: true },
  { tier: 3, title: 'Lychguard', minXp: 1800, description: 'Indestructible shield-bearer guarding dynasty royalty with hyperphase swords.', isCanonicalLore: true },
  { tier: 4, title: 'Royal Warden', minXp: 3800, description: 'Officer maintaining tactical cohesion across relentless metal phalanxes.', isCanonicalLore: true },
  { tier: 5, title: 'Cryptek', minXp: 7000, description: 'Master of techno-sorcery altering chronomancy and quantum physics.', isCanonicalLore: true },
  { tier: 6, title: 'Overlord', minXp: 12000, description: 'Ruler of crownworlds, wielding tachyon arrows and warscythes.', isCanonicalLore: true },
  { tier: 7, title: 'Phaeron', minXp: 20000, description: 'Supreme monarch commanding an entire immortal dynastic empire.', isCanonicalLore: true },
];

export const orksRanks: RankTier[] = [
  { tier: 1, title: 'Grot', minXp: 0, description: 'Scavenging ammo, getting kicked around, but learnin’ how to scrap!', isCanonicalLore: true },
  { tier: 2, title: 'Boy', minXp: 600, description: 'Proper green skin with a Choppa and Slugga ready for a right proper dust-up!', isCanonicalLore: true },
  { tier: 3, title: '\'Ard Boy', minXp: 1800, description: "Plated in thick scrap metal, smashing through 'umie barricades.", isCanonicalLore: true },
  { tier: 4, title: 'Nob', minXp: 3800, description: 'Bigger, meaner, and richer, bossin’ around the smaller runts with a power klaw.', isCanonicalLore: true },
  { tier: 5, title: 'Meganob', minXp: 7000, description: 'Stomping into war welded inside walking suits of motorized mega-armor.', isCanonicalLore: true },
  { tier: 6, title: 'Warboss', minXp: 12000, description: 'Massive mountain of muscle and dakka, unitin’ clans for a planetary scrap.', isCanonicalLore: true },
  { tier: 7, title: 'Great Waaagh! Boss', minXp: 20000, description: 'The biggest and the strongest! Gork and Mork’s chosen conqueror of galaxies.', isCanonicalLore: true },
];

export const tauEmpireRanks: RankTier[] = [
  { tier: 1, title: 'Shas\'la (Warrior)', minXp: 0, description: 'Fire Caste line soldier equipped with Pulse Rifle, serving the Greater Good.', isCanonicalLore: true },
  { tier: 2, title: 'Shas\'ui (Veteran)', minXp: 600, description: 'Proven marksman qualified to pilot advanced Crisis Battlesuits.', isCanonicalLore: true },
  { tier: 3, title: 'Shas\'vre (Battlesuit Hero)', minXp: 1800, description: 'Elite pilot executing Mont\'ka (Killing Blow) or Kauyon (Patient Hunter) strikes.', isCanonicalLore: true },
  { tier: 4, title: 'Shas\'el (Cadre Commander)', minXp: 3800, description: 'Commanding planetary Hunter Cadres with drone support networks.', isCanonicalLore: true },
  { tier: 5, title: 'Shas\'o (Supreme Commander)', minXp: 7000, description: 'High commander leading Coalition forces across stellar expansion spheres.', isCanonicalLore: true },
  { tier: 6, title: 'Ethereal Castellan', minXp: 12000, description: 'Spiritual guide uniting the Castes in unshakeable ideological purpose.', isCanonicalLore: true },
  { tier: 7, title: 'Supreme Council Envoy', minXp: 20000, description: 'Direct voice of Aun\'Va leading galactic expansion for the Greater Good.', isCanonicalLore: false, loreNote: 'Game rank representing zenith of Tau governance.' },
];

export const tyranidsRanks: RankTier[] = [
  { tier: 1, title: 'Termagant / Hormagaunt', minXp: 0, description: 'Swarming bio-organism instinctively overwhelming planetary defenders.', isCanonicalLore: true },
  { tier: 2, title: 'Genestealer / Ravener', minXp: 600, description: 'Lethal vanguard organism burrowing and striking with diamond claws.', isCanonicalLore: true },
  { tier: 3, title: 'Tyranid Warrior', minXp: 1800, description: 'Synaptic node creature coordinating surrounding broods with hive intelligence.', isCanonicalLore: true },
  { tier: 4, title: 'Zoanthrope / Carnifex', minXp: 3800, description: 'Living battering ram or warp-channeling psychic bio-artillery.', isCanonicalLore: true },
  { tier: 5, title: 'Hive Tyrant', minXp: 7000, description: 'Supreme battlefield avatar of the Hive Mind wielding bone swords and bio-cannons.', isCanonicalLore: true },
  { tier: 6, title: 'Winged Norn Emissary', minXp: 12000, description: 'Bred specifically to assassinate solar commanders and shatter impregnable fortresses.', isCanonicalLore: true },
  { tier: 7, title: 'The Swarmlord Apex', minXp: 20000, description: 'Reincarnated legend of biological destruction with ten thousand worlds of tactical wisdom.', isCanonicalLore: true },
];

export const genestealerCultsRanks: RankTier[] = [
  { tier: 1, title: 'Neophyte Hybrid', minXp: 0, description: 'Fourth generation miner rising up with modified mining lasers.', isCanonicalLore: true },
  { tier: 2, title: 'Acolyte Hybrid', minXp: 600, description: 'Multi-limbed industrial saboteur carrying rock saws and explosive charges.', isCanonicalLore: true },
  { tier: 3, title: 'Hybrid Metamorph', minXp: 1800, description: 'Bred for pure slaughter with chitinous blades and venom talons.', isCanonicalLore: true },
  { tier: 4, title: 'Kelermorph / Nexos', minXp: 3800, description: 'Fabled gunslinger hero or subterranean battlefield coordinator.', isCanonicalLore: true },
  { tier: 5, title: 'Primus', minXp: 7000, description: 'Military warlord orchestrating the Day of Ascension across the hive city.', isCanonicalLore: true },
  { tier: 6, title: 'Magus', minXp: 12000, description: 'Hypnotic psychic leader bending planetary planetary governors to the cult’s will.', isCanonicalLore: true },
  { tier: 7, title: 'Patriarch Herald', minXp: 20000, description: 'First father of the brood, heralding the coming of the Star Children.', isCanonicalLore: true },
];

export const leaguesOfVotannRanks: RankTier[] = [
  { tier: 1, title: 'Hearthkyn Warrior', minXp: 0, description: 'Clad in void-suit armor, wielding ion blasters and kinetic kin-weapons.', isCanonicalLore: true },
  { tier: 2, title: 'Theyn', minXp: 600, description: 'Squad leader consulting Ancestor weaves and enforcing grim discipline.', isCanonicalLore: true },
  { tier: 3, title: 'Cthonian Beserk', minXp: 1800, description: 'Augmented subterranean miner swinging heavy plasma axes with furious vigor.', isCanonicalLore: true },
  { tier: 4, title: 'Einhyr Hearthguard', minXp: 3800, description: 'Exo-armor elite warrior tele-transporting into the hottest battlezones.', isCanonicalLore: true },
  { tier: 5, title: 'Grimnyr (Living Ancestor)', minXp: 7000, description: 'Clonal psyker channeling the barrier-tech of the Votann Ancestor cores.', isCanonicalLore: true },
  { tier: 6, title: 'Kâhl', minXp: 12000, description: 'Senior league champion directing mining fleets and oathband campaigns.', isCanonicalLore: true },
  { tier: 7, title: 'High Kâhl of the League', minXp: 20000, description: 'Supreme leader of an entire Kindred, guardian of the Ancestor Cores.', isCanonicalLore: true },
];
