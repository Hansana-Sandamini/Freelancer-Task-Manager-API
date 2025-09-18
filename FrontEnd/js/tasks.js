const TASK_API_BASE = "http://localhost:8085/api/v1/tasks";
const CATEGORY_API_URL = "http://localhost:8085/api/v1/task-categories";
const PROPOSAL_API_URL = "http://localhost:8085/api/v1/proposals";
const REVIEW_API_URL = "http://localhost:8085/api/v1/reviews";
const PAYMENT_API_BASE = "http://localhost:8085/api/v1/payments";
const STRIPE_PUBLISHABLE_KEY = "pk_test_51S6ZBnFQgJWoxJFed40OYrsDWSXufK1kJL2BOb1miDMmeGJUmCxeuMQZh7MAgGvTo3qml5nmqJ45xBYZ8ZNyVHIX001bXmCRhQ";
import { openChat } from './chat.js';
import { showSuccessAlert, showErrorAlert, showConfirmAlert, showWarningAlert } from './alert-util.js';

// Get token, role, and email from localStorage
const token = localStorage.getItem("token");
const role = localStorage.getItem("role");
const email = localStorage.getItem("email");

const taskCardContainer = document.getElementById("taskCardContainer");
const taskForm = document.getElementById("taskForm");
const paginationContainer = document.getElementById("pagination");
const categoryFilter = document.getElementById("categoryFilter");
const statusFilter = document.getElementById("statusFilter");
const dateFilter = document.getElementById("dateFilter");
const applyFiltersBtn = document.getElementById("applyFilters");
const clearFiltersBtn = document.getElementById("clearFilters");
const refreshBtn = document.getElementById("btn-refresh");

// Pagination variables
let currentPage = 1;
const tasksPerPage = 4;
let totalTasks = 0;
let allTasks = [];

// Filter variables
let currentFilters = {
    category: '',
    status: '',
    date: ''
};

// Helper function for API calls with JWT
async function apiCall(url, method = "GET", body = null) {
    const options = {
        method,
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`
        }
    };
    if (body) options.body = JSON.stringify(body);

    const response = await fetch(url, options);
    const result = await response.json();
    if (!response.ok) throw new Error(result.message || result.data || "API Error");
    return result.data;
}

// ===================== Initial Load =====================
document.addEventListener('DOMContentLoaded', function() {
    populateCategories().then(() => {
        loadTasks();
        setupEventListeners();
    });

    // Hide New-Task button for Admins and Freelancers
    const newTaskButton = document.getElementById("btn-new-task");
    if (role === "ADMIN" || role === "FREELANCER") {
        newTaskButton.style.display = "none";
    }

    // Add event listener for complete task form
    const completeTaskForm = document.getElementById("completeTaskForm");
    if (completeTaskForm) {
        completeTaskForm.addEventListener("submit", function(e) {
            e.preventDefault();
            submitWork();
        });
    }

    // Add event listener for review form
    const reviewForm = document.getElementById("reviewForm");
    if (reviewForm) {
        reviewForm.addEventListener("submit", function(e) {
            e.preventDefault();
            submitReview();
        });
    }

    // Initialize star rating
    initStarRating();

    // Add payment button event listener
    taskCardContainer.addEventListener('click', (e) => {
        const payButton = e.target.closest('.pay-button');
        if (payButton) {
            const taskId = payButton.getAttribute('data-task-id');
            initiatePayment(taskId);
        }
    });
});

// Setup event listeners for filters and pagination
function setupEventListeners() {
    applyFiltersBtn.addEventListener('click', applyFilters);
    clearFiltersBtn.addEventListener('click', clearFilters);
    refreshBtn.addEventListener('click', refreshTasks);
}

// ===================== Payment Functions =====================
async function initiatePayment(taskId) {
    try {
        showPaymentLoading(true);

        const response = await fetch(`${PAYMENT_API_BASE}/create-checkout-session/${taskId}`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`
            }
        });

        const result = await response.json();

        if (result.code === 200) {
            // Redirect to Stripe Checkout
            const stripe = Stripe(STRIPE_PUBLISHABLE_KEY);
            const { error } = await stripe.redirectToCheckout({
                sessionId: result.data
            });

            if (error) {
                showPaymentError("Payment initialization failed: " + error.message);
            }
        } else {
            showPaymentError("Failed to initiate payment: " + result.message);
        }
    } catch (error) {
        console.error("Error initiating payment:", error);
        showPaymentError("Error initiating payment. Please try again.");
    } finally {
        showPaymentLoading(false);
    }
}

