import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import type { ReportItem, ReportStatus } from '../../types/admin.types';
import { adminReportService } from '../../services/adminReportService';
import { adminListingService } from '../../services/adminListingService';
import { adminUserService } from '../../services/adminUserService';
import type { AccommodationListing } from '../../../housing/types/listing.types';
import type { AdminUserProfile } from '../../types/admin.types';
import { CopyIdButton } from '../common/CopyIdButton';
import { AdminConfirmModal } from '../common/AdminConfirmModal';
import {
  X,
  FileText,
  AlertCircle,
  CheckCircle2,
  CheckCheck,
  Clock,
  Ban,
  RotateCcw,
  Trash2,
  User,
  Home,
  ExternalLink,
} from 'lucide-react';

interface AdminReportDetailModalProps {
  report: ReportItem | null;
  isOpen: boolean;
  onClose: () => void;
  onStatusUpdate: (id: string, status: ReportStatus, adminNotes: string) => Promise<void>;
  onInspectListing?: (listingId: string) => void;
  onInspectUser?: (userId: string) => void;
}

export const AdminReportDetailModal: React.FC<AdminReportDetailModalProps> = ({
  report,
  isOpen,
  onClose,
  onStatusUpdate,
  onInspectListing,
  onInspectUser,
}) => {
  const [adminNotes, setAdminNotes] = useState<string>('');
  const [isUpdating, setIsUpdating] = useState<boolean>(false);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  // In-app Confirmation modal state
  const [confirmModal, setConfirmModal] = useState<{
    type: 'BAN' | 'UNBAN' | 'HARD_DELETE' | 'RESOLVE_ALL';
    title: string;
    message: string;
    confirmText: string;
    variant: 'warning' | 'danger';
  } | null>(null);
  const [isExecutingAction, setIsExecutingAction] = useState<boolean>(false);

  // Target details
  const [targetListing, setTargetListing] = useState<AccommodationListing | null>(null);
  const [targetUser, setTargetUser] = useState<AdminUserProfile | null>(null);
  const [isLoadingTarget, setIsLoadingTarget] = useState<boolean>(false);

  useEffect(() => {
    if (report) {
      setAdminNotes(report.adminNotes || '');
      setActionSuccess(null);
      setActionError(null);
      setConfirmModal(null);

      // Load target summary preview
      setIsLoadingTarget(true);
      if (report.targetType === 'LISTING') {
        adminListingService
          .getListingById(report.targetId)
          .then(setTargetListing)
          .catch(() => setTargetListing(null))
          .finally(() => setIsLoadingTarget(false));
      } else if (report.targetType === 'USER') {
        adminUserService
          .getAdminUserProfile(report.targetId)
          .then(setTargetUser)
          .catch(() => setTargetUser(null))
          .finally(() => setIsLoadingTarget(false));
      }
    }
  }, [report]);

  // Handle ESC key to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen && !confirmModal) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, confirmModal, onClose]);

  if (!isOpen || !report || typeof document === 'undefined') return null;

  const handleStatusChange = async (newStatus: ReportStatus) => {
    setIsUpdating(true);
    setActionError(null);
    setActionSuccess(null);
    try {
      await onStatusUpdate(report.id, newStatus, adminNotes);
      setActionSuccess(`Estado actualizado a ${newStatus} correctamente.`);
    } catch (err: any) {
      setActionError(err.message || 'Error al actualizar estado.');
    } finally {
      setIsUpdating(false);
    }
  };

  const isTargetBanned =
    report.targetType === 'LISTING'
      ? targetListing?.status === 'BANNED'
      : !!targetUser?.bannedAt;

  const handleOpenBanConfirm = () => {
    setConfirmModal({
      type: 'BAN',
      title: `¿Confirmar suspensión y baneo de ${report.targetType === 'LISTING' ? 'este anuncio' : 'este usuario'}?`,
      message: `Esta acción sancionará al ${report.targetType === 'LISTING' ? 'anuncio ocultándolo inmediatamente de la plataforma' : 'usuario bloqueando su cuenta'} y resolverá automáticamente en cascada todas las denuncias abiertas asociadas a este objetivo.`,
      confirmText: 'Sí, banear y resolver denuncias',
      variant: 'warning',
    });
  };

  const handleOpenResolveAllConfirm = () => {
    setConfirmModal({
      type: 'RESOLVE_ALL',
      title: `¿Resolver todas las denuncias abiertas de este ${report.targetType === 'LISTING' ? 'anuncio' : 'usuario'}?`,
      message: 'Todas las denuncias pendientes o en investigación vinculadas a este objetivo pasarán al estado RESUELTA.',
      confirmText: 'Sí, resolver todas en bloque',
      variant: 'warning',
    });
  };

  const handleOpenUnbanConfirm = () => {
    setConfirmModal({
      type: 'UNBAN',
      title: `¿Confirmar desbaneo de ${report.targetType === 'LISTING' ? 'este anuncio' : 'este usuario'}?`,
      message: `Esta acción restaurará el ${report.targetType === 'LISTING' ? 'anuncio haciéndolo visible de nuevo en la plataforma' : 'usuario permitiéndole iniciar sesión nuevamente'}.`,
      confirmText: 'Sí, desbanear objetivo',
      variant: 'warning',
    });
  };

  const handleOpenDeleteConfirm = () => {
    setConfirmModal({
      type: 'HARD_DELETE',
      title: `¿Eliminar permanentemente ${report.targetType === 'LISTING' ? 'el anuncio' : 'el usuario'}?`,
      message: `¡ATENCIÓN! Esta acción ejecutará un borrado físico (Hard Delete) irreversible en la base de datos eliminando todos sus datos asociados.`,
      confirmText: 'Sí, eliminar definitivamente',
      variant: 'danger',
    });
  };

  const handleConfirmAction = async () => {
    if (!confirmModal) return;
    setIsExecutingAction(true);
    setActionError(null);
    setActionSuccess(null);
    try {
      if (confirmModal.type === 'BAN') {
        if (report.targetType === 'LISTING') {
          await adminListingService.banListing(report.targetId);
          setTargetListing((prev) => (prev ? { ...prev, status: 'BANNED' } : null));
        } else {
          await adminUserService.banUser(report.targetId, {
            message: adminNotes || 'Baneado por infracción de normas tras denuncia.',
          });
          setTargetUser((prev) =>
            prev
              ? {
                  ...prev,
                  bannedAt: new Date().toISOString(),
                  banReason: adminNotes || 'Baneado tras denuncia',
                }
              : null
          );
        }

        // Cascada automática: Resolver todas las denuncias abiertas del objetivo
        const resolutionNotes =
          adminNotes ||
          `Resuelto automáticamente tras sanción y baneo del ${report.targetType === 'LISTING' ? 'anuncio' : 'usuario'}.`;
        await adminReportService.resolveAllReportsForTarget(report.targetId, {
          status: 'RESOLVED',
          adminNotes: resolutionNotes,
        });
        await onStatusUpdate(report.id, 'RESOLVED', resolutionNotes);
        setActionSuccess(
          `${report.targetType === 'LISTING' ? 'Anuncio' : 'Usuario'} baneado y todas sus denuncias abiertas resueltas con éxito.`
        );
      } else if (confirmModal.type === 'RESOLVE_ALL') {
        const resolutionNotes = adminNotes || 'Resolución masiva de todas las denuncias abiertas del objetivo.';
        await adminReportService.resolveAllReportsForTarget(report.targetId, {
          status: 'RESOLVED',
          adminNotes: resolutionNotes,
        });
        await onStatusUpdate(report.id, 'RESOLVED', resolutionNotes);
        setActionSuccess('Todas las denuncias abiertas de este objetivo han sido resueltas en cascada.');
      } else if (confirmModal.type === 'UNBAN') {
        if (report.targetType === 'LISTING') {
          await adminListingService.unbanListing(report.targetId);
          setTargetListing((prev) => (prev ? { ...prev, status: 'AVAILABLE', bannedAt: undefined } : null));
          setActionSuccess('Anuncio desbaneado con éxito.');
        } else {
          await adminUserService.unbanUser(report.targetId);
          setTargetUser((prev) =>
            prev
              ? {
                  ...prev,
                  bannedAt: null,
                  banReason: null,
                }
              : null
          );
          setActionSuccess('Usuario desbaneado con éxito.');
        }
      } else if (confirmModal.type === 'HARD_DELETE') {
        if (report.targetType === 'LISTING') {
          await adminListingService.hardDeleteListing(report.targetId);
          setTargetListing(null);
          setActionSuccess('Anuncio eliminado permanentemente.');
        } else {
          await adminUserService.deleteUserHard(report.targetId);
          setTargetUser(null);
          setActionSuccess('Usuario eliminado permanentemente.');
        }
      }
      setConfirmModal(null);
    } catch (err: any) {
      setActionError(err.message || 'Error al ejecutar la acción.');
    } finally {
      setIsExecutingAction(false);
    }
  };

  const getStatusBadge = (st: ReportStatus) => {
    switch (st) {
      case 'PENDING':
        return <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-amber-100 text-amber-800 border border-amber-200">Pendiente</span>;
      case 'INVESTIGATING':
        return <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800 border border-blue-200">En Investigación</span>;
      case 'RESOLVED':
        return <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">Resuelta</span>;
      case 'DISMISSED':
        return <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-slate-100 text-slate-700 border border-slate-200">Desestimada</span>;
      default:
        return <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-700">{st}</span>;
    }
  };

  const getReasonLabel = (reason: string) => {
    switch (reason) {
      case 'FRAUD':
        return 'Fraude / Falso';
      case 'SPAM':
        return 'Spam';
      case 'HARASSMENT':
        return 'Acoso / Hostilidad';
      case 'INAPPROPRIATE_CONTENT':
        return 'Contenido Inapropiado';
      case 'OTHER':
        return 'Otro';
      default:
        return reason;
    }
  };

  return createPortal(
    <>
      <div
        role="dialog"
        aria-modal="true"
        className="fixed inset-0 z-50 bg-[#0b1c30]/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200"
        onClick={onClose}
      >
        <div
          className="w-full max-w-2xl lg:max-w-3xl max-h-[90vh] bg-white rounded-3xl border border-[#dec0b7] shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-150"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header (Fijo) */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-[#dec0b7] bg-[#FAF8F5] shrink-0">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-[#9f3c16]/10 text-[#9f3c16] rounded-xl shrink-0">
                <FileText size={20} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-bold text-[#0b1c30]">Expediente de Denuncia</h3>
                  {getStatusBadge(report.status)}
                </div>
                <div className="mt-0.5">
                  <CopyIdButton id={report.id} prefix="ID:" />
                </div>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-[#565e74] hover:text-[#0b1c30] p-1.5 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
            >
              <X size={20} />
            </button>
          </div>

          {/* Feedback notices */}
          {actionSuccess && (
            <div className="mx-6 mt-4 p-3 bg-emerald-50 text-emerald-800 text-xs rounded-xl border border-emerald-200 flex items-center gap-2 shrink-0">
              <CheckCircle2 size={16} className="shrink-0 text-emerald-600" />
              <span>{actionSuccess}</span>
            </div>
          )}
          {actionError && (
            <div className="mx-6 mt-4 p-3 bg-red-50 text-red-800 text-xs rounded-xl border border-red-200 flex items-center gap-2 shrink-0">
              <AlertCircle size={16} className="shrink-0 text-red-600" />
              <span>{actionError}</span>
            </div>
          )}

          {/* Body (Scrollable) */}
          <div className="p-6 space-y-6 overflow-y-auto flex-1">
            {/* Grid Info: Fechas y Reporter */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 bg-[#f8f9ff] rounded-xl border border-slate-200">
              <div>
                <span className="text-xs text-[#565e74] block font-medium">Denunciante (Reporter ID)</span>
                <CopyIdButton id={report.reporterId} />
              </div>
              <div>
                <span className="text-xs text-[#565e74] block font-medium">Fecha de creación</span>
                <span className="text-xs text-[#0b1c30] font-semibold flex items-center gap-1.5 mt-0.5">
                  <Clock size={13} className="text-[#565e74]" />
                  {new Date(report.createdAt).toLocaleString('es-ES')}
                </span>
              </div>
            </div>

            {/* Reported Target Snapshot */}
            <div className="border border-slate-200 rounded-xl p-4 bg-white">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold text-[#0b1c30] uppercase tracking-wider flex items-center gap-1.5">
                  {report.targetType === 'LISTING' ? (
                    <>
                      <Home size={14} className="text-[#9f3c16]" />
                      Anuncio Denunciado
                    </>
                  ) : (
                    <>
                      <User size={14} className="text-[#9f3c16]" />
                      Usuario Denunciado
                    </>
                  )}
                </span>
                <CopyIdButton id={report.targetId} prefix="Target ID:" />
              </div>

              {isLoadingTarget ? (
                <div className="py-4 text-center text-xs text-[#565e74] animate-pulse">Cargando datos del objetivo...</div>
              ) : targetListing ? (
                <div className="flex flex-col sm:flex-row items-start gap-4">
                  {(targetListing.selectedImages && targetListing.selectedImages.length > 0) || ((targetListing as any).images && (targetListing as any).images.length > 0) ? (
                    <img
                      src={
                        targetListing.selectedImages?.[0]?.imageUrl ||
                        (targetListing.selectedImages?.[0] as any)?.url ||
                        (targetListing as any).images?.[0]?.url
                      }
                      alt={targetListing.title}
                      className="w-24 h-24 object-cover rounded-xl border border-slate-200 shrink-0"
                    />
                  ) : (
                    <div className="w-24 h-24 bg-slate-100 rounded-xl flex items-center justify-center text-slate-400 shrink-0">
                      <Home size={28} />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-bold text-[#0b1c30] truncate">{targetListing.title}</h4>
                    <p className="text-xs text-[#565e74] mt-0.5">
                      {typeof targetListing.accommodation?.city === 'string'
                        ? targetListing.accommodation.city
                        : typeof targetListing.accommodation?.address === 'string'
                        ? targetListing.accommodation.address
                        : (targetListing.accommodation?.address as any)?.city || 'Sin ciudad'}{' '}
                      • {targetListing.pricePerMonth ?? (targetListing as any).price} €/mes •{' '}
                      {targetListing.rentalType === 'ROOM' ? 'Habitación' : 'Piso Completo'}
                    </p>
                    <div className="flex items-center gap-2 mt-2">
                      <span
                        className={`text-[11px] font-semibold px-2 py-0.5 rounded ${
                          targetListing.status === 'BANNED'
                            ? 'bg-red-100 text-red-800'
                            : targetListing.status === 'AVAILABLE'
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        Estado:{' '}
                        {targetListing.status === 'AVAILABLE'
                          ? 'Disponible'
                          : targetListing.status === 'UNAVAILABLE'
                          ? 'No disponible'
                          : targetListing.status === 'BANNED'
                          ? 'Baneado'
                          : targetListing.status}
                      </span>
                      {onInspectListing && (
                        <button
                          onClick={() => onInspectListing(report.targetId)}
                          className="text-xs text-[#9f3c16] hover:underline font-semibold flex items-center gap-1 cursor-pointer"
                        >
                          Inspeccionar anuncio <ExternalLink size={12} />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ) : targetUser ? (
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-[#9f3c16] text-white flex items-center justify-center font-bold text-base shrink-0">
                    {targetUser.nickname?.charAt(0).toUpperCase() || 'U'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-bold text-[#0b1c30]">
                      {targetUser.firstName} {targetUser.lastName1} ({targetUser.nickname})
                    </h4>
                    <p className="text-xs text-[#565e74]">
                      {targetUser.email} • Rol:{' '}
                      {targetUser.role === 'ADMIN'
                        ? 'Administrador'
                        : targetUser.role === 'OWNER'
                        ? 'Propietario'
                        : 'Inquilino'}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      {targetUser.bannedAt ? (
                        <span className="text-[11px] font-semibold px-2 py-0.5 rounded bg-red-100 text-red-800">
                          BANEADO: {targetUser.banReason || 'Sin motivo especificado'}
                        </span>
                      ) : (
                        <span className="text-[11px] font-semibold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">
                          Activo
                        </span>
                      )}
                      {onInspectUser && (
                        <button
                          onClick={() => onInspectUser(report.targetId)}
                          className="text-xs text-[#9f3c16] hover:underline font-semibold flex items-center gap-1 cursor-pointer"
                        >
                          Inspeccionar usuario <ExternalLink size={12} />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                <p className="text-xs text-[#565e74]">No se pudo cargar el resumen del objetivo (o fue eliminado).</p>
              )}
            </div>

            {/* Motivo y Descripción */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-[#565e74]">Motivo:</span>
                <span className="text-xs font-bold px-2.5 py-0.5 bg-[#9f3c16]/10 text-[#9f3c16] rounded-md">
                  {getReasonLabel(report.reason)}
                </span>
              </div>
              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-[#0b1c30] whitespace-pre-wrap leading-relaxed">
                {report.description || 'El denunciante no proporcionó una descripción adicional.'}
              </div>
            </div>

            {/* Notas Administrativas */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-[#0b1c30]">Notas Administrativas de Resolución</label>
              <textarea
                rows={3}
                placeholder="Escribe las conclusiones de la moderación o medidas adoptadas..."
                value={adminNotes}
                onChange={(e) => setAdminNotes(e.target.value)}
                className="w-full text-xs bg-white border border-[#dec0b7] rounded-xl p-3 text-[#0b1c30] focus:ring-2 focus:ring-[#9f3c16]/20 focus:border-[#9f3c16]"
              />
            </div>

            {/* Acciones Directas de Moderación */}
            <div className="pt-3 border-t border-slate-200 space-y-3">
              <span className="text-xs font-bold text-[#565e74] uppercase tracking-wider block">
                Acciones Disciplinarias sobre el Objetivo
              </span>
              <div className="flex flex-wrap items-center gap-2.5">
                {isTargetBanned ? (
                  <button
                    type="button"
                    onClick={handleOpenUnbanConfirm}
                    className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl transition-colors shadow-xs cursor-pointer"
                  >
                    <RotateCcw size={14} />
                    <span>Desbanear {report.targetType === 'LISTING' ? 'Anuncio' : 'Usuario'}</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleOpenBanConfirm}
                    className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold bg-amber-600 hover:bg-amber-700 text-white rounded-xl transition-colors shadow-xs cursor-pointer"
                  >
                    <Ban size={14} />
                    <span>Banear {report.targetType === 'LISTING' ? 'Anuncio' : 'Usuario'}</span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={handleOpenDeleteConfirm}
                  className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold bg-red-700 hover:bg-red-800 text-white rounded-xl transition-colors shadow-xs cursor-pointer"
                >
                  <Trash2 size={14} />
                  <span>Borrado Físico (Hard Delete)</span>
                </button>
              </div>
            </div>
          </div>

          {/* Footer (Fijo) */}
          <div className="flex flex-wrap items-center justify-between gap-3 px-6 py-4 border-t border-[#dec0b7] bg-[#FAF8F5] shrink-0">
            <div className="flex items-center gap-2">
              <span className="text-xs text-[#565e74] font-medium">Estado del expediente:</span>
              <button
                type="button"
                disabled={isUpdating || report.status === 'INVESTIGATING'}
                onClick={() => handleStatusChange('INVESTIGATING')}
                className="px-3.5 py-1.5 text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition-colors disabled:opacity-40 cursor-pointer"
              >
                Investigar
              </button>
              <button
                type="button"
                disabled={isUpdating || report.status === 'RESOLVED'}
                onClick={() => handleStatusChange('RESOLVED')}
                className="px-3.5 py-1.5 text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl transition-colors disabled:opacity-40 cursor-pointer"
              >
                Resolver (esta)
              </button>
              <button
                type="button"
                disabled={isUpdating || report.status === 'DISMISSED'}
                onClick={() => handleStatusChange('DISMISSED')}
                className="px-3.5 py-1.5 text-xs font-semibold bg-slate-600 hover:bg-slate-700 text-white rounded-xl transition-colors disabled:opacity-40 cursor-pointer"
              >
                Desestimar
              </button>
            </div>

            <button
              type="button"
              disabled={isUpdating || isExecutingAction}
              onClick={handleOpenResolveAllConfirm}
              className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold bg-[#9f3c16] hover:bg-[#832f0e] text-white rounded-xl transition-colors shadow-xs disabled:opacity-40 cursor-pointer"
              title="Resuelve y cierra en bloque todas las denuncias abiertas de este objetivo"
            >
              <CheckCheck size={14} />
              <span>Resolver Todas del Objetivo</span>
            </button>
          </div>
        </div>
      </div>

      {/* Confirmation Modal */}
      {confirmModal && (
        <AdminConfirmModal
          isOpen={true}
          title={confirmModal.title}
          message={confirmModal.message}
          confirmText={confirmModal.confirmText}
          variant={confirmModal.variant}
          isLoading={isExecutingAction}
          onConfirm={handleConfirmAction}
          onClose={() => !isExecutingAction && setConfirmModal(null)}
        />
      )}
    </>,
    document.body
  );
};
