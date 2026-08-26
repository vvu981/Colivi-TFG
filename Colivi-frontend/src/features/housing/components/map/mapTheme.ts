/**
 * Map Theme Configuration (SOLID: Single Responsibility & Open/Closed)
 *
 * Centralises all visual design tokens, colors, and styling rules for map
 * elements (Pins, Clusters, Badges, Legend, and TileLayer) to guarantee
 * 100% DRY compliance, maintainability, and seamless theme switching.
 */

export interface MapTileTheme {
  url: string;
  attribution: string;
  subdomains: string;
  minZoom: number;
  maxZoom: number;
}

export interface MapPinTheme {
  /** SVG drop fill class (e.g., 'fill-primary-container') */
  dropFill: string;
  /** Stroke applied to standard unselected markers */
  strokeDefault: string;
  /** Stroke applied to currently selected / highlighted marker */
  strokeSelected: string;
  /** Stroke applied when part of the same accommodation group */
  strokeGroupSameAcc: string;
  /** Color applied directly to Lucide icons */
  iconColor: string;
  /** Drop shadow applied to SVG pin */
  shadow: string;
}

export interface MapBadgeTheme {
  /** Class for room co-living group badge */
  sameAccommodation: string;
  /** Class for multiple distinct accommodations badge */
  differentAccommodation: string;
  /** Border styling for pin badges */
  border: string;
  /** Box shadow for pin badges */
  shadow: string;
}

export interface MapClusterTheme {
  /** Background class for macro-cluster button */
  background: string;
  /** Text color class */
  textColor: string;
  /** Border styling */
  border: string;
  /** Shadow styling */
  shadow: string;
  /** Focus / hover halo ring */
  ring: string;
}

export interface MapThemeConfig {
  tiles: MapTileTheme;
  pin: MapPinTheme;
  badge: MapBadgeTheme;
  cluster: MapClusterTheme;
}

/**
 * Default Colivi Warm & Friendly Map Theme
 */
export const MAP_THEME: MapThemeConfig = {
  tiles: {
    url: 'https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png',
    attribution:
      '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, Tiles by <a href="https://www.hotosm.org/">HOT</a>',
    subdomains: 'abc',
    minZoom: 3,
    maxZoom: 19,
  },
  pin: {
    dropFill: 'fill-primary-container',
    strokeDefault: 'stroke-white stroke-[2px]',
    strokeSelected: 'stroke-white stroke-[3px]',
    strokeGroupSameAcc: 'stroke-white stroke-[2.5px]',
    iconColor: '#ffffff',
    shadow: 'drop-shadow-md',
  },
  badge: {
    sameAccommodation: 'bg-tertiary text-white',
    differentAccommodation: 'bg-primary-container text-white',
    border: 'border-2 border-white',
    shadow: 'shadow-md',
  },
  cluster: {
    background: 'bg-primary-container',
    textColor: 'text-white',
    border: 'border-2 border-white',
    shadow: 'shadow-md',
    ring: 'ring-2 ring-primary-container/20 hover:ring-primary-container/40',
  },
};
