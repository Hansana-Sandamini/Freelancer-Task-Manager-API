package lk.ijse.aad.backend.service;

import com.stripe.model.checkout.Session;
import lk.ijse.aad.backend.dto.PaymentDTO;

import java.util.List;

public interface PaymentService {
    void handleSuccessfulPayment(Session session);
    void savePayment(PaymentDTO paymentDTO);
    List<PaymentDTO> getAllPayments();
    PaymentDTO getPaymentById(Long id);
    List<PaymentDTO> getPaymentsByClientId(Long clientId);
    List<PaymentDTO> getPaymentsByFreelancerId(Long freelancerId);
}
