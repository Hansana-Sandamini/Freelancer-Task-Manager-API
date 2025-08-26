const PROFILE_API_BASE = 'http://localhost:8085/api/v1';

// Function to check authentication and redirect if not logged in
function checkAuthentication() {
    if (!localStorage.getItem('token')) {
        window.location.href = '/Freelancer-Task-Manager-API/FrontEnd/index.html';
        return false;
    }
    return true;
}

// Function to fetch user profile from API
async function fetchUserProfile() {
    try {
        const response = await fetch(`${PROFILE_API_BASE}/user/profile`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });

        if (!response.ok) {
            throw new Error('Failed to fetch user profile');
        }

        const result = await response.json();
        return result.data;
    } catch (error) {
        console.error('Error fetching user profile:', error);
        throw error;
    }
}

// Function to update user profile via API
async function updateUserProfile(profileData) {
    try {
        const response = await fetch(`${PROFILE_API_BASE}/user/profile`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: JSON.stringify(profileData)
        });

        if (!response.ok) {
            throw new Error('Failed to update user profile');
        }

        const result = await response.json();
        return result.data;
    } catch (error) {
        console.error('Error updating user profile:', error);
        throw error;
    }
}

// Function to load user profile data
async function loadUserProfile() {
    if (!checkAuthentication()) return;

    try {
        const userData = await fetchUserProfile();

        // Populate the form with data from API
        const nameInput = document.getElementById('profileName');
        const emailInput = document.getElementById('profileEmail');
        const roleInput = document.getElementById('profileRole');

        if (nameInput) nameInput.value = userData.name || '';
        if (emailInput) emailInput.value = userData.email || '';
        if (roleInput) roleInput.value = userData.role || '';

        // Update profile image
        const profileImage = document.getElementById('profileImage');
        if (profileImage) {
            profileImage.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(userData.name || userData.email)}&background=4e73df&color=fff&bold=true`;
        }

        // Show/hide role-specific fields
        const bioField = document.getElementById('bioField');
        const companyField = document.getElementById('companyField');
        const skillsField = document.getElementById('skillsField');

        if (userData.role === 'FREELANCER') {
            if (bioField) bioField.classList.remove('d-none');
            if (skillsField) skillsField.classList.remove('d-none');

            const bioInput = document.getElementById('profileBio');
            const skillsInput = document.getElementById('profileSkills');
            if (bioInput) bioInput.value = userData.bio || '';
            if (skillsInput) skillsInput.value = userData.skills || '';
        } else {
            if (bioField) bioField.classList.add('d-none');
            if (skillsField) skillsField.classList.add('d-none');
        }

        if (userData.role === 'CLIENT') {
            if (companyField) companyField.classList.remove('d-none');
            const companyInput = document.getElementById('profileCompany');
            if (companyInput) companyInput.value = userData.company || '';
        } else {
            if (companyField) companyField.classList.add('d-none');
        }

        // Store user data in localStorage for quick access
        localStorage.setItem('name', userData.name);
        localStorage.setItem('email', userData.email);
        localStorage.setItem('role', userData.role);

    } catch (error) {
        console.error('Error loading user profile:', error);
        // Fallback to localStorage if API fails
        fallbackToLocalStorage();
    }
}

// Fallback function if API call fails
function fallbackToLocalStorage() {
    const userName = localStorage.getItem('name') || localStorage.getItem('email')?.split('@')[0] || 'User';
    const userEmail = localStorage.getItem('email') || '';
    const userRole = localStorage.getItem('role') || '';

    const nameInput = document.getElementById('profileName');
    const emailInput = document.getElementById('profileEmail');
    const roleInput = document.getElementById('profileRole');

    if (nameInput) nameInput.value = userName;
    if (emailInput) emailInput.value = userEmail;
    if (roleInput) roleInput.value = userRole;

    alert('Could not load profile data. Using cached information.');
}

// Function to enable form editing
function enableEditing() {
    const inputs = document.querySelectorAll('#profileForm input, #profileForm textarea');
    inputs.forEach(input => {
        if (input.id !== 'profileRole' && input.id !== 'profileEmail') {
            input.readOnly = false;
        }
    });

    const editBtn = document.getElementById('editProfileBtn');
    const saveBtn = document.getElementById('saveProfileBtn');
    const cancelBtn = document.getElementById('cancelEditBtn');

    if (editBtn) editBtn.classList.add('d-none');
    if (saveBtn) saveBtn.classList.remove('d-none');
    if (cancelBtn) cancelBtn.classList.remove('d-none');
}

// Function to disable form editing
function disableEditing() {
    const inputs = document.querySelectorAll('#profileForm input, #profileForm textarea');
    inputs.forEach(input => {
        input.readOnly = true;
    });

    const editBtn = document.getElementById('editProfileBtn');
    const saveBtn = document.getElementById('saveProfileBtn');
    const cancelBtn = document.getElementById('cancelEditBtn');

    if (editBtn) editBtn.classList.remove('d-none');
    if (saveBtn) saveBtn.classList.add('d-none');
    if (cancelBtn) cancelBtn.classList.add('d-none');
}

// Function to save profile changes
async function saveProfileChanges() {
    const userNameInput = document.getElementById('profileName');
    const userRole = localStorage.getItem('role');

    if (!userNameInput) return;

    try {
        const profileData = {
            name: userNameInput.value
        };

        if (userRole === 'FREELANCER') {
            const bioInput = document.getElementById('profileBio');
            const skillsInput = document.getElementById('profileSkills');
            profileData.bio = bioInput ? bioInput.value : '';
            profileData.skills = skillsInput ? skillsInput.value : '';
        } else if (userRole === 'CLIENT') {
            const companyInput = document.getElementById('profileCompany');
            profileData.company = companyInput ? companyInput.value : '';
        }

        const updatedUser = await updateUserProfile(profileData);

        // Update localStorage with new data
        localStorage.setItem('name', updatedUser.name || userNameInput.value);
        if (updatedUser.bio) localStorage.setItem('profile_bio', updatedUser.bio);
        if (updatedUser.company) localStorage.setItem('profile_company', updatedUser.company);
        if (updatedUser.skills) localStorage.setItem('profile_skills', updatedUser.skills);

        alert('Profile updated successfully!');
        updateUserInfo();
        disableEditing();
    } catch (error) {
        console.error('Error saving profile:', error);
        alert('Failed to update profile. Please try again.');
    }
}

// Function to update user info in UI
function updateUserInfo() {
    const userName = localStorage.getItem('name') || localStorage.getItem('email')?.split('@')[0] || 'User';

    // Update top bar
    const userElements = document.querySelectorAll('#dropdownUser span');
    userElements.forEach(el => {
        el.textContent = `Hi, ${userName}`;
    });

    // Update avatars
    const avatarElements = document.querySelectorAll('#dropdownUser img, .profile-dropdown img');
    avatarElements.forEach(img => {
        img.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(userName)}&background=4e73df&color=fff&bold=true`;
    });

    // Update profile name in dropdown
    const profileName = document.querySelector('.profile-dropdown .fw-bold');
    if (profileName) {
        profileName.textContent = userName;
    }
}

