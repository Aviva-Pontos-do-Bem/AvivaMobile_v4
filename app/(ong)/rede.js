import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import PostsFeedList from '../../components/PostsFeedList';
import { theme } from '../../lib/theme';

export default function RedeOng() {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Rede Social</Text>
        <Text style={styles.subtitle}>Conecte-se com voluntários e outras ONGs</Text>
      </View>
      <PostsFeedList podePublicar />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.surface },
  header: { paddingHorizontal: 20, paddingTop: 50, paddingBottom: 16, backgroundColor: theme.colors.background, borderBottomWidth: 1, borderBottomColor: theme.colors.border },
  title: { fontSize: 24, fontFamily: theme.fonts.heading, color: theme.colors.text },
  subtitle: { fontSize: 13, fontFamily: theme.fonts.body, color: theme.colors.textLight, marginTop: 2 },
});