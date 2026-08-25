import React, { useState, useEffect, useCallback } from 'react';
import { Image as ImageIcon, ChevronLeft, ChevronRight, X, Grid, Maximize2 } from 'lucide-react';
import type { AccommodationImageResponse } from '../../types/accommodation.types';

export interface ListingGalleryProps {
  images: AccommodationImageResponse[];
  title: string;
}

/**
 * Gallery component for displaying listing photos with:
 * 1. Interactive in-page photo carousel with direct Next/Prev controls and thumbnail strip.
 * 2. Bento grid on large screens.
 * 3. Fullscreen Lightbox with thumbnail navigation, keyboard support, and zoom.
 * Single Responsibility: Comprehensive photo visualization and navigation.
 */
export const ListingGallery: React.FC<ListingGalleryProps> = ({ images, title }) => {
  const [activeHeroIndex, setActiveHeroIndex] = useState<number>(0);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  const sortedImages = [...images].sort((a, b) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0));
  const total = sortedImages.length;
  const hasImages = total > 0;

  const handleHeroPrev = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    setActiveHeroIndex((prev) => (prev - 1 + total) % total);
  };

  const handleHeroNext = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    setActiveHeroIndex((prev) => (prev + 1) % total);
  };

  const openLightbox = (index: number) => setLightboxIndex(index);
  const closeLightbox = () => setLightboxIndex(null);

  const handleLightboxPrev = useCallback(() => {
    setLightboxIndex((prev) => (prev !== null ? (prev - 1 + total) % total : null));
  }, [total]);

  const handleLightboxNext = useCallback(() => {
    setLightboxIndex((prev) => (prev !== null ? (prev + 1) % total : null));
  }, [total]);

  // Keyboard navigation for Lightbox
  useEffect(() => {
    if (lightboxIndex === null) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') {
        handleLightboxPrev();
      } else if (e.key === 'ArrowRight') {
        handleLightboxNext();
      } else if (e.key === 'Escape') {
        closeLightbox();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [lightboxIndex, handleLightboxPrev, handleLightboxNext]);

  if (!hasImages) {
    return (
      <div className="w-full h-72 md:h-96 rounded-2xl bg-surface-container-low border border-outline-variant flex flex-col items-center justify-center text-on-surface-variant gap-3">
        <ImageIcon size={48} className="opacity-40" />
        <span className="text-body-md font-medium">No hay fotos disponibles para este anuncio</span>
      </div>
    );
  }

  // 1 Single image layout
  if (total === 1) {
    return (
      <>
        <div
          onClick={() => openLightbox(0)}
          className="relative w-full h-80 md:h-[480px] rounded-3xl overflow-hidden cursor-pointer group shadow-sm border border-outline-variant bg-surface-container-low"
        >
          <img
            src={sortedImages[0].imageUrl}
            alt={title}
            className="w-full h-full object-cover group-hover:scale-102 transition-transform duration-500"
          />
          <div className="absolute inset-0 bg-black/10 opacity-0 group-hover:opacity-100 transition-opacity" />
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              openLightbox(0);
            }}
            className="absolute bottom-4 right-4 flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-black/60 backdrop-blur-md text-white text-xs font-semibold hover:bg-black/80 transition-all cursor-pointer shadow-md"
          >
            <Maximize2 size={13} />
            <span>Pantalla completa</span>
          </button>
        </div>

        {lightboxIndex !== null && (
          <LightboxModal
            images={sortedImages}
            currentIndex={lightboxIndex}
            onClose={closeLightbox}
            onSelectIndex={setLightboxIndex}
            onPrev={handleLightboxPrev}
            onNext={handleLightboxNext}
            title={title}
          />
        )}
      </>
    );
  }

  return (
    <>
      <div className="flex flex-col gap-3">
        {/* Main Display Container */}
        <div className="relative w-full rounded-3xl overflow-hidden shadow-sm border border-outline-variant bg-surface-container-low">
          {/* Bento Grid on Medium+ screens if >= 3 images */}
          {total >= 3 ? (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-2 h-80 md:h-[460px]">
              {/* Main Hero Photo */}
              <div
                onClick={() => openLightbox(activeHeroIndex)}
                className="md:col-span-2 relative h-full overflow-hidden cursor-pointer group bg-surface-container"
              >
                <img
                  src={sortedImages[activeHeroIndex].imageUrl}
                  alt={`${title} - Foto ${activeHeroIndex + 1}`}
                  className="w-full h-full object-cover group-hover:scale-102 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-black/10 opacity-0 group-hover:opacity-100 transition-opacity" />

                {/* In-Hero Navigation Controls */}
                <button
                  type="button"
                  onClick={handleHeroPrev}
                  aria-label="Foto anterior"
                  className="absolute left-3 top-1/2 -translate-y-1/2 z-10 p-2 rounded-full bg-black/40 hover:bg-black/70 text-white backdrop-blur-sm transition-all cursor-pointer hover:scale-110 active:scale-95 shadow-md"
                >
                  <ChevronLeft size={20} />
                </button>

                <button
                  type="button"
                  onClick={handleHeroNext}
                  aria-label="Foto siguiente"
                  className="absolute right-3 top-1/2 -translate-y-1/2 z-10 p-2 rounded-full bg-black/40 hover:bg-black/70 text-white backdrop-blur-sm transition-all cursor-pointer hover:scale-110 active:scale-95 shadow-md"
                >
                  <ChevronRight size={20} />
                </button>

                {/* Hero Counter pill */}
                <span className="absolute bottom-3 left-3 bg-black/60 backdrop-blur-md text-white text-xs font-semibold px-2.5 py-1 rounded-lg shadow-sm">
                  {activeHeroIndex + 1} / {total}
                </span>
              </div>

              {/* Secondary Grid Photos */}
              <div className="hidden md:grid md:col-span-2 grid-cols-2 gap-2 h-full">
                {sortedImages.slice(1, 5).map((img, idx) => {
                  const actualIndex = idx + 1;
                  return (
                    <div
                      key={img.id || actualIndex}
                      onClick={() => openLightbox(actualIndex)}
                      className="relative h-full overflow-hidden cursor-pointer group bg-surface-container"
                    >
                      <img
                        src={img.imageUrl}
                        alt={`${title} - Foto ${actualIndex + 1}`}
                        className="w-full h-full object-cover group-hover:scale-103 transition-transform duration-500"
                      />
                      <div className="absolute inset-0 bg-black/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            /* 2 Images Layout */
            <div className="relative h-80 md:h-[460px] overflow-hidden group bg-surface-container">
              <img
                src={sortedImages[activeHeroIndex].imageUrl}
                alt={`${title} - Foto ${activeHeroIndex + 1}`}
                onClick={() => openLightbox(activeHeroIndex)}
                className="w-full h-full object-cover cursor-pointer group-hover:scale-102 transition-transform duration-500"
              />
              <div className="absolute inset-0 bg-black/10 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />

              {/* Navigation Controls */}
              <button
                type="button"
                onClick={handleHeroPrev}
                aria-label="Foto anterior"
                className="absolute left-3 top-1/2 -translate-y-1/2 z-10 p-2.5 rounded-full bg-black/40 hover:bg-black/70 text-white backdrop-blur-sm transition-all cursor-pointer hover:scale-110 active:scale-95 shadow-md"
              >
                <ChevronLeft size={22} />
              </button>

              <button
                type="button"
                onClick={handleHeroNext}
                aria-label="Foto siguiente"
                className="absolute right-3 top-1/2 -translate-y-1/2 z-10 p-2.5 rounded-full bg-black/40 hover:bg-black/70 text-white backdrop-blur-sm transition-all cursor-pointer hover:scale-110 active:scale-95 shadow-md"
              >
                <ChevronRight size={22} />
              </button>

              <span className="absolute bottom-3 left-3 bg-black/60 backdrop-blur-md text-white text-xs font-semibold px-2.5 py-1 rounded-lg shadow-sm">
                {activeHeroIndex + 1} / {total}
              </span>
            </div>
          )}

          {/* View all photos trigger */}
          <button
            type="button"
            onClick={() => openLightbox(activeHeroIndex)}
            className="absolute bottom-4 right-4 flex items-center gap-2 px-3.5 py-2 rounded-xl bg-surface-container-lowest/90 backdrop-blur-md text-on-surface text-xs font-bold shadow-md border border-outline-variant hover:bg-surface-container-lowest hover:scale-105 active:scale-95 transition-all cursor-pointer z-10"
          >
            <Grid size={15} />
            <span>Ver todas ({total})</span>
          </button>
        </div>

        {/* Thumbnail Navigation Strip below Gallery */}
        {total > 1 && (
          <div className="flex items-center gap-2.5 overflow-x-auto py-1 px-0.5 no-scrollbar">
            {sortedImages.map((img, idx) => (
              <button
                key={img.id || idx}
                type="button"
                onClick={() => {
                  setActiveHeroIndex(idx);
                }}
                className={`relative w-16 h-16 sm:w-20 sm:h-20 rounded-xl overflow-hidden flex-shrink-0 border-2 transition-all cursor-pointer ${
                  idx === activeHeroIndex
                    ? 'border-primary ring-2 ring-primary/30 scale-102 shadow-sm'
                    : 'border-outline-variant/60 opacity-60 hover:opacity-100 hover:border-outline'
                }`}
              >
                <img
                  src={img.imageUrl}
                  alt={`Miniatura ${idx + 1}`}
                  className="w-full h-full object-cover"
                />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Lightbox Modal */}
      {lightboxIndex !== null && (
        <LightboxModal
          images={sortedImages}
          currentIndex={lightboxIndex}
          onClose={closeLightbox}
          onSelectIndex={setLightboxIndex}
          onPrev={handleLightboxPrev}
          onNext={handleLightboxNext}
          title={title}
        />
      )}
    </>
  );
};

// ── Fullscreen Lightbox Modal ──────────────────────────────────────────────────

interface LightboxModalProps {
  images: AccommodationImageResponse[];
  currentIndex: number;
  onClose: () => void;
  onSelectIndex: (index: number) => void;
  onPrev: () => void;
  onNext: () => void;
  title: string;
}

const LightboxModal: React.FC<LightboxModalProps> = ({
  images,
  currentIndex,
  onClose,
  onSelectIndex,
  onPrev,
  onNext,
  title,
}) => {
  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 bg-black/95 backdrop-blur-md flex flex-col items-center justify-between p-4 animate-in fade-in duration-200"
      onClick={onClose}
    >
      {/* Top bar */}
      <div className="w-full max-w-6xl flex items-center justify-between text-white z-10 py-2">
        <span className="text-sm font-semibold tracking-wide bg-white/10 px-3 py-1 rounded-full backdrop-blur-sm">
          {currentIndex + 1} / {images.length}
        </span>
        <button
          type="button"
          onClick={onClose}
          aria-label="Cerrar vista de fotos"
          className="p-2.5 rounded-full bg-white/10 hover:bg-white/25 text-white transition-colors cursor-pointer"
        >
          <X size={22} />
        </button>
      </div>

      {/* Center Hero Image & Navigation Controls */}
      <div className="relative w-full max-w-5xl flex-1 flex items-center justify-center my-auto">
        {images.length > 1 && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onPrev();
            }}
            aria-label="Foto anterior"
            className="absolute left-2 md:left-4 z-10 p-3.5 rounded-full bg-white/15 hover:bg-white/30 text-white backdrop-blur-md transition-all cursor-pointer hover:scale-110 active:scale-95 shadow-xl"
          >
            <ChevronLeft size={30} />
          </button>
        )}

        <img
          src={images[currentIndex].imageUrl}
          alt={`${title} - Foto ${currentIndex + 1}`}
          className="max-h-[75vh] max-w-full object-contain rounded-2xl shadow-2xl select-none"
          onClick={(e) => e.stopPropagation()}
        />

        {images.length > 1 && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onNext();
            }}
            aria-label="Foto siguiente"
            className="absolute right-2 md:right-4 z-10 p-3.5 rounded-full bg-white/15 hover:bg-white/30 text-white backdrop-blur-md transition-all cursor-pointer hover:scale-110 active:scale-95 shadow-xl"
          >
            <ChevronRight size={30} />
          </button>
        )}
      </div>

      {/* Bottom Thumbnail Strip */}
      {images.length > 1 && (
        <div
          className="w-full max-w-4xl flex items-center justify-center gap-2.5 overflow-x-auto py-2 z-10 no-scrollbar"
          onClick={(e) => e.stopPropagation()}
        >
          {images.map((img, idx) => (
            <button
              key={img.id || idx}
              type="button"
              onClick={() => onSelectIndex(idx)}
              className={`relative w-14 h-14 sm:w-16 sm:h-16 rounded-xl overflow-hidden flex-shrink-0 border-2 transition-all cursor-pointer ${
                idx === currentIndex
                  ? 'border-primary ring-2 ring-primary/40 scale-105 shadow-md'
                  : 'border-white/20 opacity-40 hover:opacity-100 hover:border-white/60'
              }`}
            >
              <img src={img.imageUrl} alt="" className="w-full h-full object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
