package com.vvu981.colivibackend.features.messaging.service;

import com.vvu981.colivibackend.core.exception.ResourceNotFoundException;
import com.vvu981.colivibackend.features.accommodation.domain.Accommodation;
import com.vvu981.colivibackend.features.accommodation.domain.AccommodationImage;
import com.vvu981.colivibackend.features.accommodation.domain.AccommodationListing;
import com.vvu981.colivibackend.features.accommodation.domain.RentalType;
import com.vvu981.colivibackend.features.bookingRequests.domain.BookingRequest;
import com.vvu981.colivibackend.features.bookingRequests.domain.RequestStatus;
import com.vvu981.colivibackend.features.messaging.domain.Conversation;
import com.vvu981.colivibackend.features.messaging.domain.Message;
import com.vvu981.colivibackend.features.messaging.domain.MessageStatus;
import com.vvu981.colivibackend.features.messaging.domain.MessageType;
import com.vvu981.colivibackend.features.messaging.dto.AdminConversationDossierDto;
import com.vvu981.colivibackend.features.messaging.repository.ConversationRepository;
import com.vvu981.colivibackend.features.messaging.repository.MessageRepository;
import com.vvu981.colivibackend.features.report.domain.ReportTargetType;
import com.vvu981.colivibackend.features.report.repository.ReportRepository;
import com.vvu981.colivibackend.features.user.domain.User;
import com.vvu981.colivibackend.features.user.domain.UserRole;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Pageable;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Collections;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
@DisplayName("AdminConversationServiceImpl Unit Tests")
class AdminConversationServiceImplTest {

    @Mock
    private ConversationRepository conversationRepository;
    @Mock
    private MessageRepository messageRepository;
    @Mock
    private ReportRepository reportRepository;

    @InjectMocks
    private AdminConversationServiceImpl adminConversationService;

    private UUID conversationId;
    private Conversation conversation;
    private User tenant;
    private User host;
    private AccommodationListing listing;

    @BeforeEach
    void setUp() {
        conversationId = UUID.randomUUID();

        tenant = new User();
        tenant.setId(UUID.randomUUID());
        tenant.setNickname("tenant1");
        tenant.setFirstName("Juan");
        tenant.setLastName1("Perez");
        tenant.setLastName2("Gomez");
        tenant.setEmail("tenant@example.com");
        tenant.setRole(UserRole.USER);

        host = new User();
        host.setId(UUID.randomUUID());
        host.setNickname("host1");
        host.setFirstName("Maria");
        host.setLastName1("Garcia");
        host.setEmail("host@example.com");
        host.setRole(UserRole.USER);

        Accommodation accommodation = new Accommodation();
        accommodation.setCity("Madrid");
        AccommodationImage img = new AccommodationImage();
        img.setImageUrl("https://example.com/img.jpg");
        accommodation.setImages(List.of(img));

        listing = new AccommodationListing();
        listing.setId(UUID.randomUUID());
        listing.setTitle("Piso céntrico");
        listing.setPricePerMonth(new BigDecimal("500.00"));
        listing.setRentalType(RentalType.ROOM);
        listing.setAccommodation(accommodation);

        conversation = Conversation.builder()
                .id(conversationId)
                .tenant(tenant)
                .host(host)
                .listing(listing)
                .createdAt(LocalDateTime.now())
                .lastMessageAt(LocalDateTime.now())
                .build();
    }

    @Test
    @DisplayName("Retorna el dossier completo con listado, inquilino, anfitrión y mensajes")
    void getConversationDossier_shouldReturnDossierSuccessfully() {
        when(conversationRepository.findById(conversationId)).thenReturn(Optional.of(conversation));
        when(reportRepository.existsByTargetTypeAndTargetId(ReportTargetType.CONVERSATION, conversationId)).thenReturn(true);

        Message message = Message.builder()
                .id(UUID.randomUUID())
                .conversation(conversation)
                .sender(tenant)
                .content("Hola, me interesa el piso.")
                .messageType(MessageType.USER_MESSAGE)
                .status(MessageStatus.SENT)
                .createdAt(LocalDateTime.now())
                .build();

        when(messageRepository.findTopMessagesByConversationId(eq(conversationId), any(Pageable.class)))
                .thenReturn(List.of(message));

        AdminConversationDossierDto dossier = adminConversationService.getConversationDossier(conversationId);

        assertThat(dossier).isNotNull();
        assertThat(dossier.conversationId()).isEqualTo(conversationId);
        assertThat(dossier.isReported()).isTrue();
        assertThat(dossier.listing()).isNotNull();
        assertThat(dossier.listing().title()).isEqualTo("Piso céntrico");
        assertThat(dossier.tenant().nickname()).isEqualTo("tenant1");
        assertThat(dossier.tenant().lastName()).isEqualTo("Perez Gomez");
        assertThat(dossier.host().nickname()).isEqualTo("host1");
        assertThat(dossier.host().lastName()).isEqualTo("Garcia");
        assertThat(dossier.messages()).hasSize(1);
        assertThat(dossier.messages().get(0).content()).isEqualTo("Hola, me interesa el piso.");
    }

    @Test
    @DisplayName("Retorna dossier con reserva activa vinculada e información de transacción")
    void getConversationDossier_withActiveBooking() {
        BookingRequest booking = BookingRequest.builder()
                .id(UUID.randomUUID())
                .status(RequestStatus.CONFIRMED)
                .startDate(LocalDate.now())
                .endDate(LocalDate.now().plusMonths(3))
                .transactionId("tx_stripe_999")
                .build();
        conversation.setActiveBookingRequest(booking);

        when(conversationRepository.findById(conversationId)).thenReturn(Optional.of(conversation));
        when(reportRepository.existsByTargetTypeAndTargetId(ReportTargetType.CONVERSATION, conversationId)).thenReturn(false);
        when(messageRepository.findTopMessagesByConversationId(eq(conversationId), any(Pageable.class))).thenReturn(Collections.emptyList());

        AdminConversationDossierDto dossier = adminConversationService.getConversationDossier(conversationId);

        assertThat(dossier).isNotNull();
        assertThat(dossier.isReported()).isFalse();
        assertThat(dossier.activeBooking()).isNotNull();
        assertThat(dossier.activeBooking().status()).isEqualTo("CONFIRMED");
        assertThat(dossier.activeBooking().transactionId()).isEqualTo("tx_stripe_999");
    }

    @Test
    @DisplayName("Retorna dossier con anuncio nulo y usuarios nulos defensivamente")
    void getConversationDossier_withNullListingAndUsers() {
        conversation.setListing(null);
        conversation.setTenant(null);
        conversation.setHost(null);

        when(conversationRepository.findById(conversationId)).thenReturn(Optional.of(conversation));
        when(reportRepository.existsByTargetTypeAndTargetId(ReportTargetType.CONVERSATION, conversationId)).thenReturn(false);
        when(messageRepository.findTopMessagesByConversationId(eq(conversationId), any(Pageable.class))).thenReturn(Collections.emptyList());

        AdminConversationDossierDto dossier = adminConversationService.getConversationDossier(conversationId);

        assertThat(dossier).isNotNull();
        assertThat(dossier.listing()).isNull();
        assertThat(dossier.tenant()).isNull();
        assertThat(dossier.host()).isNull();
    }

    @Test
    @DisplayName("Lanza ResourceNotFoundException si la conversación no existe")
    void getConversationDossier_shouldThrowException_whenNotFound() {
        when(conversationRepository.findById(conversationId)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> adminConversationService.getConversationDossier(conversationId))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessageContaining("Conversación no encontrada");
    }
}
