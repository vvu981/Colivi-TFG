package com.vvu981.colivibackend.features.accommodation.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.vvu981.colivibackend.core.security.JwtTokenProvider;
import com.vvu981.colivibackend.core.security.SecurityConfig;
import com.vvu981.colivibackend.core.security.UserPrincipal;
import com.vvu981.colivibackend.features.accommodation.dto.CreateReviewRequest;
import com.vvu981.colivibackend.features.accommodation.dto.ReviewEligibilityResponse;
import com.vvu981.colivibackend.features.accommodation.dto.ReviewResponse;
import com.vvu981.colivibackend.features.accommodation.dto.ReviewSummaryResponse;
import com.vvu981.colivibackend.features.accommodation.service.AccommodationReviewService;
import com.vvu981.colivibackend.features.user.domain.User;
import com.vvu981.colivibackend.features.user.domain.UserRole;
import com.vvu981.colivibackend.features.user.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.annotation.Import;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.http.MediaType;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.test.web.servlet.MockMvc;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.UUID;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.authentication;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(AccommodationReviewController.class)
@Import(SecurityConfig.class)
@DisplayName("AccommodationReviewController Tests")
class AccommodationReviewControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private AccommodationReviewService reviewService;

    @MockBean
    private JwtTokenProvider jwtTokenProvider;

    @MockBean
    private UserRepository userRepository;

    private UUID listingId;
    private UUID userId;
    private UUID reviewId;
    private UserPrincipal userPrincipal;

    @BeforeEach
    void setUp() {
        listingId = UUID.randomUUID();
        userId = UUID.randomUUID();
        reviewId = UUID.randomUUID();

        User user = new User();
        user.setId(userId);
        user.setEmail("tenant@example.com");
        user.setPasswordHash("hashed_pass");
        user.setRole(UserRole.USER);
        userPrincipal = UserPrincipal.create(user);
    }

    @Test
    @DisplayName("POST /api/v1/listings/{id}/reviews - 201 Created")
    void createReview_success() throws Exception {
        CreateReviewRequest request = new CreateReviewRequest(5, "Increíble experiencia");
        ReviewResponse response = new ReviewResponse(
                reviewId, listingId, UUID.randomUUID(), userId, "tenant_user", null, 5, "Increíble experiencia", LocalDateTime.now()
        );

        when(reviewService.createReview(eq(listingId), any(CreateReviewRequest.class), eq(userId))).thenReturn(response);

        UsernamePasswordAuthenticationToken auth = new UsernamePasswordAuthenticationToken(
                userPrincipal, null, List.of(new SimpleGrantedAuthority("USER"))
        );

        mockMvc.perform(post("/api/v1/listings/{id}/reviews", listingId)
                        .with(authentication(auth))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").value(reviewId.toString()))
                .andExpect(jsonPath("$.rating").value(5))
                .andExpect(jsonPath("$.comment").value("Increíble experiencia"));
    }

    @Test
    @DisplayName("POST /api/v1/listings/{id}/reviews - 400 Bad Request when rating is out of range")
    void createReview_invalidRating() throws Exception {
        CreateReviewRequest request = new CreateReviewRequest(6, "Rating muy alto");

        UsernamePasswordAuthenticationToken auth = new UsernamePasswordAuthenticationToken(
                userPrincipal, null, List.of(new SimpleGrantedAuthority("USER"))
        );

        mockMvc.perform(post("/api/v1/listings/{id}/reviews", listingId)
                        .with(authentication(auth))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest());
    }

    @Test
    @DisplayName("GET /api/v1/listings/{id}/reviews - 200 OK")
    void getListingReviews_success() throws Exception {
        ReviewResponse response = new ReviewResponse(
                reviewId, listingId, UUID.randomUUID(), userId, "tenant_user", null, 4, "Muy bien", LocalDateTime.now()
        );
        Page<ReviewResponse> page = new PageImpl<>(List.of(response));

        when(reviewService.getListingReviews(eq(listingId), any(Pageable.class))).thenReturn(page);

        mockMvc.perform(get("/api/v1/listings/{id}/reviews", listingId))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content[0].id").value(reviewId.toString()))
                .andExpect(jsonPath("$.content[0].rating").value(4));
    }

    @Test
    @DisplayName("GET /api/v1/listings/{id}/reviews/summary - 200 OK")
    void getListingReviewSummary_success() throws Exception {
        ReviewSummaryResponse summary = new ReviewSummaryResponse(4.8, 12L, Map.of(5, 10L, 4, 2L));

        when(reviewService.getListingReviewSummary(listingId)).thenReturn(summary);

        mockMvc.perform(get("/api/v1/listings/{id}/reviews/summary", listingId))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.averageRating").value(4.8))
                .andExpect(jsonPath("$.totalReviews").value(12));
    }

    @Test
    @DisplayName("GET /api/v1/listings/{id}/reviews/eligibility - 200 OK")
    void checkEligibility_success() throws Exception {
        ReviewEligibilityResponse eligibility = new ReviewEligibilityResponse(true, UUID.randomUUID(), false, null);

        when(reviewService.checkEligibility(eq(listingId), eq(userId))).thenReturn(eligibility);

        UsernamePasswordAuthenticationToken auth = new UsernamePasswordAuthenticationToken(
                userPrincipal, null, List.of(new SimpleGrantedAuthority("USER"))
        );

        mockMvc.perform(get("/api/v1/listings/{id}/reviews/eligibility", listingId)
                        .with(authentication(auth)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.eligible").value(true));
    }

    @Test
    @DisplayName("GET /api/v1/accommodations/reviews?city=Valencia - 200 OK")
    void getReviewsByCity_success() throws Exception {
        ReviewResponse response = new ReviewResponse(
                reviewId, listingId, UUID.randomUUID(), userId, "tenant_user", null, 5, "Buen coliving", LocalDateTime.now()
        );

        when(reviewService.getReviewsByCity("Valencia")).thenReturn(List.of(response));

        mockMvc.perform(get("/api/v1/accommodations/reviews").param("city", "Valencia"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].comment").value("Buen coliving"));
    }

    @Test
    @DisplayName("DELETE /api/v1/reviews/{id} - 204 No Content")
    void deleteMyReview_success() throws Exception {
        UsernamePasswordAuthenticationToken auth = new UsernamePasswordAuthenticationToken(
                userPrincipal, null, List.of(new SimpleGrantedAuthority("USER"))
        );

        mockMvc.perform(delete("/api/v1/reviews/{id}", reviewId)
                        .with(authentication(auth)))
                .andExpect(status().isNoContent());

        verify(reviewService).deleteReview(reviewId, userId, false);
    }

    @Test
    @DisplayName("DELETE /api/v1/admin/reviews/{id} - 204 No Content with ADMIN role")
    void adminDeleteReview_success() throws Exception {
        User adminUser = new User();
        adminUser.setId(UUID.randomUUID());
        adminUser.setEmail("admin@colivi.com");
        adminUser.setPasswordHash("hashed_pass");
        adminUser.setRole(UserRole.ADMIN);
        UserPrincipal adminPrincipal = UserPrincipal.create(adminUser);

        UsernamePasswordAuthenticationToken auth = new UsernamePasswordAuthenticationToken(
                adminPrincipal, null, List.of(new SimpleGrantedAuthority("ADMIN"))
        );

        mockMvc.perform(delete("/api/v1/admin/reviews/{id}", reviewId)
                        .with(authentication(auth)))
                .andExpect(status().isNoContent());

        verify(reviewService).deleteReview(reviewId, adminUser.getId(), true);
    }
}
