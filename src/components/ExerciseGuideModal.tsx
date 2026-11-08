import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Modal, StyleSheet, Text, View } from 'react-native';
import { Button } from '@/components/Button';
import { SmoothPressable } from '@/components/SmoothPressable';
import { EXERCISE_GUIDES } from '@/db/workouts';
import { useTheme } from '@/theme';

interface ExerciseGuideModalProps {
  exerciseName: string | null;
  onClose: () => void;
}

export function ExerciseGuideModal({ exerciseName, onClose }: ExerciseGuideModalProps) {
  const theme = useTheme();
  if (!exerciseName) return null;

  const guide = EXERCISE_GUIDES[exerciseName] ?? {
    name: exerciseName,
    targetMuscles: ['Target Muscle Group', 'Stabilizers'],
    instructions: [
      'Maintain stable core engagement throughout the entire range of motion.',
      'Control the eccentric (lowering) phase for 2-3 seconds.',
      'Explode through the concentric phase with maximum intent.',
    ],
    hunterTip: 'Focus on mind-muscle connection. Intensity and progressive overload drive growth.',
  };

  return (
    <Modal visible={!!exerciseName} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View
          style={[
            styles.container,
            { backgroundColor: theme.card, borderColor: theme.border },
          ]}
        >
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerTitleRow}>
              <View style={[styles.badge, { backgroundColor: theme.surface, borderColor: theme.tint }]}>
                <Ionicons name="barbell" size={14} color={theme.tint} />
                <Text style={[styles.badgeText, { color: theme.tint }]}>HUNTER GUIDE</Text>
              </View>
              <Text style={[styles.title, { color: theme.text }]}>{guide.name}</Text>
            </View>
            <SmoothPressable onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={22} color={theme.textSecondary} />
            </SmoothPressable>
          </View>

          {/* Target Muscles */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: theme.textSecondary }]}>TARGET MUSCLES</Text>
            <View style={styles.muscleChips}>
              {guide.targetMuscles.map((muscle, idx) => (
                <View
                  key={idx}
                  style={[styles.muscleChip, { backgroundColor: theme.surface, borderColor: theme.border }]}
                >
                  <Text style={[styles.muscleChipText, { color: theme.accentCyan }]}>{muscle}</Text>
                </View>
              ))}
            </View>
          </View>

          {/* Protocol Steps */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: theme.textSecondary }]}>EXECUTION PROTOCOL</Text>
            {guide.instructions.map((step, idx) => (
              <View key={idx} style={styles.stepRow}>
                <View style={[styles.stepNumber, { backgroundColor: theme.tint }]}>
                  <Text style={styles.stepNumberText}>{idx + 1}</Text>
                </View>
                <Text style={[styles.stepText, { color: theme.text }]}>{step}</Text>
              </View>
            ))}
          </View>

          {/* Hunter Tip Card */}
          <View
            style={[
              styles.tipCard,
              { backgroundColor: theme.surface, borderColor: theme.accentGold },
            ]}
          >
            <Ionicons name="flash" size={18} color={theme.accentGold} />
            <View style={styles.flex}>
              <Text style={[styles.tipTitle, { color: theme.accentGold }]}>HUNTER SECRET</Text>
              <Text style={[styles.tipText, { color: theme.text }]}>{guide.hunterTip}</Text>
            </View>
          </View>

          <Button label="Acknowledge Protocol" onPress={onClose} style={styles.ackButton} />
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(5, 3, 10, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  container: {
    width: '100%',
    maxWidth: 420,
    borderRadius: 20,
    borderWidth: 1.5,
    padding: 20,
    gap: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  headerTitleRow: {
    flex: 1,
    gap: 4,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    alignSelf: 'flex-start',
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.8,
  },
  title: {
    fontSize: 19,
    fontWeight: '800',
    marginTop: 4,
  },
  closeButton: {
    padding: 4,
  },
  section: {
    gap: 8,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.8,
  },
  muscleChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  muscleChip: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
  },
  muscleChipText: {
    fontSize: 12,
    fontWeight: '600',
  },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    marginVertical: 2,
  },
  stepNumber: {
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 1,
  },
  stepNumberText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
  stepText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 18,
  },
  tipCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  flex: {
    flex: 1,
  },
  tipTitle: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  tipText: {
    fontSize: 12,
    lineHeight: 16,
  },
  ackButton: {
    marginTop: 6,
  },
});
