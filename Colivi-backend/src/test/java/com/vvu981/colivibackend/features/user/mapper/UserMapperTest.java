package com.vvu981.colivibackend.features.user.mapper;

import com.vvu981.colivibackend.features.user.domain.User;
import com.vvu981.colivibackend.features.user.dto.UpdateNonSensible;
import com.vvu981.colivibackend.features.user.dto.UpdateSensible;
import org.junit.jupiter.api.Test;
import org.mapstruct.factory.Mappers;

import static org.assertj.core.api.Assertions.assertThat;

class UserMapperTest {

    private final UserMapper userMapper = Mappers.getMapper(UserMapper.class);

    @Test
    void testUpdateEntityFromDto_UpdateNonSensible() {
        User user = new User();
        user.setNickname("oldNick");
        user.setFirstName("oldName");

        UpdateNonSensible dto = new UpdateNonSensible("newNick", null, null, null, null, null);
        userMapper.updateEntityFromDto(dto, user);

        assertThat(user.getNickname()).isEqualTo("newNick");
        assertThat(user.getFirstName()).isEqualTo("oldName"); // Ignored null
    }

    @Test
    void testToUpdateNonSensibleDto() {
        User user = new User();
        user.setNickname("nick");
        user.setFirstName("name");

        UpdateNonSensible dto = userMapper.toUpdateNonSensibleDto(user);

        assertThat(dto.nickname()).isEqualTo("nick");
        assertThat(dto.firstName()).isEqualTo("name");
    }

}
