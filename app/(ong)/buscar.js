import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../supabase';
import SearchBar from '../../components/SearchBar';
import OngSuggestionCard from '../../components/OngSuggestionCard';
import RankingImpacto from '../../components/RankingImpacto';
import NearbyOngsButton from '../../components/NearbyOngsButton';
import { calcularMatch } from '../../lib/matching';
import { theme } from '../../lib/theme';

function normalizar(texto) {
  return (texto || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

// Busca da ONG: diferente da tela de voluntário/empresa (que procuram
// ONGs), aqui a ONG procura voluntários e empresas para se conectar. O
// componente de cartão (OngSuggestionCard) é o mesmo apesar do nome — ele só
// espera um perfil com full_name/foto_url/bio/endereco, então serve para
// qualquer um dos três tipos de conta.
export default function BuscarOng() {
  const { session, profile } = useAuth();

  const [query, setQuery] = useState('');
  const [carregando, setCarregando] = useState(true);
  const [voluntarios, setVoluntarios] = useState([]);
  const [empresas, setEmpresas] = useState([]);

  const carregar = useCallback(async () => {
    setCarregando(true);
    const [{ data: voluntariosData }, { data: empresasData }, { data: seguindoData }] = await Promise.all([
      supabase.from('profiles').select('id, full_name, foto_url, bio, endereco, verificado').eq('user_type', 'voluntario'),
      supabase.from('profiles').select('id, full_name, foto_url, bio, endereco, verificado').eq('user_type', 'empresa'),
      supabase.from('seguidores').select('seguido_id').eq('seguidor_id', session.user.id),
    ]);

    const idsSeguindo = new Set((seguindoData || []).map((s) => s.seguido_id));
    setVoluntarios((voluntariosData || []).map((v) => ({ ...v, jaSegue: idsSeguindo.has(v.id) })));
    setEmpresas((empresasData || []).map((e) => ({ ...e, jaSegue: idsSeguindo.has(e.id) })));
    setCarregando(false);
  }, [session]);

  useEffect(() => { carregar(); }, [carregar]);

  const termo = normalizar(query);

  function comMatchEFiltro(lista) {
    const comMatch = lista
      .map((p) => ({ pessoa: p, match: calcularMatch({ bioViewer: profile?.bio, ong: p, vagasAbertasCount: 0 }) }))
      .sort((a, b) => b.match - a.match);
    const filtrada = termo
      ? comMatch.filter(({ pessoa }) => normalizar(pessoa.full_name).includes(termo) || normalizar(pessoa.bio).includes(termo))
      : comMatch;
    return termo ? filtrada : filtrada.slice(0, 6);
  }

  const voluntariosSugeridos = useMemo(() => comMatchEFiltro(voluntarios), [voluntarios, termo, profile]);
  const empresasSugeridas = useMemo(() => comMatchEFiltro(empresas), [empresas, termo, profile]);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Buscar</Text>
        <Text style={styles.subtitle}>Encontre voluntários e empresas parceiras</Text>
        <SearchBar valor={query} onMudar={setQuery} placeholder="Buscar por nome ou causa..." />
        <View style={{ marginTop: 12 }}>
          <NearbyOngsButton label="Ver outras ONGs perto de você" />
        </View>
      </View>

      {carregando ? (
        <ActivityIndicator size="large" color={theme.colors.primary} style={{ marginTop: 40 }} />
      ) : (
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <Text style={styles.sectionTitle}>Voluntários Sugeridos</Text>
          {voluntariosSugeridos.length === 0 ? (
            <Text style={styles.emptyText}>Nenhum voluntário encontrado para "{query}".</Text>
          ) : (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 12, paddingRight: 4 }}>
              {voluntariosSugeridos.map(({ pessoa, match }) => (
                <OngSuggestionCard key={pessoa.id} ong={pessoa} match={match} categoria="Voluntário" />
              ))}
            </ScrollView>
          )}

          <Text style={[styles.sectionTitle, { marginTop: 24 }]}>Empresas Parceiras Sugeridas</Text>
          {empresasSugeridas.length === 0 ? (
            <Text style={styles.emptyText}>Nenhuma empresa encontrada para "{query}".</Text>
          ) : (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 12, paddingRight: 4 }}>
              {empresasSugeridas.map(({ pessoa, match }) => (
                <OngSuggestionCard key={pessoa.id} ong={pessoa} match={match} categoria="Empresa parceira" />
              ))}
            </ScrollView>
          )}

          <Text style={[styles.sectionTitle, { marginTop: 24 }]}>Ranking de Impacto</Text>
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

  content: { padding: 16, paddingBottom: 30 },
  sectionTitle: { fontSize: 16, fontFamily: theme.fonts.heading, color: theme.colors.text, marginBottom: 12 },
  emptyText: { color: theme.colors.textLight, fontFamily: theme.fonts.body, fontSize: 13, marginBottom: 12 },
});
