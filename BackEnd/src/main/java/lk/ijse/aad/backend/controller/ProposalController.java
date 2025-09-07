package lk.ijse.aad.backend.controller;

import lk.ijse.aad.backend.dto.ApiResponse;
import lk.ijse.aad.backend.dto.ProposalDTO;
import lk.ijse.aad.backend.service.ProposalService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/proposals")
@RequiredArgsConstructor
@CrossOrigin
public class ProposalController {

    private final ProposalService proposalService;

    @PostMapping
    @PreAuthorize("hasRole('FREELANCER')")
    public ResponseEntity<ApiResponse> createProposal(@RequestBody ProposalDTO proposalDTO) {
        proposalService.saveProposal(proposalDTO);
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

    @GetMapping("/count")
    @PreAuthorize("hasAnyRole('CLIENT', 'FREELANCER', 'ADMIN')")
    public ResponseEntity<ApiResponse> getProposalCounts() {
        Map<String, Long> counts = proposalService.getProposalCounts();
        return ResponseEntity.ok(new ApiResponse(
                200,
                "Proposal counts retrieved successfully",
                counts
        ));
    }

    @GetMapping("/count/freelancer/{freelancerId}")
    @PreAuthorize("hasAnyRole('FREELANCER', 'ADMIN')")
    public ResponseEntity<ApiResponse> getFreelancerProposalCounts(@PathVariable Long freelancerId) {
        Map<String, Long> counts = proposalService.getFreelancerProposalCounts(freelancerId);
        return ResponseEntity.ok(new ApiResponse(
                200,
                "Freelancer proposal counts retrieved successfully",
                counts
        ));
    }

    @GetMapping("/count/task/{taskId}")
    @PreAuthorize("hasAnyRole('CLIENT', 'ADMIN')")
    public ResponseEntity<ApiResponse> getTaskProposalCounts(@PathVariable Long taskId) {
        Map<String, Long> counts = proposalService.getTaskProposalCounts(taskId);
        return ResponseEntity.ok(new ApiResponse(
                200,
                "Task proposal counts retrieved successfully",
                counts
        ));
    }

    @GetMapping("/earnings/freelancer/{freelancerId}")
    @PreAuthorize("hasAnyRole('FREELANCER', 'ADMIN')")
    public ResponseEntity<ApiResponse> getFreelancerEarnings(@PathVariable Long freelancerId) {
        double earnings = proposalService.getFreelancerEarnings(freelancerId);
        return ResponseEntity.ok(new ApiResponse(
                200,
                "Freelancer earnings retrieved successfully",
                earnings
        ));
    }

    @GetMapping("/count/client/{clientId}")
    @PreAuthorize("hasRole('CLIENT')")
    public ResponseEntity<ApiResponse> getClientProposalCounts(@PathVariable Long clientId) {
        Map<String, Long> counts = proposalService.getClientProposalCounts(clientId);
        return ResponseEntity.ok(new ApiResponse(
                200,
                "Client proposal counts retrieved successfully",
                counts
        ));
    }

}
