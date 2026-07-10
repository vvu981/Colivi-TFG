package com.vvu981.colivibackend.core.security;
 
import com.fasterxml.jackson.databind.ObjectMapper;
import com.vvu981.colivibackend.features.user.domain.User;
import com.vvu981.colivibackend.features.user.repository.UserRepository;
import io.jsonwebtoken.JwtException;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;
 
import java.io.IOException;
import java.time.LocalDateTime;
import java.util.Collections;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.Optional;
 
@Component
@RequiredArgsConstructor
public class JwtAuthenticationFilter extends OncePerRequestFilter {
 
    private final JwtTokenProvider jwtTokenProvider;
    private final UserRepository userRepository;
    private final ObjectMapper objectMapper;
 
    @Override
    protected void doFilterInternal(@org.springframework.lang.NonNull HttpServletRequest request,
                                    @org.springframework.lang.NonNull HttpServletResponse response,
                                    @org.springframework.lang.NonNull FilterChain filterChain)
            throws ServletException, IOException {
 
        try {
            // 1. Intentamos extraer el token de la petición
            Optional<String> jwt = extractJwtFromRequest(request);
 
            // 2. Si hay token, delegamos el proceso de autenticación
            if (jwt.isPresent()) {
                boolean wasBanned = authenticateToken(jwt.get(), request, response);
                if (wasBanned) {
                    return; // Abortamos el filtro si el usuario está baneado y ya respondimos 403
                }
            }
 
        } catch (JwtException e) {
            // Solo atrapamos errores reales de la librería JWT (ej. token malformado o
            // caducado).
            // No hacemos nada, el usuario queda como "Anónimo" y será rechazado por los
            // controladores.
        }
 
        // 3. El filtro siempre debe continuar
        filterChain.doFilter(request, response);
    }
 
    // --- MÉTODOS PRIVADOS DE APOYO (Clean Code) ---
    private Optional<String> extractJwtFromRequest(HttpServletRequest request) {
        String authHeader = request.getHeader("Authorization");
        if (authHeader != null && authHeader.startsWith("Bearer ")) {
            return Optional.of(authHeader.substring(7));
        }
        return Optional.empty();
    }
 
    private boolean authenticateToken(String jwt, HttpServletRequest request, HttpServletResponse response) throws IOException {
        String userEmail = jwtTokenProvider.extractEmail(jwt);
 
        // Cláusula de guarda (Early Return): Si no hay email o ya está autenticado,
        // abortamos sin anidar 'ifs'
        if (userEmail == null || SecurityContextHolder.getContext().getAuthentication() != null) {
            return false;
        }
 
        if (!jwtTokenProvider.isTokenValid(jwt)) {
            return false;
        }

        // Cargamos al usuario independientemente de su estado (baneado / eliminado).
        // La responsabilidad de filtrar por estado recae en UserStatusEnforcerFilter (SRP).
        userRepository.findByEmail(userEmail).ifPresent(user -> {

            // Validamos únicamente la integridad del token: versión actual del usuario.
            if (jwtTokenProvider.extractTokenVersion(jwt).equals(user.getTokenVersion())) {
                setSecurityContext(user, request);
            }
        }
        return false;
    }
 
    private void writeForbiddenResponse(HttpServletResponse response, User user, String path) throws IOException {
        response.setStatus(HttpServletResponse.SC_FORBIDDEN);
        response.setContentType("application/json");
        response.setCharacterEncoding("UTF-8");
 
        Map<String, Object> body = new LinkedHashMap<>();
        body.put("timestamp", LocalDateTime.now().toString());
        body.put("status", HttpServletResponse.SC_FORBIDDEN);
        body.put("error", "Forbidden");
        body.put("message", "User is banned. Reason: " + (user.getBanReason() != null ? user.getBanReason() : "No reason provided"));
        body.put("bannedUntil", user.getBannedUntil() != null ? user.getBannedUntil().toString() : "PERMANENT");
        body.put("path", path);
 
        response.getWriter().write(objectMapper.writeValueAsString(body));
    }
 
    private void setSecurityContext(User user, HttpServletRequest request) {
        SimpleGrantedAuthority authority = new SimpleGrantedAuthority(user.getRole().name());
 
        UsernamePasswordAuthenticationToken authToken = new UsernamePasswordAuthenticationToken(
                user,
                null,
                Collections.singletonList(authority));
        authToken.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
 
        SecurityContextHolder.getContext().setAuthentication(authToken);
    }
}