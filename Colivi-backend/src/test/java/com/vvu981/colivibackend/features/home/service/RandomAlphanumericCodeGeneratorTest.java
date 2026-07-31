package com.vvu981.colivibackend.features.home.service;

import com.vvu981.colivibackend.features.home.domain.Home;
import com.vvu981.colivibackend.features.home.repository.HomeRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;

/**
 * Tests unitarios para {@link RandomAlphanumericCodeGenerator}.
 *
 * <p>El test de "retry por colisión" vive aquí y no en {@code HomeServiceImplTest}
 * porque la lógica de unicidad es responsabilidad exclusiva del generador (SRP/OCP).</p>
 */
@ExtendWith(MockitoExtension.class)
class RandomAlphanumericCodeGeneratorTest {

    @Mock
    private HomeRepository homeRepository;

    private RandomAlphanumericCodeGenerator generator;

    @BeforeEach
    void setUp() {
        generator = new RandomAlphanumericCodeGenerator(homeRepository);
    }

    @Nested
    class Generate {

        @Test
        void shouldReturnCodeOfCorrectLengthAndFormat() {
            // Arrange
            when(homeRepository.findByInvitationCodeAndDeletedAtIsNull(anyString()))
                    .thenReturn(Optional.empty());

            // Act
            String code = generator.generate();

            // Assert
            assertNotNull(code);
            assertEquals(8, code.length());
            assertTrue(code.matches("[A-Z0-9]+"),
                    "El código debe contener solo letras mayúsculas y dígitos");
        }

        @Test
        void shouldRetryUntilUniqueCodeIsFound() {
            // Arrange — las primeras 2 llamadas devuelven un hogar existente (colisión),
            // la tercera está libre.
            when(homeRepository.findByInvitationCodeAndDeletedAtIsNull(anyString()))
                    .thenReturn(Optional.of(new Home())) // 1ª — colisión
                    .thenReturn(Optional.of(new Home())) // 2ª — colisión
                    .thenReturn(Optional.empty());        // 3ª — libre

            // Act
            String code = generator.generate();

            // Assert
            assertNotNull(code);
            // El repositorio debe haber sido consultado al menos 3 veces
            verify(homeRepository, times(3)).findByInvitationCodeAndDeletedAtIsNull(anyString());
        }

        @Test
        void shouldQueryRepositoryForUniquenessOnEachAttempt() {
            // Verifica que no se saltea la comprobación de unicidad
            when(homeRepository.findByInvitationCodeAndDeletedAtIsNull(anyString()))
                    .thenReturn(Optional.empty());

            generator.generate();

            verify(homeRepository, atLeastOnce()).findByInvitationCodeAndDeletedAtIsNull(anyString());
        }
    }
}