function showPaymentLoading(show) {
    let loadingElement = document.getElementById('paymentLoading');

    if (!loadingElement) {
        loadingElement = document.createElement('div');
        loadingElement.id = 'paymentLoading';
        loadingElement.className = 'payment-loading';
        loadingElement.innerHTML = `
            <div class="payment-loading-content">
                <div class="spinner-border text-primary" role="status">
                    <span class="visually-hidden">Loading...</span>
                </div>
                <p>Processing payment...</p>
            </div>
        `;
        document.body.appendChild(loadingElement);
    }

    loadingElement.style.display = show ? 'flex' : 'none';
}

function showPaymentError(message) {
    // Remove any existing error modal
    const existingModal = document.getElementById('paymentErrorModal');
    if (existingModal) {
        existingModal.remove();
    }

    // Create error modal
    const errorModal = document.createElement('div');
    errorModal.id = 'paymentErrorModal';
    errorModal.className = 'modal fade';
    errorModal.innerHTML = `
        <div class="modal-dialog">
            <div class="modal-content">
                <div class="modal-header bg-danger text-white">
                    <h5 class="modal-title">Payment Error</h5>
                    <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                </div>
                <div class="modal-body">
                    <p>${message}</p>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Close</button>
                </div>
            </div>
        </div>
    `;

    document.body.appendChild(errorModal);

    // Show the modal
    const modal = new bootstrap.Modal(errorModal);
    modal.show();

    // Remove modal from DOM when hidden
    errorModal.addEventListener('hidden.bs.modal', function () {
        errorModal.remove();
    });
}

// ===================== Filter Functions =====================
function applyFilters() {
    currentFilters = {
        category: categoryFilter.value,
        status: statusFilter.value,
        date: dateFilter.value
    };

    currentPage = 1; // Reset to first page when filters change
    renderTasksWithPagination();
}

function clearFilters() {
    categoryFilter.value = '';
    statusFilter.value = '';
    dateFilter.value = '';

    currentFilters = {
        category: '',
        status: '',
        date: ''
    };

    currentPage = 1;
    renderTasksWithPagination();
}

function refreshTasks() {
    loadTasks();
}

// Filter tasks based on current filters
function filterTasks(tasks) {
    return tasks.filter(task => {
        // Category filter
        if (currentFilters.category && task.taskCategoryName !== currentFilters.category) {
            return false;
        }

        // Status filter
        if (currentFilters.status && task.status !== currentFilters.status) {
            return false;
        }

        // Date filter
        if (currentFilters.date) {
            const days = parseInt(currentFilters.date);
            const taskDate = new Date(task.createdAt || task.deadline);
            const filterDate = new Date();
            filterDate.setDate(filterDate.getDate() - days);

            if (taskDate < filterDate) {
                return false;
            }
        }

        return true;
    });
}

// ===================== Pagination Functions =====================
function renderPagination(totalTasks) {
    const totalPages = Math.ceil(totalTasks / tasksPerPage);
    paginationContainer.innerHTML = '';

    if (totalPages <= 1) return;

    // Previous button
    const prevLi = document.createElement('li');
    prevLi.className = `page-item ${currentPage === 1 ? 'disabled' : ''}`;
    prevLi.innerHTML = `<a class="page-link" href="#" data-page="${currentPage - 1}">Previous</a>`;
    paginationContainer.appendChild(prevLi);

    // Page numbers
    for (let i = 1; i <= totalPages; i++) {
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
                renderTasksWithPagination();
            }
        }
    });
}

