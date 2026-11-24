import { Ionicons } from '@expo/vector-icons';
import React, { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { SmoothPressable } from '@/components/SmoothPressable';
import { FONTS, useTheme } from '@/theme';

interface WeekCalendarStripProps {
  onOpenFullCalendar: () => void;
  selectedDateStr: string;
  onSelectDate: (dateStr: string) => void;
  completedDates?: Set<string>;
}

const DAY_LETTERS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

function formatDateKey(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function WeekCalendarStrip({
  onOpenFullCalendar,
  selectedDateStr,
  onSelectDate,
  completedDates,
}: WeekCalendarStripProps) {
  const theme = useTheme();

  // Current week's 7 days (Monday through Sunday)
  const weekDays = useMemo(() => {
    const now = new Date();
    const dayOfWeek = (now.getDay() + 6) % 7; // Monday = 0
    const monday = new Date(now);
    monday.setDate(now.getDate() - dayOfWeek);

    const days: {
      letter: string;
      dateNumber: number;
      dateKey: string;
      isToday: boolean;
    }[] = [];

    const todayStr = formatDateKey(now);

    for (let i = 0; i < 7; i++) {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      const key = formatDateKey(d);
      days.push({
        letter: DAY_LETTERS[i],
        dateNumber: d.getDate(),
        dateKey: key,
        isToday: key === todayStr,
      });
    }

    return days;
  }, []);

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: theme.card,
          borderColor: theme.border,
        },
      ]}
    >
      {/* Top Header Row: Section Label + Open Full Month Link */}
      <View style={styles.headerRow}>
        <View style={styles.titleWithIcon}>
          <Ionicons name="calendar-outline" size={14} color={theme.tint} />
          <Text style={[styles.titleText, { color: theme.textSecondary }]}>
            WEEKLY ACTIVITY CHRONICLE
          </Text>
        </View>

        <SmoothPressable
          onPress={onOpenFullCalendar}
          style={styles.openMonthBtn}
          accessibilityRole="button"
          accessibilityLabel="Open Full Month Calendar"
          hitSlop={8}
        >
          <Text style={[styles.openMonthText, { color: theme.tint }]}>
            Month View
          </Text>
          <Ionicons name="arrow-forward" size={12} color={theme.tint} />
        </SmoothPressable>
      </View>

      {/* 7 Days Row */}
      <View style={styles.daysRow}>
        {weekDays.map((item) => {
          const isSelected = item.dateKey === selectedDateStr;
          const isDone = completedDates?.has(item.dateKey);

          return (
            <SmoothPressable
              key={item.dateKey}
              onPress={() => onSelectDate(item.dateKey)}
              style={[
                styles.dayPill,
                {
                  backgroundColor: isSelected
                    ? `${theme.tint}1E`
                    : item.isToday
                    ? theme.cardSecondary
                    : 'transparent',
                  borderColor: isSelected
                    ? theme.tint
                    : item.isToday
                    ? `${theme.tint}50`
                    : 'transparent',
                  shadowColor: isSelected ? theme.glow : 'transparent',
                },
              ]}
            >
              <Text
                style={[
                  styles.dayLetter,
                  {
                    color: isSelected
                      ? theme.tint
                      : item.isToday
                      ? theme.tint
                      : theme.textSecondary,
                  },
                ]}
              >
                {item.letter}
              </Text>

              <Text
                style={[
                  styles.dayNumber,
                  {
                    color: isSelected
                      ? theme.tint
                      : item.isToday
                      ? theme.text
                      : theme.text,
                    fontFamily: isSelected || item.isToday ? FONTS.bold : FONTS.medium,
                  },
                ]}
              >
                {item.dateNumber}
              </Text>

              {/* Status Indicator */}
              {isDone ? (
                <View style={[styles.statusDot, { backgroundColor: theme.success }]} />
              ) : item.isToday ? (
                <View style={[styles.statusDot, { backgroundColor: theme.tint }]} />
              ) : (
                <View style={styles.dotPlaceholder} />
              )}
            </SmoothPressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 18,
    borderWidth: 1.2,
    padding: 12,
    marginBottom: 14,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 10,
    shadowOpacity: 0.2,
    elevation: 2,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
    paddingHorizontal: 2,
  },
  titleWithIcon: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  titleText: {
    fontSize: 11,
    fontFamily: FONTS.bold,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  openMonthBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  openMonthText: {
    fontSize: 11.5,
    fontFamily: FONTS.bold,
    fontWeight: '700',
  },
  daysRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  dayPill: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    borderWidth: 1.2,
    paddingVertical: 7,
    marginHorizontal: 2,
    shadowOffset: { width: 0, height: 0 },
    shadowRadius: 6,
    elevation: 2,
  },
  dayLetter: {
    fontSize: 10,
    fontFamily: FONTS.bold,
    fontWeight: '700',
    marginBottom: 2,
  },
  dayNumber: {
    fontSize: 13.5,
    fontWeight: '700',
  },
  statusDot: {
    width: 4.5,
    height: 4.5,
    borderRadius: 2.25,
    marginTop: 4,
  },
  dotPlaceholder: {
    width: 4.5,
    height: 4.5,
    marginTop: 4,
  },
});
