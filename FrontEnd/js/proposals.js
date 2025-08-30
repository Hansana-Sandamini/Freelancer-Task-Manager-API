const PROPOSAL_BASE_URL = "http://localhost:8085/api/v1/proposals";

let currentUser = {
    id: localStorage.getItem("userId"),
    role: localStorage.getItem("role") // CLIENT | FREELANCER | ADMIN
};

let proposals = [];

// ===================== Initial Load =====================
document.addEventListener("DOMContentLoaded", () => {
    loadSidebarBasedOnRole();
    loadProposals();

    // Attach event listeners for proposal form submission and action buttons
    const proposalForm = document.getElementById("proposalForm");
    if (proposalForm) {
        proposalForm.addEventListener("submit", submitProposal);
    }

    document.getElementById("editProposalBtn")?.addEventListener("click", enableProposalEdit);
    document.getElementById("saveProposalBtn")?.addEventListener("click", saveProposalChanges);
    document.getElementById("deleteProposalBtn")?.addEventListener("click", deleteProposal);
    document.getElementById("acceptProposalBtn")?.addEventListener("click", acceptProposal);
    document.getElementById("rejectProposalBtn")?.addEventListener("click", rejectProposal);

    // Protect page (redirect if not logged in)
    if (!localStorage.getItem("token")) {
        window.location.href = "/FrontEnd/index.html";
    }
});

// Load proposals based on user role
async function loadProposals() {
    try {
        let url = PROPOSAL_BASE_URL;
        if (currentUser.role === "FREELANCER") {
            url += `/freelancer/${currentUser.id}`;
        } else if (currentUser.role === "CLIENT") {
            url += `/client/${currentUser.id}`;
        }

        const response = await fetch(url, {
            headers: {
                "Authorization": "Bearer " + localStorage.getItem("token")
            }
        });

        const result = await response.json();
        if (result.code === 200) {
            proposals = result.data || [];
            populateProposalsTable();
        } else {
            alert("Failed to load proposals: " + result.message);
        }
    } catch (error) {
        console.error("Error loading proposals:", error);
        alert("Error loading proposals. Please try again.");
    }
}

// ===================== Populate Proposals Table =====================
function populateProposalsTable() {
    const tableBody = document.getElementById("proposalTableBody");
    if (!tableBody) return;

    tableBody.innerHTML = "";

    proposals.forEach(proposal => {
        const row = document.createElement("tr");

        // Status badge color
        let statusClass = "badge bg-secondary";
        if (proposal.status === "PENDING") statusClass = "badge bg-warning";
        else if (proposal.status === "ACCEPTED") statusClass = "badge bg-success";
        else if (proposal.status === "REJECTED") statusClass = "badge bg-danger";

        row.innerHTML = `
            <td>${proposal.id}</td>
            <td>${proposal.taskTitle}</td>
            <td>${proposal.freelancerName}</td>
            <td class="cover-letter">${proposal.coverLetter}</td>
            <td>Rs ${proposal.bidAmount.toFixed(2)}</td>
            <td>${formatDate(proposal.submittedAt)}</td>
            <td><span class="${statusClass}">${proposal.status}</span></td>
            <td>${renderActionButtons(proposal)}</td>
        `;

        tableBody.appendChild(row);
    });
}

// Render action buttons based on user role
function renderActionButtons(proposal) {
    let buttons = `
        <button class="btn btn-sm btn-outline-primary me-1" onclick="viewProposalDetails(${proposal.id})">
            <i class="fas fa-eye"></i>
        </button>
    `;

    if (currentUser.role === "FREELANCER" && proposal.status === "PENDING") {
        buttons += `
            <button class="btn btn-sm btn-outline-secondary me-1" onclick="viewProposalDetails(${proposal.id}, true)">
                <i class="fas fa-edit"></i>
            </button>
            <button class="btn btn-sm btn-outline-danger" onclick="deleteProposal(${proposal.id})">
                <i class="fas fa-trash"></i>
            </button>
        `;
    } else if (currentUser.role === "CLIENT" && proposal.status === "PENDING") {
        buttons += `
            <button class="btn btn-sm btn-outline-success me-1" onclick="acceptProposal(${proposal.id})">
                <i class="fas fa-check"></i>
            </button>
            <button class="btn btn-sm btn-outline-danger" onclick="rejectProposal(${proposal.id})">
                <i class="fas fa-times"></i>
            </button>
        `;
    }
    if (currentUser.role === "ADMIN") {
        buttons += `
            <button class="btn btn-sm btn-outline-danger" onclick="deleteProposal(${proposal.id})">
                <i class="fas fa-trash"></i>
            </button>
        `;
    }

    return buttons;
}

