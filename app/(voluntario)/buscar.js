import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { supabase } from '../../supabase';
import { useAuth } from '../../contexts/AuthContext';
import SearchBar from '../../components/SearchBar';
import OngSuggestionCard from '../../components/OngSuggestionCard';
import RankingImpacto from '../../components/RankingImpacto';
import NearbyOngsButton from '../../components/NearbyOngsButton';
import { calcularMatch } from '../../lib/matching';
import { CATEGORIAS } from '../../lib/constants';
import { theme } from '../../lib/theme';

const MODALIDADES = [
  { key: 'todas', label: 'Todas' },
  { key: 'presencial', label: 'Presencial' },
  { key: 'remoto', label: 'Remoto' },
  { key: 'hibrido', label: 'H\u00edbrido' },
];

function normalizar(texto) {
  return (texto || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

export default function Buscar() {
  const router = useRouter();
  const { session, profile } = useAuth();

  const [query, setQuery] = useState('');
  const [categoriaFiltro, setCategoriaFiltro] = useState('todas');
  const [modalidadeFiltro, setModalidadeFiltro] = useState('todas');
  const [carregando, setCarregando] = useState(true);
  const [vagas, setVagas] = useState([]);
  const [ongs, setOngs] = useState([]);

  const carregar = useCallback(async () => {
    setCarregando(true);
    const [{ data: vagasData }, { data: ongsData }, { data: seguindoData }] = await Promise.all([
      supabase
        .from('vagas')
        .select('id, titulo, categoria, modalidade, endereco, localizacao, vagas_disponiveis, ong_id, profiles ( id, full_name, foto_url, verificado )')
        .eq('ativa', true)
        .order('created_at', { ascending: false }),
      supabase.from('profiles').select('id, full_name, foto_url, bio, endereco, verificado').eq('user_type', 'ong'),
      supabase.from('seguidores').select('seguido_id').eq('seguidor_id', session.user.id),
    ]);

    const idsSeguindo = new Set((seguindoData || []).map((s) => s.seguido_id));
    const vagasPorOng = new Map();
    (vagasData || []).forEach((v) => vagasPorOng.set(v.ong_id, (vagasPorOng.get(v.ong_id) || 0) + 1));

    setVagas(vagasData || []);
    setOngs(
      (ongsData || []).map((o) => ({
        ...o,
        jaSegue: idsSeguindo.has(o.id),
        vagasAbertasCount: vagasPorOng.get(o.id) || 0,
      }))
    );
    setCarregando(false);
  }, [session]);

  useEffect(() => { carregar(); }, [carregar]);

  const termo = normalizar(query);

  const vagasFiltradas = useMemo(() => {
    return vagas.filter((v) => {
      if (categoriaFiltro !== 'todas' && v.categoria !== categoriaFiltro) return false;
      if (modalidadeFiltro !== 'todas' && (v.modalidade || 'presencial') !== modalidadeFiltro) return false;
      if (!termo) return true;
      return (
        normalizar(v.titulo).includes(termo) ||
        normalizar(v.categoria).includes(termo) ||
        normalizar(v.endereco || v.localizacao).includes(termo) ||
        normalizar(v.profiles?.full_name).includes(termo)
      );
    });
  }, [vagas, termo, categoriaFiltro, modalidadeFiltro]);

  const ongsComMatch = useMemo(() => {
    return ongs
      .map((o) => ({ ong: o, match: calcularMatch({ bioViewer: profile?.bio, ong: o, vagasAbertasCount: o.vagasAbertasCount }) }))
      .sort((a, b) => b.match - a.match);
  }, [ongs, profile]);

  const sugestoesFiltradas = useMemo(() => {
    const base = termo
      ? ongsComMatch.filter(({ ong }) => normalizar(ong.full_name).includes(termo) || normalizar(ong.bio).includes(termo))
      : ongsComMatch;
    return termo ? base : base.slice(0, 6);
  }, [ongsComMatch, termo]);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Buscar</Text>
        <Text style={styles.subtitle}>Encontre a causa perfeita para você</Text>
        <SearchBar valor={query} onMudar={setQuery} placeholder="Buscar por ONG, localização ou causa..." />
        <View style={{ marginTop: 12 }}>
          <NearbyOngsButton />
        </View>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterBar} contentContainerStyle={styles.filterBarContent}>
        <TouchableOpacity style={[styles.filterChip, categoriaFiltro === 'todas' && styles.filterChipActive]} onPress={() => setCategoriaFiltro('todas')}>
          <Text style={[styles.filterChipText, categoriaFiltro === 'todas' && styles.filterChipTextActive]}>Todas as causas</Text>
        </TouchableOpacity>
        {CATEGORIAS.map((c) => (
          <TouchableOpacity key={c} style={[styles.filterChip, categoriaFiltro === c && styles.filterChipActive]} onPress={() => setCategoriaFiltro(categoriaFiltro === c ? 'todas' : c)}>
            <Text style={[styles.filterChipText, categoriaFiltro === c && styles.filterChipTextActive]}>{c}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterBar} contentContainerStyle={styles.filterBarContent}>
        {MODALIDADES.map((m) => (
          <TouchableOpacity key={m.key} style={[styles.filterChip, styles.filterChipModalidade, modalidadeFiltro === m.key && styles.filterChipActive]} onPress={() => setModalidadeFiltro(m.key)}>
            <Text style={[styles.filterChipText, modalidadeFiltro === m.key && styles.filterChipTextActive]}>{m.label}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {carregando ? (
        <ActivityIndicator size="large" color={theme.colors.primary} style={{ marginTop: 40 }} />
      ) : (
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <Text style={styles.sectionTitle}>Parcerias Sugeridas</Text>
          {sugestoesFiltradas.length === 0 ? (
            <Text style={styles.emptyText}>Nenhuma ONG encontrada para "{query}".</Text>
          ) : (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 12, paddingRight: 4 }}>
              {sugestoesFiltradas.map(({ ong, match }) => (
                <OngSuggestionCard key={ong.id} ong={ong} match={match} categoria={ong.vagasAbertasCount > 0 ? `${ong.vagasAbertasCount} vaga(s) aberta(s)` : null} />
              ))}
            </ScrollView>
          )}

          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>Vagas Disponíveis</Text>
            <Text style={styles.sectionCount}>{vagasFiltradas.length}</Text>
          </View>
          {vagasFiltradas.length === 0 ? (
            <Text style={styles.emptyText}>Nenhuma vaga encontrada para "{query}".</Text>
          ) : (
            vagasFiltradas.map((item) => (
              <TouchableOpacity key={item.id} style={styles.vagaRow} onPress={() => router.push(`/vaga/${item.id}`)}>
                {item.profiles?.foto_url ? (
                  <Image source={{ uri: item.profiles.foto_url }} style={styles.vagaAvatar} />
                ) : (
                  <View style={[styles.vagaAvatar, styles.vagaAvatarPlaceholder]}>
                    <Feather name="briefcase" size={16} color={theme.colors.textLight} />
                  </View>
                )}
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <Text style={styles.vagaTitulo} numberOfLines={1}>{item.titulo}</Text>
                  <Text style={styles.vagaMeta} numberOfLines={1}>
                    {item.profiles?.full_name} · {item.categoria} · {MODALIDADES.find((m) => m.key === (item.modalidade || 'presencial'))?.label} · {item.vagas_disponiveis ?? '—'} vagas
                  </Text>
                </View>
                <TouchableOpacity style={styles.candidatarBtn} onPress={() => router.push(`/vaga/${item.id}`)}>
                  <Text style={styles.candidatarBtnText}>Candidatar-se</Text>
                </TouchableOpacity>
              </TouchableOpacity>
            ))
          )}

          <Text style={[styles.sectionTitle, { marginTop: 8 }]}>Ranking de Impacto</Text>
          <RankingImpacto />
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.surface },
  header: { paddingHorizontal: 20, paddingTop: 50, paddingBottom: 20, backgroundColor: theme.colors.background, borderBottomWidth: 1, borderBottomColor: theme.colors.border },
  title: { fontSize: 24, fontFamily: theme.fonts.heading, color: theme.colors.text },
  subtitle: { fontSize: 13, fontFamily: theme.fonts.body, color: theme.colors.textLight, marginTop: 2, marginBottom: 16 },

  filterBar: { backgroundColor: theme.colors.background, borderBottomWidth: 1, borderBottomColor: theme.colors.border },
  filterBarContent: { paddingHorizontal: 16, paddingVertical: 10, gap: 8 },
  filterChip: { paddingVertical: 8, paddingHorizontal: 14, borderRadius: 100, backgroundColor: theme.colors.surface, borderWidth: 1, borderColor: theme.colors.border },
  filterChipModalidade: { paddingVertical: 6 },
  filterChipActive: { backgroundColor: theme.colors.primary, borderColor: theme.colors.primary },
  filterChipText: { fontSize: 12, fontFamily: theme.fonts.button, color: theme.colors.textLight },
  filterChipTextActive: { color: theme.colors.background },

  content: { padding: 16, paddingBottom: 30 },
  sectionTitle: { fontSize: 16, fontFamily: theme.fonts.heading, color: theme.colors.text, marginBottom: 12 },
  sectionHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', marginTop: 24 },
  sectionCount: { fontFamily: theme.fonts.button, fontSize: 13, color: theme.colors.textLight },
  emptyText: { color: theme.colors.textLight, fontFamily: theme.fonts.body, fontSize: 13, marginBottom: 12 },

  vagaRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: theme.colors.background, borderRadius: 16, padding: 12, marginBottom: 10, borderWidth: 1, borderColor: theme.colors.border },
  vagaAvatar: { width: 40, height: 40, borderRadius: 10 },
  vagaAvatarPlaceholder: { backgroundColor: theme.colors.surface, justifyContent: 'center', alignItems: 'center' },
  vagaTitulo: { fontFamily: theme.fonts.button, fontSize: 13.5, color: theme.colors.text },
  vagaMeta: { fontFamily: theme.fonts.body, fontSize: 11.5, color: theme.colors.textLight, marginTop: 2 },
  candidatarBtn: { backgroundColor: theme.colors.secondary, borderRadius: 10, paddingVertical: 8, paddingHorizontal: 10 },
  candidatarBtnText: { color: theme.colors.background, fontFamily: theme.fonts.button, fontSize: 11 },
});
