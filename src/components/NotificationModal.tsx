import { Ionicons } from '@expo/vector-icons';
import { useRouter, type Href } from 'expo-router';
import React, { useState } from 'react';
import {
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SmoothPressable } from '@/components/SmoothPressable';
import { useSettings } from '@/settings/SettingsContext';
import { FONTS, useTheme } from '@/theme';

export interface AppNotificationItem {
  id: string;
  category: 'QUEST' | 'AI COACH' | 'RECOVERY' | 'CARDIO' | 'REWARD';
  title: string;
  body: string;
  time: string;
  icon: keyof typeof Ionicons.glyphMap;
  accentColor: string;
  rewardBadge?: string;
  actionLabel?: string;
  actionRoute?: Href;
  read: boolean;
}

const INITIAL_NOTIFICATIONS: AppNotificationItem[] = [
  {
    id: 'notif-quest',
    category: 'QUEST',
    title: 'Daily Peak Quest Active',
    body: 'Complete all working sets in your active training protocol today to claim your +100 EXP bonus and protect your Hunter Streak.',
    time: 'Just now',
    icon: 'flame',
    accentColor: '#F59E0B',
    rewardBadge: '+100 EXP',
    actionLabel: 'Continue Workout',
    actionRoute: '/(tabs)' as Href,
    read: false,
  },
  {
    id: 'notif-coach',
    category: 'AI COACH',
    title: 'PeakFit AI Coach Tip',
    body: 'Aim for 1–2 Reps in Reserve (RIR) on compound movements and log your working weights to track progressive overload.',
    time: '12m ago',
    icon: 'sparkles',
    accentColor: '#38BDF8',
    rewardBadge: 'PRO TIP',
    actionLabel: 'Ask AI Coach',
    actionRoute: '/(tabs)/chat' as Href,
    read: false,
  },
  {
    id: 'notif-hydration',
    category: 'RECOVERY',
    title: 'Hydration & Protein Check',
    body: 'Drink 500ml of water 30 minutes before training and hit 1.8–2.2g of protein per kg of bodyweight today.',
    time: '45m ago',
    icon: 'water',
    accentColor: '#34D399',
    rewardBadge: '3.5L GOAL',
    read: false,
  },
  {
    id: 'notif-cardio',
    category: 'CARDIO',
    title: 'Beat the Clock HIIT Challenge',
    body: 'Boost your stamina stat and earn +25 Hunter Coins by conquering a timed distance run in the Cardio Hub.',
    time: '2h ago',
    icon: 'walk',
    accentColor: '#F43F5E',
    rewardBadge: '+25 COINS',
    actionLabel: 'Open Cardio Hub',
    actionRoute: '/(tabs)/cardio' as Href,
    read: true,
  },
  {
    id: 'notif-shop',
    category: 'REWARD',
    title: 'Monarch Shop & Rank Perks',
    body: 'Use your earned Hunter Coins in the Stats tab to unlock Shadow Monarch Aura, Recovery Elixirs, or 2x XP Boosts.',
    time: 'Today',
    icon: 'trophy',
    accentColor: '#A855F7',
    actionLabel: 'View Stats & Shop',
    actionRoute: '/(tabs)/stats' as Href,
    read: true,
  },
];

// Shared in-memory state across tabs so read status persists during the session
let sharedNotifications: AppNotificationItem[] = INITIAL_NOTIFICATIONS;
const listeners = new Set<() => void>();

function updateSharedNotifications(next: AppNotificationItem[]) {
  sharedNotifications = next;
  listeners.forEach((fn) => fn());
}

/**
 * Drop-in Notification Bell Button + Modal Drawer for screen headers.
 */
