import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Platform, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { supabase } from '../supabase';
import { formatarDataEvento } from '../lib/format';
import { theme } from '../lib/theme';

const avisar = (titulo, mensagem) => {
  if (Platform.OS === 'web') alert(`${titulo}: ${mensagem}`);
  else {
    const { Alert } = require('react-native');
    Alert.alert(titulo, mensagem);
  }
};

// Usado em dois lugares: no perfil da própria ONG (com botões de editar,
// pausar e excluir) e no perfil público dela, visto por voluntários/outras
// ONGs/empresas (só leitura — RLS já filtra vagas "só seguidores" para quem
// não segue essa ONG). `podeGerenciar` é a única diferença entre os dois.
export default function MinhasVagasList({ ongId, podeGerenciar }) {
  const router = useRouter();
  const [vagas, setVagas] = useState([]);
  const [loading, setLoading] = useState(true);

  const carregar = useCallback(async () => {
    const { data } = await supabase
      .from('vagas')
      .select('id, titulo, categoria, imagem_url, data_hora, vagas_disponiveis, ativa, visibilidade')
      .eq('ong_id', ongId)
      .order('created_at', { ascending: false });
    setVagas(data || []);
  }, [ongId]);

  useEffect(() => {
    setLoading(true);
    carregar().finally(() => setLoading(false));
  }, [carregar]);

  function confirmarExclusao(vaga) {
    const excluir = async () => {
      const { error } = await supabase.from('vagas').delete().eq('id', vaga.id);
      if (error) return avisar('Erro ao excluir', error.message);
      setVagas((atual) => atual.filter((v) => v.id !== vaga.id));
    };
    if (Platform.OS === 'web') {
      if (window.confirm(`Excluir a vaga "${vaga.titulo}"? Essa ação não pode ser desfeita.`)) excluir();
      return;
    }
    const { Alert } = require('react-native');
    Alert.alert('Excluir vaga', `Excluir "${vaga.titulo}"? Essa ação não pode ser desfeita.`, [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Excluir', style: 'destructive', onPress: excluir },
    ]);
  }

  async function alternarAtiva(vaga) {
    const { error } = await supabase.from('vagas').update({ ativa: !vaga.ativa }).eq('id', vaga.id);
    if (error) return avisar('Erro', error.message);
    setVagas((atual) => atual.map((v) => (v.id === vaga.id ? { ...v, ativa: !v.ativa } : v)));
  }

  if (loading) return <ActivityIndicator color={theme.colors.primary} style={{ marginVertical: 20 }} />;

  if (vagas.length === 0) {
    return (
      <Text style={styles.emptyText}>
        {podeGerenciar ? 'Você ainda não criou nenhuma vaga.' : 'Nenhuma vaga publicada ainda.'}
      </Text>
    );
  }

  return (
    <View>
      {vagas.map((vaga) => (
        <TouchableOpacity
          key={vaga.id}
          style={styles.card}
          activeOpacity={0.85}
          onPress={() => router.push(`/vaga/${vaga.id}`)}
        >
          {vaga.imagem_url ? (
            <Image source={{ uri: vaga.imagem_url }} style={styles.thumb} />
          ) : (
            <View style={[styles.thumb, styles.thumbFallback]}>
              <Feather name="briefcase" size={18} color={theme.colors.textLight} />
            </View>
          )}

          <View style={{ flex: 1, marginLeft: 12 }}>
            <Text style={styles.title} numberOfLines={1}>{vaga.titulo}</Text>
            <Text style={styles.sub} numberOfLines={1}>
              {vaga.categoria} • {vaga.data_hora ? formatarDataEvento(vaga.data_hora) : 'Sem data'}
            </Text>
            <View style={styles.badgeRow}>
              <View style={[styles.badge, vaga.ativa ? styles.badgeAtiva : styles.badgeInativa]}>
                <Text style={[styles.badgeText, vaga.ativa ? styles.badgeTextAtiva : styles.badgeTextInativa]}>
                  {vaga.ativa ? 'Ativa' : 'Pausada'}
                </Text>
              </View>
              {vaga.visibilidade === 'seguidores' && (
                <View style={styles.badge}>
                  <Feather name="lock" size={10} color={theme.colors.textLight} />
                  <Text style={[styles.badgeText, { color: theme.colors.textLight }]}> Seguidores</Text>
                </View>
              )}
            </View>
          </View>

          {podeGerenciar && (
            <View style={styles.actions}>
              <TouchableOpacity style={styles.actionIcon} onPress={() => router.push(`/criar-vaga?id=${vaga.id}`)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                <Feather name="edit-2" size={16} color={theme.colors.primary} />
              </TouchableOpacity>
              <TouchableOpacity style={styles.actionIcon} onPress={() => alternarAtiva(vaga)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                <Feather name={vaga.ativa ? 'pause-circle' : 'play-circle'} size={16} color={theme.colors.warning} />
              </TouchableOpacity>
              <TouchableOpacity style={styles.actionIcon} onPress={() => confirmarExclusao(vaga)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                <Feather name="trash-2" size={16} color={theme.colors.error} />
              </TouchableOpacity>
            </View>
          )}
        </TouchableOpacity>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  emptyText: { color: theme.colors.textLight, fontFamily: theme.fonts.body, fontSize: 13 },
  card: { flexDirection: 'row', alignItems: 'center', backgroundColor: theme.colors.surface, borderRadius: 16, padding: 10, marginBottom: 10 },
  thumb: { width: 52, height: 52, borderRadius: 12, backgroundColor: theme.colors.border },
  thumbFallback: { justifyContent: 'center', alignItems: 'center' },
  title: { fontFamily: theme.fonts.button, fontSize: 13.5, color: theme.colors.text },
  sub: { fontFamily: theme.fonts.body, fontSize: 11.5, color: theme.colors.textLight, marginTop: 2 },
  badgeRow: { flexDirection: 'row', gap: 6, marginTop: 6 },
  badge: { flexDirection: 'row', alignItems: 'center', backgroundColor: theme.colors.background, borderRadius: 100, paddingHorizontal: 8, paddingVertical: 3 },
  badgeAtiva: { backgroundColor: theme.colors.successLight },
  badgeInativa: { backgroundColor: theme.colors.background },
  badgeText: { fontFamily: theme.fonts.button, fontSize: 10 },
  badgeTextAtiva: { color: theme.colors.success },
  badgeTextInativa: { color: theme.colors.textLight },
  actions: { flexDirection: 'row', gap: 4, marginLeft: 6 },
  actionIcon: { width: 30, height: 30, borderRadius: 15, backgroundColor: theme.colors.background, justifyContent: 'center', alignItems: 'center' },
});
