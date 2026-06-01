package com.vvu981.colivibackend.features.user.controller;

import com.vvu981.colivibackend.features.user.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/v1/users")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;

    // El candado de seguridad: solo los administradores pasan de esta línea
    @PreAuthorize("hasAuthority('ADMIN')")
    @PatchMapping("/{userId}/admin")
    public ResponseEntity<Void> setAdmin(@PathVariable UUID userId) {

        // Si el código llega aquí, es porque el vigilante ya confirmó que es un ADMIN.
        // Simplemente delegamos el trabajo al cerebro (UserService)
        userService.setAdmin(userId);

        // Devolvemos un simple "200 OK" sin cuerpo, indicando éxito.
        return ResponseEntity.ok().build();
    }
}