package com.vvu981.colivibackend.core.storage.service;

import org.springframework.web.multipart.MultipartFile;

public interface IImageStorageService {

    String uploadImage(MultipartFile file);

    void deleteImage(String imageUrl);
}
