import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import {
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SmoothPressable } from '@/components/SmoothPressable';
import { useTheme } from '@/theme';

export interface CardioInsightsData {
  challengeTitle: string;
  isSuccess: boolean;
  timeElapsedSec: number;
  timeLimitSec: number;
  outputValue: number;
  outputUnit: string;
  targetValue: number;
  caloriesBurned: number;
  coinsEarned: number;
  expEarned: number;
  paceStr?: string;
  aiInsightTip: string;
}

interface CardioInsightsModalProps {
  visible: boolean;
  data: CardioInsightsData | null;
  onClose: () => void;
}

export function CardioInsightsModal({ visible, data, onClose }: CardioInsightsModalProps) {
  const theme = useTheme();

  if (!data) return null;

  const formatMinSec = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  const timeDiff = data.timeLimitSec - data.timeElapsedSec;
  const marginText =
    data.isSuccess && timeDiff > 0
      ? `Finished ${formatMinSec(timeDiff)} ahead of the clock!`
      : data.isSuccess
      ? 'Target achieved right on time!'
      : 'Time expired before target was reached.';

  const rankTier = data.isSuccess
    ? timeDiff > 60
      ? 'S-RANK VELOCITY'
      : 'A-RANK CADENCE'
    : 'B-RANK EFFORT';

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent
      onRequestClose={onClose}
    >
      <View style={styles.backdrop}>
        <View
          style={[
            styles.modalContainer,
            {
              backgroundColor: theme.card,
              borderColor: `${theme.tint}40`,
              shadowColor: '#000000',
            },
          ]}
        >
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.contentWrap}
          >
            {/* Header Badge */}
            <View style={styles.topBadgeRow}>
              <View
                style={[
                  styles.rankPill,
                  {
                    backgroundColor: data.isSuccess ? 'rgba(16, 185, 129, 0.16)' : 'rgba(239, 68, 68, 0.16)',
                    borderColor: data.isSuccess ? '#10B981' : '#EF4444',
                  },
                ]}
              >
                <Ionicons
                  name={data.isSuccess ? 'trophy' : 'flame'}
                  size={14}
                  color={data.isSuccess ? '#10B981' : '#EF4444'}
                />
                <Text
                  style={[
                    styles.rankPillText,
                    { color: data.isSuccess ? '#10B981' : '#EF4444' },
                  ]}
                >
                  {rankTier}
                </Text>
              </View>

              <SmoothPressable
                onPress={onClose}
                style={[styles.closeIconBtn, { backgroundColor: theme.cardSecondary, borderColor: theme.border }]}
                accessibilityLabel="Close insights"
                hitSlop={8}
              >
                <Ionicons name="close" size={16} color={theme.textSecondary} />
              </SmoothPressable>
            </View>

            {/* Main Headline */}
            <Text style={[styles.headline, { color: theme.text }]}>
              {data.isSuccess ? 'Challenge Conquered!' : "Time's Up — Keep Pushing!"}
            </Text>
            <Text style={[styles.subheadline, { color: theme.textSecondary }]}>
              {data.challengeTitle} • {marginText}
            </Text>

            {/* 4 Primary Metric Tiles */}
            <View style={styles.metricsGrid}>
              <View
                style={[
                  styles.metricTile,
                  { backgroundColor: theme.cardSecondary, borderColor: theme.border },
                ]}
              >
                <Text style={[styles.metricLabel, { color: theme.textSecondary }]}>DURATION</Text>
                <Text style={[styles.metricValue, { color: theme.text }]}>
                  {formatMinSec(data.timeElapsedSec)}
                </Text>
                <Text style={[styles.metricSub, { color: theme.textDim }]}>
                  Limit: {formatMinSec(data.timeLimitSec)}
                </Text>
              </View>

              <View
                style={[
                  styles.metricTile,
                  { backgroundColor: theme.cardSecondary, borderColor: theme.border },
                ]}
              >
                <Text style={[styles.metricLabel, { color: theme.textSecondary }]}>OUTPUT</Text>
                <Text style={[styles.metricValue, { color: theme.tint }]}>
                  {data.outputValue.toFixed(data.outputUnit === 'KM' ? 2 : 0)}{' '}
                  <Text style={{ fontSize: 13, color: theme.textSecondary }}>{data.outputUnit}</Text>
                </Text>
                <Text style={[styles.metricSub, { color: theme.textDim }]}>
                  Target: {data.targetValue} {data.outputUnit}
                </Text>
              </View>

              <View
                style={[
                  styles.metricTile,
                  { backgroundColor: theme.cardSecondary, borderColor: theme.border },
                ]}
              >
                <Text style={[styles.metricLabel, { color: theme.textSecondary }]}>CALORIES</Text>
                <Text style={[styles.metricValue, { color: '#F97316' }]}>
                  {data.caloriesBurned}{' '}
                  <Text style={{ fontSize: 13, color: theme.textSecondary }}>kcal</Text>
                </Text>
                <Text style={[styles.metricSub, { color: theme.textDim }]}>Est. Burn</Text>
              </View>

              <View
                style={[
                  styles.metricTile,
                  { backgroundColor: theme.cardSecondary, borderColor: theme.border },
                ]}
              >
                <Text style={[styles.metricLabel, { color: theme.textSecondary }]}>REWARDS</Text>
                <Text style={[styles.metricValue, { color: '#FBBF24' }]}>
                  +{data.coinsEarned}{' '}
                  <Text style={{ fontSize: 13, color: theme.textSecondary }}>Coins</Text>
                </Text>
                <Text style={[styles.metricSub, { color: theme.tint }]}>
                  +{data.expEarned} EXP
                </Text>
              </View>
            </View>

            {/* AI Athletic Insight Card */}
            <View
              style={[
                styles.insightBox,
                {
                  backgroundColor: `${theme.tint}12`,
                  borderColor: `${theme.tint}35`,
                },
              ]}
            >
              <View style={styles.insightBoxHeader}>
                <Ionicons name="sparkles" size={15} color={theme.tint} />
                <Text style={[styles.insightBoxTitle, { color: theme.tint }]}>
                  ATHLETIC PERFORMANCE INSIGHT
                </Text>
              </View>
              <Text style={[styles.insightBoxText, { color: theme.text }]}>
                {data.aiInsightTip}
              </Text>
            </View>

            {/* CTA Button */}
            <SmoothPressable
              onPress={onClose}
              style={[
                styles.confirmBtn,
                {
                  backgroundColor: theme.tint,
                  shadowColor: theme.tint,
                },
              ]}
            >
              <Text style={styles.confirmBtnText}>Save Session & Continue</Text>
              <Ionicons name="arrow-forward" size={16} color="#FFFFFF" />
            </SmoothPressable>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.78)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 18,
  },
  modalContainer: {
    width: '100%',
    maxHeight: '85%',
    borderRadius: 24,
    borderWidth: 1.2,
    overflow: 'hidden',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.5,
    shadowRadius: 24,
    elevation: 12,
  },
  contentWrap: {
    padding: 20,
    gap: 14,
  },
  topBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  rankPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
  },
  rankPillText: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.6,
  },
  closeIconBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headline: {
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: -0.4,
  },
  subheadline: {
    fontSize: 13,
    marginTop: -8,
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 4,
  },
  metricTile: {
    width: '48%',
    flexGrow: 1,
    borderRadius: 16,
    borderWidth: 1,
    padding: 12,
    gap: 2,
  },
  metricLabel: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  metricValue: {
    fontSize: 20,
    fontWeight: '800',
  },
  metricSub: {
    fontSize: 11,
  },
  insightBox: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 14,
    gap: 6,
    marginTop: 4,
  },
  insightBoxHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  insightBoxTitle: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.6,
  },
  insightBoxText: {
    fontSize: 13,
    lineHeight: 19,
  },
  confirmBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    height: 50,
    borderRadius: 14,
    marginTop: 6,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 4,
  },
  confirmBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
});
