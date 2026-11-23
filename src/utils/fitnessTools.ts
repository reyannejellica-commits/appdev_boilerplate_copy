export interface OneRepMaxResult {
  oneRepMax: number;
  percentages: { percentage: number; weight: number; repsEstimate: number }[];
}

/**
 * Brzycki & Epley averaged 1RM calculation
 */
export function calculate1RM(weight: number, reps: number): OneRepMaxResult {
  if (weight <= 0 || reps <= 0) {
    return { oneRepMax: 0, percentages: [] };
  }
  if (reps === 1) {
    const epley = weight;
    return generatePercentages(epley);
  }

  // Epley: w * (1 + reps/30)
  const epley = weight * (1 + reps / 30);
  // Brzycki: w * (36 / (37 - reps))
  const brzycki = reps < 37 ? weight * (36 / (37 - reps)) : epley;

  const estimated1RM = Math.round(((epley + brzycki) / 2) * 2) / 2;
  return generatePercentages(estimated1RM);
}

function generatePercentages(oneRepMax: number): OneRepMaxResult {
  const pcts = [95, 90, 85, 80, 75, 70, 65, 60, 50];
  const repsMap: Record<number, number> = {
    95: 2,
    90: 4,
    85: 6,
    80: 8,
    75: 10,
    70: 12,
    65: 15,
    60: 20,
    50: 25,
  };

  const percentages = pcts.map((p) => ({
    percentage: p,
    weight: Math.round(((oneRepMax * p) / 100) * 2) / 2,
    repsEstimate: repsMap[p] ?? 1,
  }));

  return {
    oneRepMax: Math.round(oneRepMax * 2) / 2,
    percentages,
  };
}

/**
 * Standard Olympic Barbell Plate Calculator (KG & LBS)
 */
export interface PlateBreakdown {
  plate: number;
  countPerSide: number;
  totalPlates: number;
}

export interface PlateCalculationResult {
  targetWeight: number;
  barbellWeight: number;
  weightPerSide: number;
  plates: PlateBreakdown[];
  remainder: number;
}

export function calculatePlates(
  targetWeight: number,
  barbellWeight = 20,
  unit: 'kg' | 'lbs' = 'kg'
): PlateCalculationResult {
  const availablePlates = unit === 'kg' ? [25, 20, 15, 10, 5, 2.5, 1.25] : [45, 35, 25, 10, 5, 2.5];

  if (targetWeight <= barbellWeight) {
    return {
      targetWeight,
      barbellWeight,
      weightPerSide: 0,
      plates: [],
      remainder: 0,
    };
  }

  const totalPlateWeight = targetWeight - barbellWeight;
  let weightPerSide = totalPlateWeight / 2;
  const plates: PlateBreakdown[] = [];

  for (const plate of availablePlates) {
    if (weightPerSide >= plate) {
      const count = Math.floor(weightPerSide / plate);
      plates.push({
        plate,
        countPerSide: count,
        totalPlates: count * 2,
      });
      weightPerSide -= count * plate;
    }
  }

  return {
    targetWeight,
    barbellWeight,
    weightPerSide: (targetWeight - barbellWeight) / 2,
    plates,
    remainder: Math.round(weightPerSide * 100) / 100,
  };
}

/**
 * RPE / RIR (Reps In Reserve) to Target Weight & e1RM Calculator
 */
export interface RpeRow {
  rpe: number;
  rir: number;
  intensityPct: number;
}

// Mike Tuchscherer RPE Chart lookup for 1-10 reps at RPE 6.5 - 10
export const RPE_PERCENTAGES: Record<number, Record<number, number>> = {
  // reps: { RPE: percentageOf1RM }
  1: { 10: 100, 9.5: 97.8, 9: 95.5, 8.5: 93.9, 8: 92.2, 7.5: 90.7, 7: 89.2, 6.5: 87.8 },
  2: { 10: 95.5, 9.5: 93.9, 9: 92.2, 8.5: 90.7, 8: 89.2, 7.5: 87.8, 7: 86.3, 6.5: 84.9 },
  3: { 10: 92.2, 9.5: 90.7, 9: 89.2, 8.5: 87.8, 8: 86.3, 7.5: 84.9, 7: 83.5, 6.5: 82.1 },
  4: { 10: 89.2, 9.5: 87.8, 9: 86.3, 8.5: 84.9, 8: 83.5, 7.5: 82.1, 7: 80.7, 6.5: 79.3 },
  5: { 10: 86.3, 9.5: 84.9, 9: 83.5, 8.5: 82.1, 8: 80.7, 7.5: 79.3, 7: 77.9, 6.5: 76.5 },
  6: { 10: 83.5, 9.5: 82.1, 9: 80.7, 8.5: 79.3, 8: 77.9, 7.5: 76.5, 7: 75.1, 6.5: 73.7 },
  7: { 10: 80.7, 9.5: 79.3, 9: 77.9, 8.5: 76.5, 8: 75.1, 7.5: 73.7, 7: 72.3, 6.5: 70.9 },
  8: { 10: 77.9, 9.5: 76.5, 9: 75.1, 8.5: 73.7, 8: 72.3, 7.5: 70.9, 7: 69.5, 6.5: 68.0 },
  9: { 10: 75.1, 9.5: 73.7, 9: 72.3, 8.5: 70.9, 8: 69.5, 7.5: 68.0, 7: 66.6, 6.5: 65.2 },
  10: { 10: 72.3, 9.5: 70.9, 9: 69.5, 8.5: 68.0, 8: 66.6, 7.5: 65.2, 7: 63.8, 6.5: 62.4 },
};

