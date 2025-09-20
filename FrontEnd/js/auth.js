const API_BASE_URL = 'http://localhost:8085/api/v1/auth';

// Password visibility toggle
document.addEventListener('DOMContentLoaded', function() {
    const togglePassword = document.getElementById('togglePassword');
    const passwordInput = document.getElementById('password');

    if (togglePassword && passwordInput) {
        togglePassword.addEventListener('click', function () {
            if (passwordInput.type === 'password') {
                passwordInput.type = 'text';
                this.classList.remove('fa-eye-slash');
                this.classList.add('fa-eye');
            } else {
                passwordInput.type = 'password';
                this.classList.remove('fa-eye');
                this.classList.add('fa-eye-slash');
            }
        });
    }

    // Check for existing token on page load
    const token = localStorage.getItem('token');
    const path = window.location.pathname;

    // If we're on login page but already have a token, redirect to dashboard
    if (token && (path.includes('index.html') || path.endsWith('/'))) {
        const role = localStorage.getItem('role');
        switch(role) {
            case "ADMIN":
                window.location.href = "/Freelancer-Task-Manager-API/FrontEnd/pages/admin-dashboard.html";
                break;
            case "FREELANCER":
                window.location.href = "/Freelancer-Task-Manager-API/FrontEnd/pages/freelancer-dashboard.html";
                break;
            case "CLIENT":
                window.location.href = "/Freelancer-Task-Manager-API/FrontEnd/pages/client-dashboard.html";
                break;
            default:
                // If role is unknown, clear data and stay on login page
                clearAllAuthData();
        }
    }

    // Show logged in user email if on dashboard
    const userEmailElement = document.getElementById("userEmail");
    if (userEmailElement) {
        userEmailElement.textContent = localStorage.getItem("email") || "User";
    }

    // Setup logout button if it exists
    const logoutBtn = document.getElementById("logoutBtn");
    if (logoutBtn) {
        logoutBtn.addEventListener("click", handleLogout);
    }

    // Protect dashboard pages (redirect if not logged in)
    if ((window.location.pathname.includes('dashboard') ||
            window.location.pathname.includes('pages/')) &&
        !window.location.pathname.includes('index.html') &&
        !window.location.pathname.includes('signin.html') &&
        !window.location.pathname.includes('signup.html')) {

        if (!localStorage.getItem("token")) {
            window.location.href = "/Freelancer-Task-Manager-API/FrontEnd/index.html";
        }
    }
});

// ==================== API Helper ====================
async function apiCall(url, method, data) {
    try {
        const response = await fetch(url, {
            method,
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(data)
        });

        const result = await response.json();

        if (!response.ok) {
            throw new Error(result.data || "Request failed");
        }

        return result;
    } catch (error) {
        console.error("API call error:", error);
        throw error;
    }
}

// ==================== Sign Up ====================
const signupForm = document.getElementById("signupForm");

if (signupForm) {
    signupForm.addEventListener("submit", async (e) => {
        e.preventDefault();

        const data = {
            name: document.getElementById("name").value,
            email: document.getElementById("email").value,
            password: document.getElementById("password").value,
            role: document.querySelector("input[name='role']:checked")?.value
        };

        // Client-side validation
        if (!data.name || !data.email || !data.password || !data.role) {
            alert("Please fill out all fields.");
            return;
        }

        try {
            const result = await apiCall(`${API_BASE_URL}/register`, "POST", data);
            console.log("Registered:", result);
            // alert("Registration successful! Please login.");
            window.location.href = "/Freelancer-Task-Manager-API/FrontEnd/pages/signin.html";
        } catch (error) {
            console.error("Registration error:", error.message);
            alert(error.message || "Registration failed. Please try again.");
        }
    });
}

// ==================== Sign In ====================
const signinForm = document.getElementById("signinForm");

