package com.vvu981.colivibackend.core.security;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.vvu981.colivibackend.features.user.domain.User;
import com.vvu981.colivibackend.features.user.exception.AccountBannedException;
import com.vvu981.colivibackend.features.user.exception.AccountDeletedException;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.time.LocalDateTime;
import java.util.LinkedHashMap;
import java.util.Map;

/**
 * Filtro de seguridad responsable de verificar el estado operativo del usuario
 * ya autenticado (principal en el {@link SecurityContextHolder}).
 *
 * <h2>Responsabilidad única (SRP)</h2>
 * Este filtro opera DESPUÉS del {@link JwtAuthenticationFilter}. En ese momento
 * el token ya ha sido validado criptográficamente y el usuario ya está cargado
 * en el contexto de seguridad. La única tarea de este filtro es aplicar las
 * políticas de estado de negocio:
 * <ul>
 *   <li><b>Baneado</b>: se deniega el acceso con HTTP 403 en todas las rutas.</li>
 *   <li><b>Eliminado (soft-delete)</b>: se deniega el acceso con HTTP 403, excepto
 *       en las rutas de reactivación de cuenta definidas en {@link #REACTIVATION_PATHS}.</li>
 * </ul>
 *
 * <h2>Justificación arquitectónica (OCP + DIP)</h2>
 * El filtro depende únicamente del objeto {@link User} presente en el contexto,
 * sin consultas adicionales a la base de datos. Añadir nuevas políticas de estado
 * (ej. cuenta suspendida por impago) solo requiere extender este filtro, sin tocar
 * el filtro JWT ni ningún servicio de negocio.
 */
@Component
@RequiredArgsConstructor
public class UserStatusEnforcerFilter extends OncePerRequestFilter {

    private final ObjectMapper objectMapper;

    /**
     * Rutas a las que un usuario con eliminación lógica (soft-deleted) SÍ puede
     * acceder, ya que son necesarias para el flujo de recuperación de cuenta.
     * Un usuario baneado NO tiene esta excepción.
     */
    private static final String[] REACTIVATION_PATHS = {
            "/api/v1/auth/reactivate",
            "/api/v1/auth/request-reactivation"
    };

    @Override
    protected void doFilterInternal(@org.springframework.lang.NonNull HttpServletRequest request,
                                    @org.springframework.lang.NonNull HttpServletResponse response,
                                    @org.springframework.lang.NonNull FilterChain filterChain) throws ServletException, IOException {

        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();

        // Cláusula de guarda: si no hay usuario autenticado, no hay nada que verificar.
        if (authentication == null || !(authentication.getPrincipal() instanceof User user)) {
            filterChain.doFilter(request, response);
            return;
        }

        // --- POLÍTICA 1: Usuario baneado → acceso denegado siempre (sin excepciones) ---
        if (user.isBanned()) {
            String reason = user.getBanReason();
            writeErrorResponse(response, new AccountBannedException(reason != null ? reason : "sin motivo especificado"));
            return;
        }

        // --- POLÍTICA 2: Usuario eliminado (soft-delete) ---
        // Solo se permite el acceso a las rutas de reactivación de cuenta.
        if (user.getDeletedAt() != null) {
            String requestPath = request.getRequestURI();
            boolean isReactivationPath = isReactivationRequest(requestPath);

            if (!isReactivationPath) {
                writeErrorResponse(response, new AccountDeletedException());
                return;
            }
        }

        // El usuario está en buen estado: continuar con la cadena de filtros.
        filterChain.doFilter(request, response);
    }

    /**
     * Comprueba si la ruta solicitada corresponde a una ruta de reactivación permitida.
     * Separado en método privado para aplicar el principio de responsabilidad única
     * dentro de la propia clase y facilitar futuras extensiones.
     *
     * @param requestPath la URI de la petición actual.
     * @return {@code true} si la ruta es una ruta de reactivación permitida.
     */
    private boolean isReactivationRequest(String requestPath) {
        for (String allowedPath : REACTIVATION_PATHS) {
            if (requestPath.startsWith(allowedPath)) {
                return true;
            }
        }
        return false;
    }

    /**
     * Escribe directamente una respuesta de error HTTP 403 en JSON, cortocircuitando
     * la cadena de filtros. Esto es necesario porque las excepciones lanzadas desde
     * un filtro no son interceptadas por {@code @RestControllerAdvice}.
     *
     * <p>El cuerpo de la respuesta sigue el mismo esquema que el {@code GlobalExceptionHandler}
     * para mantener consistencia en la API.</p>
     *
     * @param response  el objeto de respuesta HTTP.
     * @param exception la excepción de estado de cuenta que originó el bloqueo.
     */
    private void writeErrorResponse(HttpServletResponse response, RuntimeException exception) throws IOException {
        Map<String, Object> body = new LinkedHashMap<>();
        body.put("timestamp", LocalDateTime.now().toString());
        body.put("status", HttpStatus.FORBIDDEN.value());
        body.put("error", "Forbidden");
        body.put("message", exception.getMessage());

        response.setStatus(HttpStatus.FORBIDDEN.value());
        response.setContentType(MediaType.APPLICATION_JSON_VALUE);
        response.setCharacterEncoding("UTF-8");
        objectMapper.writeValue(response.getWriter(), body);
    }
}
