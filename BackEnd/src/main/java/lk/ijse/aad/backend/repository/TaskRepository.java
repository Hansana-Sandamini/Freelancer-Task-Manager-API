package lk.ijse.aad.backend.repository;

import lk.ijse.aad.backend.entity.Task;
import lk.ijse.aad.backend.entity.TaskStatus;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface TaskRepository extends JpaRepository<Task, Long> {
    @EntityGraph(attributePaths = {"client", "freelancer", "taskCategory"})
    Optional<Task> findById(Long id);

    @EntityGraph(attributePaths = {"freelancer"})
    @Query("SELECT t FROM Task t WHERE t.id = :id")
    Optional<Task> findByIdWithFreelancer(@Param("id") Long id);

    List<Task> findByClientId(Long clientId);
    List<Task> findByStatus(String status);
    long countByTaskCategoryId(Long categoryId);

    Long countByStatus(TaskStatus status);

    @Query("SELECT t FROM Task t WHERE t.freelancer.id = :freelancerId")
    List<Task> findByFreelancerId(@Param("freelancerId") Long freelancerId);
}
