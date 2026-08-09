package com.vvu981.colivibackend.features.report.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.vvu981.colivibackend.features.report.domain.ReportStatus;
import com.vvu981.colivibackend.features.report.dto.ReportStatusUpdateRequest;
import com.vvu981.colivibackend.features.report.service.AdminReportService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.data.domain.PageImpl;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import java.util.List;
import java.util.UUID;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(AdminReportController.class)
@AutoConfigureMockMvc(addFilters = false)
class AdminReportControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private AdminReportService adminReportService;

    @MockBean
    private com.vvu981.colivibackend.core.security.JwtTokenProvider jwtTokenProvider;

    @MockBean
    private com.vvu981.colivibackend.features.user.repository.UserRepository userRepository;

    @Test
    void listReports_shouldReturn200() throws Exception {
        when(adminReportService.listReports(any(), any())).thenReturn(new PageImpl<>(List.of()));

        mockMvc.perform(get("/api/v1/admin/reports"))
                .andExpect(status().isOk());
    }

    @Test
    void getMostReported_shouldReturn200() throws Exception {
        when(adminReportService.getMostReportedTargets(any(), any())).thenReturn(new PageImpl<>(List.of()));

        mockMvc.perform(get("/api/v1/admin/reports/most-reported"))
                .andExpect(status().isOk());
    }

    @Test
    void updateStatus_shouldReturn200() throws Exception {
        ReportStatusUpdateRequest request = new ReportStatusUpdateRequest(ReportStatus.RESOLVED, "Notes");
        when(adminReportService.updateReportStatus(any(), any(), any())).thenReturn(null);

        mockMvc.perform(patch("/api/v1/admin/reports/" + UUID.randomUUID() + "/status")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request))
                .with(csrf()))
                .andExpect(status().isOk());
    }
}
