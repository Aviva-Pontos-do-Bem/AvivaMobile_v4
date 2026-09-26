import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal, Platform, TextInput, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { supabase } from '../supabase';
import ContaSegurancaModal from './ContaSegurancaModal';
import { theme } from '../lib/theme';

const avisar = (titulo, mensagem) => {
  if (Platform.OS === 'web') alert(`${titulo}: ${mensagem}`);
  else {
    const { Alert } = require('react-native');
    Alert.alert(titulo, mensagem);
  }
};

export default function PerfilSidebar({ visivel, onFechar, email, userId }) {
  const router = useRouter();
  const [modalSeguranca, setModalSeguranca] = useState(false);
  const [confirmandoExclusao, setConfirmandoExclusao] = useState(false);
  const [textoConfirmacao, setTextoConfirmacao] = useState('');
  const [excluindo, setExcluindo] = useState(false);

  function irPara(rota) {
    onFechar();
    router.push(rota);
  }

  async function sair() {
    onFechar();
    await supabase.auth.signOut();
  }

  async function confirmarExclusao() {
    if (textoConfirmacao.trim().toUpperCase() !== 'EXCLUIR') {
      return avisar('Confirmação necessária', 'Digite EXCLUIR (em maiúsculas) para confirmar.');
    }
    setExcluindo(true);
    const { error } = await supabase.from('profiles').update({ exclusao_solicitada_em: new Date().toISOString() }).eq('id', userId);
    setExcluindo(false);
    
    if (error) return avisar('Erro', 'Não foi possível registrar o pedido. Tente novamente.');

    avisar('Pedido registrado', 'Sua conta e seus dados serão excluídos em alguns dias. Você será desconectado.');
    setConfirmandoExclusao(false);
    setTextoConfirmacao('');
    onFechar();
    await supabase.auth.signOut();
  }

  return (
    <Modal visible={visivel} transparent animationType="fade" onRequestClose={onFechar}>
      <View style={styles.overlay}>
        <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={onFechar} />

        <View style={styles.panel}>
          <View style={styles.panelHeader}>
            <Text style={styles.panelTitle}>Configurações</Text>
            <TouchableOpacity onPress={onFechar} style={styles.closeBtn}>
              <Feather name="x" size={20} color={theme.colors.text} />
            </TouchableOpacity>
          </View>

          {!confirmandoExclusao ? (
            <View style={styles.menuContainer}>
              <TouchableOpacity style={styles.item} onPress={() => setModalSeguranca(true)}>
                <View style={styles.itemIcon}><Feather name="shield" size={18} color={theme.colors.text} /></View>
                <Text style={styles.itemText}>Segurança da conta</Text>
                <Feather name="chevron-right" size={18} color={theme.colors.border} />
              </TouchableOpacity>

              <TouchableOpacity style={styles.item} onPress={() => irPara('/sobre')}>
                <View style={styles.itemIcon}><Feather name="info" size={18} color={theme.colors.text} /></View>
                <Text style={styles.itemText}>Sobre o Aviva</Text>
                <Feather name="chevron-right" size={18} color={theme.colors.border} />
              </TouchableOpacity>

              <TouchableOpacity style={styles.item} onPress={() => irPara('/reclamacoes')}>
                <View style={styles.itemIcon}><Feather name="flag" size={18} color={theme.colors.text} /></View>
                <Text style={styles.itemText}>Central de Ajuda</Text>
                <Feather name="chevron-right" size={18} color={theme.colors.border} />
              </TouchableOpacity>

              <TouchableOpacity style={styles.item} onPress={() => irPara('/termos-privacidade')}>
                <View style={styles.itemIcon}><Feather name="file-text" size={18} color={theme.colors.text} /></View>
                <Text style={styles.itemText}>Termos e Privacidade</Text>
                <Feather name="chevron-right" size={18} color={theme.colors.border} />
              </TouchableOpacity>

              <View style={styles.divider} />

              <TouchableOpacity style={styles.item} onPress={sair}>
                <View style={[styles.itemIcon, { backgroundColor: theme.colors.surface }]}><Feather name="log-out" size={18} color={theme.colors.primary} /></View>
                <Text style={[styles.itemText, { color: theme.colors.primary, fontFamily: theme.fonts.button }]}>Sair da conta</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.item} onPress={() => setConfirmandoExclusao(true)}>
                <View style={[styles.itemIcon, { backgroundColor: theme.colors.errorLight }]}><Feather name="trash-2" size={18} color={theme.colors.error} /></View>
                <Text style={[styles.itemText, { color: theme.colors.error, fontFamily: theme.fonts.button }]}>Excluir conta</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.deleteBox}>
              <View style={styles.deleteIconBg}>
                <Feather name="alert-triangle" size={24} color={theme.colors.error} />
              </View>
              <Text style={styles.deleteTitle}>Atenção!</Text>
              <Text style={styles.deleteText}>
                Excluir sua conta é uma ação permanente. Suas informações, histórico e impacto serão removidos. Digite <Text style={{fontWeight: 'bold'}}>EXCLUIR</Text> para continuar.
              </Text>
              <TextInput
                style={styles.deleteInput}
                value={textoConfirmacao}
                onChangeText={setTextoConfirmacao}
                placeholder="EXCLUIR"
                placeholderTextColor={theme.colors.textLight}
                autoCapitalize="characters"
              />
              <TouchableOpacity style={styles.deleteConfirmBtn} onPress={confirmarExclusao} disabled={excluindo}>
                {excluindo ? <ActivityIndicator color={theme.colors.background} /> : <Text style={styles.deleteConfirmText}>Confirmar exclusão</Text>}
              </TouchableOpacity>
              <TouchableOpacity style={styles.deleteCancelBtn} onPress={() => { setConfirmandoExclusao(false); setTextoConfirmacao(''); }}>
                <Text style={styles.deleteCancelText}>Cancelar</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>

      <ContaSegurancaModal visivel={modalSeguranca} onFechar={() => setModalSeguranca(false)} email={email} />
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, flexDirection: 'row' },
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)' },
  panel: { width: 320, maxWidth: '85%', backgroundColor: theme.colors.background, paddingTop: 30, shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 15, elevation: 10 },
  panelHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 24, marginBottom: 20 },
  panelTitle: { fontSize: 20, fontFamily: theme.fonts.heading, color: theme.colors.text },
  closeBtn: { padding: 6, backgroundColor: theme.colors.surface, borderRadius: 100 },

  menuContainer: { paddingHorizontal: 12 },
  item: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, paddingHorizontal: 12, borderRadius: 16, marginBottom: 4 },
  itemIcon: { width: 36, height: 36, borderRadius: 10, backgroundColor: theme.colors.surface, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  itemText: { flex: 1, fontSize: 14.5, fontFamily: theme.fonts.body, color: theme.colors.text },
  divider: { height: 1, backgroundColor: theme.colors.border, marginVertical: 16, marginHorizontal: 12 },

  deleteBox: { padding: 24, alignItems: 'center' },
  deleteIconBg: { backgroundColor: theme.colors.errorLight, width: 64, height: 64, borderRadius: 32, justifyContent: 'center', alignItems: 'center', marginBottom: 16 },
  deleteTitle: { fontFamily: theme.fonts.heading, fontSize: 20, color: theme.colors.text, marginBottom: 12 },
  deleteText: { fontSize: 13.5, fontFamily: theme.fonts.body, color: theme.colors.textLight, lineHeight: 22, textAlign: 'center', marginBottom: 24 },
  deleteInput: { width: '100%', backgroundColor: theme.colors.surface, borderWidth: 1, borderColor: theme.colors.border, borderRadius: 12, padding: 16, marginBottom: 20, textAlign: 'center', fontFamily: theme.fonts.button, letterSpacing: 2, color: theme.colors.text },
  deleteConfirmBtn: { width: '100%', backgroundColor: theme.colors.error, borderRadius: 14, paddingVertical: 16, alignItems: 'center', marginBottom: 12 },
  deleteConfirmText: { color: theme.colors.background, fontFamily: theme.fonts.button, fontSize: 15 },
  deleteCancelBtn: { width: '100%', alignItems: 'center', paddingVertical: 12 },
  deleteCancelText: { color: theme.colors.textLight, fontFamily: theme.fonts.button, fontSize: 14 },
});