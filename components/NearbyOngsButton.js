import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal, ActivityIndicator, FlatList, Platform, Linking } from 'react-native';
import { useRouter } from 'expo-router';
import * as Location from 'expo-location';
import { Feather } from '@expo/vector-icons';
import { supabase } from '../supabase';
import { useAuth } from '../contexts/AuthContext';
import Avatar from './Avatar';
import { distanciaKm, formatarDistancia } from '../lib/geo';
import { gerarHtmlMapa } from '../lib/leafletMap';
import { theme } from '../lib/theme';

// Mapa com OpenStreetMap + Leaflet, dentro de um WebView. Diferente do
// Google Maps (react-native-maps), isso não precisa de chave de API nem de
// cartão cadastrado — é gratuito para qualquer volume de uso normal de um
// app. O WebView só roda em iOS/Android; na web usamos a lista com
// distância mais um link "Abrir no mapa" que abre o OpenStreetMap direto
// no navegador (também sem custo nenhum).
let WebView = null;
if (Platform.OS !== 'web') {
  // eslint-disable-next-line global-require
  WebView = require('react-native-webview').WebView;
}

const RAIO_BUSCA_KM = 100;

const avisar = (titulo, mensagem) => {
  if (Platform.OS === 'web') alert(`${titulo}: ${mensagem}`);
  else {
    const { Alert } = require('react-native');
    Alert.alert(titulo, mensagem);
  }
};

