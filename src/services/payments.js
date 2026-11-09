import * as WebBrowser from 'expo-web-browser';
import { auth } from '../config/firebase';
import { ENV } from '../config/env';

export async function createCheckout({ tripId, amount }) {
  const idToken = await auth.currentUser.getIdToken();
  const res = await fetch(`${ENV.backendUrl}/payments/preference`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${idToken}` },
    body: JSON.stringify({ tripId, amount }),
  });
  if (!res.ok) throw new Error(`CHECKOUT_FAILED_${res.status}`);
  return res.json();
}

export const openCheckout = (url) => WebBrowser.openBrowserAsync(url);
