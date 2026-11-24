import React, { useEffect, useState } from 'react';
import {
  Animated,
  Easing,
  Pressable,
  StyleSheet,
  View,
} from 'react-native';
import Svg, {
  Defs,
  LinearGradient,
  Line,
  Rect,
  Stop,
} from 'react-native-svg';
import { MonarchCyberVisual } from '@/components/MonarchCyberVisual';

const DUMBBELLS_BG = require('../../assets/images/gym_dumbbells_dark.jpg');

interface FloatingDumbbellProps {
  left: `${number}%` | number;
  top: `${number}%` | number;
  size: number;
  baseRotation: number;
  opacity: number;
  floatDistance: number;
  duration: number;
  delay: number;
}

function FloatingDumbbell({
  left,
  top,
  size,
  baseRotation,
  opacity,
  floatDistance,
  duration,
  delay,
}: FloatingDumbbellProps) {
  const [anim] = useState(() => new Animated.Value(0));

  useEffect(() => {
    let loopAnimation: Animated.CompositeAnimation | null = null;
    const startTimeout = setTimeout(() => {
      loopAnimation = Animated.loop(
        Animated.sequence([
          Animated.timing(anim, {
            toValue: 1,
            duration: duration / 2,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
          Animated.timing(anim, {
            toValue: 0,
            duration: duration / 2,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
        ])
      );
      loopAnimation.start();
    }, delay);

    return () => {
      clearTimeout(startTimeout);
      loopAnimation?.stop();
    };
  }, [anim, duration, delay]);

  const translateY = anim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -floatDistance],
  });

  const rotate = anim.interpolate({
    inputRange: [0, 1],
    outputRange: [`${baseRotation}deg`, `${baseRotation + 8}deg`],
  });

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        styles.dumbbellWrapper,
        {
          left,
          top,
          opacity,
          transform: [{ translateY }, { rotate }],
        },
      ]}
    >
      <Svg width={size} height={size} viewBox="0 0 32 32" fill="none">
        {/* Dumbbell central bar */}
        <Line
          x1="6"
          y1="16"
          x2="26"
          y2="16"
          stroke="#FFFFFF"
          strokeWidth="2.4"
          strokeLinecap="round"
        />
        {/* Left outer weight plate */}
        <Rect x="4" y="9.5" width="3.2" height="13" rx="1.5" fill="#FFFFFF" />
        {/* Left inner weight plate */}
        <Rect x="8.5" y="11.5" width="2.4" height="9" rx="1" fill="#FFFFFF" />
        {/* Right inner weight plate */}
        <Rect x="21.1" y="11.5" width="2.4" height="9" rx="1" fill="#FFFFFF" />
        {/* Right outer weight plate */}
        <Rect x="24.8" y="9.5" width="3.2" height="13" rx="1.5" fill="#FFFFFF" />
      </Svg>
    </Animated.View>
  );
}

const DUMBBELL_CONFIGS: FloatingDumbbellProps[] = [
  { left: '10%', top: '10%', size: 34, baseRotation: -22, opacity: 0.18, floatDistance: 14, duration: 4200, delay: 0 },
  { left: '76%', top: '12%', size: 40, baseRotation: 26, opacity: 0.16, floatDistance: 18, duration: 4800, delay: 350 },
  { left: '46%', top: '22%', size: 26, baseRotation: -12, opacity: 0.12, floatDistance: 12, duration: 3700, delay: 700 },
  { left: '84%', top: '30%', size: 32, baseRotation: 34, opacity: 0.14, floatDistance: 16, duration: 5100, delay: 200 },
  { left: '12%', top: '36%', size: 28, baseRotation: -28, opacity: 0.13, floatDistance: 14, duration: 4000, delay: 500 },
];

interface PreOnboardingSplashProps {
  onFinish: () => void;
}

