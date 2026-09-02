import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { CopyIdButton } from './CopyIdButton';

describe('CopyIdButton', () => {
  const writeTextMock = vi.fn().mockResolvedValue(undefined);

  beforeEach(() => {
    vi.clearAllMocks();
    Object.assign(navigator, {
      clipboard: {
        writeText: writeTextMock,
      },
    });
  });

  it('renders id text and copies to clipboard on click', async () => {
    render(<CopyIdButton id="test-uuid-1234" prefix="ID:" />);

    expect(screen.getByText('test-uuid-1234')).toBeInTheDocument();
    expect(screen.getByText('ID:')).toBeInTheDocument();

    const button = screen.getByRole('button');
    fireEvent.click(button);

    expect(writeTextMock).toHaveBeenCalledWith('test-uuid-1234');
    await waitFor(() => {
      expect(screen.getByText('Copiado')).toBeInTheDocument();
    });
  });
});
