package com.vvu981.colivibackend.features.messaging.service;

import com.vvu981.colivibackend.core.exception.BusinessRuleValidationException;
import com.vvu981.colivibackend.core.exception.ResourceNotFoundException;
import com.vvu981.colivibackend.core.exception.UnauthorizedActionException;
import com.vvu981.colivibackend.features.accommodation.domain.AccommodationListing;
import com.vvu981.colivibackend.features.accommodation.domain.ListingStatus;
import com.vvu981.colivibackend.features.accommodation.repository.AccommodationListingRepository;
import com.vvu981.colivibackend.features.bookingRequests.domain.BookingRequest;
import com.vvu981.colivibackend.features.bookingRequests.repository.BookingRequestRepository;
import com.vvu981.colivibackend.features.messaging.domain.Conversation;
import com.vvu981.colivibackend.features.messaging.dto.ConversationSummaryDto;
import com.vvu981.colivibackend.features.messaging.repository.ConversationRepository;
import com.vvu981.colivibackend.features.messaging.service.validator.MessageAccessPolicyValidator;
import com.vvu981.colivibackend.features.report.domain.ReportTargetType;
import com.vvu981.colivibackend.features.report.repository.ReportRepository;
import com.vvu981.colivibackend.features.user.domain.User;
import com.vvu981.colivibackend.features.user.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.Collections;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("ConversationServiceImpl Unit Tests")
class ConversationServiceImplTest {

    @Mock
    private ConversationRepository conversationRepository;

    @Mock
    private AccommodationListingRepository listingRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private BookingRequestRepository bookingRequestRepository;

    @Mock
    private MessageAccessPolicyValidator accessPolicyValidator;

    @Mock
    private ReportRepository reportRepository;

    @InjectMocks
    private ConversationServiceImpl conversationService;

    private User tenant;
    private User host;
    private AccommodationListing listing;
    private Conversation conversation;
    private UUID tenantId;
    private UUID hostId;
    private UUID listingId;
    private UUID conversationId;

    @BeforeEach
    void setUp() {
        tenantId = UUID.randomUUID();
        hostId = UUID.randomUUID();
        listingId = UUID.randomUUID();
        conversationId = UUID.randomUUID();

        tenant = new User();
        tenant.setId(tenantId);
        tenant.setFirstName("Inquilino");
        tenant.setLastName1("Perez");
        tenant.setEmail("inquilino@test.com");

        host = new User();
        host.setId(hostId);
        host.setFirstName("Anfitrion");
        host.setLastName1("Gomez");
        host.setEmail("anfitrion@test.com");

        listing = AccommodationListing.builder()
                .id(listingId)
                .title("Piso Centro")
                .pricePerMonth(BigDecimal.valueOf(500))
                .host(host)
                .status(ListingStatus.AVAILABLE)
                .build();

        conversation = Conversation.builder()
                .id(conversationId)
                .tenant(tenant)
                .host(host)
                .listing(listing)
                .lastMessageAt(LocalDateTime.now())
                .lastMessagePreview("Hola")
                .tenantUnreadCount(0)
                .hostUnreadCount(1)
                .userMessageCount(1)
                .archivedByHost(false)
                .archivedByTenant(false)
                .build();
    }

    @Nested
    @DisplayName("getOrCreateConsultation tests")
    class GetOrCreateConsultationTests {

        @Test
        @DisplayName("Lanza ResourceNotFoundException si el inquilino no existe")
        void whenTenantNotFound_thenThrowException() {
            when(userRepository.findById(tenantId)).thenReturn(Optional.empty());

            assertThatThrownBy(() -> conversationService.getOrCreateConsultation(tenantId, listingId))
                    .isInstanceOf(ResourceNotFoundException.class)
                    .hasMessageContaining("Inquilino no encontrado");
        }