export function PreOnboardingSplash({ onFinish }: PreOnboardingSplashProps) {
  // Gentle ambient floating / breathing motion for the background dumbbell imagery
  const [bgAnim] = useState(() => new Animated.Value(0));

  // Entrance animation for the enlarged logo squircle
  const [fadeAnim] = useState(() => new Animated.Value(0));
  const [scaleAnim] = useState(() => new Animated.Value(0.90));

  useEffect(() => {
    // Ambient floating animation for background image
    const bgLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(bgAnim, {
          toValue: 1,
          duration: 4800,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(bgAnim, {
          toValue: 0,
          duration: 4800,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ])
    );
    bgLoop.start();

    // Elegant entrance: fade in & scale to 1
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 750,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 7,
        tension: 38,
        useNativeDriver: true,
      }),
    ]).start();

    // Auto-advance smoothly after 2.6 seconds
    const timer = setTimeout(() => {
      onFinish();
    }, 2600);

    return () => {
      clearTimeout(timer);
      bgLoop.stop();
    };
  }, [bgAnim, fadeAnim, scaleAnim, onFinish]);

  const bgTranslateY = bgAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -12],
  });

  const bgScale = bgAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [1.02, 1.07],
  });

  return (
    <Pressable
      style={styles.container}
      onPress={onFinish}
      accessibilityRole="button"
      accessibilityLabel="Tap to continue"
    >
      {/* Upper Half: Moving Dumbbells Imagery & Floating Silhouettes */}
      <View style={styles.upperAmbience} pointerEvents="none">
        <Animated.Image
          source={DUMBBELLS_BG}
          style={[
            styles.backgroundImage,
            {
              transform: [
                { translateY: bgTranslateY },
                { scale: bgScale },
              ],
            },
          ]}
          resizeMode="cover"
        />

        {/* Ambient floating accent dumbbells */}
        {DUMBBELL_CONFIGS.map((item, index) => (
          <FloatingDumbbell key={index} {...item} />
        ))}
      </View>

      {/* Gradient Overlay: Upper dumbbell scene smoothly dissolves into solid Main Background */}
      <Svg style={StyleSheet.absoluteFill} pointerEvents="none">
        <Defs>
          <LinearGradient id="blackFade" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0%" stopColor="#08080B" stopOpacity="0.05" />
            <Stop offset="22%" stopColor="#08080B" stopOpacity="0.25" />
            <Stop offset="42%" stopColor="#08080B" stopOpacity="0.75" />
            <Stop offset="54%" stopColor="#08080B" stopOpacity="1" />
            <Stop offset="100%" stopColor="#08080B" stopOpacity="1" />
          </LinearGradient>
        </Defs>
        <Rect x="0" y="0" width="100%" height="100%" fill="url(#blackFade)" />
      </Svg>

      {/* Center: Enlarged Minimalist iPhone-Style Logo Squircle */}
      <Animated.View
        style={[
          styles.logoSquircle,
          {
            opacity: fadeAnim,
            transform: [{ scale: scaleAnim }],
          },
        ]}
      >
        <MonarchCyberVisual
          variant="dumbbell"
          size={84}
          animated={false}
          idPrefix="splash_logo"
        />
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#08080B', // Main Background
    justifyContent: 'center',
    alignItems: 'center',
  },
  upperAmbience: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '54%',
    overflow: 'hidden',
  },
  backgroundImage: {
    width: '100%',
    height: '100%',
  },
  dumbbellWrapper: {
    position: 'absolute',
  },
  // Enlarged Apple Squircle Container (104x104 with 28px continuous corner radius)
  logoSquircle: {
    width: 104,
    height: 104,
    borderRadius: 28,
    backgroundColor: '#151116',
    borderWidth: 1.2,
    borderColor: '#F0BCD2',
    justifyContent: 'center',
    alignItems: 'center',
    // Soft Rose Pink edge glow
    shadowColor: '#D982A5',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.85,
    shadowRadius: 24,
    elevation: 10,
  },
});
