import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator, RefreshControl, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { supabase } from '../../supabase';
import { useAuth } from '../../contexts/AuthContext';
import { theme } from '../../lib/theme';
import { gerarHtmlRelatorioEsg } from '../../lib/relatorioEsg';

const avisar = (titulo, mensagem) => {
  if (Platform.OS === 'web') alert(`${titulo}: ${mensagem}`);
  else {
    const { Alert } = require('react-native');
    Alert.alert(titulo, mensagem);
  }
};

export default function PainelEmpresa() {
  const { fullName, session } = useAuth();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [exportando, setExportando] = useState(false);
  const [ongsApoiadas, setOngsApoiadas] = useState(0);
  const [nomesOngs, setNomesOngs] = useState([]);
  const [vagasApoiadas, setVagasApoiadas] = useState(0);
  const [funcionarios, setFuncionarios] = useState(0);
  const [horasVoluntariado, setHorasVoluntariado] = useState(0);
  const [acoesConcluidas, setAcoesConcluidas] = useState(0);
  const [regimeTributario, setRegimeTributario] = useState(null);
  const [lucroOperacional, setLucroOperacional] = useState(null);
  const [totalDoado, setTotalDoado] = useState(0);
  const [doacoesDoAno, setDoacoesDoAno] = useState([]);

  const anoAtual = new Date().getFullYear();
  const tetoDedutivel = lucroOperacional != null ? lucroOperacional * 0.02 : null;
  const percentualUsado = tetoDedutivel ? Math.min(100, Math.round((totalDoado / tetoDedutivel) * 100)) : 0;

  const carregar = useCallback(async () => {
    const { data: patrocinios } = await supabase
      .from('patrocinios')
      .select('ong_id, profiles ( full_name )')
      .eq('empresa_id', session.user.id);

    const idsOngs = (patrocinios || []).map((p) => p.ong_id);
    setOngsApoiadas(idsOngs.length);
    setNomesOngs((patrocinios || []).map((p) => p.profiles?.full_name).filter(Boolean));

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

    const { data: perfilFiscal } = await supabase
      .from('profiles')
      .select('regime_tributario')
      .eq('id', session.user.id)
      .maybeSingle();
    setRegimeTributario(perfilFiscal?.regime_tributario || null);

    const { data: parametroAno } = await supabase
      .from('parametros_fiscais_empresa')
      .select('lucro_operacional')
      .eq('empresa_id', session.user.id)
      .eq('ano', anoAtual)
      .maybeSingle();
    setLucroOperacional(parametroAno?.lucro_operacional != null ? Number(parametroAno.lucro_operacional) : null);

    const inicioAno = `${anoAtual}-01-01`;
    const fimAno = `${anoAtual}-12-31`;
    const { data: doacoesData } = await supabase
      .from('doacoes')
      .select('valor, data_doacao, profiles:ong_id ( full_name )')
      .eq('empresa_id', session.user.id)
      .gte('data_doacao', inicioAno)
      .lte('data_doacao', fimAno)
      .order('data_doacao', { ascending: false });

    const lista = doacoesData || [];
    setDoacoesDoAno(lista);
    setTotalDoado(lista.reduce((soma, d) => soma + Number(d.valor || 0), 0));
  }, [session, anoAtual]);

  useEffect(() => {
    setLoading(true);
    carregar().finally(() => setLoading(false));
  }, [carregar]);

  async function onRefresh() {
    setRefreshing(true);
    await carregar();
    setRefreshing(false);
  }

  async function exportarRelatorio() {
    setExportando(true);
    try {
      const html = gerarHtmlRelatorioEsg({
        nomeEmpresa: fullName,
        ongsApoiadas,
        nomesOngs,
        vagasApoiadas,
        funcionarios,
        acoesConcluidas,
        horasVoluntariado,
        regimeTributario,
        totalDoado,
        tetoDedutivel,
        doacoes: doacoesDoAno,
      });

      if (Platform.OS === 'web') {
        // No navegador não existe "salvar arquivo" nativo — o próprio diálogo
        // de impressão do navegador já tem a opção "Salvar como PDF".
        await Print.printAsync({ html });
        return;
      }

      const { uri } = await Print.printToFileAsync({ html });
      const podeCompartilhar = await Sharing.isAvailableAsync();
      if (podeCompartilhar) {
        await Sharing.shareAsync(uri, { mimeType: 'application/pdf', UTI: 'com.adobe.pdf' });
      } else {
        avisar('Relatório gerado', `Arquivo salvo em: ${uri}`);
      }
    } catch (err) {
      avisar('Erro ao gerar relatório', err.message || 'Tente novamente.');
    } finally {
      setExportando(false);
    }
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

        {regimeTributario === 'lucro_real' ? (
          <View style={styles.dedutivelCard}>
            <Text style={styles.dedutivelTitle}>Doações dedutíveis em {anoAtual}</Text>
            <View style={styles.dedutivelValoresRow}>
              <Text style={styles.dedutivelValorDoado}>{totalDoado.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</Text>
              <Text style={styles.dedutivelTeto}>
                de {tetoDedutivel != null ? tetoDedutivel.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) : '—'} disponíveis
              </Text>
            </View>
            {tetoDedutivel != null ? (
              <View style={styles.progressoTrack}>
                <View style={[styles.progressoFill, { width: `${percentualUsado}%` }]} />
              </View>
            ) : (
              <Text style={styles.dedutivelHint}>Informe o lucro operacional estimado do ano em Editar Perfil pra calcular seu teto de 2%.</Text>
            )}
          </View>
        ) : (
          <View style={styles.dedutivelCardAlerta}>
            <Feather name="alert-circle" size={18} color={theme.colors.warning} />
            <Text style={styles.dedutivelAlertaText}>
              {regimeTributario ? 'Seu regime não tem benefício fiscal por doação — só o Lucro Real deduz do IR.' : 'Informe o regime tributário da empresa em Editar Perfil para acompanhar doações dedutíveis.'}
            </Text>
          </View>
        )}

        <TouchableOpacity style={styles.actionButton} onPress={() => router.push('/buscar')}>
          <Feather name="search" size={18} color={theme.colors.background} />
          <Text style={styles.buttonText}>Buscar ONGs para Apoiar</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.exportCard} onPress={exportarRelatorio} disabled={exportando}>
          {exportando ? (
            <ActivityIndicator color={theme.colors.primary} />
          ) : (
            <Feather name="file-text" size={24} color={theme.colors.primary} />
          )}
          <View style={styles.comingSoonTextWrap}>
            <Text style={styles.comingSoonTitle}>Exportar relatório ESG</Text>
            <Text style={styles.comingSoonText}>
              {exportando ? 'Gerando PDF...' : 'Baixe um PDF com as métricas de impacto acima, prontas para compartilhar.'}
            </Text>
          </View>
          <Feather name="download" size={18} color={theme.colors.primary} />
        </TouchableOpacity>
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
  exportCard: { flexDirection: 'row', alignItems: 'center', gap: 4, padding: 16, backgroundColor: theme.colors.background, borderRadius: 16, borderWidth: 1, borderColor: theme.colors.primary, ...theme.shadows.card },

  dedutivelCard: { backgroundColor: theme.colors.background, borderRadius: 20, padding: 20, marginBottom: 16, ...theme.shadows.card },
  dedutivelTitle: { fontFamily: theme.fonts.heading, fontSize: 14, color: theme.colors.text, marginBottom: 10 },
  dedutivelValoresRow: { flexDirection: 'row', alignItems: 'baseline', gap: 6, marginBottom: 10 },
  dedutivelValorDoado: { fontSize: 22, fontFamily: theme.fonts.heading, color: theme.colors.secondary },
  dedutivelTeto: { fontSize: 12, fontFamily: theme.fonts.body, color: theme.colors.textLight },
  progressoTrack: { height: 8, borderRadius: 4, backgroundColor: theme.colors.surface, overflow: 'hidden' },
  progressoFill: { height: '100%', backgroundColor: theme.colors.secondary, borderRadius: 4 },
  dedutivelHint: { fontSize: 11.5, fontFamily: theme.fonts.body, color: theme.colors.textLight, lineHeight: 16 },

  dedutivelCardAlerta: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: theme.colors.warningLight, borderRadius: 16, padding: 16, marginBottom: 16 },
  dedutivelAlertaText: { flex: 1, fontSize: 12, fontFamily: theme.fonts.body, color: theme.colors.text, lineHeight: 17 },
  comingSoonTextWrap: { flex: 1, marginLeft: 16 },
  comingSoonTitle: { fontFamily: theme.fonts.button, fontSize: 14, color: theme.colors.text, marginBottom: 2 },
  comingSoonText: { fontFamily: theme.fonts.body, fontSize: 12, color: theme.colors.textLight, lineHeight: 18 }
});