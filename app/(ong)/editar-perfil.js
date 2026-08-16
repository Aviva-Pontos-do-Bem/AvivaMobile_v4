import React from 'react';
import { Stack } from 'expo-router';
import PerfilForm from '../../components/PerfilForm';

export default function EditarPerfilOng() {
  return (
    <>
      <Stack.Screen options={{ headerShown: true, title: 'Editar perfil da ONG' }} />
      <PerfilForm />
    </>
  );
}
