const TASK_API_BASE = "http://localhost:8085/api/v1/tasks";
const PROPOSAL_API_URL = "http://localhost:8085/api/v1/proposals";
const USER_API_URL = "http://localhost:8085/api/v1/users";
const PAYMENT_BASE_API = "http://localhost:8085/api/v1/payments";

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

    try {
        const response = await fetch(url, options);
        const result = await response.json();
        if (!response.ok) throw new Error(result.message || result.data || "API Error");
        console.log(`API call to ${url} succeeded:`, result.data);
        return result.data;
    } catch (error) {
        console.error(`API call to ${url} failed:`, error.message);
        throw error;
    }
}

// Chart.js configuration for Admin Bar Chart
let statsChart = null;

function initializeChart(data) {
    const canvas = document.getElementById('statsChart');
    if (!canvas) {
        console.error("Canvas element with ID 'statsChart' not found");
        return;
    }
    const ctx = canvas.getContext('2d');
    if (!ctx) {
        console.error("Failed to get 2D context for canvas");
        return;
    }

    // Destroy existing chart if it exists
    if (statsChart) {
        statsChart.destroy();
    }

    console.log("Initializing admin chart with data:", data);

    statsChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: ['Users', 'Tasks', 'Completed Tasks', 'Proposals', 'Accepted Proposals', 'Rejected Proposals'],
            datasets: [{
                label: 'System Statistics',
                data: [
                    data.userCount || 0,
                    data.taskCounts?.allTasks || 0,
                    data.taskCounts?.completedTasks || 0,
                    data.proposalCounts?.allProposals || 0,
                    data.proposalCounts?.acceptedProposals || 0,
                    data.proposalCounts?.rejectedProposals || 0
                ],
                backgroundColor: [
                    'rgba(54, 162, 235, 0.6)',  // Users
                    'rgba(54, 162, 235, 0.6)',  // Tasks
                    'rgba(75, 192, 192, 0.6)',  // Completed Tasks
                    'rgba(255, 206, 86, 0.6)',  // Proposals
                    'rgba(75, 192, 192, 0.6)',  // Accepted Proposals
                    'rgba(255, 99, 132, 0.6)'   // Rejected Proposals
                ],
                borderColor: [
                    'rgba(54, 162, 235, 1)',
                    'rgba(54, 162, 235, 1)',
                    'rgba(75, 192, 192, 1)',
                    'rgba(255, 206, 86, 1)',
                    'rgba(75, 192, 192, 1)',
                    'rgba(255, 99, 132, 1)'
                ],
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            scales: {
                y: {
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: 'Count',
                        color: '#ffffff',
                        font: {
                            size: 16,
                            weight: 'bold'
                        }
                    },
                    ticks: {
                        color: '#ffffff',
                        font: {
                            size: 14,
                            weight: 'bold'
                        }
                    }
                },
                x: {
                    title: {
                        display: true,
                        text: 'Metrics',
                        color: '#ffffff',
                        font: {
                            size: 16,
                            weight: 'bold'
                        }
                    },
                    ticks: {
                        color: '#ffffff',
                        font: {
                            size: 14,
                            weight: 'bold'
                        }
                    }
                }
            },
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    backgroundColor: 'rgba(0, 0, 0, 0.8)',
                    titleColor: '#ffffff',
                    titleFont: {
                        size: 14,
                        weight: 'bold'
                    },
                    bodyColor: '#ffffff',
                    bodyFont: {
                        size: 12,
                        weight: 'bold'
                    },
                    callbacks: {
                        label: function(context) {
                            return `${context.label}: ${context.parsed.y}`;
                        }
                    }
                }
            }
        }
    });
}

// Chart.js configuration for Freelancer Pie Chart
let taskStatusChart = null;

