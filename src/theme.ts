import { useSettings } from '@/settings/SettingsContext';
import { type ThemeColorKey, type ThemeMode } from '@/settings/storage';

export type { ThemeColorKey };

export const FONTS = {
  regular: 'Poppins-Regular',
  medium: 'Poppins-Medium',
  semiBold: 'Poppins-SemiBold',
  bold: 'Poppins-Bold',
  extraBold: 'Poppins-ExtraBold',
} as const;

export interface Theme {
  background: string;
  backgroundSecondary: string;
  card: string;
  cardSecondary: string;
  surface: string;
  text: string;
  textSecondary: string;
  textDim: string;
  border: string;
  borderSubtle: string;
  borderRose: string;
  glow: string;
  tint: string;           // Primary accent tint
  tintDark: string;       // Secondary tone
  accentPrimary: string;  // Primary accent
  accentSecondary: string;// Secondary tone
  accentHighlight: string;// Soft accent glow
  accentAmber: string;    // Accent glow
  accentCyan: string;     // Soft highlight
  accentPurple: string;   // Accent tint
  accentGold: string;     // Soft highlight
  buttonPrimary: string;  // Accent tint
  buttonPrimaryText: string;
  buttonSecondary: string;
  buttonDanger: string;
  danger: string;
  success: string;
  warning: string;
  userBubble: string;
  userBubbleText: string;
  assistantBubble: string;
  inputBackground: string;
}

export interface ColorPreset {
  id: ThemeColorKey;
  name: string;
  tint: string;          // Main glowing tint (Dark Mode)
  tintLight: string;     // Calibrated high-contrast tint (Light Mode - WCAG AA compliant)
  glow: string;          // Outer glow color (Dark Mode)
  borderGlow: string;    // Luminous highlight on edges
  secondary: string;     // Secondary tone
  secondaryLight: string;// Secondary tone for light mode
  softGlow: string;      // Soft accent highlight
  softGlowLight: string; // Soft highlight for light mode
  hex: string;           // Color swatch
  description: string;
}

export const COLOR_PRESETS: Record<ThemeColorKey, ColorPreset> = {
  rose: {
    id: 'rose',
    name: 'Rose Pink',
    tint: '#D982A5',
    tintLight: '#BE185D',
    glow: '#D982A5',
    borderGlow: '#F0BCD2',
    secondary: '#B87591',
    secondaryLight: '#9D174D',
    softGlow: '#E8A9C0',
    softGlowLight: '#FCE7F3',
    hex: '#D982A5',
    description: 'Neon rose-pink edge glow (Default)',
  },
  green: {
    id: 'green',
    name: 'Cyber Green',
    tint: '#22C55E',
    tintLight: '#15803D',
    glow: '#22C55E',
    borderGlow: '#86EFAC',
    secondary: '#16A34A',
    secondaryLight: '#166534',
    softGlow: '#4ADE80',
    softGlowLight: '#DCFCE7',
    hex: '#22C55E',
    description: 'Electric neon green matrix glow',
  },
  blue: {
    id: 'blue',
    name: 'Solo Blue',
    tint: '#38BDF8',
    tintLight: '#0284C7',
    glow: '#38BDF8',
    borderGlow: '#BAE6FD',
    secondary: '#0284C7',
    secondaryLight: '#0369A1',
    softGlow: '#7DD3FC',
    softGlowLight: '#E0F2FE',
    hex: '#38BDF8',
    description: 'Solo hunter electric mana blue',
  },
  amber: {
    id: 'amber',
    name: 'Sunset Amber',
    tint: '#F59E0B',
    tintLight: '#B45309',
    glow: '#F59E0B',
    borderGlow: '#FDE68A',
    secondary: '#D97706',
    secondaryLight: '#92400E',
    softGlow: '#FBBF24',
    softGlowLight: '#FEF3C7',
    hex: '#F59E0B',
    description: 'Warm gold and radiant sunset amber',
  },
  purple: {
    id: 'purple',
    name: 'Royal Purple',
    tint: '#A855F7',
    tintLight: '#7E22CE',
    glow: '#A855F7',
    borderGlow: '#E9D5FF',
    secondary: '#7E22CE',
    secondaryLight: '#6B21A8',
    softGlow: '#C084FC',
    softGlowLight: '#F3E8FF',
    hex: '#A855F7',
    description: 'Mystic shadow purple monarch glow',
  },
  red: {
    id: 'red',
    name: 'Crimson Red',
    tint: '#EF4444',
    tintLight: '#DC2626',
    glow: '#EF4444',
    borderGlow: '#FECACA',
    secondary: '#DC2626',
    secondaryLight: '#B91C1C',
    softGlow: '#F87171',
    softGlowLight: '#FEE2E2',
    hex: '#EF4444',
    description: 'High-intensity berserker crimson',
  },
  cyan: {
    id: 'cyan',
    name: 'Cyber Cyan',
    tint: '#06B6D4',
    tintLight: '#0E7490',
    glow: '#06B6D4',
    borderGlow: '#A5F3FC',
    secondary: '#0891B2',
    secondaryLight: '#155E75',
    softGlow: '#22D3EE',
    softGlowLight: '#CCFBF1',
    hex: '#06B6D4',
    description: 'Futuristic aqua teal luminescence',
  },
  platinum: {
    id: 'platinum',
    name: 'Platinum Silver',
    tint: '#CBD5E1',
    tintLight: '#334155',
    glow: '#CBD5E1',
    borderGlow: '#FFFFFF',
    secondary: '#94A3B8',
    secondaryLight: '#1E293B',
    softGlow: '#F8FAFC',
    softGlowLight: '#E2E8F0',
    hex: '#CBD5E1',
    description: 'Clean monochrome titanium white',
  },
};

