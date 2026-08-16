import React from 'react';
import { View } from 'react-native';
import { useAuth } from '../../contexts/AuthContext';
import PerfilPublicoView from '../../components/PerfilPublicoView';

export default function PerfilVoluntario() {
  const { session } = useAuth();
  return (
    <View style={{ flex: 1 }}>
      <PerfilPublicoView userId={session.user.id} />
    </View>
  );
}
