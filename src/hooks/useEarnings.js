import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { subscribePaidTrips } from '../services/trips';
import { computeBalance, summarizeTrips, tripsSince } from '../utils/earnings';
import { periodStart } from '../utils/dates';

export function useEarnings() {
  const { user } = useAuth();
  const [trips, setTrips] = useState(null);

  useEffect(() => {
    if (!user) return undefined;
    return subscribePaidTrips(user.uid, setTrips);
  }, [user]);

  const summaries = useMemo(() => {
    const list = trips || [];
    const now = new Date();
    return {
      day: summarizeTrips(tripsSince(list, periodStart('day', now))),
      week: summarizeTrips(tripsSince(list, periodStart('week', now))),
      month: summarizeTrips(tripsSince(list, periodStart('month', now))),
    };
  }, [trips]);

  const balance = useMemo(() => computeBalance(trips || []), [trips]);
  return { loading: trips === null, summaries, balance };
}