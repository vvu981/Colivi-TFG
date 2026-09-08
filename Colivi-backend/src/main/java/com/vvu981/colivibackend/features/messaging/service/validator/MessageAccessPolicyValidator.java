package com.vvu981.colivibackend.features.messaging.service.validator;

import com.vvu981.colivibackend.core.exception.BusinessRuleValidationException;
import com.vvu981.colivibackend.core.exception.UnauthorizedActionException;
import com.vvu981.colivibackend.features.accommodation.domain.AccommodationListing;
import com.vvu981.colivibackend.features.bookingRequests.domain.BookingRequest;
import com.vvu981.colivibackend.features.bookingRequests.domain.RequestStatus;
import com.vvu981.colivibackend.features.messaging.domain.Conversation;
import com.vvu981.colivibackend.features.user.domain.User;
import org.springframework.stereotype.Component;

import java.time.LocalDate;
import java.util.UUID;

@Component
public class MessageAccessPolicyValidator {

    private static final int LEGAL_SETTLEMENT_DAYS = 45;

    public void validateCanSendMessage(Conversation conversation, User sender) {
        UUID senderId = sender.getId();
        boolean isTenant = conversation.getTenant().getId().equals(senderId);
        boolean isHost = conversation.getHost().getId().equals(senderId);

        // 1. Verificación de Participación (Anti-IDOR)
        if (!isTenant && !isHost) {
            throw new UnauthorizedActionException("No tienes permisos para participar en esta conversación.");
        }

        // 2. Verificación de Sanción y Baja (Baneo y Soft Delete)
        if (sender.isBanned()) {
            throw new BusinessRuleValidationException("Tu cuenta se encuentra suspendida temporalmente.");
        }
        if (sender.getDeletedAt() != null) {
            throw new BusinessRuleValidationException("Tu cuenta se encuentra dada de baja.");
        }

        User recipient = isTenant ? conversation.getHost() : conversation.getTenant();
        if (recipient.isBanned()) {
            throw new BusinessRuleValidationException("El destinatario se encuentra suspendido.");
        }
        if (recipient.getDeletedAt() != null) {
            throw new BusinessRuleValidationException("El destinatario se encuentra dado de baja.");
        }

        // 3. Verificación de Estado del Inmueble (Anuncio Baneado o Eliminado)
        AccommodationListing listing = conversation.getListing();
        if (listing != null && (listing.getBannedAt() != null || listing.getDeletedAt() != null)) {
            throw new BusinessRuleValidationException("El anuncio asociado a esta conversación ya no se encuentra disponible.");
        }

        // 4. Verificación de Ciclo de Vida y Ventana Legal de 45 días
        BookingRequest booking = conversation.getActiveBookingRequest();
        if (booking != null) {
            validateBookingLifecycleWindow(booking);
        }
    }

    public void validateCanAccessConversation(Conversation conversation, UUID userId) {
        boolean isTenant = conversation.getTenant().getId().equals(userId);
        boolean isHost = conversation.getHost().getId().equals(userId);

        if (!isTenant && !isHost) {
            throw new UnauthorizedActionException("Acceso denegado a la conversación.");
        }
    }

    private void validateBookingLifecycleWindow(BookingRequest booking) {
        RequestStatus status = booking.getStatus();
        LocalDate now = LocalDate.now();

        switch (status) {
            case PENDING, ACCEPTED -> {
                // Totalmente abierto y operativo
            }
            case CONFIRMED -> {
                // Si la estancia ha concluido (now > endDate), aplicar plazo legal de 45 días tras fin de estancia
                if (now.isAfter(booking.getEndDate())) {
                    LocalDate legalCutoff = booking.getEndDate().plusDays(LEGAL_SETTLEMENT_DAYS);
                    if (now.isAfter(legalCutoff)) {
                        throw new BusinessRuleValidationException(
                            "El canal de comunicación ha finalizado. Han transcurrido más de " + 
                            LEGAL_SETTLEMENT_DAYS + " días desde la finalización de la estancia."
                        );
                    }
                }
                // Si la estancia no ha concluido aún, está totalmente abierto
            }
            case CANCELLED -> {
                // Si hubo fianza/transacción previa, mantener 45 días para liquidaciones contados desde la cancelación
                if (booking.getTransactionId() != null) {
                    LocalDate cancellationDate = booking.getUpdatedAt() != null
                            ? booking.getUpdatedAt().toLocalDate()
                            : (booking.getCreatedAt() != null ? booking.getCreatedAt().toLocalDate() : now);
                    LocalDate legalCutoff = cancellationDate.plusDays(LEGAL_SETTLEMENT_DAYS);
                    if (now.isAfter(legalCutoff)) {
                        throw new BusinessRuleValidationException(
                            "El canal de resolución de fianza para esta reserva cancelada ha expirado tras " + 
                            LEGAL_SETTLEMENT_DAYS + " días desde la cancelación."
                        );
                    }
                }
                // Si fue cancelada sin transacción económica, el hilo opera como consulta abierta para renegociar
            }
            case REJECTED, EXPIRED -> {
                // Una solicitud rechazada o expirada se desvincula de la conversación, permitiendo renegociar como consulta
            }
        }
    }
}
