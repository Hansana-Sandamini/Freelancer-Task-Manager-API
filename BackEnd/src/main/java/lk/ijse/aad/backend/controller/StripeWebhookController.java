package lk.ijse.aad.backend.controller;

import com.stripe.exception.SignatureVerificationException;
import com.stripe.exception.StripeException;
import com.stripe.model.Event;
import com.stripe.model.PaymentIntent;
import com.stripe.model.checkout.Session;
import com.stripe.net.Webhook;
import lk.ijse.aad.backend.service.PaymentService;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/webhooks")
public class StripeWebhookController {

    @Value("${stripe.webhook.secret}")
    private String endpointSecret;

    private final PaymentService paymentService;

    public StripeWebhookController(PaymentService paymentService) {
        this.paymentService = paymentService;
    }

    @PostMapping("/webhook")
    public ResponseEntity<String> handleStripeEvent(@RequestBody String payload,
                                                    @RequestHeader("Stripe-Signature") String sigHeader)
            throws StripeException {
        Event event;

        try {
            event = Webhook.constructEvent(payload, sigHeader, endpointSecret);
        } catch (SignatureVerificationException e) {
            return ResponseEntity.badRequest().body("Invalid signature");
        }

        switch (event.getType()) {
            case "checkout.session.completed":
                // For checkout.session.completed, we need to get the Session object
                Session session = (Session) event.getDataObjectDeserializer()
                        .getObject()
                        .orElseThrow(() -> new RuntimeException("Failed to deserialize session"));

                // Get metadata from the session
                Map<String, String> metadata = session.getMetadata();

                // Retrieve the payment intent from the session
                String paymentIntentId = session.getPaymentIntent();
                PaymentIntent paymentIntent = PaymentIntent.retrieve(paymentIntentId);

                // Call service with both paymentIntent and metadata
                paymentService.handleSuccessfulPayment(paymentIntent, metadata);
                System.out.println("Payment successful: " + session.getId());
                break;

            case "payment_intent.succeeded":
                // For payment_intent.succeeded, get the PaymentIntent directly
                PaymentIntent succeededIntent = (PaymentIntent) event.getDataObjectDeserializer()
                        .getObject()
                        .orElseThrow(() -> new RuntimeException("Failed to deserialize payment intent"));

                // Get metadata from the payment intent itself
                Map<String, String> intentMetadata = succeededIntent.getMetadata();

                paymentService.handleSuccessfulPayment(succeededIntent, intentMetadata);
                System.out.println("Payment intent succeeded: " + succeededIntent.getId());
                break;

            case "payment_intent.payment_failed":
                PaymentIntent failedIntent = (PaymentIntent) event.getDataObjectDeserializer()
                        .getObject()
                        .orElseThrow(() -> new RuntimeException("Failed to deserialize payment intent"));
                System.out.println("Payment failed: " + failedIntent.getId());
                break;
        }

        return ResponseEntity.ok("Received");
    }

}
