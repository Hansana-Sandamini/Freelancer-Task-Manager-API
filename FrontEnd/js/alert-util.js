// Success alert
export function showSuccessAlert(title, message, confirmButtonText = 'OK') {
    return Swal.fire({
        icon: 'success',
        title: title,
        text: message,
        confirmButtonText: confirmButtonText,
        confirmButtonColor: '#4e73df',
        timer: 10000,
        timerProgressBar: true,
        showCloseButton: true
    });
}

// Error alert
export function showErrorAlert(title, message, confirmButtonText = 'OK') {
    return Swal.fire({
        icon: 'error',
        title: title,
        text: message,
        confirmButtonText: confirmButtonText,
        confirmButtonColor: '#e74a3b',
        timer: 10000,
        timerProgressBar: true,
        showCloseButton: true
    });
}

// Warning alert
export function showWarningAlert(title, message, confirmButtonText = 'OK') {
    return Swal.fire({
        icon: 'warning',
        title: title,
        text: message,
        confirmButtonText: confirmButtonText,
        confirmButtonColor: '#f6c23e',
        timer: 10000,
        timerProgressBar: true,
        showCloseButton: true
    });
}

// Info alert
export function showInfoAlert(title, message, confirmButtonText = 'OK') {
    return Swal.fire({
        icon: 'info',
        title: title,
        text: message,
        confirmButtonText: confirmButtonText,
        confirmButtonColor: '#36b9cc',
        timer: 10000,
        timerProgressBar: true,
        showCloseButton: true
    });
}

// Question/Confirmation alert
export function showConfirmAlert(title, message, confirmButtonText = 'Yes', cancelButtonText = 'Cancel') {
    return Swal.fire({
        icon: 'question',
        title: title,
        text: message,
        showCancelButton: true,
        confirmButtonText: confirmButtonText,
        cancelButtonText: cancelButtonText,
        confirmButtonColor: '#4e73df',
        cancelButtonColor: '#6c757d',
        showCloseButton: true
    }).then((result) => {
        return result.isConfirmed; // true if user clicked "Yes", false otherwise
    });
}

// Close any open alert
export function closeAlert() {
    Swal.close();
}
