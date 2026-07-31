package com.vvu981.colivibackend.features.home.service;

/**
 * Interfaz unificada mantenida como ruta de migración.
 *
 * <p>Está marcada como {@code @Deprecated} porque viola el Principio de Segregación
 * de Interfaces (ISP): agrupa operaciones de lectura y escritura en un único contrato,
 * forzando a cualquier cliente a depender de métodos que no necesita.</p>
 *
 * <p>Usa en su lugar:</p>
 * <ul>
 *   <li>{@link HomeQueryService} — para operaciones de solo lectura.</li>
 *   <li>{@link HomeCommandService} — para operaciones de escritura/mutación.</li>
 * </ul>
 *
 * @deprecated Usar {@link HomeQueryService} y {@link HomeCommandService} por separado.
 */
@Deprecated(forRemoval = true)
public interface HomeService extends HomeQueryService, HomeCommandService {
}
