import React from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text } from 'react-native';
import Card from '../components/Card';
import StatCard from '../components/StatCard';
import { colors } from '../config/theme';
import { useLenguage } from '../context/LenguageContext';
import { useEarnings } from '../hooks/useEarnings';
import { formatCOP } from '../utils/format';

function PeriodCard({ title, data, t }) {
  return (
    <Card style={{ marginTop: 12 }}>
      <Text style={styles.cardTitle}>{title}</Text>
      <StatCard label={t('earn.trips')} value={String(data.count)} />
      <StatCard label={t('earn.billed')} value={formatCOP(data.billed)} />
      <StatCard label={t('earn.commissions')} value={formatCOP(data.commissions)} />
      <StatCard label={t('earn.tips')} value={formatCOP(data.tips)} />
      <StatCard label={t('earn.net')} value={formatCOP(data.net)} strong />
      <StatCard label={t('earn.average')} value={formatCOP(data.average)} />
    </Card>
  );
}

export default function EarningsScreen() {
  const { t } = useLenguage();
  const { loading, summaries, balance } = useEarnings();
  if (loading) return <ActivityIndicator style={{ flex: 1 }} />;
  return (
    <ScrollView contentContainerStyle={styles.context}>
      <Card>
        <Text style={styles.label}>{t('earn.balance')}</Text>
        <Text style={[styles.balance, balance < 0 && { color: colors.danger }]}>{formatCOP(balance)}</Text>
        <Text style={styles.hint}>{t('earn.balanceHint')}</Text>
      </Card>
      <PeriodCard title={t('earn.today')} data={summaries.day} t={t} />
      <PeriodCard title={t('earn.week')} data={summaries.week} t={t} />
      <PeriodCard title={t('earn.month')} data={summaries.month} t={t} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  context: { padding: 16, backgroundColor: colors.bg, flexGrow: 1 },
  label: { color: colors.muted, textTransform: 'uppercase', fontSize: 12 },
  balance: { fontSize: 32, fontWeight: '800', color: colors.text },
  hint: { color: colors.muted, fontSize: 12, marginTop: 4 },
  cardTitle: { fontSize: 18, fontWeight: '800', color: colors.text, marginBottom: 6 },
});