import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { useAuth } from './AuthContext';
import { findActiveTripId, subscribeTrip } from '../services/trips';

const TripContext = createContext(null);

export function TripProvider({ children }) {
  const { user, driver } = useAuth();
  const approved = driver?.approvalStatus === 'approved';
  const [incomingTripId, setIncomingTripId] = useState(null);
  const [activeTripId, setActiveTripId] = useState(null);
  const [activeTrip, setActiveTrip] = useState(null);
  const dismissed = useRef(new Set());
  
  useEffect(() => {
    if (!user || !approved) { setActiveTripId(null); return undefined; }
    let cancelled = false;
    findActiveTripId(user.uid).then((id) => { if (!cancelled && id) setActiveTripId(id); }).catch(() => {});
    return () => { cancelled = true; };
  }, [user, approved]);

  useEffect(() => {
    if (!activeTripId) { setActiveTrip(null); return undefined; }
    return subscribeTrip(activeTripId, setActiveTrip);
  }, [activeTripId]);

  useEffect(() => {
    if (activeTrip && ['cancelled', 'rejected'].includes(activeTrip.status)) setActiveTripId(null);
  }, [activeTrip]);

  const clearIncoming = useCallback((tripId) => {
    if (tripId) dismissed.current.add(tripId);
    setIncomingTripId(null);
  }, []);
  const isDismissed = useCallback((id) => dismissed.current.has(id), []);
  const finishTripFlow = useCallback(() => { setActiveTripId(null); setIncomingTripId(null); }, []);

  const value = useMemo(
    () => ({ incomingTripId, setIncomingTripId, clearIncoming, isDismissed, activeTripId, setActiveTripId, activeTrip, finishTripFlow }),
    [incomingTripId, clearIncoming, isDismissed, activeTripId, activeTrip, finishTripFlow]
  );
  return <TripContext.Provider value={value}>{children}</TripContext.Provider>;
}

export const useTrip = () => useContext(TripContext);
