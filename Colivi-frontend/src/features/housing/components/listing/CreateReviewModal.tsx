import React, { useState } from 'react';
import { X, MessageSquare, AlertCircle } from 'lucide-react';
import { StarRating } from './StarRating';

interface CreateReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  listingTitle: string;
  onSubmit: (payload: { rating: number; comment?: string }) => Promise<void>;
  isSubmitting: boolean;
  errorMessage?: string | null;
}

export const CreateReviewModal: React.FC<CreateReviewModalProps> = ({
  isOpen,
  onClose,
  listingTitle,
  onSubmit,
  isSubmitting,
  errorMessage,
}) => {
  const [rating, setRating] = useState<number>(5);
  const [comment, setComment] = useState<string>('');
  const [validationError, setValidationError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (rating < 1 || rating > 5) {
      setValidationError('Por favor, selecciona una puntuación entre 1 y 5 estrellas.');
      return;
    }
    setValidationError(null);
    try {
      await onSubmit({ rating, comment: comment.trim() || undefined });
      onClose();
      setComment('');
      setRating(5);
    } catch {
      // El error se maneja externamente mediante errorMessage prop
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in"
      role="dialog"
      aria-modal="true"
      aria-labelledby="review-modal-title"
    >
      <div className="bg-surface rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-outline-variant relative flex flex-col gap-5">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-outline-variant pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-primary-container text-on-primary-container">
              <MessageSquare size={22} />
            </div>
            <div>
              <h2 id="review-modal-title" className="text-title-lg font-bold text-on-surface">
                Valorar tu estancia
              </h2>
              <p className="text-body-sm text-on-surface-variant line-clamp-1">
                {listingTitle}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-on-surface-variant hover:bg-surface-container-high transition-colors"
            aria-label="Cerrar modal"
          >
            <X size={20} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          {/* Rating input */}
          <div className="flex flex-col items-center justify-center gap-2 py-3 bg-surface-container rounded-xl border border-outline-variant/60">
            <span className="text-label-md font-semibold text-on-surface">
              ¿Cómo calificarías tu experiencia global?
            </span>
            <StarRating
              rating={rating}
              interactive
              size={32}
              onRatingChange={(r) => {
                setRating(r);
                setValidationError(null);
              }}
            />
            <span className="text-body-sm font-medium text-amber-600">
              {rating === 5 && '¡Excelente! Todo perfecto.'}
              {rating === 4 && 'Muy buena estancia.'}
              {rating === 3 && 'Aceptable, con margen de mejora.'}
              {rating === 2 && 'Mala experiencia.'}
              {rating === 1 && 'Muy mala experiencia.'}
            </span>
          </div>

          {/* Comment input */}
          <div className="flex flex-col gap-1.5">
            <label htmlFor="review-comment" className="text-label-md font-semibold text-on-surface">
              Tu opinión o comentario (opcional)
            </label>
            <textarea
              id="review-comment"
              rows={4}
              maxLength={2000}
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Cuéntale a la comunidad sobre el estado del piso, la convivencia, la ubicación o el trato con el anfitrión..."
              className="w-full rounded-xl border border-outline-variant bg-surface px-4 py-3 text-body-md text-on-surface placeholder:text-on-surface-variant/60 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all resize-none"
            />
            <span className="text-xs text-on-surface-variant text-right">
              {comment.length} / 2000 caracteres
            </span>
          </div>

          {/* Error messages */}
          {(validationError || errorMessage) && (
            <div className="flex items-center gap-2 p-3 rounded-xl bg-error-container text-error text-body-sm">
              <AlertCircle size={18} className="shrink-0" />
              <span>{validationError || errorMessage}</span>
            </div>
          )}

          {/* Action buttons */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-5 py-2.5 rounded-xl border border-outline-variant text-on-surface text-label-md font-semibold hover:bg-surface-container-high transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2.5 rounded-xl bg-primary text-on-primary text-label-md font-bold hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center gap-2 cursor-pointer"
            >
              {isSubmitting ? 'Publicando…' : 'Publicar valoración'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
