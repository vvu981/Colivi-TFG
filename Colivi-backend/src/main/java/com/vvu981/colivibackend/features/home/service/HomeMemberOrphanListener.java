package com.vvu981.colivibackend.features.home.service;

import com.vvu981.colivibackend.features.home.domain.Home;
import com.vvu981.colivibackend.features.home.domain.HomeMember;
import com.vvu981.colivibackend.features.home.domain.HomeMemberStatus;
import com.vvu981.colivibackend.features.home.domain.HomeRole;
import com.vvu981.colivibackend.features.home.domain.event.AdminTransferredEvent;
import com.vvu981.colivibackend.features.home.domain.event.HomeDeletedEvent;
import com.vvu981.colivibackend.features.home.domain.event.MemberLeftEvent;
import com.vvu981.colivibackend.features.home.repository.HomeMemberRepository;
import com.vvu981.colivibackend.features.home.repository.HomeRepository;
import com.vvu981.colivibackend.features.user.domain.event.UserDeletedEvent;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Component;
import org.springframework.transaction.event.TransactionPhase;
import org.springframework.transaction.event.TransactionalEventListener;

import java.util.List;
import java.util.Optional;

@Slf4j
@Component
@RequiredArgsConstructor
public class HomeMemberOrphanListener {

    private final HomeMemberRepository homeMemberRepository;
    private final HomeRepository homeRepository;
    private final ApplicationEventPublisher eventPublisher;

    @TransactionalEventListener(phase = TransactionPhase.BEFORE_COMMIT)
    public void onUserDeleted(UserDeletedEvent event) {
        log.info("Processing UserDeletedEvent for userId: {}. Anti-Ghost Home system engaged.", event.userId());

        List<HomeMember> memberships = homeMemberRepository.findByUserIdAndHomeDeletedAtIsNull(event.userId());

        for (HomeMember currentMember : memberships) {
            if (currentMember.getStatus() != HomeMemberStatus.ACTIVE) {
                continue;
            }

            Home home = currentMember.getHome();

            if (currentMember.getRole() == HomeRole.ADMIN) {
                long activeMemberCount = homeMemberRepository.countByHomeIdAndStatus(home.getId(),
                        HomeMemberStatus.ACTIVE);

                if (activeMemberCount == 1) {
                    // Era el único miembro. Al borrarse, la casa muere.
                    home.softDelete();
                    homeRepository.save(home);
                    eventPublisher.publishEvent(new HomeDeletedEvent(home.getId(), event.userId(), home.getName()));
                } else {
                    long activeAdminCount = homeMemberRepository.countByHomeIdAndRoleAndStatus(home.getId(),
                            HomeRole.ADMIN, HomeMemberStatus.ACTIVE);

                    if (activeAdminCount == 1) {
                        // Era el único administrador, pero hay más miembros en la casa.
                        // Promocionamos al más antiguo que no sea él mismo.
                        List<HomeMember> allActive = homeMemberRepository.findByHomeIdAndStatus(home.getId(),
                                HomeMemberStatus.ACTIVE);
                        Optional<HomeMember> nextAdminOpt = allActive.stream()
                                .filter(m -> !m.getUser().getId().equals(event.userId()))
                                .min(java.util.Comparator.comparing(HomeMember::getJoinedAt));

                        if (nextAdminOpt.isPresent()) {
                            HomeMember nextAdmin = nextAdminOpt.get();
                            nextAdmin.setRole(HomeRole.ADMIN);
                            homeMemberRepository.save(nextAdmin);
                            eventPublisher.publishEvent(new AdminTransferredEvent(home.getId(), event.userId(),
                                    nextAdmin.getUser().getFullName()));
                            log.info("Promoted user {} to ADMIN in home {} due to previous admin deletion.",
                                    nextAdmin.getUser().getId(), home.getId());
                        }
                    }
                }
            }

            currentMember.leave();
            homeMemberRepository.save(currentMember);
            eventPublisher.publishEvent(
                    new MemberLeftEvent(home.getId(), event.userId(), currentMember.getUser().getFullName()));
        }
    }
}
