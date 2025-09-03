package lk.ijse.aad.backend.repository;

import lk.ijse.aad.backend.entity.Role;
import lk.ijse.aad.backend.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {
    List<User> findByRole(Role role);
    Optional<Object> findByEmail(String email);
}
