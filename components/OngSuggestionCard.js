import React, { useState } from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet, ActivityIndicator, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { supabase } from '../supabase';
import { useAuth } from '../contexts/AuthContext';
import { theme } from '../lib/theme';

const avisar = (titulo, mensagem) => {
  if (Platform.OS === 'web') alert(`${titulo}: ${mensagem}`);
  else {
    const { Alert } = require('react-native');
    Alert.alert(titulo, mensagem);
  }
};

// Card no estilo do wireframe "Parcerias Sugeridas": capa, selo de %match,
// categoria, descrição curta e dois botões (Mais detalhes / Conectar-se).
// "Conectar-se" reaproveita a tabela seguidores que já existe no app (a
// mesma usada no botão "Seguir" do perfil público), então uma conexão feita
// aqui já aparece lá, e vice-versa.
export default function OngSuggestionCard({ ong, match, categoria }) {
  const router = useRouter();
  const { session } = useAuth();
  const [jaConectado, setJaConectado] = useState(!!ong.jaSegue);
  const [conectando, setConectando] = useState(false);

  async function conectar() {
    if (jaConectado || conectando) return;
    setConectando(true);
    const { error } = await supabase.from('seguidores').insert({ seguidor_id: session.user.id, seguido_id: ong.id });
    setConectando(false);
    if (error) return avisar('Não foi possível conectar', error.message);
    setJaConectado(true);
  }

  return (
    <View style={styles.card}>
      <View style={styles.cover}>
        {ong.foto_url ? (
          <Image source={{ uri: ong.foto_url }} style={styles.coverImg} />
        ) : (
          <View style={styles.coverPlaceholder}>
            <Feather name="image" size={28} color={theme.colors.border} />
          </View>
        )}
        {match != null && (
          <View style={styles.matchBadge}>
            <Text style={styles.matchBadgeText}>{match}% Match</Text>
          </View>
        )}
      </View>

      <View style={styles.body}>
        <View style={styles.nameRow}>
          <Text style={styles.name} numberOfLines={1}>{ong.full_name}</Text>
          {ong.verificado && <Feather name="check-circle" size={13} color={theme.colors.success} style={{ marginLeft: 4 }} />}
        </View>

        {!!categoria && <Text style={styles.categoria}>{categoria}</Text>}
        {!!ong.bio && <Text style={styles.desc} numberOfLines={2}>{ong.bio}</Text>}

        {!!ong.endereco && (
          <View style={styles.locationRow}>
            <Feather name="map-pin" size={12} color={theme.colors.textLight} />
            <Text style={styles.locationText} numberOfLines={1}>{ong.endereco}</Text>
          </View>
        )}

        <View style={styles.btnRow}>
          <TouchableOpacity style={styles.detailsBtn} onPress={() => router.push(`/perfil-publico/${ong.id}`)}>
            <Text style={styles.detailsBtnText}>Mais detalhes</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.connectBtn, jaConectado && styles.connectBtnDone]}
            onPress={conectar}
            disabled={jaConectado || conectando}
          >
            {conectando ? (
              <ActivityIndicator size="small" color={theme.colors.background} />
            ) : (
              <Text style={styles.connectBtnText}>{jaConectado ? 'Conectado' : 'Conectar-se'}</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { width: 220, backgroundColor: theme.colors.background, borderRadius: 18, borderWidth: 1, borderColor: theme.colors.border, overflow: 'hidden', ...theme.shadows.card },
  cover: { height: 92, backgroundColor: theme.colors.surface },
  coverImg: { width: '100%', height: '100%' },
  coverPlaceholder: { flex: 1, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: theme.colors.border, borderStyle: 'dashed', margin: 8, borderRadius: 10 },
  matchBadge: { position: 'absolute', top: 8, right: 8, backgroundColor: theme.colors.success, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 100 },
  matchBadgeText: { color: theme.colors.background, fontFamily: theme.fonts.button, fontSize: 10.5 },

  body: { padding: 12 },
  nameRow: { flexDirection: 'row', alignItems: 'center' },
  name: { fontFamily: theme.fonts.heading, fontSize: 13.5, color: theme.colors.text, flexShrink: 1 },
  categoria: { fontFamily: theme.fonts.body, fontSize: 11.5, color: theme.colors.textLight, marginTop: 2 },
  desc: { fontFamily: theme.fonts.body, fontSize: 11.5, color: theme.colors.text, marginTop: 6, lineHeight: 16 },

  locationRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 8 },
  locationText: { fontSize: 10.5, fontFamily: theme.fonts.body, color: theme.colors.textLight, flexShrink: 1 },

  btnRow: { flexDirection: 'row', gap: 6, marginTop: 10 },
  detailsBtn: { flex: 1, borderWidth: 1, borderColor: theme.colors.border, borderRadius: 10, paddingVertical: 8, alignItems: 'center' },
  detailsBtnText: { fontFamily: theme.fonts.button, fontSize: 10.5, color: theme.colors.text },
  connectBtn: { flex: 1, backgroundColor: theme.colors.secondary, borderRadius: 10, paddingVertical: 8, alignItems: 'center' },
  connectBtnDone: { backgroundColor: theme.colors.border },
  connectBtnText: { fontFamily: theme.fonts.button, fontSize: 10.5, color: theme.colors.background },
});
