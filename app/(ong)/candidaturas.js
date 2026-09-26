import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, RefreshControl, Linking } from 'react-native';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { supabase } from '../../supabase';
import { useAuth } from '../../contexts/AuthContext';
import Avatar from '../../components/Avatar';
import { formatarTempoRelativo } from '../../lib/format';
import { theme } from '../../lib/theme';

const FILTROS = [
  { key: 'pendente', label: 'Pendentes' },
  { key: 'aceito', label: 'Aceitos' },
  { key: 'concluido', label: 'Concluídos' },
  { key: 'recusado', label: 'Recusados' },
  { key: 'todos', label: 'Todos' },
];

export default function GerenciarCandidaturas() {
  const { session } = useAuth();
  const router = useRouter();
  const [lista, setLista] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [atualizandoId, setAtualizandoId] = useState(null);
  const [filtro, setFiltro] = useState('pendente');

  const carregar = useCallback(async () => {
    const { data } = await supabase
      .from('candidaturas')
      .select('id, status, mensagem, telefone_contato, created_at, vagas!inner ( titulo, ong_id ), profiles ( id, full_name, foto_url )')
      .eq('vagas.ong_id', session.user.id)
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

  async function atualizarStatus(id, novoStatus) {
    setAtualizandoId(id);
    await supabase.from('candidaturas').update({ status: novoStatus }).eq('id', id);
    await carregar();
    setAtualizandoId(null);
  }

  const listaFiltrada = useMemo(() => {
    if (filtro === 'todos') return lista;
    return lista.filter((item) => item.status === filtro);
  }, [lista, filtro]);

  const contagens = useMemo(() => {
    const c = { pendente: 0, aceito: 0, concluido: 0, recusado: 0 };
    lista.forEach((item) => { if (c[item.status] != null) c[item.status] += 1; });
    return c;
  }, [lista]);

  if (loading) return <View style={styles.centered}><ActivityIndicator size="large" color={theme.colors.primary} /></View>;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Candidaturas recebidas</Text>
        <Text style={styles.subtitle}>Gerencie os voluntários interessados</Text>
      </View>

      <View style={styles.filterContainer}>
        <View style={styles.filterRow}>
          {FILTROS.map((f) => (
            <TouchableOpacity key={f.key} style={[styles.filterChip, filtro === f.key && styles.filterChipActive]} onPress={() => setFiltro(f.key)}>
              <Text style={[styles.filterChipText, filtro === f.key && styles.filterChipTextActive]}>
                {f.label}{f.key !== 'todos' && contagens[f.key] != null ? ` (${contagens[f.key]})` : ''}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {listaFiltrada.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Feather name="inbox" size={40} color={theme.colors.border} style={{marginBottom: 12}} />
          <Text style={styles.emptyText}>Nenhuma candidatura nesse filtro.</Text>
        </View>
      ) : (
        <FlatList
          data={listaFiltrada}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContainer}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => (
            <View style={styles.card}>
              <TouchableOpacity style={styles.cardTop} onPress={() => item.profiles?.id && router.push(`/perfil-publico/${item.profiles.id}`)}>
                <Avatar nome={item.profiles?.full_name} fotoUrl={item.profiles?.foto_url} size={42} />
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <Text style={styles.candidateName}>{item.profiles?.full_name}</Text>
                  <Text style={styles.vagaTitulo} numberOfLines={1}>para "{item.vagas?.titulo}"</Text>
                </View>
                <Text style={styles.timeAgo}>{formatarTempoRelativo(item.created_at)}</Text>
              </TouchableOpacity>

              {!!item.mensagem && (
                <View style={styles.messageBox}>
                  <Feather name="message-circle" size={14} color={theme.colors.textLight} style={{ marginTop: 2 }} />
                  <Text style={styles.messageText}>"{item.mensagem}"</Text>
                </View>
              )}

              {!!item.telefone_contato && (
                <TouchableOpacity style={styles.phoneRow} onPress={() => Linking.openURL(`tel:${item.telefone_contato}`)}>
                  <View style={styles.iconBg}><Feather name="phone" size={12} color={theme.colors.primary} /></View>
                  <Text style={styles.phoneText}>{item.telefone_contato}</Text>
                </TouchableOpacity>
              )}

              {item.status === 'pendente' ? (
                <View style={styles.actionsRow}>
                  <TouchableOpacity style={styles.acceptBtn} disabled={atualizandoId === item.id} onPress={() => atualizarStatus(item.id, 'aceito')}>
                    <Feather name="check" size={16} color={theme.colors.background} />
                    <Text style={styles.acceptText}>Aprovar</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.rejectBtn} disabled={atualizandoId === item.id} onPress={() => atualizarStatus(item.id, 'recusado')}>
                    <Feather name="x" size={16} color={theme.colors.error} />
                    <Text style={styles.rejectText}>Recusar</Text>
                  </TouchableOpacity>
                </View>
              ) : item.status === 'aceito' ? (
                <View style={{ gap: 10 }}>
                  <View style={[styles.statusBadge, styles.statusAceito]}>
                    <Text style={[styles.statusText, styles.statusTextAceito]}>Voluntário Aprovado ✓</Text>
                  </View>
                  <TouchableOpacity style={styles.completeBtn} disabled={atualizandoId === item.id} onPress={() => atualizarStatus(item.id, 'concluido')}>
                    {atualizandoId === item.id ? (
                      <ActivityIndicator size="small" color={theme.colors.background} />
                    ) : (
                      <>
                        <Feather name="award" size={16} color={theme.colors.background} />
                        <Text style={styles.completeText}>Marcar ação como concluída</Text>
                      </>
                    )}
                  </TouchableOpacity>
                </View>
              ) : item.status === 'concluido' ? (
                <View style={[styles.statusBadge, styles.statusConcluido]}>
                  <Feather name="award" size={14} color={theme.colors.primary} />
                  <Text style={[styles.statusText, styles.statusTextConcluido]}>Ação Concluída</Text>
                </View>
              ) : (
                <View style={[styles.statusBadge, styles.statusRecusado]}>
                  <Text style={[styles.statusText, styles.statusTextRecusado]}>Candidatura Recusada</Text>
                </View>
              )}
            </View>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.surface },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { paddingHorizontal: 20, paddingTop: 50, paddingBottom: 16, backgroundColor: theme.colors.background },
  title: { fontSize: 24, fontFamily: theme.fonts.heading, color: theme.colors.text },
  subtitle: { fontSize: 13, fontFamily: theme.fonts.body, color: theme.colors.textLight, marginTop: 2 },
  
  filterContainer: { backgroundColor: theme.colors.background, paddingHorizontal: 16, paddingBottom: 16, borderBottomWidth: 1, borderBottomColor: theme.colors.border },
  filterRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  filterChip: { paddingVertical: 8, paddingHorizontal: 16, borderRadius: 100, backgroundColor: theme.colors.surface, borderWidth: 1, borderColor: theme.colors.border },
  filterChipActive: { backgroundColor: theme.colors.primary, borderColor: theme.colors.primary },
  filterChipText: { fontSize: 12, color: theme.colors.textLight, fontFamily: theme.fonts.button },
  filterChipTextActive: { color: theme.colors.background },

  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 30 },
  emptyText: { color: theme.colors.textLight, fontFamily: theme.fonts.body, textAlign: 'center' },

  listContainer: { padding: 16, paddingBottom: 24 },
  card: { backgroundColor: theme.colors.background, borderRadius: 20, padding: 16, marginBottom: 16, ...theme.shadows.card },
  cardTop: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  candidateName: { fontFamily: theme.fonts.heading, fontSize: 15, color: theme.colors.text },
  vagaTitulo: { color: theme.colors.textLight, fontFamily: theme.fonts.body, fontSize: 12, marginTop: 2 },
  timeAgo: { fontSize: 11, fontFamily: theme.fonts.body, color: theme.colors.textLight },

  messageBox: { flexDirection: 'row', gap: 10, backgroundColor: theme.colors.surface, borderRadius: 12, padding: 12, marginBottom: 12 },
  messageText: { flex: 1, fontSize: 13, fontFamily: theme.fonts.body, color: theme.colors.text, lineHeight: 18, fontStyle: 'italic' },

  phoneRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 16 },
  iconBg: { width: 24, height: 24, borderRadius: 12, backgroundColor: theme.colors.surface, justifyContent: 'center', alignItems: 'center' },
  phoneText: { color: theme.colors.primary, fontSize: 13, fontFamily: theme.fonts.button },

  actionsRow: { flexDirection: 'row', gap: 12 },
  acceptBtn: { flex: 1, flexDirection: 'row', gap: 8, backgroundColor: theme.colors.success, paddingVertical: 12, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  acceptText: { color: theme.colors.background, fontFamily: theme.fonts.button, fontSize: 13.5 },
  rejectBtn: { flex: 1, flexDirection: 'row', gap: 8, backgroundColor: theme.colors.background, borderWidth: 1.5, borderColor: theme.colors.error, paddingVertical: 12, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  rejectText: { color: theme.colors.error, fontFamily: theme.fonts.button, fontSize: 13.5 },

  statusBadge: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 8, paddingHorizontal: 16, borderRadius: 12, marginTop: 4 },
  statusAceito: { backgroundColor: theme.colors.successLight },
  statusRecusado: { backgroundColor: theme.colors.errorLight },
  statusConcluido: { backgroundColor: theme.colors.surface, borderWidth: 1, borderColor: theme.colors.border },
  statusText: { fontSize: 13, fontFamily: theme.fonts.button },
  statusTextAceito: { color: theme.colors.success },
  statusTextRecusado: { color: theme.colors.error },
  statusTextConcluido: { color: theme.colors.primary },

  completeBtn: { flexDirection: 'row', gap: 8, backgroundColor: theme.colors.primary, paddingVertical: 12, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  completeText: { color: theme.colors.background, fontFamily: theme.fonts.button, fontSize: 13.5 },
});