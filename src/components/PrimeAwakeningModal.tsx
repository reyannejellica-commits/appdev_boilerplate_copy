import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import {
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SmoothPressable } from '@/components/SmoothPressable';
import { updateHunterName } from '@/db/hunter';
import { WORKOUT_PROGRAMS } from '@/db/programs';
import { useTranslation } from '@/i18n';
import { useSettings } from '@/settings/SettingsContext';
import { playAlertSound } from '@/utils/alertSounds';
import { showMessage } from '@/utils/confirm';
import { AVATAR_OPTIONS, getAvatarById } from '@/utils/profileOptions';
import { useTheme } from '@/theme';

interface PrimeAwakeningModalProps {
  visible: boolean;
  onClose: () => void;
  onSave?: (newName: string, newProgramId: string) => void;
}

export function PrimeAwakeningModal({
  visible,
  onClose,
  onSave,
}: PrimeAwakeningModalProps) {
  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <PrimeAwakeningContent onClose={onClose} onSave={onSave} />
    </Modal>
  );
}

function PrimeAwakeningContent({
  onClose,
  onSave,
}: {
  onClose: () => void;
  onSave?: (newName: string, newProgramId: string) => void;
}) {
  const theme = useTheme();
  const { settings, update } = useSettings();
  const { t } = useTranslation();

  const [codename, setCodename] = useState(settings.nickname || 'John Mark Dalumpienes');
  const [selectedProgramId, setSelectedProgramId] = useState(
    settings.activeProgramId || 'ppl-arnold'
  );
  const [selectedAvatarId, setSelectedAvatarId] = useState(settings.avatarId || 'bunny_boy');
  const [showAvatarPicker, setShowAvatarPicker] = useState(false);

  const currentAvatar = getAvatarById(selectedAvatarId);

  const handleStartPrime = async () => {
    const finalName = codename.trim() || 'Hunter';
    playAlertSound('chime');

    try {
      await updateHunterName(finalName);
      await update('nickname', finalName);
      await update('activeProgramId', selectedProgramId);
      await update('avatarId', selectedAvatarId);

      onSave?.(finalName, selectedProgramId);
      onClose();

      showMessage(
        'PRIME AWAKENING COMPLETE!',
        `Welcome, Monarch ${finalName}. Your active protocol is set to "${
          WORKOUT_PROGRAMS.find((p) => p.id === selectedProgramId)?.title || selectedProgramId
        }". Arise!`
      );
    } catch (e) {
      console.warn('Failed to save Prime Awakening:', e);
      onClose();
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={styles.modalBackdrop}
    >
      <View
        style={[
          styles.cardContainer,
          {
            backgroundColor: theme.card,
            borderColor: theme.tint,
            shadowColor: theme.glow,
          },
        ]}
      >
        {/* Close button */}
        <SmoothPressable
          onPress={onClose}
          style={styles.closeBtn}
          accessibilityLabel="Close"
          hitSlop={10}
        >
          <Ionicons name="close" size={20} color="#94A3B8" />
        </SmoothPressable>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.cardContent}
        >
          {/* Header info */}
          <View style={styles.headerSection}>
            <Text style={[styles.notificationTag, { color: theme.tint }]}>
              {t('systemNotification')}
            </Text>
            <Text style={styles.mainTitle}>{t('primeAwakening')}</Text>
            <Text style={styles.subtitle}>
              {t('awakeningDesc')}
            </Text>
          </View>

          {/* Avatar with Camera Badge */}
          <View style={styles.avatarWrapper}>
            <SmoothPressable
              onPress={() => setShowAvatarPicker(!showAvatarPicker)}
              style={styles.avatarTouch}
              accessibilityLabel="Change Avatar"
            >
              <View
                style={[
                  styles.avatarCircle,
                  { borderColor: theme.tint, shadowColor: theme.glow },
                ]}
              >
                <Image
                  source={currentAvatar.image}
                  style={styles.avatarImg}
                  resizeMode="cover"
                />
              </View>
              <View
                style={[
                  styles.cameraBadge,
                  { backgroundColor: theme.tint, shadowColor: theme.glow, borderColor: theme.card },
                ]}
              >
                <Ionicons name="camera" size={13} color="#FFFFFF" />
              </View>
            </SmoothPressable>
          </View>

          {/* Avatar Selector Dropdown / Grid */}
          {showAvatarPicker && (
            <View
              style={[
                styles.avatarPickerBox,
                {
                  backgroundColor: theme.cardSecondary,
                  borderColor: `${theme.tint}50`,
                },
              ]}
            >
              <Text style={[styles.pickerTitle, { color: theme.tint }]}>
                {t('chooseAvatar')}
              </Text>
              <View style={styles.avatarGrid}>
                {AVATAR_OPTIONS.map((av) => (
                  <SmoothPressable
                    key={av.id}
                    onPress={() => {
                      setSelectedAvatarId(av.id);
                      setShowAvatarPicker(false);
                    }}
                    style={[
                      styles.avatarOptionItem,
                      selectedAvatarId === av.id && [
                        styles.avatarOptionSelected,
                        { borderColor: theme.tint },
                      ],
                    ]}
                  >
                    <Image source={av.image} style={styles.avatarOptionImg} />
                  </SmoothPressable>
                ))}
              </View>
            </View>
          )}

          {/* Codename Field */}
          <View style={styles.fieldSection}>
            <Text style={styles.fieldLabel}>{t('codename')}</Text>
            <TextInput
              value={codename}
              onChangeText={setCodename}
              placeholder="Enter Hunter Codename"
              placeholderTextColor="#64748B"
              style={[
                styles.inputBox,
                {
                  backgroundColor: theme.cardSecondary,
                  borderColor: theme.border,
                  color: theme.text,
                },
              ]}
              maxLength={30}
            />
          </View>

          {/* Select Program Section */}
          <View style={styles.fieldSection}>
            <Text style={styles.fieldLabel}>{t('selectProgram')}</Text>
            <View style={styles.programGrid}>
              {WORKOUT_PROGRAMS.map((prog) => {
                const isSelected = selectedProgramId === prog.id;
                return (
                  <SmoothPressable
                    key={prog.id}
                    onPress={() => setSelectedProgramId(prog.id)}
                    style={[
                      styles.programPill,
                      {
                        backgroundColor: theme.cardSecondary,
                        borderColor: theme.border,
                      },
                      isSelected && [
                        styles.programPillSelected,
                        {
                          backgroundColor: theme.tint,
                          borderColor: theme.tint,
                          shadowColor: theme.glow,
                        },
                      ],
                    ]}
                  >
                    <Text
                      style={[
                        styles.programPillText,
                        { color: isSelected ? '#FFFFFF' : theme.textSecondary },
                        isSelected && styles.programPillTextSelected,
                      ]}
                      numberOfLines={1}
                    >
                      {prog.title.replace(' (PPL)', '').replace(' (3-Day)', '')}
                    </Text>
                  </SmoothPressable>
                );
              })}
            </View>
          </View>

          {/* Action Button: START YOUR PRIME */}
          <SmoothPressable
            onPress={handleStartPrime}
            style={[
              styles.startPrimeBtn,
              {
                backgroundColor: theme.tint,
                shadowColor: theme.glow,
              },
            ]}
          >
            <Text style={styles.startPrimeBtnText}>{t('startYourPrime')}</Text>
          </SmoothPressable>
        </ScrollView>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(5, 3, 12, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  cardContainer: {
    width: '100%',
    maxWidth: 420,
    maxHeight: '92%',
    borderRadius: 26,
    borderWidth: 1.5,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 24,
    elevation: 16,
    overflow: 'hidden',
    position: 'relative',
  },
  closeBtn: {
    position: 'absolute',
    top: 14,
    right: 14,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  cardContent: {
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 24,
    gap: 16,
  },
  headerSection: {
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
  },
  notificationTag: {
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.8,
    fontFamily: 'monospace',
  },
  mainTitle: {
    color: '#FFFFFF',
    fontSize: 23,
    fontWeight: '900',
    letterSpacing: 0.5,
    marginTop: 2,
  },
  subtitle: {
    color: '#94A3B8',
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 18,
    marginTop: 2,
  },
  avatarWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 4,
  },
  avatarTouch: {
    position: 'relative',
  },
  avatarCircle: {
    width: 82,
    height: 82,
    borderRadius: 41,
    borderWidth: 3,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.95,
    shadowRadius: 14,
    elevation: 8,
    backgroundColor: '#1A1429',
    overflow: 'hidden',
  },
  avatarImg: {
    width: '100%',
    height: '100%',
  },
  cameraBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 26,
    height: 26,
    borderRadius: 13,
    borderWidth: 2,
    borderColor: '#120F1F',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarPickerBox: {
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
  },
  pickerTitle: {
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 8,
  },
  avatarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    justifyContent: 'center',
  },
  avatarOptionItem: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1.5,
    borderColor: 'transparent',
    overflow: 'hidden',
  },
  avatarOptionSelected: {
    borderWidth: 2.5,
  },
  avatarOptionImg: {
    width: '100%',
    height: '100%',
  },
  fieldSection: {
    gap: 8,
  },
  fieldLabel: {
    color: '#94A3B8',
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  inputBox: {
    borderRadius: 14,
    borderWidth: 1.2,
    fontSize: 16,
    fontWeight: '800',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  programGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  programPill: {
    width: '48%',
    borderRadius: 14,
    borderWidth: 1.2,
    paddingVertical: 12,
    paddingHorizontal: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  programPillSelected: {
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 10,
    elevation: 6,
  },
  programPillText: {
    color: '#94A3B8',
    fontSize: 12.5,
    fontWeight: '700',
    textAlign: 'center',
  },
  programPillTextSelected: {
    color: '#FFFFFF',
    fontWeight: '900',
  },
  startPrimeBtn: {
    borderRadius: 20,
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.65,
    shadowRadius: 14,
    elevation: 8,
  },
  startPrimeBtnText: {
    color: '#FFFFFF',
    fontSize: 15.5,
    fontWeight: '900',
    letterSpacing: 0.8,
  },
});
