import React from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text } from 'react-native';
import { colors } from '../config/theme';

export default function ButtonCustom({ title, onPress, disabled, loading, variant = 'primary', style }) {
  const bg = variant === 'danger' ? colors.danger : variant === 'accent' ? colors.accent : variant === 'ghost' ? 'transparent' : colors.primary;
  const fg = variant === 'ghost' ? colors.primary : '#fff';
  const off = disabled || loading;
  return (
    <Pressable
      onPress={onPress}
      disabled={off}
      style={[styles.btn, { backgroundColor: bg, opacity: off ? 0.45 : 1 }, variant === 'ghost' && styles.ghost, style]}
    >
      {loading ? <ActivityIndicator color={fg} /> : <Text style={[styles.txt, { color: fg }]}>{title}</Text>}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  btn: { paddingVertical: 14, paddingHorizontal: 18, borderRadius: 10, alignItems: 'center', justifyContent: 'center', minHeight: 48 },
  ghost: { borderWidth: 1, borderColor: colors.border },
  txt: { fontSize: 16, fontWeight: '600' },
});
