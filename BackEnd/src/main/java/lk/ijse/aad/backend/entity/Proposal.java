package lk.ijse.aad.backend.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class Proposal {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(columnDefinition = "TEXT")
    private String coverLetter;

    @Column(nullable = false)
    private double bidAmount;

    private LocalDateTime submittedAt;

    @Enumerated(EnumType.STRING)
    private ProposalStatus status;  // PENDING, ACCEPTED, REJECTED

    @ManyToOne
    @JoinColumn(name = "freelancer_id", nullable = false)
    private User freelancer;

    @ManyToOne
    @JoinColumn(name = "task_id", nullable = false)
    private Task task;

}
