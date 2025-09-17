const STRIPE_PUBLIC_KEY = "pk_test_51S6ZBnFQgJWoxJFed40OYrsDWSXufK1kJL2BOb1miDMmeGJUmCxeuMQZh7MAgGvTo3qml5nmqJ45xBYZ8ZNyVHIX001bXmCRhQ";
const PAYMENT_API = "http://localhost:8085/api/v1/payments";

// Get token from localStorage
const token = localStorage.getItem("token");

// Initialize payment functionality
function initPaymentHandlers() {
    // Add event listener for pay buttons
    document.addEventListener('click', async (e) => {
        const payButton = e.target.closest('.pay-button');
        if (payButton) {
            const taskId = payButton.getAttribute('data-task-id');
            await initiatePayment(taskId);
        }
    });
}

// Initiate payment process
async function initiatePayment(taskId) {
    try {
        showPaymentLoading(true);

        const response = await fetch(`${PAYMENT_API}/create-checkout-session/${taskId}`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`
            }
        });

        const result = await response.json();

        if (result.code === 200) {
            // Redirect to Stripe Checkout
            const stripe = Stripe(STRIPE_PUBLIC_KEY);
            const { error } = await stripe.redirectToCheckout({
                sessionId: result.data
            });

            if (error) {
                showPaymentError("Payment initialization failed: " + error.message);
            }
        } else {
            showPaymentError("Failed to initiate payment: " + result.message);
        }
    } catch (error) {
        console.error("Error initiating payment:", error);
        showPaymentError("Error initiating payment. Please try again.");
    } finally {
        showPaymentLoading(false);
    }
}

// Show payment loading state
function showPaymentLoading(show) {
    let loadingElement = document.getElementById('paymentLoading');

    if (!loadingElement) {
        loadingElement = document.createElement('div');
        loadingElement.id = 'paymentLoading';
        loadingElement.className = 'payment-loading';
        loadingElement.innerHTML = `
            <div class="payment-loading-content">
                <div class="spinner-border text-primary" role="status">
                    <span class="visually-hidden">Loading...</span>
                </div>
                <p>Processing payment...</p>
            </div>
        `;
        document.body.appendChild(loadingElement);
    }

    loadingElement.style.display = show ? 'flex' : 'none';
}

// Show payment error
function showPaymentError(message) {
    // Remove any existing error modal
    const existingModal = document.getElementById('paymentErrorModal');
    if (existingModal) {
        existingModal.remove();
    }

    // Create error modal
    const errorModal = document.createElement('div');
    errorModal.id = 'paymentErrorModal';
    errorModal.className = 'modal fade';
    errorModal.innerHTML = `
        <div class="modal-dialog">
            <div class="modal-content">
                <div class="modal-header bg-danger text-white">
                    <h5 class="modal-title">Payment Error</h5>
                    <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                </div>
                <div class="modal-body">
                    <p>${message}</p>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Close</button>
                </div>
            </div>
        </div>
    `;

    document.body.appendChild(errorModal);

    // Show the modal
    const modal = new bootstrap.Modal(errorModal);
    modal.show();

    // Remove modal from DOM when hidden
    errorModal.addEventListener('hidden.bs.modal', function () {
        errorModal.remove();
    });
}

// Check payment status for a task
async function checkPaymentStatus(taskId) {
    try {
        const payment = await apiCall(`${PAYMENT_API}/task/${taskId}`);
        return payment;
    } catch (error) {
        console.error("Error checking payment status:", error);
        return null;
    }
}

// Load payment history for current user
async function loadPaymentHistory() {
    try {
        const role = localStorage.getItem("role");
        const userId = localStorage.getItem("userId");

        let payments = [];
        if (role === "CLIENT") {
            payments = await apiCall(`${PAYMENT_API}/client/${userId}`);
        } else if (role === "FREELANCER") {
            payments = await apiCall(`${PAYMENT_API}/freelancer/${userId}`);
        } else if (role === "ADMIN") {
            payments = await apiCall(PAYMENT_API);
        }

        return payments;
    } catch (error) {
        console.error("Error loading payment history:", error);
        return [];
    }
}

// Render payment history
function renderPaymentHistory(payments, containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;

    if (payments.length === 0) {
        container.innerHTML = `
            <div class="text-center py-5">
                <i class="fas fa-receipt fa-3x text-muted mb-3"></i>
                <h4 class="text-muted">No payments found</h4>
                <p>You haven't made or received any payments yet.</p>
            </div>
        `;
        return;
    }

    let html = `
        <div class="table-responsive">
            <table class="table table-striped table-hover">
                <thead class="table-dark">
                    <tr>
                        <th>Task</th>
                        <th>Amount</th>
                        <th>Date</th>
                        <th>Status</th>
                        <th>${localStorage.getItem("role") === "CLIENT" ? "Freelancer" : "Client"}</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
    `;

    payments.forEach(payment => {
        html += `
            <tr>
                <td>${payment.taskTitle}</td>
                <td>Rs ${payment.amount.toFixed(2)}</td>
                <td>${new Date(payment.paymentDate).toLocaleDateString()}</td>
                <td>${getPaymentStatusBadge(payment.paymentStatus)}</td>
                <td>${localStorage.getItem("role") === "CLIENT" ? payment.freelancerName : payment.clientName}</td>
                <td>
                    <button class="btn btn-sm btn-outline-primary view-payment-details" data-payment-id="${payment.id}">
                        <i class="fas fa-eye"></i> Details
                    </button>
                </td>
            </tr>
        `;
    });

    html += `
                </tbody>
            </table>
        </div>
    `;

    container.innerHTML = html;

    // Add event listeners for view details buttons
    container.querySelectorAll('.view-payment-details').forEach(button => {
        button.addEventListener('click', function() {
            const paymentId = this.getAttribute('data-payment-id');
            showPaymentDetails(paymentId);
        });
    });
}

// Get payment status badge
function getPaymentStatusBadge(status) {
    switch (status) {
        case "COMPLETED":
            return `<span class="badge bg-success">Completed</span>`;
        case "PENDING":
            return `<span class="badge bg-warning text-dark">Pending</span>`;
        case "FAILED":
            return `<span class="badge bg-danger">Failed</span>`;
        default:
            return `<span class="badge bg-secondary">${status}</span>`;
    }
}

// Show payment details
async function showPaymentDetails(paymentId) {
    try {
        const payment = await apiCall(`${PAYMENT_API}/${paymentId}`);

        // Create and show modal with payment details
        const modalHtml = `
            <div class="modal fade" id="paymentDetailsModal" tabindex="-1" aria-hidden="true">
                <div class="modal-dialog">
                    <div class="modal-content">
                        <div class="modal-header bg-primary text-white">
                            <h5 class="modal-title">Payment Details</h5>
                            <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                        </div>
                        <div class="modal-body">
                            <div class="row mb-3">
                                <div class="col-md-6">
                                    <strong>Task:</strong> ${payment.taskTitle}
                                </div>
                                <div class="col-md-6">
                                    <strong>Amount:</strong> Rs ${payment.amount.toFixed(2)}
                                </div>
                            </div>
                            <div class="row mb-3">
                                <div class="col-md-6">
                                    <strong>Date:</strong> ${new Date(payment.paymentDate).toLocaleDateString()}
                                </div>
                                <div class="col-md-6">
                                    <strong>Status:</strong> ${getPaymentStatusBadge(payment.paymentStatus)}
                                </div>
                            </div>
                            <div class="row mb-3">
                                <div class="col-md-6">
                                    <strong>Client:</strong> ${payment.clientName}
                                </div>
                                <div class="col-md-6">
                                    <strong>Freelancer:</strong> ${payment.freelancerName}
                                </div>
                            </div>
                            ${payment.stripeSessionId ? `
                            <div class="row mb-3">
                                <div class="col-12">
                                    <strong>Stripe Session ID:</strong> ${payment.stripeSessionId}
                                </div>
                            </div>
                            ` : ''}
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Close</button>
                        </div>
                    </div>
                </div>
            </div>
        `;

        // Remove any existing modal
        const existingModal = document.getElementById('paymentDetailsModal');
        if (existingModal) {
            existingModal.remove();
        }

        // Add new modal to DOM
        document.body.insertAdjacentHTML('beforeend', modalHtml);

        // Show the modal
        const modal = new bootstrap.Modal(document.getElementById('paymentDetailsModal'));
        modal.show();

        // Remove modal from DOM when hidden
        document.getElementById('paymentDetailsModal').addEventListener('hidden.bs.modal', function () {
            this.remove();
        });

    } catch (error) {
        console.error("Error loading payment details:", error);
        showPaymentError("Failed to load payment details.");
    }
}

// Initialize payment functionality when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    initPaymentHandlers();
});

// Export functions for use in other modules
window.paymentModule = {
    initiatePayment,
    checkPaymentStatus,
    loadPaymentHistory,
    renderPaymentHistory
};
