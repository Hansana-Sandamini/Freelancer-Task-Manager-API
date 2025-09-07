package lk.ijse.aad.backend.service;

import lk.ijse.aad.backend.dto.ProposalDTO;

import java.util.List;
import java.util.Map;

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
    Map<String, Long> getProposalCounts();
    Map<String, Long> getFreelancerProposalCounts(Long freelancerId);
    Map<String, Long> getTaskProposalCounts(Long taskId);
    double getFreelancerEarnings(Long freelancerId);
    Map<String, Long> getClientProposalCounts(Long clientId);
}