// ===================== View proposal details =====================
function viewProposalDetails(proposalId, editMode = false) {
    const proposal = proposals.find(p => p.id === proposalId);
    if (!proposal) return;

    document.getElementById("modalProposalId").value = proposal.id;
    document.getElementById("modalTaskTitle").textContent = proposal.taskTitle || "Unknown Task";
    document.getElementById("modalFreelancer").textContent = proposal.freelancerName || "Unknown Freelancer";
    document.getElementById("modalCoverLetter").value = proposal.coverLetter || "No cover letter provided";
    document.getElementById("modalBidAmount").value = proposal.bidAmount.toFixed(2);
    document.getElementById("modalSubmittedAt").textContent = formatDate(proposal.submittedAt);
    document.getElementById("modalStatus").textContent = proposal.status;

    const coverLetterInput = document.getElementById("modalCoverLetter");
    const bidAmountInput = document.getElementById("modalBidAmount");
    const editBtn = document.getElementById("editProposalBtn");
    const saveBtn = document.getElementById("saveProposalBtn");
    const deleteBtn = document.getElementById("deleteProposalBtn");
    const acceptBtn = document.getElementById("acceptProposalBtn");
    const rejectBtn = document.getElementById("rejectProposalBtn");

    if (editMode && currentUser.role === "FREELANCER" && proposal.status === "PENDING") {
        coverLetterInput.removeAttribute("readonly");
        bidAmountInput.removeAttribute("readonly");
        editBtn.classList.add("d-none");
        saveBtn.classList.remove("d-none");
        deleteBtn.classList.remove("d-none");
    } else {
        coverLetterInput.setAttribute("readonly", true);
        bidAmountInput.setAttribute("readonly", true);
        editBtn.classList.remove("d-none");
        saveBtn.classList.add("d-none");
        deleteBtn.classList.add("d-none");
    }

    if (currentUser.role === "CLIENT" && proposal.status === "PENDING") {
        acceptBtn.classList.remove("d-none");
        rejectBtn.classList.remove("d-none");
    } else {
        acceptBtn.classList.add("d-none");
        rejectBtn.classList.add("d-none");
    }

    if (currentUser.role !== "FREELANCER" || proposal.status !== "PENDING") {
        editBtn.classList.add("d-none");
    }

    if (currentUser.role === "ADMIN") {
        deleteBtn.classList.remove("d-none");
    }

    const modal = new bootstrap.Modal(document.getElementById("proposalDetailsModal"));
    modal.show();
}

// Enable edit mode for proposal
function enableProposalEdit() {
    const coverLetterInput = document.getElementById("modalCoverLetter");
    const bidAmountInput = document.getElementById("modalBidAmount");
    coverLetterInput.removeAttribute("readonly");
    bidAmountInput.removeAttribute("readonly");
    document.getElementById("editProposalBtn").classList.add("d-none");
    document.getElementById("saveProposalBtn").classList.remove("d-none");
    document.getElementById("deleteProposalBtn").classList.remove("d-none");
}

// ===================== Save proposal changes =====================
async function saveProposalChanges() {
    const proposalId = document.getElementById("modalProposalId").value;
    const updatedProposal = {
        id: proposalId,
        coverLetter: document.getElementById("modalCoverLetter").value,
        bidAmount: parseFloat(document.getElementById("modalBidAmount").value)
    };

    try {
        const response = await fetch(`${PROPOSAL_BASE_URL}/${proposalId}`, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json",
                "Authorization": "Bearer " + localStorage.getItem("token")
            },
            body: JSON.stringify(updatedProposal)
        });

        const result = await response.json();
        if (result.code === 200) {
            alert("Proposal updated successfully!");
            bootstrap.Modal.getInstance(document.getElementById("proposalDetailsModal")).hide();
            loadProposals();
        } else {
            alert("Failed to update proposal: " + result.message);
        }
    } catch (error) {
        console.error("Error updating proposal:", error);
        alert("Error updating proposal. Please try again.");
    }
}

