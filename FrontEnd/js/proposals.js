const PROPOSAL_BASE_URL = "http://localhost:8085/api/v1/proposals";
const TASK_URL_BASE = "http://localhost:8085/api/v1/tasks";
import { showSuccessAlert, showErrorAlert, showConfirmAlert } from './alert-util.js';

let currentUser = {
    id: localStorage.getItem("userId"),
    role: localStorage.getItem("role") // CLIENT | FREELANCER | ADMIN
};

let proposals = [];
let filteredProposals = [];

// Pagination variables
let currentPage = 1;
const proposalsPerPage = 4;

// Filter variables
let currentFilters = {
    status: '',
    minBid: '',
    maxBid: '',
    search: ''
};

// ===================== Initial Load =====================
document.addEventListener("DOMContentLoaded", () => {
    loadProposals();
    setupFilterEventListeners();

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

    // Update timestamps every minute
    setInterval(() => {
        renderProposalsWithPagination();
    }, 60000); // 60 seconds
});

// Setup filter event listeners
function setupFilterEventListeners() {
    const applyFiltersBtn = document.getElementById("applyFilters");
    const clearFiltersBtn = document.getElementById("clearFilters");
    const searchInput = document.getElementById("searchFilter");

    if (applyFiltersBtn) applyFiltersBtn.addEventListener("click", applyFilters);
    if (clearFiltersBtn) clearFiltersBtn.addEventListener("click", clearFilters);
    if (searchInput) searchInput.addEventListener("input", handleSearch);
}

// ===================== Filter Functions =====================
function applyFilters() {
    const statusFilter = document.getElementById("statusFilter");
    const minBidFilter = document.getElementById("minBidFilter");
    const maxBidFilter = document.getElementById("maxBidFilter");

    currentFilters = {
        status: statusFilter?.value || '',
        minBid: minBidFilter?.value || '',
        maxBid: maxBidFilter?.value || '',
        search: currentFilters.search // Keep existing search
    };

    currentPage = 1; // Reset to first page when filters change
    filterProposals();
}

function clearFilters() {
    const statusFilter = document.getElementById("statusFilter");
    const minBidFilter = document.getElementById("minBidFilter");
    const maxBidFilter = document.getElementById("maxBidFilter");
    const searchFilter = document.getElementById("searchFilter");

    if (statusFilter) statusFilter.value = '';
    if (minBidFilter) minBidFilter.value = '';
    if (maxBidFilter) maxBidFilter.value = '';
    if (searchFilter) searchFilter.value = '';

    currentFilters = {
        status: '',
        minBid: '',
        maxBid: '',
        search: ''
    };

    currentPage = 1;
    filterProposals();
}

function handleSearch(e) {
    currentFilters.search = e.target.value.toLowerCase();
    currentPage = 1;
    filterProposals();
}

function filterProposals() {
    filteredProposals = proposals.filter(proposal => {
        // Status filter
        if (currentFilters.status && proposal.status !== currentFilters.status) {
            return false;
        }

        // Min bid filter
        if (currentFilters.minBid && proposal.bidAmount < parseFloat(currentFilters.minBid)) {
            return false;
        }

        // Max bid filter
        if (currentFilters.maxBid && proposal.bidAmount > parseFloat(currentFilters.maxBid)) {
            return false;
        }

        // Search filter (search in task title, freelancer name, and cover letter)
        if (currentFilters.search) {
            const searchTerm = currentFilters.search;
            const searchableText = [
                proposal.taskTitle || '',
                proposal.freelancerName || '',
                proposal.coverLetter || ''
            ].join(' ').toLowerCase();

            if (!searchableText.includes(searchTerm)) {
                return false;
            }
        }

        return true;
    });

    renderProposalsWithPagination();
}

// ===================== Pagination Functions =====================
function renderPagination(totalProposals) {
    const totalPages = Math.ceil(totalProposals / proposalsPerPage);
    const paginationContainer = document.getElementById("pagination");

    if (!paginationContainer) return;

    paginationContainer.innerHTML = '';

    if (totalPages <= 1) return;

    // Previous button
    const prevLi = document.createElement('li');
    prevLi.className = `page-item ${currentPage === 1 ? 'disabled' : ''}`;
    prevLi.innerHTML = `<a class="page-link" href="#" data-page="${currentPage - 1}">Previous</a>`;
    paginationContainer.appendChild(prevLi);

    // Page numbers
    const maxVisiblePages = 5;
    let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

    if (endPage - startPage + 1 < maxVisiblePages) {
        startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }

    for (let i = startPage; i <= endPage; i++) {
        const pageLi = document.createElement('li');
        pageLi.className = `page-item ${currentPage === i ? 'active' : ''}`;
        pageLi.innerHTML = `<a class="page-link" href="#" data-page="${i}">${i}</a>`;
        paginationContainer.appendChild(pageLi);
    }

    // Next button
    const nextLi = document.createElement('li');
    nextLi.className = `page-item ${currentPage === totalPages ? 'disabled' : ''}`;
    nextLi.innerHTML = `<a class="page-link" href="#" data-page="${currentPage + 1}">Next</a>`;
    paginationContainer.appendChild(nextLi);

    // Add event listeners to pagination links
    paginationContainer.addEventListener('click', function(e) {
        if (e.target.tagName === 'A') {
            e.preventDefault();
            const page = parseInt(e.target.getAttribute('data-page'));
            if (page && page !== currentPage) {
                currentPage = page;
                renderProposalsWithPagination();
                // Scroll to top of proposals section
                document.getElementById("proposalCardContainer").scrollIntoView({ behavior: 'smooth' });
            }
        }
    });
}

