import { useRef, useState } from 'react';
import { Upload, X, Loader2, ImageIcon } from 'lucide-react';
import clsx from 'clsx';
import { accommodationService } from '../../api/accommodationService';
import type { AccommodationImageResponse } from '../../types/accommodation.types';

// ── Props ────────────────────────────────────────────────────────────

interface ImageUploaderProps {
  accommodationId: string;
  images: AccommodationImageResponse[];
  onImagesChange: (images: AccommodationImageResponse[]) => void;
}

// ── Component ────────────────────────────────────────────────────────

/**
 * Drag-and-drop image uploader for an Accommodation.
 * Uploads files one by one to POST /api/v1/accommodation/:id/images
 * and updates the parent with the resulting image list.
 */
export const ImageUploader = ({
  accommodationId,
  images,
  onImagesChange,
}: ImageUploaderProps) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const uploadFiles = async (files: FileList | File[]) => {
    setError(null);
    setUploading(true);

    let latestImages = [...images];
    const fileArray = Array.from(files);

    for (const file of fileArray) {
      try {
        const updated = await accommodationService.uploadImage(accommodationId, file);
        latestImages = updated.images;
        onImagesChange(updated.images);
      } catch {
        setError(`Error al subir "${file.name}". Inténtalo de nuevo.`);
        break;
      }
    }

    onImagesChange(latestImages);
    setUploading(false);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.length) uploadFiles(e.target.files);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files?.length) uploadFiles(e.dataTransfer.files);
  };

  const handleDelete = async (imageId: string) => {
    try {
      await accommodationService.deleteImage(accommodationId, imageId);
      onImagesChange(images.filter((img) => img.id !== imageId));
    } catch {
      setError('No se pudo eliminar la imagen.');
    }
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Drop zone */}
      <div
        id="image-dropzone"
        role="button"
        tabIndex={0}
        onClick={() => inputRef.current?.click()}
        onKeyDown={(e) => e.key === 'Enter' && inputRef.current?.click()}
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        className={clsx(
          'flex flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed p-8 cursor-pointer transition-colors',
          isDragging
            ? 'border-primary bg-primary-fixed/10'
            : 'border-outline-variant bg-surface-container hover:border-primary hover:bg-surface-container-high',
        )}
      >
        {uploading ? (
          <Loader2 size={32} className="animate-spin text-primary" />
        ) : (
          <Upload size={32} className="text-on-surface-variant" />
        )}
        <p className="text-label-md font-label-md text-on-surface-variant text-center">
          {uploading
            ? 'Subiendo imágenes...'
            : 'Arrastra fotos aquí o haz clic para seleccionar'}
        </p>
        <p className="text-label-sm font-label-sm text-on-surface-variant/60">
          JPG, PNG, WEBP — Máx. 10 MB por imagen
        </p>
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={handleFileChange}
          disabled={uploading}
        />
      </div>

      {/* Error */}
      {error && (
        <p className="text-label-sm font-label-sm text-error">{error}</p>
      )}

      {/* Uploaded images grid */}
      {images.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {images.map((img) => (
            <div
              key={img.id}
              className="relative group rounded-lg overflow-hidden aspect-square bg-surface-container"
            >
              <img
                src={img.imageUrl}
                alt={`Imagen ${img.displayOrder + 1}`}
                className="w-full h-full object-cover"
              />
              <button
                type="button"
                id={`delete-img-${img.id}`}
                onClick={() => handleDelete(img.id)}
                className="absolute top-1 right-1 rounded-full bg-error text-on-error p-1
                  opacity-0 group-hover:opacity-100 transition-opacity shadow"
                aria-label="Eliminar imagen"
              >
                <X size={14} />
              </button>
            </div>
          ))}
        </div>
      )}

      {images.length === 0 && !uploading && (
        <div className="flex items-center gap-2 text-label-sm font-label-sm text-on-surface-variant/60">
          <ImageIcon size={16} />
          Aún no has subido ninguna foto. Las imágenes ayudan a atraer más inquilinos.
        </div>
      )}
    </div>
  );
};
