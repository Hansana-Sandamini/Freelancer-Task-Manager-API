package lk.ijse.aad.backend.service.impl;

import lk.ijse.aad.backend.dto.ProposalDTO;
import lk.ijse.aad.backend.entity.Proposal;
import lk.ijse.aad.backend.entity.ProposalStatus;
import lk.ijse.aad.backend.entity.Task;
import lk.ijse.aad.backend.entity.User;
import lk.ijse.aad.backend.repository.ProposalRepository;
import lk.ijse.aad.backend.repository.TaskRepository;
import lk.ijse.aad.backend.repository.UserRepository;
import lk.ijse.aad.backend.service.ProposalService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.modelmapper.ModelMapper;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class ProposalServiceImpl implements ProposalService {

    private final ProposalRepository proposalRepository;
    private final UserRepository userRepository;
    private final TaskRepository taskRepository;
    private final ModelMapper modelMapper;

    @Override
    public void saveProposal(ProposalDTO proposalDTO) {
        User freelancer = userRepository.findById(proposalDTO.getFreelancer().getId())
                .orElseThrow(() -> new RuntimeException("Freelancer not found"));

        Task task = taskRepository.findById(proposalDTO.getTask().getId())
                .orElseThrow(() -> new RuntimeException("Task not found"));

        Proposal proposal = modelMapper.map(proposalDTO, Proposal.class);
        proposal.setFreelancer(freelancer);
        proposal.setTask(task);
        proposal.setSubmittedAt(LocalDateTime.now());
        proposal.setStatus(ProposalStatus.PENDING);

        proposalRepository.save(proposal);
        log.info("Proposal saved successfully for task: {}", task.getTitle());
    }

    @Override
    public void updateProposal(ProposalDTO proposalDTO) {
        Proposal existingProposal = proposalRepository.findById(proposalDTO.getId())
                .orElseThrow(() -> new RuntimeException("Proposal not found"));

        // Update fields
        existingProposal.setCoverLetter(proposalDTO.getCoverLetter());
        existingProposal.setBidAmount(proposalDTO.getBidAmount());
        existingProposal.setStatus(ProposalStatus.valueOf(proposalDTO.getStatus()));

        proposalRepository.save(existingProposal);
        log.info("Proposal updated successfully: {}", proposalDTO.getId());
    }

    @Override
    public void deleteProposal(String proposalId) {
        Long id = Long.parseLong(proposalId);
        if (!proposalRepository.existsById(id)) {
            throw new RuntimeException("Proposal not found");
        }
        proposalRepository.deleteById(id);
        log.info("Proposal deleted successfully: {}", proposalId);
    }

    @Override
    public List<ProposalDTO> getAllProposals() {
        return proposalRepository.findAll().stream()
                .map(proposal -> modelMapper.map(proposal, ProposalDTO.class))
                .collect(Collectors.toList());
    }

}
