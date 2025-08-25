package lk.ijse.aad.backend.controller;

import lk.ijse.aad.backend.dto.ApiResponse;
import lk.ijse.aad.backend.dto.ReviewDTO;
import lk.ijse.aad.backend.service.ReviewService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/reviews")
@RequiredArgsConstructor
@CrossOrigin
public class ReviewController {

    private final ReviewService reviewService;

    @PostMapping
    @PreAuthorize("hasRole('CLIENT')")
    public ResponseEntity<ApiResponse> createReview(@RequestBody ReviewDTO reviewDTO) {
        reviewService.saveReview(reviewDTO);
        return ResponseEntity.ok(new ApiResponse(
                201,
                "Review Created Successfully",
                null
        ));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('CLIENT')")
    public ResponseEntity<ApiResponse> updateReview(@PathVariable Long id, @RequestBody ReviewDTO reviewDTO) {
        reviewDTO.setId(id);
        reviewService.updateReview(reviewDTO);
        return ResponseEntity.ok(new ApiResponse(
                200,
                "Review Updated Successfully",
                null
        ));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('CLIENT', 'ADMIN')")
    public ResponseEntity<ApiResponse> deleteReview(@PathVariable Long id) {
        reviewService.deleteReview(id);
        return ResponseEntity.ok(new ApiResponse(
                200,
                "Review Deleted Successfully",
                null
        ));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('CLIENT', 'FREELANCER', 'ADMIN')")
    public ResponseEntity<ApiResponse> getReviewById(@PathVariable Long id) {
        ReviewDTO review = reviewService.getReviewById(id);
        return ResponseEntity.ok(new ApiResponse(
                200,
                "Review Retrieved Successfully",
                review
        ));
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN')")
    public ResponseEntity<ApiResponse> getAllReviews() {
        List<ReviewDTO> reviews = reviewService.getAllReviews();
        return ResponseEntity.ok(new ApiResponse(
                200,
                "Reviews Retrieved Successfully",
                reviews
        ));
    }

    @GetMapping("/freelancer/{freelancerId}")
    @PreAuthorize("hasAnyRole('FREELANCER', 'ADMIN')")
    public ResponseEntity<ApiResponse> getReviewsByFreelancer(@PathVariable Long freelancerId) {
        List<ReviewDTO> reviews = reviewService.getReviewsByFreelancerId(freelancerId);
        return ResponseEntity.ok(new ApiResponse(
                200,
                "Freelancer Reviews Retrieved Successfully",
                reviews
        ));
    }

    @GetMapping("/task/{taskId}")
    @PreAuthorize("hasAnyRole('CLIENT', 'FREELANCER', 'ADMIN')")
    public ResponseEntity<ApiResponse> getReviewsByTask(@PathVariable Long taskId) {
        List<ReviewDTO> reviews = reviewService.getReviewsByTaskId(taskId);
        return ResponseEntity.ok(new ApiResponse(
                200,
                "Task Reviews Retrieved Successfully",
                reviews
        ));
    }

    @GetMapping("/client/{clientId}")
    @PreAuthorize("hasAnyRole('CLIENT', 'ADMIN')")
    public ResponseEntity<ApiResponse> getReviewsByClient(@PathVariable Long clientId) {
        List<ReviewDTO> reviews = reviewService.getReviewsByClientId(clientId);
        return ResponseEntity.ok(new ApiResponse(
                200,
                "Client Reviews Retrieved Successfully",
                reviews
        ));
    }

    @GetMapping("/check/{clientId}/{taskId}")
    @PreAuthorize("hasAnyRole('CLIENT', 'ADMIN')")
    public ResponseEntity<ApiResponse> hasClientReviewedTask(
            @PathVariable Long clientId,
            @PathVariable Long taskId) {
        boolean hasReviewed = reviewService.hasClientReviewedTask(clientId, taskId);
        return ResponseEntity.ok(new ApiResponse(
                200,
                "Review Check Completed",
                hasReviewed
        ));
    }

}
