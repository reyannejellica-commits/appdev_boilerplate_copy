import type { Settings } from '../settings/storage';
import { createBuiltinCoachProvider } from './builtinCoach';
import { createGeminiProvider } from './gemini';
import { createLocalProvider, getModelStatus } from './local';
import type { ChatProvider } from './types';

/**
 * Pick the active provider from settings.
 * Adding a third provider = one new file in src/ai/ + one line here.
 */
export function getProvider(settings: Settings): ChatProvider {
  if (settings.provider === 'local') {
    const s = getModelStatus();
    const isModelReady = s.state === 'downloaded' || s.state === 'loading' || s.state === 'loaded';
    if (isModelReady) {
      return createLocalProvider({
        backend: settings.localBackend,
        isModelDownloaded: () => true,
      });
    }
    // Offline resilient: fallback to built-in sports science AI coach if local model is not downloaded
    return createBuiltinCoachProvider();
  }
  if (settings.provider === 'cloud' && settings.geminiApiKey) {
    return createGeminiProvider({
      apiKey: settings.geminiApiKey,
      model: settings.geminiModel,
    });
  }
  return createBuiltinCoachProvider();
}

export type { ChatMessage, ChatProvider, ContextUsage } from './types';
