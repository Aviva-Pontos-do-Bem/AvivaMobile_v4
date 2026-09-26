import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Linking } from 'react-native';
import { Stack } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { theme } from '../lib/theme';

const ULTIMA_ATUALIZACAO = '25 de setembro de 2026';

const TERMOS = [
  {
    titulo: '1. O que é o Aviva',
    texto: 'O Aviva é uma plataforma que conecta voluntários, ONGs e empresas em torno de ações sociais, vagas de voluntariado e iniciativas ESG. Ao criar uma conta, você escolhe um perfil (Voluntário, ONG ou Empresa) que define quais telas e funcionalidades você usa.',
  },
  {
    titulo: '2. Cadastro e veracidade das informações',
    texto: 'Você é responsável por manter seus dados de cadastro corretos e atualizados. ONGs e Empresas informam CNPJ; a equipe do Aviva pode conferir esses dados e conceder um selo de "verificado", mas o app não garante nem se responsabiliza pela idoneidade de nenhuma organização ou pessoa cadastrada.',
  },
  {
    titulo: '3. Perfis e publicações são visíveis a outros usuários',
    texto: 'Nome, foto, biografia e as informações de contato que você preencher (telefone, endereço, site) ficam visíveis para outras contas conforme as regras de cada tipo de perfil — para voluntários, o telefone só é público quando você mesmo estiver vendo seu próprio perfil; para ONGs e Empresas, o telefone e o CNPJ são tratados como informação pública de contato institucional. Publicações no feed seguem a visibilidade que você escolher ao publicar (todo mundo ou só seguidores).',
  },
  {
    titulo: '4. Candidaturas, vagas e segurança pessoal',
    texto: 'O Aviva é um espaço de intermediação: a organização de cada ação (endereço, horário, requisitos) é de responsabilidade da ONG que a publica, e a decisão de participar é do voluntário. Nunca compartilhe dados bancários ou faça pagamentos antecipados para participar de uma ação. Confirme endereço e horário com a organização antes de comparecer.',
  },
  {
    titulo: '5. Doações via Pix',
    texto: 'Quando uma ONG ativa "Aceitar doações", ela mesma informa sua própria chave Pix, exibida no perfil público dela. O Aviva não processa, intermedia nem se responsabiliza pelas transferências feitas — a transação acontece diretamente entre quem doa e a organização, fora do app.',
  },
  {
    titulo: '6. Conduta e denúncias',
    texto: 'Conteúdo ilegal, discriminatório, fraudulento ou que coloque outras pessoas em risco não é permitido. Use "Reclamações", disponível no menu do perfil, para denunciar um perfil ou publicação — nossa equipe analisa cada denúncia recebida.',
  },
  {
    titulo: '7. Suspensão e encerramento de conta',
    texto: 'Contas que violarem estes Termos podem ser suspensas ou encerradas. Você também pode encerrar sua própria conta a qualquer momento, em Configurações → Excluir conta.',
  },
  {
    titulo: '8. Alterações nestes Termos',
    texto: 'Podemos atualizar estes Termos conforme o app evolui. Mudanças relevantes serão comunicadas dentro do app.',
  },
];

