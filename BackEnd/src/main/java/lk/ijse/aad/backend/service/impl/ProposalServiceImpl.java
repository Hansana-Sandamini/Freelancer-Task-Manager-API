package lk.ijse.aad.backend.service.impl;

import lk.ijse.aad.backend.dto.ProposalDTO;
import lk.ijse.aad.backend.entity.*;
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
        try {
            User freelancer = userRepository.findById(proposalDTO.getFreelancerId())
                    .orElseThrow(() -> new RuntimeException("Freelancer not found with ID: " + proposalDTO.getFreelancerId()));

            Task task = taskRepository.findById(proposalDTO.getTaskId())
                    .orElseThrow(() -> new RuntimeException("Task not found with ID: " + proposalDTO.getTaskId()));

            Proposal proposal = modelMapper.map(proposalDTO, Proposal.class);
            proposal.setCoverLetter(proposalDTO.getCoverLetter());
            proposal.setBidAmount(proposalDTO.getBidAmount());
            proposal.setSubmittedAt(LocalDateTime.now());
            proposal.setStatus(ProposalStatus.PENDING);
            proposal.setFreelancer(freelancer);
            proposal.setTask(task);

            proposalRepository.save(proposal);
            log.info("Proposal saved successfully for task: {}", task.getTitle());

        } catch (Exception e) {
            log.error("Error while saving task: {}", proposalDTO.getTaskId(), e);
            throw new RuntimeException("Failed to save proposal: " + e.getMessage(), e);
        }
    }

    @Override
    public void updateProposal(ProposalDTO proposalDTO) {
        try {
            Proposal proposal = proposalRepository.findById(proposalDTO.getId())
                    .orElseThrow(() -> new RuntimeException("Proposal not found with ID: " + proposalDTO.getId()));

            proposal.setCoverLetter(proposalDTO.getCoverLetter());
            proposal.setBidAmount(proposalDTO.getBidAmount());

            if (proposalDTO.getStatus() != null) {
                proposal.setStatus(ProposalStatus.valueOf(proposalDTO.getStatus()));
            }

            proposalRepository.save(proposal);
            log.info("Proposal updated successfully: {}", proposalDTO.getId());

        } catch (Exception e) {
            log.error("Error while updating proposal: {}", proposalDTO.getId(), e);
            throw new RuntimeException("Failed to update proposal: " + e.getMessage(), e);
        }
    }

    @Override
    public void deleteProposal(String proposalId) {
        try {
            Long id = Long.parseLong(proposalId);
            if (!proposalRepository.existsById(id)) {
                throw new RuntimeException("Proposal not found with ID: " + proposalId);
            }
            proposalRepository.deleteById(id);
            log.info("Proposal deleted successfully: {}", proposalId);

        } catch (Exception e) {
            log.error("Error while deleting proposal: {}", proposalId, e);
            throw new RuntimeException("Failed to delete proposal: " + e.getMessage(), e);
        }
    }

    @Override
    public List<ProposalDTO> getAllProposals() {
        return proposalRepository.findAll().stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    @Override
    public ProposalDTO getProposalById(Long id) {
        Proposal proposal = proposalRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Proposal not found with ID: " + id));
        return convertToDTO(proposal);
    }

    @Override
    public List<ProposalDTO> getProposalsByTaskId(Long taskId) {
        return proposalRepository.findByTaskId(taskId).stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    @Override
    public List<ProposalDTO> getProposalsByFreelancerId(Long freelancerId) {
        return proposalRepository.findByFreelancerId(freelancerId).stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    private ProposalDTO convertToDTO(Proposal proposal) {
        ProposalDTO dto = new ProposalDTO();
        dto.setId(proposal.getId());
        dto.setCoverLetter(proposal.getCoverLetter());
        dto.setBidAmount(proposal.getBidAmount());
        dto.setSubmittedAt(proposal.getSubmittedAt());
        dto.setStatus(proposal.getStatus().name());
        dto.setFreelancerId(proposal.getFreelancer().getId());
        dto.setFreelancerName(proposal.getFreelancer().getName());
        dto.setTaskId(proposal.getTask().getId());
        dto.setTaskTitle(proposal.getTask().getTitle());
        return dto;
    }

}
