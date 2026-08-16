import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { supabase } from '../supabase';
import { useAuth } from '../contexts/AuthContext';
import Avatar from './Avatar';
import { formatarTempoRelativo } from '../lib/format';
import { theme } from '../lib/theme';

const avisar = (titulo, mensagem) => {
  if (Platform.OS === 'web') alert(`${titulo}: ${mensagem}`);
  else {
    const { Alert } = require('react-native');
    Alert.alert(titulo, mensagem);
  }
};

export default function ComentariosList({ postId }) {
  const { session, profile } = useAuth();
  const router = useRouter();
  const [comentarios, setComentarios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [texto, setTexto] = useState('');
  const [enviando, setEnviando] = useState(false);

  const carregar = useCallback(async () => {
    const { data, error } = await supabase
      .from('post_comentarios')
      .select('id, conteudo, created_at, autor_id, profiles ( id, full_name, foto_url, verificado )')
      .eq('post_id', postId)
      .order('created_at', { ascending: true });
    if (!error) setComentarios(data || []);
  }, [postId]);

  useEffect(() => {
    setLoading(true);
    carregar().finally(() => setLoading(false));
  }, [carregar]);

  async function enviar() {
    const conteudo = texto.trim();
    if (!conteudo) return;
    setEnviando(true);
    const { error } = await supabase.from('post_comentarios').insert({
      post_id: postId,
      autor_id: session.user.id,
      conteudo,
    });
    setEnviando(false);
    if (error) return avisar('Não foi possível comentar', error.message);
    setTexto('');
    carregar();
  }

  return (
    <View style={styles.wrap}>
      <Text style={styles.title}>Comentários {comentarios.length > 0 ? `(${comentarios.length})` : ''}</Text>

      {loading ? (
        <ActivityIndicator color={theme.colors.primary} style={{ marginVertical: 14 }} />
      ) : comentarios.length === 0 ? (
        <Text style={styles.empty}>Seja o primeiro a comentar.</Text>
      ) : (
        comentarios.map((c) => (
          <TouchableOpacity
            key={c.id}
            style={styles.comment}
            activeOpacity={0.7}
            onPress={() => c.profiles?.id && router.push(`/perfil-publico/${c.profiles.id}`)}
          >
            <Avatar nome={c.profiles?.full_name} fotoUrl={c.profiles?.foto_url} verificado={c.profiles?.verificado} size={32} />
            <View style={styles.commentBody}>
              <Text style={styles.commentAuthor}>{c.profiles?.full_name}</Text>
              <Text style={styles.commentText}>{c.conteudo}</Text>
              <Text style={styles.commentMeta}>{formatarTempoRelativo(c.created_at)}</Text>
            </View>
          </TouchableOpacity>
        ))
      )}

      <View style={styles.inputRow}>
        <Avatar nome={profile?.full_name} fotoUrl={profile?.foto_url} size={32} />
        <TextInput
          style={styles.input}
          placeholder="Escreva um comentário..."
          placeholderTextColor={theme.colors.textLight}
          value={texto}
          onChangeText={setTexto}
          multiline
        />
        <TouchableOpacity style={styles.sendBtn} onPress={enviar} disabled={enviando || !texto.trim()}>
          {enviando ? <ActivityIndicator size="small" color={theme.colors.background} /> : <Feather name="send" size={14} color={theme.colors.background} />}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { backgroundColor: theme.colors.background, borderRadius: 20, padding: 16, marginTop: 10, ...theme.shadows.card },
  title: { fontFamily: theme.fonts.heading, fontSize: 14, color: theme.colors.text, marginBottom: 12 },
  empty: { color: theme.colors.textLight, fontFamily: theme.fonts.body, fontSize: 13, marginBottom: 10 },
  comment: { flexDirection: 'row', gap: 10, marginBottom: 14 },
  commentBody: { flex: 1, backgroundColor: theme.colors.surface, borderRadius: 16, padding: 12 },
  commentAuthor: { fontFamily: theme.fonts.button, fontSize: 13, color: theme.colors.text },
  commentText: { fontFamily: theme.fonts.body, fontSize: 13, color: theme.colors.text, marginTop: 4, lineHeight: 18 },
  commentMeta: { fontFamily: theme.fonts.body, fontSize: 11, color: theme.colors.textLight, marginTop: 6 },
  inputRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 10, marginTop: 8, borderTopWidth: 1, borderTopColor: theme.colors.surface, paddingTop: 16 },
  input: { flex: 1, backgroundColor: theme.colors.surface, borderRadius: 16, paddingHorizontal: 16, paddingVertical: 10, fontSize: 13, fontFamily: theme.fonts.body, color: theme.colors.text, maxHeight: 90 },
  sendBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: theme.colors.primary, justifyContent: 'center', alignItems: 'center', marginBottom: 2 },
});