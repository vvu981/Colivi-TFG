import React, { useState } from 'react';
import { MessageSquarePlus, CheckCircle2, ShieldCheck, Trash2 } from 'lucide-react';
import { useListingReviews } from '../../hooks/useListingReviews';
import { StarRating } from './StarRating';
import { CreateReviewModal } from './CreateReviewModal';
import { useAuth } from '../../../auth/hooks/useAuth';

interface ListingReviewsSectionProps {
  listingId: string;
  listingTitle: string;
}

export const ListingReviewsSection: React.FC<ListingReviewsSectionProps> = ({
  listingId,
  listingTitle,
}) => {
  const { user } = useAuth();
  const {
    reviews,
    totalReviews,
    averageRating,
    ratingBreakdown,
    eligibility,
    isLoading,
    isSubmitting,
    submitError,
    submitReview,
    deleteReview,
  } = useListingReviews(listingId);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleDelete = async (reviewId: string) => {
    if (window.confirm('¿Seguro que deseas eliminar esta valoración?')) {
      try {
        setDeletingId(reviewId);
        await deleteReview(reviewId);
      } finally {
        setDeletingId(null);
      }
    }
  };

  return (
    <section className="py-8 border-b border-outline-variant flex flex-col gap-6">
      {/* Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-on-surface flex items-center gap-2">
            <span>Valoraciones y opiniones</span>
            {totalReviews > 0 && (
              <span className="text-body-md font-semibold text-on-surface-variant">
                ({totalReviews})
              </span>
            )}
          </h2>
          <p className="text-body-sm text-on-surface-variant">
            Opiniones de inquilinos con estancias verificadas en este alojamiento.
          </p>
        </div>

        {/* Action button if eligible */}
        {eligibility?.eligible && (
          <button
            type="button"
            onClick={() => setIsModalOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary text-on-primary text-label-md font-bold hover:opacity-90 transition-opacity shrink-0 cursor-pointer shadow-sm"
          >
            <MessageSquarePlus size={18} />
            <span>Valorar estancia</span>
          </button>
        )}
      </div>

      {/* Loading state */}
      {isLoading && (
        <div className="text-body-sm text-on-surface-variant animate-pulse py-2">
          Cargando valoraciones…
        </div>
      )}

      {/* Verified Banner for eligible users */}
      {eligibility?.eligible && (
        <div className="flex items-center gap-3 p-4 rounded-xl bg-primary-container/40 border border-primary/20 text-on-surface">
          <ShieldCheck size={24} className="text-primary shrink-0" />
          <div className="text-body-sm">
            <span className="font-bold">¡Tienes una estancia confirmada!</span>{' '}
            Tu opinión ayuda a otros estudiantes y profesionales a elegir su próximo hogar compartido.
          </div>
        </div>
      )}

      {/* Already reviewed banner */}
      {eligibility?.alreadyReviewed && (
        <div className="flex items-center gap-2.5 p-3.5 rounded-xl bg-surface-container border border-outline-variant/60 text-body-sm text-on-surface-variant">
          <CheckCircle2 size={18} className="text-emerald-600 shrink-0" />
          <span>Ya has emitido tu valoración para este alojamiento. ¡Muchas gracias!</span>
        </div>
      )}

      {/* Summary Score Card (when reviews exist) */}
      {totalReviews > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 p-6 rounded-2xl bg-surface-container border border-outline-variant/60 items-center">
          {/* Average Rating Big Box */}
          <div className="md:col-span-4 flex flex-col items-center justify-center text-center p-4 border-b md:border-b-0 md:border-r border-outline-variant/60">
            <span className="text-5xl font-black text-on-surface font-display">
              {averageRating.toFixed(1)}
            </span>
            <StarRating rating={Math.round(averageRating)} size={22} className="my-2" />
            <span className="text-body-sm font-medium text-on-surface-variant">
              Basado en {totalReviews} {totalReviews === 1 ? 'opinión' : 'opiniones'} verificadas
            </span>
          </div>

          {/* Star Distribution Bars */}
          <div className="md:col-span-8 flex flex-col gap-2">
            {[5, 4, 3, 2, 1].map((stars) => {
              const count = ratingBreakdown[stars] || 0;
              const percentage = totalReviews > 0 ? (count / totalReviews) * 100 : 0;

              return (
                <div key={stars} className="flex items-center gap-3 text-body-sm">
                  <span className="w-12 text-on-surface font-semibold shrink-0">
                    {stars} {stars === 1 ? 'estrella' : 'estrellas'}
                  </span>
                  <div className="flex-1 h-2.5 rounded-full bg-outline-variant/40 overflow-hidden">
                    <div
                      className="h-full bg-amber-400 rounded-full transition-all duration-500"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                  <span className="w-8 text-right text-on-surface-variant font-medium shrink-0">
                    {count}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        /* Empty State */
        <div className="flex flex-col items-center justify-center text-center p-8 rounded-2xl bg-surface-container border border-outline-variant/60 gap-3">
          <div className="w-12 h-12 rounded-full bg-surface-container-high flex items-center justify-center text-on-surface-variant">
            <StarRating rating={0} size={24} />
          </div>
          <h3 className="text-title-md font-bold text-on-surface">Sin valoraciones todavía</h3>
          <p className="text-body-sm text-on-surface-variant max-w-md">
            Este alojamiento aún no tiene reseñas públicas. Las opiniones solo pueden ser publicadas por inquilinos con estancias confirmadas.
          </p>
        </div>
      )}

      {/* Reviews List */}
      {reviews.length > 0 && (
        <div className="flex flex-col gap-4 mt-2">
          {reviews.map((review) => {
            const isAuthor = user?.id === review.authorId;
            const isAdmin = user?.role === 'ADMIN';

            return (
              <article
                key={review.id}
                className="p-5 rounded-2xl bg-surface border border-outline-variant/60 flex flex-col gap-3 shadow-xs"
              >
                {/* Author Info & Rating */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    {review.authorProfilePicUrl ? (
                      <img
                        src={review.authorProfilePicUrl}
                        alt={review.authorNickname}
                        referrerPolicy="no-referrer"
                        className="w-10 h-10 rounded-full object-cover border border-outline-variant"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-sm">
                        {review.authorNickname.charAt(0).toUpperCase()}
                      </div>
                    )}
                    <div>
                      <h4 className="text-title-sm font-bold text-on-surface">
                        {review.authorNickname}
                      </h4>
                      <div className="flex items-center gap-2">
                        <StarRating rating={review.rating} size={14} />
                        <span className="text-xs text-on-surface-variant">
                          {new Date(review.createdAt).toLocaleDateString('es-ES', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                          })}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Delete button (Author or Admin) */}
                  {(isAuthor || isAdmin) && (
                    <button
                      type="button"
                      onClick={() => handleDelete(review.id)}
                      disabled={deletingId === review.id}
                      className="p-1.5 rounded-lg text-on-surface-variant hover:text-error hover:bg-error-container/30 transition-colors"
                      title="Eliminar valoración"
                    >
                      <Trash2 size={16} />
                    </button>
                  )}
                </div>

                {/* Comment Text */}
                {review.comment && (
                  <p className="text-body-md text-on-surface/90 leading-relaxed whitespace-pre-line pl-1">
                    {review.comment}
                  </p>
                )}
              </article>
            );
          })}
        </div>
      )}

      {/* Modal */}
      <CreateReviewModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        listingTitle={listingTitle}
        onSubmit={async (payload) => {
          await submitReview(payload);
        }}
        isSubmitting={isSubmitting}
        errorMessage={submitError}
      />
    </section>
  );
};
