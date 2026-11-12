import { toDate } from './dates.js';

const isPaid = (t) => t.status === 'paid';

export function summarizeTrips(trips) {
  const paid = trips.filter(isPaid);
  const sum = (key) => paid.reduce((acc, t) => acc + (t[key] || 0), 0);
  const count = paid.length;
  const net = sum('driverEarnings');
  return {
    count,
    billed: sum('fare'),
    commissions: sum('commission'),
    tips: sum('tip'),
    net,
    average: count ? Math.round(net / count) : 0,
  };
}

export function tripsSince(trips, start) {
  return trips.filter((t) => {
    const d = toDate(t.completedAt || t.createdAt);
    return d && d >= start;
  });
}

export function computeBalance(trips) {
  return trips.filter(isPaid).reduce(
    (acc, t) => acc + (t.paymentMethod === 'cash' ? -(t.commission || 0) : t.driverEarnings || 0),
    0
  );
}