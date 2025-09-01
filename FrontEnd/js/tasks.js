const TASK_API_BASE = "http://localhost:8085/api/v1/tasks";
const CATEGORY_API_URL = "http://localhost:8085/api/v1/task-categories";
const PROPOSAL_API_URL = "http://localhost:8085/api/v1/proposals";

// Get token, role and email from localStorage
const token = localStorage.getItem("token");
const role = localStorage.getItem("role");
const email = localStorage.getItem("email");

const taskTableBody = document.getElementById("taskTableBody");
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
    taskTableBody.innerHTML = "";

    tasks.forEach(task => {
        const tr = document.createElement("tr");

        let actionButtons = "";

        if (role === "CLIENT") {
            actionButtons = `
                <button class="btn btn-sm btn-warning" onclick="editTask(${task.id})">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="btn btn-sm btn-danger" onclick="deleteTask(${task.id})">
                    <i class="fas fa-trash"></i>
                </button>
            `;
        } else if (role === "ADMIN") {
            actionButtons = `
                <button class="btn btn-sm btn-danger" onclick="deleteTask(${task.id})">
                    <i class="fas fa-trash"></i>
                </button>
            `;
        } else if (role === "FREELANCER") {
            // Check if a proposal exists for this task
            const hasProposed = freelancerProposals.some(p => p.taskId === task.id);

            if (hasProposed) {
                actionButtons = `<span class="badge bg-success">Proposal Sent</span>`;
            } else {
                actionButtons = `<button class="btn btn-sm btn-outline-primary" onclick="openProposalModal(${task.id})">
                    <i class="fas fa-paper-plane"></i> Propose</button>`;
            }
        }

        tr.innerHTML = `
            <td>${task.id}</td>
            <td>${task.title}</td>
            <td>${task.description}</td>
            <td>${task.taskCategoryName}</td>
            <td>${getStatusBadge(task.status)}</td>
            <td>${task.deadline}</td>
            <td>${actionButtons}</td>
        `;

        taskTableBody.appendChild(tr);
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
            return `<span class="badge bg-warning text-dark">OPEN</span>`;
        case "IN_PROGRESS":
            return `<span class="badge bg-info text-dark">IN PROGRESS</span>`;
        case "COMPLETED":
            return `<span class="badge bg-success">COMPLETED</span>`;
        default:
            return `<span class="badge bg-secondary">${status}</span>`;
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
