import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  BackHandler,
  Dimensions,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Defs, LinearGradient, RadialGradient, Rect, Stop } from 'react-native-svg';
import { MonarchCyberVisual } from '@/components/MonarchCyberVisual';
import { PreOnboardingSplash } from '@/components/PreOnboardingSplash';
import { SmoothPressable } from '@/components/SmoothPressable';
import { getHunterProfile, updateHunterName } from '@/db/hunter';
import { useTranslation } from '@/i18n';
import { useSettings } from '@/settings/SettingsContext';
import { FONTS, useTheme } from '@/theme';

// Distinct fitness equipment background images per slide
const BG_IMAGES = [
  require('../../assets/images/gym_dumbbells_dark.jpg'),
  require('../../assets/images/gym_quests_dark.jpg'),
  require('../../assets/images/gym_ai_dark.jpg'),
  require('../../assets/images/gym_awakening_dark.jpg'),
];

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const IS_COMPACT = SCREEN_HEIGHT < 720;
const HERO_SIZE = IS_COMPACT ? 170 : 204;

interface OnboardingSlide {
  badge: string;
  category: string;
  title: string;
  body: string;
  highlights: string[];
}

const SLIDES: OnboardingSlide[] = [
  {
    badge: 'PROTOCOL 01',
    category: 'HYPERTROPHY ENGINE',
    title: 'Push, Pull, Legs (PPL)',
    body: 'Scientific hypertrophy and strength splits. Track your sets, weights, and reps in real time with automated progressive overload.',
    highlights: [
      '⚡ Progressive Overload',
      '🎯 1-2 RIR Benchmarks',
      '⏱️ Smart Rest Timers',
    ],
  },
  {
    badge: 'PROTOCOL 02',
    category: 'DAILY HUNTER QUESTS',
    title: 'Rank Progression & XP',
    body: 'Complete daily push-ups, squats, sit-ups, and cardio. Earn EXP, level up your hunter stats, and unlock exclusive cyber titles in the Vault.',
    highlights: [
      '⚔️ Calisthenics & Cardio',
      '🔥 Streak Multipliers',
      '🪙 Coin Vault Unlocks',
    ],
  },
  {
    badge: 'PROTOCOL 03',
    category: 'OFFLINE INTELLIGENCE',
    title: '100% Offline AI Coach',
    body: 'The System runs entirely on your device with local Gemma 4 E2B AI or cloud Gemini. Zero cloud tracking, instant response, complete privacy.',
    highlights: [
      '🔒 100% Private Offline',
      '🧠 Gemma 4 E2B Local AI',
      '⚡ Zero Latency Coaching',
    ],
  },
];

