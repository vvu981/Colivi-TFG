import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Profile } from './Profile';
import { useAuth } from '../../auth/context/AuthContext';
import { useUser } from '../hooks/useUser';

// Mock the hooks
vi.mock('../../auth/context/AuthContext', () => ({
  useAuth: vi.fn(),
}));

vi.mock('../hooks/useUser', () => ({
  useUser: vi.fn(),
}));

// Mock the UI components that might be complex
vi.mock('../../../components/ui/ColiviPhoneInput', () => ({
  ColiviPhoneInput: ({ onChange, value }: any) => (
    <input data-testid="phone-input" value={value || ''} onChange={(e) => onChange(e.target.value)} />
  ),
}));

describe('Profile', () => {
  const mockLogout = vi.fn();
  const mockUpdateProfile = vi.fn();
  const mockUpdateProfilePicture = vi.fn();
  const mockDeleteAccount = vi.fn();
  
  const mockUser = {
    id: '1',
    email: 'test@example.com',
    nickname: 'tester',
    firstName: 'Test',
    lastName1: 'User',
    lastName2: '',
    phone: '',
    role: 'TENANT',
    profilePicUrl: null,
    createdAt: '2023-01-01T00:00:00Z',
  };

  beforeEach(() => {
    vi.clearAllMocks();
    (useAuth as any).mockReturnValue({
      logout: mockLogout,
    });
    (useUser as any).mockReturnValue({
      user: mockUser,
      updateProfile: mockUpdateProfile,
      updateProfilePicture: mockUpdateProfilePicture,
      deleteAccount: mockDeleteAccount,
    });
  });

  it('renders user information correctly', () => {
    render(<Profile />);
    expect(screen.getAllByText('tester').length).toBeGreaterThan(0);
    expect(screen.getByText('Test')).toBeInTheDocument();
    expect(screen.getByText('test@example.com')).toBeInTheDocument();
  });

  it('allows editing and calls updateProfile', async () => {
    render(<Profile />);
    
    // Click on Edit
    fireEvent.click(screen.getByRole('button', { name: /Editar Información/i }));
    
    // Changing the nickname input
    const inputs = screen.getAllByRole('textbox');
    // inputs[0] might be nickname if it's the first one in the form
    // Assuming the inputs correspond to nickname, firstName, lastName1, lastName2
    fireEvent.change(inputs[0], { target: { name: 'nickname', value: 'newtester' } });
    
    // Save
    fireEvent.click(screen.getByRole('button', { name: /Guardar Cambios/i }));
    
    await waitFor(() => {
      expect(mockUpdateProfile).toHaveBeenCalledWith(expect.objectContaining({
        nickname: 'newtester',
      }));
    });
  });

  it('validates empty first name', async () => {
    render(<Profile />);
    
    fireEvent.click(screen.getByRole('button', { name: /Editar Información/i }));
    
    // Asumimos que inputs[1] es firstName basado en el orden de ProfilePersonalInfoForm
    const inputs = screen.getAllByRole('textbox');
    fireEvent.change(inputs[1], { target: { name: 'firstName', value: '   ' } });
    
    fireEvent.click(screen.getByRole('button', { name: /Guardar Cambios/i }));
    
    await waitFor(() => {
      expect(screen.getByText('El nombre es obligatorio.')).toBeInTheDocument();
    });
    
    expect(mockUpdateProfile).not.toHaveBeenCalled();
  });

  it('renders danger zone and opens delete account modal', async () => {
    render(<Profile />);

    expect(screen.getByText('Zona de peligro')).toBeInTheDocument();
    const deleteAccountButton = screen.getByRole('button', { name: /Eliminar cuenta/i });
    expect(deleteAccountButton).toBeInTheDocument();

    fireEvent.click(deleteAccountButton);

    expect(
      screen.getByText(/¿Estás seguro de que deseas eliminar tu cuenta\?/i)
    ).toBeInTheDocument();

    // Confirm deletion flow
    const confirmInput = screen.getByPlaceholderText(/Escribe ELIMINAR/i);
    fireEvent.change(confirmInput, { target: { value: 'ELIMINAR' } });

    const confirmButton = screen.getByRole('button', { name: /Eliminar mi cuenta/i });
    fireEvent.click(confirmButton);

    await waitFor(() => {
      expect(mockDeleteAccount).toHaveBeenCalledTimes(1);
    });
  });
});
