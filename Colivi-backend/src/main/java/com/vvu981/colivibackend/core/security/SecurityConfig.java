package com.vvu981.colivibackend.core.security;

import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;
import org.springframework.security.web.util.matcher.AntPathRequestMatcher;

import java.util.List;

@Configuration
@EnableWebSecurity
@EnableMethodSecurity // Activa los candados @PreAuthorize en los controladores
@RequiredArgsConstructor // Necesario para inyectar nuestro filtro nuevo
public class SecurityConfig {

    private final JwtAuthenticationFilter jwtAuthFilter;
    private final UserStatusEnforcerFilter userStatusEnforcerFilter;

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public AuthenticationManager authenticationManager(AuthenticationConfiguration config) throws Exception {
        return config.getAuthenticationManager();
    }

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
                .cors(cors -> cors.configurationSource(corsConfigurationSource()))
                .csrf(AbstractHttpConfigurer::disable)

                .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))

                .authorizeHttpRequests(auth -> auth
                        .requestMatchers(new AntPathRequestMatcher("/api/v1/auth/**")).permitAll() // Rutas públicas (Login y Registro)
                        .requestMatchers(new AntPathRequestMatcher("/v3/api-docs/**"), new AntPathRequestMatcher("/swagger-ui/**"), new AntPathRequestMatcher("/swagger-ui.html")).permitAll() // Rutas públicas (Swagger)
                        .requestMatchers(new AntPathRequestMatcher("/error")).permitAll() // Permitir la ruta de errores por defecto de Spring Boot
                        .requestMatchers(new AntPathRequestMatcher("/api/v1/listings/**", "GET")).permitAll() // Catálogo público de alojamientos
                        .requestMatchers(new AntPathRequestMatcher("/api/v1/accommodations/reviews", "GET")).permitAll() // Reseñas públicas para búsqueda semántica / MCP
                        .anyRequest().authenticated() // Todo lo demás requiere estar logueado
                )

                // 1. Primero validamos el token JWT (autenticación criptográfica)
                .addFilterBefore(jwtAuthFilter, UsernamePasswordAuthenticationFilter.class)
                // 2. Después de autenticar, verificamos el estado operativo del usuario (SRP)
                .addFilterAfter(userStatusEnforcerFilter, JwtAuthenticationFilter.class);

        return http.build();
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();
        // Permite cualquier puerto de localhost (ej. 3000, 5173, etc.)
        configuration.setAllowedOriginPatterns(List.of("http://localhost:*")); 
        configuration.setAllowedMethods(List.of("GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"));
        configuration.setAllowedHeaders(List.of("*"));
        configuration.setAllowCredentials(true);
        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        return source;
    }
}
