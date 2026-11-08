import { useEffect, useState } from 'react';
import * as Location from 'expo-location';
import { PRICING } from '../config/pricing';
import { useAuth } from '../context/AuthContext';
import { updateDriverLocation } from '../services/drivers';

export function useDriverLocation({ track }) {
  const { user } = useAuth();
  const uid = user?.uid;
  const [location, setLocation] = useState(null);
  const [permission, setPermission] = useState(null);

  useEffect(() => {
    if (!uid) return undefined;
    let cancelled = false;
    let subscription = null;
    let lastSent = 0;

    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (cancelled) return;
      setPermission(status);
      if (status !== 'granted') return;

      if (!track) {
        const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced }).catch(() => null);
        if (pos && !cancelled) setLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude, heading: pos.coords.heading });
        return;
      }

      subscription = await Location.watchPositionAsync(
        { accuracy: Location.Accuracy.High, timeInterval: PRICING.locationUpdateMs, distanceInterval: 10 },
        (pos) => {
          const c = { lat: pos.coords.latitude, lng: pos.coords.longitude, heading: pos.coords.heading };
          setLocation(c);
          const now = Date.now();
          if (now - lastSent >= PRICING.locationUpdateMs) {
            lastSent = now;
            updateDriverLocation(uid, c).catch(() => {});
          }
        }
      );
      if (cancelled) subscription.remove();
    })();

    return () => {
      cancelled = true;
      if (subscription) subscription.remove();
    };
  }, [uid, track]);

  return { location, permission };
}