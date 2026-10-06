package com.vvu981.colivibackend.features.accommodation.domain;

public enum AccommodationVisibility {
    AVAILABLE, // Solo activos (Para el público)
    DELETED, // Solo eliminados (Papelera del Admin)
    ALL // Todo el histórico (Auditoría del Admin)
}
