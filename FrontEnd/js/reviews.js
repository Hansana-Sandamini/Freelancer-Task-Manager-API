const REVIEW_API_URL = "http://localhost:8085/api/v1/reviews";
const TASK_API_BASE = "http://localhost:8085/api/v1/tasks";
import { showSuccessAlert, showErrorAlert, showConfirmAlert } from './alert-util.js';

// Get token, role and user ID from localStorage
const token = localStorage.getItem("token");
const role = localStorage.getItem("role");
const userId = localStorage.getItem("userId");

// Store all reviews for filtering
let allReviews = [];
let allTasks = [];

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

    const response = await fetch(url, options);
    const result = await response.json();
    if (!response.ok) throw new Error(result.message || result.data || "API Error");
    return result.data;
}

// Load reviews when page loads
document.addEventListener('DOMContentLoaded', function() {
    if (window.location.pathname.includes('reviews.html')) {
        loadReviews();
        loadTasksForFilter();
        setupEventListeners();
        updateUIBasedOnRole();
    }
});

// Setup event listeners
function setupEventListeners() {
    // Refresh button
    const refreshBtn = document.getElementById('btn-refresh');
    if (refreshBtn) {
        refreshBtn.addEventListener('click', function() {
            loadReviews();
            loadTasksForFilter();
        });
    }

    // Filter buttons
    const applyFiltersBtn = document.getElementById('applyFilters');
    const clearFiltersBtn = document.getElementById('clearFilters');

    if (applyFiltersBtn) {
        applyFiltersBtn.addEventListener('click', applyFilters);
    }

    if (clearFiltersBtn) {
        clearFiltersBtn.addEventListener('click', clearFilters);
    }

    // Delete review button in modal
    const deleteBtn = document.getElementById('deleteReviewBtn');
    if (deleteBtn) {
        deleteBtn.addEventListener('click', deleteReview);
    }
}

// Update UI based on user role
function updateUIBasedOnRole() {
    const filterSection = document.getElementById('filterSection');
    const taskFilterContainer = document.getElementById('taskFilterContainer');
    const dateFilterContainer = document.getElementById('dateFilterContainer');

    if (!filterSection || !taskFilterContainer || !dateFilterContainer) return;

    if (role === 'CLIENT') {
        // Clients can only see their own reviews
        filterSection.classList.add('d-none');
    } else if (role === 'FREELANCER') {
        // Freelancers can see reviews about them
        taskFilterContainer.classList.remove('d-none');
        dateFilterContainer.classList.remove('d-none');
    } else if (role === 'ADMIN') {
        // Admins can see all reviews with all filters
        filterSection.classList.remove('d-none');
        taskFilterContainer.classList.remove('d-none');
        dateFilterContainer.classList.remove('d-none');
    }
}

// Load tasks for filter dropdown based on user role
async function loadTasksForFilter() {
    try {
        if (role === 'ADMIN') {
            // Admins see all tasks
            allTasks = await apiCall(TASK_API_BASE);
        } else if (role === 'CLIENT') {
            // Clients see only their tasks
            allTasks = await apiCall(`${TASK_API_BASE}/client/${userId}`);
        } else if (role === 'FREELANCER') {
            // Freelancers see only tasks assigned to them
            // First get all tasks to find which ones are assigned to this freelancer
            const allTasksData = await apiCall(TASK_API_BASE);
            allTasks = allTasksData.filter(task => task.freelancerId == userId);
        }

        populateTaskFilter();
    } catch (error) {
        console.error("Error loading tasks for filter:", error.message);
    }
}

// Populate task filter dropdown
function populateTaskFilter() {
    const taskFilter = document.getElementById('taskFilter');
    if (!taskFilter) return;

    // Clear existing options except the first one
    while (taskFilter.options.length > 1) {
        taskFilter.remove(1);
    }

    // Add tasks to filter
    allTasks.forEach(task => {
        const option = document.createElement('option');
        option.value = task.id;
        option.textContent = task.title;
        taskFilter.appendChild(option);
    });

    // If no tasks available, disable the filter
    if (allTasks.length === 0) {
        taskFilter.disabled = true;
        const defaultOption = taskFilter.options[0];
        defaultOption.textContent = 'No tasks available';
    } else {
        taskFilter.disabled = false;
        const defaultOption = taskFilter.options[0];
        defaultOption.textContent = 'All Tasks';
    }
}

// Load reviews from backend
async function loadReviews() {
    try {
        let reviews = [];

        if (role === 'CLIENT') {
            // Client can see reviews they've written
            reviews = await apiCall(`${REVIEW_API_URL}/client/${userId}`);
        } else if (role === 'FREELANCER') {
            // Freelancer can see reviews about them
            reviews = await apiCall(`${REVIEW_API_URL}/freelancer/${userId}`);
        } else if (role === 'ADMIN') {
            // Admin can see all reviews
            reviews = await apiCall(REVIEW_API_URL);
        }

        // Store all reviews for filtering
        allReviews = reviews;

        // Update statistics
        updateStatistics(reviews);

        // Apply any existing filters
        applyFilters();

    } catch (error) {
        console.error("Error loading reviews:", error.message);
        showErrorAlert("Error", "Error Loading Reviews: " + error.message);
    }
}

