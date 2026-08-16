export const theme = {
  colors: {
    // Cores da Marca
    primary: '#1D3557', 
    secondary: '#2A9D8F',
    accent: '#F4A261',
    yellow: '#E9C46A',
    
    // Base e Superfícies
    background: '#FFFFFF',
    surface: '#F8F9FA',
    
    // Textos e Bordas
    text: '#333333',
    textLight: '#888888',
    border: '#EEEEEE',

    // Status e Feedback (Novos)
    success: '#0B6E4F',      // Usado para "Aceito" e tags "Verificado"
    successLight: '#E4F3EC', // Fundo para tags de sucesso
    warning: '#B98900',      // Usado para "Pendente"
    warningLight: '#FFF6E0', // Fundo para tags de aviso
    error: '#B23B3B',        // Usado para "Recusado" e mensagens de erro
    errorLight: '#FBEAEA',   // Fundo para tags de erro
  },
  fonts: {
    heading: 'Poppins_700Bold',
    body: 'Inter_400Regular',
    button: 'Inter_600SemiBold',
  },
  border: {
    radius: 15,
    radiusLarge: 25,
  },
  spacing: {
    // Escala de espaçamentos (Nova)
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    xxl: 40,
  },
  shadows: {
    // Sombras padronizadas para Cards (Nova)
    card: {
      elevation: 2,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.06,
      shadowRadius: 8,
    }
  }
};