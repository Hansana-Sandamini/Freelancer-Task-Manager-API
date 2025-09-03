const PROPOSAL_BASE_URL = "http://localhost:8085/api/v1/proposals";
const TASK_URL_BASE = "http://localhost:8085/api/v1/tasks";

let currentUser = {
    id: localStorage.getItem("userId"),
    role: localStorage.getItem("role") // CLIENT | FREELANCER | ADMIN
};

let proposals = [];

// ===================== Initial Load =====================
document.addEventListener("DOMContentLoaded", () => {
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
            renderProposals();
        } else {
            alert("Failed to load proposals: " + result.message);
        }
    } catch (error) {
        console.error("Error loading proposals:", error);
        alert("Error loading proposals. Please try again.");
    }
}

// ===================== Render Proposals =====================
function renderProposals() {
    const cardContainer = document.getElementById("proposalCardContainer");
    if (!cardContainer) return;

    cardContainer.innerHTML = "";

    proposals.forEach(proposal => {
        const card = document.createElement("div");
        card.className = "col";

        // Status badge color
        let statusClass = "badge bg-secondary";
        if (proposal.status === "PENDING") statusClass = "badge bg-warning text-dark";
        else if (proposal.status === "ACCEPTED") statusClass = "badge bg-success";
        else if (proposal.status === "REJECTED") statusClass = "badge bg-danger";

        // Truncate cover letter to avoid overly large cards
        const maxCoverLetterLength = 100;
        const coverLetter = proposal.coverLetter.length > maxCoverLetterLength
            ? proposal.coverLetter.substring(0, maxCoverLetterLength) + "..."
            : proposal.coverLetter;

        card.innerHTML = `
            <div class="card h-100 shadow-sm">
                <div class="card-body">
                    <h5 class="card-title">${proposal.taskTitle || "Unknown Task"}</h5>
<!--                    <h6 class="card-subtitle mb-2 text-muted">ID: ${proposal.id}</h6>-->
                    <p class="card-text"><strong>Freelancer:</strong> ${proposal.freelancerName || "Unknown Freelancer"}</p>
                    <p class="card-text"><strong>Cover Letter:</strong> ${coverLetter}</p>
                    <p class="card-text"><strong>Bid Amount:</strong> Rs ${proposal.bidAmount.toFixed(2)}</p>
                    <p class="card-text"><strong>Submitted At:</strong> ${formatDate(proposal.submittedAt)}</p>
                    <p class="card-text"><strong>Status:</strong> <span class="${statusClass} fs-6 px-3 py-2">${proposal.status}</span></p>
                    <div class="d-flex justify-content-end gap-2">
                        ${renderActionButtons(proposal)}
                    </div>
                </div>
            </div>
        `;

        cardContainer.appendChild(card);
    });
}

// Render action buttons based on user role
function renderActionButtons(proposal) {
    let buttons = `
        <button class="btn btn-outline-primary" onclick="viewProposalDetails(${proposal.id})">
            <i class="fas fa-eye"></i> View
        </button>
    `;

    if (currentUser.role === "FREELANCER" && proposal.status === "PENDING") {
        buttons += `
            <button class="btn btn-outline-secondary me-1" onclick="viewProposalDetails(${proposal.id}, true)">
                <i class="fas fa-edit"></i> Edit
            </button>
            <button class="btn btn-outline-danger" onclick="deleteProposal(${proposal.id})">
                <i class="fas fa-trash"></i> Delete
            </button>
        `;
    } else if (currentUser.role === "CLIENT" && proposal.status === "PENDING") {
        buttons += `
            <button class="btn btn-outline-success me-1" onclick="acceptProposal(${proposal.id})">
                <i class="fas fa-check"></i> Accept
            </button>
            <button class="btn btn-outline-danger" onclick="rejectProposal(${proposal.id})">
                <i class="fas fa-times"></i> Reject
            </button>
        `;
    }
    if (currentUser.role === "ADMIN") {
        buttons += `
            <button class="btn btn-outline-danger" onclick="deleteProposal(${proposal.id})">
                <i class="fas fa-trash"></i> Delete
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
    if (!confirm("Are you sure you want to accept this proposal? This will automatically reject all other proposals for this task and assign the task to this freelancer.")) return;

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
            alert("Proposal accepted successfully! The task is now in progress.");

            // Update the task status to IN_PROGRESS
            const proposal = proposals.find(p => p.id === proposalId);
            if (proposal) {
                await updateTaskStatus(proposal.taskId, "IN_PROGRESS");
            }

            const modalEl = document.getElementById("proposalDetailsModal");
            const modalInstance = bootstrap.Modal.getInstance(modalEl);
            if (modalInstance) modalInstance.hide();

            loadProposals();
        } else {
            alert("Failed to accept proposal: " + result.message);
        }
    } catch (error) {
        console.error("Error accepting proposal:", error);
        alert("Error accepting proposal. Please try again.");
    }
}

// Helper function to update task status
async function updateTaskStatus(taskId, status) {
    try {
        // First get the current task
        const taskResponse = await fetch(`${TASK_URL_BASE}/${taskId}`, {
            headers: {
                "Authorization": "Bearer " + localStorage.getItem("token")
            }
        });

        const taskResult = await taskResponse.json();
        if (taskResult.code === 200) {
            const task = taskResult.data;

            // Update the task status
            const updateResponse = await fetch(`${TASK_API_BASE}/${taskId}`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": "Bearer " + localStorage.getItem("token")
                },
                body: JSON.stringify({
                    ...task,
                    status: status
                })
            });

            const updateResult = await updateResponse.json();
            if (updateResult.code !== 200) {
                console.error("Failed to update task status:", updateResult.message);
            }
        }
    } catch (error) {
        console.error("Error updating task status:", error);
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
