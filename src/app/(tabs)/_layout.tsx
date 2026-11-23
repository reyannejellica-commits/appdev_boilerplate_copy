import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import React from 'react';
import { View, type ColorValue } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { FloatingTabBar, TAB_BAR_GAP, TAB_BAR_HEIGHT } from '@/components/FloatingTabBar';
import { useTranslation } from '@/i18n';
import { useTheme } from '@/theme';

type IconName = React.ComponentProps<typeof Ionicons>['name'];

function tabIcon(filled: IconName, outline: IconName) {
  function TabIcon({ color, focused, size }: { color: ColorValue; focused: boolean; size: number }) {
    return <Ionicons name={focused ? filled : outline} size={size} color={color} />;
  }
  return TabIcon;
}

export default function TabLayout() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();

  return (
    <View style={{ flex: 1 }}>
      <Tabs
        tabBar={(props) => <FloatingTabBar {...props} />}
        screenOptions={{
          headerShown: false,
          sceneStyle: {
            backgroundColor: theme.background,
            paddingTop: insets.top,
            paddingBottom: insets.bottom + TAB_BAR_HEIGHT + TAB_BAR_GAP + 12,
          },
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: t('tabHome'),
            tabBarIcon: tabIcon('home', 'home-outline'),
          }}
        />
        <Tabs.Screen
          name="program"
          options={{
            title: t('tabProgram'),
            tabBarIcon: tabIcon('clipboard', 'clipboard-outline'),
          }}
        />
        <Tabs.Screen
          name="cardio"
          options={{
            title: t('tabCardio'),
            tabBarIcon: tabIcon('walk', 'walk-outline'),
          }}
        />
        <Tabs.Screen
          name="stats"
          options={{
            title: t('tabStats'),
            tabBarIcon: tabIcon('trending-up', 'trending-up-outline'),
          }}
        />
        <Tabs.Screen
          name="chat"
          options={{
            href: null,
            title: t('tabCoach'),
            sceneStyle: {
              backgroundColor: theme.background,
              paddingTop: insets.top,
              paddingBottom: 0,
            },
          }}
        />
      </Tabs>
    </View>
  );
}
