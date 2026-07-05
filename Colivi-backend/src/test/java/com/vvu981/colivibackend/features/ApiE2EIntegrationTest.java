package com.vvu981.colivibackend.features;

import com.fasterxml.jackson.core.type.TypeReference;
import com.vvu981.colivibackend.core.BaseIntegrationTest;
import com.vvu981.colivibackend.features.user.domain.User;
import com.vvu981.colivibackend.features.user.repository.UserRepository;
import org.junit.jupiter.api.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.web.servlet.MvcResult;

import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@TestMethodOrder(MethodOrderer.OrderAnnotation.class)
@TestInstance(TestInstance.Lifecycle.PER_CLASS)
public class ApiE2EIntegrationTest extends BaseIntegrationTest {

        @Autowired
        private UserRepository userRepository;

        // State maintained across steps
        private String adminToken;
        private String userToken;
        private String userRefreshToken;
        private UUID userId;
        private String userEmail;
        private String userPassword = "Password123!";

        private String accommodationId;
        private String listingId;
        private String imageId1;
        private String imageId2;

        @BeforeAll
        void setupAdmin() throws Exception {
                // Mock Cloudinary for all tests
                when(imageStorageService.uploadImage(any())).thenReturn("https://mock.cloudinary.com/image.jpg");

                // Setup admin via API register then DB promotion (like python script)
                Map<String, Object> adminPayload = Map.of(
                                "nickname", "admin_e2e",
                                "firstName", "Admin",
                                "lastName1", "Test",
                                "lastName2", "",
                                "phone", "+34111111111",
                                "email", "admin@example.com",
                                "password", "admin123",
                                "dateOfBirth", "1990-01-01",
                                "gender", "OTHER");

                mockMvc.perform(post("/api/v1/auth/register")
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(objectMapper.writeValueAsString(adminPayload)));

                // Promote to admin
                Optional<User> adminOpt = userRepository.findByEmailIgnoreCase("admin@example.com");
                if (adminOpt.isPresent()) {
                        User admin = adminOpt.get();
                        admin.setRole(com.vvu981.colivibackend.features.user.domain.UserRole.ADMIN);
                        userRepository.save(admin);
                }
        }

        // ──────────────────────────────────────────────────────────────────────────────
        // 1. AUTH ENDPOINTS
        // ──────────────────────────────────────────────────────────────────────────────

        @Test
        @Order(1)
        void step1_registerUser() throws Exception {
                String nickname = "test_" + UUID.randomUUID().toString().substring(0, 8);
                userEmail = nickname + "@example.com";

                Map<String, Object> payload = Map.of(
                                "nickname", nickname,
                                "email", userEmail,
                                "password", userPassword,
                                "firstName", "Test",
                                "lastName1", "User",
                                "lastName2", "E2E",
                                "phone", "+34600112233",
                                "dateOfBirth", "1995-01-01",
                                "gender", "OTHER");

                MvcResult result = mockMvc.perform(post("/api/v1/auth/register")
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(objectMapper.writeValueAsString(payload)))
                                .andExpect(status().isOk())
                                .andReturn();

                Map<String, String> response = objectMapper.readValue(result.getResponse().getContentAsString(),
                                new TypeReference<>() {
                                });
                userToken = response.get("accessToken");
                userRefreshToken = response.get("refreshToken");
                assertNotNull(userToken);
        }

        @Test
        @Order(2)
        void step2_loginUser() throws Exception {
                Map<String, String> payload = Map.of("email", userEmail, "password", userPassword);

                MvcResult result = mockMvc.perform(post("/api/v1/auth/login")
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(objectMapper.writeValueAsString(payload)))
                                .andExpect(status().isOk())
                                .andReturn();

                Map<String, String> response = objectMapper.readValue(result.getResponse().getContentAsString(),
                                new TypeReference<>() {
                                });
                userToken = response.get("accessToken");
                userRefreshToken = response.get("refreshToken");

                // Extract userId from DB
                userId = userRepository.findByEmailIgnoreCase(userEmail).get().getId();
        }

        @Test
        @Order(3)
        void step3_refreshToken() throws Exception {
                Map<String, String> payload = Map.of("refreshToken", userRefreshToken);

                MvcResult result = mockMvc.perform(post("/api/v1/auth/refresh")
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(objectMapper.writeValueAsString(payload)))
                                .andExpect(status().isOk())
                                .andReturn();

                Map<String, String> response = objectMapper.readValue(result.getResponse().getContentAsString(),
                                new TypeReference<>() {
                                });
                userToken = response.get("accessToken");
                userRefreshToken = response.get("refreshToken");
        }

