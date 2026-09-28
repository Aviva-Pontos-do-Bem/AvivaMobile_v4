import React, { useState } from 'react';
import { View, Text, Modal, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, Platform, ScrollView, KeyboardAvoidingView } from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { Feather } from '@expo/vector-icons';
import { supabase } from '../supabase';
import { useAuth } from '../contexts/AuthContext';
import { enviarDocumentoFiscal } from '../lib/upload';
import { parseDataBR } from '../lib/format';
import { gerarHtmlDeclaracaoDoacao } from '../lib/declaracaoDoacao';
import { theme } from '../lib/theme';

const avisar = (titulo, mensagem) => {
  if (Platform.OS === 'web') alert(`${titulo}: ${mensagem}`);
  else {
    const { Alert } = require('react-native');
    Alert.alert(titulo, mensagem);
  }
};

// Registra uma doação de empresa -> ONG (art. 13 da Lei 9.249/95) e, ao
// concluir, já gera a declaração padrão pra empresa levar pra contabilidade
// — o mesmo padrão de exportação em PDF usado no relatório ESG.
export default function RegistrarDoacaoModal({ visivel, onFechar, ong, onSucesso }) {
  const { session, profile } = useAuth();
  const [valorTexto, setValorTexto] = useState('');
  const [dataTexto, setDataTexto] = useState('');
  const [comprovantePath, setComprovantePath] = useState(null);
  const [comprovanteNome, setComprovanteNome] = useState('');
  const [enviandoComprovante, setEnviandoComprovante] = useState(false);
  const [enviando, setEnviando] = useState(false);

  async function anexarComprovante() {
    const resultado = await DocumentPicker.getDocumentAsync({ type: ['application/pdf', 'image/*'] });
    if (resultado.canceled || !resultado.assets?.length) return;
    const asset = resultado.assets[0];
    setEnviandoComprovante(true);
    try {
      const caminho = await enviarDocumentoFiscal(asset.uri, session.user.id, 'comprovante');
      setComprovantePath(caminho);
      setComprovanteNome(asset.name || caminho.split('/').pop());
    } catch (err) {
      avisar('Erro ao enviar comprovante', err.message || 'Tente novamente.');
    } finally {
      setEnviandoComprovante(false);
    }
  }

  function limpar() {
    setValorTexto('');
    setDataTexto('');
    setComprovantePath(null);
    setComprovanteNome('');
  }

  async function confirmar() {
    const valor = Number(valorTexto.replace(/\./g, '').replace(',', '.'));
    if (!valorTexto.trim() || Number.isNaN(valor) || valor <= 0) {
      return avisar('Valor inválido', 'Informe o valor doado.');
    }
    const dataIso = parseDataBR(dataTexto);
    if (!dataIso) return avisar('Data inválida', 'Use o formato DD/MM/AAAA.');

    setEnviando(true);
    try {
      const { error } = await supabase.from('doacoes').insert({
        empresa_id: session.user.id,
        ong_id: ong.id,
        valor,
        data_doacao: dataIso,
        comprovante_url: comprovantePath,
      });
      if (error) throw error;

      const html = gerarHtmlDeclaracaoDoacao({
        ongNome: ong.full_name,
        ongCnpj: ong.documento || 'não informado',
        empresaNome: profile?.full_name,
        empresaCnpj: profile?.documento || 'não informado',
        valor,
        dataDoacao: dataIso,
      });

      if (Platform.OS === 'web') {
        await Print.printAsync({ html });
      } else {
        const { uri } = await Print.printToFileAsync({ html });
        const podeCompartilhar = await Sharing.isAvailableAsync();
        if (podeCompartilhar) await Sharing.shareAsync(uri, { mimeType: 'application/pdf', UTI: 'com.adobe.pdf' });
      }

      limpar();
      onSucesso?.();
    } catch (err) {
      avisar('Erro ao registrar doação', err.message || 'Tente novamente.');
    } finally {
      setEnviando(false);
    }
  }

  return (
    <Modal visible={visivel} animationType="slide" transparent onRequestClose={onFechar}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.backdrop}>
        <View style={styles.card}>
          <View style={styles.header}>
            <Text style={styles.title}>Registrar doação dedutível</Text>
            <TouchableOpacity onPress={onFechar}><Feather name="x" size={24} color={theme.colors.textLight} /></TouchableOpacity>
          </View>
          <Text style={styles.subtitle}>Para {ong?.full_name}</Text>

          <ScrollView>
            <Text style={styles.label}>Valor doado (R$) *</Text>
            <TextInput style={styles.input} placeholder="Ex: 5000,00" keyboardType="numeric" value={valorTexto} onChangeText={setValorTexto} placeholderTextColor={theme.colors.textLight} />

            <Text style={styles.label}>Data da doação *</Text>
            <TextInput style={styles.input} placeholder="DD/MM/AAAA" value={dataTexto} onChangeText={setDataTexto} placeholderTextColor={theme.colors.textLight} />

            <Text style={styles.label}>Comprovante bancário (opcional)</Text>
            <TouchableOpacity style={styles.anexoBtn} onPress={anexarComprovante} disabled={enviandoComprovante}>
              {enviandoComprovante ? (
                <ActivityIndicator size="small" color={theme.colors.secondary} />
              ) : (
                <Feather name="paperclip" size={16} color={theme.colors.secondary} />
              )}
              <Text style={styles.anexoBtnText} numberOfLines={1}>{comprovanteNome || 'Anexar comprovante (PDF ou imagem)'}</Text>
            </TouchableOpacity>

            <Text style={styles.hint}>
              Ao confirmar, geramos a declaração de doação (modelo do art. 13 da Lei 9.249/95) pronta pra você levar à sua contabilidade.
            </Text>

            <TouchableOpacity style={styles.submitBtn} onPress={confirmar} disabled={enviando}>
              {enviando ? <ActivityIndicator color={theme.colors.background} /> : <Text style={styles.submitBtnText}>Confirmar doação</Text>}
            </TouchableOpacity>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  card: { backgroundColor: theme.colors.background, borderTopLeftRadius: 30, borderTopRightRadius: 30, padding: 24, maxHeight: '85%' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  title: { fontSize: 18, fontFamily: theme.fonts.heading, color: theme.colors.text },
  subtitle: { fontSize: 13, fontFamily: theme.fonts.body, color: theme.colors.textLight, marginTop: 4, marginBottom: 16 },
  label: { fontSize: 13, fontFamily: theme.fonts.button, color: theme.colors.text, marginBottom: 8, marginTop: 16 },
  input: { backgroundColor: theme.colors.surface, fontFamily: theme.fonts.body, padding: 16, borderRadius: 16, borderWidth: 1, borderColor: theme.colors.border, color: theme.colors.text },
  anexoBtn: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: theme.colors.surface, borderRadius: 14, padding: 14, borderWidth: 1, borderColor: theme.colors.border },
  anexoBtnText: { flex: 1, fontSize: 12.5, fontFamily: theme.fonts.body, color: theme.colors.text },
  hint: { fontSize: 11.5, fontFamily: theme.fonts.body, color: theme.colors.textLight, marginTop: 16, lineHeight: 16 },
  submitBtn: { backgroundColor: theme.colors.primary, padding: 16, borderRadius: 16, alignItems: 'center', marginTop: 24, marginBottom: 20 },
  submitBtnText: { color: theme.colors.background, fontFamily: theme.fonts.button, fontSize: 15 },
});
