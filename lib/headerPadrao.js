import { theme } from './theme';

// Cabeçalho de navegação das telas secundárias (editar perfil, doações,
// notificações, termos...). Igual ao das telas principais: marinho, título em
// Poppins e seta de voltar branca, sem a linha cinza do sistema.
export const headerPadrao = {
  headerShown: true,
  headerStyle: { backgroundColor: theme.colors.primary },
  headerTintColor: '#FFFFFF',
  headerTitleStyle: { fontFamily: 'Poppins_600SemiBold', fontSize: 17, color: '#FFFFFF' },
  headerBackTitleVisible: false,
  headerShadowVisible: false,
};
