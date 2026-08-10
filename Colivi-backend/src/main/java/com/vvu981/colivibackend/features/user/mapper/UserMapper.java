package com.vvu981.colivibackend.features.user.mapper;

import com.vvu981.colivibackend.features.user.domain.User;
import com.vvu981.colivibackend.features.user.dto.UpdateNonSensible;
import com.vvu981.colivibackend.features.user.dto.UserProfileResponse;
import com.vvu981.colivibackend.features.user.dto.MyProfileResponse;
import com.vvu981.colivibackend.features.user.dto.AdminUserProfileResponse;

import org.mapstruct.Mapper;
import org.mapstruct.MappingTarget;
import org.mapstruct.NullValuePropertyMappingStrategy;

@Mapper(componentModel = "spring", unmappedTargetPolicy = org.mapstruct.ReportingPolicy.IGNORE, nullValuePropertyMappingStrategy = NullValuePropertyMappingStrategy.IGNORE)
public interface UserMapper {

    // Regla 1: Copia los datos del DTO al Usuario real (omitiendo los nulos)
    void updateEntityFromDto(UpdateNonSensible dto, @MappingTarget User entity);

    // Regla 2: Convierte un Usuario real de vuelta a un DTO para enviarlo a la web
    UpdateNonSensible toUpdateNonSensibleDto(User entity);

    UserProfileResponse toUserProfileDto(User user);
    
    MyProfileResponse toMyProfileDto(User user);
    
    AdminUserProfileResponse toAdminUserProfileDto(User user);

}
