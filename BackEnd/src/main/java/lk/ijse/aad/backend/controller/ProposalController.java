package lk.ijse.aad.backend.controller;

import lk.ijse.aad.backend.dto.ApiResponse;
import lk.ijse.aad.backend.dto.ProposalDTO;
import lk.ijse.aad.backend.entity.Task;
import lk.ijse.aad.backend.service.EmailService;
import lk.ijse.aad.backend.service.ProposalService;
import lk.ijse.aad.backend.service.TaskService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/proposals")
@RequiredArgsConstructor
@CrossOrigin
public class ProposalController {

    private final ProposalService proposalService;
    private final TaskService taskService;
    private final EmailService emailService;

    @PostMapping
    @PreAuthorize("hasRole('FREELANCER')")
    public ResponseEntity<ApiResponse> createProposal(@RequestBody ProposalDTO proposalDTO) {
        proposalService.saveProposal(proposalDTO);

        // Fetch the task to get client email
        Task task = taskService.getTaskEntityById(proposalDTO.getTaskId());
        String clientEmail = task.getClient().getEmail();

        // Send email to client
        String subject = "New Proposal for Your Task: " + task.getTitle();
        String message = "<h2>Hello " + task.getClient().getName() + ",</h2>" +
                "<p>A freelancer has submitted a proposal for your task:</p>" +
                "<ul>" +
                "<li><b>Task:</b> " + task.getTitle() + "</li>" +
                "<li><b>Freelancer Name:</b> " + proposalDTO.getFreelancerName() + "</li>" +
                "<li><b>Bid Amount:</b> $" + proposalDTO.getBidAmount() + "</li>" +
                "<li><b>Cover Letter:</b> " + proposalDTO.getCoverLetter() + "</li>" +
                "</ul>" +
                "<p>You can review this proposal on TaskFlow.</p>" +
                "<p>Best regards,<br>The TaskFlow Team</p>";

        emailService.sendEmail(clientEmail, subject, message);

        return ResponseEntity.ok(new ApiResponse(
                201,
                "Proposal Created Successfully",
                null
        ));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('FREELANCER')")
    public ResponseEntity<ApiResponse> updateProposal(@PathVariable Long id, @RequestBody ProposalDTO proposalDTO) {
        proposalDTO.setId(id);
        proposalService.updateProposal(proposalDTO);
        return ResponseEntity.ok(new ApiResponse(
                200,
                "Proposal Updated Successfully",
                null
        ));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('FREELANCER', 'ADMIN')")
    public ResponseEntity<ApiResponse> deleteProposal(@PathVariable Long id) {
        proposalService.deleteProposal(String.valueOf(id));
        return ResponseEntity.ok(new ApiResponse(
                200,
                "Proposal Deleted Successfully",
                null
        ));
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('CLIENT', 'FREELANCER', 'ADMIN')")
    public ResponseEntity<ApiResponse> getAllProposals() {
        List<ProposalDTO> proposals = proposalService.getAllProposals();
        return ResponseEntity.ok(new ApiResponse(
                200,
                "Proposals Retrieved Successfully",
                proposals
        ));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('CLIENT', 'FREELANCER', 'ADMIN')")
    public ResponseEntity<ApiResponse> getProposalById(@PathVariable Long id) {
        ProposalDTO proposal = proposalService.getProposalById(id);
        return ResponseEntity.ok(new ApiResponse(
                200,
                "Proposal Retrieved Successfully",
                proposal
        ));
    }

    @GetMapping("/task/{taskId}")
    @PreAuthorize("hasAnyRole('CLIENT', 'FREELANCER', 'ADMIN')")
    public ResponseEntity<ApiResponse> getProposalsByTask(@PathVariable Long taskId) {
        List<ProposalDTO> proposals = proposalService.getProposalsByTaskId(taskId);
        return ResponseEntity.ok(new ApiResponse(
                200,
                "Proposals for Task Retrieved Successfully",
                proposals
        ));
    }

    @GetMapping("/freelancer/{freelancerId}")
    @PreAuthorize("hasAnyRole('FREELANCER', 'ADMIN')")
    public ResponseEntity<ApiResponse> getProposalsByFreelancer(@PathVariable Long freelancerId) {
        List<ProposalDTO> proposals = proposalService.getProposalsByFreelancerId(freelancerId);
        return ResponseEntity.ok(new ApiResponse(
                200,
                "Freelancer Proposals Retrieved Successfully",
                proposals
        ));
    }

    @GetMapping("/client/{clientId}")
    @PreAuthorize("hasRole('CLIENT')")
    public ResponseEntity<ApiResponse> getProposalsByClient(@PathVariable Long clientId) {
        List<ProposalDTO> proposals = proposalService.getProposalsByClientId(clientId);
        return ResponseEntity.ok(new ApiResponse(
                200,
                "Client Proposals Retrieved Successfully",
                proposals
        ));
    }

    @PutMapping("/{id}/accept")
    @PreAuthorize("hasRole('CLIENT')")
    public ResponseEntity<ApiResponse> acceptProposal(@PathVariable Long id) {
        proposalService.acceptProposal(id);
        return ResponseEntity.ok(new ApiResponse(
                200,
                "Proposal Accepted Successfully",
                null
        ));
    }

    @PutMapping("/{id}/reject")
    @PreAuthorize("hasRole('CLIENT')")
    public ResponseEntity<ApiResponse> rejectProposal(@PathVariable Long id) {
        proposalService.rejectProposal(id);
        return ResponseEntity.ok(new ApiResponse(
                200,
                "Proposal Rejected Successfully",
                null
        ));
    }

}
