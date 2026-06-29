package com.vvu981.colivibackend.features.accommodation.domain;

public enum ListingStatus {
    PENDIENTE, // El anuncio ha sido creado por el usuario y espera aprobación del ADMIN
    ACTIVO, // Aprobado por el ADMIN y visible en el Marketplace público
    RECHAZADO, // Desestimado por el ADMIN (no cumple normas, imágenes insuficientes, etc.)
    FINALIZADO // El alojamiento ya se ha alquilado o el propietario lo ha retirado
}