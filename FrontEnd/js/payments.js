const PAYMENT_API_URL = "http://localhost:8085/api/v1/payments";

const token = localStorage.getItem("token");
const role = localStorage.getItem("role");
const userId = localStorage.getItem("userId");

// Pagination variables
let currentPage = 1;
const paymentsPerPage = 6;
let totalPayments = 0;
let allPayments = [];
let currentFilters = {
    status: '',
    date: '',
    amount: ''
};

// Initialize the page
document.addEventListener('DOMContentLoaded', function() {
    setupEventListeners();
    loadPayments();
    updateCounterpartyHeader();
});

function setupEventListeners() {
    document.getElementById('btn-refresh').addEventListener('click', loadPayments);
    document.getElementById('applyFilters').addEventListener('click', applyFilters);
    document.getElementById('clearFilters').addEventListener('click', clearFilters);
}

function updateCounterpartyHeader() {
    const header = document.getElementById('counterpartyHeader');
    if (role === "CLIENT") {
        header.textContent = "Freelancer";
    } else if (role === "FREELANCER") {
        header.textContent = "Client";
    } else {
        header.textContent = "Parties";
    }
}

async function loadPayments() {
    try {
        let payments = [];

        if (role === "CLIENT") {
            payments = await apiCall(`${PAYMENT_API_URL}/client/${userId}`);
        } else if (role === "FREELANCER") {
            payments = await apiCall(`${PAYMENT_API_URL}/freelancer/${userId}`);
        } else if (role === "ADMIN") {
            payments = await apiCall(PAYMENT_API_URL);
        }

        allPayments = payments;
        totalPayments = payments.length;

        updateStats(payments);
        renderPaymentsWithPagination();

    } catch (error) {
        console.error("Error loading payments:", error);
        showError("Failed to load payments. Please try again.");
    }
}

function updateStats(payments) {
    const total = payments.length;
    const completed = payments.filter(p => p.paymentStatus === "COMPLETED").length;
    const pending = payments.filter(p => p.paymentStatus === "PENDING").length;

    document.getElementById('totalPayments').textContent = total;
    document.getElementById('completedPayments').textContent = completed;
    document.getElementById('pendingPayments').textContent = pending;
}

function applyFilters() {
    currentFilters = {
        status: document.getElementById('statusFilter').value,
        date: document.getElementById('dateFilter').value,
        amount: document.getElementById('amountFilter').value
    };

    currentPage = 1;
    renderPaymentsWithPagination();
}

function clearFilters() {
    document.getElementById('statusFilter').value = '';
    document.getElementById('dateFilter').value = '';
    document.getElementById('amountFilter').value = '';

    currentFilters = {
        status: '',
        date: '',
        amount: ''
    };

    currentPage = 1;
    renderPaymentsWithPagination();
}

function filterPayments(payments) {
    return payments.filter(payment => {
        // Status filter
        if (currentFilters.status && payment.paymentStatus !== currentFilters.status) {
            return false;
        }

        // Date filter
        if (currentFilters.date) {
            const days = parseInt(currentFilters.date);
            const paymentDate = new Date(payment.paymentDate);
            const filterDate = new Date();
            filterDate.setDate(filterDate.getDate() - days);

            if (paymentDate < filterDate) {
                return false;
            }
        }

        // Amount filter
        if (currentFilters.amount) {
            const amount = payment.amount;
            switch (currentFilters.amount) {
                case "0-1000":
                    if (amount > 1000) return false;
                    break;
                case "1000-5000":
                    if (amount < 1000 || amount > 5000) return false;
                    break;
                case "5000+":
                    if (amount < 5000) return false;
                    break;
            }
        }

        return true;
    });
}

function renderPaymentsWithPagination() {
    const filteredPayments = filterPayments(allPayments);
    const totalPages = Math.ceil(filteredPayments.length / paymentsPerPage);

    // Show empty state if no payments
    if (filteredPayments.length === 0) {
        document.getElementById('paymentTableBody').innerHTML = '';
        document.getElementById('emptyState').classList.remove('d-none');
        document.getElementById('pagination').innerHTML = '';
        return;
    }

    document.getElementById('emptyState').classList.add('d-none');

    const startIndex = (currentPage - 1) * paymentsPerPage;
    const endIndex = startIndex + paymentsPerPage;
    const paginatedPayments = filteredPayments.slice(startIndex, endIndex);

    renderPayments(paginatedPayments);
    renderPagination(filteredPayments.length);
}