export function calculateRpeE1RM(weight: number, reps: number, rpe: number): number {
  if (weight <= 0 || reps <= 0) return 0;
  const clampedReps = Math.min(Math.max(reps, 1), 10);
  const repLookup = RPE_PERCENTAGES[clampedReps];
  const pct = repLookup?.[rpe] ?? 80;
  const e1rm = (weight / (pct / 100));
  return Math.round(e1rm * 2) / 2;
}

/**
 * Progressive Warmup Ramp Sets Generator
 * Based on Stronger Warmup Calculator protocols
 */
export interface WarmupSet {
  setNumber: number;
  pctOfWorking: number;
  reps: number;
  weight: number;
  instruction: string;
}

export function calculateWarmupRamp(workingWeight: number, barWeight = 20): WarmupSet[] {
  if (workingWeight <= barWeight) {
    return [
      {
        setNumber: 1,
        pctOfWorking: 100,
        reps: 10,
        weight: barWeight,
        instruction: 'Empty Barbell mobility & groove pattern',
      },
    ];
  }

  const sets: WarmupSet[] = [
    {
      setNumber: 1,
      pctOfWorking: Math.round((barWeight / workingWeight) * 100),
      reps: 10,
      weight: barWeight,
      instruction: 'Empty Bar - Mobility & joint warmup',
    },
    {
      setNumber: 2,
      pctOfWorking: 50,
      reps: 5,
      weight: Math.max(barWeight, Math.round(((workingWeight * 0.5) / 2.5)) * 2.5),
      instruction: 'Moderate speed - explosive intent',
    },
    {
      setNumber: 3,
      pctOfWorking: 70,
      reps: 3,
      weight: Math.max(barWeight, Math.round(((workingWeight * 0.7) / 2.5)) * 2.5),
      instruction: 'Working velocity - lock in bracing',
    },
    {
      setNumber: 4,
      pctOfWorking: 85,
      reps: 1,
      weight: Math.max(barWeight, Math.round(((workingWeight * 0.85) / 2.5)) * 2.5),
      instruction: 'Potentiation single - prime CNS',
    },
  ];

  return sets;
}

/**
 * Macro & Calorie Blueprint Calculator
 * Validated Mifflin-St Jeor Equation
 */
export interface MacroTargets {
  tdee: number;
  calories: number;
  proteinGrams: number;
  carbGrams: number;
  fatGrams: number;
}

export function calculateMacros(
  bodyweightKg: number,
  heightCm: number,
  age: number,
  goal: 'cut' | 'maintain' | 'bulk' = 'maintain'
): MacroTargets {
  // Mifflin-St Jeor for baseline active lifter (x1.4 activity multiplier)
  const bmr = 10 * bodyweightKg + 6.25 * heightCm - 5 * age + 5;
  const tdee = Math.round(bmr * 1.45);

  let targetCalories = tdee;
  if (goal === 'cut') targetCalories = Math.round(tdee - 450);
  if (goal === 'bulk') targetCalories = Math.round(tdee + 350);

  // 2.2g protein per kg bodyweight
  const proteinGrams = Math.round(bodyweightKg * 2.2);
  // 0.9g fat per kg bodyweight
  const fatGrams = Math.round(bodyweightKg * 0.9);
  // Remaining calories to carbohydrates (4 cal/g)
  const remainingCal = Math.max(0, targetCalories - (proteinGrams * 4 + fatGrams * 9));
  const carbGrams = Math.round(remainingCal / 4);

  return {
    tdee,
    calories: targetCalories,
    proteinGrams,
    carbGrams,
    fatGrams,
  };
}
