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

export interface SplitDefinition {
  id: string;
  name: string;
  subtitle: string;
  category: 'Weightlifting' | 'Bodyweight';
  focus: string;
  targetTags: string[];
  durationMinutes: number;
  exercises: {
    name: string;
    defaultWeight: number;
    defaultReps: number;
    sets: number;
  }[];
}

export interface WorkoutHistoryEntry {
  id: string;
  splitId: string;
  title: string;
  date: string;
  completedSets: number;
  totalSets: number;
  totalVolumeKg: number;
  durationMinutes: number;
}

export interface ExerciseGuide {
  name: string;
  categoryTag?: string;
  equipmentBadge?: string;
  primaryEngagement?: string;
  primaryMuscles?: string;
  secondaryMuscles?: string;
  targetMuscles: string[];
  instructions: string[];
  proTip: string;
  formTips?: string[];
  mistakes?: string[];
}

export const EXERCISE_GUIDES: Record<string, ExerciseGuide> = {
  'Barbell Back Squats': {
    name: 'Barbell Back Squats',
    categoryTag: 'QUAD & POSTERIOR POWER',
    equipmentBadge: 'Squat Rack & Barbell',
    primaryEngagement: 'QUADRICEPS (VASTUS MEDIALIS/LATERALIS), GLUTEUS MAXIMUS',
    primaryMuscles: 'Quadriceps (Vastus Medialis/Lateralis), Gluteus Maximus',
    secondaryMuscles: 'Hamstrings, Adductors, Core Stabilizers, Calves',
    targetMuscles: ['Quadriceps', 'Gluteus Maximus', 'Core', 'Hamstrings'],
    instructions: [
      'Step under the bar, placing it securely across upper traps. Grip firmly, brace core, and unrack.',
      'Set feet shoulder-width apart with toes pointed slightly outward (15°-30°).',
      'Break at the hips and knees simultaneously, lowering until hip crease is below parallel to knees.',
      'Drive through the mid-foot and heels to stand back up, exhaling past the sticking point.',
    ],
    formTips: [
      'Take a big belly breath and brace core (Valsalva maneuver) before every rep.',
      'Keep chest elevated and track knees outward over toes throughout the descent.',
    ],
    mistakes: [
      'Allowing knees to cave inward (valgus collapse) on the ascent.',
      'Rounding the lower back (butt wink) at deep flexion.',
    ],
    proTip: 'Maintain 360-degree intra-abdominal pressure throughout the entire repetition.',
  },
  'Barbell Back Squat': {
    name: 'Barbell Back Squats',
    categoryTag: 'QUAD & POSTERIOR POWER',
    equipmentBadge: 'Squat Rack & Barbell',
    primaryEngagement: 'QUADRICEPS (VASTUS MEDIALIS/LATERALIS), GLUTEUS MAXIMUS',
    primaryMuscles: 'Quadriceps (Vastus Medialis/Lateralis), Gluteus Maximus',
    secondaryMuscles: 'Hamstrings, Adductors, Core Stabilizers, Calves',
    targetMuscles: ['Quadriceps', 'Gluteus Maximus', 'Core', 'Hamstrings'],
    instructions: [
      'Step under the bar, placing it securely across upper traps. Grip firmly, brace core, and unrack.',
      'Set feet shoulder-width apart with toes pointed slightly outward (15°-30°).',
      'Break at the hips and knees simultaneously, lowering until hip crease is below parallel to knees.',
      'Drive through the mid-foot and heels to stand back up, exhaling past the sticking point.',
    ],
    formTips: [
      'Take a big belly breath and brace core (Valsalva maneuver) before every rep.',
      'Keep chest elevated and track knees outward over toes throughout the descent.',
    ],
    mistakes: [
      'Allowing knees to cave inward (valgus collapse) on the ascent.',
      'Rounding the lower back (butt wink) at deep flexion.',
    ],
    proTip: 'Maintain 360-degree intra-abdominal pressure throughout the entire repetition.',
  },
  'Barbell Bench Press': {
    name: 'Barbell Bench Press',
    categoryTag: 'HORIZONTAL PUSH POWER',
    equipmentBadge: 'Flat Bench & Barbell',
    primaryEngagement: 'PECTORALIS MAJOR (STERNAL/CLAVICULAR), ANTERIOR DELTOID',
    primaryMuscles: 'Pectoralis Major (Mid & Lower Chest), Anterior Deltoid',
    secondaryMuscles: 'Triceps Brachii, Latissimus Dorsi, Core Stabilizers',
    targetMuscles: ['Pectoralis Major', 'Anterior Deltoids', 'Triceps'],
    instructions: [
      'Lie flat on the bench with eyes directly under the racked bar. Plant feet firmly on the floor.',
      'Retract shoulder blades, arch lower back slightly, and grip bar slightly wider than shoulder-width.',
      'Unrack bar with locked elbows, take a deep breath, and lower bar under control to lower sternum.',
      'Drive feet into the ground and press the barbell up in a slight backward arc to full lockout.',
    ],
    formTips: [
      'Keep elbows tucked at roughly 45° to 75° angle to prevent anterior shoulder impingement.',
      'Squeeze the bar as hard as possible to maximize neural drive and wrist stability.',
    ],
    mistakes: [
      'Bouncing the barbell off the sternum or ribcage using momentum.',
      'Flaring elbows out at 90° which places excessive shear stress on rotator cuff tendons.',
    ],
    proTip: 'Drive through your heels to initiate leg drive, transferring power into the bar.',
  },
  'Barbell Flat Bench Press': {
    name: 'Barbell Bench Press',
    categoryTag: 'HORIZONTAL PUSH POWER',
    equipmentBadge: 'Flat Bench & Barbell',
    primaryEngagement: 'PECTORALIS MAJOR (STERNAL/CLAVICULAR), ANTERIOR DELTOID',
    primaryMuscles: 'Pectoralis Major (Mid & Lower Chest), Anterior Deltoid',
    secondaryMuscles: 'Triceps Brachii, Latissimus Dorsi, Core Stabilizers',
    targetMuscles: ['Chest', 'Front Delts', 'Triceps'],
    instructions: [
      'Lie flat on the bench with eyes under the barbell.',
      'Grip slightly wider than shoulder width and arch lower back moderately.',
      'Retract scapulae, unrack, and lower with control to mid-chest.',
      'Drive feet into floor and press the bar up until arms lock out.',
    ],
    formTips: [
      'Keep elbows tucked at roughly 45° to 75° angle to prevent shoulder strain.',
      'Squeeze the bar hard and engage lats during the descent.',
    ],
    mistakes: [
      'Bouncing the bar off the chest.',
      'Flaring elbows completely perpendicular to torso.',
    ],
    proTip: 'Tuck elbows ~45° to protect rotator cuffs and maximize chest activation.',
  },
  'Bent Over Barbell Row': {
    name: 'Bent Over Barbell Row',
    categoryTag: 'POSTERIOR PULL THICKNESS',
    equipmentBadge: 'Olympic Barbell & Plates',
    primaryEngagement: 'LATISSIMUS DORSI, RHOMBOIDS, MIDDLE & LOWER TRAPEZIUS',
    primaryMuscles: 'Latissimus Dorsi, Rhomboids, Trapezius',
    secondaryMuscles: 'Posterior Deltoids, Biceps Brachii, Erector Spinae, Hamstrings',
    targetMuscles: ['Latissimus Dorsi', 'Rhomboids', 'Middle Traps', 'Biceps'],
    instructions: [
      'Stand with feet hip-width apart, grip the barbell slightly wider than shoulder-width with overhand grip.',
      'Hinge hips backward until torso is approximately 45° to parallel with floor, keeping spine neutral.',
      'Initiate pull by driving elbows toward the ceiling, pulling the bar smoothly into upper abdomen/belly button.',
      'Squeeze shoulder blades together hard for 1 second at top, then lower with control to full stretch.',
    ],
    formTips: [
      'Pull through your elbows rather than your hands to emphasize back recruitment over biceps.',
      'Maintain a locked isometric hip hinge and brace abs to protect the lumbar spine.',
    ],
    mistakes: [
      'Using excessive torso swing or heaving the weight up using momentum.',
      'Rounding the lower back or craning the neck up excessively during the pull.',
    ],
    proTip: 'Imagine trying to touch your elbows together behind your back at peak contraction.',
  },
  'Overhead Press': {
    name: 'Overhead Press',
    categoryTag: 'VERTICAL PUSH STRENGTH',
    equipmentBadge: 'Barbell & Power Rack',
    primaryEngagement: 'ANTERIOR & LATERAL DELTOIDS, TRICEPS BRACHII',
    primaryMuscles: 'Anterior Deltoids, Lateral Deltoids, Triceps Brachii',
    secondaryMuscles: 'Upper Pectoralis, Serratus Anterior, Trapezius, Glutes, Core',
    targetMuscles: ['Shoulders', 'Triceps', 'Upper Chest', 'Core'],
    instructions: [
      'Rest the bar on front shoulders/clavicle with elbows slightly in front of bar and vertical forearms.',
      'Squeeze glutes and brace core tightly to establish a rock-solid, rigid kinetic base.',
      'Tilt head slightly back and press the bar straight vertically in the shortest possible bar path.',
      'Once the bar clears forehead, bring head forward to lock out directly overhead with active traps.',
    ],
    formTips: [
      'Squeeze your glutes as hard as possible throughout the movement to eliminate lower back arching.',
      'Shrug traps slightly upward at the apex of lockout for complete scapular upward rotation.',
    ],
    mistakes: [
      'Hyperextending the lumbar spine into a pseudo-incline bench press.',
      'Pressing the barbell in a wide forward loop instead of a tight vertical bar path.',
    ],
    proTip: 'Active overhead shrug at the top locks the joint safely in place and activates the serratus anterior.',
  },
  'Overhead Shoulder Press': {
    name: 'Overhead Press',
    categoryTag: 'VERTICAL PUSH STRENGTH',
    equipmentBadge: 'Barbell & Power Rack',
    primaryEngagement: 'ANTERIOR & LATERAL DELTOIDS, TRICEPS BRACHII',
    primaryMuscles: 'Anterior Deltoids, Lateral Deltoids, Triceps Brachii',
    secondaryMuscles: 'Upper Pectoralis, Serratus Anterior, Trapezius, Glutes, Core',
    targetMuscles: ['Shoulders', 'Upper Chest', 'Triceps', 'Core'],
    instructions: [
      'Hold bar or dumbbells at collarbone level with elbows slightly forward.',
      'Brace glutes and core to avoid hyperextending your spine.',
      'Press directly overhead, pushing your head forward slightly at lockout.',
      'Control the eccentric lowering phase back to starting rack.',
    ],
    formTips: [
      'Squeeze your glutes and core throughout the press for a stable kinetic chain.',
      'Push your head slightly forward at lockout for shoulder joint alignment.',
    ],
    mistakes: [
      'Arching the lower back excessively to compensate for shoulder mobility.',
      'Allowing elbows to flare backwards behind the bar path.',
    ],
    proTip: 'Engage your glutes and core throughout the press for a stable kinetic chain.',
  },
  'Standing Biceps Curls': {
    name: 'Standing Biceps Curls',
    categoryTag: 'ARM HYPERTROPHY ISOLATION',
    equipmentBadge: 'Straight or EZ Barbell',
    primaryEngagement: 'BICEPS BRACHII (SHORT & LONG HEADS), BRACHIALIS',
    primaryMuscles: 'Biceps Brachii (Long & Short Head), Brachialis',
    secondaryMuscles: 'Brachioradialis, Forearm Flexors, Anterior Deltoids',
    targetMuscles: ['Biceps Brachii', 'Brachialis', 'Forearms'],
    instructions: [
      'Stand upright with feet shoulder-width apart, holding the barbell with an underhand grip.',
      'Pin elbows tight against your ribs and keep chest elevated with retracted shoulders.',
      'Curl the bar upward by flexing at the elbows while keeping upper arms strictly motionless.',
      'Squeeze biceps intensely at top contraction, then lower under control for 2-3 seconds.',
    ],
    formTips: [
      'Lock your elbows in place slightly in front of your hips and avoid letting them drift backward.',
      'Focus on a slow, controlled negative eccentric phase to maximize muscle fiber micro-tears.',
      'Maintain neutral wrists throughout the curl to prevent unnecessary forearm flexor strain.',
    ],
    mistakes: [
      'Swinging the hips or using lower back momentum to launch the weight upward.',
      'Allowing shoulders to roll forward or elbows to flare excessively outwards.',
    ],
    proTip: 'Do not let your elbows drift backwards as you curl; keeping them pinned maximizes tension on the bicep apex.',
  },
  'Triceps Pushdown': {
    name: 'Triceps Pushdown',
    targetMuscles: ['Triceps Lateral Head', 'Triceps Medial Head'],
    instructions: [
      'Attach rope or straight bar to high cable pulley.',
      'Pin elbows firmly to your sides with a slight torso lean.',
      'Extend downward until triceps are fully contracted.',
      'Slowly return to 90 degrees elbow flexion.',
    ],
    proTip: 'Keep elbows strictly motionless to isolate the triceps without swinging.',
  },
  'Barbell Deadlift': {
    name: 'Barbell Deadlift',
    targetMuscles: ['Erector Spinae', 'Glutes', 'Hamstrings', 'Lats'],
    instructions: [
      'Stand with mid-foot directly under the barbell.',
      'Hinge hips back and grip bar just outside knees.',
      'Pull slack out of the barbell, flatten back, and take a deep diaphragmatic breath.',
      'Drive the floor away with your legs and extend hips to lockout.',
    ],
    proTip: 'Think of pushing the earth away with your legs rather than pulling with your arms.',
  },
  'Lat Pulldown': {
    name: 'Lat Pulldown',
    targetMuscles: ['Latissimus Dorsi', 'Teres Major', 'Biceps'],
    instructions: [
      'Grip wide bar slightly outside shoulder width.',
      'Lean back ~10-15 degrees and depress shoulders down.',
      'Pull bar smoothly down to upper chest leading with your elbows.',
      'Control release back to full lat stretch overhead.',
    ],
    proTip: 'Initiate by driving your shoulder blades downward before bending elbows.',
  },
  'Incline Dumbbell Curl': {
    name: 'Incline Dumbbell Curl',
    targetMuscles: ['Biceps Long Head', 'Brachialis'],
    instructions: [
      'Set bench to 45-60 degrees and sit back with dumbbells hanging straight down.',
      'Keep upper arms perpendicular to floor to maintain shoulder extension.',
      'Supinate wrists as you curl upward.',
      'Lower slowly to full stretch at the bottom.',
    ],
    proTip: 'The reclined position stretches the long head of the bicep for maximal growth stimulus.',
  },
  'Face Pulls': {
    name: 'Face Pulls',
    targetMuscles: ['Rear Deltoids', 'Rotator Cuff', 'Rhomboids'],
    instructions: [
      'Set rope on cable machine at eye level.',
      'Grip rope with thumbs facing backwards.',
      'Pull towards bridge of nose while externally rotating shoulders.',
      'Squeeze shoulder blades together for 1-2 seconds.',
    ],
    proTip: 'Essential accessory for shoulder longevity and countering pressing volume.',
  },
  'Romanian Deadlift': {
    name: 'Romanian Deadlift',
    targetMuscles: ['Hamstrings', 'Glutes', 'Lower Back'],
    instructions: [
      'Hold barbell at hip height with soft bend in knees.',
      'Hinge hips backwards while keeping spine neutral and bar close to legs.',
      'Lower until hamstrings are fully lengthened (just below knee level).',
      'Contract glutes to pull hips forward to standing position.',
    ],
    proTip: 'Focus on pushing your hips backward toward an imaginary wall.',
  },
  'Leg Press': {
    name: 'Leg Press',
    targetMuscles: ['Quadriceps', 'Glutes'],
    instructions: [
      'Position feet shoulder-width on center platform.',
      'Release safety handles and lower carriage until knees reach 90 degrees.',
      'Do not allow lower back to round off the seat pad.',
      'Press through heels without locking knees aggressively at top.',
    ],
    proTip: 'Place feet lower on platform for quad emphasis, higher for glutes/hamstrings.',
  },
  'Standing Calf Raise': {
    name: 'Standing Calf Raise',
    targetMuscles: ['Gastrocnemius', 'Soleus'],
    instructions: [
      'Place balls of feet on platform ledge with heels hanging off.',
      'Lower heels down into a deep stretch for 2 seconds.',
      'Explode upward onto toes and squeeze calves at peak contraction.',
    ],
    proTip: 'A deliberate 2-second pause at the bottom eliminates the Achilles stretch reflex.',
  },
  'Lying Leg Curl': {
    name: 'Lying Leg Curl',
    targetMuscles: ['Hamstrings (Biceps Femoris)'],
    instructions: [
      'Lie face down with pad positioned just below calf muscles.',
      'Curl weight up toward glutes while keeping hips pinned to bench.',
      'Pause briefly at peak contraction, then lower under control.',
    ],
    proTip: 'Keep your hips pressed firmly into the bench to prevent lumbar compensation.',
  },
  'Smith Machine Squat': {
    name: 'Smith Machine Squat',
    targetMuscles: ['Quadriceps', 'Glutes', 'Adductors'],
    instructions: [
      'Position bar on upper traps, feet slightly forward from bar path.',
      'Unlock bar and descend under control to 90 degrees or below.',
      'Drive smoothly upward through midfoot and heels.',
    ],
    proTip: 'Placing feet slightly in front allows an upright torso for deeper quad focus.',
  },
  'Pull-ups / Chin-ups': {
    name: 'Pull-ups / Chin-ups',
    targetMuscles: ['Lats', 'Biceps', 'Core'],
    instructions: [
      'Hang from bar with overhand or underhand grip.',
      'Pull elbows down into ribcage until chin clears bar.',
      'Lower fully into dead hang with control.',
    ],
    proTip: 'Focus on pulling your elbows to your back pockets.',
  },
  'Dips': {
    name: 'Dips',
    targetMuscles: ['Triceps', 'Lower Chest', 'Front Delts'],
    instructions: [
      'Mount parallel dip bars with arms extended.',
      'Lean forward slightly for chest emphasis or stay upright for triceps.',
      'Lower until elbows are at 90 degrees, then press back up.',
    ],
    proTip: 'Keep shoulders packed down to avoid strain on the AC joint.',
  },
  'Push-ups': {
    name: 'Push-ups',
    targetMuscles: ['Chest', 'Triceps', 'Core'],
    instructions: [
      'High plank position with hands slightly outside shoulders.',
      'Keep body in straight rigid line from head to heels.',
      'Lower until chest hovers an inch above floor, then push back up.',
    ],
    proTip: 'Screw hands into the floor to activate lats and protect shoulders.',
  },
  'Flat Dumbbell Chest Press': {
    name: 'Flat Dumbbell Chest Press',
    targetMuscles: ['Middle Chest', 'Front Delts', 'Triceps'],
    instructions: [
      'Lie flat on the bench with dumbbells pressed directly over mid-chest.',
      'Lower weights smoothly with elbows flared ~45-60 degrees until deep pectoral stretch.',
      'Drive dumbbells up and slightly inward without clashing weights.',
      'Lock out with deliberate tension at top of rep.',
    ],
    proTip: 'Keep feet planted and shoulder blades pinched to protect anterior shoulder capsule.',
  },
  'Cable Chest Fly': {
    name: 'Cable Chest Fly',
    targetMuscles: ['Sternal Pectorals', 'Inner Chest'],
    instructions: [
      'Set pulleys at shoulder or mid height with handles.',
      'Take a small step forward into split stance with slight torso forward lean.',
      'With soft bend in elbows, hug arms together in front of sternum.',
      'Squeeze chest hard for 1 second at peak contraction, then control back to stretch.',
    ],
    proTip: 'Imagine hugging a large barrel to keep constant tension across entire chest.',
  },
  'Dumbbell Lateral Raises': {
    name: 'Dumbbell Lateral Raises',
    targetMuscles: ['Lateral Deltoids (Side Delts)'],
    instructions: [
      'Stand with dumbbells at sides, slight forward hip hinge.',
      'Raise dumbbells out to sides leading with your elbows until parallel with floor.',
      'Pour water slightly at top (pinkies slightly higher than thumbs).',
      'Lower slowly over 2-3 seconds resisting gravity.',
    ],
    proTip: 'Avoid shrugging traps. Think of pushing weights away towards the walls.',
  },
  'Rope Tricep Pushdowns': {
    name: 'Rope Tricep Pushdowns',
    targetMuscles: ['Triceps Lateral Head', 'Triceps Long Head'],
    instructions: [
      'Attach rope to high pulley, grasp ends with neutral grip.',
      'Pin elbows tight against your ribs and lean torso forward 15 degrees.',
      'Push rope straight down and flare ends outward at bottom lockout.',
      'Control eccentric return back up to 90 degrees bend.',
    ],
    proTip: 'Spreading the rope at the bottom forces maximum peak contraction on lateral heads.',
  },
  'Push-ups to Failure': {
    name: 'Push-ups to Failure',
    targetMuscles: ['Chest', 'Anterior Delts', 'Triceps', 'Core'],
    instructions: [
      'Assume solid plank position on toes with hands under shoulders.',
      'Lower chest smoothly until touching or hovering 1 inch from floor.',
      'Press upward with crisp cadence until exhaustion.',
      'Do as many clean reps as possible until failure.',
    ],
    proTip: 'The ultimate bodyweight burnout set. Maintain rigid core until last rep.',
  },
};