export function NotificationBellButton({
  streakDays = 4,
  completionPercent = 0,
}: {
  streakDays?: number;
  completionPercent?: number;
}) {
  const theme = useTheme();
  const { settings } = useSettings();
  const router = useRouter();
  const isDark = settings.theme === 'dark';

  const [open, setOpen] = useState(false);
  const [, setTick] = useState(0);

  React.useEffect(() => {
    const sync = () => setTick((t) => t + 1);
    listeners.add(sync);
    return () => {
      listeners.delete(sync);
    };
  }, []);

  const unreadCount = sharedNotifications.filter((n) => !n.read).length;

  const handleMarkAllRead = () => {
    updateSharedNotifications(sharedNotifications.map((n) => ({ ...n, read: true })));
  };

  const handlePressItem = (item: AppNotificationItem) => {
    updateSharedNotifications(
      sharedNotifications.map((n) => (n.id === item.id ? { ...n, read: true } : n))
    );
    if (item.actionRoute) {
      setOpen(false);
      router.push(item.actionRoute);
    }
  };

  const handleResetDemo = () => {
    updateSharedNotifications(INITIAL_NOTIFICATIONS);
  };

  const modalBg = isDark ? '#0D0C13' : '#FFFFFF';
  const cardBg = isDark ? '#16141F' : '#F8FAFC';
  const cardBorder = isDark ? 'rgba(255,255,255,0.09)' : 'rgba(15,23,42,0.09)';

  return (
    <>
      <SmoothPressable
        onPress={() => setOpen(true)}
        style={[
          styles.bellBtn,
          {
            backgroundColor: theme.cardSecondary,
            borderColor: unreadCount > 0 ? `${theme.tint}66` : theme.border,
          },
        ]}
        accessibilityRole="button"
        accessibilityLabel={`Open Notifications (${unreadCount} unread)`}
        hitSlop={8}
      >
        <Ionicons
          name={unreadCount > 0 ? 'notifications' : 'notifications-outline'}
          size={18}
          color={theme.tint}
        />
        {unreadCount > 0 && (
          <View
            style={[
              styles.badgeDot,
              {
                backgroundColor: theme.tint,
                borderColor: isDark ? '#100E17' : '#FFFFFF',
              },
            ]}
          >
            <Text style={styles.badgeDotText}>{unreadCount}</Text>
          </View>
        )}
      </SmoothPressable>

      <Modal
        visible={open}
        transparent
        animationType="fade"
        onRequestClose={() => setOpen(false)}
      >
        <View style={styles.overlay}>
          <View
            style={[
              styles.modalContainer,
              {
                backgroundColor: modalBg,
                borderColor: isDark ? 'rgba(255,255,255,0.14)' : theme.border,
              },
            ]}
          >
            {/* Top Grabber */}
            <View
              style={[
                styles.grabber,
                { backgroundColor: isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.15)' },
              ]}
            />

            {/* Header Row */}
            <View style={styles.headerRow}>
              <View style={styles.headerTitleWrap}>
                <View
                  style={[
                    styles.headerIconBadge,
                    {
                      backgroundColor: `${theme.tint}1E`,
                      borderColor: `${theme.tint}45`,
                    },
                  ]}
                >
                  <Ionicons name="notifications" size={16} color={theme.tint} />
                </View>
                <View>
                  <Text style={[styles.headerTitle, { color: theme.text }]}>
                    Notifications
                  </Text>
                  <Text style={[styles.headerSub, { color: theme.textSecondary }]}>
                    {unreadCount > 0
                      ? `${unreadCount} unread updates`
                      : 'All caught up for today'}
                  </Text>
                </View>
              </View>

              <View style={styles.headerRightActions}>
                {unreadCount > 0 ? (
                  <SmoothPressable
                    onPress={handleMarkAllRead}
                    style={[
                      styles.markReadBtn,
                      {
                        backgroundColor: `${theme.tint}16`,
                        borderColor: `${theme.tint}40`,
                      },
                    ]}
                    accessibilityRole="button"
                    accessibilityLabel="Mark all notifications as read"
                  >
                    <Ionicons name="checkmark-done" size={13} color={theme.tint} />
                    <Text style={[styles.markReadText, { color: theme.tint }]}>
                      Mark read
                    </Text>
                  </SmoothPressable>
                ) : (
                  <SmoothPressable
                    onPress={handleResetDemo}
                    style={[
                      styles.markReadBtn,
                      {
                        backgroundColor: isDark
                          ? 'rgba(255,255,255,0.06)'
                          : 'rgba(0,0,0,0.05)',
                        borderColor: cardBorder,
                      },
                    ]}
                    accessibilityRole="button"
                    accessibilityLabel="Refresh notifications"
                  >
                    <Ionicons name="refresh" size={13} color={theme.textSecondary} />
                  </SmoothPressable>
                )}

                <SmoothPressable
                  onPress={() => setOpen(false)}
                  style={[
                    styles.closeBtn,
                    {
                      backgroundColor: isDark
                        ? 'rgba(255,255,255,0.08)'
                        : 'rgba(0,0,0,0.05)',
                      borderColor: cardBorder,
                    },
                  ]}
                  accessibilityRole="button"
                  accessibilityLabel="Close Notifications"
                >
                  <Ionicons name="close" size={18} color={theme.text} />
                </SmoothPressable>
              </View>
            </View>

            {/* Live Hunter Telemetry Strip */}
            <View
              style={[
                styles.telemetryBanner,
                {
                  backgroundColor: `${theme.tint}12`,
                  borderColor: `${theme.tint}35`,
                },
              ]}
            >
              <View style={styles.telemetryItem}>
                <Ionicons name="flame" size={15} color="#F59E0B" />
                <Text style={[styles.telemetryText, { color: theme.text }]}>
                  {streakDays}d Streak
                </Text>
              </View>
              <View
                style={[
                  styles.telemetryDivider,
                  { backgroundColor: isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.12)' },
                ]}
              />
              <View style={styles.telemetryItem}>
                <Ionicons name="barbell" size={15} color={theme.tint} />
                <Text style={[styles.telemetryText, { color: theme.text }]}>
                  Protocol: {completionPercent}%
                </Text>
              </View>
              <View
                style={[
                  styles.telemetryDivider,
                  { backgroundColor: isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.12)' },
                ]}
              />
              <View style={styles.telemetryItem}>
                <Ionicons name="shield-checkmark" size={15} color="#34D399" />
                <Text style={[styles.telemetryText, { color: theme.text }]}>
                  System Ready
                </Text>
              </View>
            </View>

            {/* Notification Cards List */}
            <ScrollView
              style={styles.listScroll}
              contentContainerStyle={styles.listContent}
              showsVerticalScrollIndicator={false}
            >
              {sharedNotifications.map((item) => {
                return (
                  <SmoothPressable
                    key={item.id}
                    onPress={() => handlePressItem(item)}
                    style={[
                      styles.notifCard,
                      {
                        backgroundColor: !item.read
                          ? isDark
                            ? '#1B1726'
                            : '#FFF5F8'
                          : cardBg,
                        borderColor: !item.read ? `${theme.tint}45` : cardBorder,
                      },
                    ]}
                    accessibilityRole="button"
                    accessibilityLabel={item.title}
                  >
                    <View style={styles.notifTopRow}>
                      <View
                        style={[
                          styles.notifIconWrap,
                          {
                            backgroundColor: `${item.accentColor}1E`,
                            borderColor: `${item.accentColor}45`,
                          },
                        ]}
                      >
                        <Ionicons name={item.icon} size={17} color={item.accentColor} />
                      </View>

                      <View style={styles.notifTitleCol}>
                        <View style={styles.categoryTimeRow}>
                          <Text
                            style={[styles.categoryLabel, { color: item.accentColor }]}
                          >
                            {item.category}
                          </Text>
                          {item.rewardBadge && (
                            <View
                              style={[
                                styles.rewardBadge,
                                {
                                  backgroundColor: `${item.accentColor}1A`,
                                  borderColor: `${item.accentColor}45`,
                                },
                              ]}
                            >
                              <Text
                                style={[
                                  styles.rewardBadgeText,
                                  { color: item.accentColor },
                                ]}
                              >
                                {item.rewardBadge}
                              </Text>
                            </View>
                          )}
                          <Text
                            style={[styles.timeText, { color: theme.textSecondary }]}
                          >
                            {item.time}
                          </Text>
                          {!item.read && (
                            <View
                              style={[
                                styles.unreadDot,
                                { backgroundColor: theme.tint },
                              ]}
                            />
                          )}
                        </View>

                        <Text style={[styles.notifTitle, { color: theme.text }]}>
                          {item.title}
                        </Text>
                      </View>
                    </View>

                    <Text style={[styles.notifBody, { color: theme.textSecondary }]}>
                      {item.body}
                    </Text>

                    {item.actionLabel && (
                      <View style={styles.actionFooterRow}>
                        <View
                          style={[
                            styles.actionPill,
                            {
                              backgroundColor: `${theme.tint}18`,
                              borderColor: `${theme.tint}40`,
                            },
                          ]}
                        >
                          <Text style={[styles.actionPillText, { color: theme.tint }]}>
                            {item.actionLabel}
                          </Text>
                          <Ionicons
                            name="arrow-forward"
                            size={12}
                            color={theme.tint}
                          />
                        </View>
                      </View>
                    )}
                  </SmoothPressable>
                );
              })}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  bellBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    borderWidth: 1.2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeDot: {
    position: 'absolute',
    top: -3,
    right: -3,
    minWidth: 17,
    height: 17,
    borderRadius: 8.5,
    borderWidth: 1.5,
    paddingHorizontal: 3,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeDotText: {
    fontFamily: FONTS.extraBold,
    color: '#FFFFFF',
    fontSize: 9.5,
    fontWeight: '900',
    lineHeight: 11,
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.76)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 24,
  },
  modalContainer: {
    width: '100%',
    maxWidth: 440,
    maxHeight: '88%',
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
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  headerTitleWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  headerIconBadge: {
    width: 36,
    height: 36,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontFamily: FONTS.bold,
    fontSize: 18,
    fontWeight: '800',
  },
  headerSub: {
    fontFamily: FONTS.medium,
    fontSize: 11.5,
    fontWeight: '500',
  },
  headerRightActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  markReadBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 9,
    paddingVertical: 6,
    borderRadius: 10,
    borderWidth: 1,
  },
  markReadText: {
    fontFamily: FONTS.bold,
    fontSize: 11,
    fontWeight: '700',
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  telemetryBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    borderRadius: 14,
    borderWidth: 1,
    paddingVertical: 9,
    paddingHorizontal: 10,
    marginBottom: 12,
  },
  telemetryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  telemetryText: {
    fontFamily: FONTS.semiBold,
    fontSize: 11.5,
    fontWeight: '700',
  },
  telemetryDivider: {
    width: 1,
    height: 14,
  },
  listScroll: {
    flexGrow: 0,
  },
  listContent: {
    gap: 10,
    paddingBottom: 6,
  },
  notifCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 13,
  },
  notifTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 6,
  },
  notifIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 11,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  notifTitleCol: {
    flex: 1,
  },
  categoryTimeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 2,
  },
  categoryLabel: {
    fontFamily: FONTS.bold,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.6,
  },
  rewardBadge: {
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 5,
    borderWidth: 1,
  },
  rewardBadgeText: {
    fontFamily: FONTS.bold,
    fontSize: 9,
    fontWeight: '800',
  },
  timeText: {
    fontFamily: FONTS.medium,
    fontSize: 10.5,
    marginLeft: 'auto',
  },
  unreadDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
  },
  notifTitle: {
    fontFamily: FONTS.bold,
    fontSize: 14,
    fontWeight: '700',
  },
  notifBody: {
    fontFamily: FONTS.regular,
    fontSize: 12.5,
    lineHeight: 18,
  },
  actionFooterRow: {
    marginTop: 9,
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  actionPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 9,
    borderWidth: 1,
  },
  actionPillText: {
    fontFamily: FONTS.bold,
    fontSize: 11,
    fontWeight: '700',
  },
});
