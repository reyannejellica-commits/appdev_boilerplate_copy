import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  BackHandler,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button } from '@/components/Button';
import { PreOnboardingSplash } from '@/components/PreOnboardingSplash';
import { SmoothPressable } from '@/components/SmoothPressable';
import { getHunterProfile, updateHunterName } from '@/db/hunter';
import { useTranslation } from '@/i18n';
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
  const router = useRouter();
  const { settings, update } = useSettings();
  const { t } = useTranslation();

  // If already onboarded, jump directly to slides without replaying the splash
  const [isBootDone, setIsBootDone] = useState(Boolean(settings.onboarded));
  const [currentSlide, setCurrentSlide] = useState(0);
  const [nickname, setNickname] = useState(settings.nickname || '');
  const [submitting, setSubmitting] = useState(false);

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
      return false; // let Android OS exit app on first onboarding slide when not onboarded
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

  // 2. SLIDES & HUNTER AWAKENING
  const isHunterStep = currentSlide === SLIDES.length;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {/* Top Header Bar with Back navigation & Title */}
        <View style={styles.topHeaderBar}>
          {settings.onboarded ? (
            <SmoothPressable
              onPress={handleExitToHub}
              style={styles.headerBackBtn}
              accessibilityRole="button"
              accessibilityLabel={t('back')}
              hitSlop={10}
            >
              <Ionicons name="arrow-back" size={20} color={theme.text} />
              <Text style={[styles.headerBackText, { color: theme.text }]}>
                {t('back')}
              </Text>
            </SmoothPressable>
          ) : (
            <View style={{ width: 60 }} />
          )}

          <Text style={[styles.headerTitle, { color: theme.tint }]} numberOfLines={1}>
            {t('systemProtocolGuide')}
          </Text>

          {settings.onboarded ? (
            <SmoothPressable
              onPress={handleExitToHub}
              style={styles.headerCloseBtn}
              accessibilityRole="button"
              accessibilityLabel={t('close')}
              hitSlop={10}
            >
              <Ionicons name="close" size={20} color={theme.textSecondary} />
            </SmoothPressable>
          ) : (
            <View style={{ width: 60 }} />
          )}
        </View>

        <View style={styles.content}>
          {isHunterStep ? (
            <View style={styles.slideCard}>
              <View
                style={[
                  styles.iconCircle,
                  {
                    backgroundColor: theme.cardSecondary,
                    borderColor: theme.borderRose,
                    shadowColor: theme.glow,
                  },
                ]}
              >
                <Ionicons name="person" size={48} color={theme.tint} />
              </View>

              <View
                style={[
                  styles.badge,
                  {
                    backgroundColor: theme.cardSecondary,
                    borderColor: theme.borderRose,
                  },
                ]}
              >
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
                    backgroundColor: theme.cardSecondary,
                    borderColor: theme.borderRose,
                  },
                ]}
              />

              <View
                style={[
                  styles.rankBox,
                  {
                    backgroundColor: theme.cardSecondary,
                    borderColor: theme.borderRose,
                  },
                ]}
              >
                <Ionicons name="shield-outline" size={18} color={theme.accentGold} />
                <Text style={[styles.rankText, { color: theme.textSecondary }]}>
                  Starting Rank:{' '}
                  <Text style={{ color: theme.accentGold, fontWeight: '700' }}>
                    E-Rank Hunter (Lv. 1)
                  </Text>
                </Text>
              </View>
            </View>
          ) : (
            <View style={styles.slideCard}>
              <View
                style={[
                  styles.iconCircle,
                  {
                    backgroundColor: theme.cardSecondary,
                    borderColor: theme.borderRose,
                    shadowColor: theme.glow,
                  },
                ]}
              >
                <Ionicons name={SLIDES[currentSlide].icon} size={48} color={theme.tint} />
              </View>

              <View
                style={[
                  styles.badge,
                  {
                    backgroundColor: theme.cardSecondary,
                    borderColor: theme.borderRose,
                  },
                ]}
              >
                <Text style={[styles.badgeText, { color: theme.accentHighlight }]}>
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
        <View
          style={[
            styles.footer,
            currentSlide === 0 && !settings.onboarded && styles.footerSingle,
          ]}
        >
          {currentSlide > 0 ? (
            <Button
              label={t('back')}
              variant="secondary"
              onPress={() => setCurrentSlide(currentSlide - 1)}
            />
          ) : settings.onboarded ? (
            <Button
              label={t('returnToHub')}
              variant="secondary"
              onPress={handleExitToHub}
            />
          ) : null}

          <Button
            label={
              isHunterStep
                ? settings.onboarded
                  ? t('returnToHub')
                  : 'Initiate Protocol'
                : 'Next'
            }
            loading={isHunterStep && submitting}
            disabled={submitting}
            style={currentSlide === 0 && !settings.onboarded ? styles.buttonFullWidth : undefined}
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

  // Top Header Bar
  topHeaderBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  headerBackBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderRadius: 8,
  },
  headerBackText: {
    fontSize: 14,
    fontWeight: '600',
  },
  headerTitle: {
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  headerCloseBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
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
    shadowOffset: { width: 0, height: 0 },
    shadowRadius: 16,
    shadowOpacity: 0.75,
    elevation: 6,
  },
  badge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1.2,
    shadowColor: '#D982A5',
    shadowOffset: { width: 0, height: 0 },
    shadowRadius: 6,
    shadowOpacity: 0.4,
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
    borderWidth: 1.2,
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    marginTop: 8,
    shadowColor: '#D982A5',
    shadowOffset: { width: 0, height: 0 },
    shadowRadius: 8,
    shadowOpacity: 0.4,
  },
  rankBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1.2,
    alignSelf: 'stretch',
    justifyContent: 'center',
    marginTop: 4,
    shadowColor: '#D982A5',
    shadowOffset: { width: 0, height: 0 },
    shadowRadius: 8,
    shadowOpacity: 0.4,
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
  footerSingle: {
    justifyContent: 'flex-end',
  },
  buttonFullWidth: {
    flex: 1,
  },
});