export default function NearbyOngsButton({ label = 'Ver ONGs perto de você' }) {
  const router = useRouter();
  const { session } = useAuth();
  const [aberto, setAberto] = useState(false);
  const [carregando, setCarregando] = useState(false);
  const [minhaPosicao, setMinhaPosicao] = useState(null);
  const [ongs, setOngs] = useState([]);
  const [erro, setErro] = useState(null);

  async function abrir() {
    setAberto(true);
    setCarregando(true);
    setErro(null);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setErro('Precisamos de acesso à sua localização para mostrar as ONGs mais perto de você.');
        return;
      }
      const posicao = await Location.getCurrentPositionAsync({});
      const minhaLat = posicao.coords.latitude;
      const minhaLng = posicao.coords.longitude;
      setMinhaPosicao({ lat: minhaLat, lng: minhaLng });

      // Só ONGs que já informaram localização (endereço geocodificado, ou
      // botão "usar minha localização atual" no perfil) entram na busca.
      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name, foto_url, verificado, bio, endereco, lat, lng')
        .eq('user_type', 'ong')
        .not('lat', 'is', null)
        .not('lng', 'is', null)
        .neq('id', session.user.id);
      if (error) throw error;

      const comDistancia = (data || [])
        .map((o) => ({ ...o, distancia: distanciaKm(minhaLat, minhaLng, o.lat, o.lng) }))
        .filter((o) => o.distancia != null && o.distancia <= RAIO_BUSCA_KM)
        .sort((a, b) => a.distancia - b.distancia);

      setOngs(comDistancia);
    } catch (err) {
      setErro(err.message || 'Não foi possível obter sua localização.');
    } finally {
      setCarregando(false);
    }
  }

  function verPerfil(id) {
    setAberto(false);
    router.push(`/perfil-publico/${id}`);
  }

  function abrirNoMapaExterno(ong) {
    // OpenStreetMap em vez de Google Maps — mesma ideia (só abre o site no
    // navegador), mas sem depender de nada do Google.
    const url = `https://www.openstreetmap.org/?mlat=${ong.lat}&mlon=${ong.lng}#map=15/${ong.lat}/${ong.lng}`;
    Linking.openURL(url).catch(() => avisar('Não foi possível abrir o mapa', 'Tente novamente mais tarde.'));
  }

  function renderConteudo() {
    if (carregando) {
      return (
        <View style={styles.centerBox}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={styles.centerText}>Buscando ONGs perto de você...</Text>
        </View>
      );
    }
    if (erro) {
      return (
        <View style={styles.centerBox}>
          <Feather name="map-pin" size={32} color={theme.colors.textLight} />
          <Text style={styles.centerText}>{erro}</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={abrir}>
            <Text style={styles.retryBtnText}>Tentar novamente</Text>
          </TouchableOpacity>
        </View>
      );
    }

    // O mapa sempre aparece assim que temos a localização de quem está
    // buscando, mesmo sem nenhuma ONG por perto — do contrário a tela fica
    // parecendo quebrada em vez de mostrar "você está aqui, mas não achamos
    // ninguém num raio de X km ainda".
    return (
      <>
        {WebView && minhaPosicao && (
          <WebView
            style={styles.map}
            originWhitelist={['*']}
            source={{
              html: gerarHtmlMapa({
                minhaLat: minhaPosicao.lat,
                minhaLng: minhaPosicao.lng,
                ongs: ongs.map((o) => ({ ...o, distanciaFormatada: formatarDistancia(o.distancia) })),
              }),
            }}
            onMessage={(event) => verPerfil(event.nativeEvent.data)}
            startInLoadingState
            renderLoading={() => (
              <View style={[styles.map, styles.mapLoading]}>
                <ActivityIndicator color={theme.colors.primary} />
              </View>
            )}
          />
        )}

        {!WebView && (
          <View style={styles.webNotice}>
            <Feather name="smartphone" size={14} color={theme.colors.textLight} />
            <Text style={styles.webNoticeText}>O mapa interativo está disponível no app mobile. Aqui na web, veja a lista ordenada por distância.</Text>
          </View>
        )}

        {ongs.length === 0 ? (
          <View style={styles.emptyBelowMap}>
            <Feather name="compass" size={26} color={theme.colors.textLight} />
            <Text style={styles.centerText}>Nenhuma ONG com localização cadastrada num raio de {RAIO_BUSCA_KM} km ainda.</Text>
            <Text style={styles.emptyHint}>
              Isso acontece porque a ONG ainda não salvou uma localização no perfil dela (endereço ou "usar minha localização atual"), não porque a busca falhou.
            </Text>
          </View>
        ) : (
          <FlatList
            data={ongs}
            keyExtractor={(item) => item.id}
            contentContainerStyle={{ padding: 16, paddingTop: 12 }}
            renderItem={({ item }) => (
              <View style={styles.ongRow}>
                <Avatar nome={item.full_name} fotoUrl={item.foto_url} verificado={item.verificado} size={44} />
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <Text style={styles.ongName} numberOfLines={1}>{item.full_name}</Text>
                  <Text style={styles.ongEndereco} numberOfLines={1}>{item.endereco || 'Endereço não informado'}</Text>
                  <View style={styles.distanciaRow}>
                    <Feather name="navigation" size={11} color={theme.colors.secondary} />
                    <Text style={styles.distanciaText}>{formatarDistancia(item.distancia)}</Text>
                  </View>
                </View>
                <View style={{ gap: 6 }}>
                  <TouchableOpacity style={styles.smallBtn} onPress={() => verPerfil(item.id)}>
                    <Text style={styles.smallBtnText}>Ver perfil</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.smallBtnOutline} onPress={() => abrirNoMapaExterno(item)}>
                    <Text style={styles.smallBtnOutlineText}>Abrir no mapa</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
          />
        )}
      </>
    );
  }

  return (
    <>
      <TouchableOpacity style={styles.button} onPress={abrir}>
        <Feather name="map-pin" size={16} color={theme.colors.secondary} />
        <Text style={styles.buttonText}>{label}</Text>
      </TouchableOpacity>

      <Modal visible={aberto} animationType="slide" onRequestClose={() => setAberto(false)}>
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>ONGs perto de você</Text>
            <TouchableOpacity style={styles.closeBtn} onPress={() => setAberto(false)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Feather name="x" size={20} color={theme.colors.text} />
            </TouchableOpacity>
          </View>
          {renderConteudo()}
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  button: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: theme.colors.successLight, borderRadius: 100, paddingVertical: 12, paddingHorizontal: 16, borderWidth: 1, borderColor: theme.colors.secondary },
  buttonText: { fontFamily: theme.fonts.button, fontSize: 13, color: theme.colors.secondary },

  modalContainer: { flex: 1, backgroundColor: theme.colors.background, paddingTop: 50 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingBottom: 16, borderBottomWidth: 1, borderBottomColor: theme.colors.border },
  modalTitle: { fontSize: 18, fontFamily: theme.fonts.heading, color: theme.colors.text },
  closeBtn: { width: 32, height: 32, borderRadius: 16, backgroundColor: theme.colors.surface, justifyContent: 'center', alignItems: 'center' },

  map: { width: '100%', height: 280 },
  mapLoading: { justifyContent: 'center', alignItems: 'center', backgroundColor: theme.colors.surface },

  webNotice: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: theme.colors.surface, padding: 12, marginHorizontal: 16, marginTop: 16, borderRadius: 12 },
  webNoticeText: { flex: 1, fontFamily: theme.fonts.body, fontSize: 12, color: theme.colors.textLight },

  ongRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: theme.colors.background, borderWidth: 1, borderColor: theme.colors.border, borderRadius: 16, padding: 12, marginBottom: 10 },
  ongName: { fontFamily: theme.fonts.button, fontSize: 14, color: theme.colors.text },
  ongEndereco: { fontFamily: theme.fonts.body, fontSize: 11.5, color: theme.colors.textLight, marginTop: 2 },
  distanciaRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 },
  distanciaText: { fontFamily: theme.fonts.button, fontSize: 11.5, color: theme.colors.secondary },

  smallBtn: { backgroundColor: theme.colors.primary, borderRadius: 10, paddingVertical: 7, paddingHorizontal: 10 },
  smallBtnText: { color: theme.colors.background, fontFamily: theme.fonts.button, fontSize: 11 },
  smallBtnOutline: { borderWidth: 1, borderColor: theme.colors.border, borderRadius: 10, paddingVertical: 7, paddingHorizontal: 10 },
  smallBtnOutlineText: { color: theme.colors.text, fontFamily: theme.fonts.button, fontSize: 11 },

  centerBox: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 30, gap: 12 },
  centerText: { textAlign: 'center', fontFamily: theme.fonts.body, color: theme.colors.textLight, fontSize: 13.5, lineHeight: 20 },
  emptyBelowMap: { alignItems: 'center', gap: 10, padding: 30 },
  emptyHint: { textAlign: 'center', fontFamily: theme.fonts.body, color: theme.colors.textLight, fontSize: 11.5, lineHeight: 17, paddingHorizontal: 10 },
  retryBtn: { backgroundColor: theme.colors.primary, paddingVertical: 10, paddingHorizontal: 20, borderRadius: theme.border.radius },
  retryBtnText: { color: theme.colors.background, fontFamily: theme.fonts.button },
});
