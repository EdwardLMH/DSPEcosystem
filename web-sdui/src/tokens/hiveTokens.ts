/**
 * HSBC HIVE Design Tokens — TypeScript
 * Generated from hive-tokens.json v2.1.0
 * Source of truth: hive-tokens/json/hive-tokens.json
 *
 * NOTE: Approximate HIVE-compatible structure based on HSBC brand guidelines.
 * Validate against official Figma HIVE library before production use.
 */

// ─── Color ────────────────────────────────────────────────────────────────────

export const hiveColor = {
  brand: {
    primary:      '#DB0011',
    primaryDark:  '#A6000D',
    primaryLight: '#F5E6E7',
    secondary:    '#000000',
    white:        '#FFFFFF',
  },
  semantic: {
    success:      '#007A4D',
    successLight: '#E6F4EF',
    warning:      '#B45309',
    warningLight: '#FEF3C7',
    error:        '#DB0011',
    errorLight:   '#F5E6E7',
    info:         '#005EB8',
    infoLight:    '#E6EFF9',
  },
  neutral: {
    0:   '#FFFFFF',
    50:  '#F8F8F8',
    100: '#F0F0F0',
    200: '#E0E0E0',
    300: '#CCCCCC',
    400: '#999999',
    500: '#767676',
    600: '#595959',
    700: '#3D3D3D',
    800: '#222222',
    900: '#000000',
  },
  jade: {
    base:    '#C9A84C',
    dark:    '#9A7A2E',
    light:   '#F7F0DC',
    surface: '#1D1D1B',
  },
  premier: {
    base:  '#005EB8',
    light: '#E6EFF9',
  },
} as const;

// ─── Typography ───────────────────────────────────────────────────────────────

export const hiveTypography = {
  fontFamily: {
    primary: 'UniversNext, Arial, Helvetica, sans-serif',
    mono:    'Courier New, Courier, monospace',
  },
  fontSize: {
    xs:   '11px',
    sm:   '13px',
    base: '16px',
    md:   '18px',
    lg:   '20px',
    xl:   '24px',
    '2xl': '28px',
    '3xl': '32px',
    '4xl': '40px',
    '5xl': '48px',
  },
  fontWeight: {
    regular:  400,
    medium:   500,
    semibold: 600,
    bold:     700,
  },
  lineHeight: {
    tight:   1.2,
    snug:    1.375,
    normal:  1.5,
    relaxed: 1.625,
  },
  letterSpacing: {
    tight:  '-0.02em',
    normal: '0em',
    wide:   '0.04em',
    wider:  '0.08em',
  },
} as const;

// ─── Spacing ──────────────────────────────────────────────────────────────────

export const hiveSpacing = {
  0:  '0px',
  1:  '4px',
  2:  '8px',
  3:  '12px',
  4:  '16px',
  5:  '20px',
  6:  '24px',
  8:  '32px',
  10: '40px',
  12: '48px',
  16: '64px',
  20: '80px',
} as const;

// ─── Border Radius ────────────────────────────────────────────────────────────

export const hiveBorderRadius = {
  none: '0px',
  sm:   '4px',
  base: '6px',
  md:   '8px',
  lg:   '12px',
  xl:   '16px',
  full: '9999px',
} as const;

// ─── Shadow ───────────────────────────────────────────────────────────────────

export const hiveShadow = {
  sm:     '0 1px 3px rgba(0,0,0,0.08), 0 1px 2px rgba(0,0,0,0.06)',
  base:   '0 4px 6px rgba(0,0,0,0.07), 0 2px 4px rgba(0,0,0,0.06)',
  md:     '0 8px 16px rgba(0,0,0,0.08), 0 4px 8px rgba(0,0,0,0.06)',
  lg:     '0 16px 32px rgba(0,0,0,0.10), 0 8px 16px rgba(0,0,0,0.06)',
  navBar: '0 -2px 8px rgba(0,0,0,0.06)',
} as const;

// ─── Motion ───────────────────────────────────────────────────────────────────

export const hiveMotion = {
  duration: {
    instant: '100ms',
    fast:    '150ms',
    base:    '200ms',
    slow:    '300ms',
    slower:  '500ms',
  },
  easing: {
    standard: 'cubic-bezier(0.4, 0, 0.2, 1)',
    enter:    'cubic-bezier(0.0, 0, 0.2, 1)',
    exit:     'cubic-bezier(0.4, 0, 1, 1)',
  },
} as const;

// ─── Component Tokens ─────────────────────────────────────────────────────────

export const hiveComponent = {
  button: {
    height:       '48px',
    heightSm:     '36px',
    paddingH:     '24px',
    paddingHSm:   '16px',
    borderRadius: hiveBorderRadius.base,
    fontWeight:   hiveTypography.fontWeight.semibold,
    fontSize:     hiveTypography.fontSize.base,
  },
  input: {
    height:            '52px',
    paddingH:          '16px',
    paddingV:          '14px',
    borderRadius:      hiveBorderRadius.base,
    fontSize:          hiveTypography.fontSize.base,
    borderColor:       hiveColor.neutral[300],
    borderColorFocus:  hiveColor.brand.primary,
    borderColorError:  hiveColor.semantic.error,
    bgColor:           hiveColor.brand.white,
    labelFontSize:     hiveTypography.fontSize.sm,
    labelFontWeight:   hiveTypography.fontWeight.semibold,
  },
  card: {
    borderRadius: hiveBorderRadius.md,
    padding:      hiveSpacing[6],
    shadow:       hiveShadow.base,
    bgColor:      hiveColor.brand.white,
  },
  progressBar: {
    height:       '4px',
    borderRadius: hiveBorderRadius.full,
    trackColor:   hiveColor.neutral[200],
    fillColor:    hiveColor.brand.primary,
  },
} as const;

// ─── Convenience re-export ────────────────────────────────────────────────────

export const hive = {
  color:        hiveColor,
  typography:   hiveTypography,
  spacing:      hiveSpacing,
  borderRadius: hiveBorderRadius,
  shadow:       hiveShadow,
  motion:       hiveMotion,
  component:    hiveComponent,
} as const;

export type HiveColor        = typeof hiveColor;
export type HiveSpacing      = typeof hiveSpacing;
export type HiveBorderRadius = typeof hiveBorderRadius;
