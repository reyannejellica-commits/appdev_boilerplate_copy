import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Image,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import Svg, { Circle, Defs, LinearGradient as SvgGradient, Stop } from 'react-native-svg';
import { PrimeAwakeningModal } from '@/components/PrimeAwakeningModal';
import { SmoothPressable } from '@/components/SmoothPressable';
import {
  addHunterExp,
  getHunterProfile,
  getTotalCardioDistanceKm,
  getUnlockedShopItems,
  spendHunterCoins,
  unlockShopItem,
  type HunterProfile,
} from '@/db/hunter';
import { getWorkoutHistory, type WorkoutHistoryEntry } from '@/db/workouts';
import { useTranslation } from '@/i18n';
import { useSettings } from '@/settings/SettingsContext';
import { useTheme } from '@/theme';
import { playAlertSound } from '@/utils/alertSounds';
import { showMessage } from '@/utils/confirm';
import { getAvatarById } from '@/utils/profileOptions';

interface ShopItem {
  id: string;
  title: string;
  subtitle: string;
  cost: number;
  icon: keyof typeof Ionicons.glyphMap;
  iconBg: string;
  type: 'aura' | 'elixir' | 'xp_boost';
}

const MONARCH_SHOP_ITEMS: ShopItem[] = [
  {
    id: 'shadow_aura',
    title: 'Shadow Monarch Aura',
    subtitle: 'Custom Glowing Outline',
    cost: 50,
    icon: 'flash',
    iconBg: '#F97316',
    type: 'aura',
  },
  {
    id: 'recovery_elixir',
    title: 'Shadow Recovery Elixir',
    subtitle: 'Restores Energy',
    cost: 30,
    icon: 'flask',
    iconBg: '#10B981',
    type: 'elixir',
  },
  {
    id: 'double_xp',
    title: '2x Double XP Boost',
    subtitle: 'Accelerates Leveling',
    cost: 100,
    icon: 'sparkles',
    iconBg: '#FBBF24',
    type: 'xp_boost',
  },
];

