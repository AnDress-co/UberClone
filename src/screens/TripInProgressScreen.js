import React, { useEffect, useRef, useState } from 'react';
import { Alert, Image, StyleSheet, Text, View, Platform } from 'react-native';
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

function getBearing(from, to) {
    const fromLat = (from.latitude * Math.PI) / 180;
    const toLat = (to.latitude * Math.PI) / 180;
    const deltaLng = ((to.longitude - from.longitude) * Math.PI) / 180;
    const y = Math.sin(deltaLng) * Math.cos(toLat);
    const x = Math.cos(fromLat) * Math.sin(toLat)
        - Math.sin(fromLat) * Math.cos(toLat) * Math.cos(deltaLng);
    return (Math.atan2(y, x) * 180) / Math.PI;
}

export default function TripInProgressScreen() {
    const { t } = useLenguage();
    const { activeTrip: trip } = useTrip();
    const { location } = useDriverLocation({ track: false });
    const mapRef = useRef(null);
    const fetchedLeg = useRef(null);
    const [route, setRoute] = useState(null);
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState('');
    const [routeAttempt, setRouteAttempt] = useState(0);
    const [vehiclePosition, setVehiclePosition] = useState(null);
    const [vehicleHeading, setVehicleHeading] = useState(0);
    const [visibleRoute, setVisibleRoute] = useState([]);
    useBlockBack();

    const leg = trip?.status === 'in_progress' ? 'dropoff' : 'pickup';

    useEffect(() => {
        if (trip?.status === 'accepted') setTripStatus(trip.id, 'driver_arriving').catch(() => { });
    }, [trip?.id, trip?.status]);

    useEffect(() => {
        if (!trip) return;
        const key = `${trip.id}:${leg}:${routeAttempt}`;
        if (fetchedLeg.current === key) return;
        const from = leg === 'pickup' ? location : trip.origin;
        const to = leg === 'pickup' ? trip.origin : trip.destination;
        if (!from || !to) return;
        fetchedLeg.current = key;
        setRoute(null);
        setError('');
        getRoute(from, to)
            .then((r) => setRoute({ encoded: r.encoded, points: decodePolyline(r.encoded) }))
            .catch((routeError) => {
                console.error('[TripInProgressScreen] Route request failed:', routeError.message);
                setError('err.route');
            });
    }, [trip, leg, location, routeAttempt]);

    useEffect(() => {
        if (route?.points?.length && mapRef.current) {
            mapRef.current.fitToCoordinates(route.points, { edgePadding: { top: 80, right: 60, bottom: 260, left: 60 }, animated: true });
        }
    }, [route]);

    useEffect(() => {
        const points = route?.points || [];
        if (points.length === 0) {
            setVehiclePosition(null);
            setVisibleRoute([]);
            return undefined;
        }

        let segment = 0;
        let progress = 0;
        setVisibleRoute(points);

        const animation = setInterval(() => {
            if (segment >= points.length - 1) {
                clearInterval(animation);
                setVehiclePosition(points[points.length - 1]);
                setVisibleRoute([points[points.length - 1]]);
                return;
            }

            const from = points[segment];
            const to = points[segment + 1];
            const position = {
                latitude: from.latitude + ((to.latitude - from.latitude) * progress),
                longitude: from.longitude + ((to.longitude - from.longitude) * progress),
            };
            setVehiclePosition(position);
            setVehicleHeading(getBearing(from, to));
            setVisibleRoute([position, ...points.slice(segment + 1)]);
            progress += 0.14;

            if (progress >= 1) {
                segment += 1;
                progress = 0;
            }
        }, 80);

        setVehiclePosition(points[0]);
        setVisibleRoute(points);
        if (points.length > 1) setVehicleHeading(getBearing(points[0], points[1]));

        return () => clearInterval(animation);
    }, [route?.encoded, leg]);

    if (!trip) return null;

    const retryRoute = () => {
        fetchedLeg.current = null;
        setError('');
        setRoute(null);
        setRouteAttempt((attempt) => attempt + 1);
    };

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
            <MapView ref={mapRef} style={styles.fill} provider={Platform.OS === 'android' ? PROVIDER_GOOGLE : undefined}
                initialRegion={{ latitude: trip.origin.lat, longitude: trip.origin.lng, latitudeDelta: 0.05, longitudeDelta: 0.05 }}>
                <Marker coordinate={{ latitude: trip.origin.lat, longitude: trip.origin.lng }} pinColor="green" title={t('request.origin')} />
                <Marker coordinate={{ latitude: trip.destination.lat, longitude: trip.destination.lng }} pinColor="red" title={t('request.destination')} />
                {vehiclePosition ? (
                    <Marker
                        coordinate={vehiclePosition}
                        flat
                        anchor={{ x: 0.5, y: 0.5 }}
                        title={t('trip.vehicle')}
                    >
                        <Image
                            source={require('../../assets/images/car-marker.png')}
                            style={[
                                styles.vehicleImage,
                                { transform: [{ rotate: `${vehicleHeading}deg` }] },
                            ]}
                            resizeMode="contain"
                        />
                    </Marker>
                ) : null}
                {visibleRoute.length ? <Polyline coordinates={visibleRoute} strokeWidth={5} strokeColor="#16A34A" /> : null}
            </MapView>
            <Card style={styles.panel}>
                <Text style={styles.step}>{leg === 'pickup' ? t('trip.goingToPickup') : t('trip.goingToDestination')}</Text>
                <Text style={styles.addr}>{target.address}</Text>
                {error ? (
                    <View style={styles.errRow}>
                        <Text style={styles.error}>{t(error)}</Text>
                        {error === 'err.route' && <ButtonCustom title={t('retry')} variant="ghost" onPress={retryRoute} style={styles.retry} />}
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
    vehicleImage: {
        width: 52,
        height: 52,
    },
});