function getPaginatedTasks(tasks) {
    const startIndex = (currentPage - 1) * tasksPerPage;
    const endIndex = startIndex + tasksPerPage;
    return tasks.slice(startIndex, endIndex);
}

// ===================== Load Tasks =====================
async function loadTasks() {
    try {
        let tasks = [];
        if (role === "CLIENT") {
            const userId = localStorage.getItem("userId");
            tasks = await apiCall(`${TASK_API_BASE}/client/${userId}`);
        } else {
            tasks = await apiCall(TASK_API_BASE);
        }

        allTasks = tasks;
        totalTasks = tasks.length;

        currentPage = 1; // Reset to first page
        renderTasksWithPagination();

    } catch (error) {
        console.error("Error loading tasks:", error.message);
        alert("Error loading tasks: " + error.message);
    }
}

// Render tasks with pagination
function renderTasksWithPagination() {
    const filteredTasks = filterTasks(allTasks);
    const paginatedTasks = getPaginatedTasks(filteredTasks);

    // Update freelancer proposals and reviews for the current page
    loadTaskDetails(paginatedTasks);
}

// Load additional details for tasks (proposals, reviews)
async function loadTaskDetails(tasks) {
    try {
        let freelancerProposals = [];
        let freelancerRejectedProposals = [];
        let hasReviewedMap = {};

        if (role === "FREELANCER") {
            const userId = Number(localStorage.getItem("userId"));
            freelancerProposals = await apiCall(`${PROPOSAL_API_URL}/freelancer/${userId}`);

            // Filter out rejected proposals
            freelancerRejectedProposals = freelancerProposals.filter(
                proposal => proposal.status === "REJECTED"
            );
        }

        // For clients, check which tasks they've already reviewed
        if (role === "CLIENT") {
            const clientId = Number(localStorage.getItem("userId"));
            for (const task of tasks) {
                if (task.status === "COMPLETED" && task.freelancerId) {
                    try {
                        const hasReviewed = await apiCall(`${REVIEW_API_URL}/check/${clientId}/${task.id}`);
                        hasReviewedMap[task.id] = hasReviewed;
                    } catch (error) {
                        console.error(`Error checking review status for task ${task.id}:`, error);
                        hasReviewedMap[task.id] = false;
                    }
                }
            }
        }

        renderTasks(tasks, freelancerProposals, freelancerRejectedProposals, hasReviewedMap);

        // Update pagination with filtered count
        const filteredTasks = filterTasks(allTasks);
        renderPagination(filteredTasks.length);

    } catch (error) {
        console.error("Error loading task details:", error.message);
    }
}