// ===================== Delete proposal =====================
async function deleteProposal(proposalId) {
    if (!confirm("Are you sure you want to delete this proposal?")) return;

    try {
        const response = await fetch(`${PROPOSAL_BASE_URL}/${proposalId}`, {
            method: "DELETE",
            headers: {
                "Authorization": "Bearer " + localStorage.getItem("token")
            }
        });

        const result = await response.json();
        if (result.code === 200) {
            alert("Proposal deleted successfully!");
            bootstrap.Modal.getInstance(document.getElementById("proposalDetailsModal")).hide();
            loadProposals();
        } else {
            alert("Failed to delete proposal: " + result.message);
        }
    } catch (error) {
        console.error("Error deleting proposal:", error);
        alert("Error deleting proposal. Please try again.");
    }
}

// ===================== Accept proposal =====================
async function acceptProposal(proposalId) {
    if (!confirm("Are you sure you want to accept this proposal? This will automatically reject all other proposals for this task.")) return;

    try {
        const response = await fetch(`${PROPOSAL_BASE_URL}/${proposalId}/accept`, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json",
                "Authorization": "Bearer " + localStorage.getItem("token")
            }
        });

        const result = await response.json();
        if (result.code === 200) {
            alert("Proposal accepted successfully!");
            bootstrap.Modal.getInstance(document.getElementById("proposalDetailsModal")).hide();
            loadProposals();
        } else {
            alert("Failed to accept proposal: " + result.message);
        }
    } catch (error) {
        console.error("Error accepting proposal:", error);
        alert("Error accepting proposal. Please try again.");
    }
}

// ===================== Reject proposal =====================
async function rejectProposal(proposalId) {
    if (!confirm("Are you sure you want to reject this proposal?")) return;

    try {
        const response = await fetch(`${PROPOSAL_BASE_URL}/${proposalId}/reject`, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json",
                "Authorization": "Bearer " + localStorage.getItem("token")
            }
        });

        const result = await response.json();
        if (result.code === 200) {
            alert("Proposal rejected successfully!");
            bootstrap.Modal.getInstance(document.getElementById("proposalDetailsModal")).hide();
            loadProposals();
        } else {
            alert("Failed to reject proposal: " + result.message);
        }
    } catch (error) {
        console.error("Error rejecting proposal:", error);
        alert("Error rejecting proposal. Please try again.");
    }
}

// ===================== Submit proposal (for Freelancers) =====================
async function submitProposal(e) {
    e.preventDefault();

    const newProposal = {
        taskId: document.getElementById("proposalTaskId").value,
        freelancerId: currentUser.id,
        coverLetter: document.getElementById("proposalCoverLetter").value,
        bidAmount: parseFloat(document.getElementById("proposalBid").value)
    };

    try {
        const response = await fetch(PROPOSAL_BASE_URL, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": "Bearer " + localStorage.getItem("token")
            },
            body: JSON.stringify(newProposal)
        });

        const result = await response.json();
        if (result.code === 201) {
            alert("Proposal submitted successfully!");
            document.getElementById("proposalForm").reset();
            bootstrap.Modal.getInstance(document.getElementById("proposalModal")).hide();
            loadProposals();
        } else {
            alert("Failed to submit proposal: " + result.message);
        }
    } catch (error) {
        console.error("Error submitting proposal:", error);
        alert("Error submitting proposal. Please try again.");
    }
}

// Format date for display
function formatDate(dateStr) {
    if (!dateStr) return "-";
    const date = new Date(dateStr);
    return date.toLocaleString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit"
    });
}

// Function to load sidebar based on role
function loadSidebarBasedOnRole() {
    const role = localStorage.getItem('role');
    const adminSidebar = document.getElementById('sidebar-admin');
    const clientSidebar = document.getElementById('sidebar-client');
    const freelancerSidebar = document.getElementById('sidebar-freelancer');

    // Hide all sidebars first
    if (adminSidebar) adminSidebar.style.display = 'none';
    if (clientSidebar) clientSidebar.style.display = 'none';
    if (freelancerSidebar) freelancerSidebar.style.display = 'none';

    // Show appropriate sidebar
    switch(role) {
        case 'ADMIN':
            if (adminSidebar) adminSidebar.style.display = 'block';
            break;
        case 'CLIENT':
            if (clientSidebar) clientSidebar.style.display = 'block';
            break;
        case 'FREELANCER':
            if (freelancerSidebar) freelancerSidebar.style.display = 'block';
            break;
        default:
            console.error('Unknown role:', role);
    }
}
