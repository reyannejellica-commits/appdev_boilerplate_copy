import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  Easing,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import Svg, { Defs, RadialGradient, Rect, Stop } from 'react-native-svg';
import { PrimeAwakeningModal } from '@/components/PrimeAwakeningModal';
import { NotificationBellButton } from '@/components/NotificationModal';
import { SmoothPressable } from '@/components/SmoothPressable';
import {
  clearCardioHistory,
  deleteCardioLog,
  getCardioHistory,
  getHunterProfile,
  saveCardioSession,
  type CardioLog,
  type HunterProfile,
} from '@/db/hunter';
import { useTranslation } from '@/i18n';
import { useSettings } from '@/settings/SettingsContext';
import { useTheme } from '@/theme';
import { playAlertSound, playClickSound } from '@/utils/alertSounds';
import { confirmAction, showMessage } from '@/utils/confirm';
import { getAvatarById } from '@/utils/profileOptions';
import { CardioInsightsModal, type CardioInsightsData } from '@/components/CardioInsightsModal';
import { scheduleDailyWorkoutReminder, scheduleRelativeReminder } from '@/utils/notifications';

type CardioActivity = 'jogging' | 'cycling' | 'jumprope' | 'hiit';

interface ActivityMeta {
  id: CardioActivity;
  label: string;
  iconName: keyof typeof Ionicons.glyphMap;
  speedKmH: number; // For live distance calculation
  calMultiplier: number;
}

const ACTIVITIES: ActivityMeta[] = [
  { id: 'jogging', label: 'Jogging', iconName: 'walk-outline', speedKmH: 9.5, calMultiplier: 65 },
  { id: 'cycling', label: 'Cycling', iconName: 'bicycle-outline', speedKmH: 20.0, calMultiplier: 45 },
  { id: 'jumprope', label: 'Jump Rope', iconName: 'pulse-outline', speedKmH: 7.0, calMultiplier: 85 },
  { id: 'hiit', label: 'HIIT Sprint', iconName: 'flash-outline', speedKmH: 14.0, calMultiplier: 95 },
];

export type BeatChallengeType = 'sprint' | 'jumprope' | 'burpees' | 'plank' | 'cycling' | 'shadowboxing';

export interface ChallengePreset {
  id: string;
  label: string;
  target: number;
  timeLimitSec: number;
  coins: number;
  exp: number;
}

export interface BeatChallengeMeta {
  id: BeatChallengeType;
  label: string;
  iconName: keyof typeof Ionicons.glyphMap;
  unit: string;
  defaultTarget: number;
  defaultTimeLimitSec: number;
  isRepBased: boolean;
  speedKmH?: number;
  presets: ChallengePreset[];
}

export const BEAT_CHALLENGES: BeatChallengeMeta[] = [
  {
    id: 'sprint',
    label: 'Speed Sprint',
    iconName: 'flash',
    unit: 'KM',
    defaultTarget: 1.0,
    defaultTimeLimitSec: 300,
    isRepBased: false,
    speedKmH: 14.5,
    presets: [
      { id: 'sprint_1k', label: '1.0 KM (5 Min)', target: 1.0, timeLimitSec: 300, coins: 20, exp: 40 },
      { id: 'sprint_3k', label: '3.0 KM (12 Min)', target: 3.0, timeLimitSec: 720, coins: 35, exp: 80 },
      { id: 'sprint_5k', label: '5.0 KM (22 Min)', target: 5.0, timeLimitSec: 1320, coins: 60, exp: 140 },
    ],
  },
  {
    id: 'jumprope',
    label: 'Jump Rope Blitz',
    iconName: 'pulse',
    unit: 'SKIPS',
    defaultTarget: 300,
    defaultTimeLimitSec: 180,
    isRepBased: true,
    presets: [
      { id: 'rope_300', label: '300 Skips (3 Min)', target: 300, timeLimitSec: 180, coins: 15, exp: 35 },
      { id: 'rope_500', label: '500 Skips (5 Min)', target: 500, timeLimitSec: 300, coins: 25, exp: 60 },
      { id: 'rope_1000', label: '1,000 Skips (9 Min)', target: 1000, timeLimitSec: 540, coins: 50, exp: 120 },
    ],
  },
  {
    id: 'burpees',
    label: 'Burpee Burner',
    iconName: 'flame',
    unit: 'REPS',
    defaultTarget: 25,
    defaultTimeLimitSec: 180,
    isRepBased: true,
    presets: [
      { id: 'burpee_25', label: '25 Reps (3 Min)', target: 25, timeLimitSec: 180, coins: 20, exp: 45 },
      { id: 'burpee_50', label: '50 Reps (6 Min)', target: 50, timeLimitSec: 360, coins: 40, exp: 90 },
      { id: 'burpee_75', label: '75 Reps (10 Min)', target: 75, timeLimitSec: 600, coins: 60, exp: 150 },
    ],
  },
  {
    id: 'plank',
    label: 'Plank Fortress',
    iconName: 'shield',
    unit: 'SEC',
    defaultTarget: 60,
    defaultTimeLimitSec: 60,
    isRepBased: false,
    presets: [
      { id: 'plank_60', label: '60s Hold (1 Min)', target: 60, timeLimitSec: 60, coins: 15, exp: 30 },
      { id: 'plank_120', label: '120s Hold (2 Min)', target: 120, timeLimitSec: 120, coins: 30, exp: 70 },
      { id: 'plank_180', label: '180s Hold (3 Min)', target: 180, timeLimitSec: 180, coins: 50, exp: 110 },
    ],
  },
  {
    id: 'cycling',
    label: 'Cycling Velocity',
    iconName: 'bicycle',
    unit: 'KM',
    defaultTarget: 3.0,
    defaultTimeLimitSec: 360,
    isRepBased: false,
    speedKmH: 26.0,
    presets: [
      { id: 'cycle_3k', label: '3.0 KM (6 Min)', target: 3.0, timeLimitSec: 360, coins: 20, exp: 40 },
      { id: 'cycle_5k', label: '5.0 KM (10 Min)', target: 5.0, timeLimitSec: 600, coins: 35, exp: 75 },
      { id: 'cycle_10k', label: '10.0 KM (18 Min)', target: 10.0, timeLimitSec: 1080, coins: 55, exp: 130 },
    ],
  },
  {
    id: 'shadowboxing',
    label: 'Shadow Boxing',
    iconName: 'fitness',
    unit: 'ROUNDS',
    defaultTarget: 3,
    defaultTimeLimitSec: 540,
    isRepBased: true,
    presets: [
      { id: 'box_2r', label: '2 Rounds (6 Min)', target: 2, timeLimitSec: 360, coins: 25, exp: 50 },
      { id: 'box_3r', label: '3 Rounds (9 Min)', target: 3, timeLimitSec: 540, coins: 40, exp: 85 },
      { id: 'box_5r', label: '5 Rounds (15 Min)', target: 5, timeLimitSec: 900, coins: 70, exp: 160 },
    ],
  },
];

