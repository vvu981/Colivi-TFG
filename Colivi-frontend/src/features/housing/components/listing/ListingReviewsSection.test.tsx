import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ListingReviewsSection } from './ListingReviewsSection';

const mockUseAuth = vi.fn();
const mockUseListingReviews = vi.fn();

vi.mock('../../../auth/hooks/useAuth', () => ({
  useAuth: () => mockUseAuth(),
}));

vi.mock('../../hooks/useListingReviews', () => ({
  useListingReviews: () => mockUseListingReviews(),
}));

describe('ListingReviewsSection', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseAuth.mockReturnValue({
      user: { id: 'user-1', nickname: 'Inquilino1', role: 'USER' },
    });
  });

  it('renders empty state when there are 0 reviews and user is not eligible', () => {
    mockUseListingReviews.mockReturnValue({
      reviews: [],
      totalReviews: 0,
      averageRating: 0,
      ratingBreakdown: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
      eligibility: { eligible: false, alreadyReviewed: false },
      isLoading: false,
      isSubmitting: false,
      submitError: null,
      submitReview: vi.fn(),
      deleteReview: vi.fn(),
      refetch: vi.fn(),
    });

    render(<ListingReviewsSection listingId="list-1" listingTitle="Habitación luminosa" />);

    expect(screen.getByText(/Valoraciones y opiniones/i)).toBeInTheDocument();
    expect(screen.getByText(/Sin valoraciones todavía/i)).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Valorar estancia/i })).not.toBeInTheDocument();
  });

  it('renders "Valorar estancia" button when user is eligible', () => {
    mockUseListingReviews.mockReturnValue({
      reviews: [],
      totalReviews: 0,
      averageRating: 0,
      ratingBreakdown: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
      eligibility: { eligible: true, eligibleBookingRequestId: 'booking-123', alreadyReviewed: false },
      isLoading: false,
      isSubmitting: false,
      submitError: null,
      submitReview: vi.fn(),
      deleteReview: vi.fn(),
      refetch: vi.fn(),
    });

    render(<ListingReviewsSection listingId="list-1" listingTitle="Habitación luminosa" />);

    expect(screen.getByRole('button', { name: /Valorar estancia/i })).toBeInTheDocument();
    expect(screen.getByText(/¡Tienes una estancia confirmada!/i)).toBeInTheDocument();
  });

  it('opens review modal on button click', () => {
    mockUseListingReviews.mockReturnValue({
      reviews: [],
      totalReviews: 0,
      averageRating: 0,
      ratingBreakdown: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
      eligibility: { eligible: true, eligibleBookingRequestId: 'booking-123', alreadyReviewed: false },
      isLoading: false,
      isSubmitting: false,
      submitError: null,
      submitReview: vi.fn(),
      deleteReview: vi.fn(),
      refetch: vi.fn(),
    });

    render(<ListingReviewsSection listingId="list-1" listingTitle="Habitación luminosa" />);

    fireEvent.click(screen.getByRole('button', { name: /Valorar estancia/i }));
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText(/¿Cómo calificarías tu experiencia global\?/i)).toBeInTheDocument();
  });

  it('renders reviews list and average summary when reviews exist', () => {
    mockUseListingReviews.mockReturnValue({
      reviews: [
        {
          id: 'rev-1',
          listingId: 'list-1',
          bookingRequestId: 'book-1',
          authorId: 'user-2',
          authorNickname: 'CarlosG',
          authorProfilePicUrl: null,
          rating: 5,
          comment: 'La estancia fue inmejorable, compañeros amables y piso limpio.',
          createdAt: '2024-06-01T10:00:00Z',
        },
      ],
      totalReviews: 1,
      averageRating: 5.0,
      ratingBreakdown: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 1 },
      eligibility: { eligible: false, alreadyReviewed: false },
      isLoading: false,
      isSubmitting: false,
      submitError: null,
      submitReview: vi.fn(),
      deleteReview: vi.fn(),
      refetch: vi.fn(),
    });

    render(<ListingReviewsSection listingId="list-1" listingTitle="Habitación luminosa" />);

    expect(screen.getByText('5.0')).toBeInTheDocument();
    expect(screen.getByText('CarlosG')).toBeInTheDocument();
    expect(screen.getByText('La estancia fue inmejorable, compañeros amables y piso limpio.')).toBeInTheDocument();
  });
});