        // ──────────────────────────────────────────────────────────────────────────────
        // 2. USER ENDPOINTS
        // ──────────────────────────────────────────────────────────────────────────────

        @Test
        @Order(4)
        void step4_updateProfile() throws Exception {
                Map<String, String> payload = Map.of(
                                "nickname", "upd_" + UUID.randomUUID().toString().substring(0, 8),
                                "firstName", "TestEdit",
                                "lastName1", "UserEdit",
                                "phone", "+34699999999");

                mockMvc.perform(patch("/api/v1/users/me/profile")
                                .header("Authorization", "Bearer " + userToken)
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(objectMapper.writeValueAsString(payload)))
                                .andExpect(status().isOk());

                // Refresh token because update increments version
                step2_loginUser();
        }

        @Test
        @Order(5)
        void step5_updateCredentials() throws Exception {
                String newPassword = "NewPassword123!";
                String newEmail = "new_" + userEmail;

                Map<String, String> payload = Map.of(
                                "currentPassword", userPassword,
                                "newEmail", newEmail,
                                "newPassword", newPassword);

                mockMvc.perform(patch("/api/v1/users/me/credentials")
                                .header("Authorization", "Bearer " + userToken)
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(objectMapper.writeValueAsString(payload)))
                                .andExpect(status().isNoContent());

                userEmail = newEmail;
                userPassword = newPassword;
                step2_loginUser(); // get new tokens
        }

        @Test
        @Order(6)
        void step6_logoutAndRelogin() throws Exception {
                mockMvc.perform(patch("/api/v1/users/me/logout")
                                .header("Authorization", "Bearer " + userToken))
                                .andExpect(status().isNoContent());

                step2_loginUser();
        }

        // ──────────────────────────────────────────────────────────────────────────────
        // 3. ACCOMMODATION ENDPOINTS
        // ──────────────────────────────────────────────────────────────────────────────

        @Test
        @Order(7)
        void step7_createAccommodation() throws Exception {
                Map<String, Object> payload = new java.util.HashMap<>();
                payload.put("address", "Calle Gran Via 12");
                payload.put("totalRooms", 4);
                payload.put("totalBathrooms", 2);
                payload.put("freeRooms", 2);
                payload.put("squareMeters", 120);
                payload.put("city", "Madrid");
                payload.put("country", "Spain");
                payload.put("province", "Madrid");
                payload.put("latitude", 40.416775);
                payload.put("longitude", -3.703790);
                payload.put("amenities", List.of("WIFI", "HEATING"));

                MvcResult result = mockMvc.perform(post("/api/v1/accommodation")
                                .header("Authorization", "Bearer " + userToken)
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(objectMapper.writeValueAsString(payload)))
                                .andExpect(status().isCreated())
                                .andReturn();

                Map<String, Object> response = objectMapper.readValue(result.getResponse().getContentAsString(),
                                new TypeReference<>() {
                                });
                accommodationId = response.get("id").toString();
        }

        @Test
        @Order(8)
        void step8_getAccommodationDetails() throws Exception {
                mockMvc.perform(get("/api/v1/accommodation/" + accommodationId)
                                .header("Authorization", "Bearer " + userToken))
                                .andExpect(status().isOk());
        }

        @Test
        @Order(9)
        void step9_getAccommodationsCatalog() throws Exception {
                mockMvc.perform(get("/api/v1/accommodation")
                                .header("Authorization", "Bearer " + userToken)
                                .param("ownerId", userId.toString())
                                .param("visibility", "AVAILABLE")
                                .param("page", "0")
                                .param("size", "10"))
                                .andExpect(status().isOk());
        }

        @Test
        @Order(10)
        void step10_updateAccommodation() throws Exception {
                Map<String, Object> payload = new java.util.HashMap<>();
                payload.put("address", "Calle Gran Via 12, Modificado");
                payload.put("totalRooms", 5);
                payload.put("totalBathrooms", 3);
                payload.put("freeRooms", 3);
                payload.put("squareMeters", 150);
                payload.put("city", "Madrid");
                payload.put("country", "Spain");
                payload.put("province", "Madrid");
                payload.put("latitude", 40.416775);
                payload.put("longitude", -3.703790);
                payload.put("amenities", List.of("WIFI", "BALCONY"));

                mockMvc.perform(put("/api/v1/accommodation/" + accommodationId)
                                .header("Authorization", "Bearer " + userToken)
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(objectMapper.writeValueAsString(payload)))
                                .andExpect(status().isOk());
        }

