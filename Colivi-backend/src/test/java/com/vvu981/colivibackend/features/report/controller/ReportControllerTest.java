package com.vvu981.colivibackend.features.report.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.vvu981.colivibackend.features.report.domain.ReportReason;
import com.vvu981.colivibackend.features.report.domain.TargetType;
import com.vvu981.colivibackend.features.report.dto.CreateReportRequest;
import com.vvu981.colivibackend.features.report.dto.ReportResponse;
import com.vvu981.colivibackend.features.report.service.ReportService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import java.util.List;
import java.util.UUID;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(ReportController.class)
@AutoConfigureMockMvc(addFilters = false) // Disable security filters to mock principal simply for unit tests of
                                          // controller
class ReportControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private ReportService reportService;

    @MockBean
    private com.vvu981.colivibackend.core.security.JwtTokenProvider jwtTokenProvider;

    @MockBean
    private com.vvu981.colivibackend.features.user.repository.UserRepository userRepository;

    @Test
    void createReport_shouldReturn201() throws Exception {
        CreateReportRequest request = new CreateReportRequest(TargetType.USER, UUID.randomUUID(), ReportReason.SPAM,
                "Test");
        ReportResponse response = new ReportResponse(UUID.randomUUID(), UUID.randomUUID(), TargetType.USER,
                UUID.randomUUID(), ReportReason.SPAM, "Test", null, null, null, null, null, null);

        when(reportService.createReport(any(), any())).thenReturn(response);

        mockMvc.perform(post("/api/v1/reports")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request))
                .with(csrf()))
                .andExpect(status().isCreated());
    }

    @Test
    void getMyReports_shouldReturn200() throws Exception {
        Page<ReportResponse> page = new PageImpl<>(List.of());
        when(reportService.getUserReports(any(), any())).thenReturn(page);

        mockMvc.perform(get("/api/v1/reports/me"))
                .andExpect(status().isOk());
    }
}
