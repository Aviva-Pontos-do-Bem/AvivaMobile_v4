import React from 'react';
import { Stack } from 'expo-router';
import PerfilForm from '../../components/PerfilForm';

export default function EditarPerfilEmpresa() {
  return (
    <>
      <Stack.Screen options={{ headerShown: true, title: 'Editar perfil corporativo' }} />
      <PerfilForm />
    </>
  );
}