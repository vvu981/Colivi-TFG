package com.vvu981.colivibackend.features;

import com.fasterxml.jackson.core.type.TypeReference;
import com.vvu981.colivibackend.core.BaseIntegrationTest;
import com.vvu981.colivibackend.features.user.domain.User;
import com.vvu981.colivibackend.features.user.domain.UserRole;
import com.vvu981.colivibackend.features.user.repository.UserRepository;
import org.junit.jupiter.api.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MvcResult;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@TestMethodOrder(MethodOrderer.OrderAnnotation.class)
@TestInstance(TestInstance.Lifecycle.PER_CLASS)
public class BookingRequestE2EIntegrationTest extends BaseIntegrationTest {

    @Autowired
    private UserRepository userRepository;

    private String adminToken;
    private String landlordToken;
    private String tenantToken;
    
    private UUID tenantId;

    private String accommodationId;
    private String listingId;
    private String bookingRequestId;

    @BeforeAll
    void setupGlobal() throws Exception {
        // 1. Setup Admin
        registerAndPromote("admin_booking", "admin_booking@example.com", "Admin123!", UserRole.ADMIN);
        adminToken = login("admin_booking@example.com", "Admin123!");

        // 2. Setup Landlord
        registerAndPromote("landlord_booking", "landlord_booking@example.com", "Landlord123!", UserRole.USER);
        landlordToken = login("landlord_booking@example.com", "Landlord123!");

        // 3. Setup Tenant
        registerAndPromote("tenant_booking", "tenant_booking@example.com", "Tenant123!", UserRole.USER);
        tenantToken = login("tenant_booking@example.com", "Tenant123!");
        tenantId = userRepository.findByEmailIgnoreCase("tenant_booking@example.com").orElseThrow().getId();
    }

    private void registerAndPromote(String nickname, String email, String password, UserRole role) throws Exception {
        Map<String, Object> payload = Map.of(
                "nickname", nickname,
                "email", email,
                "password", password,
                "firstName", "Test",
                "lastName1", "User",
                "phone", "+34600000000",
                "dateOfBirth", "1990-01-01",
                "gender", "OTHER"
        );

        mockMvc.perform(post("/api/v1/auth/register")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(payload)))
                .andExpect(status().isOk());

