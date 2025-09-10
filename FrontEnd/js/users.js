const USER_API_URL = "http://localhost:8085/api/v1/users";
const token = localStorage.getItem("token");

// Pagination variables
let currentPage = 1;
let itemsPerPage = 8;
let allUsers = [];
let filteredUsers = [];
let currentSearchTerm = '';
let currentRoleFilter = '';

// Redirect if not logged in or not admin
if (!token || localStorage.getItem("role") !== "ADMIN") {
    window.location.href = "/FrontEnd/index.html";
}

// ==================== Initialize ====================
document.addEventListener("DOMContentLoaded", () => {
    loadUsers();
    setupEventListeners();
});

function setupEventListeners() {
    // Search functionality
    document.getElementById("searchButton").addEventListener('click', applySearch);
    document.getElementById("clearSearchButton").addEventListener('click', clearSearch);
    document.getElementById("searchInput").addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            applySearch();
        }
    });

    // Role filter
    document.getElementById("roleFilter").addEventListener('change', (e) => {
        currentRoleFilter = e.target.value;
        filterUsers();
    });

    // Items per page
    document.getElementById("itemsPerPageSelect").addEventListener('change', (e) => {
        itemsPerPage = parseInt(e.target.value);
        currentPage = 1;
        renderTableWithPagination();
    });
}

// ==================== Search and Filter Functions ====================
function applySearch() {
    currentSearchTerm = document.getElementById("searchInput").value.toLowerCase().trim();
    filterUsers();
}

function clearSearch() {
    document.getElementById("searchInput").value = '';
    currentSearchTerm = '';
    filterUsers();
}

function filterUsers() {
    if (!currentSearchTerm && !currentRoleFilter) {
        filteredUsers = [...allUsers];
    } else {
        filteredUsers = allUsers.filter(user => {
            const matchesSearch = !currentSearchTerm ||
                user.name.toLowerCase().includes(currentSearchTerm) ||
                user.email.toLowerCase().includes(currentSearchTerm);

            const matchesRole = !currentRoleFilter || user.role === currentRoleFilter;

            return matchesSearch && matchesRole;
        });
    }

    currentPage = 1;
    renderTableWithPagination();
}

// ==================== Pagination Functions ====================
function renderPagination() {
    const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);
    const paginationContainer = document.getElementById("pagination");
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
                renderTableWithPagination();
            }
        }
    });
}

function getPaginatedUsers() {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return filteredUsers.slice(startIndex, endIndex);
}

function renderTableWithPagination() {
    const paginatedUsers = getPaginatedUsers();
    renderTable(paginatedUsers);
    renderPagination();
    updateResultsCount();
}

function updateResultsCount() {
    const startIndex = (currentPage - 1) * itemsPerPage + 1;
    const endIndex = Math.min(currentPage * itemsPerPage, filteredUsers.length);
    const resultsCount = document.getElementById("resultsCount");

    let countText = `Showing ${startIndex}-${endIndex} of ${filteredUsers.length} users`;

    if (currentSearchTerm) {
        countText += ` for "${currentSearchTerm}"`;
    }
    if (currentRoleFilter) {
        countText += ` (${currentRoleFilter} role)`;
    }

    resultsCount.textContent = countText;
}

// ==================== Fetch Users ====================
async function loadUsers() {
    try {
        const response = await fetch(USER_API_URL, {
            headers: {
                "Authorization": `Bearer ${token}`,
                "Content-Type": "application/json"
            }
        });

        const result = await response.json();

        if (!response.ok) throw new Error(result.message);

        allUsers = result.data;
        filteredUsers = [...allUsers];
        currentPage = 1;
        renderTableWithPagination();

    } catch (error) {
        console.error("Error loading users:", error);
        alert("Failed to load users.");
    }
}

