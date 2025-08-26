const API_BASE_URL = 'http://localhost:8085/api/v1/auth';

// Password visibility toggle
document.getElementById('togglePassword').addEventListener('click', function () {
    const passwordInput = document.getElementById('password');
    const icon = this;

    if (passwordInput.type === 'password') {
        passwordInput.type = 'text';
        icon.classList.remove('fa-eye-slash');
        icon.classList.add('fa-eye');
    } else {
        passwordInput.type = 'password';
        icon.classList.remove('fa-eye');
        icon.classList.add('fa-eye-slash');
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
            alert("Registration successful! Please login.");
            window.location.href = "/FrontEnd/pages/signin.html";
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

            // Save JWT and user info in localStorage
            localStorage.setItem("token", result.data.accessToken);
            localStorage.setItem("email", result.data.email);
            localStorage.setItem("role", result.data.role);

            // Initialize profile fields
            if (!localStorage.getItem('profile_bio')) localStorage.setItem('profile_bio', '');
            if (!localStorage.getItem('profile_company')) localStorage.setItem('profile_company', '');
            if (!localStorage.getItem('profile_skills')) localStorage.setItem('profile_skills', '');

            console.log("Logged in:", result);

            // Role-based redirection
            switch (result.data.role) {
                case "ADMIN":
                    window.location.href = "/FrontEnd/pages/admin-dashboard.html";
                    break;
                case "FREELANCER":
                    window.location.href = "/FrontEnd/pages/freelancer-dashboard.html";
                    break;
                case "CLIENT":
                    window.location.href = "/FrontEnd/pages/client-dashboard.html";
                    break;
                default:
                    alert("Unknown role: " + result.data.role);
                    break;
            }
        } catch (error) {
            console.error("Login error:", error);
            alert("Something went wrong. Please try again.");
        }
    });
}

// ==================== Logout ====================
// Show logged in user email
document.getElementById("userEmail").textContent = localStorage.getItem("email") || "Freelancer";

document.getElementById("logoutBtn").addEventListener("click", function () {
    // Clear localStorage (JWT + user info)
    localStorage.removeItem("token");
    localStorage.removeItem("email");
    localStorage.removeItem("role");

    // Redirect to sign-in page
    window.location.href = "/FrontEnd/index.html";
});

//  Protect dashboard (redirect if not logged in)
if (!localStorage.getItem("token")) {
    window.location.href = "/FrontEnd/index.html";
}
