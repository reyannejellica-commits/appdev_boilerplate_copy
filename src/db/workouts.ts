import { getDb, newId } from './client';
import { addHunterExp, getTodayDateString, incrementDailyQuest } from './hunter';

export interface ExerciseSet {
  id: string;
  split_id: string;
  exercise_name: string;
  set_number: number;
  weight_kg: number;
  reps: number;
  completed: boolean;
  date: string;
}

export interface ExerciseGuide {
  name: string;
  targetMuscles: string[];
  instructions: string[];
  hunterTip: string;
}

export const EXERCISE_GUIDES: Record<string, ExerciseGuide> = {
  'Barbell Flat Bench Press': {
    name: 'Barbell Flat Bench Press',
    targetMuscles: ['Pectoralis Major', 'Anterior Deltoids', 'Triceps'],
    instructions: [
      'Lie flat on the bench with eyes under the barbell.',
      'Grip slightly wider than shoulder width and arch lower back moderately.',
      'Retract scapulae, unrack, and lower with control to mid-chest.',
      'Drive feet into floor and press the bar up until arms lock out.',
    ],
    hunterTip: 'Tuck elbows ~45° to protect rotator cuffs and maximize chest tension.',
  },
  'Incline Dumbbell Press': {
    name: 'Incline Dumbbell Press',
    targetMuscles: ['Clavicular Head (Upper Chest)', 'Triceps', 'Shoulders'],
    instructions: [
      'Set bench to 30-45 degrees.',
      'Kick dumbbells to shoulder height, palms forward.',
      'Lower under control until upper chest gets a deep stretch.',
      'Press upward in an arc without clashing weights together at top.',
    ],
    hunterTip: 'Higher incline targets more delts; 30° is the sweet spot for upper chest growth.',
  },
  'Overhead Shoulder Press': {
    name: 'Overhead Shoulder Press',
    targetMuscles: ['Anterior Deltoid', 'Lateral Deltoid', 'Triceps', 'Upper Core'],
    instructions: [
      'Hold bar or dumbbells at collarbone level with elbows slightly forward.',
      'Brace glutes and core to avoid hyperextending your spine.',
      'Press overhead in a straight line, pushing head forward once bar clears brow.',
      'Lock out overhead and control descent back to shoulders.',
    ],
    hunterTip: 'Squeeze glutes hard throughout each rep for maximum pressing power.',
  },
  'Triceps Pushdown': {
    name: 'Triceps Pushdown',
    targetMuscles: ['Triceps Lateral Head', 'Medial Head'],
    instructions: [
      'Attach rope or straight bar to high cable pulley.',
      'Pin elbows tightly to your sides and hinge slightly at hips.',
      'Extend elbows fully downwards until triceps are fully contracted.',
      'Slowly allow bar back up to 90 degrees while keeping elbows stationary.',
    ],
    hunterTip: 'Spreading the rope ends at full extension increases lateral head activation.',
  },
  'Barbell Deadlift': {
    name: 'Barbell Deadlift',
    targetMuscles: ['Erector Spinae', 'Glutes', 'Hamstrings', 'Lats', 'Traps'],
    instructions: [
      'Stand with mid-foot under barbell, feet hip-width apart.',
      'Hinge hips back, grip bar firmly just outside shins.',
      'Pull chest up to set spine neutral and take slack out of bar.',
      'Drive through floor, standing tall and locking hips at top.',
    ],
    hunterTip: 'Engage lats as if protecting armpits to keep the bar close to your body.',
  },
  'Barbell Back Squat': {
    name: 'Barbell Back Squat',
    targetMuscles: ['Quadriceps', 'Gluteus Maximus', 'Core', 'Adductors'],
    instructions: [
      'Rest barbell securely across upper traps, feet shoulder-width.',
      'Break at hips and knees simultaneously while keeping torso upright.',
      'Descend until thighs are at least parallel to floor.',
      'Drive through mid-foot and stand up aggressively.',
    ],
    hunterTip: 'Breathe into diaphragm and brace core like preparing for impact.',
  },
};

export interface SplitDefinition {
  id: string;
  name: string;
  focus: string;
  exercises: { name: string; defaultWeight: number; defaultReps: number; sets: number }[];
}

