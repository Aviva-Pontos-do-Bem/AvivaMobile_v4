import React from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { theme } from '../lib/theme';

function iniciais(nome) {
  if (!nome) return '?';
  const partes = nome.trim().split(/\s+/);
  const letras = partes.length > 1 ? partes[0][0] + partes[partes.length - 1][0] : partes[0][0];
  return letras.toUpperCase();
}

export default function Avatar({ nome, fotoUrl, size = 44, verificado = false }) {
  return (
    <View style={{ width: size, height: size }}>
      {fotoUrl ? (
        <Image source={{ uri: fotoUrl }} style={[styles.img, { width: size, height: size, borderRadius: size / 2 }]} />
      ) : (
        <View style={[styles.placeholder, { width: size, height: size, borderRadius: size / 2 }]}>
          <Text style={[styles.iniciais, { fontSize: size * 0.38 }]}>{iniciais(nome)}</Text>
        </View>
      )}
      {verificado && (
        <View style={[styles.badge, { right: -2, bottom: -2 }]}>
          <Feather name="check" size={size * 0.24} color={theme.colors.background} />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  img: { backgroundColor: theme.colors.border },
  placeholder: { backgroundColor: theme.colors.primary, justifyContent: 'center', alignItems: 'center' },
  iniciais: { color: theme.colors.background, fontFamily: theme.fonts.heading },
  badge: {
    position: 'absolute',
    backgroundColor: theme.colors.success,
    borderRadius: 100,
    width: 18,
    height: 18,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: theme.colors.background,
  },
});