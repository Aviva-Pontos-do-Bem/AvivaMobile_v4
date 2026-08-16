import React, { useCallback, useEffect, useState } from 'react';
import { StyleSheet, View, Text, FlatList, ActivityIndicator, RefreshControl } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { supabase } from '../../supabase';
import { useAuth } from '../../contexts/AuthContext';
import { theme } from '../../lib/theme';

const STATUS_CONFIG = {
  pendente: { texto: 'Em análise', cor: theme.colors.warning, fundo: theme.colors.warningLight, icone: 'clock' },
  aceito: { texto: 'Aceito', cor: theme.colors.success, fundo: theme.colors.successLight, icone: 'check-circle' },
  recusado: { texto: 'Recusado', cor: theme.colors.error, fundo: theme.colors.errorLight, icone: 'x-circle' },
  concluido: { texto: 'Concluído', cor: theme.colors.primary, fundo: theme.colors.surface, icone: 'award' },
};

export default function MinhasCandidaturas() {
  const { session } = useAuth();
  const [lista, setLista] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const carregar = useCallback(async () => {
    const { data } = await supabase
      .from('candidaturas')
      .select('id, status, created_at, vagas ( titulo, profiles ( full_name ) )')
      .eq('voluntario_id', session.user.id)
      .order('created_at', { ascending: false });
    setLista(data || []);
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
        <Text style={styles.title}>Minhas Candidaturas</Text>
        <Text style={styles.subtitle}>Acompanhe o status das suas ações</Text>
      </View>

      {lista.length === 0 ? (
        <View style={styles.emptyContainer}>
          <View style={styles.emptyIconBg}>
            <Feather name="inbox" size={32} color={theme.colors.textLight} />
          </View>
          <Text style={styles.emptyText}>Você ainda não se candidatou a nenhuma vaga.</Text>
        </View>
      ) : (
        <FlatList
          data={lista}
          keyExtractor={(item) => item.id}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => {
            const status = STATUS_CONFIG[item.status] || STATUS_CONFIG.pendente;
            return (
              <View style={styles.card}>
                <View style={styles.cardHeader}>
                  <Text style={styles.ongName} numberOfLines={1}>
                    <Feather name="briefcase" size={12} color={theme.colors.textLight} /> {item.vagas?.profiles?.full_name}
                  </Text>
                  <View style={[styles.statusBadge, { backgroundColor: status.fundo }]}>
                    <Feather name={status.icone} size={12} color={status.cor} />
                    <Text style={[styles.statusText, { color: status.cor }]}>{status.texto}</Text>
                  </View>
                </View>
                <Text style={styles.cardTitle}>{item.vagas?.titulo}</Text>
              </View>
            );
          }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.surface },
  header: { paddingHorizontal: 20, paddingTop: 50, paddingBottom: 20, backgroundColor: theme.colors.background, borderBottomWidth: 1, borderBottomColor: theme.colors.border },
  title: { fontSize: 24, fontFamily: theme.fonts.heading, color: theme.colors.text },
  subtitle: { fontSize: 13, fontFamily: theme.fonts.body, color: theme.colors.textLight, marginTop: 2 },
  
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 30 },
  emptyIconBg: { backgroundColor: theme.colors.border, padding: 20, borderRadius: 100, marginBottom: 16 },
  emptyText: { color: theme.colors.textLight, fontFamily: theme.fonts.body, textAlign: 'center', fontSize: 14 },
  
  listContainer: { padding: 16, paddingBottom: 24 },
  card: { backgroundColor: theme.colors.background, borderRadius: 16, padding: 16, marginBottom: 16, ...theme.shadows.card },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  ongName: { flex: 1, color: theme.colors.textLight, fontFamily: theme.fonts.button, fontSize: 12, marginRight: 10 },
  cardTitle: { fontSize: 16, fontFamily: theme.fonts.heading, color: theme.colors.text },
  
  statusBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingVertical: 6, paddingHorizontal: 12, borderRadius: 100 },
  statusText: { fontSize: 11.5, fontFamily: theme.fonts.button },
});
