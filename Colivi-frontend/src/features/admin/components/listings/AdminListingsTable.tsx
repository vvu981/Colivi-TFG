import React, { useState } from 'react';
import type { AccommodationListing } from '../../../housing/types/listing.types';
import type { PageResponse } from '../../types/admin.types';
import { AdminListingDetailModal } from './AdminListingDetailModal';
import { CopyIdButton } from '../common/CopyIdButton';
import { AdminConfirmModal } from '../common/AdminConfirmModal';
import { Select } from '../../../../components/ui/Select';
import {
  Home,
  ChevronLeft,
  ChevronRight,
  Eye,
  Ban,
  CheckCircle2,
  Trash2,
  RotateCcw,
  MapPin,
  Euro,
} from 'lucide-react';

const pageSizeOptions = [
  { value: '10', label: '10 por página' },
  { value: '20', label: '20 por página' },
  { value: '50', label: '50 por página' },
];

interface AdminListingsTableProps {
  listings: AccommodationListing[];
  pageInfo: PageResponse<AccommodationListing> | null;
  page: number;
  size: number;
  isLoading: boolean;
  onPageChange: (page: number) => void;
  onSizeChange: (size: number) => void;
  onBanListing: (id: string) => Promise<void>;
  onUnbanListing: (id: string) => Promise<void>;
  onHardDeleteListing: (id: string) => Promise<void>;
  onRecoverListing: (id: string) => Promise<void>;
  onInspectUser?: (userId: string) => void;
}

