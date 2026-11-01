export const PRICING = {
  baseFare: 3500,
  perKm: 1200,
  perMinute: 250,
  minimumFare: 6000,
  multipliers: { economy: 1.0, xl: 1.4, premium: 1.8 },
  commissionRate: 0.2, 
  roundTo: 100, 

  requestTimeoutSeconds: 15,
  locationUpdateMs: 5000,
  historyPageSize: 20,
  techReviewAfterYears: 5,
};

export const CATEGORIES = ['economy', 'xl', 'premium'];
export const XL_MIN_CAPACITY = 6;
