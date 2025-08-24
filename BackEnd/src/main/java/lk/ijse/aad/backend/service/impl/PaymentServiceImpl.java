package lk.ijse.aad.backend.service.impl;

import lk.ijse.aad.backend.dto.PaymentDTO;
import lk.ijse.aad.backend.service.PaymentService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class PaymentServiceImpl implements PaymentService {

    @Override
    public void savePayment(PaymentDTO paymentDTO) {

    }

    @Override
    public List<PaymentDTO> getAllPayments() {
        return List.of();
    }

    @Override
    public PaymentDTO getPaymentById(Long id) {
        return null;
    }

    @Override
    public List<PaymentDTO> getPaymentsByClientId(Long clientId) {
        return List.of();
    }

    @Override
    public List<PaymentDTO> getPaymentsByFreelancerId(Long freelancerId) {
        return List.of();
    }

}
