package com.vvu981.colivibackend.core.storage.service.impl;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.web.multipart.MultipartFile;

import static org.junit.jupiter.api.Assertions.*;

class CloudinaryImageStorageServiceTest {

    private CloudinaryImageStorageService imageStorageService;

    @BeforeEach
    void setUp() {
        String cloudName = System.getenv("CLOUDINARY_CLOUD_NAME");
        String apiKey = System.getenv("CLOUDINARY_API_KEY");
        String apiSecret = System.getenv("CLOUDINARY_API_SECRET");

        // Omitir el test si las variables de entorno no están configuradas
        org.junit.jupiter.api.Assumptions.assumeTrue(cloudName != null && !cloudName.trim().isEmpty(), 
                "Se omiten las pruebas de Cloudinary porque CLOUDINARY_CLOUD_NAME no está configurada.");
        org.junit.jupiter.api.Assumptions.assumeTrue(apiKey != null && !apiKey.trim().isEmpty(), 
                "Se omiten las pruebas de Cloudinary porque CLOUDINARY_API_KEY no está configurada.");
        org.junit.jupiter.api.Assumptions.assumeTrue(apiSecret != null && !apiSecret.trim().isEmpty(), 
                "Se omiten las pruebas de Cloudinary porque CLOUDINARY_API_SECRET no está configurada.");

        imageStorageService = new CloudinaryImageStorageService();
        ReflectionTestUtils.setField(imageStorageService, "cloudName", cloudName);
        ReflectionTestUtils.setField(imageStorageService, "apiKey", apiKey);
        ReflectionTestUtils.setField(imageStorageService, "apiSecret", apiSecret);
        imageStorageService.init();
    }

    @Test
    void shouldUploadAndDeleteImageSuccessfully() {
        // 1. Preparar una imagen dummy válida de 1x1 píxeles en formato GIF
        byte[] dummyImageBytes = new byte[] {
                0x47, 0x49, 0x46, 0x38, 0x39, 0x61, 0x01, 0x00, 0x01, 0x00, (byte) 0x80, 0x00, 0x00, (byte) 0xff,
                (byte) 0xff, (byte) 0xff, 0x00, 0x00, 0x00, 0x21, (byte) 0xf9, 0x04, 0x01, 0x00, 0x00, 0x00, 0x00,
                0x2c, 0x00, 0x00, 0x00, 0x00, 0x01, 0x00, 0x01, 0x00, 0x00, 0x02, 0x02, 0x44, 0x01, 0x00, 0x3b
        };
        MultipartFile mockFile = new MockMultipartFile(
                "file", 
                "test-integration-image.gif", 
                "image/gif", 
                dummyImageBytes
        );

        // 2. Probar la subida
        String secureUrl = assertDoesNotThrow(() -> imageStorageService.uploadImage(mockFile));
        assertNotNull(secureUrl);
        assertTrue(secureUrl.startsWith("https://res.cloudinary.com/"), "La URL debe ser de Cloudinary");
        assertTrue(secureUrl.contains("/colivi/"), "Debe guardarse en la carpeta colivi");

        System.out.println("Imagen subida con éxito: " + secureUrl);

        // 3. Probar la eliminación usando la URL obtenida
        assertDoesNotThrow(() -> imageStorageService.deleteImage(secureUrl));
        System.out.println("Imagen eliminada de Cloudinary con éxito.");
    }
}
