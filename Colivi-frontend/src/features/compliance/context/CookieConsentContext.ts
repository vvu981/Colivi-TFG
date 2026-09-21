import { createContext } from 'react';
import type { CookieConsentPreferences } from '../types/cookieTypes';

export interface CookieConsentContextValue {
  preferences: CookieConsentPreferences | null;
  hasConsented: boolean;
  isBannerVisible: boolean;
  isPreferencesModalOpen: boolean;
  acceptAll: () => void;
  rejectNonEssential: () => void;
  savePreferences: (custom: { analytics: boolean; marketing: boolean }) => void;
  openPreferencesModal: () => void;
  closePreferencesModal: () => void;
  resetConsent: () => void;
}

export const CookieConsentContext = createContext<CookieConsentContextValue | undefined>(undefined);
