import { useState, useEffect, useCallback } from 'react';
import { isAxiosError } from 'axios';
import { accommodationReviewService } from '../api/accommodationReviewService';
import type {
  ReviewResponse,
  ReviewSummaryResponse,
  ReviewEligibilityResponse,
  CreateReviewRequest,
  PaginatedReviews,
} from '../types/review.types';

export const useListingReviews = (listingId?: string, page = 0, size = 10) => {
  const [reviewsData, setReviewsData] = useState<PaginatedReviews | null>(null);
  const [summary, setSummary] = useState<ReviewSummaryResponse | null>(null);
  const [eligibility, setEligibility] = useState<ReviewEligibilityResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const fetchReviewsAndSummary = useCallback(async () => {
    if (!listingId) return;
    setIsLoading(true);
    setError(null);
    try {
      const [reviewsRes, summaryRes] = await Promise.all([
        accommodationReviewService.getListingReviews(listingId, page, size),
        accommodationReviewService.getListingReviewSummary(listingId),
      ]);
      setReviewsData(reviewsRes);
      setSummary(summaryRes);
    } catch (err: unknown) {
      if (isAxiosError(err)) {
        setError(err.response?.data?.message ?? 'Error al cargar las valoraciones.');
      } else {
        setError('Error inesperado al cargar las valoraciones.');
      }
    } finally {
      setIsLoading(false);
    }
  }, [listingId, page, size]);

  const fetchEligibility = useCallback(async () => {
    if (!listingId) return;
    try {
      const res = await accommodationReviewService.checkEligibility(listingId);
      setEligibility(res);
    } catch {
      setEligibility({
        eligible: false,
        alreadyReviewed: false,
        reason: 'No se pudo verificar la elegibilidad.',
      });
    }
  }, [listingId]);

  useEffect(() => {
    fetchReviewsAndSummary();
    fetchEligibility();
  }, [fetchReviewsAndSummary, fetchEligibility]);

  const submitReview = async (payload: CreateReviewRequest): Promise<ReviewResponse> => {
    if (!listingId) throw new Error('Identificador de anuncio no disponible.');
    setIsSubmitting(true);
    setSubmitError(null);
    try {
      const res = await accommodationReviewService.createReview(listingId, payload);
      await Promise.all([fetchReviewsAndSummary(), fetchEligibility()]);
      return res;
    } catch (err: unknown) {
      const msg = isAxiosError(err)
        ? (err.response?.data?.message ?? 'Error al publicar la valoración.')
        : 'Error inesperado al enviar la valoración.';
      setSubmitError(msg);
      throw new Error(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const deleteReview = async (reviewId: string) => {
    try {
      await accommodationReviewService.deleteReview(reviewId);
      await Promise.all([fetchReviewsAndSummary(), fetchEligibility()]);
    } catch (err: unknown) {
      const msg = isAxiosError(err)
        ? (err.response?.data?.message ?? 'Error al eliminar la valoración.')
        : 'Error inesperado al eliminar la valoración.';
      throw new Error(msg);
    }
  };

  return {
    reviews: reviewsData?.content ?? [],
    totalReviews: summary?.totalReviews ?? 0,
    averageRating: summary?.averageRating ?? 0,
    ratingBreakdown: summary?.ratingBreakdown ?? { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
    totalPages: reviewsData?.totalPages ?? 0,
    eligibility,
    isLoading,
    isSubmitting,
    error,
    submitError,
    submitReview,
    deleteReview,
    refetch: fetchReviewsAndSummary,
  };
};
