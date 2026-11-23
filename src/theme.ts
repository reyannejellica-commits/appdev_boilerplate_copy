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
  tint: string;          // Main glowing tint
  glow: string;          // Outer glow color
  borderGlow: string;    // Luminous highlight on edges
  secondary: string;     // Secondary dusty/darker shade
  softGlow: string;      // Soft accent highlight
  hex: string;           // Color swatch
  description: string;
}

export const COLOR_PRESETS: Record<ThemeColorKey, ColorPreset> = {
  rose: {
    id: 'rose',
    name: 'Rose Pink',
    tint: '#D982A5',
    glow: '#D982A5',
    borderGlow: '#F0BCD2',
    secondary: '#B87591',
    softGlow: '#E8A9C0',
    hex: '#D982A5',
    description: 'Neon rose-pink edge glow (Default)',
  },
  green: {
    id: 'green',
    name: 'Cyber Green',
    tint: '#22C55E',
    glow: '#22C55E',
    borderGlow: '#86EFAC',
    secondary: '#16A34A',
    softGlow: '#4ADE80',
    hex: '#22C55E',
    description: 'Electric neon green matrix glow',
  },
  blue: {
    id: 'blue',
    name: 'Solo Blue',
    tint: '#38BDF8',
    glow: '#38BDF8',
    borderGlow: '#BAE6FD',
    secondary: '#0284C7',
    softGlow: '#7DD3FC',
    hex: '#38BDF8',
    description: 'Solo hunter electric mana blue',
  },
  amber: {
    id: 'amber',
    name: 'Sunset Amber',
    tint: '#F59E0B',
    glow: '#F59E0B',
    borderGlow: '#FDE68A',
    secondary: '#D97706',
    softGlow: '#FBBF24',
    hex: '#F59E0B',
    description: 'Warm gold and radiant sunset amber',
  },
  purple: {
    id: 'purple',
    name: 'Royal Purple',
    tint: '#A855F7',
    glow: '#A855F7',
    borderGlow: '#E9D5FF',
    secondary: '#7E22CE',
    softGlow: '#C084FC',
    hex: '#A855F7',
    description: 'Mystic shadow purple monarch glow',
  },
  red: {
    id: 'red',
    name: 'Crimson Red',
    tint: '#EF4444',
    glow: '#EF4444',
    borderGlow: '#FECACA',
    secondary: '#DC2626',
    softGlow: '#F87171',
    hex: '#EF4444',
    description: 'High-intensity berserker crimson',
  },
  cyan: {
    id: 'cyan',
    name: 'Cyber Cyan',
    tint: '#06B6D4',
    glow: '#06B6D4',
    borderGlow: '#A5F3FC',
    secondary: '#0891B2',
    softGlow: '#22D3EE',
    hex: '#06B6D4',
    description: 'Futuristic aqua teal luminescence',
  },
  platinum: {
    id: 'platinum',
    name: 'Platinum Silver',
    tint: '#E2E8F0',
    glow: '#CBD5E1',
    borderGlow: '#FFFFFF',
    secondary: '#94A3B8',
    softGlow: '#F8FAFC',
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
    lightBg: '#FAF5FF',
    lightBgSec: '#F3E8FF',
    lightCardSec: '#F3E8FF',
    lightBorder: '#E9D5FF',
  },
  red: {
    darkBg: '#13070A',
    darkBgSec: '#1B0B0F',
    darkCard: '#220D13',
    darkCardSec: '#31131B',
    darkBorder: '#521E2C',
    lightBg: '#FFF5F5',
    lightBgSec: '#FEE2E2',
    lightCardSec: '#FEE2E2',
    lightBorder: '#FECACA',
  },
  blue: {
    darkBg: '#050E17',
    darkBgSec: '#081522',
    darkCard: '#0D2033',
    darkCardSec: '#132D48',
    darkBorder: '#1F4770',
    lightBg: '#F0F9FF',
    lightBgSec: '#E0F2FE',
    lightCardSec: '#E0F2FE',
    lightBorder: '#BAE6FD',
  },
  rose: {
    darkBg: '#08080B',
    darkBgSec: '#101014',
    darkCard: '#151116',
    darkCardSec: '#211820',
    darkBorder: '#35242D',
    lightBg: '#FFF5F8',
    lightBgSec: '#FAEDF2',
    lightCardSec: '#F7E4EC',
    lightBorder: '#E8CCD7',
  },
  amber: {
    darkBg: '#120D06',
    darkBgSec: '#1A1309',
    darkCard: '#241A0C',
    darkCardSec: '#332512',
    darkBorder: '#543D1D',
    lightBg: '#FFFDF0',
    lightBgSec: '#FEF3C7',
    lightCardSec: '#FEF3C7',
    lightBorder: '#FDE68A',
  },
  green: {
    darkBg: '#061309',
    darkBgSec: '#091C0E',
    darkCard: '#0D2613',
    darkCardSec: '#13381B',
    darkBorder: '#1F592B',
    lightBg: '#F2FDF5',
    lightBgSec: '#DCFCE7',
    lightCardSec: '#DCFCE7',
    lightBorder: '#86EFAC',
  },
  cyan: {
    darkBg: '#051114',
    darkBgSec: '#08191E',
    darkCard: '#0D262C',
    darkCardSec: '#13363F',
    darkBorder: '#1E5563',
    lightBg: '#F0FDFA',
    lightBgSec: '#CCFBF1',
    lightCardSec: '#CCFBF1',
    lightBorder: '#99F6E4',
  },
  platinum: {
    darkBg: '#0B0C0E',
    darkBgSec: '#121417',
    darkCard: '#181A1F',
    darkCardSec: '#22252C',
    darkBorder: '#363B47',
    lightBg: '#F8FAFC',
    lightBgSec: '#F1F5F9',
    lightCardSec: '#E2E8F0',
    lightBorder: '#CBD5E1',
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
      text: '#201217',
      textSecondary: '#7A626C',
      textDim: '#A8929C',
      border: tone.lightBorder,
      borderSubtle: tone.lightBgSec,
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
      buttonPrimaryText: '#FFFFFF',
      buttonSecondary: tone.lightCardSec,
      buttonDanger: '#E07885',
      danger: '#E07885',
      success: '#34B399',
      warning: p.softGlow,
      userBubble: p.tint,
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
