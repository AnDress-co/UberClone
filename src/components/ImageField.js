import React from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { colors } from '../config/theme';
import { useLenguage } from '../context/LenguageContext';
import ButtonCustom from './ButtonCustom';
import { fieldStyles } from './FormField';

export default function ImageField({ label, uri, onChange, error, rounded }) {
    const { t } = useLenguage();

    const pick = async (fromCamera) => {
        const perm = fromCamera
            ? await ImagePicker.requestCameraPermissionsAsync()
            : await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (!perm.granted) return;
        const opts = { mediaTypes: ['images'], quality: 0.7, allowsEditing: true };
        const res = fromCamera ? await ImagePicker.launchCameraAsync(opts) : await ImagePicker.launchImageLibraryAsync(opts);
        if (!res.canceled && res.assets?.[0]?.uri) onChange(res.assets[0].uri);
    };

    return (
        <View style={styles.wrap}>
            <Text style={fieldStyles.label}>{label}</Text>
            <View style={styles.row}>
                {uri ? <Image source={{ uri }} style={[styles.preview, rounded && styles.round]} /> : <View style={[styles.preview, rounded && styles.round, styles.empty, error && styles.emptyError]} />}
                <View style={styles.buttons}>
                    <ButtonCustom title={t('camera')} onPress={() => pick(true)} style={styles.small} />
                    <ButtonCustom title={t('gallery')} onPress={() => pick(false)} style={styles.small} />
                </View>
            </View>
            {error ? <Text style={fieldStyles.error}>{t(error)}</Text> : null}
        </View>
    );
}

const styles = StyleSheet.create({
    wrap: { marginBottom: 14 },
    row: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    preview: { width: 96, height: 96, borderRadius: 10, backgroundColor: colors.border },
    round: { borderRadius: 48 },
    empty: { borderWidth: 1, borderColor: colors.border, borderStyle: 'dashed', backgroundColor: colors.card },
    emptyError: { borderColor: colors.danger },
    buttons: { flex: 1, gap: 8 },
    small: { minHeight: 40, paddingVertical: 8 },
});