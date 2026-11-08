import type { Tabs } from 'expo-router';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { SmoothPressable } from '@/components/SmoothPressable';
import { useTheme } from '@/theme';

type TabBarProps = Parameters<NonNullable<React.ComponentProps<typeof Tabs>['tabBar']>>[0];

export const TAB_BAR_HEIGHT = 64;
export const TAB_BAR_GAP = 12;

/**
 * Solo Leveling / PeakFit Dock Tab Bar.
 * Renders all 5 tabs: Quest, Cardio, Program, Stats, and System.
 */
export function FloatingTabBar({ state, descriptors, navigation }: TabBarProps) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();

  const go = (route: (typeof state.routes)[number], focused: boolean) => {
    const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
    if (!focused && !event.defaultPrevented) navigation.navigate(route.name, route.params);
  };

  const icon = (route: (typeof state.routes)[number], focused: boolean, size: number) =>
    descriptors[route.key].options.tabBarIcon?.({
      focused,
      color: focused ? '#FFFFFF' : theme.textSecondary,
      size,
    });

  return (
    <View
      pointerEvents="box-none"
      style={[styles.wrap, { bottom: insets.bottom + TAB_BAR_GAP }]}
    >
      <View
        style={[
          styles.pill,
          {
            backgroundColor: theme.card,
            borderColor: theme.border,
            shadowColor: theme.tint,
          },
        ]}
      >
        {state.routes.map((route) => {
          const focused = state.routes[state.index]?.key === route.key;
          const { title } = descriptors[route.key].options;
          return (
            <SmoothPressable
              key={route.key}
              onPress={() => go(route, focused)}
              accessibilityLabel={title ?? route.name}
              accessibilityRole="tab"
              accessibilityState={{ selected: focused }}
              style={[
                styles.item,
                focused
                  ? {
                      backgroundColor: theme.buttonPrimary,
                      borderRadius: 16,
                    }
                  : undefined,
              ]}
            >
              {icon(route, focused, 22)}
              <Text
                numberOfLines={1}
                style={[
                  styles.label,
                  {
                    color: focused ? '#FFFFFF' : theme.textSecondary,
                    fontWeight: focused ? '800' : '600',
                  },
                ]}
              >
                {title ?? route.name}
              </Text>
            </SmoothPressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute',
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  pill: {
    flex: 1,
    flexDirection: 'row',
    height: TAB_BAR_HEIGHT,
    borderRadius: 22,
    paddingHorizontal: 6,
    borderWidth: 1.5,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.18,
    shadowRadius: 16,
    elevation: 6,
    alignItems: 'center',
  },
  item: {
    flex: 1,
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
  },
  label: {
    fontSize: 10,
    letterSpacing: 0.3,
  },
});
