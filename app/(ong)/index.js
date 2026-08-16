import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, RefreshControl, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { supabase } from '../../supabase';
import { useAuth } from '../../contexts/AuthContext';
import { theme } from '../../lib/theme';

export default function PainelOng() {
  const { fullName, session } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [vagasAtivas, setVagasAtivas] = useState(0);
  const [pendentes, setPendentes] = useState(0);

  const carregar = useCallback(async () => {
    const { count: countVagas } = await supabase
      .from('vagas')
      .select('id', { count: 'exact', head: true })
      .eq('ong_id', session.user.id)
      .eq('ativa', true);

    const { count: countPendentes } = await supabase
      .from('candidaturas')
      .select('id, vagas!inner(ong_id)', { count: 'exact', head: true })
      .eq('vagas.ong_id', session.user.id)
      .eq('status', 'pendente');

    setVagasAtivas(countVagas || 0);
    setPendentes(countPendentes || 0);
  }, [session]);

  useEffect(() => {
    setLoading(true);
    carregar().finally(() => setLoading(false));
  }, [carregar]);

  async function onRefresh() {
    setRefreshing(true);
    await carregar();
    setRefreshing(false);
  }

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Painel de Gestão</Text>
        <Text style={styles.subtitle}>{fullName}</Text>
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        <View style={styles.statsRow}>
          <TouchableOpacity style={styles.statBox} onPress={() => router.push('/criar-vaga')}>
            <View style={styles.iconWrapper}>
              <Feather name="briefcase" size={24} color={theme.colors.secondary} />
            </View>
            <Text style={[styles.statNum, { color: theme.colors.secondary }]}>{vagasAtivas}</Text>
            <Text style={styles.statLabel}>Vagas Ativas</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.statBox} onPress={() => router.push('/candidaturas')}>
            <View style={[styles.iconWrapper, { backgroundColor: theme.colors.warningLight }]}>
              <Feather name="clock" size={24} color={theme.colors.warning} />
            </View>
            <Text style={[styles.statNum, { color: theme.colors.warning }]}>{pendentes}</Text>
            <Text style={styles.statLabel}>Candidaturas Pendentes</Text>
          </TouchableOpacity>
        </View>

        {/* Atalhos que antes viviam na barra de baixo — tirados de lá pra
            não deixar a navegação apertada, mas continuam a um toque. */}
        <View style={styles.shortcutsRow}>
          <TouchableOpacity style={styles.shortcutBtn} onPress={() => router.push('/criar-vaga')}>
            <Feather name="plus-circle" size={18} color={theme.colors.primary} />
            <Text style={styles.shortcutText}>Nova vaga</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.shortcutBtn} onPress={() => router.push('/candidaturas')}>
            <Feather name="check-square" size={18} color={theme.colors.primary} />
            <Text style={styles.shortcutText}>Candidaturas</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.surface },
  header: { paddingHorizontal: 20, paddingTop: 50, paddingBottom: 20, backgroundColor: theme.colors.background, borderBottomWidth: 1, borderBottomColor: theme.colors.border },
  title: { fontSize: 24, fontFamily: theme.fonts.heading, color: theme.colors.text },
  subtitle: { fontSize: 13, fontFamily: theme.fonts.body, color: theme.colors.textLight, marginTop: 2 },

  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  content: { padding: 20 },

  statsRow: { flexDirection: 'row', gap: 16 },
  statBox: { flex: 1, backgroundColor: theme.colors.background, padding: 20, borderRadius: 24, alignItems: 'center', ...theme.shadows.card },
  iconWrapper: { backgroundColor: theme.colors.successLight, width: 48, height: 48, borderRadius: 24, justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
  statNum: { fontSize: 32, fontFamily: theme.fonts.heading, lineHeight: 36 },
  statLabel: { color: theme.colors.textLight, fontFamily: theme.fonts.button, fontSize: 12, textAlign: 'center', marginTop: 4 },

  shortcutsRow: { flexDirection: 'row', gap: 12, marginTop: 16 },
  shortcutBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: theme.colors.background, borderRadius: 16, paddingVertical: 14, borderWidth: 1, borderColor: theme.colors.border },
  shortcutText: { fontFamily: theme.fonts.button, fontSize: 13, color: theme.colors.text },
});
