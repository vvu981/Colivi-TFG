package com.vvu981.colivibackend.features.accommodation.domain;

public enum ListingStatus {
    AVAILABLE, // por defecto
    UNAVAILABLE, // El alojamiento ya se ha alquilado o el propietario lo ha retirado
    BANNED // Baneado por admin
}