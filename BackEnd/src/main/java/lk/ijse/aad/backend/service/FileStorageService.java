package lk.ijse.aad.backend.service;

import org.springframework.web.multipart.MultipartFile;

public interface FileStorageService {
    String storeProfileImage(MultipartFile file);
    void deleteProfileImage(String imageUrl);
}
