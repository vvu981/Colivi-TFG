import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { MapPin, Navigation } from 'lucide-react';
import { MAP_THEME } from '../map/mapTheme';

export interface ListingLocationMapProps {
  latitude: number;
  longitude: number;
  address: string;
  city: string;
  province?: string;
  country?: string;
}

/**
 * Interactive location map for listing details.
 * Single Responsibility: Interactive geographical location visualization.
 */
export const ListingLocationMap: React.FC<ListingLocationMapProps> = ({
  latitude,
  longitude,
  address,
  city,
  province,
  country,
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);

  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      const map = L.map(mapContainerRef.current, {
        center: [latitude, longitude],
        zoom: 15,
        zoomControl: true,
        scrollWheelZoom: false, // Prevent accidental scrolling when page scrolling
      });

      L.tileLayer(MAP_THEME.tiles.url, {
        attribution: MAP_THEME.tiles.attribution,
        maxZoom: MAP_THEME.tiles.maxZoom,
      }).addTo(map);

      // Custom Colivi Marker HTML
      const pinHtml = `
        <div style="
          width: 38px;
          height: 38px;
          border-radius: 50%;
          background: #9f3c16;
          border: 3px solid #ffffff;
          box-shadow: 0 4px 12px rgba(0,0,0,0.3);
          display: flex;
          align-items: center;
          justify-content: center;
          color: #ffffff;
        ">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/>
            <circle cx="12" cy="10" r="3"/>
          </svg>
        </div>
      `;

      const customIcon = L.divIcon({
        html: pinHtml,
        className: 'colivi-listing-detail-pin',
        iconSize: [38, 38],
        iconAnchor: [19, 38],
        popupAnchor: [0, -38],
      });

      L.marker([latitude, longitude], { icon: customIcon })
        .addTo(map)
        .bindPopup(`<b>${address}</b><br/>${city}`, { offset: [0, -20] });

      mapInstanceRef.current = map;
    } else {
      mapInstanceRef.current.setView([latitude, longitude], 15);
    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [latitude, longitude, address, city]);

  const fullLocation = [address, city, province, country].filter(Boolean).join(', ');

  const googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`;

  return (
    <section className="py-6 border-b border-outline-variant">
      <div className="flex items-center justify-between gap-4 mb-2 flex-wrap">
        <div>
          <h2 className="text-lg font-bold text-on-surface">Ubicación</h2>
          <p className="text-xs text-on-surface-variant mt-0.5">
            {fullLocation}
          </p>
        </div>

        <a
          href={googleMapsUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-outline-variant bg-surface-container-lowest text-xs font-semibold text-primary hover:bg-surface-container transition-all cursor-pointer shadow-xs"
        >
          <Navigation size={14} />
          <span>Cómo llegar</span>
        </a>
      </div>

      <div className="relative w-full h-72 md:h-80 rounded-2xl overflow-hidden border border-outline-variant shadow-sm mt-3">
        <div ref={mapContainerRef} className="w-full h-full isolate" />
        
        <div className="absolute bottom-3 left-3 z-[1000] px-3 py-1.5 rounded-lg bg-surface-container-lowest/90 backdrop-blur-sm border border-outline-variant text-[11px] text-on-surface flex items-center gap-1.5 shadow-sm">
          <MapPin size={14} className="text-primary flex-shrink-0" />
          <span className="font-medium truncate max-w-xs">{address}, {city}</span>
        </div>
      </div>
    </section>
  );
};
