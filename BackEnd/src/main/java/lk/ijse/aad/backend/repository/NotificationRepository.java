package lk.ijse.aad.backend.repository;

import lk.ijse.aad.backend.entity.Notification;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface NotificationRepository extends JpaRepository<Notification,Long> {
    List<Notification> findByUserId(Long userId);
    List<Notification> findByUserIdAndIsReadFalse(Long userId);
}
