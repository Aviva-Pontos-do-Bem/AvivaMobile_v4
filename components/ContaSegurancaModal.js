import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Modal, ScrollView, Platform, ActivityIndicator, KeyboardAvoidingView } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { supabase } from '../supabase';
import { validarEmail, validarSenhaForte } from '../lib/validation';
import SafetyNotice from './SafetyNotice';
import { theme } from '../lib/theme';

const avisar = (titulo, mensagem) => {
  if (Platform.OS === 'web') alert(`${titulo}: ${mensagem}`);
  else {
    const { Alert } = require('react-native');
    Alert.alert(titulo, mensagem);
  }
};

export default function ContaSegurancaModal({ visivel, onFechar, email }) {
  const [senhaAtual, setSenhaAtual] = useState('');
  const [reautenticado, setReautenticado] = useState(false);
  const [verificando, setVerificando] = useState(false);

  const [novoEmail, setNovoEmail] = useState('');
  const [novaSenha, setNovaSenha] = useState('');
  const [confirmarSenha, setConfirmarSenha] = useState('');
  const [salvando, setSalvando] = useState(false);

  function fecharTudo() {
    setSenhaAtual('');
    setReautenticado(false);
    setNovoEmail('');
    setNovaSenha('');
    setConfirmarSenha('');
    onFechar();
  }

  async function confirmarSenhaAtual() {
    if (!senhaAtual) return avisar('Erro', 'Digite sua senha atual.');
    setVerificando(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password: senhaAtual });
    setVerificando(false);
    if (error) {
      avisar('Senha incorreta', 'Não foi possível confirmar sua senha atual.');
      return;
    }
    setReautenticado(true);
  }

  async function salvarNovoEmail() {
    if (!validarEmail(novoEmail)) return avisar('E-mail inválido', 'Digite um e-mail válido.');
    setSalvando(true);
    const { error } = await supabase.auth.updateUser({ email: novoEmail.trim() });
    setSalvando(false);
    if (error) return avisar('Erro', error.message);
    avisar('Confirme a troca', 'Enviamos um link de confirmação para o novo e-mail.');
    setNovoEmail('');
  }

  async function salvarNovaSenha() {
    if (!validarSenhaForte(novaSenha)) return avisar('Senha fraca', 'Use ao menos 6 caracteres.');
    if (novaSenha !== confirmarSenha) return avisar('As senhas não coincidem', 'Digite a mesma senha nos dois campos.');
    
    setSalvando(true);
    const { error } = await supabase.auth.updateUser({ password: novaSenha });
    setSalvando(false);
    
    if (error) return avisar('Erro', error.message);
    avisar('Senha alterada!', 'Use a nova senha no próximo login.');
    setNovaSenha('');
    setConfirmarSenha('');
  }

  return (
    <Modal visible={visivel} animationType="slide" transparent onRequestClose={fecharTudo}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.backdrop}>
        <View style={styles.card}>
          <View style={styles.header}>
            <Text style={styles.title}>Segurança da conta</Text>
            <TouchableOpacity onPress={fecharTudo}>
              <Feather name="x" size={24} color={theme.colors.textLight} />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>
            {!reautenticado ? (
              <>
                <SafetyNotice text="Confirme sua senha atual antes de alterar dados sensíveis." />
                <Text style={styles.label}>Senha atual</Text>
                <TextInput
                  style={styles.input}
                  value={senhaAtual}
                  onChangeText={setSenhaAtual}
                  secureTextEntry
                  placeholder="••••••••"
                  placeholderTextColor={theme.colors.textLight}
                />
                <TouchableOpacity style={styles.primaryBtn} onPress={confirmarSenhaAtual} disabled={verificando}>
                  {verificando ? <ActivityIndicator color={theme.colors.background} /> : <Text style={styles.primaryBtnText}>Confirmar Identidade</Text>}
                </TouchableOpacity>
              </>
            ) : (
              <>
                <Text style={styles.sectionLabel}>Alterar E-mail</Text>
                <Text style={styles.currentValue}>Atual: {email}</Text>
                <TextInput
                  style={styles.input}
                  value={novoEmail}
                  onChangeText={setNovoEmail}
                  placeholder="novo@email.com"
                  placeholderTextColor={theme.colors.textLight}
                  autoCapitalize="none"
                  keyboardType="email-address"
                />
                <TouchableOpacity style={styles.secondaryBtn} onPress={salvarNovoEmail} disabled={salvando}>
                  <Text style={styles.secondaryBtnText}>Salvar novo e-mail</Text>
                </TouchableOpacity>

                <Text style={[styles.sectionLabel, { marginTop: 32 }]}>Alterar Senha</Text>
                <TextInput
                  style={styles.input}
                  value={novaSenha}
                  onChangeText={setNovaSenha}
                  placeholder="Nova senha (mín. 6 caracteres)"
                  placeholderTextColor={theme.colors.textLight}
                  secureTextEntry
                />
                <TextInput
                  style={[styles.input, { marginTop: 12 }]}
                  value={confirmarSenha}
                  onChangeText={setConfirmarSenha}
                  placeholder="Confirmar nova senha"
                  placeholderTextColor={theme.colors.textLight}
                  secureTextEntry
                />
                <TouchableOpacity style={styles.primaryBtn} onPress={salvarNovaSenha} disabled={salvando}>
                  {salvando ? <ActivityIndicator color={theme.colors.background} /> : <Text style={styles.primaryBtnText}>Salvar nova senha</Text>}
                </TouchableOpacity>
              </>
            )}
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  card: { backgroundColor: theme.colors.background, borderTopLeftRadius: 30, borderTopRightRadius: 30, padding: 24, maxHeight: '90%' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  title: { fontSize: 18, fontFamily: theme.fonts.heading, color: theme.colors.text },
  label: { fontSize: 13, fontFamily: theme.fonts.button, color: theme.colors.textLight, marginTop: 20, marginBottom: 8 },
  sectionLabel: { fontSize: 15, fontFamily: theme.fonts.heading, color: theme.colors.text, marginBottom: 8 },
  currentValue: { fontSize: 13, fontFamily: theme.fonts.body, color: theme.colors.textLight, marginBottom: 12 },
  input: { backgroundColor: theme.colors.surface, fontFamily: theme.fonts.body, padding: 16, borderRadius: 16, borderWidth: 1, borderColor: theme.colors.border, color: theme.colors.text },
  primaryBtn: { backgroundColor: theme.colors.primary, padding: 16, borderRadius: 16, alignItems: 'center', marginTop: 24 },
  primaryBtnText: { color: theme.colors.background, fontFamily: theme.fonts.button, fontSize: 15 },
  secondaryBtn: { backgroundColor: theme.colors.background, borderWidth: 1.5, borderColor: theme.colors.primary, padding: 16, borderRadius: 16, alignItems: 'center', marginTop: 12 },
  secondaryBtnText: { color: theme.colors.primary, fontFamily: theme.fonts.button, fontSize: 15 },
});