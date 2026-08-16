import React from 'react';
import { View } from 'react-native';
import { useAuth } from '../../contexts/AuthContext';
import PerfilPublicoView from '../../components/PerfilPublicoView';
import { theme } from '../../lib/theme';

export default function PerfilEmpresa() {
  const { session } = useAuth();
  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.surface }}>
      <PerfilPublicoView userId={session.user.id} />
    </View>
  );
}