package com.vvu981.colivibackend.core.security;

import com.vvu981.colivibackend.features.user.domain.User;
import com.vvu981.colivibackend.features.user.repository.UserRepository;
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
import java.util.Collections;

@Component
@RequiredArgsConstructor
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private final JwtTokenProvider jwtTokenProvider;
    private final UserRepository userRepository;

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {

        // 1. Extraer la cabecera HTTP
        final String authHeader = request.getHeader("Authorization");
        final String jwt;
        final String userEmail;

        // 2. Si no hay cabecera o no empieza por "Bearer ", dejamos que pase como usuario "Anónimo"
        // (Será rechazado más adelante si la ruta requiere estar logueado)
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            filterChain.doFilter(request, response);
            return;
        }

        // 3. Recortamos la palabra "Bearer " para quedarnos solo con el texto cifrado
        jwt = authHeader.substring(7);

        try {
            // 4. Extraemos el email del token
            userEmail = jwtTokenProvider.extractEmail(jwt);

            // 5. Si hay un email y la caja fuerte temporal (SecurityContext) aún está vacía
            if (userEmail != null && SecurityContextHolder.getContext().getAuthentication() == null) {

                // Comprobamos si el token es matemáticamente válido y no ha caducado
                if (jwtTokenProvider.isTokenValid(jwt)) {

                    // Buscamos al usuario en base de datos.
                    // Esto nos asegura que si lo hemos borrado hoy, su token viejo no le sirva de nada.
                    User user = userRepository.findByEmailAndDeletedAtIsNull(userEmail)
                            .orElseThrow(() -> new RuntimeException("Usuario no encontrado"));

                    // Convertimos su rol (ej: "ADMIN") en la credencial oficial que entiende Spring Security
                    SimpleGrantedAuthority authority = new SimpleGrantedAuthority(user.getRole().name());

                    // Creamos el pase oficial de seguridad
                    UsernamePasswordAuthenticationToken authToken = new UsernamePasswordAuthenticationToken(
                            user,
                            null, // No necesitamos la contraseña para nada en este punto
                            Collections.singletonList(authority)
                    );

                    // Le adjuntamos detalles técnicos de la petición (como la IP)
                    authToken.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));

                    // 6. Guardamos el pase en la caja fuerte temporal de esta petición
                    SecurityContextHolder.getContext().setAuthentication(authToken);
                }
            }
        } catch (Exception e) {
            // Si el token fue manipulado o está caducado, la librería lanzará un error.
            // Lo capturamos en silencio. El SecurityContext quedará vacío y la petición será rechazada en la puerta.
        }

        // 7. Pase lo que pase, le decimos al sistema que continúe al siguiente paso
        filterChain.doFilter(request, response);
    }
}