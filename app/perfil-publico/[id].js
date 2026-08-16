import React from 'react';
import { Stack, useLocalSearchParams } from 'expo-router';
import PerfilPublicoView from '../../components/PerfilPublicoView';

// Rota fora dos grupos (voluntario)/(ong)/(empresa) de propósito: é o
// mesmo perfil público, alcançável a partir de qualquer papel — o
// voluntário vendo a ONG antes de se candidatar, a ONG vendo o
// voluntário antes de aprovar, ou qualquer um vendo uma empresa parceira.
export default function PerfilPublico() {
  const { id } = useLocalSearchParams();
  return (
    <>
      <Stack.Screen options={{ headerShown: true, title: 'Perfil' }} />
      <PerfilPublicoView userId={id} />
    </>
  );
}
