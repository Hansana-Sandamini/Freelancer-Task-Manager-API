const CATEGORY_API_BASE = "http://localhost:8085/api/v1/task-categories";
import { showSuccessAlert, showErrorAlert, showConfirmAlert } from './alert-util.js';

const taskCategoryTableBody = document.getElementById("taskCategoryTableBody");
const taskCategoryForm = document.getElementById("taskCategoryForm");
const taskCategoryName = document.getElementById("taskCategoryName");
const taskCategoryDescription = document.getElementById("taskCategoryDescription");

// Edit form elements
const editTaskCategoryForm = document.getElementById("editTaskCategoryForm");
const editCategoryId = document.getElementById("editCategoryId");
const editTaskCategoryName = document.getElementById("editTaskCategoryName");
const editTaskCategoryDescription = document.getElementById("editTaskCategoryDescription");

// Pagination elements
const paginationContainer = document.getElementById("pagination");
const resultsCount = document.getElementById("resultsCount");
const searchInput = document.getElementById("searchInput");
const searchButton = document.getElementById("searchButton");
const clearSearchButton = document.getElementById("clearSearchButton");
const itemsPerPageSelect = document.getElementById("itemsPerPageSelect");

// Pagination variables
let currentPage = 1;
let itemsPerPage = 8;
let allCategories = [];
let filteredCategories = [];
let currentSearchTerm = '';

// Load all categories on page load
document.addEventListener("DOMContentLoaded", () => {
    loadTaskCategories();
    setupEventListeners();
});

// Setup event listeners
function setupEventListeners() {
    searchButton.addEventListener('click', applySearch);
    clearSearchButton.addEventListener('click', clearSearch);
    searchInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            applySearch();
        }
    });
    itemsPerPageSelect.addEventListener('change', (e) => {
        itemsPerPage = parseInt(e.target.value);
        currentPage = 1;
        renderTableWithPagination();
    });
}

// ==================== Load Categories ====================
async function loadTaskCategories() {
    try {
        const response = await fetch(CATEGORY_API_BASE, {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
                "Authorization": "Bearer " + localStorage.getItem("token")
            }
        });

        const data = await response.json();

        if (data.code === 200) {
            allCategories = data.data;
            filteredCategories = [...allCategories];
            currentPage = 1;
            renderTableWithPagination();
        } else {
            showErrorAlert("Error", "Error fetching categories: " + data.message);
        }
    } catch (error) {
        console.error("Error loading categories:", error);
        showErrorAlert("Error", "Failed to load categories.");
    }
}

// ==================== Search Functions ====================
function applySearch() {
    currentSearchTerm = searchInput.value.toLowerCase().trim();
    filterCategories();
}

function clearSearch() {
    searchInput.value = '';
    currentSearchTerm = '';
    filterCategories();
}

function filterCategories() {
    if (!currentSearchTerm) {
        filteredCategories = [...allCategories];
    } else {
        filteredCategories = allCategories.filter(category =>
            category.name.toLowerCase().includes(currentSearchTerm) ||
            category.description.toLowerCase().includes(currentSearchTerm)
        );
    }

    currentPage = 1;
    renderTableWithPagination();
}

// ==================== Pagination Functions ====================
function renderPagination() {
    const totalPages = Math.ceil(filteredCategories.length / itemsPerPage);
    paginationContainer.innerHTML = '';

    if (totalPages <= 1) return;

    // Previous button
    const prevLi = document.createElement('li');
    prevLi.className = `page-item ${currentPage === 1 ? 'disabled' : ''}`;
    prevLi.innerHTML = `<a class="page-link" href="#" data-page="${currentPage - 1}">Previous</a>`;
    paginationContainer.appendChild(prevLi);

    // Page numbers
    const maxVisiblePages = 5;
    let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

    if (endPage - startPage + 1 < maxVisiblePages) {
        startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }

    for (let i = startPage; i <= endPage; i++) {
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
                renderTableWithPagination();
            }
        }
    });
}

function getPaginatedCategories() {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return filteredCategories.slice(startIndex, endIndex);
}

function renderTableWithPagination() {
    const paginatedCategories = getPaginatedCategories();
    renderTable(paginatedCategories);
    renderPagination();
    updateResultsCount();
}

function updateResultsCount() {
    const startIndex = (currentPage - 1) * itemsPerPage + 1;
    const endIndex = Math.min(currentPage * itemsPerPage, filteredCategories.length);
    resultsCount.textContent = `Showing ${startIndex}-${endIndex} of ${filteredCategories.length} categories`;

    if (currentSearchTerm) {
        resultsCount.textContent += ` for "${currentSearchTerm}"`;
    }
}

