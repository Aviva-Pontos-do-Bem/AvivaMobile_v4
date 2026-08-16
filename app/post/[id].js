import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import { Stack, useLocalSearchParams } from 'expo-router';
import { supabase } from '../../supabase';
import { useAuth } from '../../contexts/AuthContext';
import PostCard from '../../components/PostCard';
import ComentariosList from '../../components/ComentariosList';
import { theme } from '../../lib/theme';

export default function DetalhePost() {
  const { id } = useLocalSearchParams();
  const { session } = useAuth();
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [naoEncontrado, setNaoEncontrado] = useState(false);
  const [curtido, setCurtido] = useState(false);
  const [recomendado, setRecomendado] = useState(false);

  const carregar = useCallback(async () => {
    const { data: postData, error } = await supabase
      .from('posts')
      .select('id, conteudo, imagem_url, video_url, visibilidade, localizacao_nome, localizacao_lat, localizacao_lng, created_at, autor_id, post_midia ( id, tipo, url, ordem ), profiles ( id, full_name, foto_url, verificado, user_type )')
      .eq('id', id)
      .maybeSingle();

    if (error || !postData) {
      setNaoEncontrado(true);
      return;
    }

    const [{ count: curtidasCount }, { count: recomendacoesCount }, { data: minhaCurtida }, { data: minhaRecomendacao }] = await Promise.all([
      supabase.from('post_curtidas').select('id', { count: 'exact', head: true }).eq('post_id', id),
      supabase.from('post_recomendacoes').select('id', { count: 'exact', head: true }).eq('post_id', id),
      supabase.from('post_curtidas').select('id').eq('post_id', id).eq('user_id', session.user.id).maybeSingle(),
      supabase.from('post_recomendacoes').select('id').eq('post_id', id).eq('user_id', session.user.id).maybeSingle(),
    ]);

    setPost({ ...postData, curtidas_count: curtidasCount || 0, recomendacoes_count: recomendacoesCount || 0 });
    setCurtido(!!minhaCurtida);
    setRecomendado(!!minhaRecomendacao);
  }, [id, session]);

  useEffect(() => {
    setLoading(true);
    carregar().finally(() => setLoading(false));
  }, [carregar]);

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: true, title: 'Publicação' }} />
      {loading ? (
        <ActivityIndicator size="large" color={theme.colors.primary} style={{ marginTop: 40 }} />
      ) : naoEncontrado ? (
        <View style={styles.centered}>
          <Text style={styles.emptyText}>Essa publicação não existe mais ou foi removida.</Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={{ padding: 16 }} showsVerticalScrollIndicator={false}>
          <PostCard
            post={post}
            curtido={curtido}
            recomendado={recomendado}
            onMudou={carregar}
            podeExcluir={post.autor_id === session.user.id}
            ocultarComentar
          />
          <ComentariosList postId={post.id} />
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.surface },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 30 },
  emptyText: { color: theme.colors.textLight, fontFamily: theme.fonts.body, textAlign: 'center' },
});