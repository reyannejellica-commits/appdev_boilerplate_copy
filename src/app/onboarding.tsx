import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import {
  KeyboardAvoidingView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button } from '@/components/Button';
import { SmoothPressable } from '@/components/SmoothPressable';
import { getHunterProfile, updateHunterName } from '@/db/hunter';
import { useSettings } from '@/settings/SettingsContext';
import { useTheme } from '@/theme';

type IconName = React.ComponentProps<typeof Ionicons>['name'];

interface Slide {
  icon: IconName;
  badge: string;
  title: string;
  body: string;
}

const SLIDES: Slide[] = [
  {
    icon: 'barbell-outline',
    badge: 'PROTOCOL 01',
    title: 'Push, Pull, Legs (PPL)',
    body: 'Scientific hypertrophy and strength splits. Track your sets, weights, and reps in real time with progressive overload.',
  },
  {
    icon: 'flash-outline',
    badge: 'PROTOCOL 02',
    title: 'Daily Hunter Quests',
    body: 'Complete daily push-ups, squats, sit-ups, and cardio. Earn EXP, level up your stats, and maintain your streak.',
  },
  {
    icon: 'hardware-chip-outline',
    badge: 'PROTOCOL 03',
    title: '100% Offline AI Coach',
    body: 'The System runs entirely on your phone with local Gemma 4 E2B AI or cloud Gemini. Zero cloud tracking, total privacy.',
  },
];

