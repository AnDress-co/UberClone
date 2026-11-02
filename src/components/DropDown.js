import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { colors } from '../config/theme';
import { useLenguage } from '../context/LenguageContext';
import { fieldStyles } from './FormField';

export default function DropDown({ label, value, onChange, options, error }) {
    const { t } = useLenguage();
    return (
        <View style={styles.wrap}>
            <Text style={fieldStyles.label}>{label}</Text>
            <View style={[styles.box, error && styles.boxError]}>
                <Picker selectedValue={value} onValueChange={onChange} style={styles.picker}>
                    <Picker.Item label={t('select')} value="" color={colors.muted} />
                    {options.map((o) => <Picker.Item key={o.value} label={o.label} value={o.value} />)}
                </Picker>
            </View>
            {error ? <Text style={fieldStyles.error}>{t(error)}</Text> : null}
        </View>
    );
}

const styles = StyleSheet.create({
    wrap: { marginBottom: 14 },
    box: { backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, borderRadius: 10, overflow: 'hidden' },
    boxError: { borderColor: colors.danger },
    picker: { color: colors.text },
});
