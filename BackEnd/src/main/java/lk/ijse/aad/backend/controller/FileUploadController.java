package lk.ijse.aad.backend.controller;

import lk.ijse.aad.backend.dto.ApiResponse;
import lk.ijse.aad.backend.service.FileStorageService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.Map;

@RestController
@RequestMapping("/api/v1/upload")
@RequiredArgsConstructor
@CrossOrigin
public class FileUploadController {

    private final FileStorageService fileStorageService;

    @PostMapping("/profile-image")
    public ResponseEntity<ApiResponse> uploadProfileImage(@RequestParam("image") MultipartFile file) {
        try {
            String imageUrl = fileStorageService.storeProfileImage(file);
            return ResponseEntity.ok(new ApiResponse(
                    200,
                    "Image uploaded successfully",
                    Map.of("imageUrl", imageUrl)
            ));
        } catch (Exception e) {
            return ResponseEntity.status(500)
                    .body(new ApiResponse(500, "Failed to upload image: " + e.getMessage(), null));
        }
    }

}
