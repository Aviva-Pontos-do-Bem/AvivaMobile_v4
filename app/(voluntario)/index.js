import React, { useCallback, useEffect, useState } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, FlatList, RefreshControl, ActivityIndicator, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { supabase } from '../../supabase';
import { useAuth } from '../../contexts/AuthContext';
import Avatar from '../../components/Avatar';
import PostsFeedList from '../../components/PostsFeedList';
import { formatarTempoRelativo } from '../../lib/format';
import { theme } from '../../lib/theme';

export default function VoluntarioHome() {
  const { fullName } = useAuth();
  const router = useRouter();

  const [aba, setAba] = useState('vagas');
  const [vagas, setVagas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);

  const carregarVagas = useCallback(async () => {
    setErrorMsg(null);
    const { data, error } = await supabase
      .from('vagas')
      .select(
        'id, titulo, descricao, categoria, modalidade, localizacao, endereco, imagem_url, data_hora, vagas_disponiveis, created_at, profiles ( id, full_name, foto_url, verificado )'
      )
      .eq('ativa', true)
      .order('created_at', { ascending: false });

    if (error) setErrorMsg(error.message);
    else setVagas(data || []);
  }, []);

  useEffect(() => {
    setLoading(true);
    carregarVagas().finally(() => setLoading(false));
  }, [carregarVagas]);

  async function onRefresh() {
    setRefreshing(true);
    await carregarVagas();
    setRefreshing(false);
  }

  function renderCard({ item }) {
    const ong = item.profiles;
    return (
      <View style={styles.card}>
        <TouchableOpacity
          style={styles.cardHeader}
          onPress={() => ong?.id && router.push(`/perfil-publico/${ong.id}`)}
        >
          <Avatar nome={ong?.full_name} fotoUrl={ong?.foto_url} verificado={ong?.verificado} size={46} />
          <View style={styles.headerTextInfo}>
            <View style={styles.nameRow}>
              <Text style={styles.ongName} numberOfLines={1}>{ong?.full_name || 'ONG'}</Text>
              {ong?.verificado && <Feather name="check-circle" size={14} color={theme.colors.secondary} style={{ marginLeft: 4 }} />}
            </View>
            <Text style={styles.postMeta}>{formatarTempoRelativo(item.created_at)}</Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity activeOpacity={0.9} onPress={() => router.push(`/vaga/${item.id}`)}>
          {item.imagem_url ? (
            <Image source={{ uri: item.imagem_url }} style={styles.cover} />
          ) : (
            <View style={[styles.cover, styles.coverPlaceholder]}>
              <Feather name="image" size={32} color={theme.colors.border} />
              <Text style={styles.placeholderText}>Sem imagem</Text>
            </View>
          )}
        </TouchableOpacity>

        <View style={styles.cardBody}>
          <View style={styles.tagRow}>
            {!!item.categoria && (
              <View style={styles.categoryTag}>
                <Text style={styles.categoryText}>{item.categoria}</Text>
              </View>
            )}
            {!!item.modalidade && item.modalidade !== 'presencial' && (
              <View style={styles.categoryTag}>
                <Text style={styles.categoryText}>{item.modalidade === 'remoto' ? 'Remoto' : 'Híbrido'}</Text>
              </View>
            )}
            {item.vagas_disponiveis != null && (
              <View style={styles.spotsBadge}>
                <Feather name="users" size={12} color={theme.colors.secondary} />
                <Text style={styles.spotsText}>{item.vagas_disponiveis} vagas</Text>
              </View>
            )}
          </View>

          <Text style={styles.title}>{item.titulo}</Text>
          <Text style={styles.description} numberOfLines={2}>{item.descricao}</Text>

          <View style={styles.locationRow}>
            <Feather name="map-pin" size={14} color={theme.colors.textLight} />
            <Text style={styles.locationText} numberOfLines={1}>{item.endereco || item.localizacao || 'Local a combinar'}</Text>
          </View>

          <TouchableOpacity style={styles.detailButton} onPress={() => router.push(`/vaga/${item.id}`)}>
            <Text style={styles.detailButtonText}>Ver detalhes</Text>
            <Feather name="arrow-right" size={16} color={theme.colors.background} />
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.feed}>
      <View style={styles.header}>
        <View>
          <Text style={styles.welcomeText}>Olá, {fullName || 'voluntário'}!</Text>
          <Text style={styles.subWelcomeText}>Pronto para fazer a diferença hoje?</Text>
        </View>
        <TouchableOpacity style={styles.headerIcon}>
          <Feather name="bell" size={22} color={theme.colors.primary} />
        </TouchableOpacity>
      </View>

      <View style={styles.tabsContainer}>
        <View style={styles.tabsRow}>
          <TouchableOpacity style={[styles.tabBtn, aba === 'vagas' && styles.tabBtnActive]} onPress={() => setAba('vagas')}>
            <Text style={[styles.tabBtnText, aba === 'vagas' && styles.tabBtnTextActive]}>Vagas & Doações</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.tabBtn, aba === 'posts' && styles.tabBtnActive]} onPress={() => setAba('posts')}>
            <Text style={[styles.tabBtnText, aba === 'posts' && styles.tabBtnTextActive]}>Publicações</Text>
          </TouchableOpacity>
        </View>
      </View>

      {aba === 'posts' ? (
        <PostsFeedList podePublicar />
      ) : loading ? (
        <ActivityIndicator size="large" color={theme.colors.primary} style={{ marginTop: 40 }} />
      ) : errorMsg ? (
        <View style={styles.centerMessage}>
          <Text style={styles.errorText}>Não foi possível carregar as vagas.</Text>
          <Text style={styles.errorDetail}>{errorMsg}</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={carregarVagas}>
            <Text style={styles.retryBtnText}>Tentar novamente</Text>
          </TouchableOpacity>
        </View>
      ) : vagas.length === 0 ? (
        <View style={styles.centerMessage}>
          <Text style={styles.emptyText}>Nenhuma vaga encontrada por enquanto.</Text>
          <Text style={styles.emptySubtext}>Volte mais tarde ou peça para uma ONG cadastrar uma ação.</Text>
        </View>
      ) : (
        <FlatList
          data={vagas}
          keyExtractor={(item) => item.id}
          renderItem={renderCard}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 24, paddingTop: 8 }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  feed: { flex: 1, backgroundColor: theme.colors.surface },
  header: { 
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20, 
    paddingTop: 50, 
    paddingBottom: 20, 
    backgroundColor: theme.colors.background,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border
  },
  welcomeText: { fontSize: 24, fontFamily: theme.fonts.heading, color: theme.colors.text },
  subWelcomeText: { fontSize: 13, fontFamily: theme.fonts.body, color: theme.colors.textLight, marginTop: 2 },
  headerIcon: { padding: 8, backgroundColor: theme.colors.surface, borderRadius: 50 },

  tabsContainer: { backgroundColor: theme.colors.background, paddingHorizontal: 16, paddingBottom: 12 },
  tabsRow: { 
    flexDirection: 'row', 
    backgroundColor: theme.colors.surface, 
    borderRadius: 100, 
    padding: 4 
  },
  tabBtn: { 
    flex: 1, 
    alignItems: 'center', 
    paddingVertical: 12, 
    borderRadius: 100 
  },
  tabBtnActive: { backgroundColor: theme.colors.background, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 3, elevation: 2 },
  tabBtnText: { fontSize: 13, fontFamily: theme.fonts.button, color: theme.colors.textLight },
  tabBtnTextActive: { color: theme.colors.primary },

  card: { 
    backgroundColor: theme.colors.background, 
    borderRadius: 20, 
    marginBottom: 20, 
    overflow: 'hidden', 
    borderWidth: 1, 
    borderColor: theme.colors.border, 
    elevation: 3, 
    shadowColor: '#000', 
    shadowOpacity: 0.08, 
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 }
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center', padding: 16 },
  headerTextInfo: { flex: 1, marginLeft: 12 },
  nameRow: { flexDirection: 'row', alignItems: 'center' },
  ongName: { fontFamily: theme.fonts.button, fontSize: 15, color: theme.colors.text },
  postMeta: { fontSize: 12, fontFamily: theme.fonts.body, color: theme.colors.textLight, marginTop: 2 },

  cover: { width: '100%', height: 200, backgroundColor: theme.colors.surface },
  coverPlaceholder: { justifyContent: 'center', alignItems: 'center', backgroundColor: '#F0F4F8' },
  placeholderText: { marginTop: 8, fontSize: 12, fontFamily: theme.fonts.button, color: theme.colors.textLight },

  cardBody: { padding: 16 },
  tagRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  categoryTag: { backgroundColor: '#E4F3EC', paddingVertical: 4, paddingHorizontal: 10, borderRadius: 6 },
  categoryText: { color: theme.colors.secondary, fontFamily: theme.fonts.button, fontSize: 11, textTransform: 'uppercase' },
  spotsBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: theme.colors.surface, paddingVertical: 4, paddingHorizontal: 10, borderRadius: 100, borderWidth: 1, borderColor: theme.colors.border },
  spotsText: { color: theme.colors.primary, fontFamily: theme.fonts.button, fontSize: 11 },

  title: { fontSize: 18, fontFamily: theme.fonts.heading, color: theme.colors.text, marginBottom: 6 },
  description: { color: theme.colors.text, fontFamily: theme.fonts.body, fontSize: 13.5, lineHeight: 20, marginBottom: 16 },

  locationRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 16, backgroundColor: theme.colors.surface, padding: 10, borderRadius: 8 },
  locationText: { fontSize: 12.5, fontFamily: theme.fonts.body, color: theme.colors.textLight, flexShrink: 1 },

  detailButton: { flexDirection: 'row', gap: 8, backgroundColor: theme.colors.primary, paddingVertical: 14, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  detailButtonText: { color: theme.colors.background, fontFamily: theme.fonts.button, fontSize: 14 },

  centerMessage: { alignItems: 'center', marginTop: 40, paddingHorizontal: 30 },
  errorText: { fontFamily: theme.fonts.button, color: '#d9534f', marginBottom: 4, textAlign: 'center' },
  errorDetail: { color: theme.colors.textLight, fontFamily: theme.fonts.body, fontSize: 12, textAlign: 'center', marginBottom: 15 },
  retryBtn: { backgroundColor: theme.colors.primary, paddingVertical: 10, paddingHorizontal: 20, borderRadius: theme.border.radius },
  retryBtnText: { color: theme.colors.background, fontFamily: theme.fonts.button },
  emptyText: { fontFamily: theme.fonts.button, color: theme.colors.textLight, textAlign: 'center' },
  emptySubtext: { color: theme.colors.textLight, fontFamily: theme.fonts.body, fontSize: 12, textAlign: 'center', marginTop: 4 },
});