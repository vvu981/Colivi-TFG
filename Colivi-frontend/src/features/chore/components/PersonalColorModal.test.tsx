import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { PersonalColorModal } from './PersonalColorModal';
import { homeService } from '../../home/api/homeService';

vi.mock('../../home/api/homeService', () => ({
  homeService: {
    updateMyMemberColor: vi.fn(),
  },
}));

describe('PersonalColorModal', () => {
  const defaultProps = {
    isOpen: true,
    onClose: vi.fn(),
    homeId: 'home-123',
    currentColor: '#4F46E5',
    onSuccess: vi.fn(),
  };

  it('renders nothing when isOpen is false', () => {
    const { container } = render(
      <PersonalColorModal {...defaultProps} isOpen={false} />
    );
    expect(container.firstChild).toBeNull();
  });

  it('renders modal with title and palette options', () => {
    render(<PersonalColorModal {...defaultProps} />);

    expect(screen.getByText('Mi color en el hogar')).toBeInTheDocument();
    expect(screen.getByText('Vista previa')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Guardar color/i })).toBeInTheDocument();
  });

  it('allows selecting a color and submitting', async () => {
    const mockUpdate = vi.mocked(homeService.updateMyMemberColor).mockResolvedValue({} as any);

    render(<PersonalColorModal {...defaultProps} />);

    // Click on "Esmeralda" color button
    const emeraldBtn = screen.getByTitle('Esmeralda');
    fireEvent.click(emeraldBtn);

    const saveBtn = screen.getByRole('button', { name: /Guardar color/i });
    fireEvent.click(saveBtn);

    await waitFor(() => {
      expect(mockUpdate).toHaveBeenCalledWith('home-123', '#059669');
      expect(defaultProps.onSuccess).toHaveBeenCalledWith('#059669');
      expect(defaultProps.onClose).toHaveBeenCalled();
    });
  });

  it('displays error message when saving fails', async () => {
    vi.mocked(homeService.updateMyMemberColor).mockRejectedValue(
      new Error('No tienes permisos')
    );

    render(<PersonalColorModal {...defaultProps} />);

    const saveBtn = screen.getByRole('button', { name: /Guardar color/i });
    fireEvent.click(saveBtn);

    await waitFor(() => {
      expect(screen.getByText('No tienes permisos')).toBeInTheDocument();
    });
  });
});
