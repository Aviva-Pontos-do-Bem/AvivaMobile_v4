import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, Platform, ActivityIndicator, ScrollView } from 'react-native';
import { supabase } from '../supabase';
import { useAuth } from '../contexts/AuthContext';
import { validarCNPJ } from '../lib/validation';
import { formatarCNPJ } from '../lib/format';
import { theme } from '../lib/theme';

const avisar = (titulo, mensagem) => {
  if (Platform.OS === 'web') alert(`${titulo}: ${mensagem}`);
  else {
    const { Alert } = require('react-native');
    Alert.alert(titulo, mensagem);
  }
};

// Só é exibida para quem entrou via login social (Google): o cadastro por
// e-mail já pede o tipo de usuário na hora, mas o provedor OAuth só devolve
// nome/e-mail/foto — sem isso o app não sabe em qual área (voluntário, ONG
// ou empresa) colocar a pessoa.
export default function CompletarPerfil() {
  const { session, refreshProfile } = useAuth();
  const [userType, setUserType] = useState('voluntario');
  const [documento, setDocumento] = useState('');
  const [salvando, setSalvando] = useState(false);

  async function confirmar() {
    if (userType !== 'voluntario') {
      if (!documento) return avisar('Erro', 'Por favor, informe o CNPJ.');
      if (!validarCNPJ(documento)) return avisar('CNPJ inválido', 'Confira o número informado.');
    }

    setSalvando(true);
    const { error } = await supabase
      .from('profiles')
      .update({ user_type: userType, documento: userType !== 'voluntario' ? documento.replace(/\D/g, '') : null })
      .eq('id', session.user.id);

    if (!error) {
      await supabase.auth.updateUser({ data: { user_type: userType } });
    }
    setSalvando(false);

    if (error) return avisar('Erro', error.message);
    await refreshProfile();
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.greeting}>Quase lá!</Text>
      <Text style={styles.subGreeting}>Como você quer usar o Aviva?</Text>

      <View style={styles.typeSelector}>
        <TouchableOpacity style={[styles.typeBtn, userType === 'voluntario' && styles.typeBtnActive]} onPress={() => setUserType('voluntario')}>
          <Text style={userType === 'voluntario' ? styles.typeTextActive : styles.typeText}>Voluntário</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.typeBtn, userType === 'ong' && styles.typeBtnActive]} onPress={() => setUserType('ong')}>
          <Text style={userType === 'ong' ? styles.typeTextActive : styles.typeText}>ONG</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.typeBtn, userType === 'empresa' && styles.typeBtnActive]} onPress={() => setUserType('empresa')}>
          <Text style={userType === 'empresa' ? styles.typeTextActive : styles.typeText}>Empresa</Text>
        </TouchableOpacity>
      </View>

      {userType !== 'voluntario' && (
        <TextInput
          style={styles.input}
          placeholder="CNPJ"
          value={documento}
          onChangeText={(t) => setDocumento(formatarCNPJ(t))}
          keyboardType="numeric"
          placeholderTextColor={theme.colors.textLight}
        />
      )}

      <TouchableOpacity style={styles.actionButton} onPress={confirmar} disabled={salvando}>
        {salvando ? <ActivityIndicator color={theme.colors.background} /> : <Text style={styles.buttonText}>Continuar</Text>}
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: theme.colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 30,
    ...Platform.select({ web: { maxWidth: 450, alignSelf: 'center', width: '100%' } }),
  },
  greeting: { fontSize: 28, fontFamily: theme.fonts.heading, color: theme.colors.text },
  subGreeting: { fontSize: 14, fontFamily: theme.fonts.body, color: theme.colors.textLight, marginBottom: 30 },
  typeSelector: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20, width: '100%', backgroundColor: theme.colors.surface, borderRadius: theme.border.radius, padding: 5 },
  typeBtn: { flex: 1, paddingVertical: 12, alignItems: 'center', borderRadius: theme.border.radius - 3 },
  typeBtnActive: { backgroundColor: theme.colors.secondary },
  typeText: { color: theme.colors.textLight, fontSize: 13, fontFamily: theme.fonts.button },
  typeTextActive: { color: theme.colors.background, fontSize: 13, fontFamily: theme.fonts.button },
  input: { width: '100%', backgroundColor: theme.colors.surface, padding: 15, borderRadius: theme.border.radius, marginBottom: 20, borderWidth: 1, borderColor: theme.colors.border, fontFamily: theme.fonts.body },
  actionButton: { width: '100%', padding: 15, borderRadius: theme.border.radiusLarge, alignItems: 'center', backgroundColor: theme.colors.primary },
  buttonText: { color: theme.colors.background, fontFamily: theme.fonts.button },
});