export default function OnboardingScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { settings, update } = useSettings();
  const { t } = useTranslation();

  // If already onboarded, skip splash
  const [isBootDone, setIsBootDone] = useState(Boolean(settings.onboarded));
  const [currentSlide, setCurrentSlide] = useState(0);
  const [nickname, setNickname] = useState(settings.nickname || '');
  const [submitting, setSubmitting] = useState(false);

  const totalSteps = SLIDES.length + 1; // 3 protocol slides + 1 awakening slide
  const isAwakeningStep = currentSlide === SLIDES.length;

  // Hardware Android Back button support
  useEffect(() => {
    const onBackPress = () => {
      if (currentSlide > 0) {
        setCurrentSlide((s) => s - 1);
        return true;
      }
      if (settings.onboarded) {
        if (router.canGoBack()) {
          router.back();
        } else {
          router.replace('/(tabs)');
        }
        return true;
      }
      return false;
    };

    const sub = BackHandler.addEventListener('hardwareBackPress', onBackPress);
    return () => sub.remove();
  }, [currentSlide, settings.onboarded, router]);

  const trimmed = nickname.trim();

  const handleExitToHub = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/(tabs)');
    }
  };

  const handleFinish = async () => {
    if (submitting) return;
    setSubmitting(true);
    const finalName = trimmed || settings.nickname || 'Hunter';
    try {
      await getHunterProfile(finalName);
      await updateHunterName(finalName);
    } catch (e) {
      console.warn('Failed to seed hunter profile:', e);
    }
    try {
      await update('nickname', finalName);
      await update('onboarded', true);
      handleExitToHub();
    } catch (e) {
      console.warn('Failed to complete onboarding:', e);
    } finally {
      setSubmitting(false);
    }
  };

  // 1. PRE-ONBOARDING MINIMALIST SPLASH SCREEN
  if (!isBootDone) {
    return <PreOnboardingSplash onFinish={() => setIsBootDone(true)} />;
  }

  // Current active fitness background image per slide
  const currentBgImage = BG_IMAGES[currentSlide] || BG_IMAGES[0];

  return (
    <View style={[styles.container, { backgroundColor: '#060409' }]}>
      {/* 
        DISTINCT FITNESS EQUIPMENT BACKGROUND PER SLIDE:
        Tastefully blurred with blurRadius={Platform.OS === 'ios' ? 10 : 6}
        and dark gradient overlay so text and hero crest pop beautifully.
      */}
      <View style={StyleSheet.absoluteFill} pointerEvents="none">
        <Image
          key={`bg_${currentSlide}`}
          source={currentBgImage}
          style={styles.backgroundImage}
          resizeMode="cover"
          blurRadius={Platform.OS === 'ios' ? 10 : 6}
        />
        <Svg
          width="100%"
          height="100%"
          viewBox={`0 0 ${SCREEN_WIDTH} ${SCREEN_HEIGHT}`}
          style={StyleSheet.absoluteFill}
        >
          <Defs>
            <LinearGradient id="gymOverlay" x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0%" stopColor="#060409" stopOpacity="0.48" />
              <Stop offset="28%" stopColor="#060409" stopOpacity="0.32" />
              <Stop offset="60%" stopColor="#060409" stopOpacity="0.75" />
              <Stop offset="88%" stopColor="#060409" stopOpacity="0.95" />
              <Stop offset="100%" stopColor="#060409" stopOpacity="1" />
            </LinearGradient>
            <RadialGradient id="heroAuraBack" cx="50%" cy="28%" rx="55%" ry="35%">
              <Stop offset="0%" stopColor={theme.tint} stopOpacity="0.20" />
              <Stop offset="55%" stopColor={theme.glow} stopOpacity="0.06" />
              <Stop offset="100%" stopColor="#060409" stopOpacity="0" />
            </RadialGradient>
          </Defs>
          <Rect x="0" y="0" width={SCREEN_WIDTH} height={SCREEN_HEIGHT} fill="url(#gymOverlay)" />
          <Rect x="0" y="0" width={SCREEN_WIDTH} height={SCREEN_HEIGHT} fill="url(#heroAuraBack)" />
        </Svg>
      </View>

      <SafeAreaView style={styles.flex}>
        <KeyboardAvoidingView
          style={styles.flex}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          {/* 
            CLEAN MINIMAL HEADER:
            - Back button completely removed as requested ("wag lagyan ng back").
            - No stacked box element on left top side.
            - Only subtle right action (Skip / Hub).
          */}
          <View style={styles.headerBar}>
            <View style={styles.headerLeftEmpty} />

            {/* Right Action: Close if onboarded, or subtle Skip */}
            {settings.onboarded ? (
              <SmoothPressable
                onPress={handleExitToHub}
                style={styles.headerCloseBtn}
                accessibilityRole="button"
                accessibilityLabel={t('close')}
                hitSlop={12}
              >
                <Ionicons name="close" size={18} color={theme.textSecondary} />
              </SmoothPressable>
            ) : (
              <SmoothPressable
                onPress={() => setCurrentSlide(SLIDES.length)}
                style={styles.skipBtn}
                accessibilityRole="button"
                accessibilityLabel="Skip to profile creation"
                hitSlop={12}
              >
                <Text style={[styles.skipText, { color: theme.textSecondary }]}>
                  {currentSlide < SLIDES.length ? 'Skip' : ''}
                </Text>
              </SmoothPressable>
            )}
          </View>

          {/* MAIN SLIDE CONTENT */}
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            bounces={false}
          >
            {/* HERO VISUAL: EXACT MONARCH CYBER-DUMBBELL CIRCULAR BADGE ON ALL SLIDES */}
            <View style={styles.heroWrap}>
              <MonarchCyberVisual
                variant="dumbbell"
                size={HERO_SIZE}
                showDisc
                animated
                idPrefix={`ob_hero_${currentSlide}`}
              />
            </View>

            {isAwakeningStep ? (
              /* SLIDE 4: SIMPLE NICKNAME SETUP (Direct, Modern & Apple-Grade) */
              <View style={styles.cardContainer}>
                <Text style={[styles.titleText, { color: theme.text, marginTop: 12 }]}>
                  Set Your Nickname
                </Text>
                <Text style={[styles.bodyText, { color: theme.textSecondary }]}>
                  How would you like to be called in the app?
                </Text>

                {/* Nickname Input Field */}
                <View
                  style={[
                    styles.inputWrap,
                    {
                      backgroundColor: 'rgba(255, 255, 255, 0.06)',
                      borderColor: theme.border,
                      marginTop: 20,
                    },
                  ]}
                >
                  <Ionicons
                    name="person-outline"
                    size={20}
                    color={theme.tint}
                    style={styles.inputIcon}
                  />
                  <TextInput
                    accessibilityLabel="Nickname"
                    value={nickname}
                    onChangeText={setNickname}
                    placeholder="Enter your nickname..."
                    placeholderTextColor={theme.textDim}
                    autoFocus
                    maxLength={26}
                    returnKeyType="done"
                    onSubmitEditing={() => trimmed && handleFinish()}
                    style={[styles.input, { color: theme.text }]}
                  />
                  {trimmed.length > 0 && (
                    <SmoothPressable
                      onPress={() => setNickname('')}
                      hitSlop={8}
                      style={styles.clearInputBtn}
                    >
                      <Ionicons name="close-circle" size={18} color={theme.textDim} />
                    </SmoothPressable>
                  )}
                </View>
              </View>
            ) : (
              /* SLIDES 1, 2, 3: PROTOCOL SHOWCASE */
              <View style={styles.cardContainer}>
                {/* Category & Protocol Pill Header */}
                <View
                  style={[
                    styles.categoryPill,
                    {
                      backgroundColor: 'rgba(255, 255, 255, 0.06)',
                      borderColor: theme.borderRose,
                    },
                  ]}
                >
                  <View
                    style={[styles.glowingDot, { backgroundColor: theme.tint }]}
                  />
                  <Text style={[styles.categoryPillText, { color: theme.tint }]}>
                    {SLIDES[currentSlide].badge} • {SLIDES[currentSlide].category}
                  </Text>
                </View>

                {/* Slide Title & Body */}
                <Text style={[styles.titleText, { color: theme.text }]}>
                  {SLIDES[currentSlide].title}
                </Text>
                <Text style={[styles.bodyText, { color: theme.textSecondary }]}>
                  {SLIDES[currentSlide].body}
                </Text>

                {/* Modern Feature Highlights Matrix */}
                <View style={styles.highlightsContainer}>
                  {SLIDES[currentSlide].highlights.map((highlight, index) => (
                    <View
                      key={index}
                      style={[
                        styles.highlightChip,
                        {
                          backgroundColor: 'rgba(255, 255, 255, 0.06)',
                          borderColor: 'rgba(255, 255, 255, 0.12)',
                        },
                      ]}
                    >
                      <Text
                        style={[styles.highlightChipText, { color: theme.textSecondary }]}
                      >
                        {highlight}
                      </Text>
                    </View>
                  ))}
                </View>
              </View>
            )}
          </ScrollView>

          {/* BOTTOM PAGINATION DOTS & PRIMARY ACTION BAR */}
          <View style={styles.footerContainer}>
            {/* Minimalist Bottom Capsule Dots */}
            <View style={styles.dotsRow}>
              {Array.from({ length: totalSteps }).map((_, idx) => {
                const isActive = idx === currentSlide;
                return (
                  <View
                    key={idx}
                    style={[
                      styles.dot,
                      {
                        backgroundColor: isActive
                          ? theme.tint
                          : 'rgba(255, 255, 255, 0.18)',
                        width: isActive ? 24 : 7,
                        shadowColor: isActive ? theme.glow : undefined,
                        shadowOpacity: isActive ? 0.75 : 0,
                        shadowRadius: isActive ? 8 : 0,
                      },
                    ]}
                  />
                );
              })}
            </View>

            {/* Primary Action Button */}
            <SmoothPressable
              onPress={() =>
                isAwakeningStep ? handleFinish() : setCurrentSlide((s) => s + 1)
              }
              disabled={submitting}
              style={[
                styles.primaryBtn,
                {
                  backgroundColor: theme.buttonPrimary,
                  borderColor: theme.borderRose,
                  shadowColor: theme.glow,
                },
              ]}
            >
              <Text style={[styles.primaryBtnText, { color: theme.buttonPrimaryText }]}>
                {isAwakeningStep
                  ? settings.onboarded
                    ? t('returnToHub')
                    : 'Initiate Hunter Protocol'
                  : 'Continue'}
              </Text>
              <Ionicons
                name={isAwakeningStep ? 'flash' : 'arrow-forward'}
                size={18}
                color={theme.buttonPrimaryText}
              />
            </SmoothPressable>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  flex: {
    flex: 1,
  },
  backgroundImage: {
    width: '100%',
    height: '100%',
    opacity: 0.55,
  },

  // Minimal Header Bar with NO Back Button and NO stacked artifacts
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 4,
    minHeight: 44,
  },
  headerLeftEmpty: {
    width: 44,
    height: 44,
  },
  skipBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  skipText: {
    fontSize: 14,
    fontFamily: FONTS.semiBold,
    fontWeight: '600',
  },
  headerCloseBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Main Scrollable Content
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
  heroWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  cardContainer: {
    width: '100%',
    alignItems: 'center',
  },

  // Protocol Category Pill
  categoryPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
    marginBottom: 14,
  },
  glowingDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  categoryPillText: {
    fontSize: 11,
    fontFamily: FONTS.bold,
    fontWeight: '800',
    letterSpacing: 1.2,
  },

  // Slide Typography
  titleText: {
    fontSize: IS_COMPACT ? 24 : 27,
    fontFamily: FONTS.bold,
    fontWeight: '800',
    textAlign: 'center',
    letterSpacing: -0.5,
    marginBottom: 10,
  },
  bodyText: {
    fontSize: 14.5,
    fontFamily: FONTS.regular,
    textAlign: 'center',
    lineHeight: 22,
    maxWidth: 340,
    marginBottom: 20,
  },

  // Highlights Matrix
  highlightsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 8,
    maxWidth: 340,
  },
  highlightChip: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 999,
    borderWidth: 1,
  },
  highlightChipText: {
    fontSize: 12,
    fontFamily: FONTS.medium,
    fontWeight: '600',
  },

  // Nickname Input
  inputWrap: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 14,
    borderWidth: 1.2,
    paddingHorizontal: 14,
    paddingVertical: 2,
    shadowOffset: { width: 0, height: 0 },
    shadowRadius: 10,
    shadowOpacity: 0.45,
    elevation: 4,
    marginBottom: 12,
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    height: 48,
    fontSize: 15,
    fontFamily: FONTS.medium,
  },
  clearInputBtn: {
    padding: 4,
  },

  // Bottom Pagination Dots & Action Button
  footerContainer: {
    paddingHorizontal: 24,
    paddingBottom: 24,
    paddingTop: 8,
    gap: 16,
  },
  dotsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  dot: {
    height: 6,
    borderRadius: 3,
    shadowOffset: { width: 0, height: 0 },
    elevation: 2,
  },
  primaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    height: 54,
    borderRadius: 999,
    borderWidth: 1.2,
    shadowOffset: { width: 0, height: 0 },
    shadowRadius: 16,
    shadowOpacity: 0.8,
    elevation: 8,
  },
  primaryBtnText: {
    fontSize: 16,
    fontFamily: FONTS.bold,
    fontWeight: '700',
  },
});
