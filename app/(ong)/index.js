import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, RefreshControl, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { supabase } from '../../supabase';
import { useAuth } from '../../contexts/AuthContext';
import { theme } from '../../lib/theme';
import NotificacoesBell from '../../components/NotificacoesBell';
import HeaderDecor from '../../components/HeaderDecor';
import { formatarTempoRelativo } from '../../lib/format';
import { formatarBRL } from '../../lib/doacoes';

export default function PainelOng() {
  const { fullName, session } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [vagasAtivas, setVagasAtivas] = useState(0);
  const [pendentes, setPendentes] = useState(0);
  const [doacoesAConfirmar, setDoacoesAConfirmar] = useState(0);
  const [atividade, setAtividade] = useState([]);

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

    const { count: countDoacoes } = await supabase
      .from('doacoes')
      .select('id', { count: 'exact', head: true })
      .eq('ong_id', session.user.id)
      .eq('status', 'pendente');

    // Atividade recente: últimas candidaturas e doações, misturadas por data.
    const [{ data: ultimasCandidaturas }, { data: ultimasDoacoes }] = await Promise.all([
      supabase
        .from('candidaturas')
        .select('id, status, created_at, profiles ( full_name ), vagas!inner ( titulo, ong_id )')
        .eq('vagas.ong_id', session.user.id)
        .order('created_at', { ascending: false })
        .limit(4),
      supabase
        .from('doacoes')
        .select('id, valor, status, created_at, doador:doador_id ( full_name )')
        .eq('ong_id', session.user.id)
        .order('created_at', { ascending: false })
        .limit(4),
    ]);
    const eventos = [
      ...(ultimasCandidaturas || []).map((c) => ({
        id: `c-${c.id}`, tipo: 'candidatura', quando: c.created_at, pendente: c.status === 'pendente',
        texto: `${c.profiles?.full_name || 'Um voluntário'} se candidatou a "${c.vagas?.titulo}"`,
      })),
      ...(ultimasDoacoes || []).map((d) => ({
        id: `d-${d.id}`, tipo: 'doacao', quando: d.created_at, pendente: d.status === 'pendente',
        texto: `${d.doador?.full_name || 'Alguém'} informou uma doação de ${formatarBRL(d.valor)}`,
      })),
    ].sort((a, b) => new Date(b.quando) - new Date(a.quando)).slice(0, 5);
    setAtividade(eventos);

    setDoacoesAConfirmar(countDoacoes || 0);
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
      <View style={[styles.header, { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }]}>
        <HeaderDecor />
        <View>
          <Text style={styles.title}>Painel de Gestão</Text>
          <Text style={styles.subtitle}>{fullName}</Text>
        </View>
        <NotificacoesBell />
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
          <TouchableOpacity accessibilityRole="button" accessibilityLabel={`Doações, ${doacoesAConfirmar} a confirmar`} style={styles.shortcutBtn} onPress={() => router.push('/doacoes')}>
            <Feather name="heart" size={18} color={theme.colors.primary} />
            <Text style={styles.shortcutText}>Doações{doacoesAConfirmar > 0 ? ` (${doacoesAConfirmar})` : ''}</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.sectionTitle}>Atividade recente</Text>
        {atividade.length === 0 ? (
          <View style={styles.atividadeVazia}>
            <Feather name="activity" size={22} color={theme.colors.textLight} />
            <Text style={styles.atividadeVaziaTexto}>Quando houver candidaturas e doações, elas aparecem aqui.</Text>
          </View>
        ) : (
          atividade.map((e) => (
            <TouchableOpacity
              key={e.id}
              accessibilityRole="button"
              accessibilityLabel={e.texto}
              style={styles.atividadeItem}
              onPress={() => router.push(e.tipo === 'doacao' ? '/doacoes' : '/candidaturas')}
            >
              <View style={[styles.atividadeIcone, { backgroundColor: e.tipo === 'doacao' ? '#FDE8E4' : '#E3F6EE' }]}>
                <Feather name={e.tipo === 'doacao' ? 'heart' : 'user-plus'} size={17} color={e.tipo === 'doacao' ? theme.colors.coral : '#2E9E73'} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.atividadeTexto} numberOfLines={2}>{e.texto}</Text>
                <Text style={styles.atividadeQuando}>{formatarTempoRelativo(e.quando)}</Text>
              </View>
              {e.pendente && <View style={styles.atividadePonto} />}
            </TouchableOpacity>
          ))
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.surface },
  header: { paddingHorizontal: 20, paddingTop: 56, paddingBottom: 28, backgroundColor: theme.colors.primary, borderBottomLeftRadius: 28, borderBottomRightRadius: 28, overflow: 'hidden' },
  title: { fontSize: 24, fontFamily: theme.fonts.heading, color: '#FFFFFF' },
  subtitle: { fontSize: 13, fontFamily: theme.fonts.body, color: 'rgba(255,255,255,0.8)', marginTop: 2 },

  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  content: { padding: 20 },

  statsRow: { flexDirection: 'row', gap: 16 },
  statBox: { flex: 1, backgroundColor: theme.colors.background, padding: 20, borderRadius: 24, alignItems: 'center', ...theme.shadows.card },
  iconWrapper: { backgroundColor: theme.colors.successLight, width: 48, height: 48, borderRadius: 24, justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
  statNum: { fontSize: 32, fontFamily: theme.fonts.heading, lineHeight: 36 },
  statLabel: { color: theme.colors.textLight, fontFamily: theme.fonts.button, fontSize: 12, textAlign: 'center', marginTop: 4 },

  sectionTitle: { ...theme.type.h3, color: theme.colors.text, marginTop: 28, marginBottom: 12 },
  atividadeItem: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: theme.colors.background, borderRadius: 18, padding: 14, marginBottom: 10, ...theme.shadows.card },
  atividadeIcone: { width: 38, height: 38, borderRadius: 13, justifyContent: 'center', alignItems: 'center' },
  atividadeTexto: { fontFamily: theme.fonts.bodyMedium, fontSize: 13.5, lineHeight: 19, color: theme.colors.text },
  atividadeQuando: { fontFamily: theme.fonts.body, fontSize: 11.5, color: theme.colors.textLight, marginTop: 2 },
  atividadePonto: { width: 9, height: 9, borderRadius: 5, backgroundColor: theme.colors.secondary },
  atividadeVazia: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: theme.colors.background, borderRadius: 18, padding: 18, ...theme.shadows.card },
  atividadeVaziaTexto: { flex: 1, fontFamily: theme.fonts.body, fontSize: 13, lineHeight: 19, color: theme.colors.textLight },
  shortcutsRow: { flexDirection: 'row', gap: 12, marginTop: 16 },
  shortcutBtn: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: theme.colors.background, borderRadius: 18, paddingVertical: 16, paddingHorizontal: 4, ...theme.shadows.card },
  shortcutText: { fontFamily: theme.fonts.button, fontSize: 12, color: theme.colors.text, textAlign: 'center' },
});