function initializePieChart(data) {
    const canvas = document.getElementById('taskStatusChart');
    if (!canvas) {
        console.error("Canvas element with ID 'taskStatusChart' not found");
        return;
    }
    const ctx = canvas.getContext('2d');
    if (!ctx) {
        console.error("Failed to get 2D context for canvas");
        return;
    }

    // Destroy existing chart if it exists
    if (taskStatusChart) {
        taskStatusChart.destroy();
    }

    console.log("Initializing freelancer pie chart with data:", data);

    taskStatusChart = new Chart(ctx, {
        type: 'pie',
        data: {
            labels: ['Active Tasks', 'Completed Tasks'],
            datasets: [{
                data: [
                    data.activeTasks || 0,
                    data.completedTasks || 0
                ],
                backgroundColor: [
                    'rgba(54, 162, 235, 0.6)', // Active Tasks
                    'rgba(75, 192, 192, 0.6)'  // Completed Tasks
                ],
                borderColor: [
                    'rgba(54, 162, 235, 1)',
                    'rgba(75, 192, 192, 1)'
                ],
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'top',
                    labels: {
                        color: '#ffffff',
                        font: {
                            size: 14,
                            weight: 'bold'
                        }
                    }
                },
                tooltip: {
                    backgroundColor: 'rgba(0, 0, 0, 0.8)',
                    titleColor: '#ffffff',
                    titleFont: {
                        size: 14,
                        weight: 'bold'
                    },
                    bodyColor: '#ffffff',
                    bodyFont: {
                        size: 12,
                        weight: 'bold'
                    },
                    callbacks: {
                        label: function(context) {
                            return `${context.label}: ${context.parsed}`;
                        }
                    }
                }
            }
        }
    });
}

// Chart.js configuration for Client Proposal Status Pie Chart
let proposalStatusChart = null;

function initializeProposalStatusChart(data) {
    const canvas = document.getElementById('proposalStatusChart');
    if (!canvas) {
        console.error("Canvas element with ID 'proposalStatusChart' not found");
        return;
    }
    const ctx = canvas.getContext('2d');
    if (!ctx) {
        console.error("Failed to get 2D context for canvas");
        return;
    }

    // Destroy existing chart if it exists
    if (proposalStatusChart) {
        proposalStatusChart.destroy();
    }

    console.log("Initializing proposal status pie chart with data:", data);

    proposalStatusChart = new Chart(ctx, {
        type: 'pie',
        data: {
            labels: ['Pending', 'Accepted', 'Rejected'],
            datasets: [{
                data: [
                    data.pendingProposals || 0,
                    data.acceptedProposals || 0,
                    data.rejectedProposals || 0
                ],
                backgroundColor: [
                    'rgba(255, 206, 86, 0.6)',  // Pending
                    'rgba(75, 192, 192, 0.6)',  // Accepted
                    'rgba(255, 99, 132, 0.6)'   // Rejected
                ],
                borderColor: [
                    'rgba(255, 206, 86, 1)',
                    'rgba(75, 192, 192, 1)',
                    'rgba(255, 99, 132, 1)'
                ],
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'top',
                    labels: {
                        color: '#ffffff',
                        font: {
                            size: 14,
                            weight: 'bold'
                        }
                    }
                },
                tooltip: {
                    backgroundColor: 'rgba(0, 0, 0, 0.8)',
                    titleColor: '#ffffff',
                    titleFont: {
                        size: 14,
                        weight: 'bold'
                    },
                    bodyColor: '#ffffff',
                    bodyFont: {
                        size: 12,
                        weight: 'bold'
                    },
                    callbacks: {
                        label: function(context) {
                            return `${context.label}: ${context.parsed}`;
                        }
                    }
                }
            }
        }
    });
}

// Function to calculate relative time
function getRelativeTime(timestamp) {
    if (!timestamp) return "Unknown time";

    const now = new Date();
    const postedTime = new Date(timestamp);
    const diffMs = now - postedTime; // Difference in milliseconds
    const diffSeconds = Math.floor(diffMs / 1000);
    const diffMinutes = Math.floor(diffSeconds / 60);
    const diffHours = Math.floor(diffMinutes / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffSeconds < 60) {
        return "Posted just now";
    } else if (diffMinutes < 60) {
        return `Posted ${diffMinutes} minute${diffMinutes === 1 ? '' : 's'} ago`;
    } else if (diffHours < 24) {
        return `Posted ${diffHours} hour${diffHours === 1 ? '' : 's'} ago`;
    } else if (diffDays < 30) {
        return `Posted ${diffDays} day${diffDays === 1 ? '' : 's'} ago`;
    } else {
        const months = Math.floor(diffDays / 30);
        return `Posted ${months} month${months === 1 ? '' : 's'} ago`;
    }
}

