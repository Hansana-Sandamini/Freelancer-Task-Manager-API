const CATEGORY_API_BASE = "http://localhost:8085/api/v1/task-categories";

const taskCategoryTableBody = document.getElementById("taskCategoryTableBody");
const taskForm = document.getElementById("taskForm");
const taskTitle = document.getElementById("taskTitle");
const taskDescription = document.getElementById("taskDescription");

// Edit form elements
const editTaskForm = document.getElementById("editTaskForm");
const editCategoryId = document.getElementById("editCategoryId");
const editTaskTitle = document.getElementById("editTaskTitle");
const editTaskDescription = document.getElementById("editTaskDescription");

// Load all categories on page load
document.addEventListener("DOMContentLoaded", () => {
    loadTaskCategories();
});

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
            renderTable(data.data);
        } else {
            alert("Error fetching categories: " + data.message);
        }
    } catch (error) {
        console.error("Error loading categories:", error);
    }
}

// ==================== Render Table ====================
function renderTable(categories) {
    taskCategoryTableBody.innerHTML = "";
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
taskForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const newCategory = {
        name: taskTitle.value,
        description: taskDescription.value
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
            taskForm.reset();
            bootstrap.Modal.getInstance(document.getElementById("newTaskCategoryModal")).hide();
            alert("Category added successfully!");
        } else {
            alert("Error adding category: " + data.message);
        }
    } catch (error) {
        console.error("Error adding category:", error);
        alert("Error adding category. Please try again.");
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
            editTaskTitle.value = category.name;
            editTaskDescription.value = category.description;

            // Show the modal
            const editModal = new bootstrap.Modal(document.getElementById('editTaskCategoryModal'));
            editModal.show();
        } else {
            alert("Error fetching category details: " + data.message);
        }
    } catch (error) {
        console.error("Error fetching category:", error);
        alert("Error fetching category details. Please try again.");
    }
}

// ==================== Update Category ====================
editTaskForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const updatedCategory = {
        id: editCategoryId.value,
        name: editTaskTitle.value,
        description: editTaskDescription.value
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
            alert("Category updated successfully!");
        } else {
            alert("Error updating category: " + data.message);
        }
    } catch (error) {
        console.error("Error updating category:", error);
        alert("Error updating category. Please try again.");
    }
});

// ==================== Delete Category ====================
async function deleteCategory(id) {
    if (!confirm("Are you sure you want to delete this category?")) return;

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
            alert("Category deleted successfully!");
        } else {
            alert("Error deleting category: " + data.message);
        }
    } catch (error) {
        console.error("Error deleting category:", error);
        alert("Error deleting category. Please try again.");
    }
}