// ===================== Render Tasks =====================
async function renderTasks(tasks, freelancerProposals = [], freelancerRejectedProposals = [], hasReviewedMap = {}) {
    taskCardContainer.innerHTML = "";

    if (tasks.length === 0) {
        taskCardContainer.innerHTML = `
            <div class="col-12 text-center py-5">
                <i class="fas fa-tasks fa-3x text-white mb-3"></i>
                <h4 class="text-white">No tasks found</h4>
                <p class="text-white">Try adjusting your filters or create a new task.</p>
            </div>
        `;
        return;
    }

    // Create a map of tasks with their accepted proposals
    const taskAssignmentMap = {};
    freelancerProposals.forEach(proposal => {
        if (proposal.status === "ACCEPTED") {
            taskAssignmentMap[proposal.taskId] = proposal;
        }
    });

    for (const task of tasks) {
        const card = document.createElement("div");
        card.className = "col";

        let actionButtons = "";

        if (role === "CLIENT") {
            actionButtons = `
                <button class="btn btn-warning me-2" onclick="editTask(${task.id})">
                    <i class="fas fa-edit"></i> Edit
                </button>
                <button class="btn btn-danger" onclick="deleteTask(${task.id})">
                    <i class="fas fa-trash"></i> Delete
                </button>
            `;

            // Add review button for completed tasks that haven't been reviewed yet
            if (task.status === "COMPLETED" && task.freelancerId && !hasReviewedMap[task.id]) {
                actionButtons += `
                    <button class="btn btn-info ms-2" onclick="openReviewModal(${task.id}, ${task.freelancerId})">
                        <i class="fas fa-star"></i> Review Freelancer
                    </button>
                `;
            }

            // Show if already reviewed
            if (task.status === "COMPLETED" && task.freelancerId && hasReviewedMap[task.id]) {
                actionButtons += `
                    <span class="badge bg-success ms-2">
                        <i class="fas fa-check"></i> Reviewed
                    </span>
                `;
            }

            // Add chat button if freelancer assigned task
            if (task.freelancerId || task.status === "IN_PROGRESS") {
                const receiverName = task.freelancerName || `Freelancer ${task.freelancerId}`;
                actionButtons += `
                    <button class="btn btn-outline-primary ms-2 chat-button" 
                            data-task-id="${task.id}" 
                            data-receiver-id="${task.freelancerId}" 
                            data-receiver-name="${receiverName}" 
                            title="Chat with Freelancer">
                        <i class="fas fa-comments"></i>
                    </button>
                `;

                // Check payment status and add pay button if needed
                let paymentStatus = '';
                let paymentButton = '';

                try {
                    const paymentResponse = await fetch(`${PAYMENT_API_BASE}/task/${task.id}`, {
                        headers: {
                            "Authorization": "Bearer " + localStorage.getItem("token")
                        }
                    });

                    if (paymentResponse.ok) {
                        const paymentResult = await paymentResponse.json();
                        if (paymentResult.code === 200 && paymentResult.data) {
                            const payment = paymentResult.data;

                            // Only show pay button if payment is pending
                            if (payment.paymentStatus === 'PENDING') {
                                paymentButton = `
                                    <button class="btn btn-primary pay-button" data-task-id="${task.id}">
                                        <i class="fas fa-credit-card"></i> Pay Now
                                    </button>
                                `;
                            }
                        }
                    }
                } catch (error) {
                    console.error("Error checking payment status:", error);
                }

                // If no payment record exists yet, show the pay button
                if (!paymentButton && task.freelancerId) {
                    paymentButton = `
                        <button class="btn btn-primary pay-button" data-task-id="${task.id}">
                            <i class="fas fa-credit-card"></i> Pay Now
                        </button>
                    `;
                }

                // Add the payment status and button to the action buttons
                actionButtons += paymentStatus + paymentButton;
            }

        } else if (role === "ADMIN") {
            actionButtons = `
                <button class="btn btn-danger" onclick="deleteTask(${task.id})">
                    <i class="fas fa-trash"></i> Delete
                </button>
            `;
        } else if (role === "FREELANCER") {
            const currentUserId = Number(localStorage.getItem("userId"));
            const hasProposed = freelancerProposals.some(p => p.taskId === task.id);

            // Check if current user has a rejected proposal for this task
            const hasRejectedProposal = freelancerRejectedProposals.some(
                p => p.taskId === task.id
            );

            // Check if current user has an accepted proposal for this task
            const acceptedProposal = taskAssignmentMap[task.id];
            const isAssigned = acceptedProposal && acceptedProposal.freelancerId === currentUserId;

            if (hasRejectedProposal) {
                actionButtons = `<span class="badge bg-danger fs-6 px-3 py-2">Proposal Rejected</span>`;
            } else if (hasProposed) {
                if (isAssigned) {
                    actionButtons = `<span class="badge bg-success fs-6 px-3 py-2">Assigned to You</span>`;
                } else {
                    actionButtons = `<span class="badge fs-6 px-3 py-2" style="background-color: #44484d">Proposal Sent</span>`;
                }
            } else {
                actionButtons = `
                    <button class="btn btn-outline-primary propose-button" data-task-id="${task.id}">
                        <i class="fas fa-paper-plane"></i> Propose
                    </button>`;
            }

            // Show work submission button for assigned tasks that are in progress
            if (isAssigned && task.status === "IN_PROGRESS") {
                actionButtons += `
                    <button class="btn btn-success ms-2" onclick="openCompleteTaskModal(${task.id})">
                        <i class="fas fa-check"></i> Submit Work
                    </button>
                `;
            }

            // Show status and work link for freelancer's tasks
            if (isAssigned) {
                actionButtons += `
                    <div class="mt-2">
                        <span class="badge bg-info text-dark">
                            <i class="fas fa-tasks"></i> ${task.status.replace('_', ' ')}
                        </span>
                    </div>
                `;

                if (task.workUrl) {
                    actionButtons += `
                        <div class="mt-2">
                            <a href="${task.workUrl}" target="_blank" class="btn btn-sm btn-outline-primary">
                                <i class="fas fa-external-link-alt"></i> View Submitted Work
                            </a>
                        </div>
                    `;
                }
            }

            // Add chat button if proposal is accepted
            if (isAssigned && task.clientId) {
                const clientName = task.clientName || `Client ${task.clientId}`;
                actionButtons += `
                    <button class="btn btn-outline-primary ms-2 chat-button" 
                            data-task-id="${task.id}" 
                            data-receiver-id="${task.clientId}" 
                            data-receiver-name="${clientName}" 
                            title="Chat with Client">
                        <i class="fas fa-comments"></i>
                    </button>
                `;
            }
        }

        card.innerHTML = `
            <div class="card h-100 shadow-sm">
                <div class="card-body">
                    <h5 class="card-title">${task.title}</h5>
                    <p class="card-text"><strong>Category:</strong> ${task.taskCategoryName}</p>
                    <p class="card-text">${task.description}</p>
                    <p class="card-text"><strong>Status:</strong> ${getStatusBadge(task.status)}</p>
                    <p class="card-text"><strong>Deadline:</strong> ${task.deadline}</p>
                    ${task.workUrl ? `<p class="card-text"><strong>Work URL:</strong> <a href="${task.workUrl}" target="_blank" 
                        style="background-color: #7082bb; color: white; padding: 10px; text-decoration: none; border-radius: 8px">
                            View Work</a></p>` : ''}
                    ${task.freelancerId && role === "CLIENT" ? `<p class="card-text"><strong>Freelancer ID:</strong> ${task.freelancerId}</p>` : ''}
                    <div class="d-flex justify-content-end gap-2">
                        ${actionButtons}
                    </div>
                </div>
            </div>
        `;

        taskCardContainer.appendChild(card);
    }

    // Add event listeners for propose and chat buttons
    taskCardContainer.addEventListener('click', (e) => {
        const proposeButton = e.target.closest('.propose-button');
        const chatButton = e.target.closest('.chat-button');

        if (proposeButton) {
            const taskId = proposeButton.getAttribute('data-task-id');
            console.log("Opening proposal modal for taskId:", taskId);
            openProposalModal(taskId);
        }

        if (chatButton) {
            const taskId = chatButton.getAttribute('data-task-id');
            const receiverId = chatButton.getAttribute('data-receiver-id');
            const receiverName = chatButton.getAttribute('data-receiver-name');
            console.log("Opening chat for taskId:", taskId, "receiverId:", receiverId);
            openChat(taskId, receiverId, receiverName);
        }
    });
}

