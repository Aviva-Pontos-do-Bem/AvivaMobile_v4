export const theme = {
  colors: {
    // Cores da Marca
    primary: '#1D3557', 
    secondary: '#2A9D8F',
    accent: '#F4A261',
    yellow: '#E9C46A',
    // Cores do logo (usadas em formas decorativas e destaques)
    sun: '#F9C22E',
    coral: '#F47C65',
    mint: '#58C79A',
    pill: '#E8EFF6',
    
    // Base e Superfícies
    background: '#FFFFFF',
    surface: '#F4F7FA',
    
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
    headingSemi: 'Poppins_600SemiBold',
    body: 'Inter_400Regular',
    bodyMedium: 'Inter_500Medium',
    button: 'Inter_600SemiBold',
  },
  // Escala tipográfica: use estes tokens em telas novas em vez de números soltos.
  type: {
    display: { fontSize: 30, lineHeight: 36, fontFamily: 'Poppins_700Bold', letterSpacing: -0.3 },
    h1: { fontSize: 24, lineHeight: 30, fontFamily: 'Poppins_700Bold', letterSpacing: -0.2 },
    h2: { fontSize: 18, lineHeight: 24, fontFamily: 'Poppins_600SemiBold' },
    h3: { fontSize: 15, lineHeight: 21, fontFamily: 'Poppins_600SemiBold' },
    body: { fontSize: 14, lineHeight: 21, fontFamily: 'Inter_400Regular' },
    bodyStrong: { fontSize: 14, lineHeight: 21, fontFamily: 'Inter_600SemiBold' },
    caption: { fontSize: 12, lineHeight: 17, fontFamily: 'Inter_400Regular' },
    label: { fontSize: 12, lineHeight: 16, fontFamily: 'Inter_600SemiBold', letterSpacing: 0.3 },
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