import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, RefreshControl } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { supabase } from '../supabase';
import { useAuth } from '../contexts/AuthContext';
import PostCard from './PostCard';
import ComposePostModal from './ComposePostModal';
import { theme } from '../lib/theme';

export default function PostsFeedList({ autorId, podePublicar, semCartaoVazio }) {
  const { session } = useAuth();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [modalAberto, setModalAberto] = useState(false);
  const [escopo, setEscopo] = useState('todos');
  const [curtidos, setCurtidos] = useState(new Set());
  const [recomendados, setRecomendados] = useState(new Set());

  const carregar = useCallback(async () => {
    let query = supabase.from('posts').select('id, conteudo, imagem_url, video_url, visibilidade, localizacao_nome, localizacao_lat, localizacao_lng, created_at, autor_id, post_midia ( id, tipo, url, ordem ), profiles ( id, full_name, foto_url, verificado, user_type )').order('created_at', { ascending: false });

    if (autorId) {
      query = query.eq('autor_id', autorId);
    } else if (escopo === 'seguindo') {
      const { data: seguindo } = await supabase.from('seguidores').select('seguido_id').eq('seguidor_id', session.user.id);
      const ids = (seguindo || []).map((s) => s.seguido_id);
      if (ids.length === 0) {
        setPosts([]);
        return;
      }
      query = query.in('autor_id', ids);
    }

    const { data: postsData } = await query;
    const lista = postsData || [];
    const ids = lista.map((p) => p.id);

    let curtidas = [], recomendacoes = [], comentarios = [];
    if (ids.length > 0) {
      const [{ data: c }, { data: r }, { data: co }] = await Promise.all([
        supabase.from('post_curtidas').select('post_id, user_id').in('post_id', ids),
        supabase.from('post_recomendacoes').select('post_id, user_id').in('post_id', ids),
        supabase.from('post_comentarios').select('post_id').in('post_id', ids),
      ]);
      curtidas = c || []; recomendacoes = r || []; comentarios = co || [];
    }

    const contar = (lista_, postId) => lista_.filter((x) => x.post_id === postId).length;
    setPosts(lista.map((p) => ({
      ...p,
      curtidas_count: contar(curtidas, p.id),
      recomendacoes_count: contar(recomendacoes, p.id),
      comentarios_count: contar(comentarios, p.id),
    })));
    setCurtidos(new Set(curtidas.filter((c) => c.user_id === session.user.id).map((c) => c.post_id)));
    setRecomendados(new Set(recomendacoes.filter((r) => r.user_id === session.user.id).map((r) => r.post_id)));
  }, [autorId, escopo, session]);

  useEffect(() => {
    setLoading(true);
    carregar().finally(() => setLoading(false));
  }, [carregar]);

  async function onRefresh() {
    setRefreshing(true);
    await carregar();
    setRefreshing(false);
  }

  function removerLocalmente(id) {
    setPosts((atual) => atual.filter((p) => p.id !== id));
  }

  if (loading) return <ActivityIndicator size="large" color={theme.colors.primary} style={{ marginTop: 40 }} />;

  return (
    <View style={{ flex: 1 }}>
      {!autorId && (
        <View style={styles.scopeRow}>
          <TouchableOpacity style={[styles.scopeChip, escopo === 'todos' && styles.scopeChipActive]} onPress={() => setEscopo('todos')}>
            <Text style={[styles.scopeChipText, escopo === 'todos' && styles.scopeChipTextActive]}>Todos</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.scopeChip, escopo === 'seguindo' && styles.scopeChipActive]} onPress={() => setEscopo('seguindo')}>
            <Text style={[styles.scopeChipText, escopo === 'seguindo' && styles.scopeChipTextActive]}>Seguindo</Text>
          </TouchableOpacity>
        </View>
      )}

      {podePublicar && (
        <TouchableOpacity style={styles.newPostBtn} onPress={() => setModalAberto(true)}>
          <Feather name="edit-3" size={16} color={theme.colors.primary} />
          <Text style={styles.newPostBtnText}>Compartilhar uma novidade...</Text>
        </TouchableOpacity>
      )}

      {posts.length === 0 ? (
        !semCartaoVazio && (
          <View style={styles.empty}>
            <Text style={styles.emptyText}>
              {escopo === 'seguindo' ? 'Você ainda não segue ninguém ou não há publicações.' : 'Nenhuma publicação por aqui ainda.'}
            </Text>
          </View>
        )
      ) : (
        <FlatList
          data={posts}
          keyExtractor={(item) => item.id}
          scrollEnabled={!autorId}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          contentContainerStyle={{ paddingHorizontal: autorId ? 0 : 20, paddingBottom: 30 }}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => (
            <PostCard
              post={item}
              curtido={curtidos.has(item.id)}
              recomendado={recomendados.has(item.id)}
              onMudou={carregar}
              podeExcluir={item.autor_id === session.user.id}
              onExcluido={removerLocalmente}
            />
          )}
        />
      )}

      <ComposePostModal visivel={modalAberto} onFechar={() => setModalAberto(false)} onPublicado={carregar} />
    </View>
  );
}

const styles = StyleSheet.create({
  scopeRow: { flexDirection: 'row', gap: 10, paddingHorizontal: 20, marginTop: 20, marginBottom: 16 },  scopeChip: { paddingVertical: 8, paddingHorizontal: 18, borderRadius: 100, backgroundColor: theme.colors.surface },
  scopeChipActive: { backgroundColor: theme.colors.primary },
  scopeChipText: { color: theme.colors.textLight, fontFamily: theme.fonts.button, fontSize: 13 },
  scopeChipTextActive: { color: theme.colors.background },

  newPostBtn: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: theme.colors.background, borderRadius: 20, padding: 16, marginHorizontal: 20, marginBottom: 20, borderWidth: 1, borderColor: theme.colors.border, ...theme.shadows.card },
  newPostBtnText: { color: theme.colors.textLight, fontFamily: theme.fonts.body, fontSize: 14 },

  empty: { alignItems: 'center', marginTop: 40, paddingHorizontal: 30 },
  emptyText: { color: theme.colors.textLight, fontFamily: theme.fonts.body, textAlign: 'center', fontSize: 14 },
});