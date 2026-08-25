import { useCallback, useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { MapPin, Search, Loader2 } from 'lucide-react';

// Fix Leaflet's default marker icon path issue with bundlers
delete (L.Icon.Default.prototype as unknown as Record<string, unknown>)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

// ── Nominatim geocoding ─────────────────────────────────────────────

interface NominatimResult {
  lat: string;
  lon: string;
  display_name: string;
}

const geocodeAddress = async (query: string): Promise<NominatimResult | null> => {
  const encoded = encodeURIComponent(query);
  const url = `https://nominatim.openstreetmap.org/search?q=${encoded}&format=json&limit=1`;
  const res = await fetch(url, {
    headers: { 'Accept-Language': 'es', 'User-Agent': 'Colivi-App/1.0' },
  });
  const data: NominatimResult[] = await res.json();
  return data[0] ?? null;
};

// ── Props ────────────────────────────────────────────────────────────

interface MapPickerProps {
  /** Address text to auto-geocode when the search button is pressed */
  addressQuery: string;
  /** Current coordinates (null if not set yet) */
  value: { lat: number; lng: number } | null;
  /** Called whenever the marker position changes */
  onChange: (coords: { lat: number; lng: number }) => void;
}

// ── Component ────────────────────────────────────────────────────────

/**
 * Interactive Leaflet map with Nominatim geocoding.
 * - "Buscar ubicación" auto-geocodes the address and drops a pin.
 * - If geocoding fails, the user can click the map to set coordinates manually.
 */
export const MapPicker = ({ addressQuery, value, onChange }: MapPickerProps) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);
  const [geocoding, setGeocoding] = useState(false);
  const [geocodeError, setGeocodeError] = useState<string | null>(null);

  // ── Helpers ─────────────────────────────────────────────────────
  const placeMarker = useCallback((map: L.Map, lat: number, lng: number) => {
    if (markerRef.current) {
      markerRef.current.setLatLng([lat, lng]);
    } else {
      markerRef.current = L.marker([lat, lng], { draggable: true }).addTo(map);
      markerRef.current.on('dragend', () => {
        const pos = markerRef.current!.getLatLng();
        onChange({ lat: pos.lat, lng: pos.lng });
      });
    }
  }, [onChange]);

  // ── Initialise map once ─────────────────────────────────────────
  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    const initialCenter: L.LatLngExpression = value
      ? [value.lat, value.lng]
      : [40.4168, -3.7038]; // Madrid as default

    const worldBounds: L.LatLngBoundsExpression = [
      [-85.051129, -180],
      [85.051129, 180],
    ];

    const map = L.map(mapContainerRef.current, {
      center: initialCenter,
      zoom: value ? 15 : 6,
      minZoom: 3,
      maxBounds: worldBounds,
      maxBoundsViscosity: 1.0,
      worldCopyJump: false,
      zoomAnimation: true,
      wheelDebounceTime: 40,
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution:
        '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      minZoom: 3,
      maxZoom: 19,
      noWrap: true,
      bounds: worldBounds,
      keepBuffer: 6,
      updateWhenZooming: false,
      updateWhenIdle: true,
    }).addTo(map);

    // Allow clicking the map to set/move the pin manually
    map.on('click', (e: L.LeafletMouseEvent) => {
      const { lat, lng } = e.latlng;
      placeMarker(map, lat, lng);
      onChange({ lat, lng });
    });

    if (value) {
      placeMarker(map, value.lat, value.lng);
    }

    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Keep marker in sync with external value changes ─────────────
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !value) return;
    placeMarker(map, value.lat, value.lng);
    map.setView([value.lat, value.lng], 15);
  }, [value, placeMarker]);

  // ── Geocode handler ─────────────────────────────────────────────
  const handleGeocode = async () => {
    if (!addressQuery.trim()) return;
    setGeocoding(true);
    setGeocodeError(null);

    try {
      const result = await geocodeAddress(addressQuery);
      if (result) {
        const lat = parseFloat(result.lat);
        const lng = parseFloat(result.lon);
        onChange({ lat, lng });
        setGeocodeError(null);
      } else {
        setGeocodeError(
          'No se encontró la dirección. Haz clic en el mapa para ubicarla manualmente.',
        );
      }
    } catch {
      setGeocodeError('Error al buscar la dirección. Haz clic en el mapa manualmente.');
    } finally {
      setGeocoding(false);
    }
  };

  // ── Render ──────────────────────────────────────────────────────
  return (
    <div className="flex flex-col gap-2">
      {/* Geocode button */}
      <button
        type="button"
        id="map-geocode-btn"
        onClick={handleGeocode}
        disabled={geocoding || !addressQuery.trim()}
        className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-on-primary text-label-md font-label-md
          disabled:opacity-50 disabled:cursor-not-allowed hover:opacity-90 transition-opacity w-fit"
      >
        {geocoding ? (
          <Loader2 size={16} className="animate-spin" />
        ) : (
          <Search size={16} />
        )}
        Buscar ubicación en el mapa
      </button>

      {/* Error / hint */}
      {geocodeError && (
        <p className="flex items-center gap-1 text-label-sm font-label-sm text-error">
          <MapPin size={13} />
          {geocodeError}
        </p>
      )}

      {!geocodeError && !value && (
        <p className="text-label-sm font-label-sm text-on-surface-variant">
          Rellena la dirección y pulsa "Buscar ubicación" o haz clic directamente en el mapa.
        </p>
      )}

      {value && (
        <p className="flex items-center gap-1.5 text-label-sm font-label-sm text-tertiary">
          <MapPin size={15} className="text-primary" />
          <span>{value.lat.toFixed(6)}, {value.lng.toFixed(6)} — Puedes arrastrar el marcador para ajustar.</span>
        </p>
      )}

      {/* Map container — `isolate` creates a new stacking context so Leaflet's
          internal z-indexes (400–600) are scoped here and never overlap the sticky header */}
      <div
        ref={mapContainerRef}
        id="accommodation-map"
        className="isolate w-full h-72 rounded-xl border border-outline-variant overflow-hidden"
      />
    </div>
  );
};
