package com.vvu981.colivibackend.features.accommodation.service;

import com.vvu981.colivibackend.core.BaseIntegrationTest;
import com.vvu981.colivibackend.features.accommodation.domain.Accommodation;
import com.vvu981.colivibackend.features.accommodation.domain.RentalType;
import com.vvu981.colivibackend.features.accommodation.dto.AccommodationListingRequest;
import com.vvu981.colivibackend.features.accommodation.repository.AccommodationRepository;
import com.vvu981.colivibackend.features.user.domain.User;
import com.vvu981.colivibackend.features.user.domain.UserRole;
import com.vvu981.colivibackend.features.user.repository.UserRepository;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.concurrent.*;
import java.util.concurrent.atomic.AtomicInteger;

import static org.junit.jupiter.api.Assertions.*;

@DisplayName("AccommodationListing Concurrency Integration Test")
public class AccommodationListingConcurrencyIntegrationTest extends BaseIntegrationTest {

    @Autowired
    private AccommodationListingService listingService;

    @Autowired
    private AccommodationRepository accommodationRepository;

    @Autowired
    private UserRepository userRepository;

    private User testUser;
    private Accommodation testAccommodation;

    @BeforeEach
    void setUp() {
        testUser = new User();
        testUser.setEmail("host_concurrent@example.com");
        testUser.setPasswordHash("Password123!");
        testUser.setFirstName("Test");
        testUser.setLastName1("User");
        testUser.setNickname("host_concurrent");
        testUser.setRole(UserRole.USER);
        testUser = userRepository.save(testUser);

        testAccommodation = new Accommodation();
        testAccommodation.setOwner(testUser);
        testAccommodation.setAddress("Calle de la Concurrencia 123");
        testAccommodation.setCity("Madrid");
        testAccommodation.setProvince("Madrid");
        testAccommodation.setCountry("España");
        testAccommodation.setLatitude(40.4168);
        testAccommodation.setLongitude(-3.7038);
        testAccommodation.setSquareMeters(100);
        testAccommodation.setTotalRooms(1); // SOLO 1 HABITACION DISPONIBLE
        testAccommodation.setTotalBathrooms(1);
        testAccommodation.setFreeRooms(1);
        testAccommodation.setCreatedAt(LocalDateTime.now());
        testAccommodation.setUpdatedAt(LocalDateTime.now());
        testAccommodation = accommodationRepository.save(testAccommodation);
    }

    @AfterEach
    void tearDown() {
        accommodationRepository.deleteAll();
        userRepository.deleteAll();
    }

    @Test
    @DisplayName("Debe prevenir overbooking cuando dos peticiones concurrentes intentan alquilar la última habitación")
    void testConcurrentListingCreationPreventsOverbooking() throws InterruptedException {
        int numberOfThreads = 2;
        ExecutorService executorService = Executors.newFixedThreadPool(numberOfThreads);
        CountDownLatch latch = new CountDownLatch(1);
        CountDownLatch doneLatch = new CountDownLatch(numberOfThreads);

        AtomicInteger successCount = new AtomicInteger(0);
        AtomicInteger exceptionCount = new AtomicInteger(0);

        Runnable task = () -> {
            try {
                latch.await(); // Esperar hasta que se libere el latch para ejecución concurrente

                AccommodationListingRequest request = new AccommodationListingRequest(
                        testAccommodation.getId(),
                        "Habitación Concurrente",
                        "Descripción de prueba",
                        BigDecimal.valueOf(450),
                        RentalType.ROOM,
                        BigDecimal.valueOf(100),
                        null);

                // Llamada real al servicio
                listingService.createAccommodationListing(request, testUser.getId());
                successCount.incrementAndGet();

            } catch (Exception e) {
                exceptionCount.incrementAndGet();
                // Esperamos BusinessRuleValidationException ("Se alcanzó el límite...") o
                // PessimisticLockingFailureException
                System.out.println("Excepción capturada: " + e.getMessage());
            } finally {
                doneLatch.countDown();
            }
        };

        // Enviar tareas al executor
        for (int i = 0; i < numberOfThreads; i++) {
            executorService.submit(task);
        }

        // Dar la señal de salida para que se ejecuten simultáneamente
        latch.countDown();

        // Esperar a que terminen los hilos (máx 10 segundos)
        boolean finished = doneLatch.await(10, TimeUnit.SECONDS);
        assertTrue(finished, "Los hilos no terminaron a tiempo");

        // Afirmaciones: Sólo un hilo debió tener éxito
        assertEquals(1, successCount.get(), "Sólo un anuncio debió ser creado exitosamente.");
        assertEquals(1, exceptionCount.get(),
                "La petición concurrente debió lanzar una excepción (BusinessRuleValidationException o LockTimeout).");

        executorService.shutdown();
    }
}