// ===================== Create Task =====================
if (taskForm) {
    taskForm.addEventListener("submit", async e => {
        e.preventDefault();
        try {
            const newTask = {
                title: document.getElementById("taskTitle").value,
                description: document.getElementById("taskDescription").value,
                deadline: document.getElementById("taskDeadline").value,
                taskCategoryName: document.getElementById("taskCategory").value,
                clientId: Number(localStorage.getItem("userId"))
            };
            await apiCall(TASK_API_BASE, "POST", newTask);
            showSuccessAlert("Success", "Task created successfully!");
            taskForm.reset();
            bootstrap.Modal.getInstance(document.getElementById("newTaskModal")).hide();
            loadTasks();
        } catch (error) {
            console.error("Error creating task:", error.message);
            showErrorAlert("Failed", "Error creating task: " + error.message);
        }
    });
}

// ===================== Delete Task =====================
async function deleteTask(taskId) {
    const confirmed = await showConfirmAlert("Confirm Delete", "Are you sure you want to delete this task?");
    if (!confirmed) return;

    try {
        const response = await fetch(`${TASK_API_BASE}/${taskId}`, {
            method: "DELETE",
            headers: {
                "Authorization": "Bearer " + localStorage.getItem("token")
            }
        });


        if (response.ok) { // Covers 200-299, including 204
            let result = { code: response.status };
            const contentType = response.headers.get('content-type');
            if (contentType && contentType.includes('application/json')) {
                result = await response.json();
            }

            // Accept 200 or 204 as success
            if (result.code === 200 || response.status === 204) {
                showSuccessAlert("Deleted", "Task deleted successfully!");
                loadTasks();
                return;
            }
        }

        // Error handling
        let errorMsg = 'Unknown error';
        try {
            const errorResult = await response.json();
            errorMsg = errorResult.message || errorResult.data || 'Server error';
        } catch {
            errorMsg = `HTTP ${response.status}: ${response.statusText}`;
            // Customize FK constraint error
            if (errorMsg.includes('foreign key constraint')) {
                errorMsg = 'Cannot delete task because it has associated records (e.g., notifications, proposals, or payments).';
            }
        }
        throw new Error(errorMsg);

    } catch (error) {
        console.error("Error deleting task:", error.message);
        showErrorAlert("Failed", `Failed to delete task: ${error.message}`);
    }
}
window.deleteTask = deleteTask;