/** Pre-defined Workout Splits categorized for professional training */
export const WORKOUT_SPLITS: SplitDefinition[] = [
  {
    id: 'fullbody-monarch-a',
    name: 'Mon: Full Body Protocol A',
    subtitle: 'Barbell back squats, bench press, barbell row, overhead press, and standing curls.',
    category: 'Weightlifting',
    focus: 'Squats, Bench, Row, OHP & Curls',
    targetTags: ['Squat', 'Chest', 'Back', 'Shoulders', 'Biceps'],
    durationMinutes: 45,
    exercises: [
      { name: 'Barbell Back Squats', defaultWeight: 80, defaultReps: 8, sets: 3 },
      { name: 'Barbell Bench Press', defaultWeight: 65, defaultReps: 8, sets: 3 },
      { name: 'Bent Over Barbell Row', defaultWeight: 60, defaultReps: 10, sets: 3 },
      { name: 'Overhead Press', defaultWeight: 40, defaultReps: 8, sets: 3 },
      { name: 'Standing Biceps Curls', defaultWeight: 25, defaultReps: 12, sets: 3 },
    ],
  },
  {
    id: 'fullbody-monarch-b',
    name: 'Wed: Full Body Protocol B',
    subtitle: 'Hip hinge, overhead vertical pressing, vertical pulling, biceps and triceps.',
    category: 'Weightlifting',
    focus: 'Hinge, Vertical Push/Pull',
    targetTags: ['Hamstrings', 'Shoulders', 'Lats', 'Arms'],
    durationMinutes: 45,
    exercises: [
      { name: 'Romanian Deadlift', defaultWeight: 70, defaultReps: 10, sets: 3 },
      { name: 'Overhead Shoulder Press', defaultWeight: 40, defaultReps: 10, sets: 3 },
      { name: 'Pull-ups / Chin-ups', defaultWeight: 0, defaultReps: 10, sets: 3 },
      { name: 'Incline Dumbbell Curl', defaultWeight: 14, defaultReps: 12, sets: 3 },
      { name: 'Rope Tricep Pushdowns', defaultWeight: 25, defaultReps: 12, sets: 3 },
    ],
  },
  {
    id: 'fullbody-monarch-c',
    name: 'Fri: Full Body Protocol C',
    subtitle: 'Leg press quad focus, incline chest, fly stretch, hamstring curls and pushups.',
    category: 'Weightlifting',
    focus: 'Lunge/Leg Press, Arms & Calisthenics',
    targetTags: ['Quads', 'Chest', 'Hamstrings', 'Burnout'],
    durationMinutes: 45,
    exercises: [
      { name: 'Leg Press', defaultWeight: 140, defaultReps: 12, sets: 3 },
      { name: 'Incline Dumbbell Press', defaultWeight: 24, defaultReps: 10, sets: 3 },
      { name: 'Cable Chest Fly', defaultWeight: 16, defaultReps: 12, sets: 3 },
      { name: 'Lying Leg Curl', defaultWeight: 45, defaultReps: 12, sets: 3 },
      { name: 'Push-ups to Failure', defaultWeight: 0, defaultReps: 15, sets: 3 },
    ],
  },
  {
    id: 'ppl-push-a',
    name: 'Push Day A',
    subtitle: 'Chest heavy compound pressing, delts, and triceps overload.',
    category: 'Weightlifting',
    focus: 'Flat Press, Delts, Triceps',
    targetTags: ['Chest', 'Shoulders', 'Triceps'],
    durationMinutes: 50,
    exercises: [
      { name: 'Barbell Bench Press', defaultWeight: 65, defaultReps: 8, sets: 3 },
      { name: 'Overhead Press', defaultWeight: 40, defaultReps: 8, sets: 3 },
      { name: 'Incline Dumbbell Press', defaultWeight: 24, defaultReps: 10, sets: 3 },
      { name: 'Dumbbell Lateral Raises', defaultWeight: 10, defaultReps: 15, sets: 3 },
      { name: 'Rope Tricep Pushdowns', defaultWeight: 25, defaultReps: 12, sets: 3 },
    ],
  },
  {
    id: 'ppl-pull-a',
    name: 'Pull Day A',
    subtitle: 'Posterior chain density, vertical pulling, and biceps hypertrophy.',
    category: 'Weightlifting',
    focus: 'Deadlift, Width & Biceps',
    targetTags: ['Back', 'Lats', 'Biceps'],
    durationMinutes: 50,
    exercises: [
      { name: 'Barbell Deadlift', defaultWeight: 100, defaultReps: 6, sets: 3 },
      { name: 'Lat Pulldown', defaultWeight: 55, defaultReps: 10, sets: 3 },
      { name: 'Bent Over Barbell Row', defaultWeight: 60, defaultReps: 10, sets: 3 },
      { name: 'Face Pulls', defaultWeight: 20, defaultReps: 15, sets: 3 },
      { name: 'Incline Dumbbell Curl', defaultWeight: 14, defaultReps: 12, sets: 3 },
    ],
  },
  {
    id: 'ppl-legs-a',
    name: 'Legs Day A',
    subtitle: 'Quad sweep focus, knee flexion, and calf development.',
    category: 'Weightlifting',
    focus: 'Squat & Quad Dominant',
    targetTags: ['Quads', 'Hamstrings', 'Calves'],
    durationMinutes: 50,
    exercises: [
      { name: 'Barbell Back Squats', defaultWeight: 80, defaultReps: 8, sets: 3 },
      { name: 'Leg Press', defaultWeight: 140, defaultReps: 12, sets: 3 },
      { name: 'Lying Leg Curl', defaultWeight: 45, defaultReps: 12, sets: 3 },
      { name: 'Standing Calf Raise', defaultWeight: 45, defaultReps: 15, sets: 3 },
      { name: 'Dips', defaultWeight: 0, defaultReps: 12, sets: 3 },
    ],
  },
  {
    id: 'ppl-push-b',
    name: 'Push Day B',
    subtitle: 'Incline clavicular pressing, medial delt isolation, and tricep extension.',
    category: 'Weightlifting',
    focus: 'Incline Press & Chest Isolation',
    targetTags: ['Chest', 'Shoulders', 'Triceps'],
    durationMinutes: 50,
    exercises: [
      { name: 'Incline Dumbbell Press', defaultWeight: 24, defaultReps: 10, sets: 3 },
      { name: 'Barbell Bench Press', defaultWeight: 65, defaultReps: 8, sets: 3 },
      { name: 'Cable Chest Fly', defaultWeight: 16, defaultReps: 12, sets: 3 },
      { name: 'Overhead Press', defaultWeight: 40, defaultReps: 8, sets: 3 },
      { name: 'Push-ups to Failure', defaultWeight: 0, defaultReps: 15, sets: 3 },
    ],
  },
  {
    id: 'ppl-pull-b',
    name: 'Pull Day B',
    subtitle: 'Upper back thickness, horizontal rowing, and arm peak development.',
    category: 'Weightlifting',
    focus: 'Back Thickness & Arm Hypertrophy',
    targetTags: ['Back', 'Biceps', 'Rear Delts'],
    durationMinutes: 50,
    exercises: [
      { name: 'Pull-ups / Chin-ups', defaultWeight: 0, defaultReps: 10, sets: 3 },
      { name: 'Bent Over Barbell Row', defaultWeight: 60, defaultReps: 10, sets: 3 },
      { name: 'Lat Pulldown', defaultWeight: 55, defaultReps: 10, sets: 3 },
      { name: 'Standing Biceps Curls', defaultWeight: 25, defaultReps: 12, sets: 3 },
      { name: 'Dumbbell Lateral Raises', defaultWeight: 10, defaultReps: 15, sets: 3 },
    ],
  },
  {
    id: 'ppl-legs-b',
    name: 'Legs Day B',
    subtitle: 'Posterior chain emphasis, hip hinge, glute drive, and calf burnout.',
    category: 'Weightlifting',
    focus: 'Posterior Chain & Calves',
    targetTags: ['Hamstrings', 'Glutes', 'Calves'],
    durationMinutes: 50,
    exercises: [
      { name: 'Romanian Deadlift', defaultWeight: 70, defaultReps: 10, sets: 3 },
      { name: 'Barbell Back Squats', defaultWeight: 80, defaultReps: 8, sets: 3 },
      { name: 'Lying Leg Curl', defaultWeight: 45, defaultReps: 12, sets: 3 },
      { name: 'Leg Press', defaultWeight: 140, defaultReps: 12, sets: 3 },
      { name: 'Standing Calf Raise', defaultWeight: 45, defaultReps: 15, sets: 3 },
    ],
  },
  {
    id: 'ppl-arnold-push',
    name: 'Day 4: Push (PPL Split)',
    subtitle: 'Chest, front/side delts, and triceps hypertrophy overload.',
    category: 'Weightlifting',
    focus: 'Chest, Front/Side Delts, Triceps',
    targetTags: ['Chest', 'Shoulders', 'Triceps'],
    durationMinutes: 50,
    exercises: [
      { name: 'Incline Dumbbell Press', defaultWeight: 24, defaultReps: 10, sets: 3 },
      { name: 'Barbell Bench Press', defaultWeight: 65, defaultReps: 8, sets: 3 },
      { name: 'Cable Chest Fly', defaultWeight: 16, defaultReps: 12, sets: 3 },
      { name: 'Overhead Press', defaultWeight: 40, defaultReps: 8, sets: 3 },
      { name: 'Push-ups to Failure', defaultWeight: 0, defaultReps: 15, sets: 3 },
    ],
  },
  {
    id: 'ppl-arnold-pull',
    name: 'Day 5: Pull (PPL Split)',
    subtitle: 'Back, lats & biceps hypertrophy overload.',
    category: 'Weightlifting',
    focus: 'Back, Lats & Biceps Hypertrophy',
    targetTags: ['Back', 'Lats', 'Biceps'],
    durationMinutes: 50,
    exercises: [
      { name: 'Pull-ups / Chin-ups', defaultWeight: 0, defaultReps: 10, sets: 3 },
      { name: 'Lat Pulldown', defaultWeight: 55, defaultReps: 10, sets: 3 },
      { name: 'Bent Over Barbell Row', defaultWeight: 60, defaultReps: 10, sets: 3 },
      { name: 'Face Pulls', defaultWeight: 20, defaultReps: 15, sets: 3 },
      { name: 'Standing Biceps Curls', defaultWeight: 25, defaultReps: 12, sets: 3 },
    ],
  },
  {
    id: 'ppl-arnold-legs',
    name: 'Day 6: Legs (PPL Split)',
    subtitle: 'Posterior chain, glutes and calves overload.',
    category: 'Weightlifting',
    focus: 'Posterior Chain, Glutes & Calves',
    targetTags: ['Hamstrings', 'Glutes', 'Calves'],
    durationMinutes: 50,
    exercises: [
      { name: 'Barbell Back Squats', defaultWeight: 80, defaultReps: 8, sets: 3 },
      { name: 'Romanian Deadlift', defaultWeight: 70, defaultReps: 10, sets: 3 },
      { name: 'Leg Press', defaultWeight: 140, defaultReps: 12, sets: 3 },
      { name: 'Lying Leg Curl', defaultWeight: 45, defaultReps: 12, sets: 3 },
      { name: 'Standing Calf Raise', defaultWeight: 45, defaultReps: 15, sets: 3 },
    ],
  },
  {
    id: 'bro-chest',
    name: 'Mon: Chest Annihilation',
    subtitle: 'Total pectoral annihilation and high volume chest overload.',
    category: 'Weightlifting',
    focus: 'Upper/Mid/Lower Chest Isolation',
    targetTags: ['Chest', 'Triceps'],
    durationMinutes: 50,
    exercises: [
      { name: 'Barbell Bench Press', defaultWeight: 65, defaultReps: 8, sets: 3 },
      { name: 'Incline Dumbbell Press', defaultWeight: 24, defaultReps: 10, sets: 3 },
      { name: 'Cable Chest Fly', defaultWeight: 16, defaultReps: 12, sets: 3 },
      { name: 'Dips', defaultWeight: 0, defaultReps: 12, sets: 3 },
      { name: 'Push-ups to Failure', defaultWeight: 0, defaultReps: 15, sets: 3 },
    ],
  },
  {
    id: 'bro-back',
    name: 'Tue: Heavy Back & Lats',
    subtitle: 'Spinal erector thickness and extreme lat flare.',
    category: 'Weightlifting',
    focus: 'Lat Width & Spinal Erectors',
    targetTags: ['Back', 'Lats'],
    durationMinutes: 50,
    exercises: [
      { name: 'Barbell Deadlift', defaultWeight: 100, defaultReps: 6, sets: 3 },
      { name: 'Bent Over Barbell Row', defaultWeight: 60, defaultReps: 10, sets: 3 },
      { name: 'Lat Pulldown', defaultWeight: 55, defaultReps: 10, sets: 3 },
      { name: 'Pull-ups / Chin-ups', defaultWeight: 0, defaultReps: 10, sets: 3 },
      { name: 'Face Pulls', defaultWeight: 20, defaultReps: 15, sets: 3 },
    ],
  },
  {
    id: 'bro-shoulders',
    name: 'Wed: 3D Shoulders & Traps',
    subtitle: 'Complete 3-dimensional deltoid and upper trap hypertrophy.',
    category: 'Weightlifting',
    focus: 'Front, Lateral & Rear Deltoids',
    targetTags: ['Shoulders', 'Traps'],
    durationMinutes: 45,
    exercises: [
      { name: 'Overhead Press', defaultWeight: 40, defaultReps: 8, sets: 3 },
      { name: 'Dumbbell Lateral Raises', defaultWeight: 10, defaultReps: 15, sets: 3 },
      { name: 'Face Pulls', defaultWeight: 20, defaultReps: 15, sets: 3 },
      { name: 'Standing Calf Raise', defaultWeight: 45, defaultReps: 15, sets: 3 },
      { name: 'Push-ups', defaultWeight: 0, defaultReps: 15, sets: 3 },
    ],
  },
  {
    id: 'bro-legs',
    name: 'Thu: Massive Legs',
    subtitle: 'Heavy squats, leg press volume, and hamstring devastation.',
    category: 'Weightlifting',
    focus: 'Quads, Hamstrings & Calves',
    targetTags: ['Quads', 'Hamstrings', 'Calves'],
    durationMinutes: 55,
    exercises: [
      { name: 'Barbell Back Squats', defaultWeight: 80, defaultReps: 8, sets: 3 },
      { name: 'Romanian Deadlift', defaultWeight: 70, defaultReps: 10, sets: 3 },
      { name: 'Leg Press', defaultWeight: 140, defaultReps: 12, sets: 3 },
      { name: 'Lying Leg Curl', defaultWeight: 45, defaultReps: 12, sets: 3 },
      { name: 'Standing Calf Raise', defaultWeight: 45, defaultReps: 15, sets: 3 },
    ],
  },
  {
    id: 'bro-arms',
    name: 'Fri: Gun Show (Arms)',
    subtitle: 'Direct bicep peak contraction and tricep horseshoe overload.',
    category: 'Weightlifting',
    focus: 'Biceps, Triceps & Forearms',
    targetTags: ['Biceps', 'Triceps', 'Arms'],
    durationMinutes: 45,
    exercises: [
      { name: 'Standing Biceps Curls', defaultWeight: 25, defaultReps: 12, sets: 3 },
      { name: 'Rope Tricep Pushdowns', defaultWeight: 25, defaultReps: 12, sets: 3 },
      { name: 'Incline Dumbbell Curl', defaultWeight: 14, defaultReps: 12, sets: 3 },
      { name: 'Dips', defaultWeight: 0, defaultReps: 12, sets: 3 },
      { name: 'Push-ups to Failure', defaultWeight: 0, defaultReps: 15, sets: 3 },
    ],
  },
  {
    id: 'ul-upper-power',
    name: 'Upper Power',
    subtitle: 'Heavy compound pushing and pulling power.',
    category: 'Weightlifting',
    focus: 'Heavy Upper Body Horizontal & Vertical Power',
    targetTags: ['Chest', 'Back', 'Shoulders'],
    durationMinutes: 50,
    exercises: [
      { name: 'Barbell Bench Press', defaultWeight: 65, defaultReps: 8, sets: 3 },
      { name: 'Bent Over Barbell Row', defaultWeight: 60, defaultReps: 10, sets: 3 },
      { name: 'Overhead Press', defaultWeight: 40, defaultReps: 8, sets: 3 },
      { name: 'Pull-ups / Chin-ups', defaultWeight: 0, defaultReps: 10, sets: 3 },
      { name: 'Standing Biceps Curls', defaultWeight: 25, defaultReps: 12, sets: 3 },
    ],
  },
  {
    id: 'ul-lower-power',
    name: 'Lower Power',
    subtitle: 'Heavy squat and hinge foundation.',
    category: 'Weightlifting',
    focus: 'Heavy Lower Body Squat & Hinge Power',
    targetTags: ['Quads', 'Hamstrings', 'Glutes'],
    durationMinutes: 50,
    exercises: [
      { name: 'Barbell Back Squats', defaultWeight: 80, defaultReps: 8, sets: 3 },
      { name: 'Romanian Deadlift', defaultWeight: 70, defaultReps: 10, sets: 3 },
      { name: 'Leg Press', defaultWeight: 140, defaultReps: 12, sets: 3 },
      { name: 'Lying Leg Curl', defaultWeight: 45, defaultReps: 12, sets: 3 },
      { name: 'Standing Calf Raise', defaultWeight: 45, defaultReps: 15, sets: 3 },
    ],
  },
  {
    id: 'ul-upper-hyper',
    name: 'Upper Hypertrophy',
    subtitle: 'Volume hypertrophy pump for upper musculature.',
    category: 'Weightlifting',
    focus: 'Upper Body Volume & Hypertrophy Pump',
    targetTags: ['Chest', 'Lats', 'Delts', 'Arms'],
    durationMinutes: 50,
    exercises: [
      { name: 'Incline Dumbbell Press', defaultWeight: 24, defaultReps: 10, sets: 3 },
      { name: 'Lat Pulldown', defaultWeight: 55, defaultReps: 10, sets: 3 },
      { name: 'Cable Chest Fly', defaultWeight: 16, defaultReps: 12, sets: 3 },
      { name: 'Dumbbell Lateral Raises', defaultWeight: 10, defaultReps: 15, sets: 3 },
      { name: 'Rope Tricep Pushdowns', defaultWeight: 25, defaultReps: 12, sets: 3 },
    ],
  },
  {
    id: 'ul-lower-hyper',
    name: 'Lower Hypertrophy',
    subtitle: 'High repetition quad and hamstring hypertrophy burn.',
    category: 'Weightlifting',
    focus: 'Lower Body Volume, Quads & Hamstrings',
    targetTags: ['Quads', 'Hamstrings', 'Calves'],
    durationMinutes: 50,
    exercises: [
      { name: 'Leg Press', defaultWeight: 140, defaultReps: 12, sets: 3 },
      { name: 'Lying Leg Curl', defaultWeight: 45, defaultReps: 12, sets: 3 },
      { name: 'Barbell Back Squats', defaultWeight: 80, defaultReps: 8, sets: 3 },
      { name: 'Standing Calf Raise', defaultWeight: 45, defaultReps: 15, sets: 3 },
      { name: 'Push-ups to Failure', defaultWeight: 0, defaultReps: 15, sets: 3 },
    ],
  },
  {
    id: 'shadow-upper',
    name: 'Mon: Upper Bodyweight Protocol',
    subtitle: 'Relative strength, gymnastic control, and calisthenic power.',
    category: 'Bodyweight',
    focus: 'Upper Body Calisthenics & Relative Strength',
    targetTags: ['Chest', 'Back', 'Core', 'Arms'],
    durationMinutes: 40,
    exercises: [
      { name: 'Push-ups', defaultWeight: 0, defaultReps: 20, sets: 3 },
      { name: 'Pull-ups / Chin-ups', defaultWeight: 0, defaultReps: 10, sets: 3 },
      { name: 'Dips', defaultWeight: 0, defaultReps: 12, sets: 3 },
      { name: 'Push-ups to Failure', defaultWeight: 0, defaultReps: 15, sets: 3 },
      { name: 'Standing Biceps Curls', defaultWeight: 25, defaultReps: 12, sets: 3 },
    ],
  },
  {
    id: 'shadow-lower',
    name: 'Wed: Lower & Core Calisthenics',
    subtitle: 'Athletic explosiveness, bodyweight legs, and core stability.',
    category: 'Bodyweight',
    focus: 'Athletic Explosiveness, Legs & Core',
    targetTags: ['Legs', 'Core', 'Endurance'],
    durationMinutes: 40,
    exercises: [
      { name: 'Barbell Back Squats', defaultWeight: 80, defaultReps: 8, sets: 3 },
      { name: 'Romanian Deadlift', defaultWeight: 70, defaultReps: 10, sets: 3 },
      { name: 'Standing Calf Raise', defaultWeight: 45, defaultReps: 15, sets: 3 },
      { name: 'Lying Leg Curl', defaultWeight: 45, defaultReps: 12, sets: 3 },
      { name: 'Leg Press', defaultWeight: 140, defaultReps: 12, sets: 3 },
    ],
  },
  {
    id: 'shadow-burnout',
    name: 'Fri: High-Rep Assassin Burnout',
    subtitle: 'High repetition metabolic conditioning and calisthenic burnout.',
    category: 'Bodyweight',
    focus: 'High-Rep Calisthenics Endurance Burnout',
    targetTags: ['Chest', 'Arms', 'Burnout'],
    durationMinutes: 40,
    exercises: [
      { name: 'Push-ups to Failure', defaultWeight: 0, defaultReps: 25, sets: 3 },
      { name: 'Pull-ups / Chin-ups', defaultWeight: 0, defaultReps: 10, sets: 3 },
      { name: 'Dips', defaultWeight: 0, defaultReps: 15, sets: 3 },
      { name: 'Push-ups', defaultWeight: 0, defaultReps: 20, sets: 3 },
      { name: 'Standing Calf Raise', defaultWeight: 45, defaultReps: 20, sets: 3 },
    ],
  },
  {
    id: 'ppl-push',
    name: 'Day 4: Push (PPL Split)',
    subtitle: 'Chest, front/side delts, and triceps hypertrophy overload.',
    category: 'Weightlifting',
    focus: 'Chest, Front/Side Delts, Triceps',
    targetTags: ['Chest', 'Shoulders', 'Triceps'],
    durationMinutes: 55,
    exercises: [
      { name: 'Incline Dumbbell Press', defaultWeight: 24, defaultReps: 10, sets: 3 },
      { name: 'Flat Dumbbell Chest Press', defaultWeight: 26, defaultReps: 10, sets: 3 },
      { name: 'Cable Chest Fly', defaultWeight: 16, defaultReps: 12, sets: 3 },
      { name: 'Dumbbell Lateral Raises', defaultWeight: 10, defaultReps: 15, sets: 3 },
      { name: 'Rope Tricep Pushdowns', defaultWeight: 25, defaultReps: 12, sets: 3 },
      { name: 'Push-ups to Failure', defaultWeight: 0, defaultReps: 15, sets: 3 },
    ],
  },
  {
    id: 'arnold-chest-back',
    name: 'Day 1: Chest & Back (Arnold)',
    subtitle: 'Classic antagonist chest and back superset density.',
    category: 'Weightlifting',
    focus: 'Pectorals, Lats & Upper Back',
    targetTags: ['Chest', 'Back', 'Lats'],
    durationMinutes: 60,
    exercises: [
      { name: 'Barbell Flat Bench Press', defaultWeight: 60, defaultReps: 10, sets: 3 },
      { name: 'Flat Dumbbell Chest Press', defaultWeight: 26, defaultReps: 10, sets: 3 },
      { name: 'Lat Pulldown', defaultWeight: 55, defaultReps: 10, sets: 3 },
      { name: 'Cable Chest Fly', defaultWeight: 16, defaultReps: 12, sets: 3 },
      { name: 'Incline Dumbbell Press', defaultWeight: 24, defaultReps: 10, sets: 3 },
      { name: 'Push-ups to Failure', defaultWeight: 0, defaultReps: 15, sets: 3 },
    ],
  },
  {
    id: 'arnold-shoulders-arms',
    name: 'Day 2: Shoulders & Arms (Arnold)',
    subtitle: 'Complete shoulder capping, bicep peak, and tricep horseshoe isolation.',
    category: 'Weightlifting',
    focus: 'Shoulders, Biceps & Triceps',
    targetTags: ['Shoulders', 'Biceps', 'Triceps'],
    durationMinutes: 50,
    exercises: [
      { name: 'Overhead Shoulder Press', defaultWeight: 40, defaultReps: 10, sets: 3 },
      { name: 'Dumbbell Lateral Raises', defaultWeight: 10, defaultReps: 15, sets: 3 },
      { name: 'Incline Dumbbell Curl', defaultWeight: 14, defaultReps: 12, sets: 3 },
      { name: 'Rope Tricep Pushdowns', defaultWeight: 25, defaultReps: 12, sets: 3 },
      { name: 'Face Pulls', defaultWeight: 20, defaultReps: 15, sets: 3 },
      { name: 'Dips', defaultWeight: 0, defaultReps: 12, sets: 3 },
    ],
  },
  {
    id: 'arnold-legs',
    name: 'Day 3: Legs (Arnold)',
    subtitle: 'High-volume quad sweep and posterior chain devastation.',
    category: 'Weightlifting',
    focus: 'Quads, Hamstrings & Calves',
    targetTags: ['Quadriceps', 'Hamstrings', 'Calves'],
    durationMinutes: 55,
    exercises: [
      { name: 'Barbell Back Squat', defaultWeight: 80, defaultReps: 8, sets: 3 },
      { name: 'Romanian Deadlift', defaultWeight: 70, defaultReps: 10, sets: 3 },
      { name: 'Leg Press', defaultWeight: 140, defaultReps: 12, sets: 3 },
      { name: 'Lying Leg Curl', defaultWeight: 45, defaultReps: 12, sets: 3 },
      { name: 'Standing Calf Raise', defaultWeight: 45, defaultReps: 15, sets: 3 },
      { name: 'Smith Machine Squat', defaultWeight: 75, defaultReps: 10, sets: 3 },
    ],
  },
  {
    id: 'ppl-pull',
    name: 'Day 5: Pull (PPL Split)',
    subtitle: 'Posterior chain density, lat width, and elbow flexion overload.',
    category: 'Weightlifting',
    focus: 'Back, Lats & Biceps',
    targetTags: ['Back', 'Lats', 'Biceps'],
    durationMinutes: 50,
    exercises: [
      { name: 'Barbell Deadlift', defaultWeight: 100, defaultReps: 6, sets: 3 },
      { name: 'Pull-ups / Chin-ups', defaultWeight: 0, defaultReps: 10, sets: 3 },
      { name: 'Lat Pulldown', defaultWeight: 55, defaultReps: 10, sets: 3 },
      { name: 'Face Pulls', defaultWeight: 20, defaultReps: 15, sets: 3 },
      { name: 'Incline Dumbbell Curl', defaultWeight: 14, defaultReps: 12, sets: 3 },
      { name: 'Push-ups to Failure', defaultWeight: 0, defaultReps: 15, sets: 3 },
    ],
  },
  {
    id: 'ppl-legs',
    name: 'Day 6: Legs (PPL Split)',
    subtitle: 'Deep knee flexion, hip extension, and athletic calf conditioning.',
    category: 'Weightlifting',
    focus: 'Hamstrings, Quads & Glutes',
    targetTags: ['Hamstrings', 'Quads', 'Glutes'],
    durationMinutes: 50,
    exercises: [
      { name: 'Barbell Back Squat', defaultWeight: 80, defaultReps: 8, sets: 3 },
      { name: 'Romanian Deadlift', defaultWeight: 70, defaultReps: 10, sets: 3 },
      { name: 'Leg Press', defaultWeight: 140, defaultReps: 12, sets: 3 },
      { name: 'Lying Leg Curl', defaultWeight: 45, defaultReps: 12, sets: 3 },
      { name: 'Standing Calf Raise', defaultWeight: 45, defaultReps: 15, sets: 3 },
      { name: 'Dips', defaultWeight: 0, defaultReps: 12, sets: 3 },
    ],
  },
  {
    id: 'lower-a',
    name: 'Lower Body',
    subtitle: 'Scheduled for today: Leg day. Your hamstrings & quads are ready to work.',
    category: 'Weightlifting',
    focus: 'Hamstrings, Quads, Glutes & Calves Focus',
    targetTags: ['Hamstrings', 'Quads', 'Glutes', 'Calves'],
    durationMinutes: 45,
    exercises: [
      { name: 'Lying Leg Curl', defaultWeight: 45, defaultReps: 12, sets: 4 },
      { name: 'Smith Machine Squat', defaultWeight: 75, defaultReps: 10, sets: 4 },
      { name: 'Romanian Deadlift', defaultWeight: 70, defaultReps: 10, sets: 3 },
      { name: 'Leg Press', defaultWeight: 140, defaultReps: 12, sets: 3 },
      { name: 'Standing Calf Raise', defaultWeight: 45, defaultReps: 15, sets: 4 },
    ],
  },
  {
    id: 'push-a',
    name: 'Push (Chest & Delts)',
    subtitle: 'Upper body pushing power, focusing on clavicular chest and lateral delts.',
    category: 'Weightlifting',
    focus: 'Pectorals, Deltoids & Triceps Strength',
    targetTags: ['Chest', 'Shoulders', 'Triceps'],
    durationMinutes: 50,
    exercises: [
      { name: 'Barbell Flat Bench Press', defaultWeight: 60, defaultReps: 8, sets: 4 },
      { name: 'Incline Dumbbell Press', defaultWeight: 24, defaultReps: 10, sets: 3 },
      { name: 'Overhead Shoulder Press', defaultWeight: 40, defaultReps: 10, sets: 3 },
      { name: 'Triceps Pushdown', defaultWeight: 25, defaultReps: 12, sets: 3 },
    ],
  },
  {
    id: 'pull-a',
    name: 'Pull (Back & Biceps)',
    subtitle: 'Complete posterior chain development, vertical pulling and arm overload.',
    category: 'Weightlifting',
    focus: 'Back Thickness, Width & Biceps Hypertrophy',
    targetTags: ['Back', 'Lats', 'Biceps', 'Rear Delts'],
    durationMinutes: 48,
    exercises: [
      { name: 'Barbell Deadlift', defaultWeight: 100, defaultReps: 6, sets: 3 },
      { name: 'Lat Pulldown', defaultWeight: 55, defaultReps: 10, sets: 4 },
      { name: 'Incline Dumbbell Curl', defaultWeight: 14, defaultReps: 12, sets: 3 },
      { name: 'Face Pulls', defaultWeight: 20, defaultReps: 15, sets: 3 },
    ],
  },
  {
    id: 'bodyweight-full',
    name: 'Bodyweight Calisthenics',
    subtitle: 'High-density calisthenics session for relative strength and conditioning.',
    category: 'Bodyweight',
    focus: 'Bodyweight Strength & Gymnastic Control',
    targetTags: ['Chest', 'Back', 'Core', 'Endurance'],
    durationMinutes: 35,
    exercises: [
      { name: 'Pull-ups / Chin-ups', defaultWeight: 0, defaultReps: 10, sets: 4 },
      { name: 'Dips', defaultWeight: 0, defaultReps: 12, sets: 4 },
      { name: 'Push-ups', defaultWeight: 0, defaultReps: 20, sets: 4 },
    ],
  },
];

