import Storage from 'expo-sqlite/kv-store';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

export type ProviderId = 'cloud' | 'local' | 'builtin';
export type LocalBackend = 'auto' | 'npu' | 'gpu' | 'cpu';
export type ThemeMode = 'light' | 'dark';
export type ThemeColorKey =
  | 'rose'
  | 'green'
  | 'blue'
  | 'amber'
  | 'purple'
  | 'red'
  | 'cyan'
  | 'platinum';

export type LanguageCode =
  | 'en'
  | 'fil'
  | 'es'
  | 'ja'
  | 'ko'
  | 'de'
  | 'fr'
  | 'zh';

export type TimerSoundType = 'bell' | 'chime' | 'beep' | 'gong' | 'digital' | 'whistle';

const KEYS = {
  provider: 'provider',
  geminiModel: 'geminiModel',
  localBackend: 'localBackend',
  systemPrompt: 'systemPrompt',
  nickname: 'nickname',
  onboarded: 'onboarded',
  theme: 'theme',
  colorScheme: 'colorScheme',
  language: 'language',
  avatarId: 'avatarId',
  timerSoundEnabled: 'timerSoundEnabled',
  timerSoundType: 'timerSoundType',
  timerVibrate: 'timerVibrate',
  timerFlash: 'timerFlash',
  timerSpokenCues: 'timerSpokenCues',
  workoutWarmups: 'workoutWarmups',
  workoutRestTimer: 'workoutRestTimer',
  workoutWarmupRest: 'workoutWarmupRest',
  workoutExerciseRest: 'workoutExerciseRest',
  workoutRestPauseRest: 'workoutRestPauseRest',
  workoutEffortMetric: 'workoutEffortMetric',
  activeProgramId: 'activeProgramId',
  modelResumeData: 'modelResumeData',
} as const;

const API_KEY_KEY = 'gemini_api_key';

export const DEFAULT_SYSTEM_PROMPT =
  'You are PeakFit Coach, an elite personal trainer and sports scientist. You provide precise, scientific advice on exercise technique, progressive overload, workout programming, periodization, recovery, and macronutrient nutrition. Your tone is professional, encouraging, analytical, and focused on sustainable athletic results.';
/** 'auto' = pick the best model the API key can use (see pickBestModel). */
export const DEFAULT_GEMINI_MODEL = 'auto';

export interface Settings {
  provider: ProviderId;
  geminiApiKey: string;
  geminiModel: string;
  localBackend: LocalBackend;
  systemPrompt: string;
  nickname: string;
  onboarded: boolean;
  theme: ThemeMode;
  colorScheme: ThemeColorKey;
  language: LanguageCode;
  avatarId: string;
  timerSoundEnabled: boolean;
  timerSoundType: TimerSoundType;
  timerVibrate: boolean;
  timerFlash: boolean;
  timerSpokenCues: boolean;
  workoutWarmups: string;
  workoutRestTimer: string;
  workoutWarmupRest: string;
  workoutExerciseRest: string;
  workoutRestPauseRest: string;
  workoutEffortMetric: 'Off' | 'RIR' | 'RPE';
  activeProgramId: string;
}

export const DEFAULT_SETTINGS: Settings = {
  provider: 'builtin',
  geminiApiKey: '',
  geminiModel: DEFAULT_GEMINI_MODEL,
  localBackend: 'auto',
  systemPrompt: DEFAULT_SYSTEM_PROMPT,
  nickname: '',
  onboarded: false,
  theme: 'dark',
  colorScheme: 'rose',
  language: 'en',
  avatarId: 'jinwoo',
  timerSoundEnabled: true,
  timerSoundType: 'bell',
  timerVibrate: true,
  timerFlash: false,
  timerSpokenCues: false,
  workoutWarmups: 'Off',
  workoutRestTimer: '1:30',
  workoutWarmupRest: 'Like the work sets',
  workoutExerciseRest: 'Like the work sets',
  workoutRestPauseRest: '15s',
  workoutEffortMetric: 'RIR',
  activeProgramId: 'fullbody-monarch',
};

async function readSettingString(key: string): Promise<string | null> {
  if (Platform.OS === 'web') {
    try {
      if (typeof localStorage !== 'undefined') {
        return localStorage.getItem(`peakfit_${key}`);
      }
    } catch {}
    return null;
  }
  try {
    return await Storage.getItemAsync(key);
  } catch {
    try {
      return Storage.getItem(key);
    } catch {
      return null;
    }
  }
}

async function writeSettingString(key: string, value: string): Promise<void> {
  if (Platform.OS === 'web') {
    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(`peakfit_${key}`, value);
      }
    } catch {}
    return;
  }
  try {
    await Storage.setItemAsync(key, value);
  } catch {
    try {
      Storage.setItem(key, value);
    } catch (e) {
      console.warn(`writeSettingString failed for ${key}:`, e);
    }
  }
}

