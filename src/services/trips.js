import {
  arrayUnion, collection, doc, getDoc, getDocs, limit, onSnapshot, orderBy, query,
  runTransaction, serverTimestamp, startAfter, updateDoc, where,
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { PRICING } from '../config/pricing';

const tripsCol = () => collection(db, 'trips');
const withId = (snap) => ({ id: snap.id, ...snap.data() });

export const ACTIVE_STATUSES = ['accepted', 'driver_arriving', 'in_progress', 'completed'];
export const HISTORY_STATUSES = ['completed', 'paid', 'cancelled'];

export function subscribeRequests({ category, uid }, onData) {
  const q = query(tripsCol(), where('status', '==', 'requested'), where('category', '==', category));
  return onSnapshot(
    q,
    (snap) => {
      const list = snap.docs
        .map(withId)
        .filter((t) => !(t.rejectedBy || []).includes(uid))
        .sort((a, b) => (a.createdAt?.toMillis?.() ?? 0) - (b.createdAt?.toMillis?.() ?? 0));
      onData(list);
    },
    () => onData([])
  );
}

export function subscribeTrip(tripId, onData) {
  return onSnapshot(
    doc(db, 'trips', tripId),
    (snap) => onData(snap.exists() ? withId(snap) : null),
    () => onData(null)
  );
}

export async function getTrip(tripId) {
  const snap = await getDoc(doc(db, 'trips', tripId));
  return snap.exists() ? withId(snap) : null;
}

export async function acceptTrip(tripId, uid, { metrics, driverInfo }) {
  const ref = doc(db, 'trips', tripId);
  await runTransaction(db, async (tx) => {
    const snap = await tx.get(ref);
    if (!snap.exists() || snap.data().status !== 'requested') throw new Error('TRIP_TAKEN');
    tx.update(ref, {
      status: 'accepted',
      driverId: uid,
      driverInfo,
      acceptedAt: serverTimestamp(),
      ...(metrics ? { distanceKm: metrics.distanceKm, durationMin: metrics.durationMin } : {}),
    });
  });
}

export const rejectTrip = (tripId, uid) => updateDoc(doc(db, 'trips', tripId), { rejectedBy: arrayUnion(uid) });

export const setTripStatus = (tripId, status, extra = {}) => updateDoc(doc(db, 'trips', tripId), { status, ...extra });

export const completeTrip = (tripId, data) =>
  updateDoc(doc(db, 'trips', tripId), { ...data, status: 'completed', completedAt: serverTimestamp() });

export const markCashPaid = (tripId) =>
  updateDoc(doc(db, 'trips', tripId), { status: 'paid', paymentStatus: 'cash', paidAt: serverTimestamp() });

export async function findActiveTripId(uid) {
  const q = query(tripsCol(), where('driverId', '==', uid), where('status', 'in', ACTIVE_STATUSES), limit(1));
  const snap = await getDocs(q);
  return snap.empty ? null : snap.docs[0].id;
}

export async function fetchHistoryPage({ uid, since, until, method, cursor }) {
  const parts = [where('driverId', '==', uid), where('createdAt', '>=', since), where('createdAt', '<=', until)];
  if (method && method !== 'all') parts.push(where('paymentMethod', '==', method));
  parts.push(orderBy('createdAt', 'desc'));
  if (cursor) parts.push(startAfter(cursor));
  parts.push(limit(PRICING.historyPageSize));
  const snap = await getDocs(query(tripsCol(), ...parts));
  return {
    trips: snap.docs.map(withId).filter((t) => HISTORY_STATUSES.includes(t.status)),
    cursor: snap.docs.length ? snap.docs[snap.docs.length - 1] : null,
    isLast: snap.docs.length < PRICING.historyPageSize,
  };
}

export function subscribePaidTrips(uid, onData) {
  const q = query(tripsCol(), where('driverId', '==', uid), where('status', '==', 'paid'));
  return onSnapshot(q, (snap) => onData(snap.docs.map(withId)), () => onData([]));
}