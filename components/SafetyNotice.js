import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { theme } from '../lib/theme';

export default function SafetyNotice({ text }) {
  return (
    <View style={styles.box}>
      <Feather name="shield" size={18} color={theme.colors.warning} style={{ marginTop: 2 }} />
      <Text style={styles.text}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  box: {
    flexDirection: 'row',
    gap: 12,
    backgroundColor: theme.colors.warningLight,
    borderRadius: 16,
    padding: 16,
  },
  text: { flex: 1, fontFamily: theme.fonts.body, fontSize: 13, color: theme.colors.text, lineHeight: 20 },
});