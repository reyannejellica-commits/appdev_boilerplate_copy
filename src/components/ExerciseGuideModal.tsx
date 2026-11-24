import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import {
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import Svg, {
  Circle,
  Defs,
  Ellipse,
  LinearGradient,
  Path,
  Rect,
  Stop,
} from 'react-native-svg';
import { SmoothPressable } from '@/components/SmoothPressable';
import { EXERCISE_GUIDES, WORKOUT_SPLITS, type ExerciseGuide } from '@/db/workouts';
import { useSettings } from '@/settings/SettingsContext';
import { FONTS, useTheme } from '@/theme';

interface ExerciseGuideModalProps {
  visible?: boolean;
  exerciseName: string | null;
  onClose: () => void;
}

type MuscleHeat = 'none' | 'secondary' | 'primary';

interface AnatomyHeatMap {
  chest: MuscleHeat;
  shoulders: MuscleHeat;
  biceps: MuscleHeat;
  triceps: MuscleHeat;
  forearms: MuscleHeat;
  core: MuscleHeat;
  upperBack: MuscleHeat;
  lats: MuscleHeat;
  lowerBack: MuscleHeat;
  glutes: MuscleHeat;
  quads: MuscleHeat;
  hamstrings: MuscleHeat;
  calves: MuscleHeat;
}

function buildMuscleHeatMap(
  exerciseName: string,
  primaryText: string,
  secondaryText: string
): AnatomyHeatMap {
  const p = `${exerciseName} ${primaryText}`.toLowerCase();
  const s = secondaryText.toLowerCase();

  const pick = (regex: RegExp): MuscleHeat => {
    if (regex.test(p)) return 'primary';
    if (regex.test(s)) return 'secondary';
    return 'none';
  };

  return {
    chest: pick(/(chest|pectoral|bench|push-up|pushup|fly|dip)/i),
    shoulders: pick(/(delt|shoulder|overhead|lateral raise|pike|military|face pull)/i),
    biceps: pick(/(bicep|brachialis|curl|chin-up|chinup)/i),
    triceps: pick(/(tricep|pushdown|skull|extension|dip|press)/i),
    forearms: pick(/(forearm|grip|hammer|deadlift|row|pull-up|pullup)/i),
    core: pick(/(core|ab|rectus|oblique|plank|crunch|leg raise|twist|squat)/i),
    upperBack: pick(/(trap|rhomboid|upper back|rear delt|row|face pull|shrug)/i),
    lats: pick(/(lat|pull-up|pullup|pulldown|row|pullover)/i),
    lowerBack: pick(/(erector|lower back|lumbar|deadlift|rdl|romanian|good morning)/i),
    glutes: pick(/(glute|hip thrust|squat|lunge|split squat|deadlift|rdl|bridge)/i),
    quads: pick(/(quad|vastus|squat|lunge|leg press|leg extension|step)/i),
    hamstrings: pick(/(hamstring|biceps femoris|leg curl|rdl|romanian|deadlift)/i),
    calves: pick(/(calf|calves|gastrocnemius|soleus)/i),
  };
}

/**
 * Dual Anterior & Posterior Anatomical Muscle Map SVG.
 * Visually highlights Primary Target muscles and Secondary Synergists.
 */
function MuscleAnatomyVisual({
  heat,
  primaryColor,
  secondaryColor,
  isDark,
}: {
  heat: AnatomyHeatMap;
  primaryColor: string;
  secondaryColor: string;
  isDark: boolean;
}) {
  const baseFill = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(15,23,42,0.08)';
  const outlineStroke = isDark ? 'rgba(255,255,255,0.18)' : 'rgba(15,23,42,0.18)';

  const colorFor = (level: MuscleHeat) => {
    if (level === 'primary') return primaryColor;
    if (level === 'secondary') return secondaryColor;
    return baseFill;
  };

  const opacityFor = (level: MuscleHeat) => {
    if (level === 'primary') return 0.95;
    if (level === 'secondary') return 0.72;
    return 1;
  };

  return (
    <View style={styles.anatomyWrapper}>
      <Svg width="100%" height={172} viewBox="0 0 240 165">
        <Defs>
          <LinearGradient id="scanGrid" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0%" stopColor={primaryColor} stopOpacity="0.10" />
            <Stop offset="100%" stopColor={primaryColor} stopOpacity="0.0" />
          </LinearGradient>
        </Defs>

        {/* Subtle biomechanical grid lines */}
        <Rect x="4" y="4" width="232" height="157" rx="14" fill="url(#scanGrid)" />
        <Path
          d="M 120 14 L 120 150 M 16 82 L 224 82"
          stroke={isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'}
          strokeWidth="1"
          strokeDasharray="3 3"
        />

        {/* ==================== ANTERIOR (FRONT VIEW - LEFT) ==================== */}
        {/* Head & Neck */}
        <Circle cx="62" cy="20" r="8.5" fill={baseFill} stroke={outlineStroke} strokeWidth="1" />
        <Rect x="59" y="29" width="6" height="5" rx="2" fill={baseFill} />

        {/* Anterior Shoulders (Deltoids) */}
        <Ellipse
          cx="43"
          cy="40"
          rx="6.5"
          ry="5.5"
          fill={colorFor(heat.shoulders)}
          fillOpacity={opacityFor(heat.shoulders)}
          stroke={outlineStroke}
          strokeWidth="0.8"
        />
        <Ellipse
          cx="81"
          cy="40"
          rx="6.5"
          ry="5.5"
          fill={colorFor(heat.shoulders)}
          fillOpacity={opacityFor(heat.shoulders)}
          stroke={outlineStroke}
          strokeWidth="0.8"
        />

        {/* Pectorals (Chest) */}
        <Path
          d="M 48 35 Q 62 33 76 35 L 74 51 Q 62 54 50 51 Z"
          fill={colorFor(heat.chest)}
          fillOpacity={opacityFor(heat.chest)}
          stroke={outlineStroke}
          strokeWidth="0.9"
        />

        {/* Biceps */}
        <Rect
          x="37.5"
          y="46"
          width="6.5"
          height="15"
          rx="3.2"
          fill={colorFor(heat.biceps)}
          fillOpacity={opacityFor(heat.biceps)}
          stroke={outlineStroke}
          strokeWidth="0.8"
        />
        <Rect
          x="80"
          y="46"
          width="6.5"
          height="15"
          rx="3.2"
          fill={colorFor(heat.biceps)}
          fillOpacity={opacityFor(heat.biceps)}
          stroke={outlineStroke}
          strokeWidth="0.8"
        />

        {/* Forearms (Front) */}
        <Rect
          x="35.5"
          y="63"
          width="5.5"
          height="15"
          rx="2.6"
          fill={colorFor(heat.forearms)}
          fillOpacity={opacityFor(heat.forearms)}
        />
        <Rect
          x="83"
          y="63"
          width="5.5"
          height="15"
          rx="2.6"
          fill={colorFor(heat.forearms)}
          fillOpacity={opacityFor(heat.forearms)}
        />

        {/* Core / Abdominals */}
        <Rect
          x="51.5"
          y="53"
          width="21"
          height="26"
          rx="5"
          fill={colorFor(heat.core)}
          fillOpacity={opacityFor(heat.core)}
          stroke={outlineStroke}
          strokeWidth="0.9"
        />
        {/* Ab segmentation lines */}
        <Path
          d="M 62 55 L 62 77 M 54 61 L 70 61 M 54 69 L 70 69"
          stroke={isDark ? 'rgba(0,0,0,0.35)' : 'rgba(255,255,255,0.45)'}
          strokeWidth="1"
        />

        {/* Quadriceps (Front Thighs) */}
        <Rect
          x="49"
          y="82"
          width="11"
          height="32"
          rx="5"
          fill={colorFor(heat.quads)}
          fillOpacity={opacityFor(heat.quads)}
          stroke={outlineStroke}
          strokeWidth="0.9"
        />
        <Rect
          x="64"
          y="82"
          width="11"
          height="32"
          rx="5"
          fill={colorFor(heat.quads)}
          fillOpacity={opacityFor(heat.quads)}
          stroke={outlineStroke}
          strokeWidth="0.9"
        />

        {/* Anterior Calves / Shins */}
        <Rect
          x="50.5"
          y="117"
          width="8"
          height="24"
          rx="4"
          fill={colorFor(heat.calves)}
          fillOpacity={opacityFor(heat.calves)}
        />
        <Rect
          x="65.5"
          y="117"
          width="8"
          height="24"
          rx="4"
          fill={colorFor(heat.calves)}
          fillOpacity={opacityFor(heat.calves)}
        />

        {/* ==================== POSTERIOR (BACK VIEW - RIGHT) ==================== */}
        {/* Head & Neck */}
        <Circle cx="178" cy="20" r="8.5" fill={baseFill} stroke={outlineStroke} strokeWidth="1" />
        <Rect x="175" y="29" width="6" height="5" rx="2" fill={baseFill} />

        {/* Rear Shoulders */}
        <Ellipse
          cx="159"
          cy="40"
          rx="6.5"
          ry="5.5"
          fill={colorFor(heat.shoulders)}
          fillOpacity={opacityFor(heat.shoulders)}
          stroke={outlineStroke}
          strokeWidth="0.8"
        />
        <Ellipse
          cx="197"
          cy="40"
          rx="6.5"
          ry="5.5"
          fill={colorFor(heat.shoulders)}
          fillOpacity={opacityFor(heat.shoulders)}
          stroke={outlineStroke}
          strokeWidth="0.8"
        />

        {/* Traps & Rhomboids (Upper Back) */}
        <Path
          d="M 166 34 L 190 34 L 185 50 L 171 50 Z"
          fill={colorFor(heat.upperBack)}
          fillOpacity={opacityFor(heat.upperBack)}
          stroke={outlineStroke}
          strokeWidth="0.9"
        />

        {/* Lats (V-Taper Wings) */}
        <Path
          d="M 164 46 L 171 51 L 172 67 L 165 62 Z"
          fill={colorFor(heat.lats)}
          fillOpacity={opacityFor(heat.lats)}
          stroke={outlineStroke}
          strokeWidth="0.8"
        />
        <Path
          d="M 192 46 L 185 51 L 184 67 L 191 62 Z"
          fill={colorFor(heat.lats)}
          fillOpacity={opacityFor(heat.lats)}
          stroke={outlineStroke}
          strokeWidth="0.8"
        />

        {/* Lower Back / Erectors */}
        <Rect
          x="172"
          y="52"
          width="12"
          height="16"
          rx="3"
          fill={colorFor(heat.lowerBack)}
          fillOpacity={opacityFor(heat.lowerBack)}
        />

        {/* Triceps */}
        <Rect
          x="153.5"
          y="46"
          width="6.5"
          height="15"
          rx="3.2"
          fill={colorFor(heat.triceps)}
          fillOpacity={opacityFor(heat.triceps)}
          stroke={outlineStroke}
          strokeWidth="0.8"
        />
        <Rect
          x="196"
          y="46"
          width="6.5"
          height="15"
          rx="3.2"
          fill={colorFor(heat.triceps)}
          fillOpacity={opacityFor(heat.triceps)}
          stroke={outlineStroke}
          strokeWidth="0.8"
        />

        {/* Forearms (Back) */}
        <Rect
          x="151.5"
          y="63"
          width="5.5"
          height="15"
          rx="2.6"
          fill={colorFor(heat.forearms)}
          fillOpacity={opacityFor(heat.forearms)}
        />
        <Rect
          x="199"
          y="63"
          width="5.5"
          height="15"
          rx="2.6"
          fill={colorFor(heat.forearms)}
          fillOpacity={opacityFor(heat.forearms)}
        />

        {/* Glutes */}
        <Ellipse
          cx="172"
          cy="76"
          rx="7"
          ry="6.5"
          fill={colorFor(heat.glutes)}
          fillOpacity={opacityFor(heat.glutes)}
          stroke={outlineStroke}
          strokeWidth="0.8"
        />
        <Ellipse
          cx="184"
          cy="76"
          rx="7"
          ry="6.5"
          fill={colorFor(heat.glutes)}
          fillOpacity={opacityFor(heat.glutes)}
          stroke={outlineStroke}
          strokeWidth="0.8"
        />

        {/* Hamstrings */}
        <Rect
          x="165.5"
          y="85"
          width="10.5"
          height="29"
          rx="5"
          fill={colorFor(heat.hamstrings)}
          fillOpacity={opacityFor(heat.hamstrings)}
          stroke={outlineStroke}
          strokeWidth="0.9"
        />
        <Rect
          x="180"
          y="85"
          width="10.5"
          height="29"
          rx="5"
          fill={colorFor(heat.hamstrings)}
          fillOpacity={opacityFor(heat.hamstrings)}
          stroke={outlineStroke}
          strokeWidth="0.9"
        />

        {/* Posterior Calves */}
        <Rect
          x="166.5"
          y="117"
          width="8.5"
          height="24"
          rx="4.2"
          fill={colorFor(heat.calves)}
          fillOpacity={opacityFor(heat.calves)}
          stroke={outlineStroke}
          strokeWidth="0.8"
        />
        <Rect
          x="181"
          y="117"
          width="8.5"
          height="24"
          rx="4.2"
          fill={colorFor(heat.calves)}
          fillOpacity={opacityFor(heat.calves)}
          stroke={outlineStroke}
          strokeWidth="0.8"
        />
      </Svg>

      <View style={styles.anatomyLabelsRow}>
        <Text style={styles.anatomyViewLabel}>FRONT (ANTERIOR)</Text>
        <Text style={styles.anatomyViewLabel}>BACK (POSTERIOR)</Text>
      </View>
    </View>
  );
}

function getTargetBenchmark(exerciseName: string): { sets: number; reps: number; weight: number } {
  const lower = exerciseName.toLowerCase();
  for (const split of WORKOUT_SPLITS) {
    const found = split.exercises.find((e) => e.name.toLowerCase() === lower);
    if (found) {
      return {
        sets: found.sets,
        reps: found.defaultReps,
        weight: found.defaultWeight,
      };
    }
  }
  return { sets: 3, reps: 10, weight: 20 };
}

export function ExerciseGuideModal({ exerciseName, onClose }: ExerciseGuideModalProps) {
  const theme = useTheme();
  const { settings } = useSettings();
  const isDark = settings.theme === 'dark';

  if (!exerciseName) return null;

  const targetBenchmark = getTargetBenchmark(exerciseName);
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

  const heatMap = buildMuscleHeatMap(
    guide.name,
    `${primaryMuscles} ${guide.primaryEngagement ?? ''}`,
    secondaryMuscles
  );

  const isIsometric = /(plank|hold|wall sit)/i.test(guide.name);
  const repTargetLabel = isIsometric
    ? `${targetBenchmark.reps}s Hold`
    : `${targetBenchmark.reps} Clean Reps`;

  const cardBg = isDark ? '#14141B' : '#F8FAFC';
  const cardBorder = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(15,23,42,0.08)';
  const modalBg = isDark ? '#0B0B10' : '#FFFFFF';

  return (
    <Modal visible={!!exerciseName} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View
          style={[
            styles.container,
            {
              backgroundColor: modalBg,
              borderColor: isDark ? 'rgba(255,255,255,0.12)' : theme.border,
            },
          ]}
        >
          {/* Top Grabber Handle */}
          <View
            style={[
              styles.grabberHandle,
              { backgroundColor: isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.15)' },
            ]}
          />

          {/* Top Header Row */}
          <View style={styles.topHeaderRow}>
            <View style={styles.titleColumn}>
              <View style={styles.headerTagRow}>
                <Text style={[styles.categoryTagText, { color: theme.tint }]}>{categoryTag}</Text>
                <View
                  style={[
                    styles.equipmentPill,
                    {
                      backgroundColor: `${theme.tint}16`,
                      borderColor: `${theme.tint}40`,
                    },
                  ]}
                >
                  <Text style={[styles.equipmentPillText, { color: theme.tint }]}>
                    {equipmentBadge}
                  </Text>
                </View>
              </View>
              <Text
                style={[styles.mainTitleText, { color: theme.text }]}
                numberOfLines={1}
                adjustsFontSizeToFit
              >
                {guide.name}
              </Text>
            </View>

            <SmoothPressable
              onPress={onClose}
              style={[
                styles.closeCircleBtn,
                {
                  backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)',
                  borderColor: cardBorder,
                },
              ]}
              accessibilityRole="button"
              accessibilityLabel="Close Exercise Guide"
              hitSlop={8}
            >
              <Ionicons name="close" size={18} color={theme.text} />
            </SmoothPressable>
          </View>

          <ScrollView
            style={styles.modalScroll}
            contentContainerStyle={styles.modalScrollContent}
            showsVerticalScrollIndicator={false}
          >
            {/* VISUAL REPRESENTATION 1: TARGET TO ACCOMPLISH BLUEPRINT */}
            <View
              style={[
                styles.sectionCard,
                {
                  backgroundColor: cardBg,
                  borderColor: `${theme.tint}38`,
                },
              ]}
            >
              <View style={styles.sectionTitleRow}>
                <Ionicons name="trophy-outline" size={15} color={theme.tint} />
                <Text style={[styles.sectionHeaderTitle, { color: theme.text }]}>
                  TARGET TO ACCOMPLISH
                </Text>
              </View>

              {/* 3 Visual Target Metric Boxes */}
              <View style={styles.targetMetricsGrid}>
                <View
                  style={[
                    styles.targetMetricBox,
                    {
                      backgroundColor: isDark ? '#1C1C26' : '#FFFFFF',
                      borderColor: cardBorder,
                    },
                  ]}
                >
                  <Text style={[styles.metricValue, { color: theme.tint }]}>
                    {targetBenchmark.sets} Sets
                  </Text>
                  <Text style={[styles.metricLabel, { color: theme.textSecondary }]}>
                    Working Volume
                  </Text>
                </View>

                <View
                  style={[
                    styles.targetMetricBox,
                    {
                      backgroundColor: isDark ? '#1C1C26' : '#FFFFFF',
                      borderColor: cardBorder,
                    },
                  ]}
                >
                  <Text style={[styles.metricValue, { color: theme.text }]}>
                    {repTargetLabel}
                  </Text>
                  <Text style={[styles.metricLabel, { color: theme.textSecondary }]}>
                    Per Working Set
                  </Text>
                </View>

                <View
                  style={[
                    styles.targetMetricBox,
                    {
                      backgroundColor: isDark ? '#1C1C26' : '#FFFFFF',
                      borderColor: cardBorder,
                    },
                  ]}
                >
                  <Text style={[styles.metricValue, { color: theme.success }]}>1–2 RIR</Text>
                  <Text style={[styles.metricLabel, { color: theme.textSecondary }]}>
                    Effort Intensity
                  </Text>
                </View>
              </View>

              {/* Visual Set Progression Checkpoints */}
              <View style={styles.setCheckpointChain}>
                {Array.from({ length: targetBenchmark.sets }).map((_, idx) => (
                  <React.Fragment key={idx}>
                    <View
                      style={[
                        styles.checkpointNode,
                        {
                          backgroundColor: `${theme.tint}22`,
                          borderColor: theme.tint,
                        },
                      ]}
                    >
                      <Ionicons name="checkmark" size={11} color={theme.tint} />
                      <Text style={[styles.checkpointText, { color: theme.text }]}>
                        Set {idx + 1} ({targetBenchmark.reps})
                      </Text>
                    </View>
                    {idx < targetBenchmark.sets - 1 && (
                      <View
                        style={[
                          styles.checkpointConnector,
                          { backgroundColor: `${theme.tint}45` },
                        ]}
                      />
                    )}
                  </React.Fragment>
                ))}
              </View>

              {/* Visual Tempo & Contraction Cadence Bar */}
              <View
                style={[
                  styles.tempoVisualBox,
                  {
                    backgroundColor: isDark ? '#101017' : '#F1F5F9',
                    borderColor: cardBorder,
                  },
                ]}
              >
                <View style={styles.tempoHeaderRow}>
                  <Text style={[styles.tempoTitle, { color: theme.textSecondary }]}>
                    REP EXECUTION CADENCE
                  </Text>
                  <Text style={[styles.tempoCode, { color: theme.tint }]}>3 - 1 - 1 TEMPO</Text>
                </View>
                <View style={styles.tempoSegmentsRow}>
                  <View style={[styles.tempoSegment, { flex: 3, backgroundColor: `${theme.tint}40` }]}>
                    <Text style={[styles.tempoSegText, { color: theme.text }]}>
                      3s Controlled Lower
                    </Text>
                  </View>
                  <View style={[styles.tempoSegment, { flex: 1.4, backgroundColor: theme.tint }]}>
                    <Text style={[styles.tempoSegText, { color: '#FFFFFF' }]}>1s Squeeze</Text>
                  </View>
                  <View style={[styles.tempoSegment, { flex: 1.6, backgroundColor: theme.success }]}>
                    <Text style={[styles.tempoSegText, { color: '#08100C' }]}>1s Drive</Text>
                  </View>
                </View>
              </View>
            </View>

            {/* VISUAL REPRESENTATION 2: ANATOMICAL TARGET MUSCLE MAP & ACTIVATION METERS */}
            <View
              style={[
                styles.sectionCard,
                {
                  backgroundColor: cardBg,
                  borderColor: cardBorder,
                },
              ]}
            >
              <View style={styles.muscleEngagementHeaderRow}>
                <View style={styles.sectionTitleRow}>
                  <Ionicons name="body-outline" size={15} color={theme.tint} />
                  <Text style={[styles.sectionHeaderTitle, { color: theme.text }]}>
                    VISUAL MUSCLE TARGET MAP
                  </Text>
                </View>

                <View style={styles.engagementLegendRow}>
                  <View style={styles.legendItem}>
                    <View style={[styles.legendDot, { backgroundColor: theme.tint }]} />
                    <Text style={[styles.legendLabelText, { color: theme.textSecondary }]}>
                      Primary
                    </Text>
                  </View>
                  <View style={styles.legendItem}>
                    <View style={[styles.legendDot, { backgroundColor: '#F59E0B' }]} />
                    <Text style={[styles.legendLabelText, { color: theme.textSecondary }]}>
                      Synergist
                    </Text>
                  </View>
                </View>
              </View>

              {/* SVG Front & Back Anatomical Silhouette */}
              <MuscleAnatomyVisual
                heat={heatMap}
                primaryColor={theme.tint}
                secondaryColor="#F59E0B"
                isDark={isDark}
              />

              {/* Visual Muscle Activation Progress Bars */}
              <View style={styles.activationMetersWrap}>
                <View style={styles.activationRow}>
                  <View style={styles.activationLabelRow}>
                    <Text style={[styles.activationRoleTag, { color: theme.tint }]}>
                      PRIMARY TARGET
                    </Text>
                    <Text
                      style={[styles.activationMuscleName, { color: theme.text }]}
                      numberOfLines={1}
                    >
                      {primaryMuscles}
                    </Text>
                    <Text style={[styles.activationPercent, { color: theme.tint }]}>92%</Text>
                  </View>
                  <View
                    style={[
                      styles.activationTrack,
                      { backgroundColor: isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.07)' },
                    ]}
                  >
                    <View
                      style={[
                        styles.activationFill,
                        { width: '92%', backgroundColor: theme.tint },
                      ]}
                    />
                  </View>
                </View>

                <View style={styles.activationRow}>
                  <View style={styles.activationLabelRow}>
                    <Text style={[styles.activationRoleTag, { color: '#F59E0B' }]}>
                      SYNERGISTS
                    </Text>
                    <Text
                      style={[styles.activationMuscleName, { color: theme.textSecondary }]}
                      numberOfLines={1}
                    >
                      {secondaryMuscles}
                    </Text>
                    <Text style={[styles.activationPercent, { color: '#F59E0B' }]}>58%</Text>
                  </View>
                  <View
                    style={[
                      styles.activationTrack,
                      { backgroundColor: isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.07)' },
                    ]}
                  >
                    <View
                      style={[
                        styles.activationFill,
                        { width: '58%', backgroundColor: '#F59E0B' },
                      ]}
                    />
                  </View>
                </View>
              </View>
            </View>

            {/* CARD 3: STEP-BY-STEP EXECUTION */}
            <View
              style={[
                styles.sectionCard,
                {
                  backgroundColor: cardBg,
                  borderColor: cardBorder,
                },
              ]}
            >
              <View style={[styles.sectionTitleRow, { marginBottom: 10 }]}>
                <Ionicons name="list-outline" size={15} color={theme.tint} />
                <Text style={[styles.sectionHeaderTitle, { color: theme.text }]}>
                  STEP-BY-STEP EXECUTION
                </Text>
              </View>
              <View style={styles.stepsList}>
                {guide.instructions.map((step, idx) => (
                  <View key={idx} style={styles.stepItemRow}>
                    <View
                      style={[
                        styles.stepNumberCircle,
                        {
                          backgroundColor: `${theme.tint}20`,
                          borderColor: `${theme.tint}55`,
                        },
                      ]}
                    >
                      <Text style={[styles.stepNumberText, { color: theme.tint }]}>
                        {idx + 1}
                      </Text>
                    </View>
                    <Text style={[styles.stepParagraphText, { color: theme.text }]}>
                      {step}
                    </Text>
                  </View>
                ))}
              </View>
            </View>

            {/* CARD 4: PEAK FORM TIPS */}
            <View style={[styles.sectionCard, styles.formTipsCard]}>
              <View style={[styles.sectionTitleRow, { marginBottom: 8 }]}>
                <Ionicons name="checkmark-circle-outline" size={15} color="#34D399" />
                <Text style={styles.formTipsHeaderTitle}>PEAK FORM CUES</Text>
              </View>
              <View style={styles.tipsList}>
                {formTips.map((tip, idx) => (
                  <View key={idx} style={styles.tipItemRow}>
                    <Text style={styles.checkIcon}>✓</Text>
                    <Text style={[styles.tipItemText, { color: theme.text }]}>{tip}</Text>
                  </View>
                ))}
              </View>
            </View>

            {/* CARD 5: MISTAKES TO AVOID */}
            <View style={[styles.sectionCard, styles.mistakesCard]}>
              <View style={[styles.sectionTitleRow, { marginBottom: 8 }]}>
                <Ionicons name="alert-circle-outline" size={15} color="#F87171" />
                <Text style={styles.mistakesHeaderTitle}>MISTAKES TO AVOID</Text>
              </View>
              <View style={styles.tipsList}>
                {mistakes.map((mistake, idx) => (
                  <View key={idx} style={styles.mistakeItemRow}>
                    <Text style={styles.crossIcon}>✕</Text>
                    <Text style={[styles.mistakeItemText, { color: theme.text }]}>
                      {mistake}
                    </Text>
                  </View>
                ))}
              </View>
            </View>

            <View style={{ height: 12 }} />
          </ScrollView>

          {/* BOTTOM ACTION BUTTON */}
          <SmoothPressable
            onPress={onClose}
            style={[
              styles.backToWorkoutBtn,
              {
                backgroundColor: theme.tint,
                shadowColor: theme.glow,
              },
            ]}
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
    backgroundColor: 'rgba(0, 0, 0, 0.78)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 20,
  },
  container: {
    width: '100%',
    maxWidth: 440,
    maxHeight: '92%',
    borderRadius: 24,
    borderWidth: 1,
    paddingTop: 10,
    paddingHorizontal: 16,
    paddingBottom: 16,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 14 },
    shadowRadius: 28,
    shadowOpacity: 0.65,
    elevation: 16,
  },
  grabberHandle: {
    width: 38,
    height: 4,
    borderRadius: 2,
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
    marginRight: 10,
  },
  headerTagRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 4,
  },
  categoryTagText: {
    fontFamily: FONTS.bold,
    fontSize: 10.5,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  mainTitleText: {
    fontFamily: FONTS.bold,
    fontSize: 21,
    fontWeight: '800',
    letterSpacing: -0.2,
  },
  closeCircleBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },

  modalScroll: {
    flexGrow: 0,
    maxHeight: '81%',
  },
  modalScrollContent: {
    paddingVertical: 4,
  },

  // GENERIC SECTION CARD
  sectionCard: {
    borderRadius: 18,
    borderWidth: 1,
    padding: 14,
    marginBottom: 12,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  sectionHeaderTitle: {
    fontFamily: FONTS.bold,
    fontSize: 11.5,
    fontWeight: '800',
    letterSpacing: 0.6,
  },
  equipmentPill: {
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  equipmentPillText: {
    fontFamily: FONTS.semiBold,
    fontSize: 10,
    fontWeight: '700',
  },

  // TARGET TO ACCOMPLISH BLUEPRINT
  targetMetricsGrid: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 10,
    marginBottom: 10,
  },
  targetMetricBox: {
    flex: 1,
    borderRadius: 12,
    borderWidth: 1,
    paddingVertical: 9,
    paddingHorizontal: 8,
    alignItems: 'center',
  },
  metricValue: {
    fontFamily: FONTS.bold,
    fontSize: 13.5,
    fontWeight: '800',
    marginBottom: 2,
  },
  metricLabel: {
    fontFamily: FONTS.medium,
    fontSize: 10,
    fontWeight: '600',
  },
  setCheckpointChain: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  checkpointNode: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
  },
  checkpointText: {
    fontFamily: FONTS.semiBold,
    fontSize: 10.5,
    fontWeight: '700',
  },
  checkpointConnector: {
    flex: 1,
    height: 1.5,
    marginHorizontal: 4,
  },
  tempoVisualBox: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 10,
  },
  tempoHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  tempoTitle: {
    fontFamily: FONTS.bold,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  tempoCode: {
    fontFamily: FONTS.bold,
    fontSize: 10.5,
    fontWeight: '800',
  },
  tempoSegmentsRow: {
    flexDirection: 'row',
    gap: 4,
    height: 24,
  },
  tempoSegment: {
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  tempoSegText: {
    fontFamily: FONTS.bold,
    fontSize: 9.5,
    fontWeight: '700',
  },

  // ANATOMY MAP & ACTIVATION METERS
  muscleEngagementHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  engagementLegendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  legendDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
  },
  legendLabelText: {
    fontFamily: FONTS.semiBold,
    fontSize: 10.5,
    fontWeight: '600',
  },
  anatomyWrapper: {
    marginVertical: 4,
  },
  anatomyLabelsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 2,
    marginBottom: 8,
  },
  anatomyViewLabel: {
    fontFamily: FONTS.semiBold,
    fontSize: 9.5,
    color: '#8E8E9A',
    letterSpacing: 0.6,
  },
  activationMetersWrap: {
    gap: 10,
    marginTop: 4,
  },
  activationRow: {
    gap: 5,
  },
  activationLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  activationRoleTag: {
    fontFamily: FONTS.bold,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.4,
  },
  activationMuscleName: {
    flex: 1,
    fontFamily: FONTS.semiBold,
    fontSize: 11.5,
    fontWeight: '600',
  },
  activationPercent: {
    fontFamily: FONTS.bold,
    fontSize: 11,
    fontWeight: '800',
  },
  activationTrack: {
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
  },
  activationFill: {
    height: '100%',
    borderRadius: 3,
  },

  // STEP-BY-STEP EXECUTION
  stepsList: {
    gap: 10,
  },
  stepItemRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  stepNumberCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 1,
  },
  stepNumberText: {
    fontFamily: FONTS.bold,
    fontSize: 11,
    fontWeight: '800',
  },
  stepParagraphText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 19,
    fontWeight: '500',
  },

  // FORM TIPS & MISTAKES
  formTipsCard: {
    backgroundColor: 'rgba(16, 185, 129, 0.07)',
    borderColor: 'rgba(16, 185, 129, 0.24)',
  },
  formTipsHeaderTitle: {
    fontFamily: FONTS.bold,
    color: '#34D399',
    fontSize: 11.5,
    fontWeight: '800',
    letterSpacing: 0.6,
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
    fontSize: 12.5,
    lineHeight: 18,
    fontWeight: '500',
  },
  mistakesCard: {
    backgroundColor: 'rgba(239, 68, 68, 0.07)',
    borderColor: 'rgba(239, 68, 68, 0.24)',
  },
  mistakesHeaderTitle: {
    fontFamily: FONTS.bold,
    color: '#F87171',
    fontSize: 11.5,
    fontWeight: '800',
    letterSpacing: 0.6,
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
    fontSize: 12.5,
    lineHeight: 18,
    fontWeight: '500',
  },

  // BOTTOM BUTTON
  backToWorkoutBtn: {
    height: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 6,
    shadowOffset: { width: 0, height: 6 },
    shadowRadius: 14,
    shadowOpacity: 0.45,
    elevation: 6,
  },
  backToWorkoutBtnText: {
    fontFamily: FONTS.bold,
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: 0.2,
  },
});
