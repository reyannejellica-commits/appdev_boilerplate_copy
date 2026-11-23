import { useEffect, useState } from 'react';
import {
  getModelStatus,
  subscribeModelStatus,
  type ModelStatus,
} from '@/ai/local';
import { useNetwork } from '@/hooks/useNetwork';
import { useSettings } from '@/settings/SettingsContext';

export interface AiStatus {
  /** Why the active provider can't answer right now, or null if it can. */
  problem: string | null;
  modelStatus: ModelStatus;
  isOnline: boolean;
}

/** Shared "can the selected AI answer right now?" check for any screen. */
export function useAiStatus(): AiStatus {
  const { settings } = useSettings();
  const { isOnline } = useNetwork();
  const [modelStatus, setModelStatus] = useState<ModelStatus>(getModelStatus());

  useEffect(() => subscribeModelStatus(setModelStatus), []);

  let problem: string | null = null;
  if (settings.provider === 'cloud') {
    // If offline with cloud, builtin coach seamlessly answers
    problem = null;
  } else if (settings.provider === 'local') {
    if (modelStatus.state === 'loading') {
      problem = 'Loading the local model...';
    }
    // If model not downloaded, builtin coach answers with 0ms delay
  }

  return { problem, modelStatus, isOnline };
}
