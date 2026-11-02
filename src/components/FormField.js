import React from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';
import { colors } from '../config/theme';
import { useLenguage } from '../context/LenguageContext';

export default function FormField({ label, error, style, ...inputProps }) {
  const { t } = useLenguage();
  return (
    <View style={[styles.wrap, style]}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        style={[styles.input, error && styles.inputError]}
        placeholderTextColor={colors.muted}
        autoCapitalize="none"
        {...inputProps}
      />
      {error ? <Text style={styles.error}>{t(error)}</Text> : null}
    </View>
  );
}

export const fieldStyles = StyleSheet.create({
  label: { fontSize: 13, fontWeight: '600', color: colors.text, marginBottom: 6 },
  error: { color: colors.danger, fontSize: 12, marginTop: 4 },
});

const styles = StyleSheet.create({
  wrap: { marginBottom: 14 },
  label: fieldStyles.label,
  input: { backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 11, fontSize: 16, color: colors.text },
  inputError: { borderColor: colors.danger },
  error: fieldStyles.error,
});
