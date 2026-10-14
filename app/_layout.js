import { Stack } from 'expo-router';
import { View, ActivityIndicator } from 'react-native';
import { useFonts, Inter_400Regular, Inter_500Medium, Inter_600SemiBold } from '@expo-google-fonts/inter';
import { Poppins_600SemiBold, Poppins_700Bold } from '@expo-google-fonts/poppins';
import { AuthProvider, useAuth } from '../contexts/AuthContext';
import { theme } from '../lib/theme';

function RootNavigator() {
  const { session, userType, loading } = useAuth();

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: theme.colors.background }}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Protected guard={!session}>
        <Stack.Screen name="(auth)" />
      </Stack.Protected>

      {/* Quem entra pela primeira vez via Google não tem user_type (isso só
          existe hoje via user_metadata do cadastro por e-mail) — precisa
          escolher o perfil antes de cair em qualquer área protegida. */}
      <Stack.Protected guard={!!session && !userType}>
        <Stack.Screen name="completar-perfil" />
      </Stack.Protected>

      <Stack.Protected guard={!!session && userType === 'voluntario'}>
        <Stack.Screen name="(voluntario)" />
      </Stack.Protected>

      <Stack.Protected guard={!!session && userType === 'ong'}>
        <Stack.Screen name="(ong)" />
      </Stack.Protected>

      <Stack.Protected guard={!!session && userType === 'empresa'}>
        <Stack.Screen name="(empresa)" />
      </Stack.Protected>

      <Stack.Protected guard={!!session}>
        <Stack.Screen name="perfil-publico/[id]" />
        <Stack.Screen name="post/[id]" />
        <Stack.Screen name="vaga/[id]" />
        <Stack.Screen name="sobre" />
        <Stack.Screen name="reclamacoes" />
        <Stack.Screen name="notificacoes" />
        <Stack.Screen name="doacoes" />
      </Stack.Protected>

      {/* Sem guard de propósito: precisa abrir tanto no cadastro (antes de
          existir sessão) quanto depois, a partir do menu de configurações. */}
      <Stack.Screen name="termos-privacidade" />
    </Stack>
  );
}

export default function RootLayout() {
  // As fontes da marca precisam ser carregadas antes de desenhar qualquer tela;
  // sem isso o app cai na fonte padrão do sistema. Se falharem (sem rede, no
  // web), segue com a fonte padrão em vez de travar na tela de carregamento.
  const [fontesProntas, erroFontes] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Poppins_600SemiBold,
    Poppins_700Bold,
  });

  if (!fontesProntas && !erroFontes) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: theme.colors.background }}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  return (
    <AuthProvider>
      <RootNavigator />
    </AuthProvider>
  );
}