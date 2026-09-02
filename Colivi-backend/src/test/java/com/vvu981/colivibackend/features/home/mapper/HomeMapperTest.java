package com.vvu981.colivibackend.features.home.mapper;

import com.vvu981.colivibackend.features.home.domain.Home;
import com.vvu981.colivibackend.features.home.domain.HomeMember;
import com.vvu981.colivibackend.features.home.domain.HomeMemberStatus;
import com.vvu981.colivibackend.features.home.domain.HomeRole;
import com.vvu981.colivibackend.features.home.dto.HomeDetailResponseDto;
import com.vvu981.colivibackend.features.home.dto.HomeMemberResponseDto;
import com.vvu981.colivibackend.features.home.dto.HomeResponseDto;
import com.vvu981.colivibackend.features.user.domain.User;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;

class HomeMapperTest {

    private HomeMapper mapper;

    @BeforeEach
    void setUp() {
        mapper = new HomeMapper();
    }

    @Test
    void toMemberDto() {
        User user = new User();
        user.setId(UUID.randomUUID());
        user.setFirstName("John");
        user.setLastName1("Doe");
        user.setEmail("test@test.com");
        user.setProfilePicUrl("https://example.com/photo.jpg");

        HomeMember member = new HomeMember();
        member.setUser(user);
        member.setRole(HomeRole.MEMBER);
        member.setStatus(HomeMemberStatus.ACTIVE);
        member.setJoinedAt(LocalDateTime.now());

        HomeMemberResponseDto dto = mapper.toMemberDto(member);

        assertEquals(user.getId(), dto.userId());
        assertEquals("John Doe", dto.fullName());
        assertEquals(user.getEmail(), dto.email());
        assertEquals("https://example.com/photo.jpg", dto.profilePicUrl());
        assertEquals(HomeRole.MEMBER, dto.role());
        assertEquals(HomeMemberStatus.ACTIVE, dto.status());
    }

    @Test
    void toResponseDto() {
        Home home = new Home();
        home.setId(UUID.randomUUID());
        home.setName("My Home");
        home.setInvitationCode("CODE");
        home.setCreatedAt(LocalDateTime.now());
        home.setMembers(new ArrayList<>());

        HomeMember member = new HomeMember();
        member.setRole(HomeRole.ADMIN);
        member.setStatus(HomeMemberStatus.ACTIVE);
        home.addMember(member);

        HomeResponseDto dto = mapper.toResponseDto(home, member);

        assertEquals(home.getId(), dto.id());
        assertEquals("My Home", dto.name());
        assertEquals("CODE", dto.invitationCode());
        assertEquals(HomeRole.ADMIN, dto.myRole());
        assertEquals(HomeMemberStatus.ACTIVE, dto.myStatus());
        assertEquals(1, dto.totalActiveMembers());
    }

    @Test
    void toDetailDto() {
        Home home = new Home();
        home.setId(UUID.randomUUID());
        home.setName("My Home");
        home.setInvitationCode("CODE");
        home.setCreatedAt(LocalDateTime.now());
        home.setMembers(new ArrayList<>());

        User user = new User();
        user.setId(UUID.randomUUID());
        user.setFirstName("John");
        user.setLastName1("Doe");

        HomeMember member = new HomeMember();
        member.setUser(user);
        member.setRole(HomeRole.ADMIN);
        member.setStatus(HomeMemberStatus.ACTIVE);
        home.addMember(member);

        HomeDetailResponseDto dto = mapper.toDetailDto(home, member);

        assertEquals(home.getId(), dto.id());
        assertEquals("My Home", dto.name());
        assertEquals("CODE", dto.invitationCode());
        assertEquals(HomeRole.ADMIN, dto.myRole());
        assertEquals(HomeMemberStatus.ACTIVE, dto.myStatus());
        assertEquals(1, dto.totalActiveMembers());
        assertNotNull(dto.members());
        assertEquals(1, dto.members().size());
    }
}
