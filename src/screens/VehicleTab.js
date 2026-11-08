import React from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet } from 'react-native';
import DropDown from '../components/DropDown';
import FormField from '../components/FormField';
import ImageField from '../components/ImageField';
import { CATEGORIES } from '../config/pricing';
import { colors } from '../config/theme';
import { useLenguage } from '../context/LenguageContext';
import { useRegistration } from '../context/RegistrationContext';

const COLORS = ['white', 'black', 'silver', 'gray', 'red', 'blue', 'green', 'yellow', 'other'];

export default function VehicleTab() {
    const { t } = useLenguage();
    const { form, setField, touch, errorFor } = useRegistration();
    const err = (n) => errorFor('vehicle', n);

    return (
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
            <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
                <DropDown label={t('field.category')} value={form.category} onChange={(v) => setField('category', v)} options={CATEGORIES.map((c) => ({ value: c, label: t(`category.${c}`) }))} error={err('category')} />
                <FormField label={t('field.plate')} value={form.plate} onChangeText={(v) => setField('plate', v.toUpperCase())} onBlur={() => touch('plate')} error={err('plate')} autoCapitalize="characters" maxLength={6} placeholder="ABC123" />
                <FormField label={t('field.brand')} value={form.brand} onChangeText={(v) => setField('brand', v)} onBlur={() => touch('brand')} error={err('brand')} autoCapitalize="words" maxLength={30} />
                <FormField label={t('field.model')} value={form.model} onChangeText={(v) => setField('model', v)} onBlur={() => touch('model')} error={err('model')} autoCapitalize="words" maxLength={30} />
                <FormField label={t('field.year')} value={form.year} onChangeText={(v) => setField('year', v.replace(/\D/g, ''))} onBlur={() => touch('year')} error={err('year')} keyboardType="number-pad" maxLength={4} />
                <DropDown label={t('field.color')} value={form.color} onChange={(v) => setField('color', v)} options={COLORS.map((c) => ({ value: c, label: t(`color.${c}`) }))} error={err('color')} />
                <FormField label={t('field.capacity')} value={form.capacity} onChangeText={(v) => setField('capacity', v.replace(/\D/g, ''))} onBlur={() => touch('capacity')} error={err('capacity')} keyboardType="number-pad" maxLength={2} />
                <ImageField label={t('field.vehiclePhoto')} uri={form.vehiclePhoto} onChange={(v) => setField('vehiclePhoto', v)} error={err('vehiclePhoto')} />
            </ScrollView>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({ content: { padding: 16, backgroundColor: colors.bg, flexGrow: 1 } });
