import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Platform, ActivityIndicator } from 'react-native';
import { Stack, useRouter } from 'expo-router';
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

const CATEGORIAS = [
  { id: 'perfil_falso', label: 'Perfil falso ou enganoso' },
  { id: 'conteudo_impróprio', label: 'Conteúdo impróprio' },
  { id: 'golpe', label: 'Golpe ou fraude' },
  { id: 'problema_tecnico', label: 'Problema técnico' },
  { id: 'outro', label: 'Outro assunto' },
];

export default function Reclamacoes() {
  const { session } = useAuth();
  const router = useRouter();
  const [categoria, setCategoria] = useState(CATEGORIAS[0].id);
  const [assunto, setAssunto] = useState('');
  const [descricao, setDescricao] = useState('');
  const [enviando, setEnviando] = useState(false);

  async function enviar() {
    if (!assunto.trim() || !descricao.trim()) return avisar('Preencha tudo', 'Escreva um assunto e uma descrição.');
    setEnviando(true);
    const { error } = await supabase.from('reclamacoes').insert({
      autor_id: session.user.id, categoria, assunto: assunto.trim(), descricao: descricao.trim(),
    });
    setEnviando(false);
    if (error) return avisar('Não foi possível enviar', error.message);

    avisar('Reclamação enviada', 'Nossa equipe vai analisar o seu relato. Obrigado por ajudar a manter o Aviva seguro.');
    setAssunto(''); setDescricao(''); router.back();
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ padding: 20, paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
      <Stack.Screen options={{ headerShown: true, title: 'Central de Ajuda' }} />

      <Text style={styles.intro}>
        Encontrou algo errado — um perfil falso, conteúdo impróprio ou um problema no app? Conte para a gente aqui.
      </Text>

      <Text style={styles.label}>Categoria da Ajuda</Text>
      <View style={styles.chipsRow}>
        {CATEGORIAS.map((c) => (
          <TouchableOpacity key={c.id} style={[styles.chip, categoria === c.id && styles.chipActive]} onPress={() => setCategoria(c.id)}>
            <Text style={[styles.chipText, categoria === c.id && styles.chipTextActive]}>{c.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={styles.label}>Assunto</Text>
      <TextInput style={styles.input} value={assunto} onChangeText={setAssunto} placeholder="Resuma em poucas palavras" placeholderTextColor={theme.colors.textLight} />

      <Text style={styles.label}>Descrição detalhada</Text>
      <TextInput
        style={[styles.input, styles.textArea]}
        value={descricao}
        onChangeText={setDescricao}
        placeholder="Explique o que aconteceu, com o máximo de detalhes possível"
        placeholderTextColor={theme.colors.textLight}
        multiline
        numberOfLines={6}
      />

      <TouchableOpacity style={styles.submitBtn} onPress={enviar} disabled={enviando}>
        {enviando ? <ActivityIndicator color={theme.colors.background} /> : (
          <>
            <Feather name="send" size={16} color={theme.colors.background} />
            <Text style={styles.submitBtnText}>Enviar relatório</Text>
          </>
        )}
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.surface },
  intro: { color: theme.colors.textLight, fontFamily: theme.fonts.body, fontSize: 14, lineHeight: 22, marginBottom: 20 },
  label: { fontSize: 13, fontFamily: theme.fonts.button, color: theme.colors.textLight, marginTop: 16, marginBottom: 10 },
  
  chipsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  chip: { paddingVertical: 10, paddingHorizontal: 16, borderRadius: 100, backgroundColor: theme.colors.background, borderWidth: 1, borderColor: theme.colors.border },
  chipActive: { backgroundColor: theme.colors.primary, borderColor: theme.colors.primary },
  chipText: { fontSize: 13, color: theme.colors.textLight, fontFamily: theme.fonts.button },
  chipTextActive: { color: theme.colors.background },
  
  input: { backgroundColor: theme.colors.background, fontFamily: theme.fonts.body, padding: 16, borderRadius: 16, borderWidth: 1, borderColor: theme.colors.border, color: theme.colors.text },
  textArea: { minHeight: 140, textAlignVertical: 'top' },
  
  submitBtn: { flexDirection: 'row', gap: 10, backgroundColor: theme.colors.primary, padding: 16, borderRadius: 16, alignItems: 'center', justifyContent: 'center', marginTop: 32 },
  submitBtnText: { color: theme.colors.background, fontFamily: theme.fonts.button, fontSize: 15 },
});