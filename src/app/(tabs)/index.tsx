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
import { ExerciseGuideModal } from '@/components/ExerciseGuideModal';
import { PrimeAwakeningModal } from '@/components/PrimeAwakeningModal';
import { SmoothPressable } from '@/components/SmoothPressable';
import {
  addHunterExp,
  getHunterProfile,
  getTodayDateString,
  type HunterProfile,
} from '@/db/hunter';
import { getProgramById, type ProgramDay } from '@/db/programs';
import {
  getSplitSets,
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
    await addHunterExp(50);
    await loadProfile();
    showMessage(
      'WORKOUT SAVED!',
      `Hunter ${settings.nickname || 'Hunter'}, your training data for ${activeDay.name} is safely stored offline.\n\nCompleted: ${completedSetsCount} / ${totalSetsCount} Sets (${completionPercentage}%).\n+50 EXP Bonus Awarded!`
    );
  };

  return (
    <View style={[styles.root, { backgroundColor: theme.background }]}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* 1. TOP HUNTER BAR (Profile tap opens Prime Awakening) */}
        <View style={styles.topHunterBar}>
          <SmoothPressable
            onPress={() => setAwakeningOpen(true)}
            style={styles.topHunterLeft}
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
              <View
                style={[
                  styles.topAvatarCircle,
                  { borderColor: theme.tint, shadowColor: theme.glow },
                ]}
              >
                <Image source={currentAvatar.image} style={styles.topAvatarImg} resizeMode="cover" />
              </View>
            </View>
            <View style={styles.topHunterInfo}>
              <View style={styles.topNameRow}>
                <Text style={[styles.topHunterName, { color: theme.text }]} numberOfLines={1}>
                  {settings.nickname || 'John Mark Dalumpienes'}
                </Text>
                <View style={[styles.rankBadge, { backgroundColor: theme.tint }]}>
                  <Text style={styles.rankBadgeText}>E-RANK</Text>
                </View>
              </View>
              <Text style={[styles.topQuestSubtitle, { color: theme.textSecondary }]}>
                {t('questSubtitle')}
              </Text>
            </View>
          </SmoothPressable>

          <View style={styles.topHunterActions}>
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

        {/* 2. DAILY PEAK QUEST HERO CARD */}
        <View
          style={[
            styles.dailyQuestCard,
            { backgroundColor: theme.card, borderColor: theme.borderRose },
          ]}
        >
          <View style={styles.dailyQuestRow}>
            <View
              style={[
                styles.dailyQuestAvatarWrap,
                { borderColor: theme.tint, shadowColor: theme.glow },
              ]}
            >
              <Image
                source={currentAvatar.image}
                style={styles.dailyQuestAvatarImg}
                resizeMode="cover"
              />
            </View>
            <View style={styles.dailyQuestContent}>
              <View style={styles.dailyQuestTagRow}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
                  <Ionicons name="flash-outline" size={13} color={theme.accentAmber} />
                  <Text style={[styles.dailyQuestTag, { color: theme.accentAmber }]}>
                    {t('dailyPeakQuest')}
                  </Text>
                </View>
              </View>
              <Text style={[styles.dailyQuestQuote, { color: theme.text }]}>
                {t('dailyPeakQuote')}
              </Text>
              <View
                style={[
                  styles.streakPill,
                  {
                    backgroundColor: 'rgba(245, 158, 11, 0.15)',
                    borderColor: '#F59E0B55',
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 5,
                  },
                ]}
              >
                <Ionicons name="flame-outline" size={13} color="#F97316" />
                <Text style={styles.streakPillText}>
                  {t('hunterStreak')}: {hunter?.streak_days ?? 1} {t('days')}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* 3. SPLIT SELECTOR CARD: Dynamically shows selected program title and days */}
        <View
          style={[
            styles.splitSelectorCard,
            { backgroundColor: theme.card, borderColor: theme.borderRose },
          ]}
        >
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
                  { backgroundColor: theme.cardSecondary, borderColor: theme.border },
                ]}
              >
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

            <Text style={[styles.splitPercentText, { color: theme.tint }]}>
              {completionPercentage}%
            </Text>
          </View>

          {/* Main Program Title (dynamically updates with active program) */}
          <Text style={[styles.splitMainTitle, { color: theme.text }]}>
            {currentProgram.title}
          </Text>

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
                      isSelected ? styles.dayTabPillActive : styles.dayTabPillInactive,
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
                      isSelected ? styles.dayTabPillActive : styles.dayTabPillInactive,
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

          {/* Bottom Progress Bar Line */}
          <View style={[styles.progressBarTrack, { backgroundColor: theme.cardSecondary }]}>
            <View
              style={[
                styles.progressBarFill,
                { width: `${completionPercentage}%`, backgroundColor: '#EF4444' },
              ]}
            />
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
          <Text style={[styles.setsDoneCounter, { color: theme.textSecondary }]}>
            {completedSetsCount} / {totalSetsCount} {t('setsDone')}
          </Text>
        </View>

        {/* 5. EXERCISES LIST (loaded dynamically for the selected protocol day) */}
        {groupedExercises.map((group) => {
          return (
            <View
              key={group.name}
              style={[
                styles.exerciseCard,
                { backgroundColor: theme.card, borderColor: theme.borderRose },
              ]}
            >
              {/* Exercise Header: Title and Guide pill placed right beside each other */}
              <SmoothPressable
                onPress={() => setGuideExercise(group.name)}
                style={styles.exerciseHeaderAdjacentRow}
                accessibilityRole="button"
                accessibilityLabel={`Open exercise guide for ${group.name}`}
                hitSlop={6}
              >
                <Text style={[styles.exerciseCardTitle, { color: theme.text }]}>
                  {group.name}
                </Text>
                <View style={styles.guidePillAdjacentBadge}>
                  <Text style={styles.guidePillText}>{t('guide')} ℹ️</Text>
                </View>
              </SmoothPressable>

              {/* Set Rows */}
              {group.sets.map((setItem) => {
                const isDone = setItem.completed;
                return (
                  <View
                    key={setItem.id}
                    style={[
                      styles.setRow,
                      {
                        backgroundColor: isDone ? `${theme.tint}14` : 'transparent',
                        borderColor: isDone ? `${theme.tint}40` : 'transparent',
                      },
                    ]}
                  >
                    <Text style={[styles.setLabelText, { color: theme.textSecondary }]}>
                      SET {setItem.set_number}
                    </Text>

                    {/* Weight (KG) Input */}
                    <View style={styles.setInputGroup}>
                      <TextInput
                        style={[
                          styles.numInputBox,
                          {
                            backgroundColor: theme.cardSecondary,
                            borderColor: theme.border,
                            color: theme.text,
                          },
                        ]}
                        value={String(setItem.weight_kg)}
                        onChangeText={(t) => handleChangeWeight(setItem.id, t)}
                        keyboardType="numeric"
                        maxLength={5}
                        selectTextOnFocus
                      />
                      <Text style={[styles.inputUnitLabel, { color: theme.textSecondary }]}>KG</Text>
                    </View>

                    {/* Reps Input */}
                    <View style={styles.setInputGroup}>
                      <TextInput
                        style={[
                          styles.numInputBox,
                          {
                            backgroundColor: theme.cardSecondary,
                            borderColor: theme.border,
                            color: theme.text,
                          },
                        ]}
                        value={String(setItem.reps)}
                        onChangeText={(t) => handleChangeReps(setItem.id, t)}
                        keyboardType="numeric"
                        maxLength={4}
                        selectTextOnFocus
                      />
                      <Text style={[styles.inputUnitLabel, { color: theme.textSecondary }]}>
                        REPS
                      </Text>
                    </View>

                    {/* Completion Checkbox */}
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
                      {isDone && <Ionicons name="checkmark" size={17} color="#FFFFFF" />}
                    </SmoothPressable>
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
    maxWidth: '75%',
  },
  rankBadge: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 5,
  },
  rankBadgeText: {
    fontFamily: 'Poppins-Bold',
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 0.6,
  },
  topQuestSubtitle: {
    fontFamily: 'Poppins-Medium',
    fontSize: 13,
    fontWeight: '600',
    marginTop: 2,
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
    borderRadius: 18,
    borderWidth: 1.2,
    padding: 16,
    marginBottom: 14,
    shadowOffset: { width: 0, height: 0 },
    shadowRadius: 12,
    shadowOpacity: 0.45,
    elevation: 3,
  },
  dailyQuestRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  dailyQuestAvatarWrap: {
    width: 58,
    height: 58,
    borderRadius: 29,
    borderWidth: 2,
    overflow: 'hidden',
    shadowOffset: { width: 0, height: 0 },
    shadowRadius: 10,
    shadowOpacity: 0.7,
    elevation: 4,
  },
  dailyQuestAvatarImg: {
    width: '100%',
    height: '100%',
  },
  dailyQuestContent: {
    flex: 1,
  },
  dailyQuestTagRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  dailyQuestTag: {
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 0.8,
  },
  dailyQuestQuote: {
    fontSize: 14,
    fontWeight: '700',
    fontStyle: 'italic',
    lineHeight: 19,
    marginBottom: 8,
  },
  streakPill: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 12,
    borderWidth: 1,
  },
  streakPillText: {
    color: '#F59E0B',
    fontSize: 12,
    fontWeight: '800',
  },

  // 3. SPLIT SELECTOR CARD
  splitSelectorCard: {
    borderRadius: 18,
    borderWidth: 1.2,
    padding: 16,
    marginBottom: 16,
    shadowOffset: { width: 0, height: 0 },
    shadowRadius: 12,
    shadowOpacity: 0.45,
    elevation: 3,
  },
  splitNavHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  splitNavLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  navArrowBtn: {
    width: 26,
    height: 26,
    borderRadius: 13,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  splitBadgePill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
  },
  splitBadgeText: {
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  splitPercentText: {
    fontSize: 16,
    fontWeight: '900',
  },
  splitMainTitle: {
    fontSize: 21,
    fontWeight: '900',
    marginBottom: 12,
    letterSpacing: 0.2,
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
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollTabPill: {
    paddingVertical: 9,
    paddingHorizontal: 14,
    borderRadius: 20,
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
    shadowOpacity: 0.8,
    elevation: 5,
  },
  dayTabPillInactive: {
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
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
  progressBarTrack: {
    height: 4,
    borderRadius: 2,
    overflow: 'hidden',
    marginTop: 2,
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 2,
  },

  // 4. PROTOCOL SECTION HEADER
  protocolHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  protocolMainTitle: {
    fontSize: 19.5,
    fontWeight: '900',
  },
  protocolSubTitle: {
    fontSize: 13,
    fontWeight: '600',
    marginTop: 2,
  },
  setsDoneCounter: {
    fontSize: 14,
    fontWeight: '800',
  },

  // 5. EXERCISE CARD
  exerciseCard: {
    borderRadius: 16,
    borderWidth: 1.2,
    padding: 14,
    marginBottom: 14,
    shadowOffset: { width: 0, height: 0 },
    shadowRadius: 10,
    shadowOpacity: 0.35,
    elevation: 2,
  },
  exerciseHeaderAdjacentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
    alignSelf: 'flex-start',
    flexWrap: 'wrap',
  },
  exerciseCardTitle: {
    fontSize: 17.5,
    fontWeight: '800',
  },
  guidePillAdjacentBadge: {
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    borderColor: '#F59E0B',
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  guidePillText: {
    color: '#F59E0B',
    fontSize: 12,
    fontWeight: '800',
  },

  // SET ROW
  setRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderRadius: 10,
    borderWidth: 1,
    marginBottom: 6,
  },
  setLabelText: {
    fontSize: 13,
    fontWeight: '800',
    width: 48,
  },
  setInputGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  numInputBox: {
    width: 64,
    height: 40,
    borderRadius: 10,
    borderWidth: 1.5,
    textAlign: 'center',
    fontSize: 16,
    fontWeight: '800',
    paddingVertical: 0,
  },
  inputUnitLabel: {
    fontSize: 12,
    fontWeight: '800',
    width: 38,
  },
  checkboxBtn: {
    width: 32,
    height: 32,
    borderRadius: 8,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    shadowOffset: { width: 0, height: 0 },
    shadowRadius: 6,
    shadowOpacity: 0.6,
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