// ===================== Edit Task =====================
async function editTask(taskId) {
    try {
        const task = await apiCall(`${TASK_API_BASE}/${taskId}`);
        if (!task) return alert("Task not found");

        await populateCategories();  // categories loaded first

        document.getElementById("editTaskId").value = task.id;
        document.getElementById("editTaskTitle").value = task.title;
        document.getElementById("editTaskDescription").value = task.description;
        document.getElementById("editTaskDeadline").value = task.deadline;
        document.getElementById("editTaskCategory").value = task.taskCategoryName;

        const modal = new bootstrap.Modal(document.getElementById("editTaskModal"));
        modal.show();
    } catch (error) {
        console.error("Error loading task:", error.message);
        alert("Error loading task: " + error.message);
    }
}
window.editTask = editTask;

// Handle form submit
document.getElementById("editTaskForm").addEventListener("submit", async e => {
    e.preventDefault();
    try {
        const taskId = document.getElementById("editTaskId").value;

        const updatedTask = {
            id: taskId,
            title: document.getElementById("editTaskTitle").value,
            description: document.getElementById("editTaskDescription").value,
            deadline: document.getElementById("editTaskDeadline").value,
            taskCategoryName: document.getElementById("editTaskCategory").value,
            clientId: Number(localStorage.getItem("userId"))
        };

        await apiCall(`${TASK_API_BASE}/${taskId}`, "PUT", updatedTask);

        showSuccessAlert("Updated", "Task updated successfully!");
        bootstrap.Modal.getInstance(document.getElementById("editTaskModal")).hide();
        loadTasks();
    } catch (error) {
        console.error("Error updating task:", error.message);
        showErrorAlert("Failed", "Error updating task: " + error.message);
    }
});