/** Get or seed exercise sets for a given split on a specific date */
export async function getSplitSets(
  splitId: string,
  dateStr = getTodayDateString()
): Promise<ExerciseSet[]> {
  const db = await getDb();
  let rows = await db.getAllAsync<{
    id: string;
    split_id: string;
    exercise_name: string;
    set_number: number;
    weight_kg: number;
    reps: number;
    completed: number;
    date: string;
  }>('SELECT * FROM exercise_logs WHERE split_id = ? AND date = ? ORDER BY id ASC', splitId, dateStr);

  const split = WORKOUT_SPLITS.find((s) => s.id === splitId) ?? WORKOUT_SPLITS[0];

  if (rows.length > 0) {
    const targetNames = new Set(split.exercises.map((e) => e.name));
    const hasObsolete = rows.some((r) => !targetNames.has(r.exercise_name));

    if (hasObsolete) {
      await db.runAsync('DELETE FROM exercise_logs WHERE split_id = ? AND date = ?', splitId, dateStr);
      rows = [];
    } else {
      // Check if any exercises from split are missing (e.g. from an older schema)
      const existingNames = new Set(rows.map((r) => r.exercise_name));
      const missing = split.exercises.filter((ex) => !existingNames.has(ex.name));

      if (missing.length > 0) {
        for (const ex of missing) {
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
            rows.push({
              ...setItem,
              completed: 0,
            });
          }
        }
      }

      return rows.map((r) => ({
        ...r,
        completed: r.completed === 1,
      }));
    }
  }

  // Seed default sets from split definition
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
    await addHunterExp(10);
  }

  // Check if all sets for this split on this date are completed
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
      await addHunterExp(100);
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