        @Test
        @DisplayName("Lanza ResourceNotFoundException si el anuncio no existe")
        void whenListingNotFound_thenThrowException() {
            when(userRepository.findById(tenantId)).thenReturn(Optional.of(tenant));
            when(listingRepository.findById(listingId)).thenReturn(Optional.empty());

            assertThatThrownBy(() -> conversationService.getOrCreateConsultation(tenantId, listingId))
                    .isInstanceOf(ResourceNotFoundException.class)
                    .hasMessageContaining("Anuncio no encontrado");
        }

        @Test
        @DisplayName("Lanza BusinessRuleValidationException si el anfitrión abre consulta sobre su propio anuncio")
        void whenHostConsultsOwnListing_thenThrowException() {
            when(userRepository.findById(hostId)).thenReturn(Optional.of(host));
            when(listingRepository.findById(listingId)).thenReturn(Optional.of(listing));

            assertThatThrownBy(() -> conversationService.getOrCreateConsultation(hostId, listingId))
                    .isInstanceOf(BusinessRuleValidationException.class)
                    .hasMessageContaining("no puede abrir un canal de consulta sobre su propio anuncio");
        }

        @Test
        @DisplayName("Retorna la conversación existente incluso si el anuncio está UNAVAILABLE")
        void whenConversationExists_andListingUnavailable_thenReturnExisting() {
            listing.setStatus(ListingStatus.UNAVAILABLE);
            when(userRepository.findById(tenantId)).thenReturn(Optional.of(tenant));
            when(listingRepository.findById(listingId)).thenReturn(Optional.of(listing));
            when(conversationRepository.findByTenantIdAndHostIdAndListingId(tenantId, hostId, listingId))
                    .thenReturn(Optional.of(conversation));

            Conversation result = conversationService.getOrCreateConsultation(tenantId, listingId);

            assertThat(result).isNotNull();
            assertThat(result.getId()).isEqualTo(conversationId);
            verify(conversationRepository, never()).save(any());
        }

        @Test
        @DisplayName("Lanza BusinessRuleValidationException si se intenta crear una NUEVA conversación y el anuncio está UNAVAILABLE")
        void whenNewConversation_andListingUnavailable_thenThrowException() {
            listing.setStatus(ListingStatus.UNAVAILABLE);
            when(userRepository.findById(tenantId)).thenReturn(Optional.of(tenant));
            when(listingRepository.findById(listingId)).thenReturn(Optional.of(listing));
            when(conversationRepository.findByTenantIdAndHostIdAndListingId(tenantId, hostId, listingId))
                    .thenReturn(Optional.empty());

            assertThatThrownBy(() -> conversationService.getOrCreateConsultation(tenantId, listingId))
                    .isInstanceOf(BusinessRuleValidationException.class)
                    .hasMessageContaining("El anuncio no está disponible actualmente.");
        }

        @Test
        @DisplayName("Retorna la conversación existente si ya fue creada previamente")
        void whenConversationExists_thenReturnExisting() {
            when(userRepository.findById(tenantId)).thenReturn(Optional.of(tenant));
            when(listingRepository.findById(listingId)).thenReturn(Optional.of(listing));
            when(conversationRepository.findByTenantIdAndHostIdAndListingId(tenantId, hostId, listingId))
                    .thenReturn(Optional.of(conversation));

            Conversation result = conversationService.getOrCreateConsultation(tenantId, listingId);

            assertThat(result).isNotNull();
            assertThat(result.getId()).isEqualTo(conversationId);
            verify(conversationRepository, never()).save(any());
        }

        @Test
        @DisplayName("Actualiza el activeBookingRequest si la conversación existente tenía uno antiguo diferente")
        void whenConversationExists_withOutdatedBooking_thenUpdateToNewActiveBooking() {
            BookingRequest oldBooking = BookingRequest.builder().id(UUID.randomUUID()).build();
            BookingRequest newBooking = BookingRequest.builder().id(UUID.randomUUID()).build();
            conversation.setActiveBookingRequest(oldBooking);

            when(userRepository.findById(tenantId)).thenReturn(Optional.of(tenant));
            when(listingRepository.findById(listingId)).thenReturn(Optional.of(listing));
            when(bookingRequestRepository.findActiveRequestsByUserAndListing(tenantId, listingId))
                    .thenReturn(List.of(newBooking));
            when(conversationRepository.findByTenantIdAndHostIdAndListingId(tenantId, hostId, listingId))
                    .thenReturn(Optional.of(conversation));

            Conversation result = conversationService.getOrCreateConsultation(tenantId, listingId);

            assertThat(result.getActiveBookingRequest()).isEqualTo(newBooking);
            verify(conversationRepository).linkActiveBookingRequest(conversation.getId(), newBooking);
        }