const PRIVACIDADE = [
  {
    titulo: '1. Quais dados coletamos',
    texto: 'Nome completo, e-mail e senha (cadastro); CPF/CNPJ (ONGs e Empresas); telefone e endereço (opcionais); foto de perfil e de capa; biografia; localização (latitude/longitude), quando você usa "minha localização atual" ou preenche endereço; conteúdo que você publica (posts, comentários, candidaturas); e, se você optar, o vínculo com a empresa onde trabalha.',
  },
  {
    titulo: '2. Para que usamos esses dados',
    texto: 'Para viabilizar login e identificação de perfil; conectar voluntários a vagas de ONGs próximas ou relacionadas às suas causas de interesse; exibir seu perfil público a outras pessoas do app; calcular métricas de impacto (horas de voluntariado, ONGs apoiadas) exibidas a você e, no caso de vínculo empresarial, ao painel ESG da empresa vinculada.',
  },
  {
    titulo: '3. Com quem compartilhamos',
    texto: 'Seus dados ficam hospedados no Supabase (infraestrutura de banco de dados e autenticação) e, se você usar login com Google, o Google recebe os dados necessários para autenticar sua conta (nome, e-mail, foto), segundo a política de privacidade do próprio Google. Não vendemos seus dados a terceiros.',
  },
  {
    titulo: '4. Seus direitos (LGPD)',
    texto: 'Você pode acessar, corrigir ou apagar seus dados a qualquer momento em Editar Perfil. Para excluir sua conta e solicitar a remoção definitiva dos seus dados, use Configurações → Excluir conta — o pedido é registrado imediatamente e a exclusão definitiva é concluída em alguns dias.',
  },
  {
    titulo: '5. Armazenamento e segurança',
    texto: 'Sua sessão de acesso é armazenada de forma cifrada no seu aparelho. O acesso aos dados no banco é controlado por regras de permissão por linha (cada pessoa só edita o que é seu), e campos sensíveis como telefone e CNPJ têm visibilidade restrita conforme o tipo de perfil.',
  },
  {
    titulo: '6. Dados de localização',
    texto: 'A localização só é coletada quando você usa recursos como "ONGs perto de você" ou "usar minha localização atual" no perfil — nunca em segundo plano, e você pode revogar a permissão a qualquer momento nas configurações do seu aparelho.',
  },
  {
    titulo: '7. Contato do Encarregado de Dados',
    texto: 'Dúvidas sobre seus dados pessoais podem ser enviadas para o e-mail de contato abaixo.',
  },
];

function Secao({ item }) {
  return (
    <View style={styles.card}>
      <Text style={styles.cardTitle}>{item.titulo}</Text>
      <Text style={styles.cardText}>{item.texto}</Text>
    </View>
  );
}

export default function TermosPrivacidade() {
  const [aba, setAba] = useState('termos');

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ padding: 20, paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
      <Stack.Screen options={{ headerShown: true, title: 'Termos e Privacidade' }} />

      <Text style={styles.updated}>Última atualização: {ULTIMA_ATUALIZACAO}</Text>

      <View style={styles.tabsRow}>
        <TouchableOpacity style={[styles.tabBtn, aba === 'termos' && styles.tabBtnActive]} onPress={() => setAba('termos')}>
          <Text style={[styles.tabBtnText, aba === 'termos' && styles.tabBtnTextActive]}>Termos de Uso</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.tabBtn, aba === 'privacidade' && styles.tabBtnActive]} onPress={() => setAba('privacidade')}>
          <Text style={[styles.tabBtnText, aba === 'privacidade' && styles.tabBtnTextActive]}>Privacidade</Text>
        </TouchableOpacity>
      </View>

      {(aba === 'termos' ? TERMOS : PRIVACIDADE).map((item) => (
        <Secao key={item.titulo} item={item} />
      ))}

      <TouchableOpacity style={styles.contactBtn} onPress={() => Linking.openURL('mailto:contato@aviva.app')}>
        <Feather name="mail" size={16} color={theme.colors.background} />
        <Text style={styles.contactText}>Falar com a equipe do Aviva</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.surface },
  updated: { fontSize: 12, fontFamily: theme.fonts.body, color: theme.colors.textLight, textAlign: 'center', marginBottom: 16 },

  tabsRow: { flexDirection: 'row', backgroundColor: theme.colors.surface, borderRadius: 100, padding: 4, marginBottom: 20, borderWidth: 1, borderColor: theme.colors.border },
  tabBtn: { flex: 1, alignItems: 'center', paddingVertical: 12, borderRadius: 100 },
  tabBtnActive: { backgroundColor: theme.colors.background, ...theme.shadows.card },
  tabBtnText: { fontSize: 13, fontFamily: theme.fonts.button, color: theme.colors.textLight },
  tabBtnTextActive: { color: theme.colors.primary },

  card: { backgroundColor: theme.colors.background, borderRadius: 20, padding: 16, marginBottom: 12, ...theme.shadows.card },
  cardTitle: { fontFamily: theme.fonts.heading, fontSize: 14.5, color: theme.colors.text, marginBottom: 8 },
  cardText: { fontSize: 13, fontFamily: theme.fonts.body, color: theme.colors.textLight, lineHeight: 20 },

  contactBtn: { flexDirection: 'row', gap: 10, alignItems: 'center', justifyContent: 'center', marginTop: 8, padding: 16, borderRadius: 16, backgroundColor: theme.colors.primary },
  contactText: { color: theme.colors.background, fontFamily: theme.fonts.button, fontSize: 15 },
});
