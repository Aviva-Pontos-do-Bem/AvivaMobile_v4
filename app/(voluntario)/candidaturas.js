import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { StyleSheet, View, Text, FlatList, ScrollView, ActivityIndicator, RefreshControl, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { supabase } from '../../supabase';
import { useAuth } from '../../contexts/AuthContext';
import { theme } from '../../lib/theme';
import { formatarTempoRelativo } from '../../lib/format';
import { estiloCategoria } from '../../lib/categorias';
import Avatar from '../../components/Avatar';
import HeaderDecor from '../../components/HeaderDecor';

const STATUS_CONFIG = {
  pendente: { texto: 'Em análise', cor: theme.colors.warning, fundo: theme.colors.warningLight, icone: 'clock' },
  aceito: { texto: 'Aceito', cor: theme.colors.success, fundo: theme.colors.successLight, icone: 'check-circle' },
  recusado: { texto: 'Recusado', cor: theme.colors.error, fundo: theme.colors.errorLight, icone: 'x-circle' },
  concluido: { texto: 'Concluído', cor: '#8A6100', fundo: '#FFF3D1', icone: 'award' },
};

const FILTROS = [
  { key: 'todas', rotulo: 'Todas' },
  { key: 'pendente', rotulo: 'Em análise' },
  { key: 'aceito', rotulo: 'Aceitas' },
  { key: 'concluido', rotulo: 'Concluídas' },
];

export default function MinhasCandidaturas() {
  const { session } = useAuth();
  const router = useRouter();
  const [lista, setLista] = useState([]);
  const [filtro, setFiltro] = useState('todas');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const carregar = useCallback(async () => {
    const { data } = await supabase
      .from('candidaturas')
      .select('id, status, created_at, vaga_id, vagas ( titulo, categoria, horas_estimadas, profiles ( full_name, foto_url ) )')
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

  const contagens = useMemo(() => {
    const c = { todas: lista.length, pendente: 0, aceito: 0, concluido: 0 };
    lista.forEach((i) => { if (c[i.status] != null) c[i.status] += 1; });
    return c;
  }, [lista]);

  const visiveis = useMemo(() => (filtro === 'todas' ? lista : lista.filter((i) => i.status === filtro)), [lista, filtro]);

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  function renderItem({ item }) {
    const status = STATUS_CONFIG[item.status] || STATUS_CONFIG.pendente;
    const cat = estiloCategoria(item.vagas?.categoria);
    const ong = item.vagas?.profiles;
    const horas = item.vagas?.horas_estimadas;
    return (
      <TouchableOpacity
        accessibilityRole="button"
        accessibilityLabel={`${item.vagas?.titulo}, ${status.texto}`}
        activeOpacity={0.85}
        style={styles.card}
        onPress={() => item.vaga_id && router.push(`/vaga/${item.vaga_id}`)}
      >
        <View style={styles.cardTopo}>
          <View style={[styles.catIcone, { backgroundColor: cat.fundo }]}>
            <Feather name={cat.icone} size={22} color={cat.cor} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.cardTitle} numberOfLines={2}>{item.vagas?.titulo}</Text>
            <View style={styles.ongLinha}>
              <Avatar nome={ong?.full_name} fotoUrl={ong?.foto_url} size={18} />
              <Text style={styles.ongName} numberOfLines={1}>{ong?.full_name}</Text>
            </View>
          </View>
        </View>

        <View style={styles.cardRodape}>
          <View style={[styles.statusBadge, { backgroundColor: status.fundo }]}>
            <Feather name={status.icone} size={13} color={status.cor} />
            <Text style={[styles.statusText, { color: status.cor }]}>{status.texto}</Text>
          </View>
          <View style={styles.metas}>
            {!!horas && (
              <View style={styles.meta}>
                <Feather name="clock" size={12} color={theme.colors.textLight} />
                <Text style={styles.metaTexto}>{horas}h</Text>
              </View>
            )}
            <Text style={styles.metaTexto}>{formatarTempoRelativo(item.created_at)}</Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <HeaderDecor />
        <Text style={styles.title}>Minhas Candidaturas</Text>
        <Text style={styles.subtitle}>Acompanhe o status das suas ações</Text>
      </View>

      {lista.length === 0 ? (
        <View style={styles.emptyContainer}>
          <View style={styles.emptyIconBg}>
            <Feather name="inbox" size={32} color={theme.colors.primary} />
          </View>
          <Text style={styles.emptyTitulo}>Nada por aqui ainda</Text>
          <Text style={styles.emptyText}>Quando você se candidatar a uma vaga, ela aparece aqui para você acompanhar.</Text>
        </View>
      ) : (
        <FlatList
          data={visiveis}
          keyExtractor={(item) => item.id}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filtrosScroll} contentContainerStyle={styles.filtros}>
              {FILTROS.map((f) => {
                const ativo = filtro === f.key;
                return (
                  <TouchableOpacity
                    key={f.key}
                    accessibilityRole="button"
                    accessibilityState={{ selected: ativo }}
                    style={[styles.filtro, ativo && styles.filtroAtivo]}
                    onPress={() => setFiltro(f.key)}
                  >
                    <Text style={[styles.filtroTexto, ativo && styles.filtroTextoAtivo]}>{f.rotulo}</Text>
                    <View style={[styles.filtroContagem, ativo && styles.filtroContagemAtiva]}>
                      <Text style={[styles.filtroContagemTexto, ativo && { color: theme.colors.primary }]}>{contagens[f.key]}</Text>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          }
          ListEmptyComponent={<Text style={styles.semResultado}>Nenhuma candidatura nesta categoria.</Text>}
          renderItem={renderItem}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.surface },
  header: { paddingHorizontal: 20, paddingTop: 56, paddingBottom: 28, backgroundColor: theme.colors.primary, borderBottomLeftRadius: 28, borderBottomRightRadius: 28, overflow: 'hidden' },
  title: { fontSize: 24, fontFamily: theme.fonts.heading, color: '#FFFFFF' },
  subtitle: { fontSize: 13, fontFamily: theme.fonts.body, color: 'rgba(255,255,255,0.8)', marginTop: 2 },

  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 36 },
  emptyIconBg: { backgroundColor: theme.colors.pill, padding: 22, borderRadius: 100, marginBottom: 16 },
  emptyTitulo: { ...theme.type.h2, color: theme.colors.text, marginBottom: 6 },
  emptyText: { color: theme.colors.textLight, fontFamily: theme.fonts.body, textAlign: 'center', fontSize: 14, lineHeight: 21 },

  listContainer: { padding: 16, paddingBottom: 24 },
  filtrosScroll: { flexGrow: 0, marginBottom: 16, marginHorizontal: -16 },
  filtros: { flexDirection: 'row', gap: 8, paddingHorizontal: 16 },
  filtro: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 8, paddingLeft: 14, paddingRight: 8, borderRadius: 100, backgroundColor: theme.colors.background, borderWidth: 1, borderColor: theme.colors.border },
  filtroAtivo: { backgroundColor: theme.colors.primary, borderColor: theme.colors.primary },
  filtroTexto: { fontFamily: theme.fonts.button, fontSize: 12.5, color: theme.colors.textLight },
  filtroTextoAtivo: { color: '#FFFFFF' },
  filtroContagem: { minWidth: 22, height: 22, borderRadius: 11, paddingHorizontal: 6, backgroundColor: theme.colors.surface, justifyContent: 'center', alignItems: 'center' },
  filtroContagemAtiva: { backgroundColor: '#FFFFFF' },
  filtroContagemTexto: { fontFamily: theme.fonts.button, fontSize: 11.5, color: theme.colors.textLight },
  semResultado: { textAlign: 'center', color: theme.colors.textLight, fontFamily: theme.fonts.body, fontSize: 13.5, marginTop: 30 },

  card: { backgroundColor: theme.colors.background, borderRadius: 22, padding: 16, marginBottom: 14, ...theme.shadows.card, shadowOpacity: 0.08, shadowRadius: 12 },
  cardTopo: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  catIcone: { width: 48, height: 48, borderRadius: 16, justifyContent: 'center', alignItems: 'center' },
  cardTitle: { fontSize: 15.5, lineHeight: 21, fontFamily: theme.fonts.heading, color: theme.colors.text },
  ongLinha: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 },
  ongName: { flex: 1, color: theme.colors.textLight, fontFamily: theme.fonts.body, fontSize: 12.5 },
  cardRodape: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 14, paddingTop: 14, borderTopWidth: 1, borderTopColor: theme.colors.border },
  metas: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  meta: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  metaTexto: { color: theme.colors.textLight, fontFamily: theme.fonts.button, fontSize: 12 },

  statusBadge: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingVertical: 6, paddingHorizontal: 12, borderRadius: 100 },
  statusText: { fontSize: 12, fontFamily: theme.fonts.button },
});
