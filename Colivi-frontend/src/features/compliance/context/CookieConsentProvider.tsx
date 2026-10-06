import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  CONSENT_STORAGE_KEY,
  CURRENT_CONSENT_VERSION,
  type CookieConsentPreferences,
} from '../types/cookieTypes';
import { scriptManager } from '../services/scriptManager';
import { CookieConsentContext, type CookieConsentContextValue } from './CookieConsentContext';

const loadStoredConsent = (): CookieConsentPreferences | null => {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(CONSENT_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as CookieConsentPreferences;
    if (parsed && parsed.version === CURRENT_CONSENT_VERSION && typeof parsed.necessary === 'boolean') {
      return parsed;
    }
  } catch (error) {
    console.error('[CookieConsentContext] Failed to parse stored consent:', error);
  }
  return null;
};

export const CookieConsentProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [preferences, setPreferences] = useState<CookieConsentPreferences | null>(() => loadStoredConsent());
  const [isPreferencesModalOpen, setIsPreferencesModalOpen] = useState<boolean>(false);

  const persistAndApply = useCallback((newPreferences: CookieConsentPreferences) => {
    try {
      localStorage.setItem(CONSENT_STORAGE_KEY, JSON.stringify(newPreferences));
    } catch (error) {
      console.error('[CookieConsentContext] Failed to store consent preferences:', error);
    }
    setPreferences(newPreferences);
    scriptManager.applyConsent(newPreferences);
  }, []);

  useEffect(() => {
    if (preferences) {
      scriptManager.applyConsent(preferences);
    }

    const handleStorageChange = (event: StorageEvent) => {
      if (event.key === CONSENT_STORAGE_KEY) {
        const updated = loadStoredConsent();
        setPreferences(updated);
        if (updated) {
          scriptManager.applyConsent(updated);
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [preferences]);

  const acceptAll = useCallback(() => {
    const prefs: CookieConsentPreferences = {
      necessary: true,
      analytics: true,
      marketing: true,
      timestamp: new Date().toISOString(),
      version: CURRENT_CONSENT_VERSION,
    };
    persistAndApply(prefs);
    setIsPreferencesModalOpen(false);
  }, [persistAndApply]);

  const rejectNonEssential = useCallback(() => {
    const prefs: CookieConsentPreferences = {
      necessary: true,
      analytics: false,
      marketing: false,
      timestamp: new Date().toISOString(),
      version: CURRENT_CONSENT_VERSION,
    };
    persistAndApply(prefs);
    setIsPreferencesModalOpen(false);
  }, [persistAndApply]);

  const savePreferences = useCallback(
    (custom: { analytics: boolean; marketing: boolean }) => {
      const prefs: CookieConsentPreferences = {
        necessary: true,
        analytics: Boolean(custom.analytics),
        marketing: Boolean(custom.marketing),
        timestamp: new Date().toISOString(),
        version: CURRENT_CONSENT_VERSION,
      };
      persistAndApply(prefs);
      setIsPreferencesModalOpen(false);
    },
    [persistAndApply]
  );

  const openPreferencesModal = useCallback(() => {
    setIsPreferencesModalOpen(true);
  }, []);

  const closePreferencesModal = useCallback(() => {
    setIsPreferencesModalOpen(false);
  }, []);

  const resetConsent = useCallback(() => {
    try {
      localStorage.removeItem(CONSENT_STORAGE_KEY);
    } catch (error) {
      console.error('[CookieConsentContext] Failed to remove consent:', error);
    }
    setPreferences(null);
    scriptManager.reset();
  }, []);

  const hasConsented = preferences !== null;
  const isBannerVisible = !hasConsented && !isPreferencesModalOpen;

  const value = useMemo<CookieConsentContextValue>(
    () => ({
      preferences,
      hasConsented,
      isBannerVisible,
      isPreferencesModalOpen,
      acceptAll,
      rejectNonEssential,
      savePreferences,
      openPreferencesModal,
      closePreferencesModal,
      resetConsent,
    }),
    [
      preferences,
      hasConsented,
      isBannerVisible,
      isPreferencesModalOpen,
      acceptAll,
      rejectNonEssential,
      savePreferences,
      openPreferencesModal,
      closePreferencesModal,
      resetConsent,
    ]
  );

  return <CookieConsentContext.Provider value={value}>{children}</CookieConsentContext.Provider>;
};
