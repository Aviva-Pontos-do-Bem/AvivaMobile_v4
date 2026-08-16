import React, { useEffect, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Platform, ActivityIndicator, Image } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { Feather } from '@expo/vector-icons';
import { supabase } from '../../supabase';
import { useAuth } from '../../contexts/AuthContext';
import SafetyNotice from '../../components/SafetyNotice';
import { parseDataHoraBR } from '../../lib/format';
import { CATEGORIAS } from '../../lib/constants';
import { enviarImagemVaga } from '../../lib/upload';
import { theme } from '../../lib/theme';

// Só usado pra preencher o campo de texto ao abrir uma vaga existente pra
// edição — o inverso exato de parseDataHoraBR (ISO -> "DD/MM/AAAA HH:MM").
function isoParaTextoDataHora(dataIso) {
  if (!dataIso) return '';
  const data = new Date(dataIso);
  if (Number.isNaN(data.getTime())) return '';
  const dd = String(data.getDate()).padStart(2, '0');
  const mm = String(data.getMonth() + 1).padStart(2, '0');
  const yyyy = data.getFullYear();
  const hh = String(data.getHours()).padStart(2, '0');
  const min = String(data.getMinutes()).padStart(2, '0');
  return `${dd}/${mm}/${yyyy} ${hh}:${min}`;
}

