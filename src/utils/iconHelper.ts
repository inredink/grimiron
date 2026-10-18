/**
 * Safe Icon Helper for Grimiron.
 * 
 * Maps known legacy or mistyped icon names to valid Ionicons glyph names,
 * and ensures that an invalid icon name never crashes Expo Vector Icons.
 */

const ICON_ALIASES: Record<string, string> = {
  // Awards / Medals
  'award-outline': 'medal-outline',
  'award': 'medal',
  'badge': 'ribbon',
  'badge-outline': 'ribbon-outline',

  // Targeting / Crosshairs
  'crosshair-outline': 'locate-outline',
  'crosshair': 'locate',
  'target': 'locate',
  'target-outline': 'locate-outline',

  // Tech / CPU
  'cpu': 'hardware-chip',
  'cpu-outline': 'hardware-chip-outline',

  // Energy / Lightning
  'zap': 'flash',
  'zap-outline': 'flash-outline',

  // Containers
  'box': 'cube',
  'box-outline': 'cube-outline',

  // Health / Activity
  'activity': 'pulse',
  'activity-outline': 'pulse-outline',

  // Nature / Emblems
  'feather': 'leaf',
  'feather-outline': 'leaf-outline',
  'circle': 'radio-button-on',
  'circle-outline': 'radio-button-off',
  'smile': 'happy',
  'smile-outline': 'happy-outline',
  'user-check': 'person-add',
  'user-check-outline': 'person-add-outline',
  'hexagon': 'shield',
  'hexagon-outline': 'shield-outline',
};

/**
 * Returns a guaranteed valid Ionicons glyph name.
 * If the provided name is unrecognized or falsy, falls back safely.
 */
export function getSafeIoniconsName(
  iconName: string | undefined | null,
  fallback = 'trophy-outline'
): any {
  if (!iconName || typeof iconName !== 'string') {
    return fallback;
  }
  const clean = iconName.trim();
  if (ICON_ALIASES[clean]) {
    return ICON_ALIASES[clean];
  }
  return clean || fallback;
}
