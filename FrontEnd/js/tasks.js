const API_BASE_URL = "http://localhost:8085/api/v1/tasks"; // backend endpoint
const CATEGORY_API_URL = "http://localhost:8085/api/v1/task-categories"; // backend endpoint for categories

let currentUser = {
    id: localStorage.getItem("userId") || 1,
    role: localStorage.getItem("userRole") || "CLIENT"  // CLIENT | FREELANCER | ADMIN
};

let tasks = [];

document.addEventListener("DOMContentLoaded", () => {
    loadTasks();
    populateCategories();

    // Attach event listener for creating task
    const taskForm = document.getElementById("taskForm");
    if (taskForm) {
        taskForm.addEventListener("submit", createTask);
    }
});

// Load all tasks
async function loadTasks() {
    try {
        const response = await fetch(API_BASE_URL, {
            headers: {
                "Authorization": "Bearer " + localStorage.getItem("token")
            }
        });

        const result = await response.json();
        tasks = result.data || [];
        populateTasksTable();
    } catch (error) {
        console.error("Error loading tasks:", error);
    }
}

// Create Task
async function createTask(e) {
    e.preventDefault();

    const newTask = {
        title: document.getElementById("taskTitle").value,
        description: document.getElementById("taskDescription").value,
        deadline: document.getElementById("taskDeadline").value,
        clientId: currentUser.id,
        taskCategoryName: document.getElementById("taskCategory").value
    };

    try {
        const response = await fetch(API_BASE_URL, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": "Bearer " + localStorage.getItem("token")
            },
            body: JSON.stringify(newTask)
        });

        const result = await response.json();
        if (result.code === 201) {
            alert("Task created successfully!");
            document.getElementById("taskForm").reset();
            bootstrap.Modal.getInstance(document.getElementById("newTaskModal")).hide();
            loadTasks();
        } else {
            alert("Failed: " + result.message);
        }
    } catch (error) {
        console.error("Error creating task:", error);
    }
}

// Delete Task
async function deleteTask(taskId) {
    if (!confirm("Are you sure you want to delete this task?")) return;

    try {
        const response = await fetch(`${API_BASE_URL}/${taskId}`, {
            method: "DELETE",
            headers: {
                "Authorization": "Bearer " + localStorage.getItem("token")
            }
        });

        const result = await response.json();
        if (result.code === 200) {
            alert("Task deleted successfully!");
            loadTasks();
        } else {
            alert("Failed: " + result.message);
        }
    } catch (error) {
        console.error("Error deleting task:", error);
    }
}

// Populate Categories
async function populateCategories() {
    try {
        const response = await fetch(CATEGORY_API_URL, {
            headers: {
                "Authorization": "Bearer " + localStorage.getItem("token")
            }
        });

        const result = await response.json();
        const categories = result.data || [];

        const select = document.getElementById("taskCategory");
        if (!select) return;

        select.innerHTML = '<option value="">Select category</option>';
        categories.forEach(cat => {
            const option = document.createElement("option");
            option.value = cat.name;
            option.textContent = cat.name;
            select.appendChild(option);
        });
    } catch (error) {
        console.error("Error loading categories:", error);
    }
}

// Populate Tasks Table
function populateTasksTable() {
    const tableBody = document.getElementById("taskTableBody");
    if (!tableBody) return;

    tableBody.innerHTML = "";

    tasks.forEach(task => {
        const row = document.createElement("tr");

        // Status badge color
        let statusClass = "badge bg-secondary";
        if (task.status === "OPEN") statusClass = "badge bg-success";
        else if (task.status === "IN_PROGRESS") statusClass = "badge bg-primary";
        else if (task.status === "COMPLETED") statusClass = "badge bg-info";

        row.innerHTML = `
            <td>${task.id}</td>
            <td>${task.title}</td>
            <td>${task.description}</td>
            <td>${task.taskCategoryName}</td>
            <td><span class="${statusClass}">${task.status}</span></td>
            <td>${formatDate(task.deadline)}</td>
            <td>${renderActionButtons(task)}</td>
        `;

        tableBody.appendChild(row);
    });
}

// Render appropriate action buttons based on user role
function renderActionButtons(task) {
    if (currentUser.role === "FREELANCER") {
        return `
            <button class="btn btn-sm btn-outline-primary" onclick="openProposalModal(${task.id})">
                <i class="fas fa-paper-plane"></i>
            </button>
        `;
    } else if (currentUser.role === "CLIENT") {
        return `
            <button class="btn btn-sm btn-outline-secondary me-1" onclick="editTask(${task.id})">
                <i class="fas fa-edit"></i>
            </button>
            <button class="btn btn-sm btn-outline-danger" onclick="deleteTask(${task.id})">
                <i class="fas fa-trash"></i>
            </button>
        `;
    }
    return "";
}

// Helpers
function formatDate(dateStr) {
    if (!dateStr) return "-";
    const date = new Date(dateStr);
    return date.toISOString().split("T")[0]; // yyyy-mm-dd
}

// Placeholder -> open proposal modal
function openProposalModal(taskId) {
    document.getElementById("proposalTaskId").value = taskId;
    const modal = new bootstrap.Modal(document.getElementById("proposalModal"));
    modal.show();
}

// Placeholder -> edit task (you can implement modal form prefill here)
function editTask(taskId) {
    alert("Edit task " + taskId + " (to be implemented)");
}
