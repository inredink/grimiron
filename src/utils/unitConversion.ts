import { WeightUnit, DistanceUnit, DateFormat, TimeFormat } from '../types/settings';

export const KG_TO_LBS = 2.20462262185;
export const LBS_TO_KG = 0.45359237;
export const MILES_TO_KM = 1.609344;
export const KM_TO_MILES = 0.621371192;

/**
 * Converts a weight measurement from one unit to another without mutating stored data.
 * If source and target units match, the original value is preserved exactly.
 */
export function convertWeight(
  value: number,
  fromUnit: WeightUnit,
  toUnit: WeightUnit,
  precision: number = 1
): number {
  if (!value || isNaN(value) || value <= 0) return 0;
  if (fromUnit === toUnit) return value;

  let converted: number;
  if (fromUnit === 'kg' && toUnit === 'lbs') {
    converted = value * KG_TO_LBS;
  } else {
    converted = value * LBS_TO_KG;
  }

  const factor = Math.pow(10, precision);
  return Math.round(converted * factor) / factor;
}

/**
 * Formats a weight value for display according to user preference, preserving the underlying value.
 */
export function formatWeight(
  storedWeight: number,
  storedUnit: WeightUnit,
  preferredUnit: WeightUnit
): { value: number; unit: string; displayString: string } {
  const convertedValue = convertWeight(storedWeight, storedUnit, preferredUnit);
  const unitLabel = preferredUnit === 'lbs' ? 'lbs' : 'kg';
  return {
    value: convertedValue,
    unit: unitLabel,
    displayString: `${convertedValue} ${unitLabel}`,
  };
}

/**
 * Converts a distance measurement between miles and kilometers.
 */
export function convertDistance(
  value: number,
  fromUnit: DistanceUnit,
  toUnit: DistanceUnit,
  precision: number = 2
): number {
  if (!value || isNaN(value) || value <= 0) return 0;
  if (fromUnit === toUnit) return value;

  let converted: number;
  if (fromUnit === 'miles' && toUnit === 'km') {
    converted = value * MILES_TO_KM;
  } else {
    converted = value * KM_TO_MILES;
  }

  const factor = Math.pow(10, precision);
  return Math.round(converted * factor) / factor;
}

/**
 * Formats a date string or timestamp according to the user's DateFormat preference.
 */
export function formatDate(
  isoDateString: string | number | Date,
  format: DateFormat = 'YYYY-MM-DD'
): string {
  try {
    const d = new Date(isoDateString);
    if (isNaN(d.getTime())) return String(isoDateString);

    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');

    switch (format) {
      case 'MM/DD/YYYY':
        return `${month}/${day}/${year}`;
      case 'DD/MM/YYYY':
        return `${day}/${month}/${year}`;
      case 'YYYY-MM-DD':
      default:
        return `${year}-${month}-${day}`;
    }
  } catch {
    return String(isoDateString);
  }
}

/**
 * Formats a time string or timestamp according to the user's TimeFormat (12h or 24h).
 */
export function formatTime(
  isoDateString: string | number | Date,
  format: TimeFormat = '24h'
): string {
  try {
    const d = new Date(isoDateString);
    if (isNaN(d.getTime())) return String(isoDateString);

    let hours = d.getHours();
    const minutes = String(d.getMinutes()).padStart(2, '0');

    if (format === '12h') {
      const ampm = hours >= 12 ? 'PM' : 'AM';
      hours = hours % 12;
      hours = hours ? hours : 12; // 0 hour is 12 AM
      return `${hours}:${minutes} ${ampm}`;
    }

    return `${String(hours).padStart(2, '0')}:${minutes}`;
  } catch {
    return String(isoDateString);
  }
}

/**
 * Returns the start of the week (Monday or Sunday) based on user preference.
 */
export function getStartOfWeek(
  date: Date = new Date(),
  weekStartsOn: 'monday' | 'sunday' = 'monday'
): Date {
  const d = new Date(date);
  const day = d.getDay(); // 0 = Sunday, 1 = Monday, ...
  const diff =
    weekStartsOn === 'monday'
      ? (day === 0 ? -6 : 1 - day) // if Sunday, go back 6 days to Monday
      : -day; // if Sunday, 0 days back

  d.setDate(d.getDate() + diff);
  d.setHours(0, 0, 0, 0);
  return d;
}
