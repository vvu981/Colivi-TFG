import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { InviteMembersModal } from './InviteMembersModal';

describe('InviteMembersModal', () => {
  it('renderiza el código de invitación y opciones de compartir', () => {
    render(
      <InviteMembersModal
        isOpen={true}
        onClose={vi.fn()}
        homeName="Piso Prueba"
        invitationCode="CODE1234"
        isAdmin={true}
        onRegenerateCode={vi.fn()}
      />
    );

    expect(screen.getByText('CODE1234')).toBeInTheDocument();
    expect(screen.getByText('Copiar mensaje completo')).toBeInTheDocument();
    expect(screen.getByText('Compartir por WhatsApp')).toBeInTheDocument();
  });

  it('permite al admin regenerar el código con confirmación previa', async () => {
    const onRegenerateCode = vi.fn().mockResolvedValue('NEWCODE99');

    render(
      <InviteMembersModal
        isOpen={true}
        onClose={vi.fn()}
        homeName="Piso Prueba"
        invitationCode="CODE1234"
        isAdmin={true}
        onRegenerateCode={onRegenerateCode}
      />
    );

    const regenPrompt = screen.getByText(/¿Necesitas invalidar el código actual/);
    fireEvent.click(regenPrompt);

    const confirmBtn = screen.getByRole('button', { name: /Confirmar regeneración/i });
    fireEvent.click(confirmBtn);

    expect(onRegenerateCode).toHaveBeenCalled();
  });
});
