import React from 'react';
import { StyleSheet, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';

interface AppleSquircleIconProps {
  tint?: string;
  size?: number;
}

/**
 * Modern, minimalist Apple-style squircle icon for PeakFit.
 * Combines an ascending mountain peak (apex summit) with a balanced athletic barbell.
 */
export function AppleSquircleIcon({
  tint = '#FFA620',
  size = 104,
}: AppleSquircleIconProps) {
  const innerSize = Math.round(size * 0.55);
  const cornerRadius = Math.round(size * 0.28);

  return (
    <View
      style={[
        styles.squircle,
        {
          width: size,
          height: size,
          borderRadius: cornerRadius,
        },
      ]}
    >
      <Svg width={innerSize} height={innerSize} viewBox="0 0 42 42" fill="none">
        {/* Dynamic Mountain Peak Chevron (Summit) */}
        <Path
          d="M 10 27 L 21 11.5 L 32 27"
          stroke="#FFFFFF"
          strokeWidth="3.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {/* Barbell Center Bar */}
        <Path
          d="M 7.5 20 L 34.5 20"
          stroke="#FFFFFF"
          strokeWidth="2.8"
          strokeLinecap="round"
        />
        {/* Signature Accent Weight Plates */}
        <Path
          d="M 7 15 L 7 25"
          stroke={tint}
          strokeWidth="3.4"
          strokeLinecap="round"
        />
        <Path
          d="M 35 15 L 35 25"
          stroke={tint}
          strokeWidth="3.4"
          strokeLinecap="round"
        />
        {/* Inner Collar Precision Highlights */}
        <Path
          d="M 11.5 17.5 L 11.5 22.5"
          stroke="#FFFFFF"
          strokeWidth="2"
          strokeLinecap="round"
          strokeOpacity="0.65"
        />
        <Path
          d="M 30.5 17.5 L 30.5 22.5"
          stroke="#FFFFFF"
          strokeWidth="2"
          strokeLinecap="round"
          strokeOpacity="0.65"
        />
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  squircle: {
    backgroundColor: '#121217',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 8,
  },
});

