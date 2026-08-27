import { MAP_THEME } from './mapTheme';

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

  const { cluster } = MAP_THEME;

  return (
    <button
      type="button"
      aria-label={`Clúster de ${count} anuncios. Haz clic para acercar.`}
      onClick={handleClick}
      className={`w-10 h-10 rounded-full ${cluster.background} ${cluster.textColor} ${cluster.border} ${cluster.shadow} ${cluster.ring} flex items-center justify-center font-bold cursor-pointer transition-all hover:scale-110 active:scale-95 text-label-sm`}
    >
      {count}
    </button>
  );
};
