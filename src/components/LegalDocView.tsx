import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import type { LegalDoc } from '@/legal/content';
import { useSettings } from '@/settings/SettingsContext';
import { FONTS, useTheme } from '@/theme';

/** Renders a legal document (Privacy Policy or Terms & Conditions) with a modern card-based layout. */
export function LegalDocView({ doc }: { doc: LegalDoc }) {
  const theme = useTheme();
  const { settings } = useSettings();
  const isDark = settings.theme === 'dark';

  const isPrivacy = doc.title.toLowerCase().includes('privacy');

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: theme.background }}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      {/* Hero Summary Card */}
      <View
        style={[
          styles.heroCard,
          {
            backgroundColor: theme.card,
            borderColor: `${theme.tint}45`,
          },
        ]}
      >
        <View style={styles.heroTopRow}>
          <View
            style={[
              styles.heroIconBox,
              {
                backgroundColor: `${theme.tint}1E`,
                borderColor: `${theme.tint}45`,
              },
            ]}
          >
            <Ionicons
              name={isPrivacy ? 'shield-checkmark' : 'document-text'}
              size={22}
              color={theme.tint}
            />
          </View>
          <View style={styles.heroTitleCol}>
            <Text style={[styles.heroTitle, { color: theme.text }]}>{doc.title}</Text>
            <View style={styles.effectivePill}>
              <Ionicons name="time-outline" size={12} color={theme.tint} />
              <Text style={[styles.effectiveText, { color: theme.tint }]}>
                Effective {doc.effective}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.badgesRow}>
          <View
            style={[
              styles.trustBadge,
              { backgroundColor: theme.cardSecondary, borderColor: theme.border },
            ]}
          >
            <Ionicons name="lock-closed" size={12} color="#34D399" />
            <Text style={[styles.trustBadgeText, { color: theme.text }]}>
              100% Local SQLite
            </Text>
          </View>
          <View
            style={[
              styles.trustBadge,
              { backgroundColor: theme.cardSecondary, borderColor: theme.border },
            ]}
          >
            <Ionicons name="eye-off" size={12} color={theme.tint} />
            <Text style={[styles.trustBadgeText, { color: theme.text }]}>
              Zero Ads & Tracking
            </Text>
          </View>
        </View>
      </View>

      {/* Sections List */}
      {doc.sections.map((section, idx) => (
        <View
          key={section.heading}
          style={[
            styles.sectionCard,
            {
              backgroundColor: theme.card,
              borderColor: isDark ? 'rgba(255,255,255,0.08)' : theme.border,
            },
          ]}
        >
          <View style={styles.sectionHeaderRow}>
            <View
              style={[
                styles.sectionNumberBadge,
                {
                  backgroundColor: `${theme.tint}1E`,
                  borderColor: `${theme.tint}45`,
                },
              ]}
            >
              <Text style={[styles.sectionNumberText, { color: theme.tint }]}>
                {String(idx + 1).padStart(2, '0')}
              </Text>
            </View>
            <Text style={[styles.sectionHeading, { color: theme.text }]}>
              {section.heading}
            </Text>
          </View>

          {section.body.map((paragraph, i) => (
            <Text
              key={i}
              style={[
                styles.paragraph,
                {
                  color: theme.textSecondary,
                  marginBottom: i === section.body.length - 1 ? 0 : 8,
                },
              ]}
            >
              {paragraph}
            </Text>
          ))}
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: 16,
    paddingBottom: 48,
    gap: 12,
  },
  heroCard: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 16,
    marginBottom: 4,
  },
  heroTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  heroIconBox: {
    width: 46,
    height: 46,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroTitleCol: {
    flex: 1,
    gap: 4,
  },
  heroTitle: {
    fontFamily: FONTS.bold,
    fontSize: 20,
    fontWeight: '800',
  },
  effectivePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  effectiveText: {
    fontFamily: FONTS.semiBold,
    fontSize: 12,
    fontWeight: '700',
  },
  badgesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  trustBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 9,
    borderWidth: 1,
  },
  trustBadgeText: {
    fontFamily: FONTS.semiBold,
    fontSize: 11.5,
    fontWeight: '700',
  },
  sectionCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 14,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 8,
  },
  sectionNumberBadge: {
    paddingHorizontal: 7,
    paddingVertical: 2.5,
    borderRadius: 7,
    borderWidth: 1,
  },
  sectionNumberText: {
    fontFamily: FONTS.bold,
    fontSize: 11,
    fontWeight: '800',
  },
  sectionHeading: {
    fontFamily: FONTS.bold,
    fontSize: 15.5,
    fontWeight: '800',
    flex: 1,
  },
  paragraph: {
    fontFamily: FONTS.regular,
    fontSize: 13.5,
    lineHeight: 20,
  },
});
