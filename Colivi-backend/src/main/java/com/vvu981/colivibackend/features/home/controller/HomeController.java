package com.vvu981.colivibackend.features.home.controller;

import com.vvu981.colivibackend.features.home.domain.HomeMemberStatus;
import com.vvu981.colivibackend.features.home.dto.CreateHomeRequest;
import com.vvu981.colivibackend.features.home.dto.HomeDetailResponseDto;
import com.vvu981.colivibackend.features.home.dto.HomeResponseDto;
import com.vvu981.colivibackend.features.home.dto.JoinHomeRequest;
import com.vvu981.colivibackend.features.home.service.HomeCommandService;
import com.vvu981.colivibackend.features.home.service.HomeQueryService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

/**
 * Controlador REST del módulo Home.
 *
 * <h2>Modelo de estados de membresía</h2>
 * <ul>
 *   <li>{@code ACTIVE}   – el usuario vive/participa activamente → vista principal</li>
 *   <li>{@code LEFT}     – el usuario salió pero quiere ver el historial → pestaña "Salidos"</li>
 *   <li>{@code ARCHIVED} – el usuario salió y no quiere verlo → pestaña "Archivados"</li>
 * </ul>
 *
 * <h2>Niveles de autorización</h2>
 * <ul>
 *   <li>Operaciones de miembro: cualquier usuario autenticado con membresía activa (o left para lectura).</li>
 *   <li>Operaciones de admin del hogar: requieren {@code HomeRole.ADMIN} en el hogar.</li>
 *   <li>Operaciones de admin del sistema: requieren {@code @PreAuthorize("hasAuthority('ADMIN')")}.</li>
 * </ul>
 */
@RestController
@RequestMapping("/api/v1/homes")
public class HomeController {

    private final HomeQueryService homeQueryService;
    private final HomeCommandService homeCommandService;

    public HomeController(HomeQueryService homeQueryService, HomeCommandService homeCommandService) {
        this.homeQueryService = homeQueryService;
        this.homeCommandService = homeCommandService;
    }

    // =========================================================================
    // Operaciones de cualquier usuario autenticado
    // =========================================================================

