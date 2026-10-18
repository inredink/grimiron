export type CampaignNodeType =
  | 'region'
  | 'encounter'
  | 'mission'
  | 'stronghold'
  | 'recon';

export type CampaignUnlockType =
  | 'completed_workouts'
  | 'program_session'
  | 'program_block'
  | 'faction_mission'
  | 'combat_damage'
  | 'combat_attacks'
  | 'defeat_enemy'
  | 'volume_kg'
  | 'working_sets'
  | 'squad_battle';

export interface CampaignUnlockRequirement {
  id: string;
  type: CampaignUnlockType;
  targetValue: number | string;
  description: string;
  currentValue?: number | string;
  isMet?: boolean;
}

export interface CampaignReward {
  type: 'xp' | 'title' | 'campaign_star' | 'glory';
  amount?: number;
  title?: string;
  description: string;
}

export interface CampaignNode {
  id: string;
  campaignId: string;
  title: string;
  codeName: string;
  description: string;
  narrativeBriefing: string;
  nodeType: CampaignNodeType;
  difficulty: 'patrol' | 'skirmish' | 'incursion' | 'boss' | 'crusade';
  position: { x: number; y: number }; // Relative coordinates for tactical map visualization
  enemyId?: string; // Optional linked enemy from combat/enemies
  missionId?: string; // Optional linked mission
  prerequisiteNodeIds: string[]; // Graph edges (prerequisites)
  successorNodeIds: string[]; // Graph edges (outgoing branches)
  unlockRequirements: CampaignUnlockRequirement[];
  rewards: CampaignReward[];
  isBranchPoint?: boolean;
  branchLabel?: string;
}

export interface CampaignDefinition {
  id: string;
  title: string;
  sectorName: string;
  narrativeBriefing: string;
  theaterOfWar: string;
  iconName: string;
  startNodeId: string;
  nodes: CampaignNode[];
}

export interface CampaignNodeProgress {
  id: string;
  characterId: string;
  campaignId: string;
  nodeId: string;
  status: 'locked' | 'unlocked' | 'completed';
  completedAt?: string;
  unlockedAt?: string;
  requirementsStatus: {
    requirementId: string;
    currentValue: number | string;
    isMet: boolean;
  }[];
}

export interface CampaignTelemetryContext {
  characterId: string;
  totalWorkouts: number;
  totalSets: number;
  totalVolumeKg: number;
  totalCombatDamage: number;
  totalCombatAttacks: number;
  defeatedEnemyIds: string[];
  completedFactionMissionIds: string[];
  activeProgramId?: string;
  completedProgramSessionsCount: number;
  completedProgramBlockNumber: number;
  squadBattleAttacks: number;
}
