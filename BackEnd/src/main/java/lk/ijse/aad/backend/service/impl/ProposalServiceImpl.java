package lk.ijse.aad.backend.service.impl;

import lk.ijse.aad.backend.dto.ProposalDTO;
import lk.ijse.aad.backend.entity.*;
import lk.ijse.aad.backend.repository.ProposalRepository;
import lk.ijse.aad.backend.repository.TaskRepository;
import lk.ijse.aad.backend.repository.AuthRepository;
import lk.ijse.aad.backend.service.EmailService;
import lk.ijse.aad.backend.service.NotificationService;
import lk.ijse.aad.backend.service.ProposalService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.modelmapper.ModelMapper;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class ProposalServiceImpl implements ProposalService {

    private final ProposalRepository proposalRepository;
    private final AuthRepository authRepository;
    private final TaskRepository taskRepository;
    private final ModelMapper modelMapper;
    private final EmailService emailService;
    private final NotificationService notificationService;

    @Override
    public void saveProposal(ProposalDTO proposalDTO) {
        try {
            User freelancer = authRepository.findById(proposalDTO.getFreelancerId())
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

            // Send email to client
            sendProposalEmailToClient(proposal.getId());

            // Create notification for client
            String message = "New proposal received for your task: " + task.getTitle();
            notificationService.createAndSendNotification(
                    task.getClient().getId(),
                    message,
                    NotificationType.PROPOSAL_UPDATE,
                    task.getId(),
                    task.getTitle()
            );

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

    @Override
    public List<ProposalDTO> getProposalsByClientId(Long clientId) {
        return proposalRepository.findByTaskClientId(clientId).stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    @Override
    public void acceptProposal(Long proposalId) {
        try {
            Proposal proposal = proposalRepository.findById(proposalId)
                    .orElseThrow(() -> new RuntimeException("Proposal not found with ID: " + proposalId));

            // Check if the proposal is still pending
            if (proposal.getStatus() != ProposalStatus.PENDING) {
                throw new RuntimeException("Proposal is not in PENDING status");
            }

            // Update proposal status to ACCEPTED
            proposal.setStatus(ProposalStatus.ACCEPTED);
            proposalRepository.save(proposal);

            // Update task status to IN_PROGRESS and assign freelancer
            Task task = proposal.getTask();
            task.setStatus(TaskStatus.IN_PROGRESS);
            task.setFreelancer(proposal.getFreelancer());
            taskRepository.save(task);

            // Reject all other proposals for the same task
            List<Proposal> otherProposals = proposalRepository.findByTaskId(task.getId())
                    .stream()
                    .filter(p -> !p.getId().equals(proposalId) && p.getStatus() == ProposalStatus.PENDING)
                    .toList();

            for (Proposal otherProposal : otherProposals) {
                otherProposal.setStatus(ProposalStatus.REJECTED);
                proposalRepository.save(otherProposal);

                // Send rejection email to other freelancers
                sendRejectionEmail(otherProposal);

                // Create notification for freelancer
                String message = "Your proposal for '" + proposal.getTask().getTitle() + "' has been rejected";
                notificationService.createAndSendNotification(
                        proposal.getFreelancer().getId(),
                        message,
                        NotificationType.PROPOSAL_UPDATE,
                        proposal.getTask().getId(),
                        proposal.getTask().getTitle()
                );
            }

            // Send acceptance email
            sendAcceptanceEmail(proposal);

            // Create notification for freelancer
            String message = "Your proposal for '" + task.getTitle() + "' has been accepted!";
            notificationService.createAndSendNotification(
                    proposal.getFreelancer().getId(),
                    message,
                    NotificationType.PROPOSAL_UPDATE,
                    task.getId(),
                    task.getTitle()
            );

            log.info("Proposal accepted successfully: {}", proposalId);

        } catch (Exception e) {
            log.error("Error while accepting proposal: {}", proposalId, e);
            throw new RuntimeException("Failed to accept proposal: " + e.getMessage(), e);
        }
    }

    @Override
    public void rejectProposal(Long proposalId) {
        try {
            Proposal proposal = proposalRepository.findById(proposalId)
                    .orElseThrow(() -> new RuntimeException("Proposal not found with ID: " + proposalId));

            // Check if the proposal is still pending
            if (proposal.getStatus() != ProposalStatus.PENDING) {
                throw new RuntimeException("Proposal is not in PENDING status");
            }

            // Update proposal status to REJECTED
            proposal.setStatus(ProposalStatus.REJECTED);
            proposalRepository.save(proposal);

            // Send rejection email
            sendRejectionEmail(proposal);

            // Create notification for freelancer
            String message = "Your proposal for '" + proposal.getTask().getTitle() + "' has been rejected";
            notificationService.createAndSendNotification(
                    proposal.getFreelancer().getId(),
                    message,
                    NotificationType.PROPOSAL_UPDATE,
                    proposal.getTask().getId(),
                    proposal.getTask().getTitle()
            );

            log.info("Proposal rejected successfully: {}", proposalId);

        } catch (Exception e) {
            log.error("Error while rejecting proposal: {}", proposalId, e);
            throw new RuntimeException("Failed to reject proposal: " + e.getMessage(), e);
        }
    }

    @Async
    protected void sendProposalEmailToClient(Long proposalId) {
        Proposal proposal = proposalRepository.findByIdWithFreelancerAndTask(proposalId)
                .orElseThrow(() -> new RuntimeException("Proposal not found: " + proposalId));

        Task task = proposal.getTask();
        String clientEmail = task.getClient().getEmail();
        String subject = "📩 New Proposal for Your Task: " + task.getTitle();
        String message = "<h2>Hello " + task.getClient().getName() + ",</h2>" +
                "<p>A freelancer has submitted a proposal for your task:</p>" +
                "<ul>" +
                "<li><b>Task:</b> " + task.getTitle() + "</li>" +
                "<li><b>Freelancer Name:</b> " + proposal.getFreelancer().getName() + "</li>" +
                "<li><b>Bid Amount:</b> Rs." + proposal.getBidAmount() + "</li>" +
                "<li><b>Cover Letter:</b> " + proposal.getCoverLetter() + "</li>" +
                "</ul>" +
                "<p>You can review this proposal on TaskFlow.</p>" +
                "<p>Best regards,<br>TaskFlow Team</p>";

        emailService.sendEmail(clientEmail, subject, message);
    }

    @Async
    protected void sendAcceptanceEmail(Proposal proposal) {
        String to = proposal.getFreelancer().getEmail();
        String subject = "🎉 Your Proposal Has Been Accepted!";
        String message = "<h2>Congratulations " + proposal.getFreelancer().getName() + "!</h2>" +
                "<p>Your proposal for the task <b>" + proposal.getTask().getTitle() + "</b> has been <b>ACCEPTED</b>.</p>" +
                "<p>The client will be in touch with further details.</p>" +
                "<p>Best regards,<br>TaskFlow Team</p>";

        emailService.sendEmail(to, subject, message);
    }

    @Async
    protected void sendRejectionEmail(Proposal proposal) {
        String to = proposal.getFreelancer().getEmail();
        String subject = "❌ Your Proposal Was Rejected";
        String message = "<h2>Hello " + proposal.getFreelancer().getName() + ",</h2>" +
                "<p>Your proposal for the task <b>" + proposal.getTask().getTitle() + "</b> has been <b>REJECTED</b>.</p>" +
                "<p>Don’t be discouraged—there are plenty of other tasks waiting for you!</p>" +
                "<p>Best regards,<br>TaskFlow Team</p>";

        emailService.sendEmail(to, subject, message);
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

    @Override
    public Map<String, Long> getProposalCounts() {
        Map<String, Long> counts = new HashMap<>();
        counts.put("allProposals", proposalRepository.count());
        counts.put("acceptedProposals", proposalRepository.countByStatus(ProposalStatus.ACCEPTED));
        counts.put("rejectedProposals", proposalRepository.countByStatus(ProposalStatus.REJECTED));
        return counts;
    }

    @Override
    public Map<String, Long> getFreelancerProposalCounts(Long freelancerId) {
        Map<String, Long> counts = new HashMap<>();
        List<Proposal> proposals = proposalRepository.findByFreelancerId(freelancerId);
        counts.put("myProposals", (long) proposals.size());
        counts.put("acceptedProposals", proposals.stream().filter(p -> p.getStatus() == ProposalStatus.ACCEPTED).count());
        counts.put("rejectedProposals", proposals.stream().filter(p -> p.getStatus() == ProposalStatus.REJECTED).count());
        return counts;
    }

    @Override
    public Map<String, Long> getTaskProposalCounts(Long taskId) {
        Map<String, Long> counts = new HashMap<>();
        List<Proposal> proposals = proposalRepository.findByTaskId(taskId);
        counts.put("allProposals", (long) proposals.size());
        counts.put("acceptedProposals", proposals.stream().filter(p -> p.getStatus().equals("ACCEPTED")).count());
        counts.put("rejectedProposals", proposals.stream().filter(p -> p.getStatus().equals("REJECTED")).count());
        return counts;
    }

    @Override
    public double getFreelancerEarnings(Long freelancerId) {
        LocalDateTime startOfMonth = LocalDateTime.now().withDayOfMonth(1).withHour(0).withMinute(0).withSecond(0);
        List<Proposal> proposals = proposalRepository.findByFreelancerId(freelancerId);
        return proposals.stream()
                .filter(p -> p.getStatus() == ProposalStatus.ACCEPTED)
                .filter(p -> p.getTask().getStatus() == TaskStatus.COMPLETED)
                .filter(p -> p.getSubmittedAt().isAfter(startOfMonth))
                .mapToDouble(Proposal::getBidAmount)
                .sum();
    }

    @Override
    public Map<String, Long> getClientProposalCounts(Long clientId) {
        Map<String, Long> counts = new HashMap<>();
        List<Proposal> proposals = proposalRepository.findByTaskClientId(clientId);
        counts.put("allProposals", (long) proposals.size());
        counts.put("acceptedProposals", proposals.stream().filter(p -> p.getStatus() == ProposalStatus.ACCEPTED).count());
        counts.put("rejectedProposals", proposals.stream().filter(p -> p.getStatus() == ProposalStatus.REJECTED).count());
        return counts;
    }

}
