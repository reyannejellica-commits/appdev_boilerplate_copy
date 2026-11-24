import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import Svg, {
  Circle,
  Defs,
  LinearGradient,
  RadialGradient,
  Rect,
  Stop,
} from 'react-native-svg';
import { ExerciseGuideModal } from '@/components/ExerciseGuideModal';
import { NotificationBellButton } from '@/components/NotificationModal';
import { PrimeAwakeningModal } from '@/components/PrimeAwakeningModal';
import { RankUnlockVaultModal } from '@/components/RankUnlockVaultModal';
import { SmoothPressable } from '@/components/SmoothPressable';
import { WeekCalendarStrip } from '@/components/WeekCalendarStrip';
import { WorkoutCalendarModal } from '@/components/WorkoutCalendarModal';
import {
  addHunterExp,
  getHunterProfile,
  getTodayDateString,
  type HunterProfile,
} from '@/db/hunter';
import { getProgramById, type ProgramDay } from '@/db/programs';
import {
  getSplitSets,
  getWorkoutHistory,
  toggleSetCompletion,
  updateSetValues,
  WORKOUT_SPLITS,
  type ExerciseSet,
  type SplitDefinition,
} from '@/db/workouts';
import { useTranslation } from '@/i18n';
import { useSettings } from '@/settings/SettingsContext';
import { useTheme } from '@/theme';
import { playAlertSound } from '@/utils/alertSounds';
import { showMessage } from '@/utils/confirm';
import { getAvatarById } from '@/utils/profileOptions';

