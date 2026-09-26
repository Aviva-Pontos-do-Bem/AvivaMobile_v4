import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { supabase } from '../../supabase';
import { useAuth } from '../../contexts/AuthContext';
import { theme } from '../../lib/theme';

export default function PainelEmpresa() {
  const { fullName, session } = useAuth();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [ongsApoiadas, setOngsApoiadas] = useState(0);
  const [vagasApoiadas, setVagasApoiadas] = useState(0);
  const [funcionarios, setFuncionarios] = useState(0);
  const [horasVoluntariado, setHorasVoluntariado] = useState(0);
  const [acoesConcluidas, setAcoesConcluidas] = useState(0);

  const carregar = useCallback(async () => {
    const { data: patrocinios } = await supabase
      .from('patrocinios')
      .select('ong_id')
      .eq('empresa_id', session.user.id);

    const idsOngs = (patrocinios || []).map((p) => p.ong_id);
    setOngsApoiadas(idsOngs.length);

    if (idsOngs.length > 0) {
      const { count: countVagas } = await supabase
        .from('vagas')
        .select('id', { count: 'exact', head: true })
        .in('ong_id', idsOngs)
        .eq('ativa', true);
      setVagasApoiadas(countVagas || 0);
    } else {
      setVagasApoiadas(0);
    }

    const { data: funcionariosData } = await supabase
      .from('profiles')
      .select('id')
      .eq('empresa_id', session.user.id);

    const idsFuncionarios = (funcionariosData || []).map((f) => f.id);
    setFuncionarios(idsFuncionarios.length);

    if (idsFuncionarios.length > 0) {
      const { data: candidaturasData } = await supabase
        .from('candidaturas')
        .select('status, vagas ( horas_estimadas )')
        .in('voluntario_id', idsFuncionarios)
        .eq('status', 'concluido');

      const lista = candidaturasData || [];
      setAcoesConcluidas(lista.length);
      setHorasVoluntariado(lista.reduce((soma, c) => soma + (c.vagas?.horas_estimadas || 0), 0));
    } else {
      setAcoesConcluidas(0);
      setHorasVoluntariado(0);
    }
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
        <Text style={styles.title}>Painel Corporativo ESG</Text>
        <Text style={styles.subtitle}>{fullName}</Text>
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        <Text style={styles.sectionLabel}>Impacto Social Gerado</Text>

        <View style={styles.impactCard}>
          <View style={styles.iconBg}>
            <Feather name="clock" size={28} color={theme.colors.secondary} />
          </View>
          <Text style={styles.impactValue}>{horasVoluntariado}h</Text>
          <Text style={styles.impactSub}>
            {funcionarios > 0
              ? `Horas de voluntariado dos ${funcionarios} funcionário(s) vinculado(s)`
              : 'Nenhum funcionário vinculado ainda — peça para eles informarem sua empresa no perfil'}
          </Text>
        </View>

        <View style={styles.statsRow}>
          <TouchableOpacity style={styles.statBox} onPress={() => router.push('/buscar')}>
            <Text style={styles.statNum}>{ongsApoiadas}</Text>
            <Text style={styles.statLabel}>ONGs Apoiadas</Text>
          </TouchableOpacity>
          <View style={styles.statBox}>
            <Text style={styles.statNum}>{vagasApoiadas}</Text>
            <Text style={styles.statLabel}>Vagas dessas ONGs</Text>
          </View>
        </View>

        <View style={styles.statsRow}>
          <View style={styles.statBox}>
            <Text style={styles.statNum}>{funcionarios}</Text>
            <Text style={styles.statLabel}>Funcionários no app</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statNum}>{acoesConcluidas}</Text>
            <Text style={styles.statLabel}>Ações concluídas</Text>
          </View>
        </View>

        <TouchableOpacity style={styles.actionButton} onPress={() => router.push('/buscar')}>
          <Feather name="search" size={18} color={theme.colors.background} />
          <Text style={styles.buttonText}>Buscar ONGs para Apoiar</Text>
        </TouchableOpacity>

        <View style={styles.comingSoonCard}>
          <Feather name="file-text" size={24} color={theme.colors.textLight} />
          <View style={styles.comingSoonTextWrap}>
            <Text style={styles.comingSoonTitle}>Relatórios ESG</Text>
            <Text style={styles.comingSoonText}>Em breve você poderá exportar dashboards de impacto corporativo.</Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.surface },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: theme.colors.surface },
  header: { paddingHorizontal: 20, paddingTop: 50, paddingBottom: 20, backgroundColor: theme.colors.background, borderBottomWidth: 1, borderBottomColor: theme.colors.border },
  title: { fontSize: 24, fontFamily: theme.fonts.heading, color: theme.colors.text },
  subtitle: { fontSize: 13, fontFamily: theme.fonts.body, color: theme.colors.textLight, marginTop: 2 },
  
  content: { padding: 20 },
  sectionLabel: { fontSize: 14, fontFamily: theme.fonts.heading, color: theme.colors.text, marginBottom: 12 },
  
  impactCard: { backgroundColor: theme.colors.background, padding: 24, borderRadius: 24, alignItems: 'center', marginBottom: 16, ...theme.shadows.card },
  iconBg: { width: 56, height: 56, borderRadius: 28, backgroundColor: theme.colors.successLight, justifyContent: 'center', alignItems: 'center', marginBottom: 16 },
  impactValue: { fontSize: 36, fontFamily: theme.fonts.heading, color: theme.colors.secondary, lineHeight: 42 },
  impactSub: { color: theme.colors.textLight, fontFamily: theme.fonts.body, fontSize: 13, marginTop: 4, textAlign: 'center' },
  
  statsRow: { flexDirection: 'row', gap: 16, marginBottom: 24 },
  statBox: { flex: 1, backgroundColor: theme.colors.background, padding: 20, borderRadius: 20, alignItems: 'center', ...theme.shadows.card },
  statNum: { fontSize: 24, fontFamily: theme.fonts.heading, color: theme.colors.primary },
  statLabel: { color: theme.colors.textLight, fontFamily: theme.fonts.body, fontSize: 12, marginTop: 4 },

  actionButton: { flexDirection: 'row', gap: 10, padding: 16, borderRadius: 16, backgroundColor: theme.colors.primary, alignItems: 'center', justifyContent: 'center', marginBottom: 20 },
  buttonText: { color: theme.colors.background, fontFamily: theme.fonts.button, fontSize: 15 },
  
  comingSoonCard: { flexDirection: 'row', alignItems: 'center', padding: 16, backgroundColor: theme.colors.background, borderRadius: 16, borderWidth: 1, borderColor: theme.colors.border, borderStyle: 'dashed' },
  comingSoonTextWrap: { flex: 1, marginLeft: 16 },
  comingSoonTitle: { fontFamily: theme.fonts.button, fontSize: 14, color: theme.colors.text, marginBottom: 2 },
  comingSoonText: { fontFamily: theme.fonts.body, fontSize: 12, color: theme.colors.textLight, lineHeight: 18 }
});