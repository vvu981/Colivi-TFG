package com.vvu981.colivibackend.features.report.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.vvu981.colivibackend.core.security.JwtTokenProvider;
import com.vvu981.colivibackend.features.report.domain.ReportReason;
import com.vvu981.colivibackend.features.report.domain.ReportTargetType;
import com.vvu981.colivibackend.features.report.dto.CreateReportRequest;
import com.vvu981.colivibackend.features.report.dto.ReportFeedbackResponse;
import com.vvu981.colivibackend.features.report.dto.ReportResponse;
import com.vvu981.colivibackend.features.report.service.ReportService;
import com.vvu981.colivibackend.features.user.repository.UserRepository;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.doNothing;
import static org.mockito.Mockito.when;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(ReportController.class)
@AutoConfigureMockMvc(addFilters = false)
class ReportControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private ReportService reportService;

    @MockBean
    private JwtTokenProvider jwtTokenProvider;

    @MockBean
    private UserRepository userRepository;

    @Test
    void createReport_shouldReturn201() throws Exception {
        CreateReportRequest request = new CreateReportRequest(ReportTargetType.USER, UUID.randomUUID(),
                ReportReason.SPAM,
                "Test");
        ReportResponse response = new ReportResponse(UUID.randomUUID(), UUID.randomUUID(),
                ReportTargetType.USER,
                UUID.randomUUID(), ReportReason.SPAM, "Test", null, null, null, null, null, null);

        when(reportService.createReport(any(), any())).thenReturn(response);

        mockMvc.perform(post("/api/v1/reports")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request))
                .with(csrf()))
                .andExpect(status().isCreated());
    }

    @Test
    void getPendingFeedback_shouldReturn200() throws Exception {
        ReportFeedbackResponse feedback = new ReportFeedbackResponse(
                UUID.randomUUID(), ReportTargetType.LISTING, ReportReason.SPAM, LocalDateTime.now());
        when(reportService.getPendingFeedback(any())).thenReturn(List.of(feedback));

        mockMvc.perform(get("/api/v1/reports/pending-feedback"))
                .andExpect(status().isOk());
    }

    @Test
    void acknowledgeFeedback_shouldReturn204() throws Exception {
        UUID reportId = UUID.randomUUID();
        doNothing().when(reportService).acknowledgeFeedback(any(), any());

        mockMvc.perform(patch("/api/v1/reports/" + reportId + "/acknowledge-feedback")
                .with(csrf()))
                .andExpect(status().isNoContent());
    }
}
