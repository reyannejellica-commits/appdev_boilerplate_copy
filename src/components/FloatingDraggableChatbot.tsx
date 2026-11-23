import { MaterialCommunityIcons } from '@expo/vector-icons';
import { usePathname, useRouter } from 'expo-router';
import React, { useEffect, useMemo, useState } from 'react';
import {
  Animated,
  Easing,
  PanResponder,
  StyleSheet,
  View,
  useWindowDimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { TAB_BAR_GAP, TAB_BAR_HEIGHT } from './FloatingTabBar';
import { useSettings } from '@/settings/SettingsContext';
import { useTheme } from '@/theme';

const BUTTON_SIZE = 58;
const EDGE_MARGIN = 16;

/**
 * Premium Draggable Dumbbell AI Chatbot.
 * Features:
 * - Iconic fitness Dumbbell icon with dynamic glow
 * - Playful idle hopping / bouncing animation ("natalon ng konti")
 * - Fluid drag-and-drop gesture across screen boundaries
 * - Magnetic spring snap to left/right device edges on release
 * - Tactile scale-up feedback during interaction
 * - Luminous neon aura glow matching active theme
 * - Tap detection (navigation to Coach chat)
 */
export function FloatingDraggableChatbot() {
  const theme = useTheme();
  const { settings } = useSettings();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const pathname = usePathname();
  const { width: screenWidth, height: screenHeight } = useWindowDimensions();

  // If currently on the chat screen, do not show the floating bubble
  const isChatScreen = pathname?.includes('chat');

  // Boundaries for safe dragging
  const minX = EDGE_MARGIN;
  const maxX = screenWidth - BUTTON_SIZE - EDGE_MARGIN;
  const minY = Math.max(insets.top + 12, 40);
  const maxY = screenHeight - (insets.bottom + TAB_BAR_HEIGHT + TAB_BAR_GAP + BUTTON_SIZE + 16);

  // Initial placement near bottom-right edge above the floating tab bar
  const defaultX = maxX;
  const defaultY = Math.max(minY, maxY - 40);

  // Animated values initialized via useState for React Compiler / React 19 safety
  const [pan] = useState(() => new Animated.ValueXY({ x: defaultX, y: defaultY }));
  const [scale] = useState(() => new Animated.Value(1));
  const [isDragging, setIsDragging] = useState(false);

  // Playful idle hopping / jumping animations
  const [bounceAnim] = useState(() => new Animated.Value(0));
  const [tiltAnim] = useState(() => new Animated.Value(0));

  // Adjust default position if dimensions change
  useEffect(() => {
    pan.setValue({ x: defaultX, y: defaultY });
  }, [defaultX, defaultY, pan]);

  // Gentle hopping / jumping loop when idle
  useEffect(() => {
    if (isDragging || isChatScreen) {
      bounceAnim.setValue(0);
      tiltAnim.setValue(0);
      return;
    }

    const hopSequence = Animated.loop(
      Animated.sequence([
        // Idle rest pause between hops
        Animated.delay(1600),

        // Gentle hop up & land with subtle tilt
        Animated.parallel([
          Animated.sequence([
            Animated.timing(bounceAnim, {
              toValue: -9,
              duration: 250,
              easing: Easing.out(Easing.quad),
              useNativeDriver: true,
            }),
            Animated.timing(bounceAnim, {
              toValue: 0,
              duration: 220,
              easing: Easing.in(Easing.quad),
              useNativeDriver: true,
            }),
            // Soft landing rebound
            Animated.timing(bounceAnim, {
              toValue: -3,
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
              duration: 250,
              easing: Easing.out(Easing.quad),
              useNativeDriver: true,
            }),
            Animated.timing(tiltAnim, {
              toValue: 0,
              duration: 220,
              easing: Easing.in(Easing.quad),
              useNativeDriver: true,
            }),
            Animated.timing(tiltAnim, {
              toValue: 0.4,
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
          // Only treat as drag if finger moved more than 4px
          return Math.hypot(gestureState.dx, gestureState.dy) > 4;
        },
        onPanResponderGrant: () => {
          setIsDragging(true);
          pan.extractOffset();

          // Tactile scale-up
          Animated.spring(scale, {
            toValue: 1.1,
            friction: 6,
            useNativeDriver: false,
          }).start();
        },
        onPanResponderMove: Animated.event([null, { dx: pan.x, dy: pan.y }], {
          useNativeDriver: false,
        }),
        onPanResponderRelease: (_, gestureState) => {
          setIsDragging(false);
          pan.flattenOffset();

          // Scale back to normal
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

          // Snap to nearest edge (Magnetic Snap) using stopAnimation callback
          pan.stopAnimation((pos) => {
            const middleX = screenWidth / 2;
            const snapTargetX = pos.x < middleX ? minX : maxX;
            const clampedY = Math.min(Math.max(pos.y, minY), maxY);

            Animated.spring(pan, {
              toValue: { x: snapTargetX, y: clampedY },
              friction: 7,
              tension: 40,
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
          styles.bubble,
          {
            backgroundColor: settings.theme === 'dark' ? '#141217FA' : '#FFFFFFAA',
            borderColor: theme.tint,
            shadowColor: theme.glow,
            shadowOpacity: settings.theme === 'dark' ? 0.85 : 0.5,
            transform: [
              { translateY: bounceAnim },
              { rotate: tiltInterpolation },
            ],
          },
          isDragging && styles.bubbleDragging,
        ]}
      >
        {/* Subtle radial inner glow backdrop */}
        <View
          style={[
            styles.innerGlow,
            { backgroundColor: `${theme.tint}18` },
          ]}
        />
        {/* Dumbbell Icon */}
        <MaterialCommunityIcons name="dumbbell" size={27} color={theme.tint} />

        {/* Status Live Indicator Dot */}
        <View
          style={[
            styles.statusDot,
            {
              backgroundColor: theme.success,
              borderColor: settings.theme === 'dark' ? '#151116' : '#FFFFFF',
            },
          ]}
        />
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
    elevation: 20,
  },
  bubble: {
    width: BUTTON_SIZE,
    height: BUTTON_SIZE,
    borderRadius: 22,
    borderWidth: 1.8,
    alignItems: 'center',
    justifyContent: 'center',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.85,
    shadowRadius: 18,
    elevation: 14,
    overflow: 'hidden',
  },
  innerGlow: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  bubbleDragging: {
    shadowOpacity: 1,
    shadowRadius: 26,
    elevation: 18,
  },
  statusDot: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 9,
    height: 9,
    borderRadius: 4.5,
    borderWidth: 1.5,
  },
});

