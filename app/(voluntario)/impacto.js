import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, ScrollView } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { supabase } from '../../supabase';
import { useAuth } from '../../contexts/AuthContext';
import { theme } from '../../lib/theme';

const PONTOS_ACEITO = 50;
const PONTOS_CONCLUIDO = 100;

const SELOS = [
  { min: 1, nome: 'Primeira Ação', icone: 'flag' },
  { min: 5, nome: 'Voluntário Frequente', icone: 'star' },
  { min: 10, nome: 'Referência', icone: 'award' },
];

export default function MeuImpacto() {
  const { session } = useAuth();
  const [loading, setLoading] = useState(true);
  const [aceitas, setAceitas] = useState(0);
  const [concluidas, setConcluidas] = useState(0);

  useEffect(() => {
    async function carregar() {
      const { data } = await supabase
        .from('candidaturas')
        .select('status')
        .eq('voluntario_id', session.user.id)
        .in('status', ['aceito', 'concluido']);

      const lista = data || [];
      setAceitas(lista.filter((c) => c.status === 'aceito').length);
      setConcluidas(lista.filter((c) => c.status === 'concluido').length);
      setLoading(false);
    }
    carregar();
  }, [session]);

  const totalAcoes = aceitas + concluidas;
  const pontos = aceitas * PONTOS_ACEITO + concluidas * PONTOS_CONCLUIDO;
  const seloAtual = [...SELOS].reverse().find((s) => totalAcoes >= s.min);
  const proximoSelo = SELOS.find((s) => totalAcoes < s.min);

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
        <Text style={styles.title}>Meu Impacto</Text>
        <Text style={styles.subtitle}>O resultado da sua dedicação</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.pointsCard}>
          <Feather name="star" size={32} color={theme.colors.yellow} style={styles.pointsIcon} />
          <Text style={styles.pointsValue}>{pontos}</Text>
          <Text style={styles.pointsLabel}>PONTOS DO BEM</Text>
        </View>

        <View style={styles.statsRow}>
          <View style={styles.statBox}>
            <Text style={styles.statNum}>{totalAcoes}</Text>
            <Text style={styles.statLabel}>Total de Ações</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statNum}>{concluidas}</Text>
            <Text style={styles.statLabel}>Concluídas</Text>
          </View>
        </View>

        <Text style={styles.sectionLabel}>Selos Conquistados</Text>
        {seloAtual ? (
          <View style={styles.badgeCard}>
            <View style={styles.badgeIcon}>
              <Feather name={seloAtual.icone} size={24} color={theme.colors.background} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.badgeName}>{seloAtual.nome}</Text>
              <Text style={styles.badgeDesc}>Conquistado com {totalAcoes} {totalAcoes === 1 ? 'ação' : 'ações'}</Text>
            </View>
            <Feather name="check-circle" size={20} color={theme.colors.success} />
          </View>
        ) : (
          <View style={styles.emptyBadgeCard}>
            <Feather name="shield" size={24} color={theme.colors.textLight} />
            <Text style={styles.emptyText}>Nenhum selo ainda. Candidate-se a uma vaga para começar!</Text>
          </View>
        )}

        {proximoSelo && (
          <View style={styles.nextBadgeCard}>
            <View style={styles.nextBadgeIcon}>
              <Feather name="lock" size={18} color={theme.colors.textLight} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.nextBadgeName}>{proximoSelo.nome}</Text>
              <Text style={styles.nextBadgeDesc}>Faltam {proximoSelo.min - totalAcoes} {proximoSelo.min - totalAcoes === 1 ? 'ação' : 'ações'}</Text>
            </View>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.surface },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { paddingHorizontal: 20, paddingTop: 50, paddingBottom: 20, backgroundColor: theme.colors.background, borderBottomWidth: 1, borderBottomColor: theme.colors.border },
  title: { fontSize: 24, fontFamily: theme.fonts.heading, color: theme.colors.text },
  subtitle: { fontSize: 13, fontFamily: theme.fonts.body, color: theme.colors.textLight, marginTop: 2 },
  
  content: { padding: 16, paddingBottom: 30 },
  pointsCard: { backgroundColor: theme.colors.primary, borderRadius: 24, alignItems: 'center', paddingVertical: 32, marginBottom: 20, ...theme.shadows.card },
  pointsIcon: { marginBottom: 8 },
  pointsValue: { fontSize: 42, fontFamily: theme.fonts.heading, color: theme.colors.background, lineHeight: 48 },
  pointsLabel: { color: theme.colors.yellow, fontFamily: theme.fonts.button, fontSize: 12, letterSpacing: 1 },

  statsRow: { flexDirection: 'row', gap: 16, marginBottom: 30 },
  statBox: { flex: 1, backgroundColor: theme.colors.background, borderRadius: 20, alignItems: 'center', paddingVertical: 20, ...theme.shadows.card },
  statNum: { fontSize: 26, fontFamily: theme.fonts.heading, color: theme.colors.secondary },
  statLabel: { color: theme.colors.textLight, fontFamily: theme.fonts.button, fontSize: 12, marginTop: 4 },

  sectionLabel: { fontSize: 14, fontFamily: theme.fonts.heading, color: theme.colors.text, marginBottom: 12, marginLeft: 4 },
  
  badgeCard: { flexDirection: 'row', alignItems: 'center', gap: 14, backgroundColor: theme.colors.background, borderRadius: 20, padding: 16, marginBottom: 12, ...theme.shadows.card },
  badgeIcon: { width: 52, height: 52, borderRadius: 26, backgroundColor: theme.colors.accent, justifyContent: 'center', alignItems: 'center' },
  badgeName: { fontFamily: theme.fonts.button, fontSize: 16, color: theme.colors.text },
  badgeDesc: { color: theme.colors.textLight, fontFamily: theme.fonts.body, fontSize: 12, marginTop: 2 },
  
  emptyBadgeCard: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: theme.colors.background, borderRadius: 20, padding: 20, marginBottom: 12, borderWidth: 1, borderColor: theme.colors.border, borderStyle: 'dashed' },
  emptyText: { flex: 1, color: theme.colors.textLight, fontFamily: theme.fonts.body, fontSize: 13 },

  nextBadgeCard: { flexDirection: 'row', alignItems: 'center', gap: 14, backgroundColor: theme.colors.background, borderRadius: 20, padding: 16, opacity: 0.6 },
  nextBadgeIcon: { width: 44, height: 44, borderRadius: 22, backgroundColor: theme.colors.border, justifyContent: 'center', alignItems: 'center' },
  nextBadgeName: { fontFamily: theme.fonts.button, fontSize: 15, color: theme.colors.text },
  nextBadgeDesc: { color: theme.colors.textLight, fontFamily: theme.fonts.body, fontSize: 12, marginTop: 2 },
});