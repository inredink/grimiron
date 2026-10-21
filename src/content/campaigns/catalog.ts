import { CampaignDefinition, CampaignNode } from '../../types/campaign';

/**
 * Data-Driven Campaign Map Catalog for GrimIron.
 * Represents campaign progression as a directed graph of regions, encounters,
 * mission nodes, and unlock conditions. Supports sequential routes, branch points,
 * and program-independent cooperative progression.
 */
export const CAMPAIGN_CATALOG: CampaignDefinition[] = [
  // =========================================================================
  // 1. THE DAMOCLES GULF CRUSADE
  // =========================================================================
  {
    id: 'camp_damocles_crusade',
    title: 'The Damocles Gulf Crusade',
    sectorName: 'Damocles Gulf // Eastern Fringe',
    theaterOfWar: 'Sub-Sector Aurelius Planetary Conquest',
    narrativeBriefing:
      'Imperial battlegroups have engaged hostile xenos and heretical forces across the frontier planets of the Damocles Gulf. Deploy your warriors across dropzones, sever orbital arrays, and breach fortified redoubts.',
    iconName: 'planet-outline',
    startNodeId: 'node_damocles_dropzone',
    nodes: [
      {
        id: 'node_damocles_dropzone',
        campaignId: 'camp_damocles_crusade',
        title: 'Dropzone Aurelia Recon',
        codeName: 'OPERATION IRON DESCENT',
        description: 'Establish the initial forward beachhead under orbital atmospheric re-entry.',
        narrativeBriefing:
          'Drop-pods slam into the red soil of Aurelia. Clear the LZ perimeter with disciplined workout consistency and initial combat strikes. Securing this sector requires at least a full week of consistent physical conditioning.',
        nodeType: 'recon',
        difficulty: 'patrol',
        position: { x: 50, y: 15 },
        prerequisiteNodeIds: [],
        successorNodeIds: ['node_damocles_outpost'],
        unlockRequirements: [
          {
            id: 'req_dz_wo',
            type: 'completed_workouts',
            targetValue: 5,
            description: 'Log 5 completed training deployments (at least 1 week of dedicated sessions)',
          },
          {
            id: 'req_dz_sets',
            type: 'working_sets',
            targetValue: 35,
            description: 'Log 35 completed working sets across your training deployments',
          },
          {
            id: 'req_dz_dmg',
            type: 'combat_damage',
            targetValue: 1500,
            description: 'Deal 1,500 total combat damage securing the landing perimeter',
          },
        ],
        rewards: [
          { type: 'xp', amount: 25, description: '+25 Campaign Glory XP' },
          { type: 'campaign_star', amount: 1, description: 'Campaign Star: Beachhead Secured' },
        ],
      },
      {
        id: 'node_damocles_outpost',
        campaignId: 'camp_damocles_crusade',
        title: 'Siege of Outpost Aurelius',
        codeName: 'OPERATION HAMMERFALL',
        description: 'Breach the fortified perimeter wall and eliminate the defending skirmish garrison.',
        narrativeBriefing:
          'Automated turrets and barricaded outriders block the imperial vanguard. Accumulate sustained working sets across multiple weeks and strike down the garrison commander.',
        nodeType: 'encounter',
        difficulty: 'skirmish',
        position: { x: 50, y: 35 },
        enemyId: 'enemy_ork_boyz',
        prerequisiteNodeIds: ['node_damocles_dropzone'],
        successorNodeIds: ['node_damocles_mines', 'node_damocles_orbital_array'],
        isBranchPoint: true,
        branchLabel: 'CHOOSE TACTICAL ASSAULT ROUTE',
        unlockRequirements: [
          {
            id: 'req_outpost_wo',
            type: 'completed_workouts',
            targetValue: 10,
            description: 'Complete 10 total workouts across training programs (~2 weeks of crusade service)',
          },
          {
            id: 'req_outpost_sets',
            type: 'working_sets',
            targetValue: 75,
            description: 'Execute 75 completed working sets',
          },
          {
            id: 'req_outpost_dmg',
            type: 'combat_damage',
            targetValue: 4000,
            description: 'Inflict 4,000 total combat damage against enemy defense fortifications',
          },
          {
            id: 'req_outpost_defeat',
            type: 'defeat_enemy',
            targetValue: 'enemy_ork_boyz',
            description: 'Defeat the garrison skirmish mob (Ork Boyz)',
          },
        ],
        rewards: [
          { type: 'xp', amount: 35, description: '+35 Campaign Glory XP' },
          { type: 'title', title: 'Outpost Breacher', description: 'Earned the campaign title: Outpost Breacher' },
        ],
      },
      // BRANCH A: Subterranean Fuel Vaults
      {
        id: 'node_damocles_mines',
        campaignId: 'camp_damocles_crusade',
        title: 'Subterranean Vault Sabotage',
        codeName: 'ROUTE ALPHA // SUB-SURFACE INFILTRATION',
        description: 'Infiltrate the deep geothermal promethium conduits and sever heavy power lines.',
        narrativeBriefing:
          'Descend into the suffocating subterranean fuel shafts. Sustained multi-week heavy tonnage is required to carry demolition charges through zero-light tunnels.',
        nodeType: 'mission',
        difficulty: 'skirmish',
        position: { x: 25, y: 60 },
        prerequisiteNodeIds: ['node_damocles_outpost'],
        successorNodeIds: ['node_damocles_fortress_prime'],
        unlockRequirements: [
          {
            id: 'req_mines_wo',
            type: 'completed_workouts',
            targetValue: 15,
            description: 'Log 15 total completed workouts (~3 weeks of sustained crusade operations)',
          },
          {
            id: 'req_mines_vol',
            type: 'volume_kg',
            targetValue: 85000,
            description: 'Move 85,000 kg cumulative workout volume (sub-surface heavy logistics tonnage)',
          },
          {
            id: 'req_mines_sets',
            type: 'working_sets',
            targetValue: 120,
            description: 'Log 120 completed working sets in your training program',
          },
          {
            id: 'req_mines_dmg',
            type: 'combat_damage',
            targetValue: 7500,
            description: 'Inflict 7,500 total combat damage to demolish reinforced vault bulkheads',
          },
        ],
        rewards: [
          { type: 'xp', amount: 40, description: '+40 Campaign Glory XP' },
          { type: 'title', title: 'Sub-Surface Demolitionist', description: 'Title: Sub-Surface Demolitionist' },
        ],
      },
      // BRANCH B: Orbital Sensor Array
      {
        id: 'node_damocles_orbital_array',
        campaignId: 'camp_damocles_crusade',
        title: 'Orbital Uplink Spire Disruption',
        codeName: 'ROUTE BETA // SKY-SHATTER STRIKE',
        description: 'Scale the high-altitude communication spire and blind enemy defensive telemetry.',
        narrativeBriefing:
          'The orbital sensor array feeds real-time targeting coordinates to enemy railgun batteries. Relentless multi-week assault volleys are needed.',
        nodeType: 'mission',
        difficulty: 'skirmish',
        position: { x: 75, y: 60 },
        prerequisiteNodeIds: ['node_damocles_outpost'],
        successorNodeIds: ['node_damocles_fortress_prime'],
        unlockRequirements: [
          {
            id: 'req_orbital_wo',
            type: 'completed_workouts',
            targetValue: 15,
            description: 'Log 15 total completed workouts (~3 weeks of sustained assault operations)',
          },
          {
            id: 'req_orbital_atks',
            type: 'combat_attacks',
            targetValue: 80,
            description: 'Deliver 80 workout-generated tactical combat strikes',
          },
          {
            id: 'req_orbital_dmg',
            type: 'combat_damage',
            targetValue: 7500,
            description: 'Deal 7,500 combat damage to enemy radar relays and comm arrays',
          },
          {
            id: 'req_orbital_sets',
            type: 'working_sets',
            targetValue: 120,
            description: 'Complete 120 working sets in altitude combat conditions',
          },
        ],
        rewards: [
          { type: 'xp', amount: 40, description: '+40 Campaign Glory XP' },
          { type: 'title', title: 'Array Saboteur', description: 'Title: Array Saboteur' },
        ],
      },
      // FINAL BOSS NODE: Fortress Prime
      {
        id: 'node_damocles_fortress_prime',
        campaignId: 'camp_damocles_crusade',
        title: 'Fortress Prime Decapitation Strike',
        codeName: 'OPERATION GODBREAKER',
        description: 'Shatter the inner citadel doors and execute the Supreme Planetary Warlord.',
        narrativeBriefing:
          'All convergence routes unite at the supreme citadel. Face the armored warlord commanding Sector Aurelia. Conquering this sector demands a month of relentless iron devotion.',
        nodeType: 'stronghold',
        difficulty: 'boss',
        position: { x: 50, y: 85 },
        enemyId: 'enemy_helbrute',
        prerequisiteNodeIds: ['node_damocles_mines', 'node_damocles_orbital_array'],
        successorNodeIds: [],
        unlockRequirements: [
          {
            id: 'req_fortress_wo',
            type: 'completed_workouts',
            targetValue: 20,
            description: 'Complete 20 total training sessions (~1 month of dedicated crusade service)',
          },
          {
            id: 'req_fortress_sets',
            type: 'working_sets',
            targetValue: 160,
            description: 'Log 160 completed working sets across your campaign career',
          },
          {
            id: 'req_fortress_dmg',
            type: 'combat_damage',
            targetValue: 12000,
            description: 'Deliver 12,000 total cumulative combat damage to the citadel core',
          },
          {
            id: 'req_fortress_defeat',
            type: 'defeat_enemy',
            targetValue: 'enemy_helbrute',
            description: 'Neutralize the armored citadel warlord (Helbrute)',
          },
        ],
        rewards: [
          { type: 'xp', amount: 50, description: '+50 Campaign Glory XP' },
          { type: 'title', title: 'Liberator of Sector Aurelia', description: 'Title: Liberator of Sector Aurelia' },
          { type: 'campaign_star', amount: 3, description: '3 Campaign Mastery Stars' },
        ],
      },
    ],
  },
];

/**
 * Retrieve a campaign definition by ID.
 */
export function getCampaignById(campaignId: string): CampaignDefinition | undefined {
  return CAMPAIGN_CATALOG.find((c) => c.id === campaignId);
}

/**
 * Retrieve the default active campaign.
 */
export function getDefaultCampaign(): CampaignDefinition {
  return CAMPAIGN_CATALOG[0];
}
