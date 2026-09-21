export type CookieCategory = 'necessary' | 'analytics' | 'marketing';

export interface CookieConsentPreferences {
  necessary: boolean;
  analytics: boolean;
  marketing: boolean;
  timestamp: string;
  version: string;
}

export interface CookieItemDetail {
  name: string;
  provider: string;
  purpose: string;
  duration: string;
}

export interface CookieCategoryDefinition {
  id: CookieCategory;
  name: string;
  description: string;
  required: boolean;
  cookies: CookieItemDetail[];
}

export interface ScriptConfig {
  id: string;
  category: 'analytics' | 'marketing';
  src?: string;
  async?: boolean;
  defer?: boolean;
  execute?: () => void;
  cleanup?: () => void;
}

export const CURRENT_CONSENT_VERSION = '1.0.0';
export const CONSENT_STORAGE_KEY = 'colivi_cookie_consent_v1';
