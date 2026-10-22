import { EnemyDefinition } from '../../types/combat';
import { getEncounterById, convertToEnemyDefinition } from '../encounters/catalog';
import { getRaidTierById } from '../raidTiers';

declare const require: any;

export const ENEMY_CATALOG: EnemyDefinition[] = [
  {
    id: 'enemy_chaos_cultist',
    name: 'Chaos Cultist Coven',
    title: 'Heretic Vanguard',
    faction: 'Chaos',
    loreDescription:
      'Fanatical worshippers of the Ruinous Powers armed with scavenged autoguns and makeshift shivs. Easily scattered by decisive force.',
    baseHealth: 1600, // ~5-7 working sets to defeat
    difficulty: 'patrol',
    visual: {
      iconName: 'flame-outline',
      primaryColor: '#9B51E0',
      accentColor: '#BB6BD9',
      badgeText: 'HERETIC',
    },
    tauntQuote: 'The Dark Gods will feast upon your soul!',
    defeatQuote: 'The Warp claims us... but we are legion!',
  },
  {
    id: 'enemy_ork_boyz',
    name: "Gorgutz's Boyz Mob",
    title: 'Feral Greenskin Mob',
    faction: 'Orks',
    loreDescription:
      'A rowdy mob of Choppa-wielding Ork Boyz itching for a scrap. They respect only brute physical power and overwhelming resilience.',
    baseHealth: 2400, // ~8-10 working sets
    difficulty: 'patrol',
    visual: {
      iconName: 'skull-outline',
      primaryColor: '#27AE60',
      accentColor: '#2ECC71',
      badgeText: 'WAAAGH',
    },
    tauntQuote: "WAAAGH! Come 'ere and get krumped, tin-can!",
    defeatQuote: "Dat wuz a proppa scrap... but we'z be back!",
  },
  {
    id: 'enemy_tyranid_warrior',
    name: 'Tyranid Warrior Brood',
    title: 'Synapse Bio-Horror',
    faction: 'Tyranids',
    loreDescription:
      'Towering bio-constructs clad in chameleonic chitin. Synaptically bound to the Hive Mind, their boneswords sever armor like parchment.',
    baseHealth: 3500, // ~12-14 working sets
    difficulty: 'skirmish',
    visual: {
      iconName: 'bug-outline',
      primaryColor: '#E056FD',
      accentColor: '#F0932B',
      badgeText: 'SYNAPSE',
    },
    tauntQuote: 'A deafening synaptic screech reverberates inside your skull.',
    defeatQuote: 'The bio-form collapses as its synaptic link severs.',
  },
  {
    id: 'enemy_necron_immortals',
    name: 'Sautekh Immortal Phalanx',
    title: 'Living Metal Cohort',
    faction: 'Necrons',
    loreDescription:
      'Ancient robotic warriors marching in eerie synchronization. Armed with Gauss Blasters that flay armor and flesh atom by atom.',
    baseHealth: 4200, // ~14-16 working sets
    difficulty: 'skirmish',
    visual: {
      iconName: 'hardware-chip-outline',
      primaryColor: '#00F0FF',
      accentColor: '#05C46B',
      badgeText: 'GAUSS',
    },
    tauntQuote: 'Sensory scans complete. Commencing systematic biological eradication.',
    defeatQuote: 'Phase-out subroutine activated. Chronomantic retreat initiated.',
  },
  {
    id: 'enemy_helbrute',
    name: 'Iron Warriors Helbrute',
    title: 'Twisted Daemon Engine',
    faction: 'Chaos',
    loreDescription:
      'A biomechanical abomination fusing a crazed Chaos Space Marine with an armored walking sarcophagus. Armed with a thunderous Reaper Autocannon.',
    baseHealth: 5500, // ~18-20 working sets (calibrated for high-volume German Volume Training sessions)
    difficulty: 'incursion',
    visual: {
      iconName: 'shield-half-outline',
      primaryColor: '#EB5757',
      accentColor: '#F2994A',
      badgeText: 'DAEMON ENGINE',
    },
    tauntQuote: 'IRON WITHIN! IRON WITHOUT! SUFFER AND BREAK!',
    defeatQuote: 'The machine chassis shrieks in agony as demonic ichor vents into the void.',
  },
  {
    id: 'enemy_carnifex',
    name: 'Hive Fleet Behemoth Carnifex',
    title: 'Living Battering Ram',
    faction: 'Tyranids',
    loreDescription:
      'A monstrous bio-titan built solely for orbital shock assault. Clad in foot-thick reinforced carapace capable of shrugging off tank shells.',
    baseHealth: 7200, // ~24-28 working sets
    difficulty: 'boss',
    visual: {
      iconName: 'flash-outline',
      primaryColor: '#F78FB3',
      accentColor: '#EA2027',
      badgeText: 'TITAN BIO-BEAST',
    },
    tauntQuote: 'The ground quakes beneath its predatory charge.',
    defeatQuote: 'The monolithic leviathan crashes down, its bio-chambers sputtering out.',
  },
  {
    id: 'enemy_ork_warboss',
    name: "Warboss Skullkrakka 'Da Immense'",
    title: 'Supreme Greenskin Warlord',
    faction: 'Orks',
    loreDescription:
      'A colossal mega-armored brute wielding a hydraulic Power Klaw and twin-linked Custom Shoota. He grows stronger the harder you fight.',
    baseHealth: 9500, // ~32-38 working sets
    difficulty: 'boss',
    visual: {
      iconName: 'bonfire-outline',
      primaryColor: '#FF9F1A',
      accentColor: '#FF3838',
      badgeText: 'APEX WARBOSS',
    },
    tauntQuote: "I'Z 'DA BIGGEST AN' DA STRONGEST! YOU TINY HUMIE!",
    defeatQuote: "Guh... finally... a warrior worthy of 'da Boss's teef...",
  },
  {
    id: 'enemy_daemon_prince',
    name: 'Azgathor the Desolator',
    title: 'Ascended Prince of the Void',
    faction: 'Chaos',
    loreDescription:
      'An immortal warlord gifted with infernal godhood. Its Warp-forged blade cleaves reality itself, challenging you to an epic multi-exercise crusade.',
    baseHealth: 14000, // ~45-55 sets / Crusade Session
    difficulty: 'crusade',
    visual: {
      iconName: 'skull',
      primaryColor: '#FFD700',
      accentColor: '#8E44AD',
      badgeText: 'WARP OVERLORD',
    },
    tauntQuote: 'Mortals built this world. I shall grind it into ash!',
    defeatQuote: 'Banished... to the howling depths of the immaterium...',
  },
];

