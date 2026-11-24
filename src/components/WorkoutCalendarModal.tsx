import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useMemo, useState } from 'react';
import {
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SmoothPressable } from '@/components/SmoothPressable';
import { getWorkoutHistory, type WorkoutHistoryEntry } from '@/db/workouts';
import { FONTS, useTheme } from '@/theme';

interface WorkoutCalendarModalProps {
  visible: boolean;
  onClose: () => void;
  onSelectDate?: (dateStr: string) => void;
  streakDays?: number;
}

const WEEKDAY_NAMES = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'];
const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

function formatDateKey(year: number, monthZeroIndexed: number, day: number): string {
  const m = String(monthZeroIndexed + 1).padStart(2, '0');
  const d = String(day).padStart(2, '0');
  return `${year}-${m}-${d}`;
}

function getTodayKey(): string {
  const now = new Date();
  return formatDateKey(now.getFullYear(), now.getMonth(), now.getDate());
}

export function WorkoutCalendarModal({
  visible,
  onClose,
  onSelectDate,
  streakDays = 4,
}: WorkoutCalendarModalProps) {
  const theme = useTheme();

  const todayStr = useMemo(() => getTodayKey(), []);
  const today = useMemo(() => new Date(), []);

  // Displayed month and year
  const [displayYear, setDisplayYear] = useState(today.getFullYear());
  const [displayMonth, setDisplayMonth] = useState(today.getMonth());
  const [selectedDateStr, setSelectedDateStr] = useState(todayStr);

  // History entries mapped by date
  const [historyList, setHistoryList] = useState<WorkoutHistoryEntry[]>([]);

  useEffect(() => {
    if (!visible) return;
    let isMounted = true;
    getWorkoutHistory(60)
      .then((history) => {
        if (isMounted) {
          setHistoryList(history);
        }
      })
      .catch((err) => {
        console.warn('Failed to fetch calendar workout history:', err);
      });

    return () => {
      isMounted = false;
    };
  }, [visible]);

  // Map history by date string 'YYYY-MM-DD'
  const historyByDate = useMemo(() => {
    const map = new Map<string, WorkoutHistoryEntry>();
    for (const item of historyList) {
      map.set(item.date, item);
    }
    return map;
  }, [historyList]);

  // Calendar matrix calculation for the displayed month
  const calendarDays = useMemo(() => {
    const daysInMonth = new Date(displayYear, displayMonth + 1, 0).getDate();
    // getDay() gives 0 for Sunday, 1 for Monday... adjust so Monday is index 0
    const firstDayIndex = (new Date(displayYear, displayMonth, 1).getDay() + 6) % 7;

    const cells: {
      dayNumber: number | null;
      dateKey: string | null;
      isCurrentMonth: boolean;
    }[] = [];

    // Empty cells before the first day of the month
    for (let i = 0; i < firstDayIndex; i++) {
      cells.push({ dayNumber: null, dateKey: null, isCurrentMonth: false });
    }

    // Days of the month
    for (let d = 1; d <= daysInMonth; d++) {
      const key = formatDateKey(displayYear, displayMonth, d);
      cells.push({ dayNumber: d, dateKey: key, isCurrentMonth: true });
    }

    return cells;
  }, [displayYear, displayMonth]);

  const handlePrevMonth = () => {
    if (displayMonth === 0) {
      setDisplayYear((y) => y - 1);
      setDisplayMonth(11);
    } else {
      setDisplayMonth((m) => m - 1);
    }
  };

  const handleNextMonth = () => {
    if (displayMonth === 11) {
      setDisplayYear((y) => y + 1);
      setDisplayMonth(0);
    } else {
      setDisplayMonth((m) => m + 1);
    }
  };

  const handleJumpToToday = () => {
    setDisplayYear(today.getFullYear());
    setDisplayMonth(today.getMonth());
    setSelectedDateStr(todayStr);
  };

  const selectedEntry = selectedDateStr ? historyByDate.get(selectedDateStr) : undefined;
  const isSelectedToday = selectedDateStr === todayStr;

  // Monthly stats
  const workoutsInMonth = useMemo(() => {
    const prefix = `${displayYear}-${String(displayMonth + 1).padStart(2, '0')}`;
    let count = 0;
    for (const item of historyList) {
      if (item.date.startsWith(prefix) && item.completedSets > 0) {
        count++;
      }
    }
    return count;
  }, [displayYear, displayMonth, historyList]);

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <View style={styles.modalBackdrop}>
        <View
          style={[
            styles.modalContainer,
            {
              backgroundColor: theme.card,
              borderColor: theme.border,
            },
          ]}
        >
          {/* Top Drag Handle */}
          <View style={styles.dragHandleBar}>
            <View
              style={[
                styles.dragHandlePill,
                { backgroundColor: theme.border },
              ]}
            />
          </View>

          {/* Modal Header Row */}
          <View style={styles.modalHeaderRow}>
            <View style={styles.modalHeaderTitleRow}>
              <View
                style={[
                  styles.calendarIconSquircle,
                  {
                    backgroundColor: `${theme.tint}18`,
                    borderColor: `${theme.tint}40`,
                  },
                ]}
              >
                <Ionicons name="calendar-sharp" size={17} color={theme.tint} />
              </View>
              <View>
                <Text style={[styles.modalTitleText, { color: theme.text }]}>
                  Hunter Chronicle
                </Text>
                <Text style={[styles.modalSubtitleText, { color: theme.textSecondary }]}>
                  Workout Logs & Consistency Calendar
                </Text>
              </View>
            </View>

            <SmoothPressable
              onPress={onClose}
              style={[
                styles.closeBtn,
                { backgroundColor: theme.cardSecondary, borderColor: theme.border },
              ]}
              accessibilityRole="button"
              accessibilityLabel="Close calendar"
              hitSlop={8}
            >
              <Ionicons name="close" size={18} color={theme.textSecondary} />
            </SmoothPressable>
          </View>

          <ScrollView
            style={styles.modalScroll}
            contentContainerStyle={styles.modalScrollContent}
            showsVerticalScrollIndicator={false}
          >
            {/* Monthly Consistency Metrics Bar */}
            <View
              style={[
                styles.monthlyMetricsCard,
                {
                  backgroundColor: theme.cardSecondary,
                  borderColor: theme.border,
                },
              ]}
            >
              <View style={styles.metricItem}>
                <Ionicons name="barbell" size={15} color={theme.tint} />
                <Text style={[styles.metricValue, { color: theme.text }]}>
                  {workoutsInMonth} Sessions
                </Text>
                <Text style={[styles.metricLabel, { color: theme.textSecondary }]}>
                  This Month
                </Text>
              </View>

              <View style={[styles.metricDivider, { backgroundColor: theme.border }]} />

              <View style={styles.metricItem}>
                <Ionicons name="flame" size={15} color="#F59E0B" />
                <Text style={[styles.metricValue, { color: theme.text }]}>
                  {streakDays} Days
                </Text>
                <Text style={[styles.metricLabel, { color: theme.textSecondary }]}>
                  Hunter Streak
                </Text>
              </View>

              <View style={[styles.metricDivider, { backgroundColor: theme.border }]} />

              <View style={styles.metricItem}>
                <Ionicons name="trophy" size={15} color={theme.accentGold} />
                <Text style={[styles.metricValue, { color: theme.text }]}>
                  {Math.min(100, Math.round((workoutsInMonth / 16) * 100))}%
                </Text>
                <Text style={[styles.metricLabel, { color: theme.textSecondary }]}>
                  Target Rate
                </Text>
              </View>
            </View>

            {/* Month Navigator Header Bar */}
            <View style={styles.monthNavRow}>
              <SmoothPressable
                onPress={handlePrevMonth}
                style={[
                  styles.navArrowBtn,
                  { backgroundColor: theme.cardSecondary, borderColor: theme.border },
                ]}
                hitSlop={8}
              >
                <Ionicons name="chevron-back" size={16} color={theme.text} />
              </SmoothPressable>

              <View style={styles.monthCenterInfo}>
                <Text style={[styles.monthNameText, { color: theme.text }]}>
                  {MONTH_NAMES[displayMonth]} {displayYear}
                </Text>
              </View>

              <View style={styles.monthNavRightWrap}>
                <SmoothPressable
                  onPress={handleJumpToToday}
                  style={[
                    styles.todayBadgeBtn,
                    {
                      backgroundColor: `${theme.tint}18`,
                      borderColor: `${theme.tint}45`,
                    },
                  ]}
                  hitSlop={8}
                >
                  <Text style={[styles.todayBadgeText, { color: theme.tint }]}>
                    TODAY
                  </Text>
                </SmoothPressable>

                <SmoothPressable
                  onPress={handleNextMonth}
                  style={[
                    styles.navArrowBtn,
                    { backgroundColor: theme.cardSecondary, borderColor: theme.border },
                  ]}
                  hitSlop={8}
                >
                  <Ionicons name="chevron-forward" size={16} color={theme.text} />
                </SmoothPressable>
              </View>
            </View>

            {/* 7-Day Weekday Labels Header */}
            <View style={styles.weekdayLabelsRow}>
              {WEEKDAY_NAMES.map((name) => (
                <View key={name} style={styles.weekdayLabelCell}>
                  <Text style={[styles.weekdayLabelText, { color: theme.textDim }]}>
                    {name}
                  </Text>
                </View>
              ))}
            </View>

            {/* 7-Column Calendar Days Grid */}
            <View style={styles.daysGrid}>
              {calendarDays.map((cell, idx) => {
                if (!cell.isCurrentMonth || !cell.dateKey) {
                  return <View key={`empty_${idx}`} style={styles.dayCellEmpty} />;
                }

                const isToday = cell.dateKey === todayStr;
                const isSelected = cell.dateKey === selectedDateStr;
                const historyEntry = historyByDate.get(cell.dateKey);
                const hasCompletedWorkout =
                  Boolean(historyEntry && historyEntry.completedSets > 0);

                return (
                  <SmoothPressable
                    key={cell.dateKey}
                    onPress={() => {
                      if (cell.dateKey) {
                        setSelectedDateStr(cell.dateKey);
                        onSelectDate?.(cell.dateKey);
                      }
                    }}
                    style={[
                      styles.dayCell,
                      {
                        backgroundColor: isSelected
                          ? `${theme.tint}22`
                          : isToday
                          ? theme.cardSecondary
                          : 'transparent',
                        borderColor: isSelected
                          ? theme.tint
                          : isToday
                          ? `${theme.tint}60`
                          : 'transparent',
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.dayNumberText,
                        {
                          color: isSelected
                            ? theme.tint
                            : isToday
                            ? theme.tint
                            : theme.text,
                          fontFamily: isSelected || isToday ? FONTS.bold : FONTS.medium,
                        },
                      ]}
                    >
                      {cell.dayNumber}
                    </Text>

                    {/* Workout Indicator Dot / Icon */}
                    {hasCompletedWorkout ? (
                      <View
                        style={[
                          styles.workoutDot,
                          {
                            backgroundColor: theme.success,
                            shadowColor: theme.success,
                          },
                        ]}
                      />
                    ) : isToday ? (
                      <View
                        style={[
                          styles.todayDot,
                          { backgroundColor: theme.tint },
                        ]}
                      />
                    ) : (
                      <View style={styles.emptyDotPlaceholder} />
                    )}
                  </SmoothPressable>
                );
              })}
            </View>

            {/* Selected Date Inspector Card */}
            <View
              style={[
                styles.dispatchCard,
                {
                  backgroundColor: theme.cardSecondary,
                  borderColor: selectedEntry
                    ? `${theme.success}50`
                    : isSelectedToday
                    ? `${theme.tint}50`
                    : theme.border,
                },
              ]}
            >
              <View style={styles.dispatchHeaderRow}>
                <View style={styles.dispatchDateBlock}>
                  <Text style={[styles.dispatchDateTitle, { color: theme.text }]}>
                    {selectedDateStr}
                  </Text>
                  <Text
                    style={[
                      styles.dispatchDateSub,
                      { color: theme.textSecondary },
                    ]}
                  >
                    {isSelectedToday ? "Today's Schedule & Dispatch" : 'Historical Record'}
                  </Text>
                </View>

                <View
                  style={[
                    styles.statusPill,
                    {
                      backgroundColor: selectedEntry
                        ? `${theme.success}1C`
                        : isSelectedToday
                        ? `${theme.tint}1C`
                        : 'rgba(255, 255, 255, 0.05)',
                      borderColor: selectedEntry
                        ? theme.success
                        : isSelectedToday
                        ? theme.tint
                        : theme.border,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.statusPillText,
                      {
                        color: selectedEntry
                          ? theme.success
                          : isSelectedToday
                          ? theme.tint
                          : theme.textSecondary,
                      },
                    ]}
                  >
                    {selectedEntry
                      ? 'SESSION CLEARED'
                      : isSelectedToday
                      ? 'IN PROGRESS'
                      : 'REST / RECOVERY'}
                  </Text>
                </View>
              </View>

              {/* Workout Details or Rest Info */}
              {selectedEntry ? (
                <View style={styles.dispatchDetailsWrap}>
                  <View style={styles.dispatchRoutineTitleRow}>
                    <Ionicons name="barbell-outline" size={16} color={theme.tint} />
                    <Text style={[styles.routineNameText, { color: theme.text }]}>
                      {selectedEntry.title}
                    </Text>
                  </View>

                  <View style={styles.dispatchStatsRow}>
                    <View style={styles.dispatchStatChip}>
                      <Text style={[styles.chipVal, { color: theme.tint }]}>
                        {selectedEntry.completedSets}/{selectedEntry.totalSets}
                      </Text>
                      <Text style={[styles.chipLbl, { color: theme.textSecondary }]}>
                        Sets Cleared
                      </Text>
                    </View>
                    <View style={styles.dispatchStatChip}>
                      <Text style={[styles.chipVal, { color: theme.text }]}>
                        {selectedEntry.totalVolumeKg} kg
                      </Text>
                      <Text style={[styles.chipLbl, { color: theme.textSecondary }]}>
                        Volume Lifted
                      </Text>
                    </View>
                    <View style={styles.dispatchStatChip}>
                      <Text style={[styles.chipVal, { color: theme.accentGold }]}>
                        +{selectedEntry.completedSets * 10} EXP
                      </Text>
                      <Text style={[styles.chipLbl, { color: theme.textSecondary }]}>
                        Earned
                      </Text>
                    </View>
                  </View>
                </View>
              ) : (
                <View style={styles.restDayInfoWrap}>
                  <Ionicons name="shield-checkmark-outline" size={18} color={theme.textDim} />
                  <Text style={[styles.restDayText, { color: theme.textSecondary }]}>
                    {isSelectedToday
                      ? 'Active training session scheduled for today. Check your protocol below!'
                      : 'Active recovery period. Muscle tissue repair and neurological rejuvenation logged.'}
                  </Text>
                </View>
              )}

              {/* Action Button if Today */}
              {isSelectedToday && (
                <SmoothPressable
                  onPress={onClose}
                  style={[
                    styles.dispatchActionBtn,
                    {
                      backgroundColor: theme.buttonPrimary,
                      borderColor: theme.borderRose,
                      shadowColor: theme.glow,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.dispatchActionBtnText,
                      { color: theme.buttonPrimaryText },
                    ]}
                  >
                    {"Train Today's Protocol"}
                  </Text>
                  <Ionicons name="arrow-forward" size={16} color={theme.buttonPrimaryText} />
                </SmoothPressable>
              )}
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.72)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderWidth: 1.2,
    borderBottomWidth: 0,
    maxHeight: '90%',
    paddingBottom: 24,
  },
  dragHandleBar: {
    alignItems: 'center',
    paddingVertical: 10,
  },
  dragHandlePill: {
    width: 44,
    height: 4.5,
    borderRadius: 3,
  },
  modalHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.06)',
  },
  modalHeaderTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  calendarIconSquircle: {
    width: 38,
    height: 38,
    borderRadius: 11,
    borderWidth: 1.2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalTitleText: {
    fontSize: 16.5,
    fontFamily: FONTS.bold,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  modalSubtitleText: {
    fontSize: 12,
    fontFamily: FONTS.regular,
    marginTop: 1,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalScroll: {
    paddingHorizontal: 20,
  },
  modalScrollContent: {
    paddingTop: 14,
    paddingBottom: 20,
  },

  // Monthly Metrics Card
  monthlyMetricsCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    borderRadius: 16,
    borderWidth: 1,
    paddingVertical: 12,
    marginBottom: 16,
  },
  metricItem: {
    alignItems: 'center',
  },
  metricValue: {
    fontSize: 13.5,
    fontFamily: FONTS.bold,
    fontWeight: '700',
    marginTop: 3,
  },
  metricLabel: {
    fontSize: 10.5,
    fontFamily: FONTS.regular,
    marginTop: 1,
  },
  metricDivider: {
    width: 1,
    height: 24,
  },

  // Month Navigator
  monthNavRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  navArrowBtn: {
    width: 34,
    height: 34,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  monthCenterInfo: {
    flex: 1,
    alignItems: 'center',
  },
  monthNameText: {
    fontSize: 16,
    fontFamily: FONTS.bold,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  monthNavRightWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  todayBadgeBtn: {
    paddingHorizontal: 9,
    paddingVertical: 4.5,
    borderRadius: 8,
    borderWidth: 1,
  },
  todayBadgeText: {
    fontSize: 10.5,
    fontFamily: FONTS.bold,
    fontWeight: '800',
    letterSpacing: 0.5,
  },

  // Weekday Labels
  weekdayLabelsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  weekdayLabelCell: {
    width: '14.28%',
    alignItems: 'center',
    paddingVertical: 4,
  },
  weekdayLabelText: {
    fontSize: 11,
    fontFamily: FONTS.bold,
    fontWeight: '700',
    letterSpacing: 0.5,
  },

  // 7-Column Days Grid
  daysGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 16,
  },
  dayCell: {
    width: '14.28%',
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    borderWidth: 1.2,
    paddingVertical: 4,
  },
  dayCellEmpty: {
    width: '14.28%',
    aspectRatio: 1,
  },
  dayNumberText: {
    fontSize: 13.5,
    fontWeight: '600',
  },
  workoutDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    marginTop: 3,
    shadowOffset: { width: 0, height: 0 },
    shadowRadius: 4,
    shadowOpacity: 0.8,
    elevation: 2,
  },
  todayDot: {
    width: 4.5,
    height: 4.5,
    borderRadius: 2.25,
    marginTop: 3,
  },
  emptyDotPlaceholder: {
    width: 5,
    height: 5,
    marginTop: 3,
  },

  // Dispatch Inspector Card
  dispatchCard: {
    borderRadius: 18,
    borderWidth: 1.2,
    padding: 16,
    gap: 12,
  },
  dispatchHeaderRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 8,
  },
  dispatchDateBlock: {
    flex: 1,
  },
  dispatchDateTitle: {
    fontSize: 15,
    fontFamily: FONTS.bold,
    fontWeight: '700',
  },
  dispatchDateSub: {
    fontSize: 11.5,
    fontFamily: FONTS.regular,
    marginTop: 1,
  },
  statusPill: {
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 7,
    borderWidth: 1,
  },
  statusPillText: {
    fontSize: 10,
    fontFamily: FONTS.bold,
    fontWeight: '800',
    letterSpacing: 0.6,
  },
  dispatchDetailsWrap: {
    gap: 10,
  },
  dispatchRoutineTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
  },
  routineNameText: {
    fontSize: 14.5,
    fontFamily: FONTS.semiBold,
    fontWeight: '700',
  },
  dispatchStatsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  dispatchStatChip: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.25)',
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 8,
    alignItems: 'center',
  },
  chipVal: {
    fontSize: 13,
    fontFamily: FONTS.bold,
    fontWeight: '700',
  },
  chipLbl: {
    fontSize: 10,
    fontFamily: FONTS.regular,
    marginTop: 2,
  },
  restDayInfoWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 4,
  },
  restDayText: {
    flex: 1,
    fontSize: 12.5,
    fontFamily: FONTS.regular,
    lineHeight: 18,
  },
  dispatchActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    height: 46,
    borderRadius: 12,
    borderWidth: 1,
    marginTop: 4,
    shadowOffset: { width: 0, height: 0 },
    shadowRadius: 10,
    shadowOpacity: 0.6,
    elevation: 4,
  },
  dispatchActionBtnText: {
    fontSize: 14,
    fontFamily: FONTS.bold,
    fontWeight: '700',
  },
});
