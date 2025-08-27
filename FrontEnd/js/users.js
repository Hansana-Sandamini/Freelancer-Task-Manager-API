const USER_API_URL = "http://localhost:8085/api/v1/users";
const token = localStorage.getItem("token");

// Redirect if not logged in or not admin
if (!token || localStorage.getItem("role") !== "ADMIN") {
    window.location.href = "/FrontEnd/index.html";
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

        const users = result.data;
        const tbody = document.getElementById("userTableBody");
        tbody.innerHTML = "";

        users.forEach(user => {
            const row = `
                <tr>
                    <td>${user.id}</td>
                    <td>${user.name}</td>
                    <td>${user.email}</td>
                    <td>********</td>
                    <td>${user.role}</td>
                    <td>
                        <button class="btn btn-sm btn-info" onclick="viewUserProfile(${user.id})">
                            <i class="fas fa-eye"></i>
                        </button>
                        <button class="btn btn-sm btn-warning" onclick="openEditModal(${user.id}, '${user.name}', '${user.email}', '${user.role}')">
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

    } catch (error) {
        console.error("Error loading users:", error);
        alert("Failed to load users.");
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

// ==================== Init ====================
document.addEventListener("DOMContentLoaded", loadUsers);

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
