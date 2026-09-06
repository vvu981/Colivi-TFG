package com.vvu981.colivibackend.features.home.chore.controller;

import com.vvu981.colivibackend.features.home.chore.domain.ChoreStatus;
import com.vvu981.colivibackend.features.home.chore.dto.*;
import com.vvu981.colivibackend.features.home.chore.service.ChoreService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/homes/{homeId}/chores")
@RequiredArgsConstructor
public class HomeChoreController {

    private final ChoreService choreService;

    @PostMapping
    public ResponseEntity<List<ChoreResponseDto>> createChore(
            @PathVariable UUID homeId,
            @Valid @RequestBody CreateChoreRequest request,
            @AuthenticationPrincipal(expression = "id") UUID requestUserId) {
        List<ChoreResponseDto> created = choreService.createChore(homeId, request, requestUserId);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    @GetMapping
    public ResponseEntity<List<ChoreResponseDto>> getChores(
            @PathVariable UUID homeId,
            @RequestParam(required = false) UUID assigneeId,
            @RequestParam(required = false) ChoreStatus status,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to,
            @RequestParam(required = false) String period,
            @AuthenticationPrincipal(expression = "id") UUID requestUserId) {
        ChoreFilterDto filter = new ChoreFilterDto(assigneeId, status, from, to, period);
        List<ChoreResponseDto> chores = choreService.getChores(homeId, filter, requestUserId);
        return ResponseEntity.ok(chores);
    }

    @PatchMapping("/{choreId}/complete")
    public ResponseEntity<ChoreResponseDto> completeChore(
            @PathVariable UUID homeId,
            @PathVariable UUID choreId,
            @AuthenticationPrincipal(expression = "id") UUID requestUserId) {
        ChoreResponseDto completed = choreService.completeChore(homeId, choreId, requestUserId);
        return ResponseEntity.ok(completed);
    }

    @DeleteMapping("/{choreId}")
    public ResponseEntity<Void> deleteChore(
            @PathVariable UUID homeId,
            @PathVariable UUID choreId,
            @RequestParam(defaultValue = "DELETE_SINGLE") DeleteMode mode,
            @AuthenticationPrincipal(expression = "id") UUID requestUserId) {
        choreService.deleteChore(homeId, choreId, mode, requestUserId);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/leaderboard")
    public ResponseEntity<ChoreLeaderboardDto> getLeaderboard(
            @PathVariable UUID homeId,
            @RequestParam(defaultValue = "WEEKLY") String period,
            @AuthenticationPrincipal(expression = "id") UUID requestUserId) {
        ChoreLeaderboardDto leaderboard = choreService.getLeaderboard(homeId, period, requestUserId);
        return ResponseEntity.ok(leaderboard);
    }
}
