import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import type { ReportItem, ReportStatus } from '../../types/admin.types';
import { adminReportService } from '../../services/adminReportService';
import { adminListingService } from '../../services/adminListingService';
import { adminUserService } from '../../services/adminUserService';
import { adminConversationService } from '../../services/adminConversationService';
import type { AccommodationListing } from '../../../housing/types/listing.types';
import type { AdminUserProfile, AdminConversationDossier, AdminUserSnippet } from '../../types/admin.types';
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
  MessageSquare,
} from 'lucide-react';

const formatUserFullName = (user?: { firstName?: string; lastName?: string; lastName1?: string; lastName2?: string; nickname?: string } | null, fallback = 'Usuario'): string => {
  if (!user) return fallback;
  const parts = [user.firstName, user.lastName || user.lastName1, user.lastName2].filter(Boolean);
  return parts.join(' ').trim() || user.nickname || fallback;
};

const getTargetDemonstrative = (type?: string): string => {
  switch (type) {
    case 'LISTING':
      return 'este anuncio';
    case 'USER':
      return 'este usuario';
    case 'CONVERSATION':
      return 'esta conversación';
    default:
      return 'este objetivo';
  }
};

const getTargetDefiniteArticle = (type?: string): string => {
  switch (type) {
    case 'LISTING':
      return 'el anuncio';
    case 'USER':
      return 'el usuario';
    case 'CONVERSATION':
      return 'la conversación';
    default:
      return 'el objetivo';
  }
};

