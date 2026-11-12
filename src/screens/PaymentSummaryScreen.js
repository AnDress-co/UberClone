import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import ButtonCustom from '../components/ButtonCustom';
import Card from '../components/Card';
import StatCard from '../components/StatCard';
import { colors } from '../config/theme';
import { useLenguage } from '../context/LenguageContext';
import { useTrip } from '../context/TripContext';
import { useBlockBack } from '../hooks/useBlockBack';
import { createCheckout, openCheckout } from '../services/payments';
import { markCashPaid } from '../services/trips';
import { formatCOP } from '../utils/format';
import { paymentStatusColor, paymentStatusKey } from '../utils/payment';

export default function PaymentSummaryScreen() {
  const { t } = useLenguage();
  const { activeTrip: trip, finishTripFlow } = useTrip();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  useBlockBack();

  if (!trip) return null;
  const paid = trip.status === 'paid';

  const charge = async () => {
    setBusy(true);
    setError('');
    try {
      const checkout = await createCheckout({ tripId: trip.id, amount: trip.fare });
      await openCheckout(checkout.sandboxInitPoint || checkout.initPoint);
    } catch(e) {
      console.log(e);
      setError('err.payment');
    } finally {
      setBusy(false);
    }
  };

  const cashReceived = async () => {
    setBusy(true);
    setError('');
    try { await markCashPaid(trip.id); } catch { setError('err.generic'); } finally { setBusy(false); }
  };

  return (
    <ScrollView contentContainerStyle={styles.context}>
      <Text style={styles.title}>{t('summary.title')}</Text>
      <View style={[styles.badge, { backgroundColor: paymentStatusColor(trip) }]}>
        <Text style={styles.badgeText}>{t(paymentStatusKey(trip))}</Text>
      </View>
      <Card style={{ marginTop: 14 }}>
        <StatCard label={t('summary.finalFare')} value={formatCOP(trip.fare)} />
        <StatCard label={t('summary.commission', { rate: Math.round((trip.commissionRate ?? 0) * 100) })} value={`-${formatCOP(trip.commission)}`} />
        {trip.tip ? <StatCard label={t('summary.tip')} value={formatCOP(trip.tip)} /> : null}
        <StatCard label={t('summary.net')} value={formatCOP(trip.driverEarnings)} strong />
        <StatCard label={t('trip.method')} value={t(`method.${trip.paymentMethod}`)} />
      </Card>
      {error ? <Text style={styles.error}>{t(error)}</Text> : null}
      <View style={{ marginTop: 18, gap: 10 }}>
        <Text style={styles.muted}>{t('summary.description')}</Text>
        {!paid && trip.paymentMethod === 'cash' && <ButtonCustom title={t('summary.cashReceived')} variant="accent" onPress={cashReceived} loading={busy} />}
        {!paid && trip.paymentMethod === 'mercadopago' && (
          <ButtonCustom title={trip.paymentStatus === 'rejected' ? t('summary.retryCharge') : t('summary.charge')} variant="accent" onPress={charge} loading={busy} />
        )}
        {paid && <ButtonCustom title={t('summary.backHome')} onPress={finishTripFlow} />}
        {!paid && <Text style={styles.muted}>{t('summary.waiting')}</Text>}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  context: { padding: 16, backgroundColor: colors.bg, flexGrow: 1 },
  title: { fontSize: 24, fontWeight: '800', color: colors.text },
  badge: { alignSelf: 'flex-start', borderRadius: 20, paddingHorizontal: 14, paddingVertical: 6, marginTop: 10 },
  badgeText: { color: '#fff', fontWeight: '700' },
  error: { color: colors.danger, marginTop: 12 },
  muted: { color: colors.muted, textAlign: 'center' },
});