        @Test
        @Order(11)
        void step11_uploadImages() throws Exception {
                MockMultipartFile file1 = new MockMultipartFile("file", "room1.png", "image/png",
                                new byte[] { 1, 2, 3 });
                MockMultipartFile file2 = new MockMultipartFile("file", "room2.png", "image/png",
                                new byte[] { 1, 2, 3 });

                mockMvc.perform(multipart("/api/v1/accommodation/" + accommodationId + "/images")
                                .file(file1)
                                .header("Authorization", "Bearer " + userToken))
                                .andExpect(status().isOk());

                MvcResult res2 = mockMvc.perform(multipart("/api/v1/accommodation/" + accommodationId + "/images")
                                .file(file2)
                                .header("Authorization", "Bearer " + userToken))
                                .andExpect(status().isOk())
                                .andReturn();

                Map<String, Object> response = objectMapper.readValue(res2.getResponse().getContentAsString(),
                                new TypeReference<>() {
                                });
                List<Map<String, Object>> images = (List<Map<String, Object>>) response.get("images");
                imageId1 = images.get(0).get("id").toString();
                imageId2 = images.get(1).get("id").toString();
        }

        @Test
        @Order(12)
        void step12_reorderImages() throws Exception {
                List<Map<String, Object>> payload = List.of(
                                Map.of("imageId", imageId1, "displayOrder", 2),
                                Map.of("imageId", imageId2, "displayOrder", 1));

                mockMvc.perform(put("/api/v1/accommodation/" + accommodationId + "/images/order")
                                .header("Authorization", "Bearer " + userToken)
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(objectMapper.writeValueAsString(payload)))
                                .andExpect(status().isOk());
        }

        @Test
        @Order(13)
        void step13_deleteImage() throws Exception {
                mockMvc.perform(delete("/api/v1/accommodation/" + accommodationId + "/images/" + imageId1)
                                .header("Authorization", "Bearer " + userToken))
                                .andExpect(status().isNoContent());
        }

        // ──────────────────────────────────────────────────────────────────────────────
        // 4. LISTING ENDPOINTS
        // ──────────────────────────────────────────────────────────────────────────────

        @Test
        @Order(15)
        void step15_createListing() throws Exception {
                Map<String, Object> payload = Map.of(
                                "accommodationId", accommodationId,
                                "title", "Habitación centro",
                                "description", "Preciosa",
                                "pricePerMonth", 450.00);

                MvcResult result = mockMvc.perform(post("/api/v1/listings")
                                .header("Authorization", "Bearer " + userToken)
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(objectMapper.writeValueAsString(payload)))
                                .andExpect(status().isOk()) // Assuming 200 or 201, script checks 200
                                .andReturn();

                Map<String, Object> response = objectMapper.readValue(result.getResponse().getContentAsString(),
                                new TypeReference<>() {
                                });
                listingId = response.get("id").toString();
        }

        @Test
        @Order(16)
        void step16_getListingDetails() throws Exception {
                mockMvc.perform(get("/api/v1/listings/" + listingId)
                                .header("Authorization", "Bearer " + userToken))
                                .andExpect(status().isOk());
        }

        @Test
        @Order(17)
        void step17_updateListing() throws Exception {
                Map<String, Object> payload = Map.of(
                                "title", "Habitación de lujo",
                                "description", "Spacious",
                                "pricePerMonth", 600.00);

                mockMvc.perform(put("/api/v1/listings/" + listingId)
                                .header("Authorization", "Bearer " + userToken)
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(objectMapper.writeValueAsString(payload)))
                                .andExpect(status().isOk());
        }

        @Test
        @Order(18)
        void step18_searchListings() throws Exception {
                mockMvc.perform(get("/api/v1/listings")
                                .header("Authorization", "Bearer " + userToken)
                                .param("city", "Madrid")
                                .param("page", "0")
                                .param("size", "10"))
                                .andExpect(status().isOk());
        }

        @Test
        @Order(19)
        void step14_softDeleteAccommodation() throws Exception { // moved here per python script
                mockMvc.perform(patch("/api/v1/accommodation/delete/" + accommodationId)
                                .header("Authorization", "Bearer " + userToken))
                                .andExpect(status().isOk());
        }

        // ──────────────────────────────────────────────────────────────────────────────
        // 5. ADMIN OPERATIONS
        // ──────────────────────────────────────────────────────────────────────────────

