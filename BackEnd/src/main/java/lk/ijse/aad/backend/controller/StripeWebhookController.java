package lk.ijse.aad.backend.controller;

import com.stripe.exception.SignatureVerificationException;
import com.stripe.model.Event;
import com.stripe.net.Webhook;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/webhooks")
public class StripeWebhookController {

    @Value("${stripe.webhook.secret}")
    private String endpointSecret; // create webhook in Stripe Dashboard

    @PostMapping("/webhook")
    public ResponseEntity<String> handleStripeEvent(@RequestBody String payload,
                                                    @RequestHeader("Stripe-Signature") String sigHeader) {
        Event event;

        try {
            event = Webhook.constructEvent(payload, sigHeader, endpointSecret);
        } catch (SignatureVerificationException e) {
            return ResponseEntity.badRequest().body("Invalid signature");
        }

        switch (event.getType()) {
            case "checkout.session.completed":
                // Payment successful → update Task as PAID
                System.out.println("✅ Payment successful: " + event.getData().getObject().toJson());
                break;
            case "payment_intent.payment_failed":
                System.out.println("❌ Payment failed: " + event.getData().getObject().toJson());
                break;
        }

        return ResponseEntity.ok("Received");
    }

}
