import React from 'react';
import { View, StyleSheet } from 'react-native';
import { theme } from '../lib/theme';

// Decoração do cabeçalho azul-marinho: círculos em tons mais claros do azul
// da marca e três pontos sólidos nas cores do logo (as "cabeças" das pessoas
// do símbolo). Vai como PRIMEIRO filho do cabeçalho, que precisa de
// overflow: 'hidden'; o conteúdo vem por cima.
export default function HeaderDecor() {
  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill} accessible={false} importantForAccessibility="no-hide-descendants">
      <View style={[styles.forma, { width: 190, height: 190, top: -90, right: -50, backgroundColor: '#27456F' }]} />
      <View style={[styles.forma, { width: 110, height: 110, bottom: -60, left: -30, backgroundColor: '#2B4D7A' }]} />
      <View style={[styles.forma, { width: 16, height: 16, top: 22, right: 96, backgroundColor: theme.colors.sun }]} />
      <View style={[styles.forma, { width: 11, height: 11, top: 52, right: 30, backgroundColor: theme.colors.coral }]} />
      <View style={[styles.forma, { width: 13, height: 13, top: 14, right: 152, backgroundColor: theme.colors.mint }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  forma: { position: 'absolute', borderRadius: 999 },
});
