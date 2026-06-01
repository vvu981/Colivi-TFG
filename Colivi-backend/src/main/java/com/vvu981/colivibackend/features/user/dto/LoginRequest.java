package com.vvu981.colivibackend.features.user.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;

public record LoginRequest (
        @NotBlank @Email String email,
        @NotBlank String password
){
}
