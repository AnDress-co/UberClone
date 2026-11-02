import React, { useState } from 'react';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { colors } from '../config/theme';
import { useLenguage } from '../context/LenguageContext';
import { parseISODate, toISODate } from '../utils/dates';
import { fieldStyles } from './FormField';

export default function DateField({ label, value, onChange, error, minimumDate, maximumDate, initialDate }) {
    const { t } = useLenguage();
    const [open, setOpen] = useState(false);
    const date = value ? parseISODate(value) : initialDate || new Date();

    const handle = (event, picked) => {
        if (Platform.OS === 'android') setOpen(false);
        if (event.type !== 'dismissed' && picked) onChange(toISODate(picked));
    };

    return (
        <View style={styles.wrap}>
            <Text style={fieldStyles.label}>{label}</Text>
            {Platform.OS === 'ios' ? (
                <View style={[styles.box, error && styles.boxError, styles.iosBox]}>
                    {!value && <Text style={styles.placeholder}>{t('pickDate')}</Text>}
                    <DateTimePicker value={date} mode="date" display="compact" onChange={handle} minimumDate={minimumDate} maximumDate={maximumDate} />
                </View>
            ) : (
                <>
                    <Pressable style={[styles.box, error && styles.boxError]} onPress={() => setOpen(true)}>
                        <Text style={value ? styles.value : styles.placeholder}>{value || t('pickDate')}</Text>
                    </Pressable>
                    {open && <DateTimePicker value={date} mode="date" onChange={handle} minimumDate={minimumDate} maximumDate={maximumDate} />}
                </>
            )}
            {error ? <Text style={fieldStyles.error}>{t(error)}</Text> : null}
        </View>
    );
}

const styles = StyleSheet.create({
    wrap: { marginBottom: 14 },
    box: { backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 13 },
    boxError: { borderColor: colors.danger },
    iosBox: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 6 },
    value: { fontSize: 16, color: colors.text },
    placeholder: { fontSize: 16, color: colors.muted },
});
