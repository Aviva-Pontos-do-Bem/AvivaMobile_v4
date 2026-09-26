import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { supabase } from '../supabase';

const AuthContext = createContext(null);

// Centraliza a sessão do Supabase, o tipo de usuário e agora também a linha
// completa de `profiles` (bio, foto, endereço, verificado...). A partir da
// Fase 5, o perfil tem dados que não existem no user_metadata do Auth — por
// isso todo o app deve ler nome/foto por aqui (useAuth().profile), e não
// mais direto de session.user.user_metadata, para não ficar desatualizado
// depois que a pessoa edita o perfil.
export function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = useCallback(async (userId) => {
    if (!userId) {
      setProfile(null);
      return;
    }
    // Usa a função meu_perfil() (RPC) em vez de .from('profiles').select('*')
    // direto: telefone/documento agora têm SELECT revogado por coluna para
    // qualquer usuário (ver migration_seguranca_rls.sql) — só essa função,
    // que roda como o dono dela (SECURITY DEFINER), ainda enxerga essas
    // colunas, e só devolve a linha do próprio usuário logado.
    const { data } = await supabase.rpc('meu_perfil');
    setProfile(data?.[0] || null);
  }, []);

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      setSession(session);
      await fetchProfile(session?.user?.id);
      setLoading(false);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
      fetchProfile(newSession?.user?.id);
    });

    // Importante: sem isso, cada vez que o AuthProvider remonta (ex: hot reload)
    // um novo listener era criado sem nunca ser removido.
    return () => {
      listener.subscription.unsubscribe();
    };
  }, [fetchProfile]);

  const userType = session?.user?.user_metadata?.user_type || profile?.user_type || null;
  const fullName = profile?.full_name || session?.user?.user_metadata?.full_name || '';

  const value = {
    session,
    profile,
    userType,
    fullName,
    loading,
    // Chamado depois de salvar edições de perfil, para o resto do app
    // (feed, dashboards, avatar no cabeçalho) refletir a mudança na hora.
    refreshProfile: () => fetchProfile(session?.user?.id),
    signOut: () => supabase.auth.signOut(),
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth precisa ser usado dentro de um <AuthProvider>');
  }
  return ctx;
}
