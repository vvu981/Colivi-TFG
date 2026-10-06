package com.vvu981.colivibackend.features.bookingRequests.controller;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyInt;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.vvu981.colivibackend.features.bookingRequests.domain.RequestStatus;
import com.vvu981.colivibackend.features.bookingRequests.dto.BookingRequestAdminFilterDto;
import com.vvu981.colivibackend.features.bookingRequests.dto.BookingRequestDto;
import com.vvu981.colivibackend.features.bookingRequests.dto.BookingRequestResponseDto;
import com.vvu981.colivibackend.features.bookingRequests.service.BookingRequestService;
import com.vvu981.colivibackend.core.security.JwtTokenProvider;
import com.vvu981.colivibackend.features.user.repository.UserRepository;

@WebMvcTest(controllers = BookingRequestController.class)
@AutoConfigureMockMvc(addFilters = false) // Disable security for unit tests
public class BookingRequestControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private BookingRequestService requestService;

    @MockBean
    private JwtTokenProvider jwtTokenProvider;

    @MockBean
    private UserRepository userRepository;

    private BookingRequestDto requestDto;
    private BookingRequestResponseDto responseDto;
    private UUID currentUserId;
    private UUID requestId;

    @BeforeEach
    void setUp() {
        currentUserId = UUID.randomUUID();
        requestId = UUID.randomUUID();
        requestDto = new BookingRequestDto(UUID.randomUUID(), LocalDate.now().plusDays(5), LocalDate.now().plusMonths(3), "Hello");
        responseDto = new BookingRequestResponseDto(requestId, currentUserId, UUID.randomUUID(),
                LocalDate.now(), LocalDate.now().plusMonths(3), "Hello", RequestStatus.PENDING, LocalDateTime.now(), null, null);
    }

    @Test
    void createBookingRequest() throws Exception {
        when(requestService.createBookingRequest(any(BookingRequestDto.class), any())).thenReturn(responseDto);

        mockMvc.perform(post("/api/v1/booking-requests")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(requestDto)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").value(requestId.toString()));
    }

    @Test
    void createBookingRequestByAdmin() throws Exception {
        UUID tenantId = UUID.randomUUID();
        when(requestService.createBookingRequest(any(BookingRequestDto.class), eq(tenantId))).thenReturn(responseDto);

        mockMvc.perform(post("/api/v1/booking-requests/admin/{tenantId}", tenantId)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(requestDto)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").value(requestId.toString()));
    }

    @Test
    void changeRequestStatus() throws Exception {
        when(requestService.setStatusBookingRequest(eq(RequestStatus.ACCEPTED), eq(requestId), any()))
                .thenReturn(responseDto);

        mockMvc.perform(patch("/api/v1/booking-requests/{id}/status", requestId)
                .param("status", "ACCEPTED"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(requestId.toString()));
    }

    @Test
    void getBookingRequestById() throws Exception {
        when(requestService.getBookingRequestById(eq(requestId), any())).thenReturn(responseDto);

        mockMvc.perform(get("/api/v1/booking-requests/{id}", requestId))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(requestId.toString()));
    }

    @Test
    void getTenantRequests() throws Exception {
        Page<BookingRequestResponseDto> page = new PageImpl<>(List.of(responseDto));
        when(requestService.getTenantBookingRequests(anyInt(), anyInt(), any())).thenReturn(page);

        mockMvc.perform(get("/api/v1/booking-requests/tenant")
                .param("page", "0")
                .param("size", "10"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content[0].id").value(requestId.toString()));
    }

    @Test
    void getLandlordRequests() throws Exception {
        Page<BookingRequestResponseDto> page = new PageImpl<>(List.of(responseDto));
        when(requestService.getLandlordBookingRequests(anyInt(), anyInt(), any(), any())).thenReturn(page);

        mockMvc.perform(get("/api/v1/booking-requests/landlord")
                .param("page", "0")
                .param("size", "10"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content[0].id").value(requestId.toString()));
    }

    @Test
    void getAllRequestsForAdmin() throws Exception {
        Page<BookingRequestResponseDto> page = new PageImpl<>(List.of(responseDto));
        when(requestService.getAllBookingRequestsForAdmin(any(BookingRequestAdminFilterDto.class), anyInt(), anyInt()))
                .thenReturn(page);

        mockMvc.perform(get("/api/v1/booking-requests/admin")
                .param("page", "0")
                .param("size", "10"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content[0].id").value(requestId.toString()));
    }

    @Test
    void confirmPaymentSuccess() throws Exception {
        com.vvu981.colivibackend.features.bookingRequests.dto.PaymentConfirmationDto paymentDto = 
            new com.vvu981.colivibackend.features.bookingRequests.dto.PaymentConfirmationDto("token_123", "Credit Card");
            
        when(requestService.confirmBookingPayment(eq(requestId), any(), any())).thenReturn(responseDto);

        mockMvc.perform(post("/api/v1/booking-requests/{id}/confirm-payment", requestId)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(paymentDto)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(requestId.toString()));
    }

    @Test
    void confirmPaymentFailsIfNotRequester() throws Exception {
        com.vvu981.colivibackend.features.bookingRequests.dto.PaymentConfirmationDto paymentDto = 
            new com.vvu981.colivibackend.features.bookingRequests.dto.PaymentConfirmationDto("token_123", "Credit Card");
            
        when(requestService.confirmBookingPayment(eq(requestId), any(), any()))
                .thenThrow(new com.vvu981.colivibackend.core.exception.UnauthorizedActionException("Error: solo el inquilino puede confirmar el pago."));

        try {
            mockMvc.perform(post("/api/v1/booking-requests/{id}/confirm-payment", requestId)
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(objectMapper.writeValueAsString(paymentDto)))
                    .andExpect(status().isForbidden());
        } catch (Exception e) {
            // Si GlobalExceptionHandler no está cargado, Spring tira ServletException envolviendo a UnauthorizedActionException
            org.junit.jupiter.api.Assertions.assertTrue(e.getCause() instanceof com.vvu981.colivibackend.core.exception.UnauthorizedActionException);
        }
    }

    @Test
    void getPendingRequestsCountSuccess() throws Exception {
        when(requestService.countPendingRequestsForLandlord(any())).thenReturn(5L);

        mockMvc.perform(get("/api/v1/booking-requests/landlord/pending-count"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.count").value(5));
    }
}
