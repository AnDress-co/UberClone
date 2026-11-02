import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { validateDocuments, validatePersonal, validateVehicle } from '../utils/validators';
import { useAuth } from './AuthContext';
import { useLenguage } from './LenguageContext';

const RegistrationContext = createContext(null);

export function RegistrationProvider({ children }) {
  const { user } = useAuth();
  const { lang } = useLenguage();
  const [form, setForm] = useState({
    photo: '', fullName: '', documentId: '', phone: '', birthDate: '', gender: '', email: user?.email || '', language: lang,
    category: '', plate: '', brand: '', model: '', year: '', color: '', capacity: '', vehiclePhoto: '',
    licenseNumber: '', licensePhoto: '', licenseExpiry: '', soatPhoto: '', soatExpiry: '', techPhoto: '', techExpiry: '',
    mpEmail: '', acceptTerms: false,
  });
  const [touched, setTouched] = useState({});

  const setField = useCallback((name, value) => {
    setForm((prev) => ({ ...prev, [name]: value }));
    setTouched((prev) => (prev[name] ? prev : { ...prev, [name]: true }));
  }, []);
  const touch = useCallback((name) => setTouched((prev) => (prev[name] ? prev : { ...prev, [name]: true })), []);

  const sections = useMemo(
    () => ({ personal: validatePersonal(form), vehicle: validateVehicle(form), documents: validateDocuments(form) }),
    [form]
  );
  const isValid = Object.values(sections).every((s) => Object.keys(s).length === 0);

  const errorFor = useCallback(
    (section, name) => (touched[name] ? sections[section][name] : undefined),
    [touched, sections]
  );

  const value = useMemo(() => ({ form, setField, touch, sections, isValid, errorFor }), [form, setField, touch, sections, isValid, errorFor]);
  return <RegistrationContext.Provider value={value}>{children}</RegistrationContext.Provider>;
}

export const useRegistration = () => useContext(RegistrationContext);
