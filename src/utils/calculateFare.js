import { PRICING } from '../config/pricing.js';

export function calculateFare({ distanceKm, durationMin, category, tip = 0 }, pricing = PRICING) {
    const multiplier = pricing.multipliers[category];
    if (multiplier === undefined) throw new Error(`Unknown category: ${category}`);
    if (!(distanceKm >= 0) || !(durationMin >= 0)) throw new Error('Invalid distance or duration');
    if (!Number.isInteger(tip) || tip < 0) throw new Error('Tip must be a whole number >= 0');

    const raw = (pricing.baseFare + distanceKm * pricing.perKm + durationMin * pricing.perMinute) * multiplier;
    const clean = Number(Math.max(pricing.minimumFare, raw).toFixed(6));
    const fare = Math.round(clean / pricing.roundTo) * pricing.roundTo;
    const commission = Math.round(fare * pricing.commissionRate);
    const driverEarnings = fare - commission + tip;
    return { fare, commission, driverEarnings };
}
