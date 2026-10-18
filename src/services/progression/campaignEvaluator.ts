import {
  CampaignDefinition,
  CampaignNode,
  CampaignUnlockRequirement,
  CampaignTelemetryContext,
  CampaignNodeProgress,
} from '../../types/campaign';

/**
 * Pure domain logic for evaluating Campaign Map progression, graph navigation,
 * unlock requirements, and branch resolution.
 * Decoupled from native SQLite for fast test suite verification.
 */

export interface NodeEvaluationResult {
  nodeId: string;
  isUnlocked: boolean;
  isCompleted: boolean;
  requirementsStatus: {
    requirementId: string;
    currentValue: number | string;
    targetValue: number | string;
    isMet: boolean;
    description: string;
  }[];
}

/**
 * Checks whether a single campaign unlock requirement is satisfied by the telemetry context.
 */
export function evaluateCampaignRequirement(
  req: CampaignUnlockRequirement,
  ctx: CampaignTelemetryContext
): { currentValue: number | string; isMet: boolean } {
  switch (req.type) {
    case 'completed_workouts': {
      const val = ctx.totalWorkouts;
      return { currentValue: val, isMet: val >= Number(req.targetValue) };
    }
    case 'working_sets': {
      const val = ctx.totalSets;
      return { currentValue: val, isMet: val >= Number(req.targetValue) };
    }
    case 'volume_kg': {
      const val = ctx.totalVolumeKg;
      return { currentValue: val, isMet: val >= Number(req.targetValue) };
    }
    case 'combat_damage': {
      const val = ctx.totalCombatDamage;
      return { currentValue: val, isMet: val >= Number(req.targetValue) };
    }
    case 'combat_attacks': {
      const val = ctx.totalCombatAttacks;
      return { currentValue: val, isMet: val >= Number(req.targetValue) };
    }
    case 'defeat_enemy': {
      const isDefeated = ctx.defeatedEnemyIds.includes(String(req.targetValue));
      return {
        currentValue: isDefeated ? 'Neutralized' : 'Hostile Active',
        isMet: isDefeated,
      };
    }
    case 'faction_mission': {
      const isDone = ctx.completedFactionMissionIds.includes(String(req.targetValue));
      return {
        currentValue: isDone ? 'Executed' : 'Pending',
        isMet: isDone,
      };
    }
    case 'program_session': {
      const val = ctx.completedProgramSessionsCount;
      return { currentValue: val, isMet: val >= Number(req.targetValue) };
    }
    case 'program_block': {
      const val = ctx.completedProgramBlockNumber;
      return { currentValue: val, isMet: val >= Number(req.targetValue) };
    }
    case 'squad_battle': {
      const val = ctx.squadBattleAttacks;
      return { currentValue: val, isMet: val >= Number(req.targetValue) };
    }
    default:
      return { currentValue: 0, isMet: false };
  }
}

/**
 * Evaluates whether a campaign node is unlocked and/or completed.
 * Considers graph topology (prerequisites) and unlock criteria.
 */
export function evaluateCampaignNode(
  node: CampaignNode,
  ctx: CampaignTelemetryContext,
  completedNodeIds: Set<string>
): NodeEvaluationResult {
  // Graph edge check: does the player meet the topological prerequisites?
  let prerequisitesMet = true;
  if (node.prerequisiteNodeIds.length > 0) {
    // If multiple prerequisites exist, check if any of them are branch options
    // If the node represents a convergence point after a branch, completing at least one branch qualifies
    const anyPrereqCompleted = node.prerequisiteNodeIds.some((id) =>
      completedNodeIds.has(id)
    );
    const allPrereqsCompleted = node.prerequisiteNodeIds.every((id) =>
      completedNodeIds.has(id)
    );

    // If node has 2+ prerequisites, treat as parallel branch convergence (any completed qualifies)
    // Otherwise all must be completed
    prerequisitesMet = node.prerequisiteNodeIds.length > 1
      ? anyPrereqCompleted
      : allPrereqsCompleted;
  }

  const requirementsStatus = node.unlockRequirements.map((req) => {
    const res = evaluateCampaignRequirement(req, ctx);
    return {
      requirementId: req.id,
      currentValue: res.currentValue,
      targetValue: req.targetValue,
      isMet: res.isMet,
      description: req.description,
    };
  });

  const allReqsMet = requirementsStatus.every((r) => r.isMet);
  const isUnlocked = prerequisitesMet;
  // Node is completed when it is unlocked and all its operational requirements are met
  const isCompleted = isUnlocked && allReqsMet;

  return {
    nodeId: node.id,
    isUnlocked,
    isCompleted,
    requirementsStatus,
  };
}

/**
 * Evaluates the full campaign graph against telemetry.
 * Returns evaluated progress for all nodes in topological order.
 */
export function evaluateFullCampaign(
  campaign: CampaignDefinition,
  ctx: CampaignTelemetryContext,
  existingCompletedIds: string[] = []
): {
  evaluations: Record<string, NodeEvaluationResult>;
  completedNodeIds: string[];
  unlockedNodeIds: string[];
  campaignProgressPercent: number;
} {
  const completedNodeIds = new Set<string>(existingCompletedIds);
  const unlockedNodeIds: string[] = [];
  const evaluations: Record<string, NodeEvaluationResult> = {};

  // Iteratively evaluate until no more nodes change (handles multi-stage unlocking)
  let changed = true;
  while (changed) {
    changed = false;
    for (const node of campaign.nodes) {
      const evalRes = evaluateCampaignNode(node, ctx, completedNodeIds);
      evaluations[node.id] = evalRes;

      if (evalRes.isUnlocked && !unlockedNodeIds.includes(node.id)) {
        unlockedNodeIds.push(node.id);
      }

      if (evalRes.isCompleted && !completedNodeIds.has(node.id)) {
        completedNodeIds.add(node.id);
        changed = true; // A new completion might unlock successor nodes
      }
    }
  }

  const completedList = Array.from(completedNodeIds);
  const progressPercent = Math.min(
    100,
    Math.round((completedList.length / campaign.nodes.length) * 100)
  );

  return {
    evaluations,
    completedNodeIds: completedList,
    unlockedNodeIds,
    campaignProgressPercent: progressPercent,
  };
}
