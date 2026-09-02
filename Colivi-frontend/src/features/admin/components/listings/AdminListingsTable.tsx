import React, { useState } from 'react';
import type { AccommodationListing } from '../../../housing/types/listing.types';
import type { PageResponse } from '../../types/admin.types';
import { AdminListingDetailModal } from './AdminListingDetailModal';
import { AdminListingTableRow } from './AdminListingTableRow';
import { AdminConfirmModal } from '../common/AdminConfirmModal';
import { Select } from '../../../../components/ui/Select';
import {
  Home,
  ChevronLeft,
  ChevronRight,
  AlertTriangle,
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
  const [actionError, setActionError] = useState<string | null>(null);
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
    setActionError(null);
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
    setActionError(null);
    setConfirmModal({
      type: 'HARD_DELETE',
      listingId: listing.id,
      title: '¿Eliminar permanentemente este anuncio?',
      message: `¡PELIGRO! Esta acción ejecutará un borrado físico (Hard Delete) irreversible eliminando el anuncio "${listing.title}" y todos sus registros asociados.`,
      confirmText: 'Sí, eliminar definitivamente',
      variant: 'danger',
    });
  };

  const handleBanDirectly = async (id: string) => {
    setActionError(null);
    try {
      await onBanListing(id);
    } catch (err: any) {
      setActionError(err.message || 'Error al banear el anuncio.');
    }
  };

  const handleRecoverDirectly = async (id: string) => {
    setActionError(null);
    try {
      await onRecoverListing(id);
    } catch (err: any) {
      setActionError(err.message || 'Error al recuperar el anuncio.');
    }
  };

  const handleConfirmAction = async () => {
    if (!confirmModal) return;
    setIsProcessingAction(true);
    setActionError(null);
    try {
      if (confirmModal.type === 'UNBAN') {
        await onUnbanListing(confirmModal.listingId);
      } else if (confirmModal.type === 'HARD_DELETE') {
        await onHardDeleteListing(confirmModal.listingId);
      }
      setConfirmModal(null);
    } catch (err: any) {
      setActionError(err.message || 'Error al ejecutar la acción sobre el anuncio.');
      setConfirmModal(null);
    } finally {
      setIsProcessingAction(false);
    }
  };

  return (
    <div className="space-y-4">
      {actionError && (
        <div className="p-3 bg-error-container text-on-error-container text-xs rounded-xl border border-error/20 flex items-center justify-between gap-2 animate-in fade-in duration-150">
          <div className="flex items-center gap-2">
            <AlertTriangle size={16} className="shrink-0 text-error" />
            <span>{actionError}</span>
          </div>
          <button
            onClick={() => setActionError(null)}
            className="text-xs font-bold hover:underline cursor-pointer"
          >
            Cerrar
          </button>
        </div>
      )}

      {/* Table Container */}
      <div className="bg-surface-container-lowest rounded-2xl border border-outline-variant shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-surface text-secondary uppercase text-[11px] font-bold border-b border-outline-variant tracking-wider">
              <tr>
                <th className="p-3.5">Anuncio</th>
                <th className="p-3.5">Ubicación</th>
                <th className="p-3.5">Tipo</th>
                <th className="p-3.5">Precio</th>
                <th className="p-3.5">Estado</th>
                <th className="p-3.5 text-right">Acciones de Moderación</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/30 text-on-surface">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-secondary">
                    <div className="inline-block w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin mb-2" />
                    <p className="text-xs">Cargando catálogo para moderación...</p>
                  </td>
                </tr>
              ) : listings.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-12 text-center text-secondary">
                    <Home size={32} className="mx-auto text-secondary/40 mb-2" />
                    <p className="text-sm font-semibold text-on-surface">No se encontraron anuncios</p>
                    <p className="text-xs text-secondary mt-0.5">Prueba a cambiar los filtros de búsqueda.</p>
                  </td>
                </tr>
              ) : (
                listings.map((item) => (
                  <AdminListingTableRow
                    key={item.id}
                    item={item}
                    onSelectListing={setSelectedListing}
                    onOpenUnbanConfirm={handleOpenUnbanConfirm}
                    onOpenBanConfirm={handleBanDirectly}
                    onRecoverListing={handleRecoverDirectly}
                    onOpenHardDeleteConfirm={handleOpenHardDeleteConfirm}
                  />
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        {pageInfo && pageInfo.totalPages > 0 && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-4 border-t border-outline-variant bg-surface text-xs text-secondary">
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
                Página <strong className="text-on-surface">{page + 1}</strong> de {pageInfo.totalPages}
              </span>
              <div className="flex items-center gap-1">
                <button
                  disabled={page === 0}
                  onClick={() => onPageChange(page - 1)}
                  className="p-1.5 border border-outline-variant rounded-lg bg-surface-container-lowest hover:bg-surface-container-low disabled:opacity-40 transition-colors cursor-pointer"
                >
                  <ChevronLeft size={14} />
                </button>
                <button
                  disabled={page >= pageInfo.totalPages - 1}
                  onClick={() => onPageChange(page + 1)}
                  className="p-1.5 border border-outline-variant rounded-lg bg-surface-container-lowest hover:bg-surface-container-low disabled:opacity-40 transition-colors cursor-pointer"
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