function getPaginatedProposals() {
    const startIndex = (currentPage - 1) * proposalsPerPage;
    const endIndex = startIndex + proposalsPerPage;
    return filteredProposals.slice(startIndex, endIndex);
}

function renderProposalsWithPagination() {
    // Sort filtered proposals by submittedAt in descending order
    const sortedFilteredProposals = filteredProposals.sort((a, b) => {
        const dateA = new Date(a.submittedAt);
        const dateB = new Date(b.submittedAt);
        if (isNaN(dateA.getTime())) return 1;
        if (isNaN(dateB.getTime())) return -1;
        return dateB - dateA; // Descending order
    });
    const paginatedProposals = getPaginatedProposals();
    renderProposals(paginatedProposals);
    renderPagination(filteredProposals.length);
    updateResultsCount();
}

function updateResultsCount() {
    const resultsCount = document.getElementById("resultsCount");
    if (resultsCount) {
        const startIndex = (currentPage - 1) * proposalsPerPage + 1;
        const endIndex = Math.min(currentPage * proposalsPerPage, filteredProposals.length);
        resultsCount.textContent = `Showing ${startIndex}-${endIndex} of ${filteredProposals.length} proposals`;
    }
}

// ===================== Load Proposals =====================
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
            // Sort proposals by submittedAt in descending order (newest first)
            proposals = (result.data || []).sort((a, b) => {
                const dateA = new Date(a.submittedAt);
                const dateB = new Date(b.submittedAt);
                if (isNaN(dateA.getTime())) return 1;
                if (isNaN(dateB.getTime())) return -1;
                return dateB - dateA; // Descending order
            });
            filteredProposals = [...proposals];
            currentPage = 1;
            renderProposalsWithPagination();
        } else {
            showErrorAlert("Error", "Failed to load proposals: " + result.message);
        }
    } catch (error) {
        console.error("Error loading proposals:", error);
        showErrorAlert("Error", "Error loading proposals. Please try again.");
    }
}

