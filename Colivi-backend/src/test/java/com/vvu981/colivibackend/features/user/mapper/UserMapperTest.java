package com.vvu981.colivibackend.features.user.mapper;

import com.vvu981.colivibackend.features.user.domain.User;
import com.vvu981.colivibackend.features.user.dto.UpdateNonSensible;
import com.vvu981.colivibackend.features.user.dto.UserProfileResponse;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.mapstruct.factory.Mappers;

import static org.assertj.core.api.Assertions.assertThat;

@DisplayName("UserMapper (MapStruct impl)")
class UserMapperTest {

    private final UserMapper userMapper = Mappers.getMapper(UserMapper.class);

    // updateEntityFromDto

    @Nested
    @DisplayName("updateEntityFromDto")
    class UpdateEntityFromDto {

        @Test
        @DisplayName("dto null: retorna sin modificar la entidad")
        void givenNullDto_thenEntityUnchanged() {
            User user = new User();
            user.setNickname("original");

            userMapper.updateEntityFromDto(null, user);

            assertThat(user.getNickname()).isEqualTo("original");
        }

        @Test
        @DisplayName("todos los campos no-null: actualiza todos")
        void givenAllFieldsPresent_thenUpdatesAll() {
            User user = new User();

            UpdateNonSensible dto = new UpdateNonSensible(
                    "newNick", "newFirst", "newLast1", "newLast2",
                    "+34600000001", "https://pic.url/new.jpg"
            );

            userMapper.updateEntityFromDto(dto, user);

            assertThat(user.getNickname()).isEqualTo("newNick");
            assertThat(user.getFirstName()).isEqualTo("newFirst");
            assertThat(user.getLastName1()).isEqualTo("newLast1");
            assertThat(user.getLastName2()).isEqualTo("newLast2");
            assertThat(user.getPhone()).isEqualTo("+34600000001");
            assertThat(user.getProfilePicUrl()).isEqualTo("https://pic.url/new.jpg");
        }

        @Test
        @DisplayName("solo nickname no-null: actualiza solo nickname")
        void givenOnlyNicknamePresent_thenOnlyNicknameUpdated() {
            User user = new User();
            user.setNickname("oldNick");
            user.setFirstName("oldName");
            user.setLastName1("oldLast1");
            user.setLastName2("oldLast2");
            user.setPhone("+34600000000");
            user.setProfilePicUrl("https://old.url");

            userMapper.updateEntityFromDto(new UpdateNonSensible("newNick", null, null, null, null, null), user);

            assertThat(user.getNickname()).isEqualTo("newNick");
            assertThat(user.getFirstName()).isEqualTo("oldName");
            assertThat(user.getLastName1()).isEqualTo("oldLast1");
            assertThat(user.getLastName2()).isEqualTo("oldLast2");
            assertThat(user.getPhone()).isEqualTo("+34600000000");
            assertThat(user.getProfilePicUrl()).isEqualTo("https://old.url");
        }

        @Test
        @DisplayName("todos null: no modifica nada")
        void givenAllFieldsNull_thenEntityUnchanged() {
            User user = new User();
            user.setNickname("keepNick");
            user.setFirstName("keepName");
            user.setLastName1("keepLast1");
            user.setLastName2("keepLast2");
            user.setPhone("+34600000002");
            user.setProfilePicUrl("https://keep.url");

            userMapper.updateEntityFromDto(new UpdateNonSensible(null, null, null, null, null, null), user);

            assertThat(user.getNickname()).isEqualTo("keepNick");
            assertThat(user.getFirstName()).isEqualTo("keepName");
            assertThat(user.getLastName1()).isEqualTo("keepLast1");
            assertThat(user.getLastName2()).isEqualTo("keepLast2");
            assertThat(user.getPhone()).isEqualTo("+34600000002");
            assertThat(user.getProfilePicUrl()).isEqualTo("https://keep.url");
        }
    }

    // toUpdateNonSensibleDto

    @Nested
    @DisplayName("toUpdateNonSensibleDto")
    class ToUpdateNonSensibleDto {

        @Test
        @DisplayName("entidad null: retorna null")
        void givenNullEntity_thenReturnsNull() {
            UpdateNonSensible result = userMapper.toUpdateNonSensibleDto(null);
            assertThat(result).isNull();
        }

        @Test
        @DisplayName("entidad completa: mapea todos los campos")
        void givenFullyPopulatedUser_thenMapsAllFields() {
            User user = new User();
            user.setNickname("nick");
            user.setFirstName("First");
            user.setLastName1("Last1");
            user.setLastName2("Last2");
            user.setPhone("+34600000003");
            user.setProfilePicUrl("https://pic.url/photo.jpg");

            UpdateNonSensible dto = userMapper.toUpdateNonSensibleDto(user);

            assertThat(dto.nickname()).isEqualTo("nick");
            assertThat(dto.firstName()).isEqualTo("First");
            assertThat(dto.lastName1()).isEqualTo("Last1");
            assertThat(dto.lastName2()).isEqualTo("Last2");
            assertThat(dto.phone()).isEqualTo("+34600000003");
            assertThat(dto.profilePicUrl()).isEqualTo("https://pic.url/photo.jpg");
        }
    }

    // toUserProfileDto

    @Nested
    @DisplayName("toUserProfileDto")
    class ToUserProfileDto {

        @Test
        @DisplayName("user null: retorna null")
        void givenNullUser_thenReturnsNull() {
            UserProfileResponse result = userMapper.toUserProfileDto(null);
            assertThat(result).isNull();
        }

        @Test
        @DisplayName("user valido: retorna instancia no nula")
        void givenValidUser_thenReturnsNonNull() {
            User user = new User();
            user.setNickname("profileNick");

            UserProfileResponse result = userMapper.toUserProfileDto(user);

            assertThat(result).isNotNull();
        }
    }
}
