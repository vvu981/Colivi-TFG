import { useState, useMemo } from 'react';
import type { AccommodationListingResponse } from '../../types/listing.types';
import { MarkerPin } from './MarkerPin';
import { MAX_FAN_DISPLAY_COUNT, getFanAngles } from '../../utils/mapGeometry';

// ── Props ─────────────────────────────────────────────────────────────

interface ClusterFanProps {
  /** All listings that share the same geographic coordinate. */
  listings: AccommodationListingResponse[];
  /** Whether the fan is expanded or stacked as a single pin. */
  isExpanded: boolean;
  /** Currently selected listing ID */
  selectedListingId?: string | null;
  /** Triggered when a stacked pin is clicked to expand the fan / filter sidebar. */
  onExpand: () => void;
  /** Called when the user clicks any pin inside the expanded fan. */
  onListingClick?: (listing: AccommodationListingResponse) => void;
}

// ── Component ─────────────────────────────────────────────────────────

/**
 * Renders a group of listings at the same coordinate.
 *
 * - With count <= 4: Operates as an animated fan / clover petal layout.
 * - With count > 4: Operates via Pattern B (Master-Detail), keeping the pin compact
 *   and delegating the full list exploration to the filtered sidebar.
 */
export const ClusterFan = ({
  listings,
  isExpanded,
  selectedListingId,
  onExpand,
  onListingClick,
}: ClusterFanProps) => {
  const [internalSelectedId, setInternalSelectedId] = useState<string | null>(null);
  const activeSelectedId = selectedListingId !== undefined ? selectedListingId : internalSelectedId;

  const total = listings.length;

  // Differentiate between Option 1 (different buildings) and Option 2 (same house, multiple rooms)
  const isSameAccommodation = useMemo(() => {
    return new Set(listings.map((l) => l.accommodation?.id)).size === 1;
  }, [listings]);

  // ── PATRÓN B (count > 4): Single Compact Pin + Sidebar Master-Detail Sync ──
  if (total > MAX_FAN_DISPLAY_COUNT) {
    const masterListing = listings[0];
    const isFocused =
      isExpanded || (activeSelectedId !== null && listings.some((l) => l.id === activeSelectedId));

    return (
      <div className="relative w-10 h-10">
        <MarkerPin
          listing={masterListing}
          angle={0}
          isSelected={isFocused}
          onClick={onExpand}
          isExpanded={false}
          groupCount={total}
          isSameAccommodationGroup={isSameAccommodation}
          partOfSameAccommodation={isSameAccommodation}
        />
      </div>
    );
  }

  // ── PATRÓN ABANICO (count <= 4): Smooth Animated Fan / Clover ──────────
  const angles = getFanAngles(total);

  return (
    <div className="relative w-10 h-10">
      {listings.map((listing, index) => {
        // Animate between 0deg (folded) and target fan angle (expanded)
        const appliedAngle = isExpanded ? angles[index] : 0;
        const isSelected = isExpanded && activeSelectedId === listing.id;

        const handleClick = () => {
          if (!isExpanded) {
            onExpand();
          } else {
            setInternalSelectedId(listing.id);
            onListingClick?.(listing);
          }
        };

        return (
          <div
            key={listing.id}
            className={`absolute inset-0 ${isExpanded ? 'hover:!z-50' : ''}`}
            style={{
              zIndex: isSelected ? 40 : isExpanded ? index + 1 : total - index,
              // When folded, only the top master pin receives pointer events so hover is 100% clean
              pointerEvents: !isExpanded && index > 0 ? 'none' : 'auto',
            }}
          >
            <MarkerPin
              listing={listing}
              angle={appliedAngle}
              isSelected={isSelected}
              onClick={handleClick}
              isExpanded={isExpanded}
              // Only render the notification badge on the single master pin when collapsed
              groupCount={!isExpanded && index === 0 ? total : undefined}
              isSameAccommodationGroup={!isExpanded ? isSameAccommodation : undefined}
              partOfSameAccommodation={isExpanded && isSameAccommodation}
            />
          </div>
        );
      })}
    </div>
  );
};