// ===================== Render Proposals =====================
function renderProposals(proposalsToRender = []) {
    const cardContainer = document.getElementById("proposalCardContainer");
    if (!cardContainer) return;

    cardContainer.innerHTML = "";

    if (proposalsToRender.length === 0) {
        cardContainer.innerHTML = `
            <div class="col-12 text-center py-5">
                <i class="fas fa-file-alt fa-3x text-white mb-3"></i>
                <h4 class="text-white">No proposals found</h4>
                <p class="text-white">${filteredProposals.length === 0 ? 'No proposals available.' : 'Try adjusting your filters.'}</p>
            </div>
        `;
        return;
    }

    proposalsToRender.forEach(proposal => {
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
                    <p class="card-text"><strong>Freelancer:</strong> ${proposal.freelancerName || "Unknown Freelancer"}</p>
                    <p class="card-text"><strong>Cover Letter:</strong> ${coverLetter}</p>
                    <p class="card-text"><strong>Bid Amount:</strong> Rs ${proposal.bidAmount.toFixed(2)}</p>
                    <p class="card-text submitted-time"><strong>Submitted:</strong> ${getRelativeTime(proposal.submittedAt)}</p>
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

// Function to calculate relative time
function getRelativeTime(timestamp) {
    if (!timestamp) return "Unknown time";

    const now = new Date();
    const submittedTime = new Date(timestamp);
    if (isNaN(submittedTime.getTime())) return "Submitted: Invalid date";

    const diffMs = now - submittedTime; // Difference in milliseconds
    const diffSeconds = Math.floor(diffMs / 1000);
    const diffMinutes = Math.floor(diffSeconds / 60);
    const diffHours = Math.floor(diffMinutes / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffSeconds < 60) {
        return "Submitted just now";
    } else if (diffMinutes < 60) {
        return `Submitted ${diffMinutes} minute${diffMinutes === 1 ? '' : 's'} ago`;
    } else if (diffHours < 24) {
        return `Submitted ${diffHours} hour${diffHours === 1 ? '' : 's'} ago`;
    } else if (diffDays < 30) {
        return `Submitted ${diffDays} day${diffDays === 1 ? '' : 's'} ago`;
    } else {
        const months = Math.floor(diffDays / 30);
        return `Submitted ${months} month${months === 1 ? '' : 's'} ago`;
    }
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
    document.getElementById("modalSubmittedAt").textContent = getRelativeTime(proposal.submittedAt);
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
window.viewProposalDetails = viewProposalDetails;

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
            // Show alert first
            await showSuccessAlert("Success", "Proposal updated successfully!");

            // Hide modal safely
            const modalElement = document.getElementById("proposalDetailsModal");
            const modalInstance = bootstrap.Modal.getOrCreateInstance(modalElement);
            modalInstance.hide();

            loadProposals();
        } else {
            showErrorAlert("Failed", "Failed to update proposal: " + result.message);
        }
    } catch (error) {
        console.error("Error updating proposal:", error);
        showErrorAlert("Error", "Error updating proposal. Please try again.");
    }
}
window.saveProposalChanges = saveProposalChanges;

// ===================== Delete proposal =====================
async function deleteProposal(proposalId) {
    const confirmed = await showConfirmAlert("Delete Proposal", "Are you sure you want to delete this proposal?");
    if (!confirmed) return;

    try {
        const response = await fetch(`${PROPOSAL_BASE_URL}/${proposalId}`, {
            method: "DELETE",
            headers: {
                "Authorization": "Bearer " + localStorage.getItem("token")
            }
        });

        const result = await response.json();
        if (result.code === 200) {
            showSuccessAlert("Deleted", "Proposal deleted successfully!");
            const modalInstance = bootstrap.Modal.getInstance(document.getElementById("proposalDetailsModal"));
            if (modalInstance) modalInstance.hide();
            loadProposals();
        } else {
            showErrorAlert("Failed", "Failed to delete proposal: " + result.message);
        }
    } catch (error) {
        console.error("Error deleting proposal:", error);
        showErrorAlert("Error", "Error deleting proposal. Please try again.");
    }
}
window.deleteProposal = deleteProposal;

// ===================== Accept proposal =====================
async function acceptProposal(proposalId) {
    const confirmed = await showConfirmAlert(
        "Accept Proposal",
        "Are you sure you want to accept this proposal? This will automatically reject all other proposals for this task."
    );
    if (!confirmed) return;

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
            showSuccessAlert("Accepted", "Proposal accepted successfully! The task is now in progress.");

            // Safely hide modal only if it's open
            const modalElement = document.getElementById("proposalDetailsModal");
            const modalInstance = bootstrap.Modal.getInstance(modalElement);
            if (modalInstance) {
                modalInstance.hide();
            }

            loadProposals();
        } else {
            showErrorAlert("Failed", "Failed to accept proposal: " + result.message);
        }
    } catch (error) {
        console.error("Error accepting proposal:", error);
        showErrorAlert("Error", "Error accepting proposal. Please try again.");
    }
}
window.acceptProposal = acceptProposal;

// ===================== Reject proposal =====================
async function rejectProposal(proposalId) {
    const confirmed = await showConfirmAlert("Reject Proposal", "Are you sure you want to reject this proposal?");
    if (!confirmed) return;

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
            showSuccessAlert("Rejected", "Proposal rejected successfully!");

            // Safely hide modal only if it's open
            const modalElement = document.getElementById("proposalDetailsModal");
            const modalInstance = bootstrap.Modal.getInstance(modalElement);
            if (modalInstance) {
                modalInstance.hide();
            }

            loadProposals();
        } else {
            showErrorAlert("Failed", "Failed to reject proposal: " + result.message);
        }
    } catch (error) {
        console.error("Error rejecting proposal:", error);
        showErrorAlert("Error", "Error rejecting proposal. Please try again.");
    }
}
window.rejectProposal = rejectProposal;

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
            // Show alert first
            await showSuccessAlert("Submitted", "Proposal submitted successfully!");

            // Reset form
            document.getElementById("proposalForm").reset();

            // Hide modal safely
            const modalElement = document.getElementById("proposalModal");
            const modalInstance = bootstrap.Modal.getOrCreateInstance(modalElement);
            modalInstance.hide();

            loadProposals();
        } else {
            showErrorAlert("Failed", "Failed to submit proposal: " + result.message);
        }
    } catch (error) {
        console.error("Error submitting proposal:", error);
        showErrorAlert("Error", "Error submitting proposal. Please try again.");
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
