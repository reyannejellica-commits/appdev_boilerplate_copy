import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  BackHandler,
  Image,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, {
  Defs,
  LinearGradient,
  Path,
  RadialGradient,
  Rect,
  Stop,
} from 'react-native-svg';
import { deleteModel } from '@/ai/local';
import { Button } from '@/components/Button';
import { SmoothPressable } from '@/components/SmoothPressable';
import { clearAllConversations } from '@/db/conversations';
import { getHunterProfile, updateHunterName, type HunterProfile } from '@/db/hunter';
import { useTranslation } from '@/i18n';
import { PRIVACY_POLICY, TERMS } from '@/legal/content';
import { useSettings } from '@/settings/SettingsContext';
import { type LanguageCode, type ThemeColorKey } from '@/settings/storage';
import { COLOR_PRESETS, FONTS, useTheme } from '@/theme';
import { confirmAction, showMessage } from '@/utils/confirm';
import { scheduleDailyWorkoutReminder, scheduleRelativeReminder } from '@/utils/notifications';
import {
  AVATAR_OPTIONS,
  LANGUAGE_OPTIONS,
  getAvatarById,
  getLanguageByCode,
} from '@/utils/profileOptions';

interface AuraPreset {
  id: ThemeColorKey;
  label: string;
  sub: string;
  color: string;
}

const AURA_PRESETS: AuraPreset[] = [
  { id: 'rose', label: 'Rose Pink', sub: 'Sakura Glow', color: '#D982A5' },
  { id: 'purple', label: 'Obsidian', sub: 'Monarch Purple', color: '#A855F7' },
  { id: 'blue', label: 'Solo Blue', sub: 'Mana Azure', color: '#38BDF8' },
  { id: 'red', label: 'Crimson', sub: 'Berserker Red', color: '#EF4444' },
  { id: 'green', label: 'Cyber Green', sub: 'Matrix Vitality', color: '#22C55E' },
  { id: 'amber', label: 'Sunset Gold', sub: 'Sovereign Amber', color: '#F59E0B' },
  { id: 'cyan', label: 'Cyber Cyan', sub: 'Neon Aqua', color: '#06B6D4' },
  { id: 'platinum', label: 'Platinum', sub: 'Titanium White', color: '#CBD5E1' },
];

const REST_TIMER_OPTIONS = ['1:00', '1:30', '2:00', '3:00'] as const;
const EFFORT_METRICS = ['RIR', 'RPE', 'Off'] as const;

