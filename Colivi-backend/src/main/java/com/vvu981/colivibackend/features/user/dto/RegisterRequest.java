package com.vvu981.colivibackend.features.user.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;

public record RegisterRequest(
        @NotBlank String nickname,
        @NotBlank @Email String email,
        @NotBlank String password,
        @NotBlank String firstName,
        String lastName1,
        String lastName2,
        String phone
) {}