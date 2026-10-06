import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import { describe, it, expect, vi } from 'vitest';
import { TermsPage } from './TermsPage';
import { PrivacyPage } from './PrivacyPage';
import { CookiesPage } from './CookiesPage';
import { CookieConsentProvider } from '../features/compliance';

vi.mock('../features/auth/context/AuthContext', () => ({
  useAuth: () => ({
    isAuthenticated: false,
    isLoading: false,
    user: null,
    logout: vi.fn(),
  }),
}));

describe('Legal Pages', () => {
  describe('TermsPage', () => {
    it('renderiza correctamente los términos, limitación de responsabilidad y uso aceptable', () => {
      render(
        <CookieConsentProvider>
          <BrowserRouter>
            <TermsPage />
          </BrowserRouter>
        </CookieConsentProvider>
      );

      expect(screen.getByText('Términos y Condiciones de Uso')).toBeInTheDocument();
      expect(screen.getAllByText(/1\. Objeto y Naturaleza del Servicio/i).length).toBeGreaterThan(0);
      expect(screen.getAllByText(/3\. Limitación y Exoneración de Responsabilidad/i).length).toBeGreaterThan(0);
      expect(screen.getAllByText(/4\. Uso Aceptable y Normas de la Comunidad/i).length).toBeGreaterThan(0);
      expect(screen.getAllByText(/5\. Propiedad Intelectual y Licencia sobre Contenidos/i).length).toBeGreaterThan(0);
      expect(screen.getAllByText(/6\. Suspensión, Bloqueo y Rescisión de Cuenta/i).length).toBeGreaterThan(0);
      expect(screen.getAllByText(/8\. Legislación Aplicable y Fuero Competente/i).length).toBeGreaterThan(0);
    });
  });

  describe('PrivacyPage', () => {
    it('renderiza el responsable del tratamiento, bases legales RGPD y derechos ARCO', () => {
      render(
        <CookieConsentProvider>
          <BrowserRouter>
            <PrivacyPage />
          </BrowserRouter>
        </CookieConsentProvider>
      );

      expect(screen.getByText('Política de Privacidad')).toBeInTheDocument();
      expect(screen.getAllByText(/1\. Responsable del Tratamiento y Delegado de Protección de Datos/i).length).toBeGreaterThan(0);
      expect(screen.getAllByText(/2\. Bases Legales del Tratamiento/i).length).toBeGreaterThan(0);
      expect(screen.getAllByText(/3\. Categorías de Datos Recogidos/i).length).toBeGreaterThan(0);
      expect(screen.getAllByText(/6\. Ejercicio de Derechos/i).length).toBeGreaterThan(0);
      expect(screen.getAllByText(/8\. Disposiciones Específicas CCPA\/CPRA/i).length).toBeGreaterThan(0);
    });
  });

  describe('CookiesPage', () => {
    it('renderiza la política de cookies, tabla de rastreadores y permite abrir el modal de configuración', async () => {
      const user = userEvent.setup();
      render(
        <CookieConsentProvider>
          <BrowserRouter>
            <CookiesPage />
          </BrowserRouter>
        </CookieConsentProvider>
      );

      expect(screen.getByText('Política de Cookies y Tecnologías Similares')).toBeInTheDocument();
      expect(screen.getByText('Gestión Activa de Preferencias')).toBeInTheDocument();
      expect(screen.getByText('colivi_auth_token')).toBeInTheDocument();
      expect(screen.getByText('colivi_cookie_consent_v1')).toBeInTheDocument();

      const configButton = screen.getByRole('button', { name: /configurar cookies/i });
      expect(configButton).toBeInTheDocument();
      await user.click(configButton);
    });
  });
});
