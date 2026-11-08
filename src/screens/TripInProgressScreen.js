import React, { useEffect, useRef, useState } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE, Polyline } from 'react-native-maps';
import ButtonCustom from '../components/ButtonCustom';
import Card from '../components/Card';
import { PRICING } from '../config/pricing';
import { colors } from '../config/theme';
import { useLenguage } from '../context/LenguageContext';
import { useTrip } from '../context/TripContext';
import { useBlockBack } from '../hooks/useBlockBack';
import { useDriverLocation } from '../hooks/useDriverLocation';
import { getRoute } from '../services/googleMaps';
import { completeTrip, setTripStatus } from '../services/trips';
import { calculateFare } from '../utils/calculateFare';
import { decodePolyline } from '../utils/polyline';

export default function TripInProgressScreen() {
    const { t } = useLenguage();
    const { activeTrip: trip } = useTrip();
    const { location } = useDriverLocation({ track: true });
    const mapRef = useRef(null);
    const fetchedLeg = useRef(null);
    const [route, setRoute] = useState(null);
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState('');
    useBlockBack();

    const leg = trip?.status === 'in_progress' ? 'dropoff' : 'pickup';

    useEffect(() => {
        if (trip?.status === 'accepted') setTripStatus(trip.id, 'driver_arriving').catch(() => { });
    }, [trip?.id, trip?.status]);

    useEffect(() => {
        if (!trip) return;
        const key = `${trip.id}:${leg}`;
        if (fetchedLeg.current === key) return;
        const from = leg === 'pickup' ? location : trip.origin;
        const to = leg === 'pickup' ? trip.origin : trip.destination;
        if (!from) return;
        fetchedLeg.current = key;
        setRoute(null);
        getRoute(from, to)
            .then((r) => setRoute({ encoded: r.encoded, points: decodePolyline(r.encoded) }))
            .catch(() => setError('err.route'));
    }, [trip, leg, location]);

    useEffect(() => {
        if (route?.points?.length && mapRef.current) {
            mapRef.current.fitToCoordinates(route.points, { edgePadding: { top: 80, right: 60, bottom: 260, left: 60 }, animated: true });
        }
    }, [route]);

    if (!trip) return null;

    const retryRoute = () => { fetchedLeg.current = null; setError(''); setRoute(null); };

    const passengerOnBoard = async () => {
        setBusy(true);
        setError('');
        try { await setTripStatus(trip.id, 'in_progress', { startedAt: new Date() }); }
        catch { setError('err.generic'); }
        finally { setBusy(false); }
    };

    const finishTrip = async () => {
        setBusy(true);
        setError('');
        try {
            const { fare, commission, driverEarnings } = calculateFare({
                distanceKm: trip.distanceKm, durationMin: trip.durationMin, category: trip.category, tip: trip.tip || 0,
            });
            await completeTrip(trip.id, {
                fare, commission, driverEarnings, tip: trip.tip || 0,
                commissionRate: PRICING.commissionRate,
                routePolyline: route?.encoded ?? null,
            });
        } catch { setError('err.generic'); setBusy(false); }
    };

    const cancel = () =>
        Alert.alert(t('trip.cancelTitle'), t('trip.cancelBody'), [
            { text: t('no'), style: 'cancel' },
            { text: t('yes'), style: 'destructive', onPress: () => setTripStatus(trip.id, 'cancelled', { cancelledBy: 'driver' }).catch(() => setError('err.generic')) },
        ]);

    const target = leg === 'pickup' ? trip.origin : trip.destination;

    return (
        <View style={styles.fill}>
            <MapView ref={mapRef} style={styles.fill} provider={PROVIDER_GOOGLE} showsUserLocation
                initialRegion={{ latitude: trip.origin.lat, longitude: trip.origin.lng, latitudeDelta: 0.05, longitudeDelta: 0.05 }}>
                <Marker coordinate={{ latitude: trip.origin.lat, longitude: trip.origin.lng }} pinColor="green" title={t('request.origin')} />
                <Marker coordinate={{ latitude: trip.destination.lat, longitude: trip.destination.lng }} pinColor="red" title={t('request.destination')} />
                {route?.points?.length ? <Polyline coordinates={route.points} strokeWidth={5} strokeColor={colors.primary} /> : null}
            </MapView>
            <Card style={styles.panel}>
                <Text style={styles.step}>{leg === 'pickup' ? t('trip.goingToPickup') : t('trip.goingToDestination')}</Text>
                <Text style={styles.addr}>{target.address}</Text>
                {error ? (
                    <View style={styles.errRow}>
                        <Text style={styles.error}>{t(error)}</Text>
                        {error === 'err.route' && <Button title={t('retry')} variant="ghost" onPress={retryRoute} style={styles.retry} />}
                    </View>
                ) : null}
                {leg === 'pickup' ? (
                    <>
                        <ButtonCustom title={t('trip.passengerOnBoard')} variant="accent" onPress={passengerOnBoard} loading={busy} />
                        <ButtonCustom title={t('trip.cancel')} variant="ghost" onPress={cancel} style={{ marginTop: 8 }} disabled={busy} />
                    </>
                ) : (
                    <ButtonCustom title={t('trip.finish')} onPress={finishTrip} loading={busy} />
                )}
            </Card>
        </View>
    );
}

const styles = StyleSheet.create({
    fill: { flex: 1 },
    panel: { position: 'absolute', bottom: 16, left: 12, right: 12 },
    step: { color: colors.muted, fontSize: 12, textTransform: 'uppercase' },
    addr: { color: colors.text, fontSize: 18, fontWeight: '700', marginBottom: 12 },
    errRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
    error: { color: colors.danger, flex: 1 },
    retry: { minHeight: 36, paddingVertical: 6 },
});