import { AchievementCriterion } from '../types/achievements';

/**
 * Formats achievement criterion into a clear, human-readable requirement.
 */
export function formatCriterionRequirement(criterion: AchievementCriterion): string {
  const target = criterion.targetValue.toLocaleString();
  switch (criterion.type) {
    case 'count_workouts':
      return `Complete ${target} full workout sessions`;
    case 'count_sets':
      return `Complete ${target} completed working sets`;
    case 'count_reps':
      return `Complete ${target} total repetitions`;
    case 'total_volume_kg':
      return `Lift ${target} kg in cumulative tonnage volume`;
    case 'single_set_volume_kg':
      return `Perform a single set with ${target} kg volume`;
    case 'distinct_exercises':
      return `Train with ${target} distinct exercises`;
    case 'distinct_categories':
      return `Train across ${target} distinct muscle groups`;
    case 'distinct_equipment':
      return `Train with ${target} distinct equipment types`;
    case 'pr_broken_count':
      return `Break personal records ${target} times`;
    case 'single_lift_weight_kg':
      return `Lift ${target} kg on a single repetition`;
    case 'weekly_streak_weeks':
      return `Maintain a training streak of ${target} consecutive weeks`;
    case 'return_after_rest_days':
      return `Honor ${target} scheduled rest & recovery windows`;
    case 'rest_day_taken':
      return `Complete ${target} scheduled recovery day`;
    case 'combat_attacks_count':
      return `Land ${target} combat strikes against hostiles`;
    case 'combat_crits_count':
      return `Deal ${target} critical strikes in combat`;
    case 'total_combat_damage':
      return `Deal ${target} total combat damage`;
    case 'solo_boss_defeated':
      return `Slay ${target} solo sector bosses`;
    case 'distinct_enemies_defeated':
      return `Purge ${target} distinct hostile enemy types`;
    case 'coop_boss_defeated':
      return `Defeat ${target} co-op crusade raid bosses`;
    case 'coop_attacks_count':
      return `Contribute ${target} attacks in co-op raids`;
    case 'squad_shared_damage':
      return `Deal ${target} shared squad damage in co-op`;
    case 'character_level':
      return `Advance warrior to Level ${target}`;
    case 'rank_tier':
      return `Achieve military Rank Tier ${target}`;
    case 'distinct_factions_tried':
      return `Complete ${target} crusade operations`;
    case 'custom_equipment_count':
      return `Configure ${target} custom wargear entries`;
    case 'campaign_missions_completed':
      return `Conquer ${target} planetary campaign missions`;
    default:
      return `Reach requirement of ${target} ${(criterion as any).type?.replace(/_/g, ' ')}`;
  }
}
