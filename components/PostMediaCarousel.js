import React, { useState, useCallback } from 'react';
import { View, Image, StyleSheet, FlatList, Text } from 'react-native';
import { useVideoPlayer, VideoView } from 'expo-video';
import { Feather } from '@expo/vector-icons';
import { theme } from '../lib/theme';

const ALTURA = 240;

// Mesmo motivo do PreviaDeVideo no ComposePostModal: useVideoPlayer precisa
// de uma fonte válida sempre, então cada vídeo do carrossel vira um
// componente próprio (só monta quando o item realmente é um vídeo).
function ItemVideo({ uri }) {
  const player = useVideoPlayer(uri, (p) => { p.loop = false; });
  return <VideoView style={styles.midia} player={player} contentFit="cover" nativeControls allowsFullscreen />;
}

// Se a URL não carregar (bucket sem leitura pública, arquivo apagado etc),
// mostra um aviso em vez de deixar um retângulo branco sem explicação —
// fica claro que algo falhou no lugar de parecer que a publicação está quebrada.
function ItemImagem({ uri }) {
  const [falhou, setFalhou] = useState(false);
  if (falhou) {
    return (
      <View style={[styles.midia, styles.midiaErro]}>
        <Feather name="image" size={22} color={theme.colors.textLight} />
        <Text style={styles.midiaErroText}>Não foi possível carregar</Text>
      </View>
    );
  }
  return <Image source={{ uri }} style={styles.midia} onError={() => setFalhou(true)} />;
}

// Recebe uma lista já normalizada de { tipo: 'imagem' | 'video', url }.
// Uma imagem/vídeo só: sem carrossel, sem contador (comportamento antigo
// preservado). Várias mídias: swipe horizontal com contador "2/5".
//
// BUG CORRIGIDO: a versão anterior calculava a largura de cada página a
// partir da largura TOTAL da tela (useWindowDimensions), mas o carrossel
// fica dentro de um card com padding, dentro de uma lista com padding — a
// área visível real é bem menor que a tela inteira. Isso fazia cada página
// do FlatList ficar mais larga que o espaço visível, então a imagem
// "vazava" pra fora da área visível e o card aparecia em branco. A correção
// mede a largura de verdade do container com onLayout, e só monta a lista
// depois de saber essa largura.
export default function PostMediaCarousel({ midias }) {
  const [larguraItem, setLarguraItem] = useState(0);
  const [indice, setIndice] = useState(0);

  const medirContainer = useCallback((e) => {
    const largura = e.nativeEvent.layout.width;
    if (largura > 0 && largura !== larguraItem) setLarguraItem(largura);
  }, [larguraItem]);

  if (!midias || midias.length === 0) return null;

  if (midias.length === 1) {
    const item = midias[0];
    return (
      <View style={styles.wrap}>
        {item.tipo === 'video' ? <ItemVideo uri={item.url} /> : <ItemImagem uri={item.url} />}
      </View>
    );
  }

  return (
    <View style={styles.wrap} onLayout={medirContainer}>
      {larguraItem > 0 && (
        <FlatList
          data={midias}
          keyExtractor={(item, i) => item.id || `${item.url}-${i}`}
          horizontal
          pagingEnabled
          nestedScrollEnabled
          showsHorizontalScrollIndicator={false}
          snapToInterval={larguraItem}
          decelerationRate="fast"
          getItemLayout={(_, i) => ({ length: larguraItem, offset: larguraItem * i, index: i })}
          onMomentumScrollEnd={(e) => {
            const novoIndice = Math.round(e.nativeEvent.contentOffset.x / larguraItem);
            setIndice(novoIndice);
          }}
          renderItem={({ item }) => (
            <View style={{ width: larguraItem }}>
              {item.tipo === 'video' ? <ItemVideo uri={item.url} /> : <ItemImagem uri={item.url} />}
            </View>
          )}
        />
      )}
      <View style={styles.badgeContagem}>
        <View style={styles.badgeContagemInner}>
          <View style={styles.badgeDotRow}>
            {midias.map((_, i) => (
              <View key={i} style={[styles.pageDot, i === indice && styles.pageDotAtiva]} />
            ))}
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginBottom: 14, borderRadius: 16, overflow: 'hidden' },
  midia: { width: '100%', height: ALTURA, backgroundColor: theme.colors.surface },
  midiaErro: { justifyContent: 'center', alignItems: 'center', gap: 6 },
  midiaErroText: { fontFamily: theme.fonts.body, fontSize: 11.5, color: theme.colors.textLight },
  badgeContagem: { position: 'absolute', bottom: 10, alignSelf: 'center' },
  badgeContagemInner: { backgroundColor: 'rgba(0,0,0,0.45)', borderRadius: 100, paddingHorizontal: 8, paddingVertical: 5 },
  badgeDotRow: { flexDirection: 'row', gap: 5 },
  pageDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.5)' },
  pageDotAtiva: { backgroundColor: theme.colors.background, width: 16 },
});
