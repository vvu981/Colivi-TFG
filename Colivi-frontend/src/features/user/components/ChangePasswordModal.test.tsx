import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ChangePasswordModal } from './ChangePasswordModal';
import { userService } from '../../user/services/userService';

// Mock the API service
vi.mock('../../user/services/userService', () => ({
  userService: {
    updateCredentials: vi.fn(),
  },
}));

describe('ChangePasswordModal', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders modal when isOpen is true', () => {
    render(<ChangePasswordModal isOpen={true} onClose={() => {}} />);
    expect(screen.getByText('Cambiar Contraseña')).toBeInTheDocument();
  });

  it('shows error if new passwords do not match', async () => {
    render(<ChangePasswordModal isOpen={true} onClose={() => {}} />);
    
    // Asumiendo que el componente expone los labels "Contraseña actual", "Nueva contraseña", "Confirmar nueva contraseña"
    fireEvent.change(screen.getByLabelText(/Contraseña actual/i), { target: { value: 'oldpass123' } });
    fireEvent.change(screen.getByLabelText(/^Nueva contraseña/i), { target: { value: 'newpass123' } });
    fireEvent.change(screen.getByLabelText(/Confirmar nueva contraseña/i), { target: { value: 'differentpass' } });
    
    fireEvent.click(screen.getByRole('button', { name: /Guardar Cambios/i }));
    
    await waitFor(() => {
      expect(screen.getByText('Las contraseñas nuevas no coinciden.')).toBeInTheDocument();
    });
    expect(userService.updateCredentials).not.toHaveBeenCalled();
  });

  it('shows error if new password is same as current password', async () => {
    render(<ChangePasswordModal isOpen={true} onClose={() => {}} />);
    
    fireEvent.change(screen.getByLabelText(/Contraseña actual/i), { target: { value: 'samepass123' } });
    fireEvent.change(screen.getByLabelText(/^Nueva contraseña/i), { target: { value: 'samepass123' } });
    fireEvent.change(screen.getByLabelText(/Confirmar nueva contraseña/i), { target: { value: 'samepass123' } });
    
    fireEvent.click(screen.getByRole('button', { name: /Guardar Cambios/i }));
    
    await waitFor(() => {
      expect(screen.getByText('La nueva contraseña no puede ser igual a la actual.')).toBeInTheDocument();
    });
    expect(userService.updateCredentials).not.toHaveBeenCalled();
  });

  it('calls updateCredentials on successful validation', async () => {
    (userService.updateCredentials as any).mockResolvedValueOnce();
    render(<ChangePasswordModal isOpen={true} onClose={() => {}} />);
    
    fireEvent.change(screen.getByLabelText(/Contraseña actual/i), { target: { value: 'oldpass123' } });
    fireEvent.change(screen.getByLabelText(/^Nueva contraseña/i), { target: { value: 'newpass123' } });
    fireEvent.change(screen.getByLabelText(/Confirmar nueva contraseña/i), { target: { value: 'newpass123' } });
    
    fireEvent.click(screen.getByRole('button', { name: /Guardar Cambios/i }));
    
    await waitFor(() => {
      expect(userService.updateCredentials).toHaveBeenCalledWith({
        currentPassword: 'oldpass123',
        newPassword: 'newpass123',
      });
    });
    
    await waitFor(() => {
      expect(screen.getByText('¡Contraseña actualizada correctamente!')).toBeInTheDocument();
    });
  });
});
