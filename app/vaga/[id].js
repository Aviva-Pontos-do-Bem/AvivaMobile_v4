import React, { useEffect, useState } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, ScrollView, ActivityIndicator, Platform, Image, Modal, TextInput, KeyboardAvoidingView } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { supabase } from '../../supabase';
import { useAuth } from '../../contexts/AuthContext';
import Avatar from '../../components/Avatar';
import SafetyNotice from '../../components/SafetyNotice';
import { formatarDataEvento } from '../../lib/format';
import { theme } from '../../lib/theme';

// Rota fora dos grupos (voluntario)/(ong)/(empresa) de propósito — igual ao
// perfil-publico/[id]: precisa abrir para qualquer papel (voluntário
// candidatando-se, empresa vendo a vaga antes de apoiar, etc.), e rotas
// dentro de um grupo protegido por Stack.Protected só existem para quem
// tem aquele userType.

export default function DetalheVaga() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { session, userType } = useAuth();
  const isVoluntario = userType === 'voluntario';

  const [vaga, setVaga] = useState(null);
  const [loading, setLoading] = useState(true);
  const [jaCandidatado, setJaCandidatado] = useState(false);
  const [modalAberto, setModalAberto] = useState(false);

  const avisar = (titulo, mensagem) => {
    if (Platform.OS === 'web') alert(`${titulo}: ${mensagem}`);
    else {
      const { Alert } = require('react-native');
      Alert.alert(titulo, mensagem);
    }
  };

  useEffect(() => {
    async function carregar() {
      setLoading(true);
      const { data: vagaData, error: vagaError } = await supabase
        .from('vagas')
        .select('id, titulo, descricao, categoria, localizacao, endereco, imagem_url, data_hora, vagas_disponiveis, idade_minima, requisitos, o_que_levar, contato_emergencia, profiles ( id, full_name, foto_url, verificado, bio )')
        .eq('id', id)
        .single();

      if (!vagaError) setVaga(vagaData);

      if (isVoluntario) {
        const { data: candidatura } = await supabase
          .from('candidaturas')
          .select('id')
          .eq('vaga_id', id)
          .eq('voluntario_id', session.user.id)
          .maybeSingle();
        setJaCandidatado(!!candidatura);
      }
      setLoading(false);
    }
    carregar();
  }, [id]);

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  if (!vaga) return (
    <View style={styles.centered}>
      <Text style={styles.errorText}>Não foi possível encontrar esta vaga.</Text>
      <TouchableOpacity style={styles.backBtnModal} onPress={() => router.back()}>
        <Text style={styles.backBtnTextModal}>Voltar</Text>
      </TouchableOpacity>
    </View>
  );

  const ong = vaga.profiles;
  const dataFormatada = formatarDataEvento(vaga.data_hora);

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.imageContainer}>
          {vaga.imagem_url ? (
            <Image source={{ uri: vaga.imagem_url }} style={styles.cover} />
          ) : (
            <View style={[styles.cover, styles.coverPlaceholder]}>
              <Feather name="image" size={40} color={theme.colors.border} />
            </View>
          )}
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Feather name="arrow-left" size={24} color={theme.colors.text} />
          </TouchableOpacity>
        </View>

        <View style={styles.content}>
          <View style={styles.titleCard}>
            {!!vaga.categoria && (
              <View style={styles.categoryTag}>
                <Text style={styles.categoryText}>{vaga.categoria}</Text>
              </View>
            )}
            <Text style={styles.title}>{vaga.titulo}</Text>
            
            <TouchableOpacity style={styles.ongCard} onPress={() => router.push(`/perfil-publico/${ong.id}`)}>
              <Avatar nome={ong?.full_name} fotoUrl={ong?.foto_url} verificado={ong?.verificado} size={44} />
              <View style={styles.ongInfo}>
                <View style={styles.nameRow}>
                  <Text style={styles.ongName} numberOfLines={1}>{ong?.full_name}</Text>
                  {ong?.verificado && <Feather name="check-circle" size={14} color={theme.colors.secondary} style={{ marginLeft: 4 }} />}
                </View>
                <Text style={styles.ongLink}>Ver perfil completo</Text>
              </View>
              <Feather name="chevron-right" size={20} color={theme.colors.textLight} />
            </TouchableOpacity>
          </View>

          <View style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>Detalhes da Ação</Text>
            {dataFormatada && (
              <View style={styles.infoRow}>
                <View style={styles.iconBox}><Feather name="calendar" size={18} color={theme.colors.primary} /></View>
                <Text style={styles.infoText}>{dataFormatada}</Text>
              </View>
            )}
            <View style={styles.infoRow}>
              <View style={styles.iconBox}><Feather name="map-pin" size={18} color={theme.colors.primary} /></View>
              <Text style={styles.infoText}>{vaga.endereco || vaga.localizacao || 'Local a combinar'}</Text>
            </View>
            {vaga.vagas_disponiveis != null && (
              <View style={styles.infoRow}>
                <View style={styles.iconBox}><Feather name="users" size={18} color={theme.colors.primary} /></View>
                <Text style={styles.infoText}>{vaga.vagas_disponiveis} vagas disponíveis</Text>
              </View>
            )}
          </View>

          <View style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>Sobre a vaga</Text>
            <Text style={styles.descriptionText}>{vaga.descricao}</Text>

            {!!vaga.requisitos && (
              <View style={styles.subSection}>
                <Text style={styles.subSectionTitle}>Requisitos</Text>
                <Text style={styles.descriptionText}>{vaga.requisitos}</Text>
              </View>
            )}

            {!!vaga.o_que_levar && (
              <View style={styles.subSection}>
                <Text style={styles.subSectionTitle}>O que levar</Text>
                <Text style={styles.descriptionText}>{vaga.o_que_levar}</Text>
              </View>
            )}
          </View>

          <View style={{ marginBottom: 100 }}>
            <SafetyNotice text="Por segurança, nunca faça pagamentos antecipados ou compartilhe dados bancários com organizações. Confirme o endereço e horário antes de sair de casa." />
          </View>
        </View>
      </ScrollView>

      {isVoluntario && (
        <View style={styles.bottomBar}>
          <TouchableOpacity
            style={[styles.actionBtn, jaCandidatado && styles.actionBtnDisabled]}
            onPress={() => setModalAberto(true)}
            disabled={jaCandidatado}
          >
            <Text style={styles.actionBtnText}>
              {jaCandidatado ? 'Candidatura enviada ✓' : 'Quero me candidatar'}
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Modal permanece igual à versão anterior, apenas com as cores do theme */}
      {isVoluntario && (
        <ModalCandidatura visivel={modalAberto} onFechar={() => setModalAberto(false)} vagaId={id} voluntarioId={session.user.id} onSucesso={() => { setJaCandidatado(true); setModalAberto(false); avisar('Sucesso!', 'Candidatura enviada para a ONG.'); }} onErro={(msg) => avisar('Erro', msg)} />
      )}
    </View>
  );
}

