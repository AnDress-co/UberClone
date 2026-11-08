import { useEffect, useState } from 'react';
import { subscribeRequests } from '../services/trips';

export function useTripRequests({ enabled, category, uid }) {
  const [requests, setRequests] = useState([]);

  useEffect(() => {
    if (!enabled || !category || !uid) { setRequests([]); return undefined; }
    return subscribeRequests({ category, uid }, setRequests);
  }, [enabled, category, uid]);

  return requests;
}