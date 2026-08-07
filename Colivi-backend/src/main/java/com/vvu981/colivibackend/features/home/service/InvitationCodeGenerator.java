package com.vvu981.colivibackend.features.home.service;

/**
 * Contrato para la generación de códigos de invitación únicos de un hogar.
 *
 * <p>Extraído de {@code HomeServiceImpl} para cumplir el Principio Abierto/Cerrado (OCP):
 * la estrategia de generación puede cambiar (códigos con palabras, QR, etc.)
 * sin modificar la lógica de negocio del servicio.</p>
 */
public interface InvitationCodeGenerator {

    /**
     * Genera y devuelve un código de invitación garantizando su unicidad en el sistema.
     *
     * @return código de invitación único y listo para persistir.
     */
    String generate();
}
