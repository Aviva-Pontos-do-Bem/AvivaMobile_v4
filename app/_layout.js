import { Stack } from 'expo-router';
import { View, ActivityIndicator } from 'react-native';
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
      </Stack.Protected>
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <RootNavigator />
    </AuthProvider>
  );
}