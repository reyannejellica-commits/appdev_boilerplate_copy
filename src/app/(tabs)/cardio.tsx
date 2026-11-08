import { Ionicons } from '@expo/vector-icons';
import React, { useCallback, useEffect, useState } from 'react';
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SmoothPressable } from '@/components/SmoothPressable';
import {
  getCardioHistory,
  saveCardioSession,
  type CardioLog,
} from '@/db/hunter';
import { useTheme } from '@/theme';

export default function CardioScreen() {
  const theme = useTheme();

  // Stopwatch state
  const [seconds, setSeconds] = useState(0);
  const [isActive, setIsActive] = useState(false);
  const [distanceKm, setDistanceKm] = useState(0);
  const [history, setHistory] = useState<CardioLog[]>([]);

  const loadHistory = useCallback(async () => {
    try {
      const logs = await getCardioHistory(5);
      setHistory(logs);
    } catch (e) {
      console.warn('Failed to load cardio history:', e);
    }
  }, []);

  useEffect(() => {
    let isMounted = true;
    (async () => {
      try {
        const logs = await getCardioHistory(5);
        if (isMounted) setHistory(logs);
      } catch (e) {
        console.warn('Failed to load cardio history:', e);
      }
    })();
    return () => {
      isMounted = false;
    };
  }, []);

  // Timer tick
  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | null = null;
    if (isActive) {
      interval = setInterval(() => {
        setSeconds((s) => s + 1);
        // Estimate running distance at ~10 km/h (2.77 meters/sec) if active
        setDistanceKm((prev) => +(prev + 0.003).toFixed(3));
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isActive]);

  const formatTime = (totalSec: number) => {
    const mins = Math.floor(totalSec / 60);
    const secs = totalSec % 60;
    const hrs = Math.floor(mins / 60);
    const remMins = mins % 60;
    if (hrs > 0) {
      return `${hrs}:${String(remMins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
    }
    return `${String(remMins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  const calories = Math.round(distanceKm * 65 + (seconds / 60) * 8);
  const paceMinPerKm =
    distanceKm > 0 ? ((seconds / 60) / distanceKm).toFixed(2) : '0.00';

  const handleStartPause = () => {
    setIsActive(!isActive);
  };

  const handleReset = () => {
    setIsActive(false);
    setSeconds(0);
    setDistanceKm(0);
  };

  const handleFinishRun = async () => {
    if (distanceKm <= 0 && seconds < 10) {
      Alert.alert('Protocol Incomplete', 'Run or record at least a minimal session to log.');
      return;
    }

    try {
      await saveCardioSession(seconds, distanceKm, calories);
      Alert.alert(
        'PROTOCOL RECORDED! 🏃',
        `Successfully logged ${distanceKm.toFixed(2)} km in ${formatTime(seconds)}. The System awarded EXP!`
      );
      handleReset();
      loadHistory();
    } catch (e) {
      console.warn('Failed to save cardio:', e);
    }
  };

  const addManualDistance = (km: number) => {
    setDistanceKm((prev) => +(prev + km).toFixed(2));
    if (seconds === 0) {
      // Estimate 5 mins per km
      setSeconds((prev) => prev + km * 300);
    }
  };

  const dailyGoalKm = 10.0;
  const goalPercent = Math.min(100, Math.round((distanceKm / dailyGoalKm) * 100));

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.background }]}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
    >
      {/* 1. Header Card */}
      <View style={[styles.heroCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
        <View style={styles.badgeRow}>
          <View style={[styles.badge, { backgroundColor: theme.surface, borderColor: theme.accentCyan }]}>
            <Ionicons name="walk" size={14} color={theme.accentCyan} />
            <Text style={[styles.badgeText, { color: theme.accentCyan }]}>SOLO LEVELING CARDIO</Text>
          </View>
          <Text style={[styles.goalPercentText, { color: theme.tint }]}>{goalPercent}% OF 10KM</Text>
        </View>

        <Text style={[styles.cardTitle, { color: theme.text }]}>Daily 10 KM Endurance Run</Text>
        <Text style={[styles.cardSubtitle, { color: theme.textSecondary }]}>
          &quot;A true hunter builds relentless stamina. Run until the System recognizes your limit.&quot;
        </Text>

        {/* Progress Bar */}
        <View style={[styles.progressBarTrack, { backgroundColor: theme.surface }]}>
          <View
            style={[
              styles.progressBarFill,
              { width: `${goalPercent}%`, backgroundColor: theme.tint },
            ]}
          />
        </View>
      </View>

      {/* 2. Live Tracker Dashboard */}
      <View style={[styles.trackerCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
        {/* Main Distance Display */}
        <View style={styles.distanceDisplay}>
          <Text style={[styles.distanceValue, { color: theme.text }]}>
            {distanceKm.toFixed(2)}
          </Text>
          <Text style={[styles.distanceUnit, { color: theme.textSecondary }]}>KILOMETERS</Text>
        </View>

        {/* Metric Badges Grid */}
        <View style={styles.metricsGrid}>
          <View style={[styles.metricBox, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            <Ionicons name="time-outline" size={18} color={theme.tint} />
            <Text style={[styles.metricValue, { color: theme.text }]}>{formatTime(seconds)}</Text>
            <Text style={[styles.metricLabel, { color: theme.textSecondary }]}>TIME</Text>
          </View>

          <View style={[styles.metricBox, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            <Ionicons name="speedometer-outline" size={18} color={theme.accentCyan} />
            <Text style={[styles.metricValue, { color: theme.text }]}>{paceMinPerKm}</Text>
            <Text style={[styles.metricLabel, { color: theme.textSecondary }]}>PACE (min/km)</Text>
          </View>

          <View style={[styles.metricBox, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            <Ionicons name="flame-outline" size={18} color={theme.accentGold} />
            <Text style={[styles.metricValue, { color: theme.text }]}>{calories}</Text>
            <Text style={[styles.metricLabel, { color: theme.textSecondary }]}>CALORIES</Text>
          </View>
        </View>

        {/* Action Controls */}
        <View style={styles.controlsRow}>
          <SmoothPressable
            onPress={handleReset}
            style={[styles.controlButtonSecondary, { backgroundColor: theme.surface, borderColor: theme.border }]}
          >
            <Ionicons name="refresh-outline" size={20} color={theme.textSecondary} />
          </SmoothPressable>

          <SmoothPressable
            onPress={handleStartPause}
            style={[
              styles.controlButtonMain,
              { backgroundColor: isActive ? theme.danger : theme.tint },
            ]}
          >
            <Ionicons name={isActive ? 'pause' : 'play'} size={24} color="#FFFFFF" />
            <Text style={styles.controlButtonMainText}>
              {isActive ? 'PAUSE PROTOCOL' : seconds > 0 ? 'RESUME RUN' : 'START RUN'}
            </Text>
          </SmoothPressable>

          <SmoothPressable
            onPress={handleFinishRun}
            style={[styles.controlButtonSecondary, { backgroundColor: theme.surface, borderColor: theme.border }]}
          >
            <Ionicons name="checkmark-done-outline" size={20} color={theme.success} />
          </SmoothPressable>
        </View>

        {/* Quick Add Pills */}
        <View style={styles.quickAddRow}>
          <Text style={[styles.quickAddLabel, { color: theme.textDim }]}>Quick Distance:</Text>
          {[1, 2.5, 5].map((km) => (
            <SmoothPressable
              key={km}
              onPress={() => addManualDistance(km)}
              style={[styles.quickDistancePill, { backgroundColor: theme.surface, borderColor: theme.border }]}
            >
              <Text style={[styles.quickDistancePillText, { color: theme.accentCyan }]}>
                +{km} km
              </Text>
            </SmoothPressable>
          ))}
        </View>
      </View>

      {/* 3. Recent Cardio History */}
      <View style={styles.historySection}>
        <Text style={[styles.sectionTitle, { color: theme.text }]}>Cardio Archive</Text>
        {history.length === 0 ? (
          <View style={[styles.emptyCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <Ionicons name="footsteps-outline" size={32} color={theme.textDim} />
            <Text style={[styles.emptyText, { color: theme.textSecondary }]}>
              No cardio logs recorded yet. Start your first protocol!
            </Text>
          </View>
        ) : (
          <View style={styles.historyList}>
            {history.map((log) => (
              <View
                key={log.id}
                style={[styles.historyItem, { backgroundColor: theme.card, borderColor: theme.border }]}
              >
                <View style={[styles.historyIcon, { backgroundColor: theme.surface }]}>
                  <Ionicons name="walk" size={20} color={theme.accentCyan} />
                </View>
                <View style={styles.historyDetails}>
                  <Text style={[styles.historyTitle, { color: theme.text }]}>
                    {log.distance_km.toFixed(2)} KM Session
                  </Text>
                  <Text style={[styles.historySubtitle, { color: theme.textSecondary }]}>
                    {formatTime(log.duration_seconds)} • {log.calories} kcal • {log.date}
                  </Text>
                </View>
                <Ionicons name="shield-checkmark-outline" size={18} color={theme.tint} />
              </View>
            ))}
          </View>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { padding: 16, gap: 16, paddingBottom: 100 },

  // Hero Card
  heroCard: {
    borderRadius: 20,
    borderWidth: 1.5,
    padding: 16,
    gap: 10,
  },
  badgeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  goalPercentText: {
    fontSize: 12,
    fontWeight: '800',
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '800',
  },
  cardSubtitle: {
    fontSize: 13,
    lineHeight: 18,
  },
  progressBarTrack: {
    height: 5,
    borderRadius: 2.5,
    overflow: 'hidden',
    width: '100%',
    marginTop: 4,
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 2.5,
  },

  // Tracker Card
  trackerCard: {
    borderRadius: 20,
    borderWidth: 1.5,
    padding: 20,
    alignItems: 'center',
    gap: 16,
  },
  distanceDisplay: {
    alignItems: 'center',
    gap: 2,
    marginVertical: 4,
  },
  distanceValue: {
    fontSize: 54,
    fontWeight: '900',
    letterSpacing: -1,
  },
  distanceUnit: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.5,
  },
  metricsGrid: {
    flexDirection: 'row',
    gap: 10,
    width: '100%',
  },
  metricBox: {
    flex: 1,
    borderRadius: 14,
    borderWidth: 1,
    paddingVertical: 12,
    alignItems: 'center',
    gap: 4,
  },
  metricValue: {
    fontSize: 15,
    fontWeight: '800',
  },
  metricLabel: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  controlsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    width: '100%',
    marginTop: 6,
  },
  controlButtonSecondary: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  controlButtonMain: {
    flex: 1,
    height: 48,
    borderRadius: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  controlButtonMainText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  quickAddRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    width: '100%',
    justifyContent: 'center',
    marginTop: 2,
  },
  quickAddLabel: {
    fontSize: 11,
    fontWeight: '600',
  },
  quickDistancePill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
  },
  quickDistancePillText: {
    fontSize: 11,
    fontWeight: '700',
  },

  // History Section
  historySection: {
    gap: 12,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '800',
  },
  emptyCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 24,
    alignItems: 'center',
    gap: 10,
  },
  emptyText: {
    fontSize: 13,
    textAlign: 'center',
  },
  historyList: {
    gap: 10,
  },
  historyItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 16,
    borderWidth: 1.5,
    gap: 12,
  },
  historyIcon: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  historyDetails: {
    flex: 1,
    gap: 2,
  },
  historyTitle: {
    fontSize: 14,
    fontWeight: '700',
  },
  historySubtitle: {
    fontSize: 12,
  },
});
