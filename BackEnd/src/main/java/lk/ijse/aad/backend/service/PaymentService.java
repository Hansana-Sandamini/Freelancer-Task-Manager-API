package lk.ijse.aad.backend.service;

import com.stripe.model.PaymentIntent;
import lk.ijse.aad.backend.dto.PaymentDTO;

import java.util.List;
import java.util.Map;

public interface PaymentService {
    void savePayment(PaymentDTO paymentDTO);
    List<PaymentDTO> getAllPayments();
    PaymentDTO getPaymentById(Long id);
    List<PaymentDTO> getPaymentsByClientId(Long clientId);
    List<PaymentDTO> getPaymentsByFreelancerId(Long freelancerId);
    PaymentDTO getPaymentByTaskId(Long taskId);
    Double getTotalRevenue();
    void releasePayment(Long taskId);
    void confirmPayment(String paymentIntentId);
    void handleSuccessfulPayment(PaymentIntent paymentIntent, Map<String, String> metadata);
}
