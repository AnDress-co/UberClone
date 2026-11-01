import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import {
  createUserWithEmailAndPassword, onAuthStateChanged, signInWithEmailAndPassword, signOut as fbSignOut,
} from 'firebase/auth';
import { doc, onSnapshot } from 'firebase/firestore';
import { auth, db } from '../config/firebase';
import { saveFcmToken, setAvailability } from '../services/drivers';
import { registerForPushToken } from '../services/notifications';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [driver, setDriver] = useState(null);
  const [authReady, setAuthReady] = useState(false);
  const [driverReady, setDriverReady] = useState(false);

  useEffect(() => onAuthStateChanged(auth, (u) => {
    setUser(u);
    setDriver(null);
    setDriverReady(!u);
    setAuthReady(true);
  }), []);

  useEffect(() => {
    if (!user) return undefined;
    const unsub = onSnapshot(
      doc(db, 'drivers', user.uid),
      (snap) => { setDriver(snap.exists() ? { id: snap.id, ...snap.data() } : null); setDriverReady(true); },
      () => setDriverReady(true)
    );
    return unsub; 
  }, [user]);

  useEffect(() => {
    if (user && driver?.approvalStatus === 'approved') {
      registerForPushToken().then((token) => token && token !== driver.fcmToken && saveFcmToken(user.uid, token)).catch(() => {});
    }
  }, [user, driver?.approvalStatus]);

  const signIn = useCallback((email, password) => signInWithEmailAndPassword(auth, email.trim(), password), []);
  const signUp = useCallback((email, password) => createUserWithEmailAndPassword(auth, email.trim(), password), []);
  const signOut = useCallback(async () => {
    try { if (user && driver?.available) await setAvailability(user.uid, false); } catch {}
    await fbSignOut(auth);
  }, [user, driver?.available]);

  const value = useMemo(
    () => ({ user, driver, loading: !authReady || !driverReady, signIn, signUp, signOut }),
    [user, driver, authReady, driverReady, signIn, signUp, signOut]
  );
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);