export async function loadSettings(): Promise<Settings> {
  try {
    const [
      provider,
      geminiModel,
      localBackend,
      systemPrompt,
      nickname,
      onboarded,
      theme,
      colorScheme,
      language,
      avatarId,
      timerSoundEnabled,
      timerSoundType,
      timerVibrate,
      timerFlash,
      timerSpokenCues,
      workoutWarmups,
      workoutRestTimer,
      workoutWarmupRest,
      workoutExerciseRest,
      workoutRestPauseRest,
      workoutEffortMetric,
      activeProgramId,
      apiKey,
    ] = await Promise.all([
      readSettingString(KEYS.provider),
      readSettingString(KEYS.geminiModel),
      readSettingString(KEYS.localBackend),
      readSettingString(KEYS.systemPrompt),
      readSettingString(KEYS.nickname),
      readSettingString(KEYS.onboarded),
      readSettingString(KEYS.theme),
      readSettingString(KEYS.colorScheme),
      readSettingString(KEYS.language),
      readSettingString(KEYS.avatarId),
      readSettingString(KEYS.timerSoundEnabled),
      readSettingString(KEYS.timerSoundType),
      readSettingString(KEYS.timerVibrate),
      readSettingString(KEYS.timerFlash),
      readSettingString(KEYS.timerSpokenCues),
      readSettingString(KEYS.workoutWarmups),
      readSettingString(KEYS.workoutRestTimer),
      readSettingString(KEYS.workoutWarmupRest),
      readSettingString(KEYS.workoutExerciseRest),
      readSettingString(KEYS.workoutRestPauseRest),
      readSettingString(KEYS.workoutEffortMetric),
      readSettingString(KEYS.activeProgramId),
      Platform.OS === 'web'
        ? Promise.resolve(typeof sessionStorage === 'undefined' ? null : sessionStorage.getItem(API_KEY_KEY))
        : SecureStore.getItemAsync(API_KEY_KEY).catch(() => null),
    ]);
    return {
      provider: provider === 'local' ? 'local' : provider === 'builtin' ? 'builtin' : 'cloud',
      geminiApiKey: apiKey || process.env.EXPO_PUBLIC_GEMINI_API_KEY || process.env.GEMINI_API_KEY || '',
      geminiModel: geminiModel || DEFAULT_GEMINI_MODEL,
      localBackend:
        localBackend === 'npu' || localBackend === 'gpu' || localBackend === 'cpu'
          ? localBackend
          : 'auto',
      systemPrompt: systemPrompt ?? DEFAULT_SYSTEM_PROMPT,
      nickname: nickname ?? '',
      onboarded: onboarded === 'true',
      theme: theme === 'light' ? 'light' : 'dark',
      colorScheme: (colorScheme as ThemeColorKey) || 'rose',
      language: (language as LanguageCode) || 'en',
      avatarId: avatarId || 'jinwoo',
      timerSoundEnabled: timerSoundEnabled !== 'false',
      timerSoundType: (timerSoundType as TimerSoundType) || 'bell',
      timerVibrate: timerVibrate !== 'false',
      timerFlash: timerFlash === 'true',
      timerSpokenCues: timerSpokenCues === 'true',
      workoutWarmups: workoutWarmups || 'Off',
      workoutRestTimer: workoutRestTimer || '1:30',
      workoutWarmupRest: workoutWarmupRest || 'Like the work sets',
      workoutExerciseRest: workoutExerciseRest || 'Like the work sets',
      workoutRestPauseRest: workoutRestPauseRest || '15s',
      workoutEffortMetric: (workoutEffortMetric as 'Off' | 'RIR' | 'RPE') || 'RIR',
      activeProgramId: activeProgramId || 'fullbody-monarch',
    };
  } catch (err) {
    console.warn('loadSettings failed, falling back to defaults:', err);
    return DEFAULT_SETTINGS;
  }
}

export async function saveSetting<K extends keyof Settings>(
  key: K,
  value: Settings[K]
): Promise<void> {
  try {
    if (key === 'geminiApiKey') {
      if (Platform.OS === 'web') {
        if (typeof sessionStorage !== 'undefined') {
          if (value) sessionStorage.setItem(API_KEY_KEY, value as string);
          else sessionStorage.removeItem(API_KEY_KEY);
        }
        return;
      }
      if (value) {
        await SecureStore.setItemAsync(API_KEY_KEY, value as string);
      } else {
        await SecureStore.deleteItemAsync(API_KEY_KEY);
      }
      return;
    }

    const storageKey = KEYS[key as keyof typeof KEYS];
    if (storageKey) {
      await writeSettingString(storageKey, String(value));
    }
  } catch (err) {
    console.warn(`saveSetting failed for ${key}:`, err);
  }
}

/** Erase every saved setting (including the API key). */
export async function resetSettings(): Promise<void> {
  if (Platform.OS === 'web') {
    try {
      if (typeof localStorage !== 'undefined') {
        Object.values(KEYS).forEach((k) => {
          localStorage.removeItem(`peakfit_${k}`);
        });
      }
    } catch {}
  } else {
    try {
      await Storage.clearAsync();
    } catch {}
  }
  await saveSetting('geminiApiKey', '');
}

/** System prompt sent to the AI, personalised with the user's nickname. */
export function buildSystemPrompt(settings: Settings): string {
  const name = settings.nickname.trim();
  return name
    ? `${settings.systemPrompt}\nThe user's name is ${name}. Address the user as Hunter ${name}.`.trim()
    : settings.systemPrompt;
}

export async function getModelResumeData(): Promise<string | null> {
  return Storage.getItem(KEYS.modelResumeData);
}

export async function setModelResumeData(data: string | null): Promise<void> {
  if (data) {
    await Storage.setItemAsync(KEYS.modelResumeData, data);
  } else {
    await Storage.removeItemAsync(KEYS.modelResumeData);
  }
}
