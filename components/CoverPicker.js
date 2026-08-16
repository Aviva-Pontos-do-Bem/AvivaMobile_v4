import React, { useState } from 'react';
import { View, Image, TouchableOpacity, ActivityIndicator, StyleSheet, Platform } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Feather } from '@expo/vector-icons';
import { enviarCapa } from '../lib/upload';
import { theme } from '../lib/theme';

const avisar = (titulo, mensagem) => {
  if (Platform.OS === 'web') alert(`${titulo}: ${mensagem}`);
  else {
    const { Alert } = require('react-native');
    Alert.alert(titulo, mensagem);
  }
};

export default function CoverPicker({ capaUrl, userId, editavel, onUploaded }) {
  const [enviando, setEnviando] = useState(false);

  async function escolherCapa() {
    const permissao = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permissao.granted) {
      avisar('Permissão necessária', 'Precisamos de acesso às suas fotos para trocar a capa.');
      return;
    }

    const resultado = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [16, 9],
      quality: 0.7,
    });

    if (resultado.canceled) return;
    const asset = resultado.assets?.[0];
    if (!asset) return;

    setEnviando(true);
    try {
      const url = await enviarCapa(asset.uri, userId);
      onUploaded(url);
    } catch (err) {
      avisar('Erro ao enviar capa', err.message || 'Tente novamente.');
    } finally {
      setEnviando(false);
    }
  }

  return (
    <View style={styles.wrap}>
      {capaUrl ? (
        <Image source={{ uri: capaUrl }} style={styles.cover} />
      ) : (
        <View style={[styles.cover, styles.placeholder]} />
      )}
      {editavel && (
        <TouchableOpacity style={styles.cameraBtn} onPress={escolherCapa} disabled={enviando}>
          {enviando ? <ActivityIndicator size="small" color={theme.colors.background} /> : <Feather name="camera" size={16} color={theme.colors.background} />}
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { width: '100%' },
  cover: { width: '100%', height: 160, backgroundColor: theme.colors.surface },
  placeholder: { backgroundColor: theme.colors.secondary },
  cameraBtn: {
    position: 'absolute', bottom: 12, right: 16,
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center',
  },
});