import { CustomSubfactionInput, CustomSubfactionRecord } from '../types/customSubfaction';

export const MAX_SUBFACTION_NAME_LENGTH = 40;

export interface ValidationError {
  field: string;
  message: string;
}

/**
 * Pure validation logic for custom subfaction inputs.
 * Validates name length, empty checks, parent faction presence,
 * and duplicate name detection against an optional list of active subfactions.
 */
export function validateCustomSubfaction(
  input: CustomSubfactionInput,
  existingId?: string,
  existingList?: CustomSubfactionRecord[]
): { isValid: boolean; errors: ValidationError[]; sanitizedName: string } {
  const errors: ValidationError[] = [];
  const sanitizedName = (input.name || '').trim();

  // 1. Name validation
  if (!sanitizedName) {
    errors.push({ field: 'name', message: 'Subfaction name cannot be empty.' });
  } else if (sanitizedName.length > MAX_SUBFACTION_NAME_LENGTH) {
    errors.push({
      field: 'name',
      message: `Subfaction name cannot exceed ${MAX_SUBFACTION_NAME_LENGTH} characters.`,
    });
  }

  // 2. Parent Faction validation
  if (!input.parentFactionId || !input.parentFactionId.trim()) {
    errors.push({ field: 'parentFactionId', message: 'Parent faction is required.' });
  }

  // 3. Duplicate name check within existing active subfactions
  if (sanitizedName && existingList && existingList.length > 0) {
    const hasDuplicate = existingList.some(
      (s) =>
        !s.isArchived &&
        s.id !== existingId &&
        s.name.trim().toLowerCase() === sanitizedName.toLowerCase()
    );
    if (hasDuplicate) {
      errors.push({
        field: 'name',
        message: `You already have an active subfaction named "${sanitizedName}". Choose a distinct name.`,
      });
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    sanitizedName,
  };
}
