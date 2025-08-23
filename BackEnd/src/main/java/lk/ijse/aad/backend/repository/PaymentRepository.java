package lk.ijse.aad.backend.repository;

import lk.ijse.aad.backend.entity.Payment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface PaymentRepository extends JpaRepository<Payment, Long> {
    List<Payment> findByClientId(Long clientId);
    List<Payment> findByFreelancerId(Long freelancerId);
}
