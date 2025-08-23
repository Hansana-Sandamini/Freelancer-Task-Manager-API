package lk.ijse.aad.backend.repository;

import lk.ijse.aad.backend.entity.Review;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ReviewRepository extends JpaRepository<Review,Long> {
    List<Review> findByFreelancerId(Long freelancerId);
    List<Review> findByTaskId(Long taskId);
}