interface PaletteTone {
  darkBg: string;
  darkBgSec: string;
  darkCard: string;
  darkCardSec: string;
  darkBorder: string;
  lightBg: string;
  lightBgSec: string;
  lightCardSec: string;
  lightBorder: string;
}

const PALETTE_TONES: Record<ThemeColorKey, PaletteTone> = {
  purple: {
    darkBg: '#0C0814',
    darkBgSec: '#130C20',
    darkCard: '#1A112B',
    darkCardSec: '#24183C',
    darkBorder: '#3E2A66',
    lightBg: '#F9F8FA',
    lightBgSec: '#F1EFF5',
    lightCardSec: '#F5F3FA',
    lightBorder: '#E6E1EC',
  },
  red: {
    darkBg: '#13070A',
    darkBgSec: '#1B0B0F',
    darkCard: '#220D13',
    darkCardSec: '#31131B',
    darkBorder: '#521E2C',
    lightBg: '#FAF8F8',
    lightBgSec: '#F4EFEF',
    lightCardSec: '#F7F2F2',
    lightBorder: '#EBE1E1',
  },
  blue: {
    darkBg: '#050E17',
    darkBgSec: '#081522',
    darkCard: '#0D2033',
    darkCardSec: '#132D48',
    darkBorder: '#1F4770',
    lightBg: '#F8FAFC',
    lightBgSec: '#F1F5F9',
    lightCardSec: '#F1F5F9',
    lightBorder: '#E2E8F0',
  },
  rose: {
    darkBg: '#08080B',
    darkBgSec: '#101014',
    darkCard: '#151116',
    darkCardSec: '#211820',
    darkBorder: '#35242D',
    lightBg: '#FAF8F9',
    lightBgSec: '#F5EFF2',
    lightCardSec: '#F5EFF2',
    lightBorder: '#EBDDE3',
  },
  amber: {
    darkBg: '#120D06',
    darkBgSec: '#1A1309',
    darkCard: '#241A0C',
    darkCardSec: '#332512',
    darkBorder: '#543D1D',
    lightBg: '#FAF9F7',
    lightBgSec: '#F4F1EA',
    lightCardSec: '#F4F1EA',
    lightBorder: '#E8E3D8',
  },
  green: {
    darkBg: '#061309',
    darkBgSec: '#091C0E',
    darkCard: '#0D2613',
    darkCardSec: '#13381B',
    darkBorder: '#1F592B',
    lightBg: '#F7FAF8',
    lightBgSec: '#EEF4EF',
    lightCardSec: '#EEF4EF',
    lightBorder: '#DDE8DE',
  },
  cyan: {
    darkBg: '#051114',
    darkBgSec: '#08191E',
    darkCard: '#0D262C',
    darkCardSec: '#13363F',
    darkBorder: '#1E5563',
    lightBg: '#F7FAFA',
    lightBgSec: '#EEF4F5',
    lightCardSec: '#EEF4F5',
    lightBorder: '#DDE7E9',
  },
  platinum: {
    darkBg: '#0B0C0E',
    darkBgSec: '#121417',
    darkCard: '#181A1F',
    darkCardSec: '#22252C',
    darkBorder: '#363B47',
    lightBg: '#F8FAFC',
    lightBgSec: '#F1F5F9',
    lightCardSec: '#F1F5F9',
    lightBorder: '#E2E8F0',
  },
};

