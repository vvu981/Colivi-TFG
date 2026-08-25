import { Home, Bed } from 'lucide-react';
import type { AccommodationListingResponse } from '../../types/listing.types';
import { MAP_THEME } from './mapTheme';

// ── Props ─────────────────────────────────────────────────────────────

export interface MarkerPinProps {
  listing: AccommodationListingResponse;
  /** Ángulo de rotación en grados sobre la punta (pivote en 20px 48px) */
  angle?: number;
  /** Si la gota está seleccionada (al hacer click), se hace más grande sin mover las demás */
  isSelected?: boolean;
  onClick?: (listing: AccommodationListingResponse) => void;
  isExpanded?: boolean;
  groupCount?: number;
  isSameAccommodationGroup?: boolean;
  partOfSameAccommodation?: boolean;
}

// ── Component ─────────────────────────────────────────────────────────

export const MarkerPin = ({
  listing,
  angle,
  isSelected = false,
  onClick,
  groupCount,
  isSameAccommodationGroup = false,
  partOfSameAccommodation = false,
}: MarkerPinProps) => {
  const safeAngle = Number.isFinite(angle) ? (angle as number) : 0;
  const scale = isSelected ? 1.2 : 1;

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault(); // Evita comportamientos fantasma
    e.stopPropagation(); // Evita que el clic se propague al mapa y haga un zoom no deseado
    onClick?.(listing);
  };

  const { pin: pinTheme, badge: badgeTheme } = MAP_THEME;

  const strokeClass = isSelected
    ? pinTheme.strokeSelected
    : partOfSameAccommodation
    ? pinTheme.strokeGroupSameAcc
    : pinTheme.strokeDefault;

  const badgeBgClass = isSameAccommodationGroup
    ? badgeTheme.sameAccommodation
    : badgeTheme.differentAccommodation;

  return (
    <div
      role="button"
      tabIndex={0}
      aria-label={`Ver anuncio: ${listing?.title || 'Alojamiento'}`}
      onClick={handleClick}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          handleClick(e as any);
        }
      }}
      className={`absolute bottom-0 left-1/2 cursor-pointer outline-none transition-transform duration-300 ${
        isSelected ? 'z-40 hover:scale-125' : 'z-10 hover:z-50 hover:scale-110'
      }`}
      style={{
        width: '40px',
        height: '48px',
        transformOrigin: '20px 48px',
        transform: `translate(-50%, 0px) rotate(${safeAngle}deg) scale(${scale})`,
      } as React.CSSProperties}
    >
      {/* Group Count Badge */}
      {groupCount && groupCount > 1 && (
        <span
          className={`absolute -top-1.5 -right-1.5 z-20 flex h-5 min-w-[20px] items-center justify-center rounded-full px-1 text-[9px] font-bold ${badgeTheme.shadow} ${badgeTheme.border} ${badgeBgClass} transition-colors`}
          title={
            isSameAccommodationGroup
              ? `${groupCount} habitaciones en este alojamiento`
              : `${groupCount} alojamientos diferentes en esta ubicación`
          }
        >
          {groupCount}
        </span>
      )}

      {/* SVG Background (La Gota) */}
      <svg
        width="40"
        height="48"
        viewBox="0 0 40 48"
        className={`pointer-events-none ${pinTheme.shadow}`}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '40px',
          height: '48px',
          overflow: 'visible',
          display: 'block',
          zIndex: 1,
        }}
      >
        <path
          d="M 20 48 C 20 48, 0 32, 0 20 C 0 9, 9 0, 20 0 C 31 0, 40 9, 40 20 C 40 32, 20 48, 20 48 Z"
          className={`${pinTheme.dropFill} ${strokeClass} transition-colors`}
        />
      </svg>

      {/* Icon Container */}
      <div
        className="pointer-events-none flex items-center justify-center"
        style={{
          position: 'absolute',
          top: '0px',
          left: '0px',
          width: '40px',
          height: '40px',
          zIndex: 20,
        }}
      >
        {listing?.rentalType === 'ENTIRE_PLACE' ? (
          <Home
            size={18}
            strokeWidth={2.5}
            style={{
              color: pinTheme.iconColor,
              transform: `rotate(${-safeAngle}deg)`,
              transformOrigin: 'center',
            }}
          />
        ) : (
          <Bed
            size={18}
            strokeWidth={2.5}
            style={{
              color: pinTheme.iconColor,
              transform: `rotate(${-safeAngle}deg)`,
              transformOrigin: 'center',
            }}
          />
        )}
      </div>
    </div>
  );
};