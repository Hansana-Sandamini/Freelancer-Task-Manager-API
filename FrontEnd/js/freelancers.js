const FREELANCER_API_URL = "http://localhost:8085/api/v1/users/freelancers";
const token = localStorage.getItem("token");
import { showErrorAlert } from './alert-util.js';

// Redirect if not logged in or not a CLIENT
if (!token || localStorage.getItem("role") !== "CLIENT") {
    window.location.href = "/FrontEnd/index.html";
}

// ==================== Fetch Freelancers ====================
async function loadFreelancers() {
    try {
        const response = await fetch(FREELANCER_API_URL, {
            headers: {
                "Authorization": `Bearer ${token}`,
                "Content-Type": "application/json"
            }
        });

        const result = await response.json();

        if (!response.ok) throw new Error(result.message);

        const freelancers = result.data;
        const tbody = document.getElementById("userTableBody");
        tbody.innerHTML = "";

        freelancers.forEach(user => {
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
                    </td>
                </tr>
            `;
            tbody.insertAdjacentHTML("beforeend", row);
        });

    } catch (error) {
        console.error("Error loading freelancers:", error);
        showErrorAlert("Error", "Failed to load freelancers. Please try again.");
    }
}

// ==================== View User Profile ====================
async function viewUserProfile(id) {
    try {
        const response = await fetch(`${FREELANCER_API_URL}/${id}`, {
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

        // Handle profile image
        const profileImageElement = document.getElementById("viewUserProfileImage");
        if (user.profileImage) {
            // If user has a custom profile image
            profileImageElement.src = user.profileImage;
        } else {
            // Generate default avatar using UI Avatars API
            const defaultAvatarUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=4e73df&color=fff&bold=true&size=120`;
            profileImageElement.src = defaultAvatarUrl;
        }

        // Handle additional fields (bio, company, skills)
        const bioContainer = document.getElementById("viewUserBioContainer");
        const bioElement = document.getElementById("viewUserBio");
        const companyContainer = document.getElementById("viewUserCompanyContainer");
        const companyElement = document.getElementById("viewUserCompany");
        const skillsContainer = document.getElementById("viewUserSkillsContainer");
        const skillsElement = document.getElementById("viewUserSkills");

        // Show/hide bio field
        if (user.bio) {
            bioElement.textContent = user.bio;
            bioContainer.style.display = 'block';
        } else {
            bioContainer.style.display = 'none';
        }

        // Show/hide company field
        if (user.company) {
            companyElement.textContent = user.company;
            companyContainer.style.display = 'block';
        } else {
            companyContainer.style.display = 'none';
        }

        // Show/hide skills field
        if (user.skills) {
            skillsElement.textContent = user.skills;
            skillsContainer.style.display = 'block';
        } else {
            skillsContainer.style.display = 'none';
        }

        // Show modal
        new bootstrap.Modal(document.getElementById("viewUserModal")).show();

    } catch (error) {
        console.error("Error viewing user profile:", error);
        showErrorAlert("Error", "Failed to load user profile. Please try again.");
    }
}
window.viewUserProfile = viewUserProfile;

// ==================== Init ====================
document.addEventListener("DOMContentLoaded", loadFreelancers);
