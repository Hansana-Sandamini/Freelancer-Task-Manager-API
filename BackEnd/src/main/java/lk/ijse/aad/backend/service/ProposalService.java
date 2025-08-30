package lk.ijse.aad.backend.service;

import lk.ijse.aad.backend.dto.ProposalDTO;

import java.util.List;

public interface ProposalService {
    void saveProposal(ProposalDTO proposalDTO);
    void updateProposal(ProposalDTO proposalDTO);
    void deleteProposal(String proposalId);
    List<ProposalDTO> getAllProposals();
    ProposalDTO getProposalById(Long id);
    List<ProposalDTO> getProposalsByTaskId(Long taskId);
    List<ProposalDTO> getProposalsByFreelancerId(Long freelancerId);
    List<ProposalDTO> getProposalsByClientId(Long clientId);
    void acceptProposal(Long proposalId);
    void rejectProposal(Long proposalId);
}