export function buildTheme(mode: ThemeMode = 'dark', colorKey: ThemeColorKey = 'rose'): Theme {
  const p = COLOR_PRESETS[colorKey] || COLOR_PRESETS.rose;
  const tone = PALETTE_TONES[colorKey] || PALETTE_TONES.rose;

  if (mode === 'light') {
    return {
      background: tone.lightBg,
      backgroundSecondary: tone.lightBgSec,
      card: '#FFFFFF',
      cardSecondary: tone.lightCardSec,
      surface: '#FFFFFF',
      text: '#0F172A',
      textSecondary: '#475569',
      textDim: '#64748B',
      border: tone.lightBorder,
      borderSubtle: tone.lightBgSec,
      borderRose: p.tintLight,
      glow: 'rgba(15, 23, 42, 0.08)',
      tint: p.tintLight,
      tintDark: p.secondaryLight,
      accentPrimary: p.tintLight,
      accentSecondary: p.secondaryLight,
      accentHighlight: p.softGlowLight,
      accentAmber: '#B45309',
      accentCyan: '#0E7490',
      accentPurple: '#7E22CE',
      accentGold: '#D97706',
      buttonPrimary: p.tintLight,
      buttonPrimaryText: '#FFFFFF',
      buttonSecondary: tone.lightCardSec,
      buttonDanger: '#DC2626',
      danger: '#DC2626',
      success: '#16A34A',
      warning: '#D97706',
      userBubble: p.tintLight,
      userBubbleText: '#FFFFFF',
      assistantBubble: tone.lightCardSec,
      inputBackground: '#FFFFFF',
    };
  }

  // Dark Mode
  return {
    background: tone.darkBg,
    backgroundSecondary: tone.darkBgSec,
    card: tone.darkCard,
    cardSecondary: tone.darkCardSec,
    surface: tone.darkCard,
    text: '#F1E8EC',
    textSecondary: '#B7AAB0',
    textDim: '#73646B',
    border: tone.darkBorder,
    borderSubtle: tone.darkBorder,
    borderRose: p.tint,
    glow: p.glow,
    tint: p.tint,
    tintDark: p.secondary,
    accentPrimary: p.tint,
    accentSecondary: p.secondary,
    accentHighlight: p.softGlow,
    accentAmber: p.tint,
    accentCyan: p.softGlow,
    accentPurple: p.tint,
    accentGold: p.softGlow,
    buttonPrimary: p.tint,
    buttonPrimaryText: '#08080B',
    buttonSecondary: tone.darkCardSec,
    buttonDanger: '#E07885',
    danger: '#E07885',
    success: '#34B399',
    warning: p.softGlow,
    userBubble: p.tint,
    userBubbleText: '#08080B',
    assistantBubble: tone.darkCard,
    inputBackground: tone.darkCardSec,
  };
}

export function useTheme(): Theme {
  const { settings } = useSettings();
  return buildTheme(settings?.theme || 'dark', settings?.colorScheme || 'rose');
}
