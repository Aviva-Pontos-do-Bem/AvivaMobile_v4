import React, { useState } from 'react';
import {
  Modal, View, Text, TextInput, TouchableOpacity, StyleSheet, Image,
  ActivityIndicator, Platform, KeyboardAvoidingView, ScrollView,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import { useVideoPlayer, VideoView } from 'expo-video';
import { Feather } from '@expo/vector-icons';
import { supabase } from '../supabase';
import { useAuth } from '../contexts/AuthContext';
import { enviarMidiaPost } from '../lib/upload';
import Avatar from './Avatar';
import { theme } from '../lib/theme';

// Limites da publicação: dá pra soltar bastante coisa junto (álbum de um
// evento, por exemplo) sem deixar o upload lento ou a tela poluída.
const MAX_IMAGENS = 10;
const MAX_VIDEOS = 3;

const avisar = (titulo, mensagem) => {
  if (Platform.OS === 'web') alert(`${titulo}: ${mensagem}`);
  else {
    const { Alert } = require('react-native');
    Alert.alert(titulo, mensagem);
  }
};

// Miniatura de vídeo na grade de anexos — precisa do próprio player porque
// (mesmo motivo do resto do app) useVideoPlayer só pode rodar com uma fonte
// de verdade, então cada miniatura de vídeo é seu próprio componente.
function MiniaturaVideo({ uri }) {
  const player = useVideoPlayer(uri, (p) => {
    p.loop = true;
    p.muted = true;
    p.play();
  });
  return <VideoView style={styles.thumbMidia} player={player} contentFit="cover" nativeControls={false} />;
}

export default function ComposePostModal({ visivel, onFechar, onPublicado }) {
  const { session, fullName, profile } = useAuth();
  const [texto, setTexto] = useState('');
  const [midias, setMidias] = useState([]); // [{ id, uri, tipo: 'imagem' | 'video' }]
  const [visibilidade, setVisibilidade] = useState('publico');
  const [localizacao, setLocalizacao] = useState(null); // { nome, lat, lng }
  const [buscandoLocalizacao, setBuscandoLocalizacao] = useState(false);
  const [publicando, setPublicando] = useState(false);

  const totalImagens = midias.filter((m) => m.tipo === 'imagem').length;
  const totalVideos = midias.filter((m) => m.tipo === 'video').length;

  function limparEstado() {
    setTexto('');
    setMidias([]);
    setLocalizacao(null);
    setVisibilidade('publico');
  }

  function removerMidia(id) {
    setMidias((atual) => atual.filter((m) => m.id !== id));
  }

  async function escolherImagens() {
    if (totalImagens >= MAX_IMAGENS) return avisar('Limite atingido', `Você pode anexar até ${MAX_IMAGENS} fotos por publicação.`);
    const permissao = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permissao.granted) return avisar('Permissão necessária', 'Precisamos de acesso às suas fotos.');

    const resultado = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.7,
      allowsMultipleSelection: true,
      selectionLimit: MAX_IMAGENS - totalImagens,
    });
    if (resultado.canceled || !resultado.assets?.length) return;

    const novas = resultado.assets
      .slice(0, MAX_IMAGENS - totalImagens)
      .map((asset, i) => ({ id: `img-${Date.now()}-${i}`, uri: asset.uri, tipo: 'imagem' }));
    setMidias((atual) => [...atual, ...novas]);
  }

  async function escolherVideos() {
    if (totalVideos >= MAX_VIDEOS) return avisar('Limite atingido', `Você pode anexar até ${MAX_VIDEOS} vídeos por publicação.`);
    const permissao = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permissao.granted) return avisar('Permissão necessária', 'Precisamos de acesso aos seus vídeos.');

    const resultado = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['videos'],
      quality: 0.7,
      videoMaxDuration: 90,
      allowsMultipleSelection: true,
      selectionLimit: MAX_VIDEOS - totalVideos,
    });
    if (resultado.canceled || !resultado.assets?.length) return;

    const novas = resultado.assets
      .slice(0, MAX_VIDEOS - totalVideos)
      .map((asset, i) => ({ id: `vid-${Date.now()}-${i}`, uri: asset.uri, tipo: 'video' }));
    setMidias((atual) => [...atual, ...novas]);
  }

  async function adicionarLocalizacao() {
    if (localizacao) return setLocalizacao(null);
    setBuscandoLocalizacao(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        avisar('Permissão necessária', 'Precisamos de acesso à sua localização.');
        return;
      }
      const posicao = await Location.getCurrentPositionAsync({});
      let nome = 'Localização atual';
      try {
        const [endereco] = await Location.reverseGeocodeAsync({
          latitude: posicao.coords.latitude,
          longitude: posicao.coords.longitude,
        });
        if (endereco) nome = [endereco.city || endereco.subregion, endereco.region].filter(Boolean).join(', ') || nome;
      } catch (err) {
        // Se o geocode reverso falhar, ainda assim guardamos as coordenadas.
      }
      setLocalizacao({ nome, lat: posicao.coords.latitude, lng: posicao.coords.longitude });
    } catch (err) {
      avisar('Erro ao obter localização', err.message || 'Tente novamente.');
    } finally {
      setBuscandoLocalizacao(false);
    }
  }

  async function publicar() {
    if (!texto.trim() && midias.length === 0) {
      return avisar('Escreva algo', 'Conte o que você quer compartilhar, ou adicione fotos ou vídeos.');
    }
    setPublicando(true);
    try {
      // Sobe cada mídia para o Storage e guarda a URL pública na mesma ordem
      // em que a pessoa anexou — um upload por vez, de propósito: em conexão
      // ruim, é melhor ir enchendo a barra devagar do que travar tudo com
      // várias requisições grandes ao mesmo tempo.
      const midiasEnviadas = [];
      for (let i = 0; i < midias.length; i += 1) {
        const m = midias[i];
        const url = await enviarMidiaPost(m.uri, session.user.id, m.tipo, i);
        midiasEnviadas.push({ tipo: m.tipo, url, ordem: i });
      }

      const primeiraImagem = midiasEnviadas.find((m) => m.tipo === 'imagem');
      const primeiroVideo = midiasEnviadas.find((m) => m.tipo === 'video');

      const { data: postCriado, error } = await supabase
        .from('posts')
        .insert({
          autor_id: session.user.id,
          conteudo: texto.trim(),
          // Colunas antigas continuam preenchidas com a 1ª imagem/vídeo, só
          // como capa de compatibilidade — quem renderiza o post usa
          // post_midia para ver a publicação completa.
          imagem_url: primeiraImagem?.url || null,
          video_url: primeiroVideo?.url || null,
          localizacao_nome: localizacao?.nome || null,
          localizacao_lat: localizacao?.lat ?? null,
          localizacao_lng: localizacao?.lng ?? null,
          visibilidade,
        })
        .select('id')
        .single();
      if (error) throw error;

      if (midiasEnviadas.length > 0) {
        const linhas = midiasEnviadas.map((m) => ({ post_id: postCriado.id, tipo: m.tipo, url: m.url, ordem: m.ordem }));
        const { error: erroMidia } = await supabase.from('post_midia').insert(linhas);
        if (erroMidia) throw erroMidia;
      }

      limparEstado();
      onPublicado?.();
      onFechar();
    } catch (err) {
      avisar('Erro ao publicar', err.message || 'Tente novamente.');
    } finally {
      setPublicando(false);
    }
  }

  const podePublicar = !publicando && (texto.trim() || midias.length > 0);

  return (
    <Modal visible={visivel} animationType="slide" transparent onRequestClose={onFechar}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.backdrop}>
        <View style={styles.card}>
          <View style={styles.header}>
            <View style={{ width: 32 }} />
            <Text style={styles.title}>Criar publicação</Text>
            <TouchableOpacity style={styles.closeBtn} onPress={onFechar} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Feather name="x" size={20} color={theme.colors.textLight} />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
            <View style={styles.authorRow}>
              <Avatar nome={fullName} fotoUrl={profile?.foto_url} size={44} />
              <View style={{ marginLeft: 12, flex: 1 }}>
                <Text style={styles.author}>{fullName}</Text>
                <View style={styles.chipsRow}>
                  <TouchableOpacity style={styles.publicPill} onPress={() => setVisibilidade((v) => (v === 'publico' ? 'seguidores' : 'publico'))}>
                    <Feather name={visibilidade === 'publico' ? 'globe' : 'lock'} size={11} color={theme.colors.textLight} />
                    <Text style={styles.publicPillText}>{visibilidade === 'publico' ? 'Público' : 'Seguidores'}</Text>
                    <Feather name="chevron-down" size={11} color={theme.colors.textLight} />
                  </TouchableOpacity>
                  {localizacao && (
                    <View style={styles.locationInline}>
                      <Feather name="map-pin" size={12} color={theme.colors.secondary} />
                      <Text style={styles.locationInlineText} numberOfLines={1}>em {localizacao.nome}</Text>
                      <TouchableOpacity onPress={() => setLocalizacao(null)} hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}>
                        <Feather name="x" size={12} color={theme.colors.textLight} />
                      </TouchableOpacity>
                    </View>
                  )}
                </View>
              </View>
            </View>

            <TextInput
              style={styles.textInput}
              placeholder={`No que você está pensando, ${fullName?.split(' ')[0] || ''}?`}
              placeholderTextColor={theme.colors.textLight}
              multiline
              numberOfLines={5}
              value={texto}
              onChangeText={setTexto}
              autoFocus
            />

            {midias.length > 0 && (
              <View style={styles.grid}>
                {midias.map((m) => (
                  <View key={m.id} style={styles.thumbWrap}>
                    {m.tipo === 'video' ? (
                      <>
                        <MiniaturaVideo uri={m.uri} />
                        <View style={styles.playBadge}>
                          <Feather name="play" size={12} color={theme.colors.background} />
                        </View>
                      </>
                    ) : (
                      <Image source={{ uri: m.uri }} style={styles.thumbMidia} />
                    )}
                    <TouchableOpacity style={styles.removeImg} onPress={() => removerMidia(m.id)}>
                      <Feather name="x" size={14} color={theme.colors.background} />
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            )}
          </ScrollView>

          <View style={styles.attachBar}>
            <Text style={styles.attachBarLabel}>
              Adicionar à publicação{midias.length > 0 ? ` (${midias.length})` : ''}
            </Text>
            <View style={styles.attachIcons}>
              <TouchableOpacity style={styles.iconCircle} onPress={escolherImagens}>
                <Feather name="image" size={19} color="#2FA84F" />
              </TouchableOpacity>
              <TouchableOpacity style={styles.iconCircle} onPress={escolherVideos}>
                <Feather name="video" size={19} color="#1877F2" />
              </TouchableOpacity>
              <TouchableOpacity style={styles.iconCircle} onPress={adicionarLocalizacao} disabled={buscandoLocalizacao}>
                {buscandoLocalizacao ? (
                  <ActivityIndicator size="small" color={theme.colors.error} />
                ) : (
                  <Feather name="map-pin" size={19} color={localizacao ? theme.colors.secondary : '#E0524D'} />
                )}
              </TouchableOpacity>
            </View>
          </View>

          <TouchableOpacity style={[styles.publishBtn, !podePublicar && styles.publishBtnDisabled]} onPress={publicar} disabled={!podePublicar}>
            {publicando ? <ActivityIndicator color={theme.colors.background} /> : <Text style={styles.publishBtnText}>Publicar</Text>}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  card: { backgroundColor: theme.colors.background, borderTopLeftRadius: 28, borderTopRightRadius: 28, paddingTop: 16, paddingHorizontal: 20, paddingBottom: 20, maxHeight: '92%' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14, paddingBottom: 14, borderBottomWidth: 1, borderBottomColor: theme.colors.border },
  title: { fontSize: 16, fontFamily: theme.fonts.heading, color: theme.colors.text },
  closeBtn: { width: 32, height: 32, borderRadius: 16, backgroundColor: theme.colors.surface, justifyContent: 'center', alignItems: 'center' },
  authorRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 14 },
  author: { fontSize: 15, fontFamily: theme.fonts.heading, color: theme.colors.text },
  publicPill: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: theme.colors.surface, borderRadius: 10, paddingHorizontal: 8, paddingVertical: 3 },
  publicPillText: { fontSize: 11.5, fontFamily: theme.fonts.button, color: theme.colors.textLight },
  chipsRow: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 8, marginTop: 4 },
  locationInline: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  locationInlineText: { fontSize: 12.5, fontFamily: theme.fonts.body, color: theme.colors.secondary, flexShrink: 1 },
  textInput: { minHeight: 100, maxHeight: 220, textAlignVertical: 'top', fontFamily: theme.fonts.body, fontSize: 17, color: theme.colors.text, paddingBottom: 10 },

  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 8, marginBottom: 4 },
  thumbWrap: { width: '31.5%', aspectRatio: 1, borderRadius: 14, overflow: 'hidden', backgroundColor: theme.colors.surface },
  thumbMidia: { width: '100%', height: '100%' },
  playBadge: { position: 'absolute', top: '50%', left: '50%', marginTop: -14, marginLeft: -14, width: 28, height: 28, borderRadius: 14, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'center', alignItems: 'center' },
  removeImg: { position: 'absolute', top: 6, right: 6, backgroundColor: 'rgba(0,0,0,0.6)', borderRadius: 14, width: 24, height: 24, justifyContent: 'center', alignItems: 'center' },

  attachBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderWidth: 1, borderColor: theme.colors.border, borderRadius: 16, paddingVertical: 10, paddingHorizontal: 14, marginTop: 14 },
  attachBarLabel: { fontFamily: theme.fonts.button, fontSize: 13, color: theme.colors.text },
  attachIcons: { flexDirection: 'row', gap: 8 },
  iconCircle: { width: 34, height: 34, borderRadius: 17, backgroundColor: theme.colors.surface, justifyContent: 'center', alignItems: 'center' },
  publishBtn: { backgroundColor: theme.colors.primary, padding: 16, borderRadius: 16, alignItems: 'center', marginTop: 16 },
  publishBtnDisabled: { backgroundColor: theme.colors.border },
  publishBtnText: { color: theme.colors.background, fontFamily: theme.fonts.button, fontSize: 15 },
});
