const TASK_API_BASE = "http://localhost:8085/api/v1/tasks";
const PROPOSAL_API_URL = "http://localhost:8085/api/v1/proposals";
const USER_API_URL = "http://localhost:8085/api/v1/users";

// Get token, role, and email from localStorage
const token = localStorage.getItem("token");
const role = localStorage.getItem("role");
const email = localStorage.getItem("email");
const userId = Number(localStorage.getItem("userId"));

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
document.addEventListener("DOMContentLoaded", () => {
    loadStats(); // Load stats first
});

// ===================== Load Stats =====================
async function loadStats() {
    try {
        if (role === "ADMIN") {
            // Fetch user count
            const userCount = await apiCall(`${USER_API_URL}/count`);
            document.getElementById("allUsersCount").textContent = userCount || 0;

            // Fetch task counts
            const taskCounts = await apiCall(`${TASK_API_BASE}/count`);
            document.getElementById("allTasksCount").textContent = taskCounts.allTasks || 0;
            document.getElementById("completedTasksCount").textContent = taskCounts.completedTasks || 0;

            // Fetch proposal counts
            const proposalCounts = await apiCall(`${PROPOSAL_API_URL}/count`);
            document.getElementById("allProposalsCount").textContent = proposalCounts.allProposals || 0;
            document.getElementById("acceptedProposalsCount").textContent = proposalCounts.acceptedProposals || 0;
            document.getElementById("rejectedProposalsCount").textContent = proposalCounts.rejectedProposals || 0;

        } else if (role === "CLIENT") {
            // Fetch client task counts
            const taskCounts = await apiCall(`${TASK_API_BASE}/count/client/${userId}`);
            document.getElementById("myTasksCount").textContent = taskCounts.myTasks || 0;
            document.getElementById("completedTasksCount").textContent = taskCounts.completedTasks || 0;

            // Fetch proposal counts for client's tasks
            const proposalCounts = await apiCall(`${PROPOSAL_API_URL}/count/client/${userId}`);
            document.getElementById("allProposalsCount").textContent = proposalCounts.allProposals || 0;
            document.getElementById("acceptedProposalsCount").textContent = proposalCounts.acceptedProposals || 0;
            document.getElementById("rejectedProposalsCount").textContent = proposalCounts.rejectedProposals || 0;

        } else if (role === "FREELANCER") {
            // Fetch freelancer task and proposal counts
            const taskCounts = await apiCall(`${TASK_API_BASE}/count/freelancer/${userId}`);
            document.getElementById("activeTasksCount").textContent = taskCounts.activeTasks || 0;
            document.getElementById("completedTasksCount").textContent = taskCounts.completedTasks || 0;

            const proposalCounts = await apiCall(`${PROPOSAL_API_URL}/count/freelancer/${userId}`);
            document.getElementById("myProposalsCount").textContent = proposalCounts.myProposals || 0;
            document.getElementById("acceptedProposalsCount").textContent = proposalCounts.acceptedProposals || 0;
            document.getElementById("rejectedProposalsCount").textContent = proposalCounts.rejectedProposals || 0;

            // Fetch earnings
            const earnings = await apiCall(`${PROPOSAL_API_URL}/earnings/freelancer/${userId}`);
            document.getElementById("earningsCount").textContent = `Rs.${(earnings || 0).toFixed(2)}`;
        }
    } catch (error) {
        console.error("Error loading stats:", error.message);
        // Set all counts to 0 on error
        document.querySelectorAll('[id$="Count"]').forEach(el => {
            if (el.id !== "earningsCount") {
                el.textContent = "0";
            }
        });
        if (document.getElementById("earningsCount")) {
            document.getElementById("earningsCount").textContent = "Rs.0.00";
        }
    }
}
