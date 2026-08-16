import React, { useState } from 'react';
import { View, TouchableOpacity, ActivityIndicator, StyleSheet, Platform } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Feather } from '@expo/vector-icons';
import Avatar from './Avatar';
import { enviarAvatar } from '../lib/upload';
import { theme } from '../lib/theme';

const avisar = (titulo, mensagem) => {
  if (Platform.OS === 'web') alert(`${titulo}: ${mensagem}`);
  else {
    const { Alert } = require('react-native');
    Alert.alert(titulo, mensagem);
  }
};

export default function AvatarPicker({ nome, fotoUrl, userId, size = 96, onUploaded }) {
  const [enviando, setEnviando] = useState(false);

  async function escolherFoto() {
    const permissao = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permissao.granted) {
      avisar('Permissão necessária', 'Precisamos de acesso às suas fotos para trocar o avatar.');
      return;
    }

    const resultado = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });

    if (resultado.canceled) return;
    const asset = resultado.assets?.[0];
    if (!asset) return;

    setEnviando(true);
    try {
      const url = await enviarAvatar(asset.uri, userId);
      onUploaded(url);
    } catch (err) {
      avisar('Erro ao enviar foto', err.message || 'Tente novamente.');
    } finally {
      setEnviando(false);
    }
  }

  return (
    <View style={{ width: size, height: size }}>
      <Avatar nome={nome} fotoUrl={fotoUrl} size={size} />
      <TouchableOpacity style={styles.cameraBtn} onPress={escolherFoto} disabled={enviando}>
        {enviando ? <ActivityIndicator size="small" color={theme.colors.background} /> : <Feather name="camera" size={16} color={theme.colors.background} />}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  cameraBtn: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: theme.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: theme.colors.background,
  },
});