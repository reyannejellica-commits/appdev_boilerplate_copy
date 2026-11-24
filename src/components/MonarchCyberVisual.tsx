import React, { useEffect, useState } from 'react';
import { Animated, Easing, StyleSheet, View } from 'react-native';
import Svg, {
  Circle,
  Defs,
  LinearGradient,
  Line,
  Path,
  Polygon,
  RadialGradient,
  Rect,
  Stop,
} from 'react-native-svg';
import { useSettings } from '@/settings/SettingsContext';
import { COLOR_PRESETS, useTheme } from '@/theme';

export type MonarchVisualVariant = 'dumbbell' | 'quest' | 'ai' | 'awakening';

export interface MonarchCyberVisualProps {
  variant?: MonarchVisualVariant;
  size?: number;
  animated?: boolean;
  showDisc?: boolean;
  idPrefix?: string;
}

export function MonarchCyberVisual({
  variant = 'dumbbell',
  size = 176,
  animated = true,
  showDisc = true,
  idPrefix = 'mv',
}: MonarchCyberVisualProps) {
  const theme = useTheme();
  const { settings } = useSettings();
  const preset = COLOR_PRESETS[settings.colorScheme || 'rose'] || COLOR_PRESETS.rose;

  // Floating levitation and breathing pulse animations
  const [pulseAnim] = useState(() => new Animated.Value(0));
  const [floatAnim] = useState(() => new Animated.Value(0));

  useEffect(() => {
    if (!animated) return;

    // Smooth pulse loop
    const pulseLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1500,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 0,
          duration: 1500,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ])
    );

    // Smooth subtle levitation float loop
    const floatLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(floatAnim, {
          toValue: -7,
          duration: 2200,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(floatAnim, {
          toValue: 0,
          duration: 2200,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ])
    );

    pulseLoop.start();
    floatLoop.start();

    return () => {
      pulseLoop.stop();
      floatLoop.stop();
    };
  }, [animated, pulseAnim, floatAnim]);

  const auraScale = pulseAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.96, 1.12],
  });

  const auraOpacity = pulseAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.55, 0.95],
  });

  const haloId = `${idPrefix}_halo`;
  const discGradId = `${idPrefix}_discGrad`;
  const outerGradId = `${idPrefix}_outerPlate`;
  const innerGradId = `${idPrefix}_innerPlate`;
  const crownGradId = `${idPrefix}_crown`;

  return (
    <Animated.View
      style={[
        styles.container,
        {
          width: size,
          height: size,
          transform: animated ? [{ translateY: floatAnim }] : undefined,
        },
      ]}
    >
      {/* Layer 1: Ambient Pulsing Radial Aura */}
      <Animated.View
        pointerEvents="none"
        style={[
          StyleSheet.absoluteFill,
          {
            opacity: auraOpacity,
            transform: [{ scale: auraScale }],
          },
        ]}
      >
        <Svg width={size} height={size} viewBox="0 0 80 80">
          <Defs>
            <RadialGradient id={haloId} cx="50%" cy="50%" rx="50%" ry="50%">
              <Stop offset="0%" stopColor={theme.tint} stopOpacity="0.48" />
              <Stop offset="60%" stopColor={theme.glow} stopOpacity="0.18" />
              <Stop offset="100%" stopColor={theme.glow} stopOpacity="0" />
            </RadialGradient>
          </Defs>

          {/* Soft borderless radial mana aura */}
          <Circle cx="40" cy="42" r="39" fill={`url(#${haloId})`} />
        </Svg>
      </Animated.View>

      {/* Layer 2: Main Vector Artwork with Optional Dark Obsidian Circular Disc & Telemetry */}
      <View style={StyleSheet.absoluteFill}>
        <Svg width={size} height={size} viewBox="0 0 80 80">
          <Defs>
            <RadialGradient id={discGradId} cx="50%" cy="45%" rx="50%" ry="50%">
              <Stop offset="0%" stopColor="#25162B" stopOpacity="1" />
              <Stop offset="65%" stopColor="#150D1D" stopOpacity="1" />
              <Stop offset="100%" stopColor="#0B0610" stopOpacity="1" />
            </RadialGradient>
            <LinearGradient id={outerGradId} x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0%" stopColor={preset.borderGlow} stopOpacity="1" />
              <Stop offset="45%" stopColor={theme.tint} stopOpacity="1" />
              <Stop offset="100%" stopColor={preset.secondary} stopOpacity="1" />
            </LinearGradient>
            <LinearGradient id={innerGradId} x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0%" stopColor="#FFFFFF" stopOpacity="1" />
              <Stop offset="55%" stopColor={preset.borderGlow} stopOpacity="1" />
              <Stop offset="100%" stopColor={theme.tint} stopOpacity="1" />
            </LinearGradient>
            <LinearGradient id={crownGradId} x1="0" y1="0" x2="1" y2="1">
              <Stop offset="0%" stopColor="#FFFFFF" stopOpacity="1" />
              <Stop offset="100%" stopColor={preset.borderGlow} stopOpacity="1" />
            </LinearGradient>
          </Defs>

          {/* Optional Dark Obsidian Disc Backing with Outer Rim & Telemetry Ticks (Matches user image exactly) */}
          {showDisc && (
            <>
              {/* Dark Obsidian Circular Disc */}
              <Circle
                cx="40"
                cy="42"
                r="37"
                fill={`url(#${discGradId})`}
                stroke={preset.borderGlow}
                strokeWidth="1.2"
                strokeOpacity="0.45"
              />

              {/* Inner Concentric Hairline Ring */}
              <Circle
                cx="40"
                cy="42"
                r="34.5"
                fill="none"
                stroke="rgba(255, 255, 255, 0.08)"
                strokeWidth="0.8"
                strokeDasharray="2 3"
              />

              {/* 4 Diagonal Orbital Telemetry Radar Ticks (45°, 135°, 225°, 315°) */}
              <Line
                x1="12.5"
                y1="14.5"
                x2="16.5"
                y2="18.5"
                stroke={preset.borderGlow}
                strokeWidth="2"
                strokeLinecap="round"
                strokeOpacity="0.85"
              />
              <Line
                x1="67.5"
                y1="14.5"
                x2="63.5"
                y2="18.5"
                stroke={preset.borderGlow}
                strokeWidth="2"
                strokeLinecap="round"
                strokeOpacity="0.85"
              />
              <Line
                x1="12.5"
                y1="69.5"
                x2="16.5"
                y2="65.5"
                stroke={preset.borderGlow}
                strokeWidth="2"
                strokeLinecap="round"
                strokeOpacity="0.85"
              />
              <Line
                x1="67.5"
                y1="69.5"
                x2="63.5"
                y2="65.5"
                stroke={preset.borderGlow}
                strokeWidth="2"
                strokeLinecap="round"
                strokeOpacity="0.85"
              />
            </>
          )}

          {/* LEFT SIDE EFFECTS: Dual kinetic shockwave arcs + electric energy spikes */}
          <Path
            d="M 10 23 C 3 33, 3 51, 10 61"
            stroke={preset.borderGlow}
            strokeWidth="2.4"
            strokeLinecap="round"
            fill="none"
          />
          <Path
            d="M 5.5 29 C 0.5 37, 0.5 47, 5.5 55"
            stroke={theme.tint}
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeDasharray="4 3"
            fill="none"
            opacity="0.85"
          />
          {/* Left energy wing spikes */}
          <Path
            d="M 12 20 L 6 15 M 8 42 L 2 42 M 12 64 L 6 69"
            stroke={preset.borderGlow}
            strokeWidth="2"
            strokeLinecap="round"
          />
          <Circle cx="4.5" cy="24" r="1.8" fill="#FFFFFF" />
          <Circle cx="3.5" cy="59" r="1.6" fill={preset.borderGlow} />

          {/* RIGHT SIDE EFFECTS: Dual kinetic shockwave arcs + electric energy spikes */}
          <Path
            d="M 70 23 C 77 33, 77 51, 70 61"
            stroke={preset.borderGlow}
            strokeWidth="2.4"
            strokeLinecap="round"
            fill="none"
          />
          <Path
            d="M 74.5 29 C 79.5 37, 79.5 47, 74.5 55"
            stroke={theme.tint}
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeDasharray="4 3"
            fill="none"
            opacity="0.85"
          />
          {/* Right energy wing spikes */}
          <Path
            d="M 68 20 L 74 15 M 72 42 L 78 42 M 68 64 L 74 69"
            stroke={preset.borderGlow}
            strokeWidth="2"
            strokeLinecap="round"
          />
          <Circle cx="75.5" cy="24" r="1.8" fill="#FFFFFF" />
          <Circle cx="76.5" cy="59" r="1.6" fill={preset.borderGlow} />

          {/* Top Monarch Summit Crown / Chevron Crest */}
          <Path
            d="M 28 22 L 40 12 L 52 22"
            stroke="#080510"
            strokeWidth="5.4"
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
          />
          <Path
            d="M 28 22 L 40 12 L 52 22"
            stroke={`url(#${crownGradId})`}
            strokeWidth="3.2"
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
          />
          <Polygon
            points="40,16.5 43.5,21 40,25.5 36.5,21"
            fill={preset.borderGlow}
            stroke="#080510"
            strokeWidth="1.2"
          />

          {/* Heavy Cyber-Dumbbell Central Bar with dark armor casing */}
          <Rect
            x="22"
            y="38.2"
            width="36"
            height="7.6"
            rx="3.8"
            fill="#080510"
          />
          <Rect
            x="23"
            y="39.4"
            width="34"
            height="5.2"
            rx="2.6"
            fill="#FFFFFF"
          />

          {/* Left Inner Angled Weight Plate */}
          <Rect
            x="19"
            y="26"
            width="7.2"
            height="32"
            rx="3.2"
            fill={`url(#${innerGradId})`}
            stroke="#080510"
            strokeWidth="1.6"
          />
          {/* Left Outer Heavy Armored Weight Plate */}
          <Rect
            x="11.5"
            y="21"
            width="7.2"
            height="42"
            rx="3.5"
            fill={`url(#${outerGradId})`}
            stroke="#FFFFFF"
            strokeWidth="1.5"
          />
          {/* Left Plate Glowing Core Slit */}
          <Rect
            x="14.3"
            y="28"
            width="1.8"
            height="28"
            rx="0.9"
            fill="#FFFFFF"
            opacity="0.9"
          />

          {/* Right Inner Angled Weight Plate */}
          <Rect
            x="53.8"
            y="26"
            width="7.2"
            height="32"
            rx="3.2"
            fill={`url(#${innerGradId})`}
            stroke="#080510"
            strokeWidth="1.6"
          />
          {/* Right Outer Heavy Armored Weight Plate */}
          <Rect
            x="61.3"
            y="21"
            width="7.2"
            height="42"
            rx="3.5"
            fill={`url(#${outerGradId})`}
            stroke="#FFFFFF"
            strokeWidth="1.5"
          />
          {/* Right Plate Glowing Core Slit */}
          <Rect
            x="63.9"
            y="28"
            width="1.8"
            height="28"
            rx="0.9"
            fill="#FFFFFF"
            opacity="0.9"
          />

          {/* Central AI Neural Power Core (Glowing Diamond Reactor) */}
          <Polygon
            points="40,29.5 48.5,42 40,54.5 31.5,42"
            fill={theme.tint}
            stroke="#080510"
            strokeWidth="2.8"
          />
          <Polygon
            points="40,30.5 47.5,42 40,53.5 32.5,42"
            fill={theme.tint}
            stroke="#FFFFFF"
            strokeWidth="1.8"
          />
          <Circle cx="40" cy="42" r="2.8" fill="#FFFFFF" />
        </Svg>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
