export interface ProgramDay {
  id: string;
  dayBadge: string;
  shortTab: string;
  name: string;
  focus: string;
}

export interface WorkoutProgram {
  id: string;
  tag: string;
  title: string;
  description: string;
  days: ProgramDay[];
}

export const WORKOUT_PROGRAMS: WorkoutProgram[] = [
  {
    id: 'ppl-6day',
    tag: '6-DAY SPLIT • HYPERTROPHY',
    title: 'Push, Pull, Legs (PPL) Split',
    description: 'Structured progression split optimized for muscle overload and peak recovery.',
    days: [
      {
        id: 'ppl-push-a',
        dayBadge: 'PUSH DAY A',
        shortTab: 'Push Day A',
        name: 'Push Day A',
        focus: 'Flat Press, Delts, Triceps',
      },
      {
        id: 'ppl-pull-a',
        dayBadge: 'PULL DAY A',
        shortTab: 'Pull Day A',
        name: 'Pull Day A',
        focus: 'Deadlift, Width & Biceps',
      },
      {
        id: 'ppl-legs-a',
        dayBadge: 'LEGS DAY A',
        shortTab: 'Legs Day A',
        name: 'Legs Day A',
        focus: 'Squat & Quad Dominant',
      },
      {
        id: 'ppl-push-b',
        dayBadge: 'PUSH DAY B',
        shortTab: 'Push Day B',
        name: 'Push Day B',
        focus: 'Incline Press & Chest Isolation',
      },
      {
        id: 'ppl-pull-b',
        dayBadge: 'PULL DAY B',
        shortTab: 'Pull Day B',
        name: 'Pull Day B',
        focus: 'Back Thickness & Arm Hypertrophy',
      },
      {
        id: 'ppl-legs-b',
        dayBadge: 'LEGS DAY B',
        shortTab: 'Legs Day B',
        name: 'Legs Day B',
        focus: 'Posterior Chain & Calves',
      },
    ],
  },
  {
    id: 'ppl-arnold',
    tag: '6-DAY SPLIT • HYPERTROPHY',
    title: 'PPL x Arnold Hybrid Split',
    description: 'Structured progression split optimized for muscle overload and peak recovery.',
    days: [
      {
        id: 'arnold-chest-back',
        dayBadge: 'DAY 1: CHEST & BACK (ARNOLD)',
        shortTab: 'Day 1: Chest & Back (Arnold)',
        name: 'Day 1: Chest & Back (Arnold)',
        focus: 'Chest & Back Thickness, Lat Overload',
      },
      {
        id: 'arnold-shoulders-arms',
        dayBadge: 'DAY 2: SHOULDERS & ARMS (ARNOLD)',
        shortTab: 'Day 2: Shoulders & Arms (Arnold)',
        name: 'Day 2: Shoulders & Arms (Arnold)',
        focus: 'Shoulders, Biceps & Triceps Isolation',
      },
      {
        id: 'arnold-legs',
        dayBadge: 'DAY 3: LEGS & ABS (ARNOLD)',
        shortTab: 'Day 3: Legs & Abs (Arnold)',
        name: 'Day 3: Legs & Abs (Arnold)',
        focus: 'Quads, Hamstrings & Calves Overload',
      },
      {
        id: 'ppl-arnold-push',
        dayBadge: 'DAY 4: PUSH (PPL SPLIT)',
        shortTab: 'Day 4: Push (PPL Split)',
        name: 'Day 4: Push (PPL Split)',
        focus: 'Chest, Front/Side Delts, Triceps',
      },
      {
        id: 'ppl-arnold-pull',
        dayBadge: 'DAY 5: PULL (PPL SPLIT)',
        shortTab: 'Day 5: Pull (PPL Split)',
        name: 'Day 5: Pull (PPL Split)',
        focus: 'Back, Lats & Biceps Hypertrophy',
      },
      {
        id: 'ppl-arnold-legs',
        dayBadge: 'DAY 6: LEGS (PPL SPLIT)',
        shortTab: 'Day 6: Legs (PPL Split)',
        name: 'Day 6: Legs (PPL Split)',
        focus: 'Posterior Chain, Glutes & Calves',
      },
    ],
  },
  {
    id: 'monarch-bro',
    tag: '5-DAY SPLIT • HYPERTROPHY',
    title: 'Monarch Bro Split (5-Day)',
    description: 'Structured progression split optimized for muscle overload and peak recovery.',
    days: [
      {
        id: 'bro-chest',
        dayBadge: 'MON: CHEST ANNIHILATION',
        shortTab: 'Mon: Chest Annihilation',
        name: 'Mon: Chest Annihilation',
        focus: 'Upper/Mid/Lower Chest Isolation',
      },
      {
        id: 'bro-back',
        dayBadge: 'TUE: HEAVY BACK & LATS',
        shortTab: 'Tue: Heavy Back & Lats',
        name: 'Tue: Heavy Back & Lats',
        focus: 'Lat Width & Spinal Erectors',
      },
      {
        id: 'bro-shoulders',
        dayBadge: 'WED: 3D SHOULDERS & TRAPS',
        shortTab: 'Wed: 3D Shoulders & Traps',
        name: 'Wed: 3D Shoulders & Traps',
        focus: 'Front, Lateral & Rear Deltoids',
      },
      {
        id: 'bro-legs',
        dayBadge: 'THU: MASSIVE LEGS',
        shortTab: 'Thu: Massive Legs',
        name: 'Thu: Massive Legs',
        focus: 'Quads, Hamstrings & Calves',
      },
      {
        id: 'bro-arms',
        dayBadge: 'FRI: GUN SHOW (ARMS)',
        shortTab: 'Fri: Gun Show (Arms)',
        name: 'Fri: Gun Show (Arms)',
        focus: 'Biceps, Triceps & Forearms',
      },
    ],
  },
  {
    id: 'upper-lower',
    tag: '4-DAY SPLIT • HYPERTROPHY',
    title: 'Upper / Lower Split (4-Day)',
    description: 'Structured progression split optimized for muscle overload and peak recovery.',
    days: [
      {
        id: 'ul-upper-power',
        dayBadge: 'UPPER POWER',
        shortTab: 'Upper Power',
        name: 'Upper Power',
        focus: 'Heavy Upper Body Horizontal & Vertical Power',
      },
      {
        id: 'ul-lower-power',
        dayBadge: 'LOWER POWER',
        shortTab: 'Lower Power',
        name: 'Lower Power',
        focus: 'Heavy Lower Body Squat & Hinge Power',
      },
      {
        id: 'ul-upper-hyper',
        dayBadge: 'UPPER HYPERTROPHY',
        shortTab: 'Upper Hypertrophy',
        name: 'Upper Hypertrophy',
        focus: 'Upper Body Volume & Hypertrophy Pump',
      },
      {
        id: 'ul-lower-hyper',
        dayBadge: 'LOWER HYPERTROPHY',
        shortTab: 'Lower Hypertrophy',
        name: 'Lower Hypertrophy',
        focus: 'Lower Body Volume, Quads & Hamstrings',
      },
    ],
  },
  {
    id: 'fullbody-monarch',
    tag: '3-DAY SPLIT • HYPERTROPHY',
    title: 'Full Body Monarch Split (3-Day)',
    description: 'Structured progression split optimized for muscle overload and peak recovery.',
    days: [
      {
        id: 'fullbody-monarch-a',
        dayBadge: 'MON: FULL BODY PROTOCOL A',
        shortTab: 'Mon: Protocol A',
        name: 'Mon: Full Body Protocol A',
        focus: 'Squats, Bench, Row, OHP & Curls',
      },
      {
        id: 'fullbody-monarch-b',
        dayBadge: 'WED: FULL BODY PROTOCOL B',
        shortTab: 'Wed: Protocol B',
        name: 'Wed: Full Body Protocol B',
        focus: 'Hinge, Vertical Push/Pull',
      },
      {
        id: 'fullbody-monarch-c',
        dayBadge: 'FRI: FULL BODY PROTOCOL C',
        shortTab: 'Fri: Protocol C',
        name: 'Fri: Full Body Protocol C',
        focus: 'Lunge/Leg Press, Arms & Calisthenics',
      },
    ],
  },
  {
    id: 'shadow-assassin',
    tag: '3-DAY SPLIT • HYPERTROPHY',
    title: 'Shadow Assassin Bodyweight (3-Day)',
    description: 'Structured progression split optimized for muscle overload and peak recovery.',
    days: [
      {
        id: 'shadow-upper',
        dayBadge: 'MON: UPPER BODYWEIGHT PROTOCOL',
        shortTab: 'Mon: Upper Bodyweight Protocol',
        name: 'Mon: Upper Bodyweight Protocol',
        focus: 'Upper Body Calisthenics & Relative Strength',
      },
      {
        id: 'shadow-lower',
        dayBadge: 'WED: LOWER & CORE CALISTHENICS',
        shortTab: 'Wed: Lower & Core Calisthenics',
        name: 'Wed: Lower & Core Calisthenics',
        focus: 'Athletic Explosiveness, Legs & Core',
      },
      {
        id: 'shadow-burnout',
        dayBadge: 'FRI: HIGH-REP ASSASSIN BURNOUT',
        shortTab: 'Fri: High-Rep Assassin Burnout',
        name: 'Fri: High-Rep Assassin Burnout',
        focus: 'High-Rep Calisthenics Endurance Burnout',
      },
    ],
  },
];

export function getProgramById(programId: string): WorkoutProgram {
  return (
    WORKOUT_PROGRAMS.find((p) => p.id === programId) ??
    WORKOUT_PROGRAMS[4] // Default Full Body Monarch Split
  );
}
