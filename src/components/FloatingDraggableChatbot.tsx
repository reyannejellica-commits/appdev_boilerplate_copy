import { usePathname, useRouter } from 'expo-router';
import React, { useEffect, useMemo, useState } from 'react';
import {
  Animated,
  Easing,
  PanResponder,
  StyleSheet,
  useWindowDimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, {
  Circle,
  Defs,
  LinearGradient,
  Path,
  Polygon,
  RadialGradient,
  Rect,
  Stop,
} from 'react-native-svg';
import { TAB_BAR_GAP, TAB_BAR_HEIGHT } from './FloatingTabBar';
import { useSettings } from '@/settings/SettingsContext';
import { COLOR_PRESETS, useTheme } from '@/theme';

const BUTTON_SIZE = 76;
const EDGE_MARGIN = 12;

/**
 * Backgroundless Monarch Dumbbell AI Coach Floating Button.
 * Features:
 * - Zero box background and zero text label — pure floating cyber-dumbbell silhouette
 * - Animated kinetic energy arcs, lightning aura waves, and sparks on the sides of the dumbbell
 * - Soft radial mana halo (fades to 0% opacity with no box edges)
 * - Dynamic idle hopping + tilt animation & tactile drag/snap physics
 */
export function FloatingDraggableChatbot() {
  const theme = useTheme();
  const { settings } = useSettings();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const pathname = usePathname();
  const { width: screenWidth, height: screenHeight } = useWindowDimensions();

  // If currently on the chat screen, do not show the floating dumbbell
  const isChatScreen = pathname?.includes('chat');

  // Boundaries for safe dragging
  const minX = EDGE_MARGIN;
  const maxX = screenWidth - BUTTON_SIZE - EDGE_MARGIN;
  const minY = Math.max(insets.top + 12, 40);
  const maxY = screenHeight - (insets.bottom + TAB_BAR_HEIGHT + TAB_BAR_GAP + BUTTON_SIZE + 14);

  // Initial placement near bottom-right edge above the floating tab bar
  const defaultX = maxX;
  const defaultY = Math.max(minY, maxY - 36);

  // Animated values initialized via useState for React Compiler / React 19 safety
  const [pan] = useState(() => new Animated.ValueXY({ x: defaultX, y: defaultY }));
  const [scale] = useState(() => new Animated.Value(1));
  const [isDragging, setIsDragging] = useState(false);

  // Idle hopping, tilt, and side-aura energy pulse animations
  const [bounceAnim] = useState(() => new Animated.Value(0));
  const [tiltAnim] = useState(() => new Animated.Value(0));
  const [pulseAnim] = useState(() => new Animated.Value(0));

  const preset = COLOR_PRESETS[settings.colorScheme || 'rose'] || COLOR_PRESETS.rose;

  // Adjust default position if dimensions change
  useEffect(() => {
    pan.setValue({ x: defaultX, y: defaultY });
  }, [defaultX, defaultY, pan]);

  // Continuous side energy aura pulse loop
  useEffect(() => {
    if (isChatScreen) {
      pulseAnim.setValue(0);
      return;
    }

    const pulseLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1100,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 0,
          duration: 1100,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ])
    );

    pulseLoop.start();
    return () => {
      pulseLoop.stop();
    };
  }, [isChatScreen, pulseAnim]);

  // Dynamic hopping / levitation loop when idle ("natalon ng konti")
  useEffect(() => {
    if (isDragging || isChatScreen) {
      bounceAnim.setValue(0);
      tiltAnim.setValue(0);
      return;
    }

    const hopSequence = Animated.loop(
      Animated.sequence([
        Animated.delay(1400),
        Animated.parallel([
          Animated.sequence([
            Animated.timing(bounceAnim, {
              toValue: -11,
              duration: 240,
              easing: Easing.out(Easing.cubic),
              useNativeDriver: true,
            }),
            Animated.timing(bounceAnim, {
              toValue: 0,
              duration: 210,
              easing: Easing.in(Easing.quad),
              useNativeDriver: true,
            }),
            Animated.timing(bounceAnim, {
              toValue: -4,
              duration: 130,
              easing: Easing.out(Easing.quad),
              useNativeDriver: true,
            }),
            Animated.timing(bounceAnim, {
              toValue: 0,
              duration: 130,
              easing: Easing.in(Easing.quad),
              useNativeDriver: true,
            }),
          ]),
          Animated.sequence([
            Animated.timing(tiltAnim, {
              toValue: -1,
              duration: 240,
              easing: Easing.out(Easing.quad),
              useNativeDriver: true,
            }),
            Animated.timing(tiltAnim, {
              toValue: 0,
              duration: 210,
              easing: Easing.in(Easing.quad),
              useNativeDriver: true,
            }),
            Animated.timing(tiltAnim, {
              toValue: 0.45,
              duration: 130,
              easing: Easing.out(Easing.quad),
              useNativeDriver: true,
            }),
            Animated.timing(tiltAnim, {
              toValue: 0,
              duration: 130,
              easing: Easing.in(Easing.quad),
              useNativeDriver: true,
            }),
          ]),
        ]),
      ])
    );

    hopSequence.start();

    return () => {
      hopSequence.stop();
    };
  }, [isDragging, isChatScreen, bounceAnim, tiltAnim]);

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: (_, gestureState) => {
          return Math.hypot(gestureState.dx, gestureState.dy) > 4;
        },
        onPanResponderGrant: () => {
          setIsDragging(true);
          pan.extractOffset();

          Animated.spring(scale, {
            toValue: 1.15,
            friction: 5,
            useNativeDriver: false,
          }).start();
        },
        onPanResponderMove: Animated.event([null, { dx: pan.x, dy: pan.y }], {
          useNativeDriver: false,
        }),
        onPanResponderRelease: (_, gestureState) => {
          setIsDragging(false);
          pan.flattenOffset();

          Animated.spring(scale, {
            toValue: 1,
            friction: 6,
            useNativeDriver: false,
          }).start();

          const moveDistance = Math.hypot(gestureState.dx, gestureState.dy);

          // Tap detected -> open Chatbot
          if (moveDistance < 6) {
            router.push('/(tabs)/chat');
            return;
          }

          // Snap to nearest edge (Magnetic Snap)
          pan.stopAnimation((pos) => {
            const middleX = screenWidth / 2;
            const snapTargetX = pos.x < middleX ? minX : maxX;
            const clampedY = Math.min(Math.max(pos.y, minY), maxY);

            Animated.spring(pan, {
              toValue: { x: snapTargetX, y: clampedY },
              friction: 7,
              tension: 42,
              useNativeDriver: false,
            }).start();
          });
        },
      }),
    [pan, scale, screenWidth, minX, maxX, minY, maxY, router]
  );

  const tiltInterpolation = tiltAnim.interpolate({
    inputRange: [-1, 0, 1],
    outputRange: ['-8deg', '0deg', '8deg'],
  });

  const auraScale = pulseAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.96, 1.12],
  });

  const auraOpacity = pulseAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.55, 1],
  });

  if (isChatScreen) {
    return null;
  }

  return (
    <Animated.View
      {...panResponder.panHandlers}
      accessibilityRole="button"
      accessibilityLabel="Open PeakFit AI Sports Coach"
      accessibilityHint="Tap to consult your AI Coach or drag to reposition"
      style={[
        styles.container,
        {
          transform: [
            { translateX: pan.x },
            { translateY: pan.y },
            { scale },
          ],
        },
      ]}
    >
      <Animated.View
        style={[
          styles.animatedWrap,
          {
            shadowColor: theme.glow,
            transform: [
              { translateY: bounceAnim },
              { rotate: tiltInterpolation },
            ],
          },
          isDragging && styles.draggingGlow,
        ]}
      >
        {/* Layer 1: Animated Pulsing Side Energy Effects (Shockwaves, Lightning Arcs & Sparks) */}
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
          <Svg width={BUTTON_SIZE} height={BUTTON_SIZE} viewBox="0 0 80 80">
            <Defs>
              <RadialGradient id="auraHalo" cx="50%" cy="50%" rx="50%" ry="50%">
                <Stop offset="0%" stopColor={theme.tint} stopOpacity="0.42" />
                <Stop offset="55%" stopColor={theme.glow} stopOpacity="0.18" />
                <Stop offset="100%" stopColor={theme.glow} stopOpacity="0" />
              </RadialGradient>
            </Defs>

            {/* Soft borderless radial mana aura behind dumbbell */}
            <Circle cx="40" cy="42" r="36" fill="url(#auraHalo)" />

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
            {/* Left side energy wing spikes */}
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
            {/* Right side energy wing spikes */}
            <Path
              d="M 68 20 L 74 15 M 72 42 L 78 42 M 68 64 L 74 69"
              stroke={preset.borderGlow}
              strokeWidth="2"
              strokeLinecap="round"
            />
            <Circle cx="75.5" cy="24" r="1.8" fill="#FFFFFF" />
            <Circle cx="76.5" cy="59" r="1.6" fill={preset.borderGlow} />
          </Svg>
        </Animated.View>

        {/* Layer 2: Crisp Foreground Monarch Cyber-Dumbbell (No Box Background) */}
        <Svg width={BUTTON_SIZE} height={BUTTON_SIZE} viewBox="0 0 80 80">
          <Defs>
            <LinearGradient id="outerPlateGrad" x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0%" stopColor={preset.borderGlow} stopOpacity="1" />
              <Stop offset="45%" stopColor={theme.tint} stopOpacity="1" />
              <Stop offset="100%" stopColor={preset.secondary} stopOpacity="1" />
            </LinearGradient>
            <LinearGradient id="innerPlateGrad" x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0%" stopColor="#FFFFFF" stopOpacity="1" />
              <Stop offset="55%" stopColor={preset.borderGlow} stopOpacity="1" />
              <Stop offset="100%" stopColor={theme.tint} stopOpacity="1" />
            </LinearGradient>
            <LinearGradient id="crownGrad" x1="0" y1="0" x2="1" y2="1">
              <Stop offset="0%" stopColor="#FFFFFF" stopOpacity="1" />
              <Stop offset="100%" stopColor={preset.borderGlow} stopOpacity="1" />
            </LinearGradient>
          </Defs>

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
            stroke="url(#crownGrad)"
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

          {/* Heavy Cyber-Dumbbell Central Bar (with dark contrast armor casing so it pops on any screen) */}
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
            fill="url(#innerPlateGrad)"
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
            fill="url(#outerPlateGrad)"
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
            fill="url(#innerPlateGrad)"
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
            fill="url(#outerPlateGrad)"
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
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: BUTTON_SIZE,
    height: BUTTON_SIZE,
    zIndex: 9999,
    elevation: 24,
  },
  animatedWrap: {
    width: BUTTON_SIZE,
    height: BUTTON_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.9,
    shadowRadius: 16,
  },
  draggingGlow: {
    shadowOpacity: 1,
    shadowRadius: 24,
  },
});
