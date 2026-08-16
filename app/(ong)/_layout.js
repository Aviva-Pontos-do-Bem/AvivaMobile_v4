import { Tabs } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { theme } from '../../lib/theme';

export default function OngTabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: theme.colors.textLight,
        tabBarLabelStyle: { fontSize: 10.5, fontFamily: theme.fonts.body },
        tabBarStyle: { backgroundColor: theme.colors.background, borderTopColor: theme.colors.border },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{ title: 'Painel', tabBarIcon: ({ color, size }) => <Feather name="grid" color={color} size={size} /> }}
      />
      <Tabs.Screen
        name="rede"
        options={{ title: 'Rede', tabBarIcon: ({ color, size }) => <Feather name="activity" color={color} size={size} /> }}
      />
      <Tabs.Screen
        name="buscar"
        options={{ title: 'Buscar', tabBarIcon: ({ color, size }) => <Feather name="search" color={color} size={size} /> }}
      />
      <Tabs.Screen
        name="perfil"
        options={{ title: 'Perfil', tabBarIcon: ({ color, size }) => <Feather name="user" color={color} size={size} /> }}
      />
      {/* "Nova vaga" e "Candidaturas" saíram da barra de baixo pra não deixar
          6 abas espremidas — agora vivem como atalhos dentro do Painel
          (index.js), mas continuam sendo telas normais e navegáveis. */}
      <Tabs.Screen name="criar-vaga" options={{ href: null }} />
      <Tabs.Screen name="candidaturas" options={{ href: null }} />
      <Tabs.Screen name="editar-perfil" options={{ href: null }} />
    </Tabs>
  );
}