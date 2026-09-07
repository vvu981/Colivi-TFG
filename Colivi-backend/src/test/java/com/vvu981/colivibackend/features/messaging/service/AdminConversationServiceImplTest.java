package com.vvu981.colivibackend.features.messaging.service;

import com.vvu981.colivibackend.core.exception.ResourceNotFoundException;
import com.vvu981.colivibackend.features.accommodation.domain.Accommodation;
import com.vvu981.colivibackend.features.accommodation.domain.AccommodationImage;
import com.vvu981.colivibackend.features.accommodation.domain.AccommodationListing;
import com.vvu981.colivibackend.features.accommodation.domain.RentalType;
import com.vvu981.colivibackend.features.messaging.domain.Conversation;
import com.vvu981.colivibackend.features.messaging.domain.Message;
import com.vvu981.colivibackend.features.messaging.domain.MessageStatus;
import com.vvu981.colivibackend.features.messaging.domain.MessageType;
import com.vvu981.colivibackend.features.messaging.dto.AdminConversationDossierDto;
import com.vvu981.colivibackend.features.messaging.repository.ConversationRepository;
import com.vvu981.colivibackend.features.messaging.repository.MessageRepository;
import com.vvu981.colivibackend.features.report.domain.ReportTargetType;
import com.vvu981.colivibackend.features.report.repository.ReportRepository;
import com.vvu981.colivibackend.features.user.domain.UserRole;
import com.vvu981.colivibackend.features.user.domain.User;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
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

        when(messageRepository.findAllByConversationIdOrderByCreatedAtAsc(conversationId))
                .thenReturn(List.of(message));

        AdminConversationDossierDto dossier = adminConversationService.getConversationDossier(conversationId);

        assertThat(dossier).isNotNull();
        assertThat(dossier.conversationId()).isEqualTo(conversationId);
        assertThat(dossier.isReported()).isTrue();
        assertThat(dossier.listing()).isNotNull();
        assertThat(dossier.listing().title()).isEqualTo("Piso céntrico");
        assertThat(dossier.tenant().nickname()).isEqualTo("tenant1");
        assertThat(dossier.host().nickname()).isEqualTo("host1");
        assertThat(dossier.messages()).hasSize(1);
        assertThat(dossier.messages().get(0).content()).isEqualTo("Hola, me interesa el piso.");
    }

    @Test
    void getConversationDossier_shouldThrowException_whenNotFound() {
        when(conversationRepository.findById(conversationId)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> adminConversationService.getConversationDossier(conversationId))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessageContaining("Conversación no encontrada");
    }
}
