package lk.ijse.aad.backend.entity;

import jakarta.persistence.*;
import lombok.*;

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
