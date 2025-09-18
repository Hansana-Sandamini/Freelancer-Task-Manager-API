package lk.ijse.aad.backend.controller;

import lk.ijse.aad.backend.dto.ApiResponse;
import lk.ijse.aad.backend.dto.PaymentDTO;
import lk.ijse.aad.backend.entity.Task;
import lk.ijse.aad.backend.entity.User;
import lk.ijse.aad.backend.repository.TaskRepository;
import lk.ijse.aad.backend.repository.UserRepository;
import lk.ijse.aad.backend.service.PaymentService;
import com.stripe.model.checkout.Session;
import com.stripe.param.checkout.SessionCreateParams;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/payments")
@RequiredArgsConstructor
@CrossOrigin
public class PaymentController {

    private final PaymentService paymentService;
    private final TaskRepository taskRepository;
    private final UserRepository userRepository;

    @PostMapping("/create-checkout-session/{taskId}")
    @PreAuthorize("hasRole('CLIENT')")
    public ResponseEntity<ApiResponse> createCheckoutSession(
            @PathVariable Long taskId,
            Authentication authentication) {

        try {
            // 1. Fetch the task
            Task task = taskRepository.findById(taskId)
                    .orElseThrow(() -> new RuntimeException("Task not found with ID: " + taskId));

            // 2. Get the user ID by querying the database with the email
            String email = authentication.getName();
            User user = (User) userRepository.findByEmail(email)
                    .orElseThrow(() -> new RuntimeException("User not found with email: " + email));
            Long currentUserId = user.getId();

            // 3. Verify the authenticated user owns this task
            if (!task.getClient().getId().equals(currentUserId)) {
                return ResponseEntity.status(403).body(new ApiResponse(
                        403,
                        "You can only create payments for your own tasks",
                        null
                ));
            }

            // 4. Verify the task has a freelancer assigned
            if (task.getFreelancer() == null) {
                return ResponseEntity.badRequest().body(new ApiResponse(
                        400,
                        "No freelancer is assigned to this task",
                        null
                ));
            }

            // 5. Get the amount from the task
            double amount = task.getPayment().getAmount();

            // 6. Create the checkout session
            SessionCreateParams params = SessionCreateParams.builder()
                    .addPaymentMethodType(SessionCreateParams.PaymentMethodType.CARD)
                    .setMode(SessionCreateParams.Mode.PAYMENT)
//                    .setSuccessUrl("http://localhost:3000/payment-success?session_id={CHECKOUT_SESSION_ID}")
//                    .setCancelUrl("http://localhost:3000/payment-cancel")

                    .setSuccessUrl("http://localhost:8085/FrontEnd/pages/tasks.html?session_id={CHECKOUT_SESSION_ID}")  // CHANGED: Redirect to tasks.html with session_id
                    .setCancelUrl("http://localhost:8085/FrontEnd/pages/tasks.html?cancel=1")  // CHANGED: Redirect to tasks on cancel

                    .addLineItem(
                            SessionCreateParams.LineItem.builder()
                                    .setQuantity(1L)
                                    .setPriceData(
                                            SessionCreateParams.LineItem.PriceData.builder()
                                                    .setCurrency("usd")
                                                    .setUnitAmount((long) (amount * 100)) // dollars → cents
                                                    .setProductData(
                                                            SessionCreateParams.LineItem.PriceData.ProductData.builder()
                                                                    .setName(task.getTitle())
                                                                    .setDescription(task.getDescription())
                                                                    .build()
                                                    )
                                                    .build()
                                    )
                                    .build()
                    )
                    .putMetadata("taskId", task.getId().toString())
                    .putMetadata("clientId", task.getClient().getId().toString())
                    .putMetadata("freelancerId", task.getFreelancer().getId().toString())
                    .build();

            Session session = Session.create(params);

            return ResponseEntity.ok(new ApiResponse(
                    200,
                    "Checkout Session Created",
                    session.getId()
            ));

        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.badRequest().body(new ApiResponse(
                    500,
                    "Failed to create checkout session: " + e.getMessage(),
                    null
            ));
        }
    }

    @GetMapping("/task/{taskId}")
    @PreAuthorize("hasAnyRole('CLIENT', 'FREELANCER', 'ADMIN')")
    public ResponseEntity<ApiResponse> getPaymentByTaskId(@PathVariable Long taskId) {
        try {
            PaymentDTO payment = paymentService.getPaymentByTaskId(taskId);
            return ResponseEntity.ok(new ApiResponse(
                    200,
                    "Payment Retrieved Successfully",
                    payment
            ));
        } catch (RuntimeException e) {
            return ResponseEntity.ok(new ApiResponse(
                    404,
                    "No payment found for this task",
                    null
            ));
        }
    }

    @PostMapping
    @PreAuthorize("hasRole('CLIENT')")
    public ResponseEntity<ApiResponse> createPayment(@RequestBody PaymentDTO paymentDTO) {
        paymentService.savePayment(paymentDTO);
        return ResponseEntity.ok(new ApiResponse(
                201,
                "Payment Created Successfully",
                null
        ));
    }

    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse> getAllPayments() {
        List<PaymentDTO> payments = paymentService.getAllPayments();
        return ResponseEntity.ok(new ApiResponse(
                200,
                "Payments Retrieved Successfully",
                payments
        ));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('CLIENT', 'FREELANCER', 'ADMIN')")
    public ResponseEntity<ApiResponse> getPaymentById(@PathVariable Long id) {
        PaymentDTO payment = paymentService.getPaymentById(id);
        return ResponseEntity.ok(new ApiResponse(
                200,
                "Payment Retrieved Successfully",
                payment
        ));
    }

    @GetMapping("/client/{clientId}")
    @PreAuthorize("hasAnyRole('CLIENT', 'ADMIN')")
    public ResponseEntity<ApiResponse> getPaymentsByClient(@PathVariable Long clientId) {
        List<PaymentDTO> payments = paymentService.getPaymentsByClientId(clientId);
        return ResponseEntity.ok(new ApiResponse(
                200,
                "Client Payments Retrieved Successfully",
                payments
        ));
    }

    @GetMapping("/freelancer/{freelancerId}")
    @PreAuthorize("hasAnyRole('FREELANCER', 'ADMIN')")
    public ResponseEntity<ApiResponse> getPaymentsByFreelancer(@PathVariable Long freelancerId) {
        List<PaymentDTO> payments = paymentService.getPaymentsByFreelancerId(freelancerId);
        return ResponseEntity.ok(new ApiResponse(
                200,
                "Freelancer Payments Retrieved Successfully",
                payments
        ));
    }

    @GetMapping("/total-revenue")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse> getTotalRevenue() {
        Double totalRevenue = paymentService.getTotalRevenue();
        return ResponseEntity.ok(new ApiResponse(
                200,
                "Total Revenue Retrieved Successfully",
                totalRevenue
        ));
    }

}
