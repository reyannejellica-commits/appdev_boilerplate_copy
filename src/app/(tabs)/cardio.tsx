import { Ionicons } from '@expo/vector-icons';
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
import { PrimeAwakeningModal } from '@/components/PrimeAwakeningModal';
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
import { playAlertSound } from '@/utils/alertSounds';
import { confirmAction, showMessage } from '@/utils/confirm';
import { getAvatarById } from '@/utils/profileOptions';

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

export default function CardioScreen() {
  const theme = useTheme();
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

  // HIIT Challenge State ("Beat the Clock")
  const [targetKmInput, setTargetKmInput] = useState('3');
  const [timeLimitMinInput, setTimeLimitMinInput] = useState('10');
  const [challengeActive, setChallengeActive] = useState(false);
  const [challengeSecondsLeft, setChallengeSecondsLeft] = useState(600);
  const [challengeTotalSeconds, setChallengeTotalSeconds] = useState(600);
  const [challengeDistanceKm, setChallengeDistanceKm] = useState(0);

  const challengeStateRef = useRef({
    active: false,
    secondsLeft: 600,
    totalSeconds: 600,
    distanceKm: 0,
    targetKm: 3,
  });

  const currentAvatar = useMemo(() => getAvatarById(settings.avatarId), [settings.avatarId]);
  const activeActivityMeta = useMemo(
    () => ACTIVITIES.find((a) => a.id === selectedActivity) || ACTIVITIES[0],
    [selectedActivity]
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
    async (finalDist: number, totalSec: number, secLeft: number, tgtKm: number) => {
      challengeStateRef.current.active = false;
      setChallengeActive(false);
      playAlertSound('chime');
      const elapsedSec = Math.max(1, totalSec - secLeft);
      const cals = Math.round(finalDist * 90);
      try {
        await saveCardioSession(elapsedSec, finalDist, cals);
        await loadData();
      } catch (e) {
        console.warn('Failed to save challenge session:', e);
      }
      showMessage(
        'CHALLENGE CONQUERED!',
        `Target: ${tgtKm} KM reached in ${formatStopwatch(elapsedSec)}!\n\n+25 Hunter Coins awarded\nStamina: +15 EXP`
      );
    },
    [formatStopwatch, loadData]
  );

  const finishChallengeTimeout = useCallback(
    async (finalDist: number, totalSec: number) => {
      challengeStateRef.current.active = false;
      setChallengeActive(false);
      playAlertSound('beep');
      showMessage(
        "TIME'S UP!",
        `You covered ${finalDist.toFixed(2)} KM. Stay consistent and overcome the limits next time!`
      );
      if (finalDist > 0.05) {
        const cals = Math.round(finalDist * 80);
        try {
          await saveCardioSession(totalSec, finalDist, cals);
          await loadData();
        } catch (e) {
          console.warn('Failed to save challenge session:', e);
        }
      }
    },
    [loadData]
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

  // Challenge Timer
  useEffect(() => {
    if (!challengeActive) return;

    const interval = setInterval(() => {
      const state = challengeStateRef.current;
      if (!state.active) return;

      const newSecondsLeft = state.secondsLeft - 1;
      const ratePerSec = 13.5 / 3600;
      const newDistance = +(state.distanceKm + ratePerSec).toFixed(3);

      state.secondsLeft = Math.max(0, newSecondsLeft);
      state.distanceKm = newDistance;

      setChallengeSecondsLeft(state.secondsLeft);
      setChallengeDistanceKm(newDistance);

      if (newDistance >= state.targetKm) {
        clearInterval(interval);
        void finishChallengeSuccess(newDistance, state.totalSeconds, state.secondsLeft, state.targetKm);
      } else if (newSecondsLeft <= 0) {
        clearInterval(interval);
        void finishChallengeTimeout(newDistance, state.totalSeconds);
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
    setIsActive(false);
    setSeconds(0);
    setDistanceKm(0);
  };

  // Challenge actions
  const handleStartChallenge = () => {
    const target = parseFloat(targetKmInput);
    const limitMin = parseFloat(timeLimitMinInput);

    if (!target || isNaN(target) || target <= 0 || !limitMin || isNaN(limitMin) || limitMin <= 0) {
      showMessage('Invalid Target', 'Please enter a valid target distance (KM) and time limit (MIN).');
      return;
    }

    const totalSec = Math.round(limitMin * 60);
    challengeStateRef.current = {
      active: true,
      secondsLeft: totalSec,
      totalSeconds: totalSec,
      distanceKm: 0,
      targetKm: target,
    };
    setChallengeTotalSeconds(totalSec);
    setChallengeSecondsLeft(totalSec);
    setChallengeDistanceKm(0);
    setChallengeActive(true);
  };

  const handleAbortChallenge = () => {
    confirmAction(
      'Abort Challenge?',
      'Are you sure you want to cancel this timed challenge?',
      'Abort',
      () => {
        challengeStateRef.current.active = false;
        setChallengeActive(false);
        setChallengeDistanceKm(0);
      }
    );
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
              borderColor: isActive ? theme.tint : theme.borderRose,
              shadowColor: isActive ? theme.tint : theme.glow,
            },
          ]}
        >
          {/* Status Subtitle: Live, Paused, or Standby */}
          <Text style={[styles.satelliteStatusText, { color: isActive ? theme.tint : seconds > 0 ? '#FBBF24' : theme.textSecondary }]}>
            {isActive ? 'GPS TRACKING ACTIVE' : seconds > 0 ? 'SESSION PAUSED' : t('satelliteStandby')}
          </Text>

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

        {/* 5. HIIT CHALLENGE: BEAT THE CLOCK */}
        <View style={[styles.hiitChallengeCard, { backgroundColor: theme.card, borderColor: theme.borderRose }]}>
          <View style={styles.hiitTopRow}>
            <View style={{ flex: 1 }}>
              <View style={styles.hiitTagRow}>
                <Ionicons name="flash" size={14} color={theme.tint} style={{ marginRight: 4 }} />
                <Text style={[styles.hiitTagText, { color: theme.tint }]}>{t('hiitChallenge')}</Text>
              </View>
              <Text style={[styles.hiitTitle, { color: theme.text }]}>{t('beatTheClock')}</Text>
            </View>

            <View style={[styles.coinsBadge, { flexDirection: 'row', alignItems: 'center' }]}>
              <Ionicons name="disc" size={12} color="#FBBF24" style={{ marginRight: 4 }} />
              <Text style={styles.coinsBadgeText}>25 Coins</Text>
            </View>
          </View>

          <Text style={[styles.hiitSubtitle, { color: theme.textSecondary }]}>
            {t('beatTheClockSub')}
          </Text>

          {/* Quick Target Presets */}
          {!challengeActive && (
            <View style={styles.quickPresetRow}>
              {(['1', '3', '5', '10'] as const).map((dist) => (
                <SmoothPressable
                  key={dist}
                  onPress={() => setTargetKmInput(dist)}
                  style={[
                    styles.quickPresetPill,
                    {
                      backgroundColor: targetKmInput === dist ? theme.tint : theme.cardSecondary,
                      borderColor: targetKmInput === dist ? theme.tint : theme.border,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.quickPresetText,
                      { color: targetKmInput === dist ? '#FFFFFF' : theme.textSecondary },
                    ]}
                  >
                    {dist} KM
                  </Text>
                </SmoothPressable>
              ))}
            </View>
          )}

          {/* Inputs Row: Target (KM) & Time Limit (MIN) */}
          <View style={styles.challengeInputsRow}>
            <View style={styles.challengeInputBox}>
              <Text style={[styles.challengeInputLabel, { color: theme.textSecondary }]}>{t('targetKm')}</Text>
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
                value={targetKmInput}
                onChangeText={setTargetKmInput}
                editable={!challengeActive}
                maxLength={4}
              />
            </View>

            <View style={styles.challengeInputBox}>
              <Text style={[styles.challengeInputLabel, { color: theme.textSecondary }]}>
                {t('timeLimitMin')}
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
                value={timeLimitMinInput}
                onChangeText={setTimeLimitMinInput}
                editable={!challengeActive}
                maxLength={4}
              />
            </View>
          </View>

          {/* Visual Progress Row: Target Progress Meter & Time Left */}
          <View style={styles.challengeGaugesRow}>
            {/* Target Progress Meter */}
            <View style={[styles.challengeGaugeCard, { backgroundColor: theme.cardSecondary, borderColor: theme.border }]}>
              <View style={styles.gaugeCardHeader}>
                <Text style={[styles.gaugeTitle, { color: theme.textSecondary }]}>{t('targetProgress')}</Text>
                <View style={[styles.liveDot, { backgroundColor: challengeActive ? '#38BDF8' : theme.textDim }]} />
              </View>

              <View style={styles.circularMeterWrapper}>
                {/* Looping Pulsing Echo Ring for HIIT Challenge */}
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
                {/* Looping Spinning Ring Arc with dashed borders */}
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

                <View style={[styles.circularOuterRing, { borderColor: theme.tint }]}>
                  <Text style={[styles.circularMeterValue, { color: theme.text }]}>
                    {challengeDistanceKm.toFixed(2)} / {targetKmInput} KM
                  </Text>
                  <Text style={[styles.circularMeterUnit, { color: theme.textSecondary }]}>{t('targetProgress')}</Text>
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
                <Text style={[styles.countdownTimeText, { color: theme.text }]}>
                  {formatStopwatch(challengeSecondsLeft)}
                </Text>

                {/* Horizontal Progress Bar */}
                <View style={[styles.countdownProgressBarTrack, { backgroundColor: theme.card }]}>
                  <View
                    style={[
                      styles.countdownProgressBarFill,
                      {
                        width: `${Math.max(0, Math.min(100, challengeTimeRatio * 100))}%`,
                        backgroundColor: challengeSecondsLeft < 60 ? '#EF4444' : theme.tint,
                      },
                    ]}
                  />
                </View>
              </View>
            </View>
          </View>

          {/* Challenge Action Button */}
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
                    challengeDistanceKm,
                    challengeTotalSeconds,
                    challengeSecondsLeft,
                    parseFloat(targetKmInput) || 3
                  )
                }
                style={[styles.challengeActionBtn, { flex: 1, backgroundColor: '#10B981' }]}
              >
                <Text style={styles.challengeActionBtnText}>{t('done')}</Text>
              </SmoothPressable>
            </View>
          ) : (
            <SmoothPressable
              onPress={handleStartChallenge}
              style={[styles.challengeActionBtn, { backgroundColor: theme.tint, shadowColor: theme.tint, marginTop: 16 }]}
            >
              <Text style={styles.challengeActionBtnText}>{t('startTimedChallenge')}</Text>
            </SmoothPressable>
          )}
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
  },
  topHunterPressable: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
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
    gap: 8,
    marginBottom: 12,
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
