// Function to get user-specific storage key
function getUserStorageKey(key) {
    const userId = localStorage.getItem('userId');
    return userId ? `${key}_${userId}` : key;
}

// Function to update user avatar and name in navbar
function updateNavbarUserInfo() {
    // Try both user-specific and regular storage keys
    let userName = localStorage.getItem(getUserStorageKey('name')) || localStorage.getItem('name');
    let userEmail = localStorage.getItem(getUserStorageKey('email')) || localStorage.getItem('email');
    let profileImage = localStorage.getItem(getUserStorageKey('profile_image')) || localStorage.getItem('profile_image');

    if (userName) {
        // Update "Hi, Name" in topbar
        const nameElement = document.querySelector('#dropdownUser span');
        if (nameElement) {
            nameElement.textContent = 'Hi, ' + userName;
        }

        // Update full name inside dropdown profile
        const profileNameElement = document.querySelector('.profile-dropdown .fw-bold');
        if (profileNameElement) {
            profileNameElement.textContent = userName;
        }

        // Update avatar images
        const avatarElements = document.querySelectorAll('#dropdownUser img, .profile-dropdown img');

        avatarElements.forEach(img => {
            if (profileImage && profileImage !== "null" && profileImage !== "undefined") {
                img.src = profileImage;
                img.onerror = function() {
                    // If image fails to load, fall back to generated avatar
                    const nameForAvatar = userName || userEmail || 'User';
                    const background = img.parentElement.id === 'dropdownUser' ? 'fff' : '4e73df';
                    const color = img.parentElement.id === 'dropdownUser' ? '4e73df' : 'fff';
                    img.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(nameForAvatar)}&background=${background}&color=${color}&bold=true`;
                };
            } else {
                // Generate avatar based on name
                const nameForAvatar = userName || userEmail || 'User';
                const background = img.parentElement.id === 'dropdownUser' ? 'fff' : '4e73df';
                const color = img.parentElement.id === 'dropdownUser' ? '4e73df' : 'fff';
                img.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(nameForAvatar)}&background=${background}&color=${color}&bold=true`;
            }
        });
    }
}

// Function to check if user data is available and update navbar
function initializeNavbar() {
    // Check if we have user data in localStorage
    const userName = localStorage.getItem(getUserStorageKey('name')) || localStorage.getItem('name');
    const token = localStorage.getItem('token');

    if (token && !userName) {
        // We're logged in but don't have user data yet - fetch it
        fetchUserProfileForNavbar();
    } else {
        // We have user data - update navbar immediately
        updateNavbarUserInfo();
    }
}

// Function to fetch user profile specifically for navbar
async function fetchUserProfileForNavbar() {
    try {
        const token = localStorage.getItem('token');
        if (!token) return;

        const response = await fetch('http://localhost:8085/api/v1/users/profile', {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            }
        });

        if (response.ok) {
            const result = await response.json();
            const userData = result.data;

            // Store user ID for user-specific storage keys
            if (userData.id) {
                localStorage.setItem('userId', userData.id);
            }

            // Store user data in localStorage with user-specific keys
            localStorage.setItem(getUserStorageKey('name'), userData.name);
            localStorage.setItem(getUserStorageKey('email'), userData.email);
            localStorage.setItem(getUserStorageKey('role'), userData.role);
            if (userData.profileImage) {
                localStorage.setItem(getUserStorageKey('profile_image'), userData.profileImage);
            }

            // Also store in regular keys for backward compatibility
            localStorage.setItem('name', userData.name);
            localStorage.setItem('email', userData.email);
            localStorage.setItem('role', userData.role);
            if (userData.profileImage) {
                localStorage.setItem('profile_image', userData.profileImage);
            }

            // Update navbar with new data
            updateNavbarUserInfo();
        }
    } catch (error) {
        console.error('Error fetching user profile for navbar:', error);
    }
}

// Function to handle profile image updates from other pages
function handleProfileImageUpdates() {
    document.addEventListener('profileImageUpdated', function(e) {
        const imageUrl = e.detail.imageUrl;
        localStorage.setItem(getUserStorageKey('profile_image'), imageUrl);
        localStorage.setItem('profile_image', imageUrl); // For backward compatibility
        updateNavbarUserInfo();
    });
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    initializeNavbar();
    handleProfileImageUpdates();

    // Also update when page becomes visible (in case of tab switching)
    document.addEventListener('visibilitychange', function() {
        if (!document.hidden) {
            updateNavbarUserInfo();
        }
    });
});

// Make function available globally for other scripts to call
window.updateNavbarUserInfo = updateNavbarUserInfo;
window.getUserStorageKey = getUserStorageKey;
