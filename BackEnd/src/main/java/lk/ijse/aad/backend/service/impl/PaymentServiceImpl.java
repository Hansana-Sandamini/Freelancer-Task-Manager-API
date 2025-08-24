package lk.ijse.aad.backend.service.impl;

import lk.ijse.aad.backend.dto.PaymentDTO;
import lk.ijse.aad.backend.entity.Payment;
import lk.ijse.aad.backend.entity.PaymentStatus;
import lk.ijse.aad.backend.entity.Task;
import lk.ijse.aad.backend.entity.User;
import lk.ijse.aad.backend.repository.PaymentRepository;
import lk.ijse.aad.backend.repository.TaskRepository;
import lk.ijse.aad.backend.repository.UserRepository;
import lk.ijse.aad.backend.service.PaymentService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.modelmapper.ModelMapper;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class PaymentServiceImpl implements PaymentService {

    private final PaymentRepository paymentRepository;
    private final TaskRepository taskRepository;
    private final UserRepository userRepository;
    private final ModelMapper modelMapper;

    @Override
    public void savePayment(PaymentDTO paymentDTO) {
        try {
            User client = userRepository.findById(paymentDTO.getClientId())
                    .orElseThrow(() -> new RuntimeException("Client not found with ID: " + paymentDTO.getClientId()));

            User freelancer = userRepository.findById(paymentDTO.getFreelancerId())
                    .orElseThrow(() -> new RuntimeException("Freelancer not found with ID: " + paymentDTO.getFreelancerId()));

            Task task = taskRepository.findById(paymentDTO.getTaskId())
                    .orElseThrow(() -> new RuntimeException("Task not found with ID: " + paymentDTO.getTaskId()));

            Payment payment = modelMapper.map(paymentDTO, Payment.class);
            payment.setClient(client);
            payment.setFreelancer(freelancer);
            payment.setTask(task);
            payment.setPaymentDate(LocalDate.from(LocalDateTime.now()));
            payment.setStatus(PaymentStatus.COMPLETED);

            paymentRepository.save(payment);
            log.info("Payment saved successfully for task: {}", task.getTitle());

        } catch (Exception e) {
            log.error("Error while saving payment for task: {}", paymentDTO.getTaskId(), e);
            throw new RuntimeException("Failed to save payment: " + e.getMessage(), e);
        }
    }

    @Override
    public List<PaymentDTO> getAllPayments() {
        try {
            return paymentRepository.findAll().stream()
                    .map(this::convertToDTO)
                    .collect(Collectors.toList());
        } catch (Exception e) {
            log.error("Error while retrieving all payments", e);
            throw new RuntimeException("Failed to retrieve payments: " + e.getMessage(), e);
        }
    }

    @Override
    public PaymentDTO getPaymentById(Long id) {
        try {
            Payment payment = paymentRepository.findById(id)
                    .orElseThrow(() -> new RuntimeException("Payment not found with ID: " + id));
            return convertToDTO(payment);
        } catch (Exception e) {
            log.error("Error while retrieving payment: {}", id, e);
            throw new RuntimeException("Failed to retrieve payment: " + e.getMessage(), e);
        }
    }

    @Override
    public List<PaymentDTO> getPaymentsByClientId(Long clientId) {
        try {
            return paymentRepository.findByClientId(clientId).stream()
                    .map(this::convertToDTO)
                    .collect(Collectors.toList());
        } catch (Exception e) {
            log.error("Error while retrieving payments for client: {}", clientId, e);
            throw new RuntimeException("Failed to retrieve client payments: " + e.getMessage(), e);
        }
    }

    @Override
    public List<PaymentDTO> getPaymentsByFreelancerId(Long freelancerId) {
        try {
            return paymentRepository.findByFreelancerId(freelancerId).stream()
                    .map(this::convertToDTO)
                    .collect(Collectors.toList());
        } catch (Exception e) {
            log.error("Error while retrieving payments for freelancer: {}", freelancerId, e);
            throw new RuntimeException("Failed to retrieve freelancer payments: " + e.getMessage(), e);
        }
    }

    private PaymentDTO convertToDTO(Payment payment) {
        PaymentDTO dto = modelMapper.map(payment, PaymentDTO.class);
        dto.setClientId(payment.getClient().getId());
        dto.setClientName(payment.getClient().getName());
        dto.setFreelancerId(payment.getFreelancer().getId());
        dto.setFreelancerName(payment.getFreelancer().getName());
        dto.setTaskId(payment.getTask().getId());
        dto.setTaskTitle(payment.getTask().getTitle());
        dto.setPaymentStatus(payment.getStatus().name());
        return dto;
    }

}
