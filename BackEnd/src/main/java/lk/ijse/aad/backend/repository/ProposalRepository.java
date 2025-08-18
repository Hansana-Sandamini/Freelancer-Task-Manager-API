package lk.ijse.aad.backend.repository;

import lk.ijse.aad.backend.entity.Proposal;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface ProposalRepository extends JpaRepository<Proposal,Long> {
}
