const PRICING = {
  baseFare: 3500,
  perKm: 1200,
  perMinute: 250,
  minimumFare: 6000,
  multipliers: { economy: 1, xl: 1.4, premium: 1.8 },
  commissionRate: 0.2,
  roundTo: 100,
};

function roundTo(value, unit) {
  return Math.round(value / unit) * unit;
}

function calculateFare({ category, distanceKm, durationMin }) {
  const multiplier = PRICING.multipliers[category];
  if (!multiplier) throw new Error(`Categoría no soportada: ${category}`);

  const distance = Number(distanceKm);
  const duration = Number(durationMin);
  if (!Number.isFinite(distance) || distance < 0 || !Number.isFinite(duration) || duration < 0) {
    throw new Error('distanceKm y durationMin deben ser números positivos.');
  }

  const rawFare = Math.max(
    PRICING.minimumFare,
    (PRICING.baseFare + distance * PRICING.perKm + duration * PRICING.perMinute) * multiplier
  );
  const fare = roundTo(rawFare, PRICING.roundTo);
  const commission = Math.round(fare * PRICING.commissionRate);

  return {
    fare,
    commission,
    driverEarnings: fare - commission,
    commissionRate: PRICING.commissionRate,
    currency: 'COP',
  };
}

module.exports = { PRICING, calculateFare };