export default function StatsScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { settings } = useSettings();
  const { t } = useTranslation();

  const [profile, setProfile] = useState<HunterProfile | null>(null);
  const [history, setHistory] = useState<WorkoutHistoryEntry[]>([]);
  const [cardioDistanceKm, setCardioDistanceKm] = useState<number>(0);
  const [unlockedItems, setUnlockedItems] = useState<string[]>([]);
  const [auraActive, setAuraActive] = useState<boolean>(false);
  const [awakeningOpen, setAwakeningOpen] = useState<boolean>(false);

  const currentAvatar = useMemo(() => getAvatarById(settings.avatarId), [settings.avatarId]);

  const loadAllStats = useCallback(async () => {
    try {
      const [hProfile, wHistory, cDist, shopUnlocked] = await Promise.all([
        getHunterProfile(settings.nickname || 'Athlete'),
        getWorkoutHistory(10),
        getTotalCardioDistanceKm(),
        getUnlockedShopItems(),
      ]);
      setProfile(hProfile);
      setHistory(wHistory);
      setCardioDistanceKm(cDist);
      setUnlockedItems(shopUnlocked);
      if (shopUnlocked.includes('shadow_aura')) {
        setAuraActive(true);
      }
    } catch (e) {
      console.warn('Failed to load stats:', e);
    }
  }, [settings.nickname]);

  useEffect(() => {
    let isMounted = true;
    (async () => {
      try {
        const [hProfile, wHistory, cDist, shopUnlocked] = await Promise.all([
          getHunterProfile(settings.nickname || 'Athlete'),
          getWorkoutHistory(10),
          getTotalCardioDistanceKm(),
          getUnlockedShopItems(),
        ]);
        if (isMounted) {
          setProfile(hProfile);
          setHistory(wHistory);
          setCardioDistanceKm(cDist);
          setUnlockedItems(shopUnlocked);
          if (shopUnlocked.includes('shadow_aura')) {
            setAuraActive(true);
          }
        }
      } catch (e) {
        console.warn('Failed to load stats:', e);
      }
    })();
    return () => {
      isMounted = false;
    };
  }, [settings.nickname]);

  // Aggregate metrics from history or realistic starter baseline
  const calculatedSets = history.reduce((sum, h) => sum + h.completedSets, 0);
  const calculatedVolume = history.reduce((sum, h) => sum + h.totalVolumeKg, 0);
  const displayTotalSets = calculatedSets > 0 ? calculatedSets : 14;
  const displayVolumeLifted = calculatedVolume > 0 ? calculatedVolume : 5572;
  const displayCardioKm = cardioDistanceKm > 0 ? cardioDistanceKm.toFixed(1) : '0.0';
  const displayStreak = profile?.streak_days ? `${profile.streak_days} DAY` : '4 DAY';

  // Handle purchasing shop items
  const handlePurchase = async (item: ShopItem) => {
    const currentCoins = profile?.coins ?? 190;
    if (currentCoins < item.cost) {
      playAlertSound('beep');
      showMessage(
        'INSUFFICIENT COINS',
        `You need ${item.cost} Coins to purchase "${item.title}".\nComplete cardio runs and workout sets to earn more!`
      );
      return;
    }

    const success = await spendHunterCoins(item.cost);
    if (!success) {
      showMessage('TRANSACTION FAILED', 'Unable to deduct coins. Please try again.');
      return;
    }

    await unlockShopItem(item.id);
    playAlertSound('chime');

    if (item.type === 'aura') {
      setAuraActive(true);
      showMessage(
        'SHADOW MONARCH AURA ACTIVATED!',
        'Custom glowing aura outline successfully bound to your hunter essence.'
      );
    } else if (item.type === 'elixir') {
      await addHunterExp(50);
      showMessage(
        'SHADOW RECOVERY ELIXIR CONSUMED!',
        'Physical recovery maximized. +50 Hunter EXP added to your rank progression!'
      );
    } else if (item.type === 'xp_boost') {
      await addHunterExp(250);
      showMessage(
        '2x DOUBLE XP BOOST UNLEASHED!',
        '+250 EXP awarded! Your monarch power level surges forward!'
      );
    }

    await loadAllStats();
  };

  const userRank = (profile?.rank || 'B-Rank').toUpperCase().replace('-RANK', '');

  // SVG Circular Radial parameters
  const circleSize = 104;
  const strokeWidth = 8;
  const radius = (circleSize - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const progressRatio = 0.95; // 95% Consistency
  const strokeDashoffset = circumference * (1 - progressRatio);

  return (
    <View style={[styles.root, { backgroundColor: theme.background }]}>
      {/* 1. TOP HEADER BAR (Profile tap opens Prime Awakening) */}
      <View style={[styles.topHeader, { borderBottomColor: theme.border }]}>
        <SmoothPressable
          onPress={() => setAwakeningOpen(true)}
          style={styles.avatarRow}
          accessibilityLabel="Open Prime Awakening Profile"
        >
          {/* Avatar with active glowing highlight rim */}
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
                styles.avatarContainer,
                { borderColor: theme.tint, shadowColor: theme.glow },
                auraActive && {
                  shadowOpacity: 0.95,
                  shadowRadius: 14,
                  elevation: 8,
                },
              ]}
            >
              <Image
                source={currentAvatar.image}
                style={styles.avatarImg}
                resizeMode="cover"
              />
            </View>
          </View>

          <View style={styles.headerInfo}>
            <View style={styles.nameRankRow}>
              <Text style={[styles.hunterName, { color: theme.text }]} numberOfLines={1}>
                {settings.nickname || 'John Mark Dalumpienes'}
              </Text>
              <View style={[styles.rankBadge, { backgroundColor: theme.tint }]}>
                <Text style={styles.rankBadgeText}>{userRank}-RANK</Text>
              </View>
            </View>
            <Text style={[styles.questSubtitle, { color: theme.textSecondary }]}>
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

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* 2. SECTION TITLE & DESCRIPTION */}
        <View style={styles.screenTitleSection}>
          <Text style={[styles.pageTitle, { color: theme.text }]}>{t('systemAnalytics')}</Text>
          <Text style={[styles.pageSubtitle, { color: theme.textSecondary }]}>
            {t('systemAnalyticsSub')}
          </Text>
        </View>

        {/* 3. REPORT TAGS */}
        <View style={styles.tagsRow}>
          <Text style={[styles.systemReportTag, { color: theme.tint }]}>
            {t('systemReport')}
          </Text>
          <View
            style={[
              styles.activeCyclePill,
              { backgroundColor: theme.cardSecondary, borderColor: theme.borderRose },
            ]}
          >
            <Text style={[styles.activeCycleText, { color: theme.tint }]}>
              {t('activeCycle')}
            </Text>
          </View>
        </View>

        {/* 4. WEEKLY FITNESS REPORT CARD */}
        <View
          style={[
            styles.weeklyCard,
            {
              backgroundColor: theme.card,
              borderColor: theme.borderRose,
              shadowColor: theme.glow,
            },
          ]}
        >
          <Text style={[styles.weeklyCardTitle, { color: theme.text }]}>
            {t('weeklyFitnessReport')}
          </Text>

          {/* Consistency Gauge Row */}
          <View style={styles.gaugeRow}>
            {/* Circular Arc with 95% CONSISTENCY */}
            <View style={styles.svgWrapper}>
              <Svg width={circleSize} height={circleSize}>
                <Defs>
                  <SvgGradient id="statsThemeGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <Stop offset="0%" stopColor={theme.tint} />
                    <Stop offset="100%" stopColor={theme.accentHighlight || theme.tint} />
                  </SvgGradient>
                </Defs>
                {/* Background Track Circle */}
                <Circle
                  cx={circleSize / 2}
                  cy={circleSize / 2}
                  r={radius}
                  stroke={theme.border}
                  strokeWidth={strokeWidth}
                  fill="none"
                />
                {/* Foreground Animated Progress Arc */}
                <Circle
                  cx={circleSize / 2}
                  cy={circleSize / 2}
                  r={radius}
                  stroke="url(#statsThemeGrad)"
                  strokeWidth={strokeWidth}
                  fill="none"
                  strokeDasharray={circumference}
                  strokeDashoffset={strokeDashoffset}
                  strokeLinecap="round"
                  transform={`rotate(-90 ${circleSize / 2} ${circleSize / 2})`}
                />
              </Svg>

              <View style={styles.svgCenterText}>
                <Text style={[styles.gaugePercentText, { color: theme.text }]}>95%</Text>
                <Text style={[styles.gaugeSubText, { color: theme.textSecondary }]}>
                  CONSISTENCY
                </Text>
              </View>
            </View>

            {/* Rating & Workout Days */}
            <View style={styles.gaugeInfoCol}>
              <View style={styles.ratingRow}>
                <Text style={[styles.ratingLabel, { color: theme.textSecondary }]}>RATING:</Text>
                <View
                  style={[
                    styles.ratingPill,
                    { backgroundColor: `${theme.tint}18`, borderColor: theme.tint },
                  ]}
                >
                  <Text style={[styles.ratingPillText, { color: theme.tint }]}>
                    {t('ratingExcellent')}
                  </Text>
                </View>
              </View>

              <View style={styles.workoutDaysBox}>
                <Text style={[styles.workoutDaysLabel, { color: theme.textSecondary }]}>
                  {t('workoutDays')}
                </Text>
                <Text style={[styles.workoutDaysValue, { color: theme.text }]}>
                  4 / 6 {t('days').toUpperCase()}
                </Text>
              </View>
            </View>
          </View>

          {/* 4 Metrics Grid with Crisp Icons */}
          <View style={styles.metricsGrid}>
            {/* Box 1: TOTAL SETS */}
            <View
              style={[
                styles.metricCard,
                { backgroundColor: theme.cardSecondary, borderColor: theme.border },
              ]}
            >
              <View style={styles.metricCardHeader}>
                <Ionicons name="barbell-outline" size={15} color={theme.tint} />
                <Text style={[styles.metricCardLabel, { color: theme.textSecondary }]}>
                  {t('totalSets')}
                </Text>
              </View>
              <Text style={[styles.metricCardValue, { color: theme.text }]}>
                {displayTotalSets} {t('setsDone')}
              </Text>
            </View>

            {/* Box 2: VOLUME LIFTED */}
            <View
              style={[
                styles.metricCard,
                { backgroundColor: theme.cardSecondary, borderColor: theme.border },
              ]}
            >
              <View style={styles.metricCardHeader}>
                <Ionicons name="fitness-outline" size={15} color={theme.tint} />
                <Text style={[styles.metricCardLabel, { color: theme.textSecondary }]}>
                  {t('volumeLifted')}
                </Text>
              </View>
              <Text style={[styles.metricCardValue, { color: theme.text }]}>
                {displayVolumeLifted} kg
              </Text>
            </View>

            {/* Box 3: CARDIO DISTANCE */}
            <View
              style={[
                styles.metricCard,
                { backgroundColor: theme.cardSecondary, borderColor: theme.border },
              ]}
            >
              <View style={styles.metricCardHeader}>
                <Ionicons name="speedometer-outline" size={15} color={theme.tint} />
                <Text style={[styles.metricCardLabel, { color: theme.textSecondary }]}>
                  {t('cardioDistance')}
                </Text>
              </View>
              <Text style={[styles.metricCardValue, { color: theme.text }]}>
                {displayCardioKm} km
              </Text>
            </View>

            {/* Box 4: HUNTER STREAK */}
            <View
              style={[
                styles.metricCard,
                { backgroundColor: theme.cardSecondary, borderColor: theme.border },
              ]}
            >
              <View style={styles.metricCardHeader}>
                <Ionicons name="flame-outline" size={15} color="#F97316" />
                <Text style={[styles.metricCardLabel, { color: theme.textSecondary }]}>
                  {t('hunterStreak')}
                </Text>
              </View>
              <Text style={[styles.metricCardValue, { color: theme.tint }]}>
                {displayStreak}
              </Text>
            </View>
          </View>

          {/* Monarch Verdict Subsection */}
          <View
            style={[
              styles.verdictSection,
              { backgroundColor: theme.cardSecondary, borderColor: theme.border },
            ]}
          >
            <View style={styles.verdictHeaderRow}>
              <View style={[styles.verdictDot, { backgroundColor: theme.tint }]} />
              <Text style={[styles.verdictSystemTag, { color: theme.tint }]}>
                {t('systemIntelligence')}
              </Text>
              <View style={{ flex: 1 }} />
              <Text style={[styles.verdictTitle, { color: theme.text }]}>
                {t('monarchVerdict')}
              </Text>
            </View>

            <View
              style={[
                styles.verdictBodyBox,
                { backgroundColor: theme.backgroundSecondary, borderColor: theme.border },
              ]}
            >
              <View style={[styles.verdictPurpleBar, { backgroundColor: theme.tint }]} />
              <Text style={[styles.verdictMessage, { color: theme.textSecondary }]}>
                {t('monarchVerdictDesc')}
              </Text>
            </View>
          </View>
        </View>

        {/* 5. PLAYER HIERARCHY CARD */}
        <View
          style={[
            styles.hierarchyCard,
            {
              backgroundColor: theme.card,
              borderColor: theme.borderRose,
              shadowColor: theme.glow,
            },
          ]}
        >
          <View style={styles.hierarchyTopRow}>
            <View style={styles.hierarchyTagRow}>
              <Ionicons name="hourglass-outline" size={14} color={theme.tint} style={{ marginRight: 6 }} />
              <Text style={[styles.hierarchyTagText, { color: theme.tint }]}>
                {t('playerHierarchy')}
              </Text>
            </View>

            <View style={styles.coinsDisplayRow}>
              <Ionicons name="disc" size={16} color="#FBBF24" style={{ marginRight: 5 }} />
              <Text style={styles.coinsDisplayText}>
                {profile?.coins ?? 190} {t('coins')}
              </Text>
            </View>
          </View>

          <Text style={[styles.rankInitiateTitle, { color: theme.text }]}>
            {userRank}-RANK INITIATE
          </Text>

          <View style={styles.xpRow}>
            <Text style={[styles.xpCurrentText, { color: theme.text }]}>
              {profile?.exp ?? 340} XP
            </Text>
            <Text style={[styles.xpTargetText, { color: theme.textSecondary }]}>
              {profile?.max_exp ?? 1000} {t('xpToNextRank')}
            </Text>
          </View>

          {/* XP Progress Track */}
          <View style={[styles.xpTrack, { backgroundColor: theme.cardSecondary }]}>
            <View
              style={[
                styles.xpFill,
                {
                  backgroundColor: theme.tint,
                  width: `${Math.min(
                    100,
                    Math.max(
                      8,
                      Math.round(
                        ((profile?.exp ?? 340) / (profile?.max_exp ?? 1000)) * 100
                      )
                    )
                  )}%`,
                },
              ]}
            />
          </View>
        </View>

        {/* 6. EXCHANGE - MONARCH SHOP CARD */}
        <View
          style={[
            styles.shopCard,
            {
              backgroundColor: theme.card,
              borderColor: theme.borderRose,
              shadowColor: theme.glow,
            },
          ]}
        >
          <View style={styles.shopTagRow}>
            <Ionicons name="cart-outline" size={15} color={theme.tint} style={{ marginRight: 6 }} />
            <Text style={[styles.shopTagText, { color: theme.tint }]}>{t('monarchShop')}</Text>
          </View>

          <Text style={[styles.shopMainTitle, { color: theme.text }]}>{t('monarchShop')}</Text>

          <View style={styles.shopItemsList}>
            {MONARCH_SHOP_ITEMS.map((item) => {
              const isUnlocked = unlockedItems.includes(item.id);
              return (
                <View
                  key={item.id}
                  style={[
                    styles.shopItemRow,
                    { backgroundColor: theme.cardSecondary, borderColor: theme.border },
                  ]}
                >
                  {/* Item Icon */}
                  <View style={[styles.shopItemIconWrap, { backgroundColor: item.iconBg }]}>
                    <Ionicons
                      name={item.icon}
                      size={18}
                      color="#FFFFFF"
                    />
                  </View>

                  {/* Title & Subtitle */}
                  <View style={styles.shopItemDetails}>
                    <Text style={[styles.shopItemTitle, { color: theme.text }]}>{item.title}</Text>
                    <Text style={[styles.shopItemSubtitle, { color: theme.textSecondary }]}>
                      {item.subtitle}
                    </Text>
                  </View>

                  {/* Buy/Active Button */}
                  <SmoothPressable
                    onPress={() => handlePurchase(item)}
                    style={[
                      styles.buyBtn,
                      { backgroundColor: theme.card, borderColor: theme.border },
                      isUnlocked && item.type === 'aura' && {
                        backgroundColor: `${theme.tint}25`,
                        borderColor: theme.tint,
                      },
                    ]}
                  >
                    <Ionicons
                      name="disc"
                      size={13}
                      color="#FBBF24"
                      style={{ marginRight: 4 }}
                    />
                    <Text
                      style={[
                        styles.buyBtnText,
                        { color: theme.text },
                        isUnlocked && item.type === 'aura' && { color: theme.tint },
                      ]}
                    >
                      {isUnlocked && item.type === 'aura' ? 'Equipped' : item.cost}
                    </Text>
                  </SmoothPressable>
                </View>
              );
            })}
          </View>
        </View>
      </ScrollView>

      {/* Prime Awakening Profile Modal */}
      <PrimeAwakeningModal
        visible={awakeningOpen}
        onClose={() => setAwakeningOpen(false)}
        onSave={() => loadAllStats()}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  topHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 14,
    borderBottomWidth: 1,
  },
  avatarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  topAvatarWrapper: {
    marginRight: 10,
    borderRadius: 28,
    padding: 2,
    borderWidth: 1.5,
  },
  avatarContainer: {
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
  avatarImg: {
    width: '100%',
    height: '100%',
  },
  headerInfo: {
    marginLeft: 12,
    flex: 1,
  },
  nameRankRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  hunterName: {
    fontSize: 17.5,
    fontWeight: '800',
    maxWidth: 200,
  },
  rankBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  rankBadgeText: {
    color: '#FFFFFF',
    fontSize: 11.5,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  questSubtitle: {
    fontSize: 13,
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
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 18,
    paddingBottom: 36,
    gap: 18,
  },
  screenTitleSection: {
    marginBottom: 4,
  },
  pageTitle: {
    fontSize: 22.5,
    fontWeight: '900',
    letterSpacing: 0.3,
  },
  pageSubtitle: {
    fontSize: 14,
    marginTop: 4,
  },
  tagsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: -4,
  },
  systemReportTag: {
    fontSize: 12.5,
    fontWeight: '800',
    letterSpacing: 0.8,
    fontFamily: 'monospace',
  },
  activeCyclePill: {
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 14,
  },
  activeCycleText: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  weeklyCard: {
    borderRadius: 22,
    borderWidth: 1.2,
    padding: 18,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 6,
  },
  weeklyCardTitle: {
    fontSize: 18,
    fontWeight: '900',
    letterSpacing: 0.5,
    marginBottom: 16,
  },
  gaugeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
    paddingHorizontal: 4,
  },
  svgWrapper: {
    width: 104,
    height: 104,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  svgCenterText: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  gaugePercentText: {
    fontSize: 20,
    fontWeight: '900',
  },
  gaugeSubText: {
    fontSize: 8.5,
    fontWeight: '800',
    letterSpacing: 0.5,
    marginTop: 1,
  },
  gaugeInfoCol: {
    flex: 1,
    marginLeft: 24,
    justifyContent: 'center',
    gap: 12,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  ratingLabel: {
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  ratingPill: {
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 14,
  },
  ratingPillText: {
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.6,
  },
  workoutDaysBox: {
    gap: 3,
  },
  workoutDaysLabel: {
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.6,
  },
  workoutDaysValue: {
    fontSize: 22,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 20,
  },
  metricCard: {
    width: '48%',
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 14,
    gap: 6,
  },
  metricCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  metricCardLabel: {
    fontSize: 11.5,
    fontWeight: '800',
    letterSpacing: 0.6,
  },
  metricCardValue: {
    fontSize: 20,
    fontWeight: '900',
    fontVariant: ['tabular-nums'],
  },
  verdictSection: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
    gap: 10,
  },
  verdictHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  verdictDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  verdictSystemTag: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.6,
    fontFamily: 'monospace',
  },
  verdictTitle: {
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  verdictBodyBox: {
    flexDirection: 'row',
    borderRadius: 10,
    borderWidth: 1,
    padding: 12,
    overflow: 'hidden',
  },
  verdictPurpleBar: {
    width: 3.5,
    borderRadius: 2,
    marginRight: 10,
  },
  verdictMessage: {
    fontSize: 13.5,
    lineHeight: 20,
    flex: 1,
    fontWeight: '500',
  },
  hierarchyCard: {
    borderRadius: 22,
    borderWidth: 1.2,
    padding: 18,
    gap: 12,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 14,
    elevation: 6,
  },
  hierarchyTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  hierarchyTagRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  hierarchyTagText: {
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 0.8,
  },
  coinsDisplayRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  coinsDisplayText: {
    color: '#FBBF24',
    fontSize: 15,
    fontWeight: '900',
  },
  rankInitiateTitle: {
    fontSize: 19,
    fontWeight: '900',
    letterSpacing: 0.5,
    marginTop: -2,
  },
  xpRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  xpCurrentText: {
    fontSize: 14,
    fontWeight: '800',
  },
  xpTargetText: {
    fontSize: 13,
    fontWeight: '600',
  },
  xpTrack: {
    height: 9,
    borderRadius: 6,
    overflow: 'hidden',
  },
  xpFill: {
    height: '100%',
    borderRadius: 6,
  },
  shopCard: {
    borderRadius: 22,
    borderWidth: 1.2,
    padding: 18,
    gap: 14,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 14,
    elevation: 6,
  },
  shopTagRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  shopTagText: {
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 0.8,
  },
  shopMainTitle: {
    fontSize: 19,
    fontWeight: '900',
    marginTop: -4,
  },
  shopItemsList: {
    gap: 10,
  },
  shopItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  shopItemIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  shopItemDetails: {
    flex: 1,
    marginLeft: 12,
  },
  shopItemTitle: {
    fontSize: 15,
    fontWeight: '800',
  },
  shopItemSubtitle: {
    fontSize: 12,
    marginTop: 2,
  },
  buyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 18,
  },
  buyBtnText: {
    fontSize: 13,
    fontWeight: '800',
  },
});
