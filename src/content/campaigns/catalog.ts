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
          'Drop-pods slam into the red soil of Aurelia. Clear the LZ perimeter with disciplined workout consistency and initial combat strikes.',
        nodeType: 'recon',
        difficulty: 'patrol',
        position: { x: 50, y: 15 },
        prerequisiteNodeIds: [],
        successorNodeIds: ['node_damocles_outpost'],
        unlockRequirements: [
          {
            id: 'req_dz_wo',
            type: 'completed_workouts',
            targetValue: 1,
            description: 'Log 1 completed training deployment (any program)',
          },
        ],
        rewards: [
          { type: 'xp', amount: 150, description: '+150 Campaign Glory XP' },
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
          'Automated turrets and barricaded outriders block the imperial vanguard. Accumulate sustained working sets and strike down the garrison commander.',
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
            targetValue: 2,
            description: 'Complete 2 total workouts across any training program',
          },
          {
            id: 'req_outpost_dmg',
            type: 'combat_damage',
            targetValue: 400,
            description: 'Inflict 400 total combat damage against enemy lines',
          },
        ],
        rewards: [
          { type: 'xp', amount: 250, description: '+250 Campaign Glory XP' },
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
          'Descend into the suffocating subterranean fuel shafts. Heavy tonnage is required to carry demolition charges through zero-light tunnels.',
        nodeType: 'mission',
        difficulty: 'skirmish',
        position: { x: 25, y: 60 },
        prerequisiteNodeIds: ['node_damocles_outpost'],
        successorNodeIds: ['node_damocles_fortress_prime'],
        unlockRequirements: [
          {
            id: 'req_mines_vol',
            type: 'volume_kg',
            targetValue: 3000,
            description: 'Move 3,000 kg total cumulative workout volume (heavy supply tonnage)',
          },
          {
            id: 'req_mines_sets',
            type: 'working_sets',
            targetValue: 12,
            description: 'Log 12 completed working sets in your training program',
          },
        ],
        rewards: [
          { type: 'xp', amount: 300, description: '+300 Campaign Glory XP' },
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
          'The orbital sensor array feeds real-time targeting coordinates to enemy railgun batteries. Fast-paced volume and relentless combat attacks are needed.',
        nodeType: 'mission',
        difficulty: 'skirmish',
        position: { x: 75, y: 60 },
        prerequisiteNodeIds: ['node_damocles_outpost'],
        successorNodeIds: ['node_damocles_fortress_prime'],
        unlockRequirements: [
          {
            id: 'req_orbital_atks',
            type: 'combat_attacks',
            targetValue: 12,
            description: 'Deliver 12 workout-generated combat attacks',
          },
          {
            id: 'req_orbital_dmg',
            type: 'combat_damage',
            targetValue: 800,
            description: 'Deal 800 combat damage to enemy radar nodes',
          },
        ],
        rewards: [
          { type: 'xp', amount: 300, description: '+300 Campaign Glory XP' },
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
          'All convergence routes unite at the supreme citadel. Face the armored warlord commanding Sector Aurelia. Every workout set strikes at his command throne.',
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
            targetValue: 4,
            description: 'Complete 4 total training sessions in your program',
          },
          {
            id: 'req_fortress_dmg',
            type: 'combat_damage',
            targetValue: 2000,
            description: 'Deliver 2,000 total cumulative combat damage',
          },
          {
            id: 'req_fortress_defeat',
            type: 'defeat_enemy',
            targetValue: 'enemy_helbrute',
            description: 'Neutralize the armored citadel warlord',
          },
        ],
        rewards: [
          { type: 'xp', amount: 750, description: '+750 Campaign Glory XP' },
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
