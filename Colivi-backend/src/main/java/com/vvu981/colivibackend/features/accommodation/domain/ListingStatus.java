package com.vvu981.colivibackend.features.accommodation.domain;

public enum ListingStatus {
    PENDING, // El anuncio ha sido creado por el usuario y espera aprobación del ADMIN
    AVAILABLE, // Aprobado por el ADMIN y visible en el Marketplace público
    DENIED, // Desestimado por el ADMIN (no cumple normas, imágenes insuficientes, etc.)
    UNAVAILABLE // El alojamiento ya se ha alquilado o el propietario lo ha retirado
}