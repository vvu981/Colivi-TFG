import React from 'react';
import type { AccommodationListing } from '../../../housing/types/listing.types';
import { CopyIdButton } from '../common/CopyIdButton';
import {
  Home,
  Eye,
  Ban,
  CheckCircle2,
  Trash2,
  RotateCcw,
  MapPin,
  Euro,
} from 'lucide-react';

interface AdminListingTableRowProps {
  item: AccommodationListing;
  onSelectListing: (listing: AccommodationListing) => void;
  onOpenUnbanConfirm: (listing: AccommodationListing) => void;
  onOpenBanConfirm: (id: string) => void;
  onRecoverListing: (id: string) => void;
  onOpenHardDeleteConfirm: (listing: AccommodationListing) => void;
}

const getStatusBadge = (status: string, isDeleted: boolean) => {
  if (isDeleted) {
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-surface-container text-secondary border border-outline-variant/60">
        Eliminado
      </span>
    );
  }
  switch (status) {
    case 'AVAILABLE':
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
          Disponible
        </span>
      );
    case 'UNAVAILABLE':
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-800 border border-amber-200">
          No disponible
        </span>
      );
    case 'BANNED':
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-error-container text-error border border-error/20">
          Baneado
        </span>
      );
    default:
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-surface text-secondary">
          {status}
        </span>
      );
  }
};

export const AdminListingTableRow: React.FC<AdminListingTableRowProps> = React.memo(
  ({
    item,
    onSelectListing,
    onOpenUnbanConfirm,
    onOpenBanConfirm,
    onRecoverListing,
    onOpenHardDeleteConfirm,
  }) => {
    const isBanned = item.status === 'BANNED';
    const isDeleted = !!item.deletedAt;
    const coverImage =
      item.selectedImages && item.selectedImages.length > 0
        ? item.selectedImages[0].imageUrl || (item.selectedImages[0] as any).url
        : (item as any).images && (item as any).images.length > 0
        ? (item as any).images[0].url
        : null;

    return (
      <tr
        onClick={() => onSelectListing(item)}
        className="hover:bg-surface-container-low cursor-pointer transition-colors"
      >
        {/* Thumbnail & Title */}
        <td className="p-3.5">
          <div className="flex items-center gap-3">
            {coverImage ? (
              <img
                src={coverImage}
                alt={item.title}
                className="w-12 h-12 rounded-xl object-cover border border-outline-variant/60 shrink-0"
              />
            ) : (
              <div className="w-12 h-12 rounded-xl bg-surface-container flex items-center justify-center text-secondary shrink-0">
                <Home size={20} />
              </div>
            )}
            <div className="min-w-0 max-w-[200px] sm:max-w-xs">
              <h4 className="font-bold text-xs text-on-surface truncate" title={item.title}>
                {item.title}
              </h4>
              <div className="mt-0.5" onClick={(e) => e.stopPropagation()}>
                <CopyIdButton id={item.id} prefix="ID:" truncate maxTruncateWidth="max-w-[100px]" />
              </div>
            </div>
          </div>
        </td>

        {/* Location */}
        <td className="p-3.5">
          <div className="flex items-center gap-1 text-xs text-on-surface">
            <MapPin size={13} className="text-secondary shrink-0" />
            <span>
              {typeof item.accommodation?.city === 'string'
                ? item.accommodation.city
                : typeof item.accommodation?.address === 'string'
                ? item.accommodation.address
                : (item.accommodation?.address as any)?.city || 'N/D'}
            </span>
          </div>
        </td>

        {/* Rental Type */}
        <td className="p-3.5">
          <span className="font-medium text-xs text-secondary">
            {item.rentalType === 'ROOM' ? 'Habitación' : 'Piso Completo'}
          </span>
        </td>

        {/* Price */}
        <td className="p-3.5">
          <span className="font-bold text-xs text-primary flex items-center">
            <Euro size={12} />
            {item.pricePerMonth ?? (item as any).price}
          </span>
        </td>

        {/* Status */}
        <td className="p-3.5">{getStatusBadge(item.status, isDeleted)}</td>

        {/* Action buttons */}
        <td className="p-3.5 text-right" onClick={(e) => e.stopPropagation()}>
          <div className="flex items-center justify-end gap-1.5">
            {isBanned ? (
              <button
                type="button"
                onClick={() => onOpenUnbanConfirm(item)}
                className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors border border-emerald-200 cursor-pointer"
                title="Desbanear anuncio"
              >
                <CheckCircle2 size={14} />
              </button>
            ) : (
              <button
                type="button"
                onClick={() => onOpenBanConfirm(item.id)}
                className="p-1.5 text-amber-600 hover:bg-amber-50 rounded-lg transition-colors border border-amber-200 cursor-pointer"
                title="Banear anuncio"
              >
                <Ban size={14} />
              </button>
            )}

            {isDeleted && (
              <button
                type="button"
                onClick={() => onRecoverListing(item.id)}
                className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors border border-blue-200 cursor-pointer"
                title="Recuperar anuncio"
              >
                <RotateCcw size={14} />
              </button>
            )}

            <button
              type="button"
              onClick={() => onOpenHardDeleteConfirm(item)}
              className="p-1.5 text-error hover:bg-error-container/40 rounded-lg transition-colors border border-error/20 cursor-pointer"
              title="Borrado físico"
            >
              <Trash2 size={14} />
            </button>

            <button
              type="button"
              onClick={() => onSelectListing(item)}
              className="p-1.5 text-secondary hover:text-primary hover:bg-surface-container rounded-lg transition-colors border border-outline-variant cursor-pointer"
              title="Ver detalles"
            >
              <Eye size={14} />
            </button>
          </div>
        </td>
      </tr>
    );
  }
);
