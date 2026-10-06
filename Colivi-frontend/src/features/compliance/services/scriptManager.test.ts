import { describe, it, expect, beforeEach, vi } from 'vitest';
import { scriptManager } from './scriptManager';
import type { CookieConsentPreferences } from '../types/cookieTypes';

describe('scriptManager', () => {
  beforeEach(() => {
    scriptManager.reset();
    document.head.innerHTML = '';
  });

  it('no ejecuta scripts antes de que se otorgue el consentimiento explícito (opt-in estricto)', () => {
    const analyticsFn = vi.fn();
    scriptManager.registerScript({
      id: 'analytics-script',
      category: 'analytics',
      execute: analyticsFn,
    });

    expect(analyticsFn).not.toHaveBeenCalled();
    expect(scriptManager.getExecutedScriptIds()).toEqual([]);
  });

  it('ejecuta callbacks de scripts cuando se otorga consentimiento para su categoría', () => {
    const analyticsFn = vi.fn();
    const marketingFn = vi.fn();

    scriptManager.registerScript({
      id: 'google-analytics',
      category: 'analytics',
      execute: analyticsFn,
    });

    scriptManager.registerScript({
      id: 'facebook-pixel',
      category: 'marketing',
      execute: marketingFn,
    });

    const prefs: CookieConsentPreferences = {
      necessary: true,
      analytics: true,
      marketing: false,
      timestamp: new Date().toISOString(),
      version: '1.0.0',
    };

    scriptManager.applyConsent(prefs);

    expect(analyticsFn).toHaveBeenCalledTimes(1);
    expect(marketingFn).not.toHaveBeenCalled();
    expect(scriptManager.getExecutedScriptIds()).toEqual(['google-analytics']);
  });

  it('inyecta elementos script en el DOM cuando se define src y se otorga consentimiento', () => {
    scriptManager.registerScript({
      id: 'matomo-src',
      category: 'analytics',
      src: 'https://cdn.example.com/matomo.js',
      async: true,
    });

    const prefs: CookieConsentPreferences = {
      necessary: true,
      analytics: true,
      marketing: false,
      timestamp: new Date().toISOString(),
      version: '1.0.0',
    };

    scriptManager.applyConsent(prefs);

    const script = document.querySelector('script[data-consent-id="matomo-src"]') as HTMLScriptElement | null;
    expect(script).not.toBeNull();
    expect(script?.src).toBe('https://cdn.example.com/matomo.js');
    expect(script?.async).toBe(true);
  });

  it('ejecuta la función de cleanup y elimina scripts del DOM cuando se revoca una categoría', () => {
    const cleanupFn = vi.fn();

    scriptManager.registerScript({
      id: 'marketing-tracker',
      category: 'marketing',
      src: 'https://cdn.example.com/mkt.js',
      cleanup: cleanupFn,
    });

    // Otorgar consentimiento inicial
    scriptManager.applyConsent({
      necessary: true,
      analytics: true,
      marketing: true,
      timestamp: new Date().toISOString(),
      version: '1.0.0',
    });

    expect(document.querySelector('script[data-consent-id="marketing-tracker"]')).not.toBeNull();

    // Revocar consentimiento de marketing
    scriptManager.applyConsent({
      necessary: true,
      analytics: true,
      marketing: false,
      timestamp: new Date().toISOString(),
      version: '1.0.0',
    });

    expect(cleanupFn).toHaveBeenCalledTimes(1);
    expect(document.querySelector('script[data-consent-id="marketing-tracker"]')).toBeNull();
    expect(scriptManager.getExecutedScriptIds()).not.toContain('marketing-tracker');
  });

  it('permite desregistrar scripts y reiniciar el estado con reset()', () => {
    const fn = vi.fn();
    scriptManager.registerScript({
      id: 'temp-script',
      category: 'analytics',
      execute: fn,
    });

    scriptManager.unregisterScript('temp-script');

    scriptManager.applyConsent({
      necessary: true,
      analytics: true,
      marketing: true,
      timestamp: new Date().toISOString(),
      version: '1.0.0',
    });

    expect(fn).not.toHaveBeenCalled();
  });
});