const getTargetCapitalizedNoun = (type?: string): string => {
  switch (type) {
    case 'LISTING':
      return 'Anuncio';
    case 'USER':
      return 'Usuario';
    case 'CONVERSATION':
      return 'Conversación';
    default:
      return 'Objetivo';
  }
};

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
    targetUserId?: string;
  } | null>(null);
  const [isExecutingAction, setIsExecutingAction] = useState<boolean>(false);

  // Target details
  const [targetListing, setTargetListing] = useState<AccommodationListing | null>(null);
  const [targetUser, setTargetUser] = useState<AdminUserProfile | null>(null);
  const [targetConversation, setTargetConversation] = useState<AdminConversationDossier | null>(null);
  const [isLoadingTarget, setIsLoadingTarget] = useState<boolean>(false);

  useEffect(() => {
    if (report) {
      setAdminNotes(report.adminNotes || '');
      setActionSuccess(null);
      setActionError(null);
      setConfirmModal(null);
      setTargetListing(null);
      setTargetUser(null);
      setTargetConversation(null);

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
      } else if (report.targetType === 'CONVERSATION') {
        adminConversationService
          .getConversationDossier(report.targetId)
          .then(setTargetConversation)
          .catch(() => setTargetConversation(null))
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
      : report.targetType === 'USER'
      ? !!targetUser?.bannedAt
      : false;

  const handleOpenBanConfirm = () => {
    setConfirmModal({
      type: 'BAN',
      title: `¿Confirmar suspensión y baneo de ${getTargetDemonstrative(report.targetType)}?`,
      message:
        report.targetType === 'LISTING'
          ? 'Esta acción sancionará al anuncio ocultándolo inmediatamente de la plataforma y resolverá automáticamente en cascada todas las denuncias abiertas asociadas a este objetivo.'
          : 'Esta acción sancionará al usuario bloqueando su cuenta y resolverá automáticamente en cascada todas las denuncias abiertas asociadas a este objetivo.',
      confirmText: 'Sí, banear y resolver denuncias',
      variant: 'warning',
    });
  };

  const handleOpenResolveAllConfirm = () => {
    setConfirmModal({
      type: 'RESOLVE_ALL',
      title: `¿Resolver todas las denuncias abiertas de ${getTargetDemonstrative(report.targetType)}?`,
      message: 'Todas las denuncias pendientes o en investigación vinculadas a este objetivo pasarán al estado RESUELTA.',
      confirmText: 'Sí, resolver todas en bloque',
      variant: 'warning',
    });
  };

  const handleOpenUnbanConfirm = () => {
    setConfirmModal({
      type: 'UNBAN',
      title: `¿Confirmar desbaneo de ${getTargetDemonstrative(report.targetType)}?`,
      message:
        report.targetType === 'LISTING'
          ? 'Esta acción restaurará el anuncio haciéndolo visible de nuevo en la plataforma.'
          : 'Esta acción restaurará al usuario permitiéndole iniciar sesión nuevamente.',
      confirmText: 'Sí, desbanear objetivo',
      variant: 'warning',
    });
  };

  const handleOpenDeleteConfirm = () => {
    setConfirmModal({
      type: 'HARD_DELETE',
      title: `¿Eliminar permanentemente ${getTargetDefiniteArticle(report.targetType)}?`,
      message: `¡ATENCIÓN! Esta acción ejecutará un borrado físico (Hard Delete) irreversible en la base de datos eliminando todos sus datos asociados.`,
      confirmText: 'Sí, eliminar definitivamente',
      variant: 'danger',
    });
  };

  const handleOpenUserBanConfirm = (userSnippet: AdminUserSnippet) => {
    const fullName = formatUserFullName(userSnippet, userSnippet.nickname || 'Usuario');
    if (userSnippet.isBanned) {
      setConfirmModal({
        type: 'UNBAN',
        title: `¿Confirmar desbaneo de ${fullName}?`,
        message: 'Esta acción restaurará al usuario permitiéndole iniciar sesión nuevamente.',
        confirmText: 'Sí, desbanear usuario',
        variant: 'warning',
        targetUserId: userSnippet.id,
      });
    } else {
      setConfirmModal({
        type: 'BAN',
        title: `¿Confirmar baneo de ${fullName}?`,
        message: 'Esta acción suspenderá la cuenta del usuario impidiéndole acceder a la plataforma.',
        confirmText: 'Sí, banear usuario',
        variant: 'warning',
        targetUserId: userSnippet.id,
      });
    }
  };

  const handleConfirmAction = async () => {
    if (!confirmModal) return;
    setIsExecutingAction(true);
    setActionError(null);
    setActionSuccess(null);
    try {
      if (confirmModal.targetUserId) {
        if (confirmModal.type === 'BAN') {
          await adminUserService.banUser(confirmModal.targetUserId, {
            message: adminNotes || 'Baneado tras revisión de conversación denunciada.',
          });
          setTargetConversation((prev) => {
            if (!prev) return null;
            return {
              ...prev,
              tenant: prev.tenant?.id === confirmModal.targetUserId ? { ...prev.tenant, isBanned: true } : prev.tenant,
              host: prev.host?.id === confirmModal.targetUserId ? { ...prev.host, isBanned: true } : prev.host,
            };
          });
          setActionSuccess('Usuario sancionado y baneado con éxito.');
        } else if (confirmModal.type === 'UNBAN') {
          await adminUserService.unbanUser(confirmModal.targetUserId);
          setTargetConversation((prev) => {
            if (!prev) return null;
            return {
              ...prev,
              tenant: prev.tenant?.id === confirmModal.targetUserId ? { ...prev.tenant, isBanned: false } : prev.tenant,
              host: prev.host?.id === confirmModal.targetUserId ? { ...prev.host, isBanned: false } : prev.host,
            };
          });
          setActionSuccess('Usuario desbaneado con éxito.');
        }
        setConfirmModal(null);
        return;
      }

      if (confirmModal.type === 'BAN') {
        if (report.targetType === 'LISTING') {
          await adminListingService.banListing(report.targetId);
          setTargetListing((prev) => (prev ? { ...prev, status: 'BANNED' } : null));
        } else if (report.targetType === 'USER') {
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
          `Resuelto automáticamente tras sanción y baneo de ${getTargetDefiniteArticle(report.targetType)}.`;
        await adminReportService.resolveAllReportsForTarget(report.targetId, {
          status: 'RESOLVED',
          adminNotes: resolutionNotes,
        });
        await onStatusUpdate(report.id, 'RESOLVED', resolutionNotes);
        setActionSuccess(
          `${getTargetCapitalizedNoun(report.targetType)} sancionado y todas sus denuncias abiertas resueltas con éxito.`
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
        } else if (report.targetType === 'USER') {
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
        } else if (report.targetType === 'USER') {
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
        className="fixed inset-0 z-50 bg-on-surface/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200"
        onClick={onClose}
      >
        <div
          className="w-full max-w-2xl lg:max-w-3xl max-h-[90vh] bg-surface-container-lowest rounded-3xl border border-outline-variant shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-150"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header (Fijo) */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-outline-variant bg-surface shrink-0">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-primary/10 text-primary rounded-xl shrink-0">
                <FileText size={20} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-bold text-on-surface">Expediente de Denuncia</h3>
                  {getStatusBadge(report.status)}
                </div>
                <div className="mt-0.5">
                  <CopyIdButton id={report.id} prefix="ID:" />
                </div>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-secondary hover:text-on-surface p-1.5 rounded-lg hover:bg-surface-container transition-colors cursor-pointer"
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
            <div className="mx-6 mt-4 p-3 bg-error-container text-on-error-container text-xs rounded-xl border border-error/20 flex items-center gap-2 shrink-0">
              <AlertCircle size={16} className="shrink-0 text-error" />
              <span>{actionError}</span>
            </div>
          )}

          {/* Body (Scrollable) */}
          <div className="p-6 space-y-6 overflow-y-auto flex-1">
            {/* Grid Info: Fechas y Reporter */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 bg-surface-container-low rounded-xl border border-outline-variant/50">
              <div>
                <span className="text-xs text-secondary block font-medium">Denunciante (Reporter ID)</span>
                <CopyIdButton id={report.reporterId} />
              </div>
              <div>
                <span className="text-xs text-secondary block font-medium">Fecha de creación</span>
                <span className="text-xs text-on-surface font-semibold flex items-center gap-1.5 mt-0.5">
                  <Clock size={13} className="text-secondary" />
                  {new Date(report.createdAt).toLocaleString('es-ES')}
                </span>
              </div>
            </div>

            {/* Reported Target Snapshot */}
            <div className="border border-outline-variant/60 rounded-xl p-4 bg-surface-container-lowest">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold text-on-surface uppercase tracking-wider flex items-center gap-1.5">
                  {report.targetType === 'LISTING' ? (
                    <>
                      <Home size={14} className="text-primary" />
                      Anuncio Denunciado
                    </>
                  ) : report.targetType === 'USER' ? (
                    <>
                      <User size={14} className="text-primary" />
                      Usuario Denunciado
                    </>
                  ) : (
                    <>
                      <MessageSquare size={14} className="text-primary" />
                      Conversación Denunciada
                    </>
                  )}
                </span>
                <CopyIdButton id={report.targetId} prefix="Target ID:" />
              </div>

              {isLoadingTarget ? (
                <div className="py-4 text-center text-xs text-secondary animate-pulse">Cargando datos del objetivo...</div>
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
                      className="w-24 h-24 object-cover rounded-xl border border-outline-variant/60 shrink-0"
                    />
                  ) : (
                    <div className="w-24 h-24 bg-surface-container rounded-xl flex items-center justify-center text-secondary shrink-0">
                      <Home size={28} />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-bold text-on-surface truncate">{targetListing.title}</h4>
                    <p className="text-xs text-secondary mt-0.5">
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
                            ? 'bg-error-container text-error'
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
                          className="text-xs text-primary hover:underline font-semibold flex items-center gap-1 cursor-pointer"
                        >
                          Inspeccionar anuncio <ExternalLink size={12} />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ) : targetUser ? (
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-primary text-on-primary flex items-center justify-center font-bold text-base shrink-0">
                    {targetUser.nickname?.charAt(0).toUpperCase() || 'U'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-bold text-on-surface">
                      {targetUser.firstName} {targetUser.lastName1} ({targetUser.nickname})
                    </h4>
                    <p className="text-xs text-secondary">
                      {targetUser.email} • Rol:{' '}
                      {targetUser.role === 'ADMIN'
                        ? 'Administrador'
                        : targetUser.role === 'OWNER'
                        ? 'Propietario'
                        : 'Inquilino'}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      {targetUser.bannedAt ? (
                        <span className="text-[11px] font-semibold px-2 py-0.5 rounded bg-error-container text-error">
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
                          className="text-xs text-primary hover:underline font-semibold flex items-center gap-1 cursor-pointer"
                        >
                          Inspeccionar usuario <ExternalLink size={12} />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ) : targetConversation ? (
                <div className="space-y-4">
                  {/* Anuncio en conversación */}
                  {targetConversation.listing && (
                    <div className="p-3.5 bg-surface-container-low rounded-xl border border-outline-variant/50 flex flex-col sm:flex-row items-start gap-3">
                      {targetConversation.listing.thumbnailUrl ? (
                        <img
                          src={targetConversation.listing.thumbnailUrl}
                          alt={targetConversation.listing.title}
                          className="w-20 h-20 object-cover rounded-xl border border-outline-variant/60 shrink-0"
                        />
                      ) : (
                        <div className="w-20 h-20 bg-surface-container rounded-xl flex items-center justify-center text-secondary shrink-0">
                          <Home size={24} />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <span className="text-[10px] font-bold text-secondary uppercase tracking-wider block">
                          Anuncio Asociado
                        </span>
                        <h4 className="text-sm font-bold text-on-surface truncate">
                          {targetConversation.listing.title}
                        </h4>
                        <p className="text-xs text-secondary mt-0.5">
                          {targetConversation.listing.city || 'Sin ciudad'} • {targetConversation.listing.pricePerMonth} €/mes •{' '}
                          {targetConversation.listing.rentalType === 'ROOM' ? 'Habitación' : 'Piso Completo'}
                        </p>
                        {onInspectListing && targetConversation.listing.id && (
                          <button
                            onClick={() => onInspectListing(targetConversation.listing!.id)}
                            className="text-xs text-primary hover:underline font-semibold flex items-center gap-1 mt-2 cursor-pointer"
                          >
                            Inspeccionar anuncio <ExternalLink size={12} />
                          </button>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Participantes involucrados */}
                  <div>
                    <span className="text-xs font-bold text-on-surface uppercase tracking-wider block mb-2">
                      Usuarios Implicados
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {/* Inquilino */}
                      {targetConversation.tenant ? (
                        <div className="p-3.5 bg-surface-container-low rounded-xl border border-outline-variant/50 space-y-2.5">
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-bold text-secondary uppercase tracking-wider">Inquilino</span>
                            {targetConversation.tenant.isBanned ? (
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-error-container text-error">
                                Baneado
                              </span>
                            ) : (
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">
                                Activo
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-2.5">
                            {targetConversation.tenant.profilePicUrl ? (
                              <img
                                src={targetConversation.tenant.profilePicUrl}
                                alt={formatUserFullName(targetConversation.tenant, 'Inquilino')}
                                className="w-10 h-10 rounded-full object-cover border border-outline-variant"
                              />
                            ) : (
                              <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-sm shrink-0">
                                {targetConversation.tenant.firstName?.charAt(0).toUpperCase() || 'I'}
                              </div>
                            )}
                            <div className="min-w-0 flex-1">
                              <h5 className="text-xs font-bold text-on-surface truncate">
                                {formatUserFullName(targetConversation.tenant, 'Inquilino')}
                              </h5>
                              <p className="text-[11px] text-secondary truncate">
                                @{targetConversation.tenant.nickname} • {targetConversation.tenant.email}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 pt-1.5 border-t border-outline-variant/30">
                            {onInspectUser && (
                              <button
                                onClick={() => onInspectUser(targetConversation.tenant!.id)}
                                className="text-[11px] text-primary hover:underline font-semibold flex items-center gap-1 cursor-pointer"
                              >
                                Inspeccionar <ExternalLink size={11} />
                              </button>
                            )}
                            <button
                              onClick={() => handleOpenUserBanConfirm(targetConversation.tenant!)}
                              className={`text-[11px] font-semibold px-2 py-0.5 rounded-lg ml-auto transition-colors cursor-pointer ${
                                targetConversation.tenant.isBanned
                                  ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                                  : 'bg-amber-100 text-amber-800 hover:bg-amber-200'
                              }`}
                            >
                              {targetConversation.tenant.isBanned ? 'Desbanear' : 'Banear'}
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="p-3.5 bg-surface-container-low rounded-xl border border-outline-variant/50 flex items-center justify-center text-xs text-secondary italic">
                          Inquilino no disponible o cuenta eliminada
                        </div>
                      )}

                      {/* Propietario / Host */}
                      {targetConversation.host ? (
                        <div className="p-3.5 bg-surface-container-low rounded-xl border border-outline-variant/50 space-y-2.5">
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-bold text-secondary uppercase tracking-wider">Propietario</span>
                            {targetConversation.host.isBanned ? (
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-error-container text-error">
                                Baneado
                              </span>
                            ) : (
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">
                                Activo
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-2.5">
                            {targetConversation.host.profilePicUrl ? (
                              <img
                                src={targetConversation.host.profilePicUrl}
                                alt={formatUserFullName(targetConversation.host, 'Propietario')}
                                className="w-10 h-10 rounded-full object-cover border border-outline-variant"
                              />
                            ) : (
                              <div className="w-10 h-10 rounded-full bg-secondary/10 text-secondary flex items-center justify-center font-bold text-sm shrink-0">
                                {targetConversation.host.firstName?.charAt(0).toUpperCase() || 'P'}
                              </div>
                            )}
                            <div className="min-w-0 flex-1">
                              <h5 className="text-xs font-bold text-on-surface truncate">
                                {formatUserFullName(targetConversation.host, 'Propietario')}
                              </h5>
                              <p className="text-[11px] text-secondary truncate">
                                @{targetConversation.host.nickname} • {targetConversation.host.email}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 pt-1.5 border-t border-outline-variant/30">
                            {onInspectUser && (
                              <button
                                onClick={() => onInspectUser(targetConversation.host!.id)}
                                className="text-[11px] text-primary hover:underline font-semibold flex items-center gap-1 cursor-pointer"
                              >
                                Inspeccionar <ExternalLink size={11} />
                              </button>
                            )}
                            <button
                              onClick={() => handleOpenUserBanConfirm(targetConversation.host!)}
                              className={`text-[11px] font-semibold px-2 py-0.5 rounded-lg ml-auto transition-colors cursor-pointer ${
                                targetConversation.host.isBanned
                                  ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                                  : 'bg-amber-100 text-amber-800 hover:bg-amber-200'
                              }`}
                            >
                              {targetConversation.host.isBanned ? 'Desbanear' : 'Banear'}
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="p-3.5 bg-surface-container-low rounded-xl border border-outline-variant/50 flex items-center justify-center text-xs text-secondary italic">
                          Propietario no disponible o cuenta eliminada
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Transcripción de Mensajes */}
                  <div className="space-y-2 pt-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-on-surface flex items-center gap-1.5">
                        <MessageSquare size={14} className="text-primary" />
                        Transcripción de Mensajes ({targetConversation.messages?.length || 0})
                      </span>
                      <span className="text-[11px] text-secondary">
                        Historial completo
                      </span>
                    </div>
                    <div className="max-h-72 overflow-y-auto rounded-xl bg-surface-container-low border border-outline-variant/50 p-3.5 space-y-3">
                      {!targetConversation.messages || targetConversation.messages.length === 0 ? (
                        <p className="text-xs text-secondary text-center py-6">
                          No hay mensajes registrados en esta conversación.
                        </p>
                      ) : (
                        targetConversation.messages.map((msg) => {
                          const isTenant = Boolean(targetConversation.tenant && msg.senderId === targetConversation.tenant.id);
                          const isHost = Boolean(targetConversation.host && msg.senderId === targetConversation.host.id);
                          const tenantName = formatUserFullName(targetConversation.tenant, 'Inquilino');
                          const hostName = formatUserFullName(targetConversation.host, 'Propietario');
                          const senderLabel = isTenant
                            ? `Inquilino (${tenantName})`
                            : isHost
                            ? `Propietario (${hostName})`
                            : msg.senderName || 'Sistema';

                          if (msg.messageType !== 'USER_MESSAGE') {
                            return (
                              <div
                                key={msg.id}
                                className="p-2.5 rounded-lg bg-surface-container text-center border border-outline-variant/40 text-xs"
                              >
                                <span className="text-[10px] uppercase font-bold text-secondary tracking-wider block">
                                  Aviso del Sistema
                                </span>
                                <p className="text-xs text-secondary mt-0.5">{msg.content}</p>
                                <span className="text-[10px] text-outline block mt-1">
                                  {new Date(msg.createdAt).toLocaleString('es-ES')}
                                </span>
                              </div>
                            );
                          }

                          return (
                            <div
                              key={msg.id}
                              className={`p-3 rounded-xl border text-xs max-w-[88%] ${
                                isTenant
                                  ? 'mr-auto bg-surface-container-lowest border-outline-variant/60 shadow-xs'
                                  : 'ml-auto bg-primary/5 border-primary/20 shadow-xs'
                              }`}
                            >
                              <div className="flex items-center justify-between gap-3 mb-1">
                                <span className={`text-[11px] font-bold ${isTenant ? 'text-primary' : 'text-emerald-700'}`}>
                                  {senderLabel}
                                </span>
                                <span className="text-[10px] text-secondary">
                                  {new Date(msg.createdAt).toLocaleString('es-ES', {
                                    hour: '2-digit',
                                    minute: '2-digit',
                                    day: '2-digit',
                                    month: '2-digit',
                                  })}
                                </span>
                              </div>
                              <p className="text-on-surface whitespace-pre-wrap leading-relaxed">{msg.content}</p>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                <p className="text-xs text-secondary">No se pudo cargar el resumen del objetivo (o fue eliminado).</p>
              )}
            </div>

            {/* Motivo y Descripción */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-secondary">Motivo:</span>
                <span className="text-xs font-bold px-2.5 py-0.5 bg-primary/10 text-primary rounded-md">
                  {getReasonLabel(report.reason)}
                </span>
              </div>
              <div className="p-3.5 bg-surface-container-low border border-outline-variant/40 rounded-xl text-xs text-on-surface whitespace-pre-wrap leading-relaxed">
                {report.description || 'El denunciante no proporcionó una descripción adicional.'}
              </div>
            </div>

            {/* Notas Administrativas */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-on-surface">Notas Administrativas de Resolución</label>
              <textarea
                rows={3}
                placeholder="Escribe las conclusiones de la moderación o medidas adoptadas..."
                value={adminNotes}
                onChange={(e) => setAdminNotes(e.target.value)}
                className="w-full text-xs bg-surface-container-lowest border border-outline-variant rounded-xl p-3 text-on-surface focus:ring-2 focus:ring-primary/20 focus:border-primary"
              />
            </div>

            {/* Acciones Directas de Moderación */}
            {report.targetType !== 'CONVERSATION' && (
              <div className="pt-3 border-t border-outline-variant/40 space-y-3">
                <span className="text-xs font-bold text-secondary uppercase tracking-wider block">
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
                    className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold bg-error hover:bg-error/90 text-on-error rounded-xl transition-colors shadow-xs cursor-pointer"
                  >
                    <Trash2 size={14} />
                    <span>Borrado Físico (Hard Delete)</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Footer (Fijo) */}
          <div className="flex flex-wrap items-center justify-between gap-3 px-6 py-4 border-t border-outline-variant bg-surface shrink-0">
            <div className="flex items-center gap-2">
              <span className="text-xs text-secondary font-medium">Estado del expediente:</span>
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
              className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold bg-primary hover:bg-primary-container text-on-primary rounded-xl transition-colors shadow-xs disabled:opacity-40 cursor-pointer"
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