        @Test
        @DisplayName("Desvincula activeBookingRequest si la conversación tenía uno pero ya no hay ninguno activo")
        void whenConversationExists_withBookingNowInactive_thenUnlinkBooking() {
            UUID oldBookingId = UUID.randomUUID();
            BookingRequest oldBooking = BookingRequest.builder().id(oldBookingId).build();
            conversation.setActiveBookingRequest(oldBooking);

            when(userRepository.findById(tenantId)).thenReturn(Optional.of(tenant));
            when(listingRepository.findById(listingId)).thenReturn(Optional.of(listing));
            when(bookingRequestRepository.findActiveRequestsByUserAndListing(tenantId, listingId))
                    .thenReturn(Collections.emptyList());
            when(conversationRepository.findByTenantIdAndHostIdAndListingId(tenantId, hostId, listingId))
                    .thenReturn(Optional.of(conversation));

            Conversation result = conversationService.getOrCreateConsultation(tenantId, listingId);

            assertThat(result.getActiveBookingRequest()).isNull();
            verify(conversationRepository).unlinkBookingRequest(oldBookingId);
        }

        @Test
        @DisplayName("Crea y guarda una nueva conversación si no existe")
        void whenConversationDoesNotExist_thenCreateAndSave() {
            when(userRepository.findById(tenantId)).thenReturn(Optional.of(tenant));
            when(listingRepository.findById(listingId)).thenReturn(Optional.of(listing));
            when(conversationRepository.findByTenantIdAndHostIdAndListingId(tenantId, hostId, listingId))
                    .thenReturn(Optional.empty());
            when(conversationRepository.save(any(Conversation.class))).thenAnswer(invocation -> {
                Conversation c = invocation.getArgument(0);
                c.setId(UUID.randomUUID());
                return c;
            });

            Conversation result = conversationService.getOrCreateConsultation(tenantId, listingId);

            assertThat(result).isNotNull();
            assertThat(result.getListing()).isEqualTo(listing);
            assertThat(result.getTenant()).isEqualTo(tenant);
            assertThat(result.getHost()).isEqualTo(host);
            verify(conversationRepository).save(any(Conversation.class));
        }
    }

    @Nested
    @DisplayName("getConversationById tests")
    class GetConversationByIdTests {

        @Test
        @DisplayName("Lanza ResourceNotFoundException si la conversación no existe")
        void whenConversationNotFound_thenThrowException() {
            when(conversationRepository.findById(conversationId)).thenReturn(Optional.empty());

            assertThatThrownBy(() -> conversationService.getConversationById(conversationId, tenantId))
                    .isInstanceOf(ResourceNotFoundException.class)
                    .hasMessageContaining("Conversación no encontrada");
        }

        @Test
        @DisplayName("Valida la política de acceso y retorna la conversación si existe")
        void whenConversationFound_thenValidateAccessAndReturn() {
            when(conversationRepository.findById(conversationId)).thenReturn(Optional.of(conversation));
            doNothing().when(accessPolicyValidator).validateCanAccessConversation(conversation, tenantId);

            Conversation result = conversationService.getConversationById(conversationId, tenantId);

            assertThat(result).isEqualTo(conversation);
            verify(accessPolicyValidator).validateCanAccessConversation(conversation, tenantId);
        }
    }

    @Nested
    @DisplayName("getConversationSummary tests")
    class GetConversationSummaryTests {

