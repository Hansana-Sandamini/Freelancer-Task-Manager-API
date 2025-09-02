package lk.ijse.aad.backend.repository;

import lk.ijse.aad.backend.entity.Proposal;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ProposalRepository extends JpaRepository<Proposal,Long> {
    @Query("SELECT p FROM Proposal p JOIN FETCH p.freelancer JOIN FETCH p.task WHERE p.id = :id")
    Optional<Proposal> findByIdWithFreelancerAndTask(@Param("id") Long id);
    List<Proposal> findByTaskId(Long taskId);
    List<Proposal> findByFreelancerId(Long freelancerId);
    Optional<Proposal> findById(Long id);
    List<Proposal> findByTaskClientId(Long clientId);
}
