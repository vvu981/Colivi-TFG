import React, { useState } from 'react';
import { Star } from 'lucide-react';

interface StarRatingProps {
  rating: number;
  maxStars?: number;
  interactive?: boolean;
  size?: number;
  onRatingChange?: (rating: number) => void;
  className?: string;
}

export const StarRating: React.FC<StarRatingProps> = ({
  rating,
  maxStars = 5,
  interactive = false,
  size = 18,
  onRatingChange,
  className = '',
}) => {
  const [hoverRating, setHoverRating] = useState<number | null>(null);

  const displayRating = hoverRating !== null ? hoverRating : rating;

  return (
    <div className={`flex items-center gap-1 ${className}`} role={interactive ? 'radiogroup' : 'img'} aria-label={`Puntuación: ${rating} de ${maxStars} estrellas`}>
      {Array.from({ length: maxStars }, (_, index) => {
        const starValue = index + 1;
        const isFilled = starValue <= displayRating;

        if (interactive) {
          return (
            <button
              key={starValue}
              type="button"
              onClick={() => onRatingChange?.(starValue)}
              onMouseEnter={() => setHoverRating(starValue)}
              onMouseLeave={() => setHoverRating(null)}
              className="p-1 text-amber-400 hover:scale-110 transition-transform focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 rounded"
              role="radio"
              aria-checked={starValue === rating}
              aria-label={`${starValue} de ${maxStars} estrellas`}
            >
              <Star
                size={size}
                className={isFilled ? 'fill-amber-400 text-amber-400' : 'text-slate-300'}
              />
            </button>
          );
        }

        return (
          <Star
            key={starValue}
            size={size}
            className={isFilled ? 'fill-amber-400 text-amber-400' : 'text-slate-300'}
          />
        );
      })}
    </div>
  );
};
