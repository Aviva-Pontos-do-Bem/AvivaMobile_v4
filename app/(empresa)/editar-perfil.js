import React from 'react';
import { Stack } from 'expo-router';
import PerfilForm from '../../components/PerfilForm';
import { headerPadrao } from '../../lib/headerPadrao';

export default function EditarPerfilEmpresa() {
  return (
    <>
      <Stack.Screen options={{ ...headerPadrao, title: 'Editar perfil corporativo' }} />
      <PerfilForm />
    </>
  );
}