export const WORKOUT_SPLITS: SplitDefinition[] = [
  {
    id: 'push-a',
    name: 'Push Day A',
    focus: 'Chest, Shoulders, Triceps Focus',
    exercises: [
      { name: 'Barbell Flat Bench Press', defaultWeight: 60, defaultReps: 10, sets: 3 },
      { name: 'Incline Dumbbell Press', defaultWeight: 22, defaultReps: 10, sets: 3 },
      { name: 'Overhead Shoulder Press', defaultWeight: 40, defaultReps: 10, sets: 3 },
      { name: 'Triceps Pushdown', defaultWeight: 25, defaultReps: 12, sets: 3 },
    ],
  },
  {
    id: 'pull-a',
    name: 'Pull Day A',
    focus: 'Back, Biceps, Rear Delts Focus',
    exercises: [
      { name: 'Barbell Deadlift', defaultWeight: 90, defaultReps: 6, sets: 3 },
      { name: 'Lat Pulldown', defaultWeight: 50, defaultReps: 10, sets: 3 },
      { name: 'Incline Dumbbell Curl', defaultWeight: 12, defaultReps: 12, sets: 3 },
      { name: 'Face Pulls', defaultWeight: 20, defaultReps: 15, sets: 3 },
    ],
  },
  {
    id: 'legs-a',
    name: 'Legs Day A',
    focus: 'Quads, Hamstrings, Calves Focus',
    exercises: [
      { name: 'Barbell Back Squat', defaultWeight: 80, defaultReps: 8, sets: 3 },
      { name: 'Romanian Deadlift', defaultWeight: 70, defaultReps: 10, sets: 3 },
      { name: 'Leg Press', defaultWeight: 120, defaultReps: 12, sets: 3 },
      { name: 'Standing Calf Raise', defaultWeight: 40, defaultReps: 15, sets: 3 },
    ],
  },
  {
    id: 'push-b',
    name: 'Push Day B',
    focus: 'Incline Chest, Lateral Delts & Triceps',
    exercises: [
      { name: 'Incline Dumbbell Press', defaultWeight: 24, defaultReps: 10, sets: 3 },
      { name: 'Barbell Flat Bench Press', defaultWeight: 65, defaultReps: 8, sets: 3 },
      { name: 'Overhead Shoulder Press', defaultWeight: 42.5, defaultReps: 8, sets: 3 },
      { name: 'Triceps Pushdown', defaultWeight: 27.5, defaultReps: 12, sets: 3 },
    ],
  },
  {
    id: 'pull-b',
    name: 'Pull Day B',
    focus: 'Back Thickness & Biceps Overload',
    exercises: [
      { name: 'Lat Pulldown', defaultWeight: 55, defaultReps: 10, sets: 3 },
      { name: 'Incline Dumbbell Curl', defaultWeight: 14, defaultReps: 10, sets: 3 },
      { name: 'Face Pulls', defaultWeight: 22.5, defaultReps: 15, sets: 3 },
      { name: 'Barbell Deadlift', defaultWeight: 95, defaultReps: 5, sets: 3 },
    ],
  },
];

/** Get or seed exercise sets for a given split on a specific date */
export async function getSplitSets(
  splitId: string,
  dateStr = getTodayDateString()
): Promise<ExerciseSet[]> {
  const db = await getDb();
  const rows = await db.getAllAsync<{
    id: string;
    split_id: string;
    exercise_name: string;
    set_number: number;
    weight_kg: number;
    reps: number;
    completed: number;
    date: string;
  }>('SELECT * FROM exercise_logs WHERE split_id = ? AND date = ? ORDER BY id ASC', splitId, dateStr);

  if (rows.length > 0) {
    return rows.map((r) => ({
      ...r,
      completed: r.completed === 1,
    }));
  }

  // Seed default sets from split definition
  const split = WORKOUT_SPLITS.find((s) => s.id === splitId) ?? WORKOUT_SPLITS[0];
  const setsToInsert: ExerciseSet[] = [];

  for (const ex of split.exercises) {
    for (let setIdx = 1; setIdx <= ex.sets; setIdx++) {
      const setItem: ExerciseSet = {
        id: newId(),
        split_id: splitId,
        exercise_name: ex.name,
        set_number: setIdx,
        weight_kg: ex.defaultWeight,
        reps: ex.defaultReps,
        completed: false,
        date: dateStr,
      };
      await db.runAsync(
        `INSERT INTO exercise_logs (id, split_id, exercise_name, set_number, weight_kg, reps, completed, date)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        setItem.id,
        setItem.split_id,
        setItem.exercise_name,
        setItem.set_number,
        setItem.weight_kg,
        setItem.reps,
        0,
        setItem.date
      );
      setsToInsert.push(setItem);
    }
  }

  return setsToInsert;
}

/** Toggle set completion */
export async function toggleSetCompletion(
  setId: string,
  completed: boolean
): Promise<{ completed: boolean; allDone: boolean }> {
  const db = await getDb();
  await db.runAsync(
    'UPDATE exercise_logs SET completed = ? WHERE id = ?',
    completed ? 1 : 0,
    setId
  );

  if (completed) {
    // Reward EXP for completing each set
    await addHunterExp(10);
  }

  // Check if all sets for this split on this date are now completed
  const targetSet = await db.getFirstAsync<{ split_id: string; date: string }>(
    'SELECT split_id, date FROM exercise_logs WHERE id = ?',
    setId
  );

  let allDone = false;
  if (targetSet) {
    const uncompleted = await db.getFirstAsync<{ count: number }>(
      'SELECT COUNT(*) as count FROM exercise_logs WHERE split_id = ? AND date = ? AND completed = 0',
      targetSet.split_id,
      targetSet.date
    );
    if (uncompleted && uncompleted.count === 0) {
      allDone = true;
      await addHunterExp(100); // Big completion bonus
      await incrementDailyQuest('workout', 1, targetSet.date);
    }
  }

  return { completed, allDone };
}

/** Update set weight and reps */
export async function updateSetValues(
  setId: string,
  weightKg: number,
  reps: number
): Promise<void> {
  const db = await getDb();
  await db.runAsync(
    'UPDATE exercise_logs SET weight_kg = ?, reps = ? WHERE id = ?',
    weightKg,
    reps,
    setId
  );
}
