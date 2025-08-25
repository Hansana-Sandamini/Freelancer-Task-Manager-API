package lk.ijse.aad.backend.controller;

import lk.ijse.aad.backend.dto.ApiResponse;
import lk.ijse.aad.backend.dto.PaymentDTO;
import lk.ijse.aad.backend.service.PaymentService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/payments")
@RequiredArgsConstructor
@CrossOrigin
public class PaymentController {

    private final PaymentService paymentService;

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

}
