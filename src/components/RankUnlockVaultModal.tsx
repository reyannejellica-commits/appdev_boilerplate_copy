import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import {
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import Svg, { Defs, RadialGradient, Rect, Stop } from 'react-native-svg';
import { SmoothPressable } from '@/components/SmoothPressable';
import type { HunterProfile } from '@/db/hunter';
import { useSettings } from '@/settings/SettingsContext';
import { FONTS, useTheme } from '@/theme';

export interface UnlockableFeature {
  id: string;
  title: string;
  subtitle: string;
  cost: number;
  icon: keyof typeof Ionicons.glyphMap;
  accent: string;
  category: 'FEATURE' | 'COSMETIC' | 'BOOST';
  repeatable?: boolean;
}

export const VAULT_UNLOCKABLES: UnlockableFeature[] = [
  {
    id: 'shadow_aura',
    title: 'Shadow Monarch Aura',
    subtitle: 'Unlocks glowing sovereign aura outline around your Hunter profile.',
    cost: 50,
    icon: 'flash',
    accent: '#F97316',
    category: 'COSMETIC',
  },
  {
    id: 'ai_macro_pro',
    title: 'AI Macro & 1RM Analyzer',
    subtitle: 'Unlocks quick 1-Rep Max & Precision Macro shortcut inside Stats.',
    cost: 75,
    icon: 'sparkles',
    accent: '#38BDF8',
    category: 'FEATURE',
  },
  {
    id: 'golden_title',
    title: 'Shadow Sovereign Title',
    subtitle: 'Unlocks the exclusive golden "SHADOW SOVEREIGN" rank crest.',
    cost: 120,
    icon: 'ribbon',
    accent: '#FBBF24',
    category: 'COSMETIC',
  },
  {
    id: 'cyber_hud',
    title: 'Elite Cyber Analytics HUD',
    subtitle: 'Unlocks advanced Muscle Volume & Calorie Efficiency bars in Stats.',
    cost: 150,
    icon: 'analytics',
    accent: '#A855F7',
    category: 'FEATURE',
  },
  {
    id: 'recovery_elixir',
    title: 'Shadow Recovery Elixir',
    subtitle: 'Instant +50 Hunter EXP boost toward your next Rank Ascension.',
    cost: 30,
    icon: 'flask',
    accent: '#34D399',
    category: 'BOOST',
    repeatable: true,
  },
  {
    id: 'double_xp',
    title: '2x Overdrive EXP Surge',
    subtitle: 'Instant +250 Hunter EXP surge to accelerate Rank leveling.',
    cost: 100,
    icon: 'rocket',
    accent: '#F43F5E',
    category: 'BOOST',
    repeatable: true,
  },
];

interface RankTier {
  rank: string;
  minLevel: number;
  title: string;
  color: string;
  perk: string;
}

const RANK_TIERS: RankTier[] = [
  { rank: 'E-RANK', minLevel: 1, title: 'Awakened Initiate', color: '#94A3B8', perk: 'Base Workout Splits & SQLite Tracking' },
  { rank: 'D-RANK', minLevel: 5, title: 'Iron Challenger', color: '#22C55E', perk: 'Custom Rest Timers & Effort Metrics (RIR/RPE)' },
  { rank: 'C-RANK', minLevel: 10, title: 'Vanguard Striker', color: '#38BDF8', perk: 'Beat-the-Clock HIIT Cardio & Coin Rewards' },
  { rank: 'B-RANK', minLevel: 20, title: 'Elite Commander', color: '#A855F7', perk: 'Advanced Hypertrophy Analytics & Monarch Shop' },
  { rank: 'A-RANK', minLevel: 35, title: 'Apex Warden', color: '#F59E0B', perk: 'Master Periodization & High-Tier Coin Unlocks' },
  { rank: 'S-RANK', minLevel: 50, title: 'Shadow Monarch', color: '#EF4444', perk: 'Sovereign Status & All Mastery Badges Unlocked' },
];

interface Props {
  visible: boolean;
  profile: HunterProfile | null;
  unlockedIds?: string[];
  initialTab?: 'unlocks' | 'ranks';
  onClose: () => void;
  onUnlockFeature?: (feature: UnlockableFeature) => Promise<void>;
}

export function RankUnlockVaultModal({
  visible,
  profile,
  unlockedIds = [],
  initialTab = 'ranks',
  onClose,
  onUnlockFeature,
}: Props) {
  const theme = useTheme();
  const { settings } = useSettings();
  const isDark = settings.theme === 'dark';

  const [activeTab, setActiveTab] = useState<'unlocks' | 'ranks'>(initialTab);
  const [prevVisible, setPrevVisible] = useState(visible);

  if (visible !== prevVisible) {
    setPrevVisible(visible);
    if (visible && initialTab) {
      setActiveTab(initialTab);
    }
  }

  const currentLevel = profile?.level ?? 1;
  const currentExp = profile?.exp ?? 0;
  const maxExp = profile?.max_exp ?? 100;
  const currentCoins = profile?.coins ?? 50;
  const currentRank = (profile?.rank || 'E-Rank').toUpperCase();
  const xpNeeded = Math.max(0, maxExp - currentExp);

  const nextTier = RANK_TIERS.find((r) => r.minLevel > currentLevel) ?? RANK_TIERS[RANK_TIERS.length - 1];

  const modalBg = isDark ? '#0B0B11' : '#FFFFFF';
  const cardBg = isDark ? '#14141E' : '#F8FAFC';
  const cardBorder = isDark ? 'rgba(255,255,255,0.09)' : 'rgba(15,23,42,0.09)';

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View
          style={[
            styles.container,
            {
              backgroundColor: modalBg,
              borderColor: isDark ? 'rgba(255,255,255,0.14)' : theme.border,
            },
          ]}
        >
          <View
            style={[
              styles.grabber,
              { backgroundColor: isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.15)' },
            ]}
          />

          {/* Top Header */}
          <View style={styles.headerRow}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.headerEyebrow, { color: theme.tint }]}>
                HUNTER PROGRESSION VAULT
              </Text>
              <Text style={[styles.headerTitle, { color: theme.text }]}>
                {currentRank} • LV. {currentLevel}
              </Text>
            </View>

            <View
              style={[
                styles.coinWalletPill,
                {
                  backgroundColor: 'rgba(251, 191, 36, 0.14)',
                  borderColor: 'rgba(251, 191, 36, 0.45)',
                },
              ]}
            >
              <Ionicons name="disc" size={14} color="#FBBF24" />
              <Text style={styles.coinWalletText}>{currentCoins} Coins</Text>
            </View>

            <SmoothPressable
              onPress={onClose}
              style={[
                styles.closeBtn,
                {
                  backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)',
                  borderColor: cardBorder,
                },
              ]}
              accessibilityRole="button"
              accessibilityLabel="Close Rank Vault"
            >
              <Ionicons name="close" size={18} color={theme.text} />
            </SmoothPressable>
          </View>

          {/* Summary Progress Banner */}
          <View
            style={[
              styles.summaryBanner,
              { backgroundColor: cardBg, borderColor: `${theme.tint}40` },
            ]}
          >
            <Svg style={StyleSheet.absoluteFill} pointerEvents="none">
              <Defs>
                <RadialGradient id="vaultGlow" cx="15%" cy="20%" rx="85%" ry="90%">
                  <Stop offset="0%" stopColor={theme.tint} stopOpacity="0.22" />
                  <Stop offset="100%" stopColor={theme.tint} stopOpacity="0" />
                </RadialGradient>
              </Defs>
              <Rect x="0" y="0" width="100%" height="100%" rx="16" fill="url(#vaultGlow)" />
            </Svg>

            <View style={styles.summaryTopRow}>
              <Text style={[styles.summaryLabel, { color: theme.textSecondary }]}>
                Next Target: <Text style={{ color: theme.tint, fontWeight: '800' }}>{nextTier.rank} (LV. {nextTier.minLevel})</Text>
              </Text>
              <Text style={[styles.summaryXpText, { color: theme.text }]}>
                {xpNeeded} XP needed
              </Text>
            </View>
            <View style={[styles.summaryBarTrack, { backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)' }]}>
              <View
                style={[
                  styles.summaryBarFill,
                  {
                    backgroundColor: theme.tint,
                    width: `${Math.min(100, Math.max(8, Math.round((currentExp / maxExp) * 100)))}%`,
                  },
                ]}
              />
            </View>
            <Text style={[styles.howToEarnText, { color: theme.textSecondary }]}>
              Earn XP & Coins: Daily Workout (+100 XP) • Cardio HIIT (+25 Coins) • Completed Sets
            </Text>
          </View>

          {/* Segmented Switcher: Coin Feature Unlocks vs Rank Requirements */}
          <View
            style={[
              styles.tabSwitcher,
              { backgroundColor: cardBg, borderColor: cardBorder },
            ]}
          >
            <SmoothPressable
              onPress={() => setActiveTab('unlocks')}
              style={[
                styles.tabBtn,
                activeTab === 'unlocks' && { backgroundColor: theme.tint },
              ]}
            >
              <Ionicons
                name="key-outline"
                size={14}
                color={activeTab === 'unlocks' ? '#FFFFFF' : theme.textSecondary}
              />
              <Text
                style={[
                  styles.tabBtnText,
                  { color: activeTab === 'unlocks' ? '#FFFFFF' : theme.textSecondary },
                ]}
              >
                Coin Unlocks ({VAULT_UNLOCKABLES.length})
              </Text>
            </SmoothPressable>

            <SmoothPressable
              onPress={() => setActiveTab('ranks')}
              style={[
                styles.tabBtn,
                activeTab === 'ranks' && { backgroundColor: theme.tint },
              ]}
            >
              <Ionicons
                name="trophy-outline"
                size={14}
                color={activeTab === 'ranks' ? '#FFFFFF' : theme.textSecondary}
              />
              <Text
                style={[
                  styles.tabBtnText,
                  { color: activeTab === 'ranks' ? '#FFFFFF' : theme.textSecondary },
                ]}
              >
                Rank Requirements
              </Text>
            </SmoothPressable>
          </View>

          {/* Content Scroll */}
          <ScrollView
            style={styles.scrollArea}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {activeTab === 'unlocks' ? (
              VAULT_UNLOCKABLES.map((item) => {
                const isUnlocked = !item.repeatable && unlockedIds.includes(item.id);
                const canAfford = currentCoins >= item.cost;
                const coinProgress = Math.min(100, Math.round((currentCoins / item.cost) * 100));

                return (
                  <View
                    key={item.id}
                    style={[
                      styles.itemCard,
                      {
                        backgroundColor: cardBg,
                        borderColor: isUnlocked ? `${theme.success}55` : cardBorder,
                      },
                    ]}
                  >
                    <View style={styles.itemTopRow}>
                      <View
                        style={[
                          styles.itemIconBox,
                          {
                            backgroundColor: `${item.accent}20`,
                            borderColor: `${item.accent}45`,
                          },
                        ]}
                      >
                        <Ionicons name={item.icon} size={19} color={item.accent} />
                      </View>

                      <View style={{ flex: 1 }}>
                        <View style={styles.itemTitleRow}>
                          <Text style={[styles.itemTitle, { color: theme.text }]}>
                            {item.title}
                          </Text>
                          <View
                            style={[
                              styles.catPill,
                              { backgroundColor: `${item.accent}1A` },
                            ]}
                          >
                            <Text style={[styles.catPillText, { color: item.accent }]}>
                              {item.category}
                            </Text>
                          </View>
                        </View>
                        <Text style={[styles.itemSub, { color: theme.textSecondary }]}>
                          {item.subtitle}
                        </Text>
                      </View>
                    </View>

                    <View style={styles.itemFooterRow}>
                      {!isUnlocked && !canAfford ? (
                        <View style={styles.needCoinsWrap}>
                          <Text style={[styles.needCoinsText, { color: theme.textSecondary }]}>
                            Need {item.cost - currentCoins} more coins ({currentCoins}/{item.cost})
                          </Text>
                          <View
                            style={[
                              styles.miniCoinTrack,
                              { backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)' },
                            ]}
                          >
                            <View
                              style={[
                                styles.miniCoinFill,
                                { width: `${coinProgress}%`, backgroundColor: '#FBBF24' },
                              ]}
                            />
                          </View>
                        </View>
                      ) : (
                        <Text
                          style={[
                            styles.readyStatusText,
                            { color: isUnlocked ? theme.success : '#34D399' },
                          ]}
                        >
                          {isUnlocked ? '✓ Feature Unlocked & Active' : 'Ready to Unlock'}
                        </Text>
                      )}

                      <SmoothPressable
                        onPress={() => {
                          if (!isUnlocked && onUnlockFeature) {
                            void onUnlockFeature(item);
                          }
                        }}
                        disabled={isUnlocked}
                        style={[
                          styles.unlockActionBtn,
                          isUnlocked
                            ? {
                                backgroundColor: `${theme.success}20`,
                                borderColor: `${theme.success}55`,
                              }
                            : canAfford
                            ? {
                                backgroundColor: theme.tint,
                                borderColor: theme.tint,
                              }
                            : {
                                backgroundColor: isDark
                                  ? 'rgba(255,255,255,0.06)'
                                  : 'rgba(0,0,0,0.06)',
                                borderColor: cardBorder,
                              },
                        ]}
                      >
                        <Ionicons
                          name={isUnlocked ? 'checkmark-circle' : canAfford ? 'lock-open' : 'lock-closed'}
                          size={13}
                          color={isUnlocked ? theme.success : canAfford ? '#FFFFFF' : theme.textSecondary}
                        />
                        <Text
                          style={[
                            styles.unlockActionText,
                            {
                              color: isUnlocked
                                ? theme.success
                                : canAfford
                                ? '#FFFFFF'
                                : theme.textSecondary,
                            },
                          ]}
                        >
                          {isUnlocked ? 'Unlocked' : `${item.cost} Coins`}
                        </Text>
                      </SmoothPressable>
                    </View>
                  </View>
                );
              })
            ) : (
              RANK_TIERS.map((tier) => {
                const isReached = currentLevel >= tier.minLevel;
                const isCurrent = currentRank === tier.rank;
                return (
                  <View
                    key={tier.rank}
                    style={[
                      styles.rankRowCard,
                      {
                        backgroundColor: cardBg,
                        borderColor: isCurrent ? tier.color : cardBorder,
                      },
                    ]}
                  >
                    <View
                      style={[
                        styles.rankBadgeBox,
                        {
                          backgroundColor: `${tier.color}20`,
                          borderColor: `${tier.color}55`,
                        },
                      ]}
                    >
                      <Text style={[styles.rankBadgeCode, { color: tier.color }]}>
                        {tier.rank}
                      </Text>
                      <Text style={[styles.rankLevelReq, { color: theme.textSecondary }]}>
                        LV. {tier.minLevel}+
                      </Text>
                    </View>

                    <View style={{ flex: 1 }}>
                      <View style={styles.rankTitleHeader}>
                        <Text style={[styles.rankTierTitle, { color: theme.text }]}>
                          {tier.title}
                        </Text>
                        <View
                          style={[
                            styles.rankStatePill,
                            {
                              backgroundColor: isCurrent
                                ? `${tier.color}25`
                                : isReached
                                ? 'rgba(52, 211, 153, 0.16)'
                                : 'rgba(148, 163, 184, 0.12)',
                            },
                          ]}
                        >
                          <Text
                            style={[
                              styles.rankStateText,
                              {
                                color: isCurrent
                                  ? tier.color
                                  : isReached
                                  ? '#34D399'
                                  : theme.textSecondary,
                              },
                            ]}
                          >
                            {isCurrent ? 'CURRENT' : isReached ? 'CLEARED' : 'LOCKED'}
                          </Text>
                        </View>
                      </View>
                      <Text style={[styles.rankPerkText, { color: theme.textSecondary }]}>
                        Unlocks: {tier.perk}
                      </Text>
                    </View>
                  </View>
                );
              })
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.78)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 22,
  },
  container: {
    width: '100%',
    maxWidth: 440,
    maxHeight: '90%',
    borderRadius: 24,
    borderWidth: 1,
    paddingTop: 10,
    paddingHorizontal: 16,
    paddingBottom: 16,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 14 },
    shadowRadius: 28,
    shadowOpacity: 0.65,
    elevation: 18,
  },
  grabber: {
    width: 38,
    height: 4,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 12,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  headerEyebrow: {
    fontFamily: FONTS.bold,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  headerTitle: {
    fontFamily: FONTS.bold,
    fontSize: 19,
    fontWeight: '900',
  },
  coinWalletPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    borderWidth: 1,
  },
  coinWalletText: {
    fontFamily: FONTS.bold,
    color: '#FBBF24',
    fontSize: 12,
    fontWeight: '800',
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  summaryBanner: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 12,
    marginBottom: 12,
    overflow: 'hidden',
    gap: 7,
  },
  summaryTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  summaryLabel: {
    fontFamily: FONTS.medium,
    fontSize: 12,
  },
  summaryXpText: {
    fontFamily: FONTS.bold,
    fontSize: 12,
    fontWeight: '800',
  },
  summaryBarTrack: {
    height: 7,
    borderRadius: 4,
    overflow: 'hidden',
  },
  summaryBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  howToEarnText: {
    fontFamily: FONTS.medium,
    fontSize: 10.5,
  },
  tabSwitcher: {
    flexDirection: 'row',
    borderRadius: 13,
    borderWidth: 1,
    padding: 4,
    gap: 4,
    marginBottom: 12,
  },
  tabBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 8,
    borderRadius: 10,
  },
  tabBtnText: {
    fontFamily: FONTS.bold,
    fontSize: 12,
    fontWeight: '700',
  },
  scrollArea: {
    flexGrow: 0,
  },
  scrollContent: {
    gap: 10,
    paddingBottom: 6,
  },
  itemCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 12,
    gap: 10,
  },
  itemTopRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  itemIconBox: {
    width: 38,
    height: 38,
    borderRadius: 11,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 6,
    marginBottom: 2,
  },
  itemTitle: {
    fontFamily: FONTS.bold,
    fontSize: 14,
    fontWeight: '800',
    flex: 1,
  },
  catPill: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 5,
  },
  catPillText: {
    fontFamily: FONTS.bold,
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.4,
  },
  itemSub: {
    fontFamily: FONTS.regular,
    fontSize: 12,
    lineHeight: 17,
  },
  itemFooterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  needCoinsWrap: {
    flex: 1,
    gap: 4,
  },
  needCoinsText: {
    fontFamily: FONTS.medium,
    fontSize: 10.5,
  },
  miniCoinTrack: {
    height: 4,
    borderRadius: 2,
    overflow: 'hidden',
  },
  miniCoinFill: {
    height: '100%',
    borderRadius: 2,
  },
  readyStatusText: {
    fontFamily: FONTS.bold,
    fontSize: 11.5,
    fontWeight: '700',
    flex: 1,
  },
  unlockActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 11,
    paddingVertical: 7,
    borderRadius: 10,
    borderWidth: 1,
  },
  unlockActionText: {
    fontFamily: FONTS.bold,
    fontSize: 11.5,
    fontWeight: '800',
  },
  rankRowCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderRadius: 15,
    borderWidth: 1,
    padding: 12,
  },
  rankBadgeBox: {
    width: 68,
    paddingVertical: 8,
    borderRadius: 11,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rankBadgeCode: {
    fontFamily: FONTS.bold,
    fontSize: 11.5,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  rankLevelReq: {
    fontFamily: FONTS.semiBold,
    fontSize: 10,
    marginTop: 2,
  },
  rankTitleHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 6,
    marginBottom: 3,
  },
  rankTierTitle: {
    fontFamily: FONTS.bold,
    fontSize: 14,
    fontWeight: '800',
  },
  rankStatePill: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
  },
  rankStateText: {
    fontFamily: FONTS.bold,
    fontSize: 9.5,
    fontWeight: '800',
    letterSpacing: 0.4,
  },
  rankPerkText: {
    fontFamily: FONTS.regular,
    fontSize: 12,
    lineHeight: 17,
  },
});