// Update statistics cards
function updateStatistics(reviews) {
    const totalReviewsElem = document.getElementById('totalReviews');
    const avgRatingElem = document.getElementById('avgRating');
    const monthReviewsElem = document.getElementById('monthReviews');
    const pendingReviewsElem = document.getElementById('pendingReviews');

    if (!totalReviewsElem || !avgRatingElem || !monthReviewsElem || !pendingReviewsElem) return;

    const totalReviews = reviews.length;
    const avgRating = totalReviews > 0
        ? (reviews.reduce((sum, review) => sum + review.rating, 0) / totalReviews).toFixed(1)
        : 0;

    // Calculate pending reviews (for admin) or this month's reviews
    const thisMonth = new Date().getMonth();
    const thisYear = new Date().getFullYear();
    const monthReviews = reviews.filter(review => {
        const reviewDate = new Date(review.createdAt || Date.now());
        return reviewDate.getMonth() === thisMonth && reviewDate.getFullYear() === thisYear;
    }).length;

    totalReviewsElem.textContent = totalReviews;
    avgRatingElem.textContent = avgRating;
    monthReviewsElem.textContent = monthReviews;

    // Pending reviews logic would depend on your business rules
    pendingReviewsElem.textContent = '0';
}

// Apply filters to reviews
function applyFilters() {
    // Get filter values
    const ratingFilter = document.getElementById('ratingFilter')?.value || '';
    const taskFilter = document.getElementById('taskFilter')?.value || '';
    const dateFilter = document.getElementById('dateFilter')?.value || '';

    // Start with all reviews
    let filteredReviews = [...allReviews];

    // Apply rating filter
    if (ratingFilter) {
        filteredReviews = filteredReviews.filter(review => review.rating == ratingFilter);
    }

    // Apply task filter
    if (taskFilter) {
        filteredReviews = filteredReviews.filter(review => review.taskId == taskFilter);
    }

    // Apply date filter
    if (dateFilter) {
        const days = parseInt(dateFilter);
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - days);

        filteredReviews = filteredReviews.filter(review => {
            const reviewDate = new Date(review.createdAt || Date.now());
            return reviewDate >= cutoffDate;
        });
    }

    // Display filtered reviews
    displayReviews(filteredReviews);
}

// Clear all filters
function clearFilters() {
    const ratingFilter = document.getElementById('ratingFilter');
    const taskFilter = document.getElementById('taskFilter');
    const dateFilter = document.getElementById('dateFilter');

    if (ratingFilter) ratingFilter.value = '';
    if (taskFilter) taskFilter.value = '';
    if (dateFilter) dateFilter.value = '';

    // Display all reviews
    displayReviews(allReviews);
}

// Display reviews in the UI
function displayReviews(reviews) {
    const reviewsContainer = document.getElementById('reviewsContainer');
    const noReviewsMessage = document.getElementById('noReviewsMessage');

    if (!reviewsContainer || !noReviewsMessage) return;

    // Show message if no reviews
    if (reviews.length === 0) {
        noReviewsMessage.classList.remove('d-none');

        // Show appropriate message based on role
        const clientMessage = document.getElementById('clientMessage');
        const freelancerMessage = document.getElementById('freelancerMessage');
        const adminMessage = document.getElementById('adminMessage');

        if (clientMessage && freelancerMessage && adminMessage) {
            if (role === 'CLIENT') {
                clientMessage.classList.remove('d-none');
                freelancerMessage.classList.add('d-none');
                adminMessage.classList.add('d-none');
            } else if (role === 'FREELANCER') {
                clientMessage.classList.add('d-none');
                freelancerMessage.classList.remove('d-none');
                adminMessage.classList.add('d-none');
            } else {
                clientMessage.classList.add('d-none');
                freelancerMessage.classList.add('d-none');
                adminMessage.classList.remove('d-none');
            }
        }

        reviewsContainer.innerHTML = '';
        return;
    }

    // Hide no reviews message
    noReviewsMessage.classList.add('d-none');

    const clientMessage = document.getElementById('clientMessage');
    const freelancerMessage = document.getElementById('freelancerMessage');
    const adminMessage = document.getElementById('adminMessage');

    if (clientMessage && freelancerMessage && adminMessage) {
        clientMessage.classList.add('d-none');
        freelancerMessage.classList.add('d-none');
        adminMessage.classList.add('d-none');
    }

    // Clear container
    reviewsContainer.innerHTML = '';

    // Add each review to the container
    reviews.forEach(review => {
        const reviewCard = createReviewCard(review);
        reviewsContainer.appendChild(reviewCard);
    });
}

