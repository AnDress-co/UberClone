import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { translations } from '../i18n/translations';

const LanguageContext = createContext(null);
const STORAGE_KEY = 'pref:language';

export function LanguageProvider({ children }) {
  const [lang, setLangState] = useState('es');

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then((v) => v && translations[v] && setLangState(v)).catch(() => {});
  }, []);

  const setLang = useCallback((next) => {
    setLangState(next);
    AsyncStorage.setItem(STORAGE_KEY, next).catch(() => {});
  }, []);

  const t = useCallback(
    (key, vars) => {
      let text = translations[lang]?.[key] ?? translations.es[key] ?? key;
      if (vars) Object.keys(vars).forEach((k) => { text = text.replace(`{${k}}`, vars[k]); });
      return text;
    },
    [lang]
  );

  const value = useMemo(() => ({ lang, setLang, t }), [lang, setLang, t]);
  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export const useLanguage = () => useContext(LanguageContext);
