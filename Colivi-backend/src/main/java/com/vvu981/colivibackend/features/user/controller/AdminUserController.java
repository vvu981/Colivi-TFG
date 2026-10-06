package com.vvu981.colivibackend.features.user.controller;

import com.vvu981.colivibackend.features.user.domain.UserRole;
import com.vvu981.colivibackend.features.user.dto.AdminUserProfileResponse;
import com.vvu981.colivibackend.features.user.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/admin/users")
@RequiredArgsConstructor
@PreAuthorize("hasAuthority('ADMIN')")
public class AdminUserController {

    private final UserService userService;

    @GetMapping
    public ResponseEntity<Page<AdminUserProfileResponse>> searchUsers(
            @RequestParam(required = false) String query,
            @RequestParam(required = false) UserRole role,
            @RequestParam(required = false) Boolean banned,
            @RequestParam(required = false) Boolean deleted,
            @PageableDefault(sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {

        Page<AdminUserProfileResponse> users = userService.searchUsersForAdmin(query, role, banned, deleted, pageable);
        return ResponseEntity.ok(users);
    }
}
