import { theme } from './theme';

// Opções visuais compartilhadas pelas barras de abas dos três perfis.
// A aba ativa ganha um "pílula" suave atrás do ícone e do rótulo.
export const tabScreenOptions = {
  headerShown: false,
  tabBarActiveTintColor: theme.colors.primary,
  tabBarInactiveTintColor: theme.colors.textLight,
  tabBarActiveBackgroundColor: theme.colors.pill,
  tabBarLabelStyle: { fontSize: 10.5, fontFamily: theme.fonts.button },
  tabBarItemStyle: { borderRadius: 16, marginHorizontal: 2, marginVertical: 6, paddingVertical: 2 },
  tabBarStyle: {
    height: 76,
    paddingBottom: 4,
    paddingTop: 0,
    backgroundColor: theme.colors.background,
    borderTopWidth: 0,
    elevation: 12,
    shadowColor: '#0B1B2E',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.07,
    shadowRadius: 12,
  },
};
