const PROFILE_API_BASE = 'http://localhost:8085/api/v1/users';
const UPLOAD_API = 'http://localhost:8085/api/v1/upload/profile-image';

// Function to get user-specific storage key
function getUserStorageKey(key) {
    const userId = localStorage.getItem('userId');
    return userId ? `${key}_${userId}` : key;
}

// Function to check authentication and redirect if not logged in
function checkAuthentication() {
    const token = localStorage.getItem('token');
    if (!token) {
        window.location.href = '/Freelancer-Task-Manager-API/FrontEnd/index.html';
        return false;
    }
    return true;
}

// Function to fetch user profile from API
async function fetchUserProfile() {
    try {
        const token = localStorage.getItem('token');
        const response = await fetch(`${PROFILE_API_BASE}/profile`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
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
        const response = await fetch(`${PROFILE_API_BASE}/profile`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: JSON.stringify(profileData)
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Failed to update user profile: ${errorText}`);
        }

        const result = await response.json();
        return result;
    } catch (error) {
        console.error('Error updating user profile:', error);
        throw error;
    }
}

// Function to update user profile image via API
async function updateUserProfileImage(imageUrl) {
    try {
        const userData = await fetchUserProfile();
        const profileData = {
            name: userData.name,
            email: userData.email,
            profileImage: imageUrl
        };

        // Add role-specific fields if they exist
        if (userData.bio) profileData.bio = userData.bio;
        if (userData.company) profileData.company = userData.company;
        if (userData.skills) profileData.skills = userData.skills;

        const response = await fetch(`${PROFILE_API_BASE}/profile`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: JSON.stringify(profileData)
        });

        if (!response.ok) {
            throw new Error('Failed to update profile with image');
        }

        return await response.json();
    } catch (error) {
        console.error('Error updating profile with image:', error);
        throw error;
    }
}

// Function to handle profile image upload
function setupProfileImageUpload() {
    const profileImage = document.getElementById('profileImage');
    const uploadInput = document.getElementById('profileImageUpload');
    const progressBar = document.getElementById('uploadProgress');
    const progressContainer = progressBar ? progressBar.parentElement : null;

    if (!uploadInput) return;

    uploadInput.addEventListener('change', function(e) {
        const file = e.target.files[0];
        if (!file) return;

        // Validate file type and size
        if (!file.type.match('image/jpeg') && !file.type.match('image/png')) {
            alert('Please select a JPG or PNG image.');
            return;
        }

        if (file.size > 2 * 1024 * 1024) { // 2MB limit
            alert('Image size must be less than 2MB.');
            return;
        }

        // Show preview
        const reader = new FileReader();
        reader.onload = function(e) {
            profileImage.src = e.target.result;
            document.body.classList.add('uploading');

            // Show delete button after new image is uploaded
            toggleDeleteButton();
        };
        reader.readAsDataURL(file);

        // Upload the image
        uploadProfileImage(file);
    });

    async function uploadProfileImage(file) {
        const formData = new FormData();
        formData.append('image', file);

        if (progressContainer) {
            progressContainer.classList.remove('d-none');
        }

        // Simulate progress
        simulateProgress();

        try {
            const response = await fetch(UPLOAD_API, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: formData
            });

            if (!response.ok) {
                throw new Error('Upload failed');
            }

            const result = await response.json();

            // Update profile with new image URL
            await updateUserProfileImage(result.data.imageUrl);

            // Store image URL in localStorage with user-specific key
            localStorage.setItem(getUserStorageKey('profile_image'), result.data.imageUrl);
            localStorage.setItem('profile_image', result.data.imageUrl); // For backward compatibility

            // Trigger update of all profile images on the page
            triggerProfileImageUpdate(result.data.imageUrl);

            alert('Profile image updated successfully!');

        } catch (error) {
            console.error('Error uploading image:', error);
            alert('Failed to upload image. Please try again.');

            // Revert to previous image
            const previousImage = localStorage.getItem(getUserStorageKey('profile_image')) ||
                localStorage.getItem('profile_image') ||
                `https://ui-avatars.com/api/?name=${encodeURIComponent(localStorage.getItem(getUserStorageKey('name')) || localStorage.getItem('name') || 'User')}&background=4e73df&color=fff&bold=true`;
            profileImage.src = previousImage;

            // Update delete button visibility
            toggleDeleteButton();
        } finally {
            if (progressContainer) {
                progressContainer.classList.add('d-none');
            }
            document.body.classList.remove('uploading');
            uploadInput.value = ''; // Reset input
        }
    }

    // Simulate progress
    function simulateProgress() {
        if (!progressBar) return;

        let width = 0;
        const progressElement = progressBar.querySelector('.progress-bar');
        const interval = setInterval(() => {
            if (width >= 100) {
                clearInterval(interval);
            } else {
                width += 5;
                progressElement.style.width = width + '%';
            }
        }, 100);
    }
}

// Function to show/hide delete button based on whether user has a custom image
function toggleDeleteButton() {
    const deleteBtn = document.getElementById('deleteProfileImageBtn');
    const profileImage = document.getElementById('profileImage');

    if (deleteBtn && profileImage) {
        if (isDefaultImage(profileImage.src)) {
            deleteBtn.classList.add('d-none');
        } else {
            deleteBtn.classList.remove('d-none');
        }
    }
}

// Function to check if image is the default avatar
function isDefaultImage(imageUrl) {
    return imageUrl.includes('ui-avatars.com');
}

// Function to delete profile image
async function deleteProfileImage() {
    if (!confirm('Are you sure you want to delete your profile image?')) {
        return;
    }

    try {
        const token = localStorage.getItem('token');
        const response = await fetch(`${PROFILE_API_BASE}/profile/image`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) {
            throw new Error('Failed to delete profile image');
        }

        // Generate default avatar based on user name
        const userName = localStorage.getItem(getUserStorageKey('name')) ||
            localStorage.getItem('name') || 'User';
        const defaultImageUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(userName)}&background=4e73df&color=fff&bold=true`;

        // Update UI
        document.getElementById('profileImage').src = defaultImageUrl;

        // Update localStorage
        localStorage.removeItem(getUserStorageKey('profile_image'));
        localStorage.removeItem('profile_image');

        // Hide delete button
        document.getElementById('deleteProfileImageBtn').classList.add('d-none');

        // Trigger update of all profile images on the page
        triggerProfileImageUpdate(defaultImageUrl);

        alert('Profile image deleted successfully!');
    } catch (error) {
        console.error('Error deleting profile image:', error);
        alert('Failed to delete profile image. Please try again.');
    }
}

// Function to load user profile data
async function loadUserProfile() {
    if (!checkAuthentication()) return;

    try {
        const userData = await fetchUserProfile();

        // Store user ID for user-specific storage keys
        if (userData.id) {
            localStorage.setItem('userId', userData.id);
        }

        // Populate the form with data from API
        const nameInput = document.getElementById('profileName');
        const emailInput = document.getElementById('profileEmail');
        const roleInput = document.getElementById('profileRole');

        if (nameInput) nameInput.value = userData.name || '';
        if (emailInput) emailInput.value = userData.email || '';
        if (roleInput) roleInput.value = userData.role || '';

        // Update profile image - use stored image or generate from name
        const profileImage = document.getElementById('profileImage');
        if (profileImage) {
            if (userData.profileImage) {
                profileImage.src = userData.profileImage;
                localStorage.setItem(getUserStorageKey('profile_image'), userData.profileImage);
                localStorage.setItem('profile_image', userData.profileImage); // For backward compatibility
            } else {
                profileImage.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(userData.name || userData.email)}&background=4e73df&color=fff&bold=true`;
            }
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

        // Store user data in localStorage with user-specific keys
        localStorage.setItem(getUserStorageKey('name'), userData.name);
        localStorage.setItem(getUserStorageKey('email'), userData.email);
        localStorage.setItem(getUserStorageKey('role'), userData.role);
        if (userData.bio) localStorage.setItem(getUserStorageKey('profile_bio'), userData.bio);
        if (userData.company) localStorage.setItem(getUserStorageKey('profile_company'), userData.company);
        if (userData.skills) localStorage.setItem(getUserStorageKey('profile_skills'), userData.skills);

        // Also store in regular keys for backward compatibility
        localStorage.setItem('name', userData.name);
        localStorage.setItem('email', userData.email);
        localStorage.setItem('role', userData.role);
        if (userData.bio) localStorage.setItem('profile_bio', userData.bio);
        if (userData.company) localStorage.setItem('profile_company', userData.company);
        if (userData.skills) localStorage.setItem('profile_skills', userData.skills);

        // Toggle delete button based on image type
        toggleDeleteButton();

    } catch (error) {
        console.error('Error loading user profile:', error);
        fallbackToLocalStorage();
    }
}

