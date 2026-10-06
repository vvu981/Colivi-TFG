import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import { describe, it, expect, beforeEach } from 'vitest';
import { CookieConsentProvider } from '../context/CookieConsentProvider';
import { CookieBanner } from './CookieBanner';
import { CookiePreferencesModal } from './CookiePreferencesModal';
import { CONSENT_STORAGE_KEY } from '../types/cookieTypes';

const renderBannerWithProvider = () => {
  return render(
    <CookieConsentProvider>
      <BrowserRouter>
        <CookieBanner />
        <CookiePreferencesModal />
      </BrowserRouter>
    </CookieConsentProvider>
  );
};

describe('CookieBanner', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('se renderiza cuando no existe consentimiento previo', () => {
    renderBannerWithProvider();

    expect(screen.getByRole('region', { name: 'Aviso de cookies' })).toBeInTheDocument();
    expect(screen.getByText('Tu privacidad es prioritaria en Colivi')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Aceptar todas' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Rechazar no esenciales' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /personalizar/i })).toBeInTheDocument();
  });

  it('no se renderiza si el usuario ya ha emitido consentimiento previo', () => {
    localStorage.setItem(
      CONSENT_STORAGE_KEY,
      JSON.stringify({
        necessary: true,
        analytics: false,
        marketing: false,
        timestamp: new Date().toISOString(),
        version: '1.0.0',
      })
    );

    renderBannerWithProvider();

    expect(screen.queryByRole('region', { name: 'Aviso de cookies' })).not.toBeInTheDocument();
  });

  it('al pulsar "Aceptar todas" oculta el banner y persiste el consentimiento', async () => {
    const user = userEvent.setup();
    renderBannerWithProvider();

    await user.click(screen.getByRole('button', { name: 'Aceptar todas' }));

    expect(screen.queryByRole('region', { name: 'Aviso de cookies' })).not.toBeInTheDocument();
    const stored = JSON.parse(localStorage.getItem(CONSENT_STORAGE_KEY)!);
    expect(stored.necessary).toBe(true);
    expect(stored.analytics).toBe(true);
    expect(stored.marketing).toBe(true);
  });

  it('al pulsar "Rechazar no esenciales" oculta el banner manteniendo solo necesarias', async () => {
    const user = userEvent.setup();
    renderBannerWithProvider();

    await user.click(screen.getByRole('button', { name: 'Rechazar no esenciales' }));

    expect(screen.queryByRole('region', { name: 'Aviso de cookies' })).not.toBeInTheDocument();
    const stored = JSON.parse(localStorage.getItem(CONSENT_STORAGE_KEY)!);
    expect(stored.necessary).toBe(true);
    expect(stored.analytics).toBe(false);
    expect(stored.marketing).toBe(false);
  });

  it('al pulsar "Personalizar" abre el modal de preferencias', async () => {
    const user = userEvent.setup();
    renderBannerWithProvider();

    await user.click(screen.getByRole('button', { name: /personalizar/i }));

    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText('Centro de Preferencias de Privacidad')).toBeInTheDocument();
  });
});
