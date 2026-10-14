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
import { ODS, NUMEROS_ODS, MAX_ODS_POR_VAGA, sugerirOds, alternarOds } from '../../lib/ods';
import { TIPOS_IMPACTO } from '../../lib/impactoAmbiental';
import { enviarImagemVaga } from '../../lib/upload';
import { theme } from '../../lib/theme';
import HeaderDecor from '../../components/HeaderDecor';

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

function Secao({ icone, titulo, children }) {
  return (
    <View style={styles.secao}>
      <View style={styles.secaoTopo}>
        <View style={styles.secaoIcone}>
          <Feather name={icone} size={17} color={theme.colors.primary} />
        </View>
        <Text style={styles.secaoTitulo}>{titulo}</Text>
      </View>
      {children}
    </View>
  );
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
  const [horasEstimadas, setHorasEstimadas] = useState('');
  const [contatoEmergencia, setContatoEmergencia] = useState('');
  const [categoria, setCategoria] = useState(CATEGORIAS[0]);
  const [ods, setOds] = useState(() => sugerirOds(CATEGORIAS[0]));
  const [impactoTipo, setImpactoTipo] = useState(null);
  const [impactoQtd, setImpactoQtd] = useState('');
  const [idadeMinima, setIdadeMinima] = useState('');
  const [requisitos, setRequisitos] = useState('');
  const [oQueLevar, setOQueLevar] = useState('');
  const [visibilidade, setVisibilidade] = useState('publico');
  const [modalidade, setModalidade] = useState('presencial');
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
      setHorasEstimadas(data.horas_estimadas != null ? String(data.horas_estimadas) : '');
      setContatoEmergencia(data.contato_emergencia || '');
      setCategoria(data.categoria || CATEGORIAS[0]);
      setOds(data.ods || []);
      setImpactoTipo(data.impacto_tipo || null);
      setImpactoQtd(data.impacto_por_voluntario != null ? String(data.impacto_por_voluntario).replace('.', ',') : '');
      setIdadeMinima(data.idade_minima ? String(data.idade_minima) : '');
      setRequisitos(data.requisitos || '');
      setOQueLevar(data.o_que_levar || '');
      setVisibilidade(data.visibilidade || 'publico');
      setModalidade(data.modalidade || 'presencial');
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
    if (modalidade !== 'remoto' && !endereco.trim()) return avisar('Campo obrigatório', 'Informe o endereço completo do evento.');
    if (!contatoEmergencia.trim()) return avisar('Campo obrigatório', 'Informe um telefone de contato para o dia.');
    const vagas = parseInt(vagasDisponiveis, 10);
    if (!vagasDisponiveis || Number.isNaN(vagas) || vagas <= 0) return avisar('Campo obrigatório', 'Informe quantas vagas estão disponíveis.');

    let quantidadeImpacto = null;
    if (impactoTipo) {
      quantidadeImpacto = Number(impactoQtd.replace(',', '.'));
      if (!Number.isFinite(quantidadeImpacto) || quantidadeImpacto <= 0 || quantidadeImpacto > 10000) {
        return avisar('Impacto ambiental', 'Informe uma quantidade válida por voluntário, ou escolha "Nenhum".');
      }
    }

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
        o_que_levar: oQueLevar.trim() || null, imagem_url: imagemUrlFinal, visibilidade, modalidade,
        horas_estimadas: horasEstimadas ? parseInt(horasEstimadas, 10) : null,
        ods, impacto_tipo: impactoTipo, impacto_por_voluntario: impactoTipo ? quantidadeImpacto : null,
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
        <HeaderDecor />
        <TouchableOpacity accessibilityRole="button" accessibilityLabel="Voltar" style={styles.headerVoltar} onPress={() => router.back()}>
          <Feather name="arrow-left" size={22} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{emEdicao ? 'Editar Vaga' : 'Nova Ação'}</Text>
        {emEdicao && (
          <TouchableOpacity accessibilityRole="button" accessibilityLabel="Excluir vaga" onPress={confirmarExclusao} disabled={excluindo} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            {excluindo ? <ActivityIndicator size="small" color={theme.colors.coral} /> : <Feather name="trash-2" size={20} color={theme.colors.coral} />}
          </TouchableOpacity>
        )}
      </View>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <SafetyNotice text="Endereço, data/hora e um contato do dia são obrigatórios para garantir a segurança e organização do evento." />

        <Secao icone="target" titulo="Causa e impacto">
        <Text style={styles.label}>Categoria da Causa</Text>
        <View style={styles.categoryRow}>
          {CATEGORIAS.map((c) => (
            <TouchableOpacity key={c} style={[styles.categoryChip, categoria === c && styles.categoryChipActive]} onPress={() => {
              // Só troca os ODS sugeridos se a ONG ainda não os personalizou.
              const semPersonalizar = ods.length === 0 || JSON.stringify(ods) === JSON.stringify(sugerirOds(categoria));
              setCategoria(c);
              if (semPersonalizar) setOds(sugerirOds(c));
            }}>
              <Text style={[styles.categoryChipText, categoria === c && styles.categoryChipTextActive]}>{c}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.label}>ODS que essa ação apoia (até {MAX_ODS_POR_VAGA})</Text>
        <View style={styles.categoryRow}>
          {NUMEROS_ODS.map((n) => {
            const ativo = ods.includes(n);
            return (
              <TouchableOpacity
                key={n}
                accessibilityRole="button"
                accessibilityState={{ selected: ativo }}
                accessibilityLabel={`ODS ${n}, ${ODS[n].nome}`}
                style={[styles.odsChip, ativo && { backgroundColor: ODS[n].cor, borderColor: ODS[n].cor }]}
                onPress={() => setOds((lista) => alternarOds(lista, n))}
              >
                <Text style={[styles.odsChipText, ativo && { color: '#FFFFFF' }]}>{n}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
        {ods.length > 0 && <Text style={styles.odsHint}>{ods.map((n) => `ODS ${n}: ${ODS[n].nome}`).join(' · ')}</Text>}

        <Text style={styles.label}>Impacto ambiental (opcional)</Text>
        <View style={styles.categoryRow}>
          {[{ key: null, rotulo: 'Nenhum' }, ...Object.keys(TIPOS_IMPACTO).map((k) => ({ key: k, rotulo: TIPOS_IMPACTO[k].rotulo }))].map((o) => (
            <TouchableOpacity key={String(o.key)} style={[styles.categoryChip, impactoTipo === o.key && styles.categoryChipActive]} onPress={() => setImpactoTipo(o.key)}>
              <Text style={[styles.categoryChipText, impactoTipo === o.key && styles.categoryChipTextActive]}>{o.rotulo}</Text>
            </TouchableOpacity>
          ))}
        </View>
        {!!impactoTipo && (
          <>
            <Text style={styles.label}>{TIPOS_IMPACTO[impactoTipo].rotuloCampo} *</Text>
            <TextInput style={styles.input} placeholder="Ex: 5" keyboardType="numeric" value={impactoQtd} onChangeText={setImpactoQtd} placeholderTextColor={theme.colors.textLight} />
            <Text style={styles.odsHint}>Quanto cada voluntário que concluir a ação deve gerar. Alimenta o relatório ESG das empresas parceiras.</Text>
          </>
        )}

        </Secao>

        <Secao icone="edit-3" titulo="Sobre a ação">
        <Text style={styles.label}>Título da vaga *</Text>
        <TextInput style={styles.input} placeholder="Ex: Mutirão de plantio" value={titulo} onChangeText={setTitulo} placeholderTextColor={theme.colors.textLight} />

        <Text style={styles.label}>Descrição detalhada *</Text>
        <TextInput style={[styles.input, styles.textArea]} placeholder="Descreva a atividade em detalhes para o voluntário saber o que fará." value={descricao} onChangeText={setDescricao} multiline numberOfLines={5} placeholderTextColor={theme.colors.textLight} />

        </Secao>

        <Secao icone="map-pin" titulo="Quando e onde">
        <Text style={styles.label}>Modalidade</Text>
        <View style={styles.visibilityRow}>
          {[
            { key: 'presencial', label: 'Presencial', icon: 'map-pin' },
            { key: 'remoto', label: 'Remoto', icon: 'wifi' },
            { key: 'hibrido', label: 'Híbrido', icon: 'shuffle' },
          ].map((m) => (
            <TouchableOpacity key={m.key} style={[styles.visibilityChip, modalidade === m.key && styles.visibilityChipActive]} onPress={() => setModalidade(m.key)}>
              <Feather name={m.icon} size={14} color={modalidade === m.key ? theme.colors.background : theme.colors.textLight} />
              <Text style={[styles.visibilityChipText, modalidade === m.key && styles.visibilityChipTextActive]}>{m.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.label}>Endereço completo {modalidade !== 'remoto' && '*'}</Text>
        <TextInput style={styles.input} placeholder={modalidade === 'remoto' ? 'Opcional para vagas remotas' : 'Rua, número, bairro, cidade'} value={endereco} onChangeText={setEndereco} placeholderTextColor={theme.colors.textLight} />

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
            <Text style={styles.label}>Duração estimada (horas)</Text>
            <TextInput style={styles.input} placeholder="Ex: 4 (opcional)" keyboardType="numeric" value={horasEstimadas} onChangeText={setHorasEstimadas} placeholderTextColor={theme.colors.textLight} />
          </View>
          <View style={{ flex: 1 }} />
        </View>

        </Secao>

        <Secao icone="users" titulo="Quem participa">
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

        </Secao>

        <Secao icone="image" titulo="Divulgação">
        <Text style={styles.label}>Imagem de capa (opcional)</Text>
        {imagemParaMostrar ? (
          <View style={styles.coverPreviewWrap}>
            <Image source={{ uri: imagemParaMostrar }} style={styles.coverPreview} />
            <TouchableOpacity accessibilityRole="button" accessibilityLabel="Remover imagem da vaga" style={styles.coverRemoveBtn} onPress={() => { setImagemLocal(null); setImagemAtualUrl(null); }}>
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

        </Secao>

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
  container: { flex: 1, backgroundColor: theme.colors.surface },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: theme.colors.background },
  header: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 20, paddingTop: 56, paddingBottom: 26, backgroundColor: theme.colors.primary, borderBottomLeftRadius: 28, borderBottomRightRadius: 28, overflow: 'hidden' },
  headerVoltar: { width: 38, height: 38, borderRadius: 19, backgroundColor: 'rgba(255,255,255,0.14)', justifyContent: 'center', alignItems: 'center' },
  headerTitle: { flex: 1, ...theme.type.h1, fontSize: 22, color: '#FFFFFF' },
  secao: { backgroundColor: theme.colors.background, borderRadius: 24, padding: 18, paddingTop: 16, marginBottom: 16, ...theme.shadows.card },
  secaoTopo: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  secaoIcone: { width: 34, height: 34, borderRadius: 12, backgroundColor: theme.colors.pill, justifyContent: 'center', alignItems: 'center' },
  secaoTitulo: { ...theme.type.h3, color: theme.colors.text },

  scrollContent: { padding: 16, paddingBottom: 40 },
  label: { fontSize: 13, fontFamily: theme.fonts.button, color: theme.colors.textLight, marginBottom: 8, marginTop: 16 },
  input: { backgroundColor: theme.colors.surface, fontFamily: theme.fonts.body, padding: 16, borderRadius: 16, borderWidth: 1, borderColor: theme.colors.border, color: theme.colors.text },
  textArea: { height: 120, textAlignVertical: 'top' },
  rowGrid: { flexDirection: 'row', gap: 12 },

  categoryRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 4 },
  categoryChip: { paddingVertical: 10, paddingHorizontal: 16, borderRadius: 100, backgroundColor: theme.colors.surface, borderWidth: 1, borderColor: theme.colors.border },
  categoryChipActive: { backgroundColor: theme.colors.primary, borderColor: theme.colors.primary },
  categoryChipText: { color: theme.colors.textLight, fontFamily: theme.fonts.button, fontSize: 13 },
  odsChip: { width: 42, height: 42, borderRadius: 10, backgroundColor: theme.colors.surface, borderWidth: 1, borderColor: theme.colors.border, justifyContent: 'center', alignItems: 'center' },
  odsChipText: { color: theme.colors.textLight, fontFamily: theme.fonts.heading, fontSize: 14 },
  odsHint: { fontFamily: theme.fonts.body, fontSize: 11.5, color: theme.colors.textLight, marginTop: 8, lineHeight: 16 },
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
