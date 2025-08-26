const API_BASE_URL = 'http://localhost:8085/api/v1/auth';

// Redirect to sign-in page if not logged in
if (!localStorage.getItem('token')) {
    window.location.href = '/FrontEnd/index.html';
}

// ==================== Load Dashboard Based on Role ====================
document.addEventListener('DOMContentLoaded', () => {
    const userRole = localStorage.getItem('role');
    const userEmail = localStorage.getItem('email') || 'User';

    // Update user profile display
    const userProfileElements = document.querySelectorAll('.d-none.d-md-inline');
    userProfileElements.forEach(element => {
        element.textContent = `Hi, ${userEmail.split('@')[0]}`;
    });

    // Show appropriate sidebar based on role
    const adminSidebar = document.getElementById('sidebar-admin');
    const clientSidebar = document.getElementById('sidebar-client');
    const freelancerSidebar = document.getElementById('sidebar-freelancer');

    // Hide all sidebars initially
    adminSidebar.style.display = 'none';
    clientSidebar.style.display = 'none';
    freelancerSidebar.style.display = 'none';

    // Show the sidebar corresponding to the user's role
    switch (userRole) {
        case 'ADMIN':
            adminSidebar.style.display = 'block';
            break;
        case 'CLIENT':
            clientSidebar.style.display = 'block';
            break;
        case 'FREELANCER':
            freelancerSidebar.style.display = 'block';
            break;
        default:
            console.error('Unknown role:', userRole);
            window.location.href = '/FrontEnd/index.html'; // Redirect to sign-in if role is invalid
    }

    // Update user avatar and profile details
    const avatarImages = document.querySelectorAll('img.rounded-circle');
    const profileName = document.querySelector('.profile-dropdown .fw-bold');
    if (profileName) {
        profileName.textContent = userEmail.split('@')[0]; // Display username
    }
    avatarImages.forEach(img => {
        img.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(userEmail.split('@')[0])}&background=fff&color=4e73df&bold=true`;
    });
});

// ==================== Logout ====================
const logoutLinks = document.querySelectorAll('.nav-link[href="/Freelancer-Task-Manager-API/FrontEnd/index.html"], .dropdown-item[href="/FrontEnd/index.html"]');
logoutLinks.forEach(link => {
    link.addEventListener('click', (e) => {
        e.preventDefault();
        // Clear localStorage
        localStorage.removeItem('token');
        localStorage.removeItem('email');
        localStorage.removeItem('role');
        // Redirect to sign-in page
        window.location.href = '/FrontEnd/index.html';
    });
});

// ==================== API Helper ====================
async function apiCall(url, method, data) {
    try {
        const response = await fetch(url, {
            method,
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: data ? JSON.stringify(data) : undefined
        });

        const result = await response.json();

        if (!response.ok) {
            throw new Error(result.data || 'Request failed');
        }

        return result;
    } catch (error) {
        console.error('API call error:', error);
        throw error;
    }
}