if (signinForm) {
    signinForm.addEventListener("submit", async (e) => {
        e.preventDefault();

        const email = document.getElementById("email").value;
        const password = document.getElementById("password").value;

        // Client-side validation
        if (!email || !password) {
            alert("Please enter both email and password.");
            return;
        }

        try {
            // Clear any existing auth data before attempting new login
            clearAllAuthData();

            const response = await fetch(`${API_BASE_URL}/login`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({ email, password })
            });

            const result = await response.json();

            if (!response.ok) {
                console.error("Login failed:", result);
                alert(result.data || "Login failed. Please check your credentials.");
                return;
            }

            // Save basic user info first
            localStorage.setItem("token", result.data.accessToken);
            localStorage.setItem("email", result.data.email);
            localStorage.setItem("role", result.data.role);
            localStorage.setItem("userId", result.data.userId);
            localStorage.setItem("name", result.data.name);

            console.log("Basic login successful, fetching full profile...");

            // Fetch complete user profile to get all details including profile image
            try {
                const profileResponse = await fetch('http://localhost:8085/api/v1/users/profile', {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${result.data.accessToken}`
                    }
                });

                if (profileResponse.ok) {
                    const profileResult = await profileResponse.json();
                    const userData = profileResult.data;

                    console.log("Full profile data:", userData);

                    // Store complete user profile data
                    localStorage.setItem('userId', userData.id);
                    localStorage.setItem('name', userData.name);
                    localStorage.setItem('email', userData.email);
                    localStorage.setItem('role', userData.role);

                    if (userData.profileImage) {
                        localStorage.setItem('profile_image', userData.profileImage);
                    }

                    // Initialize profile fields
                    if (userData.bio) localStorage.setItem('profile_bio', userData.bio);
                    if (userData.company) localStorage.setItem('profile_company', userData.company);
                    if (userData.skills) localStorage.setItem('profile_skills', userData.skills);

                    console.log("Full profile loaded successfully");
                } else {
                    console.warn("Profile fetch failed, but login succeeded");
                }
            } catch (profileError) {
                console.error("Error fetching user profile:", profileError);
                // Continue with login even if profile fetch fails
            }

            console.log("Login completed successfully");

            // Role-based redirection
            switch (result.data.role) {
                case "ADMIN":
                    window.location.href = "/Freelancer-Task-Manager-API/FrontEnd/pages/admin-dashboard.html";
                    break;
                case "FREELANCER":
                    window.location.href = "/Freelancer-Task-Manager-API/FrontEnd/pages/freelancer-dashboard.html";
                    break;
                case "CLIENT":
                    window.location.href = "/Freelancer-Task-Manager-API/FrontEnd/pages/client-dashboard.html";
                    break;
                default:
                    alert("Unknown role: " + result.data.role);
                    // Clear data if role is unknown
                    clearAllAuthData();
                    break;
            }
        } catch (error) {
            console.error("Login error:", error);
            alert("Something went wrong. Please try again.");

            // Clear any partial login data on error
            clearAllAuthData();
        }
    });
}

// ==================== Logout Functions ====================
function handleLogout() {
    clearAllAuthData();
    window.location.href = "/Freelancer-Task-Manager-API/FrontEnd/index.html";
}

function clearAllAuthData() {
    // Get userId before clearing
    const userId = localStorage.getItem('userId');

    // Clear all localStorage items systematically
    const allKeys = [
        'token', 'userId', 'name', 'email', 'role',
        'profile_bio', 'profile_company', 'profile_skills', 'profile_image'
    ];

    // Clear regular keys
    allKeys.forEach(key => {
        localStorage.removeItem(key);
    });

    // Clear user-specific keys if userId exists
    if (userId) {
        allKeys.forEach(key => {
            localStorage.removeItem(`${key}_${userId}`);
        });

        // Also clear any other possible user-specific keys
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && key.endsWith(`_${userId}`)) {
                localStorage.removeItem(key);
            }
        }
    }

    // Force clear any remaining auth items (fallback)
    const remainingKeys = [];
    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && (key.includes('token') || key.includes('user') || key.includes('profile') || key.includes('role'))) {
            remainingKeys.push(key);
        }
    }

    remainingKeys.forEach(key => {
        localStorage.removeItem(key);
    });

    console.log("All authentication data cleared");
}

// ==================== Debugging Functions ====================
// Function to debug localStorage issues
function debugLocalStorage() {
    console.log("=== LocalStorage Debug Info ===");
    console.log("All localStorage items:");
    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        console.log(`${key}: ${localStorage.getItem(key)}`);
    }

    const token = localStorage.getItem('token');
    const userId = localStorage.getItem('userId');

    console.log(`Token exists: ${!!token}`);
    console.log(`UserID exists: ${!!userId}`);
    console.log("===============================");
}

// Manual clear function for debugging
window.clearAuthData = function() {
    clearAllAuthData();
    console.log("All auth data cleared manually");
    alert("All authentication data has been cleared. Please refresh the page.");
};

// Manual debug function
window.showAuthDebug = function() {
    debugLocalStorage();
};
