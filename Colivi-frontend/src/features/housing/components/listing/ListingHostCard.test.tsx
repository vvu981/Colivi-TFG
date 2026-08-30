import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { BrowserRouter } from 'react-router-dom';
import { ListingHostCard } from './ListingHostCard';

describe('ListingHostCard', () => {
  const defaultProps = {
    hostId: 'host-123',
    hostNickname: 'ElenaHost',
    hostProfilePicUrl: 'https://example.com/elena.jpg',
    createdAt: '2024-05-15T12:00:00Z',
  };

  const renderComponent = (props = defaultProps) => {
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
    renderComponent({
      ...defaultProps,
      hostProfilePicUrl: undefined,
    });

    expect(screen.getByText('E')).toBeInTheDocument();
    expect(screen.queryByRole('img')).not.toBeInTheDocument();
  });

  it('no muestra el enlace si hostId no está presente', () => {
    renderComponent({
      ...defaultProps,
      hostId: undefined,
    });

    expect(screen.queryByRole('link', { name: /ver perfil/i })).not.toBeInTheDocument();
  });
});
