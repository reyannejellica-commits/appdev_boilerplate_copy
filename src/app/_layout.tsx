import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as SystemUI from 'expo-system-ui';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Platform, StyleSheet, View } from 'react-native';
import { getDb } from '@/db/client';
import { refreshModelStatus } from '@/ai/local';
import { DownloadStatusIndicator } from '@/components/DownloadStatusIndicator';
import { PopupProvider } from '@/components/Popup';
import { AccessibilityPreferences, useReduceMotion } from '@/components/AccessibilityPreferences';
import { SettingsProvider, useSettings } from '@/settings/SettingsContext';
import { useTheme } from '@/theme';

export default function RootLayout() {
  const theme = useTheme();
  const [ready, setReady] = useState(false);

  const [fontsLoaded] = useFonts({
    'Poppins-Regular': require('../../assets/fonts/Poppins-Regular.ttf'),
    'Poppins-Medium': require('../../assets/fonts/Poppins-Medium.ttf'),
    'Poppins-SemiBold': require('../../assets/fonts/Poppins-SemiBold.ttf'),
    'Poppins-Bold': require('../../assets/fonts/Poppins-Bold.ttf'),
    'Poppins-ExtraBold': require('../../assets/fonts/Poppins-ExtraBold.ttf'),
  });

  useEffect(() => {
    // Open + migrate the database and read the local model's on-disk
    // state before rendering any screen.
    Promise.all([getDb(), refreshModelStatus()])
      .catch((e) => console.warn('Init failed:', e))
      .finally(() => setReady(true));
  }, []);

  if (!ready || !fontsLoaded) {
    return (
      <View style={[styles.loading, { backgroundColor: theme.background }]}>
        <ActivityIndicator color={theme.tint} />
      </View>
    );
  }

  return (
    <SettingsProvider>
      <AccessibilityPreferences><PopupProvider><RootNavigator /></PopupProvider></AccessibilityPreferences>
    </SettingsProvider>
  );
}

/** Shows onboarding until it's completed, then the main app. */
function RootNavigator() {
  const theme = useTheme();
  const { settings, ready } = useSettings();
  const reduceMotion = useReduceMotion();

  // Keep the OS background colour (keyboard area, splash fade) in sync.
  useEffect(() => {
    void SystemUI.setBackgroundColorAsync(theme.background);
  }, [theme.background]);

  // Ensure the web browser tab always displays the PeakFit logo (overrides any cached localhost favicon).
  useEffect(() => {
    if (Platform.OS !== 'web' || typeof document === 'undefined') return;
    document.title = 'PeakFit';
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" fill="none"><rect width="64" height="64" rx="16" fill="#0B0713"/><rect x="2" y="2" width="60" height="60" rx="14" stroke="${theme.tint}" stroke-width="2.5"/><path d="M 16 42 L 32 17 L 48 42" stroke="#F1E8EC" stroke-width="5.2" stroke-linecap="round" stroke-linejoin="round"/><path d="M 12 31 L 52 31" stroke="#F1E8EC" stroke-width="4.4" stroke-linecap="round"/><path d="M 11 22 L 11 40" stroke="${theme.tint}" stroke-width="6" stroke-linecap="round"/><path d="M 53 22 L 53 40" stroke="${theme.tint}" stroke-width="6" stroke-linecap="round"/></svg>`;
    const dataUri = `data:image/svg+xml,${encodeURIComponent(svg)}`;
    document.querySelectorAll("link[rel*='icon']").forEach((el) => el.remove());
    const link = document.createElement('link');
    link.rel = 'icon';
    link.type = 'image/svg+xml';
    link.href = dataUri;
    document.head.appendChild(link);
  }, [theme.tint]);

  if (!ready) {
    return (
      <View style={[styles.loading, { backgroundColor: theme.background }]}>
        <ActivityIndicator color={theme.tint} />
      </View>
    );
  }

  return (
    <>
      <StatusBar style={settings.theme === 'dark' ? 'light' : 'dark'} />
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: theme.card },
          headerTitleStyle: { fontFamily: 'Poppins-Bold', fontSize: 17 },
          headerTintColor: theme.tint,
          contentStyle: { backgroundColor: theme.background },
          animation: reduceMotion ? 'none' : 'slide_from_right',
        }}
      >
        <Stack.Screen name="onboarding" options={{ headerShown: false }} />
        <Stack.Protected guard={settings.onboarded}>
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="settings" options={{ headerShown: false }} />
          <Stack.Screen name="chat-settings" options={{ title: 'Chat settings' }} />
          <Stack.Screen name="privacy" options={{ title: 'Privacy Policy' }} />
          <Stack.Screen name="terms" options={{ title: 'Terms & Conditions' }} />
        </Stack.Protected>
      </Stack>
      <DownloadStatusIndicator />
    </>
  );
}

const styles = StyleSheet.create({
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center' },
});