// Function to render recent tasks (for Freelancer)
async function renderRecentTasks(tasks, freelancerProposals = []) {
    const recentTasksList = document.getElementById("recentTasksList");
    if (!recentTasksList) {
        console.error("Element with ID 'recentTasksList' not found");
        return;
    }

    recentTasksList.innerHTML = "";

    if (tasks.length === 0) {
        recentTasksList.innerHTML = '<li class="list-group-item text-center text-white">No recent tasks available</li>';
        return;
    }

    // Create a map of tasks with their proposals
    const taskProposalMap = {};
    freelancerProposals.forEach(proposal => {
        taskProposalMap[proposal.taskId] = proposal;
    });

    const currentUserId = Number(localStorage.getItem("userId"));

    tasks.forEach(task => {
        let actionButton = "";
        const hasProposed = taskProposalMap[task.id];

        if (hasProposed) {
            if (hasProposed.status === "ACCEPTED" && hasProposed.freelancerId === currentUserId) {
                actionButton = `<span class="badge bg-success fs-6 px-2 py-1">Assigned to You</span>`;
            } else if (hasProposed.status === "REJECTED") {
                actionButton = `<span class="badge bg-danger fs-6 px-2 py-1">Proposal Rejected</span>`;
            } else {
                actionButton = `<span class="badge fs-6 px-2 py-1" style="background-color: #44484d">Proposal Sent</span>`;
            }
        } else {
            actionButton = `
                <button class="btn btn-outline-primary btn-sm propose-button" data-task-id="${task.id}">
                    <i class="fas fa-paper-plane"></i> Propose
                </button>`;
        }

        const listItem = document.createElement("li");
        listItem.className = "list-group-item d-flex justify-content-between align-items-center";
        listItem.innerHTML = `
            <div>
                <h6 class="mb-1">${task.title}</h6>
                <small class="text-white">Posted: ${getRelativeTime(task.createdAt)}</small>
            </div>
            ${actionButton}
        `;

        recentTasksList.appendChild(listItem);
    });
}

// Function to render recent proposals (for Client)
async function renderRecentProposals(proposals) {
    const recentProposalsList = document.getElementById("recentProposalsList");
    if (!recentProposalsList) {
        console.error("Element with ID 'recentProposalsList' not found");
        return;
    }

    recentProposalsList.innerHTML = "";

    if (proposals.length === 0) {
        recentProposalsList.innerHTML = '<li class="list-group-item text-center text-white">No recent proposals available</li>';
        return;
    }

    proposals.forEach(proposal => {
        let statusClass = "badge bg-secondary";
        if (proposal.status === "PENDING") statusClass = "badge bg-warning text-dark";
        else if (proposal.status === "ACCEPTED") statusClass = "badge bg-success";
        else if (proposal.status === "REJECTED") statusClass = "badge bg-danger";

        const listItem = document.createElement("li");
        listItem.className = "list-group-item d-flex justify-content-between align-items-center";
        listItem.innerHTML = `
            <div>
                <h6 class="mb-1">${proposal.taskTitle || "Unknown Task"}</h6>
                <small class="text-white">Freelancer: ${proposal.freelancerName || "Unknown Freelancer"}</small><br>
                <small class="text-white">Bid: Rs ${proposal.bidAmount.toFixed(2)}</small><br>
                <small class="text-white">Submitted: ${getRelativeTime(proposal.submittedAt)}</small>
            </div>
            <span class="${statusClass} fs-6 px-2 py-1">${proposal.status}</span>
        `;
        recentProposalsList.appendChild(listItem);
    });
}

// ===================== Initial Load =====================
document.addEventListener("DOMContentLoaded", () => {
    console.log("DOM fully loaded, starting loadStats");
    loadStats();
});

