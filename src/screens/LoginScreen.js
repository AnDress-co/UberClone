import React, { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import ButtonCustom from '../components/ButtonCustom';
import FormField from '../components/FormField';
import { colors } from '../config/theme';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LenguageContext';
import { validateEmail } from '../utils/validators';

export default function LoginScreen() {
  const { t, lang, setLang } = useLanguage();
  const { signIn, signUp } = useAuth();
  const [mode, setMode] = useState('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const emailError = submitted ? validateEmail(email) : null;
  const passError = submitted && password.length < 6 ? 'err.password' : null;

  const submit = async () => {
    setSubmitted(true);
    setError('');
    if (validateEmail(email) || password.length < 6) return;
    setBusy(true);
    try {
      await (mode === 'login' ? signIn(email, password) : signUp(email, password));
    } catch {
      setError(mode === 'login' ? 'err.login' : 'err.signup');
    } finally {
      setBusy(false);
    }
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <Text style={styles.logo}>UberClone</Text>
        <Text style={styles.sub}>{t('login.subtitle')}</Text>
        <FormField label={t('field.email')} value={email} onChangeText={setEmail} keyboardType="email-address" error={emailError} />
        <FormField label={t('field.password')} value={password} onChangeText={setPassword} secureTextEntry error={passError} />
        {error ? <Text style={styles.error}>{t(error)}</Text> : null}
        <ButtonCustom title={mode === 'login' ? t('login.signIn') : t('login.signUp')} onPress={submit} loading={busy} />
        <ButtonCustom
          title={mode === 'login' ? t('login.toSignUp') : t('login.toSignIn')}
          variant="ghost"
          onPress={() => { setMode(mode === 'login' ? 'signup' : 'login'); setError(''); }}
          style={{ marginTop: 10 }}
        />
        <View style={styles.langRow}>
          <ButtonCustom title="Español" variant={lang === 'es' ? 'primary' : 'ghost'} onPress={() => setLang('es')} style={styles.lang} />
          <ButtonCustom title="English" variant={lang === 'en' ? 'primary' : 'ghost'} onPress={() => setLang('en')} style={styles.lang} />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, justifyContent: 'center', padding: 24, backgroundColor: colors.bg },
  logo: { fontSize: 34, fontWeight: '800', color: colors.text, textAlign: 'center' },
  sub: { textAlign: 'center', color: colors.muted, marginBottom: 28, marginTop: 4 },
  error: { color: colors.danger, marginBottom: 10, textAlign: 'center' },
  langRow: { flexDirection: 'row', gap: 10, marginTop: 24 },
  lang: { flex: 1, minHeight: 40, paddingVertical: 8 },
});