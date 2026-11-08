import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import Card from '../components/Card';
import DateField from '../components/DateField';
import { colors } from '../config/theme';
import { useAuth } from '../context/AuthContext';
import { useLenguage } from '../context/LenguageContext';
import { fetchHistoryPage } from '../services/trips';
import { endOfDay, parseISODate, periodStart, startOfDay, toISODate } from '../utils/dates';
import { formatCOP, formatDateTime } from '../utils/format';
import { paymentStatusColor, paymentStatusKey } from '../utils/payment';

const PERIODS = ['day', 'week', 'month', 'range'];
const METHODS = ['all', 'mercadopago', 'stripe', 'cash'];

function Chip({ label, active, onPress }) {
    return (
        <Pressable onPress={onPress} style={[styles.chip, active && styles.chipActive]}>
            <Text style={[styles.chipText, active && styles.chipTextActive]}>{label}</Text>
        </Pressable>
    );
}

export default function HistoryScreen({ navigation }) {
    const { t } = useLenguage();
    const { user } = useAuth();
    const [period, setPeriod] = useState('week');
    const [method, setMethod] = useState('all');
    const [from, setFrom] = useState(toISODate(new Date()));
    const [to, setTo] = useState(toISODate(new Date()));
    const [items, setItems] = useState([]);
    const [cursor, setCursor] = useState(null);
    const [isLast, setIsLast] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const loadingRef = useRef(false);

    const rangeInvalid = period === 'range' && from > to;
    const range = useMemo(
        () => (period === 'range'
            ? { since: startOfDay(parseISODate(from)), until: endOfDay(parseISODate(to)) }
            : { since: periodStart(period), until: endOfDay(new Date()) }),
        [period, from, to]
    );

    const load = useCallback(async (reset) => {
        if (loadingRef.current) return;
        loadingRef.current = true;
        setLoading(true);
        setError('');
        try {
            const page = await fetchHistoryPage({ uid: user.uid, ...range, method, cursor: reset ? null : cursor });
            setItems((prev) => (reset ? page.trips : [...prev, ...page.trips]));
            setCursor(page.cursor);
            setIsLast(page.isLast);
        } catch {
            setError('err.history');
        } finally {
            loadingRef.current = false;
            setLoading(false);
        }
    }, [user.uid, range, method, cursor]);

    useEffect(() => {
        if (rangeInvalid) { setItems([]); return; }
        loadingRef.current = false;
        load(true);
    }, [range, method, rangeInvalid]);

    const renderItem = ({ item }) => (
        <Pressable onPress={() => navigation.navigate('TripDetail', { tripId: item.id })}>
            <Card style={styles.item}>
                <Text style={styles.date}>{formatDateTime(item.createdAt)} · {t(`category.${item.category}`)}</Text>
                <Text style={styles.route} numberOfLines={2}>{item.origin?.address} → {item.destination?.address}</Text>
                <View style={styles.rowBetween}>
                    <Text style={styles.money}>{formatCOP(item.fare)} · {t('history.net')} {formatCOP(item.driverEarnings)}</Text>
                    {item.status === 'cancelled'
                        ? <Text style={[styles.pill, { color: colors.danger }]}>{t('status.cancelled')}</Text>
                        : <Text style={[styles.pill, { color: paymentStatusColor(item) }]}>{t(paymentStatusKey(item))}</Text>}
                </View>
            </Card>
        </Pressable>
    );

    return (
        <View style={styles.context}>
            <View style={styles.chips}>
                {PERIODS.map((p) => <Chip key={p} label={t(`period.${p}`)} active={period === p} onPress={() => setPeriod(p)} />)}
            </View>
            <View style={styles.chips}>
                {METHODS.map((m) => <Chip key={m} label={m === 'all' ? t('method.all') : t(`method.${m}`)} active={method === m} onPress={() => setMethod(m)} />)}
            </View>
            {period === 'range' && (
                <View style={styles.rangeRow}>
                    <View style={{ flex: 1 }}><DateField label={t('history.from')} value={from} onChange={setFrom} maximumDate={new Date()} /></View>
                    <View style={{ flex: 1 }}><DateField label={t('history.to')} value={to} onChange={setTo} maximumDate={new Date()} error={rangeInvalid ? 'err.range' : undefined} /></View>
                </View>
            )}
            {error ? <Text style={styles.error}>{t(error)}</Text> : null}
            <FlatList
                data={items}
                keyExtractor={(i) => i.id}
                renderItem={renderItem}
                contentContainerStyle={{ paddingBottom: 24 }}
                onEndReachedThreshold={0.4}
                onEndReached={() => { if (!isLast && !loading && items.length) load(false); }}
                refreshing={loading && items.length === 0}
                onRefresh={() => { loadingRef.current = false; load(true); }}
                ListEmptyComponent={!loading && !rangeInvalid ? <Text style={styles.empty}>{t('history.empty')}</Text> : null}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    context: { flex: 1, backgroundColor: colors.bg, paddingHorizontal: 12, paddingTop: 10 },
    chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 8 },
    chip: { paddingHorizontal: 12, paddingVertical: 7, borderRadius: 18, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.card },
    chipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
    chipText: { color: colors.text, fontSize: 13 },
    chipTextActive: { color: '#fff' },
    rangeRow: { flexDirection: 'row', gap: 10 },
    item: { marginBottom: 10 },
    date: { color: colors.muted, fontSize: 12 },
    route: { color: colors.text, fontWeight: '600', marginVertical: 4 },
    rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    money: { color: colors.text, fontSize: 13 },
    pill: { fontWeight: '700', fontSize: 12 },
    empty: { textAlign: 'center', color: colors.muted, marginTop: 40 },
    error: { color: colors.danger, marginVertical: 8 },
});