export default function OnboardingScreen() {
  const theme = useTheme();
  const { settings, update } = useSettings();

  // Mode: 'boot' -> 'slides' -> 'hunter_name'
  const [bootProgress, setBootProgress] = useState(24);
  const [isBootDone, setIsBootDone] = useState(false);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [nickname, setNickname] = useState(settings.nickname || '');

  // Simulate system core initialization
  useEffect(() => {
    const timer = setInterval(() => {
      setBootProgress((prev) => {
        if (prev >= 100) {
          clearInterval(timer);
          setIsBootDone(true);
          return 100;
        }
        return prev + 12;
      });
    }, 250);
    return () => clearInterval(timer);
  }, []);

  const trimmed = nickname.trim();

  const handleFinish = async () => {
    const finalName = trimmed || 'Hunter';
    update('nickname', finalName);
    update('onboarded', true);
    try {
      await getHunterProfile(finalName);
      await updateHunterName(finalName);
    } catch (e) {
      console.warn('Failed to seed hunter profile:', e);
    }
  };

  // 1. SYSTEM BOOT SEQUENCE SCREEN (Matches Figma mockup)
  if (!isBootDone) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
        <View style={styles.bootCenter}>
          <View
            style={[
              styles.bootCard,
              { backgroundColor: theme.card, borderColor: theme.border },
            ]}
          >
            {/* Top Badge */}
            <View style={styles.bootPill}>
              <Text style={[styles.bootPillText, { color: theme.textSecondary }]}>
                [SYSTEM BOOT SEQUENCE]
              </Text>
              <View style={[styles.cyanDot, { backgroundColor: theme.accentCyan }]} />
            </View>

            {/* Glowing Emblem */}
            <View style={styles.avatarGlowWrapper}>
              <View style={[styles.avatarRing, { borderColor: theme.tint, shadowColor: theme.tint }]}>
                <Ionicons name="shield-checkmark" size={44} color="#FFFFFF" />
              </View>
            </View>

            {/* Title & Subtitle */}
            <View style={styles.titleBlock}>
              <Text style={[styles.brandTitle, { color: '#FFFFFF' }]}>PEAKFIT</Text>
              <Text style={[styles.brandSubtitle, { color: theme.textSecondary }]}>
                PEAK LEVELING FITNESS SYSTEM
              </Text>
            </View>

            {/* Progress Bar with Runner Icon */}
            <View style={styles.progressContainer}>
              <View style={styles.runnerTrack}>
                <View
                  style={[
                    styles.runnerIconPos,
                    { left: `${Math.max(0, Math.min(92, bootProgress - 5))}%` },
                  ]}
                >
                  <Ionicons name="walk" size={16} color={theme.accentCyan} />
                </View>
                <View style={[styles.progressBarTrack, { backgroundColor: theme.surface }]}>
                  <View
                    style={[
                      styles.progressBarFill,
                      {
                        width: `${bootProgress}%`,
                        backgroundColor: theme.tint,
                      },
                    ]}
                  />
                </View>
              </View>

              <View style={styles.progressLabelRow}>
                <Text style={[styles.progressStatusText, { color: theme.textSecondary }]}>
                  INITIALIZING SYSTEM CORE...
                </Text>
                <Text style={[styles.progressPercentText, { color: theme.accentCyan }]}>
                  {bootProgress}%
                </Text>
              </View>
            </View>

            {/* Footer Protocol Badge */}
            <View style={styles.bootFooterRow}>
              <Text style={[styles.bootFooterText, { color: theme.textDim }]}>
                100% OFFLINE • SOLO LEVELING PROTOCOL
              </Text>
            </View>

            {/* Skip / Fast Forward Button */}
            <SmoothPressable
              onPress={() => setIsBootDone(true)}
              style={[styles.skipBootButton, { backgroundColor: theme.surface, borderColor: theme.border }]}
            >
              <Text style={[styles.skipBootText, { color: theme.textSecondary }]}>
                Bypass Sequence
              </Text>
            </SmoothPressable>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  // 2. SLIDES & HUNTER AWAKENING
  const isHunterStep = currentSlide === SLIDES.length;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <KeyboardAvoidingView style={styles.flex} behavior="padding">
        <View style={styles.content}>
          {isHunterStep ? (
            <View style={styles.slideCard}>
              <View style={[styles.iconCircle, { backgroundColor: theme.surface, borderColor: theme.tint }]}>
                <Ionicons name="person" size={48} color={theme.tint} />
              </View>

              <View style={[styles.badge, { backgroundColor: theme.surface, borderColor: theme.tint }]}>
                <Text style={[styles.badgeText, { color: theme.tint }]}>AWAKENING</Text>
              </View>

              <Text style={[styles.slideTitle, { color: theme.text }]}>
                Identify Yourself, Hunter
              </Text>
              <Text style={[styles.slideBody, { color: theme.textSecondary }]}>
                The System will log your quests, track your attributes, and calibrate your offline AI training protocols.
              </Text>

              <TextInput
                accessibilityLabel="Hunter Name"
                value={nickname}
                onChangeText={setNickname}
                placeholder="e.g. John Mark"
                placeholderTextColor={theme.textDim}
                autoFocus
                maxLength={30}
                returnKeyType="done"
                onSubmitEditing={() => trimmed && handleFinish()}
                style={[
                  styles.input,
                  {
                    color: theme.text,
                    backgroundColor: theme.surface,
                    borderColor: theme.border,
                  },
                ]}
              />

              <View style={[styles.rankBox, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                <Ionicons name="shield-outline" size={18} color={theme.accentGold} />
                <Text style={[styles.rankText, { color: theme.textSecondary }]}>
                  Starting Rank: <Text style={{ color: theme.accentGold, fontWeight: '700' }}>E-Rank Hunter (Lv. 1)</Text>
                </Text>
              </View>
            </View>
          ) : (
            <View style={styles.slideCard}>
              <View style={[styles.iconCircle, { backgroundColor: theme.surface, borderColor: theme.tint }]}>
                <Ionicons name={SLIDES[currentSlide].icon} size={48} color={theme.tint} />
              </View>

              <View style={[styles.badge, { backgroundColor: theme.surface, borderColor: theme.accentCyan }]}>
                <Text style={[styles.badgeText, { color: theme.accentCyan }]}>
                  {SLIDES[currentSlide].badge}
                </Text>
              </View>

              <Text style={[styles.slideTitle, { color: theme.text }]}>
                {SLIDES[currentSlide].title}
              </Text>
              <Text style={[styles.slideBody, { color: theme.textSecondary }]}>
                {SLIDES[currentSlide].body}
              </Text>
            </View>
          )}
        </View>

        {/* Step Indicator Dots */}
        <View style={styles.dots}>
          {[...SLIDES, null].map((_, i) => (
            <View
              key={i}
              style={[
                styles.dot,
                {
                  backgroundColor: i === currentSlide ? theme.tint : theme.border,
                  width: i === currentSlide ? 20 : 8,
                },
              ]}
            />
          ))}
        </View>

        {/* Footer Navigation */}
        <View style={styles.footer}>
          <Button
            label={currentSlide > 0 ? 'Back' : 'Back to Boot'}
            variant="secondary"
            onPress={() => (currentSlide > 0 ? setCurrentSlide(currentSlide - 1) : setIsBootDone(false))}
          />
          <Button
            label={isHunterStep ? 'Initiate Protocol' : 'Next'}
            onPress={() => (isHunterStep ? handleFinish() : setCurrentSlide(currentSlide + 1))}
          />
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  flex: { flex: 1 },

  // Boot sequence styles
  bootCenter: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  bootCard: {
    width: '100%',
    maxWidth: 380,
    borderRadius: 24,
    borderWidth: 1.5,
    padding: 24,
    alignItems: 'center',
    gap: 20,
    shadowColor: '#8B5CF6',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 24,
    elevation: 8,
  },
  bootPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  bootPillText: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.5,
  },
  cyanDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  avatarGlowWrapper: {
    marginVertical: 4,
  },
  avatarRing: {
    width: 88,
    height: 88,
    borderRadius: 44,
    borderWidth: 2.5,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1E1538',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 16,
    elevation: 10,
  },
  titleBlock: {
    alignItems: 'center',
    gap: 6,
  },
  brandTitle: {
    fontSize: 28,
    fontWeight: '900',
    letterSpacing: 2,
  },
  brandSubtitle: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.2,
  },
  progressContainer: {
    width: '100%',
    gap: 8,
    marginTop: 4,
  },
  runnerTrack: {
    position: 'relative',
    height: 22,
    justifyContent: 'flex-end',
  },
  runnerIconPos: {
    position: 'absolute',
    top: 0,
    zIndex: 2,
  },
  progressBarTrack: {
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
    width: '100%',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 3,
  },
  progressLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  progressStatusText: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.8,
  },
  progressPercentText: {
    fontSize: 12,
    fontWeight: '800',
  },
  bootFooterRow: {
    marginTop: 2,
  },
  bootFooterText: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1,
  },
  skipBootButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
    marginTop: 4,
  },
  skipBootText: {
    fontSize: 12,
    fontWeight: '600',
  },

  // Slides styles
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  slideCard: {
    width: '100%',
    alignItems: 'center',
    gap: 14,
  },
  iconCircle: {
    width: 84,
    height: 84,
    borderRadius: 42,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  badge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1,
  },
  slideTitle: {
    fontSize: 24,
    fontWeight: '800',
    textAlign: 'center',
  },
  slideBody: {
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 22,
    maxWidth: 320,
  },
  input: {
    alignSelf: 'stretch',
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    marginTop: 8,
  },
  rankBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    alignSelf: 'stretch',
    justifyContent: 'center',
    marginTop: 4,
  },
  rankText: {
    fontSize: 13,
  },
  dots: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
    marginBottom: 20,
  },
  dot: {
    height: 8,
    borderRadius: 4,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingBottom: 24,
  },
});
