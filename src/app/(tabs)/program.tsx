import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useMemo, useState } from 'react';
import {
  Image,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { PrimeAwakeningModal } from '@/components/PrimeAwakeningModal';
import { SmoothPressable } from '@/components/SmoothPressable';
import { WORKOUT_PROGRAMS, type WorkoutProgram } from '@/db/programs';
import { useTranslation } from '@/i18n';
import { useSettings } from '@/settings/SettingsContext';
import { useTheme } from '@/theme';
import { playAlertSound } from '@/utils/alertSounds';
import { showMessage } from '@/utils/confirm';
import { getAvatarById } from '@/utils/profileOptions';

export default function ProgramScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { settings, update } = useSettings();
  const { t } = useTranslation();
  const [awakeningOpen, setAwakeningOpen] = useState(false);

  const currentAvatar = useMemo(() => getAvatarById(settings.avatarId), [settings.avatarId]);
  const activeProgramId = settings.activeProgramId || 'fullbody-monarch';

  const handleSelectProgram = async (program: WorkoutProgram) => {
    if (activeProgramId === program.id) return;

    playAlertSound(settings.timerSoundType || 'bell');
    await update('activeProgramId', program.id);

    showMessage(
      'PROGRAM ACTIVATED!',
      `${program.title} is now your active training split on the Home screen.`
    );
  };

  return (
    <View style={[styles.root, { backgroundColor: theme.background }]}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* 1. TOP HUNTER BAR (Profile tap opens Prime Awakening) */}
        <View style={styles.topHunterBar}>
          <SmoothPressable
            onPress={() => setAwakeningOpen(true)}
            style={styles.topHunterLeft}
            accessibilityRole="button"
            accessibilityLabel="Open Prime Awakening Profile"
          >
            <View
              style={[
                styles.topAvatarWrapper,
                {
                  borderColor: `${theme.tint}45`,
                  backgroundColor: `${theme.tint}12`,
                },
              ]}
            >
              <View
                style={[
                  styles.topAvatarCircle,
                  { borderColor: theme.tint, shadowColor: theme.glow },
                ]}
              >
                <Image source={currentAvatar.image} style={styles.topAvatarImg} resizeMode="cover" />
              </View>
            </View>
            <View style={styles.topHunterInfo}>
              <View style={styles.topNameRow}>
                <Text style={[styles.topHunterName, { color: theme.text }]} numberOfLines={1}>
                  {settings.nickname || 'John Mark Dalumpienes'}
                </Text>
                <View style={[styles.rankBadge, { backgroundColor: theme.tint }]}>
                  <Text style={styles.rankBadgeText}>B-RANK</Text>
                </View>
              </View>
              <Text style={[styles.topQuestSubtitle, { color: theme.textSecondary }]}>
                {t('questSubtitle')}
              </Text>
            </View>
          </SmoothPressable>

          <View style={styles.topHunterActions}>
            <SmoothPressable
              onPress={() => router.push('/settings')}
              style={[
                styles.headerActionBtn,
                { backgroundColor: theme.cardSecondary, borderColor: theme.border },
              ]}
              accessibilityRole="button"
              accessibilityLabel="Open Settings"
              hitSlop={8}
            >
              <Ionicons name="settings-sharp" size={18} color={theme.tint} />
            </SmoothPressable>
          </View>
        </View>

        {/* 2. SCREEN TITLE & SUBTITLE */}
        <View style={styles.titleSection}>
          <Text style={[styles.screenMainTitle, { color: theme.text }]}>
            {t('selectProgramTitle')}
          </Text>
          <Text style={[styles.screenSubtitle, { color: theme.textSecondary }]}>
            {t('selectProgramSub')}
          </Text>
        </View>

        {/* 3. LIST OF ALL 6 WORKOUT PROGRAMS */}
        {WORKOUT_PROGRAMS.map((program) => {
          const isActive = activeProgramId === program.id;

          return (
            <View
              key={program.id}
              style={[
                styles.programCard,
                {
                  backgroundColor: theme.card,
                  borderColor: isActive ? theme.tint : theme.borderRose,
                  shadowColor: isActive ? theme.glow : theme.glow,
                  shadowOpacity: isActive ? 0.7 : 0.35,
                },
              ]}
            >
              {/* Top Split & Category Tag */}
              <Text style={[styles.programTagText, { color: theme.tint }]}>{program.tag}</Text>

              {/* Program Title */}
              <Text style={[styles.programTitleText, { color: theme.text }]}>
                {program.title}
              </Text>

              {/* Program Description */}
              <Text style={[styles.programDescText, { color: theme.textSecondary }]}>
                {program.description}
              </Text>

              {/* Day Pills Grid */}
              <View style={styles.dayPillsContainer}>
                {program.days.map((d) => (
                  <View
                    key={d.id}
                    style={[
                      styles.dayPill,
                      {
                        backgroundColor: theme.cardSecondary,
                        borderColor: theme.border,
                      },
                    ]}
                  >
                    <Text style={[styles.dayPillText, { color: theme.text }]}>
                      {d.shortTab || d.name}
                    </Text>
                  </View>
                ))}
              </View>

              {/* Action Button: Active Regimen vs Select Program */}
              <SmoothPressable
                onPress={() => handleSelectProgram(program)}
                style={[
                  styles.selectBtn,
                  isActive
                    ? [styles.activeRegimenBtn, { backgroundColor: theme.tint, shadowColor: theme.glow }]
                    : [
                        styles.inactiveSelectBtn,
                        {
                          backgroundColor: theme.cardSecondary,
                          borderColor: theme.border,
                        },
                      ],
                ]}
                accessibilityRole="button"
                accessibilityLabel={
                  isActive ? `${program.title} is active` : `Select ${program.title}`
                }
              >
                <Text style={styles.selectBtnText}>
                  {isActive ? t('activeProgramBtn') : t('selectProgramBtn')}
                </Text>
              </SmoothPressable>
            </View>
          );
        })}

        <View style={{ height: 110 }} />
      </ScrollView>

      {/* Prime Awakening Profile Modal */}
      <PrimeAwakeningModal
        visible={awakeningOpen}
        onClose={() => setAwakeningOpen(false)}
        onSave={() => {
          // Program selection and codename reactively sync with SettingsContext
        }}
      />
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
    paddingTop: 14,
  },

  // TOP HUNTER BAR
  topHunterBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  topHunterLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 10,
  },
  topAvatarWrapper: {
    marginRight: 10,
    borderRadius: 28,
    padding: 2,
    borderWidth: 1.5,
  },
  topAvatarCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 2,
    overflow: 'hidden',
    shadowOffset: { width: 0, height: 0 },
    shadowRadius: 10,
    shadowOpacity: 0.85,
    elevation: 5,
  },
  topAvatarImg: {
    width: '100%',
    height: '100%',
  },
  topHunterInfo: {
    flex: 1,
  },
  topNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  topHunterName: {
    fontFamily: 'Poppins-Bold',
    fontSize: 19,
    fontWeight: '900',
    letterSpacing: 0.2,
    maxWidth: '75%',
  },
  rankBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  rankBadgeText: {
    fontFamily: 'Poppins-Bold',
    color: '#FFFFFF',
    fontSize: 11.5,
    fontWeight: '900',
    letterSpacing: 0.6,
  },
  topQuestSubtitle: {
    fontFamily: 'Poppins-Medium',
    fontSize: 13,
    fontWeight: '600',
    marginTop: 2,
  },
  topHunterActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerActionBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    borderWidth: 1.2,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // TITLE SECTION
  titleSection: {
    marginBottom: 18,
  },
  screenMainTitle: {
    fontFamily: 'Poppins-Bold',
    fontSize: 23,
    fontWeight: '900',
    letterSpacing: 0.2,
    marginBottom: 4,
  },
  screenSubtitle: {
    fontFamily: 'Poppins-Regular',
    fontSize: 14,
    fontWeight: '600',
  },

  // PROGRAM CARD
  programCard: {
    borderRadius: 18,
    borderWidth: 1.2,
    padding: 16,
    marginBottom: 16,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 14,
    elevation: 4,
  },
  programTagText: {
    fontFamily: 'Poppins-Bold',
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 0.8,
    marginBottom: 6,
    textTransform: 'uppercase',
  },
  programTitleText: {
    fontFamily: 'Poppins-Bold',
    fontSize: 21,
    fontWeight: '900',
    letterSpacing: 0.2,
    marginBottom: 6,
  },
  programDescText: {
    fontFamily: 'Poppins-Regular',
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '500',
    marginBottom: 14,
  },
  dayPillsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 16,
  },
  dayPill: {
    paddingHorizontal: 11,
    paddingVertical: 6,
    borderRadius: 10,
    borderWidth: 1,
  },
  dayPillText: {
    fontFamily: 'Poppins-Medium',
    fontSize: 12.5,
    fontWeight: '700',
  },

  // ACTION BUTTONS
  selectBtn: {
    height: 50,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  activeRegimenBtn: {
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 10,
    shadowOpacity: 0.8,
    elevation: 5,
  },
  inactiveSelectBtn: {
    borderWidth: 1.2,
  },
  selectBtnText: {
    fontFamily: 'Poppins-Bold',
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '900',
    letterSpacing: 0.3,
  },
});
