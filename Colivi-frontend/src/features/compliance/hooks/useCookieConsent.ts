import { useContext } from 'react';
import { CookieConsentContext, type CookieConsentContextValue } from '../context/CookieConsentContext';

const defaultCookieConsentValue: CookieConsentContextValue = {
  preferences: null,
  hasConsented: false,
  isBannerVisible: false,
  isPreferencesModalOpen: false,
  acceptAll: () => {},
  rejectNonEssential: () => {},
  savePreferences: () => {},
  openPreferencesModal: () => {},
  closePreferencesModal: () => {},
  resetConsent: () => {},
};

export const useCookieConsent = (): CookieConsentContextValue => {
  const context = useContext(CookieConsentContext);
  return context ?? defaultCookieConsentValue;
};
