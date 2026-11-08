import { Ionicons } from '@expo/vector-icons';
import { useRouter, type Href } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import {
  Alert,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { IconButton } from '@/components/Button';
import { SmoothPressable } from '@/components/SmoothPressable';
import {
  getDailyQuests,
  getHunterProfile,
  incrementDailyQuest,
  type DailyQuest,
  type HunterProfile,
} from '@/db/hunter';
import { useAiStatus } from '@/hooks/useAiStatus';
import { useSettings } from '@/settings/SettingsContext';
import { useTheme } from '@/theme';

export default function QuestScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { settings, update } = useSettings();
  const { problem, isOnline } = useAiStatus();

  const [profile, setProfile] = useState<HunterProfile | null>(null);
  const [quests, setQuests] = useState<DailyQuest[]>([]);

  // Log Quest Progress Modal State
  const [activeQuest, setActiveQuest] = useState<DailyQuest | null>(null);
  const [logAmount, setLogAmount] = useState('10');

  const loadData = useCallback(async () => {
    try {
      const p = await getHunterProfile(settings.nickname || 'Hunter');
      const q = await getDailyQuests();
      setProfile(p);
      setQuests(q);
    } catch (e) {
      console.warn('Failed to load quest data:', e);
    }
  }, [settings.nickname]);

  useEffect(() => {
    let isMounted = true;
    (async () => {
      try {
        const p = await getHunterProfile(settings.nickname || 'Hunter');
        const q = await getDailyQuests();
        if (isMounted) {
          setProfile(p);
          setQuests(q);
        }
      } catch (e) {
        console.warn('Failed to load quest data:', e);
      }
    })();
    return () => {
      isMounted = false;
    };
  }, [settings.nickname]);

  const toggleTheme = () => {
    update('theme', settings.theme === 'dark' ? 'light' : 'dark');
  };

  const handleIncrement = async (quest: DailyQuest, amount: number) => {
    try {
      const { completedNow, expGained } = await incrementDailyQuest(quest.quest_key, amount);
      if (completedNow) {
        Alert.alert(
          'QUEST ACCOMPLISHED! ⚡',
          `The System recognized your effort: +${expGained} EXP received!`
        );
      }
      loadData();
    } catch (e) {
      console.warn('Failed to update quest:', e);
    }
  };

  const handleCustomLog = async () => {
    if (!activeQuest) return;
    const count = parseInt(logAmount, 10) || 0;
    if (count > 0) {
      await handleIncrement(activeQuest, count);
    }
    setActiveQuest(null);
  };

  const providerLabel =
    settings.provider === 'cloud' ? 'Cloud AI (Gemini)' : 'Local AI (Gemma)';

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.background }]}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
    >
      {/* 1. Header Profile Row (Matches Figma Prototype) */}
      <View style={styles.topProfileRow}>
        <View style={styles.profileLeft}>
          <View style={[styles.avatarCircle, { backgroundColor: theme.surface, borderColor: theme.tint }]}>
            <Ionicons name="shield-half" size={26} color={theme.tint} />
          </View>
          <View style={styles.profileInfo}>
            <View style={styles.nameRankRow}>
              <Text style={[styles.hunterName, { color: theme.text }]}>
                {profile?.hunter_name || settings.nickname || 'Hunter'}
              </Text>
              <View style={[styles.rankPill, { backgroundColor: theme.surface, borderColor: theme.tint }]}>
                <Text style={[styles.rankPillText, { color: theme.tint }]}>
                  {profile?.rank || 'E-RANK'}
                </Text>
              </View>
            </View>
            <Text style={[styles.questSubtitle, { color: theme.textSecondary }]}>
              Quest: Overcome the Limits
            </Text>
          </View>
        </View>

        {/* Quick Toggles */}
        <View style={styles.headerActions}>
          <IconButton
            icon={settings.theme === 'dark' ? 'sunny-outline' : 'moon-outline'}
            label="Toggle theme"
            onPress={toggleTheme}
          />
          <IconButton
            icon="settings-outline"
            label="Settings"
            onPress={() => router.push('/settings' as Href)}
          />
        </View>
      </View>

      {/* 2. Hero Card: DAILY PEAK QUEST (Matches Figma Hero Card) */}
      <View
        style={[
          styles.heroCard,
          { backgroundColor: theme.card, borderColor: theme.tint },
        ]}
      >
        <View style={styles.heroHeader}>
          <Ionicons name="flash" size={14} color={theme.tint} />
          <Text style={[styles.heroBadgeText, { color: theme.tint }]}>
            DAILY PEAK QUEST
          </Text>
        </View>

        <View style={styles.heroBodyRow}>
          <View style={[styles.emblemIcon, { backgroundColor: theme.surface, borderColor: theme.tint }]}>
            <Ionicons name="person" size={24} color={theme.tint} />
          </View>
          <Text style={[styles.quoteText, { color: theme.text }]}>
            &quot;Each repetition sharpens the blade. Overcome your limits today.&quot;
          </Text>
        </View>

        <View style={styles.heroFooter}>
          <View style={[styles.streakPill, { backgroundColor: theme.surface, borderColor: theme.accentGold }]}>
            <Text style={[styles.streakText, { color: theme.accentGold }]}>
              🔥 Hunter Streak: {profile?.streak_days || 1} Day
            </Text>
          </View>
        </View>
      </View>

      {/* 3. Today's Training Protocol Quick Action */}
      <SmoothPressable
        onPress={() => router.push('/program' as Href)}
        style={[styles.trainingBanner, { backgroundColor: theme.card, borderColor: theme.border }]}
      >
        <View style={styles.bannerIconBlock}>
          <Ionicons name="barbell-outline" size={28} color={theme.tint} />
        </View>
        <View style={styles.bannerTextBlock}>
          <View style={styles.bannerTopLine}>
            <Text style={[styles.bannerTitle, { color: theme.text }]}>Push, Pull, Legs (PPL)</Text>
            <View style={[styles.activeTag, { backgroundColor: theme.tint }]}>
              <Text style={styles.activeTagText}>TODAY</Text>
            </View>
          </View>
          <Text style={[styles.bannerSubtitle, { color: theme.textSecondary }]}>
            Push Day A • Chest, Shoulders, Triceps Protocol
          </Text>
        </View>
        <Ionicons name="chevron-forward" size={20} color={theme.textSecondary} />
      </SmoothPressable>

      {/* 4. Daily System Quests List */}
      <View style={styles.questsSection}>
        <View style={styles.sectionTitleRow}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Daily Quest Protocol</Text>
          <Text style={[styles.sectionActionText, { color: theme.textSecondary }]}>
            {quests.filter((q) => q.completed).length} / {quests.length} Completed
          </Text>
        </View>

        <View style={styles.questsList}>
          {quests.map((quest) => {
            const percent = Math.min(100, Math.round((quest.current_count / quest.target_count) * 100));
            return (
              <View
                key={quest.id}
                style={[
                  styles.questCard,
                  {
                    backgroundColor: theme.card,
                    borderColor: quest.completed ? theme.tint : theme.border,
                  },
                ]}
              >
                <View style={styles.questTopRow}>
                  <View style={styles.questInfo}>
                    <Text style={[styles.questTitle, { color: theme.text }]}>{quest.title}</Text>
                    <Text style={[styles.questProgressText, { color: theme.textSecondary }]}>
                      {quest.current_count} / {quest.target_count} {quest.unit} ({percent}%)
                    </Text>
                  </View>

                  <View style={styles.questActions}>
                    <SmoothPressable
                      onPress={() => handleIncrement(quest, quest.unit === 'km' ? 2 : 10)}
                      style={[styles.quickAddButton, { backgroundColor: theme.surface, borderColor: theme.border }]}
                    >
                      <Text style={[styles.quickAddText, { color: theme.accentCyan }]}>
                        +{quest.unit === 'km' ? '2km' : '10'}
                      </Text>
                    </SmoothPressable>

                    <SmoothPressable
                      onPress={() => {
                        setActiveQuest(quest);
                        setLogAmount(quest.unit === 'km' ? '5' : '20');
                      }}
                      style={[styles.logButton, { backgroundColor: theme.surface, borderColor: theme.border }]}
                    >
                      <Ionicons name="create-outline" size={16} color={theme.textSecondary} />
                    </SmoothPressable>
                  </View>
                </View>

                {/* Progress bar */}
                <View style={[styles.questProgressTrack, { backgroundColor: theme.surface }]}>
                  <View
                    style={[
                      styles.questProgressFill,
                      {
                        width: `${percent}%`,
                        backgroundColor: quest.completed ? theme.success : theme.tint,
                      },
                    ]}
                  />
                </View>
              </View>
            );
          })}
        </View>
      </View>

      {/* 5. System AI Intelligence Card */}
      <SmoothPressable
        onPress={() => router.push('/chat' as Href)}
        style={[styles.aiCard, { backgroundColor: theme.card, borderColor: theme.border }]}
      >
        <Ionicons
          name={problem ? 'alert-circle-outline' : 'hardware-chip-outline'}
          size={24}
          color={problem ? theme.danger : theme.tint}
        />
        <View style={styles.aiCardText}>
          <Text style={[styles.aiCardTitle, { color: theme.text }]}>System Intelligence ({providerLabel})</Text>
          <Text style={{ color: theme.textSecondary, fontSize: 13 }}>
            {problem ?? 'Online & Offline AI Coach Ready'} • {isOnline ? 'Network Connected' : '100% Offline Mode'}
          </Text>
        </View>
        <Ionicons name="chatbubbles-outline" size={20} color={theme.tint} />
      </SmoothPressable>

      {/* Custom Log Modal */}
      <Modal visible={!!activeQuest} transparent animationType="fade" onRequestClose={() => setActiveQuest(null)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <Text style={[styles.modalTitle, { color: theme.text }]}>Log {activeQuest?.title}</Text>
            <Text style={[styles.modalSubtitle, { color: theme.textSecondary }]}>
              Enter reps or distance to add to your daily hunter objective.
            </Text>

            <TextInput
              keyboardType="numeric"
              value={logAmount}
              onChangeText={setLogAmount}
              placeholder="Amount"
              placeholderTextColor={theme.textDim}
              style={[styles.modalInput, { color: theme.text, backgroundColor: theme.surface, borderColor: theme.border }]}
            />

            <View style={styles.modalButtonsRow}>
              <SmoothPressable
                onPress={() => setActiveQuest(null)}
                style={[styles.modalCancel, { borderColor: theme.border }]}
              >
                <Text style={{ color: theme.textSecondary, fontWeight: '600' }}>Cancel</Text>
              </SmoothPressable>
              <SmoothPressable
                onPress={handleCustomLog}
                style={[styles.modalConfirm, { backgroundColor: theme.tint }]}
              >
                <Text style={{ color: '#FFFFFF', fontWeight: '700' }}>Confirm Progress</Text>
              </SmoothPressable>
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { padding: 16, gap: 16, paddingBottom: 100 },

  // Profile Header
  topProfileRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  profileLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatarCircle: {
    width: 46,
    height: 46,
    borderRadius: 23,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileInfo: {
    gap: 2,
  },
  nameRankRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  hunterName: {
    fontSize: 18,
    fontWeight: '800',
  },
  rankPill: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
  },
  rankPillText: {
    fontSize: 10,
    fontWeight: '800',
  },
  questSubtitle: {
    fontSize: 12,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },

  // Hero Card: DAILY PEAK QUEST
  heroCard: {
    borderRadius: 20,
    borderWidth: 1.5,
    padding: 18,
    gap: 12,
    shadowColor: '#8B5CF6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 4,
  },
  heroHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  heroBadgeText: {
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1.2,
  },
  heroBodyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  emblemIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quoteText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    lineHeight: 20,
  },
  heroFooter: {
    flexDirection: 'row',
  },
  streakPill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
  },
  streakText: {
    fontSize: 12,
    fontWeight: '700',
  },

  // Training Banner
  trainingBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 18,
    borderWidth: 1.5,
    gap: 14,
  },
  bannerIconBlock: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bannerTextBlock: {
    flex: 1,
    gap: 4,
  },
  bannerTopLine: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  bannerTitle: {
    fontSize: 16,
    fontWeight: '800',
  },
  activeTag: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  activeTagText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '800',
  },
  bannerSubtitle: {
    fontSize: 12,
  },

  // Quests Section
  questsSection: {
    gap: 12,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '800',
    letterSpacing: 0.2,
  },
  sectionActionText: {
    fontSize: 12,
    fontWeight: '600',
  },
  questsList: {
    gap: 10,
  },
  questCard: {
    borderRadius: 16,
    borderWidth: 1.5,
    padding: 14,
    gap: 10,
  },
  questTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  questInfo: {
    flex: 1,
    gap: 3,
  },
  questTitle: {
    fontSize: 15,
    fontWeight: '700',
  },
  questProgressText: {
    fontSize: 12,
  },
  questActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  quickAddButton: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
  },
  quickAddText: {
    fontSize: 12,
    fontWeight: '700',
  },
  logButton: {
    padding: 6,
    borderRadius: 8,
    borderWidth: 1,
  },
  questProgressTrack: {
    height: 5,
    borderRadius: 2.5,
    overflow: 'hidden',
    width: '100%',
  },
  questProgressFill: {
    height: '100%',
    borderRadius: 2.5,
  },

  // AI Card
  aiCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1.5,
    gap: 12,
  },
  aiCardText: {
    flex: 1,
    gap: 3,
  },
  aiCardTitle: {
    fontSize: 14,
    fontWeight: '700',
  },

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(5, 3, 10, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalCard: {
    width: '100%',
    maxWidth: 380,
    borderRadius: 20,
    borderWidth: 1.5,
    padding: 20,
    gap: 14,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
  },
  modalSubtitle: {
    fontSize: 13,
  },
  modalInput: {
    height: 48,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 16,
    fontSize: 16,
    fontWeight: '700',
  },
  modalButtonsRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
  },
  modalCancel: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
  },
  modalConfirm: {
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 10,
  },
});
