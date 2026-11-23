import { Ionicons } from '@expo/vector-icons';
import { usePathname, useRouter } from 'expo-router';
import React, { useEffect, useMemo, useState } from 'react';
import {
  Animated,
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
 * Premium Rose Pink Floating Draggable Chatbot.
 * Features:
 * - Fluid drag-and-drop gesture across screen boundaries
 * - Magnetic spring snap to left/right device edges on release
 * - Tactile scale-up feedback during interaction
 * - Luminous white-pink edge highlight & radial neon rose glow
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

  // Adjust default position if dimensions change
  useEffect(() => {
    pan.setValue({ x: defaultX, y: defaultY });
  }, [defaultX, defaultY, pan]);

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

  if (isChatScreen) {
    return null;
  }

  return (
    <Animated.View
      {...panResponder.panHandlers}
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
      <View
        style={[
          styles.bubble,
          {
            backgroundColor: settings.theme === 'dark' ? '#151116FA' : '#FFFFFFFA',
            borderColor: theme.borderRose,
            shadowColor: theme.glow,
            shadowOpacity: settings.theme === 'dark' ? 0.75 : 0.45,
          },
          isDragging && styles.bubbleDragging,
        ]}
      >
        <Ionicons name="chatbubble-ellipses" size={26} color={theme.tint} />

        {/* Status Live Indicator Dot */}
        <View style={[styles.statusDot, { backgroundColor: theme.success }]} />
      </View>
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
  },
  bubble: {
    width: BUTTON_SIZE,
    height: BUTTON_SIZE,
    borderRadius: 20,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.85,
    shadowRadius: 18,
    elevation: 12,
  },
  bubbleDragging: {
    shadowOpacity: 1,
    shadowRadius: 24,
    elevation: 16,
  },
  statusDot: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 9,
    height: 9,
    borderRadius: 4.5,
    borderWidth: 1.5,
    borderColor: '#151116',
  },
});