export default function CardioScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { settings } = useSettings();
  const { t } = useTranslation();

  const [profile, setProfile] = useState<HunterProfile | null>(null);
  const [selectedActivity, setSelectedActivity] = useState<CardioActivity>('jogging');
  const [awakeningOpen, setAwakeningOpen] = useState(false);

  // Main Protocol State
  const [seconds, setSeconds] = useState(0);
  const [isActive, setIsActive] = useState(false);
  const [distanceKm, setDistanceKm] = useState(0);
  const [history, setHistory] = useState<CardioLog[]>([]);

  // Beat the Clock Challenge State
  const [selectedChallengeType, setSelectedChallengeType] = useState<BeatChallengeType>('sprint');
  const [selectedPresetId, setSelectedPresetId] = useState<string>('sprint_1k');
  const [challengeTargetInput, setChallengeTargetInput] = useState<string>('1.0');
  const [challengeTimeLimitMinInput, setChallengeTimeLimitMinInput] = useState<string>('5');
  const [challengeActive, setChallengeActive] = useState(false);
  const [challengeSecondsLeft, setChallengeSecondsLeft] = useState(300);
  const [challengeTotalSeconds, setChallengeTotalSeconds] = useState(300);
  const [challengeCurrentProgress, setChallengeCurrentProgress] = useState(0);

  // Performance Insights Modal State
  const [insightsModalVisible, setInsightsModalVisible] = useState(false);
  const [insightsData, setInsightsData] = useState<CardioInsightsData | null>(null);

  // Scheduled Workout Alarm State
  const [reminderArmed, setReminderArmed] = useState(false);

  const challengeStateRef = useRef({
    active: false,
    secondsLeft: 300,
    totalSeconds: 300,
    currentProgress: 0,
    target: 1.0,
    type: 'sprint' as BeatChallengeType,
    isRepBased: false,
    speedKmH: 14.5,
  });

  const currentAvatar = useMemo(() => getAvatarById(settings.avatarId), [settings.avatarId]);
  const activeActivityMeta = useMemo(
    () => ACTIVITIES.find((a) => a.id === selectedActivity) || ACTIVITIES[0],
    [selectedActivity]
  );
  const activeChallengeMeta = useMemo(
    () => BEAT_CHALLENGES.find((c) => c.id === selectedChallengeType) || BEAT_CHALLENGES[0],
    [selectedChallengeType]
  );

  // Radar echo pulse animations for Satellite Standby & GPS
  const [echoAnim1] = useState(() => new Animated.Value(0));
  const [echoAnim2] = useState(() => new Animated.Value(0));
  const [echoAnim3] = useState(() => new Animated.Value(0));

  // HIIT challenge circular spinning & pulsing animations
  const [hiitSpinAnim] = useState(() => new Animated.Value(0));
  const [hiitPulseAnim] = useState(() => new Animated.Value(0));

  useEffect(() => {
    const createEchoLoop = (anim: Animated.Value, delay: number) => {
      return Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(anim, {
            toValue: 1,
            duration: 2400,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
          }),
          Animated.timing(anim, {
            toValue: 0,
            duration: 0,
            useNativeDriver: true,
          }),
        ])
      );
    };

    const l1 = createEchoLoop(echoAnim1, 0);
    const l2 = createEchoLoop(echoAnim2, 800);
    const l3 = createEchoLoop(echoAnim3, 1600);

    const spinLoop = Animated.loop(
      Animated.timing(hiitSpinAnim, {
        toValue: 1,
        duration: 4000,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    );

    const hiitPulse = Animated.loop(
      Animated.sequence([
        Animated.timing(hiitPulseAnim, {
          toValue: 1,
          duration: 1800,
          easing: Easing.out(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(hiitPulseAnim, {
          toValue: 0,
          duration: 0,
          useNativeDriver: true,
        }),
      ])
    );

    l1.start();
    l2.start();
    l3.start();
    spinLoop.start();
    hiitPulse.start();

    return () => {
      l1.stop();
      l2.stop();
      l3.stop();
      spinLoop.stop();
      hiitPulse.stop();
    };
  }, [echoAnim1, echoAnim2, echoAnim3, hiitSpinAnim, hiitPulseAnim]);

  const loadData = useCallback(async () => {
    try {
      const [hProf, logs] = await Promise.all([
        getHunterProfile(settings.nickname || 'Hunter'),
        getCardioHistory(15),
      ]);
      setProfile(hProf);
      setHistory(logs);
    } catch (e) {
      console.warn('Failed to load cardio data:', e);
    }
  }, [settings.nickname]);

  useEffect(() => {
    let isMounted = true;
    (async () => {
      try {
        const [hProf, logs] = await Promise.all([
          getHunterProfile(settings.nickname || 'Hunter'),
          getCardioHistory(15),
        ]);
        if (isMounted) {
          setProfile(hProf);
          setHistory(logs);
        }
      } catch (e) {
        console.warn('Failed to load cardio data:', e);
      }
    })();
    return () => {
      isMounted = false;
    };
  }, [settings.nickname]);

  const formatStopwatch = useCallback((totalSec: number) => {
    const mins = Math.floor(totalSec / 60);
    const secs = totalSec % 60;
    const hrs = Math.floor(mins / 60);
    const remMins = mins % 60;
    if (hrs > 0) {
      return `${hrs}:${String(remMins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
    }
    return `${String(remMins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  }, []);

  const finishChallengeSuccess = useCallback(
    async (finalProgress: number, totalSec: number, secLeft: number, tgt: number) => {
      challengeStateRef.current.active = false;
      setChallengeActive(false);

      // Professional audio sequence: Ringing gym bell then reward chime!
      playAlertSound('bell');
      setTimeout(() => {
        playAlertSound('chime');
      }, 350);

      const elapsedSec = Math.max(1, totalSec - secLeft);
      const activeMeta = BEAT_CHALLENGES.find((c) => c.id === selectedChallengeType) || BEAT_CHALLENGES[0];
      const activePreset = activeMeta.presets.find((p) => p.id === selectedPresetId) || activeMeta.presets[0];

      const cals = Math.round(
        activeMeta.unit === 'KM'
          ? finalProgress * 75
          : activeMeta.unit === 'SKIPS'
          ? finalProgress * 0.16
          : finalProgress * 1.5 + (elapsedSec / 60) * 9
      );

      const distanceToLog = activeMeta.unit === 'KM' ? finalProgress : +(finalProgress / 100).toFixed(2);

      try {
        await saveCardioSession(elapsedSec, distanceToLog, cals);
        await loadData();
      } catch (e) {
        console.warn('Failed to save challenge session:', e);
      }

      setInsightsData({
        challengeTitle: `${activeMeta.label} Challenge`,
        isSuccess: true,
        timeElapsedSec: elapsedSec,
        timeLimitSec: totalSec,
        outputValue: finalProgress,
        outputUnit: activeMeta.unit,
        targetValue: tgt,
        caloriesBurned: cals,
        coinsEarned: activePreset?.coins ?? 25,
        expEarned: activePreset?.exp ?? 50,
        aiInsightTip: `Phenomenal threshold pacing! Completing ${tgt} ${activeMeta.unit} in ${formatStopwatch(elapsedSec)} reinforces neurological muscular endurance and increases VO2 max oxygen delivery by 3.8%.`,
      });
      setInsightsModalVisible(true);
    },
    [formatStopwatch, loadData, selectedChallengeType, selectedPresetId]
  );

  const finishChallengeTimeout = useCallback(
    async (finalProgress: number, totalSec: number, tgt: number) => {
      challengeStateRef.current.active = false;
      setChallengeActive(false);

      // Referee whistle for time's up
      playAlertSound('whistle');

      const activeMeta = BEAT_CHALLENGES.find((c) => c.id === selectedChallengeType) || BEAT_CHALLENGES[0];
      const cals = Math.round(
        activeMeta.unit === 'KM'
          ? finalProgress * 65
          : activeMeta.unit === 'SKIPS'
          ? finalProgress * 0.14
          : finalProgress * 1.2 + (totalSec / 60) * 8
      );

      const distanceToLog = activeMeta.unit === 'KM' ? finalProgress : +(finalProgress / 100).toFixed(2);

      if (finalProgress > 0) {
        try {
          await saveCardioSession(totalSec, distanceToLog, cals);
          await loadData();
        } catch (e) {
          console.warn('Failed to save challenge session:', e);
        }
      }

      setInsightsData({
        challengeTitle: `${activeMeta.label} Challenge`,
        isSuccess: false,
        timeElapsedSec: totalSec,
        timeLimitSec: totalSec,
        outputValue: finalProgress,
        outputUnit: activeMeta.unit,
        targetValue: tgt,
        caloriesBurned: cals,
        coinsEarned: 5,
        expEarned: 15,
        aiInsightTip: `High exertion detected. You sustained ${finalProgress.toFixed(activeMeta.unit === 'KM' ? 2 : 0)} ${activeMeta.unit} before time expired. Cellular ATP-CP recovery protocol recommended with 500ml hydration.`,
      });
      setInsightsModalVisible(true);
    },
    [loadData, selectedChallengeType]
  );

  // Main Protocol Timer
  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | null = null;
    if (isActive) {
      interval = setInterval(() => {
        setSeconds((s) => s + 1);
        const ratePerSec = activeActivityMeta.speedKmH / 3600;
        setDistanceKm((prev) => +(prev + ratePerSec).toFixed(3));
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isActive, activeActivityMeta]);

  // Beat the Clock Challenge Timer with Audio Ticks
  useEffect(() => {
    if (!challengeActive) return;

    const interval = setInterval(() => {
      const state = challengeStateRef.current;
      if (!state.active) return;

      const newSecondsLeft = state.secondsLeft - 1;

      // Professional countdown beeps during the final 5 seconds!
      if (newSecondsLeft <= 5 && newSecondsLeft > 0) {
        playAlertSound('beep');
      }

      let newProgress = state.currentProgress;
      if (state.type === 'plank') {
        newProgress = state.currentProgress + 1;
      } else if (!state.isRepBased) {
        const ratePerSec = (state.speedKmH || 14.5) / 3600;
        newProgress = +(state.currentProgress + ratePerSec).toFixed(3);
      }

      state.secondsLeft = Math.max(0, newSecondsLeft);
      state.currentProgress = newProgress;

      setChallengeSecondsLeft(state.secondsLeft);
      setChallengeCurrentProgress(newProgress);

      if (newProgress >= state.target) {
        clearInterval(interval);
        void finishChallengeSuccess(newProgress, state.totalSeconds, state.secondsLeft, state.target);
      } else if (newSecondsLeft <= 0) {
        clearInterval(interval);
        void finishChallengeTimeout(newProgress, state.totalSeconds, state.target);
      }
    }, 1000);

    return () => {
      clearInterval(interval);
    };
  }, [challengeActive, finishChallengeSuccess, finishChallengeTimeout]);

  const caloriesBurned = Math.round(
    distanceKm * activeActivityMeta.calMultiplier + (seconds / 60) * 8
  );

  const paceStr =
    distanceKm > 0
      ? (() => {
          const paceTotalSec = Math.round(seconds / distanceKm);
          const pMins = Math.floor(paceTotalSec / 60);
          const pSecs = paceTotalSec % 60;
          return `${String(pMins).padStart(2, '0')}'${String(pSecs).padStart(2, '0')}"`;
        })()
      : "05'30\"";

  // Main protocol actions
  const handleToggleProtocol = () => {
    playClickSound();
    setIsActive(!isActive);
  };

  const handleFinishProtocol = async () => {
    if (seconds === 0 && distanceKm === 0) {
      showMessage('No Session Recorded', 'Start the protocol and record some time or distance before saving.');
      return;
    }

    const savedDist = distanceKm;
    const savedSec = seconds;
    const savedCal = Math.max(1, caloriesBurned);
    const actLabel = activeActivityMeta.label;

    setIsActive(false);
    setSeconds(0);
    setDistanceKm(0);

    // Optimistically prepend to history immediately so the UI reacts instantly!
    const optimisticLog: CardioLog = {
      id: `local-${Date.now()}`,
      duration_seconds: savedSec,
      distance_km: savedDist,
      calories: savedCal,
      date: new Date().toISOString().split('T')[0],
    };
    setHistory((prev) => [optimisticLog, ...prev]);

    try {
      await saveCardioSession(savedSec, savedDist, savedCal);
      playAlertSound('bell');
    } catch (e) {
      console.warn('Failed to save cardio session:', e);
    }

    showMessage(
      'Session Saved!',
      `Logged ${savedDist.toFixed(2)} KM of ${actLabel} in ${formatStopwatch(savedSec)} (${savedCal} kcal burned). Great work, Hunter!`
    );

    await loadData();
  };

  const handleResetProtocol = () => {
    playClickSound();
    setIsActive(false);
    setSeconds(0);
    setDistanceKm(0);
  };

  // Switch Challenge Category
  const handleSelectChallengeType = (typeId: BeatChallengeType) => {
    if (challengeActive) return;
    playClickSound();
    setSelectedChallengeType(typeId);
    const meta = BEAT_CHALLENGES.find((c) => c.id === typeId) || BEAT_CHALLENGES[0];
    const firstPreset = meta.presets[0];
    setSelectedPresetId(firstPreset.id);
    setChallengeTargetInput(String(firstPreset.target));
    setChallengeTimeLimitMinInput(String(Math.round(firstPreset.timeLimitSec / 60)));
  };

  // Select Quick Preset
  const handleSelectPreset = (preset: ChallengePreset) => {
    if (challengeActive) return;
    playClickSound();
    setSelectedPresetId(preset.id);
    setChallengeTargetInput(String(preset.target));
    setChallengeTimeLimitMinInput(String(Math.round(preset.timeLimitSec / 60)));
  };

  // Add Reps for Rep-Based Challenges (Jump Rope, Burpees, Boxing)
  const handleAddReps = (count: number) => {
    if (!challengeActive) return;
    playClickSound();
    const state = challengeStateRef.current;
    const newProgress = state.currentProgress + count;
    state.currentProgress = newProgress;
    setChallengeCurrentProgress(newProgress);

    if (newProgress >= state.target) {
      void finishChallengeSuccess(newProgress, state.totalSeconds, state.secondsLeft, state.target);
    }
  };

  // Start Challenge
  const handleStartChallenge = () => {
    const meta = BEAT_CHALLENGES.find((c) => c.id === selectedChallengeType) || BEAT_CHALLENGES[0];
    const target = parseFloat(challengeTargetInput);
    const limitMin = parseFloat(challengeTimeLimitMinInput);

    if (!target || isNaN(target) || target <= 0 || !limitMin || isNaN(limitMin) || limitMin <= 0) {
      showMessage('Invalid Target', `Please enter a valid target ${meta.unit} and time limit (MIN).`);
      return;
    }

    playAlertSound('digital');
    const totalSec = Math.round(limitMin * 60);
    challengeStateRef.current = {
      active: true,
      secondsLeft: totalSec,
      totalSeconds: totalSec,
      currentProgress: 0,
      target,
      type: meta.id,
      isRepBased: meta.isRepBased,
      speedKmH: meta.speedKmH ?? 14.5,
    };
    setChallengeTotalSeconds(totalSec);
    setChallengeSecondsLeft(totalSec);
    setChallengeCurrentProgress(0);
    setChallengeActive(true);
  };

  // Abort Challenge
  const handleAbortChallenge = () => {
    playAlertSound('whistle');
    confirmAction(
      'Abort Challenge?',
      'Are you sure you want to cancel this timed challenge?',
      'Abort',
      () => {
        challengeStateRef.current.active = false;
        setChallengeActive(false);
        setChallengeCurrentProgress(0);
      }
    );
  };

  // Toggle Daily Workout Reminder Alarm
  const handleToggleDailyReminder = async () => {
    if (reminderArmed) {
      setReminderArmed(false);
      showMessage('Alarm Deactivated', 'Daily workout notification reminders have been cleared.');
      return;
    }

    const streak = profile?.streak_days ?? 1;
    const notifId = await scheduleDailyWorkoutReminder(streak, 8, 0);
    if (notifId) {
      setReminderArmed(true);
      playAlertSound('bell');
      showMessage(
        'Daily Workout Alarm Armed! ⏰',
        `Naka-set na sa 8:00 AM araw-araw!\n\nKahit sarado ang PeakFit app, makakatanggap ka ng push alarm: "⚡ Day ${streak + 1} na pala! Need mo na mag-exercise!"`
      );
    } else {
      showMessage(
        'Notification Permission',
        'Please allow notifications in your device settings to receive offline workout reminder alarms.'
      );
    }
  };

  // Test Notification (5s)
  const handleTestNotification = async () => {
    playClickSound();
    const streak = profile?.streak_days ?? 1;
    const notifId = await scheduleRelativeReminder(
      5,
      `⚡ Day ${streak + 1} na pala! Need mo na mag-exercise!`,
      `PeakFit Protocol: Oras na para sa iyong workout! Protektahan ang iyong Hunter Streak ngayon.`
    );
    if (notifId) {
      showMessage(
        'Test Alarm Scheduled (5s)',
        'I-minimize mo ang app ngayon. Makalipas ang 5 segundo, tutunog at lalabas ang notification sa status bar!'
      );
    } else {
      showMessage('Notification Permission', 'Please grant notification permission on your device.');
    }
  };

  const handleDeleteLog = (logId: string) => {
    confirmAction(
      'Delete Cardio Session?',
      'Are you sure you want to remove this logged cardio session from your history?',
      'Delete',
      async () => {
        setHistory((prev) => prev.filter((item) => item.id !== logId));
        await deleteCardioLog(logId);
        loadData();
      }
    );
  };

  const handleClearAllHistory = () => {
    confirmAction(
      'Clear Cardio History?',
      'This will remove all logged cardio sessions from your device.',
      'Clear',
      async () => {
        setHistory([]);
        await clearCardioHistory();
        loadData();
      }
    );
  };

  const challengeTimeRatio = challengeTotalSeconds > 0 ? challengeSecondsLeft / challengeTotalSeconds : 1;

  return (
    <View style={[styles.root, { backgroundColor: theme.background }]}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* 1. TOP HUNTER STATUS BAR (Profile tap opens Prime Awakening) */}
        <View style={styles.topHunterBar}>
          <SmoothPressable
            onPress={() => setAwakeningOpen(true)}
            style={styles.topHunterPressable}
            accessibilityRole="button"
            accessibilityLabel="Open Prime Awakening Profile"
          >
            <View
              style={[
                styles.topAvatarWrapper,
                {
                  borderColor: `${theme.tint}45`,
                  backgroundColor: `${theme.tint}12`,
                },
              ]}
            >
              <View style={[styles.hunterAvatarCircle, { borderColor: theme.tint, shadowColor: theme.glow }]}>
                <Image source={currentAvatar.image} style={styles.avatarImg} resizeMode="cover" />
              </View>
            </View>

            <View style={styles.hunterInfoCol}>
              <View style={styles.hunterNameRow}>
                <Text style={[styles.hunterNameText, { color: theme.text }]} numberOfLines={1}>
                  {settings.nickname || profile?.hunter_name || 'Hunter'}
                </Text>
                <View style={[styles.rankBadge, { backgroundColor: theme.tint }]}>
                  <Text style={styles.rankBadgeText}>
                    {profile?.rank ? profile.rank.toUpperCase() : 'E-RANK'}
                  </Text>
                </View>
              </View>
              <Text style={[styles.hunterQuestText, { color: theme.textSecondary }]}>
                {t('questSubtitle')}
              </Text>
            </View>
          </SmoothPressable>

          <View style={styles.topHunterActions}>
            <NotificationBellButton streakDays={profile?.streak_days ?? 4} />
            <SmoothPressable
              onPress={() => router.push('/settings')}
              style={[
                styles.headerActionBtn,
                { backgroundColor: theme.cardSecondary, borderColor: theme.border },
              ]}
              accessibilityRole="button"
              accessibilityLabel="Open Settings"
              hitSlop={8}
            >
              <Ionicons name="settings-sharp" size={18} color={theme.tint} />
            </SmoothPressable>
          </View>
        </View>

        {/* 2. SECTION HEADER */}
        <View style={styles.sectionHeader}>
          <Text style={[styles.mainHubTitle, { color: theme.text }]}>{t('cardioHub')}</Text>
          <Text style={[styles.mainHubSub, { color: theme.textSecondary }]}>
            {t('cardioSubtitle')}
          </Text>
        </View>

        {/* 3. ACTIVITY SELECTOR PILLS */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.activityPillsRow}
        >
          {ACTIVITIES.map((act) => {
            const isSelected = selectedActivity === act.id;
            const activityName =
              act.id === 'jogging'
                ? t('jogging')
                : act.id === 'cycling'
                ? t('cycling')
                : act.id === 'jumprope'
                ? t('jumpRope')
                : t('hiitSprint');

            return (
              <SmoothPressable
                key={act.id}
                onPress={() => setSelectedActivity(act.id)}
                style={[
                  styles.activityPill,
                  {
                    backgroundColor: isSelected ? theme.tint : theme.cardSecondary,
                    borderColor: isSelected ? theme.tint : theme.border,
                    shadowColor: isSelected ? theme.tint : 'transparent',
                  },
                  isSelected && styles.activityPillActive,
                ]}
              >
                <Ionicons
                  name={act.iconName}
                  size={15}
                  color={isSelected ? '#FFFFFF' : theme.textSecondary}
                  style={{ marginRight: 6 }}
                />
                <Text
                  style={[
                    styles.activityPillText,
                    { color: isSelected ? '#FFFFFF' : theme.textSecondary, fontWeight: isSelected ? '700' : '600' },
                  ]}
                >
                  {activityName}
                </Text>
              </SmoothPressable>
            );
          })}
        </ScrollView>

        {/* 4. MAIN LIVE SATELLITE TRACKING CARD */}
        <View
          style={[
            styles.satelliteCard,
            {
              backgroundColor: theme.card,
              borderColor: isActive ? theme.tint : theme.border,
              shadowColor: isActive ? theme.tint : '#000000',
              overflow: 'hidden',
            },
          ]}
        >
          <Svg style={StyleSheet.absoluteFill} pointerEvents="none">
            <Defs>
              <RadialGradient id="cardioSatGlow" cx="50%" cy="22%" rx="70%" ry="70%">
                <Stop offset="0%" stopColor={isActive ? '#E11D48' : theme.tint} stopOpacity="0.22" />
                <Stop offset="100%" stopColor={theme.tint} stopOpacity="0" />
              </RadialGradient>
            </Defs>
            <Rect x="0" y="0" width="100%" height="100%" rx="18" fill="url(#cardioSatGlow)" />
          </Svg>

          {/* Status Subtitle: Live, Paused, or Standby */}
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 6,
              paddingHorizontal: 12,
              paddingVertical: 4,
              borderRadius: 999,
              backgroundColor: isActive ? 'rgba(225, 29, 72, 0.16)' : `${theme.tint}16`,
              borderWidth: 1,
              borderColor: isActive ? '#E11D48' : `${theme.tint}40`,
              marginBottom: 14,
            }}
          >
            <View
              style={{
                width: 7,
                height: 7,
                borderRadius: 3.5,
                backgroundColor: isActive ? '#E11D48' : seconds > 0 ? '#FBBF24' : theme.tint,
              }}
            />
            <Text
              style={[
                styles.satelliteStatusText,
                {
                  color: isActive ? '#FB7185' : seconds > 0 ? '#FBBF24' : theme.tint,
                  marginBottom: 0,
                },
              ]}
            >
              {isActive ? 'GPS TRACKING ACTIVE' : seconds > 0 ? 'SESSION PAUSED' : t('satelliteStandby')}
            </Text>
          </View>

          {/* Radar Ring Visual with Animated Sonar/Echo Concentric Rings */}
          <View style={styles.radarRingContainer}>
            {/* Echo Wave 1 */}
            <Animated.View
              pointerEvents="none"
              style={[
                styles.radarEchoRing,
                {
                  borderColor: isActive ? '#E11D48' : theme.tint,
                  transform: [
                    {
                      scale: echoAnim1.interpolate({
                        inputRange: [0, 1],
                        outputRange: [0.85, 1.45],
                      }),
                    },
                  ],
                  opacity: echoAnim1.interpolate({
                    inputRange: [0, 0.2, 0.7, 1],
                    outputRange: [0, 0.65, 0.2, 0],
                  }),
                },
              ]}
            />
            {/* Echo Wave 2 */}
            <Animated.View
              pointerEvents="none"
              style={[
                styles.radarEchoRing,
                {
                  borderColor: isActive ? '#E11D48' : theme.tint,
                  transform: [
                    {
                      scale: echoAnim2.interpolate({
                        inputRange: [0, 1],
                        outputRange: [0.85, 1.45],
                      }),
                    },
                  ],
                  opacity: echoAnim2.interpolate({
                    inputRange: [0, 0.2, 0.7, 1],
                    outputRange: [0, 0.65, 0.2, 0],
                  }),
                },
              ]}
            />
            {/* Echo Wave 3 */}
            <Animated.View
              pointerEvents="none"
              style={[
                styles.radarEchoRing,
                {
                  borderColor: isActive ? '#E11D48' : theme.tint,
                  transform: [
                    {
                      scale: echoAnim3.interpolate({
                        inputRange: [0, 1],
                        outputRange: [0.85, 1.45],
                      }),
                    },
                  ],
                  opacity: echoAnim3.interpolate({
                    inputRange: [0, 0.2, 0.7, 1],
                    outputRange: [0, 0.65, 0.2, 0],
                  }),
                },
              ]}
            />

            <View style={styles.distanceValueRow}>
              <Text style={[styles.hugeDistanceText, { color: theme.text }]}>
                {distanceKm.toFixed(2)}
              </Text>
              <Text style={[styles.hugeDistanceUnit, { color: theme.tint }]}>KM</Text>
            </View>
          </View>

          {/* Dotted Divider */}
          <View style={[styles.dottedDivider, { borderColor: theme.border }]} />

          {/* 3 Metrics: Time, Avg Pace, Energy */}
          <View style={styles.metricsRow}>
            <View style={styles.metricColumn}>
              <Text style={[styles.metricHeaderLabel, { color: theme.textSecondary }]}>{t('time')}</Text>
              <Text style={[styles.metricHeaderValue, { color: theme.text }]}>
                {formatStopwatch(seconds)}
              </Text>
            </View>

            <View style={styles.metricColumn}>
              <Text style={[styles.metricHeaderLabel, { color: theme.textSecondary }]}>{t('avgPace')}</Text>
              <Text style={[styles.metricHeaderValue, { color: theme.text }]}>
                {paceStr} <Text style={{ fontSize: 11, color: theme.textSecondary }}>/km</Text>
              </Text>
            </View>

            <View style={styles.metricColumn}>
              <Text style={[styles.metricHeaderLabel, { color: theme.textSecondary }]}>{t('energy')}</Text>
              <Text style={[styles.metricHeaderValue, { color: theme.text }]}>
                {caloriesBurned} <Text style={{ fontSize: 11, color: theme.textSecondary }}>kcal</Text>
              </Text>
            </View>
          </View>

          {/* Protocol Primary Controls: Reset, Start/Resume/Pause, Save */}
          <View style={styles.protocolControlsRow}>
            {(seconds > 0 || distanceKm > 0) && (
              <SmoothPressable
                onPress={handleResetProtocol}
                style={[styles.smallResetBtn, { backgroundColor: theme.cardSecondary, borderColor: theme.border }]}
                accessibilityLabel="Reset Protocol"
              >
                <Ionicons name="refresh" size={18} color={theme.textSecondary} />
              </SmoothPressable>
            )}

            <SmoothPressable
              onPress={handleToggleProtocol}
              style={[
                styles.mainProtocolBtn,
                {
                  backgroundColor: isActive ? '#E11D48' : theme.tint,
                  shadowColor: isActive ? '#E11D48' : theme.tint,
                },
              ]}
            >
              <Ionicons
                name={isActive ? 'pause' : 'play'}
                size={18}
                color="#FFFFFF"
                style={{ marginRight: 8 }}
              />
              <Text style={styles.mainProtocolBtnText}>
                {isActive ? t('pauseProtocol') : seconds > 0 ? t('resumeSession') : t('startPeakProtocol')}
              </Text>
            </SmoothPressable>

            {(seconds > 0 || distanceKm > 0) && (
              <SmoothPressable
                onPress={handleFinishProtocol}
                style={[styles.saveSessionBtn, { backgroundColor: '#16A34A', shadowColor: '#16A34A' }]}
              >
                <Ionicons name="checkmark-done" size={18} color="#FFFFFF" style={{ marginRight: 4 }} />
                <Text style={styles.saveSessionBtnText}>{t('save')}</Text>
              </SmoothPressable>
            )}
          </View>
        </View>

        {/* 5. BEAT THE CLOCK: MULTI-EXERCISE TIMED PROTOCOL */}
        <View style={[styles.hiitChallengeCard, { backgroundColor: theme.card, borderColor: `${theme.tint}45` }]}>
          <View style={styles.hiitTopRow}>
            <View style={{ flex: 1 }}>
              <View style={styles.hiitTagRow}>
                <Ionicons name="flash" size={14} color={theme.tint} style={{ marginRight: 4 }} />
                <Text style={[styles.hiitTagText, { color: theme.tint }]}>BEAT THE CLOCK PROTOCOL</Text>
              </View>
              <Text style={[styles.hiitTitle, { color: theme.text }]}>
                {activeChallengeMeta.label} Challenge
              </Text>
            </View>

            <View style={[styles.coinsBadge, { flexDirection: 'row', alignItems: 'center' }]}>
              <Ionicons name="disc" size={12} color="#FBBF24" style={{ marginRight: 4 }} />
              <Text style={styles.coinsBadgeText}>+{activeChallengeMeta.presets[0]?.coins ?? 25} Coins</Text>
            </View>
          </View>

          <Text style={[styles.hiitSubtitle, { color: theme.textSecondary }]}>
            Pumili ng exercise type. Kumpletuhin ang target reps o distansya bago maubos ang countdown timer!
          </Text>

          {/* 5.1. EXERCISE TYPE SELECTOR PILLS */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.challengeTypesScroll}
          >
            {BEAT_CHALLENGES.map((ch) => {
              const isSelected = selectedChallengeType === ch.id;
              return (
                <SmoothPressable
                  key={ch.id}
                  onPress={() => handleSelectChallengeType(ch.id)}
                  disabled={challengeActive}
                  style={[
                    styles.challengeTypePill,
                    {
                      backgroundColor: isSelected ? theme.tint : theme.cardSecondary,
                      borderColor: isSelected ? theme.tint : theme.border,
                      opacity: challengeActive && !isSelected ? 0.45 : 1,
                    },
                  ]}
                >
                  <Ionicons
                    name={ch.iconName}
                    size={14}
                    color={isSelected ? '#FFFFFF' : theme.textSecondary}
                    style={{ marginRight: 6 }}
                  />
                  <Text
                    style={[
                      styles.challengeTypePillText,
                      { color: isSelected ? '#FFFFFF' : theme.textSecondary, fontWeight: isSelected ? '700' : '600' },
                    ]}
                  >
                    {ch.label}
                  </Text>
                </SmoothPressable>
              );
            })}
          </ScrollView>

          {/* 5.2. QUICK TARGET PRESETS */}
          {!challengeActive && (
            <View style={styles.quickPresetRow}>
              {activeChallengeMeta.presets.map((preset) => {
                const isSelected = selectedPresetId === preset.id;
                return (
                  <SmoothPressable
                    key={preset.id}
                    onPress={() => handleSelectPreset(preset)}
                    style={[
                      styles.quickPresetPill,
                      {
                        backgroundColor: isSelected ? theme.tint : theme.cardSecondary,
                        borderColor: isSelected ? theme.tint : theme.border,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.quickPresetText,
                        { color: isSelected ? '#FFFFFF' : theme.textSecondary },
                      ]}
                    >
                      {preset.label}
                    </Text>
                  </SmoothPressable>
                );
              })}
            </View>
          )}

          {/* 5.3. TARGET & TIME LIMIT INPUTS */}
          <View style={styles.challengeInputsRow}>
            <View style={styles.challengeInputBox}>
              <Text style={[styles.challengeInputLabel, { color: theme.textSecondary }]}>
                TARGET ({activeChallengeMeta.unit})
              </Text>
              <TextInput
                style={[
                  styles.challengeInput,
                  {
                    backgroundColor: theme.cardSecondary,
                    borderColor: theme.border,
                    color: theme.text,
                  },
                ]}
                keyboardType="numeric"
                value={challengeTargetInput}
                onChangeText={setChallengeTargetInput}
                editable={!challengeActive}
                maxLength={5}
              />
            </View>

            <View style={styles.challengeInputBox}>
              <Text style={[styles.challengeInputLabel, { color: theme.textSecondary }]}>
                TIME LIMIT (MIN)
              </Text>
              <TextInput
                style={[
                  styles.challengeInput,
                  {
                    backgroundColor: theme.cardSecondary,
                    borderColor: theme.border,
                    color: theme.text,
                  },
                ]}
                keyboardType="numeric"
                value={challengeTimeLimitMinInput}
                onChangeText={setChallengeTimeLimitMinInput}
                editable={!challengeActive}
                maxLength={4}
              />
            </View>
          </View>

          {/* 5.4. VISUAL PROGRESS ROW */}
          <View style={styles.challengeGaugesRow}>
            {/* Target Progress Meter */}
            <View style={[styles.challengeGaugeCard, { backgroundColor: theme.cardSecondary, borderColor: theme.border }]}>
              <View style={styles.gaugeCardHeader}>
                <Text style={[styles.gaugeTitle, { color: theme.textSecondary }]}>OUTPUT PROGRESS</Text>
                <View style={[styles.liveDot, { backgroundColor: challengeActive ? '#10B981' : theme.textDim }]} />
              </View>

              <View style={styles.circularMeterWrapper}>
                {/* Looping Pulsing Echo Ring */}
                <Animated.View
                  pointerEvents="none"
                  style={[
                    styles.circularPulseRing,
                    {
                      borderColor: theme.tint,
                      transform: [
                        {
                          scale: hiitPulseAnim.interpolate({
                            inputRange: [0, 1],
                            outputRange: [0.95, 1.35],
                          }),
                        },
                      ],
                      opacity: hiitPulseAnim.interpolate({
                        inputRange: [0, 0.2, 0.8, 1],
                        outputRange: [0, 0.7, 0.2, 0],
                      }),
                    },
                  ]}
                />
                {/* Looping Spinning Ring Arc */}
                <Animated.View
                  pointerEvents="none"
                  style={[
                    styles.circularDashedRing,
                    {
                      borderColor: theme.glow,
                      transform: [
                        {
                          rotate: hiitSpinAnim.interpolate({
                            inputRange: [0, 1],
                            outputRange: ['0deg', '360deg'],
                          }),
                        },
                      ],
                    },
                  ]}
                />

                <View style={[styles.circularOuterRing, { borderColor: theme.tint, backgroundColor: `${theme.tint}14` }]}>
                  <Text style={[styles.circularMeterValue, { color: theme.text }]}>
                    {challengeCurrentProgress.toFixed(activeChallengeMeta.unit === 'KM' ? 2 : 0)} / {challengeTargetInput}
                  </Text>
                  <Text style={[styles.circularMeterUnit, { color: theme.tint }]}>
                    {activeChallengeMeta.unit}
                  </Text>
                </View>
              </View>
            </View>

            {/* Time Left Meter */}
            <View style={[styles.challengeGaugeCard, { backgroundColor: theme.cardSecondary, borderColor: theme.border }]}>
              <View style={styles.gaugeCardHeader}>
                <Text style={[styles.gaugeTitle, { color: theme.textSecondary }]}>{t('timeLeft')}</Text>
                <Ionicons name="time" size={16} color="#FBBF24" />
              </View>

              <View style={styles.timeLeftContainer}>
                <Text
                  style={[
                    styles.countdownTimeText,
                    { color: challengeSecondsLeft <= 10 && challengeActive ? '#EF4444' : theme.text },
                  ]}
                >
                  {formatStopwatch(challengeSecondsLeft)}
                </Text>

                {/* Horizontal Progress Bar */}
                <View style={[styles.countdownProgressBarTrack, { backgroundColor: theme.card }]}>
                  <View
                    style={[
                      styles.countdownProgressBarFill,
                      {
                        width: `${Math.max(0, Math.min(100, challengeTimeRatio * 100))}%`,
                        backgroundColor: challengeSecondsLeft < 30 ? '#EF4444' : theme.tint,
                      },
                    ]}
                  />
                </View>
              </View>
            </View>
          </View>

          {/* 5.5. TACTILE REP INCREMENT CONTROLS FOR REP-BASED EXERCISES */}
          {activeChallengeMeta.isRepBased && challengeActive && (
            <View style={styles.repCounterControlsRow}>
              <SmoothPressable
                onPress={() => handleAddReps(1)}
                style={[styles.repIncrementBtn, { backgroundColor: theme.cardSecondary, borderColor: theme.border }]}
              >
                <Text style={[styles.repIncrementBtnText, { color: theme.text }]}>+1 {activeChallengeMeta.unit === 'SKIPS' ? 'SKIP' : 'REP'}</Text>
              </SmoothPressable>
              <SmoothPressable
                onPress={() => handleAddReps(5)}
                style={[styles.repIncrementBtn, { backgroundColor: theme.cardSecondary, borderColor: theme.border }]}
              >
                <Text style={[styles.repIncrementBtnText, { color: theme.text }]}>+5</Text>
              </SmoothPressable>
              <SmoothPressable
                onPress={() => handleAddReps(10)}
                style={[styles.repIncrementBtn, { backgroundColor: `${theme.tint}22`, borderColor: theme.tint }]}
              >
                <Text style={[styles.repIncrementBtnText, { color: theme.tint }]}>+10</Text>
              </SmoothPressable>
            </View>
          )}

          {/* 5.6. CHALLENGE ACTION BUTTONS */}
          {challengeActive ? (
            <View style={{ flexDirection: 'row', gap: 10, marginTop: 16 }}>
              <SmoothPressable
                onPress={handleAbortChallenge}
                style={[styles.challengeAbortBtn, { backgroundColor: theme.cardSecondary, borderColor: theme.border }]}
              >
                <Text style={{ color: theme.textSecondary, fontWeight: '600' }}>{t('cancel')}</Text>
              </SmoothPressable>
              <SmoothPressable
                onPress={() =>
                  finishChallengeSuccess(
                    challengeCurrentProgress,
                    challengeTotalSeconds,
                    challengeSecondsLeft,
                    parseFloat(challengeTargetInput) || 1
                  )
                }
                style={[styles.challengeActionBtn, { flex: 1, backgroundColor: '#10B981' }]}
              >
                <Text style={styles.challengeActionBtnText}>Conquered! Done ✓</Text>
              </SmoothPressable>
            </View>
          ) : (
            <SmoothPressable
              onPress={handleStartChallenge}
              style={[styles.challengeActionBtn, { backgroundColor: theme.tint, shadowColor: theme.tint, marginTop: 16 }]}
            >
              <Ionicons name="stopwatch" size={18} color="#FFFFFF" style={{ marginRight: 6 }} />
              <Text style={styles.challengeActionBtnText}>Start</Text>
            </SmoothPressable>
          )}
        </View>

        {/* 5.7. SCHEDULED DAILY WORKOUT ALARM & NOTIFICATION */}
        <View style={[styles.reminderCard, { backgroundColor: theme.card, borderColor: `${theme.tint}38` }]}>
          <View style={styles.reminderCardHeader}>
            <View style={[styles.reminderIconBadge, { backgroundColor: `${theme.tint}18`, borderColor: `${theme.tint}40` }]}>
              <Ionicons name="alarm" size={20} color={theme.tint} />
            </View>
            <View style={{ flex: 1 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 3 }}>
                <Text style={[styles.reminderTitle, { color: theme.text }]}>
                  Daily Workout Push Alarm
                </Text>
                <View
                  style={[
                    styles.alarmStatusBadge,
                    {
                      backgroundColor: reminderArmed ? 'rgba(16, 185, 129, 0.16)' : 'rgba(255, 255, 255, 0.08)',
                      borderColor: reminderArmed ? '#10B981' : theme.border,
                    },
                  ]}
                >
                  <Text style={[styles.alarmStatusText, { color: reminderArmed ? '#10B981' : theme.textSecondary }]}>
                    {reminderArmed ? 'ARMED' : 'OFFLINE'}
                  </Text>
                </View>
              </View>
              <Text style={[styles.reminderSub, { color: theme.textSecondary }]}>
                {reminderArmed
                  ? `Active alarm: "⚡ Day ${(profile?.streak_days ?? 1) + 1} na pala! Need mo na mag-exercise!" scheduled at 8:00 AM daily.`
                  : 'Makakatanggap ka ng push alarm kahit sarado ang app kapag oras na mag-exercise para maprotektahan ang streak.'}
              </Text>
            </View>
          </View>

          <View style={styles.reminderActionsRow}>
            <SmoothPressable
              onPress={handleToggleDailyReminder}
              style={[
                styles.reminderActionBtn,
                {
                  backgroundColor: reminderArmed ? '#10B981' : theme.tint,
                },
              ]}
            >
              <Ionicons name={reminderArmed ? 'checkmark-circle' : 'notifications'} size={15} color="#FFFFFF" />
              <Text style={styles.reminderActionBtnText}>
                {reminderArmed ? 'Alarm Active (8:00 AM Daily)' : 'Arm Daily 8:00 AM Alarm'}
              </Text>
            </SmoothPressable>

            <SmoothPressable
              onPress={handleTestNotification}
              style={[
                styles.reminderTestBtn,
                { backgroundColor: theme.cardSecondary, borderColor: theme.border },
              ]}
            >
              <Ionicons name="timer-outline" size={15} color={theme.textSecondary} />
              <Text style={[styles.reminderTestBtnText, { color: theme.text }]}>Test Alarm (5s)</Text>
            </SmoothPressable>
          </View>
        </View>

        {/* 6. CARDIO LOG HISTORY */}
        <View style={styles.historySection}>
          <View style={styles.historyHeaderRow}>
            <Text style={[styles.historySectionTitle, { color: theme.text }]}>{t('cardioLogHistory')}</Text>
            {history.length > 0 && (
              <SmoothPressable onPress={handleClearAllHistory} hitSlop={8}>
                <Text style={[styles.clearHistoryBtnText, { color: theme.danger }]}>Clear All</Text>
              </SmoothPressable>
            )}
          </View>

          {history.length > 0 ? (
            <View style={styles.historyList}>
              {history.map((item) => (
                <View
                  key={item.id}
                  style={[styles.historyItemCard, { backgroundColor: theme.card, borderColor: theme.borderRose }]}
                >
                  <View style={[styles.historyIconCircle, { backgroundColor: theme.cardSecondary }]}>
                    <Ionicons name="flame" size={20} color="#F97316" />
                  </View>

                  <View style={styles.historyDetailsCol}>
                    <Text style={[styles.historyDistText, { color: theme.text }]}>
                      {item.distance_km.toFixed(2)} KM Session
                    </Text>
                    <Text style={[styles.historyDateText, { color: theme.textSecondary }]}>
                      {item.date} • {formatStopwatch(item.duration_seconds)}
                    </Text>
                  </View>

                  <View style={styles.historyCaloriesBadge}>
                    <Text style={[styles.historyCaloriesText, { color: theme.tint }]}>
                      {item.calories} kcal
                    </Text>
                  </View>

                  <SmoothPressable
                    onPress={() => handleDeleteLog(item.id)}
                    style={styles.deleteLogBtn}
                    accessibilityLabel="Delete session"
                    hitSlop={6}
                  >
                    <Ionicons name="trash-outline" size={16} color={theme.textDim} />
                  </SmoothPressable>
                </View>
              ))}
            </View>
          ) : (
            <View
              style={[
                styles.emptyHistoryCard,
                { backgroundColor: theme.card, borderColor: theme.borderRose },
              ]}
            >
              <Text style={[styles.emptyHistoryTitle, { color: theme.text }]}>
                {t('noCardioLogs')}
              </Text>
            </View>
          )}
        </View>
      </ScrollView>

      <PrimeAwakeningModal
        visible={awakeningOpen}
        onClose={() => setAwakeningOpen(false)}
        onSave={() => {
          void loadData();
        }}
      />

      <CardioInsightsModal
        visible={insightsModalVisible}
        data={insightsData}
        onClose={() => setInsightsModalVisible(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 90,
    gap: 16,
  },
  topHunterBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  topHunterPressable: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  topHunterActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerActionBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    borderWidth: 1.2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  topAvatarWrapper: {
    marginRight: 10,
    borderRadius: 28,
    padding: 2,
    borderWidth: 1.5,
  },
  hunterAvatarCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 2,
    overflow: 'hidden',
    shadowOffset: { width: 0, height: 0 },
    shadowRadius: 10,
    shadowOpacity: 0.85,
    elevation: 5,
  },
  avatarImg: {
    width: '100%',
    height: '100%',
  },
  hunterInfoCol: {
    flex: 1,
  },
  hunterNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  hunterNameText: {
    fontSize: 16,
    fontWeight: '800',
    maxWidth: '75%',
  },
  rankBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  rankBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.4,
  },
  hunterQuestText: {
    fontSize: 12,
    marginTop: 2,
  },
  sectionHeader: {
    marginTop: 4,
  },
  mainHubTitle: {
    fontSize: 22,
    fontWeight: '900',
    letterSpacing: 0.2,
  },
  mainHubSub: {
    fontSize: 13,
    marginTop: 3,
  },
  activityPillsRow: {
    flexDirection: 'row',
    gap: 8,
    paddingVertical: 4,
  },
  activityPill: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1.2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  activityPillActive: {
    shadowOffset: { width: 0, height: 0 },
    shadowRadius: 8,
    shadowOpacity: 0.6,
    elevation: 3,
  },
  activityPillText: {
    fontSize: 14,
    fontWeight: '700',
  },
  satelliteCard: {
    borderRadius: 18,
    borderWidth: 1.2,
    padding: 20,
    alignItems: 'center',
    shadowOffset: { width: 0, height: 0 },
    shadowRadius: 16,
    shadowOpacity: 0.6,
    elevation: 6,
  },
  satelliteStatusText: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.2,
    marginBottom: 16,
  },
  radarRingContainer: {
    width: 200,
    height: 120,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    marginVertical: 4,
  },
  radarEchoRing: {
    position: 'absolute',
    width: 200,
    height: 120,
    borderRadius: 60,
    borderWidth: 1.5,
  },
  distanceValueRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
  },
  hugeDistanceText: {
    fontSize: 48,
    fontWeight: '900',
    letterSpacing: 1,
    fontVariant: ['tabular-nums'],
  },
  hugeDistanceUnit: {
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  dottedDivider: {
    width: '100%',
    borderBottomWidth: 1,
    borderStyle: 'dashed',
    marginVertical: 18,
  },
  metricsRow: {
    flexDirection: 'row',
    width: '100%',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
    marginBottom: 20,
  },
  metricColumn: {
    alignItems: 'center',
    flex: 1,
  },
  metricHeaderLabel: {
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.8,
    marginBottom: 4,
  },
  metricHeaderValue: {
    fontSize: 18,
    fontWeight: '800',
    fontVariant: ['tabular-nums'],
  },
  protocolControlsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    gap: 10,
  },
  smallResetBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  mainProtocolBtn: {
    flex: 1,
    height: 48,
    borderRadius: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowOffset: { width: 0, height: 0 },
    shadowRadius: 10,
    shadowOpacity: 0.7,
    elevation: 4,
  },
  mainProtocolBtnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  saveSessionBtn: {
    paddingHorizontal: 16,
    height: 48,
    borderRadius: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowOffset: { width: 0, height: 0 },
    shadowRadius: 8,
    shadowOpacity: 0.6,
    elevation: 4,
  },
  saveSessionBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  hiitChallengeCard: {
    borderRadius: 18,
    borderWidth: 1.2,
    padding: 18,
    shadowOffset: { width: 0, height: 0 },
    shadowRadius: 14,
    shadowOpacity: 0.5,
    elevation: 5,
  },
  hiitTopRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  hiitTagRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  hiitTagText: {
    color: '#C084FC',
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  hiitTitle: {
    fontSize: 20,
    fontWeight: '800',
  },
  coinsBadge: {
    backgroundColor: 'rgba(251, 191, 36, 0.15)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FBBF24',
  },
  coinsBadgeText: {
    color: '#FBBF24',
    fontSize: 13,
    fontWeight: '700',
  },
  hiitSubtitle: {
    fontSize: 14,
    marginTop: 4,
    marginBottom: 10,
  },
  quickPresetRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  challengeTypesScroll: {
    gap: 8,
    paddingBottom: 12,
  },
  challengeTypePill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 10,
    borderWidth: 1,
  },
  challengeTypePillText: {
    fontSize: 12.5,
  },
  repCounterControlsRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
  },
  repIncrementBtn: {
    flex: 1,
    height: 40,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  repIncrementBtnText: {
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  reminderCard: {
    borderRadius: 18,
    borderWidth: 1.2,
    padding: 16,
    gap: 12,
  },
  reminderCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  reminderIconBadge: {
    width: 42,
    height: 42,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  reminderTitle: {
    fontSize: 15,
    fontWeight: '800',
  },
  alarmStatusBadge: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
  },
  alarmStatusText: {
    fontSize: 9.5,
    fontWeight: '800',
    letterSpacing: 0.6,
  },
  reminderSub: {
    fontSize: 12,
    lineHeight: 16,
  },
  reminderActionsRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 2,
  },
  reminderActionBtn: {
    flex: 1.3,
    flexDirection: 'row',
    height: 42,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingHorizontal: 10,
  },
  reminderActionBtnText: {
    color: '#FFFFFF',
    fontSize: 12.5,
    fontWeight: '700',
  },
  reminderTestBtn: {
    flex: 1,
    flexDirection: 'row',
    height: 42,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingHorizontal: 10,
  },
  reminderTestBtnText: {
    fontSize: 12,
    fontWeight: '600',
  },
  quickPresetPill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
  },
  quickPresetText: {
    fontSize: 12.5,
    fontWeight: '700',
  },
  challengeInputsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 14,
  },
  challengeInputBox: {
    flex: 1,
  },
  challengeInputLabel: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.6,
    marginBottom: 6,
  },
  challengeInput: {
    height: 44,
    borderRadius: 10,
    borderWidth: 1,
    textAlign: 'center',
    fontSize: 16,
    fontWeight: '800',
  },
  challengeGaugesRow: {
    flexDirection: 'row',
    gap: 12,
  },
  challengeGaugeCard: {
    flex: 1,
    borderRadius: 14,
    borderWidth: 1,
    padding: 12,
    minHeight: 110,
  },
  gaugeCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  gaugeTitle: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.6,
  },
  liveDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
  },
  circularMeterWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
    width: 96,
    height: 96,
  },
  circularPulseRing: {
    position: 'absolute',
    width: 96,
    height: 96,
    borderRadius: 48,
    borderWidth: 1.5,
  },
  circularDashedRing: {
    position: 'absolute',
    width: 90,
    height: 90,
    borderRadius: 45,
    borderWidth: 1.5,
    borderStyle: 'dashed',
  },
  circularOuterRing: {
    width: 86,
    height: 86,
    borderRadius: 43,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(124, 58, 237, 0.1)',
  },
  circularMeterValue: {
    fontSize: 10,
    fontWeight: '800',
    textAlign: 'center',
  },
  circularMeterUnit: {
    fontSize: 8,
    fontWeight: '700',
    letterSpacing: 0.5,
    marginTop: 1,
  },
  timeLeftContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
  },
  countdownTimeText: {
    fontSize: 26,
    fontWeight: '900',
    fontVariant: ['tabular-nums'],
    letterSpacing: 0.5,
  },
  countdownProgressBarTrack: {
    width: '100%',
    height: 6,
    borderRadius: 3,
    marginTop: 12,
    overflow: 'hidden',
  },
  countdownProgressBarFill: {
    height: '100%',
    borderRadius: 3,
  },
  challengeActionBtn: {
    height: 46,
    borderRadius: 23,
    alignItems: 'center',
    justifyContent: 'center',
    shadowOffset: { width: 0, height: 0 },
    shadowRadius: 10,
    shadowOpacity: 0.7,
    elevation: 4,
  },
  challengeActionBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  challengeAbortBtn: {
    height: 46,
    paddingHorizontal: 16,
    borderRadius: 23,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  historySection: {
    marginTop: 4,
  },
  historyHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  historySectionTitle: {
    fontSize: 18,
    fontWeight: '800',
  },
  clearHistoryBtnText: {
    fontSize: 12,
    fontWeight: '700',
  },
  historyList: {
    gap: 10,
  },
  historyItemCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 14,
    borderWidth: 1.2,
    padding: 12,
    gap: 12,
  },
  historyIconCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  historyDetailsCol: {
    flex: 1,
  },
  historyDistText: {
    fontSize: 15,
    fontWeight: '700',
  },
  historyDateText: {
    fontSize: 12,
    marginTop: 2,
  },
  historyCaloriesBadge: {
    alignItems: 'flex-end',
  },
  historyCaloriesText: {
    fontSize: 14,
    fontWeight: '700',
  },
  deleteLogBtn: {
    padding: 6,
  },
  emptyHistoryCard: {
    borderRadius: 14,
    borderWidth: 1.2,
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyHistoryTitle: {
    fontSize: 15,
    fontWeight: '700',
    textAlign: 'center',
  },
  emptyHistorySubtitle: {
    fontSize: 12,
    marginTop: 4,
    textAlign: 'center',
  },
});
