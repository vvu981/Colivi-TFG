import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Inbox, AlertCircle, Loader2, MapPin, Calendar, Clock, Euro, ArrowRight, XCircle, ExternalLink, Trash2 } from 'lucide-react';
import type { BookingRequest } from '../types/booking.types';
import { bookingRequestService } from '../api/bookingRequestService';
import { StatusBadge } from './StatusBadge';
import { Button } from '../../../components/ui/Button';
import { Modal } from '../../../components/ui/Modal';

export const MyRequests: React.FC = () => {
  const [requests, setRequests] = useState<BookingRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // States for cancellation
  const [requestToCancel, setRequestToCancel] = useState<BookingRequest | null>(null);
  const [isCanceling, setIsCanceling] = useState(false);

  // States for payment
  const [requestToPay, setRequestToPay] = useState<BookingRequest | null>(null);
  const [isPaying, setIsPaying] = useState(false);

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await bookingRequestService.getMyRequests();
      setRequests(data);
    } catch (err) {
      setError('No pudimos cargar tus solicitudes. Por favor, revisa tu conexión e inténtalo de nuevo.');
      console.error('Failed to fetch requests', err);
    } finally {
      setIsLoading(false);
    }
  };

  const confirmCancelRequest = async () => {
    if (!requestToCancel) return;
    
    try {
      setIsCanceling(true);
      await bookingRequestService.updateRequestStatus(requestToCancel.id, 'CANCELLED');
      
      // En vez de marcarla como CANCELLED, la eliminamos de la vista (borrado lógico)
      setRequests((prev) => prev.filter((req) => req.id !== requestToCancel.id));
      setRequestToCancel(null);
    } catch (err) {
      alert('Error al cancelar la solicitud. Por favor, inténtalo de nuevo.');
      console.error('Failed to cancel request', err);
    } finally {
      setIsCanceling(false);
    }
  };

  const handlePayment = async () => {
    if (!requestToPay) return;
    try {
      setIsPaying(true);
      // Simular pago
      const paymentData = { paymentToken: 'tok_visa', paymentMethod: 'CARD' };
      const updatedRequest = await bookingRequestService.confirmPayment(requestToPay.id, paymentData);
      
      setRequests(prev => prev.map(req => req.id === requestToPay.id ? {
        ...req,
        ...updatedRequest,
        listing: req.listing,
        totalPrice: req.totalPrice
      } : req));
      setRequestToPay(null);
    } catch (err) {
      alert('Error al procesar el pago. Por favor, inténtalo de nuevo.');
      console.error('Failed to process payment', err);
    } finally {
      setIsPaying(false);
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  if (isLoading) {
    return (
      <div className="flex flex-col justify-center items-center py-24 animate-in fade-in duration-500">
        <Loader2 className="h-10 w-10 animate-spin text-primary mb-4" />
        <p className="text-body-md text-on-surface-variant animate-pulse">Cargando tus solicitudes...</p>
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
        <h3 className="text-headline-md md:text-display-sm text-on-surface mb-3 font-bold mx-auto">Aún no hay solicitudes</h3>
        <p className="text-body-lg text-on-surface-variant mx-auto max-w-lg mb-8">
          Explora los alojamientos disponibles y envía tu primera solicitud para empezar tu nueva aventura.
        </p>
        <Button onClick={() => window.location.href = '/map'} className="bg-primary text-on-primary px-8 py-3 rounded-full font-label-md text-lg hover:shadow-md transition-all hover:-translate-y-1 active:translate-y-0 flex items-center gap-2 mx-auto w-fit">
          Explorar mapa <ArrowRight size={18} />
        </Button>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
        <div>
          <h2 className="text-display-lg-mobile md:text-display-lg text-on-surface font-bold tracking-tight">Mis Solicitudes</h2>
          <p className="text-body-lg text-on-surface-variant mt-2">Haz seguimiento de tus reservas enviadas.</p>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {requests.map((request) => (
          <div
            key={request.id}
            className="group flex flex-col bg-surface-container-lowest border border-outline-variant/60 rounded-3xl overflow-hidden ambient-shadow transition-all duration-300 hover:shadow-lg hover:border-primary/30 hover:-translate-y-1"
          >
            {/* Imagen Header */}
            <div className="relative h-48 w-full overflow-hidden bg-surface-variant">
              {request.listing?.coverImageUrl ? (
                <img
                  src={request.listing.coverImageUrl}
                  alt={request.listing.title || 'Alojamiento'}
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-surface-variant to-outline-variant/30">
                  <Inbox className="h-12 w-12 text-on-surface-variant/40" />
                </div>
              )}
              {/* Degradado para que destaque el badge */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/0 to-black/20" />
              
              <div className="absolute top-4 right-4 shadow-sm">
                <StatusBadge status={request.status} className="backdrop-blur-md bg-opacity-90 border border-white/20" />
              </div>
              
              <div className="absolute bottom-4 left-4 right-4">
                <h3 className="text-headline-sm text-white line-clamp-1 font-bold drop-shadow-md">
                  {request.listing?.title || 'Alojamiento no disponible'}
                </h3>
              </div>
            </div>
            
            {/* Body */}
            <div className="p-6 flex flex-col flex-grow bg-gradient-to-b from-surface-container-lowest to-surface/30">
              
              <div className="space-y-4 mb-6 flex-grow">
                {request.status === 'ACCEPTED' && request.expiresAt && (
                  <div className="bg-tertiary-container/30 border border-tertiary/20 rounded-xl p-3 mb-2 flex items-start gap-3 animate-in fade-in slide-in-from-top-2">
                    <AlertCircle className="w-5 h-5 text-tertiary mt-0.5 shrink-0" />
                    <div>
                      <p className="text-label-md font-bold text-on-tertiary-container">¡Solicitud Aceptada!</p>
                      <p className="text-body-sm text-on-surface-variant mt-0.5 leading-snug">
                        Tienes hasta el {new Date(request.expiresAt).toLocaleString('es-ES', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })} para pagar la fianza y confirmar tu reserva.
                      </p>
                    </div>
                  </div>
                )}

                <div className="flex items-start gap-3">
                  <div className="p-2 bg-surface-container rounded-xl text-on-surface-variant shrink-0 mt-0.5">
                    <MapPin size={16} />
                  </div>
                  <p className="text-body-md text-on-surface-variant line-clamp-2 pt-1 font-medium">
                    {request.listing?.address || 'Dirección no especificada'}
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <div className="p-2 bg-surface-container rounded-xl text-on-surface-variant shrink-0">
                    <Calendar size={16} />
                  </div>
                  <div className="flex items-center gap-2 text-body-md text-on-surface-variant font-medium">
                    <span>{formatDate(request.startDate)}</span>
                    <ArrowRight size={14} className="text-outline" />
                    <span>{formatDate(request.endDate)}</span>
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-surface-container rounded-xl text-on-surface-variant shrink-0">
                    <Clock size={16} />
                  </div>
                  <p className="text-body-md text-on-surface-variant font-medium">
                    Solicitado el {formatDate(request.createdAt)}
                  </p>
                </div>
              </div>

              {/* Footer con precio y acción */}
              <div className="flex items-center justify-between pt-5 border-t border-outline-variant/50 mt-auto">
                <div className="flex items-center">
                  <Euro size={20} className="text-primary mr-1" />
                  <p className="text-headline-md font-bold text-on-surface tracking-tight">
                    {request.totalPrice}
                    <span className="text-label-sm font-normal text-on-surface-variant ml-1">/mes</span>
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <Link
                    to={`/listings/${request.accommodationListingId}`}
                    className="flex items-center justify-center p-2 rounded-xl text-on-surface-variant bg-surface-container hover:bg-primary hover:text-on-primary transition-all duration-300 shadow-sm hover:shadow hover:-translate-y-0.5"
                    title="Ver anuncio"
                  >
                    <ExternalLink size={18} />
                  </Link>

                  {request.status === 'PENDING' && (
                    <Button
                      onClick={() => setRequestToCancel(request)}
                      className="group/btn relative flex items-center justify-center px-4 py-2 bg-error/10 text-error hover:bg-error hover:text-on-error rounded-xl font-label-md transition-all duration-300 overflow-hidden"
                    >
                      <span className="mr-2 group-hover/btn:-translate-x-1 transition-transform">Cancelar</span>
                      <XCircle size={16} className="opacity-0 -ml-4 group-hover/btn:opacity-100 group-hover/btn:ml-0 transition-all duration-300" />
                    </Button>
                  )}
                  {request.status === 'ACCEPTED' && (
                    <Button
                      onClick={() => setRequestToPay(request)}
                      className="bg-primary text-on-primary hover:bg-primary/90 px-4 py-2 rounded-xl font-label-md transition-all shadow-sm flex items-center"
                    >
                      Pagar Fianza
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>

      <Modal
        isOpen={!!requestToCancel}
        onClose={() => !isCanceling && setRequestToCancel(null)}
        title="Cancelar Solicitud"
      >
        <div className="p-6 sm:p-8 flex flex-col items-center bg-gradient-to-b from-surface to-surface-container-lowest">
          {/* Icon with glow effect */}
          <div className="relative mb-6">
            <div className="absolute inset-0 bg-error/20 rounded-full animate-pulse blur-md scale-125" />
            <div className="relative flex items-center justify-center w-20 h-20 bg-gradient-to-br from-error/10 to-error/5 rounded-full border-4 border-surface shadow-sm">
              <Trash2 className="w-10 h-10 text-error drop-shadow-sm" strokeWidth={1.5} />
            </div>
          </div>
          
          <h3 className="text-headline-sm font-bold text-on-surface mb-2 text-center tracking-tight">
            ¿Estás seguro?
          </h3>
          
          <div className="flex flex-col items-center mb-6 text-center">
            <p className="text-body-md text-on-surface-variant mb-3">
              Se cancelará tu solicitud de alojamiento para:
            </p>
            <div className="px-4 py-2.5 bg-surface-container-highest/30 border border-outline-variant/40 rounded-xl shadow-sm backdrop-blur-sm max-w-full">
              <p className="text-body-lg font-semibold text-on-surface truncate">
                {requestToCancel?.listing?.title}
              </p>
            </div>
          </div>
          
          <div className="flex items-start gap-3 p-4 bg-error/5 border border-error/10 rounded-xl mb-8 w-full">
             <AlertCircle className="w-5 h-5 text-error shrink-0 mt-0.5" />
             <p className="text-body-sm text-on-surface-variant text-left leading-relaxed">
               Esta acción es <span className="font-semibold text-error">irreversible</span> y se notificará automáticamente al propietario.
             </p>
          </div>
          
          <div className="flex flex-col-reverse sm:flex-row w-full gap-3 mt-auto">
            <Button
              onClick={() => setRequestToCancel(null)}
              disabled={isCanceling}
              className="sm:flex-1 py-3.5 rounded-xl border border-outline-variant text-on-surface-variant hover:bg-surface-variant/50 hover:text-on-surface transition-colors font-label-lg"
            >
              Mantener solicitud
            </Button>
            <Button
              onClick={confirmCancelRequest}
              disabled={isCanceling}
              className="sm:flex-1 py-3.5 rounded-xl bg-error text-white hover:bg-error/90 hover:shadow-lg hover:shadow-error/25 transition-all active:scale-[0.98] font-label-lg border-0 flex items-center justify-center"
            >
              {isCanceling ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Cancelando...
                </>
              ) : (
                'Sí, cancelar'
              )}
            </Button>
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={!!requestToPay}
        onClose={() => !isPaying && setRequestToPay(null)}
        title="Confirmar Pago"
      >
        <div className="p-6 sm:p-8 flex flex-col items-center bg-gradient-to-b from-surface to-surface-container-lowest">
          <div className="relative mb-6">
            <div className="absolute inset-0 bg-primary/20 rounded-full animate-pulse blur-md scale-125" />
            <div className="relative flex items-center justify-center w-20 h-20 bg-gradient-to-br from-primary/10 to-primary/5 rounded-full border-4 border-surface shadow-sm">
              <Euro className="w-10 h-10 text-primary drop-shadow-sm" strokeWidth={1.5} />
            </div>
          </div>
          
          <h3 className="text-headline-sm font-bold text-on-surface mb-2 text-center tracking-tight">
            Pago de Fianza
          </h3>
          
          <div className="flex flex-col items-center mb-6 text-center w-full">
            <p className="text-body-md text-on-surface-variant mb-3">
              Total a pagar (Primer mes + Fianza):
            </p>
            <div className="w-full px-4 py-4 bg-surface-container-highest/30 border border-outline-variant/40 rounded-xl shadow-sm backdrop-blur-sm">
              <p className="text-display-sm font-bold text-primary mb-1">
                {(requestToPay?.listing?.pricePerMonth || 0) + (requestToPay?.listing?.securityDeposit || 0)}€
              </p>
              <p className="text-label-sm text-on-surface-variant">
                Se cobrará usando tu método de pago guardado
              </p>
            </div>
          </div>
          
          <div className="flex flex-col-reverse sm:flex-row w-full gap-3 mt-auto">
            <Button
              onClick={() => setRequestToPay(null)}
              disabled={isPaying}
              className="sm:flex-1 py-3.5 rounded-xl border border-outline-variant text-on-surface-variant hover:bg-surface-variant/50 hover:text-on-surface transition-colors font-label-lg"
            >
              Volver
            </Button>
            <Button
              onClick={handlePayment}
              disabled={isPaying}
              className="sm:flex-1 py-3.5 rounded-xl bg-primary text-on-primary hover:bg-primary/90 hover:shadow-lg hover:shadow-primary/25 transition-all active:scale-[0.98] font-label-lg border-0 flex items-center justify-center"
            >
              {isPaying ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Procesando...
                </>
              ) : (
                'Confirmar pago'
              )}
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
};


