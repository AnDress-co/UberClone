import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors } from '../config/theme';

export default function StatCard({ label, value, strong }) {
  return (
    <View style={styles.row}>
      <Text style={styles.label}>{label}</Text>
      <Text style={[styles.value, strong && styles.strong]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6 },
  label: { color: colors.muted, fontSize: 15 },
  value: { color: colors.text, fontSize: 15, fontWeight: '500' },
  strong: { fontWeight: '800', fontSize: 17 },
});