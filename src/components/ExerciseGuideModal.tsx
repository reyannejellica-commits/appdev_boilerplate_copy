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
import { EXERCISE_GUIDES, type ExerciseGuide } from '@/db/workouts';
import { useTheme } from '@/theme';

interface ExerciseGuideModalProps {
  visible?: boolean;
  exerciseName: string | null;
  onClose: () => void;
}

export function ExerciseGuideModal({ exerciseName, onClose }: ExerciseGuideModalProps) {
  const theme = useTheme();
  if (!exerciseName) return null;

  const rawGuide: ExerciseGuide | undefined = EXERCISE_GUIDES[exerciseName];
  const guide: ExerciseGuide = rawGuide ?? {
    name: exerciseName,
    categoryTag: 'STRENGTH & HYPERTROPHY',
    equipmentBadge: 'Barbell & Dumbbell',
    primaryEngagement: 'TARGET MUSCLE COMPLEX & CORE ENGAGEMENT',
    primaryMuscles: 'Primary Muscle Movers',
    secondaryMuscles: 'Stabilizers, Synergists, Core',
    targetMuscles: ['Target Muscle Group', 'Stabilizers'],
    instructions: [
      'Maintain stable core engagement throughout the entire range of motion.',
      'Control the eccentric (lowering) phase for 2-3 seconds with full tension.',
      'Drive powerfully through the concentric phase with crisp execution.',
    ],
    formTips: [
      'Breathe deeply into diaphragm and brace core before initiating movement.',
      'Focus on strict mind-muscle contraction at the apex of every rep.',
    ],
    mistakes: [
      'Using excessive body momentum or jerking weights.',
      'Cutting the range of motion short to move heavier loads.',
    ],
    proTip: 'Focus on mind-muscle connection. Intensity and progressive overload drive hypertrophy.',
  };

  const categoryTag = guide.categoryTag || 'STRENGTH & HYPERTROPHY';
  const equipmentBadge = guide.equipmentBadge || 'Barbell & Equipment';
  const primaryEngagement =
    guide.primaryEngagement || guide.targetMuscles.join(', ').toUpperCase();
  const primaryMuscles =
    guide.primaryMuscles || guide.targetMuscles.slice(0, 2).join(', ');
  const secondaryMuscles =
    guide.secondaryMuscles ||
    (guide.targetMuscles.length > 2
      ? guide.targetMuscles.slice(2).join(', ')
      : 'Core Stabilizers, Synergists');
  const formTips =
    guide.formTips && guide.formTips.length > 0
      ? guide.formTips
      : [
          'Breathe deeply into diaphragm and brace core before initiating movement.',
          guide.proTip,
        ];
  const mistakes =
    guide.mistakes && guide.mistakes.length > 0
      ? guide.mistakes
      : [
          'Allowing form breakdown under heavier resistance.',
          'Rushing through the eccentric phase without muscular tension.',
        ];

  return (
    <Modal visible={!!exerciseName} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={[styles.container, { backgroundColor: '#170D12', borderColor: '#3A2430' }]}>
          {/* Top Grabber Handle */}
          <View style={styles.grabberHandle} />

          {/* Top Header Row: Category Tag, Exercise Title, Close Button */}
          <View style={styles.topHeaderRow}>
            <View style={styles.titleColumn}>
              <Text style={styles.categoryTagText}>{categoryTag}</Text>
              <Text style={styles.mainTitleText} numberOfLines={1} adjustsFontSizeToFit>
                {guide.name}
              </Text>
            </View>

            <SmoothPressable
              onPress={onClose}
              style={styles.closeCircleBtn}
              accessibilityRole="button"
              accessibilityLabel="Close Exercise Guide"
              hitSlop={8}
            >
              <Ionicons name="close" size={18} color="#E0D8DC" />
            </SmoothPressable>
          </View>

          {/* Scrollable Guide Content */}
          <ScrollView
            style={styles.modalScroll}
            contentContainerStyle={styles.modalScrollContent}
            showsVerticalScrollIndicator={false}
          >
            {/* CARD 1: TARGET MUSCLE ENGAGEMENT */}
            <View style={styles.sectionCard}>
              <View style={styles.muscleEngagementHeaderRow}>
                <Text style={styles.subCardHeaderTitle}>TARGET MUSCLE ENGAGEMENT</Text>
                <View style={styles.equipmentPill}>
                  <Text style={styles.equipmentPillText}>{equipmentBadge}</Text>
                </View>
              </View>

              <View style={styles.innerEngagementBox}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Ionicons name="flash-outline" size={14} color="#FBBF24" />
                  <Text style={styles.engagementHighlightText}>
                    {primaryEngagement}
                  </Text>
                </View>
                <View style={styles.engagementLegendRow}>
                  <View style={styles.legendItem}>
                    <View style={[styles.legendDot, { backgroundColor: '#EA580C' }]} />
                    <Text style={styles.legendLabelText}>Primary Target</Text>
                  </View>
                  <View style={styles.legendItem}>
                    <View style={[styles.legendDot, { backgroundColor: '#EAB308' }]} />
                    <Text style={styles.legendLabelText}>Synergist</Text>
                  </View>
                </View>
              </View>
            </View>

            {/* PRIMARY & SECONDARY PILL ROWS */}
            <View style={styles.muscleRowContainer}>
              <View style={styles.musclePillRow}>
                <Text style={styles.muscleCategoryLabel}>PRIMARY:</Text>
                <View style={styles.primaryTargetPill}>
                  <Text style={styles.primaryTargetPillText}>{primaryMuscles}</Text>
                </View>
              </View>

              <View style={styles.musclePillRow}>
                <Text style={styles.muscleCategoryLabel}>SECONDARY:</Text>
                <View style={styles.secondaryTargetPill}>
                  <Text style={styles.secondaryTargetPillText}>{secondaryMuscles}</Text>
                </View>
              </View>
            </View>

            {/* CARD 2: STEP-BY-STEP EXECUTION */}
            <View style={styles.sectionCard}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                <Ionicons name="list-outline" size={15} color={theme.tint} />
                <Text style={styles.executionHeaderTitle}>STEP-BY-STEP EXECUTION</Text>
              </View>
              <View style={styles.stepsList}>
                {guide.instructions.map((step, idx) => (
                  <Text key={idx} style={styles.stepParagraphText}>
                    {step}
                  </Text>
                ))}
              </View>
            </View>

            {/* CARD 3: PEAK FORM TIPS */}
            <View style={[styles.sectionCard, styles.formTipsCard]}>
              <Text style={styles.formTipsHeaderTitle}>PEAK FORM TIPS</Text>
              <View style={styles.tipsList}>
                {formTips.map((tip, idx) => (
                  <View key={idx} style={styles.tipItemRow}>
                    <Text style={styles.checkIcon}>✓</Text>
                    <Text style={styles.tipItemText}>{tip}</Text>
                  </View>
                ))}
              </View>
            </View>

            {/* CARD 4: MISTAKES TO AVOID */}
            <View style={[styles.sectionCard, styles.mistakesCard]}>
              <Text style={styles.mistakesHeaderTitle}>MISTAKES TO AVOID</Text>
              <View style={styles.tipsList}>
                {mistakes.map((mistake, idx) => (
                  <View key={idx} style={styles.mistakeItemRow}>
                    <Text style={styles.crossIcon}>✕</Text>
                    <Text style={styles.mistakeItemText}>{mistake}</Text>
                  </View>
                ))}
              </View>
            </View>

            <View style={{ height: 16 }} />
          </ScrollView>

          {/* BOTTOM GLOWING BUTTON: Back to Workout Protocol */}
          <SmoothPressable
            onPress={onClose}
            style={[styles.backToWorkoutBtn, { shadowColor: theme.glow || '#F97316' }]}
            accessibilityRole="button"
            accessibilityLabel="Back to Workout Protocol"
          >
            <Text style={styles.backToWorkoutBtnText}>Back to Workout Protocol</Text>
          </SmoothPressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(5, 3, 7, 0.82)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 24,
  },
  container: {
    width: '100%',
    maxWidth: 440,
    maxHeight: '92%',
    borderRadius: 22,
    borderWidth: 1.2,
    paddingTop: 12,
    paddingHorizontal: 18,
    paddingBottom: 16,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 8 },
    shadowRadius: 20,
    shadowOpacity: 0.8,
    elevation: 10,
  },
  grabberHandle: {
    width: 42,
    height: 4.5,
    borderRadius: 2.5,
    backgroundColor: '#58434F',
    alignSelf: 'center',
    marginBottom: 12,
  },

  // TOP HEADER
  topHeaderRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  titleColumn: {
    flex: 1,
    marginRight: 12,
  },
  categoryTagText: {
    color: '#F59E0B',
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 0.8,
    marginBottom: 2,
  },
  mainTitleText: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '900',
    letterSpacing: 0.2,
  },
  closeCircleBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  modalScroll: {
    flexGrow: 0,
    maxHeight: '80%',
  },
  modalScrollContent: {
    paddingVertical: 4,
  },

  // GENERIC SECTION CARD
  sectionCard: {
    backgroundColor: '#1E131A',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#3A2430',
    padding: 14,
    marginBottom: 12,
  },

  // CARD 1: TARGET MUSCLE ENGAGEMENT
  muscleEngagementHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  subCardHeaderTitle: {
    color: '#A0909A',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.6,
  },
  equipmentPill: {
    backgroundColor: 'rgba(245, 158, 11, 0.12)',
    borderColor: 'rgba(245, 158, 11, 0.35)',
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  equipmentPillText: {
    color: '#FBBF24',
    fontSize: 11,
    fontWeight: '800',
  },
  innerEngagementBox: {
    backgroundColor: '#150D12',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#452A39',
    padding: 12,
  },
  engagementHighlightText: {
    color: '#FBBF24',
    fontSize: 11.5,
    fontWeight: '900',
    letterSpacing: 0.4,
    marginBottom: 8,
    lineHeight: 16,
  },
  engagementLegendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendLabelText: {
    color: '#E0D8DC',
    fontSize: 11,
    fontWeight: '700',
  },

  // PRIMARY & SECONDARY PILL ROWS
  muscleRowContainer: {
    marginBottom: 12,
    gap: 8,
  },
  musclePillRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  muscleCategoryLabel: {
    color: '#A0909A',
    fontSize: 11,
    fontWeight: '900',
    width: 90,
  },
  primaryTargetPill: {
    flex: 1,
    backgroundColor: '#DC2626',
    borderColor: '#F97316',
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 12,
  },
  primaryTargetPillText: {
    color: '#FFFFFF',
    fontSize: 11.5,
    fontWeight: '800',
  },
  secondaryTargetPill: {
    flex: 1,
    backgroundColor: '#20151C',
    borderColor: '#3A2430',
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 12,
  },
  secondaryTargetPillText: {
    color: '#D8CFD4',
    fontSize: 11.5,
    fontWeight: '700',
  },

  // CARD 2: STEP-BY-STEP EXECUTION
  executionHeaderTitle: {
    color: '#F59E0B',
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 0.6,
    marginBottom: 10,
  },
  stepsList: {
    gap: 10,
  },
  stepParagraphText: {
    color: '#F1E8EC',
    fontSize: 13,
    lineHeight: 19,
    fontWeight: '600',
  },

  // CARD 3: PEAK FORM TIPS
  formTipsCard: {
    backgroundColor: 'rgba(16, 185, 129, 0.08)',
    borderColor: 'rgba(16, 185, 129, 0.3)',
  },
  formTipsHeaderTitle: {
    color: '#34D399',
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 0.6,
    marginBottom: 10,
  },
  tipsList: {
    gap: 8,
  },
  tipItemRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  checkIcon: {
    color: '#34D399',
    fontSize: 13,
    fontWeight: '900',
    marginTop: 1,
  },
  tipItemText: {
    flex: 1,
    color: '#F1E8EC',
    fontSize: 12.5,
    lineHeight: 18,
    fontWeight: '600',
  },

  // CARD 4: MISTAKES TO AVOID
  mistakesCard: {
    backgroundColor: 'rgba(239, 68, 68, 0.08)',
    borderColor: 'rgba(239, 68, 68, 0.3)',
  },
  mistakesHeaderTitle: {
    color: '#F87171',
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 0.6,
    marginBottom: 10,
  },
  mistakeItemRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  crossIcon: {
    color: '#F87171',
    fontSize: 13,
    fontWeight: '900',
    marginTop: 1,
  },
  mistakeItemText: {
    flex: 1,
    color: '#F1E8EC',
    fontSize: 12.5,
    lineHeight: 18,
    fontWeight: '600',
  },

  // BOTTOM GLOWING ACTION BUTTON
  backToWorkoutBtn: {
    backgroundColor: '#EF4444',
    height: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 6,
    shadowOffset: { width: 0, height: 3 },
    shadowRadius: 10,
    shadowOpacity: 0.8,
    elevation: 6,
  },
  backToWorkoutBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '900',
    letterSpacing: 0.3,
  },
});
