package com.vvu981.colivibackend.features.home.service;

import com.vvu981.colivibackend.core.exception.BusinessRuleValidationException;
import com.vvu981.colivibackend.core.exception.ResourceNotFoundException;
import com.vvu981.colivibackend.core.exception.UnauthorizedActionException;
import com.vvu981.colivibackend.features.home.domain.Home;
import com.vvu981.colivibackend.features.home.domain.HomeMember;
import com.vvu981.colivibackend.features.home.domain.HomeMemberStatus;
import com.vvu981.colivibackend.features.home.domain.HomeRole;
import com.vvu981.colivibackend.features.home.dto.CreateHomeRequest;
import com.vvu981.colivibackend.features.home.dto.HomeDetailResponseDto;
import com.vvu981.colivibackend.features.home.dto.HomeResponseDto;
import com.vvu981.colivibackend.features.home.dto.JoinHomeRequest;
import com.vvu981.colivibackend.features.home.domain.event.*;
import org.springframework.context.ApplicationEventPublisher;
import com.vvu981.colivibackend.features.home.mapper.HomeMapper;
import com.vvu981.colivibackend.features.home.repository.HomeMemberRepository;
import com.vvu981.colivibackend.features.home.repository.HomeRepository;
import com.vvu981.colivibackend.features.home.repository.ActivityLogRepository;
import com.vvu981.colivibackend.features.user.domain.User;
import com.vvu981.colivibackend.features.user.domain.UserRole;
import com.vvu981.colivibackend.features.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class HomeServiceImpl implements HomeService {

    private final HomeRepository homeRepository;
    private final HomeMemberRepository homeMemberRepository;
    private final ActivityLogRepository activityLogRepository;
    private final UserRepository userRepository;
    private final InvitationCodeGenerator invitationCodeGenerator;
    private final HomeMapper homeMapper;
    private final HomeBalanceValidator homeBalanceValidator;
    private final HomeExpenseService homeExpenseService;
    private final ApplicationEventPublisher eventPublisher;

    // =========================================================================
    // HomeCommandService
    // =========================================================================

    @Override
    @Transactional
    public HomeDetailResponseDto createHome(CreateHomeRequest request, UUID userId) {
        User user = findActiveUser(userId);

        Home home = new Home();
        home.setName(request.name());
        home.setInvitationCode(invitationCodeGenerator.generate());

        HomeMember adminMember = new HomeMember();
        adminMember.setUser(user);
        adminMember.setRole(HomeRole.ADMIN);
        adminMember.setStatus(HomeMemberStatus.ACTIVE);

        home.addMember(adminMember);
        homeRepository.save(home);
        
        eventPublisher.publishEvent(new HomeCreatedEvent(home.getId(), userId, home.getName()));

        return homeMapper.toDetailDto(home, adminMember);
    }

    @Override
    @Transactional
    public HomeDetailResponseDto joinHome(JoinHomeRequest request, UUID userId) {
        User user = findActiveUser(userId);

        Home home = homeRepository.findByInvitationCodeAndDeletedAtIsNull(request.invitationCode())
                .orElseThrow(() -> new ResourceNotFoundException(
                        "No existe ningún hogar activo con el código: " + request.invitationCode()));

        Optional<HomeMember> existingMembership = homeMemberRepository.findByHomeIdAndUserId(home.getId(), userId);

        HomeMember member;
        if (existingMembership.isPresent()) {
            member = existingMembership.get();
            if (member.getStatus() == HomeMemberStatus.ACTIVE) {
                throw new BusinessRuleValidationException("Ya eres miembro activo de este hogar.");
            }
            // reactivate() restablece status=ACTIVE, role=MEMBER y limpia leftAt.
            // El rol de ADMIN previo NO se restaura automáticamente.
            member.reactivate();
        } else {
            member = new HomeMember();
            member.setUser(user);
            member.setRole(HomeRole.MEMBER);
            member.setStatus(HomeMemberStatus.ACTIVE);
            home.addMember(member);
        }

        homeRepository.save(home);
        
        eventPublisher.publishEvent(new MemberJoinedEvent(home.getId(), userId, user.getFullName()));

        return homeMapper.toDetailDto(home, member);
    }

    @Override
    @Transactional
    public void leaveHome(UUID homeId, UUID userId) {
        HomeMember currentMember = findActiveMembership(homeId, userId);

        if (currentMember.getRole() == HomeRole.ADMIN) {
            long activeMemberCount = currentMember.getHome().getMembers().stream()
                    .filter(m -> m.getStatus() == HomeMemberStatus.ACTIVE)
                    .count();

            if (activeMemberCount == 1) {
                // Es el ÚNICO miembro activo: softDelete automático
                Home home = currentMember.getHome();
                home.softDelete();
                homeRepository.save(home);
                eventPublisher.publishEvent(new HomeDeletedEvent(home.getId(), userId, home.getName()));
            } else {
                long activeAdminCount = currentMember.getHome().getMembers().stream()
                        .filter(m -> m.getRole() == HomeRole.ADMIN && m.getStatus() == HomeMemberStatus.ACTIVE)
                        .count();

                if (activeAdminCount == 1) {
                    throw new BusinessRuleValidationException(
                            "Eres el único administrador del hogar. Debes transferir el rol de administrador a otro miembro antes de salir.");
                }
            }
        }

        homeBalanceValidator.validateZeroBalance(homeId, userId);
        currentMember.leave();
        eventPublisher.publishEvent(new MemberLeftEvent(homeId, userId, currentMember.getUser().getFullName()));
    }

    @Override
    @Transactional
    public void expelMember(UUID homeId, UUID adminUserId, UUID targetUserId) {
        if (adminUserId.equals(targetUserId)) {
            throw new BusinessRuleValidationException(
                    "No puedes expulsarte a ti mismo. Usa la opción 'Salir del hogar'.");
        }

        requireAdminRole(homeId, adminUserId);

        HomeMember targetMember = homeMemberRepository.findByHomeIdAndUserId(homeId, targetUserId)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "El usuario destino no es miembro de este hogar."));

        if (targetMember.getStatus() != HomeMemberStatus.ACTIVE) {
            throw new BusinessRuleValidationException(
                    "Solo puedes expulsar a un miembro activo.");
        }

        homeBalanceValidator.validateZeroBalance(homeId, targetUserId);
        targetMember.leave();
        eventPublisher.publishEvent(new MemberExpelledEvent(homeId, adminUserId, targetMember.getUser().getFullName(), null));
    }

    @Override
    @Transactional
    public void forceExpelWithDebtSettlement(UUID homeId, UUID adminUserId, UUID targetUserId, String reason) {
        if (adminUserId.equals(targetUserId)) {
            throw new BusinessRuleValidationException(
                    "No puedes expulsarte a ti mismo. Usa la opción 'Salir del hogar'.");
        }

        requireAdminRole(homeId, adminUserId);

        HomeMember targetMember = homeMemberRepository.findByHomeIdAndUserId(homeId, targetUserId)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "El usuario destino no es miembro de este hogar."));

        if (targetMember.getStatus() != HomeMemberStatus.ACTIVE) {
            throw new BusinessRuleValidationException(
                    "Solo puedes expulsar a un miembro activo.");
        }

        java.math.BigDecimal userBalance = homeExpenseService.getUserBalance(homeId, targetUserId);

        if (userBalance.compareTo(java.math.BigDecimal.ZERO) != 0) {
            String baseDesc = "CONDONACIÓN_EXPULSIÓN";
            String expenseDescription = reason != null && !reason.isBlank() ? baseDesc + ": " + reason : baseDesc;
            java.math.BigDecimal absBalance = userBalance.abs();
            
            Home home = findActiveHome(homeId);
            java.util.List<UUID> activeMemberIds = home.getMembers().stream()
                    .filter(m -> m.getStatus() == HomeMemberStatus.ACTIVE && !m.getUser().getId().equals(targetUserId))
                    .map(m -> m.getUser().getId())
                    .toList();
                    
            if (activeMemberIds.isEmpty()) {
                throw new BusinessRuleValidationException("No hay miembros activos suficientes para condonar la deuda.");
            }

            com.vvu981.colivibackend.features.home.dto.CreateExpenseRequest request;

            if (userBalance.compareTo(java.math.BigDecimal.ZERO) < 0) {
                // Moroso: su deuda se reparte. El moroso figura como pagador para subir su balance, y el resto como consumidores (asumen la pérdida).
                request = new com.vvu981.colivibackend.features.home.dto.CreateExpenseRequest(
                        expenseDescription, absBalance, targetUserId, activeMemberIds);
            } else {
                // Acreedor: la casa asume el beneficio. El resto son pagadores figurativos, el expulsado es el consumidor.
                // Como CreateExpenseRequest solo admite 1 pagador, usamos al adminUserId para representar el pago, pero
                // idealmente todos deberían abonarle. Para simplificar, si hay acreencia, el admin la representa, pero es mejor
                // que asuma el pago un solo miembro (ej. el admin) y se reparta el consumo. 
                // Moroso es el caso crítico a arreglar. En ambos casos, targetUserId es el que se neutraliza.
                request = new com.vvu981.colivibackend.features.home.dto.CreateExpenseRequest(
                        expenseDescription, absBalance, adminUserId, java.util.List.of(targetUserId));
            }

            homeExpenseService.createExpense(homeId, request, adminUserId);
        }

        // Una vez liquidado el balance, procedemos con la expulsión normal
        homeBalanceValidator.validateZeroBalance(homeId, targetUserId);
        targetMember.leave();
        eventPublisher.publishEvent(new MemberExpelledEvent(homeId, adminUserId, targetMember.getUser().getFullName(), reason));
    }

    @Override
    @Transactional
    public void archiveHomeView(UUID homeId, UUID userId) {
        HomeMember member = findMembership(homeId, userId);

        if (member.getStatus() == HomeMemberStatus.ACTIVE) {
            throw new BusinessRuleValidationException(
                    "Debes salir del hogar antes de archivarlo. Usa la opción 'Salir del hogar'.");
        }
        if (member.getStatus() == HomeMemberStatus.ARCHIVED) {
            throw new BusinessRuleValidationException(
                    "Este hogar ya está archivado.");
        }

        // status == LEFT: transición válida LEFT → ARCHIVED
        member.archive();
    }

    @Override
    @Transactional
    public void unarchiveHomeView(UUID homeId, UUID userId) {
        HomeMember member = findMembership(homeId, userId);

        if (member.getStatus() != HomeMemberStatus.ARCHIVED) {
            throw new BusinessRuleValidationException(
                    "Este hogar no está archivado.");
        }

        // ARCHIVED → LEFT: el hogar vuelve a aparecer en la pestaña "Salidos"
        member.unarchive();
    }

    @Override
    @Transactional
    public HomeDetailResponseDto regenerateInvitationCode(UUID homeId, UUID userId) {
        requireAdminRole(homeId, userId);
        Home home = findActiveHome(homeId);
        
        home.setInvitationCode(invitationCodeGenerator.generate());
        homeRepository.save(home);
        
        HomeMember currentMember = findActiveMembership(homeId, userId);
        return homeMapper.toDetailDto(home, currentMember);
    }

    @Override
    @Transactional
    public void softDeleteHome(UUID homeId, UUID userId) {
        User user = findActiveUser(userId);
        boolean isSystemAdmin = user.getRole() == UserRole.ADMIN;

        if (!isSystemAdmin) {
            HomeMember currentMember = homeMemberRepository.findByHomeIdAndUserId(homeId, userId)
                    .orElseThrow(() -> new UnauthorizedActionException(
                            "No tienes permisos para eliminar este hogar."));

            if (currentMember.getStatus() != HomeMemberStatus.ACTIVE || currentMember.getRole() != HomeRole.ADMIN) {
                throw new UnauthorizedActionException(
                        "Solo el administrador puede realizar esta acción.");
            }

            long activeMemberCount = currentMember.getHome().getMembers().stream()
                    .filter(m -> m.getStatus() == HomeMemberStatus.ACTIVE)
                    .count();

            if (activeMemberCount > 1) {
                throw new BusinessRuleValidationException(
                        "No puedes eliminar el hogar porque hay otros miembros activos. Debes gestionar su salida primero.");
            }
        }

        Home home = findActiveHome(homeId);
        home.softDelete();
        homeRepository.save(home);
        eventPublisher.publishEvent(new HomeDeletedEvent(homeId, userId, home.getName()));
    }

    @Override
    @Transactional
    public void hardDeleteHome(UUID homeId, UUID userId) {
        User user = findActiveUser(userId);
        if (user.getRole() != UserRole.ADMIN) {
            throw new UnauthorizedActionException("Solo un administrador del sistema puede ejecutar un borrado físico.");
        }
        
        Home home = findActiveHome(homeId);
        
        // BYPASS GDPR: Borrado manual explícito de auditoría para evitar FK constraints.
        activityLogRepository.deleteByHomeId(homeId);
        
        homeRepository.delete(home);
    }

    @Override
    @Transactional
    public void transferAdmin(UUID homeId, UUID currentUserId, UUID targetUserId) {
        if (currentUserId.equals(targetUserId)) {
            throw new BusinessRuleValidationException(
                    "No puedes transferirte el rol de administrador a ti mismo.");
        }

        requireAdminRole(homeId, currentUserId);

        HomeMember targetMember = homeMemberRepository.findByHomeIdAndUserId(homeId, targetUserId)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "El usuario destino no es miembro de este hogar."));

        if (targetMember.getStatus() != HomeMemberStatus.ACTIVE) {
            throw new BusinessRuleValidationException(
                    "Solo puedes transferir el rol de administrador a un miembro activo.");
        }

        if (targetMember.getRole() == HomeRole.ADMIN) {
            throw new BusinessRuleValidationException(
                    "El usuario destino ya es administrador de este hogar.");
        }

        HomeMember currentMember = homeMemberRepository.findByHomeIdAndUserId(homeId, currentUserId)
                .orElseThrow();

        targetMember.setRole(HomeRole.ADMIN);
        currentMember.setRole(HomeRole.MEMBER);
        eventPublisher.publishEvent(new AdminTransferredEvent(homeId, currentUserId, targetMember.getUser().getFullName()));
    }

    // =========================================================================
    // HomeQueryService
    // =========================================================================

    @Override
    public List<HomeResponseDto> getUserHomes(UUID userId, HomeMemberStatus statusFilter) {
        List<HomeMember> memberships = (statusFilter != null)
                ? homeMemberRepository.findByUserIdAndStatusAndHomeDeletedAtIsNull(userId, statusFilter)
                : homeMemberRepository.findByUserIdAndHomeDeletedAtIsNull(userId);

        return memberships.stream()
                .map(m -> homeMapper.toResponseDto(m.getHome(), m))
                .toList();
    }

    @Override
    public HomeDetailResponseDto getHomeDetail(UUID homeId, UUID userId) {
        Home home = findActiveHome(homeId);
        HomeMember currentMember = homeMemberRepository.findByHomeIdAndUserId(homeId, userId)
                .filter(m -> m.getStatus() == HomeMemberStatus.ACTIVE || m.getStatus() == HomeMemberStatus.LEFT)
                .orElseThrow(() -> new UnauthorizedActionException(
                        "No tienes acceso a los detalles de este hogar."));
        return homeMapper.toDetailDto(home, currentMember);
    }

    // =========================================================================
    // Métodos privados de soporte
    // =========================================================================

    private User findActiveUser(UUID userId) {
        return userRepository.findByIdAndDeletedAtIsNull(userId)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Usuario no encontrado o eliminado con id: " + userId));
    }

    private Home findActiveHome(UUID homeId) {
        return homeRepository.findByIdAndDeletedAtIsNull(homeId)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Hogar no encontrado o eliminado con id: " + homeId));
    }

    /**
     * Busca la membresía del usuario en el hogar independientemente de su estado.
     * Usar cuando se necesitan gestionar transiciones de estado (archivar, desarchivar).
     */
    private HomeMember findMembership(UUID homeId, UUID userId) {
        return homeMemberRepository.findByHomeIdAndUserId(homeId, userId)
                .orElseThrow(() -> new UnauthorizedActionException(
                        "No eres miembro de este hogar."));
    }

    /**
     * Busca la membresía del usuario en el hogar solo si está activa.
     * Usar cuando la operación requiere participación activa (leaveHome).
     */
    private HomeMember findActiveMembership(UUID homeId, UUID userId) {
        return homeMemberRepository.findByHomeIdAndUserId(homeId, userId)
                .filter(m -> m.getStatus() == HomeMemberStatus.ACTIVE)
                .orElseThrow(() -> new UnauthorizedActionException(
                        "No eres miembro activo de este hogar."));
    }

    /**
     * Valida que el usuario es ADMIN activo en el hogar.
     * Solo se usa para operaciones de dominio del hogar (transferAdmin, expelMember).
     * Los borrados son responsabilidad mixta y se verifican por separado.
     */
    private void requireAdminRole(UUID homeId, UUID userId) {
        HomeMember member = homeMemberRepository.findByHomeIdAndUserId(homeId, userId)
                .orElseThrow(() -> new UnauthorizedActionException(
                        "No eres miembro de este hogar."));

        if (member.getStatus() != HomeMemberStatus.ACTIVE) {
            throw new UnauthorizedActionException(
                    "Debes ser miembro activo del hogar para realizar esta acción.");
        }

        if (member.getRole() != HomeRole.ADMIN) {
            throw new UnauthorizedActionException(
                    "Solo el administrador puede realizar esta acción.");
        }
    }
}
