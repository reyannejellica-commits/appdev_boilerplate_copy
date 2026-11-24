import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

// Configure default notification handler for foreground notifications
try {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
      shouldShowBanner: true,
      shouldShowList: true,
    }),
  });
} catch (e) {
  console.warn('Could not set notification handler:', e);
}

/**
 * Request notification permissions from the user.
 * Returns true if granted.
 */
export async function requestNotificationPermission(): Promise<boolean> {
  if (Platform.OS === 'web') return false;
  try {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    return finalStatus === 'granted';
  } catch (err) {
    console.warn('Failed to request notification permission:', err);
    return false;
  }
}

/**
 * Schedule daily workout reminder alarm.
 * Default: 8:00 AM daily.
 * Offline-capable: uses native Android AlarmManager / WorkManager.
 */
export async function scheduleDailyWorkoutReminder(
  streakDays: number = 2,
  hour: number = 8,
  minute: number = 0
): Promise<string | null> {
  if (Platform.OS === 'web') return null;

  try {
    const granted = await requestNotificationPermission();
    if (!granted) return null;

    // Clear previous scheduled workout reminders to prevent duplicate alarms
    await Notifications.cancelAllScheduledNotificationsAsync();

    // Create an evocative Tagalog/English workout alarm prompt
    const dayLabel = streakDays > 0 ? `Day ${streakDays + 1}` : 'Day 1';
    const id = await Notifications.scheduleNotificationAsync({
      content: {
        title: `⚡ ${dayLabel} na pala! Need mo na mag-exercise!`,
        body: `Oras na para sa iyong PeakFit workout session! Huwag hayaang mawala ang iyong Hunter Streak ngayon.`,
        sound: true,
        priority: Notifications.AndroidNotificationPriority.HIGH,
        data: { target: 'workout' },
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DAILY,
        hour,
        minute,
      },
    });

    return id;
  } catch (err) {
    console.warn('Failed to schedule daily workout reminder:', err);
    return null;
  }
}

/**
 * Schedule an immediate or relative reminder (e.g. 5 seconds for preview or 1 hour post-workout)
 */
export async function scheduleRelativeReminder(
  secondsFromNow: number,
  title: string,
  body: string
): Promise<string | null> {
  if (Platform.OS === 'web') return null;

  try {
    const granted = await requestNotificationPermission();
    if (!granted) return null;

    const id = await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        sound: true,
        priority: Notifications.AndroidNotificationPriority.HIGH,
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
        seconds: Math.max(1, secondsFromNow),
        repeats: false,
      },
    });

    return id;
  } catch (err) {
    console.warn('Failed to schedule relative reminder:', err);
    return null;
  }
}
