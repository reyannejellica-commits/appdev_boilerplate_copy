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
import { deleteModel } from '@/ai/local';
import { Button } from '@/components/Button';
import { SmoothPressable } from '@/components/SmoothPressable';
import { clearAllConversations } from '@/db/conversations';
import { updateHunterName } from '@/db/hunter';
import { useTranslation } from '@/i18n';
import { useSettings } from '@/settings/SettingsContext';
import { type LanguageCode, type ThemeColorKey } from '@/settings/storage';
import { useTheme } from '@/theme';
import { confirmAction, showMessage } from '@/utils/confirm';
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
  { id: 'purple', label: 'Obsidian', sub: 'Purple', color: '#A855F7' },
  { id: 'red', label: 'Crimson', sub: 'Burgundy', color: '#EF4444' },
  { id: 'blue', label: 'Azure', sub: 'Neon', color: '#06B6D4' },
  { id: 'rose', label: 'Rose Pink', sub: 'Sakura Glow', color: '#D982A5' },
];

export default function SettingsScreen() {
  const theme = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { settings, update, reset } = useSettings();
  const { t } = useTranslation();

  const [nicknameDraft, setNicknameDraft] = useState(settings.nickname || 'Hunter');
  const [isAvatarModalVisible, setIsAvatarModalVisible] = useState(false);
  const [isLanguageModalVisible, setIsLanguageModalVisible] = useState(false);
  const [isAboutModalVisible, setIsAboutModalVisible] = useState(false);
  const [aboutSubView, setAboutSubView] = useState<'main' | 'privacy' | 'terms'>('main');

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

  return (
    <View style={[styles.root, { backgroundColor: theme.background }]}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* 1. TOP NAV BAR WITH BACK ARROW & "Settings" ON THE LEFT */}
        <View style={[styles.topBackHeader, { paddingTop: Math.max(insets.top, 8) }]}>
          <SmoothPressable
            onPress={handleBack}
            style={styles.backBtn}
            accessibilityRole="button"
            accessibilityLabel={t('settings')}
            hitSlop={12}
          >
            <Ionicons name="chevron-back" size={28} color={theme.tint} />
            <Text style={[styles.backBtnText, { color: theme.text }]}>{t('settings')}</Text>
          </SmoothPressable>
        </View>

        {/* 2. CARD 1: HUNTER IDENTITY */}
        <View style={[styles.sectionContainer, { backgroundColor: theme.card, borderColor: theme.borderRose }]}>
          <Text style={[styles.sectionHeaderTitle, { color: theme.textSecondary }]}>
            {t('hunterIdentity')}
          </Text>

          {/* Inner Identity Display Card */}
          <View style={[styles.innerIdentityCard, { backgroundColor: theme.cardSecondary, borderColor: theme.border }]}>
            <View
              style={[
                styles.identityAvatarWrapper,
                {
                  borderColor: `${theme.tint}45`,
                  backgroundColor: `${theme.tint}12`,
                },
              ]}
            >
              <View style={[styles.identityAvatarCircle, { borderColor: theme.tint, shadowColor: theme.glow }]}>
                <Image source={currentAvatar.image} style={styles.identityAvatarImg} resizeMode="cover" />
              </View>
            </View>
            <View style={styles.identityTextCol}>
              <View style={[styles.rankBadgeSmall, { backgroundColor: theme.tint }]}>
                <Text style={styles.rankBadgeTextSmall}>E-RANK</Text>
              </View>
              <Text style={[styles.identityHunterName, { color: theme.text }]} numberOfLines={1}>
                {settings.nickname || 'Hunter'}
              </Text>
              <Text style={[styles.identityAvatarTitle, { color: theme.tint }]}>
                {currentAvatar.name}
              </Text>
            </View>
          </View>

          {/* Edit Codename */}
          <Text style={[styles.subLabel, { color: theme.textSecondary }]}>{t('editCodename')}</Text>
          <TextInput
            style={[
              styles.codenameInput,
              {
                backgroundColor: theme.cardSecondary,
                borderColor: theme.border,
                color: theme.text,
              },
            ]}
            value={nicknameDraft}
            onChangeText={handleUpdateNickname}
            placeholder={settings.nickname || 'Hunter'}
            placeholderTextColor={theme.textSecondary}
            maxLength={32}
            autoCorrect={false}
          />

          {/* Choose Avatar / Upload Photo Button */}
          <SmoothPressable
            onPress={openAvatarModal}
            style={[styles.uploadPhotoBtn, { backgroundColor: theme.cardSecondary, borderColor: theme.border }]}
          >
            <Ionicons name="camera-outline" size={18} color={theme.tint} style={{ marginRight: 8 }} />
            <Text style={[styles.uploadPhotoBtnText, { color: theme.tint }]}>{t('uploadPhoto')}</Text>
          </SmoothPressable>
        </View>

        {/* 3. CARD 2: AURA PALETTE SELECTOR (Changes whole app colors) */}
        <View style={[styles.sectionContainer, { backgroundColor: theme.card, borderColor: theme.borderRose }]}>
          <Text style={[styles.sectionHeaderTitle, { color: theme.textSecondary }]}>
            {t('auraPalette')}
          </Text>

          <View style={styles.auraRow}>
            {AURA_PRESETS.map((preset) => {
              const isSelected = settings.colorScheme === preset.id;
              return (
                <SmoothPressable
                  key={preset.id}
                  onPress={() => update('colorScheme', preset.id)}
                  style={[
                    styles.auraCard,
                    {
                      backgroundColor: theme.cardSecondary,
                      borderColor: isSelected ? preset.color : theme.border,
                      shadowColor: isSelected ? preset.color : 'transparent',
                    },
                    isSelected && styles.auraCardSelected,
                  ]}
                >
                  <View style={[styles.auraCircleSwatch, { backgroundColor: preset.color }]} />
                  <Text style={[styles.auraLabel, { color: theme.text }]}>{preset.label}</Text>
                  <Text style={[styles.auraSub, { color: theme.textSecondary }]}>{preset.sub}</Text>
                </SmoothPressable>
              );
            })}
          </View>
        </View>

        {/* 4. CARD 3: SYSTEM CONTROLS (Dark / Light + Audio Feedback) */}
        <View style={[styles.sectionContainer, { backgroundColor: theme.card, borderColor: theme.borderRose }]}>
          <Text style={[styles.sectionHeaderTitle, { color: theme.textSecondary }]}>
            {t('systemControls')}
          </Text>

          {/* Dark / Light Toggle */}
          <View style={styles.themeModeRow}>
            <SmoothPressable
              onPress={() => toggleThemeMode('dark')}
              style={[
                styles.themeModeBtn,
                {
                  backgroundColor: settings.theme === 'dark' ? theme.tint : theme.cardSecondary,
                  borderColor: settings.theme === 'dark' ? theme.tint : theme.border,
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
                      settings.theme === 'dark' ? 'rgba(255, 255, 255, 0.22)' : `${theme.textSecondary}18`,
                  },
                ]}
              >
                <Ionicons
                  name="moon-outline"
                  size={16}
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
                  borderColor: settings.theme === 'light' ? theme.tint : theme.border,
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
                      settings.theme === 'light' ? 'rgba(255, 255, 255, 0.22)' : `${theme.textSecondary}18`,
                  },
                ]}
              >
                <Ionicons
                  name="sunny-outline"
                  size={16}
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
        </View>

        {/* 5. CARD 4: SYSTEM LANGUAGE (100% Dynamic Language Switching) */}
        <View style={[styles.sectionContainer, { backgroundColor: theme.card, borderColor: theme.borderRose }]}>
          <Text style={[styles.sectionHeaderTitle, { color: theme.textSecondary }]}>
            {t('systemLanguage')}
          </Text>

          <SmoothPressable
            onPress={() => setIsLanguageModalVisible(true)}
            style={[styles.languageSelectRow, { backgroundColor: theme.cardSecondary, borderColor: theme.border }]}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <View style={[styles.langCodeBadge, { backgroundColor: `${theme.tint}1A`, borderColor: theme.border }]}>
                <Ionicons name="globe-outline" size={15} color={theme.tint} />
                <Text style={[styles.langCodeBadgeText, { color: theme.tint }]}>
                  {currentLanguage.code.toUpperCase()}
                </Text>
              </View>
              <View>
                <Text style={[styles.languageNameText, { color: theme.text }]}>{currentLanguage.name}</Text>
                <Text style={[styles.languageNativeText, { color: theme.textSecondary }]}>
                  {currentLanguage.nativeName}
                </Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={18} color={theme.textSecondary} />
          </SmoothPressable>
        </View>

        {/* 6. CARD 5: ABOUT & UPDATES */}
        <View style={[styles.sectionContainer, { backgroundColor: theme.card, borderColor: theme.borderRose }]}>
          <SmoothPressable
            onPress={() => {
              setAboutSubView('main');
              setIsAboutModalVisible(true);
            }}
            style={[styles.aboutCardRow, { backgroundColor: theme.cardSecondary, borderColor: theme.border }]}
            accessibilityRole="button"
            accessibilityLabel={t('aboutUpdates')}
          >
            <View style={[styles.aboutIconSquircle, { backgroundColor: `${theme.tint}1A`, borderColor: theme.border }]}>
              <Ionicons name="information-circle-outline" size={22} color={theme.tint} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.aboutTitleText, { color: theme.text }]}>{t('aboutUpdates')}</Text>
              <Text style={[styles.aboutVersionText, { color: theme.textSecondary }]}>v1.0.0</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={theme.textSecondary} />
          </SmoothPressable>
        </View>

        {/* 6b. SYSTEM PROTOCOL & ONBOARDING GUIDE */}
        <View style={[styles.sectionContainer, { backgroundColor: theme.card, borderColor: theme.borderRose }]}>
          <SmoothPressable
            onPress={() => router.push('/onboarding')}
            style={[styles.aboutCardRow, { backgroundColor: theme.cardSecondary, borderColor: theme.border }]}
            accessibilityRole="button"
            accessibilityLabel={t('systemProtocolGuide')}
          >
            <View style={[styles.aboutIconSquircle, { backgroundColor: `${theme.tint}1A`, borderColor: theme.border }]}>
              <Ionicons name="compass-outline" size={22} color={theme.tint} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.aboutTitleText, { color: theme.text }]}>{t('systemProtocolGuide')}</Text>
              <Text style={[styles.aboutVersionText, { color: theme.textSecondary }]}>{t('reviewOnboarding')}</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={theme.textSecondary} />
          </SmoothPressable>
        </View>

        {/* 7. CARD 6: DANGER ZONE */}
        <View style={styles.dangerZoneContainer}>
          <Text style={[styles.sectionHeaderTitle, { color: '#EF4444' }]}>
            {t('dangerZone')}
          </Text>

          <View style={styles.dangerCardDashed}>
            <SmoothPressable
              onPress={resetAllData}
              style={styles.resetFullBtn}
              accessibilityLabel="Factory Reset Local Data"
            >
              <Ionicons name="warning" size={18} color="#EF4444" style={{ marginRight: 8 }} />
              <Text style={styles.resetFullBtnText}>{t('factoryReset')}</Text>
            </SmoothPressable>
          </View>
        </View>
      </ScrollView>

      {/* MODAL 1: CHOOSE 3D PLUSHIE AVATAR (5 Male · 5 Female) */}
      <Modal visible={isAvatarModalVisible} transparent animationType="fade" onRequestClose={handleCancelAvatar}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, { backgroundColor: theme.card, borderColor: theme.borderRose, maxHeight: '90%' }]}>
            {/* Modal Header */}
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
            <View style={[styles.avatarLivePreviewCard, { backgroundColor: theme.cardSecondary, borderColor: stagedAvatar.color }]}>
              <View style={[styles.avatarLivePreviewCircle, { borderColor: stagedAvatar.color, shadowColor: stagedAvatar.color }]}>
                <Image source={stagedAvatar.image} style={styles.avatarLivePreviewImg} resizeMode="cover" />
              </View>
              <View style={styles.avatarLivePreviewTextCol}>
                <View style={[styles.genderBadge, { backgroundColor: stagedAvatar.color, flexDirection: 'row', alignItems: 'center', gap: 4 }]}>
                  <Ionicons name={stagedAvatar.gender === 'male' ? 'male' : 'female'} size={12} color="#FFFFFF" />
                  <Text style={styles.genderBadgeText}>
                    {stagedAvatar.gender === 'male' ? 'MALE PLUSHIE' : 'FEMALE PLUSHIE'}
                  </Text>
                </View>
                <Text style={[styles.avatarLivePreviewName, { color: theme.text }]} numberOfLines={1}>
                  {stagedAvatar.name}
                </Text>
                <Text style={[styles.avatarLivePreviewTitle, { color: stagedAvatar.color }]} numberOfLines={1}>
                  {stagedAvatar.title}
                </Text>
              </View>
            </View>

            {/* Male / Female Category Switcher Tabs */}
            <View style={styles.avatarCategoryTabsRow}>
              <SmoothPressable
                onPress={() => {
                  setAvatarCategory('male');
                }}
                style={[
                  styles.avatarCategoryTab,
                  {
                    backgroundColor: avatarCategory === 'male' ? theme.tint : theme.cardSecondary,
                    borderColor: avatarCategory === 'male' ? theme.tint : theme.border,
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
                onPress={() => {
                  setAvatarCategory('female');
                }}
                style={[
                  styles.avatarCategoryTab,
                  {
                    backgroundColor: avatarCategory === 'female' ? theme.tint : theme.cardSecondary,
                    borderColor: avatarCategory === 'female' ? theme.tint : theme.border,
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

            {/* Avatars Grid for Current Category */}
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingVertical: 8 }}>
              <View style={styles.avatarGrid}>
                {currentCategoryAvatars.map((av) => {
                  const isSelected = stagedAvatarId === av.id;
                  return (
                    <SmoothPressable
                      key={av.id}
                      onPress={() => {
                        setStagedAvatarId(av.id);
                      }}
                      style={[
                        styles.avatarOptionCard,
                        {
                          backgroundColor: theme.cardSecondary,
                          borderColor: isSelected ? av.color : theme.border,
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
                        <Image source={av.image} style={styles.avatarOptionImg} resizeMode="cover" />
                      </View>
                      <Text style={[styles.avatarOptionName, { color: theme.text }]} numberOfLines={1}>
                        {av.name}
                      </Text>
                      <Text style={[styles.avatarOptionSub, { color: av.color }]} numberOfLines={1}>
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

            {/* Confirm & Cancel Buttons */}
            <View style={styles.avatarActionsRow}>
              <SmoothPressable
                onPress={handleCancelAvatar}
                style={[styles.avatarCancelBtn, { backgroundColor: theme.cardSecondary, borderColor: theme.border }]}
              >
                <Text style={[styles.avatarCancelBtnText, { color: theme.textSecondary }]}>{t('cancel')}</Text>
              </SmoothPressable>
              <SmoothPressable
                onPress={handleConfirmAvatar}
                style={[styles.avatarConfirmBtn, { backgroundColor: theme.tint, shadowColor: theme.glow }]}
              >
                <Text style={styles.avatarConfirmBtnText}>Confirm Avatar</Text>
              </SmoothPressable>
            </View>
          </View>
        </View>
      </Modal>

      {/* MODAL 2: LANGUAGE SELECTOR */}
      <Modal visible={isLanguageModalVisible} transparent animationType="fade" onRequestClose={() => setIsLanguageModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, { backgroundColor: theme.card, borderColor: theme.borderRose, maxHeight: '80%' }]}>
            <View style={styles.modalHeaderRow}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.modalTitle, { color: theme.text }]}>{t('selectLanguage')}</Text>
                <Text style={[styles.modalSubtitle, { color: theme.textSecondary }]}>
                  Choose your system language
                </Text>
              </View>
              <SmoothPressable onPress={() => setIsLanguageModalVisible(false)} style={styles.closeBtn}>
                <Ionicons name="close" size={20} color={theme.textSecondary} />
              </SmoothPressable>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingVertical: 10, gap: 8 }}>
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
                        borderColor: isSelected ? theme.tint : theme.border,
                      },
                      isSelected && {
                        shadowColor: theme.tint,
                        shadowOffset: { width: 0, height: 0 },
                        shadowRadius: 8,
                        shadowOpacity: 0.6,
                        elevation: 3,
                      },
                    ]}
                  >
                    <View style={[styles.langCodeBadge, { backgroundColor: `${theme.tint}1A`, borderColor: theme.border, marginRight: 12 }]}>
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
                    {isSelected && <Ionicons name="checkmark-circle" size={20} color={theme.tint} />}
                  </SmoothPressable>
                );
              })}
            </ScrollView>

            <Button label={t('close')} variant="secondary" onPress={() => setIsLanguageModalVisible(false)} style={{ marginTop: 8 }} />
          </View>
        </View>
      </Modal>

      {/* MODAL 4: ABOUT & UPDATES (PEAKFIT V1.0.0, PRIVACY, TERMS, CLOSE) */}
      <Modal
        visible={isAboutModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setIsAboutModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.aboutModalCard, { backgroundColor: theme.card, borderColor: theme.borderRose }]}>
            {aboutSubView === 'main' && (
              <>
                <Text style={[styles.aboutAppTitle, { color: theme.text }]}>PeakFit v1.0.0</Text>
                <Text style={[styles.aboutAppDesc, { color: theme.textSecondary }]}>
                  {t('aboutModalDesc')}
                </Text>

                <View style={styles.aboutButtonsCol}>
                  {/* Button 1: Privacy Policy */}
                  <SmoothPressable
                    onPress={() => setAboutSubView('privacy')}
                    style={[
                      styles.aboutOutlineBtn,
                      { backgroundColor: theme.cardSecondary, borderColor: theme.border },
                    ]}
                  >
                    <Text style={[styles.aboutOutlineBtnText, { color: theme.text }]}>
                      {t('privacyPolicy')}
                    </Text>
                  </SmoothPressable>

                  {/* Button 2: Terms & Conditions */}
                  <SmoothPressable
                    onPress={() => setAboutSubView('terms')}
                    style={[
                      styles.aboutOutlineBtn,
                      { backgroundColor: theme.cardSecondary, borderColor: theme.border },
                    ]}
                  >
                    <Text style={[styles.aboutOutlineBtnText, { color: theme.text }]}>
                      {t('termsConditions')}
                    </Text>
                  </SmoothPressable>

                  {/* Button 3: Close (Solid Accent Button) */}
                  <SmoothPressable
                    onPress={() => setIsAboutModalVisible(false)}
                    style={[
                      styles.aboutSolidCloseBtn,
                      { backgroundColor: theme.tint, shadowColor: theme.tint },
                    ]}
                  >
                    <Text style={[styles.aboutSolidCloseBtnText, { color: '#FFFFFF' }]}>
                      {t('close')}
                    </Text>
                  </SmoothPressable>
                </View>
              </>
            )}

            {aboutSubView === 'privacy' && (
              <>
                <View style={styles.modalHeaderRow}>
                  <SmoothPressable
                    onPress={() => setAboutSubView('main')}
                    style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}
                  >
                    <Ionicons name="chevron-back" size={20} color={theme.tint} />
                    <Text style={{ color: theme.tint, fontWeight: '700', fontSize: 15 }}>{t('back')}</Text>
                  </SmoothPressable>
                  <Text style={[styles.modalTitle, { color: theme.text, fontSize: 17 }]}>
                    {t('privacyPolicy')}
                  </Text>
                  <View style={{ width: 40 }} />
                </View>

                <ScrollView
                  showsVerticalScrollIndicator={false}
                  style={{ maxHeight: 320, marginVertical: 12 }}
                  contentContainerStyle={{ gap: 10, paddingRight: 4 }}
                >
                  <View style={[styles.policyBlock, { backgroundColor: theme.cardSecondary, borderColor: theme.border }]}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                      <Ionicons name="lock-closed-outline" size={16} color={theme.tint} />
                      <Text style={[styles.policyBlockTitle, { color: theme.tint }]}>100% Offline Architecture</Text>
                    </View>
                    <Text style={[styles.policyBlockBody, { color: theme.textSecondary }]}>
                      PeakFit does not track, collect, transmit, or monetize your biometric, workout, or personal data. Everything is stored locally on your device in secure SQLite storage.
                    </Text>
                  </View>

                  <View style={[styles.policyBlock, { backgroundColor: theme.cardSecondary, borderColor: theme.border }]}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                      <Ionicons name="hardware-chip-outline" size={16} color={theme.tint} />
                      <Text style={[styles.policyBlockTitle, { color: theme.tint }]}>Private AI Processing</Text>
                    </View>
                    <Text style={[styles.policyBlockBody, { color: theme.textSecondary }]}>
                      Local AI execution runs strictly on your smartphone via LiteRT without sending conversations to external third parties.
                    </Text>
                  </View>

                  <View style={[styles.policyBlock, { backgroundColor: theme.cardSecondary, borderColor: theme.border }]}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                      <Ionicons name="shield-checkmark-outline" size={16} color={theme.tint} />
                      <Text style={[styles.policyBlockTitle, { color: theme.tint }]}>Complete User Ownership</Text>
                    </View>
                    <Text style={[styles.policyBlockBody, { color: theme.textSecondary }]}>
                      You hold absolute ownership of your workout logs. You can delete or factory-reset your local records at any time.
                    </Text>
                  </View>
                </ScrollView>

                <Button label={t('close')} variant="secondary" onPress={() => setIsAboutModalVisible(false)} />
              </>
            )}

            {aboutSubView === 'terms' && (
              <>
                <View style={styles.modalHeaderRow}>
                  <SmoothPressable
                    onPress={() => setAboutSubView('main')}
                    style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}
                  >
                    <Ionicons name="chevron-back" size={20} color={theme.tint} />
                    <Text style={{ color: theme.tint, fontWeight: '700', fontSize: 15 }}>{t('back')}</Text>
                  </SmoothPressable>
                  <Text style={[styles.modalTitle, { color: theme.text, fontSize: 17 }]}>
                    {t('termsConditions')}
                  </Text>
                  <View style={{ width: 40 }} />
                </View>

                <ScrollView
                  showsVerticalScrollIndicator={false}
                  style={{ maxHeight: 320, marginVertical: 12 }}
                  contentContainerStyle={{ gap: 10, paddingRight: 4 }}
                >
                  <View style={[styles.policyBlock, { backgroundColor: theme.cardSecondary, borderColor: theme.border }]}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                      <Ionicons name="barbell-outline" size={16} color={theme.tint} />
                      <Text style={[styles.policyBlockTitle, { color: theme.tint }]}>Athletic Disclaimer</Text>
                    </View>
                    <Text style={[styles.policyBlockBody, { color: theme.textSecondary }]}>
                      PeakFit is designed for athletic progress tracking and sports science education. It is not medical software or clinical healthcare advice.
                    </Text>
                  </View>

                  <View style={[styles.policyBlock, { backgroundColor: theme.cardSecondary, borderColor: theme.border }]}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                      <Ionicons name="warning-outline" size={16} color={theme.tint} />
                      <Text style={[styles.policyBlockTitle, { color: theme.tint }]}>Physical Health Safety</Text>
                    </View>
                    <Text style={[styles.policyBlockBody, { color: theme.textSecondary }]}>
                      Always consult a qualified medical physician before undertaking high-intensity physical routines, maximal lifting (1RM), or strenuous cardio challenges.
                    </Text>
                  </View>

                  <View style={[styles.policyBlock, { backgroundColor: theme.cardSecondary, borderColor: theme.border }]}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                      <Ionicons name="document-text-outline" size={16} color={theme.tint} />
                      <Text style={[styles.policyBlockTitle, { color: theme.tint }]}>License & Responsibility</Text>
                    </View>
                    <Text style={[styles.policyBlockBody, { color: theme.textSecondary }]}>
                      PeakFit grants you a personal, offline license for health tracking. Users perform exercises at their own discretion and form awareness.
                    </Text>
                  </View>
                </ScrollView>

                <Button label={t('close')} variant="secondary" onPress={() => setIsAboutModalVisible(false)} />
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
    gap: 16,
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
    gap: 6,
    paddingVertical: 4,
    paddingRight: 16,
  },
  backBtnText: {
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: 0.2,
  },
  screenTitle: {
    fontSize: 20,
    fontWeight: '900',
    letterSpacing: 0.2,
  },
  sectionContainer: {
    borderRadius: 18,
    borderWidth: 1.2,
    padding: 18,
    shadowOffset: { width: 0, height: 0 },
    shadowRadius: 14,
    shadowOpacity: 0.5,
    elevation: 4,
  },
  sectionHeaderTitle: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.8,
    marginBottom: 12,
  },
  innerIdentityCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 18,
    borderRadius: 18,
    borderWidth: 1.2,
    gap: 16,
    marginBottom: 16,
  },
  identityAvatarWrapper: {
    borderRadius: 42,
    padding: 3,
    borderWidth: 1.5,
  },
  identityAvatarCircle: {
    width: 68,
    height: 68,
    borderRadius: 34,
    borderWidth: 2.5,
    overflow: 'hidden',
    shadowOffset: { width: 0, height: 0 },
    shadowRadius: 14,
    shadowOpacity: 0.9,
    elevation: 7,
  },
  identityAvatarImg: {
    width: '100%',
    height: '100%',
  },
  identityTextCol: {
    flex: 1,
    justifyContent: 'center',
  },
  rankBadgeSmall: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 6,
    marginBottom: 4,
  },
  rankBadgeTextSmall: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 0.8,
  },
  identityHunterName: {
    fontSize: 22,
    fontWeight: '900',
    letterSpacing: 0.2,
  },
  identityAvatarTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginTop: 3,
  },
  subLabel: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.6,
    marginBottom: 8,
  },
  codenameInput: {
    height: 48,
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 14,
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 12,
  },
  uploadPhotoBtn: {
    height: 44,
    borderRadius: 10,
    borderWidth: 1.2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  uploadPhotoBtnText: {
    fontSize: 14,
    fontWeight: '700',
  },
  auraRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  auraCard: {
    width: '48%',
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 1.5,
  },
  auraCardSelected: {
    shadowOffset: { width: 0, height: 0 },
    shadowRadius: 14,
    shadowOpacity: 0.85,
    elevation: 5,
  },
  auraCircleSwatch: {
    width: 26,
    height: 26,
    borderRadius: 13,
    marginBottom: 8,
  },
  auraLabel: {
    fontSize: 13,
    fontWeight: '800',
  },
  auraSub: {
    fontSize: 11,
    marginTop: 2,
  },
  themeModeRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 12,
  },
  themeModeBtn: {
    flex: 1,
    height: 48,
    borderRadius: 14,
    borderWidth: 1.2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingHorizontal: 10,
  },
  themeIconBadge: {
    width: 28,
    height: 28,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  themeModeBtnActive: {
    shadowOffset: { width: 0, height: 0 },
    shadowRadius: 10,
    shadowOpacity: 0.7,
    elevation: 3,
  },
  themeModeText: {
    fontSize: 14,
    fontWeight: '700',
  },
  audioFeedbackBtn: {
    height: 48,
    borderRadius: 14,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  soundAlertsBtn: {
    height: 48,
    borderRadius: 14,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  audioFeedbackBtnText: {
    fontSize: 14,
    fontWeight: '700',
  },
  languageSelectRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
    borderRadius: 12,
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
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  languageNameText: {
    fontSize: 15,
    fontWeight: '700',
  },
  languageNativeText: {
    fontSize: 12,
    marginTop: 2,
  },
  dangerZoneContainer: {
    borderRadius: 18,
    paddingTop: 4,
  },
  dangerCardDashed: {
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: 'rgba(239, 68, 68, 0.6)',
    borderRadius: 14,
    padding: 4,
    backgroundColor: 'rgba(239, 68, 68, 0.05)',
  },
  resetFullBtn: {
    height: 48,
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  resetFullBtnText: {
    color: '#EF4444',
    fontSize: 14,
    fontWeight: '800',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalCard: {
    width: '100%',
    maxWidth: 420,
    borderRadius: 18,
    borderWidth: 1.2,
    padding: 20,
    shadowColor: '#D982A5',
    shadowOffset: { width: 0, height: 0 },
    shadowRadius: 18,
    shadowOpacity: 0.75,
    elevation: 8,
  },
  modalHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#35242D',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
  },
  modalSubtitle: {
    fontSize: 13,
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
    shadowOffset: { width: 0, height: 0 },
    shadowRadius: 8,
    shadowOpacity: 0.8,
    elevation: 4,
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
    borderWidth: 1.2,
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
    borderWidth: 1.2,
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
    shadowOffset: { width: 0, height: 0 },
    shadowRadius: 10,
    shadowOpacity: 0.7,
    elevation: 4,
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
    borderWidth: 1.2,
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
    borderWidth: 1.2,
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
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    gap: 14,
  },
  aboutIconSquircle: {
    width: 42,
    height: 42,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  aboutTitleText: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 2,
  },
  aboutVersionText: {
    fontSize: 13,
    fontWeight: '500',
  },
  aboutModalCard: {
    width: '100%',
    maxWidth: 380,
    borderRadius: 22,
    borderWidth: 1.2,
    padding: 22,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.7,
    shadowRadius: 20,
    elevation: 8,
  },
  aboutAppTitle: {
    fontSize: 20,
    fontWeight: '900',
    letterSpacing: 0.3,
    marginBottom: 8,
  },
  aboutAppDesc: {
    fontSize: 13,
    lineHeight: 19,
    fontWeight: '400',
    marginBottom: 20,
  },
  aboutButtonsCol: {
    gap: 12,
  },
  aboutOutlineBtn: {
    height: 48,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  aboutOutlineBtnText: {
    fontSize: 15,
    fontWeight: '700',
  },
  aboutSolidCloseBtn: {
    height: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },
  aboutSolidCloseBtnText: {
    fontSize: 15,
    fontWeight: '700',
  },
  policyBlock: {
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    gap: 4,
  },
  policyBlockTitle: {
    fontSize: 14,
    fontWeight: '700',
  },
  policyBlockBody: {
    fontSize: 12,
    lineHeight: 17,
  },
});
