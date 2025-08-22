package lk.ijse.aad.backend.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;
import java.util.List;

@Entity
@Table(name = "task")
@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class Task {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String title;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Enumerated(EnumType.STRING)
    private TaskStatus status;  // OPEN, IN_PROGRESS, COMPLETED

    private LocalDate deadline;

    @ManyToOne
    @JoinColumn(name = "task_category_id", nullable = false)
    private TaskCategory taskCategory;

    @OneToMany(mappedBy = "task", cascade = CascadeType.ALL)
    private List<Proposal> proposals;

    @ManyToOne
    @JoinColumn(name = "client_id", nullable = false)
    private User client;

    @ManyToOne
    @JoinColumn(name = "freelancer_id")
    private User freelancer;

    @OneToOne(mappedBy = "task")
    private Payment payment;

}
