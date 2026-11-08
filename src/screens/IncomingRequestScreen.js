import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import ButtonCustom from '../components/ButtonCustom';
import Card from '../components/Card';
import StatCard from '../components/StatCard';
import { PRICING } from '../config/pricing';
import { colors } from '../config/theme';
import { useAuth } from '../context/AuthContext';
import { useLenguage } from '../context/LenguageContext';
import { useTrip } from '../context/TripContext';
import { useBlockBack } from '../hooks/useBlockBack';
import { getDistanceMatrix } from '../services/googleMaps';
import { acceptTrip, rejectTrip, subscribeTrip } from '../services/trips';
import { calculateFare } from '../utils/calculateFare';
import { formatCOP } from '../utils/format';

export default function IncomingRequestScreen({ route }) {
    const { tripId } = route.params;
    const { t } = useLenguage();
    const { user, driver } = useAuth();
    const { clearIncoming, setActiveTripId } = useTrip();
    const [trip, setTrip] = useState(null);
    const [secondsLeft, setSecondsLeft] = useState(PRICING.requestTimeoutSeconds);
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState('');
    const doneRef = useRef(false);
    useBlockBack();

    useEffect(() => subscribeTrip(tripId, setTrip), [tripId]);

    useEffect(() => {
        const id = setInterval(() => setSecondsLeft((s) => s - 1), 1000);
        return () => clearInterval(id);
    }, []);

    const handleReject = useCallback(async () => {
        if (doneRef.current) return;
        doneRef.current = true;
        try { await rejectTrip(tripId, user.uid); } catch { /* ignore */ }
        clearIncoming(tripId);
    }, [tripId, user.uid, clearIncoming]);

    const handleAccept = useCallback(async () => {
        if (doneRef.current || !trip) return;
        doneRef.current = true;
        setBusy(true);
        setError('');
        try {
            const metrics = await getDistanceMatrix(trip.origin, trip.destination).catch(() => null);
            await acceptTrip(tripId, user.uid, {
                metrics,
                driverInfo: {
                    name: driver.personal.fullName, photoUrl: driver.personal.photoUrl, phone: driver.personal.phone,
                    plate: driver.vehicle.plate, brand: driver.vehicle.brand, model: driver.vehicle.model, color: driver.vehicle.color,
                },
            });
            setActiveTripId(tripId);
            clearIncoming();
        } catch (e) {
            setError(e.message === 'TRIP_TAKEN' ? 'err.tripTaken' : 'err.generic');
            setBusy(false);
            if (e.message === 'TRIP_TAKEN') setTimeout(() => clearIncoming(tripId), 1500);
            else doneRef.current = false;
        }
    }, [trip, tripId, user.uid, driver, setActiveTripId, clearIncoming]);

    useEffect(() => { if (secondsLeft <= 0) handleReject(); }, [secondsLeft, handleReject]);

    useEffect(() => {
        if (trip && trip.status !== 'requested' && trip.driverId !== user.uid) { doneRef.current = true; clearIncoming(tripId); }
    }, [trip, user.uid, tripId, clearIncoming]);

    const estimate = useMemo(
        () => (trip ? calculateFare({ distanceKm: trip.distanceKm, durationMin: trip.durationMin, category: trip.category, tip: trip.tip || 0 }) : null),
        [trip]
    );

    if (!trip) return <View style={styles.c}><Text>{t('loading')}</Text></View>;

    return (
        <ScrollView contentContainerStyle={styles.c}>
            <Text style={styles.title}>{t('request.title')}</Text>
            <View style={styles.bar}><View style={[styles.barFill, { width: `${Math.max(0, secondsLeft) / PRICING.requestTimeoutSeconds * 100}%` }]} /></View>
            <Text style={styles.timer}>{t('request.timer', { s: Math.max(0, secondsLeft) })}</Text>
            <Card>
                <Text style={styles.label}>{t('request.origin')}</Text>
                <Text style={styles.addr}>{trip.origin.address}</Text>
                <Text style={[styles.label, { marginTop: 10 }]}>{t('request.destination')}</Text>
                <Text style={styles.addr}>{trip.destination.address}</Text>
            </Card>
            <Card style={{ marginTop: 12 }}>
                <StatCard label={t('trip.distance')} value={`${trip.distanceKm} km`} />
                <StatCard label={t('trip.duration')} value={`${trip.durationMin} min`} />
                <StatCard label={t('trip.category')} value={t(`category.${trip.category}`)} />
                <StatCard label={t('trip.method')} value={t(`method.${trip.paymentMethod}`)} />
                <StatCard label={t('trip.estimatedFare')} value={formatCOP(estimate.fare)} />
                <StatCard label={t('trip.estimatedNet')} value={formatCOP(estimate.driverEarnings)} strong />
            </Card>
            {error ? <Text style={styles.error}>{t(error)}</Text> : null}
            <View style={styles.actions}>
                <ButtonCustom title={t('request.reject')} variant="ghost" onPress={handleReject} disabled={busy} style={{ flex: 1 }} />
                <ButtonCustom title={t('request.accept')} variant="accent" onPress={handleAccept} loading={busy} style={{ flex: 1 }} />
            </View>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    c: { padding: 16, backgroundColor: colors.bg, flexGrow: 1 },
    title: { fontSize: 24, fontWeight: '800', color: colors.text },
    bar: { height: 8, backgroundColor: colors.border, borderRadius: 4, marginTop: 10, overflow: 'hidden' },
    barFill: { height: 8, backgroundColor: colors.accent },
    timer: { color: colors.muted, marginVertical: 8 },
    label: { color: colors.muted, fontSize: 12, textTransform: 'uppercase' },
    addr: { color: colors.text, fontSize: 16, fontWeight: '600' },
    error: { color: colors.danger, marginTop: 12 },
    actions: { flexDirection: 'row', gap: 12, marginTop: 18 },
});