export function getEnemyById(id: string): EnemyDefinition {
  const enemy = ENEMY_CATALOG.find((e) => e.id === id);
  if (enemy) return enemy;

  // Check Warfront encounter templates
  const encounter = getEncounterById(id);
  if (encounter) {
    return convertToEnemyDefinition(encounter);
  }

  // Check raid tiers
  if (id.startsWith('tier_')) {
    const tier = getRaidTierById(id as any);
    if (tier) {
      return {
        id: tier.id,
        name: `${tier.name} Commander`,
        title: tier.codeName,
        faction: 'Raid Hostile',
        loreDescription: tier.loreBriefing,
        baseHealth: tier.soloHp,
        difficulty: 'boss',
        visual: {
          iconName: tier.icon,
          primaryColor: tier.color,
          accentColor: '#FFFFFF',
          badgeText: `TIER ${tier.tierNumber}`,
        },
        tauntQuote: 'You dare challenge a raid commander?',
        defeatQuote: 'The vanguard has fallen...',
      };
    }
  }

  // Check Weekly Raid Bosses
  if (id.startsWith('raid_')) {
    try {
      const { getAllWeeklyRaids } = require('../../services/database/warfrontRepository');
      const allRaids = getAllWeeklyRaids();
      const match = allRaids.find(
        (r: any) => r.boss?.bossKey === id || r.cycleId === id || `raid_${r.cycleId}` === id
      );
      if (match && match.boss) {
        const b = match.boss;
        return {
          id: b.bossKey || id,
          name: b.name,
          title: b.title,
          faction: b.factionName || 'Weekly Raid Boss',
          loreDescription: b.loreDescription || b.tacticalDescription || 'Supreme warlord commanding sector reinforcements.',
          baseHealth: match.maxHp || 6500,
          difficulty: 'boss',
          visual: {
            iconName: b.glyph || 'skull',
            primaryColor: b.primaryColor || '#FF5252',
            accentColor: b.accentColor || '#FFFFFF',
            badgeText: `${b.difficultyTier?.toUpperCase() || 'RAID'} BOSS`,
          },
          tauntQuote: b.taunts?.[0] || 'You dare challenge a raid commander?',
          defeatQuote: b.defeatQuote || 'By the stars... How could my strength falter before you...?',
        };
      }
    } catch {}

    return {
      id,
      name: 'Sector Raid Commander',
      title: 'Supreme Warlord',
      faction: 'Raid Hostile',
      loreDescription: 'A supreme warlord commanding extensive sector reserves.',
      baseHealth: 6500,
      difficulty: 'boss',
      visual: {
        iconName: 'skull',
        primaryColor: '#FF5252',
        accentColor: '#FFFFFF',
        badgeText: 'RAID BOSS',
      },
      tauntQuote: 'Bow before the might of the warfront!',
      defeatQuote: 'By the stars... How could my strength falter before you...?',
    };
  }

  return ENEMY_CATALOG[0];
}
