package com.vvu981.colivibackend.features.recommendation.domain;

import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;

class UserSearchHistoryTest {

    @Test
    void testGettersAndSetters() {
        UserSearchHistory history = new UserSearchHistory();
        
        UUID id = UUID.randomUUID();
        UUID userId = UUID.randomUUID();
        String city = "Barcelona";
        BigDecimal maxPrice = new BigDecimal("1000");
        String type = "FLAT";
        LocalDateTime now = LocalDateTime.now();
        
        history.setId(id);
        history.setUserId(userId);
        history.setCity(city);
        history.setMaxPrice(maxPrice);
        history.setAccommodationType(type);
        history.setCreatedAt(now);
        
        assertEquals(id, history.getId());
        assertEquals(userId, history.getUserId());
        assertEquals(city, history.getCity());
        assertEquals(maxPrice, history.getMaxPrice());
        assertEquals(type, history.getAccommodationType());
        assertEquals(now, history.getCreatedAt());
        
        history.onCreate();
        assertNotNull(history.getCreatedAt());
        
        UserSearchHistory builderHistory = UserSearchHistory.builder()
                .id(id)
                .userId(userId)
                .city(city)
                .maxPrice(maxPrice)
                .accommodationType(type)
                .createdAt(now)
                .build();
                
        assertNotNull(builderHistory);
        assertEquals(id, builderHistory.getId());
    }
}
