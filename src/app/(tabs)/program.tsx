import { Ionicons } from '@expo/vector-icons';
import React, { useCallback, useEffect, useState } from 'react';
import {
  Alert,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { ExerciseGuideModal } from '@/components/ExerciseGuideModal';
import { SmoothPressable } from '@/components/SmoothPressable';
import {
  WORKOUT_SPLITS,
  getSplitSets,
  toggleSetCompletion,
  updateSetValues,
  type ExerciseSet,
  type SplitDefinition,
} from '@/db/workouts';
import { useTheme } from '@/theme';

export default function ProgramScreen() {
  const theme = useTheme();

  const [activeSplitId, setActiveSplitId] = useState<string>('push-a');
  const [sets, setSets] = useState<ExerciseSet[]>([]);
  const [selectedGuideExercise, setSelectedGuideExercise] = useState<string | null>(null);

  // Edit Set Modal State
  const [editingSet, setEditingSet] = useState<ExerciseSet | null>(null);
  const [editWeight, setEditWeight] = useState('');
  const [editReps, setEditReps] = useState('');

  const currentSplit: SplitDefinition =
    WORKOUT_SPLITS.find((s) => s.id === activeSplitId) ?? WORKOUT_SPLITS[0];

  const loadSets = useCallback(async () => {
    try {
      const data = await getSplitSets(activeSplitId);
      setSets(data);
    } catch (e) {
      console.warn('Failed to load sets:', e);
    }
  }, [activeSplitId]);

  useEffect(() => {
    let isMounted = true;
    (async () => {
      try {
        const data = await getSplitSets(activeSplitId);
        if (isMounted) setSets(data);
      } catch (e) {
        console.warn('Failed to load sets:', e);
      }
    })();
    return () => {
      isMounted = false;
    };
  }, [activeSplitId]);

  // Compute completed sets & total sets
  const totalSetsCount = sets.length;
  const completedSetsCount = sets.filter((s) => s.completed).length;
  const percentDone =
    totalSetsCount > 0 ? Math.round((completedSetsCount / totalSetsCount) * 100) : 0;

  // Group sets by exercise name
  const exercisesGrouped: { [name: string]: ExerciseSet[] } = {};
  for (const s of sets) {
    if (!exercisesGrouped[s.exercise_name]) {
      exercisesGrouped[s.exercise_name] = [];
    }
    exercisesGrouped[s.exercise_name].push(s);
  }

  const handleToggleSet = async (item: ExerciseSet) => {
    const nextCompleted = !item.completed;
    // Optimistic UI update
    setSets((prev) =>
      prev.map((s) => (s.id === item.id ? { ...s, completed: nextCompleted } : s))
    );

    try {
      const { allDone } = await toggleSetCompletion(item.id, nextCompleted);
      if (allDone) {
        Alert.alert(
          'QUEST COMPLETE! ⚔️',
          'All target protocol sets finished. The System granted +100 EXP and updated your Daily Quest!'
        );
      }
    } catch (e) {
      console.warn('Failed to toggle set:', e);
      loadSets();
    }
  };

  const openEditModal = (set: ExerciseSet) => {
    setEditingSet(set);
    setEditWeight(String(set.weight_kg));
    setEditReps(String(set.reps));
  };

  const saveEditSet = async () => {
    if (!editingSet) return;
    const w = parseFloat(editWeight) || 0;
    const r = parseInt(editReps, 10) || 1;

    setSets((prev) =>
      prev.map((s) => (s.id === editingSet.id ? { ...s, weight_kg: w, reps: r } : s))
    );
    setEditingSet(null);

    try {
      await updateSetValues(editingSet.id, w, r);
    } catch (e) {
      console.warn('Failed to update set:', e);
      loadSets();
    }
  };

  // Split Navigation Arrows
  const currentIndex = WORKOUT_SPLITS.findIndex((s) => s.id === activeSplitId);
  const handlePrevSplit = () => {
    const prev = (currentIndex - 1 + WORKOUT_SPLITS.length) % WORKOUT_SPLITS.length;
    setActiveSplitId(WORKOUT_SPLITS[prev].id);
  };
  const handleNextSplit = () => {
    const next = (currentIndex + 1) % WORKOUT_SPLITS.length;
    setActiveSplitId(WORKOUT_SPLITS[next].id);
  };

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.background }]}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
    >
      {/* 1. Split Header Card */}
      <View style={[styles.splitCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
        <View style={styles.splitNavRow}>
          <View style={styles.splitSelectorHeader}>
            <SmoothPressable onPress={handlePrevSplit} style={styles.navArrowButton}>
              <Ionicons name="chevron-back" size={16} color={theme.textSecondary} />
            </SmoothPressable>
            <Text style={[styles.splitNavLabel, { color: theme.tint }]}>
              {currentSplit.name.toUpperCase()}
            </Text>
            <SmoothPressable onPress={handleNextSplit} style={styles.navArrowButton}>
              <Ionicons name="chevron-forward" size={16} color={theme.textSecondary} />
            </SmoothPressable>
          </View>
          <Text style={[styles.percentDoneText, { color: theme.tint }]}>{percentDone}%</Text>
        </View>

        <Text style={[styles.splitMainTitle, { color: theme.text }]}>
          Push, Pull, Legs (PPL) Split
        </Text>

        {/* Horizontal Split Day Tabs */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.splitTabsRow}>
          {WORKOUT_SPLITS.map((split) => {
            const isSelected = split.id === activeSplitId;
            return (
              <SmoothPressable
                key={split.id}
                onPress={() => setActiveSplitId(split.id)}
                style={[
                  styles.splitTabPill,
                  isSelected
                    ? { backgroundColor: theme.tint, borderColor: theme.tint }
                    : { backgroundColor: theme.surface, borderColor: theme.border },
                ]}
              >
                <Text
                  style={[
                    styles.splitTabPillText,
                    { color: isSelected ? '#FFFFFF' : theme.textSecondary },
                  ]}
                >
                  {split.name}
                </Text>
              </SmoothPressable>
            );
          })}
        </ScrollView>

        {/* Split Progress Track */}
        <View style={[styles.splitProgressBarTrack, { backgroundColor: theme.surface }]}>
          <View
            style={[
              styles.splitProgressBarFill,
              { width: `${percentDone}%`, backgroundColor: theme.tint },
            ]}
          />
        </View>
      </View>

      {/* 2. Today's Target Protocol Section */}
      <View style={styles.sectionHeaderRow}>
        <View>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Today&apos;s Target Protocol</Text>
          <Text style={[styles.sectionSubtitle, { color: theme.textSecondary }]}>
            Target: {currentSplit.focus}
          </Text>
        </View>
        <Text style={[styles.setsDoneCounter, { color: theme.textSecondary }]}>
          {completedSetsCount} / {totalSetsCount} Sets Done
        </Text>
      </View>

      {/* 3. Exercises List */}
      <View style={styles.exerciseList}>
        {Object.entries(exercisesGrouped).map(([exName, exSets]) => (
          <View
            key={exName}
            style={[styles.exerciseCard, { backgroundColor: theme.card, borderColor: theme.border }]}
          >
            {/* Exercise Title & Guide Button */}
            <View style={styles.exerciseCardHeader}>
              <Text style={[styles.exerciseCardTitle, { color: theme.text }]}>{exName}</Text>
              <SmoothPressable
                onPress={() => setSelectedGuideExercise(exName)}
                style={[styles.guideButton, { backgroundColor: theme.surface, borderColor: theme.border }]}
              >
                <Ionicons name="information-circle-outline" size={14} color={theme.tint} />
                <Text style={[styles.guideButtonText, { color: theme.tint }]}>Guide</Text>
              </SmoothPressable>
            </View>

            {/* Set Rows */}
            <View style={styles.setsList}>
              {exSets.map((setItem) => (
                <View
                  key={setItem.id}
                  style={[
                    styles.setRow,
                    { backgroundColor: theme.surface, borderColor: setItem.completed ? theme.tint : theme.border },
                  ]}
                >
                  <Text style={[styles.setLabel, { color: theme.textSecondary }]}>
                    SET {setItem.set_number}
                  </Text>

                  {/* Weight Box */}
                  <SmoothPressable
                    onPress={() => openEditModal(setItem)}
                    style={[styles.valueBox, { backgroundColor: theme.inputBackground, borderColor: theme.border }]}
                  >
                    <Text style={[styles.valueBoxText, { color: theme.text }]}>
                      {setItem.weight_kg}
                    </Text>
                  </SmoothPressable>
                  <Text style={[styles.unitText, { color: theme.textDim }]}>KG</Text>

                  {/* Reps Box */}
                  <SmoothPressable
                    onPress={() => openEditModal(setItem)}
                    style={[styles.valueBox, { backgroundColor: theme.inputBackground, borderColor: theme.border }]}
                  >
                    <Text style={[styles.valueBoxText, { color: theme.text }]}>
                      {setItem.reps}
                    </Text>
                  </SmoothPressable>
                  <Text style={[styles.unitText, { color: theme.textDim }]}>REPS</Text>

                  {/* Completion Checkbox */}
                  <SmoothPressable
                    onPress={() => handleToggleSet(setItem)}
                    style={[
                      styles.checkbox,
                      setItem.completed
                        ? { backgroundColor: theme.tint, borderColor: theme.tint }
                        : { backgroundColor: theme.inputBackground, borderColor: theme.border },
                    ]}
                  >
                    {setItem.completed && <Ionicons name="checkmark" size={16} color="#FFFFFF" />}
                  </SmoothPressable>
                </View>
              ))}
            </View>
          </View>
        ))}
      </View>

      {/* Guide Modal */}
      <ExerciseGuideModal
        exerciseName={selectedGuideExercise}
        onClose={() => setSelectedGuideExercise(null)}
      />

      {/* Inline Set Edit Modal */}
      <Modal visible={!!editingSet} transparent animationType="fade" onRequestClose={() => setEditingSet(null)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <Text style={[styles.modalTitle, { color: theme.text }]}>
              {editingSet?.exercise_name} - SET {editingSet?.set_number}
            </Text>
            <Text style={[styles.modalSubtitle, { color: theme.textSecondary }]}>
              Adjust load and repetitions for progressive overload.
            </Text>

            <View style={styles.modalInputsRow}>
              <View style={styles.modalInputBlock}>
                <Text style={[styles.modalInputLabel, { color: theme.textSecondary }]}>WEIGHT (KG)</Text>
                <TextInput
                  keyboardType="numeric"
                  value={editWeight}
                  onChangeText={setEditWeight}
                  style={[styles.modalTextInput, { color: theme.text, backgroundColor: theme.surface, borderColor: theme.border }]}
                />
              </View>

              <View style={styles.modalInputBlock}>
                <Text style={[styles.modalInputLabel, { color: theme.textSecondary }]}>REPS</Text>
                <TextInput
                  keyboardType="numeric"
                  value={editReps}
                  onChangeText={setEditReps}
                  style={[styles.modalTextInput, { color: theme.text, backgroundColor: theme.surface, borderColor: theme.border }]}
                />
              </View>
            </View>

            <View style={styles.modalButtonsRow}>
              <SmoothPressable
                onPress={() => setEditingSet(null)}
                style={[styles.modalCancelButton, { borderColor: theme.border }]}
              >
                <Text style={{ color: theme.textSecondary, fontWeight: '600' }}>Cancel</Text>
              </SmoothPressable>
              <SmoothPressable
                onPress={saveEditSet}
                style={[styles.modalSaveButton, { backgroundColor: theme.tint }]}
              >
                <Text style={{ color: '#FFFFFF', fontWeight: '700' }}>Save Target</Text>
              </SmoothPressable>
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { padding: 16, gap: 16, paddingBottom: 100 },

  // Split Card
  splitCard: {
    borderRadius: 20,
    borderWidth: 1.5,
    padding: 16,
    gap: 12,
  },
  splitNavRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  splitSelectorHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  navArrowButton: {
    padding: 4,
  },
  splitNavLabel: {
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1.2,
  },
  percentDoneText: {
    fontSize: 13,
    fontWeight: '800',
  },
  splitMainTitle: {
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  splitTabsRow: {
    gap: 8,
    paddingVertical: 2,
  },
  splitTabPill: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 14,
    borderWidth: 1,
  },
  splitTabPillText: {
    fontSize: 12,
    fontWeight: '700',
  },
  splitProgressBarTrack: {
    height: 4,
    borderRadius: 2,
    overflow: 'hidden',
    width: '100%',
    marginTop: 4,
  },
  splitProgressBarFill: {
    height: '100%',
    borderRadius: 2,
  },

  // Target Protocol Section
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginTop: 4,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: 0.2,
  },
  sectionSubtitle: {
    fontSize: 12,
    marginTop: 2,
  },
  setsDoneCounter: {
    fontSize: 12,
    fontWeight: '700',
  },

  // Exercise Cards
  exerciseList: {
    gap: 14,
  },
  exerciseCard: {
    borderRadius: 18,
    borderWidth: 1.5,
    padding: 16,
    gap: 12,
  },
  exerciseCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  exerciseCardTitle: {
    fontSize: 16,
    fontWeight: '800',
    flex: 1,
  },
  guideButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
  },
  guideButtonText: {
    fontSize: 11,
    fontWeight: '700',
  },

  // Set Rows
  setsList: {
    gap: 8,
  },
  setRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    gap: 10,
  },
  setLabel: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
    width: 44,
  },
  valueBox: {
    flex: 1,
    height: 36,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  valueBoxText: {
    fontSize: 14,
    fontWeight: '700',
  },
  unitText: {
    fontSize: 10,
    fontWeight: '800',
    width: 32,
  },
  checkbox: {
    width: 30,
    height: 30,
    borderRadius: 8,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Edit Set Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(5, 3, 10, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalCard: {
    width: '100%',
    maxWidth: 380,
    borderRadius: 20,
    borderWidth: 1.5,
    padding: 20,
    gap: 14,
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '800',
  },
  modalSubtitle: {
    fontSize: 13,
  },
  modalInputsRow: {
    flexDirection: 'row',
    gap: 12,
    marginVertical: 6,
  },
  modalInputBlock: {
    flex: 1,
    gap: 6,
  },
  modalInputLabel: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  modalTextInput: {
    height: 44,
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 12,
    fontSize: 16,
    fontWeight: '700',
    textAlign: 'center',
  },
  modalButtonsRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
    marginTop: 4,
  },
  modalCancelButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
  },
  modalSaveButton: {
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 10,
  },
});
