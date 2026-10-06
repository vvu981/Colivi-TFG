/**
 * mapGeometry.ts - Pure math utility isolated from UI
 */

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
export function getFanAngles(count: number): number[] {
  if (count <= 1) return [0];
  if (count === 2) return [-42, 42];
  if (count === 3) return [-80, 0, 80];
  if (count === 4) return [-135, -45, 45, 135];

  // Fallback for > 4 if ever invoked
  const step = 360 / count;
  const startAngle = -180 + step / 2;
  return Array.from({ length: count }, (_, i) => Math.round(startAngle + step * i));
}
