import React from 'react';
import { View, Text, StyleSheet, ScrollView, Linking, TouchableOpacity } from 'react-native';
import { Stack } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import Constants from 'expo-constants';
import { theme } from '../lib/theme';

const ITENS = [
  {
    icone: 'users',
    titulo: 'O que é o Aviva',
    texto: 'Uma rede que conecta voluntários, ONGs e empresas em torno de ações sociais, vagas de voluntariado e doações.',
  },
  {
    icone: 'shield',
    titulo: 'Perfis públicos, com segurança',
    texto: 'Perfis de voluntários, ONGs e empresas são públicos para que todos possam se conhecer antes de interagir — mas alterar e-mail, senha ou excluir a conta sempre exige confirmar sua senha atual.',
  },
  {
    icone: 'check-circle',
    titulo: 'Verificação de ONGs e empresas',
    texto: 'O selo de verificado indica que os dados cadastrais (como CNPJ) foram conferidos pela equipe do Aviva.',
  },
  {
    icone: 'flag',
    titulo: 'Denúncias e reclamações',
    texto: 'Encontrou um perfil ou publicação suspeita? Use "Reclamações" no menu do seu perfil para nos avisar.',
  },
];

export default function Sobre() {
  return (
    <ScrollView style={styles.container} contentContainerStyle={{ padding: 20, paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
      <Stack.Screen options={{ headerShown: true, title: 'Sobre o Aviva' }} />

      <Text style={styles.appName}>Aviva</Text>
      <Text style={styles.version}>Versão {Constants.expoConfig?.version || '1.0.0'}</Text>

      {ITENS.map((item) => (
        <View key={item.titulo} style={styles.card}>
          <View style={styles.iconBox}>
            <Feather name={item.icone} size={20} color={theme.colors.primary} />
          </View>
          <View style={styles.textContent}>
            <Text style={styles.cardTitle}>{item.titulo}</Text>
            <Text style={styles.cardText}>{item.texto}</Text>
          </View>
        </View>
      ))}

      <TouchableOpacity style={styles.contactBtn} onPress={() => Linking.openURL('mailto:contato@aviva.app')}>
        <Feather name="mail" size={16} color={theme.colors.background} />
        <Text style={styles.contactText}>Fale com a equipe do Aviva</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.surface },
  appName: { fontSize: 32, fontFamily: theme.fonts.heading, color: theme.colors.primary, textAlign: 'center', marginTop: 10 },
  version: { fontSize: 13, fontFamily: theme.fonts.body, color: theme.colors.textLight, textAlign: 'center', marginBottom: 24 },
  
  card: { flexDirection: 'row', backgroundColor: theme.colors.background, borderRadius: 20, padding: 16, marginBottom: 12, ...theme.shadows.card },
  iconBox: { width: 40, height: 40, borderRadius: 12, backgroundColor: theme.colors.surface, justifyContent: 'center', alignItems: 'center' },
  textContent: { flex: 1, marginLeft: 16 },
  cardTitle: { fontFamily: theme.fonts.heading, fontSize: 15, color: theme.colors.text, marginBottom: 6 },
  cardText: { fontSize: 13, fontFamily: theme.fonts.body, color: theme.colors.textLight, lineHeight: 20 },
  
  contactBtn: { flexDirection: 'row', gap: 10, alignItems: 'center', justifyContent: 'center', marginTop: 20, padding: 16, borderRadius: 16, backgroundColor: theme.colors.primary },
  contactText: { color: theme.colors.background, fontFamily: theme.fonts.button, fontSize: 15 },
});