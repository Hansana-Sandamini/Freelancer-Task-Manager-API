package lk.ijse.aad.backend.service.impl;

import lk.ijse.aad.backend.dto.ProposalDTO;
import lk.ijse.aad.backend.service.ProposalService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class ProposalServiceImpl implements ProposalService {

    @Override
    public void saveProposal(ProposalDTO proposalDTO) {
    }

    @Override
    public void updateProposal(ProposalDTO proposalDTO) {
    }

    @Override
    public void deleteProposal(String proposalId) {
    }

    @Override
    public List<ProposalDTO> getAllProposals() {
        return List.of();
    }

}
