import * as WebBrowser from 'expo-web-browser';
import { Linking } from 'react-native';
import { auth } from '../config/firebase';
import { ENV } from '../config/env';

export async function createCheckout({ tripId, amount }) {
  console.log('PAYMENTS URL:', process.env.EXPO_PUBLIC_PAYMENTS_API_URL);
  if (!auth.currentUser) throw new Error('PAYMENT_AUTH_REQUIRED');
  const idToken = await auth.currentUser.getIdToken();
  if (!ENV.paymentsApiUrl) throw new Error('PAYMENTS_API_URL_NOT_CONFIGURED');
  const res = await fetch(`${ENV.paymentsApiUrl.replace(/\/$/, '')}/payments/preference`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${idToken}` },
    body: JSON.stringify({ tripId, amount }),
  });
  if (!res.ok) {
    let detail = '';
    try {
      const body = await res.json();
      detail = body.error || body.message || '';
    } catch {
      detail = await res.text().catch(() => '');
    }
    throw new Error(`CHECKOUT_FAILED_${res.status}${detail ? `_${detail}` : ''}`);
  }
  return res.json();
}

export async function openCheckout(url) {
  let subscription;
  const returnPrefix = ENV.paymentReturnUrl;
  const onUrl = ({ url: callbackUrl }) => {
    if (callbackUrl.startsWith(returnPrefix)) {
      WebBrowser.dismissBrowser().catch(() => {});
    }
  };

  subscription = Linking.addEventListener('url', onUrl);
  try {
    return await WebBrowser.openBrowserAsync(url);
  } finally {
    subscription?.remove();
  }
}
