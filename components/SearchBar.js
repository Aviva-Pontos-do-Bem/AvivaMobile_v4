import React from 'react';
import { View, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { theme } from '../lib/theme';

export default function SearchBar({ valor, onMudar, placeholder = 'Buscar...' }) {
  return (
    <View style={styles.searchBar}>
      <Feather name="search" size={20} color={theme.colors.textLight} />
      <TextInput
        style={styles.searchInput}
        placeholder={placeholder}
        placeholderTextColor={theme.colors.textLight}
        value={valor}
        onChangeText={onMudar}
        returnKeyType="search"
        autoCorrect={false}
      />
      {!!valor && (
        <TouchableOpacity onPress={() => onMudar('')} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Feather name="x-circle" size={18} color={theme.colors.textLight} />
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  searchBar: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: theme.colors.surface, paddingHorizontal: 16, height: 50, borderRadius: 16, borderWidth: 1, borderColor: theme.colors.border },
  searchInput: { flex: 1, fontFamily: theme.fonts.body, fontSize: 14, color: theme.colors.text },
});
