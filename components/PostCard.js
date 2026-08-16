import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Share, Alert, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { supabase } from '../supabase';
import Avatar from './Avatar';
import PostMediaCarousel from './PostMediaCarousel';
import { formatarTempoRelativo } from '../lib/format';
import { linkDaPublicacao } from '../lib/links';
import { theme } from '../lib/theme';

const ROTULO_TIPO = { voluntario: 'Voluntário', ong: 'ONG', empresa: 'Empresa' };

// Publicações novas trazem post_midia (várias fotos/vídeos, na ordem em que
// foram anexadas). Publicações de antes dessa migração só têm imagem_url ou
// video_url — por isso o fallback, pra elas continuarem aparecendo normal.
function midiasDoPost(post) {
  if (post.post_midia?.length > 0) {
    return [...post.post_midia].sort((a, b) => a.ordem - b.ordem).map((m) => ({ id: m.id, tipo: m.tipo, url: m.url }));
  }
  if (post.video_url) return [{ tipo: 'video', url: post.video_url }];
  if (post.imagem_url) return [{ tipo: 'imagem', url: post.imagem_url }];
  return [];
}

export default function PostCard({ post, curtido, recomendado, onMudou, podeExcluir, onExcluido, ocultarComentar }) {
  const router = useRouter();
  const [enviando, setEnviando] = useState(false);

  async function alternarCurtida() {
    if (enviando) return;
    setEnviando(true);
    const { data: { user } } = await supabase.auth.getUser();

    if (curtido) await supabase.from('post_curtidas').delete().eq('post_id', post.id).eq('user_id', user.id);
    else await supabase.from('post_curtidas').insert({ post_id: post.id, user_id: user.id });
    
    setEnviando(false);
    onMudou?.();
  }

  async function alternarRecomendacao() {
    if (enviando) return;
    setEnviando(true);
    const { data: { user } } = await supabase.auth.getUser();

    if (recomendado) await supabase.from('post_recomendacoes').delete().eq('post_id', post.id).eq('user_id', user.id);
    else await supabase.from('post_recomendacoes').insert({ post_id: post.id, user_id: user.id });
    
    setEnviando(false);
    onMudou?.();
  }

  async function compartilhar() {
    const link = linkDaPublicacao(post.id);
    try {
      await Share.share({ message: `${post.profiles?.full_name} no Aviva:\n\n"${post.conteudo}"\n\n${link}`, url: link, title: 'Aviva' });
    } catch (err) {
      // Ignora cancelamento
    }
  }

  async function excluir() {
    await supabase.from('posts').delete().eq('id', post.id);
    onExcluido?.(post.id);
  }

  function confirmarExclusao() {
    if (Platform.OS === 'web') {
      if (window.confirm('Excluir esta publicação? Essa ação não pode ser desfeita.')) excluir();
      return;
    }
    Alert.alert('Excluir publicação', 'Essa ação não pode ser desfeita.', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Excluir', style: 'destructive', onPress: excluir },
    ]);
  }

  const autor = post.profiles;

  return (
    <View style={styles.card}>
      <TouchableOpacity style={styles.header} onPress={() => router.push(`/perfil-publico/${autor?.id}`)}>
        <Avatar nome={autor?.full_name} fotoUrl={autor?.foto_url} verificado={autor?.verificado} size={44} />
        <View style={{ flex: 1, marginLeft: 12 }}>
          <View style={styles.nameRow}>
            <Text style={styles.name} numberOfLines={1}>{autor?.full_name}</Text>
            {autor?.verificado && <Feather name="check-circle" size={14} color={theme.colors.success} style={{ marginLeft: 6 }} />}
          </View>
          <Text style={styles.meta}>
            {ROTULO_TIPO[autor?.user_type] || ''} • {formatarTempoRelativo(post.created_at)}
          </Text>
        </View>
        {podeExcluir && (
          <TouchableOpacity onPress={confirmarExclusao} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
            <Feather name="trash-2" size={18} color={theme.colors.textLight} />
          </TouchableOpacity>
        )}
      </TouchableOpacity>

      {!!post.localizacao_nome && (
        <View style={styles.locationRow}>
          <Feather name="map-pin" size={12} color={theme.colors.secondary} />
          <Text style={styles.locationText} numberOfLines={1}>{post.localizacao_nome}</Text>
        </View>
      )}

      {post.visibilidade === 'seguidores' && (
        <View style={styles.privateRow}>
          <Feather name="lock" size={11} color={theme.colors.textLight} />
          <Text style={styles.privateText}>Só para seguidores</Text>
        </View>
      )}

      {!!post.conteudo && <Text style={styles.content}>{post.conteudo}</Text>}

      <PostMediaCarousel midias={midiasDoPost(post)} />

      <View style={styles.actionsRow}>
        <TouchableOpacity style={styles.actionBtn} onPress={alternarCurtida}>
          <Feather name="heart" size={18} color={curtido ? theme.colors.error : theme.colors.textLight} />
          <Text style={[styles.actionText, curtido && { color: theme.colors.error }]}>
            Curtir{post.curtidas_count ? ` (${post.curtidas_count})` : ''}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionBtn} onPress={alternarRecomendacao}>
          <Feather name="thumbs-up" size={18} color={recomendado ? theme.colors.success : theme.colors.textLight} />
          <Text style={[styles.actionText, recomendado && { color: theme.colors.success }]}>
            Recomendar{post.recomendacoes_count ? ` (${post.recomendacoes_count})` : ''}
          </Text>
        </TouchableOpacity>

        {!ocultarComentar && (
          <TouchableOpacity style={styles.actionBtn} onPress={() => router.push(`/post/${post.id}`)}>
            <Feather name="message-circle" size={18} color={theme.colors.textLight} />
            <Text style={styles.actionText}>Comentar{post.comentarios_count ? ` (${post.comentarios_count})` : ''}</Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity style={styles.actionBtn} onPress={compartilhar}>
          <Feather name="share-2" size={18} color={theme.colors.textLight} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: theme.colors.background, borderRadius: 24, padding: 16, marginBottom: 16, ...theme.shadows.card },
  header: { flexDirection: 'row', alignItems: 'center', marginBottom: 14 },
  nameRow: { flexDirection: 'row', alignItems: 'center' },
  name: { fontFamily: theme.fonts.heading, fontSize: 15, color: theme.colors.text },
  meta: { fontFamily: theme.fonts.body, fontSize: 12, color: theme.colors.textLight, marginTop: 2 },
  locationRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 8 },
  locationText: { fontFamily: theme.fonts.body, fontSize: 12, color: theme.colors.secondary },
  privateRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 8 },
  privateText: { fontFamily: theme.fonts.body, fontSize: 11.5, color: theme.colors.textLight },
  content: { fontFamily: theme.fonts.body, fontSize: 14, color: theme.colors.text, lineHeight: 22, marginBottom: 14 },
  actionsRow: { flexDirection: 'row', justifyContent: 'space-between', borderTopWidth: 1, borderTopColor: theme.colors.surface, paddingTop: 14 },
  actionBtn: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  actionText: { fontFamily: theme.fonts.button, fontSize: 12.5, color: theme.colors.textLight },
});