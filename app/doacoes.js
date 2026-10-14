import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, FlatList, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, RefreshControl, Platform, Linking } from 'react-native';
import { Stack } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { supabase } from '../supabase';
import { useAuth } from '../contexts/AuthContext';
import { theme } from '../lib/theme';
import { formatarBRL, ROTULO_STATUS_DOACAO, COR_STATUS_DOACAO } from '../lib/doacoes';
import { gerarHtmlDeclaracaoDoacao } from '../lib/declaracaoDoacao';
import { headerPadrao } from '../lib/headerPadrao';

const avisar = (titulo, mensagem) => {
  if (Platform.OS === 'web') alert(`${titulo}: ${mensagem}`);
  else {
    const { Alert } = require('react-native');
    Alert.alert(titulo, mensagem);
  }
};

function dataBR(iso) {
  const [a, m, d] = (iso || '').split('-');
  return a ? `${d}/${m}/${a}` : '';
}

export default function Doacoes() {
  const { session, userType, profile } = useAuth();
  const userId = session?.user?.id;
  const ehOng = userType === 'ong';
  const [itens, setItens] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [atualizando, setAtualizando] = useState(false);
  const [naoRecebiId, setNaoRecebiId] = useState(null);
  const [motivo, setMotivo] = useState('');
  const [trabalhandoId, setTrabalhandoId] = useState(null);

  const carregar = useCallback(async () => {
    if (!userId) return;
    const { data } = await supabase
      .from('doacoes')
      .select('id, valor, data_doacao, status, resposta_ong, comprovante_url, dedutivel, ong_id, ong:ong_id ( full_name ), doador:doador_id ( full_name )')
      .eq(ehOng ? 'ong_id' : 'doador_id', userId)
      .order('created_at', { ascending: false })
      .limit(100);
    setItens(data || []);
    setCarregando(false);
  }, [userId, ehOng]);

  useEffect(() => { carregar(); }, [carregar]);

  async function atualizar() {
    setAtualizando(true);
    await carregar();
    setAtualizando(false);
  }

  async function abrirComprovante(caminho) {
    const { data, error } = await supabase.storage.from('documentos-fiscais').createSignedUrl(caminho, 120);
    if (error) return avisar('Não foi possível abrir', 'Tente novamente em instantes.');
    if (Platform.OS === 'web') window.open(data.signedUrl, '_blank', 'noopener');
    else Linking.openURL(data.signedUrl);
  }

  async function responder(item, recebida) {
    if (!recebida && !motivo.trim()) return avisar('Conte o motivo', 'Explique por que o valor não foi localizado — o doador vai receber essa mensagem.');
    setTrabalhandoId(item.id);
    const { error } = await supabase.rpc('responder_doacao', { p_id: item.id, p_recebida: recebida, p_resposta: recebida ? null : motivo.trim() });
    setTrabalhandoId(null);
    if (error) return avisar('Erro', error.message);
    setNaoRecebiId(null);
    setMotivo('');
    carregar();
  }

  async function baixarDeclaracao(item) {
    try {
      const { data: ongPerfil } = await supabase.rpc('perfil_publico', { perfil_id: item.ong_id }).maybeSingle();
      const html = gerarHtmlDeclaracaoDoacao({
        ongNome: item.ong?.full_name,
        ongCnpj: ongPerfil?.documento || 'não informado',
        empresaNome: profile?.full_name,
        empresaCnpj: profile?.documento || 'não informado',
        valor: Number(item.valor),
        dataDoacao: item.data_doacao,
      });
      if (Platform.OS === 'web') {
        await Print.printAsync({ html });
      } else {
        const { uri } = await Print.printToFileAsync({ html });
        if (await Sharing.isAvailableAsync()) await Sharing.shareAsync(uri, { mimeType: 'application/pdf', UTI: 'com.adobe.pdf' });
      }
    } catch (err) {
      avisar('Erro ao gerar a declaração', err.message || 'Tente novamente.');
    }
  }

  function renderItem({ item }) {
    const cores = COR_STATUS_DOACAO[item.status];
    const quem = ehOng ? (item.doador?.full_name || 'Doador') : (item.ong?.full_name || 'ONG');
    const respondendo = trabalhandoId === item.id;
    return (
      <View style={styles.card}>
        <View style={styles.topo}>
          <View style={{ flex: 1 }}>
            <Text style={styles.valor}>{formatarBRL(item.valor)}</Text>
            <Text style={styles.quem}>{ehOng ? 'de' : 'para'} {quem} · {dataBR(item.data_doacao)}</Text>
          </View>
          <View style={[styles.badge, { backgroundColor: theme.colors[cores.fundo] }]}>
            <Text style={[styles.badgeTexto, { color: theme.colors[cores.texto] }]}>{ROTULO_STATUS_DOACAO[item.status]}</Text>
          </View>
        </View>

        {item.dedutivel && <Text style={styles.tag}>Doação dedutível (Lucro Real)</Text>}
        {!!item.resposta_ong && <Text style={styles.resposta}>“{item.resposta_ong}”</Text>}

        <View style={styles.acoes}>
          {!!item.comprovante_url && (
            <TouchableOpacity accessibilityRole="button" style={styles.linkBtn} onPress={() => abrirComprovante(item.comprovante_url)}>
              <Feather name="paperclip" size={14} color={theme.colors.primary} />
              <Text style={styles.linkTexto}>Ver comprovante</Text>
            </TouchableOpacity>
          )}
          {!ehOng && item.dedutivel && item.status === 'confirmada' && (
            <TouchableOpacity accessibilityRole="button" style={styles.linkBtn} onPress={() => baixarDeclaracao(item)}>
              <Feather name="file-text" size={14} color={theme.colors.primary} />
              <Text style={styles.linkTexto}>Declaração (PDF)</Text>
            </TouchableOpacity>
          )}
        </View>

        {ehOng && item.status === 'pendente' && (
          naoRecebiId === item.id ? (
            <View style={{ marginTop: 12 }}>
              <TextInput
                style={styles.input}
                placeholder="Por que não foi localizado? (o doador verá)"
                placeholderTextColor={theme.colors.textLight}
                value={motivo}
                onChangeText={setMotivo}
                maxLength={500}
                multiline
              />
              <View style={styles.linhaBotoes}>
                <TouchableOpacity accessibilityRole="button" style={[styles.btn, styles.btnErro]} onPress={() => responder(item, false)} disabled={respondendo}>
                  {respondendo ? <ActivityIndicator color={theme.colors.background} /> : <Text style={styles.btnTexto}>Enviar</Text>}
                </TouchableOpacity>
                <TouchableOpacity accessibilityRole="button" style={[styles.btn, styles.btnContorno]} onPress={() => { setNaoRecebiId(null); setMotivo(''); }}>
                  <Text style={[styles.btnTexto, { color: theme.colors.text }]}>Cancelar</Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <View style={styles.linhaBotoes}>
              <TouchableOpacity accessibilityRole="button" style={[styles.btn, styles.btnOk]} onPress={() => responder(item, true)} disabled={respondendo}>
                {respondendo ? <ActivityIndicator color={theme.colors.background} /> : <Text style={styles.btnTexto}>Recebi o valor</Text>}
              </TouchableOpacity>
              <TouchableOpacity accessibilityRole="button" style={[styles.btn, styles.btnContorno]} onPress={() => setNaoRecebiId(item.id)}>
                <Text style={[styles.btnTexto, { color: theme.colors.error }]}>Não recebi</Text>
              </TouchableOpacity>
            </View>
          )
        )}
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ ...headerPadrao, title: ehOng ? 'Doações recebidas' : 'Minhas doações' }} />
      {carregando ? (
        <ActivityIndicator style={{ marginTop: 40 }} color={theme.colors.primary} />
      ) : (
        <FlatList
          data={itens}
          keyExtractor={(i) => i.id}
          renderItem={renderItem}
          contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
          refreshControl={<RefreshControl refreshing={atualizando} onRefresh={atualizar} />}
          ListHeaderComponent={
            <Text style={styles.aviso}>
              {ehOng
                ? 'O Aviva não recebe nem repassa dinheiro. Confira o Pix na sua conta bancária e confirme aqui o que realmente chegou.'
                : 'O Pix é feito no app do seu banco, direto para a ONG. Aqui você acompanha se ela confirmou o recebimento.'}
            </Text>
          }
          ListEmptyComponent={
            <View style={styles.vazio}>
              <Feather name="heart" size={36} color={theme.colors.textLight} />
              <Text style={styles.vazioTexto}>{ehOng ? 'Nenhuma doação informada ainda.' : 'Você ainda não informou nenhuma doação.'}</Text>
            </View>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.surface },
  aviso: { fontFamily: theme.fonts.body, fontSize: 12.5, color: theme.colors.textLight, lineHeight: 18, marginBottom: 14 },
  card: { backgroundColor: theme.colors.background, borderRadius: 16, padding: 16, marginBottom: 12, ...theme.shadows.card },
  topo: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  valor: { fontFamily: theme.fonts.heading, fontSize: 18, color: theme.colors.text },
  quem: { fontFamily: theme.fonts.body, fontSize: 12.5, color: theme.colors.textLight, marginTop: 2 },
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  badgeTexto: { fontFamily: theme.fonts.button, fontSize: 11 },
  tag: { fontFamily: theme.fonts.button, fontSize: 11.5, color: theme.colors.secondary, marginTop: 8 },
  resposta: { fontFamily: theme.fonts.body, fontSize: 13, color: theme.colors.text, fontStyle: 'italic', marginTop: 8 },
  acoes: { flexDirection: 'row', gap: 16, marginTop: 10, flexWrap: 'wrap' },
  linkBtn: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  linkTexto: { fontFamily: theme.fonts.button, fontSize: 13, color: theme.colors.primary },
  linhaBotoes: { flexDirection: 'row', gap: 10, marginTop: 12 },
  btn: { flex: 1, paddingVertical: 12, borderRadius: 14, alignItems: 'center' },
  btnOk: { backgroundColor: theme.colors.success },
  btnErro: { backgroundColor: theme.colors.error },
  btnContorno: { borderWidth: 1, borderColor: theme.colors.border, backgroundColor: theme.colors.background },
  btnTexto: { fontFamily: theme.fonts.button, fontSize: 14, color: theme.colors.background },
  input: { backgroundColor: theme.colors.surface, borderWidth: 1, borderColor: theme.colors.border, borderRadius: 12, padding: 12, fontFamily: theme.fonts.body, color: theme.colors.text, minHeight: 60, textAlignVertical: 'top' },
  vazio: { alignItems: 'center', marginTop: 70, gap: 12 },
  vazioTexto: { fontFamily: theme.fonts.body, fontSize: 14, color: theme.colors.textLight },
});