// Fallback function if API call fails
function fallbackToLocalStorage() {
    const userName = localStorage.getItem(getUserStorageKey('name')) || localStorage.getItem('name') || localStorage.getItem(getUserStorageKey('email'))?.split('@')[0] || localStorage.getItem('email')?.split('@')[0] || 'User';
    const userEmail = localStorage.getItem(getUserStorageKey('email')) || localStorage.getItem('email') || '';
    const userRole = localStorage.getItem(getUserStorageKey('role')) || localStorage.getItem('role') || '';

    const nameInput = document.getElementById('profileName');
    const emailInput = document.getElementById('profileEmail');
    const roleInput = document.getElementById('profileRole');

    if (nameInput) nameInput.value = userName;
    if (emailInput) emailInput.value = userEmail;
    if (roleInput) roleInput.value = userRole;

    // Try to load role-specific data from localStorage
    const bioInput = document.getElementById('profileBio');
    const companyInput = document.getElementById('profileCompany');
    const skillsInput = document.getElementById('profileSkills');

    if (bioInput) bioInput.value = localStorage.getItem(getUserStorageKey('profile_bio')) || localStorage.getItem('profile_bio') || '';
    if (companyInput) companyInput.value = localStorage.getItem(getUserStorageKey('profile_company')) || localStorage.getItem('profile_company') || '';
    if (skillsInput) skillsInput.value = localStorage.getItem(getUserStorageKey('profile_skills')) || localStorage.getItem('profile_skills') || '';

    // Try to load profile image from localStorage
    const profileImage = document.getElementById('profileImage');
    if (profileImage) {
        const storedImage = localStorage.getItem(getUserStorageKey('profile_image')) || localStorage.getItem('profile_image');
        if (storedImage) {
            profileImage.src = storedImage;
        } else {
            profileImage.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(userName)}&background=4e73df&color=fff&bold=true`;
        }
    }

    // Show appropriate fields based on role
    const bioField = document.getElementById('bioField');
    const companyField = document.getElementById('companyField');
    const skillsField = document.getElementById('skillsField');

    if (userRole === 'FREELANCER') {
        if (bioField) bioField.classList.remove('d-none');
        if (skillsField) skillsField.classList.remove('d-none');
    } else if (userRole === 'CLIENT') {
        if (companyField) companyField.classList.remove('d-none');
    }

    // Toggle delete button based on image type
    toggleDeleteButton();

    alert('Could not load profile data. Using cached information.');
}

// Store original image when editing starts
let originalImageUrl = '';

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
    const uploadLabel = document.querySelector('label[for="profileImageUpload"]');
    const deleteBtn = document.getElementById('deleteProfileImageBtn');

    if (editBtn) editBtn.classList.add('d-none');
    if (saveBtn) saveBtn.classList.remove('d-none');
    if (cancelBtn) cancelBtn.classList.remove('d-none');
    if (uploadLabel) uploadLabel.style.display = 'block';

    // Show delete button if not default image
    if (deleteBtn && !isDefaultImage(document.getElementById('profileImage').src)) {
        deleteBtn.classList.remove('d-none');
    }

    // Store original image URL
    originalImageUrl = document.getElementById('profileImage').src;
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
    const uploadLabel = document.querySelector('label[for="profileImageUpload"]');
    const deleteBtn = document.getElementById('deleteProfileImageBtn');

    if (editBtn) editBtn.classList.remove('d-none');
    if (saveBtn) saveBtn.classList.add('d-none');
    if (cancelBtn) cancelBtn.classList.add('d-none');
    if (uploadLabel) uploadLabel.style.display = 'none';
    if (deleteBtn) deleteBtn.classList.add('d-none'); // Hide delete button

    // Restore original image if changes were canceled
    document.getElementById('profileImage').src = originalImageUrl;
}

// Function to save profile changes
async function saveProfileChanges() {
    const userNameInput = document.getElementById('profileName');
    const userEmailInput = document.getElementById('profileEmail');
    const userRole = localStorage.getItem(getUserStorageKey('role')) || localStorage.getItem('role');

    if (!userNameInput || !userEmailInput) return;

    try {
        // Include email in the update to avoid database constraint violation
        const profileData = {
            name: userNameInput.value,
            email: userEmailInput.value
        };

        // Add role-specific fields
        if (userRole === 'FREELANCER') {
            const bioInput = document.getElementById('profileBio');
            const skillsInput = document.getElementById('profileSkills');
            profileData.bio = bioInput ? bioInput.value : '';
            profileData.skills = skillsInput ? skillsInput.value : '';
        } else if (userRole === 'CLIENT') {
            const companyInput = document.getElementById('profileCompany');
            profileData.company = companyInput ? companyInput.value : '';
        }

        await updateUserProfile(profileData);

        // Update localStorage with new data using user-specific keys
        localStorage.setItem(getUserStorageKey('name'), userNameInput.value);
        if (profileData.bio) localStorage.setItem(getUserStorageKey('profile_bio'), profileData.bio);
        if (profileData.company) localStorage.setItem(getUserStorageKey('profile_company'), profileData.company);
        if (profileData.skills) localStorage.setItem(getUserStorageKey('profile_skills'), profileData.skills);

        // Also update regular keys for backward compatibility
        localStorage.setItem('name', userNameInput.value);
        if (profileData.bio) localStorage.setItem('profile_bio', profileData.bio);
        if (profileData.company) localStorage.setItem('profile_company', profileData.company);
        if (profileData.skills) localStorage.setItem('profile_skills', profileData.skills);

        alert('Profile updated successfully!');
        disableEditing();

        // Dispatch event to update navbar (handled by navbar.js)
        triggerProfileImageUpdate(localStorage.getItem(getUserStorageKey('profile_image')) || localStorage.getItem('profile_image'));
    } catch (error) {
        console.error('Error saving profile:', error);
        alert('Failed to update profile. Please try again.');
    }
}

// Function to trigger profile image update from other scripts
function triggerProfileImageUpdate(imageUrl) {
    const event = new CustomEvent('profileImageUpdated', {
        detail: { imageUrl: imageUrl }
    });
    document.dispatchEvent(event);
}

// Function to setup logout
function setupLogout() {
    const logoutLinks = document.querySelectorAll('a[href*="index.html"]');
    logoutLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            // Clear all user-specific data
            const userId = localStorage.getItem('userId');
            if (userId) {
                const keysToRemove = [
                    'token', 'userId', 'name', 'email', 'role',
                    'profile_bio', 'profile_company', 'profile_skills', 'profile_image'
                ];

                keysToRemove.forEach(key => {
                    localStorage.removeItem(key);
                    localStorage.removeItem(`${key}_${userId}`);
                });
            } else {
                // Fallback: clear all localStorage if userId is not available
                localStorage.clear();
            }

            window.location.href = '/Freelancer-Task-Manager-API/FrontEnd/index.html';
        });
    });
}

// Initialize profile page
document.addEventListener('DOMContentLoaded', function() {
    // Check authentication
    if (!checkAuthentication()) return;

    // Load user profile from API
    loadUserProfile();

    // Setup profile image upload
    setupProfileImageUpload();

    // Setup event listeners
    const editBtn = document.getElementById('editProfileBtn');
    const cancelBtn = document.getElementById('cancelEditBtn');
    const profileForm = document.getElementById('profileForm');
    const deleteImageBtn = document.getElementById('deleteProfileImageBtn');

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

    // Setup delete profile image button
    if (deleteImageBtn) {
        deleteImageBtn.addEventListener('click', deleteProfileImage);
    }

    // Setup logout
    setupLogout();
});
