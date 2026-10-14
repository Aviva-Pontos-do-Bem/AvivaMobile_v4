import React, { useCallback, useEffect, useRef, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { supabase } from '../supabase';
import { useAuth } from '../contexts/AuthContext';
import { theme } from '../lib/theme';
import { textoContador } from '../lib/notificacoes';

export default function NotificacoesBell() {
  const { session } = useAuth();
  const router = useRouter();
  const userId = session?.user?.id;
  const [naoLidas, setNaoLidas] = useState(0);
  const idCanal = useRef(Math.random().toString(36).slice(2));

  const contar = useCallback(async () => {
    if (!userId) return;
    const { count } = await supabase
      .from('notificacoes')
      .select('id', { count: 'exact', head: true })
      .eq('usuario_id', userId)
      .eq('lida', false);
    setNaoLidas(count || 0);
  }, [userId]);

  useEffect(() => {
    if (!userId) return undefined;
    contar();
    const canal = supabase
      .channel(`notificacoes-${userId}-${idCanal.current}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'notificacoes', filter: `usuario_id=eq.${userId}` },
        contar,
      )
      .subscribe();
    return () => {
      supabase.removeChannel(canal);
    };
  }, [userId, contar]);

  const texto = textoContador(naoLidas);

  return (
    <TouchableOpacity
      accessibilityRole="button"
      accessibilityLabel={naoLidas > 0 ? `Notificações, ${naoLidas} não lidas` : 'Notificações'}
      style={styles.btn}
      onPress={() => router.push('/notificacoes')}
    >
      <Feather name="bell" size={22} color={theme.colors.primary} />
      {!!texto && (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{texto}</Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  btn: { padding: 8, backgroundColor: theme.colors.surface, borderRadius: 50 },
  badge: {
    position: 'absolute', top: -2, right: -2, minWidth: 18, height: 18, borderRadius: 9,
    paddingHorizontal: 4, backgroundColor: theme.colors.error, justifyContent: 'center', alignItems: 'center',
  },
  badgeText: { color: theme.colors.background, fontSize: 10, fontFamily: theme.fonts.button },
});
