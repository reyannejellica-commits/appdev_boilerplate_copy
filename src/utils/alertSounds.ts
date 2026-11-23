import { Platform, Vibration } from 'react-native';
import { type TimerSoundType } from '@/settings/storage';
import { SOUND_DATA_URIS } from './soundDataUris';

export interface SoundOption {
  id: TimerSoundType;
  name: string;
  description: string;
  icon: string;
}

export const SOUND_OPTIONS: SoundOption[] = [
  { id: 'bell', name: 'Bell', description: 'Classic gym boxing bell tone', icon: 'notifications-outline' },
  { id: 'chime', name: 'Chime', description: 'Harmonic 3-note ascending chime', icon: 'musical-notes-outline' },
  { id: 'beep', name: 'Beep', description: 'Sharp triple digital timer beep', icon: 'radio-outline' },
  { id: 'gong', name: 'Gong', description: 'Deep resonant temple gong', icon: 'disc-outline' },
  { id: 'digital', name: 'Digital', description: 'Retro electronic training clock', icon: 'timer-outline' },
  { id: 'whistle', name: 'Whistle', description: 'Coach referee blast whistle', icon: 'volume-high-outline' },
];

let audioCtx: any = null;

function getAudioContext(): any {
  if (typeof window === 'undefined') return null;
  if (!audioCtx) {
    const AudioContextClass = (window as any).AudioContext || (window as any).webkitAudioContext;
    if (AudioContextClass) {
      audioCtx = new AudioContextClass();
    }
  }
  if (audioCtx && audioCtx.state === 'suspended') {
    void audioCtx.resume();
  }
  return audioCtx;
}

/** UI tap audio is disabled as per user specification */
export function playClickSound(): void {
  // Silent - click sounds disabled across all UI elements
}

/** Synthesize high-quality offline alerts using instant Audio playback */
export function playAlertSound(soundType: TimerSoundType = 'bell'): void {
  try {
    const uri = SOUND_DATA_URIS[soundType] || SOUND_DATA_URIS.bell;
    if (typeof window !== 'undefined' && typeof window.Audio !== 'undefined' && uri) {
      const audio = new window.Audio(uri);
      audio.volume = 0.95;
      void audio.play().catch(() => {
        playWebAudioAlert(soundType);
      });
      return;
    }
  } catch {
    playWebAudioAlert(soundType);
  }

  try {
    Vibration.vibrate(200);
  } catch {}
}

function playWebAudioAlert(soundType: TimerSoundType): void {
  try {
    const ctx = getAudioContext();
    if (!ctx) {
      Vibration.vibrate(200);
      return;
    }

    const now = ctx.currentTime;

    switch (soundType) {
      case 'bell': {
        const osc1 = ctx.createOscillator();
        const osc2 = ctx.createOscillator();
        const gain = ctx.createGain();

        osc1.type = 'sine';
        osc1.frequency.setValueAtTime(880, now);
        osc2.type = 'triangle';
        osc2.frequency.setValueAtTime(1760, now);

        gain.gain.setValueAtTime(0.5, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 1.0);

        osc1.connect(gain);
        osc2.connect(gain);
        gain.connect(ctx.destination);

        osc1.start(now);
        osc2.start(now);
        osc1.stop(now + 1.0);
        osc2.stop(now + 1.0);
        break;
      }

      case 'chime': {
        const notes = [523.25, 659.25, 783.99];
        notes.forEach((freq, idx) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          const start = now + idx * 0.12;

          osc.type = 'sine';
          osc.frequency.setValueAtTime(freq, start);

          gain.gain.setValueAtTime(0, start);
          gain.gain.linearRampToValueAtTime(0.4, start + 0.02);
          gain.gain.exponentialRampToValueAtTime(0.001, start + 0.6);

          osc.connect(gain);
          gain.connect(ctx.destination);

          osc.start(start);
          osc.stop(start + 0.65);
        });
        break;
      }

      case 'beep': {
        for (let i = 0; i < 3; i++) {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          const start = now + i * 0.14;

          osc.type = 'square';
          osc.frequency.setValueAtTime(1046.5, start);

          gain.gain.setValueAtTime(0.2, start);
          gain.gain.setValueAtTime(0, start + 0.07);

          osc.connect(gain);
          gain.connect(ctx.destination);

          osc.start(start);
          osc.stop(start + 0.08);
        }
        break;
      }

      case 'gong': {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(220, now);

        gain.gain.setValueAtTime(0.6, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 1.8);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now);
        osc.stop(now + 1.8);
        break;
      }

      case 'digital': {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(800, now);
        osc.frequency.setValueAtTime(1200, now + 0.08);

        gain.gain.setValueAtTime(0.25, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.25);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now);
        osc.stop(now + 0.25);
        break;
      }

      case 'whistle': {
        const osc1 = ctx.createOscillator();
        const osc2 = ctx.createOscillator();
        const gain = ctx.createGain();

        osc1.type = 'triangle';
        osc1.frequency.setValueAtTime(2600, now);
        osc2.type = 'sine';
        osc2.frequency.setValueAtTime(2850, now);

        gain.gain.setValueAtTime(0.4, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.45);

        osc1.connect(gain);
        osc2.connect(gain);
        gain.connect(ctx.destination);

        osc1.start(now);
        osc2.start(now);
        osc1.stop(now + 0.45);
        osc2.stop(now + 0.45);
        break;
      }
    }
  } catch (e) {
    console.warn('Audio alert playback error:', e);
  }
}

/** Spoken cues text-to-speech */
export function playSpokenCue(text = 'Rest is over, begin your next set!', language = 'en'): void {
  try {
    if (Platform.OS === 'web' && typeof window !== 'undefined' && 'speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = language === 'fil' ? 'fil-PH' : language === 'es' ? 'es-ES' : 'en-US';
      utterance.rate = 1.05;
      window.speechSynthesis.speak(utterance);
    }
  } catch (e) {
    console.warn('Speech synthesis error:', e);
  }
}

/** Trigger the full workout rest alert based on user preferences */
export function triggerRestFinishedAlert(settings: {
  timerSoundEnabled?: boolean;
  timerSoundType?: TimerSoundType;
  timerVibrate?: boolean;
  timerSpokenCues?: boolean;
  language?: string;
}): void {
  if (settings.timerSoundEnabled !== false) {
    playAlertSound(settings.timerSoundType || 'bell');
  }

  if (settings.timerVibrate !== false) {
    try {
      Vibration.vibrate([0, 350, 150, 350]);
    } catch {}
  }

  if (settings.timerSpokenCues) {
    const cueMsg =
      settings.language === 'fil'
        ? 'Tapos na ang pahinga, simulan ang susunod na set!'
        : 'Rest is over, begin your next set!';
    playSpokenCue(cueMsg, settings.language);
  }
}
