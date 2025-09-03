const TASK_API_BASE = "http://localhost:8085/api/v1/tasks";
const CATEGORY_API_URL = "http://localhost:8085/api/v1/task-categories";
const PROPOSAL_API_URL = "http://localhost:8085/api/v1/proposals";

// Get token, role and email from localStorage
const token = localStorage.getItem("token");
const role = localStorage.getItem("role");
const email = localStorage.getItem("email");

const taskCardContainer = document.getElementById("taskCardContainer");
const taskForm = document.getElementById("taskForm");

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
    if (!response.ok) throw new Error(result.data || "API Error");
    return result.data;
}

// ===================== Initial Load =====================
document.addEventListener('DOMContentLoaded', function() {
    populateCategories().then(loadTasks);

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
});

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

        let freelancerProposals = [];
        if (role === "FREELANCER") {
            const userId = Number(localStorage.getItem("userId"));
            freelancerProposals = await apiCall(`${PROPOSAL_API_URL}/freelancer/${userId}`);
        }

        renderTasks(tasks, freelancerProposals);
    } catch (error) {
        console.error("Error loading tasks:", error.message);
    }
}

// ===================== Render Tasks =====================
function renderTasks(tasks, freelancerProposals = []) {
    taskCardContainer.innerHTML = "";

    // Create a map of tasks with their accepted proposals
    const taskAssignmentMap = {};
    freelancerProposals.forEach(proposal => {
        if (proposal.status === "ACCEPTED") {
            taskAssignmentMap[proposal.taskId] = proposal;
        }
    });

    tasks.forEach(task => {
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
        } else if (role === "ADMIN") {
            actionButtons = `
                <button class="btn btn-danger" onclick="deleteTask(${task.id})">
                    <i class="fas fa-trash"></i> Delete
                </button>
            `;
        } else if (role === "FREELANCER") {
            const currentUserId = Number(localStorage.getItem("userId"));
            const hasProposed = freelancerProposals.some(p => p.taskId === task.id);

            // Check if current user has an accepted proposal for this task
            const acceptedProposal = taskAssignmentMap[task.id];
            const isAssigned = acceptedProposal && acceptedProposal.freelancerId === currentUserId;

            console.log("Task:", task.id, "Assigned to me:", isAssigned, "Status:", task.status);

            if (hasProposed) {
                if (isAssigned) {
                    actionButtons = `<span class="badge bg-success fs-6 px-3 py-2">Assigned to You</span>`;
                } else {
                    actionButtons = `<span class="badge fs-6 px-3 py-2" style="background-color: #44484d">Proposal Sent</span>`;
                }
            } else {
                actionButtons = `
                    <button class="btn btn-outline-primary" onclick="openProposalModal(${task.id})">
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
                    <div class="d-flex justify-content-end gap-2">
                        ${actionButtons}
                    </div>
                </div>
            </div>
        `;

        taskCardContainer.appendChild(card);
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
            alert("Task created successfully!");
            taskForm.reset();
            bootstrap.Modal.getInstance(document.getElementById("newTaskModal")).hide();
            loadTasks();
        } catch (error) {
            console.error("Error creating task:", error.message);
        }
    });
}

// ===================== Delete Task =====================
async function deleteTask(taskId) {
    if (!confirm("Are you sure you want to delete this task?")) return;
    try {
        await apiCall(`${TASK_API_BASE}/${taskId}`, "DELETE");
        alert("Task deleted successfully!");
        loadTasks();
    } catch (error) {
        console.error("Error deleting task:", error.message);
    }
}

// ===================== Edit Task =====================
async function editTask(taskId) {
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
}

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

        alert("Task updated successfully!");
        bootstrap.Modal.getInstance(document.getElementById("editTaskModal")).hide();
        loadTasks();
    } catch (error) {
        console.error("Error updating task:", error.message);
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

            true,
                // Send proposal to backend
                await apiCall(PROPOSAL_API_URL, "POST", proposalData);

            alert("Proposal submitted successfully!");
            proposalForm.reset();
            bootstrap.Modal.getInstance(document.getElementById("proposalModal")).hide();

            // Refresh task list so button changes
            loadTasks();

        } catch (error) {
            console.error("Error submitting proposal:", error.message);
            alert("Failed to submit proposal: " + error.message);
        }
    });
}

// ===================== Open Complete Task Modal =====================
function openCompleteTaskModal(taskId) {
    document.getElementById("completeTaskId").value = taskId;
    const modal = new bootstrap.Modal(document.getElementById("completeTaskModal"));
    modal.show();
}

// ===================== Submit Work =====================
async function submitWork() {
    const taskId = document.getElementById("completeTaskId").value;
    const workUrl = document.getElementById("workUrl").value;

    if (!workUrl) {
        alert("Please provide a work URL");
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
            alert("Error: No freelancer is assigned to this task");
            return;
        }

        if (assignedFreelancerId !== currentUserId) {
            alert("Error: You are not assigned to this task. Assigned freelancer ID: " + assignedFreelancerId);
            return;
        }

        if (task.status !== "IN_PROGRESS") {
            alert("Error: Task is not in progress. Current status: " + task.status);
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
            alert("Work submitted successfully! The client will review your work.");
            bootstrap.Modal.getInstance(document.getElementById("completeTaskModal")).hide();
            loadTasks();
        } else {
            alert("Failed to submit work: " + (result.message || "Unknown error"));
        }
    } catch (error) {
        console.error("Error submitting work:", error);
        alert("Error submitting work. Please try again later.");
    }
}
