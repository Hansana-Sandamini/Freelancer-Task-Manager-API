package lk.ijse.aad.backend.service.impl;

import com.stripe.model.PaymentIntent;
import lk.ijse.aad.backend.dto.PaymentDTO;
import lk.ijse.aad.backend.entity.*;
import lk.ijse.aad.backend.repository.PaymentRepository;
import lk.ijse.aad.backend.repository.TaskRepository;
import lk.ijse.aad.backend.repository.AuthRepository;
import lk.ijse.aad.backend.service.EmailService;
import lk.ijse.aad.backend.service.NotificationService;
import lk.ijse.aad.backend.service.PaymentService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.modelmapper.ModelMapper;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class PaymentServiceImpl implements PaymentService {

    private final PaymentRepository paymentRepository;
    private final TaskRepository taskRepository;
    private final AuthRepository authRepository;
    private final ModelMapper modelMapper;
    private final NotificationService notificationService;
    private final EmailService emailService;

    @Override
    public void handleSuccessfulPayment(PaymentIntent paymentIntent, Map<String, String> metadata) {
        try {
            log.info("Processing PaymentIntent with ID: {}, Metadata from session: {}",
                    paymentIntent.getId(), metadata);

            // Use metadata passed from the session
            String taskIdStr = metadata.get("taskId");
            String clientIdStr = metadata.get("clientId");
            String freelancerIdStr = metadata.get("freelancerId");

            log.info("Using metadata - taskId: {}, clientId: {}, freelancerId: {}",
                    taskIdStr, clientIdStr, freelancerIdStr);

            if (taskIdStr == null || clientIdStr == null || freelancerIdStr == null) {
                log.error("Missing metadata: taskId={}, clientId={}, freelancerId={}",
                        taskIdStr, clientIdStr, freelancerIdStr);
                throw new IllegalArgumentException("Missing metadata: taskId, clientId, or freelancerId is null");
            }

            Long taskId;
            Long clientId;
            Long freelancerId;
            try {
                taskId = Long.valueOf(taskIdStr);
                clientId = Long.valueOf(clientIdStr);
                freelancerId = Long.valueOf(freelancerIdStr);
            } catch (NumberFormatException e) {
                log.error("Invalid metadata format in PaymentIntent {}: taskId={}, clientId={}, freelancerId={}",
                        paymentIntent.getId(), taskIdStr, clientIdStr, freelancerIdStr, e);
                throw new IllegalArgumentException("Invalid metadata format: taskId, clientId, or freelancerId", e);
            }

            // Check if payment already exists for this task
            Optional<Payment> existingPayment = paymentRepository.findByTaskId(taskId);
            if (existingPayment.isPresent()) {
                // Update existing payment instead of creating new one
                Payment payment = existingPayment.get();
                payment.setStripeSessionId(paymentIntent.getId());
                payment.setAmount(paymentIntent.getAmount() / 100.0);
                payment.setCurrency(paymentIntent.getCurrency());
                payment.setPaymentDate(LocalDate.now());
                payment.setStatus(PaymentStatus.HELD);

                paymentRepository.save(payment);
                log.info("Payment updated successfully for task: {}", taskId);
            } else {
                // Create new payment
                Task task = taskRepository.findById(taskId)
                        .orElseThrow(() -> new RuntimeException("Task not found with ID: " + taskId));
                User client = authRepository.findById(clientId)
                        .orElseThrow(() -> new RuntimeException("Client not found with ID: " + clientId));
                User freelancer = authRepository.findById(freelancerId)
                        .orElseThrow(() -> new RuntimeException("Freelancer not found with ID: " + freelancerId));

                Payment payment = Payment.builder()
                        .stripeSessionId(paymentIntent.getId())
                        .amount(paymentIntent.getAmount() / 100.0)
                        .currency(paymentIntent.getCurrency())
                        .paymentDate(LocalDate.now())
                        .status(PaymentStatus.HELD)
                        .task(task)
                        .client(client)
                        .freelancer(freelancer)
                        .build();

                paymentRepository.save(payment);

                // Send notifications and emails
                sendPaymentNotifications(payment, "HELD");

                log.info("Payment created successfully for task: {}", task.getTitle());
            }

        } catch (Exception e) {
            log.error("Error while processing Stripe payment for PaymentIntent {}: {}",
                    paymentIntent.getId(), e.getMessage(), e);
            throw new RuntimeException("Failed to process Stripe payment: " + e.getMessage(), e);
        }
    }

    @Override
    public void confirmPayment(String paymentIntentId) {
        try {
            PaymentIntent intent = PaymentIntent.retrieve(paymentIntentId);
            if ("succeeded".equals(intent.getStatus())) {
                Long taskId = Long.valueOf(intent.getMetadata().get("taskId"));
                Payment payment = Payment.builder()
                        .stripeSessionId(intent.getId())
                        .amount(intent.getAmount() / 100.0)
                        .currency(intent.getCurrency())
                        .paymentDate(LocalDate.now())
                        .status(PaymentStatus.HELD)
                        .task(taskRepository.findById(taskId).orElseThrow())
                        .client(authRepository.findById(Long.valueOf(intent.getMetadata().get("clientId"))).orElseThrow())
                        .freelancer(authRepository.findById(Long.valueOf(intent.getMetadata().get("freelancerId"))).orElseThrow())
                        .build();
                paymentRepository.save(payment);
                log.info("Payment confirmed and held for task: {}", taskId);
            } else {
                throw new RuntimeException("Payment not succeeded, status: " + intent.getStatus());
            }
        } catch (Exception e) {
            log.error("Error confirming payment", e);
            throw new RuntimeException("Failed to confirm payment: " + e.getMessage(), e);
        }
    }

    @Override
    public void releasePayment(Long taskId) {
        Payment payment = paymentRepository.findByTaskId(taskId)
                .orElseThrow(() -> new RuntimeException("Payment not found for task ID: " + taskId));

        if (payment.getStatus() != PaymentStatus.HELD) {
            throw new RuntimeException("Payment is not in held status. Cannot release.");
        }

        payment.setStatus(PaymentStatus.COMPLETED);
        paymentRepository.save(payment);

        // Send notifications and emails for released payment
        sendPaymentNotifications(payment, "RELEASED");

        log.info("Payment released (transferred to freelancer) for task ID: {}", taskId);
    }

    @Override
    public void savePayment(PaymentDTO paymentDTO) {
        try {
            User client = authRepository.findById(paymentDTO.getClientId())
                    .orElseThrow(() -> new RuntimeException("Client not found with ID: " + paymentDTO.getClientId()));

            User freelancer = authRepository.findById(paymentDTO.getFreelancerId())
                    .orElseThrow(() -> new RuntimeException("Freelancer not found with ID: " + paymentDTO.getFreelancerId()));

            Task task = taskRepository.findById(paymentDTO.getTaskId())
                    .orElseThrow(() -> new RuntimeException("Task not found with ID: " + paymentDTO.getTaskId()));

            Payment payment = Payment.builder()
                    .amount(paymentDTO.getAmount())
                    .paymentDate(LocalDate.now())
                    .status(PaymentStatus.COMPLETED)
                    .client(client)
                    .freelancer(freelancer)
                    .task(task)
                    .build();

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

    @Override
    public PaymentDTO getPaymentByTaskId(Long taskId) {
        try {
            Payment payment = paymentRepository.findByTaskId(taskId)
                    .orElseThrow(() -> new RuntimeException("No payment found for task ID: " + taskId));
            return convertToDTO(payment);
        } catch (Exception e) {
            log.error("Error while retrieving payment for task: {}", taskId, e);
            throw new RuntimeException("Failed to retrieve payment for task: " + e.getMessage(), e);
        }
    }

    @Override
    public Double getTotalRevenue() {
        try {
            return paymentRepository.findAll().stream()
                    .filter(payment -> payment.getStatus() == PaymentStatus.COMPLETED)
                    .mapToDouble(Payment::getAmount)
                    .sum();
        } catch (Exception e) {
            log.error("Error while calculating total revenue", e);
            throw new RuntimeException("Failed to calculate total revenue: " + e.getMessage(), e);
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
        dto.setStripeSessionId(payment.getStripeSessionId());
        dto.setCurrency(payment.getCurrency());
        return dto;
    }

    private void sendPaymentNotifications(Payment payment, String paymentEvent) {
        try {
            Task task = payment.getTask();
            User client = payment.getClient();
            User freelancer = payment.getFreelancer();

            if ("HELD".equals(paymentEvent)) {
                // Notify client about successful payment
                String clientMessage = String.format(
                        "Payment of %.2f %s for task '%s' has been received and is being held.",
                        payment.getAmount(), payment.getCurrency(), task.getTitle()
                );

                notificationService.createAndSendNotification(
                        client.getId(),
                        clientMessage,
                        NotificationType.PAYMENT_RECEIVED,
                        task.getId(),
                        task.getTitle()
                );

                // Notify freelancer about payment received (held)
                String freelancerMessage = String.format(
                        "Payment of %.2f %s for task '%s' has been received and will be released upon completion.",
                        payment.getAmount(), payment.getCurrency(), task.getTitle()
                );

                notificationService.createAndSendNotification(
                        freelancer.getId(),
                        freelancerMessage,
                        NotificationType.PAYMENT_RECEIVED,
                        task.getId(),
                        task.getTitle()
                );

                // Send emails
                sendPaymentEmail(client, "Payment Received - Held",
                        String.format("""
                    <h2>Payment Received Successfully</h2>
                    <p>Your payment of <b>%.2f %s</b> for the task <b>%s</b> has been received successfully.</p>
                    <p>The payment is currently being held and will be released to the freelancer upon task completion.</p>
                    <p>Thank you for using TaskFlow!</p>
                    """, payment.getAmount(), payment.getCurrency(), task.getTitle()));

                sendPaymentEmail(freelancer, "Payment Received - Awaiting Release",
                        String.format("""
                    <h2>Payment Received</h2>
                    <p>A payment of <b>%.2f %s</b> for the task <b>%s</b> has been received from the client.</p>
                    <p>The payment is currently being held and will be released to you upon successful completion of the task.</p>
                    <p>Best regards,<br>The TaskFlow Team</p>
                    """, payment.getAmount(), payment.getCurrency(), task.getTitle()));

            } else if ("RELEASED".equals(paymentEvent)) {
                // Notify freelancer about released payment
                String freelancerMessage = String.format(
                        "Payment of %.2f %s for task '%s' has been released to your account!",
                        payment.getAmount(), payment.getCurrency(), task.getTitle()
                );

                notificationService.createAndSendNotification(
                        freelancer.getId(),
                        freelancerMessage,
                        NotificationType.PAYMENT_RELEASED,
                        task.getId(),
                        task.getTitle()
                );

                // Notify client about payment release
                String clientMessage = String.format(
                        "Payment of %.2f %s for task '%s' has been released to the freelancer.",
                        payment.getAmount(), payment.getCurrency(), task.getTitle()
                );

                notificationService.createAndSendNotification(
                        client.getId(),
                        clientMessage,
                        NotificationType.PAYMENT_RELEASED,
                        task.getId(),
                        task.getTitle()
                );

                // Send emails
                sendPaymentEmail(freelancer, "Payment Released!",
                        String.format("""
                    <h2>💰 Payment Released!</h2>
                    <p>Great news! Your payment of <b>%.2f %s</b> for the task <b>%s</b> has been released to your account.</p>
                    <p>The funds should be available in your account shortly.</p>
                    <p>Thank you for your great work!</p>
                    <p>Best regards,<br>The TaskFlow Team</p>
                    """, payment.getAmount(), payment.getCurrency(), task.getTitle()));

                sendPaymentEmail(client, "Payment Released to Freelancer",
                        String.format("""
                    <h2>Payment Released</h2>
                    <p>The payment of <b>%.2f %s</b> for the task <b>%s</b> has been successfully released to the freelancer.</p>
                    <p>Thank you for using TaskFlow for your project!</p>
                    <p>Best regards,<br>The TaskFlow Team</p>
                    """, payment.getAmount(), payment.getCurrency(), task.getTitle()));
            }

        } catch (Exception e) {
            log.error("Error sending payment notifications for payment ID: {}", payment.getId(), e);
        }
    }

    @Async
    protected void sendPaymentEmail(User user, String subject, String htmlContent) {
        try {
            emailService.sendEmail(user.getEmail(), subject, htmlContent);
            log.info("Payment email sent to: {}", user.getEmail());
        } catch (Exception e) {
            log.error("Failed to send payment email to: {}", user.getEmail(), e);
        }
    }

}
