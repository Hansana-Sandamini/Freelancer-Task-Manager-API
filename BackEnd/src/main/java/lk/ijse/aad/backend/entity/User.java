package lk.ijse.aad.backend.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;
import java.util.List;

@Entity
@Table(name = "user")
@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(unique = true, nullable = false)
    private String email;

    @Column(nullable = false)
    private String password;

    @Column(nullable = false)
    private String name;

    @Enumerated(EnumType.STRING)
    private Role role;  // ADMIN, FREELANCER, CLIENT

    @Column(name = "profile_image")
    private String profileImage;

    @Column(name = "verification_code")
    private String verificationCode;

    @Column(name = "code_expires_at")
    private LocalDateTime codeExpiresAt;

    @Column(columnDefinition = "TEXT")
    private String bio;

    private String company;

    @Column(columnDefinition = "TEXT")
    private String skills;

    @OneToMany(mappedBy = "client")
    private List<Payment> paymentsMade;

    @OneToMany(mappedBy = "freelancer")
    private List<Payment> paymentsReceived;

    @OneToMany(mappedBy = "client")
    private List<Review> reviewsGiven;

    @OneToMany(mappedBy = "freelancer")
    private List<Review> reviewsReceived;

    @OneToMany(mappedBy = "user")
    private List<Notification> notifications;

}