        @Test
        @DisplayName("Retorna el DTO con el flag de reporte correspondiente")
        void whenGetSummary_thenReturnDtoWithReportedFlag() {
            when(conversationRepository.findById(conversationId)).thenReturn(Optional.of(conversation));
            when(reportRepository.existsByReporterIdAndTargetTypeAndTargetIdAndStatusIn(eq(tenantId), eq(ReportTargetType.CONVERSATION), eq(conversationId), anyList()))
                    .thenReturn(true);

            ConversationSummaryDto summary = conversationService.getConversationSummary(conversationId, tenantId);

            assertThat(summary).isNotNull();
            assertThat(summary.conversationId()).isEqualTo(conversationId);
            assertThat(summary.isReported()).isTrue();
        }
    }

    @Nested
    @DisplayName("getInbox tests")
    class GetInboxTests {

        @Test
        @DisplayName("Retorna página vacía sin invocar el repositorio de reportes")
        void whenInboxEmpty_thenReturnEmptyPageWithoutReportLookup() {
            Pageable pageable = PageRequest.of(0, 10);
            when(conversationRepository.findInboxByUserId(tenantId, false, pageable))
                    .thenReturn(new PageImpl<>(Collections.emptyList(), pageable, 0));

            Page<ConversationSummaryDto> result = conversationService.getInbox(tenantId, false, pageable);

            assertThat(result.getContent()).isEmpty();
            verify(reportRepository, never()).findExistingReportedTargetIdsByReporter(any(), any(), any());
        }

        @Test
        @DisplayName("Retorna conversaciones mapeadas e inyecta isReported adecuadamente")
        void whenInboxHasConversations_thenInjectReportFlags() {
            Pageable pageable = PageRequest.of(0, 10);
            when(conversationRepository.findInboxByUserId(tenantId, false, pageable))
                    .thenReturn(new PageImpl<>(List.of(conversation), pageable, 1));
            when(reportRepository.findExistingReportedTargetIdsByReporter(eq(tenantId), eq(ReportTargetType.CONVERSATION), anyList()))
                    .thenReturn(List.of(conversationId));

            Page<ConversationSummaryDto> result = conversationService.getInbox(tenantId, false, pageable);

            assertThat(result.getContent()).hasSize(1);
            assertThat(result.getContent().get(0).conversationId()).isEqualTo(conversationId);
            assertThat(result.getContent().get(0).isReported()).isTrue();
        }
    }

    @Nested
    @DisplayName("archiveConversation tests")
    class ArchiveConversationTests {

        @Test
        @DisplayName("Lanza ResourceNotFoundException si la conversación no existe")
        void whenNotFound_thenThrowException() {
            when(conversationRepository.findById(conversationId)).thenReturn(Optional.empty());

            assertThatThrownBy(() -> conversationService.archiveConversation(conversationId, hostId, true))
                    .isInstanceOf(ResourceNotFoundException.class)
                    .hasMessageContaining("Conversación no encontrada");
        }

        @Test
        @DisplayName("Lanza UnauthorizedActionException si el solicitante no es ni anfitrión ni inquilino")
        void whenRequesterNeitherHostNorTenant_thenThrowUnauthorized() {
            UUID strangerId = UUID.randomUUID();
            when(conversationRepository.findById(conversationId)).thenReturn(Optional.of(conversation));

            assertThatThrownBy(() -> conversationService.archiveConversation(conversationId, strangerId, true))
                    .isInstanceOf(UnauthorizedActionException.class)
                    .hasMessageContaining("No tienes permisos para archivar esta conversación");
        }

        @Test
        @DisplayName("Actualiza el estado de archivado si el solicitante es el anfitrión")
        void whenRequesterIsHost_thenUpdateArchivedByHost() {
            when(conversationRepository.findById(conversationId)).thenReturn(Optional.of(conversation));

            conversationService.archiveConversation(conversationId, hostId, true);

            verify(conversationRepository).updateArchivedByHost(conversationId, true);
        }

