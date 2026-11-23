import type { Tabs } from 'expo-router';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { SmoothPressable } from '@/components/SmoothPressable';
import { useSettings } from '@/settings/SettingsContext';
import { useTheme } from '@/theme';

type TabBarProps = Parameters<NonNullable<React.ComponentProps<typeof Tabs>['tabBar']>>[0];

export const TAB_BAR_HEIGHT = 72;
export const TAB_BAR_GAP = 12;

/**
 * Ultra-Modern Floating Island Tab Bar
 * Features:
 * - Floating glassmorphism pill with subtle border
 * - Active glowing amber capsule pill background
 * - Balanced icon + label hierarchy with tactile micro-interactions
 * - Smooth insets adaptation for all device screens
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

  return (
    <View
      pointerEvents="box-none"
      style={[
        styles.wrapper,
        {
          bottom: Math.max(insets.bottom, 12),
        },
      ]}
    >
      <View
        style={[
          styles.container,
          {
            backgroundColor: isDark ? theme.card : '#FFFFFFFA',
            borderColor: theme.borderRose,
            shadowColor: theme.glow,
            shadowOffset: { width: 0, height: 0 },
            shadowOpacity: isDark ? 0.7 : 0.4,
            shadowRadius: 16,
            elevation: 10,
          },
        ]}
      >
        {visibleRoutes.map((route) => {
          const focused = state.routes[state.index]?.key === route.key;
          const { title } = descriptors[route.key]?.options ?? {};
          const tabColor = theme.tint;
          const tabGlow = theme.glow;
          const inactiveColor = isDark ? '#64748B' : '#94A3B8';

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
                      backgroundColor: `${tabColor}26`,
                      borderColor: tabColor,
                      shadowColor: tabGlow,
                      shadowOffset: { width: 0, height: 0 },
                      shadowOpacity: 0.7,
                      shadowRadius: 10,
                      elevation: 6,
                    },
                  ],
                ]}
              >
                <View style={styles.iconWrap}>
                  {icon(route, focused, 23, focused ? tabColor : inactiveColor)}
                </View>
                <Text
                  numberOfLines={1}
                  style={[
                    styles.label,
                    {
                      color: focused ? tabColor : inactiveColor,
                      fontWeight: focused ? '900' : '700',
                    },
                  ]}
                >
                  {title ?? route.name}
                </Text>
              </View>
            </SmoothPressable>
          );
        })}
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
    paddingHorizontal: 12,
  },
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    maxWidth: 500,
    height: TAB_BAR_HEIGHT,
    paddingHorizontal: 6,
    paddingVertical: 6,
    borderRadius: 24,
    borderWidth: 1,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
    elevation: 12,
  },
  tabTouch: {
    flex: 1,
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabContent: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'transparent',
    paddingVertical: 4,
  },
  activeTabContent: {},
  iconWrap: {
    height: 25,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    fontSize: 12,
    marginTop: 2,
    letterSpacing: 0.4,
  },
});
