const { FieldValue, db } = require('../firebaseAdmin');
const { calculateFare } = require('./pricing');

const trips = db.collection('trips');

function cleanString(value, field) {
  if (typeof value !== 'string' || !value.trim()) {
    throw new Error(`${field} es obligatorio.`);
  }
  return value.trim();
}

function buildPoint(value, fallbackAddress, fallbackLat, fallbackLng, field) {
  const point = value && typeof value === 'object' ? value : {};
  const address = cleanString(point.address || fallbackAddress, `${field}.address`);
  const lat = Number(point.lat ?? fallbackLat);
  const lng = Number(point.lng ?? fallbackLng);

  if (!Number.isFinite(lat) || lat < -90 || lat > 90) {
    throw new Error(`${field}.lat debe ser una coordenada válida.`);
  }
  if (!Number.isFinite(lng) || lng < -180 || lng > 180) {
    throw new Error(`${field}.lng debe ser una coordenada válida.`);
  }

  return { address, lat, lng };
}

function buildTrip(input = {}) {
  const category = cleanString(input.category || 'economy', 'category').toLowerCase();
  const pickup = cleanString(input.pickup || input.origin?.address || 'Punto de recogida', 'pickup');
  const destinationAddress = typeof input.destination === 'string'
    ? input.destination
    : input.destination?.address || input.destinationAddress || 'Destino del viaje';
  const destination = cleanString(
    destinationAddress,
    'destination'
  );
  const distanceKm = Number(input.distanceKm ?? 8.5);
  const durationMin = Number(input.durationMin ?? 22);
  const fare = calculateFare({ category, distanceKm, durationMin });
  const origin = buildPoint(input.origin, pickup, 6.2442, -75.5812, 'origin');
  const destinationPoint = buildPoint(
    typeof input.destination === 'object'
      ? input.destination
      : input.destinationLocation || input.destinationPoint,
    destination,
    6.2088,
    -75.5673,
    'destination'
  );

  const paymentMethod = input.paymentMethod || 'cash';
  if (!['cash', 'mercadopago'].includes(paymentMethod)) {
    throw new Error('paymentMethod debe ser cash o mercadopago.');
  }

  const trip = {
    passengerId: input.passengerId || `sim-passenger-${Date.now()}`,
    passengerName: input.passengerName || 'Pasajero de prueba',
    category,
    pickup,
    destination,
    origin,
    destination: destinationPoint,
    distanceKm,
    durationMin,
    fare: fare.fare,
    estimatedFare: fare.fare,
    commission: fare.commission,
    driverEarnings: fare.driverEarnings,
    commissionRate: fare.commissionRate,
    currency: fare.currency,
    paymentMethod,
    paymentStatus: 'pending',
    status: 'requested',
    rejectedBy: [],
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
  };

  return trip;
}

async function createTrip(input) {
  const trip = buildTrip(input);
  const ref = await trips.add(trip);
  return { id: ref.id, ...trip };
}

async function getTrip(tripId) {
  const snap = await trips.doc(tripId).get();
  return snap.exists ? { id: snap.id, ...snap.data() } : null;
}

module.exports = { createTrip, getTrip, trips };