// Function to load sidebar based on role
function loadSidebarBasedOnRole() {
    const role = localStorage.getItem('role');
    const adminSidebar = document.getElementById('sidebar-admin');
    const clientSidebar = document.getElementById('sidebar-client');
    const freelancerSidebar = document.getElementById('sidebar-freelancer');

    // Hide all sidebars first
    if (adminSidebar) adminSidebar.style.display = 'none';
    if (clientSidebar) clientSidebar.style.display = 'none';
    if (freelancerSidebar) freelancerSidebar.style.display = 'none';

    // Show appropriate sidebar
    switch(role) {
        case 'ADMIN':
            if (adminSidebar) adminSidebar.style.display = 'block';
            break;
        case 'CLIENT':
            if (clientSidebar) clientSidebar.style.display = 'block';
            break;
        case 'FREELANCER':
            if (freelancerSidebar) freelancerSidebar.style.display = 'block';
            break;
        default:
            console.error('Unknown role:', role);
    }
}

// Function to setup logout
function setupLogout() {
    const logoutLinks = document.querySelectorAll('a[href*="index.html"]');
    logoutLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            localStorage.removeItem('token');
            localStorage.removeItem('email');
            localStorage.removeItem('role');
            localStorage.removeItem('name');
            localStorage.removeItem('profile_bio');
            localStorage.removeItem('profile_company');
            localStorage.removeItem('profile_skills');
            window.location.href = '/Freelancer-Task-Manager-API/FrontEnd/index.html';
        });
    });
}

// Initialize profile page
document.addEventListener('DOMContentLoaded', function() {
    // Check authentication
    if (!checkAuthentication()) return;

    // Load sidebar based on role
    loadSidebarBasedOnRole();

    // Load user profile from API
    loadUserProfile();

    // Update user info
    updateUserInfo();

    // Setup event listeners
    const editBtn = document.getElementById('editProfileBtn');
    const cancelBtn = document.getElementById('cancelEditBtn');
    const profileForm = document.getElementById('profileForm');

    if (editBtn) {
        editBtn.addEventListener('click', enableEditing);
    }

    if (cancelBtn) {
        cancelBtn.addEventListener('click', function() {
            disableEditing();
            loadUserProfile(); // Reload original data from API
        });
    }

    if (profileForm) {
        profileForm.addEventListener('submit', function(e) {
            e.preventDefault();
            saveProfileChanges();
        });
    }

    // Setup logout
    setupLogout();
});
