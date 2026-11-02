import React from 'react';
import { StyleSheet, View } from 'react-native';
import { colors } from '../config/theme';

export default function Card({ children, style }) {
    return <View style={[styles.card, style]}>{children}</View>;
}

const styles = StyleSheet.create({
    card: { backgroundColor: colors.card, borderRadius: 14, padding: 16, shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 8, shadowOffset: { width: 0, height: 2 }, elevation: 2 },
});