export default function SettingsScreen() {
  const theme = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { settings, update, reset } = useSettings();
  const { t } = useTranslation();
  const isDark = settings.theme === 'dark';

  const [hunter, setHunter] = useState<HunterProfile | null>(null);
  const [nicknameDraft, setNicknameDraft] = useState(settings.nickname || 'Hunter');
  const [isAvatarModalVisible, setIsAvatarModalVisible] = useState(false);
  const [isLanguageModalVisible, setIsLanguageModalVisible] = useState(false);
  const [isAboutModalVisible, setIsAboutModalVisible] = useState(false);
  const [aboutSubView, setAboutSubView] = useState<'main' | 'privacy' | 'terms'>('main');

  useEffect(() => {
    let ignore = false;
    getHunterProfile(settings.nickname || 'Hunter')
      .then((p) => {
        if (!ignore) setHunter(p);
      })
      .catch(() => {});
    return () => {
      ignore = true;
    };
  }, [settings.nickname]);

  const handleBack = useCallback(() => {
    try {
      if (router.canGoBack()) {
        router.back();
      } else {
        router.replace('/(tabs)');
      }
    } catch {
      router.replace('/(tabs)');
    }
  }, [router]);

  useEffect(() => {
    const onBackPress = () => {
      if (isAvatarModalVisible) {
        setIsAvatarModalVisible(false);
        return true;
      }
      if (isLanguageModalVisible) {
        setIsLanguageModalVisible(false);
        return true;
      }
      if (isAboutModalVisible) {
        if (aboutSubView !== 'main') {
          setAboutSubView('main');
          return true;
        }
        setIsAboutModalVisible(false);
        return true;
      }

      handleBack();
      return true;
    };

    const sub = BackHandler.addEventListener('hardwareBackPress', onBackPress);
    return () => sub.remove();
  }, [
    isAvatarModalVisible,
    isLanguageModalVisible,
    isAboutModalVisible,
    aboutSubView,
    handleBack,
  ]);

  const [avatarCategory, setAvatarCategory] = useState<'male' | 'female'>('male');
  const [stagedAvatarId, setStagedAvatarId] = useState<string>(settings.avatarId || 'bunny_boy');

  const currentAvatar = useMemo(() => getAvatarById(settings.avatarId), [settings.avatarId]);
  const stagedAvatar = useMemo(() => getAvatarById(stagedAvatarId), [stagedAvatarId]);
  const currentLanguage = useMemo(() => getLanguageByCode(settings.language), [settings.language]);

  const openAvatarModal = () => {
    const cur = settings.avatarId || 'bunny_boy';
    setStagedAvatarId(cur);
    const av = getAvatarById(cur);
    setAvatarCategory(av.gender || 'male');
    setIsAvatarModalVisible(true);
  };

  const handleConfirmAvatar = async () => {
    try {
      await update('avatarId', stagedAvatarId);
    } catch (e) {
      console.warn('Failed to save avatar:', e);
    }
    setIsAvatarModalVisible(false);
  };

  const handleCancelAvatar = () => {
    setStagedAvatarId(settings.avatarId || 'bunny_boy');
    setIsAvatarModalVisible(false);
  };

  const currentCategoryAvatars = useMemo(
    () => AVATAR_OPTIONS.filter((a) => a.gender === avatarCategory),
    [avatarCategory]
  );

  const handleUpdateNickname = async (text: string) => {
    setNicknameDraft(text);
    await update('nickname', text.trim());
    await updateHunterName(text.trim() || 'Hunter');
  };

  const handleSelectLanguage = async (code: LanguageCode) => {
    await update('language', code);
    setIsLanguageModalVisible(false);
  };

  const toggleThemeMode = async (mode: 'dark' | 'light') => {
    try {
      await update('theme', mode);
    } catch (err) {
      console.warn('Failed to switch theme:', err);
    }
  };

  const resetAllData = () => {
    confirmAction(
      t('factoryReset'),
      'This deletes your local workout history, hunter profile, quests, settings, and downloaded models. The app will restart from onboarding.',
      'Reset',
      async () => {
        await clearAllConversations();
        await deleteModel();
        await reset();
        showMessage('Reset Complete', 'All local data has been restored to factory state.');
        router.replace('/onboarding');
      }
    );
  };

  const cardBorder = isDark ? 'rgba(255,255,255,0.09)' : theme.border;

  return (
    <View style={[styles.root, { backgroundColor: theme.background }]}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* 1. TOP NAV BAR */}
        <View style={[styles.topBackHeader, { paddingTop: Math.max(insets.top, 10) }]}>
          <SmoothPressable
            onPress={handleBack}
            style={styles.backBtn}
            accessibilityRole="button"
            accessibilityLabel={t('settings')}
            hitSlop={12}
          >
            <View
              style={[
                styles.backIconCircle,
                { backgroundColor: theme.cardSecondary, borderColor: cardBorder },
              ]}
            >
              <Ionicons name="chevron-back" size={20} color={theme.tint} />
            </View>
            <View>
              <Text style={[styles.backBtnText, { color: theme.text }]}>{t('settings')}</Text>
              <Text style={[styles.backSubText, { color: theme.textSecondary }]}>
                System Preferences & Hunter Identity
              </Text>
            </View>
          </SmoothPressable>
        </View>

        {/* 2. CARD 1: HUNTER IDENTITY & PROFILE */}
        <View
          style={[
            styles.sectionContainer,
            { backgroundColor: theme.card, borderColor: `${theme.tint}38` },
          ]}
        >
          <Svg style={StyleSheet.absoluteFill} pointerEvents="none">
            <Defs>
              <RadialGradient id="settingsHeroGlow" cx="15%" cy="15%" rx="80%" ry="80%">
                <Stop offset="0%" stopColor={theme.tint} stopOpacity="0.20" />
                <Stop offset="100%" stopColor={theme.tint} stopOpacity="0" />
              </RadialGradient>
            </Defs>
            <Rect x="0" y="0" width="100%" height="100%" rx="20" fill="url(#settingsHeroGlow)" />
          </Svg>

          <View style={styles.sectionHeaderRow}>
            <Ionicons name="person-circle-outline" size={16} color={theme.tint} />
            <Text style={[styles.sectionHeaderTitle, { color: theme.tint }]}>
              {t('hunterIdentity')}
            </Text>
          </View>

          {/* Inner Identity Display Card */}
          <View
            style={[
              styles.innerIdentityCard,
              { backgroundColor: theme.cardSecondary, borderColor: cardBorder },
            ]}
          >
            <SmoothPressable onPress={openAvatarModal} style={styles.identityAvatarWrapper}>
              <View
                style={[
                  styles.identityAvatarCircle,
                  { borderColor: theme.tint, shadowColor: theme.glow },
                ]}
              >
                <Image
                  source={currentAvatar.image}
                  style={styles.identityAvatarImg}
                  resizeMode="cover"
                />
              </View>
              <View style={[styles.cameraEditBadge, { backgroundColor: theme.tint }]}>
                <Ionicons name="camera" size={11} color="#FFFFFF" />
              </View>
            </SmoothPressable>

            <View style={styles.identityTextCol}>
              <View style={styles.identityBadgesRow}>
                <View style={[styles.rankBadgeSmall, { backgroundColor: theme.tint }]}>
                  <Text style={styles.rankBadgeTextSmall}>
                    {(hunter?.rank || 'B-Rank').toUpperCase()}
                  </Text>
                </View>
                <View
                  style={[
                    styles.levelPillSmall,
                    { backgroundColor: `${theme.tint}1E`, borderColor: `${theme.tint}45` },
                  ]}
                >
                  <Text style={[styles.levelPillTextSmall, { color: theme.tint }]}>
                    LV. {hunter?.level ?? 20} • {hunter?.coins ?? 190} Coins
                  </Text>
                </View>
              </View>
              <Text style={[styles.identityHunterName, { color: theme.text }]} numberOfLines={1}>
                {settings.nickname || 'Hunter'}
              </Text>
              <Text style={[styles.identityAvatarTitle, { color: theme.textSecondary }]}>
                Companion: <Text style={{ color: theme.tint, fontWeight: '700' }}>{currentAvatar.name}</Text> ({currentAvatar.title})
              </Text>
            </View>
          </View>

          {/* Edit Codename */}
          <Text style={[styles.subLabel, { color: theme.textSecondary }]}>{t('editCodename')}</Text>
          <View
            style={[
              styles.codenameInputWrap,
              {
                backgroundColor: theme.cardSecondary,
                borderColor: cardBorder,
              },
            ]}
          >
            <Ionicons name="create-outline" size={18} color={theme.tint} />
            <TextInput
              style={[styles.codenameInput, { color: theme.text }]}
              value={nicknameDraft}
              onChangeText={handleUpdateNickname}
              placeholder={settings.nickname || 'Hunter'}
              placeholderTextColor={theme.textSecondary}
              maxLength={32}
              autoCorrect={false}
            />
          </View>

          {/* Choose Avatar Button */}
          <SmoothPressable
            onPress={openAvatarModal}
            style={[
              styles.uploadPhotoBtn,
              { backgroundColor: `${theme.tint}16`, borderColor: `${theme.tint}45` },
            ]}
          >
            <Ionicons name="sparkles-outline" size={16} color={theme.tint} style={{ marginRight: 8 }} />
            <Text style={[styles.uploadPhotoBtnText, { color: theme.tint }]}>
              {t('uploadPhoto')} (10 Companions)
            </Text>
          </SmoothPressable>
        </View>

        {/* 3. CARD 2: AURA PALETTE SELECTOR (All 8 Modern Palettes) */}
        <View style={[styles.sectionContainer, { backgroundColor: theme.card, borderColor: cardBorder }]}>
          <View style={styles.sectionHeaderRow}>
            <Ionicons name="color-palette-outline" size={16} color={theme.tint} />
            <Text style={[styles.sectionHeaderTitle, { color: theme.textSecondary }]}>
              {t('auraPalette')}
            </Text>
          </View>

          <View style={styles.auraRow}>
            {AURA_PRESETS.map((preset) => {
              const isSelected = settings.colorScheme === preset.id;
              const activePreset = COLOR_PRESETS[preset.id] || COLOR_PRESETS.rose;
              const swatchColor = isDark ? activePreset.tint : activePreset.tintLight;
              return (
                <SmoothPressable
                  key={preset.id}
                  onPress={() => update('colorScheme', preset.id)}
                  style={[
                    styles.auraCard,
                    {
                      backgroundColor: isSelected ? `${swatchColor}18` : theme.cardSecondary,
                      borderColor: isSelected ? swatchColor : cardBorder,
                      shadowColor: isSelected ? swatchColor : 'transparent',
                    },
                    isSelected && styles.auraCardSelected,
                  ]}
                >
                  <View style={styles.auraTopRow}>
                    <View style={[styles.auraCircleSwatch, { backgroundColor: swatchColor }]} />
                    {isSelected && (
                      <Ionicons name="checkmark-circle" size={16} color={swatchColor} />
                    )}
                  </View>
                  <Text style={[styles.auraLabel, { color: theme.text }]} numberOfLines={1}>
                    {preset.label}
                  </Text>
                  <Text style={[styles.auraSub, { color: theme.textSecondary }]} numberOfLines={1}>
                    {preset.sub}
                  </Text>
                </SmoothPressable>
              );
            })}
          </View>
        </View>

        {/* 4. CARD 3: SYSTEM CONTROLS & WORKOUT TELEMETRY */}
        <View style={[styles.sectionContainer, { backgroundColor: theme.card, borderColor: cardBorder }]}>
          <View style={styles.sectionHeaderRow}>
            <Ionicons name="options-outline" size={16} color={theme.tint} />
            <Text style={[styles.sectionHeaderTitle, { color: theme.textSecondary }]}>
              {t('systemControls')} & WORKOUT TIMERS
            </Text>
          </View>

          {/* Dark / Light Toggle */}
          <View style={styles.themeModeRow}>
            <SmoothPressable
              onPress={() => toggleThemeMode('dark')}
              style={[
                styles.themeModeBtn,
                {
                  backgroundColor: settings.theme === 'dark' ? theme.tint : theme.cardSecondary,
                  borderColor: settings.theme === 'dark' ? theme.tint : cardBorder,
                  shadowColor: settings.theme === 'dark' ? theme.tint : 'transparent',
                },
                settings.theme === 'dark' && styles.themeModeBtnActive,
              ]}
            >
              <View
                style={[
                  styles.themeIconBadge,
                  {
                    backgroundColor:
                      settings.theme === 'dark'
                        ? 'rgba(255, 255, 255, 0.22)'
                        : `${theme.textSecondary}18`,
                  },
                ]}
              >
                <Ionicons
                  name="moon"
                  size={15}
                  color={settings.theme === 'dark' ? '#FFFFFF' : theme.textSecondary}
                />
              </View>
              <Text
                style={[
                  styles.themeModeText,
                  { color: settings.theme === 'dark' ? '#FFFFFF' : theme.textSecondary },
                ]}
              >
                {t('darkMode')}
              </Text>
            </SmoothPressable>

            <SmoothPressable
              onPress={() => toggleThemeMode('light')}
              style={[
                styles.themeModeBtn,
                {
                  backgroundColor: settings.theme === 'light' ? theme.tint : theme.cardSecondary,
                  borderColor: settings.theme === 'light' ? theme.tint : cardBorder,
                  shadowColor: settings.theme === 'light' ? theme.tint : 'transparent',
                },
                settings.theme === 'light' && styles.themeModeBtnActive,
              ]}
            >
              <View
                style={[
                  styles.themeIconBadge,
                  {
                    backgroundColor:
                      settings.theme === 'light'
                        ? 'rgba(255, 255, 255, 0.22)'
                        : `${theme.textSecondary}18`,
                  },
                ]}
              >
                <Ionicons
                  name="sunny"
                  size={15}
                  color={settings.theme === 'light' ? '#FFFFFF' : theme.textSecondary}
                />
              </View>
              <Text
                style={[
                  styles.themeModeText,
                  { color: settings.theme === 'light' ? '#FFFFFF' : theme.textSecondary },
                ]}
              >
                {t('lightMode')}
              </Text>
            </SmoothPressable>
          </View>

          {/* Rest Timer Selector */}
          <Text style={[styles.subLabel, { color: theme.textSecondary, marginTop: 4 }]}>
            DEFAULT REST TIMER BETWEEN SETS
          </Text>
          <View style={styles.pillsOptionRow}>
            {REST_TIMER_OPTIONS.map((val) => {
              const active = settings.workoutRestTimer === val;
              return (
                <SmoothPressable
                  key={val}
                  onPress={() => update('workoutRestTimer', val)}
                  style={[
                    styles.smallOptionPill,
                    {
                      backgroundColor: active ? `${theme.tint}22` : theme.cardSecondary,
                      borderColor: active ? theme.tint : cardBorder,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.smallOptionText,
                      { color: active ? theme.tint : theme.textSecondary },
                    ]}
                  >
                    {val}
                  </Text>
                </SmoothPressable>
              );
            })}
          </View>

          {/* Effort Metric Selector (RIR / RPE / Off) */}
          <Text style={[styles.subLabel, { color: theme.textSecondary, marginTop: 12 }]}>
            INTENSITY EFFORT METRIC
          </Text>
          <View style={styles.pillsOptionRow}>
            {EFFORT_METRICS.map((metric) => {
              const active = settings.workoutEffortMetric === metric;
              return (
                <SmoothPressable
                  key={metric}
                  onPress={() => update('workoutEffortMetric', metric)}
                  style={[
                    styles.smallOptionPill,
                    {
                      backgroundColor: active ? `${theme.tint}22` : theme.cardSecondary,
                      borderColor: active ? theme.tint : cardBorder,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.smallOptionText,
                      { color: active ? theme.tint : theme.textSecondary },
                    ]}
                  >
                    {metric === 'RIR' ? 'RIR (Reps In Reserve)' : metric === 'RPE' ? 'RPE Scale' : 'Off'}
                  </Text>
                </SmoothPressable>
              );
            })}
          </View>

          {/* Daily Workout Push Notification Alarm */}
          <Text style={[styles.subLabel, { color: theme.textSecondary, marginTop: 14 }]}>
            DAILY WORKOUT PUSH ALARM (OFFLINE)
          </Text>
          <View style={{ flexDirection: 'row', gap: 8, marginTop: 6 }}>
            <SmoothPressable
              onPress={async () => {
                const streak = hunter?.streak_days ?? 1;
                const id = await scheduleDailyWorkoutReminder(streak, 8, 0);
                if (id) {
                  showMessage(
                    'Daily Alarm Armed (8:00 AM)',
                    `Naka-arm na ang offline workout reminder!\n\nKahit sarado ang app, makakatanggap ka ng alarm: "⚡ Day ${streak + 1} na pala! Need mo na mag-exercise!"`
                  );
                } else {
                  showMessage('Notification Permission', 'Please allow notifications in your phone settings.');
                }
              }}
              style={[
                styles.smallOptionPill,
                { flex: 1.2, backgroundColor: `${theme.tint}20`, borderColor: theme.tint, paddingVertical: 10 },
              ]}
            >
              <Ionicons name="alarm" size={14} color={theme.tint} style={{ marginRight: 4 }} />
              <Text style={[styles.smallOptionText, { color: theme.tint, fontWeight: '700' }]}>
                Arm 8:00 AM Alarm
              </Text>
            </SmoothPressable>

            <SmoothPressable
              onPress={async () => {
                const streak = hunter?.streak_days ?? 1;
                const id = await scheduleRelativeReminder(
                  5,
                  `⚡ Day ${streak + 1} na pala! Need mo na mag-exercise!`,
                  `PeakFit Protocol: Oras na para mag-workout! Protektahan ang iyong Hunter Streak ngayon.`
                );
                if (id) {
                  showMessage(
                    'Alarm Scheduled (5s)',
                    'I-minimize mo ang app ngayon. Makalipas ang 5 segundo, tutunog at lalabas ang notification!'
                  );
                } else {
                  showMessage('Notification Permission', 'Please grant notification permissions.');
                }
              }}
              style={[
                styles.smallOptionPill,
                { flex: 1, backgroundColor: theme.cardSecondary, borderColor: cardBorder, paddingVertical: 10 },
              ]}
            >
              <Ionicons name="timer-outline" size={14} color={theme.textSecondary} style={{ marginRight: 4 }} />
              <Text style={[styles.smallOptionText, { color: theme.textSecondary }]}>
                Test (5s)
              </Text>
            </SmoothPressable>
          </View>
        </View>

        {/* 5. CARD 4: SYSTEM LANGUAGE & AI ENGINE HUB */}
        <View style={[styles.sectionContainer, { backgroundColor: theme.card, borderColor: cardBorder }]}>
          <View style={styles.sectionHeaderRow}>
            <Ionicons name="globe-outline" size={16} color={theme.tint} />
            <Text style={[styles.sectionHeaderTitle, { color: theme.textSecondary }]}>
              {t('systemLanguage')} & AI ENGINE
            </Text>
          </View>

          <SmoothPressable
            onPress={() => setIsLanguageModalVisible(true)}
            style={[
              styles.aboutCardRow,
              { backgroundColor: theme.cardSecondary, borderColor: cardBorder, marginBottom: 10 },
            ]}
          >
            <View
              style={[
                styles.aboutIconSquircle,
                { backgroundColor: `${theme.tint}1A`, borderColor: `${theme.tint}40` },
              ]}
            >
              <Ionicons name="globe-outline" size={20} color={theme.tint} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.aboutTitleText, { color: theme.text }]} numberOfLines={1}>
                {currentLanguage.name}
              </Text>
              <Text style={[styles.aboutVersionText, { color: theme.textSecondary }]} numberOfLines={1}>
                {currentLanguage.nativeName} ({currentLanguage.code.toUpperCase()})
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={theme.textSecondary} />
          </SmoothPressable>

          {/* Direct shortcut to AI Chatbot Engine Settings */}
          <SmoothPressable
            onPress={() => router.push('/chat-settings')}
            style={[
              styles.aboutCardRow,
              { backgroundColor: theme.cardSecondary, borderColor: cardBorder },
            ]}
          >
            <View
              style={[
                styles.aboutIconSquircle,
                { backgroundColor: `${theme.tint}1A`, borderColor: `${theme.tint}40` },
              ]}
            >
              <Ionicons name="hardware-chip-outline" size={20} color={theme.tint} />
            </View>
            <View style={{ flex: 1, minWidth: 0, paddingRight: 4 }}>
              <Text style={[styles.aboutTitleText, { color: theme.text }]} numberOfLines={1}>
                AI Coach Provider & Model
              </Text>
              <Text style={[styles.aboutVersionText, { color: theme.textSecondary }]} numberOfLines={1}>
                Built-in Coach • Gemini • Local Gemma
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={theme.textSecondary} />
          </SmoothPressable>
        </View>

        {/* 6. CARD 5: ABOUT, LEGAL & SYSTEM GUIDE */}
        <View style={[styles.sectionContainer, { backgroundColor: theme.card, borderColor: cardBorder }]}>
          <View style={styles.sectionHeaderRow}>
            <Ionicons name="shield-checkmark-outline" size={16} color={theme.tint} />
            <Text style={[styles.sectionHeaderTitle, { color: theme.textSecondary }]}>
              SYSTEM ARCHITECTURE, LEGAL & GUIDE
            </Text>
          </View>

          <SmoothPressable
            onPress={() => {
              setAboutSubView('main');
              setIsAboutModalVisible(true);
            }}
            style={[
              styles.aboutCardRow,
              { backgroundColor: theme.cardSecondary, borderColor: cardBorder, marginBottom: 10 },
            ]}
            accessibilityRole="button"
            accessibilityLabel={t('aboutUpdates')}
          >
            <View
              style={[
                styles.aboutIconSquircle,
                { backgroundColor: `${theme.tint}1A`, borderColor: `${theme.tint}40` },
              ]}
            >
              <Ionicons name="information-circle" size={22} color={theme.tint} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.aboutTitleText, { color: theme.text }]}>
                {t('aboutUpdates')}
              </Text>
              <Text style={[styles.aboutVersionText, { color: theme.textSecondary }]}>
                PeakFit v1.0.0 • Architecture, Privacy & Terms
              </Text>
            </View>
            <View
              style={[
                styles.versionPillBadge,
                { backgroundColor: `${theme.tint}1E`, borderColor: `${theme.tint}45` },
              ]}
            >
              <Text style={[styles.versionPillText, { color: theme.tint }]}>v1.0.0</Text>
            </View>
          </SmoothPressable>

          {/* Direct Privacy Policy Row */}
          <SmoothPressable
            onPress={() => {
              setAboutSubView('privacy');
              setIsAboutModalVisible(true);
            }}
            style={[
              styles.aboutCardRow,
              { backgroundColor: theme.cardSecondary, borderColor: cardBorder, marginBottom: 10 },
            ]}
            accessibilityRole="button"
            accessibilityLabel={t('privacyPolicy')}
          >
            <View
              style={[
                styles.aboutIconSquircle,
                { backgroundColor: 'rgba(52, 211, 153, 0.14)', borderColor: 'rgba(52, 211, 153, 0.35)' },
              ]}
            >
              <Ionicons name="lock-closed" size={20} color="#34D399" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.aboutTitleText, { color: theme.text }]}>
                {t('privacyPolicy')}
              </Text>
              <Text style={[styles.aboutVersionText, { color: theme.textSecondary }]}>
                100% Offline SQLite • Zero Telemetry & Data Ownership
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={theme.textSecondary} />
          </SmoothPressable>

          {/* Direct Terms & Conditions Row */}
          <SmoothPressable
            onPress={() => {
              setAboutSubView('terms');
              setIsAboutModalVisible(true);
            }}
            style={[
              styles.aboutCardRow,
              { backgroundColor: theme.cardSecondary, borderColor: cardBorder, marginBottom: 10 },
            ]}
            accessibilityRole="button"
            accessibilityLabel={t('termsConditions')}
          >
            <View
              style={[
                styles.aboutIconSquircle,
                { backgroundColor: 'rgba(245, 158, 11, 0.14)', borderColor: 'rgba(245, 158, 11, 0.35)' },
              ]}
            >
              <Ionicons name="document-text" size={20} color="#F59E0B" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.aboutTitleText, { color: theme.text }]}>
                {t('termsConditions')}
              </Text>
              <Text style={[styles.aboutVersionText, { color: theme.textSecondary }]}>
                Athletic Safety, AI Disclaimers & User License
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={theme.textSecondary} />
          </SmoothPressable>

          {/* System Protocol & Onboarding Guide */}
          <SmoothPressable
            onPress={() => router.push('/onboarding')}
            style={[
              styles.aboutCardRow,
              { backgroundColor: theme.cardSecondary, borderColor: cardBorder },
            ]}
            accessibilityRole="button"
            accessibilityLabel={t('systemProtocolGuide')}
          >
            <View
              style={[
                styles.aboutIconSquircle,
                { backgroundColor: `${theme.tint}1A`, borderColor: `${theme.tint}40` },
              ]}
            >
              <Ionicons name="compass" size={21} color={theme.tint} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.aboutTitleText, { color: theme.text }]}>
                {t('systemProtocolGuide')}
              </Text>
              <Text style={[styles.aboutVersionText, { color: theme.textSecondary }]}>
                {t('reviewOnboarding')}
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={theme.textSecondary} />
          </SmoothPressable>
        </View>

        {/* 7. CARD 6: DANGER ZONE */}
        <View style={styles.dangerZoneContainer}>
          <Text style={[styles.sectionHeaderTitle, { color: '#EF4444', marginBottom: 8 }]}>
            {t('dangerZone')}
          </Text>

          <View style={styles.dangerCardDashed}>
            <SmoothPressable
              onPress={resetAllData}
              style={styles.resetFullBtn}
              accessibilityLabel="Factory Reset Local Data"
            >
              <Ionicons name="trash-outline" size={18} color="#EF4444" style={{ marginRight: 8 }} />
              <Text style={styles.resetFullBtnText}>{t('factoryReset')}</Text>
            </SmoothPressable>
          </View>
        </View>
      </ScrollView>

      {/* MODAL 1: CHOOSE 3D PLUSHIE AVATAR */}
      <Modal
        visible={isAvatarModalVisible}
        transparent
        animationType="fade"
        onRequestClose={handleCancelAvatar}
      >
        <View style={styles.modalOverlay}>
          <View
            style={[
              styles.modalCard,
              { backgroundColor: theme.card, borderColor: cardBorder, maxHeight: '90%' },
            ]}
          >
            <View style={styles.modalHeaderRow}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.modalTitle, { color: theme.text }]}>3D Plushie Avatars</Text>
                <Text style={[styles.modalSubtitle, { color: theme.textSecondary }]}>
                  Select your profile companion (10 Total)
                </Text>
              </View>
              <SmoothPressable onPress={handleCancelAvatar} style={styles.closeBtn}>
                <Ionicons name="close" size={20} color={theme.textSecondary} />
              </SmoothPressable>
            </View>

            {/* Live Preview Card */}
            <View
              style={[
                styles.avatarLivePreviewCard,
                { backgroundColor: theme.cardSecondary, borderColor: stagedAvatar.color },
              ]}
            >
              <View
                style={[
                  styles.avatarLivePreviewCircle,
                  { borderColor: stagedAvatar.color, shadowColor: stagedAvatar.color },
                ]}
              >
                <Image
                  source={stagedAvatar.image}
                  style={styles.avatarLivePreviewImg}
                  resizeMode="cover"
                />
              </View>
              <View style={styles.avatarLivePreviewTextCol}>
                <View
                  style={[
                    styles.genderBadge,
                    {
                      backgroundColor: stagedAvatar.color,
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: 4,
                    },
                  ]}
                >
                  <Ionicons
                    name={stagedAvatar.gender === 'male' ? 'male' : 'female'}
                    size={12}
                    color="#FFFFFF"
                  />
                  <Text style={styles.genderBadgeText}>
                    {stagedAvatar.gender === 'male' ? 'MALE PLUSHIE' : 'FEMALE PLUSHIE'}
                  </Text>
                </View>
                <Text style={[styles.avatarLivePreviewName, { color: theme.text }]} numberOfLines={1}>
                  {stagedAvatar.name}
                </Text>
                <Text
                  style={[styles.avatarLivePreviewTitle, { color: stagedAvatar.color }]}
                  numberOfLines={1}
                >
                  {stagedAvatar.title}
                </Text>
              </View>
            </View>

            {/* Male / Female Category Switcher Tabs */}
            <View style={styles.avatarCategoryTabsRow}>
              <SmoothPressable
                onPress={() => setAvatarCategory('male')}
                style={[
                  styles.avatarCategoryTab,
                  {
                    backgroundColor: avatarCategory === 'male' ? theme.tint : theme.cardSecondary,
                    borderColor: avatarCategory === 'male' ? theme.tint : cardBorder,
                  },
                ]}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Ionicons
                    name="male"
                    size={14}
                    color={avatarCategory === 'male' ? '#FFFFFF' : theme.textSecondary}
                  />
                  <Text
                    style={[
                      styles.avatarCategoryTabText,
                      { color: avatarCategory === 'male' ? '#FFFFFF' : theme.textSecondary },
                    ]}
                  >
                    Male (5)
                  </Text>
                </View>
              </SmoothPressable>

              <SmoothPressable
                onPress={() => setAvatarCategory('female')}
                style={[
                  styles.avatarCategoryTab,
                  {
                    backgroundColor: avatarCategory === 'female' ? theme.tint : theme.cardSecondary,
                    borderColor: avatarCategory === 'female' ? theme.tint : cardBorder,
                  },
                ]}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Ionicons
                    name="female"
                    size={14}
                    color={avatarCategory === 'female' ? '#FFFFFF' : theme.textSecondary}
                  />
                  <Text
                    style={[
                      styles.avatarCategoryTabText,
                      { color: avatarCategory === 'female' ? '#FFFFFF' : theme.textSecondary },
                    ]}
                  >
                    Female (5)
                  </Text>
                </View>
              </SmoothPressable>
            </View>

            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ paddingVertical: 8 }}
            >
              <View style={styles.avatarGrid}>
                {currentCategoryAvatars.map((av) => {
                  const isSelected = stagedAvatarId === av.id;
                  return (
                    <SmoothPressable
                      key={av.id}
                      onPress={() => setStagedAvatarId(av.id)}
                      style={[
                        styles.avatarOptionCard,
                        {
                          backgroundColor: theme.cardSecondary,
                          borderColor: isSelected ? av.color : cardBorder,
                        },
                        isSelected && {
                          shadowColor: av.color,
                          shadowOffset: { width: 0, height: 0 },
                          shadowRadius: 10,
                          shadowOpacity: 0.8,
                          elevation: 4,
                          borderWidth: 2,
                        },
                      ]}
                    >
                      <View style={[styles.avatarOptionImgWrap, { borderColor: av.color }]}>
                        <Image
                          source={av.image}
                          style={styles.avatarOptionImg}
                          resizeMode="cover"
                        />
                      </View>
                      <Text
                        style={[styles.avatarOptionName, { color: theme.text }]}
                        numberOfLines={1}
                      >
                        {av.name}
                      </Text>
                      <Text
                        style={[styles.avatarOptionSub, { color: av.color }]}
                        numberOfLines={1}
                      >
                        {av.title}
                      </Text>
                      {isSelected && (
                        <View style={[styles.avatarCheckBadge, { backgroundColor: av.color }]}>
                          <Ionicons name="checkmark" size={11} color="#000000" />
                        </View>
                      )}
                    </SmoothPressable>
                  );
                })}
              </View>
            </ScrollView>

            <View style={styles.avatarActionsRow}>
              <SmoothPressable
                onPress={handleCancelAvatar}
                style={[
                  styles.avatarCancelBtn,
                  { backgroundColor: theme.cardSecondary, borderColor: cardBorder },
                ]}
              >
                <Text style={[styles.avatarCancelBtnText, { color: theme.textSecondary }]}>
                  {t('cancel')}
                </Text>
              </SmoothPressable>
              <SmoothPressable
                onPress={handleConfirmAvatar}
                style={[
                  styles.avatarConfirmBtn,
                  { backgroundColor: theme.tint, shadowColor: theme.glow },
                ]}
              >
                <Text style={styles.avatarConfirmBtnText}>Confirm Avatar</Text>
              </SmoothPressable>
            </View>
          </View>
        </View>
      </Modal>

      {/* MODAL 2: LANGUAGE SELECTOR */}
      <Modal
        visible={isLanguageModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setIsLanguageModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View
            style={[
              styles.modalCard,
              { backgroundColor: theme.card, borderColor: cardBorder, maxHeight: '80%' },
            ]}
          >
            <View style={styles.modalHeaderRow}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.modalTitle, { color: theme.text }]}>{t('selectLanguage')}</Text>
                <Text style={[styles.modalSubtitle, { color: theme.textSecondary }]}>
                  Choose your system language
                </Text>
              </View>
              <SmoothPressable
                onPress={() => setIsLanguageModalVisible(false)}
                style={styles.closeBtn}
              >
                <Ionicons name="close" size={20} color={theme.textSecondary} />
              </SmoothPressable>
            </View>

            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ paddingVertical: 10, gap: 8 }}
            >
              {LANGUAGE_OPTIONS.map((lang) => {
                const isSelected = settings.language === lang.code;
                return (
                  <SmoothPressable
                    key={lang.code}
                    onPress={() => handleSelectLanguage(lang.code)}
                    style={[
                      styles.languageItemCard,
                      {
                        backgroundColor: theme.cardSecondary,
                        borderColor: isSelected ? theme.tint : cardBorder,
                      },
                    ]}
                  >
                    <View
                      style={[
                        styles.langCodeBadge,
                        {
                          backgroundColor: `${theme.tint}1A`,
                          borderColor: cardBorder,
                          marginRight: 12,
                        },
                      ]}
                    >
                      <Ionicons name="globe-outline" size={14} color={theme.tint} />
                      <Text style={[styles.langCodeBadgeText, { color: theme.tint }]}>
                        {lang.code.toUpperCase()}
                      </Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text
                        style={[
                          styles.languageItemName,
                          {
                            color: isSelected ? theme.text : theme.textSecondary,
                            fontWeight: isSelected ? '700' : '500',
                          },
                        ]}
                      >
                        {lang.name}
                      </Text>
                      <Text style={[styles.languageItemNative, { color: theme.textSecondary }]}>
                        {lang.nativeName}
                      </Text>
                    </View>
                    {isSelected && (
                      <Ionicons name="checkmark-circle" size={20} color={theme.tint} />
                    )}
                  </SmoothPressable>
                );
              })}
            </ScrollView>

            <Button
              label={t('close')}
              variant="secondary"
              onPress={() => setIsLanguageModalVisible(false)}
              style={{ marginTop: 8 }}
            />
          </View>
        </View>
      </Modal>

      {/* MODAL 3: MODERN ABOUT, PRIVACY POLICY & TERMS AND CONDITIONS */}
      <Modal
        visible={isAboutModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setIsAboutModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View
            style={[
              styles.aboutModalCard,
              {
                backgroundColor: isDark ? '#0D0C13' : '#FFFFFF',
                borderColor: isDark ? 'rgba(255,255,255,0.14)' : theme.border,
              },
            ]}
          >
            {aboutSubView === 'main' && (
              <>
                {/* Top App Emblem & Architecture Badge */}
                <View style={styles.aboutHeroCenter}>
                  <View
                    style={[
                      styles.aboutLogoSquircle,
                      {
                        backgroundColor: `${theme.tint}18`,
                        borderColor: `${theme.tint}55`,
                        shadowColor: theme.glow,
                      },
                    ]}
                  >
                    <Svg width={44} height={44} viewBox="0 0 42 42" fill="none">
                      <Defs>
                        <LinearGradient id="aboutLogoGrad" x1="0" y1="0" x2="1" y2="1">
                          <Stop offset="0%" stopColor="#FFFFFF" />
                          <Stop offset="100%" stopColor={theme.tint} />
                        </LinearGradient>
                      </Defs>
                      <Path
                        d="M 10 27 L 21 11.5 L 32 27"
                        stroke="url(#aboutLogoGrad)"
                        strokeWidth="3.4"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                      <Path
                        d="M 7.5 20 L 34.5 20"
                        stroke="#FFFFFF"
                        strokeWidth="2.8"
                        strokeLinecap="round"
                      />
                      <Path
                        d="M 7 14.5 L 7 25.5"
                        stroke={theme.tint}
                        strokeWidth="3.8"
                        strokeLinecap="round"
                      />
                      <Path
                        d="M 35 14.5 L 35 25.5"
                        stroke={theme.tint}
                        strokeWidth="3.8"
                        strokeLinecap="round"
                      />
                    </Svg>
                  </View>

                  <View style={styles.aboutTitleRow}>
                    <Text style={[styles.aboutAppTitle, { color: theme.text }]}>PeakFit</Text>
                    <View
                      style={[
                        styles.versionPillBadge,
                        { backgroundColor: `${theme.tint}20`, borderColor: theme.tint },
                      ]}
                    >
                      <Text style={[styles.versionPillText, { color: theme.tint }]}>
                        v1.0.0 PRO
                      </Text>
                    </View>
                  </View>

                  <Text style={[styles.aboutAppDesc, { color: theme.textSecondary }]}>
                    Offline-First RPG Fitness System, Biomechanical Workout Tracker & Hybrid AI Sports Coach.
                  </Text>
                </View>

                {/* 3 System Specs Tiles */}
                <View style={styles.aboutSpecsGrid}>
                  <View
                    style={[
                      styles.aboutSpecTile,
                      { backgroundColor: theme.cardSecondary, borderColor: cardBorder },
                    ]}
                  >
                    <Ionicons name="server-outline" size={16} color="#34D399" />
                    <Text style={[styles.aboutSpecValue, { color: theme.text }]}>SQLite</Text>
                    <Text style={[styles.aboutSpecLabel, { color: theme.textSecondary }]}>
                      100% Offline
                    </Text>
                  </View>
                  <View
                    style={[
                      styles.aboutSpecTile,
                      { backgroundColor: theme.cardSecondary, borderColor: cardBorder },
                    ]}
                  >
                    <Ionicons name="hardware-chip-outline" size={16} color={theme.tint} />
                    <Text style={[styles.aboutSpecValue, { color: theme.text }]}>Dual AI</Text>
                    <Text style={[styles.aboutSpecLabel, { color: theme.textSecondary }]}>
                      Gemma & Gemini
                    </Text>
                  </View>
                  <View
                    style={[
                      styles.aboutSpecTile,
                      { backgroundColor: theme.cardSecondary, borderColor: cardBorder },
                    ]}
                  >
                    <Ionicons name="shield-checkmark-outline" size={16} color="#38BDF8" />
                    <Text style={[styles.aboutSpecValue, { color: theme.text }]}>Private</Text>
                    <Text style={[styles.aboutSpecLabel, { color: theme.textSecondary }]}>
                      Zero Tracking
                    </Text>
                  </View>
                </View>

                {/* Legal & Policy Navigation Cards */}
                <View style={styles.aboutButtonsCol}>
                  <SmoothPressable
                    onPress={() => setAboutSubView('privacy')}
                    style={[
                      styles.aboutNavRowBtn,
                      { backgroundColor: theme.cardSecondary, borderColor: cardBorder },
                    ]}
                  >
                    <View
                      style={[
                        styles.aboutNavIconBox,
                        { backgroundColor: 'rgba(52, 211, 153, 0.15)' },
                      ]}
                    >
                      <Ionicons name="lock-closed" size={17} color="#34D399" />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.aboutOutlineBtnText, { color: theme.text }]}>
                        {t('privacyPolicy')}
                      </Text>
                      <Text style={[styles.aboutNavSubText, { color: theme.textSecondary }]}>
                        Data ownership, local SQLite & AI privacy
                      </Text>
                    </View>
                    <Ionicons name="chevron-forward" size={17} color={theme.textSecondary} />
                  </SmoothPressable>

                  <SmoothPressable
                    onPress={() => setAboutSubView('terms')}
                    style={[
                      styles.aboutNavRowBtn,
                      { backgroundColor: theme.cardSecondary, borderColor: cardBorder },
                    ]}
                  >
                    <View
                      style={[
                        styles.aboutNavIconBox,
                        { backgroundColor: 'rgba(245, 158, 11, 0.15)' },
                      ]}
                    >
                      <Ionicons name="document-text" size={17} color="#F59E0B" />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.aboutOutlineBtnText, { color: theme.text }]}>
                        {t('termsConditions')}
                      </Text>
                      <Text style={[styles.aboutNavSubText, { color: theme.textSecondary }]}>
                        Athletic safety disclaimer & usage terms
                      </Text>
                    </View>
                    <Ionicons name="chevron-forward" size={17} color={theme.textSecondary} />
                  </SmoothPressable>

                  <SmoothPressable
                    onPress={() => setIsAboutModalVisible(false)}
                    style={[
                      styles.aboutSolidCloseBtn,
                      { backgroundColor: theme.tint, shadowColor: theme.glow },
                    ]}
                  >
                    <Text style={styles.aboutSolidCloseBtnText}>{t('close')}</Text>
                  </SmoothPressable>
                </View>
              </>
            )}

            {(aboutSubView === 'privacy' || aboutSubView === 'terms') && (
              <>
                <View style={styles.modalHeaderRow}>
                  <SmoothPressable
                    onPress={() => setAboutSubView('main')}
                    style={styles.modalBackPill}
                  >
                    <Ionicons name="chevron-back" size={18} color={theme.tint} />
                    <Text style={{ color: theme.tint, fontWeight: '700', fontSize: 14 }}>
                      {t('back')}
                    </Text>
                  </SmoothPressable>
                  <Text style={[styles.modalTitle, { color: theme.text, fontSize: 16.5 }]}>
                    {aboutSubView === 'privacy' ? t('privacyPolicy') : t('termsConditions')}
                  </Text>
                  <SmoothPressable
                    onPress={() => setIsAboutModalVisible(false)}
                    style={styles.closeBtn}
                  >
                    <Ionicons name="close" size={19} color={theme.textSecondary} />
                  </SmoothPressable>
                </View>

                {/* Summary Trust Banner */}
                <View
                  style={[
                    styles.legalTrustStrip,
                    {
                      backgroundColor:
                        aboutSubView === 'privacy'
                          ? 'rgba(52, 211, 153, 0.10)'
                          : 'rgba(245, 158, 11, 0.10)',
                      borderColor:
                        aboutSubView === 'privacy'
                          ? 'rgba(52, 211, 153, 0.30)'
                          : 'rgba(245, 158, 11, 0.30)',
                    },
                  ]}
                >
                  <Ionicons
                    name={aboutSubView === 'privacy' ? 'shield-checkmark' : 'fitness'}
                    size={16}
                    color={aboutSubView === 'privacy' ? '#34D399' : '#F59E0B'}
                  />
                  <Text style={[styles.legalTrustText, { color: theme.text }]}>
                    {aboutSubView === 'privacy'
                      ? 'Effective Nov 2026 • 100% On-Device Storage • Zero Cloud Tracking'
                      : 'Effective Nov 2026 • Train Safely • Verify Form & Weights'}
                  </Text>
                </View>

                <ScrollView
                  showsVerticalScrollIndicator={false}
                  style={{ maxHeight: 370, marginVertical: 10 }}
                  contentContainerStyle={{ gap: 10, paddingRight: 2 }}
                >
                  {(aboutSubView === 'privacy' ? PRIVACY_POLICY.sections : TERMS.sections).map(
                    (sec, idx) => (
                      <View
                        key={sec.heading}
                        style={[
                          styles.policyBlock,
                          { backgroundColor: theme.cardSecondary, borderColor: cardBorder },
                        ]}
                      >
                        <View style={styles.policyHeaderRow}>
                          <View
                            style={[
                              styles.policyIndexBadge,
                              {
                                backgroundColor: `${theme.tint}20`,
                                borderColor: `${theme.tint}45`,
                              },
                            ]}
                          >
                            <Text style={[styles.policyIndexText, { color: theme.tint }]}>
                              0{idx + 1}
                            </Text>
                          </View>
                          <Text style={[styles.policyBlockTitle, { color: theme.text }]}>
                            {sec.heading}
                          </Text>
                        </View>
                        {sec.body.map((p, pIdx) => (
                          <Text
                            key={pIdx}
                            style={[styles.policyBlockBody, { color: theme.textSecondary }]}
                          >
                            {p}
                          </Text>
                        ))}
                      </View>
                    )
                  )}
                </ScrollView>

                <SmoothPressable
                  onPress={() => setIsAboutModalVisible(false)}
                  style={[
                    styles.aboutSolidCloseBtn,
                    { backgroundColor: theme.tint, shadowColor: theme.glow },
                  ]}
                >
                  <Text style={styles.aboutSolidCloseBtnText}>I Understand & Close</Text>
                </SmoothPressable>
              </>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 4,
    paddingBottom: 90,
    gap: 14,
  },
  topBackHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 2,
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 4,
    paddingRight: 16,
  },
  backIconCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backBtnText: {
    fontFamily: FONTS.bold,
    fontSize: 21,
    fontWeight: '800',
    letterSpacing: 0.1,
  },
  backSubText: {
    fontFamily: FONTS.medium,
    fontSize: 12,
    marginTop: 1,
  },
  sectionContainer: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 16,
    overflow: 'hidden',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 6 },
    shadowRadius: 16,
    shadowOpacity: 0.28,
    elevation: 4,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 12,
  },
  sectionHeaderTitle: {
    fontFamily: FONTS.bold,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  innerIdentityCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    gap: 14,
    marginBottom: 14,
  },
  identityAvatarWrapper: {
    position: 'relative',
  },
  identityAvatarCircle: {
    width: 66,
    height: 66,
    borderRadius: 33,
    borderWidth: 2.2,
    overflow: 'hidden',
  },
  cameraEditBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: '#0D0C13',
    alignItems: 'center',
    justifyContent: 'center',
  },
  identityAvatarImg: {
    width: '100%',
    height: '100%',
  },
  identityTextCol: {
    flex: 1,
    justifyContent: 'center',
  },
  identityBadgesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  rankBadgeSmall: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  rankBadgeTextSmall: {
    fontFamily: FONTS.bold,
    color: '#FFFFFF',
    fontSize: 10.5,
    fontWeight: '900',
    letterSpacing: 0.6,
  },
  levelPillSmall: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
  },
  levelPillTextSmall: {
    fontFamily: FONTS.bold,
    fontSize: 10.5,
    fontWeight: '800',
  },
  identityHunterName: {
    fontFamily: FONTS.bold,
    fontSize: 20,
    fontWeight: '800',
  },
  identityAvatarTitle: {
    fontFamily: FONTS.medium,
    fontSize: 12.5,
    marginTop: 2,
  },
  subLabel: {
    fontFamily: FONTS.bold,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.6,
    marginBottom: 7,
  },
  codenameInputWrap: {
    height: 46,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  codenameInput: {
    flex: 1,
    fontFamily: FONTS.semiBold,
    fontSize: 15,
    fontWeight: '700',
  },
  uploadPhotoBtn: {
    height: 44,
    borderRadius: 12,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  uploadPhotoBtnText: {
    fontFamily: FONTS.bold,
    fontSize: 13.5,
    fontWeight: '700',
  },
  auraRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  auraCard: {
    width: '23%',
    flexGrow: 1,
    minWidth: 76,
    paddingVertical: 11,
    paddingHorizontal: 8,
    borderRadius: 14,
    borderWidth: 1.2,
  },
  auraTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  auraCardSelected: {
    shadowOffset: { width: 0, height: 0 },
    shadowRadius: 10,
    shadowOpacity: 0.6,
    elevation: 4,
  },
  auraCircleSwatch: {
    width: 22,
    height: 22,
    borderRadius: 11,
  },
  auraLabel: {
    fontFamily: FONTS.bold,
    fontSize: 12,
    fontWeight: '800',
  },
  auraSub: {
    fontFamily: FONTS.medium,
    fontSize: 10,
    marginTop: 1,
  },
  themeModeRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 10,
  },
  themeModeBtn: {
    flex: 1,
    height: 46,
    borderRadius: 13,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingHorizontal: 10,
  },
  themeIconBadge: {
    width: 26,
    height: 26,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  themeModeBtnActive: {
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 10,
    shadowOpacity: 0.45,
    elevation: 3,
  },
  themeModeText: {
    fontFamily: FONTS.bold,
    fontSize: 13.5,
    fontWeight: '700',
  },
  pillsOptionRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  smallOptionPill: {
    flex: 1,
    minWidth: 70,
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  smallOptionText: {
    fontFamily: FONTS.bold,
    fontSize: 12,
    fontWeight: '700',
  },
  languageSelectRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 13,
    borderRadius: 14,
    borderWidth: 1,
  },
  langCodeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
  },
  langCodeBadgeText: {
    fontFamily: FONTS.bold,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  languageNameText: {
    fontFamily: FONTS.bold,
    fontSize: 14.5,
    fontWeight: '700',
  },
  languageNativeText: {
    fontFamily: FONTS.regular,
    fontSize: 12,
    marginTop: 1,
  },
  dangerZoneContainer: {
    borderRadius: 18,
    paddingTop: 2,
  },
  dangerCardDashed: {
    borderWidth: 1.2,
    borderStyle: 'dashed',
    borderColor: 'rgba(239, 68, 68, 0.55)',
    borderRadius: 14,
    padding: 4,
    backgroundColor: 'rgba(239, 68, 68, 0.06)',
  },
  resetFullBtn: {
    height: 46,
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  resetFullBtnText: {
    fontFamily: FONTS.bold,
    color: '#EF4444',
    fontSize: 14,
    fontWeight: '800',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.78)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  modalCard: {
    width: '100%',
    maxWidth: 420,
    borderRadius: 22,
    borderWidth: 1,
    padding: 18,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 12 },
    shadowRadius: 24,
    shadowOpacity: 0.65,
    elevation: 12,
  },
  modalHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(255,255,255,0.12)',
  },
  modalBackPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingVertical: 4,
    paddingRight: 8,
  },
  modalTitle: {
    fontFamily: FONTS.bold,
    fontSize: 17.5,
    fontWeight: '800',
  },
  modalSubtitle: {
    fontFamily: FONTS.regular,
    fontSize: 12.5,
    marginTop: 2,
  },
  closeBtn: {
    padding: 6,
  },
  avatarLivePreviewCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 14,
    borderWidth: 1.5,
    marginTop: 12,
    marginBottom: 10,
    gap: 12,
  },
  avatarLivePreviewCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 2,
    overflow: 'hidden',
  },
  avatarLivePreviewImg: {
    width: '100%',
    height: '100%',
  },
  avatarLivePreviewTextCol: {
    flex: 1,
  },
  genderBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 4,
    marginBottom: 3,
  },
  genderBadgeText: {
    color: '#000000',
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  avatarLivePreviewName: {
    fontSize: 16,
    fontWeight: '800',
  },
  avatarLivePreviewTitle: {
    fontSize: 12,
    fontWeight: '600',
    marginTop: 1,
  },
  avatarCategoryTabsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 10,
  },
  avatarCategoryTab: {
    flex: 1,
    height: 38,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarCategoryTabText: {
    fontSize: 13,
    fontWeight: '700',
  },
  avatarActionsRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 12,
  },
  avatarCancelBtn: {
    flex: 1,
    height: 44,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarCancelBtnText: {
    fontSize: 14,
    fontWeight: '700',
  },
  avatarConfirmBtn: {
    flex: 1.4,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarConfirmBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },
  avatarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  avatarOptionCard: {
    width: '48%',
    padding: 10,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    position: 'relative',
  },
  avatarOptionImgWrap: {
    width: 50,
    height: 50,
    borderRadius: 25,
    borderWidth: 1.5,
    overflow: 'hidden',
    marginBottom: 6,
  },
  avatarOptionImg: {
    width: '100%',
    height: '100%',
  },
  avatarOptionName: {
    fontSize: 13,
    fontWeight: '700',
    textAlign: 'center',
  },
  avatarOptionSub: {
    fontSize: 10,
    fontWeight: '600',
    marginTop: 1,
    textAlign: 'center',
  },
  avatarCheckBadge: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  languageItemCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  languageItemName: {
    fontSize: 15,
  },
  languageItemNative: {
    fontSize: 11,
    marginTop: 1,
  },
  aboutCardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 13,
    borderRadius: 14,
    borderWidth: 1,
    gap: 12,
  },
  aboutIconSquircle: {
    width: 40,
    height: 40,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  aboutTitleText: {
    fontFamily: FONTS.bold,
    fontSize: 14.5,
    fontWeight: '700',
    marginBottom: 1,
  },
  aboutVersionText: {
    fontFamily: FONTS.regular,
    fontSize: 12,
  },
  versionPillBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 7,
    borderWidth: 1,
  },
  versionPillText: {
    fontFamily: FONTS.bold,
    fontSize: 10.5,
    fontWeight: '800',
  },
  aboutModalCard: {
    width: '100%',
    maxWidth: 420,
    borderRadius: 24,
    borderWidth: 1,
    padding: 20,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 14 },
    shadowOpacity: 0.7,
    shadowRadius: 28,
    elevation: 16,
  },
  aboutHeroCenter: {
    alignItems: 'center',
    marginBottom: 14,
  },
  aboutLogoSquircle: {
    width: 68,
    height: 68,
    borderRadius: 20,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.6,
    shadowRadius: 14,
  },
  aboutTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  aboutAppTitle: {
    fontFamily: FONTS.bold,
    fontSize: 22,
    fontWeight: '900',
    letterSpacing: 0.2,
  },
  aboutAppDesc: {
    fontFamily: FONTS.regular,
    fontSize: 12.5,
    lineHeight: 18,
    textAlign: 'center',
    paddingHorizontal: 8,
  },
  aboutSpecsGrid: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 14,
  },
  aboutSpecTile: {
    flex: 1,
    borderRadius: 12,
    borderWidth: 1,
    paddingVertical: 9,
    paddingHorizontal: 6,
    alignItems: 'center',
    gap: 2,
  },
  aboutSpecValue: {
    fontFamily: FONTS.bold,
    fontSize: 12.5,
    fontWeight: '800',
  },
  aboutSpecLabel: {
    fontFamily: FONTS.medium,
    fontSize: 10,
  },
  aboutButtonsCol: {
    gap: 10,
  },
  aboutNavRowBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
  },
  aboutNavIconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  aboutOutlineBtnText: {
    fontFamily: FONTS.bold,
    fontSize: 14,
    fontWeight: '700',
  },
  aboutNavSubText: {
    fontFamily: FONTS.regular,
    fontSize: 11.5,
    marginTop: 1,
  },
  aboutSolidCloseBtn: {
    height: 46,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },
  aboutSolidCloseBtnText: {
    fontFamily: FONTS.bold,
    color: '#FFFFFF',
    fontSize: 14.5,
    fontWeight: '800',
  },
  legalTrustStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 11,
    borderWidth: 1,
    marginTop: 10,
  },
  legalTrustText: {
    fontFamily: FONTS.semiBold,
    fontSize: 11,
    fontWeight: '700',
    flex: 1,
  },
  policyBlock: {
    padding: 13,
    borderRadius: 14,
    borderWidth: 1,
    gap: 6,
  },
  policyHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  policyIndexBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
  },
  policyIndexText: {
    fontFamily: FONTS.bold,
    fontSize: 10,
    fontWeight: '800',
  },
  policyBlockTitle: {
    fontFamily: FONTS.bold,
    fontSize: 14,
    fontWeight: '800',
    flex: 1,
  },
  policyBlockBody: {
    fontFamily: FONTS.regular,
    fontSize: 12.5,
    lineHeight: 18,
  },
});
