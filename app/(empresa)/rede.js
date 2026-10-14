import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import PostsFeedList from '../../components/PostsFeedList';
import { theme } from '../../lib/theme';
import HeaderDecor from '../../components/HeaderDecor';

export default function RedeEmpresa() {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <HeaderDecor />
        <Text style={styles.title}>Rede Social</Text>
        <Text style={styles.subtitle}>Acompanhe o impacto de ONGs e voluntários</Text>
      </View>
      <PostsFeedList podePublicar={false} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.surface },
  header: { paddingHorizontal: 20, paddingTop: 56, paddingBottom: 28, backgroundColor: theme.colors.primary, borderBottomLeftRadius: 28, borderBottomRightRadius: 28, overflow: 'hidden' },
  title: { fontSize: 24, fontFamily: theme.fonts.heading, color: '#FFFFFF' },
  subtitle: { fontSize: 13, fontFamily: theme.fonts.body, color: 'rgba(255,255,255,0.8)', marginTop: 2 },
});