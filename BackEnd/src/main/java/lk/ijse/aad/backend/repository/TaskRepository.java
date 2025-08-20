package lk.ijse.aad.backend.repository;

import lk.ijse.aad.backend.entity.Task;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface TaskRepository extends JpaRepository<Task, Long> {
    List<Task> findByClientId(Long clientId);
    List<Task> findByFreelancerId(Long freelancerId);
    List<Task> findByStatus(String status);
    Optional<Task> findById(Long id);
    long countByTaskCategoryId(Long categoryId);
}
