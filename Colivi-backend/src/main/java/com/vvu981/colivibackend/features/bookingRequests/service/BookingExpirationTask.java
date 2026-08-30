package com.vvu981.colivibackend.features.bookingRequests.service;

import com.vvu981.colivibackend.features.bookingRequests.domain.BookingRequest;
import com.vvu981.colivibackend.features.bookingRequests.domain.RequestStatus;
import com.vvu981.colivibackend.features.bookingRequests.repository.BookingRequestRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Slf4j
@Component
@RequiredArgsConstructor
public class BookingExpirationTask {

    private final BookingRequestRepository bookingRequestRepository;

    /**
     * Tarea programada que se ejecuta cada hora para comprobar si alguna solicitud 
     * ha superado su fecha límite de pago (expiresAt) estando en estado ACCEPTED.
     */
    @Scheduled(fixedRate = 3600000) // Se ejecuta cada hora
    @Transactional
    public void expireUnpaidRequests() {
        log.info("Iniciando tarea programada: comprobación de expiración de reservas aceptadas...");

        LocalDateTime now = LocalDateTime.now();
        List<BookingRequest> expiredRequests = bookingRequestRepository
                .findByStatusAndExpiresAtBefore(RequestStatus.ACCEPTED, now);

        if (expiredRequests.isEmpty()) {
            log.info("No se han encontrado reservas caducadas.");
            return;
        }

        log.info("Se han encontrado {} reservas que superaron el tiempo límite de pago.", expiredRequests.size());

        for (BookingRequest request : expiredRequests) {
            try {
                request.expire();
                log.info("Solicitud {} marcada como EXPIRED.", request.getId());
            } catch (Exception e) {
                log.error("Error al expirar la solicitud {}: {}", request.getId(), e.getMessage());
            }
        }

        bookingRequestRepository.saveAll(expiredRequests);
        log.info("Tarea de expiración de reservas completada con éxito.");
    }
}
