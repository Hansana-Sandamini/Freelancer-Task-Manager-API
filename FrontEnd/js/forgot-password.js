const API_AUTH_URL = 'http://localhost:8085/api/v1/auth';

// DOM Elements
const steps = document.querySelectorAll('.step');
const resetEmailInput = document.getElementById('resetEmail');
const verificationCodeInput = document.getElementById('verificationCode');
const newPasswordInput = document.getElementById('newPassword');
const confirmPasswordInput = document.getElementById('confirmPassword');
const emailSentTo = document.getElementById('emailSentTo');
const resendCodeLink = document.getElementById('resendCode');
const countdownElement = document.getElementById('countdown');
const sendCodeButton = document.getElementById('sendCodeButton');
const verifyCodeButton = document.getElementById('verifyCodeButton');
const resetPasswordButton = document.getElementById('resetPasswordButton');
const backToEmailStep = document.getElementById('backToEmailStep');
const backToCodeStep = document.getElementById('backToCodeStep');

// State
let currentStep = 1;
let countdownInterval;
let userEmail = '';

// API Helper
async function apiCall(url, method, data) {
    try {
        const response = await fetch(url, {
            method,
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(data)
        });

        const result = await response.json();

        if (!response.ok) {
            throw new Error(result.message || "Request failed");
        }

        return result;
    } catch (error) {
        console.error("API call error:", error);
        throw error;
    }
}

// Show specific step
function showStep(step) {
    steps.forEach(s => s.classList.remove('active'));
    steps[step - 1].classList.add('active');
    currentStep = step;
}

// Start countdown timer
function startCountdown() {
    let timeLeft = 60;
    countdownElement.textContent = timeLeft;
    resendCodeLink.classList.add('disabled');

    countdownInterval = setInterval(() => {
        timeLeft--;
        countdownElement.textContent = timeLeft;
        if (timeLeft <= 0) {
            clearInterval(countdownInterval);
            resendCodeLink.classList.remove('disabled');
            countdownElement.textContent = '';
        }
    }, 1000);
}

// Clear validation errors
function clearErrors() {
    resetEmailInput.classList.remove('is-invalid');
    verificationCodeInput.classList.remove('is-invalid');
    newPasswordInput.classList.remove('is-invalid');
    confirmPasswordInput.classList.remove('is-invalid');
}

// Validate email
function validateEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
}

// Event Listeners
sendCodeButton.addEventListener('click', async () => {
    clearErrors();
    const email = resetEmailInput.value.trim();

    if (!validateEmail(email)) {
        resetEmailInput.classList.add('is-invalid');
        return;
    }

    try {
        // Simulate API call
        await apiCall(`${API_AUTH_URL}/forgot-password`, 'POST', { email });
        userEmail = email;
        emailSentTo.textContent = email;
        showStep(2);
        startCountdown();
    } catch (error) {
        resetEmailInput.classList.add('is-invalid');
        document.getElementById('emailError').textContent = error.message || 'Failed to send verification code.';
    }
});

verifyCodeButton.addEventListener('click', async () => {
    clearErrors();
    const code = verificationCodeInput.value.trim();

    if (code.length !== 6 || !/^\d+$/.test(code)) {
        verificationCodeInput.classList.add('is-invalid');
        return;
    }

    try {
        // Simulate API call
        await apiCall(`${API_AUTH_URL}/verify-code`, 'POST', {
            email: userEmail,
            code
        });
        showStep(3);
    } catch (error) {
        verificationCodeInput.classList.add('is-invalid');
        document.getElementById('codeError').textContent = error.message || 'Invalid verification code.';
    }
});

resetPasswordButton.addEventListener('click', async () => {
    clearErrors();
    const newPassword = newPasswordInput.value;
    const confirmPassword = confirmPasswordInput.value;

    if (!newPassword) {
        newPasswordInput.classList.add('is-invalid');
        return;
    }

    if (newPassword !== confirmPassword) {
        confirmPasswordInput.classList.add('is-invalid');
        return;
    }

    try {
        // Simulate API call
        await apiCall(`${API_AUTH_URL}/reset-password`, 'POST', {
            email: userEmail,
            code: verificationCodeInput.value.trim(),
            newPassword
        });
        showStep(4);
    } catch (error) {
        newPasswordInput.classList.add('is-invalid');
        document.getElementById('passwordError').textContent = error.message || 'Failed to reset password.';
    }
});

resendCodeLink.addEventListener('click', async (e) => {
    e.preventDefault();
    if (!resendCodeLink.classList.contains('disabled')) {
        try {
            // Simulate API call
            await apiCall(`${API_AUTH_URL}/forgot-password`, 'POST', { email: userEmail });
            startCountdown();
            alert('Verification code resent successfully.');
        } catch (error) {
            alert(error.message || 'Failed to resend verification code.');
        }
    }
});

backToEmailStep.addEventListener('click', (e) => {
    e.preventDefault();
    showStep(1);
    clearErrors();
    clearInterval(countdownInterval);
});

backToCodeStep.addEventListener('click', (e) => {
    e.preventDefault();
    showStep(2);
    clearErrors();
});

// Allow pressing Enter to submit forms
resetEmailInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        sendCodeButton.click();
    }
});

verificationCodeInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        verifyCodeButton.click();
    }
});

newPasswordInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        resetPasswordButton.click();
    }
});

confirmPasswordInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        resetPasswordButton.click();
    }
});
