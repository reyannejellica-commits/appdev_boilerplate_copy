import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { getDungeonGates, getHunterProfile, type DungeonGate, type HunterProfile } from '@/db/hunter';
import { useSettings } from '@/settings/SettingsContext';
import { useTheme } from '@/theme';

export default function StatsScreen() {
  const theme = useTheme();
  const { settings } = useSettings();
  const [profile, setProfile] = useState<HunterProfile | null>(null);
  const [gates, setGates] = useState<DungeonGate[]>([]);

  useEffect(() => {
    let isMounted = true;
    (async () => {
      try {
        const p = await getHunterProfile(settings.nickname || 'Hunter');
        const g = await getDungeonGates();
        if (isMounted) {
          setProfile(p);
          setGates(g);
        }
      } catch (e) {
        console.warn('Failed to load profile for stats:', e);
      }
    })();
    return () => {
      isMounted = false;
    };
  }, [settings.nickname]);

  const level = profile?.level || 1;
  const exp = profile?.exp || 0;
  const maxExp = profile?.max_exp || 100;
  const expPercent = Math.min(100, Math.round((exp / maxExp) * 100));

  const statsList = [
    { name: 'STRENGTH (STR)', value: profile?.str || 12, icon: 'barbell-outline', color: theme.tint, desc: 'Increases barbell and dumbbell maximal power output' },
    { name: 'AGILITY (AGI)', value: profile?.agi || 10, icon: 'walk-outline', color: theme.accentCyan, desc: 'Increases cardio velocity and neuromuscular coordination' },
    { name: 'STAMINA (STA)', value: profile?.sta || 14, icon: 'shield-outline', color: theme.accentGold, desc: 'Enhances training volume tolerance and fatigue resistance' },
    { name: 'INTELLIGENCE (INT)', value: profile?.int_stat || 10, icon: 'hardware-chip-outline', color: '#A855F7', desc: 'Optimizes mind-muscle connection and recovery speed' },
  ];

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.background }]}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
    >
      {/* 1. Status Window Title */}
      <View style={styles.header}>
        <View style={[styles.statusBadge, { backgroundColor: theme.surface, borderColor: theme.tint }]}>
          <Text style={[styles.statusBadgeText, { color: theme.tint }]}>[SYSTEM STATUS WINDOW]</Text>
        </View>
        <Text style={[styles.hunterTitle, { color: theme.text }]}>
          {profile?.hunter_name || settings.nickname || 'Hunter'}
        </Text>
        <Text style={[styles.classSubtitle, { color: theme.textSecondary }]}>
          Rank: {profile?.rank || 'E-Rank'} • Class: Shadow Vanguard
        </Text>
      </View>

      {/* 2. Level & EXP Gauge Card */}
      <View style={[styles.levelCard, { backgroundColor: theme.card, borderColor: theme.tint }]}>
        <View style={styles.levelRow}>
          <View>
            <Text style={[styles.levelNumber, { color: theme.text }]}>LEVEL {level}</Text>
            <Text style={[styles.rankLabel, { color: theme.accentGold }]}>
              {profile?.rank || 'E-Rank Hunter'}
            </Text>
          </View>
          <View style={[styles.rankCircle, { backgroundColor: theme.surface, borderColor: theme.accentGold }]}>
            <Ionicons name="trophy" size={24} color={theme.accentGold} />
          </View>
        </View>

        <View style={styles.expSection}>
          <View style={styles.expLabelsRow}>
            <Text style={[styles.expText, { color: theme.textSecondary }]}>EXPERIENCE (EXP)</Text>
            <Text style={[styles.expNumbers, { color: theme.accentCyan }]}>
              {exp} / {maxExp} ({expPercent}%)
            </Text>
          </View>
          <View style={[styles.expTrack, { backgroundColor: theme.surface }]}>
            <View style={[styles.expFill, { width: `${expPercent}%`, backgroundColor: theme.tint }]} />
          </View>
        </View>
      </View>

      {/* 3. Attributes Section */}
      <View style={styles.sectionHeaderRow}>
        <Text style={[styles.sectionTitle, { color: theme.text }]}>Player Attributes</Text>
        <Text style={[styles.sectionSub, { color: theme.textSecondary }]}>Auto-allocated by System</Text>
      </View>

      <View style={styles.attributesGrid}>
        {statsList.map((stat, idx) => (
          <View
            key={idx}
            style={[styles.attributeCard, { backgroundColor: theme.card, borderColor: theme.border }]}
          >
            <View style={styles.attributeHeader}>
              <View style={[styles.attrIconBox, { backgroundColor: theme.surface, borderColor: stat.color }]}>
                <Ionicons name={stat.icon as any} size={20} color={stat.color} />
              </View>
              <Text style={[styles.statValue, { color: theme.text }]}>{stat.value}</Text>
            </View>
            <Text style={[styles.statName, { color: stat.color }]}>{stat.name}</Text>
            <Text style={[styles.statDesc, { color: theme.textSecondary }]}>{stat.desc}</Text>
          </View>
        ))}
      </View>

      {/* 4. Hunter Achievements & Career Logs */}
      <View style={styles.achievementsSection}>
        <Text style={[styles.sectionTitle, { color: theme.text }]}>Protocol Milestones</Text>
        <View style={styles.milestonesGrid}>
          <View style={[styles.milestoneItem, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <Ionicons name="flame" size={24} color={theme.accentGold} />
            <Text style={[styles.milestoneValue, { color: theme.text }]}>
              {profile?.streak_days || 1} DAYS
            </Text>
            <Text style={[styles.milestoneLabel, { color: theme.textSecondary }]}>CURRENT STREAK</Text>
          </View>

          <View style={[styles.milestoneItem, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <Ionicons name="checkmark-circle" size={24} color={theme.success} />
            <Text style={[styles.milestoneValue, { color: theme.text }]}>100%</Text>
            <Text style={[styles.milestoneLabel, { color: theme.textSecondary }]}>OFFLINE INTEGRITY</Text>
          </View>
        </View>
      </View>

      {/* 5. Acquired Hunter Titles */}
      <View style={styles.titlesSection}>
        <Text style={[styles.sectionTitle, { color: theme.text }]}>Acquired Hunter Titles</Text>
        <View style={styles.titlesList}>
          {gates.filter((g) => g.defeated).length === 0 ? (
            <View style={[styles.emptyTitlesCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
              <Ionicons name="shield-outline" size={28} color={theme.textDim} />
              <Text style={{ color: theme.textSecondary, fontSize: 13, marginTop: 4 }}>
                No dungeon titles acquired yet. Defeat a Dungeon Boss to unlock!
              </Text>
            </View>
          ) : (
            gates
              .filter((g) => g.defeated)
              .map((g) => (
                <View
                  key={g.id}
                  style={[styles.titleBadgeCard, { backgroundColor: theme.card, borderColor: theme.tint }]}
                >
                  <Ionicons name="ribbon-outline" size={22} color={theme.accentGold} />
                  <View style={{ flex: 1, gap: 2 }}>
                    <Text style={[styles.titleName, { color: theme.text }]}>{g.reward_title}</Text>
                    <Text style={{ color: theme.textSecondary, fontSize: 11 }}>
                      Slayer of {g.boss_name} • {g.rank}
                    </Text>
                  </View>
                  <View style={[styles.equippedBadge, { backgroundColor: 'rgba(16,185,129,0.15)' }]}>
                    <Text style={{ color: theme.success, fontSize: 10, fontWeight: '800' }}>ACQUIRED</Text>
                  </View>
                </View>
              ))
          )}
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { padding: 16, gap: 16, paddingBottom: 100 },

  header: {
    alignItems: 'center',
    gap: 6,
    marginVertical: 4,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
  },
  statusBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.5,
  },
  hunterTitle: {
    fontSize: 26,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  classSubtitle: {
    fontSize: 13,
    fontWeight: '600',
  },

  levelCard: {
    borderRadius: 20,
    borderWidth: 1.5,
    padding: 20,
    gap: 16,
    shadowColor: '#8B5CF6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 4,
  },
  levelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  levelNumber: {
    fontSize: 28,
    fontWeight: '900',
    letterSpacing: 1,
  },
  rankLabel: {
    fontSize: 13,
    fontWeight: '800',
    marginTop: 2,
  },
  rankCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  expSection: {
    gap: 8,
  },
  expLabelsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  expText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  expNumbers: {
    fontSize: 12,
    fontWeight: '800',
  },
  expTrack: {
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
    width: '100%',
  },
  expFill: {
    height: '100%',
    borderRadius: 4,
  },

  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '800',
  },
  sectionSub: {
    fontSize: 11,
    fontWeight: '600',
  },
  attributesGrid: {
    gap: 10,
  },
  attributeCard: {
    borderRadius: 16,
    borderWidth: 1.5,
    padding: 14,
    gap: 6,
  },
  attributeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  attrIconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statValue: {
    fontSize: 22,
    fontWeight: '900',
  },
  statName: {
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  statDesc: {
    fontSize: 11,
    lineHeight: 16,
  },

  achievementsSection: {
    gap: 12,
  },
  milestonesGrid: {
    flexDirection: 'row',
    gap: 10,
  },
  milestoneItem: {
    flex: 1,
    borderRadius: 16,
    borderWidth: 1.5,
    padding: 16,
    alignItems: 'center',
    gap: 6,
  },
  milestoneValue: {
    fontSize: 16,
    fontWeight: '900',
  },
  milestoneLabel: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.5,
  },

  // Titles Section
  titlesSection: {
    gap: 12,
  },
  titlesList: {
    gap: 10,
  },
  emptyTitlesCard: {
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleBadgeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 14,
    borderWidth: 1.5,
    gap: 12,
  },
  titleName: {
    fontSize: 14,
    fontWeight: '800',
  },
  equippedBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
});