export default function CriarVaga() {
  const { session } = useAuth();
  const router = useRouter();
  const { id: vagaId } = useLocalSearchParams();
  const emEdicao = !!vagaId;

  const [carregandoVaga, setCarregandoVaga] = useState(emEdicao);
  const [titulo, setTitulo] = useState('');
  const [descricao, setDescricao] = useState('');
  const [endereco, setEndereco] = useState('');
  const [dataHoraTexto, setDataHoraTexto] = useState('');
  const [vagasDisponiveis, setVagasDisponiveis] = useState('');
  const [contatoEmergencia, setContatoEmergencia] = useState('');
  const [categoria, setCategoria] = useState(CATEGORIAS[0]);
  const [idadeMinima, setIdadeMinima] = useState('');
  const [requisitos, setRequisitos] = useState('');
  const [oQueLevar, setOQueLevar] = useState('');
  const [visibilidade, setVisibilidade] = useState('publico');
  const [imagemLocal, setImagemLocal] = useState(null); // uri no aparelho, antes do upload
  const [imagemAtualUrl, setImagemAtualUrl] = useState(null); // já publicada (modo edição)
  const [enviandoImagem, setEnviandoImagem] = useState(false);
  const [loading, setLoading] = useState(false);
  const [excluindo, setExcluindo] = useState(false);

  const avisar = (titulo, mensagem) => {
    if (Platform.OS === 'web') alert(`${titulo}: ${mensagem}`);
    else {
      const { Alert } = require('react-native');
      Alert.alert(titulo, mensagem);
    }
  };

  useEffect(() => {
    if (!emEdicao) return;
    (async () => {
      const { data, error } = await supabase.from('vagas').select('*').eq('id', vagaId).single();
      if (error || !data) {
        avisar('Erro', 'Não foi possível carregar essa vaga.');
        router.back();
        return;
      }
      setTitulo(data.titulo || '');
      setDescricao(data.descricao || '');
      setEndereco(data.endereco || '');
      setDataHoraTexto(data.data_hora ? isoParaTextoDataHora(data.data_hora) : '');
      setVagasDisponiveis(String(data.vagas_disponiveis ?? ''));
      setContatoEmergencia(data.contato_emergencia || '');
      setCategoria(data.categoria || CATEGORIAS[0]);
      setIdadeMinima(data.idade_minima ? String(data.idade_minima) : '');
      setRequisitos(data.requisitos || '');
      setOQueLevar(data.o_que_levar || '');
      setVisibilidade(data.visibilidade || 'publico');
      setImagemAtualUrl(data.imagem_url || null);
      setCarregandoVaga(false);
    })();
  }, [emEdicao, vagaId]);

  async function escolherImagemCapa() {
    const permissao = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permissao.granted) return avisar('Permissão necessária', 'Precisamos de acesso às suas fotos.');

    const resultado = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.7,
      allowsEditing: true,
      aspect: [16, 9],
    });
    if (resultado.canceled || !resultado.assets?.length) return;
    setImagemLocal(resultado.assets[0].uri);
    setImagemAtualUrl(null);
  }

  async function salvar() {
    if (!titulo.trim() || !descricao.trim()) return avisar('Campos obrigatórios', 'Preencha título e descrição.');
    if (!endereco.trim()) return avisar('Campo obrigatório', 'Informe o endereço completo do evento.');
    if (!contatoEmergencia.trim()) return avisar('Campo obrigatório', 'Informe um telefone de contato para o dia.');
    const vagas = parseInt(vagasDisponiveis, 10);
    if (!vagasDisponiveis || Number.isNaN(vagas) || vagas <= 0) return avisar('Campo obrigatório', 'Informe quantas vagas estão disponíveis.');

    let dataHoraIso = null;
    if (dataHoraTexto.trim()) {
      dataHoraIso = parseDataHoraBR(dataHoraTexto);
      if (!dataHoraIso) return avisar('Data inválida', 'Use o formato DD/MM/AAAA HH:MM.');
    } else {
      return avisar('Campo obrigatório', 'Informe a data e o horário do evento.');
    }

    setLoading(true);
    try {
      let imagemUrlFinal = imagemAtualUrl;
      if (imagemLocal) {
        setEnviandoImagem(true);
        imagemUrlFinal = await enviarImagemVaga(imagemLocal, session.user.id);
        setEnviandoImagem(false);
      }

      const dadosVaga = {
        titulo: titulo.trim(), descricao: descricao.trim(), endereco: endereco.trim(),
        localizacao: endereco.trim(), data_hora: dataHoraIso, vagas_disponiveis: vagas, contato_emergencia: contatoEmergencia.trim(),
        categoria, idade_minima: idadeMinima ? parseInt(idadeMinima, 10) : null, requisitos: requisitos.trim() || null,
        o_que_levar: oQueLevar.trim() || null, imagem_url: imagemUrlFinal, visibilidade,
      };

      if (emEdicao) {
        const { error } = await supabase.from('vagas').update(dadosVaga).eq('id', vagaId);
        if (error) throw error;
        avisar('Vaga atualizada!', 'As alterações já estão no ar.');
      } else {
        const { error } = await supabase.from('vagas').insert({ ong_id: session.user.id, ativa: true, ...dadosVaga });
        if (error) throw error;
        avisar('Vaga publicada!', 'Ela já aparece no feed dos voluntários.');
      }
      router.back();
    } catch (err) {
      avisar('Erro', err.message || 'Não foi possível salvar a vaga.');
    } finally {
      setLoading(false);
      setEnviandoImagem(false);
    }
  }

  function confirmarExclusao() {
    const excluir = async () => {
      setExcluindo(true);
      const { error } = await supabase.from('vagas').delete().eq('id', vagaId);
      setExcluindo(false);
      if (error) return avisar('Erro ao excluir', error.message);
      router.back();
    };
    if (Platform.OS === 'web') {
      if (window.confirm('Excluir esta vaga? Essa ação não pode ser desfeita.')) excluir();
      return;
    }
    const { Alert } = require('react-native');
    Alert.alert('Excluir vaga', 'Essa ação não pode ser desfeita.', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Excluir', style: 'destructive', onPress: excluir },
    ]);
  }

  if (carregandoVaga) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  const imagemParaMostrar = imagemLocal || imagemAtualUrl;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>{emEdicao ? 'Editar Vaga' : 'Nova Ação'}</Text>
        {emEdicao && (
          <TouchableOpacity onPress={confirmarExclusao} disabled={excluindo} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            {excluindo ? <ActivityIndicator size="small" color={theme.colors.error} /> : <Feather name="trash-2" size={20} color={theme.colors.error} />}
          </TouchableOpacity>
        )}
      </View>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <SafetyNotice text="Endereço, data/hora e um contato do dia são obrigatórios para garantir a segurança e organização do evento." />

        <Text style={styles.label}>Categoria da Causa</Text>
        <View style={styles.categoryRow}>
          {CATEGORIAS.map((c) => (
            <TouchableOpacity key={c} style={[styles.categoryChip, categoria === c && styles.categoryChipActive]} onPress={() => setCategoria(c)}>
              <Text style={[styles.categoryChipText, categoria === c && styles.categoryChipTextActive]}>{c}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.label}>Título da vaga *</Text>
        <TextInput style={styles.input} placeholder="Ex: Mutirão de plantio" value={titulo} onChangeText={setTitulo} placeholderTextColor={theme.colors.textLight} />

        <Text style={styles.label}>Descrição detalhada *</Text>
        <TextInput style={[styles.input, styles.textArea]} placeholder="Descreva a atividade em detalhes para o voluntário saber o que fará." value={descricao} onChangeText={setDescricao} multiline numberOfLines={5} placeholderTextColor={theme.colors.textLight} />

        <Text style={styles.label}>Endereço completo *</Text>
        <TextInput style={styles.input} placeholder="Rua, número, bairro, cidade" value={endereco} onChangeText={setEndereco} placeholderTextColor={theme.colors.textLight} />

        <View style={styles.rowGrid}>
          <View style={{ flex: 1 }}>
            <Text style={styles.label}>Data e horário *</Text>
            <TextInput style={styles.input} placeholder="DD/MM/AAAA HH:MM" value={dataHoraTexto} onChangeText={setDataHoraTexto} placeholderTextColor={theme.colors.textLight} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.label}>Vagas *</Text>
            <TextInput style={styles.input} placeholder="Ex: 10" keyboardType="numeric" value={vagasDisponiveis} onChangeText={setVagasDisponiveis} placeholderTextColor={theme.colors.textLight} />
          </View>
        </View>

        <View style={styles.rowGrid}>
          <View style={{ flex: 1 }}>
            <Text style={styles.label}>Contato no dia *</Text>
            <TextInput style={styles.input} placeholder="Telefone do responsável" keyboardType="phone-pad" value={contatoEmergencia} onChangeText={setContatoEmergencia} placeholderTextColor={theme.colors.textLight} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.label}>Idade Mínima</Text>
            <TextInput style={styles.input} placeholder="Ex: 16 (opcional)" keyboardType="numeric" value={idadeMinima} onChangeText={setIdadeMinima} placeholderTextColor={theme.colors.textLight} />
          </View>
        </View>

        <Text style={styles.label}>Requisitos (opcional)</Text>
        <TextInput style={[styles.input, { height: 80 }]} placeholder="Ex: disponibilidade aos sábados, etc." value={requisitos} onChangeText={setRequisitos} multiline numberOfLines={3} placeholderTextColor={theme.colors.textLight} />

        <Text style={styles.label}>O que levar (opcional)</Text>
        <TextInput style={[styles.input, { height: 80 }]} placeholder="Ex: protetor solar, garrafa d'água" value={oQueLevar} onChangeText={setOQueLevar} multiline numberOfLines={3} placeholderTextColor={theme.colors.textLight} />

        <Text style={styles.label}>Imagem de capa (opcional)</Text>
        {imagemParaMostrar ? (
          <View style={styles.coverPreviewWrap}>
            <Image source={{ uri: imagemParaMostrar }} style={styles.coverPreview} />
            <TouchableOpacity style={styles.coverRemoveBtn} onPress={() => { setImagemLocal(null); setImagemAtualUrl(null); }}>
              <Feather name="x" size={16} color={theme.colors.background} />
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity style={styles.coverPicker} onPress={escolherImagemCapa}>
            <Feather name="image" size={22} color={theme.colors.textLight} />
            <Text style={styles.coverPickerText}>Toque para escolher uma foto</Text>
          </TouchableOpacity>
        )}

        <Text style={styles.label}>Quem pode ver essa vaga?</Text>
        <View style={styles.visibilityRow}>
          <TouchableOpacity style={[styles.visibilityChip, visibilidade === 'publico' && styles.visibilityChipActive]} onPress={() => setVisibilidade('publico')}>
            <Feather name="globe" size={14} color={visibilidade === 'publico' ? theme.colors.background : theme.colors.textLight} />
            <Text style={[styles.visibilityChipText, visibilidade === 'publico' && styles.visibilityChipTextActive]}>Todo mundo</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.visibilityChip, visibilidade === 'seguidores' && styles.visibilityChipActive]} onPress={() => setVisibilidade('seguidores')}>
            <Feather name="lock" size={14} color={visibilidade === 'seguidores' ? theme.colors.background : theme.colors.textLight} />
            <Text style={[styles.visibilityChipText, visibilidade === 'seguidores' && styles.visibilityChipTextActive]}>Só quem me segue</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={styles.saveButton} onPress={salvar} disabled={loading}>
          {loading ? (
            <ActivityIndicator color={theme.colors.background} />
          ) : (
            <Text style={styles.saveButtonText}>{enviandoImagem ? 'Enviando imagem...' : emEdicao ? 'Salvar alterações' : 'Publicar vaga'}</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: theme.colors.background },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: 50, paddingBottom: 16, backgroundColor: theme.colors.background, borderBottomWidth: 1, borderBottomColor: theme.colors.surface },
  headerTitle: { fontSize: 20, fontFamily: theme.fonts.heading, color: theme.colors.text },

  scrollContent: { padding: 20, paddingBottom: 40 },
  label: { fontSize: 13, fontFamily: theme.fonts.button, color: theme.colors.textLight, marginBottom: 8, marginTop: 16 },
  input: { backgroundColor: theme.colors.surface, fontFamily: theme.fonts.body, padding: 16, borderRadius: 16, borderWidth: 1, borderColor: theme.colors.border, color: theme.colors.text },
  textArea: { height: 120, textAlignVertical: 'top' },
  rowGrid: { flexDirection: 'row', gap: 12 },

  categoryRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 4 },
  categoryChip: { paddingVertical: 10, paddingHorizontal: 16, borderRadius: 100, backgroundColor: theme.colors.surface, borderWidth: 1, borderColor: theme.colors.border },
  categoryChipActive: { backgroundColor: theme.colors.primary, borderColor: theme.colors.primary },
  categoryChipText: { color: theme.colors.textLight, fontFamily: theme.fonts.button, fontSize: 13 },
  categoryChipTextActive: { color: theme.colors.background },

  coverPicker: { height: 140, borderRadius: 16, borderWidth: 1, borderColor: theme.colors.border, borderStyle: 'dashed', backgroundColor: theme.colors.surface, justifyContent: 'center', alignItems: 'center', gap: 8 },
  coverPickerText: { fontFamily: theme.fonts.body, fontSize: 12.5, color: theme.colors.textLight },
  coverPreviewWrap: { height: 140, borderRadius: 16, overflow: 'hidden' },
  coverPreview: { width: '100%', height: '100%' },
  coverRemoveBtn: { position: 'absolute', top: 8, right: 8, backgroundColor: 'rgba(0,0,0,0.55)', borderRadius: 14, width: 28, height: 28, justifyContent: 'center', alignItems: 'center' },

  visibilityRow: { flexDirection: 'row', gap: 10 },
  visibilityChip: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 12, borderRadius: 14, backgroundColor: theme.colors.surface, borderWidth: 1, borderColor: theme.colors.border },
  visibilityChipActive: { backgroundColor: theme.colors.primary, borderColor: theme.colors.primary },
  visibilityChipText: { fontFamily: theme.fonts.button, fontSize: 12.5, color: theme.colors.textLight },
  visibilityChipTextActive: { color: theme.colors.background },

  saveButton: { backgroundColor: theme.colors.primary, padding: 16, borderRadius: 16, alignItems: 'center', marginTop: 32 },
  saveButtonText: { color: theme.colors.background, fontFamily: theme.fonts.button, fontSize: 15 },
});
