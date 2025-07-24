const API_URL = 'http://localhost:3000/api/auth';

// Form elements
const loginForm = document.getElementById('login-form');
const registerForm = document.getElementById('register-form');
const messageDiv = document.getElementById('message');

// Password toggle elements
const loginPasswordInput = document.getElementById('login-password');
const registerPasswordInput = document.getElementById('register-password');
const toggleLoginPasswordBtn = document.getElementById('toggle-login-password');
const toggleRegisterPasswordBtn = document.getElementById('toggle-register-password');

/**
 * Displays a message to the user using Bootstrap's alert component.
 * @param {string} text The message to display.
 * @param {string} type 'success' or 'danger' to control the alert color.
 */
function showMessage(text, type) {
    const alertType = type === 'success' ? 'alert-success' : 'alert-danger';
    messageDiv.innerHTML = `<div class="alert ${alertType}" role="alert">${text}</div>`;
    messageDiv.style.display = 'block';
    setTimeout(() => { messageDiv.style.display = 'none'; }, 4000);
}

/**
 * Toggles the visibility of a password input field.
 * @param {HTMLInputElement} input The password input element.
 * @param {HTMLButtonElement} button The button element containing the icon.
 */
function togglePasswordVisibility(input, button) {
    if (input.type === 'password') {
        input.type = 'text';
        button.innerHTML = "<i class='bx bx-hide'></i>"; // Change icon to 'hide'
    } else {
        input.type = 'password';
        button.innerHTML = "<i class='bx bx-show'></i>"; // Change icon back to 'show'
    }
}

// --- Event Listeners ---

// Password Toggles
toggleLoginPasswordBtn.addEventListener('click', () => {
    togglePasswordVisibility(loginPasswordInput, toggleLoginPasswordBtn);
});

toggleRegisterPasswordBtn.addEventListener('click', () => {
    togglePasswordVisibility(registerPasswordInput, toggleRegisterPasswordBtn);
});


// Login Form Submission
loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('login-email').value;
    const password = loginPasswordInput.value;

    try {
        const res = await fetch(`${API_URL}/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password }),
        });
        const data = await res.json();

        if (!res.ok) {
            throw new Error(data.message || 'Login failed.');
        }

        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data));

        if (data.role === 'Admin') {
            window.location.href = 'admin.html';
        } else {
            window.location.href = 'intern-dashboard.html';
        }
    } catch (err) {
        showMessage(err.message, 'danger');
    }
});

// Registration Form Submission
registerForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const name = document.getElementById('register-name').value;
    const email = document.getElementById('register-email').value;
    const password = registerPasswordInput.value;

    try {
        const res = await fetch(`${API_URL}/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, email, password }),
        });
        const data = await res.json();

        if (!res.ok) {
            throw new Error(data.message || 'Registration failed.');
        }

        showMessage('Registration successful! Please switch to the Login tab.', 'success');
        registerForm.reset();
    } catch (err) {
        showMessage(err.message, 'danger');
    }
});