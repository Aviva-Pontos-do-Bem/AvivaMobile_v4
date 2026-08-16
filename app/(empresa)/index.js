import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { useAuth } from '../../contexts/AuthContext';
import { theme } from '../../lib/theme';

export default function PainelEmpresa() {
  const { fullName } = useAuth();
  const router = useRouter();

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Painel Corporativo ESG</Text>
        <Text style={styles.subtitle}>{fullName}</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.sectionLabel}>Impacto Social Gerado</Text>
        
        <View style={styles.impactCard}>
          <View style={styles.iconBg}>
            <Feather name="pie-chart" size={28} color={theme.colors.secondary} />
          </View>
          <Text style={styles.impactValue}>R$ 0,00</Text>
          <Text style={styles.impactSub}>Investidos em projetos de impacto (em breve)</Text>
        </View>

        <View style={styles.statsRow}>
          <View style={styles.statBox}>
            <Text style={styles.statNum}>0</Text>
            <Text style={styles.statLabel}>ONGs Apoiadas</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statNum}>0h</Text>
            <Text style={styles.statLabel}>Voluntariado</Text>
          </View>
        </View>

        <TouchableOpacity style={styles.actionButton} onPress={() => router.push('/buscar')}>
          <Feather name="search" size={18} color={theme.colors.background} />
          <Text style={styles.buttonText}>Buscar Projetos para Apoiar</Text>
        </TouchableOpacity>
        
        <View style={styles.comingSoonCard}>
          <Feather name="file-text" size={24} color={theme.colors.textLight} />
          <View style={styles.comingSoonTextWrap}>
            <Text style={styles.comingSoonTitle}>Relatórios ESG</Text>
            <Text style={styles.comingSoonText}>Em breve você poderá exportar dashboards de impacto corporativo.</Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.surface },
  header: { paddingHorizontal: 20, paddingTop: 50, paddingBottom: 20, backgroundColor: theme.colors.background, borderBottomWidth: 1, borderBottomColor: theme.colors.border },
  title: { fontSize: 24, fontFamily: theme.fonts.heading, color: theme.colors.text },
  subtitle: { fontSize: 13, fontFamily: theme.fonts.body, color: theme.colors.textLight, marginTop: 2 },
  
  content: { padding: 20 },
  sectionLabel: { fontSize: 14, fontFamily: theme.fonts.heading, color: theme.colors.text, marginBottom: 12 },
  
  impactCard: { backgroundColor: theme.colors.background, padding: 24, borderRadius: 24, alignItems: 'center', marginBottom: 16, ...theme.shadows.card },
  iconBg: { width: 56, height: 56, borderRadius: 28, backgroundColor: theme.colors.successLight, justifyContent: 'center', alignItems: 'center', marginBottom: 16 },
  impactValue: { fontSize: 36, fontFamily: theme.fonts.heading, color: theme.colors.secondary, lineHeight: 42 },
  impactSub: { color: theme.colors.textLight, fontFamily: theme.fonts.body, fontSize: 13, marginTop: 4, textAlign: 'center' },
  
  statsRow: { flexDirection: 'row', gap: 16, marginBottom: 24 },
  statBox: { flex: 1, backgroundColor: theme.colors.background, padding: 20, borderRadius: 20, alignItems: 'center', ...theme.shadows.card },
  statNum: { fontSize: 24, fontFamily: theme.fonts.heading, color: theme.colors.primary },
  statLabel: { color: theme.colors.textLight, fontFamily: theme.fonts.body, fontSize: 12, marginTop: 4 },

  actionButton: { flexDirection: 'row', gap: 10, padding: 16, borderRadius: 16, backgroundColor: theme.colors.primary, alignItems: 'center', justifyContent: 'center', marginBottom: 20 },
  buttonText: { color: theme.colors.background, fontFamily: theme.fonts.button, fontSize: 15 },
  
  comingSoonCard: { flexDirection: 'row', alignItems: 'center', padding: 16, backgroundColor: theme.colors.background, borderRadius: 16, borderWidth: 1, borderColor: theme.colors.border, borderStyle: 'dashed' },
  comingSoonTextWrap: { flex: 1, marginLeft: 16 },
  comingSoonTitle: { fontFamily: theme.fonts.button, fontSize: 14, color: theme.colors.text, marginBottom: 2 },
  comingSoonText: { fontFamily: theme.fonts.body, fontSize: 12, color: theme.colors.textLight, lineHeight: 18 }
});