    /**
     * POST /api/v1/homes — Crea un nuevo hogar. El creador pasa a ser ADMIN.
     */
    @PostMapping
    public ResponseEntity<HomeDetailResponseDto> createHome(
            @Valid @RequestBody CreateHomeRequest request,
            @AuthenticationPrincipal(expression = "id") UUID currentUserId) {
        HomeDetailResponseDto response = homeCommandService.createHome(request, currentUserId);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    /**
     * POST /api/v1/homes/join — Se une al hogar usando un código de invitación.
     * Si el usuario tenía una membresía previa (LEFT/ARCHIVED), la reactiva con rol MEMBER.
     */
    @PostMapping("/join")
    public ResponseEntity<HomeDetailResponseDto> joinHome(
            @Valid @RequestBody JoinHomeRequest request,
            @AuthenticationPrincipal(expression = "id") UUID currentUserId) {
        HomeDetailResponseDto response = homeCommandService.joinHome(request, currentUserId);
        return ResponseEntity.ok(response);
    }

    /**
     * GET /api/v1/homes — Obtiene los hogares del usuario autenticado.
     * Filtra opcionalmente por estado de membresía con el QueryParam {@code status}.
     */
    @GetMapping
    public ResponseEntity<List<HomeResponseDto>> getUserHomes(
            @RequestParam(required = false) HomeMemberStatus status,
            @AuthenticationPrincipal(expression = "id") UUID currentUserId) {
        List<HomeResponseDto> response = homeQueryService.getUserHomes(currentUserId, status);
        return ResponseEntity.ok(response);
    }

    /**
     * GET /api/v1/homes/{id} — Detalle completo de un hogar. Requiere membresía ACTIVE o LEFT.
     */
    @GetMapping("/{id}")
    public ResponseEntity<HomeDetailResponseDto> getHomeDetail(
            @PathVariable("id") UUID homeId,
            @AuthenticationPrincipal(expression = "id") UUID currentUserId) {
        HomeDetailResponseDto response = homeQueryService.getHomeDetail(homeId, currentUserId);
        return ResponseEntity.ok(response);
    }

    /**
     * PATCH /api/v1/homes/{id}/leave — El usuario sale del hogar (ACTIVE → LEFT).
     * El hogar pasa a aparecer en la pestaña "Salidos".
     */
    @PatchMapping("/{id}/leave")
    public ResponseEntity<Void> leaveHome(
            @PathVariable("id") UUID homeId,
            @AuthenticationPrincipal(expression = "id") UUID currentUserId) {
        homeCommandService.leaveHome(homeId, currentUserId);
        return ResponseEntity.noContent().build();
    }

    /**
     * PATCH /api/v1/homes/{id}/archive — Archiva el hogar (LEFT → ARCHIVED).
     * Requiere haber salido previamente del hogar. El hogar pasa a la pestaña "Archivados".
     */
    @PatchMapping("/{id}/archive")
    public ResponseEntity<Void> archiveHomeView(
            @PathVariable("id") UUID homeId,
            @AuthenticationPrincipal(expression = "id") UUID currentUserId) {
        homeCommandService.archiveHomeView(homeId, currentUserId);
        return ResponseEntity.noContent().build();
    }

    /**
     * PATCH /api/v1/homes/{id}/unarchive — Desarchiva el hogar (ARCHIVED → LEFT).
     * El hogar vuelve a aparecer en la pestaña "Salidos".
     */
    @PatchMapping("/{id}/unarchive")
    public ResponseEntity<Void> unarchiveHomeView(
            @PathVariable("id") UUID homeId,
            @AuthenticationPrincipal(expression = "id") UUID currentUserId) {
        homeCommandService.unarchiveHomeView(homeId, currentUserId);
        return ResponseEntity.noContent().build();
    }

    // =========================================================================
    // Operaciones de admin del hogar
    // =========================================================================

    /**
     * PATCH /api/v1/homes/{id}/transfer-admin — Transfiere el rol de ADMIN a otro miembro activo.
     * Necesario antes de salir si eres el único ADMIN y quedan miembros activos.
     */
    @PatchMapping("/{id}/transfer-admin")
    public ResponseEntity<Void> transferAdmin(
            @PathVariable("id") UUID homeId,
            @RequestParam("targetUserId") UUID targetUserId,
            @AuthenticationPrincipal(expression = "id") UUID currentUserId) {
        homeCommandService.transferAdmin(homeId, currentUserId, targetUserId);
        return ResponseEntity.noContent().build();
    }

    /**
     * PATCH /api/v1/homes/{id}/members/{targetUserId}/expel — Expulsa a un miembro activo.
     * Requiere ser ADMIN del hogar.
     */
    @PatchMapping("/{id}/members/{targetUserId}/expel")
    public ResponseEntity<Void> expelMember(
            @PathVariable("id") UUID homeId,
            @PathVariable("targetUserId") UUID targetUserId,
            @AuthenticationPrincipal(expression = "id") UUID currentUserId) {
        homeCommandService.expelMember(homeId, currentUserId, targetUserId);
        return ResponseEntity.noContent().build();
    }

    /**
     * PATCH /api/v1/homes/{id}/members/{targetUserId}/force-expel — Expulsión forzosa con liquidación de deudas.
     * Requiere ser ADMIN del hogar.
     */
    @PatchMapping("/{id}/members/{targetUserId}/force-expel")
    public ResponseEntity<Void> forceExpelMember(
            @PathVariable("id") UUID homeId,
            @PathVariable("targetUserId") UUID targetUserId,
            @RequestBody(required = false) java.util.Map<String, String> body,
            @AuthenticationPrincipal(expression = "id") UUID currentUserId) {
        String reason = body != null ? body.get("reason") : null;
        homeCommandService.forceExpelWithDebtSettlement(homeId, currentUserId, targetUserId, reason);
        return ResponseEntity.noContent().build();
    }

    // =========================================================================
    // Operaciones mixtas / administradores del sistema
    // =========================================================================

    /**
     * DELETE /api/v1/homes/{id} — Borrado lógico del hogar.
     * Puede ejecutarse por System Admin o por Home Admin (si es el único miembro).
     * La autorización detallada se realiza en el servicio.
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> softDeleteHome(
            @PathVariable("id") UUID homeId,
            @AuthenticationPrincipal(expression = "id") UUID currentUserId) {
        homeCommandService.softDeleteHome(homeId, currentUserId);
        return ResponseEntity.noContent().build();
    }

    /**
     * DELETE /api/v1/homes/{id}/hard — Borrado físico del hogar y en cascada. Irreversible.
     * Exclusivo para administradores del sistema.
     */
    @DeleteMapping("/{id}/hard")
    @PreAuthorize("hasAuthority('ADMIN')")
    public ResponseEntity<Void> hardDeleteHome(
            @PathVariable("id") UUID homeId,
            @AuthenticationPrincipal(expression = "id") UUID currentUserId) {
        homeCommandService.hardDeleteHome(homeId, currentUserId);
        return ResponseEntity.noContent().build();
    }
}
