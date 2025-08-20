package lk.ijse.aad.backend.repository;

import lk.ijse.aad.backend.entity.TaskCategory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface TaskCategoryRepository extends JpaRepository<TaskCategory,Long> {
    Optional<TaskCategory> findByName(String name);
    boolean existsByName(String name);
    boolean existsById(Long id);
}
