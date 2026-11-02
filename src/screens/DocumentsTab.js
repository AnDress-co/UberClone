import React, { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import ButtonCustom from '../components/ButtonCustom';
import Card from '../components/Card';
import DateField from '../components/DateField';
import FormField from '../components/FormField';
import ImageField from '../components/ImageField';
import { PRICING } from '../config/pricing';
import { colors } from '../config/theme';
import { useAuth } from '../context/AuthContext';
import { useLenguage } from '../context/LenguageContext';
import { useRegistration } from '../context/RegistrationContext';
import { uploadImage } from '../services/cloudinary';
import { buildDriverDocument, createDriverProfile } from '../services/drivers';
import { needsTechReview } from '../utils/validators';

export default function DocumentsTab() {
  const { t } = useLenguage();
  const { user } = useAuth();
  const { form, setField, touch, errorFor, sections, isValid } = useRegistration();
  const err = (n) => errorFor('documents', n);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const techRequired = needsTechReview(form.year);
  const tomorrow = new Date(Date.now() + 24 * 3600 * 1000);

  const submit = async () => {
    setSubmitting(true);
    setSubmitError('');
    try {
      const up = (uri, folder) => (uri ? uploadImage(uri, `uberclone/${user.uid}/${folder}`) : Promise.resolve(null));
      const [photo, vehiclePhoto, licensePhoto, soatPhoto, techPhoto] = await Promise.all([
        up(form.photo, 'profile'), up(form.vehiclePhoto, 'vehicle'), up(form.licensePhoto, 'license'),
        up(form.soatPhoto, 'soat'), techRequired ? up(form.techPhoto, 'tech') : Promise.resolve(null),
      ]);      
      await createDriverProfile(user.uid, buildDriverDocument(form, { photo, vehiclePhoto, licensePhoto, soatPhoto, techPhoto }));
    } catch {
      setSubmitError('err.submit');      
      setSubmitting(false);
    }
  };

  const status = (key, label) => (
    <View key={key} style={styles.statusContainer}>      
      <Text style={[styles.status, { color: Object.keys(sections[key]).length ? colors.danger : colors.accent }]}>
        {Object.keys(sections[key]).length ? 
            <Ionicons name="close-circle" color={colors.danger} size={20} /> : 
            <Ionicons name="checkmark-circle" color={colors.accent} size={20} />
        } {label}
      </Text>
    </View>
  );

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <FormField label={t('field.licenseNumber')} value={form.licenseNumber} onChangeText={(v) => setField('licenseNumber', v.replace(/\D/g, ''))} onBlur={() => touch('licenseNumber')} error={err('licenseNumber')} keyboardType="number-pad" maxLength={15} />
        <ImageField label={t('field.licensePhoto')} uri={form.licensePhoto} onChange={(v) => setField('licensePhoto', v)} error={err('licensePhoto')} />
        <DateField label={t('field.licenseExpiry')} value={form.licenseExpiry} onChange={(v) => setField('licenseExpiry', v)} error={err('licenseExpiry')} minimumDate={tomorrow} />

        <ImageField label={t('field.soatPhoto')} uri={form.soatPhoto} onChange={(v) => setField('soatPhoto', v)} error={err('soatPhoto')} />
        <DateField label={t('field.soatExpiry')} value={form.soatExpiry} onChange={(v) => setField('soatExpiry', v)} error={err('soatExpiry')} minimumDate={tomorrow} />

        {techRequired ? (
          <>
            <ImageField label={t('field.techPhoto')} uri={form.techPhoto} onChange={(v) => setField('techPhoto', v)} error={err('techPhoto')} />
            <DateField label={t('field.techExpiry')} value={form.techExpiry} onChange={(v) => setField('techExpiry', v)} error={err('techExpiry')} minimumDate={tomorrow} />
          </>
        ) : (
          <Text style={styles.hint}>{t('hint.techNotRequired')}</Text>
        )}

        <FormField label={t('field.mpEmail')} value={form.mpEmail} onChangeText={(v) => setField('mpEmail', v)} onBlur={() => touch('mpEmail')} error={err('mpEmail')} keyboardType="email-address" />
        <Text style={styles.hint}>{t('hint.noBankData')}</Text>

        <View style={styles.terms}>
          <Switch value={form.acceptTerms} onValueChange={(v) => setField('acceptTerms', v)} />
          <Text style={styles.termsText}>{t('terms.text', { rate: Math.round(PRICING.commissionRate * 100) })}</Text>
        </View>
        {err('acceptTerms') ? <Text style={styles.error}>{t(err('acceptTerms'))}</Text> : null}

        <Card style={{ marginVertical: 14 }}>
          {status('personal', t('tab.personal'))}
          {status('vehicle', t('tab.vehicle'))}
          {status('documents', t('tab.documents'))}
        </Card>
        {submitError ? <Text style={styles.error}>{t(submitError)}</Text> : null}
        <ButtonCustom title={t('register.submit')} onPress={submit} disabled={!isValid} loading={submitting} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  content: { padding: 16, backgroundColor: colors.bg, flexGrow: 1 },
  hint: { color: colors.muted, fontSize: 13, marginBottom: 14 },
  terms: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 4 },
  termsText: { flex: 1, color: colors.text },
  error: { color: colors.danger, fontSize: 12, marginTop: 4, marginBottom: 6 },
  status: { fontSize: 15, fontWeight: '600', paddingVertical: 3 },
});