        if (role == UserRole.ADMIN) {
            Optional<User> uOpt = userRepository.findByEmailIgnoreCase(email);
            if (uOpt.isPresent()) {
                User u = uOpt.get();
                u.setRole(role);
                userRepository.save(u);
            }
        }
    }

    private String login(String email, String password) throws Exception {
        Map<String, String> payload = Map.of("email", email, "password", password);

        MvcResult result = mockMvc.perform(post("/api/v1/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(payload)))
                .andExpect(status().isOk())
                .andReturn();

        Map<String, String> response = objectMapper.readValue(result.getResponse().getContentAsString(),
                new TypeReference<>() {});
        return response.get("accessToken");
    }

    // ──────────────────────────────────────────────────────────────────────────────
    // 1. SETUP ACCOMMODATION AND LISTING (by Landlord)
    // ──────────────────────────────────────────────────────────────────────────────

    @Test
    @Order(1)
    void step1_createAccommodationAndListing() throws Exception {
        // Create Accommodation
        Map<String, Object> accPayload = new java.util.HashMap<>();
        accPayload.put("address", "Booking Street 123");
        accPayload.put("totalRooms", 3);
        accPayload.put("totalBathrooms", 2);
        accPayload.put("freeRooms", 1);
        accPayload.put("squareMeters", 90);
        accPayload.put("city", "Madrid");
        accPayload.put("country", "Spain");
        accPayload.put("province", "Madrid");
        accPayload.put("latitude", 40.416);
        accPayload.put("longitude", -3.703);
        accPayload.put("amenities", List.of("WIFI"));

        MvcResult accResult = mockMvc.perform(post("/api/v1/accommodation")
                .header("Authorization", "Bearer " + landlordToken)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(accPayload)))
                .andExpect(status().isCreated())
                .andReturn();

        Map<String, Object> accResponse = objectMapper.readValue(accResult.getResponse().getContentAsString(), new TypeReference<>() {});
        accommodationId = accResponse.get("id").toString();

        // Create Listing
        Map<String, Object> listingPayload = Map.of(
                "accommodationId", accommodationId,
                "title", "Room for Booking Test",
                "description", "Nice room",
                "pricePerMonth", 500.0,
                "rentalType", "ROOM"
        );

        MvcResult listingResult = mockMvc.perform(post("/api/v1/listings")
                .header("Authorization", "Bearer " + landlordToken)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(listingPayload)))
                .andExpect(status().isOk()) // En ApiE2E está testado como isOk() o isCreated()
                .andReturn();

        Map<String, Object> listingResponse = objectMapper.readValue(listingResult.getResponse().getContentAsString(), new TypeReference<>() {});
        listingId = listingResponse.get("id").toString();
    }

    // ──────────────────────────────────────────────────────────────────────────────
    // 2. TENANT CREATES BOOKING REQUEST
    // ──────────────────────────────────────────────────────────────────────────────

    @Test
    @Order(2)
    void step2_tenantCreatesBookingRequest() throws Exception {
        LocalDate startDate = LocalDate.now().plusMonths(1).withDayOfMonth(1);
        LocalDate endDate = startDate.plusMonths(5).withDayOfMonth(startDate.plusMonths(5).lengthOfMonth());

        Map<String, Object> payload = Map.of(
                "accommodationListingId", listingId,
                "startDate", startDate.toString(),
                "endDate", endDate.toString(),
                "message", "Hi, I want to book this room."
        );

        MvcResult result = mockMvc.perform(post("/api/v1/booking-requests")
                .header("Authorization", "Bearer " + tenantToken)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(payload)))
                .andExpect(status().isCreated())
                .andReturn();

        Map<String, Object> response = objectMapper.readValue(result.getResponse().getContentAsString(), new TypeReference<>() {});
        bookingRequestId = response.get("id").toString();
        
        assertNotNull(bookingRequestId);
        assertEquals("PENDING", response.get("status"));
    }

    // ──────────────────────────────────────────────────────────────────────────────
    // 3. GET ENDPOINTS (Tenant and Landlord)
    // ──────────────────────────────────────────────────────────────────────────────

    @Test
    @Order(3)
    void step3_tenantViewsRequests() throws Exception {
        mockMvc.perform(get("/api/v1/booking-requests/tenant")
                .header("Authorization", "Bearer " + tenantToken))
                .andExpect(status().isOk());
    }

    @Test
    @Order(4)
    void step4_landlordViewsRequests() throws Exception {
        mockMvc.perform(get("/api/v1/booking-requests/landlord")
                .header("Authorization", "Bearer " + landlordToken))
                .andExpect(status().isOk());
    }

    @Test
    @Order(5)
    void step5_getById() throws Exception {
        mockMvc.perform(get("/api/v1/booking-requests/" + bookingRequestId)
                .header("Authorization", "Bearer " + landlordToken))
                .andExpect(status().isOk());
    }

    // ──────────────────────────────────────────────────────────────────────────────
    // 4. LANDLORD ACCEPTS REQUEST
    // ──────────────────────────────────────────────────────────────────────────────

    @Test
    @Order(6)
    void step6_landlordAcceptsRequest() throws Exception {
        mockMvc.perform(patch("/api/v1/booking-requests/" + bookingRequestId + "/status")
                .header("Authorization", "Bearer " + landlordToken)
                .param("status", "ACCEPTED"))
                .andExpect(status().isOk());
    }

    // ──────────────────────────────────────────────────────────────────────────────
    // 5. ADMIN CREATES REQUEST FOR ANOTHER TENANT
    // ──────────────────────────────────────────────────────────────────────────────

    @Test
    @Order(7)
    void step7_adminCreatesRequestForTenant() throws Exception {
        LocalDate startDate = LocalDate.now().plusMonths(8).withDayOfMonth(1);
        LocalDate endDate = startDate.plusMonths(2).withDayOfMonth(startDate.plusMonths(2).lengthOfMonth());

        Map<String, Object> payload = Map.of(
                "accommodationListingId", listingId,
                "startDate", startDate.toString(),
                "endDate", endDate.toString(),
                "message", "Created by admin."
        );

        mockMvc.perform(post("/api/v1/booking-requests/admin/" + tenantId)
                .header("Authorization", "Bearer " + adminToken)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(payload)))
                .andExpect(status().isCreated());
    }

    @Test
    @Order(8)
    void step8_adminViewsAllRequests() throws Exception {
        mockMvc.perform(get("/api/v1/booking-requests/admin")
                .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk());
    }
}
