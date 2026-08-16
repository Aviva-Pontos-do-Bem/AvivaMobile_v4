import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { supabase } from '../supabase';
import Avatar from './Avatar';
import { theme } from '../lib/theme';

const ABAS = [
  { key: 'ong', label: 'ONGs' },
  { key: 'voluntario', label: 'Voluntários' },
  { key: 'empresa', label: 'Empresas' },
];

const CORES_MEDALHA = ['#E9C46A', '#C0C0C0', '#CD7F32']; // ouro, prata, bronze

// Pontuação de cada aba é calculada em cima do que já existe no banco hoje
// (candidaturas concluídas, conexões feitas) — não é uma métrica oficial do
// produto, é a base para o painel de impacto que o roadmap do projeto prevê
// (ver "Resultados" na documentação: painel de impacto social + integração
// financeira ainda estão nos planos, isso aqui é o começo dele).
async function buscarRankingOngs() {
  const { data: ongs } = await supabase.from('profiles').select('id, full_name, foto_url, verificado').eq('user_type', 'ong').limit(50);
  if (!ongs?.length) return [];

  const { data: vagas } = await supabase.from('vagas').select('id, ong_id').in('ong_id', ongs.map((o) => o.id));
  const vagaParaOng = new Map((vagas || []).map((v) => [v.id, v.ong_id]));
  const vagaIds = (vagas || []).map((v) => v.id);

  let concluidas = [];
  if (vagaIds.length > 0) {
    const { data } = await supabase.from('candidaturas').select('vaga_id').eq('status', 'concluido').in('vaga_id', vagaIds);
    concluidas = data || [];
  }

  const pontosPorOng = new Map();
  concluidas.forEach((c) => {
    const ongId = vagaParaOng.get(c.vaga_id);
    if (ongId) pontosPorOng.set(ongId, (pontosPorOng.get(ongId) || 0) + 100);
  });

  return ongs
    .map((o) => ({ ...o, pontos: pontosPorOng.get(o.id) || 0 }))
    .sort((a, b) => b.pontos - a.pontos)
    .slice(0, 10);
}

async function buscarRankingVoluntarios() {
  const { data: voluntarios } = await supabase.from('profiles').select('id, full_name, foto_url, verificado').eq('user_type', 'voluntario').limit(50);
  if (!voluntarios?.length) return [];

  const { data: candidaturas } = await supabase
    .from('candidaturas')
    .select('voluntario_id, status')
    .in('voluntario_id', voluntarios.map((v) => v.id))
    .in('status', ['aceito', 'concluido']);

  const pontosPorVoluntario = new Map();
  (candidaturas || []).forEach((c) => {
    const soma = c.status === 'concluido' ? 100 : 50;
    pontosPorVoluntario.set(c.voluntario_id, (pontosPorVoluntario.get(c.voluntario_id) || 0) + soma);
  });

  return voluntarios
    .map((v) => ({ ...v, pontos: pontosPorVoluntario.get(v.id) || 0 }))
    .sort((a, b) => b.pontos - a.pontos)
    .slice(0, 10);
}

async function buscarRankingEmpresas() {
  const { data: empresas } = await supabase.from('profiles').select('id, full_name, foto_url, verificado').eq('user_type', 'empresa').limit(50);
  if (!empresas?.length) return [];

  const { data: conexoes } = await supabase.from('seguidores').select('seguidor_id').in('seguidor_id', empresas.map((e) => e.id));

  const pontosPorEmpresa = new Map();
  (conexoes || []).forEach((c) => pontosPorEmpresa.set(c.seguidor_id, (pontosPorEmpresa.get(c.seguidor_id) || 0) + 100));

  return empresas
    .map((e) => ({ ...e, pontos: pontosPorEmpresa.get(e.id) || 0 }))
    .sort((a, b) => b.pontos - a.pontos)
    .slice(0, 10);
}

const BUSCADORES = { ong: buscarRankingOngs, voluntario: buscarRankingVoluntarios, empresa: buscarRankingEmpresas };

export default function RankingImpacto() {
  const router = useRouter();
  const [aba, setAba] = useState('ong');
  const [lista, setLista] = useState([]);
  const [loading, setLoading] = useState(true);

  const carregar = useCallback(async (chave) => {
    setLoading(true);
    const dados = await BUSCADORES[chave]();
    setLista(dados);
    setLoading(false);
  }, []);

  useEffect(() => { carregar(aba); }, [aba, carregar]);

  return (
    <View>
      <View style={styles.tabsRow}>
        {ABAS.map((a) => (
          <TouchableOpacity key={a.key} style={[styles.tab, aba === a.key && styles.tabAtiva]} onPress={() => setAba(a.key)}>
            <Text style={[styles.tabText, aba === a.key && styles.tabTextAtiva]}>{a.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {loading ? (
        <ActivityIndicator color={theme.colors.primary} style={{ marginTop: 20 }} />
      ) : lista.length === 0 ? (
        <Text style={styles.emptyText}>Ainda não há dados suficientes nessa categoria.</Text>
      ) : (
        lista.map((item, i) => (
          <TouchableOpacity key={item.id} style={styles.row} onPress={() => router.push(`/perfil-publico/${item.id}`)}>
            <View style={styles.posicaoWrap}>
              {i < 3 ? (
                <Feather name="award" size={18} color={CORES_MEDALHA[i]} />
              ) : (
                <Text style={styles.posicaoNum}>{i + 1}</Text>
              )}
            </View>
            <Avatar nome={item.full_name} fotoUrl={item.foto_url} size={36} verificado={item.verificado} />
            <Text style={styles.rowName} numberOfLines={1}>{item.full_name}</Text>
            <Text style={styles.rowPontos}>{item.pontos} pts</Text>
          </TouchableOpacity>
        ))
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  tabsRow: { flexDirection: 'row', backgroundColor: theme.colors.surface, borderRadius: 100, padding: 4, marginBottom: 14 },
  tab: { flex: 1, alignItems: 'center', paddingVertical: 10, borderRadius: 100 },
  tabAtiva: { backgroundColor: theme.colors.background, ...theme.shadows.card },
  tabText: { fontSize: 12.5, fontFamily: theme.fonts.button, color: theme.colors.textLight },
  tabTextAtiva: { color: theme.colors.primary },

  row: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: theme.colors.background, borderRadius: 14, padding: 12, marginBottom: 8, borderWidth: 1, borderColor: theme.colors.border },
  posicaoWrap: { width: 22, alignItems: 'center' },
  posicaoNum: { fontFamily: theme.fonts.button, fontSize: 13, color: theme.colors.textLight },
  rowName: { flex: 1, fontFamily: theme.fonts.button, fontSize: 13.5, color: theme.colors.text },
  rowPontos: { fontFamily: theme.fonts.button, fontSize: 12.5, color: theme.colors.success },

  emptyText: { color: theme.colors.textLight, fontFamily: theme.fonts.body, fontSize: 13, textAlign: 'center', paddingVertical: 20 },
});
