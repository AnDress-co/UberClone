import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View, Platform } from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE, Polyline } from 'react-native-maps';
import Card from '../components/Card';
import StatCard from '../components/StatCard';
import { colors } from '../config/theme';
import { useLenguage } from '../context/LenguageContext';
import { getTrip } from '../services/trips';
import { formatCOP, formatDateTime } from '../utils/format';
import { paymentStatusKey } from '../utils/payment';
import { decodePolyline } from '../utils/polyline';

export default function TripDetailScreen({ route }) {
    const { t } = useLenguage();
    const [trip, setTrip] = useState(undefined);
    const mapRef = useRef(null);

    useEffect(() => { getTrip(route.params.tripId).then(setTrip).catch(() => setTrip(null)); }, [route.params.tripId]);

    const points = useMemo(() => decodePolyline(trip?.routePolyline), [trip?.routePolyline]);
    const fit = () => {
        const coords = points.length ? points : trip ? [
            { latitude: trip.origin.lat, longitude: trip.origin.lng }, { latitude: trip.destination.lat, longitude: trip.destination.lng },
        ] : [];
        if (coords.length) mapRef.current?.fitToCoordinates(coords, { edgePadding: { top: 40, right: 40, bottom: 40, left: 40 } });
    };

    if (trip === undefined) return <ActivityIndicator style={{ flex: 1 }} />;
    if (trip === null) return <Text style={styles.empty}>{t('err.generic')}</Text>;

    return (
        <ScrollView contentContainerStyle={styles.context}>
            <MapView ref={mapRef} style={styles.map} provider={Platform.OS === 'android' ? PROVIDER_GOOGLE : undefined} onMapReady={fit}
                initialRegion={{ latitude: trip.origin.lat, longitude: trip.origin.lng, latitudeDelta: 0.05, longitudeDelta: 0.05 }}>
                <Marker coordinate={{ latitude: trip.origin.lat, longitude: trip.origin.lng }} pinColor="green" />
                <Marker coordinate={{ latitude: trip.destination.lat, longitude: trip.destination.lng }} pinColor="red" />
                {points.length ? <Polyline coordinates={points} strokeWidth={5} strokeColor={colors.primary} /> : null}
            </MapView>
            <Card style={{ marginTop: 12 }}>
                <Text style={styles.addr}>{trip.origin.address}</Text>
                <Text style={styles.arrow}>↓</Text>
                <Text style={styles.addr}>{trip.destination.address}</Text>
            </Card>
            <Card style={{ marginTop: 12 }}>
                <StatCard label={t('history.date')} value={formatDateTime(trip.createdAt)} />
                <StatCard label={t('trip.category')} value={t(`category.${trip.category}`)} />
                <StatCard label={t('trip.distance')} value={`${trip.distanceKm} km`} />
                <StatCard label={t('trip.duration')} value={`${trip.durationMin} min`} />
                <StatCard label={t('summary.finalFare')} value={formatCOP(trip.fare)} />
                <StatCard label={t('summary.commission', { rate: Math.round((trip.commissionRate ?? 0) * 100) })} value={formatCOP(trip.commission)} />
                <StatCard label={t('summary.tip')} value={formatCOP(trip.tip || 0)} />
                <StatCard label={t('summary.net')} value={formatCOP(trip.driverEarnings)} strong />
                <StatCard label={t('trip.method')} value={t(`method.${trip.paymentMethod}`)} />
                <StatCard label={t('history.payment')} value={trip.status === 'cancelled' ? t('status.cancelled') : t(paymentStatusKey(trip))} />
                <StatCard label={t('history.rating')} value={trip.rating ? `★ ${trip.rating}/5` : '—'} />
            </Card>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    context: { padding: 12, backgroundColor: colors.bg, flexGrow: 1 },
    map: { height: 240, borderRadius: 14 },
    addr: { color: colors.text, fontWeight: '600', fontSize: 15 },
    arrow: { color: colors.muted, marginVertical: 2 },
    empty: { textAlign: 'center', marginTop: 40, color: colors.muted },
});