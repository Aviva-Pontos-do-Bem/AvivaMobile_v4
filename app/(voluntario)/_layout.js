import { Tabs } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { tabScreenOptions } from '../../lib/tabBar';

export default function VoluntarioTabsLayout() {
  return (
    <Tabs
      screenOptions={tabScreenOptions}
    >
      <Tabs.Screen
        name="index"
        options={{ title: 'Início', tabBarIcon: ({ color, size }) => <Feather name="home" color={color} size={size} /> }}
      />
      <Tabs.Screen
        name="buscar"
        options={{ title: 'Buscar', tabBarIcon: ({ color, size }) => <Feather name="search" color={color} size={size} /> }}
      />
      <Tabs.Screen
        name="candidaturas"
        options={{ title: 'Ações', tabBarIcon: ({ color, size }) => <Feather name="check-square" color={color} size={size} /> }}
      />
      <Tabs.Screen
        name="impacto"
        options={{ title: 'Impacto', tabBarIcon: ({ color, size }) => <Feather name="award" color={color} size={size} /> }}
      />
      <Tabs.Screen
        name="perfil"
        options={{ title: 'Perfil', tabBarIcon: ({ color, size }) => <Feather name="user" color={color} size={size} /> }}
      />
      <Tabs.Screen name="editar-perfil" options={{ href: null }} />
    </Tabs>
  );
}