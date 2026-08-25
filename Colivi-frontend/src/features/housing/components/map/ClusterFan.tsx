import { useState } from 'react';
import type { AccommodationListingResponse } from '../../types/listing.types';
import { MarkerPin } from './MarkerPin';

// ── Constants & Geometry ──────────────────────────────────────────────

/**
 * Maximum number of listings to render as an animated radial fan on the map.
 * - count <= 4: Opens as a balanced petal fan / 4-leaf clover.
 * - count > 4: Pattern B (Master-Detail). Renders as a single compact badge pin;
 *   clicking focuses the map and filters the sidebar to display all listings cleanly.
 */
export const MAX_FAN_DISPLAY_COUNT = 4;

/**
 * Calculates rotation angles for fans with 1 to 4 items:
 * - count === 1: [0]
 * - count === 2: [-42, 42] (upward 2-pin symmetrical fan)
 * - count === 3: [-80, 0, 80] (upward 3-pin symmetrical fan)
 * - count === 4: [-135, -45, 45, 135] (perfect 4-leaf clover, 90° between each petal)
 */
function getFanAngles(count: number): number[] {
  if (count <= 1) return [0];
  if (count === 2) return [-42, 42];
  if (count === 3) return [-80, 0, 80];
  if (count === 4) return [-135, -45, 45, 135];

  // Fallback for > 4 if ever invoked
  const step = 360 / count;
  const startAngle = -180 + step / 2;
  return Array.from({ length: count }, (_, i) => Math.round(startAngle + step * i));
}

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
  const uniqueAccIds = new Set(listings.map((l) => l.accommodation?.id));
  const isSameAccommodation = uniqueAccIds.size === 1;

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
            className={`absolute inset-0 ${isExpanded ? 'hover:z-50' : ''}`}
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