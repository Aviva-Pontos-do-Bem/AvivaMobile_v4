import React from 'react';
import { Stack } from 'expo-router';
import PerfilForm from '../../components/PerfilForm';

export default function EditarPerfilVoluntario() {
  return (
    <>
      <Stack.Screen options={{ headerShown: true, title: 'Editar perfil' }} />
      <PerfilForm />
    </>
  );
}
