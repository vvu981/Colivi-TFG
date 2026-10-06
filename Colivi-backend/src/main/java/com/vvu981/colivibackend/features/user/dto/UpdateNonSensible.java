package com.vvu981.colivibackend.features.user.dto;

public record UpdateNonSensible(
        String nickname,
        String firstName,
        String lastName1,
        String lastName2,
        String phone,
        String profilePicUrl
) {}