function renderPayments(payments) {
    const tbody = document.getElementById('paymentTableBody');
    tbody.innerHTML = '';

    payments.forEach(payment => {
        const row = document.createElement('tr');

        const counterparty = role === "CLIENT" ?
            payment.freelancerName :
            payment.clientName;

        const statusBadge = getPaymentStatusBadge(payment.paymentStatus);

        row.innerHTML = `
            <td>${payment.taskTitle}</td>
            <td>Rs ${payment.amount.toFixed(2)}</td>
            <td>${new Date(payment.paymentDate).toLocaleDateString()}</td>
            <td>${statusBadge}</td>
            <td>${counterparty}</td>
            <td class="payment-actions">
                <button class="btn btn-sm btn-outline-primary view-payment" data-payment-id="${payment.id}">
                    <i class="fas fa-eye"></i> View
                </button>
            </td>
        `;

        tbody.appendChild(row);
    });

    // Add event listeners to view buttons
    document.querySelectorAll('.view-payment').forEach(button => {
        button.addEventListener('click', function() {
            const paymentId = this.getAttribute('data-payment-id');
            showPaymentDetails(paymentId);
        });
    });
}

function getPaymentStatusBadge(status) {
    switch (status) {
        case "COMPLETED":
            return `<span class="badge bg-success payment-status-badge">Completed</span>`;
        case "PENDING":
            return `<span class="badge bg-warning text-dark payment-status-badge">Pending</span>`;
        case "FAILED":
            return `<span class="badge bg-danger payment-status-badge">Failed</span>`;
        default:
            return `<span class="badge bg-secondary payment-status-badge">${status}</span>`;
    }
}

function renderPagination(totalPayments) {
    const totalPages = Math.ceil(totalPayments / paymentsPerPage);
    const paginationContainer = document.getElementById('pagination');
    paginationContainer.innerHTML = '';

    if (totalPages <= 1) return;

    // Previous button
    const prevLi = document.createElement('li');
    prevLi.className = `page-item ${currentPage === 1 ? 'disabled' : ''}`;
    prevLi.innerHTML = `<a class="page-link" href="#" data-page="${currentPage - 1}">Previous</a>`;
    paginationContainer.appendChild(prevLi);

    // Page numbers
    for (let i = 1; i <= totalPages; i++) {
        const pageLi = document.createElement('li');
        pageLi.className = `page-item ${currentPage === i ? 'active' : ''}`;
        pageLi.innerHTML = `<a class="page-link" href="#" data-page="${i}">${i}</a>`;
        paginationContainer.appendChild(pageLi);
    }

    // Next button
    const nextLi = document.createElement('li');
    nextLi.className = `page-item ${currentPage === totalPages ? 'disabled' : ''}`;
    nextLi.innerHTML = `<a class="page-link" href="#" data-page="${currentPage + 1}">Next</a>`;
    paginationContainer.appendChild(nextLi);

    // Add event listeners to pagination links
    paginationContainer.addEventListener('click', function(e) {
        if (e.target.tagName === 'A') {
            e.preventDefault();
            const page = parseInt(e.target.getAttribute('data-page'));
            if (page && page !== currentPage) {
                currentPage = page;
                renderPaymentsWithPagination();
            }
        }
    });
}

async function showPaymentDetails(paymentId) {
    try {
        const payment = await apiCall(`${PAYMENT_API_URL}/${paymentId}`);

        const detailsContent = document.getElementById('paymentDetailsContent');
        detailsContent.innerHTML = `
            <div class="row">
                <div class="col-md-6">
                    <h6>Task Information</h6>
                    <p><strong>Task:</strong> ${payment.taskTitle}</p>
                    <p><strong>Amount:</strong> Rs ${payment.amount.toFixed(2)}</p>
                    <p><strong>Currency:</strong> ${payment.currency || 'LKR'}</p>
                </div>
                <div class="col-md-6">
                    <h6>Payment Information</h6>
                    <p><strong>Date:</strong> ${new Date(payment.paymentDate).toLocaleDateString()}</p>
                    <p><strong>Status:</strong> ${getPaymentStatusBadge(payment.paymentStatus)}</p>
                    ${payment.stripeSessionId ? `<p><strong>Stripe Session ID:</strong> ${payment.stripeSessionId}</p>` : ''}
                </div>
            </div>
            <div class="row mt-3">
                <div class="col-md-6">
                    <h6>Client Information</h6>
                    <p><strong>Name:</strong> ${payment.clientName}</p>
                    <p><strong>ID:</strong> ${payment.clientId}</p>
                </div>
                <div class="col-md-6">
                    <h6>Freelancer Information</h6>
                    <p><strong>Name:</strong> ${payment.freelancerName}</p>
                    <p><strong>ID:</strong> ${payment.freelancerId}</p>
                </div>
            </div>
        `;

        const modal = new bootstrap.Modal(document.getElementById('paymentDetailsModal'));
        modal.show();

    } catch (error) {
        console.error("Error loading payment details:", error);
        showError("Failed to load payment details.");
    }
}

function showError(message) {
    // Create and show error toast/alert
    const alert = document.createElement('div');
    alert.className = 'alert alert-danger alert-dismissible fade show position-fixed';
    alert.style.top = '20px';
    alert.style.right = '20px';
    alert.style.zIndex = '9999';
    alert.style.minWidth = '300px';
    alert.innerHTML = `
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    `;

    document.body.appendChild(alert);

    // Auto remove after 5 seconds
    setTimeout(() => {
        if (alert.parentNode) {
            alert.parentNode.removeChild(alert);
        }
    }, 5000);
}

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