// ==================== Render Table ====================
function renderTable(users) {
    const tbody = document.getElementById("userTableBody");
    tbody.innerHTML = "";

    if (users.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="6" class="text-center py-4 text-muted">
                    <i class="fas fa-users fa-2x mb-2"></i>
                    <p>No users found${currentSearchTerm || currentRoleFilter ? ' matching your criteria' : ''}</p>
                </td>
            </tr>
        `;
        return;
    }

    users.forEach(user => {
        const row = `
            <tr>
                <td>${user.id}</td>
                <td>${user.name}</td>
                <td>${user.email}</td>
                <td>********</td>
                <td>
                    <span class="badge ${getRoleBadgeClass(user.role)}">
                        ${user.role}
                    </span>
                </td>
                <td>
                    <button class="btn btn-sm btn-info me-1" onclick="viewUserProfile(${user.id})">
                        <i class="fas fa-eye"></i>
                    </button>
                    <button class="btn btn-sm btn-warning me-1" onclick="openEditModal(${user.id}, '${user.name}', '${user.email}', '${user.role}')">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn btn-sm btn-danger" onclick="deleteUser(${user.id})">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            </tr>
        `;
        tbody.insertAdjacentHTML("beforeend", row);
    });
}

function getRoleBadgeClass(role) {
    switch (role) {
        case 'ADMIN': return 'bg-danger';
        case 'CLIENT': return 'bg-primary';
        case 'FREELANCER': return 'bg-success';
        default: return 'bg-secondary';
    }
}

// ==================== Add User ====================
document.getElementById("userForm").addEventListener("submit", async (e) => {
    e.preventDefault();

    const data = {
        name: document.getElementById("userName").value,
        email: document.getElementById("userEmail").value,
        password: document.getElementById("userPassword").value,
        role: document.getElementById("userRole").value
    };

    try {
        const response = await fetch("http://localhost:8085/api/v1/auth/register", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${token}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify(data)
        });

        const result = await response.json();

        if (!response.ok) throw new Error(result.message);

        alert("User added successfully!");
        loadUsers();
        document.getElementById("userForm").reset();
        bootstrap.Modal.getInstance(document.getElementById("newUserModal")).hide();

    } catch (error) {
        console.error("Error adding user:", error);
        alert("Failed to add user.");
    }
});

// ==================== Edit User ====================
function openEditModal(id, name, email, role) {
    document.getElementById("editUserId").value = id;
    document.getElementById("editUserName").value = name;
    document.getElementById("editUserEmail").value = email;
    document.getElementById("editUserRole").value = role;

    new bootstrap.Modal(document.getElementById("editUserModal")).show();
}

document.getElementById("editUserForm").addEventListener("submit", async (e) => {
    e.preventDefault();

    const id = document.getElementById("editUserId").value;
    const data = {
        id: id,
        name: document.getElementById("editUserName").value,
        email: document.getElementById("editUserEmail").value,
        password: document.getElementById("editUserPassword").value,
        role: document.getElementById("editUserRole").value
    };

    try {
        const response = await fetch(`${USER_API_URL}/${id}`, {
            method: "PUT",
            headers: {
                "Authorization": `Bearer ${token}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify(data)
        });

        const result = await response.json();
        if (!response.ok) throw new Error(result.message);

        alert("User updated successfully!");
        loadUsers();
        bootstrap.Modal.getInstance(document.getElementById("editUserModal")).hide();

    } catch (error) {
        console.error("Error updating user:", error);
        alert("Failed to update user.");
    }
});

// ==================== Delete User ====================
async function deleteUser(id) {
    if (!confirm("Are you sure you want to delete this user?")) return;

    try {
        const response = await fetch(`${USER_API_URL}/${id}`, {
            method: "DELETE",
            headers: {
                "Authorization": `Bearer ${token}`
            }
        });

        const result = await response.json();
        if (!response.ok) throw new Error(result.message);

        alert("User deleted successfully!");
        loadUsers();

    } catch (error) {
        console.error("Error deleting user:", error);
        alert("Failed to delete user.");
    }
}

// ==================== View User Profile ====================
async function viewUserProfile(id) {
    try {
        const response = await fetch(`${USER_API_URL}/${id}`, {
            headers: {
                "Authorization": `Bearer ${token}`,
                "Content-Type": "application/json"
            }
        });

        const result = await response.json();
        if (!response.ok) throw new Error(result.message);

        const user = result.data;
        if (!user) {
            alert("User not found!");
            return;
        }

        // Fill modal fields
        document.getElementById("viewUserId").textContent = user.id;
        document.getElementById("viewUserName").textContent = user.name;
        document.getElementById("viewUserEmail").textContent = user.email;
        document.getElementById("viewUserRole").textContent = user.role;

        // Show modal
        new bootstrap.Modal(document.getElementById("viewUserModal")).show();

    } catch (error) {
        console.error("Error viewing user profile:", error);
        alert("Failed to load user profile.");
    }
}
