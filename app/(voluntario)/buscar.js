import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, ActivityIndicator, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import * as Location from 'expo-location';
import { Feather } from '@expo/vector-icons';
import { supabase } from '../../supabase';
import { useAuth } from '../../contexts/AuthContext';
import SearchBar from '../../components/SearchBar';
import OngSuggestionCard from '../../components/OngSuggestionCard';
import RankingImpacto from '../../components/RankingImpacto';
import NearbyOngsButton from '../../components/NearbyOngsButton';
import { calcularMatch } from '../../lib/matching';
import { distanciaKm, formatarDistancia } from '../../lib/geo';
import { CATEGORIAS } from '../../lib/constants';
import { theme } from '../../lib/theme';

const MODALIDADES = [
  { key: 'todas', label: 'Todas' },
  { key: 'presencial', label: 'Presencial' },
  { key: 'remoto', label: 'Remoto' },
  { key: 'hibrido', label: 'H\u00edbrido' },
];

const RAIOS_KM = [
  { key: 'todas', label: 'Qualquer dist\u00e2ncia' },
  { key: 10, label: 'at\u00e9 10 km' },
  { key: 25, label: 'at\u00e9 25 km' },
  { key: 50, label: 'at\u00e9 50 km' },
  { key: 100, label: 'at\u00e9 100 km' },
];

const avisar = (titulo, mensagem) => {
  if (Platform.OS === 'web') alert(`${titulo}: ${mensagem}`);
  else {
    const { Alert } = require('react-native');
    Alert.alert(titulo, mensagem);
  }
};

function normalizar(texto) {
  return (texto || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

export default function Buscar() {
  const router = useRouter();
  const { session, profile } = useAuth();

  const [query, setQuery] = useState('');
  const [categoriaFiltro, setCategoriaFiltro] = useState('todas');
  const [modalidadeFiltro, setModalidadeFiltro] = useState('todas');
  const [raioFiltro, setRaioFiltro] = useState('todas');
  const [minhaPosicao, setMinhaPosicao] = useState(null);
  const [buscandoLocalizacao, setBuscandoLocalizacao] = useState(false);
  const [carregando, setCarregando] = useState(true);
  const [vagas, setVagas] = useState([]);
  const [ongs, setOngs] = useState([]);

  async function ativarFiltroDistancia() {
    setBuscandoLocalizacao(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        avisar('Permissão necessária', 'Precisamos de acesso à sua localização para filtrar por distância.');
        return;
      }
      const posicao = await Location.getCurrentPositionAsync({});
      setMinhaPosicao({ lat: posicao.coords.latitude, lng: posicao.coords.longitude });
    } catch (err) {
      avisar('Erro ao obter localização', err.message || 'Tente novamente.');
    } finally {
      setBuscandoLocalizacao(false);
    }
  }

  function desativarFiltroDistancia() {
    setMinhaPosicao(null);
    setRaioFiltro('todas');
  }

  const carregar = useCallback(async () => {
    setCarregando(true);
    const [{ data: vagasData }, { data: ongsData }, { data: seguindoData }] = await Promise.all([
      supabase
        .from('vagas')
        .select('id, titulo, categoria, modalidade, endereco, localizacao, vagas_disponiveis, ong_id, profiles ( id, full_name, foto_url, verificado, lat, lng )')
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

  const vagasComDistancia = useMemo(() => {
    if (!minhaPosicao) return vagas.map((v) => ({ ...v, distancia: null }));
    return vagas.map((v) => ({
      ...v,
      distancia: distanciaKm(minhaPosicao.lat, minhaPosicao.lng, v.profiles?.lat, v.profiles?.lng),
    }));
  }, [vagas, minhaPosicao]);

  const vagasFiltradas = useMemo(() => {
    return vagasComDistancia.filter((v) => {
      if (categoriaFiltro !== 'todas' && v.categoria !== categoriaFiltro) return false;
      if (modalidadeFiltro !== 'todas' && (v.modalidade || 'presencial') !== modalidadeFiltro) return false;
      if (minhaPosicao && raioFiltro !== 'todas' && (v.distancia == null || v.distancia > raioFiltro)) return false;
      if (!termo) return true;
      return (
        normalizar(v.titulo).includes(termo) ||
        normalizar(v.categoria).includes(termo) ||
        normalizar(v.endereco || v.localizacao).includes(termo) ||
        normalizar(v.profiles?.full_name).includes(termo)
      );
    });
  }, [vagasComDistancia, termo, categoriaFiltro, modalidadeFiltro, raioFiltro, minhaPosicao]);

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

      {!minhaPosicao ? (
        <TouchableOpacity style={styles.locationFilterBtn} onPress={ativarFiltroDistancia} disabled={buscandoLocalizacao}>
          {buscandoLocalizacao ? (
            <ActivityIndicator size="small" color={theme.colors.secondary} />
          ) : (
            <Feather name="map-pin" size={14} color={theme.colors.secondary} />
          )}
          <Text style={styles.locationFilterBtnText}>Filtrar por distância da minha localização</Text>
        </TouchableOpacity>
      ) : (
        <View style={styles.filterBar}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterBarContent}>
            {RAIOS_KM.map((r) => (
              <TouchableOpacity key={r.key} style={[styles.filterChip, styles.filterChipModalidade, raioFiltro === r.key && styles.filterChipActive]} onPress={() => setRaioFiltro(r.key)}>
                <Text style={[styles.filterChipText, raioFiltro === r.key && styles.filterChipTextActive]}>{r.label}</Text>
              </TouchableOpacity>
            ))}
            <TouchableOpacity style={styles.clearLocationChip} onPress={desativarFiltroDistancia}>
              <Feather name="x" size={13} color={theme.colors.error} />
            </TouchableOpacity>
          </ScrollView>
        </View>
      )}

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
                    {item.distancia != null ? ` · ${formatarDistancia(item.distancia)}` : ''}
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

  locationFilterBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: theme.colors.background, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: theme.colors.border },
  locationFilterBtnText: { fontSize: 12, fontFamily: theme.fonts.button, color: theme.colors.secondary },
  clearLocationChip: { justifyContent: 'center', alignItems: 'center', paddingHorizontal: 10 },

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
