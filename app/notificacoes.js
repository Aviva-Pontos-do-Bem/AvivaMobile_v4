import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator, RefreshControl } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { supabase } from '../supabase';
import { useAuth } from '../contexts/AuthContext';
import { theme } from '../lib/theme';
import { iconePorTipo, tempoRelativo } from '../lib/notificacoes';
import { headerPadrao } from '../lib/headerPadrao';

export default function Notificacoes() {
  const { session } = useAuth();
  const router = useRouter();
  const userId = session?.user?.id;
  const [itens, setItens] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [atualizando, setAtualizando] = useState(false);

  const carregar = useCallback(async () => {
    if (!userId) return;
    const { data } = await supabase
      .from('notificacoes')
      .select('id, tipo, titulo, mensagem, link, lida, created_at')
      .eq('usuario_id', userId)
      .order('created_at', { ascending: false })
      .limit(50);
    setItens(data || []);
    setCarregando(false);
  }, [userId]);

  useEffect(() => { carregar(); }, [carregar]);

  async function atualizar() {
    setAtualizando(true);
    await carregar();
    setAtualizando(false);
  }

  async function abrir(item) {
    if (!item.lida) {
      setItens((lista) => lista.map((n) => (n.id === item.id ? { ...n, lida: true } : n)));
      await supabase.from('notificacoes').update({ lida: true }).eq('id', item.id);
    }
    if (item.link) router.push(item.link);
  }

  async function marcarTodasComoLidas() {
    setItens((lista) => lista.map((n) => ({ ...n, lida: true })));
    await supabase.from('notificacoes').update({ lida: true }).eq('usuario_id', userId).eq('lida', false);
  }

  const temNaoLidas = itens.some((n) => !n.lida);

  function renderItem({ item }) {
    const icone = iconePorTipo(item.tipo);
    const cor = theme.colors[icone.cor] || theme.colors.primary;
    return (
      <TouchableOpacity
        accessibilityRole="button"
        accessibilityLabel={`${item.lida ? '' : 'Não lida. '}${item.titulo}. ${item.mensagem || ''}`}
        style={[styles.card, !item.lida && styles.cardNaoLida]}
        onPress={() => abrir(item)}
      >
        <View style={[styles.iconBox, { backgroundColor: `${cor}22` }]}>
          <Feather name={icone.nome} size={20} color={cor} />
        </View>
        <View style={styles.texto}>
          <Text style={styles.titulo}>{item.titulo}</Text>
          {!!item.mensagem && <Text style={styles.mensagem}>{item.mensagem}</Text>}
          <Text style={styles.tempo}>{tempoRelativo(item.created_at)}</Text>
        </View>
        {!item.lida && <View style={styles.ponto} />}
      </TouchableOpacity>
    );
  }

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ ...headerPadrao, title: 'Notificações' }} />
      {carregando ? (
        <ActivityIndicator style={{ marginTop: 40 }} color={theme.colors.primary} />
      ) : (
        <FlatList
          data={itens}
          keyExtractor={(n) => n.id}
          renderItem={renderItem}
          contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
          refreshControl={<RefreshControl refreshing={atualizando} onRefresh={atualizar} />}
          ListHeaderComponent={
            temNaoLidas ? (
              <TouchableOpacity accessibilityRole="button" onPress={marcarTodasComoLidas} style={styles.marcarTodas}>
                <Text style={styles.marcarTodasTexto}>Marcar todas como lidas</Text>
              </TouchableOpacity>
            ) : null
          }
          ListEmptyComponent={
            <View style={styles.vazio}>
              <Feather name="bell-off" size={36} color={theme.colors.textLight} />
              <Text style={styles.vazioTexto}>Nenhuma notificação por enquanto.</Text>
            </View>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.surface },
  card: { flexDirection: 'row', alignItems: 'center', backgroundColor: theme.colors.background, borderRadius: 16, padding: 14, marginBottom: 10, ...theme.shadows.card },
  cardNaoLida: { borderLeftWidth: 4, borderLeftColor: theme.colors.secondary },
  iconBox: { width: 40, height: 40, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  texto: { flex: 1, marginLeft: 12 },
  titulo: { fontFamily: theme.fonts.heading, fontSize: 14, color: theme.colors.text },
  mensagem: { fontFamily: theme.fonts.body, fontSize: 13, color: theme.colors.textLight, marginTop: 2, lineHeight: 18 },
  tempo: { fontFamily: theme.fonts.body, fontSize: 11, color: theme.colors.textLight, marginTop: 4 },
  ponto: { width: 10, height: 10, borderRadius: 5, backgroundColor: theme.colors.secondary, marginLeft: 8 },
  marcarTodas: { alignSelf: 'flex-end', paddingVertical: 6, paddingHorizontal: 4, marginBottom: 8 },
  marcarTodasTexto: { fontFamily: theme.fonts.button, fontSize: 13, color: theme.colors.primary },
  vazio: { alignItems: 'center', marginTop: 80, gap: 12 },
  vazioTexto: { fontFamily: theme.fonts.body, fontSize: 14, color: theme.colors.textLight },
});