// ... Função ModalCandidatura (igual ao arquivo anterior, garantindo uso do theme.colors) ...
function ModalCandidatura({ visivel, onFechar, vagaId, voluntarioId, onSucesso, onErro }) {
  const [mensagem, setMensagem] = useState('');
  const [telefone, setTelefone] = useState('');
  const [confirmado, setConfirmado] = useState(false);
  const [enviando, setEnviando] = useState(false);

  async function enviar() {
    if (!telefone.trim()) return onErro('Informe um telefone de contato.');
    if (!confirmado) return onErro('Confirme que você leu o endereço e o horário.');
    setEnviando(true);
    const { error } = await supabase.from('candidaturas').insert({ vaga_id: vagaId, voluntario_id: voluntarioId, status: 'pendente', mensagem: mensagem.trim() || null, telefone_contato: telefone.trim() });
    setEnviando(false);
    if (error) onErro(error.message);
    else onSucesso();
  }

  return (
    <Modal visible={visivel} animationType="slide" transparent onRequestClose={onFechar}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.modalBackdrop}>
        <View style={styles.modalCard}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Confirmar candidatura</Text>
            <TouchableOpacity onPress={onFechar}><Feather name="x" size={24} color={theme.colors.textLight} /></TouchableOpacity>
          </View>
          <ScrollView>
            <Text style={styles.modalLabel}>Telefone de contato *</Text>
            <TextInput style={styles.modalInput} placeholder="(11) 90000-0000" keyboardType="phone-pad" value={telefone} onChangeText={setTelefone} placeholderTextColor={theme.colors.textLight} />
            <Text style={styles.modalLabel}>Mensagem (opcional)</Text>
            <TextInput style={[styles.modalInput, styles.modalTextArea]} placeholder="Conte por que quer participar" multiline numberOfLines={4} value={mensagem} onChangeText={setMensagem} placeholderTextColor={theme.colors.textLight} />
            <TouchableOpacity style={styles.checkboxRow} onPress={() => setConfirmado(!confirmado)}>
              <View style={[styles.checkbox, confirmado && styles.checkboxChecked]}>{confirmado && <Feather name="check" size={14} color={theme.colors.background} />}</View>
              <Text style={styles.checkboxLabel}>Li o endereço e o horário do evento e estarei disponível.</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.modalSubmit} onPress={enviar} disabled={enviando}>
              {enviando ? <ActivityIndicator color={theme.colors.background} /> : <Text style={styles.modalSubmitText}>Enviar candidatura</Text>}
            </TouchableOpacity>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.surface },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  errorText: { fontFamily: theme.fonts.button, color: theme.colors.error, marginBottom: 16 },
  backBtnModal: { backgroundColor: theme.colors.primary, padding: 12, borderRadius: 12 },
  backBtnTextModal: { color: theme.colors.background, fontFamily: theme.fonts.button },

  imageContainer: { position: 'relative' },
  cover: { width: '100%', height: 280, backgroundColor: theme.colors.border },
  coverPlaceholder: { justifyContent: 'center', alignItems: 'center', backgroundColor: '#E2E8F0' },
  backButton: { position: 'absolute', top: 50, left: 20, backgroundColor: 'rgba(255,255,255,0.9)', width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center', ...theme.shadows.card },

  content: { padding: 16, marginTop: -30 },
  titleCard: { backgroundColor: theme.colors.background, borderRadius: 24, padding: 20, marginBottom: 16, ...theme.shadows.card },
  categoryTag: { backgroundColor: theme.colors.successLight, alignSelf: 'flex-start', paddingVertical: 6, paddingHorizontal: 12, borderRadius: 8, marginBottom: 12 },
  categoryText: { color: theme.colors.success, fontFamily: theme.fonts.button, fontSize: 11, textTransform: 'uppercase', letterSpacing: 0.5 },
  title: { fontSize: 24, fontFamily: theme.fonts.heading, color: theme.colors.text, marginBottom: 20, lineHeight: 30 },
  
  ongCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: theme.colors.surface, padding: 12, borderRadius: 16 },
  ongInfo: { flex: 1, marginLeft: 12 },
  nameRow: { flexDirection: 'row', alignItems: 'center' },
  ongName: { fontFamily: theme.fonts.button, fontSize: 15, color: theme.colors.text },
  ongLink: { fontFamily: theme.fonts.body, fontSize: 12, color: theme.colors.primary, marginTop: 2 },

  sectionCard: { backgroundColor: theme.colors.background, borderRadius: 24, padding: 20, marginBottom: 16, ...theme.shadows.card },
  sectionTitle: { fontSize: 16, fontFamily: theme.fonts.heading, color: theme.colors.text, marginBottom: 16 },
  infoRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  iconBox: { width: 36, height: 36, borderRadius: 10, backgroundColor: theme.colors.surface, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  infoText: { flex: 1, fontFamily: theme.fonts.body, fontSize: 14, color: theme.colors.text, lineHeight: 20 },
  
  descriptionText: { fontFamily: theme.fonts.body, fontSize: 14, color: theme.colors.textLight, lineHeight: 22 },
  subSection: { marginTop: 20 },
  subSectionTitle: { fontFamily: theme.fonts.button, fontSize: 14, color: theme.colors.text, marginBottom: 8 },

  bottomBar: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: theme.colors.background, padding: 20, paddingBottom: 30, borderTopWidth: 1, borderTopColor: theme.colors.border },
  actionBtn: { backgroundColor: theme.colors.primary, paddingVertical: 16, borderRadius: 16, alignItems: 'center' },
  actionBtnDisabled: { backgroundColor: theme.colors.textLight },
  actionBtnText: { color: theme.colors.background, fontFamily: theme.fonts.button, fontSize: 16 },

  modalBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalCard: { backgroundColor: theme.colors.background, borderTopLeftRadius: 30, borderTopRightRadius: 30, padding: 24, maxHeight: '90%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
  modalTitle: { fontSize: 18, fontFamily: theme.fonts.heading, color: theme.colors.text },
  modalLabel: { fontSize: 13, fontFamily: theme.fonts.button, color: theme.colors.text, marginBottom: 8, marginTop: 16 },
  modalInput: { backgroundColor: theme.colors.surface, fontFamily: theme.fonts.body, padding: 16, borderRadius: 16, borderWidth: 1, borderColor: theme.colors.border },
  modalTextArea: { height: 100, textAlignVertical: 'top' },
  checkboxRow: { flexDirection: 'row', alignItems: 'center', marginTop: 24, gap: 12 },
  checkbox: { width: 24, height: 24, borderRadius: 8, borderWidth: 2, borderColor: theme.colors.primary, justifyContent: 'center', alignItems: 'center' },
  checkboxChecked: { backgroundColor: theme.colors.primary },
  checkboxLabel: { flex: 1, fontSize: 13, fontFamily: theme.fonts.body, color: theme.colors.text, lineHeight: 20 },
  modalSubmit: { backgroundColor: theme.colors.secondary, padding: 16, borderRadius: 16, alignItems: 'center', marginTop: 32, marginBottom: 20 },
  modalSubmitText: { color: theme.colors.background, fontFamily: theme.fonts.button, fontSize: 16 },
});