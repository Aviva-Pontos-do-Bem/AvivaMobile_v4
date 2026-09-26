import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Platform, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import * as Location from 'expo-location';
import { Feather } from '@expo/vector-icons';
import { supabase } from '../supabase';
import { useAuth } from '../contexts/AuthContext';
import AvatarPicker from './AvatarPicker';
import { validarCNPJ, validarTelefoneBR } from '../lib/validation';
import { formatarCNPJ, formatarTelefoneBR } from '../lib/format';
import { theme } from '../lib/theme';

const avisar = (titulo, mensagem) => {
  if (Platform.OS === 'web') alert(`${titulo}: ${mensagem}`);
  else {
    const { Alert } = require('react-native');
    Alert.alert(titulo, mensagem);
  }
};

export default function PerfilForm() {
  const { session, profile, userType, refreshProfile } = useAuth();
  const router = useRouter();
  const isOrganizacao = userType === 'ong' || userType === 'empresa';
  const isVoluntario = userType === 'voluntario';

  const [fotoUrl, setFotoUrl] = useState(profile?.foto_url || '');
  const [fullName, setFullName] = useState(profile?.full_name || '');
  const [bio, setBio] = useState(profile?.bio || '');
  const [telefone, setTelefone] = useState(profile?.telefone ? formatarTelefoneBR(profile.telefone) : '');
  const [endereco, setEndereco] = useState(profile?.endereco || '');
  const [site, setSite] = useState(profile?.site || '');
  const [documento, setDocumento] = useState(profile?.documento ? formatarCNPJ(profile.documento) : '');
  const [coords, setCoords] = useState(profile?.lat != null && profile?.lng != null ? { lat: profile.lat, lng: profile.lng } : null);
  const [buscandoLocalizacao, setBuscandoLocalizacao] = useState(false);
  const [aceitaDoacoes, setAceitaDoacoes] = useState(!!profile?.aceita_doacoes);
  const [chavePix, setChavePix] = useState(profile?.chave_pix || '');
  const [mensagemDoacao, setMensagemDoacao] = useState(profile?.mensagem_doacao || '');
  const [salvando, setSalvando] = useState(false);

  // Vínculo funcionário -> empresa: alimenta o Dashboard ESG da empresa
  // (horas de voluntariado dos funcionários). Guardamos o id e o nome
  // escolhido separadamente porque profiles.empresa_id só tem o id — o nome
  // vem de uma consulta extra na primeira renderização.
  const [empresaId, setEmpresaId] = useState(profile?.empresa_id || null);
  const [empresaNome, setEmpresaNome] = useState('');
  const [buscaEmpresa, setBuscaEmpresa] = useState('');
  const [empresasEncontradas, setEmpresasEncontradas] = useState([]);
  const [buscandoEmpresa, setBuscandoEmpresa] = useState(false);

  useEffect(() => {
    if (!isVoluntario || !profile?.empresa_id) return;
    supabase.from('profiles').select('full_name').eq('id', profile.empresa_id).maybeSingle()
      .then(({ data }) => { if (data) setEmpresaNome(data.full_name); });
  }, [isVoluntario, profile?.empresa_id]);

  const buscarEmpresas = useCallback(async (texto) => {
    setBuscaEmpresa(texto);
    if (!texto.trim()) { setEmpresasEncontradas([]); return; }
    setBuscandoEmpresa(true);
    const { data } = await supabase
      .from('profiles')
      .select('id, full_name')
      .eq('user_type', 'empresa')
      .ilike('full_name', `%${texto.trim()}%`)
      .limit(5);
    setEmpresasEncontradas(data || []);
    setBuscandoEmpresa(false);
  }, []);

  function selecionarEmpresa(empresa) {
    setEmpresaId(empresa.id);
    setEmpresaNome(empresa.full_name);
    setBuscaEmpresa('');
    setEmpresasEncontradas([]);
  }

  function removerVinculoEmpresa() {
    setEmpresaId(null);
    setEmpresaNome('');
  }

  // Usada principalmente por ONGs: sem essas coordenadas, a organização não
  // aparece na busca "ONGs perto de você" de voluntários/empresas — a busca
  // só compara lat/lng salvos aqui com a localização de quem está buscando.
  async function usarLocalizacaoAtual() {
    setBuscandoLocalizacao(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        avisar('Permissão necessária', 'Precisamos de acesso à sua localização.');
        return;
      }
      const posicao = await Location.getCurrentPositionAsync({});
      setCoords({ lat: posicao.coords.latitude, lng: posicao.coords.longitude });

      if (!endereco.trim()) {
        try {
          const [end] = await Location.reverseGeocodeAsync({ latitude: posicao.coords.latitude, longitude: posicao.coords.longitude });
          if (end) {
            const partes = [end.street, end.streetNumber, end.subregion || end.city, end.region].filter(Boolean);
            if (partes.length > 0) setEndereco(partes.join(', '));
          }
        } catch (err) {
          // Sem problema se o geocode reverso falhar — as coordenadas já foram salvas.
        }
      }
    } catch (err) {
      avisar('Erro ao obter localização', err.message || 'Tente novamente.');
    } finally {
      setBuscandoLocalizacao(false);
    }
  }

  async function limparLocalizacao() {
    setCoords(null);
  }

  const isOng = userType === 'ong';

  async function salvar() {
    if (!fullName.trim()) return avisar('Campo obrigatório', isOrganizacao ? 'Informe a razão social.' : 'Informe seu nome.');
    if (telefone && !validarTelefoneBR(telefone)) return avisar('Telefone inválido', 'Confira o número com DDD.');
    if (isOrganizacao && documento && !validarCNPJ(documento)) return avisar('CNPJ inválido', 'Os dígitos verificadores não conferem.');
    if (isOng && aceitaDoacoes && !chavePix.trim()) return avisar('Chave Pix necessária', 'Informe uma chave Pix para receber doações, ou desative a opção "Aceitar doações".');

    setSalvando(true);

    // Se a organização digitou um endereço mas nunca apertou "usar minha
    // localização atual", tentamos geocodificar o endereço digitado
    // automaticamente (endereço → lat/lng), pra ela não precisar saber que
    // esse botão existe pra aparecer na busca por proximidade. O botão de
    // GPS sempre tem prioridade quando já foi usado — só geocodificamos o
    // texto quando ainda não há nenhuma coordenada salva.
    let coordsFinal = coords;
    if (isOrganizacao && endereco.trim() && !coordsFinal) {
      try {
        const [resultado] = await Location.geocodeAsync(endereco.trim());
        if (resultado) coordsFinal = { lat: resultado.latitude, lng: resultado.longitude };
      } catch (err) {
        // Endereço incompleto/ambíguo não deve travar o salvamento do perfil.
      }
    }

    const { error: erroProfile } = await supabase.from('profiles').update({
      full_name: fullName.trim(), bio: bio.trim() || null, telefone: telefone ? telefone.replace(/\D/g, '') : null,
      endereco: isOrganizacao ? endereco.trim() || null : null, site: isOrganizacao ? site.trim() || null : null,
      documento: isOrganizacao ? documento.replace(/\D/g, '') || null : null, foto_url: fotoUrl || null,
      lat: isOrganizacao ? coordsFinal?.lat ?? null : null, lng: isOrganizacao ? coordsFinal?.lng ?? null : null,
      aceita_doacoes: isOng ? aceitaDoacoes : false,
      chave_pix: isOng && aceitaDoacoes ? chavePix.trim() : null,
      mensagem_doacao: isOng && aceitaDoacoes ? mensagemDoacao.trim() || null : null,
      ...(isVoluntario ? { empresa_id: empresaId } : null),
    }).eq('id', session.user.id);

    const { error: erroAuth } = await supabase.auth.updateUser({ data: { full_name: fullName.trim() } });
    setSalvando(false);

    if (erroProfile || erroAuth) return avisar('Erro', (erroProfile || erroAuth).message);

    await refreshProfile();
    avisar('Perfil atualizado!', 'Suas informações foram salvas.');
    router.back();
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.avatarWrap}>
        <AvatarPicker nome={fullName} fotoUrl={fotoUrl} userId={session.user.id} size={96} onUploaded={setFotoUrl} />
      </View>

      <Text style={styles.label}>{isOrganizacao ? 'Razão social / nome fantasia *' : 'Nome completo *'}</Text>
      <TextInput style={styles.input} value={fullName} onChangeText={setFullName} placeholder="Digite aqui" placeholderTextColor={theme.colors.textLight} />

      <Text style={styles.label}>{isOrganizacao ? 'Sobre a organização' : 'Sobre você'}</Text>
      <TextInput
        style={[styles.input, styles.textArea]}
        value={bio}
        onChangeText={setBio}
        placeholder={isOrganizacao ? 'Missão, causas que apoia, história' : 'Interesses, causas que você gosta de apoiar'}
        placeholderTextColor={theme.colors.textLight}
        multiline
        numberOfLines={4}
      />

      <Text style={styles.label}>Telefone</Text>
      <TextInput style={styles.input} value={telefone} onChangeText={(t) => setTelefone(formatarTelefoneBR(t))} placeholder="(11) 90000-0000" keyboardType="phone-pad" placeholderTextColor={theme.colors.textLight} />

      {isVoluntario && (
        <>
          <Text style={styles.label}>Empresa onde você trabalha (opcional)</Text>
          <Text style={styles.locationHint}>
            Vincular sua empresa faz suas ações concluídas contarem no painel ESG dela.
          </Text>

          {empresaId ? (
            <View style={styles.empresaSelecionadaRow}>
              <Feather name="briefcase" size={16} color={theme.colors.secondary} />
              <Text style={styles.empresaSelecionadaText} numberOfLines={1}>{empresaNome || 'Empresa vinculada'}</Text>
              <TouchableOpacity onPress={removerVinculoEmpresa}>
                <Feather name="x-circle" size={18} color={theme.colors.error} />
              </TouchableOpacity>
            </View>
          ) : (
            <>
              <TextInput
                style={styles.input}
                value={buscaEmpresa}
                onChangeText={buscarEmpresas}
                placeholder="Digite o nome da empresa"
                placeholderTextColor={theme.colors.textLight}
              />
              {buscandoEmpresa && <ActivityIndicator size="small" color={theme.colors.primary} style={{ marginTop: 8 }} />}
              {empresasEncontradas.map((empresa) => (
                <TouchableOpacity key={empresa.id} style={styles.empresaResultRow} onPress={() => selecionarEmpresa(empresa)}>
                  <Feather name="briefcase" size={14} color={theme.colors.textLight} />
                  <Text style={styles.empresaResultText}>{empresa.full_name}</Text>
                </TouchableOpacity>
              ))}
              {!buscandoEmpresa && buscaEmpresa.trim() && empresasEncontradas.length === 0 && (
                <Text style={styles.locationHint}>Nenhuma empresa encontrada com esse nome.</Text>
              )}
            </>
          )}
        </>
      )}

      {isOrganizacao && (
        <>
          <Text style={styles.label}>Endereço completo</Text>
          <TextInput style={styles.input} value={endereco} onChangeText={setEndereco} placeholder="Rua, número, bairro, cidade" placeholderTextColor={theme.colors.textLight} />

          <TouchableOpacity style={styles.locationBtn} onPress={usarLocalizacaoAtual} disabled={buscandoLocalizacao}>
            {buscandoLocalizacao ? (
              <ActivityIndicator size="small" color={theme.colors.secondary} />
            ) : (
              <Feather name="map-pin" size={16} color={theme.colors.secondary} />
            )}
            <Text style={styles.locationBtnText}>
              {coords ? 'Localização salva — atualizar' : 'Usar minha localização atual'}
            </Text>
          </TouchableOpacity>
          {coords && (
            <TouchableOpacity onPress={limparLocalizacao} style={{ alignSelf: 'flex-start', marginTop: 8 }}>
              <Text style={styles.clearLocationText}>Remover localização salva</Text>
            </TouchableOpacity>
          )}
          <Text style={styles.locationHint}>
            {coords
              ? 'Essa localização é o que faz sua organização aparecer na busca "ONGs perto de você".'
              : 'Esse botão é o mais preciso, mas não é obrigatório: se você só preencher o endereço acima e salvar, também tentamos localizar sua organização a partir dele.'}
          </Text>

          <Text style={styles.label}>Site (opcional)</Text>
          <TextInput style={styles.input} value={site} onChangeText={setSite} placeholder="https://..." autoCapitalize="none" keyboardType="url" placeholderTextColor={theme.colors.textLight} />

          <Text style={styles.label}>CNPJ</Text>
          <TextInput style={styles.input} value={documento} onChangeText={(t) => setDocumento(formatarCNPJ(t))} placeholder="00.000.000/0000-00" keyboardType="numeric" placeholderTextColor={theme.colors.textLight} />
        </>
      )}

      {isOng && (
        <>
          <View style={styles.donationToggleRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.donationToggleTitle}>Aceitar doações</Text>
              <Text style={styles.donationToggleSub}>Mostra um cartão de doação no seu perfil público.</Text>
            </View>
            <TouchableOpacity
              style={[styles.switchTrack, aceitaDoacoes && styles.switchTrackActive]}
              onPress={() => setAceitaDoacoes((v) => !v)}
            >
              <View style={[styles.switchThumb, aceitaDoacoes && styles.switchThumbActive]} />
            </TouchableOpacity>
          </View>

          {aceitaDoacoes && (
            <>
              <Text style={styles.label}>Chave Pix *</Text>
              <TextInput style={styles.input} value={chavePix} onChangeText={setChavePix} placeholder="CPF/CNPJ, e-mail, telefone ou chave aleatória" autoCapitalize="none" placeholderTextColor={theme.colors.textLight} />

              <Text style={styles.label}>Mensagem para quem quer doar (opcional)</Text>
              <TextInput
                style={[styles.input, { height: 80 }]}
                value={mensagemDoacao}
                onChangeText={setMensagemDoacao}
                placeholder="Ex: as doações ajudam a custear transporte e materiais das nossas ações."
                multiline
                numberOfLines={3}
                placeholderTextColor={theme.colors.textLight}
              />
            </>
          )}
        </>
      )}

      <TouchableOpacity style={styles.saveButton} onPress={salvar} disabled={salvando}>
        {salvando ? <ActivityIndicator color={theme.colors.background} /> : <Text style={styles.saveButtonText}>Salvar alterações</Text>}
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20, paddingTop: 30, backgroundColor: theme.colors.background },
  avatarWrap: { alignItems: 'center', marginBottom: 20 },
  label: { fontSize: 13, fontFamily: theme.fonts.button, color: theme.colors.textLight, marginBottom: 8, marginTop: 16 },
  input: { backgroundColor: theme.colors.surface, fontFamily: theme.fonts.body, padding: 16, borderRadius: 16, borderWidth: 1, borderColor: theme.colors.border, color: theme.colors.text },
  textArea: { height: 100, textAlignVertical: 'top' },
  locationBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: theme.colors.successLight, borderRadius: 14, paddingVertical: 12, marginTop: 10 },
  locationBtnText: { fontFamily: theme.fonts.button, fontSize: 13, color: theme.colors.secondary },
  locationHint: { fontFamily: theme.fonts.body, fontSize: 11.5, color: theme.colors.textLight, marginTop: 6, lineHeight: 16 },
  clearLocationText: { fontFamily: theme.fonts.button, fontSize: 12, color: theme.colors.error },
  empresaSelecionadaRow: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: theme.colors.successLight, borderRadius: 14, padding: 14 },
  empresaSelecionadaText: { flex: 1, fontFamily: theme.fonts.button, fontSize: 13.5, color: theme.colors.text },
  empresaResultRow: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 10, paddingHorizontal: 14, backgroundColor: theme.colors.surface, borderRadius: 10, marginTop: 6 },
  empresaResultText: { fontFamily: theme.fonts.body, fontSize: 13, color: theme.colors.text },
  donationToggleRow: { flexDirection: 'row', alignItems: 'center', marginTop: 24, gap: 12 },
  donationToggleTitle: { fontFamily: theme.fonts.button, fontSize: 14, color: theme.colors.text },
  donationToggleSub: { fontFamily: theme.fonts.body, fontSize: 11.5, color: theme.colors.textLight, marginTop: 2 },
  switchTrack: { width: 46, height: 26, borderRadius: 13, backgroundColor: theme.colors.border, padding: 3, justifyContent: 'center' },
  switchTrackActive: { backgroundColor: theme.colors.primary },
  switchThumb: { width: 20, height: 20, borderRadius: 10, backgroundColor: theme.colors.background },
  switchThumbActive: { alignSelf: 'flex-end' },
  saveButton: { backgroundColor: theme.colors.primary, padding: 16, borderRadius: 16, alignItems: 'center', marginTop: 32, marginBottom: 40 },
  saveButtonText: { color: theme.colors.background, fontFamily: theme.fonts.button, fontSize: 15 },
});