package lk.ijse.aad.backend.controller;

import com.stripe.exception.StripeException;
import com.stripe.model.PaymentIntent;
import com.stripe.model.checkout.Session;
import com.stripe.param.checkout.SessionCreateParams;
import lk.ijse.aad.backend.dto.ApiResponse;
import lk.ijse.aad.backend.dto.PaymentDTO;
import lk.ijse.aad.backend.entity.Task;
import lk.ijse.aad.backend.entity.User;
import lk.ijse.aad.backend.repository.TaskRepository;
import lk.ijse.aad.backend.repository.UserRepository;
import lk.ijse.aad.backend.service.PaymentService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

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
            Authentication authentication) throws StripeException {

        try {
            System.out.println("Attempting to create checkout session for taskId: " + taskId);
            Task task = taskRepository.findById(taskId)
                    .orElseThrow(() -> new RuntimeException("Task not found with ID: " + taskId));
            System.out.println("Task found: " + task.getTitle());

            String email = authentication.getName();
            User user = (User) userRepository.findByEmail(email)
                    .orElseThrow(() -> new RuntimeException("User not found with email: " + email));
            Long currentUserId = user.getId();
            System.out.println("Authenticated user ID: " + currentUserId);

            if (!task.getClient().getId().equals(currentUserId)) {
                System.out.println("Permission denied: User does not own task");
                return ResponseEntity.status(403).body(new ApiResponse(
                        403,
                        "You can only create payments for your own tasks",
                        null
                ));
            }

            if (task.getFreelancer() == null) {
                System.out.println("Validation failed: No freelancer assigned");
                return ResponseEntity.badRequest().body(new ApiResponse(
                        400,
                        "No freelancer is assigned to this task",
                        null
                ));
            }

            // Get the amount from the task - FIXED: Check if payment exists
            double amount = 0.0;
            if (task.getPayment() != null) {
                amount = task.getPayment().getAmount();
            } else {
                // Set a default amount or handle appropriately
                amount = 1000.0; // Default amount
            }
            System.out.println("Payment amount: " + amount + " LKR");

            // Validate minimum amount
            double minAmountInLKR = 15;
            if (amount < minAmountInLKR) {
                System.out.println("Validation failed: Amount " + amount + " LKR is below minimum " + minAmountInLKR + " LKR");
                return ResponseEntity.badRequest().body(new ApiResponse(
                        400,
                        "Payment amount must be at least " + minAmountInLKR + " LKR",
                        null
                ));
            }

            // Log metadata
            String taskIdStr = task.getId().toString();
            String clientIdStr = task.getClient().getId().toString();
            String freelancerIdStr = task.getFreelancer().getId().toString();

            // Create the checkout session WITH REQUIRED URLs
            SessionCreateParams params = SessionCreateParams.builder()
                    .addPaymentMethodType(SessionCreateParams.PaymentMethodType.CARD)
                    .setMode(SessionCreateParams.Mode.PAYMENT)
                    .setSuccessUrl("http://localhost:8085/payment-success.html?session_id={CHECKOUT_SESSION_ID}")
                    .setCancelUrl("http://localhost:8085/payment-cancel.html")
                    .addLineItem(
                            SessionCreateParams.LineItem.builder()
                                    .setQuantity(1L)
                                    .setPriceData(
                                            SessionCreateParams.LineItem.PriceData.builder()
                                                    .setCurrency("lkr")
                                                    .setUnitAmount((long) (amount * 100))
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
                    .putMetadata("taskId", taskIdStr)
                    .putMetadata("clientId", clientIdStr)
                    .putMetadata("freelancerId", freelancerIdStr)
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

    @GetMapping("/success")
    public ResponseEntity<ApiResponse> getSuccess(@RequestParam("session_id") String sessionId) throws StripeException {
        try {
            // Retrieve the session from Stripe
            Session session = Session.retrieve(sessionId);

            // Get metadata from the SESSION, not the payment intent
            Map<String, String> metadata = session.getMetadata();
            String taskIdStr = metadata.get("taskId");
            String clientIdStr = metadata.get("clientId");
            String freelancerIdStr = metadata.get("freelancerId");

            if (taskIdStr == null || clientIdStr == null || freelancerIdStr == null) {
                return ResponseEntity.badRequest().body(new ApiResponse(
                        400,
                        "Missing payment metadata",
                        null
                ));
            }

            // Get the payment intent ID from the session
            String paymentIntentId = session.getPaymentIntent();
            if (paymentIntentId == null) {
                return ResponseEntity.badRequest().body(new ApiResponse(
                        400,
                        "No payment intent associated with this session",
                        null
                ));
            }

            // Retrieve the payment intent
            PaymentIntent paymentIntent = PaymentIntent.retrieve(paymentIntentId);

            // Update payment status to HELD via service - pass the metadata
            paymentService.handleSuccessfulPayment(paymentIntent, metadata);

            return ResponseEntity.ok(new ApiResponse(
                    200,
                    "Payment successful",
                    Map.of("sessionId", sessionId)
            ));
        } catch (StripeException e) {
            return ResponseEntity.badRequest().body(new ApiResponse(
                    500,
                    "Failed to process payment success: " + e.getMessage(),
                    null
            ));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(new ApiResponse(
                    500,
                    "Failed to process payment success: " + e.getMessage(),
                    null
            ));
        }
    }

    @GetMapping("/cancel")
    public String cancel(){
        return "payment canceled";
    }


    @PostMapping("/create-payment-intent/{taskId}")
    @PreAuthorize("hasRole('CLIENT')")
    public ResponseEntity<ApiResponse> createPaymentIntent(
            @PathVariable Long taskId,
            Authentication authentication) {
        try {
            Task task = taskRepository.findById(taskId)
                    .orElseThrow(() -> new RuntimeException("Task not found with ID: " + taskId));

            String email = authentication.getName();
            User user = (User) userRepository.findByEmail(email)
                    .orElseThrow(() -> new RuntimeException("User not found with email: " + email));
            Long currentUserId = user.getId();

            if (!task.getClient().getId().equals(currentUserId)) {
                return ResponseEntity.status(403).body(new ApiResponse(403, "You can only create payments for your own tasks", null));
            }

            if (task.getFreelancer() == null) {
                return ResponseEntity.badRequest().body(new ApiResponse(400, "No freelancer is assigned to this task", null));
            }

            double amount = task.getPayment().getAmount();
            double minAmountInLKR = 15; // Approx 50 cents in LKR
            if (amount < minAmountInLKR) {
                return ResponseEntity.badRequest().body(new ApiResponse(400, "Payment amount must be at least " + minAmountInLKR + " LKR", null));
            }

            long amountInCents = (long) (amount * 100);

            Map<String, Object> params = new HashMap<>();
            params.put("amount", amountInCents);
            params.put("currency", "lkr");
            params.put("payment_method_types", new String[]{"card"}); // Allow card payments
            params.put("metadata", Map.of(
                    "taskId", task.getId().toString(),
                    "clientId", task.getClient().getId().toString(),
                    "freelancerId", task.getFreelancer().getId().toString()
            ));

            PaymentIntent paymentIntent = PaymentIntent.create(params);

            // Return client_secret for frontend confirmation
            return ResponseEntity.ok(new ApiResponse(200, "Payment Intent Created", Map.of(
                    "clientSecret", paymentIntent.getClientSecret(),
                    "paymentIntentId", paymentIntent.getId()
            )));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(new ApiResponse(500, "Failed to create payment intent: " + e.getMessage(), null));
        }
    }

    @PostMapping("/confirm-payment")
    public ResponseEntity<ApiResponse> confirmPayment(@RequestBody Map<String, String> request) {
        try {
            String paymentIntentId = request.get("paymentIntentId");
            paymentService.confirmPayment(paymentIntentId);
            return ResponseEntity.ok(new ApiResponse(200, "Payment Confirmed", null));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(new ApiResponse(500, e.getMessage(), null));
        }
    }

    @PutMapping("/release/{taskId}")
    @PreAuthorize("hasRole('FREELANCER')")
    public ResponseEntity<ApiResponse> releasePayment(@PathVariable Long taskId, Authentication authentication) {
        try {
            String email = authentication.getName();
            User user = (User) userRepository.findByEmail(email)
                    .orElseThrow(() -> new RuntimeException("User not found with email: " + email));

            Task task = taskRepository.findById(taskId)
                    .orElseThrow(() -> new RuntimeException("Task not found with ID: " + taskId));

            if (!task.getFreelancer().getId().equals(user.getId())) {
                return ResponseEntity.status(403).body(new ApiResponse(403, "You are not the assigned freelancer for this task", null));
            }

            paymentService.releasePayment(taskId);
            return ResponseEntity.ok(new ApiResponse(200, "Payment released successfully to freelancer", null));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(new ApiResponse(500, "Failed to release payment: " + e.getMessage(), null));
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
