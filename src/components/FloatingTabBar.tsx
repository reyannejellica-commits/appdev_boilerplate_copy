import { BlurView } from 'expo-blur';
import type { Tabs } from 'expo-router';
import React from 'react';
import { Platform, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { SmoothPressable } from '@/components/SmoothPressable';
import { useSettings } from '@/settings/SettingsContext';
import { FONTS, useTheme } from '@/theme';

type TabBarProps = Parameters<NonNullable<React.ComponentProps<typeof Tabs>['tabBar']>>[0];

export const TAB_BAR_HEIGHT = 66;
export const TAB_BAR_GAP = 24;

/**
 * Detached Floating Capsule Island Navigation Bar
 * Features:
 * - True elevated floating island detached from bottom & side edges
 * - Translucent frosted glass blur (expo-blur) with top specular highlight rim
 * - Full capsule pill geometry (borderRadius: 999) with deep floating drop shadow
 * - Glowing active capsule indicator pill with active indicator dot
 */
export function FloatingTabBar({ state, descriptors, navigation }: TabBarProps) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const { settings } = useSettings();

  const currentRoute = state.routes[state.index];
  // Hide bottom tab bar completely when inside Coach chat
  if (currentRoute?.name === 'chat') {
    return null;
  }

  // Filter out any hidden routes and restrict strictly to the 4 main tabs
  const ALLOWED_TABS = ['index', 'program', 'cardio', 'stats'];
  const visibleRoutes = state.routes.filter((route) => {
    const options = descriptors[route.key]?.options as { href?: string | null } | undefined;
    return (
      ALLOWED_TABS.includes(route.name) &&
      options?.href !== null &&
      route.name !== 'tools' &&
      route.name !== 'chat'
    );
  });

  const go = (route: (typeof state.routes)[number], focused: boolean) => {
    const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
    if (!focused && !event.defaultPrevented) navigation.navigate(route.name, route.params);
  };

  const icon = (
    route: (typeof state.routes)[number],
    focused: boolean,
    size: number,
    color: string
  ) =>
    descriptors[route.key]?.options?.tabBarIcon?.({
      focused,
      color,
      size,
    });

  const isDark = settings.theme === 'dark';
  const floatBottom = Math.max(insets.bottom + 14, TAB_BAR_GAP);

  return (
    <View
      pointerEvents="box-none"
      style={[
        styles.wrapper,
        {
          bottom: floatBottom,
        },
      ]}
    >
      {/* Ambient under-glow shadow layer that makes the dock visibly levitate */}
      <View
        style={[
          styles.floatingShadowShell,
          {
            shadowColor: isDark ? theme.glow : '#000000',
            shadowOpacity: isDark ? 0.42 : 0.16,
          },
        ]}
      >
        <View
          style={[
            styles.capsuleClip,
            {
              backgroundColor: isDark
                ? 'rgba(15, 15, 22, 0.84)'
                : 'rgba(255, 255, 255, 0.88)',
              borderColor: isDark
                ? 'rgba(255, 255, 255, 0.15)'
                : 'rgba(15, 23, 42, 0.10)',
            },
          ]}
        >
          {Platform.OS !== 'web' && (
            <BlurView
              intensity={isDark ? 45 : 65}
              tint={isDark ? 'dark' : 'light'}
              style={StyleSheet.absoluteFill}
            />
          )}

          {/* Top specular glass rim highlight */}
          <View
            pointerEvents="none"
            style={[
              styles.topRimHighlight,
              {
                backgroundColor: isDark
                  ? 'rgba(255, 255, 255, 0.16)'
                  : 'rgba(255, 255, 255, 0.85)',
              },
            ]}
          />

          <View style={styles.tabsRow}>
            {visibleRoutes.map((route) => {
              const focused = state.routes[state.index]?.key === route.key;
              const { title } = descriptors[route.key]?.options ?? {};
              const itemColor = focused
                ? theme.tint
                : isDark
                ? '#94A3B8'
                : '#64748B';

              return (
                <SmoothPressable
                  key={route.key}
                  onPress={() => go(route, focused)}
                  accessibilityLabel={title ?? route.name}
                  accessibilityRole="tab"
                  accessibilityState={{ selected: focused }}
                  style={styles.tabTouch}
                >
                  <View
                    style={[
                      styles.tabContent,
                      focused && [
                        styles.activeTabContent,
                        {
                          backgroundColor: isDark
                            ? `${theme.tint}22`
                            : `${theme.tint}16`,
                          borderColor: `${theme.tint}55`,
                          shadowColor: theme.glow,
                        },
                      ],
                    ]}
                  >
                    <View style={styles.iconWrap}>
                      {icon(route, focused, 21, itemColor)}
                    </View>
                    <Text
                      numberOfLines={1}
                      style={[
                        styles.label,
                        {
                          color: itemColor,
                          fontFamily: focused ? FONTS.bold : FONTS.medium,
                          fontWeight: focused ? '700' : '500',
                        },
                      ]}
                    >
                      {title ?? route.name}
                    </Text>
                    {focused && (
                      <View
                        style={[
                          styles.activeDot,
                          {
                            backgroundColor: theme.tint,
                            shadowColor: theme.glow,
                          },
                        ]}
                      />
                    )}
                  </View>
                </SmoothPressable>
              );
            })}
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
    paddingHorizontal: 22,
    zIndex: 100,
  },
  floatingShadowShell: {
    width: '100%',
    maxWidth: 410,
    borderRadius: 999,
    shadowOffset: { width: 0, height: 14 },
    shadowRadius: 28,
    elevation: 20,
  },
  capsuleClip: {
    width: '100%',
    height: TAB_BAR_HEIGHT,
    borderRadius: 999,
    borderWidth: 1.2,
    overflow: 'hidden',
    justifyContent: 'center',
  },
  topRimHighlight: {
    position: 'absolute',
    top: 0,
    left: 28,
    right: 28,
    height: 1,
  },
  tabsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: '100%',
    paddingHorizontal: 7,
    paddingVertical: 6,
  },
  tabTouch: {
    flex: 1,
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabContent: {
    width: '94%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'transparent',
    paddingVertical: 3,
  },
  activeTabContent: {
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 4,
  },
  iconWrap: {
    height: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    fontSize: 10.5,
    marginTop: 1,
    letterSpacing: 0.25,
  },
  activeDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    marginTop: 2,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.9,
    shadowRadius: 4,
  },
});