/** Add a new set to an exercise */
export async function addExerciseSet(
  splitId: string,
  exerciseName: string,
  weightKg: number,
  reps: number,
  dateStr = getTodayDateString()
): Promise<ExerciseSet> {
  const db = await getDb();
  const existing = await db.getAllAsync<{ set_number: number }>(
    'SELECT set_number FROM exercise_logs WHERE split_id = ? AND exercise_name = ? AND date = ? ORDER BY set_number DESC LIMIT 1',
    splitId,
    exerciseName,
    dateStr
  );
  const nextSetNumber = existing.length > 0 ? existing[0].set_number + 1 : 1;

  const newSet: ExerciseSet = {
    id: newId(),
    split_id: splitId,
    exercise_name: exerciseName,
    set_number: nextSetNumber,
    weight_kg: weightKg,
    reps,
    completed: false,
    date: dateStr,
  };

  await db.runAsync(
    `INSERT INTO exercise_logs (id, split_id, exercise_name, set_number, weight_kg, reps, completed, date)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    newSet.id,
    newSet.split_id,
    newSet.exercise_name,
    newSet.set_number,
    newSet.weight_kg,
    newSet.reps,
    0,
    newSet.date
  );

  return newSet;
}

/** Get past workout session history for calendar and timeline */
export async function getWorkoutHistory(limit = 10): Promise<WorkoutHistoryEntry[]> {
  const db = await getDb();
  const rows = await db.getAllAsync<{
    split_id: string;
    date: string;
    completed_sets: number;
    total_sets: number;
    total_volume: number;
  }>(`
    SELECT 
      split_id,
      date,
      SUM(CASE WHEN completed = 1 THEN 1 ELSE 0 END) as completed_sets,
      COUNT(*) as total_sets,
      SUM(CASE WHEN completed = 1 THEN weight_kg * reps ELSE 0 END) as total_volume
    FROM exercise_logs
    GROUP BY split_id, date
    ORDER BY date DESC
    LIMIT ?
  `, limit);

  return rows.map((r, i) => {
    const split = WORKOUT_SPLITS.find((s) => s.id === r.split_id);
    return {
      id: `${r.split_id}-${r.date}-${i}`,
      splitId: r.split_id,
      title: split ? split.name : 'Custom Routine',
      date: r.date,
      completedSets: r.completed_sets,
      totalSets: r.total_sets,
      totalVolumeKg: Math.round(r.total_volume || 0),
      durationMinutes: split ? split.durationMinutes : 45,
    };
  });
}
