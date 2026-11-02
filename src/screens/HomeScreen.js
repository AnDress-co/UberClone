// AI-assisted: see docs/AI_LOG.md #1
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { StyleSheet, Switch, Text, View, Platform } from 'react-native';
import MapView, { PROVIDER_GOOGLE } from 'react-native-maps';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { CommonActions, useIsFocused } from '@react-navigation/native';
import Card from '../components/Card';
import { colors } from '../config/theme';
import { useAuth } from '../context/AuthContext';
import { useLenguage } from '../context/LenguageContext';
import { useTrip } from '../context/TripContext';
import { useDriverLocation } from '../hooks/useDriverLocation';
import { useTripRequests } from '../hooks/useTripRequests';
import { setAvailability } from '../services/drivers';

const MEDELLIN = { latitude: 6.2442, longitude: -75.5812, latitudeDelta: 0.05, longitudeDelta: 0.05 };
const ON_TRIP = ['accepted', 'driver_arriving', 'in_progress'];
const SETTLING = ['completed', 'paid'];

export default function HomeScreen({ navigation }) {
    const { t } = useLenguage();
    const { user, driver } = useAuth();
    const { incomingTripId, setIncomingTripId, isDismissed, activeTripId, activeTrip } = useTrip();
    const isFocused = useIsFocused();
    const mapRef = useRef(null);
    const resumed = useRef(false);
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState('');

    const approved = driver.approvalStatus === 'approved';
    const available = approved && !!driver.available;

    const { location, permission } = useDriverLocation({ track: available && isFocused });
    const requests = useTripRequests({
        enabled: available && !activeTripId,
        category: driver.vehicle?.category,
        uid: user.uid,
    });
    const candidate = requests.find((r) => !isDismissed(r.id));

    useEffect(() => {
        if (resumed.current || !approved) return;
        resumed.current = true;
        AsyncStorage.getItem(`pref:available:${user.uid}`)
            .then((v) => { if (v === 'true' && !driver.available) setAvailability(user.uid, true); })
            .catch(() => { });
    }, [approved, driver.available, user.uid]);

    useEffect(() => {
        if (candidate && !incomingTripId && !activeTripId) setIncomingTripId(candidate.id);
    }, [candidate, incomingTripId, activeTripId, setIncomingTripId]);

    const target = useMemo(() => {
        if (activeTrip && ON_TRIP.includes(activeTrip.status)) return { name: 'TripInProgress' };
        if (activeTrip && SETTLING.includes(activeTrip.status)) return { name: 'PaymentSummary' };
        if (!activeTripId && incomingTripId) return { name: 'IncomingRequest', params: { tripId: incomingTripId } };
        return null;
    }, [activeTrip, activeTripId, incomingTripId]);
    const waiting = !!activeTripId && !activeTrip;

    useEffect(() => {
        if (waiting) return;
        const home = navigation.getState().routes.find((r) => r.name === 'Home');
        navigation.dispatch(
            CommonActions.reset({ index: target ? 1 : 0, routes: target ? [home, target] : [home] })
        );
    }, [target?.name, target?.params?.tripId, waiting, navigation]);

    useEffect(() => {
        if (location && mapRef.current) {
            mapRef.current.animateCamera({ center: { latitude: location.lat, longitude: location.lng }, zoom: 15 }, { duration: 600 });
        }
    }, [location?.lat, location?.lng]);

    const toggle = async (value) => {
        if (!approved || busy) return;
        setBusy(true);
        setError('');
        try {
            await setAvailability(user.uid, value);
            await AsyncStorage.setItem(`pref:available:${user.uid}`, String(value));
        } catch {
            setError('err.generic');
        } finally {
            setBusy(false);
        }
    };

    const banner = driver.approvalStatus === 'pending' ? 'home.pending' : driver.approvalStatus === 'rejected' ? 'home.rejected' : null;

    return (
        <View style={styles.fill}>
            <MapView ref={mapRef} style={styles.fill} provider={Platform.OS === 'android' ? PROVIDER_GOOGLE : undefined} initialRegion={MEDELLIN} showsUserLocation showsMyLocationButton={false} />
            {banner && (
                <Card style={[styles.banner, { backgroundColor: driver.approvalStatus === 'pending' ? '#FEF3C7' : '#FEE2E2' }]}>
                    <Text style={styles.bannerText}>{t(banner)}</Text>
                </Card>
            )}
            <Card style={styles.panel}>
                <View style={styles.row}>
                    <View style={{ flex: 1 }}>
                        <Text style={styles.status}>{available ? t('home.available') : t('home.unavailable')}</Text>
                        <Text style={styles.sub}>{available ? t('home.waiting') : approved ? t('home.goOnline') : t('home.needApproval')}</Text>
                    </View>
                    <Switch value={available} onValueChange={toggle} disabled={!approved || busy} trackColor={{ true: colors.accent }} />
                </View>
                {permission === 'denied' && <Text style={styles.error}>{t('err.locationDenied')}</Text>}
                {error ? <Text style={styles.error}>{t(error)}</Text> : null}
            </Card>
        </View>
    );
}

const styles = StyleSheet.create({
    fill: { flex: 1 },
    banner: { position: 'absolute', top: 12, left: 12, right: 12 },
    bannerText: { color: colors.text, fontWeight: '600' },
    panel: { position: 'absolute', bottom: 20, left: 12, right: 12 },
    row: { flexDirection: 'row', alignItems: 'center' },
    status: { fontSize: 20, fontWeight: '800', color: colors.text },
    sub: { color: colors.muted, marginTop: 2 },
    error: { color: colors.danger, marginTop: 8 },
});