import React, { useMemo } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet } from 'react-native';
import DateField from '../components/DateField';
import DropDown from '../components/DropDown';
import FormField from '../components/FormField';
import ImageField from '../components/ImageField';
import { colors } from '../config/theme';
import { useLenguage } from '../context/LenguageContext';
import { useRegistration } from '../context/RegistrationContext';

export default function DataPersonalTab() {
  const { t, setLang } = useLenguage();
  const { form, setField, touch, errorFor } = useRegistration();
  const err = (n) => errorFor('personal', n);

  const today = useMemo(() => new Date(), []);
  const eighteenYearsAgo = useMemo(() => new Date(today.getFullYear() - 18, today.getMonth(), today.getDate()), [today]);
  const genders = ['male', 'female', 'other', 'none'].map((g) => ({ value: g, label: t(`gender.${g}`) }));

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <ImageField rounded label={t('field.photo')} uri={form.photo} onChange={(v) => setField('photo', v)} error={err('photo')} />
        <FormField label={t('field.fullName')} value={form.fullName} onChangeText={(v) => setField('fullName', v)} onBlur={() => touch('fullName')} error={err('fullName')} autoCapitalize="words" maxLength={60} />
        <FormField label={t('field.documentId')} value={form.documentId} onChangeText={(v) => setField('documentId', v.replace(/\D/g, ''))} onBlur={() => touch('documentId')} error={err('documentId')} keyboardType="number-pad" maxLength={12} />
        <FormField label={t('field.phone')} value={form.phone} onChangeText={(v) => setField('phone', v.replace(/\D/g, ''))} onBlur={() => touch('phone')} error={err('phone')} keyboardType="phone-pad" maxLength={12} />
        <DateField label={t('field.birthDate')} value={form.birthDate} onChange={(v) => setField('birthDate', v)} error={err('birthDate')} maximumDate={today} initialDate={eighteenYearsAgo} />
        <DropDown label={t('field.gender')} value={form.gender} onChange={(v) => setField('gender', v)} options={genders} error={err('gender')} />
        <FormField label={t('field.email')} value={form.email} onChangeText={(v) => setField('email', v)} onBlur={() => touch('email')} error={err('email')} keyboardType="email-address" />
        <DropDown
          label={t('field.language')}
          value={form.language}
          onChange={(v) => { setField('language', v); if (v) setLang(v); }}
          options={[{ value: 'es', label: 'Español' }, { value: 'en', label: 'English' }]}
          error={err('language')}
        />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({ content: { padding: 16, backgroundColor: colors.bg, flexGrow: 1 } });
