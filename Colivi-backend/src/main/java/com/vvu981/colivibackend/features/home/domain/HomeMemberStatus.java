package com.vvu981.colivibackend.features.home.domain;

public enum HomeMemberStatus {
    ACTIVE, // Vive actualmente en la casa (se muestra en la pantalla principal)
    LEFT, // Se fue de la casa o la abandonó (pasa al apartado "Casas pasadas")
    ARCHIVED // El usuario decidió ocultarla manualmente de su historial
}
