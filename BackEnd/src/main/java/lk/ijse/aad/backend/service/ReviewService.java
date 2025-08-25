package lk.ijse.aad.backend.service;

import lk.ijse.aad.backend.dto.ReviewDTO;

import java.util.List;

public interface ReviewService {
    void saveReview(ReviewDTO reviewDTO);
    void updateReview(ReviewDTO reviewDTO);
    void deleteReview(Long id);
    ReviewDTO getReviewById(Long id);
    List<ReviewDTO> getAllReviews();
    List<ReviewDTO> getReviewsByFreelancerId(Long freelancerId);
    List<ReviewDTO> getReviewsByTaskId(Long taskId);
    List<ReviewDTO> getReviewsByClientId(Long clientId);
    boolean hasClientReviewedTask(Long clientId, Long taskId);
}
