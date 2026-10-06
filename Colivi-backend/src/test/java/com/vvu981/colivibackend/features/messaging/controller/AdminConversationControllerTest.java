package com.vvu981.colivibackend.features.messaging.controller;

import com.vvu981.colivibackend.core.security.JwtTokenProvider;
import com.vvu981.colivibackend.features.messaging.dto.AdminConversationDossierDto;
import com.vvu981.colivibackend.features.messaging.service.AdminConversationService;
import com.vvu981.colivibackend.features.user.repository.UserRepository;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.test.web.servlet.MockMvc;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(AdminConversationController.class)
@AutoConfigureMockMvc(addFilters = false)
class AdminConversationControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private AdminConversationService adminConversationService;

    @MockBean
    private JwtTokenProvider jwtTokenProvider;

    @MockBean
    private UserRepository userRepository;

    @Test
    void getConversationDossier_shouldReturn200AndDossier() throws Exception {
        UUID conversationId = UUID.randomUUID();
        AdminConversationDossierDto dossier = new AdminConversationDossierDto(
                conversationId,
                null,
                null,
                null,
                null,
                List.of(),
                LocalDateTime.now(),
                LocalDateTime.now(),
                true
        );

        when(adminConversationService.getConversationDossier(conversationId)).thenReturn(dossier);

        mockMvc.perform(get("/api/v1/admin/conversations/{id}/dossier", conversationId))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.conversationId").value(conversationId.toString()))
                .andExpect(jsonPath("$.isReported").value(true));
    }
}