// ===================== Load Stats =====================
async function loadStats() {
    try {
        let chartData = {};
        if (role === "ADMIN") {
            // Fetch user count
            const userCountElement = document.getElementById("allUsersCount");
            if (userCountElement) {
                try {
                    const userCount = await apiCall(`${USER_API_URL}/count`);
                    userCountElement.textContent = userCount || 0;
                    chartData.userCount = userCount || 0;
                } catch (error) {
                    console.error("Failed to fetch user count:", error.message);
                    userCountElement.textContent = "0";
                    chartData.userCount = 0;
                }
            } else {
                console.error("Element with ID 'allUsersCount' not found");
                chartData.userCount = 0;
            }

            // Fetch task counts
            const allTasksCountElement = document.getElementById("allTasksCount");
            const completedTasksCountElement = document.getElementById("completedTasksCount");
            if (allTasksCountElement && completedTasksCountElement) {
                try {
                    const taskCounts = await apiCall(`${TASK_API_BASE}/count`);
                    allTasksCountElement.textContent = taskCounts?.allTasks || 0;
                    completedTasksCountElement.textContent = taskCounts?.completedTasks || 0;
                    chartData.taskCounts = taskCounts || { allTasks: 0, completedTasks: 0 };
                } catch (error) {
                    console.error("Failed to fetch task counts:", error.message);
                    allTasksCountElement.textContent = "0";
                    completedTasksCountElement.textContent = "0";
                    chartData.taskCounts = { allTasks: 0, completedTasks: 0 };
                }
            } else {
                console.error("Task count elements not found");
                chartData.taskCounts = { allTasks: 0, completedTasks: 0 };
            }

            // Fetch proposal counts
            const allProposalsCountElement = document.getElementById("allProposalsCount");
            const acceptedProposalsCountElement = document.getElementById("acceptedProposalsCount");
            const rejectedProposalsCountElement = document.getElementById("rejectedProposalsCount");
            if (allProposalsCountElement && acceptedProposalsCountElement && rejectedProposalsCountElement) {
                try {
                    const proposalCounts = await apiCall(`${PROPOSAL_API_URL}/count`);
                    allProposalsCountElement.textContent = proposalCounts?.allProposals || 0;
                    acceptedProposalsCountElement.textContent = proposalCounts?.acceptedProposals || 0;
                    rejectedProposalsCountElement.textContent = proposalCounts?.rejectedProposals || 0;
                    chartData.proposalCounts = proposalCounts || { allProposals: 0, acceptedProposals: 0, rejectedProposals: 0 };
                } catch (error) {
                    console.error("Failed to fetch proposal counts:", error.message);
                    allProposalsCountElement.textContent = "0";
                    acceptedProposalsCountElement.textContent = "0";
                    rejectedProposalsCountElement.textContent = "0";
                    chartData.proposalCounts = { allProposals: 0, acceptedProposals: 0, rejectedProposals: 0 };
                }
            } else {
                console.error("Proposal count elements not found");
                chartData.proposalCounts = { allProposals: 0, acceptedProposals: 0, rejectedProposals: 0 };
            }

            // Fetch total revenue
            const revenueCountElement = document.getElementById("revenueCount");
            if (revenueCountElement) {
                try {
                    const totalRevenue = await apiCall(`${PAYMENT_BASE_API}/total-revenue`);
                    revenueCountElement.textContent = `Rs.${(totalRevenue || 0).toFixed(2)}`;
                } catch (error) {
                    console.error("Failed to fetch total revenue:", error.message);
                    revenueCountElement.textContent = "Rs.0.00";
                }
            } else {
                console.error("Element with ID 'revenueCount' not found");
            }

            // Initialize chart if canvas exists
            if (document.getElementById("statsChart")) {
                initializeChart(chartData);
            } else {
                console.warn("Skipping chart initialization: 'statsChart' canvas not found");
            }

        } else if (role === "CLIENT") {
            // Fetch client task counts
            const myTasksCountElement = document.getElementById("myTasksCount");
            const completedTasksCountElement = document.getElementById("completedTasksCount");
            if (myTasksCountElement && completedTasksCountElement) {
                try {
                    const taskCounts = await apiCall(`${TASK_API_BASE}/count/client/${userId}`);
                    myTasksCountElement.textContent = taskCounts?.myTasks || 0;
                    completedTasksCountElement.textContent = taskCounts?.completedTasks || 0;
                } catch (error) {
                    console.error("Failed to fetch client task counts:", error.message);
                    myTasksCountElement.textContent = "0";
                    completedTasksCountElement.textContent = "0";
                }
            } else {
                console.error("Client task count elements not found");
            }

            // Fetch proposal counts for client's tasks
            const allProposalsCountElement = document.getElementById("allProposalsCount");
            const acceptedProposalsCountElement = document.getElementById("acceptedProposalsCount");
            const rejectedProposalsCountElement = document.getElementById("rejectedProposalsCount");
            let proposalCounts = { allProposals: 0, acceptedProposals: 0, rejectedProposals: 0 };
            let clientProposals = [];
            if (allProposalsCountElement && acceptedProposalsCountElement && rejectedProposalsCountElement) {
                try {
                    proposalCounts = await apiCall(`${PROPOSAL_API_URL}/count/client/${userId}`);
                    allProposalsCountElement.textContent = proposalCounts?.allProposals || 0;
                    acceptedProposalsCountElement.textContent = proposalCounts?.acceptedProposals || 0;
                    rejectedProposalsCountElement.textContent = proposalCounts?.rejectedProposals || 0;
                    // Fetch proposals for rendering recent proposals
                    clientProposals = await apiCall(`${PROPOSAL_API_URL}/client/${userId}`);
                } catch (error) {
                    console.error("Failed to fetch client proposal counts:", error.message);
                    allProposalsCountElement.textContent = "0";
                    acceptedProposalsCountElement.textContent = "0";
                    rejectedProposalsCountElement.textContent = "0";
                }
            } else {
                console.error("Client proposal count elements not found");
            }

            // Fetch and render recent proposals
            try {
                // Sort proposals by submittedAt in descending order and take the top 3
                const recentProposals = clientProposals
                    .sort((a, b) => {
                        const dateA = new Date(a.submittedAt);
                        const dateB = new Date(b.submittedAt);
                        return dateB - dateA; // Newest first
                    })
                    .slice(0, 3);
                await renderRecentProposals(recentProposals);
            } catch (error) {
                console.error("Failed to fetch recent proposals:", error.message);
                const recentProposalsList = document.getElementById("recentProposalsList");
                if (recentProposalsList) {
                    recentProposalsList.innerHTML = '<li class="list-group-item text-center text-white">Error loading recent proposals</li>';
                }
            }

            // Initialize proposal status pie chart
            if (document.getElementById("proposalStatusChart")) {
                const pendingProposals = (proposalCounts?.allProposals || 0) -
                    (proposalCounts?.acceptedProposals || 0) -
                    (proposalCounts?.rejectedProposals || 0);
                initializeProposalStatusChart({
                    pendingProposals: pendingProposals >= 0 ? pendingProposals : 0,
                    acceptedProposals: proposalCounts?.acceptedProposals || 0,
                    rejectedProposals: proposalCounts?.rejectedProposals || 0
                });
            } else {
                console.warn("Skipping proposal status chart initialization: 'proposalStatusChart' canvas not found");
            }

        } else if (role === "FREELANCER") {
            // Fetch freelancer task and proposal counts
            const activeTasksCountElement = document.getElementById("activeTasksCount");
            const completedTasksCountElement = document.getElementById("completedTasksCount");
            let taskCounts = { activeTasks: 0, completedTasks: 0 };
            if (activeTasksCountElement && completedTasksCountElement) {
                try {
                    taskCounts = await apiCall(`${TASK_API_BASE}/count/freelancer/${userId}`);
                    activeTasksCountElement.textContent = taskCounts?.activeTasks || 0;
                    completedTasksCountElement.textContent = taskCounts?.completedTasks || 0;
                } catch (error) {
                    console.error("Failed to fetch freelancer task counts:", error.message);
                    activeTasksCountElement.textContent = "0";
                    completedTasksCountElement.textContent = "0";
                }
            } else {
                console.error("Freelancer task count elements not found");
            }

            const myProposalsCountElement = document.getElementById("myProposalsCount");
            const acceptedProposalsCountElement = document.getElementById("acceptedProposalsCount");
            const rejectedProposalsCountElement = document.getElementById("rejectedProposalsCount");
            let freelancerProposals = [];
            if (myProposalsCountElement && acceptedProposalsCountElement && rejectedProposalsCountElement) {
                try {
                    const proposalCounts = await apiCall(`${PROPOSAL_API_URL}/count/freelancer/${userId}`);
                    myProposalsCountElement.textContent = proposalCounts?.myProposals || 0;
                    acceptedProposalsCountElement.textContent = proposalCounts?.acceptedProposals || 0;
                    rejectedProposalsCountElement.textContent = proposalCounts?.rejectedProposals || 0;
                    freelancerProposals = await apiCall(`${PROPOSAL_API_URL}/freelancer/${userId}`);
                } catch (error) {
                    console.error("Failed to fetch freelancer proposal counts:", error.message);
                    myProposalsCountElement.textContent = "0";
                    acceptedProposalsCountElement.textContent = "0";
                    rejectedProposalsCountElement.textContent = "0";
                }
            } else {
                console.error("Freelancer proposal count elements not found");
            }

            // Fetch earnings
            const earningsCountElement = document.getElementById("earningsCount");
            if (earningsCountElement) {
                try {
                    const earnings = await apiCall(`${PROPOSAL_API_URL}/earnings/freelancer/${userId}`);
                    earningsCountElement.textContent = `Rs.${(earnings || 0).toFixed(2)}`;
                } catch (error) {
                    console.error("Failed to fetch earnings:", error.message);
                    earningsCountElement.textContent = "Rs.0.00";
                }
            } else {
                console.error("Element with ID 'earningsCount' not found");
            }

            // Fetch and render recent tasks
            try {
                const tasks = await apiCall(TASK_API_BASE);
                const recentTasks = tasks
                    .sort((a, b) => {
                        const dateA = new Date(a.createdAt);
                        const dateB = new Date(b.createdAt);
                        return dateB - dateA; // Newest first
                    })
                    .slice(0, 5);
                await renderRecentTasks(recentTasks, freelancerProposals);
            } catch (error) {
                console.error("Failed to fetch recent tasks:", error.message);
                const recentTasksList = document.getElementById("recentTasksList");
                if (recentTasksList) {
                    recentTasksList.innerHTML = '<li class="list-group-item text-center text-white">Error loading recent tasks</li>';
                }
            }

            // Initialize pie chart if canvas exists
            if (document.getElementById("taskStatusChart")) {
                initializePieChart({
                    activeTasks: taskCounts?.activeTasks || 0,
                    completedTasks: taskCounts?.completedTasks || 0
                });
            } else {
                console.warn("Skipping pie chart initialization: 'taskStatusChart' canvas not found");
            }
        }
    } catch (error) {
        console.error("Error loading stats:", error.message);
        document.querySelectorAll('[id$="Count"]').forEach(el => {
            if (el.id !== "earningsCount" && el.id !== "revenueCount") {
                el.textContent = "0";
            }
        });
        if (document.getElementById("earningsCount")) {
            document.getElementById("earningsCount").textContent = "Rs.0.00";
        }
        if (document.getElementById("revenueCount")) {
            document.getElementById("revenueCount").textContent = "Rs.0.00";
        }

        if (role === "ADMIN" && document.getElementById("statsChart")) {
            initializeChart({
                userCount: 0,
                taskCounts: { allTasks: 0, completedTasks: 0 },
                proposalCounts: { allProposals: 0, acceptedProposals: 0, rejectedProposals: 0 }
            });
        } else if (role === "FREELANCER" && document.getElementById("taskStatusChart")) {
            initializePieChart({
                activeTasks: 0,
                completedTasks: 0
            });
        } else if (role === "CLIENT" && document.getElementById("proposalStatusChart")) {
            initializeProposalStatusChart({
                pendingProposals: 0,
                acceptedProposals: 0,
                rejectedProposals: 0
            });
        }

        if (role === "FREELANCER") {
            const recentTasksList = document.getElementById("recentTasksList");
            if (recentTasksList) {
                recentTasksList.innerHTML = '<li class="list-group-item text-center text-white">Error loading recent tasks</li>';
            }
        } else if (role === "CLIENT") {
            const recentProposalsList = document.getElementById("recentProposalsList");
            if (recentProposalsList) {
                recentProposalsList.innerHTML = '<li class="list-group-item text-center text-white">Error loading recent proposals</li>';
            }
        }
    }
}