export default function HomeScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { settings } = useSettings();
  const { t } = useTranslation();

  const [hunter, setHunter] = useState<HunterProfile | null>(null);
  const [selectedDayIdx, setSelectedDayIdx] = useState<number>(0);
  const [protocolsMap, setProtocolsMap] = useState<Record<string, ExerciseSet[]>>({});
  const [guideExercise, setGuideExercise] = useState<string | null>(null);
  const [awakeningOpen, setAwakeningOpen] = useState<boolean>(false);
  const [vaultOpen, setVaultOpen] = useState<boolean>(false);
  const [calendarOpen, setCalendarOpen] = useState<boolean>(false);
  const [selectedCalendarDate, setSelectedCalendarDate] = useState<string>(() => getTodayDateString());
  const [completedWorkoutDates, setCompletedWorkoutDates] = useState<Set<string>>(new Set());

  // Fetch recent completed workout dates for the calendar
  useEffect(() => {
    let isMounted = true;
    getWorkoutHistory(35)
      .then((history) => {
        if (isMounted) {
          const set = new Set<string>();
          for (const h of history) {
            if (h.completedSets > 0) set.add(h.date);
          }
          setCompletedWorkoutDates(set);
        }
      })
      .catch(() => {});
    return () => {
      isMounted = false;
    };
  }, []);

  // Active workout program selected by user in the Program tab
  const currentProgram = useMemo(() => {
    return getProgramById(settings.activeProgramId || 'fullbody-monarch');
  }, [settings.activeProgramId]);

  const splitDays = currentProgram.days;
  const safeDayIdx = selectedDayIdx >= splitDays.length ? 0 : selectedDayIdx;
  const activeDay: ProgramDay = splitDays[safeDayIdx] || splitDays[0];
  const currentAvatar = useMemo(() => getAvatarById(settings.avatarId), [settings.avatarId]);
  const todayStr = useMemo(() => getTodayDateString(), []);

  // Load hunter profile
  const loadProfile = useCallback(async () => {
    try {
      const p = await getHunterProfile(settings.nickname || 'Hunter');
      setHunter(p);
    } catch (e) {
      console.warn('Failed to load hunter profile:', e);
    }
  }, [settings.nickname]);

  useEffect(() => {
    let ignore = false;
    getHunterProfile(settings.nickname || 'Hunter')
      .then((p) => {
        if (!ignore) setHunter(p);
      })
      .catch((e) => console.warn('Failed to load hunter profile:', e));
    return () => {
      ignore = true;
    };
  }, [settings.nickname]);

  // Preload all days of current program into in-memory dictionary for 0ms zero-latency switching
  useEffect(() => {
    let ignore = false;
    const dayIds = currentProgram.days.map((d) => d.id);
    Promise.all(dayIds.map((id) => getSplitSets(id, todayStr)))
      .then((results) => {
        if (!ignore) {
          const map: Record<string, ExerciseSet[]> = {};
          dayIds.forEach((id, idx) => {
            map[id] = results[idx];
          });
          setProtocolsMap((prev) => ({ ...prev, ...map }));
        }
      })
      .catch((e) => console.warn('Failed to preload program splits:', e));

    return () => {
      ignore = true;
    };
  }, [currentProgram, todayStr]);

  // Current sets for the active day
  const currentSets = useMemo(() => {
    return protocolsMap[activeDay.id] || [];
  }, [protocolsMap, activeDay.id]);

  // Group exercise sets by exercise_name with guaranteed order and fallback
  const groupedExercises = useMemo(() => {
    const splitDef: SplitDefinition | undefined = WORKOUT_SPLITS.find((s) => s.id === activeDay.id);
    const groups: { name: string; sets: ExerciseSet[] }[] = [];

    if (splitDef) {
      for (const ex of splitDef.exercises) {
        const exSets = currentSets.filter((s) => s.exercise_name === ex.name);
        if (exSets.length > 0) {
          groups.push({ name: ex.name, sets: exSets });
        } else {
          // Instant fallback placeholders while loading so screen never collapses
          const placeholders: ExerciseSet[] = [];
          for (let i = 1; i <= ex.sets; i++) {
            placeholders.push({
              id: `${activeDay.id}-${ex.name}-${i}`,
              split_id: activeDay.id,
              exercise_name: ex.name,
              set_number: i,
              weight_kg: ex.defaultWeight,
              reps: ex.defaultReps,
              completed: false,
              date: todayStr,
            });
          }
          groups.push({ name: ex.name, sets: placeholders });
        }
      }
    }
    return groups;
  }, [activeDay.id, currentSets, todayStr]);

  const totalSetsCount = useMemo(() => {
    const splitDef: SplitDefinition | undefined = WORKOUT_SPLITS.find((s) => s.id === activeDay.id);
    if (!splitDef) return currentSets.length || 15;
    return splitDef.exercises.reduce((sum, ex) => sum + ex.sets, 0);
  }, [activeDay.id, currentSets]);

  const completedSetsCount = useMemo(() => {
    return currentSets.filter((s) => s.completed).length;
  }, [currentSets]);

  const completionPercentage = useMemo(() => {
    if (totalSetsCount === 0) return 0;
    return Math.min(100, Math.round((completedSetsCount / totalSetsCount) * 100));
  }, [completedSetsCount, totalSetsCount]);

  // Instant day navigation
  const handlePrevDay = () => {
    setSelectedDayIdx((prev) => (prev > 0 ? prev - 1 : splitDays.length - 1));
  };

  const handleNextDay = () => {
    setSelectedDayIdx((prev) => (prev < splitDays.length - 1 ? prev + 1 : 0));
  };

  // Immediate checkbox toggle: updates state in 0ms and saves to SQLite in background
  const handleToggleSet = (setItem: ExerciseSet) => {
    const nextCompleted = !setItem.completed;

    setProtocolsMap((prev) => {
      const splitSets = prev[activeDay.id] || [];
      const updated = splitSets.map((s) =>
        s.id === setItem.id ? { ...s, completed: nextCompleted } : s
      );
      return { ...prev, [activeDay.id]: updated };
    });

    toggleSetCompletion(setItem.id, nextCompleted)
      .then((result) => {
        if (result.allDone) {
          playAlertSound(settings.timerSoundType || 'bell');
          showMessage(
            'PROTOCOL COMPLETE!',
            `You conquered all ${totalSetsCount} sets for ${activeDay.name}!\n+100 Hunter EXP Bonus earned!`
          );
        }
        void loadProfile();
      })
      .catch((e) => console.warn('Failed to toggle set completion:', e));
  };

  // Immediate weight edit
  const handleChangeWeight = (setId: string, text: string) => {
    const num = parseFloat(text) || 0;
    setProtocolsMap((prev) => {
      const splitSets = prev[activeDay.id] || [];
      const updated = splitSets.map((s) =>
        s.id === setId ? { ...s, weight_kg: num } : s
      );
      return { ...prev, [activeDay.id]: updated };
    });

    const target = currentSets.find((s) => s.id === setId);
    if (target) {
      void updateSetValues(setId, num, target.reps);
    }
  };

  // Immediate reps edit
  const handleChangeReps = (setId: string, text: string) => {
    const num = parseInt(text, 10) || 0;
    setProtocolsMap((prev) => {
      const splitSets = prev[activeDay.id] || [];
      const updated = splitSets.map((s) =>
        s.id === setId ? { ...s, reps: num } : s
      );
      return { ...prev, [activeDay.id]: updated };
    });

    const target = currentSets.find((s) => s.id === setId);
    if (target) {
      void updateSetValues(setId, target.weight_kg, num);
    }
  };

  // Save & Finish Workout
  const handleSaveAndFinish = async () => {
    playAlertSound(settings.timerSoundType || 'bell');
    const expResult = await addHunterExp(50);
    await loadProfile();
    if (expResult.rankAscended) {
      playAlertSound('bell');
      showMessage(
        'RANK ASCENDED!',
        `Congratulations! You climbed the Player Hierarchy and reached ${expResult.newRank.toUpperCase()} (Level ${expResult.newLevel})!`
      );
    } else if (expResult.leveledUp) {
      playAlertSound('bell');
      showMessage(
        'LEVEL UP!',
        `Level Up! You reached Hunter Level ${expResult.newLevel}!`
      );
    } else {
      showMessage(
        'WORKOUT SAVED!',
        `Hunter ${settings.nickname || hunter?.hunter_name || 'Hunter'}, your training data for ${activeDay.name} is safely stored offline.\n\nCompleted: ${completedSetsCount} / ${totalSetsCount} Sets (${completionPercentage}%).\n+50 EXP Bonus Awarded!`
      );
    }
  };

  return (
    <View style={[styles.root, { backgroundColor: theme.background }]}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* 1. TOP HUNTER BAR (Avatar tap opens Profile, Rank tap opens Hierarchy) */}
        <View style={styles.topHunterBar}>
          <View style={styles.topHunterLeft}>
            <SmoothPressable
              onPress={() => setAwakeningOpen(true)}
              style={styles.topAvatarWrapper}
              accessibilityRole="button"
              accessibilityLabel="Open Prime Awakening Profile"
            >
              <View
                style={[
                  styles.topAvatarCircle,
                  { borderColor: theme.tint, shadowColor: theme.glow },
                ]}
              >
                <Image source={currentAvatar.image} style={styles.topAvatarImg} resizeMode="cover" />
              </View>
              <View style={[styles.onlineDot, { backgroundColor: theme.success }]} />
            </SmoothPressable>

            <SmoothPressable
              onPress={() => setVaultOpen(true)}
              style={styles.topHunterInfo}
              accessibilityRole="button"
              accessibilityLabel="Open Player Hierarchy & Rank Vault"
            >
              <View style={styles.topNameRow}>
                <Text style={[styles.topHunterName, { color: theme.text }]} numberOfLines={1}>
                  {settings.nickname || hunter?.hunter_name || 'Hunter'}
                </Text>
                <View style={[styles.rankBadge, { backgroundColor: theme.tint }]}>
                  <Text style={styles.rankBadgeText}>
                    {(hunter?.rank || 'E-Rank').toUpperCase()}
                  </Text>
                </View>
              </View>
              <View style={styles.levelSubRow}>
                <Text style={[styles.levelBadgeText, { color: theme.tint }]}>
                  LV. {hunter?.level ?? 1}
                </Text>
                <View
                  style={[
                    styles.miniExpTrack,
                    { backgroundColor: theme.cardSecondary },
                  ]}
                >
                  <View
                    style={[
                      styles.miniExpFill,
                      {
                        backgroundColor: theme.tint,
                        width: `${Math.min(
                          100,
                          Math.round(((hunter?.exp ?? 0) / (hunter?.max_exp ?? 100)) * 100)
                        )}%`,
                      },
                    ]}
                  />
                </View>
                <Text style={[styles.topQuestSubtitle, { color: theme.textSecondary }]}>
                  {hunter?.exp ?? 0}/{hunter?.max_exp ?? 100} XP
                </Text>
              </View>
            </SmoothPressable>
          </View>

          <View style={styles.topHunterActions}>
            <NotificationBellButton
              streakDays={hunter?.streak_days ?? 4}
              completionPercent={completionPercentage}
            />
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

        {/* 1.5. MODERN WEEK CALENDAR STRIP */}
        <WeekCalendarStrip
          selectedDateStr={selectedCalendarDate}
          onSelectDate={setSelectedCalendarDate}
          onOpenFullCalendar={() => setCalendarOpen(true)}
          completedDates={completedWorkoutDates}
        />

        {/* 2. DAILY PEAK QUEST HERO CARD (Rich Tactical Banner with SVG Glow & Live Telemetry) */}
        <View
          style={[
            styles.dailyQuestCard,
            {
              backgroundColor: theme.card,
              borderColor: `${theme.tint}42`,
              shadowColor: theme.glow,
            },
          ]}
        >
          {/* Ambient SVG Gradient Backdrop */}
          <Svg style={StyleSheet.absoluteFill} pointerEvents="none">
            <Defs>
              <RadialGradient id="questHeroGlow" cx="15%" cy="20%" rx="75%" ry="85%">
                <Stop offset="0%" stopColor={theme.tint} stopOpacity="0.24" />
                <Stop offset="55%" stopColor={theme.tint} stopOpacity="0.06" />
                <Stop offset="100%" stopColor={theme.tint} stopOpacity="0" />
              </RadialGradient>
            </Defs>
            <Rect x="0" y="0" width="100%" height="100%" rx="20" fill="url(#questHeroGlow)" />
          </Svg>

          {/* Top Quest Header & EXP Reward Pill */}
          <View style={styles.questCardTopHeader}>
            <View style={styles.questTagPill}>
              <Ionicons name="sparkles" size={12} color={theme.tint} />
              <Text style={[styles.dailyQuestTag, { color: theme.tint }]}>
                {t('dailyPeakQuest')}
              </Text>
            </View>
            <View
              style={[
                styles.questRewardBadge,
                {
                  backgroundColor: `${theme.tint}1E`,
                  borderColor: `${theme.tint}50`,
                },
              ]}
            >
              <Ionicons name="trophy" size={11} color={theme.tint} />
              <Text style={[styles.questRewardText, { color: theme.tint }]}>
                +100 EXP BONUS
              </Text>
            </View>
          </View>

          {/* Middle Row: Tactical Circular Progress Emblem + Motivational Quote */}
          <View style={styles.dailyQuestRow}>
            <View
              style={[
                styles.questEmblemBox,
                {
                  backgroundColor: `${theme.tint}16`,
                  borderColor: `${theme.tint}45`,
                },
              ]}
            >
              <Svg width={54} height={54} viewBox="0 0 54 54" style={{ transform: [{ rotate: '-90deg' }] }}>
                <Circle
                  cx="27"
                  cy="27"
                  r="22"
                  stroke="rgba(255,255,255,0.10)"
                  strokeWidth="3.5"
                  fill="none"
                />
                <Circle
                  cx="27"
                  cy="27"
                  r="22"
                  stroke={theme.tint}
                  strokeWidth="3.5"
                  fill="none"
                  strokeDasharray={`${2 * Math.PI * 22}`}
                  strokeDashoffset={`${2 * Math.PI * 22 * (1 - Math.max(0.12, completionPercentage / 100))}`}
                  strokeLinecap="round"
                />
              </Svg>
              <View style={styles.questEmblemInnerIcon}>
                <Ionicons
                  name={completionPercentage === 100 ? 'trophy' : 'flame'}
                  size={22}
                  color={theme.tint}
                />
              </View>
            </View>

            <View style={styles.dailyQuestContent}>
              <Text style={[styles.dailyQuestQuote, { color: theme.text }]}>
                {t('dailyPeakQuote')}
              </Text>
              <Text style={[styles.questDirectiveSub, { color: theme.textSecondary }]}>
                Complete {activeDay.name} to advance your rank & streak.
              </Text>
            </View>
          </View>

          {/* Bottom 3-Pill Live Telemetry Strip */}
          <View
            style={[
              styles.questStatsFooter,
              {
                backgroundColor: theme.cardSecondary,
                borderColor: theme.border,
              },
            ]}
          >
            <View style={styles.questStatItem}>
              <Ionicons name="flame" size={14} color="#F59E0B" />
              <Text style={[styles.questStatValue, { color: theme.text }]}>
                {hunter?.streak_days ?? 4} {t('days')}
              </Text>
              <Text style={[styles.questStatLabel, { color: theme.textSecondary }]}>
                Streak
              </Text>
            </View>

            <View style={[styles.questStatDivider, { backgroundColor: theme.border }]} />

            <View style={styles.questStatItem}>
              <Ionicons name="barbell" size={14} color={theme.tint} />
              <Text style={[styles.questStatValue, { color: theme.text }]}>
                {completedSetsCount}/{totalSetsCount}
              </Text>
              <Text style={[styles.questStatLabel, { color: theme.textSecondary }]}>
                Sets
              </Text>
            </View>

            <View style={[styles.questStatDivider, { backgroundColor: theme.border }]} />

            <View style={styles.questStatItem}>
              <Ionicons
                name={completionPercentage === 100 ? 'checkmark-circle' : 'flash'}
                size={14}
                color={completionPercentage === 100 ? theme.success : theme.tint}
              />
              <Text
                style={[
                  styles.questStatValue,
                  { color: completionPercentage === 100 ? theme.success : theme.tint },
                ]}
              >
                {completionPercentage === 100 ? 'Cleared' : 'Active'}
              </Text>
            </View>
          </View>
        </View>

        {/* 3. SPLIT SELECTOR CARD: Dynamically shows selected program title, metadata chips, and days */}
        <View
          style={[
            styles.splitSelectorCard,
            { backgroundColor: theme.card, borderColor: theme.border },
          ]}
        >
          <Svg style={StyleSheet.absoluteFill} pointerEvents="none">
            <Defs>
              <LinearGradient id="splitTopGlow" x1="0" y1="0" x2="1" y2="1">
                <Stop offset="0%" stopColor={theme.tint} stopOpacity="0.14" />
                <Stop offset="60%" stopColor={theme.tint} stopOpacity="0.02" />
                <Stop offset="100%" stopColor={theme.tint} stopOpacity="0" />
              </LinearGradient>
            </Defs>
            <Rect x="0" y="0" width="100%" height="100%" rx="20" fill="url(#splitTopGlow)" />
          </Svg>

          {/* Day Navigation Header */}
          <View style={styles.splitNavHeader}>
            <View style={styles.splitNavLeft}>
              <SmoothPressable
                onPress={handlePrevDay}
                hitSlop={10}
                style={[
                  styles.navArrowBtn,
                  { backgroundColor: theme.cardSecondary, borderColor: theme.border },
                ]}
                accessibilityRole="button"
                accessibilityLabel="Previous Protocol"
              >
                <Ionicons name="chevron-back" size={14} color={theme.tint} />
              </SmoothPressable>

              <View
                style={[
                  styles.splitBadgePill,
                  {
                    backgroundColor: `${theme.tint}16`,
                    borderColor: `${theme.tint}40`,
                  },
                ]}
              >
                <Ionicons name="calendar-outline" size={11} color={theme.tint} />
                <Text style={[styles.splitBadgeText, { color: theme.tint }]}>
                  {activeDay.dayBadge}
                </Text>
              </View>

              <SmoothPressable
                onPress={handleNextDay}
                hitSlop={10}
                style={[
                  styles.navArrowBtn,
                  { backgroundColor: theme.cardSecondary, borderColor: theme.border },
                ]}
                accessibilityRole="button"
                accessibilityLabel="Next Protocol"
              >
                <Ionicons name="chevron-forward" size={14} color={theme.tint} />
              </SmoothPressable>
            </View>

            <View
              style={[
                styles.percentBadgePill,
                {
                  backgroundColor:
                    completionPercentage === 100 ? `${theme.success}20` : `${theme.tint}18`,
                  borderColor:
                    completionPercentage === 100 ? `${theme.success}55` : `${theme.tint}45`,
                },
              ]}
            >
              <View
                style={[
                  styles.percentDot,
                  {
                    backgroundColor:
                      completionPercentage === 100 ? theme.success : theme.tint,
                  },
                ]}
              />
              <Text
                style={[
                  styles.splitPercentText,
                  {
                    color: completionPercentage === 100 ? theme.success : theme.tint,
                  },
                ]}
              >
                {completionPercentage}%
              </Text>
            </View>
          </View>

          {/* Main Program Title */}
          <Text style={[styles.splitMainTitle, { color: theme.text }]}>
            {currentProgram.title}
          </Text>

          {/* Tactical Protocol Metadata Chips Row */}
          <View style={styles.splitMetaChipsRow}>
            <View
              style={[
                styles.splitMetaChip,
                { backgroundColor: theme.cardSecondary, borderColor: theme.border },
              ]}
            >
              <Ionicons name="time-outline" size={12} color={theme.tint} />
              <Text style={[styles.splitMetaChipText, { color: theme.textSecondary }]}>
                ~45 Min
              </Text>
            </View>
            <View
              style={[
                styles.splitMetaChip,
                { backgroundColor: theme.cardSecondary, borderColor: theme.border },
              ]}
            >
              <Ionicons name="layers-outline" size={12} color={theme.tint} />
              <Text style={[styles.splitMetaChipText, { color: theme.textSecondary }]}>
                {groupedExercises.length} Exercises • {totalSetsCount} Sets
              </Text>
            </View>
            <View
              style={[
                styles.splitMetaChip,
                { backgroundColor: theme.cardSecondary, borderColor: theme.border },
              ]}
            >
              <Ionicons name="fitness-outline" size={12} color={theme.tint} />
              <Text
                style={[styles.splitMetaChipText, { color: theme.textSecondary }]}
                numberOfLines={1}
              >
                {activeDay.focus}
              </Text>
            </View>
          </View>

          {/* DYNAMIC TABS: side-by-side equal width for <= 3 days; horizontal scroll for > 3 days */}
          {splitDays.length <= 3 ? (
            <View style={styles.threeTabsRow}>
              {splitDays.map((day, idx) => {
                const isSelected = safeDayIdx === idx;
                return (
                  <SmoothPressable
                    key={day.id}
                    onPress={() => setSelectedDayIdx(idx)}
                    style={[
                      styles.dayTabPill,
                      isSelected
                        ? [
                            styles.dayTabPillActive,
                            {
                              backgroundColor: theme.tint,
                              borderColor: theme.tint,
                              shadowColor: theme.glow,
                            },
                          ]
                        : styles.dayTabPillInactive,
                    ]}
                    accessibilityRole="tab"
                    accessibilityState={{ selected: isSelected }}
                    accessibilityLabel={day.name}
                  >
                    <Text
                      numberOfLines={1}
                      adjustsFontSizeToFit
                      minimumFontScale={0.75}
                      style={[
                        styles.dayTabPillText,
                        isSelected ? styles.dayTabPillTextActive : styles.dayTabPillTextInactive,
                      ]}
                    >
                      {day.shortTab}
                    </Text>
                  </SmoothPressable>
                );
              })}
            </View>
          ) : (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.scrollTabsRow}
            >
              {splitDays.map((day, idx) => {
                const isSelected = safeDayIdx === idx;
                return (
                  <SmoothPressable
                    key={day.id}
                    onPress={() => setSelectedDayIdx(idx)}
                    style={[
                      styles.scrollTabPill,
                      isSelected
                        ? [
                            styles.dayTabPillActive,
                            {
                              backgroundColor: theme.tint,
                              borderColor: theme.tint,
                              shadowColor: theme.glow,
                            },
                          ]
                        : styles.dayTabPillInactive,
                    ]}
                    accessibilityRole="tab"
                    accessibilityState={{ selected: isSelected }}
                    accessibilityLabel={day.name}
                  >
                    <Text
                      numberOfLines={1}
                      style={[
                        styles.dayTabPillText,
                        isSelected ? styles.dayTabPillTextActive : styles.dayTabPillTextInactive,
                      ]}
                    >
                      {day.shortTab}
                    </Text>
                  </SmoothPressable>
                );
              })}
            </ScrollView>
          )}

          {/* Bottom Progress Bar with Label */}
          <View style={styles.progressFooterWrap}>
            <View style={styles.progressLabelRow}>
              <Text style={[styles.progressLabelText, { color: theme.textSecondary }]}>
                Session Progress
              </Text>
              <Text style={[styles.progressCountText, { color: theme.text }]}>
                {completedSetsCount} of {totalSetsCount} sets completed
              </Text>
            </View>
            <View style={[styles.progressBarTrack, { backgroundColor: theme.cardSecondary }]}>
              <View
                style={[
                  styles.progressBarFill,
                  {
                    width: `${Math.max(4, completionPercentage)}%`,
                    backgroundColor: theme.tint,
                  },
                ]}
              />
            </View>
          </View>
        </View>

        {/* 4. TODAY'S TARGET PROTOCOL SECTION HEADER */}
        <View style={styles.protocolHeaderRow}>
          <View style={{ flex: 1, marginRight: 8 }}>
            <Text style={[styles.protocolMainTitle, { color: theme.text }]}>
              {t('todaysTargetProtocol')}
            </Text>
            <Text style={[styles.protocolSubTitle, { color: theme.textSecondary }]}>
              {t('targetMuscles')}: {activeDay.focus}
            </Text>
          </View>
          <View
            style={[
              styles.setsCounterPill,
              {
                backgroundColor: `${theme.tint}16`,
                borderColor: `${theme.tint}40`,
              },
            ]}
          >
            <Text style={[styles.setsDoneCounter, { color: theme.tint }]}>
              {completedSetsCount}/{totalSetsCount} {t('setsDone')}
            </Text>
          </View>
        </View>

        {/* 5. EXERCISES LIST (loaded dynamically for the selected protocol day) */}
        {groupedExercises.map((group, groupIdx) => {
          const groupCompleted = group.sets.filter((s) => s.completed).length;
          const allGroupDone = groupCompleted === group.sets.length && group.sets.length > 0;
          return (
            <View
              key={group.name}
              style={[
                styles.exerciseCard,
                {
                  backgroundColor: theme.card,
                  borderColor: allGroupDone ? `${theme.success}55` : theme.border,
                },
              ]}
            >
              {/* Exercise Header: Number Badge, Title, Target Guide Pill, and Set Counter */}
              <View style={styles.exerciseCardTopRow}>
                <SmoothPressable
                  onPress={() => setGuideExercise(group.name)}
                  style={styles.exerciseHeaderAdjacentRow}
                  accessibilityRole="button"
                  accessibilityLabel={`Open exercise guide for ${group.name}`}
                  hitSlop={6}
                >
                  <View
                    style={[
                      styles.exerciseNumBadge,
                      {
                        backgroundColor: allGroupDone
                          ? `${theme.success}20`
                          : `${theme.tint}1C`,
                        borderColor: allGroupDone
                          ? `${theme.success}55`
                          : `${theme.tint}45`,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.exerciseNumText,
                        { color: allGroupDone ? theme.success : theme.tint },
                      ]}
                    >
                      #{groupIdx + 1}
                    </Text>
                  </View>
                  <Text style={[styles.exerciseCardTitle, { color: theme.text }]}>
                    {group.name}
                  </Text>
                  <View
                    style={[
                      styles.guidePillAdjacentBadge,
                      {
                        backgroundColor: `${theme.tint}16`,
                        borderColor: `${theme.tint}45`,
                      },
                    ]}
                  >
                    <Ionicons name="body-outline" size={12} color={theme.tint} />
                    <Text style={[styles.guidePillText, { color: theme.tint }]}>
                      {t('guide')}
                    </Text>
                  </View>
                </SmoothPressable>

                <View
                  style={[
                    styles.groupProgressBadge,
                    {
                      backgroundColor: allGroupDone
                        ? `${theme.success}1E`
                        : theme.cardSecondary,
                      borderColor: allGroupDone ? `${theme.success}50` : theme.border,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.groupProgressText,
                      { color: allGroupDone ? theme.success : theme.textSecondary },
                    ]}
                  >
                    {groupCompleted}/{group.sets.length}
                  </Text>
                </View>
              </View>

              {/* Table Column Header Strip (100% Pantay Alignment) */}
              <View style={styles.setTableHeaderRow}>
                <View style={styles.colSet}>
                  <Text style={[styles.colHeaderText, { color: theme.textDim }]}>SET</Text>
                </View>
                <View style={styles.colWeight}>
                  <Text style={[styles.colHeaderText, { color: theme.textDim }]}>KG</Text>
                </View>
                <View style={styles.colReps}>
                  <Text style={[styles.colHeaderText, { color: theme.textDim }]}>REPS</Text>
                </View>
                <View style={styles.colAction}>
                  <Ionicons name="checkmark-sharp" size={13} color={theme.textDim} />
                </View>
              </View>

              {/* Set Rows */}
              {group.sets.map((setItem) => {
                const isDone = setItem.completed;
                return (
                  <View
                    key={setItem.id}
                    style={[
                      styles.setRow,
                      {
                        backgroundColor: isDone ? `${theme.tint}14` : 'rgba(255, 255, 255, 0.02)',
                        borderColor: isDone ? `${theme.tint}40` : 'rgba(255, 255, 255, 0.06)',
                      },
                    ]}
                  >
                    {/* Col 1: Set Number Badge */}
                    <View style={styles.colSet}>
                      <View
                        style={[
                          styles.setNumberBadge,
                          {
                            backgroundColor: isDone ? theme.tint : theme.cardSecondary,
                            borderColor: isDone ? theme.tint : theme.border,
                          },
                        ]}
                      >
                        <Text
                          style={[
                            styles.setNumberText,
                            { color: isDone ? '#FFFFFF' : theme.textSecondary },
                          ]}
                        >
                          {setItem.set_number}
                        </Text>
                      </View>
                    </View>

                    {/* Col 2: Weight (KG) Input Box */}
                    <View style={styles.colWeight}>
                      <TextInput
                        style={[
                          styles.numInputBox,
                          {
                            backgroundColor: theme.cardSecondary,
                            borderColor: isDone ? `${theme.tint}55` : theme.border,
                            color: theme.text,
                          },
                        ]}
                        value={String(setItem.weight_kg)}
                        onChangeText={(t) => handleChangeWeight(setItem.id, t)}
                        keyboardType="numeric"
                        maxLength={5}
                        selectTextOnFocus
                      />
                    </View>

                    {/* Col 3: Reps Input Box */}
                    <View style={styles.colReps}>
                      <TextInput
                        style={[
                          styles.numInputBox,
                          {
                            backgroundColor: theme.cardSecondary,
                            borderColor: isDone ? `${theme.tint}55` : theme.border,
                            color: theme.text,
                          },
                        ]}
                        value={String(setItem.reps)}
                        onChangeText={(t) => handleChangeReps(setItem.id, t)}
                        keyboardType="numeric"
                        maxLength={4}
                        selectTextOnFocus
                      />
                    </View>

                    {/* Col 4: Completion Checkbox */}
                    <View style={styles.colAction}>
                      <SmoothPressable
                        onPress={() => handleToggleSet(setItem)}
                        style={[
                          styles.checkboxBtn,
                          {
                            backgroundColor: isDone ? theme.tint : theme.cardSecondary,
                            borderColor: isDone ? theme.tint : theme.border,
                            shadowColor: isDone ? theme.tint : 'transparent',
                          },
                        ]}
                        accessibilityRole="checkbox"
                        accessibilityState={{ checked: isDone }}
                        accessibilityLabel={`Set ${setItem.set_number} ${isDone ? 'completed' : 'incomplete'}`}
                        hitSlop={6}
                      >
                        {isDone ? (
                          <Ionicons name="checkmark" size={17} color="#FFFFFF" />
                        ) : (
                          <Ionicons name="checkmark" size={13} color="rgba(255, 255, 255, 0.15)" />
                        )}
                      </SmoothPressable>
                    </View>
                  </View>
                );
              })}
            </View>
          );
        })}

        {/* 6. BIG ACTION BUTTON: SAVE & FINISH WORKOUT SESSION */}
        <SmoothPressable
          onPress={handleSaveAndFinish}
          style={[
            styles.saveFinishBtn,
            {
              backgroundColor: theme.tint,
              shadowColor: theme.glow,
            },
          ]}
          accessibilityRole="button"
          accessibilityLabel="Save & Finish Workout Session"
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
            <Ionicons name="checkmark-done" size={18} color="#FFFFFF" />
            <Text style={styles.saveFinishBtnText}>{t('saveWorkout')}</Text>
          </View>
        </SmoothPressable>

        <View style={{ height: 95 }} />
      </ScrollView>

      {/* EXERCISE COACHING GUIDE MODAL */}
      <ExerciseGuideModal
        exerciseName={guideExercise}
        onClose={() => setGuideExercise(null)}
      />

      {/* PRIME AWAKENING PROFILE MODAL */}
      <PrimeAwakeningModal
        visible={awakeningOpen}
        onClose={() => setAwakeningOpen(false)}
        onSave={() => loadProfile()}
      />

      {/* WORKOUT CALENDAR & HISTORY DISPATCH MODAL */}
      <WorkoutCalendarModal
        visible={calendarOpen}
        onClose={() => setCalendarOpen(false)}
        onSelectDate={setSelectedCalendarDate}
        streakDays={hunter?.streak_days ?? 4}
      />

      {/* PLAYER HIERARCHY & RANK PROGRESSION VAULT MODAL */}
      <RankUnlockVaultModal
        visible={vaultOpen}
        profile={hunter}
        initialTab="ranks"
        onClose={() => setVaultOpen(false)}
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
    paddingTop: 14,
  },

  // 1. TOP HUNTER BAR
  topHunterBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  topHunterLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 10,
  },
  topAvatarWrapper: {
    marginRight: 10,
    borderRadius: 28,
    padding: 2,
    borderWidth: 1.5,
  },
  onlineDot: {
    position: 'absolute',
    bottom: 1,
    right: 1,
    width: 11,
    height: 11,
    borderRadius: 5.5,
    borderWidth: 2,
    borderColor: '#08080B',
  },
  topAvatarCircle: {
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
  topAvatarImg: {
    width: '100%',
    height: '100%',
  },
  topHunterInfo: {
    flex: 1,
  },
  topNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  topHunterName: {
    fontFamily: 'Poppins-Bold',
    fontSize: 19,
    fontWeight: '900',
    letterSpacing: 0.2,
    maxWidth: '72%',
  },
  rankBadge: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
  },
  rankBadgeText: {
    fontFamily: 'Poppins-Bold',
    color: '#FFFFFF',
    fontSize: 10.5,
    fontWeight: '900',
    letterSpacing: 0.6,
  },
  levelSubRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    marginTop: 4,
  },
  levelBadgeText: {
    fontFamily: 'Poppins-Bold',
    fontSize: 11.5,
    fontWeight: '800',
  },
  miniExpTrack: {
    width: 58,
    height: 5,
    borderRadius: 3,
    overflow: 'hidden',
  },
  miniExpFill: {
    height: '100%',
    borderRadius: 3,
  },
  topQuestSubtitle: {
    fontFamily: 'Poppins-Medium',
    fontSize: 11.5,
    fontWeight: '600',
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

  // 2. DAILY PEAK QUEST CARD
  dailyQuestCard: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 16,
    marginBottom: 14,
    overflow: 'hidden',
    shadowOffset: { width: 0, height: 8 },
    shadowRadius: 18,
    shadowOpacity: 0.35,
    elevation: 5,
  },
  questCardTopHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  questTagPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  questRewardBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    borderWidth: 1,
  },
  questRewardText: {
    fontFamily: 'Poppins-Bold',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.4,
  },
  dailyQuestRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginBottom: 14,
  },
  questEmblemBox: {
    width: 58,
    height: 58,
    borderRadius: 18,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  questEmblemInnerIcon: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dailyQuestContent: {
    flex: 1,
  },
  dailyQuestTag: {
    fontFamily: 'Poppins-Bold',
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 0.8,
  },
  dailyQuestQuote: {
    fontFamily: 'Poppins-SemiBold',
    fontSize: 14,
    fontWeight: '700',
    fontStyle: 'italic',
    lineHeight: 20,
    marginBottom: 4,
  },
  questDirectiveSub: {
    fontFamily: 'Poppins-Medium',
    fontSize: 11.5,
    fontWeight: '500',
  },
  questStatsFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    borderRadius: 13,
    borderWidth: 1,
    paddingVertical: 8,
    paddingHorizontal: 10,
  },
  questStatItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  questStatValue: {
    fontFamily: 'Poppins-Bold',
    fontSize: 12,
    fontWeight: '800',
  },
  questStatLabel: {
    fontFamily: 'Poppins-Medium',
    fontSize: 11,
  },
  questStatDivider: {
    width: 1,
    height: 14,
  },

  // 3. SPLIT SELECTOR CARD
  splitSelectorCard: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 16,
    marginBottom: 16,
    overflow: 'hidden',
    shadowOffset: { width: 0, height: 8 },
    shadowRadius: 18,
    shadowOpacity: 0.35,
    elevation: 4,
  },
  splitNavHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  splitNavLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  navArrowBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  splitBadgePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
  },
  splitBadgeText: {
    fontFamily: 'Poppins-Bold',
    fontSize: 11.5,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  percentBadgePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    borderWidth: 1,
  },
  percentDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  splitPercentText: {
    fontFamily: 'Poppins-Bold',
    fontSize: 13.5,
    fontWeight: '900',
  },
  splitMainTitle: {
    fontFamily: 'Poppins-Bold',
    fontSize: 21,
    fontWeight: '900',
    marginBottom: 10,
    letterSpacing: 0.1,
  },
  splitMetaChipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 14,
  },
  splitMetaChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
  },
  splitMetaChipText: {
    fontFamily: 'Poppins-Medium',
    fontSize: 11,
    fontWeight: '600',
  },
  threeTabsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 14,
  },
  scrollTabsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 14,
    paddingRight: 10,
  },
  dayTabPill: {
    flex: 1,
    paddingVertical: 9,
    paddingHorizontal: 4,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollTabPill: {
    paddingVertical: 9,
    paddingHorizontal: 14,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayTabPillActive: {
    backgroundColor: '#EF4444',
    borderWidth: 1.5,
    borderColor: '#F97316',
    shadowColor: '#F97316',
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 8,
    shadowOpacity: 0.65,
    elevation: 5,
  },
  dayTabPillInactive: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.10)',
  },
  dayTabPillText: {
    fontSize: 12.5,
    letterSpacing: 0.2,
  },
  dayTabPillTextActive: {
    color: '#FFFFFF',
    fontWeight: '900',
  },
  dayTabPillTextInactive: {
    color: '#B7AAB0',
    fontWeight: '700',
  },
  progressFooterWrap: {
    gap: 6,
  },
  progressLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  progressLabelText: {
    fontFamily: 'Poppins-Medium',
    fontSize: 11,
    fontWeight: '600',
  },
  progressCountText: {
    fontFamily: 'Poppins-SemiBold',
    fontSize: 11,
    fontWeight: '700',
  },
  progressBarTrack: {
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 3,
  },

  // 4. PROTOCOL SECTION HEADER
  protocolHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  protocolMainTitle: {
    fontFamily: 'Poppins-Bold',
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: -0.4,
  },
  protocolSubTitle: {
    fontFamily: 'Poppins-Regular',
    fontSize: 12.5,
    marginTop: 2,
  },
  setsCounterPill: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
    borderWidth: 1,
  },
  setsDoneCounter: {
    fontFamily: 'Poppins-Bold',
    fontSize: 12.5,
    fontWeight: '800',
  },

  // 5. EXERCISE CARD
  exerciseCard: {
    borderRadius: 18,
    borderWidth: 1.2,
    padding: 14,
    marginBottom: 14,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 12,
    shadowOpacity: 0.25,
    elevation: 3,
  },
  exerciseCardTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.06)',
    gap: 8,
  },
  exerciseHeaderAdjacentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
    flexWrap: 'wrap',
  },
  exerciseNumBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    borderWidth: 1,
  },
  exerciseNumText: {
    fontFamily: 'Poppins-Bold',
    fontSize: 11,
    fontWeight: '800',
  },
  exerciseCardTitle: {
    fontFamily: 'Poppins-Bold',
    fontSize: 16.5,
    fontWeight: '800',
  },
  groupProgressBadge: {
    paddingHorizontal: 9,
    paddingVertical: 3.5,
    borderRadius: 8,
    borderWidth: 1,
  },
  groupProgressText: {
    fontFamily: 'Poppins-Bold',
    fontSize: 11,
    fontWeight: '800',
  },
  guidePillAdjacentBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  guidePillText: {
    fontFamily: 'Poppins-Bold',
    fontSize: 11,
    fontWeight: '800',
  },

  // SET TABLE & ROWS (100% Pantay Structured Columns)
  setTableHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 6,
    marginBottom: 4,
  },
  colHeaderText: {
    fontFamily: 'Poppins-Bold',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.8,
    textAlign: 'center',
  },
  colSet: {
    width: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  colWeight: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  colReps: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  colAction: {
    width: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  setRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 5,
    paddingHorizontal: 8,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 6,
  },
  setNumberBadge: {
    width: 28,
    height: 28,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  setNumberText: {
    fontFamily: 'Poppins-Bold',
    fontSize: 12.5,
    fontWeight: '800',
  },
  numInputBox: {
    width: '100%',
    maxWidth: 92,
    height: 40,
    borderRadius: 10,
    borderWidth: 1.2,
    textAlign: 'center',
    fontSize: 16,
    fontFamily: 'Poppins-Bold',
    fontWeight: '700',
    paddingVertical: 0,
  },
  checkboxBtn: {
    width: 34,
    height: 34,
    borderRadius: 9,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    shadowOffset: { width: 0, height: 0 },
    shadowRadius: 6,
    elevation: 3,
  },

  // 6. SAVE & FINISH BUTTON
  saveFinishBtn: {
    height: 52,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
    marginBottom: 16,
    shadowOffset: { width: 0, height: 14 },
    shadowRadius: 14,
    shadowOpacity: 0.75,
    elevation: 6,
  },
  saveFinishBtnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '900',
    letterSpacing: 0.3,
  },
});
