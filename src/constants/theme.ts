export const THEME = {
  colors: {
    // Backgrounds
    background: '#0B0E14',      // Deep void black
    surface: '#131822',         // Terminal slate / bulkhead
    surfaceRaised: '#1C2333',   // Interactive card surface
    surfaceBorder: '#2A364F',   // Reinforced steel border
    surfaceHighlight: '#223048',// Selected/active states

    // Primary Accents
    primary: '#E5A93C',         // Imperial Aquila Gold
    primaryMuted: '#99732B',    // Darkened gold
    secondary: '#00E5FF',       // Plasma Cyan
    secondaryMuted: '#007887',  // Deep plasma

    // Functional & Feedback
    success: '#00E676',         // Vox Green (Target down / Set logged)
    successMuted: '#0D472B',
    warning: '#FFAB00',         // Warning Amber
    danger: '#FF334B',          // Crimson Alert
    dangerMuted: '#4D1018',

    // Text & Readouts
    textBright: '#F0F4F8',      // High-contrast readout
    textMain: '#D1DBE8',        // Standard terminal body
    textMuted: '#7E8FA8',       // Secondary metrics / labels
    textDisabled: '#465369',

    // Faction allegiance accents
    imperiumGold: '#E5A93C',
    chaosCrimson: '#B71C1C',
    xenosGreen: '#2E7D32',
  },
  spacing: {
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 24,
    xxl: 32,
  },
  borderRadius: {
    sm: 4,
    md: 8,
    lg: 12,
    xl: 16,
    pill: 999,
  },
  typography: {
    headerSize: 22,
    titleSize: 18,
    bodySize: 15,
    captionSize: 12,
    metricSize: 28,
  },
};
