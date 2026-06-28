package com.vvu981.colivibackend.features.user.controller;

import com.vvu981.colivibackend.features.user.domain.User;
import com.vvu981.colivibackend.features.user.dto.BanRequest;
import com.vvu981.colivibackend.features.user.dto.UpdateNonSensible;
import com.vvu981.colivibackend.features.user.dto.UpdateSensible;
import com.vvu981.colivibackend.features.user.service.UserService;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
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

    @PatchMapping("/me/profile")
    public ResponseEntity<UpdateNonSensible> updateMyProfile(
            @Valid @RequestBody UpdateNonSensible request,
            @AuthenticationPrincipal(expression = "id") UUID userId) {

        // El controlador simplemente hace de puente. Le pasa el usuario seguro y los
        // datos al servicio.
        UpdateNonSensible response = userService.updateNonSensibleData(userId, request);

        // Devuelve un 200 OK con los datos actualizados
        return ResponseEntity.ok(response);
    }

    @PatchMapping("/me/credentials")
    public ResponseEntity<Void> updateMyCredentials(
            @Valid @RequestBody UpdateSensible request, @AuthenticationPrincipal(expression = "id") UUID userId) {
        userService.updateSensibleData(userId, request);
        return ResponseEntity.ok().build();
    }

    @PatchMapping("/me/logout")
    public ResponseEntity<Void> logout(@AuthenticationPrincipal(expression = "id") UUID userId) {
        userService.logout(userId);
        return ResponseEntity.ok().build();
    }

    @PatchMapping("/me/delete/soft")
    public ResponseEntity<Void> deleteUserSoft(@AuthenticationPrincipal(expression = "id") UUID userId) {
        userService.deleteUserSoft(userId);
        return ResponseEntity.ok().build();
    }

    @PreAuthorize("hasAuthority('ADMIN')")
    @PatchMapping("/{userId}/delete/hard")
    public ResponseEntity<Void> deleteUserHard(@PathVariable UUID userId) {
        userService.deleteUserHard(userId);
        return ResponseEntity.ok().build();
    }

    @PreAuthorize("hasAuthority('ADMIN')")
    @PatchMapping("/{userId}/ban")
    public ResponseEntity<Void> banUser(@PathVariable UUID userId,
            @Valid @RequestBody BanRequest request) {
        userService.banUser(userId, request.message(), request.bannedUntil());
        return ResponseEntity.ok().build();
    }

    @PreAuthorize("hasAuthority('ADMIN')")
    @PatchMapping("/{userId}/unban")
    public ResponseEntity<Void> unbanUser(@PathVariable UUID userId) {
        userService.unbanUser(userId);
        return ResponseEntity.ok().build();
    }
}