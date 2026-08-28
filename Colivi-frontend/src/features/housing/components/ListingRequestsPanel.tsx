import React, { useEffect, useState } from 'react';
import { Inbox, CheckCircle, XCircle, AlertCircle, Loader2 } from 'lucide-react';
import type { BookingRequest } from '../types/booking.types';
import { bookingRequestService } from '../api/bookingRequestService';
import { StatusBadge } from './StatusBadge';
import { Button } from '../../../components/ui/Button';
import { twMerge } from 'tailwind-merge';

interface ListingRequestsPanelProps {
  listingId: string;
}

export const ListingRequestsPanel: React.FC<ListingRequestsPanelProps> = ({ listingId }) => {
  const [requests, setRequests] = useState<BookingRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Track mutating states individually
  const [processingIds, setProcessingIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetchRequests();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [listingId]);

  const fetchRequests = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await bookingRequestService.getListingRequests(listingId);
      setRequests(data);
    } catch (err) {
      setError('No se pudieron cargar las solicitudes. Inténtalo más tarde.');
      console.error('Failed to fetch listing requests', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAction = async (id: string, newStatus: 'ACCEPTED' | 'REJECTED') => {
    try {
      setProcessingIds((prev) => {
        const next = new Set(prev);
        next.add(id);
        return next;
      });

      await bookingRequestService.updateRequestStatus(id, newStatus);
      
      setRequests((prev) =>
        prev.map((req) => (req.id === id ? { ...req, status: newStatus } : req))
      );
    } catch (err) {
      alert(`Error al intentar ${newStatus === 'ACCEPTED' ? 'aceptar' : 'rechazar'} la solicitud.`);
      console.error('Failed to update request status', err);
    } finally {
      setProcessingIds((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-10">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center p-6 bg-error-container rounded-xl">
        <AlertCircle className="h-8 w-8 text-on-error-container mb-3" />
        <p className="text-on-error-container text-body-md">{error}</p>
        <Button onClick={fetchRequests} className="mt-4 bg-primary text-on-primary px-4 py-2 rounded-md">
          Reintentar
        </Button>
      </div>
    );
  }

  if (requests.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 px-6 border border-outline-variant rounded-xl bg-surface-container-lowest">
        <div className="bg-surface-variant p-4 rounded-full mb-4">
          <Inbox className="h-8 w-8 text-on-surface-variant" />
        </div>
        <h3 className="text-headline-sm text-on-surface mb-2">Bandeja de entrada vacía</h3>
        <p className="text-body-md text-on-surface-variant text-center max-w-md">
          Aún no has recibido ninguna solicitud de reserva para este alojamiento. 
          Aquí aparecerán cuando un inquilino esté interesado.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-headline-md text-on-surface">Solicitudes Recibidas</h2>
        <span className="bg-primary-container text-on-primary-container px-3 py-1 rounded-full text-label-sm">
          {requests.filter(r => r.status === 'PENDING').length} pendientes
        </span>
      </div>

      <div className="flex flex-col gap-4">
        {requests.map((request) => {
          const isProcessing = processingIds.has(request.id);
          const tenantName = request.tenant ? `${request.tenant.firstName} ${request.tenant.lastName}` : 'Inquilino Anónimo';

          return (
            <div
              key={request.id}
              className={twMerge(
                "flex flex-col md:flex-row md:items-center justify-between p-5 rounded-xl border border-outline-variant bg-surface-container-lowest ambient-shadow transition-colors",
                request.status === 'PENDING' ? 'border-primary/30 bg-surface' : ''
              )}
            >
              <div className="flex items-center gap-4 mb-4 md:mb-0">
                <div className="h-12 w-12 rounded-full overflow-hidden bg-surface-variant flex-shrink-0 flex items-center justify-center">
                  {request.tenant?.profilePictureUrl ? (
                    <img 
                      src={request.tenant.profilePictureUrl} 
                      alt={tenantName}
                      className="h-full w-full object-cover" 
                    />
                  ) : (
                    <span className="text-on-surface-variant text-headline-sm font-bold uppercase">
                      {tenantName.charAt(0)}
                    </span>
                  )}
                </div>
                
                <div>
                  <h4 className="text-headline-sm text-on-surface mb-1">
                    {tenantName}
                  </h4>
                  <div className="flex flex-wrap items-center gap-2 text-body-md text-on-surface-variant">
                    <span>
                      {new Date(request.startDate).toLocaleDateString()} - {new Date(request.endDate).toLocaleDateString()}
                    </span>
                    <span className="hidden md:inline text-outline">•</span>
                    <span className="font-semibold text-primary">{request.totalPrice}€</span>
                  </div>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row items-center gap-3">
                <StatusBadge status={request.status} className="mb-2 sm:mb-0 mr-auto sm:mr-4" />
                
                {request.status === 'PENDING' && (
                  <div className="flex gap-2 w-full sm:w-auto">
                    <Button
                      onClick={() => handleAction(request.id, 'ACCEPTED')}
                      disabled={isProcessing}
                      className="flex-1 sm:flex-none flex items-center justify-center bg-primary text-on-primary hover:bg-surface-tint px-4 py-2 rounded-md transition-colors disabled:opacity-60"
                    >
                      {isProcessing ? (
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      ) : (
                        <CheckCircle className="h-4 w-4 mr-2" />
                      )}
                      Aceptar
                    </Button>
                    <Button
                      onClick={() => handleAction(request.id, 'REJECTED')}
                      disabled={isProcessing}
                      className="flex-1 sm:flex-none flex items-center justify-center bg-transparent border border-error text-error hover:bg-error-container px-4 py-2 rounded-md transition-colors disabled:opacity-60"
                    >
                      {isProcessing ? (
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      ) : (
                        <XCircle className="h-4 w-4 mr-2" />
                      )}
                      Rechazar
                    </Button>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
