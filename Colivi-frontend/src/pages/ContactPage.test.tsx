import { render, screen, fireEvent, act } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ContactPage } from './ContactPage';
import { CookieConsentProvider } from '../features/compliance';

vi.mock('../features/auth/context/AuthContext', () => ({
  useAuth: () => ({
    isAuthenticated: false,
    isLoading: false,
    user: null,
    logout: vi.fn(),
  }),
}));

const renderContactPage = () => {
  return render(
    <CookieConsentProvider>
      <BrowserRouter>
        <ContactPage />
      </BrowserRouter>
    </CookieConsentProvider>
  );
};

describe('ContactPage', () => {
  const writeTextMock = vi.fn().mockResolvedValue(undefined);

  beforeEach(() => {
    vi.clearAllMocks();
    Object.assign(navigator, {
      clipboard: {
        writeText: writeTextMock,
      },
    });
  });

  it('renderiza la cabecera principal y la información de contacto', () => {
    renderContactPage();

    expect(screen.getByText('Contacto y Atención al Usuario')).toBeInTheDocument();
    expect(screen.getByText('Canales Oficiales de Comunicación')).toBeInTheDocument();
    expect(screen.getByText('Canales sin intermediación ni formularios')).toBeInTheDocument();
  });

  it('muestra las 3 direcciones de correo oficiales con enlaces mailto directos', () => {
    renderContactPage();

    expect(screen.getByText('contacto@colivi.es')).toBeInTheDocument();
    expect(screen.getByText('soporte@colivi.es')).toBeInTheDocument();
    expect(screen.getByText('privacy@colivi.es')).toBeInTheDocument();

    const mailtoLinks = screen.getAllByRole('link', { name: /redactar correo/i });
    expect(mailtoLinks).toHaveLength(3);
    expect(mailtoLinks[0]).toHaveAttribute('href', 'mailto:contacto@colivi.es');
    expect(mailtoLinks[1]).toHaveAttribute('href', 'mailto:soporte@colivi.es');
    expect(mailtoLinks[2]).toHaveAttribute('href', 'mailto:privacy@colivi.es');
  });

  it('verifica estrictamente que NO existen formularios ni campos de entrada (página puramente informativa)', () => {
    const { container } = renderContactPage();

    const forms = container.querySelectorAll('form');
    expect(forms.length).toBe(0);

    const inputs = container.querySelectorAll('input:not([type="hidden"]), textarea, select');
    expect(inputs.length).toBe(0);
  });

  it('permite copiar la dirección de correo al portapapeles y ofrece confirmación visual', async () => {
    renderContactPage();

    const copyBtn = screen.getByRole('button', { name: /copiar correo contacto@colivi.es/i });
    await act(async () => {
      fireEvent.click(copyBtn);
    });

    expect(writeTextMock).toHaveBeenCalledWith('contacto@colivi.es');
  });

  it('muestra los horarios de atención y la mención al Art. 10 de la LSSI-CE', () => {
    renderContactPage();

    expect(screen.getByText('Horario y Tiempos de Respuesta')).toBeInTheDocument();
    expect(screen.getByText(/lunes a viernes, de 09:00 a 18:00 cet/i)).toBeInTheDocument();
    expect(screen.getByText(/art\. 10 de la ley 34\/2002 \(lssi-ce\)/i)).toBeInTheDocument();
  });
});
