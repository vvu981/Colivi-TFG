package com.vvu981.colivibackend.core.storage.service.impl;

import com.cloudinary.Cloudinary;
import com.cloudinary.utils.ObjectUtils;
import com.vvu981.colivibackend.core.storage.service.IImageStorageService;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import jakarta.annotation.PostConstruct;
import java.io.IOException;
import java.util.Map;

@Service
public class CloudinaryImageStorageService implements IImageStorageService {

    @Value("${app.cloudinary.cloud-name}")
    private String cloudName;

    @Value("${app.cloudinary.api-key}")
    private String apiKey;

    @Value("${app.cloudinary.api-secret}")
    private String apiSecret;

    private Cloudinary cloudinary;

    @PostConstruct
    public void init() {
        // Inicializamos el cliente oficial de Cloudinary con tus credenciales
        this.cloudinary = new Cloudinary(ObjectUtils.asMap(
                "cloud_name", cloudName,
                "api_key", apiKey,
                "api_secret", apiSecret));
    }

    @Override
    public String uploadImage(MultipartFile file) {
        try {
            // Subimos el archivo a la carpeta "colivi" dentro de Cloudinary
            Map<?, ?> uploadResult = cloudinary.uploader().upload(file.getBytes(),
                    ObjectUtils.asMap("folder", "colivi"));

            // Devolvemos la URL absoluta pública que guardaremos en PostgreSQL
            return uploadResult.get("secure_url").toString();
        } catch (IOException e) {
            throw new RuntimeException("Error crítico al subir la imagen a Cloudinary", e);
        }
    }

    @Override
    public void deleteImage(String imageUrl) {
        try {
            // Extraemos el public_id necesario para borrar el archivo en Cloudinary
            String publicId = extractPublicId(imageUrl);

            // Le ordenamos a Cloudinary que destruya el binario físicamente
            cloudinary.uploader().destroy(publicId, ObjectUtils.emptyMap());
        } catch (IOException e) {
            throw new RuntimeException("Error crítico al eliminar la imagen de Cloudinary", e);
        }
    }

    // Método helper para sacar el "public_id" de una URL estándar de Cloudinary
    private String extractPublicId(String imageUrl) {
        // Ejemplo:
        // https://res.cloudinary.com/demo/image/upload/v123456/colivi/foto1.jpg ->
        // colivi/foto1
        int coliviIndex = imageUrl.indexOf("colivi/");
        if (coliviIndex == -1) {
            throw new IllegalArgumentException("La URL de la imagen no pertenece al contenedor de la aplicación.");
        }
        int dotIndex = imageUrl.lastIndexOf(".");
        return imageUrl.substring(coliviIndex, dotIndex);
    }
}