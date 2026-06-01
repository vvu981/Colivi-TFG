package com.vvu981.colivibackend.core.security;

import com.vvu981.colivibackend.features.user.domain.User;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.io.Decoders;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import javax.crypto.SecretKey;
import java.util.Date;

@Component
public class JwtTokenProviderImpl implements JwtTokenProvider {

    @Value("${jwt.secret}")
    private String secretKey;

    @Value("${jwt.expiration}")
    private long jwtExpiration;

    @Value("${jwt.refresh-expiration}")
    private long refreshExpiration;

    @Override
    public String generateAccessToken(User user) {
        return buildToken(user, jwtExpiration);
    }

    @Override
    public String generateRefreshToken(User user) {
        return buildToken(user, refreshExpiration);
    }

    @Override
    public boolean isTokenValid(String token) {
        try {
            Jwts.parser()
                    .verifyWith(getSignInKey())
                    .build()
                    .parseSignedClaims(token);
            return true;
        } catch (Exception e) {
            // Si el token caducó, está mal formado o la firma no coincide, falla silenciosamente.
            return false;
        }
    }

    @Override
    public String extractEmail(String token) {
        Claims claims = Jwts.parser()
                .verifyWith(getSignInKey())
                .build()
                .parseSignedClaims(token)
                .getPayload();
        return claims.getSubject(); // El "subject" es donde guardamos el email
    }

    // --- MÉTODOS PRIVADOS DE UTILIDAD ---

    private String buildToken(User user, long expiration) {
        return Jwts.builder()
                .subject(user.getEmail()) // Guardamos el email como identificador principal
                .claim("role", user.getRole().name()) // Guardamos su rol (ADMIN o USER)
                .claim("id", user.getId().toString()) // Guardamos su UUID
                .issuedAt(new Date(System.currentTimeMillis()))
                .expiration(new Date(System.currentTimeMillis() + expiration))
                .signWith(getSignInKey()) // Firmamos con nuestra clave secreta
                .compact();
    }

    private SecretKey getSignInKey() {
        byte[] keyBytes = Decoders.BASE64.decode(secretKey);
        return Keys.hmacShaKeyFor(keyBytes);
    }
}