        @Test
        @Order(20)
        void step19_adminLogin() throws Exception {
                Map<String, String> payload = Map.of("email", "admin@example.com", "password", "admin123");

                MvcResult result = mockMvc.perform(post("/api/v1/auth/login")
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(objectMapper.writeValueAsString(payload)))
                                .andExpect(status().isOk())
                                .andReturn();

                Map<String, String> response = objectMapper.readValue(result.getResponse().getContentAsString(),
                                new TypeReference<>() {
                                });
                adminToken = response.get("accessToken");
        }

        @Test
        @Order(21)
        void step20_adminPromoteUser() throws Exception {
                mockMvc.perform(patch("/api/v1/users/" + userId + "/admin")
                                .header("Authorization", "Bearer " + adminToken))
                                .andExpect(status().isNoContent());

                step2_loginUser(); // Refresh user tokens
        }

        @Test
        @Order(22)
        void step21_adminBanUnbanUser() throws Exception {
                Map<String, String> banPayload = Map.of("message", "Test ban", "bannedUntil", "2026-12-31T23:59:59");

                mockMvc.perform(patch("/api/v1/users/" + userId + "/ban")
                                .header("Authorization", "Bearer " + adminToken)
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(objectMapper.writeValueAsString(banPayload)))
                                .andExpect(status().isNoContent());

                mockMvc.perform(patch("/api/v1/users/" + userId + "/unban")
                                .header("Authorization", "Bearer " + adminToken))
                                .andExpect(status().isNoContent());

                step2_loginUser(); // Refresh user tokens
        }

        @Test
        @Order(23)
        void step22_adminBanUnbanFlow() throws Exception {
                mockMvc.perform(patch("/api/v1/listings/ban/" + listingId)
                                .header("Authorization", "Bearer " + adminToken))
                                .andExpect(status().isNoContent());

                mockMvc.perform(patch("/api/v1/listings/unban/" + listingId)
                                .header("Authorization", "Bearer " + adminToken))
                                .andExpect(status().isNoContent());

                mockMvc.perform(patch("/api/v1/listings/softDelete/" + listingId)
                                .header("Authorization", "Bearer " + userToken))
                                .andExpect(status().isNoContent());

                mockMvc.perform(patch("/api/v1/listings/recover/" + listingId)
                                .header("Authorization", "Bearer " + adminToken))
                                .andExpect(status().isOk());
        }

        // ──────────────────────────────────────────────────────────────────────────────
        // 6. SOFT DELETE & REACTIVATION FLOW
        // ──────────────────────────────────────────────────────────────────────────────

        @Test
        @Order(24)
        void step23_softDeleteAndReactivate() throws Exception {
                mockMvc.perform(patch("/api/v1/users/me/delete/soft")
                                .header("Authorization", "Bearer " + userToken))
                                .andExpect(status().isNoContent());

                Map<String, String> reqPayload = Map.of("email", userEmail);
                mockMvc.perform(post("/api/v1/auth/reactivation-request")
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(objectMapper.writeValueAsString(reqPayload)))
                                .andExpect(status().isOk());

                // Read token from DB instead of mailpit
                User user = userRepository.findByEmailIgnoreCase(userEmail).orElseThrow();
                String reactivationToken = user.getReactivationToken();
                assertNotNull(reactivationToken, "Reactivation token must exist in DB");

                Map<String, String> reactPayload = Map.of("token", reactivationToken);
                MvcResult result = mockMvc.perform(post("/api/v1/auth/reactivate")
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(objectMapper.writeValueAsString(reactPayload)))
                                .andExpect(status().isOk())
                                .andReturn();

                Map<String, String> response = objectMapper.readValue(result.getResponse().getContentAsString(),
                                new TypeReference<>() {
                                });
                userToken = response.get("accessToken");
        }

        // ──────────────────────────────────────────────────────────────────────────────
        // 7. HARD CLEANUP
        // ──────────────────────────────────────────────────────────────────────────────

        @Test
        @Order(25)
        void step24_hardCleanup() throws Exception {
                if (listingId != null) {
                        mockMvc.perform(delete("/api/v1/listings/hardDelete/" + listingId)
                                        .header("Authorization", "Bearer " + adminToken))
                                        .andExpect(status().isNoContent());
                }

                if (accommodationId != null) {
                        mockMvc.perform(delete("/api/v1/accommodation/hardDelete/" + accommodationId)
                                        .header("Authorization", "Bearer " + adminToken))
                                        .andExpect(status().isNoContent());
                }

                if (userId != null) {
                        mockMvc.perform(delete("/api/v1/users/hard/" + userId)
                                        .header("Authorization", "Bearer " + adminToken))
                                        .andExpect(status().isNoContent());
                }
        }
}
