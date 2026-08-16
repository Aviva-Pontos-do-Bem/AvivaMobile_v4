import React, { useState } from 'react';
import { StyleSheet, View, Text, TextInput, TouchableOpacity, Platform, ActivityIndicator, ScrollView, Image } from 'react-native';
import { supabase } from '../../supabase';
import { theme } from '../../lib/theme';
import { validarEmail, validarCNPJ, validarSenhaForte } from '../../lib/validation';

// Freia tentativas de login repetidas direto no aparelho: depois de 5 erros
// seguidos, obriga a pessoa a esperar um pouco antes de tentar de novo. Não
// substitui rate limit do lado do servidor (que o próprio Supabase Auth já
// aplica), mas evita que alguém fique martelando senha na tela sem parar.
const LIMITE_TENTATIVAS = 5;
const ESPERA_APOS_LIMITE_MS = 30000;

export default function AuthScreen() {
  const [isLogin, setIsLogin] = useState(true);
  const [modoRecuperarSenha, setModoRecuperarSenha] = useState(false);
  const [userType, setUserType] = useState('voluntario');

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [documento, setDocumento] = useState('');

  const [loading, setLoading] = useState(false);
  const [tentativasFalhas, setTentativasFalhas] = useState(0);
  const [bloqueadoAte, setBloqueadoAte] = useState(0);

  const mostrarAlerta = (titulo, mensagem) => {
    if (Platform.OS === 'web') alert(`${titulo}: ${mensagem}`);
    else {
      const { Alert } = require('react-native');
      Alert.alert(titulo, mensagem);
    }
  };

  async function handleLogin() {
    if (Date.now() < bloqueadoAte) {
      const segundos = Math.ceil((bloqueadoAte - Date.now()) / 1000);
      return mostrarAlerta('Muitas tentativas', `Aguarde ${segundos}s antes de tentar novamente.`);
    }
    if (!validarEmail(email)) return mostrarAlerta('E-mail inválido', 'Digite um e-mail válido.');
    if (!password) return mostrarAlerta('Erro', 'Digite sua senha.');

    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
    setLoading(false);

    if (error) {
      const novasTentativas = tentativasFalhas + 1;
      setTentativasFalhas(novasTentativas);
      if (novasTentativas >= LIMITE_TENTATIVAS) {
        setBloqueadoAte(Date.now() + ESPERA_APOS_LIMITE_MS);
        setTentativasFalhas(0);
        mostrarAlerta('Muitas tentativas', 'Espere 30 segundos antes de tentar de novo.');
      } else {
        mostrarAlerta('Erro', error.message);
      }
    } else {
      setTentativasFalhas(0);
    }
  }

  async function handleSignUp() {
    if (!fullName || !email || !password) return mostrarAlerta('Erro', 'Por favor, preencha os campos obrigatórios.');
    if (!validarEmail(email)) return mostrarAlerta('E-mail inválido', 'Digite um e-mail válido.');
    if (!validarSenhaForte(password)) return mostrarAlerta('Senha fraca', 'Use ao menos 6 caracteres, com letras e números.');
    if (userType !== 'voluntario') {
      if (!documento) return mostrarAlerta('Erro', 'Por favor, informe o CNPJ.');
      if (!validarCNPJ(documento)) return mostrarAlerta('CNPJ inválido', 'Confira o número informado.');
    }

    setLoading(true);

    const { error } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: {
        data: {
          full_name: fullName,
          user_type: userType,
          documento: documento,
        },
      },
    });

    if (error) mostrarAlerta('Erro', error.message);
    else {
      mostrarAlerta('Sucesso!', `Conta de ${userType.toUpperCase()} criada com sucesso! Verifique seu e-mail.`);
      setFullName('');
      setDocumento('');
      setPassword('');
      setIsLogin(true);
    }
    setLoading(false);
  }

  async function handleRecuperarSenha() {
    if (!validarEmail(email)) return mostrarAlerta('E-mail inválido', 'Digite o e-mail da sua conta.');
    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim());
    setLoading(false);
    if (error) return mostrarAlerta('Erro', error.message);
    mostrarAlerta('Verifique seu e-mail', 'Enviamos um link para você redefinir sua senha.');
    setModoRecuperarSenha(false);
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.logoContainer}>
        {/* Ajuste o caminho da imagem conforme a localização real no seu projeto */}
        <Image 
          source={require('../../logoAviva.png')} 
          style={styles.logoImage} 
          resizeMode="contain"
        />
      </View>

      <Text style={styles.greeting}>Olá!</Text>
      <Text style={styles.subGreeting}>
        {modoRecuperarSenha ? 'Vamos recuperar sua senha' : isLogin ? 'Bem Vindo ao Aviva' : 'Crie sua conta para começar'}
      </Text>

      {modoRecuperarSenha ? (
        <View style={styles.inputArea}>
          <Text style={styles.helperText}>Informe o e-mail da sua conta. Vamos enviar um link para você redefinir a senha.</Text>
          <TextInput
            style={styles.input}
            placeholder="E-mail"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
            placeholderTextColor={theme.colors.textLight}
          />
          {loading ? (
            <ActivityIndicator color={theme.colors.primary} size="large" />
          ) : (
            <>
              <TouchableOpacity style={[styles.actionButtonFull, styles.btnActive]} onPress={handleRecuperarSenha}>
                <Text style={styles.buttonText}>Enviar link de recuperação</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.linkBtn} onPress={() => setModoRecuperarSenha(false)}>
                <Text style={styles.linkBtnText}>Voltar para o login</Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      ) : (
      <>
      <View style={styles.inputArea}>
        {!isLogin && (
          <View style={styles.typeSelector}>
            <TouchableOpacity
              style={[styles.typeBtn, userType === 'voluntario' && styles.typeBtnActive]}
              onPress={() => setUserType('voluntario')}
            >
              <Text style={userType === 'voluntario' ? styles.typeTextActive : styles.typeText}>Voluntário</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.typeBtn, userType === 'ong' && styles.typeBtnActive]}
              onPress={() => setUserType('ong')}
            >
              <Text style={userType === 'ong' ? styles.typeTextActive : styles.typeText}>ONG</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.typeBtn, userType === 'empresa' && styles.typeBtnActive]}
              onPress={() => setUserType('empresa')}
            >
              <Text style={userType === 'empresa' ? styles.typeTextActive : styles.typeText}>Empresa</Text>
            </TouchableOpacity>
          </View>
        )}

        {!isLogin && (
          <TextInput
            style={styles.input}
            placeholder={userType === 'voluntario' ? 'Nome Completo' : 'Nome da Instituição / Empresa'}
            value={fullName}
            onChangeText={setFullName}
            placeholderTextColor={theme.colors.textLight}
          />
        )}

        {!isLogin && userType !== 'voluntario' && (
          <TextInput
            style={styles.input}
            placeholder="CNPJ"
            value={documento}
            onChangeText={setDocumento}
            keyboardType="numeric"
            placeholderTextColor={theme.colors.textLight}
          />
        )}

        <TextInput
          style={styles.input}
          placeholder="E-mail"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
          placeholderTextColor={theme.colors.textLight}
        />

        <TextInput
          style={styles.input}
          placeholder="Senha"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          placeholderTextColor={theme.colors.textLight}
        />

        {isLogin && (
          <TouchableOpacity onPress={() => setModoRecuperarSenha(true)} style={{ alignSelf: 'flex-end', marginTop: -6 }}>
            <Text style={styles.linkBtnText}>Esqueci minha senha</Text>
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.buttonRow}>
        {loading ? (
          <ActivityIndicator color={theme.colors.primary} size="large" />
        ) : (
          <>
            <TouchableOpacity
              style={[styles.actionButton, isLogin ? styles.btnActive : styles.btnOutline]}
              onPress={isLogin ? handleLogin : () => setIsLogin(true)}
            >
              <Text style={isLogin ? styles.buttonText : styles.buttonTextOutline}>Conectar-se</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actionButton, !isLogin ? styles.btnActive : styles.btnOutline]}
              onPress={!isLogin ? handleSignUp : () => setIsLogin(false)}
            >
              <Text style={!isLogin ? styles.buttonText : styles.buttonTextOutline}>Cadastrar-se</Text>
            </TouchableOpacity>
          </>
        )}
      </View>

      <Text style={styles.footerText}>Ou use suas redes sociais:</Text>
      <View style={styles.socialRow}>
        <View style={[styles.socialIcon, { backgroundColor: '#3b5998' }]}><Text style={styles.siText}>f</Text></View>
        <View style={[styles.socialIcon, { backgroundColor: '#db4a39' }]}><Text style={styles.siText}>G</Text></View>
        <View style={[styles.socialIcon, { backgroundColor: '#0077b5' }]}><Text style={styles.siText}>in</Text></View>
      </View>
      </>
      )}
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
  logoContainer: { 
    alignItems: 'center', 
    marginBottom: 40 
  },
  logoImage: {
    width: 200,
    height: 120,
  },
  greeting: { 
    fontSize: 28, 
    fontFamily: theme.fonts.heading, 
    color: theme.colors.text 
  },
  subGreeting: { 
    fontSize: 14, 
    fontFamily: theme.fonts.body, 
    color: theme.colors.textLight, 
    marginBottom: 30 
  },
  inputArea: { 
    width: '100%', 
    marginBottom: 20 
  },
  typeSelector: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    marginBottom: 15, 
    width: '100%', 
    backgroundColor: theme.colors.surface, 
    borderRadius: theme.border.radius, 
    padding: 5 
  },
  typeBtn: { 
    flex: 1, 
    paddingVertical: 10, 
    alignItems: 'center', 
    borderRadius: theme.border.radius - 3 
  },
  typeBtnActive: { 
    backgroundColor: theme.colors.secondary 
  },
  typeText: { 
    color: theme.colors.textLight, 
    fontSize: 13, 
    fontFamily: theme.fonts.button 
  },
  typeTextActive: { 
    color: theme.colors.background, 
    fontSize: 13, 
    fontFamily: theme.fonts.button 
  },
  input: { 
    backgroundColor: theme.colors.surface, 
    padding: 15, 
    borderRadius: theme.border.radius, 
    marginBottom: 15, 
    borderWidth: 1, 
    borderColor: theme.colors.border,
    fontFamily: theme.fonts.body
  },
  buttonRow: { 
    flexDirection: 'row', 
    gap: 10, 
    marginBottom: 40 
  },
  actionButton: { 
    flex: 1, 
    padding: 15, 
    borderRadius: theme.border.radiusLarge, 
    alignItems: 'center' 
  },
  btnActive: { 
    backgroundColor: theme.colors.primary 
  },
  btnOutline: { 
    backgroundColor: theme.colors.background, 
    borderWidth: 2, 
    borderColor: theme.colors.secondary 
  },
  buttonText: { 
    color: theme.colors.background, 
    fontFamily: theme.fonts.button 
  },
  buttonTextOutline: { 
    color: theme.colors.text, 
    fontFamily: theme.fonts.button 
  },
  footerText: { 
    fontSize: 12, 
    color: theme.colors.textLight, 
    marginBottom: 15,
    fontFamily: theme.fonts.body 
  },
  socialRow: { 
    flexDirection: 'row', 
    gap: 20 
  },
  socialIcon: { 
    width: 40, 
    height: 40, 
    borderRadius: 20, 
    justifyContent: 'center', 
    alignItems: 'center' 
  },
  siText: { 
    color: theme.colors.background, 
    fontWeight: 'bold', 
    fontSize: 18 
  },
  helperText: {
    fontSize: 13,
    fontFamily: theme.fonts.body,
    color: theme.colors.textLight,
    marginBottom: 16,
    lineHeight: 19,
  },
  actionButtonFull: {
    width: '100%',
    padding: 15,
    borderRadius: theme.border.radiusLarge,
    alignItems: 'center',
  },
  linkBtn: {
    alignItems: 'center',
    marginTop: 16,
  },
  linkBtnText: {
    color: theme.colors.secondary,
    fontFamily: theme.fonts.button,
    fontSize: 13,
  },
});