// Generate PDF report
async function generatePDFReport() {
    try {
        // Show loading indicator
        Swal.fire({
            title: 'Generating Report',
            text: 'Please wait while we prepare your PDF report...',
            allowOutsideClick: false,
            didOpen: () => {
                Swal.showLoading();
            }
        });

        // Collect all the stats data
        const statsData = {
            allUsers: document.getElementById('allUsersCount').textContent,
            allTasks: document.getElementById('allTasksCount').textContent,
            completedTasks: document.getElementById('completedTasksCount').textContent,
            allProposals: document.getElementById('allProposalsCount').textContent,
            acceptedProposals: document.getElementById('acceptedProposalsCount').textContent,
            rejectedProposals: document.getElementById('rejectedProposalsCount').textContent,
            revenue: document.getElementById('revenueCount').textContent,
            generatedAt: new Date().toLocaleString(),
            generatedBy: localStorage.getItem('email') || 'Admin User'
        };

        // Create PDF content
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();

        // Add logo and title
        doc.setFontSize(26);
        doc.setTextColor(40, 40, 40);
        doc.text('TaskFlow Admin Report', 105, 20, { align: 'center' });

        doc.setFontSize(14);
        doc.setTextColor(100, 100, 100);
        doc.text(`Generated on: ${statsData.generatedAt}`, 105, 32, { align: 'center' });
        doc.text(`Generated by: ${statsData.generatedBy}`, 105, 38, { align: 'center' });

        // Add separator line
        doc.setDrawColor(200, 200, 200);
        doc.line(20, 45, 190, 45);

        // Add stats cards as tables
        let yPosition = 55;

        // System Statistics section with
        doc.setFontSize(18);
        doc.setTextColor(40, 40, 40);
        doc.text('System Statistics', 20, yPosition);
        yPosition += 15;

        // Create table for stats
        doc.setFontSize(12);
        doc.setTextColor(80, 80, 80);

        // First row of stats
        doc.text('All Users:', 20, yPosition);
        doc.text(statsData.allUsers, 70, yPosition);

        doc.text('All Tasks:', 110, yPosition);
        doc.text(statsData.allTasks, 160, yPosition);
        yPosition += 12;

        // Second row of stats
        doc.text('Completed Tasks:', 20, yPosition);
        doc.text(statsData.completedTasks, 70, yPosition);

        doc.text('All Proposals:', 110, yPosition);
        doc.text(statsData.allProposals, 160, yPosition);
        yPosition += 12;

        // Third row of stats
        doc.text('Accepted Proposals:', 20, yPosition);
        doc.text(statsData.acceptedProposals, 70, yPosition);

        doc.text('Rejected Proposals:', 110, yPosition);
        doc.text(statsData.rejectedProposals, 160, yPosition);
        yPosition += 12;

        // Fourth row of stats
        doc.text('Revenue:', 20, yPosition);
        doc.text(statsData.revenue, 70, yPosition);
        yPosition += 20;

        // Add chart image if available
        try {
            const canvas = document.getElementById('statsChart');
            if (canvas) {
                // Modify chart text color to gray
                const ctx = canvas.getContext('2d');
                ctx.fillStyle = '#33353b';
                const chartImage = canvas.toDataURL('image/png', 1.0);
                doc.addImage(chartImage, 'PNG', 20, yPosition, 170, 80);
                yPosition += 90;
            }
        } catch (error) {
            console.error('Failed to add chart to PDF:', error);
        }

        // Add footer
        doc.setFontSize(12);
        doc.setTextColor(150, 150, 150);
        doc.text('© TaskFlow - Freelancer Task Management System', 105, 280, { align: 'center' });

        // Save the PDF
        const fileName = `TaskFlow_Report_${new Date().toISOString().slice(0, 10)}.pdf`;
        doc.save(fileName);

        // Close loading indicator
        Swal.close();

        // Show success message
        Swal.fire({
            icon: 'success',
            title: 'Report Generated',
            text: `Your report has been downloaded as ${fileName}`,
            timer: 3000,
            showConfirmButton: false
        });

    } catch (error) {
        console.error('Error generating PDF:', error);
        Swal.close();
        Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'Failed to generate PDF report. Please try again.'
        });
    }
}

// Event listener to the Generate Report button
document.addEventListener('DOMContentLoaded', function() {
    const generateReportBtn = document.querySelector('.btn-primary');
    if (generateReportBtn) {
        generateReportBtn.addEventListener('click', generatePDFReport);
    }
});
