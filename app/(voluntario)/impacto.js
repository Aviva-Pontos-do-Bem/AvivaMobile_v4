import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, ScrollView } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { supabase } from '../../supabase';
import { useAuth } from '../../contexts/AuthContext';
import { theme } from '../../lib/theme';
import HeaderDecor from '../../components/HeaderDecor';

const PONTOS_ACEITO = 50;
const PONTOS_CONCLUIDO = 100;

const SELOS = [
  { min: 1, nome: 'Primeira Ação', icone: 'flag', cor: '#F47C65' },
  { min: 5, nome: 'Voluntário Frequente', icone: 'star', cor: '#E0A100' },
  { min: 10, nome: 'Referência', icone: 'award', cor: '#2E9E73' },
];

function Indicador({ icone, cor, fundo, valor, rotulo }) {
  return (
    <View style={styles.indicador} accessible accessibilityLabel={`${rotulo}: ${valor}`}>
      <View style={[styles.indicadorIcone, { backgroundColor: fundo }]}>
        <Feather name={icone} size={18} color={cor} />
      </View>
      <Text style={styles.indicadorNum}>{valor}</Text>
      <Text style={styles.indicadorRotulo}>{rotulo}</Text>
    </View>
  );
}

export default function MeuImpacto() {
  const { session } = useAuth();
  const [loading, setLoading] = useState(true);
  const [aceitas, setAceitas] = useState(0);
  const [concluidas, setConcluidas] = useState(0);
  const [horas, setHoras] = useState(0);

  useEffect(() => {
    async function carregar() {
      const { data } = await supabase
        .from('candidaturas')
        .select('status, vagas ( horas_estimadas )')
        .eq('voluntario_id', session.user.id)
        .in('status', ['aceito', 'concluido']);

      const lista = data || [];
      setAceitas(lista.filter((c) => c.status === 'aceito').length);
      const feitas = lista.filter((c) => c.status === 'concluido');
      setConcluidas(feitas.length);
      setHoras(feitas.reduce((soma, c) => soma + (c.vagas?.horas_estimadas || 0), 0));
      setLoading(false);
    }
    carregar();
  }, [session]);

  const totalAcoes = aceitas + concluidas;
  const pontos = aceitas * PONTOS_ACEITO + concluidas * PONTOS_CONCLUIDO;
  const proximoSelo = SELOS.find((s) => totalAcoes < s.min);
  const anterior = [...SELOS].reverse().find((s) => totalAcoes >= s.min);
  const base = anterior ? anterior.min : 0;
  const progresso = proximoSelo ? Math.min(1, (totalAcoes - base) / (proximoSelo.min - base)) : 1;
  const faltam = proximoSelo ? proximoSelo.min - totalAcoes : 0;

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
        <HeaderDecor />
        <Text style={styles.title}>Meu Impacto</Text>
        <Text style={styles.subtitle}>O resultado da sua dedicação</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.pointsCard} accessible accessibilityLabel={`${pontos} pontos do bem`}>
          <HeaderDecor />
          <View style={styles.pointsIcone}>
            <Feather name="star" size={26} color={theme.colors.sun} />
          </View>
          <Text style={styles.pointsValue}>{pontos}</Text>
          <Text style={styles.pointsLabel}>PONTOS DO BEM</Text>

          <View style={styles.progressoArea}>
            <View style={styles.progressoTrack}>
              <View style={[styles.progressoFill, { width: `${Math.round(progresso * 100)}%` }]} />
            </View>
            <Text style={styles.progressoTexto}>
              {proximoSelo
                ? `Faltam ${faltam} ${faltam === 1 ? 'ação' : 'ações'} para "${proximoSelo.nome}"`
                : 'Você conquistou todos os selos!'}
            </Text>
          </View>
        </View>

        <View style={styles.indicadoresRow}>
          <Indicador icone="check-square" cor={theme.colors.primary} fundo="#E3EAF3" valor={totalAcoes} rotulo="Ações" />
          <Indicador icone="award" cor="#C98F00" fundo="#FFF3D1" valor={concluidas} rotulo="Concluídas" />
          <Indicador icone="clock" cor="#2E9E73" fundo="#E3F6EE" valor={`${horas}h`} rotulo="Horas" />
        </View>

        <Text style={styles.sectionLabel}>Selos</Text>
        <View style={styles.selosGrid}>
          {SELOS.map((s) => {
            const conquistado = totalAcoes >= s.min;
            return (
              <View
                key={s.nome}
                style={styles.selo}
                accessible
                accessibilityLabel={`${s.nome}, ${conquistado ? 'conquistado' : `bloqueado, exige ${s.min} ações`}`}
              >
                <View style={[styles.seloCirculo, conquistado ? { backgroundColor: s.cor } : styles.seloBloqueado]}>
                  <Feather name={conquistado ? s.icone : 'lock'} size={26} color={conquistado ? '#FFFFFF' : theme.colors.textLight} />
                </View>
                <Text style={[styles.seloNome, !conquistado && { color: theme.colors.textLight }]} numberOfLines={2}>{s.nome}</Text>
                <Text style={styles.seloReq}>{conquistado ? 'Conquistado' : `${s.min} ${s.min === 1 ? 'ação' : 'ações'}`}</Text>
              </View>
            );
          })}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.surface },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { paddingHorizontal: 20, paddingTop: 56, paddingBottom: 28, backgroundColor: theme.colors.primary, borderBottomLeftRadius: 28, borderBottomRightRadius: 28, overflow: 'hidden' },
  title: { fontSize: 24, fontFamily: theme.fonts.heading, color: '#FFFFFF' },
  subtitle: { fontSize: 13, fontFamily: theme.fonts.body, color: 'rgba(255,255,255,0.8)', marginTop: 2 },

  content: { padding: 16, paddingBottom: 30 },
  pointsCard: { backgroundColor: theme.colors.primary, borderRadius: 28, alignItems: 'center', paddingTop: 26, paddingBottom: 24, paddingHorizontal: 20, marginBottom: 16, overflow: 'hidden', ...theme.shadows.card, shadowOpacity: 0.16, shadowRadius: 14 },
  pointsIcone: { width: 52, height: 52, borderRadius: 26, backgroundColor: 'rgba(255,255,255,0.12)', justifyContent: 'center', alignItems: 'center', marginBottom: 8 },
  pointsValue: { fontSize: 52, lineHeight: 58, fontFamily: theme.fonts.heading, color: '#FFFFFF', letterSpacing: -1 },
  pointsLabel: { color: theme.colors.sun, fontFamily: theme.fonts.button, fontSize: 12, letterSpacing: 1.5 },
  progressoArea: { alignSelf: 'stretch', marginTop: 18 },
  progressoTrack: { height: 8, borderRadius: 4, backgroundColor: 'rgba(255,255,255,0.18)', overflow: 'hidden' },
  progressoFill: { height: 8, borderRadius: 4, backgroundColor: theme.colors.sun },
  progressoTexto: { color: 'rgba(255,255,255,0.85)', fontFamily: theme.fonts.body, fontSize: 12.5, textAlign: 'center', marginTop: 8 },

  indicadoresRow: { flexDirection: 'row', gap: 12, marginBottom: 24 },
  indicador: { flex: 1, backgroundColor: theme.colors.background, borderRadius: 20, alignItems: 'center', paddingVertical: 16, ...theme.shadows.card },
  indicadorIcone: { width: 36, height: 36, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginBottom: 8 },
  indicadorNum: { fontSize: 22, lineHeight: 28, fontFamily: theme.fonts.heading, color: theme.colors.primary },
  indicadorRotulo: { color: theme.colors.textLight, fontFamily: theme.fonts.button, fontSize: 11.5, marginTop: 2 },

  sectionLabel: { fontSize: 16, fontFamily: theme.fonts.heading, color: theme.colors.text, marginBottom: 14, marginLeft: 4 },
  selosGrid: { flexDirection: 'row', gap: 12 },
  selo: { flex: 1, alignItems: 'center', backgroundColor: theme.colors.background, borderRadius: 20, paddingVertical: 18, paddingHorizontal: 8, ...theme.shadows.card },
  seloCirculo: { width: 64, height: 64, borderRadius: 32, justifyContent: 'center', alignItems: 'center', marginBottom: 10 },
  seloBloqueado: { backgroundColor: theme.colors.surface, borderWidth: 2, borderColor: theme.colors.border, borderStyle: 'dashed' },
  seloNome: { fontFamily: theme.fonts.headingSemi, fontSize: 12.5, lineHeight: 17, color: theme.colors.text, textAlign: 'center' },
  seloReq: { fontFamily: theme.fonts.body, fontSize: 11, color: theme.colors.textLight, marginTop: 2, textAlign: 'center' },
});