        @Test
        @DisplayName("Actualiza el estado de archivado si el solicitante es el inquilino")
        void whenRequesterIsTenant_thenUpdateArchivedByTenant() {
            when(conversationRepository.findById(conversationId)).thenReturn(Optional.of(conversation));

            conversationService.archiveConversation(conversationId, tenantId, true);

            verify(conversationRepository).updateArchivedByTenant(conversationId, true);
        }
    }

    @Nested
    @DisplayName("linkBookingRequest and unlinkBookingRequest tests")
    class BookingRequestLinkTests {

        @Test
        @DisplayName("linkBookingRequest: Lanza excepción si la conversación no existe")
        void whenConversationNotFound_thenThrowException() {
            UUID bookingId = UUID.randomUUID();
            when(conversationRepository.findById(conversationId)).thenReturn(Optional.empty());

            assertThatThrownBy(() -> conversationService.linkBookingRequest(conversationId, bookingId))
                    .isInstanceOf(ResourceNotFoundException.class)
                    .hasMessageContaining("Conversación no encontrada");
        }

        @Test
        @DisplayName("linkBookingRequest: Lanza excepción si la reserva no existe")
        void whenBookingNotFound_thenThrowException() {
            UUID bookingId = UUID.randomUUID();
            when(conversationRepository.findById(conversationId)).thenReturn(Optional.of(conversation));
            when(bookingRequestRepository.findById(bookingId)).thenReturn(Optional.empty());

            assertThatThrownBy(() -> conversationService.linkBookingRequest(conversationId, bookingId))
                    .isInstanceOf(ResourceNotFoundException.class)
                    .hasMessageContaining("Solicitud de reserva no encontrada");
        }

        @Test
        @DisplayName("linkBookingRequest: Vincula la reserva exitosamente")
        void whenBothExist_thenLinkBooking() {
            UUID bookingId = UUID.randomUUID();
            BookingRequest booking = BookingRequest.builder().id(bookingId).build();
            when(conversationRepository.findById(conversationId)).thenReturn(Optional.of(conversation));
            when(bookingRequestRepository.findById(bookingId)).thenReturn(Optional.of(booking));

            conversationService.linkBookingRequest(conversationId, bookingId);

            verify(conversationRepository).linkActiveBookingRequest(conversationId, booking);
        }

        @Test
        @DisplayName("unlinkBookingRequest: Desvincula la reserva en el repositorio")
        void unlinkBookingRequest_thenDelegateToRepo() {
            UUID bookingId = UUID.randomUUID();

            conversationService.unlinkBookingRequest(bookingId);

            verify(conversationRepository).unlinkBookingRequest(bookingId);
        }

        @Test
        @DisplayName("linkBookingRequestIfExists: Si existe conversación, delega en linkBookingRequest")
        void linkBookingRequestIfExists_whenExists_thenLink() {
            UUID bookingId = UUID.randomUUID();
            BookingRequest booking = BookingRequest.builder().id(bookingId).build();
            when(conversationRepository.findByTenantIdAndHostIdAndListingId(tenantId, hostId, listingId))
                    .thenReturn(Optional.of(conversation));
            when(bookingRequestRepository.findById(bookingId)).thenReturn(Optional.of(booking));

            conversationService.linkBookingRequestIfExists(tenantId, hostId, listingId, bookingId);

            verify(conversationRepository).linkActiveBookingRequest(conversationId, booking);
        }

        @Test
        @DisplayName("linkBookingRequestIfExists: Si no existe conversación, no hace nada")
        void linkBookingRequestIfExists_whenDoesNotExist_thenDoNothing() {
            UUID bookingId = UUID.randomUUID();
            when(conversationRepository.findByTenantIdAndHostIdAndListingId(tenantId, hostId, listingId))
                    .thenReturn(Optional.empty());

            conversationService.linkBookingRequestIfExists(tenantId, hostId, listingId, bookingId);

            verify(conversationRepository, never()).linkActiveBookingRequest(any(), any());
        }
    }
}
