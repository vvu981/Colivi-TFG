import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import { BrowserRouter } from 'react-router-dom';
import { ListingHostCard, type ListingHostCardProps } from './ListingHostCard';
import { messagingApi } from '../../../messaging/api/messagingApi';

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

vi.mock('../../../messaging/api/messagingApi', () => ({
  messagingApi: {
    startConsultation: vi.fn(),
  },
}));

describe('ListingHostCard', () => {
  const defaultProps: ListingHostCardProps = {
    hostId: 'host-123',
    hostNickname: 'ElenaHost',
    hostProfilePicUrl: 'https://example.com/elena.jpg',
    createdAt: '2024-05-15T12:00:00Z',
    listingId: 'listing-456',
    currentUserId: 'tenant-789',
  };

  const renderComponent = (props: ListingHostCardProps = defaultProps) => {
    return render(
      <BrowserRouter>
        <ListingHostCard {...props} />
      </BrowserRouter>
    );
  };

  it('renderiza correctamente el nickname, imagen de perfil y fecha', () => {
    renderComponent();

    expect(screen.getByText(/Publicado por ElenaHost/i)).toBeInTheDocument();
    expect(screen.getByText(/mayo de 2024/i)).toBeInTheDocument();
    expect(screen.getByRole('img', { name: /ElenaHost/i })).toHaveAttribute(
      'src',
      'https://example.com/elena.jpg'
    );
    expect(screen.getByRole('link', { name: /ver perfil/i })).toHaveAttribute(
      'href',
      '/users/host-123'
    );
  });

  it('renderiza la inicial como fallback si no hay foto de perfil', () => {
    const { hostProfilePicUrl: _pic, ...propsWithoutPic } = defaultProps;
    renderComponent(propsWithoutPic);

    expect(screen.getByText('E')).toBeInTheDocument();
    expect(screen.queryByRole('img')).not.toBeInTheDocument();
  });

  it('no muestra el enlace si hostId no está presente', () => {
    const { hostId: _id, ...propsWithoutHostId } = defaultProps;
    renderComponent(propsWithoutHostId);

    expect(screen.queryByRole('link', { name: /ver perfil/i })).not.toBeInTheDocument();
  });

  it('inicia conversacion de consulta al hacer clic en Contactar y navega', async () => {
    const user = userEvent.setup();
    vi.mocked(messagingApi.startConsultation).mockResolvedValueOnce({
      conversationId: 'conv-999',
    } as any);

    renderComponent();

    const contactBtn = screen.getByRole('button', { name: /Contactar/i });
    await user.click(contactBtn);

    expect(messagingApi.startConsultation).toHaveBeenCalledWith('listing-456');
    expect(mockNavigate).toHaveBeenCalledWith('/messages/conv-999');
  });

  it('muestra mensaje de alerta si falla al iniciar la consulta', async () => {
    const user = userEvent.setup();
    vi.mocked(messagingApi.startConsultation).mockRejectedValueOnce(
      new Error('Anuncio no disponible o pausado')
    );

    renderComponent();

    const contactBtn = screen.getByRole('button', { name: /Contactar/i });
    await user.click(contactBtn);

    expect(await screen.findByRole('alert')).toHaveTextContent('Anuncio no disponible o pausado');
  });
});

