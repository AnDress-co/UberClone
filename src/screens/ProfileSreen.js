import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import ButtonCustom from '../components/ButtonCustom';
import Card from '../components/Card';
import DropDown from '../components/DropDown';
import FormField from '../components/FormField';
import StatCard from '../components/StatCard';
import { colors } from '../config/theme';
import { useAuth } from '../context/AuthContext';
import { useLenguage } from '../context/LenguageContext';
import { updateDriverLanguage, updateDriverPersonal } from '../services/drivers';
import { toISODate } from '../utils/dates';
import { validateProfileEdit } from '../utils/validators';

export default function ProfileScreen() {
  const { t, lang, setLang } = useLenguage();
  const { user, driver, signOut } = useAuth();
  const [form, setForm] = useState({ fullName: driver.personal.fullName, phone: driver.personal.phone, email: driver.personal.email });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');
  const errors = validateProfileEdit(form);
  const today = toISODate(new Date());

  const set = (k) => (v) => { setForm((p) => ({ ...p, [k]: v })); setSaved(false); };
  const save = async () => {
    setSaving(true);
    setError('');
    try { await updateDriverPersonal(user.uid, form); setSaved(true); }
    catch { setError('err.generic'); }
    finally { setSaving(false); }
  };
  const changeLang = (v) => { if (!v) return; setLang(v); updateDriverLanguage(user.uid, v).catch(() => {}); };

  const docState = (expiry) => (!expiry ? '—' : expiry > today ? `${t('profile.valid')} · ${expiry}` : `${t('profile.expired')} · ${expiry}`);
  const v = driver.vehicle;
  const docs = driver.documents;

  return (
    <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
      <Card>
        <Text style={styles.title}>{t('profile.personal')}</Text>
        <FormField label={t('field.fullName')} value={form.fullName} onChangeText={set('fullName')} error={errors.fullName} autoCapitalize="words" />
        <FormField label={t('field.phone')} value={form.phone} onChangeText={(x) => set('phone')(x.replace(/\D/g, ''))} error={errors.phone} keyboardType="phone-pad" />
        <FormField label={t('field.email')} value={form.email} onChangeText={set('email')} error={errors.email} keyboardType="email-address" />
        {error ? <Text style={styles.error}>{t(error)}</Text> : null}
        {saved ? <Text style={styles.ok}>{t('profile.saved')}</Text> : null}
        <ButtonCustom title={t('profile.save')} onPress={save} disabled={Object.keys(errors).length > 0} loading={saving} />
      </Card>

      <Card style={styles.gap}>
        <Text style={styles.title}>{t('profile.vehicle')}</Text>
        <StatCard label={t('field.category')} value={t(`category.${v.category}`)} />
        <StatCard label={t('field.plate')} value={v.plate} />
        <StatCard label={t('profile.brandModel')} value={`${v.brand} ${v.model} (${v.year})`} />
        <StatCard label={t('field.color')} value={t(`color.${v.color}`)} />
        <StatCard label={t('field.capacity')} value={String(v.capacity)} />
      </Card>

      <Card style={styles.gap}>
        <Text style={styles.title}>{t('profile.documents')}</Text>
        <StatCard label={t('field.licenseNumber')} value={docs.license.number} />
        <StatCard label={t('profile.license')} value={docState(docs.license.expiry)} />
        <StatCard label="SOAT" value={docState(docs.soat.expiry)} />
        {docs.tech ? <StatCard label={t('profile.tech')} value={docState(docs.tech.expiry)} /> : null}
        <StatCard label={t('profile.approval')} value={t(`approval.${driver.approvalStatus}`)} />
      </Card>

      <Card style={styles.gap}>
        <Text style={styles.title}>{t('profile.settings')}</Text>
        <DropDown label={t('field.language')} value={lang} onChange={changeLang} options={[{ value: 'es', label: 'Español' }, { value: 'en', label: 'English' }]} />
      </Card>

      <View style={styles.gap}><ButtonCustom title={t('profile.logout')} variant="danger" onPress={signOut} /></View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { padding: 16, backgroundColor: colors.bg, flexGrow: 1 },
  gap: { marginTop: 12 },
  title: { fontSize: 18, fontWeight: '800', color: colors.text, marginBottom: 10 },
  error: { color: colors.danger, marginBottom: 8 },
  ok: { color: colors.accent, marginBottom: 8 },
});