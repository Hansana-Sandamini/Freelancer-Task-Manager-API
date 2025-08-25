package lk.ijse.aad.backend.service.impl;

import lk.ijse.aad.backend.dto.ReviewDTO;
import lk.ijse.aad.backend.entity.Review;
import lk.ijse.aad.backend.entity.Task;
import lk.ijse.aad.backend.entity.User;
import lk.ijse.aad.backend.repository.ReviewRepository;
import lk.ijse.aad.backend.repository.TaskRepository;
import lk.ijse.aad.backend.repository.UserRepository;
import lk.ijse.aad.backend.service.ReviewService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.modelmapper.ModelMapper;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class ReviewServiceImpl implements ReviewService {

    private final ReviewRepository reviewRepository;
    private final UserRepository userRepository;
    private final TaskRepository taskRepository;
    private final ModelMapper modelMapper;

    @Override
    public void saveReview(ReviewDTO reviewDTO) {
        try {
            // Validate that the client exists
            User client = userRepository.findById(reviewDTO.getClientId())
                    .orElseThrow(() -> new RuntimeException("Client not found with ID: " + reviewDTO.getClientId()));

            // Validate that the freelancer exists
            User freelancer = userRepository.findById(reviewDTO.getFreelancerId())
                    .orElseThrow(() -> new RuntimeException("Freelancer not found with ID: " + reviewDTO.getFreelancerId()));

            // Validate that the task exists
            Task task = taskRepository.findById(reviewDTO.getTaskId())
                    .orElseThrow(() -> new RuntimeException("Task not found with ID: " + reviewDTO.getTaskId()));

            // Validate that the client is the owner of the task
            if (!task.getClient().getId().equals(client.getId())) {
                throw new RuntimeException("Client is not the owner of this task");
            }

            // Validate that the freelancer is assigned to the task
            if (!task.getFreelancer().getId().equals(freelancer.getId())) {
                throw new RuntimeException("Freelancer is not assigned to this task");
            }

            // Check if client has already reviewed this task
            if (hasClientReviewedTask(client.getId(), task.getId())) {
                throw new RuntimeException("Client has already reviewed this task");
            }

            // Validate rating range
            if (reviewDTO.getRating() < 1 || reviewDTO.getRating() > 5) {
                throw new RuntimeException("Rating must be between 1 and 5");
            }

            Review review = modelMapper.map(reviewDTO, Review.class);
            review.setClient(client);
            review.setFreelancer(freelancer);
            review.setTask(task);
            review.setCreatedAt(LocalDateTime.now());

            reviewRepository.save(review);
            log.info("Review saved successfully for task: {} by client: {}", task.getTitle(), client.getName());

        } catch (Exception e) {
            log.error("Error while saving review for task: {}", reviewDTO.getTaskId(), e);
            throw new RuntimeException("Failed to save review: " + e.getMessage(), e);
        }
    }

    @Override
    public void updateReview(ReviewDTO reviewDTO) {
        try {
            Review existingReview = reviewRepository.findById(reviewDTO.getId())
                    .orElseThrow(() -> new RuntimeException("Review not found with ID: " + reviewDTO.getId()));

            // Validate rating range
            if (reviewDTO.getRating() < 1 || reviewDTO.getRating() > 5) {
                throw new RuntimeException("Rating must be between 1 and 5");
            }

            existingReview.setRating(reviewDTO.getRating());
            existingReview.setComment(reviewDTO.getComment());
            existingReview.setUpdatedAt(LocalDateTime.now());

            reviewRepository.save(existingReview);
            log.info("Review updated successfully: {}", reviewDTO.getId());

        } catch (Exception e) {
            log.error("Error while updating review: {}", reviewDTO.getId(), e);
            throw new RuntimeException("Failed to update review: " + e.getMessage(), e);
        }
    }

    @Override
    public void deleteReview(Long id) {
        try {
            if (!reviewRepository.existsById(id)) {
                throw new RuntimeException("Review not found with ID: " + id);
            }
            reviewRepository.deleteById(id);
            log.info("Review deleted successfully: {}", id);

        } catch (Exception e) {
            log.error("Error while deleting review: {}", id, e);
            throw new RuntimeException("Failed to delete review: " + e.getMessage(), e);
        }
    }

    @Override
    public ReviewDTO getReviewById(Long id) {
        try {
            Review review = reviewRepository.findById(id)
                    .orElseThrow(() -> new RuntimeException("Review not found with ID: " + id));
            return convertToDTO(review);
        } catch (Exception e) {
            log.error("Error while retrieving review: {}", id, e);
            throw new RuntimeException("Failed to retrieve review: " + e.getMessage(), e);
        }
    }

    @Override
    public List<ReviewDTO> getAllReviews() {
        try {
            return reviewRepository.findAll().stream()
                    .map(this::convertToDTO)
                    .collect(Collectors.toList());
        } catch (Exception e) {
            log.error("Error while retrieving all reviews", e);
            throw new RuntimeException("Failed to retrieve reviews: " + e.getMessage(), e);
        }
    }

    @Override
    public List<ReviewDTO> getReviewsByFreelancerId(Long freelancerId) {
        try {
            return reviewRepository.findByFreelancerId(freelancerId).stream()
                    .map(this::convertToDTO)
                    .collect(Collectors.toList());
        } catch (Exception e) {
            log.error("Error while retrieving reviews for freelancer: {}", freelancerId, e);
            throw new RuntimeException("Failed to retrieve freelancer reviews: " + e.getMessage(), e);
        }
    }

    @Override
    public List<ReviewDTO> getReviewsByTaskId(Long taskId) {
        try {
            return reviewRepository.findByTaskId(taskId).stream()
                    .map(this::convertToDTO)
                    .collect(Collectors.toList());
        } catch (Exception e) {
            log.error("Error while retrieving reviews for task: {}", taskId, e);
            throw new RuntimeException("Failed to retrieve task reviews: " + e.getMessage(), e);
        }
    }

    @Override
    public List<ReviewDTO> getReviewsByClientId(Long clientId) {
        try {
            return reviewRepository.findByClientId(clientId).stream()
                    .map(this::convertToDTO)
                    .collect(Collectors.toList());
        } catch (Exception e) {
            log.error("Error while retrieving reviews by client: {}", clientId, e);
            throw new RuntimeException("Failed to retrieve client reviews: " + e.getMessage(), e);
        }
    }

    @Override
    public boolean hasClientReviewedTask(Long clientId, Long taskId) {
        try {
            return reviewRepository.existsByClientIdAndTaskId(clientId, taskId);
        } catch (Exception e) {
            log.error("Error checking if client has reviewed task: client={}, task={}", clientId, taskId, e);
            throw new RuntimeException("Failed to check review status: " + e.getMessage(), e);
        }
    }

    private ReviewDTO convertToDTO(Review review) {
        ReviewDTO dto = modelMapper.map(review, ReviewDTO.class);
        dto.setClientId(review.getClient().getId());
        dto.setClientName(review.getClient().getName());
        dto.setFreelancerId(review.getFreelancer().getId());
        dto.setFreelancerName(review.getFreelancer().getName());
        dto.setTaskId(review.getTask().getId());
        dto.setTaskTitle(review.getTask().getTitle());
        return dto;
    }

}