// =================== Populate Categories ===================
async function populateCategories() {
    try {
        const response = await fetch(CATEGORY_API_URL, {
            headers: { "Authorization": "Bearer " + localStorage.getItem("token") }
        });

        const result = await response.json();
        const categories = result.data || [];

        // === For Create Task Modal ===
        const selectCreate = document.getElementById("taskCategory");
        if (selectCreate) {
            selectCreate.innerHTML = '<option value="">Select category</option>';
            categories.forEach(cat => {
                const option = document.createElement("option");
                option.value = cat.name;
                option.textContent = cat.name;
                selectCreate.appendChild(option);
            });
        }

        // === For Edit Task Modal ===
        const selectEdit = document.getElementById("editTaskCategory");
        if (selectEdit) {
            selectEdit.innerHTML = '<option value="">Select category</option>';
            categories.forEach(cat => {
                const option = document.createElement("option");
                option.value = cat.name;
                option.textContent = cat.name;
                selectEdit.appendChild(option);
            });
        }

        // === For Category Filter ===
        const selectFilter = document.getElementById("categoryFilter");
        if (selectFilter) {
            selectFilter.innerHTML = '<option value="">All Categories</option>';
            categories.forEach(cat => {
                const option = document.createElement("option");
                option.value = cat.name;
                option.textContent = cat.name;
                selectFilter.appendChild(option);
            });
        }

    } catch (error) {
        console.error("Error loading categories:", error);
        alert("Error loading categories: " + error.message);
    }
}

// ===================== Status Badges =====================
function getStatusBadge(status) {
    switch (status) {
        case "OPEN":
            return `<span class="badge bg-warning text-dark fs-6 px-3 py-2">OPEN</span>`;
        case "IN_PROGRESS":
            return `<span class="badge bg-info text-dark fs-6 px-3 py-2">IN PROGRESS</span>`;
        case "COMPLETED":
            return `<span class="badge bg-success fs-6 px-3 py-2">COMPLETED</span>`;
        default:
            return `<span class="badge bg-secondary fs-6 px-3 py-2">${status}</span>`;
    }
}

// ===================== Freelancer Proposal =====================
function openProposalModal(taskId) {
    document.getElementById("proposalTaskId").value = taskId;
    const modal = new bootstrap.Modal(document.getElementById("proposalModal"));
    modal.show();
}

// ===================== Proposal Submission =====================
const proposalForm = document.getElementById("proposalForm");

if (proposalForm) {
    proposalForm.addEventListener("submit", async e => {
        e.preventDefault();

        try {
            const proposalData = {
                coverLetter: document.getElementById("proposalCoverLetter").value,
                bidAmount: parseFloat(document.getElementById("proposalBid").value),
                status: document.getElementById("proposalStatus").value,  // PENDING
                taskId: Number(document.getElementById("proposalTaskId").value),
                freelancerId: Number(localStorage.getItem("userId"))
            };

            // Send proposal to backend
            await apiCall(PROPOSAL_API_URL, "POST", proposalData);

            showSuccessAlert("Success", "Proposal submitted successfully!");
            proposalForm.reset();

            const modalElement = document.getElementById("proposalModal");
            const modalInstance = bootstrap.Modal.getOrCreateInstance(modalElement);
            modalInstance.hide();

            // Refresh task list so button changes
            loadTasks();

        } catch (error) {
            console.error("Error submitting proposal:", error.message);
            alert("Failed to submit proposal: " + error.message);
        }
    });
}

// ===================== Open Complete Task Modal =====================
window.openCompleteTaskModal = function(taskId) {
    document.getElementById("completeTaskId").value = taskId;
    const modal = new bootstrap.Modal(document.getElementById("completeTaskModal"));
    modal.show();
}

