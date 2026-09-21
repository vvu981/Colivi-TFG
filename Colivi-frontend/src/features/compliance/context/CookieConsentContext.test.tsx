import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { CookieConsentProvider } from './CookieConsentProvider';
import { useCookieConsent } from '../hooks/useCookieConsent';
import { CONSENT_STORAGE_KEY } from '../types/cookieTypes';

const TestConsumer: React.FC = () => {
  const {
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
  } = useCookieConsent();

  return (
    <div>
      <div data-testid="has-consented">{String(hasConsented)}</div>
      <div data-testid="banner-visible">{String(isBannerVisible)}</div>
      <div data-testid="modal-open">{String(isPreferencesModalOpen)}</div>
      <div data-testid="analytics-pref">{String(preferences?.analytics ?? 'none')}</div>
      <div data-testid="marketing-pref">{String(preferences?.marketing ?? 'none')}</div>

      <button type="button" onClick={acceptAll}>Accept All</button>
      <button type="button" onClick={rejectNonEssential}>Reject Non Essential</button>
      <button type="button" onClick={() => savePreferences({ analytics: true, marketing: false })}>
        Save Custom
      </button>
      <button type="button" onClick={openPreferencesModal}>Open Modal</button>
      <button type="button" onClick={closePreferencesModal}>Close Modal</button>
      <button type="button" onClick={resetConsent}>Reset Consent</button>
    </div>
  );
};

describe('CookieConsentContext & Provider', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  it('inicia sin consentimiento y con banner visible cuando el localStorage está vacío', () => {
    render(
      <CookieConsentProvider>
        <TestConsumer />
      </CookieConsentProvider>
    );

    expect(screen.getByTestId('has-consented').textContent).toBe('false');
    expect(screen.getByTestId('banner-visible').textContent).toBe('true');
    expect(screen.getByTestId('modal-open').textContent).toBe('false');
    expect(screen.getByTestId('analytics-pref').textContent).toBe('none');
  });

  it('restaura preferencias previas válidas desde localStorage al montar', () => {
    const stored = {
      necessary: true,
      analytics: true,
      marketing: false,
      timestamp: new Date().toISOString(),
      version: '1.0.0',
    };
    localStorage.setItem(CONSENT_STORAGE_KEY, JSON.stringify(stored));

    render(
      <CookieConsentProvider>
        <TestConsumer />
      </CookieConsentProvider>
    );

    expect(screen.getByTestId('has-consented').textContent).toBe('true');
    expect(screen.getByTestId('banner-visible').textContent).toBe('false');
    expect(screen.getByTestId('analytics-pref').textContent).toBe('true');
    expect(screen.getByTestId('marketing-pref').textContent).toBe('false');
  });

  it('acceptAll guarda en localStorage, actualiza el estado y oculta el banner', async () => {
    const user = userEvent.setup();

    render(
      <CookieConsentProvider>
        <TestConsumer />
      </CookieConsentProvider>
    );

    await user.click(screen.getByRole('button', { name: 'Accept All' }));

    expect(screen.getByTestId('has-consented').textContent).toBe('true');
    expect(screen.getByTestId('banner-visible').textContent).toBe('false');
    expect(screen.getByTestId('analytics-pref').textContent).toBe('true');
    expect(screen.getByTestId('marketing-pref').textContent).toBe('true');

    const storedRaw = localStorage.getItem(CONSENT_STORAGE_KEY);
    expect(storedRaw).not.toBeNull();
    const parsed = JSON.parse(storedRaw!);
    expect(parsed.necessary).toBe(true);
    expect(parsed.analytics).toBe(true);
    expect(parsed.marketing).toBe(true);
    expect(parsed.timestamp).toBeDefined();
  });

  it('rejectNonEssential solo deja activas las cookies técnicas necesarias', async () => {
    const user = userEvent.setup();

    render(
      <CookieConsentProvider>
        <TestConsumer />
      </CookieConsentProvider>
    );

    await user.click(screen.getByRole('button', { name: 'Reject Non Essential' }));

    expect(screen.getByTestId('has-consented').textContent).toBe('true');
    expect(screen.getByTestId('analytics-pref').textContent).toBe('false');
    expect(screen.getByTestId('marketing-pref').textContent).toBe('false');

    const parsed = JSON.parse(localStorage.getItem(CONSENT_STORAGE_KEY)!);
    expect(parsed.necessary).toBe(true);
    expect(parsed.analytics).toBe(false);
    expect(parsed.marketing).toBe(false);
  });

  it('savePreferences guarda preferencias granulares personalizadas', async () => {
    const user = userEvent.setup();

    render(
      <CookieConsentProvider>
        <TestConsumer />
      </CookieConsentProvider>
    );

    await user.click(screen.getByRole('button', { name: 'Save Custom' }));

    expect(screen.getByTestId('analytics-pref').textContent).toBe('true');
    expect(screen.getByTestId('marketing-pref').textContent).toBe('false');
  });

  it('gestiona la apertura y cierre del modal de preferencias', async () => {
    const user = userEvent.setup();

    render(
      <CookieConsentProvider>
        <TestConsumer />
      </CookieConsentProvider>
    );

    await user.click(screen.getByRole('button', { name: 'Open Modal' }));
    expect(screen.getByTestId('modal-open').textContent).toBe('true');

    await user.click(screen.getByRole('button', { name: 'Close Modal' }));
    expect(screen.getByTestId('modal-open').textContent).toBe('false');
  });

  it('resetConsent elimina del localStorage y reinicia el estado', async () => {
    const user = userEvent.setup();

    render(
      <CookieConsentProvider>
        <TestConsumer />
      </CookieConsentProvider>
    );

    await user.click(screen.getByRole('button', { name: 'Accept All' }));
    expect(screen.getByTestId('has-consented').textContent).toBe('true');

    await user.click(screen.getByRole('button', { name: 'Reset Consent' }));
    expect(screen.getByTestId('has-consented').textContent).toBe('false');
    expect(localStorage.getItem(CONSENT_STORAGE_KEY)).toBeNull();
  });
});
