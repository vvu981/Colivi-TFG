package com.vvu981.colivibackend.features.accommodation.repository;

import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.vvu981.colivibackend.features.accommodation.domain.*;

@Repository
public interface AccommodationImageRepository extends JpaRepository<AccommodationImage, UUID> {

}
