export const DASHBOARD_PALETTE = {
    primary: '#3fc2fb',
    primaryDim: '#27b4ed',
    secondary: '#fe69ac',
    tertiary: '#e8ffc0',
    error: '#ff716c',
    surface: '#060e20',
    surfaceContainerLow: '#091328',
    surfaceContainer: '#0f1930',
    surfaceContainerHigh: '#141f38',
    surfaceContainerHighest: '#1a2640',
    onSurface: '#dee5ff',
    onSurfaceMuted: 'rgba(222, 229, 255, 0.5)',
} as const;

export type DashboardPaletteKey = keyof typeof DASHBOARD_PALETTE;
