import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, TouchableOpacity, Linking, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import { supabase } from '../supabase';
import { useAuth } from '../contexts/AuthContext';
import Avatar from './Avatar';
import CoverPicker from './CoverPicker';
import PerfilSidebar from './PerfilSidebar';
import PostsFeedList from './PostsFeedList';
import MinhasVagasList from './MinhasVagasList';
import { enviarAvatar } from '../lib/upload';
import { formatarCNPJ } from '../lib/format';
import { theme } from '../lib/theme';

const ROTULO_TIPO = { voluntario: 'Voluntário', ong: 'ONG', empresa: 'Empresa' };

export default function PerfilPublicoView({ userId }) {
  const { session, refreshProfile: refreshProfileProprio } = useAuth();
  const router = useRouter();

  const souEu = userId === session.user.id;

  const [perfil, setPerfil] = useState(null);
  const [loading, setLoading] = useState(true);
  const [contagens, setContagens] = useState({ seguidores: 0, seguindo: 0, posts: 0 });
  const [jaSigo, setJaSigo] = useState(false);
  const [alternandoSeguir, setAlternandoSeguir] = useState(false);
  const [sidebarAberta, setSidebarAberta] = useState(false);

  const carregar = useCallback(async () => {
    const { data: perfilData } = await supabase.from('profiles').select('*').eq('id', userId).single();
    setPerfil(perfilData);

    const [{ count: seguidoresCount }, { count: seguindoCount }, { count: postsCount }] = await Promise.all([
      supabase.from('seguidores').select('id', { count: 'exact', head: true }).eq('seguido_id', userId),
      supabase.from('seguidores').select('id', { count: 'exact', head: true }).eq('seguidor_id', userId),
      supabase.from('posts').select('id', { count: 'exact', head: true }).eq('autor_id', userId),
    ]);
    setContagens({ seguidores: seguidoresCount || 0, seguindo: seguindoCount || 0, posts: postsCount || 0 });

    if (!souEu) {
      const { data: relacao } = await supabase.from('seguidores').select('id').eq('seguidor_id', session.user.id).eq('seguido_id', userId).maybeSingle();
      setJaSigo(!!relacao);
    }
  }, [userId, souEu, session]);

  useEffect(() => {
    setLoading(true);
    carregar().finally(() => setLoading(false));
  }, [carregar]);

  async function alternarSeguir() {
    setAlternandoSeguir(true);
    if (jaSigo) await supabase.from('seguidores').delete().eq('seguidor_id', session.user.id).eq('seguido_id', userId);
    else await supabase.from('seguidores').insert({ seguidor_id: session.user.id, seguido_id: userId });
    setJaSigo(!jaSigo);
    setAlternandoSeguir(false);
    carregar();
  }

  async function trocarCapa(url) {
    await supabase.from('profiles').update({ capa_url: url }).eq('id', userId);
    setPerfil((p) => ({ ...p, capa_url: url }));
    refreshProfileProprio();
  }

  async function trocarAvatarRapido() {
    const ImagePicker = await import('expo-image-picker');
    const permissao = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permissao.granted) return;
    const resultado = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], allowsEditing: true, aspect: [1, 1], quality: 0.7 });
    if (resultado.canceled) return;
    const asset = resultado.assets?.[0];
    if (!asset) return;
    const url = await enviarAvatar(asset.uri, userId);
    await supabase.from('profiles').update({ foto_url: url }).eq('id', userId);
    setPerfil((p) => ({ ...p, foto_url: url }));
    refreshProfileProprio();
  }

  async function copiarPix() {
    await Clipboard.setStringAsync(perfil.chave_pix || '');
    if (Platform.OS === 'web') alert('Chave Pix copiada!');
    else {
      const { Alert } = require('react-native');
      Alert.alert('Copiado!', 'A chave Pix foi copiada para a área de transferência.');
    }
  }

  if (loading || !perfil) {
    return <View style={styles.centered}><ActivityIndicator size="large" color={theme.colors.primary} /></View>;
  }

  const temPublicacoes = perfil.user_type === 'voluntario' || perfil.user_type === 'ong';

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <CoverPicker capaUrl={perfil.capa_url} userId={userId} editavel={souEu} onUploaded={trocarCapa} />

      <View style={styles.content}>
        <View style={styles.headerCard}>
          <TouchableOpacity onPress={souEu ? trocarAvatarRapido : undefined} activeOpacity={souEu ? 0.7 : 1} style={styles.avatarWrap}>
            <View style={styles.avatarBorder}>
              <Avatar nome={perfil.full_name} fotoUrl={perfil.foto_url} verificado={perfil.verificado} size={84} />
            </View>
            {souEu && (
              <View style={styles.avatarCamBadge}>
                <Feather name="camera" size={12} color={theme.colors.background} />
              </View>
            )}
          </TouchableOpacity>

          <View style={styles.nameActionsRow}>
            <View style={{ flex: 1 }}>
              <View style={styles.nameRow}>
                <Text style={styles.name} numberOfLines={2}>{perfil.full_name}</Text>
                {perfil.verificado && <Feather name="check-circle" size={16} color={theme.colors.success} style={{ marginLeft: 6 }} />}
              </View>
              <View style={styles.typeTag}>
                <Text style={styles.typeTagText}>{ROTULO_TIPO[perfil.user_type] || ''}</Text>
              </View>
            </View>

            {souEu ? (
              <View style={styles.ownerActions}>
                <TouchableOpacity style={styles.editBtn} onPress={() => router.push('/editar-perfil')}>
                  <Feather name="edit-2" size={14} color={theme.colors.primary} />
                  <Text style={styles.editBtnText}>Editar</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.menuBtn} onPress={() => setSidebarAberta(true)}>
                  <Feather name="settings" size={18} color={theme.colors.text} />
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.ownerActions}>
                <TouchableOpacity style={[styles.followBtn, jaSigo && styles.followingBtn]} onPress={alternarSeguir} disabled={alternandoSeguir}>
                  <Text style={[styles.followBtnText, jaSigo && styles.followingBtnText]}>{jaSigo ? 'Seguindo' : 'Seguir'}</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.menuBtn} onPress={() => router.push('/reclamacoes')}>
                  <Feather name="flag" size={18} color={theme.colors.textLight} />
                </TouchableOpacity>
              </View>
            )}
          </View>

          {!perfil.verificado && (perfil.user_type === 'ong' || perfil.user_type === 'empresa') && (
            <View style={styles.unverifiedTag}>
              <Text style={styles.unverifiedTagText}>Verificação pendente — confira os dados</Text>
            </View>
          )}

          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={styles.statNum}>{contagens.seguidores}</Text>
              <Text style={styles.statLabel}>Seguidores</Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.statItem}>
              <Text style={styles.statNum}>{contagens.seguindo}</Text>
              <Text style={styles.statLabel}>Seguindo</Text>
            </View>
            {temPublicacoes && (
              <>
                <View style={styles.divider} />
                <View style={styles.statItem}>
                  <Text style={styles.statNum}>{contagens.posts}</Text>
                  <Text style={styles.statLabel}>Publicações</Text>
                </View>
              </>
            )}
          </View>
        </View>

        {!!perfil.bio && (
          <View style={styles.sectionCard}>
            <Text style={styles.sectionLabel}>Sobre</Text>
            <Text style={styles.bodyText}>{perfil.bio}</Text>
          </View>
        )}

        <View style={styles.sectionCard}>
          <Text style={styles.sectionLabel}>Contato e informações</Text>
          {!!perfil.documento && (
            <View style={styles.infoRow}>
              <View style={styles.iconBox}><Feather name="file-text" size={16} color={theme.colors.primary} /></View>
              <Text style={styles.infoText}>CNPJ: {formatarCNPJ(perfil.documento)}</Text>
            </View>
          )}
          {!!perfil.endereco && (
            <View style={styles.infoRow}>
              <View style={styles.iconBox}><Feather name="map-pin" size={16} color={theme.colors.primary} /></View>
              <Text style={styles.infoText}>{perfil.endereco}</Text>
            </View>
          )}
          {!!perfil.telefone && (
            <View style={styles.infoRow}>
              <View style={styles.iconBox}><Feather name="phone" size={16} color={theme.colors.primary} /></View>
              <Text style={styles.infoText}>{perfil.telefone}</Text>
            </View>
          )}
          {!!perfil.site && (
            <TouchableOpacity style={styles.infoRow} onPress={() => Linking.openURL(perfil.site)}>
              <View style={styles.iconBox}><Feather name="globe" size={16} color={theme.colors.primary} /></View>
              <Text style={[styles.infoText, styles.link]}>{perfil.site}</Text>
            </TouchableOpacity>
          )}
          {!perfil.documento && !perfil.endereco && !perfil.telefone && !perfil.site && (
            <Text style={styles.emptyText}>Nenhuma informação de contato cadastrada ainda.</Text>
          )}
        </View>

        {perfil.user_type === 'ong' && perfil.aceita_doacoes && (
          <View style={styles.donationCard}>
            <View style={styles.donationHeader}>
              <View style={styles.donationIconBox}><Feather name="heart" size={18} color={theme.colors.error} /></View>
              <View style={{ flex: 1 }}>
                <Text style={styles.donationTitle}>Essa ONG está aceitando doações</Text>
                {!!perfil.mensagem_doacao && <Text style={styles.donationMsg}>{perfil.mensagem_doacao}</Text>}
              </View>
            </View>
            {!!perfil.chave_pix && (
              <TouchableOpacity style={styles.pixBtn} onPress={copiarPix}>
                <Feather name="copy" size={14} color={theme.colors.background} />
                <Text style={styles.pixBtnText}>Copiar chave Pix</Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        {perfil.user_type === 'ong' && (
          <View style={styles.sectionCard}>
            <View style={styles.sectionHeaderRow}>
              <Text style={styles.sectionLabel}>Vagas</Text>
              {souEu && (
                <TouchableOpacity onPress={() => router.push('/criar-vaga')}>
                  <Text style={styles.sectionLink}>+ Nova vaga</Text>
                </TouchableOpacity>
              )}
            </View>
            <MinhasVagasList ongId={userId} podeGerenciar={souEu} />
          </View>
        )}

        {temPublicacoes && (
          <View style={styles.postsSection}>
            <Text style={styles.sectionLabel}>Publicações</Text>
            <PostsFeedList autorId={userId} podePublicar={souEu} semCartaoVazio={false} />
          </View>
        )}
      </View>

      {souEu && <PerfilSidebar visivel={sidebarAberta} onFechar={() => setSidebarAberta(false)} email={session?.user?.email} userId={userId} />}
      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.surface },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  content: { padding: 16, marginTop: -32 },

  headerCard: { backgroundColor: theme.colors.background, borderRadius: 24, padding: 20, paddingTop: 0, marginBottom: 16, ...theme.shadows.card },
  avatarWrap: { marginTop: -42, marginBottom: 12, alignSelf: 'flex-start' },
  avatarBorder: { padding: 4, backgroundColor: theme.colors.background, borderRadius: 100 },
  avatarCamBadge: { position: 'absolute', bottom: 4, right: 4, width: 26, height: 26, borderRadius: 13, backgroundColor: theme.colors.primary, justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: theme.colors.background },

  nameActionsRow: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 },
  nameRow: { flexDirection: 'row', alignItems: 'center' },
  name: { fontSize: 20, fontFamily: theme.fonts.heading, color: theme.colors.text },
  typeTag: { alignSelf: 'flex-start', backgroundColor: theme.colors.surface, paddingVertical: 4, paddingHorizontal: 12, borderRadius: 8, marginTop: 6 },
  typeTagText: { color: theme.colors.textLight, fontSize: 11, fontFamily: theme.fonts.button, textTransform: 'uppercase' },

  ownerActions: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  menuBtn: { width: 40, height: 40, borderRadius: 12, backgroundColor: theme.colors.surface, justifyContent: 'center', alignItems: 'center' },
  editBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: theme.colors.surface, borderRadius: 12, paddingVertical: 10, paddingHorizontal: 16 },
  editBtnText: { color: theme.colors.primary, fontFamily: theme.fonts.button, fontSize: 13 },
  
  followBtn: { backgroundColor: theme.colors.primary, borderRadius: 12, paddingVertical: 10, paddingHorizontal: 20 },
  followBtnText: { color: theme.colors.background, fontFamily: theme.fonts.button, fontSize: 13 },
  followingBtn: { backgroundColor: theme.colors.background, borderWidth: 1, borderColor: theme.colors.border },
  followingBtnText: { color: theme.colors.text },

  unverifiedTag: { backgroundColor: theme.colors.warningLight, alignSelf: 'flex-start', paddingVertical: 6, paddingHorizontal: 12, borderRadius: 8, marginTop: 12 },
  unverifiedTagText: { color: theme.colors.warning, fontSize: 11.5, fontFamily: theme.fonts.button },

  statsRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-around', backgroundColor: theme.colors.surface, borderRadius: 16, paddingVertical: 16, marginTop: 24 },
  statItem: { alignItems: 'center', flex: 1 },
  divider: { width: 1, height: 24, backgroundColor: theme.colors.border },
  statNum: { fontSize: 18, fontFamily: theme.fonts.heading, color: theme.colors.primary },
  statLabel: { fontSize: 11, fontFamily: theme.fonts.button, color: theme.colors.textLight, marginTop: 2 },

  sectionCard: { backgroundColor: theme.colors.background, borderRadius: 24, padding: 20, marginBottom: 16, ...theme.shadows.card },
  sectionHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  sectionLink: { fontFamily: theme.fonts.button, fontSize: 12.5, color: theme.colors.primary },
  sectionLabel: { fontSize: 15, fontFamily: theme.fonts.heading, color: theme.colors.text, marginBottom: 12 },
  bodyText: { color: theme.colors.textLight, fontFamily: theme.fonts.body, lineHeight: 22, fontSize: 14 },

  donationCard: { backgroundColor: theme.colors.background, borderRadius: 24, padding: 20, marginBottom: 16, borderWidth: 1, borderColor: theme.colors.error, ...theme.shadows.card },
  donationHeader: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  donationIconBox: { width: 40, height: 40, borderRadius: 20, backgroundColor: theme.colors.errorLight || theme.colors.surface, justifyContent: 'center', alignItems: 'center' },
  donationTitle: { fontFamily: theme.fonts.heading, fontSize: 14.5, color: theme.colors.text },
  donationMsg: { fontFamily: theme.fonts.body, fontSize: 13, color: theme.colors.textLight, marginTop: 4, lineHeight: 19 },
  pixBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: theme.colors.error, borderRadius: 14, paddingVertical: 12, marginTop: 14 },
  pixBtnText: { color: theme.colors.background, fontFamily: theme.fonts.button, fontSize: 13 },
  
  infoRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  iconBox: { width: 36, height: 36, borderRadius: 10, backgroundColor: theme.colors.surface, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  infoText: { flex: 1, color: theme.colors.text, fontFamily: theme.fonts.body, fontSize: 14, lineHeight: 20 },
  link: { color: theme.colors.primary, textDecorationLine: 'underline' },
  emptyText: { color: theme.colors.textLight, fontFamily: theme.fonts.body, fontSize: 13 },

  postsSection: { marginTop: 8 },
});