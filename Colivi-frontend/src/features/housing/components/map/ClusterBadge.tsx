// ── Props ─────────────────────────────────────────────────────────────

interface ClusterBadgeProps {
  /** Number of listings aggregated in this cluster. */
  count: number;
  /** Called when the user clicks the badge to zoom in. */
  onClick: () => void;
}

// ── Component ─────────────────────────────────────────────────────────

/**
 * ESTADO 1 — Macro-clúster.
 *
 * A simple circular badge displayed when multiple listings are near each
 * other geographically at the current zoom level but do NOT share the
 * exact same coordinate.
 *
 * Interaction: clicking triggers a zoom-in toward the cluster centre,
 * handled by the parent (`MapSearchPage`) via the `onClick` prop.
 */
export const ClusterBadge = ({ count, onClick }: ClusterBadgeProps) => {
  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onClick();
  };

  return (
    <button
      type="button"
      aria-label={`Clúster de ${count} anuncios. Haz clic para acercar.`}
      onClick={handleClick}
      className="w-10 h-10 rounded-full bg-primary-fixed text-on-surface-variant border-2 border-background flex items-center justify-center font-bold shadow-md cursor-pointer transition-transform hover:scale-110 text-label-sm"
    >
      {count}
    </button>
  );
};