// Create a review card
function createReviewCard(review) {
    const col = document.createElement('div');
    col.className = 'col-md-6 col-lg-4 mb-4';

    // Format date
    const reviewDate = new Date(review.createdAt || Date.now());
    const formattedDate = reviewDate.toLocaleDateString();

    // Create stars HTML
    let starsHtml = '';
    for (let i = 1; i <= 5; i++) {
        starsHtml += `<i class="fas fa-star ${i <= review.rating ? 'star-filled' : ''}"></i>`;
    }

    col.innerHTML = `
        <div class="card review-card h-100">
            <div class="card-body">
                <div class="d-flex justify-content-between align-items-start mb-2">
                    <div>
                        <span class="badge bg-primary badge-status">${review.taskTitle || 'Task #' + review.taskId}</span>
                    </div>
                    <small class="text-muted">${formattedDate}</small>
                </div>
                <div class="mb-2">
                    ${starsHtml}
                </div>
                <p class="card-text">${review.comment}</p>
                <div class="mt-auto">
                    <p class="mb-1"><small class="text-muted">From: ${review.clientName || 'Client #' + review.clientId}</small></p>
                    <p class="mb-0"><small class="text-muted">To: ${review.freelancerName || 'Freelancer #' + review.freelancerId}</small></p>
                </div>
            </div>
            <div class="card-footer bg-transparent">
                <button class="btn btn-sm btn-outline-primary view-details" data-review-id="${review.id}">
                    View Details
                </button>
                ${role === 'ADMIN' || (role === 'CLIENT' && review.clientId == userId) ? `
                <button class="btn btn-sm btn-outline-danger ms-2 delete-review" data-review-id="${review.id}">
                    Delete
                </button>
                ` : ''}
            </div>
        </div>
    `;

    // Add event listeners
    const card = col.querySelector('.card');
    const viewDetailsBtn = card.querySelector('.view-details');

    if (viewDetailsBtn) {
        viewDetailsBtn.addEventListener('click', () => showReviewDetails(review));
    }

    const deleteBtn = card.querySelector('.delete-review');
    if (deleteBtn) {
        deleteBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            confirmDeleteReview(review.id);
        });
    }

    return col;
}

// Show review details in modal
function showReviewDetails(review) {
    const detailModal = document.getElementById('reviewDetailModal');
    if (!detailModal) return;

    // Format date
    const reviewDate = new Date(review.createdAt || Date.now());
    const formattedDate = reviewDate.toLocaleDateString();

    // Create stars HTML
    let starsHtml = '';
    for (let i = 1; i <= 5; i++) {
        starsHtml += `<i class="fas fa-star ${i <= review.rating ? 'star-filled' : ''}"></i>`;
    }

    // Populate modal
    const detailTaskTitle = document.getElementById('detailTaskTitle');
    const detailDate = document.getElementById('detailDate');
    const detailClient = document.getElementById('detailClient');
    const detailFreelancer = document.getElementById('detailFreelancer');
    const detailRating = document.getElementById('detailRating');
    const detailComment = document.getElementById('detailComment');

    if (detailTaskTitle) detailTaskTitle.textContent = review.taskTitle || 'Task #' + review.taskId;
    if (detailDate) detailDate.textContent = formattedDate;
    if (detailClient) detailClient.textContent = review.clientName || 'Client #' + review.clientId;
    if (detailFreelancer) detailFreelancer.textContent = review.freelancerName || 'Freelancer #' + review.freelancerId;
    if (detailRating) detailRating.innerHTML = starsHtml;
    if (detailComment) detailComment.textContent = review.comment;

    // Show/hide delete button based on permissions
    const deleteBtn = document.getElementById('deleteReviewBtn');
    if (deleteBtn) {
        if (role === 'ADMIN' || (role === 'CLIENT' && review.clientId == userId)) {
            deleteBtn.classList.remove('d-none');
            deleteBtn.setAttribute('data-review-id', review.id);
        } else {
            deleteBtn.classList.add('d-none');
        }
    }

    // Show modal
    const modal = new bootstrap.Modal(detailModal);
    modal.show();
}

// Confirm delete review
async function confirmDeleteReview(reviewId) {
    const result = await showConfirmAlert(
        "Are you sure?",
        "This review will be permanently deleted."
    );
    if (result.isConfirmed) {
        // Set the review ID on the delete button
        const deleteBtn = document.getElementById('deleteReviewBtn');
        if (deleteBtn) {
            deleteBtn.setAttribute('data-review-id', reviewId);
        }
        deleteReview();
    }
}

// Delete review
async function deleteReview() {
    const deleteBtn = document.getElementById('deleteReviewBtn');
    if (!deleteBtn) return;

    const reviewId = deleteBtn.getAttribute('data-review-id');
    if (!reviewId) return;

    try {
        await apiCall(`${REVIEW_API_URL}/${reviewId}`, 'DELETE');
        showSuccessAlert("Deleted", "Review deleted successfully!");

        // Close modal if open
        const modalElement = document.getElementById('reviewDetailModal');
        if (modalElement) {
            const modal = bootstrap.Modal.getInstance(modalElement);
            if (modal) modal.hide();
        }

        // Reload reviews
        loadReviews();
    } catch (error) {
        console.error('Error deleting review:', error.message);
        showErrorAlert("Error", "Error deleting review: " + error.message);
    }
}