// ===================== Submit Work =====================
async function submitWork() {
    const taskId = document.getElementById("completeTaskId").value;
    const workUrl = document.getElementById("workUrl").value;

    if (!workUrl) {
        showWarningAlert("Warning", "Please provide a work URL");
        return;
    }

    try {
        // First verify the task assignment
        const taskResponse = await fetch(`${TASK_API_BASE}/${taskId}`, {
            headers: {
                "Authorization": "Bearer " + localStorage.getItem("token")
            }
        });

        const taskResult = await taskResponse.json();
        const task = taskResult.data;

        const currentUserId = Number(localStorage.getItem("userId"));
        const assignedFreelancerId = task.freelancerId;

        console.log("Assignment Check:", {
            taskId: taskId,
            currentUserId: currentUserId,
            assignedFreelancerId: assignedFreelancerId,
            status: task.status
        });

        if (!assignedFreelancerId) {
            showErrorAlert("Error", "No freelancer is assigned to this task");
            return;
        }

        if (assignedFreelancerId !== currentUserId) {
            showErrorAlert("Error", "You are not assigned to this task. Assigned freelancer ID: " + assignedFreelancerId);
            return;
        }

        if (task.status !== "IN_PROGRESS") {
            showWarningAlert("Warning", "Task is not in progress. Current status: " + task.status);
            return;
        }

        // Now submit the work
        const response = await fetch(`${TASK_API_BASE}/${taskId}/submit-work`, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json",
                "Authorization": "Bearer " + localStorage.getItem("token")
            },
            body: JSON.stringify({ workUrl: workUrl })
        });

        const result = await response.json();

        if (result.code === 200) {
            showSuccessAlert("Success", "Work submitted successfully! The client will review your work.");
            bootstrap.Modal.getInstance(document.getElementById("completeTaskModal")).hide();
            loadTasks();
        } else {
            showErrorAlert("Failed", "Failed to submit work: " + (result.message || "Unknown error"));
        }
    } catch (error) {
        console.error("Error submitting work:", error);
        showErrorAlert("Error", "Error submitting work. Please try again later.");
    }
}

// ===================== Open Review Modal =====================
window.openReviewModal = function(taskId, freelancerId) {
    document.getElementById("reviewTaskId").value = taskId;
    document.getElementById("reviewFreelancerId").value = freelancerId;

    // Reset form
    document.getElementById("ratingValue").value = "";
    document.getElementById("reviewComment").value = "";

    // Reset stars
    const stars = document.querySelectorAll('.rating-stars i');
    stars.forEach(star => star.classList.remove('active'));

    const modal = new bootstrap.Modal(document.getElementById("reviewModal"));
    modal.show();
};

// ===================== Submit Review =====================
async function submitReview() {
    const taskId = document.getElementById("reviewTaskId").value;
    const freelancerId = document.getElementById("reviewFreelancerId").value;
    const rating = document.getElementById("ratingValue").value;
    const comment = document.getElementById("reviewComment").value;

    if (!rating) {
        showWarningAlert("Warning", "Please provide a rating");
        return;
    }

    if (!comment) {
        showWarningAlert("Warning", "Please provide a comment");
        return;
    }

    try {
        const reviewData = {
            taskId: Number(taskId),
            freelancerId: Number(freelancerId),
            clientId: Number(localStorage.getItem("userId")),
            rating: Number(rating),
            comment: comment
        };

        await apiCall(REVIEW_API_URL, "POST", reviewData);

        showSuccessAlert("Success", "Review submitted successfully!");
        bootstrap.Modal.getInstance(document.getElementById("reviewModal")).hide();
        loadTasks();
    } catch (error) {
        console.error("Error submitting review:", error.message);
        showErrorAlert("Failed to submit review: ", error.message);
    }
}

// Initialize star rating functionality
function initStarRating() {
    const stars = document.querySelectorAll('.rating-stars i');
    stars.forEach(star => {
        star.addEventListener('click', function() {
            const rating = parseInt(this.getAttribute('data-rating'));
            document.getElementById('ratingValue').value = rating;

            // Reset all stars
            stars.forEach(s => s.classList.remove('text-warning'));

            // Highlight selected and previous stars
            stars.forEach(s => {
                if (parseInt(s.getAttribute('data-rating')) <= rating) {
                    s.classList.add('text-warning');
                }
            });
        });
    });
}
