import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, beforeEach } from 'vitest';
import { CookieConsentProvider } from '../context/CookieConsentProvider';
import { CookiePreferencesModal } from './CookiePreferencesModal';
import { useCookieConsent } from '../hooks/useCookieConsent';
import { CONSENT_STORAGE_KEY } from '../types/cookieTypes';

const ModalOpener: React.FC = () => {
  const { openPreferencesModal } = useCookieConsent();
  return <button type="button" onClick={openPreferencesModal}>Open Modal</button>;
};

const renderModal = () => {
  return render(
    <CookieConsentProvider>
      <ModalOpener />
      <CookiePreferencesModal />
    </CookieConsentProvider>
  );
};

describe('CookiePreferencesModal', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('no se muestra inicialmente hasta que se solicita su apertura', () => {
    renderModal();
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('se abre correctamente y muestra las categorías con la técnica siempre activa', async () => {
    const user = userEvent.setup();
    renderModal();

    await user.click(screen.getByRole('button', { name: 'Open Modal' }));

    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText('Centro de Preferencias de Privacidad')).toBeInTheDocument();
    expect(screen.getByText('Cookies Técnicas y Estrictamente Necesarias')).toBeInTheDocument();
    expect(screen.getByText('Cookies de Rendimiento y Analítica')).toBeInTheDocument();
    expect(screen.getByText('Cookies de Publicidad y Personalización')).toBeInTheDocument();
    expect(screen.getByText('Siempre activas')).toBeInTheDocument();
  });

  it('permite alternar el interruptor de analíticas y guardar preferencias personalizadas', async () => {
    const user = userEvent.setup();
    renderModal();

    await user.click(screen.getByRole('button', { name: 'Open Modal' }));

    const analyticsSwitch = screen.getByRole('switch', {
      name: /activar o desactivar cookies de rendimiento y analítica/i,
    });
    expect(analyticsSwitch).toHaveAttribute('aria-checked', 'false');

    await user.click(analyticsSwitch);
    expect(analyticsSwitch).toHaveAttribute('aria-checked', 'true');

    await user.click(screen.getByRole('button', { name: 'Guardar preferencias' }));

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    const stored = JSON.parse(localStorage.getItem(CONSENT_STORAGE_KEY)!);
    expect(stored.necessary).toBe(true);
    expect(stored.analytics).toBe(true);
    expect(stored.marketing).toBe(false);
  });

  it('permite desplegar el acordeón con el detalle individual de cada cookie', async () => {
    const user = userEvent.setup();
    renderModal();

    await user.click(screen.getByRole('button', { name: 'Open Modal' }));

    const toggleButtons = screen.getAllByRole('button', { name: /ver detalle de cookies/i });
    await user.click(toggleButtons[0]);

    expect(screen.getByText('colivi_auth_token')).toBeInTheDocument();
    expect(screen.getByText('colivi_cookie_consent_v1')).toBeInTheDocument();
  });

  it('se cierra al hacer clic en el botón X de cerrar', async () => {
    const user = userEvent.setup();
    renderModal();

    await user.click(screen.getByRole('button', { name: 'Open Modal' }));
    expect(screen.getByRole('dialog')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Cerrar modal de preferencias' }));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('se cierra al pulsar la tecla Escape', async () => {
    const user = userEvent.setup();
    renderModal();

    await user.click(screen.getByRole('button', { name: 'Open Modal' }));
    expect(screen.getByRole('dialog')).toBeInTheDocument();

    await user.keyboard('{Escape}');
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });
});
