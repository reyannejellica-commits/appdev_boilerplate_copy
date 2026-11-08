import { useSettings } from '@/settings/SettingsContext';

export interface Theme {
  background: string;
  card: string;
  surface: string;
  text: string;
  textSecondary: string;
  textDim: string;
  border: string;
  tint: string;
  accentCyan: string;
  accentGold: string;
  buttonPrimary: string;
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

const light: Theme = {
  background: '#F8F9FE',
  card: '#FFFFFF',
  surface: '#F1F3FB',
  text: '#0F172A',
  textSecondary: '#64748B',
  textDim: '#94A3B8',
  border: '#E2E8F0',
  tint: '#7C3AED',
  accentCyan: '#06B6D4',
  accentGold: '#F59E0B',
  buttonPrimary: '#7C3AED',
  buttonSecondary: '#EDE9FE',
  buttonDanger: '#EF4444',
  danger: '#EF4444',
  success: '#10B981',
  warning: '#F59E0B',
  userBubble: '#7C3AED',
  userBubbleText: '#FFFFFF',
  assistantBubble: '#F1F5F9',
  inputBackground: '#F8FAFC',
};

const dark: Theme = {
  background: '#090514', // Deep cosmic purple-black from Figma prototype
  card: '#16102B',       // Dark purple HUD card
  surface: '#1F173B',    // Elevated surface
  text: '#FFFFFF',       // Primary white text
  textSecondary: '#A78BFA', // Light purple secondary
  textDim: '#71717A',    // Muted grey
  border: '#2E2254',     // Subtle purple border
  tint: '#8B5CF6',       // Electric violet
  accentCyan: '#00F0FF', // Solo Leveling neon cyan
  accentGold: '#F59E0B', // Hunter streak gold
  buttonPrimary: '#8B5CF6',
  buttonSecondary: '#241B44',
  buttonDanger: '#EF4444',
  danger: '#F87171',
  success: '#10B981',
  warning: '#FBBF24',
  userBubble: '#7C3AED',
  userBubbleText: '#FFFFFF',
  assistantBubble: '#1B1435',
  inputBackground: '#130C24',
};

export function useTheme(): Theme {
  return useSettings().settings.theme === 'dark' ? dark : light;
}
