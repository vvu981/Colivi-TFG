import React, { useEffect, useState, useMemo } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Inbox, AlertCircle, Loader2, Calendar, Clock, Euro, ArrowRight, User, CheckCircle, XCircle, Eye } from 'lucide-react';
import type { BookingRequest } from '../types/booking.types';
import { bookingRequestService } from '../api/bookingRequestService';
import { StatusBadge } from './StatusBadge';
import { Button } from '../../../components/ui/Button';
import { Modal } from '../../../components/ui/Modal';
import { BookingRequestDetailModal } from './BookingRequestDetailModal';

export const ReceivedRequests: React.FC = () => {
  const [requests, setRequests] = useState<BookingRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Search params for direct URL deep-linking (?requestId=UUID)
  const [searchParams, setSearchParams] = useSearchParams();
  const requestIdParam = searchParams.get('requestId');

  // Detail Modal state
  const [detailRequest, setDetailRequest] = useState<BookingRequest | null>(null);

  // Actions state
  const [actionRequest, setActionRequest] = useState<{ request: BookingRequest, action: 'ACCEPTED' | 'REJECTED' } | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    fetchRequests();
  }, []);

  // Deep linking: when URL contains ?requestId=..., open detail modal automatically
  useEffect(() => {
    if (!requestIdParam) {
      setDetailRequest(null);
      return;
    }

    const found = requests.find((r) => r.id === requestIdParam);
    if (found) {
      setDetailRequest(found);
    } else {
      bookingRequestService.getById(requestIdParam)
        .then((req) => {
          setDetailRequest(req);
        })
        .catch((err) => {
          console.error('Failed to load request from direct link', err);
        });
    }
  }, [requestIdParam, requests]);

  const handleOpenDetail = (request: BookingRequest) => {
    setDetailRequest(request);
    setSearchParams({ requestId: request.id });
  };

  const handleCloseDetail = () => {
    setDetailRequest(null);
    setSearchParams({});
  };

  const fetchRequests = async () => {
    try {
      setIsLoading(true);
      setError(null);
      // Fetches all landlord requests since no listingId is passed
      const data = await bookingRequestService.getListingRequests();
      setRequests(data);
    } catch (err) {
      setError('No pudimos cargar las solicitudes recibidas. Por favor, revisa tu conexión e inténtalo de nuevo.');
      console.error('Failed to fetch requests', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAction = async () => {
    if (!actionRequest) return;
    
    try {
      setIsProcessing(true);
      const updated = await bookingRequestService.updateRequestStatus(actionRequest.request.id, actionRequest.action);
      
      // Update local state
      setRequests((prev) => 
        prev.map((req) => req.id === updated.id ? { ...req, status: updated.status } : req)
      );

      // Update detail modal state if currently viewed
      setDetailRequest((prev) => (prev && prev.id === updated.id ? { ...prev, status: updated.status } : prev));
      setActionRequest(null);
    } catch (err) {
      alert(`Error al ${actionRequest.action === 'ACCEPTED' ? 'aceptar' : 'rechazar'} la solicitud.`);
      console.error('Action failed', err);
    } finally {
      setIsProcessing(false);
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  // Group by accommodation/listing title
  const groupedRequests = useMemo(() => {
    const map = new Map<string, { listingId: string, title: string, address: string, cover: string, requests: BookingRequest[] }>();
    
    requests.forEach(req => {
      const listingKey = req.accommodationListingId;
      if (!map.has(listingKey)) {
        map.set(listingKey, {
          listingId: listingKey,
          title: req.listing?.title || 'Alojamiento Desconocido',
          address: req.listing?.address || '',
          cover: req.listing?.coverImageUrl || '',
          requests: []
        });
      }
      map.get(listingKey)!.requests.push(req);
    });

    return Array.from(map.values());
  }, [requests]);

  const pendingCount = useMemo(() => requests.filter((r) => r.status === 'PENDING').length, [requests]);

  if (isLoading) {
    return (
      <div className="flex flex-col justify-center items-center py-24 animate-in fade-in duration-500">
        <Loader2 className="h-10 w-10 animate-spin text-primary mb-4" />
        <p className="text-body-md text-on-surface-variant animate-pulse">Cargando solicitudes recibidas...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-6 text-center bg-error-container/50 border border-error/20 rounded-2xl animate-in zoom-in-95 duration-300">
        <div className="bg-error/10 p-4 rounded-full mb-4">
          <AlertCircle className="h-10 w-10 text-error" />
        </div>
        <h3 className="text-headline-sm text-on-error-container mb-2">Algo salió mal</h3>
        <p className="text-body-md text-on-error-container/80 font-medium max-w-md">{error}</p>
        <Button onClick={fetchRequests} className="mt-6 bg-error text-on-error hover:bg-error/90 px-6 py-2.5 rounded-full font-label-md transition-transform hover:scale-105 active:scale-95 shadow-sm">
          Reintentar conexión
        </Button>
      </div>
    );
  }

  if (requests.length === 0) {
    return (
      <div className="flex flex-col justify-center py-24 px-6 border-2 border-dashed border-outline-variant/50 rounded-3xl bg-surface-container-lowest/50 backdrop-blur-sm w-full max-w-3xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500 text-center">
        <div className="bg-gradient-to-br from-primary-container to-surface-variant p-6 rounded-full mb-6 shadow-sm ring-8 ring-primary/5 mx-auto w-fit">
          <Inbox className="h-12 w-12 text-primary" />
        </div>
        <h3 className="text-headline-md md:text-display-sm text-on-surface mb-3 font-bold mx-auto">Sin solicitudes recibidas</h3>
        <p className="text-body-lg text-on-surface-variant mx-auto max-w-lg mb-4">
          Por el momento no tienes ninguna solicitud entrante. Cuando los inquilinos soliciten tus alojamientos, aparecerán aquí agrupados.
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-12 animate-in fade-in duration-500">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 flex-wrap">
              <h2 className="text-display-lg-mobile md:text-display-lg text-on-surface font-bold tracking-tight">Solicitudes Recibidas</h2>
              {pendingCount > 0 && (
                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs md:text-sm font-semibold bg-red-100 text-red-700 border border-red-200 shadow-sm animate-pulse">
                  {pendingCount} {pendingCount === 1 ? 'pendiente' : 'pendientes'}
                </span>
              )}
            </div>
            <p className="text-body-lg text-on-surface-variant mt-2">Gestiona quién alquilará tus alojamientos.</p>
          </div>
        </div>

        <div className="space-y-16">
          {groupedRequests.map((group) => (
            <div key={group.listingId} className="space-y-6">
              {/* Group Header (Accommodation) */}
              <div className="flex items-center gap-4 pb-4 border-b border-outline-variant/50">
                <div className="w-16 h-16 rounded-2xl overflow-hidden bg-surface-variant shrink-0 shadow-sm border border-outline-variant/30">
                  {group.cover ? (
                    <img src={group.cover} alt={group.title} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Inbox className="w-6 h-6 text-on-surface-variant/40" />
                    </div>
                  )}
                </div>
                <div>
                  <h3 className="text-headline-md font-bold text-on-surface">{group.title}</h3>
                  <p className="text-body-md text-on-surface-variant mt-1">{group.address}</p>
                </div>
                <Link
                  to={`/listings/${group.listingId}`}
                  className="ml-auto text-primary hover:text-primary/80 font-label-md flex items-center gap-1 transition-colors bg-primary/5 px-4 py-2 rounded-xl"
                >
                  Ver anuncio <ArrowRight size={16} />
                </Link>
              </div>

              {/* Group Requests */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {group.requests.map((request) => (
                  <div
                    key={request.id}
                    className="flex flex-col bg-surface-container-lowest border border-outline-variant/60 rounded-3xl overflow-hidden ambient-shadow transition-all duration-300 hover:shadow-lg hover:border-primary/30"
                  >
                    {/* Header: Tenant Info & Status */}
                    <div className="p-6 pb-4 border-b border-outline-variant/40 bg-gradient-to-br from-surface to-surface-variant/10">
                      <div className="flex justify-between items-start mb-4">
                        <StatusBadge status={request.status} />
                        <span className="text-label-sm text-on-surface-variant flex items-center gap-1 bg-surface-container px-2 py-1 rounded-lg">
                          <Clock size={12} /> {formatDate(request.createdAt)}
                        </span>
                      </div>
                      
                      <Link
                        to={`/users/${request.tenant?.id || request.requesterId}`}
                        className="flex items-center gap-4 mt-2 group"
                        title="Ver perfil del inquilino"
                      >
                        {request.tenant?.profilePictureUrl ? (
                          <img src={request.tenant.profilePictureUrl} alt="Inquilino" className="w-12 h-12 rounded-full object-cover border-2 border-surface shadow-sm group-hover:ring-2 group-hover:ring-primary transition-all" />
                        ) : (
                          <div className="w-12 h-12 rounded-full bg-primary/20 text-primary flex items-center justify-center font-bold text-lg border-2 border-surface shadow-sm group-hover:bg-primary/30 transition-colors">
                            <User size={24} />
                          </div>
                        )}
                        <div>
                          <p className="text-headline-sm font-bold text-on-surface leading-tight group-hover:text-primary transition-colors">
                            {request.tenant?.firstName} {request.tenant?.lastName}
                          </p>
                          <p className="text-body-sm text-on-surface-variant">Inquilino interesado · <span className="text-primary font-medium hover:underline">Ver perfil</span></p>
                        </div>
                      </Link>
                    </div>

                    {/* Body: Dates & Details */}
                    <div className="p-6 flex flex-col flex-grow bg-surface-container-lowest">
                      <div className="flex items-center gap-3 mb-6 bg-primary-container/20 p-3 rounded-2xl border border-primary/10">
                        <div className="p-2 bg-primary/10 rounded-xl text-primary shrink-0">
                          <Calendar size={18} />
                        </div>
                        <div className="flex flex-col">
                          <span className="text-label-sm text-on-surface-variant uppercase tracking-wider">Período</span>
                          <div className="flex items-center gap-2 text-body-md font-semibold text-on-surface">
                            <span>{formatDate(request.startDate)}</span>
                            <ArrowRight size={14} className="text-outline" />
                            <span>{formatDate(request.endDate)}</span>
                          </div>
                        </div>
                      </div>
                      
                      {request.message && (
                        <div className="mb-4">
                          <p className="text-label-sm text-on-surface-variant uppercase tracking-wider mb-2">Mensaje del inquilino</p>
                          <p className="text-body-md text-on-surface italic bg-surface-container-highest/20 p-4 rounded-2xl border border-outline-variant/30 leading-relaxed line-clamp-3">
                            "{request.message}"
                          </p>
                        </div>
                      )}

                      {/* View full request button */}
                      <button
                        type="button"
                        onClick={() => handleOpenDetail(request)}
                        className="w-full mb-4 py-2 px-3 rounded-xl bg-primary/5 hover:bg-primary/10 text-primary text-xs font-bold transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <Eye size={14} />
                        <span>Ver solicitud completa</span>
                      </button>

                      {/* Footer: Price & Actions */}
                      <div className="mt-auto pt-4 flex items-center justify-between border-t border-outline-variant/50">
                        <div className="flex flex-col">
                          <span className="text-label-sm text-on-surface-variant uppercase tracking-wider">A recibir</span>
                          <div className="flex items-center text-primary mt-0.5">
                            <Euro size={18} className="mr-0.5" />
                            <p className="text-headline-sm font-bold tracking-tight">
                              {request.totalPrice}
                              <span className="text-body-sm font-normal text-on-surface-variant ml-1">/mes</span>
                            </p>
                          </div>
                        </div>

                        {request.status === 'PENDING' && (
                          <div className="flex gap-2">
                            <Button
                              onClick={() => setActionRequest({ request, action: 'REJECTED' })}
                              className="p-3 bg-error/10 text-error hover:bg-error hover:text-white rounded-xl transition-all shadow-sm"
                              title="Rechazar"
                            >
                              <XCircle size={20} />
                            </Button>
                            <Button
                              onClick={() => setActionRequest({ request, action: 'ACCEPTED' })}
                              className="p-3 bg-[#4ade80]/10 text-[#16a34a] hover:bg-[#16a34a] hover:text-white rounded-xl transition-all shadow-sm"
                              title="Aceptar"
                            >
                              <CheckCircle size={20} />
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Confirmation Modal for Accept/Reject */}
      <Modal
        isOpen={!!actionRequest}
        onClose={() => !isProcessing && setActionRequest(null)}
        title={actionRequest?.action === 'ACCEPTED' ? 'Aceptar Solicitud' : 'Rechazar Solicitud'}
      >
        <div className="p-6 sm:p-8 flex flex-col items-center bg-gradient-to-b from-surface to-surface-container-lowest">
          <div className="relative mb-6">
            <div className={`absolute inset-0 rounded-full animate-pulse blur-md scale-125 ${actionRequest?.action === 'ACCEPTED' ? 'bg-[#16a34a]/20' : 'bg-error/20'}`} />
            <div className={`relative flex items-center justify-center w-20 h-20 rounded-full border-4 border-surface shadow-sm ${actionRequest?.action === 'ACCEPTED' ? 'bg-gradient-to-br from-[#16a34a]/10 to-[#16a34a]/5' : 'bg-gradient-to-br from-error/10 to-error/5'}`}>
              {actionRequest?.action === 'ACCEPTED' ? (
                <CheckCircle className="w-10 h-10 text-[#16a34a] drop-shadow-sm" strokeWidth={1.5} />
              ) : (
                <XCircle className="w-10 h-10 text-error drop-shadow-sm" strokeWidth={1.5} />
              )}
            </div>
          </div>
          
          <h3 className="text-headline-sm font-bold text-on-surface mb-2 text-center tracking-tight">
            ¿Confirmar acción?
          </h3>
          
          <div className="flex flex-col items-center mb-6 text-center">
            <p className="text-body-md text-on-surface-variant mb-2">
              Vas a <strong className={actionRequest?.action === 'ACCEPTED' ? 'text-[#16a34a]' : 'text-error'}>
                {actionRequest?.action === 'ACCEPTED' ? 'ACEPTAR' : 'RECHAZAR'}
              </strong> a este inquilino para:
            </p>
            <div className="px-4 py-2 bg-surface-container-highest/30 border border-outline-variant/40 rounded-xl shadow-sm backdrop-blur-sm mt-2">
              <p className="text-body-lg font-semibold text-on-surface">
                {actionRequest?.request.listing?.title}
              </p>
            </div>
          </div>
          
          <div className="flex flex-col-reverse sm:flex-row w-full gap-3 mt-4">
            <Button
              onClick={() => setActionRequest(null)}
              disabled={isProcessing}
              className="sm:flex-1 py-3.5 rounded-xl border border-outline-variant text-on-surface-variant hover:bg-surface-variant/50 transition-colors font-label-lg"
            >
              Cancelar
            </Button>
            <Button
              onClick={handleAction}
              disabled={isProcessing}
              className={`sm:flex-1 py-3.5 rounded-xl text-white transition-all active:scale-[0.98] font-label-lg border-0 flex items-center justify-center shadow-sm ${
                actionRequest?.action === 'ACCEPTED' 
                  ? 'bg-[#16a34a] hover:bg-[#15803d] hover:shadow-lg hover:shadow-[#16a34a]/25' 
                  : 'bg-error hover:bg-error/90 hover:shadow-lg hover:shadow-error/25'
              }`}
            >
              {isProcessing ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Procesando...
                </>
              ) : (
                'Confirmar'
              )}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Full Request Detail Modal (Accessible via direct link or click) */}
      <BookingRequestDetailModal
        isOpen={!!detailRequest}
        request={detailRequest}
        onClose={handleCloseDetail}
        onAccept={(req) => setActionRequest({ request: req, action: 'ACCEPTED' })}
        onReject={(req) => setActionRequest({ request: req, action: 'REJECTED' })}
        isProcessing={isProcessing}
      />
    </>
  );
};
