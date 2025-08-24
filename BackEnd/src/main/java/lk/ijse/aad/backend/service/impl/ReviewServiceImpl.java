package lk.ijse.aad.backend.service.impl;

import lk.ijse.aad.backend.dto.ReviewDTO;
import lk.ijse.aad.backend.service.ReviewService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class ReviewServiceImpl implements ReviewService {

    @Override
    public void saveReview(ReviewDTO reviewDTO) {

    }

    @Override
    public void updateReview(ReviewDTO reviewDTO) {

    }

    @Override
    public void deleteReview(Long id) {

    }

    @Override
    public ReviewDTO getReviewById(Long id) {
        return null;
    }

    @Override
    public List<ReviewDTO> getAllReviews() {
        return List.of();
    }

    @Override
    public List<ReviewDTO> getReviewsByFreelancerId(Long freelancerId) {
        return List.of();
    }

    @Override
    public List<ReviewDTO> getReviewsByTaskId(Long taskId) {
        return List.of();
    }

}