// ==================== Render Table ====================
function renderTable(categories) {
    taskCategoryTableBody.innerHTML = "";

    if (categories.length === 0) {
        taskCategoryTableBody.innerHTML = `
            <tr>
                <td colspan="4" class="text-center py-4 text-muted">
                    <i class="fas fa-database fa-2x mb-2"></i>
                    <p>No categories found${currentSearchTerm ? ' matching your search' : ''}</p>
                </td>
            </tr>
        `;
        return;
    }

    categories.forEach(category => {
        const row = `
            <tr>
                <td>${category.id}</td>
                <td>${category.name}</td>
                <td>${category.description}</td>
                <td>
                    <button class="btn btn-sm btn-warning me-2" onclick="openEditModal(${category.id})">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn btn-sm btn-danger" onclick="deleteCategory(${category.id})">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            </tr>
        `;
        taskCategoryTableBody.insertAdjacentHTML("beforeend", row);
    });
}

// ==================== Add New Category ====================
taskCategoryForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const newCategory = {
        name: taskCategoryName.value,
        description: taskCategoryDescription.value
    };

    try {
        const response = await fetch(CATEGORY_API_BASE, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": "Bearer " + localStorage.getItem("token")
            },
            body: JSON.stringify(newCategory)
        });

        const data = await response.json();

        if (data.code === 201) {
            loadTaskCategories();
            taskCategoryForm.reset();
            bootstrap.Modal.getInstance(document.getElementById("newTaskCategoryModal")).hide();
            showSuccessAlert("Success", "Category added successfully!");
        } else {
            showErrorAlert("Error", "Error adding category: " + data.message);
        }
    } catch (error) {
        console.error("Error adding category:", error);
        showErrorAlert("Error", "Error adding category. Please try again.");
    }
});

// ==================== Open Edit Modal ====================
async function openEditModal(id) {
    try {
        const response = await fetch(`${CATEGORY_API_BASE}/${id}`, {
            method: "GET",
            headers: {
                "Authorization": "Bearer " + localStorage.getItem("token")
            }
        });

        const data = await response.json();

        if (data.code === 200) {
            const category = data.data;
            editCategoryId.value = category.id;
            editTaskCategoryName.value = category.name;
            editTaskCategoryDescription.value = category.description;

            // Show the modal
            const editModal = new bootstrap.Modal(document.getElementById('editTaskCategoryModal'));
            editModal.show();
        } else {
            showErrorAlert("Error", "Error fetching category details: " + data.message);
        }
    } catch (error) {
        console.error("Error fetching category:", error);
        showErrorAlert("Error", "Error fetching category details. Please try again.");
    }
}
window.openEditModal = openEditModal;

// ==================== Update Category ====================
editTaskCategoryForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const updatedCategory = {
        id: editCategoryId.value,
        name: editTaskCategoryName.value,
        description: editTaskCategoryDescription.value
    };

    try {
        const response = await fetch(`${CATEGORY_API_BASE}/${editCategoryId.value}`, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json",
                "Authorization": "Bearer " + localStorage.getItem("token")
            },
            body: JSON.stringify(updatedCategory)
        });

        const data = await response.json();

        if (data.code === 200) {
            loadTaskCategories();
            bootstrap.Modal.getInstance(document.getElementById("editTaskCategoryModal")).hide();
            showSuccessAlert("Success", "Category updated successfully!");
        } else {
            showErrorAlert("Error", "Error updating category: " + data.message);
        }
    } catch (error) {
        console.error("Error updating category:", error);
        showErrorAlert("Error", "Error updating category. Please try again.");
    }
});

// ==================== Delete Category ====================
async function deleteCategory(id) {
    const confirmed = await showConfirmAlert("Are you sure?", "This category will be permanently deleted.");
    if (!confirmed) return;

    try {
        const response = await fetch(`${CATEGORY_API_BASE}/${id}`, {
            method: "DELETE",
            headers: {
                "Authorization": "Bearer " + localStorage.getItem("token")
            }
        });

        const data = await response.json();

        if (data.code === 200) {
            loadTaskCategories();
            showSuccessAlert("Deleted", "Category deleted successfully!");
        } else {
            alert("Error deleting category: " + data.message);
        }
    } catch (error) {
        console.error("Error deleting category:", error);
        showErrorAlert("Error", "Error deleting category. Please try again.");
    }
}
window.deleteCategory = deleteCategory;