export const AdminListingsTable: React.FC<AdminListingsTableProps> = ({
  listings,
  pageInfo,
  page,
  size,
  isLoading,
  onPageChange,
  onSizeChange,
  onBanListing,
  onUnbanListing,
  onHardDeleteListing,
  onRecoverListing,
  onInspectUser,
}) => {
  const [selectedListing, setSelectedListing] = useState<AccommodationListing | null>(null);
  const [confirmModal, setConfirmModal] = useState<{
    type: 'UNBAN' | 'HARD_DELETE';
    listingId: string;
    title: string;
    message: string;
    confirmText: string;
    variant: 'warning' | 'danger';
  } | null>(null);
  const [isProcessingAction, setIsProcessingAction] = useState<boolean>(false);

  const handleOpenUnbanConfirm = (listing: AccommodationListing) => {
    setConfirmModal({
      type: 'UNBAN',
      listingId: listing.id,
      title: '¿Desbanear este anuncio?',
      message: `Esta acción restaurará el anuncio "${listing.title}" haciéndolo visible y disponible nuevamente en las búsquedas públicas.`,
      confirmText: 'Sí, desbanear anuncio',
      variant: 'warning',
    });
  };

  const handleOpenHardDeleteConfirm = (listing: AccommodationListing) => {
    setConfirmModal({
      type: 'HARD_DELETE',
      listingId: listing.id,
      title: '¿Eliminar permanentemente este anuncio?',
      message: `¡PELIGRO! Esta acción ejecutará un borrado físico (Hard Delete) irreversible eliminando el anuncio "${listing.title}" y todos sus registros asociados.`,
      confirmText: 'Sí, eliminar definitivamente',
      variant: 'danger',
    });
  };

  const handleConfirmAction = async () => {
    if (!confirmModal) return;
    setIsProcessingAction(true);
    try {
      if (confirmModal.type === 'UNBAN') {
        await onUnbanListing(confirmModal.listingId);
      } else if (confirmModal.type === 'HARD_DELETE') {
        await onHardDeleteListing(confirmModal.listingId);
      }
      setConfirmModal(null);
    } catch (err) {
      console.error('Error executing listing action:', err);
      setConfirmModal(null);
    } finally {
      setIsProcessingAction(false);
    }
  };

  const getStatusBadge = (status: string, isDeleted: boolean) => {
    if (isDeleted) {
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-gray-100 text-gray-800 border border-gray-200">
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
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-red-50 text-red-800 border border-red-200">
            Baneado
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-slate-50 text-slate-800">
            {status}
          </span>
        );
    }
  };

  return (
    <div className="space-y-4">
      {/* Table Container */}
      <div className="bg-white rounded-xl border border-[#dec0b7] shadow-sm">
        <div className="overflow-x-auto rounded-t-xl">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#FAF8F5] text-[#565e74] uppercase text-[11px] font-bold border-b border-[#dec0b7] tracking-wider">
              <tr>
                <th className="p-3.5">Anuncio</th>
                <th className="p-3.5">Ubicación</th>
                <th className="p-3.5">Tipo</th>
                <th className="p-3.5">Precio</th>
                <th className="p-3.5">Estado</th>
                <th className="p-3.5 text-right">Acciones de Moderación</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-[#0b1c30]">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-[#565e74]">
                    <div className="inline-block w-6 h-6 border-2 border-[#9f3c16] border-t-transparent rounded-full animate-spin mb-2" />
                    <p className="text-xs">Cargando catálogo para moderación...</p>
                  </td>
                </tr>
              ) : listings.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-12 text-center text-[#565e74]">
                    <Home size={32} className="mx-auto text-slate-300 mb-2" />
                    <p className="text-sm font-semibold text-[#0b1c30]">No se encontraron anuncios</p>
                    <p className="text-xs text-[#565e74] mt-0.5">Prueba a cambiar los filtros de búsqueda.</p>
                  </td>
                </tr>
              ) : (
                listings.map((item) => {
                  const isBanned = item.status === 'BANNED';
                  const isDeleted = !!item.deletedAt;
                  const coverImage = (item.selectedImages && item.selectedImages.length > 0)
                    ? (item.selectedImages[0].imageUrl || (item.selectedImages[0] as any).url)
                    : (item as any).images && (item as any).images.length > 0
                      ? (item as any).images[0].url
                      : null;

                  return (
                    <tr
                      key={item.id}
                      onClick={() => setSelectedListing(item)}
                      className="hover:bg-[#f8f9ff] cursor-pointer transition-colors"
                    >
                      {/* Thumbnail & Title */}
                      <td className="p-3.5">
                        <div className="flex items-center gap-3">
                          {coverImage ? (
                            <img
                              src={coverImage}
                              alt={item.title}
                              className="w-12 h-12 rounded-lg object-cover border border-slate-200 shrink-0"
                            />
                          ) : (
                            <div className="w-12 h-12 rounded-lg bg-slate-100 flex items-center justify-center text-slate-400 shrink-0">
                              <Home size={20} />
                            </div>
                          )}
                          <div className="min-w-0 max-w-[200px] sm:max-w-xs">
                            <h4 className="font-bold text-xs text-[#0b1c30] truncate" title={item.title}>
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
                        <div className="flex items-center gap-1 text-xs text-[#0b1c30]">
                          <MapPin size={13} className="text-[#565e74] shrink-0" />
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
                        <span className="font-medium text-xs text-[#565e74]">
                          {item.rentalType === 'ROOM' ? 'Habitación' : 'Piso Completo'}
                        </span>
                      </td>

                      {/* Price */}
                      <td className="p-3.5">
                        <span className="font-bold text-xs text-[#9f3c16] flex items-center">
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
                              onClick={() => handleOpenUnbanConfirm(item)}
                              className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors border border-emerald-200 cursor-pointer"
                              title="Desbanear anuncio"
                            >
                              <CheckCircle2 size={14} />
                            </button>
                          ) : (
                            <button
                              onClick={() => onBanListing(item.id)}
                              className="p-1.5 text-amber-600 hover:bg-amber-50 rounded-lg transition-colors border border-amber-200 cursor-pointer"
                              title="Banear anuncio"
                            >
                              <Ban size={14} />
                            </button>
                          )}

                          {isDeleted && (
                            <button
                              onClick={() => onRecoverListing(item.id)}
                              className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors border border-blue-200 cursor-pointer"
                              title="Recuperar anuncio"
                            >
                              <RotateCcw size={14} />
                            </button>
                          )}

                          <button
                            onClick={() => handleOpenHardDeleteConfirm(item)}
                            className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors border border-red-200 cursor-pointer"
                            title="Borrado físico"
                          >
                            <Trash2 size={14} />
                          </button>

                          <button
                            onClick={() => setSelectedListing(item)}
                            className="p-1.5 text-[#565e74] hover:text-[#9f3c16] hover:bg-slate-100 rounded-lg transition-colors border border-slate-200"
                            title="Ver detalles"
                          >
                            <Eye size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        {pageInfo && pageInfo.totalPages > 0 && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-4 border-t border-[#dec0b7] bg-[#FAF8F5] text-xs text-[#565e74] rounded-b-xl">
            <div className="flex items-center gap-2">
              <span>Mostrar</span>
              <div className="w-36">
                <Select
                  value={String(size)}
                  onChange={(val) => onSizeChange(Number(val))}
                  options={pageSizeOptions}
                  direction="up"
                  className="text-xs py-1"
                />
              </div>
              <span>• Total: {pageInfo.totalElements} anuncios</span>
            </div>

            <div className="flex items-center gap-2">
              <span>
                Página <strong className="text-[#0b1c30]">{page + 1}</strong> de {pageInfo.totalPages}
              </span>
              <div className="flex items-center gap-1">
                <button
                  disabled={page === 0}
                  onClick={() => onPageChange(page - 1)}
                  className="p-1.5 border border-[#dec0b7] rounded-md bg-white hover:bg-slate-50 disabled:opacity-40 transition-colors"
                >
                  <ChevronLeft size={14} />
                </button>
                <button
                  disabled={page >= pageInfo.totalPages - 1}
                  onClick={() => onPageChange(page + 1)}
                  className="p-1.5 border border-[#dec0b7] rounded-md bg-white hover:bg-slate-50 disabled:opacity-40 transition-colors"
                >
                  <ChevronRight size={14} />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Listing Detail Modal */}
      <AdminListingDetailModal
        listing={selectedListing}
        isOpen={!!selectedListing}
        onClose={() => setSelectedListing(null)}
        onBan={onBanListing}
        onUnban={onUnbanListing}
        onRecover={onRecoverListing}
        onHardDelete={onHardDeleteListing}
        onInspectUser={onInspectUser}
      />

      {/* Confirmation Modal */}
      {confirmModal && (
        <AdminConfirmModal
          isOpen={true}
          title={confirmModal.title}
          message={confirmModal.message}
          confirmText={confirmModal.confirmText}
          variant={confirmModal.variant}
          isLoading={isProcessingAction}
          onConfirm={handleConfirmAction}
          onClose={() => !isProcessingAction && setConfirmModal(null)}
        />
      )}
    </div>
  );
};
