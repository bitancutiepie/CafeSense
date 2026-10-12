
// =========================================
// CAFESENSE LOGIN INTERACTIONS
// Frontend demonstration only
// =========================================

// Get the login and reset form elements
const loginView = document.getElementById("login-view");
const resetView = document.getElementById("reset-view");

const loginForm = document.getElementById("login-form");
const resetForm = document.getElementById("reset-form");

const loginMessage = document.getElementById("login-message");
const resetMessage = document.getElementById("reset-message");

// Navigation buttons
const forgotPasswordButton = document.getElementById("forgot-password");
const backToLoginButton = document.getElementById("back-to-login");

// =========================================
// SHOW OR HIDE PASSWORD
// =========================================

const passwordToggleButtons = document.querySelectorAll("[data-toggle]");

passwordToggleButtons.forEach((button) => {
    button.addEventListener("click", () => {
        // Find the password field connected to the button
        const inputId = button.dataset.toggle;
        const passwordInput = document.getElementById(inputId);

        // Check if the password is currently hidden
        const isHidden = passwordInput.type === "password";

        // Change the field type
        passwordInput.type = isHidden ? "text" : "password";

        // Update accessibility labels
        button.setAttribute(
            "aria-label",
            isHidden ? "Hide password" : "Show password"
        );

        button.setAttribute("aria-pressed", String(isHidden));
    });
});

// =========================================
// OPEN PASSWORD RESET VIEW
// =========================================

forgotPasswordButton.addEventListener("click", () => {
    // Switch from login to password reset
    loginView.hidden = true;
    resetView.hidden = false;

    // Clear previous messages and values
    loginMessage.textContent = "";
    resetMessage.textContent = "";
    resetForm.reset();

    // Ensure password fields are hidden
    resetPasswordVisibility();

    // Focus the username field
    document.getElementById("reset-username").focus();
});

// =========================================
// RETURN TO LOGIN VIEW
// =========================================

backToLoginButton.addEventListener("click", () => {
    // Switch back to the login screen
    resetView.hidden = true;
    loginView.hidden = false;

    // Clear the reset form
    resetForm.reset();
    resetMessage.textContent = "";

    // Reset password visibility buttons
    resetPasswordVisibility();

    // Focus the username field
    document.getElementById("username").focus();
});

// =========================================
// RESET PASSWORD VISIBILITY
// =========================================

function resetPasswordVisibility() {
    passwordToggleButtons.forEach((button) => {
        const inputId = button.dataset.toggle;
        const passwordInput = document.getElementById(inputId);

        // Hide the password
        passwordInput.type = "password";

        // Restore the original button state
        button.setAttribute("aria-label", "Show password");
        button.setAttribute("aria-pressed", "false");
    });
}

// =========================================
// DISPLAY FEEDBACK MESSAGES
// =========================================

function showMessage(element, message, type) {
    element.textContent = message;
    element.className = `form-message ${type}`;
}

// =========================================
// LOGIN FORM VALIDATION
// =========================================

loginForm.addEventListener("submit", (event) => {
    // Prevent the browser from refreshing the page
    event.preventDefault();

    const username = document.getElementById("username").value.trim();
    const password = document.getElementById("password").value;

    // Check whether the fields contain values
    if (!username || !password) {
        showMessage(
            loginMessage,
            "Please enter your username and password.",
            "error"
        );
        return;
    }

    // Demo message only: this does not verify an account
    showMessage(
        loginMessage,
        "The login interface is ready. Connect the backend to verify your account.",
        "success"
    );
});

// =========================================
// PASSWORD RESET FORM VALIDATION
// =========================================

resetForm.addEventListener("submit", (event) => {
    // Prevent the browser from refreshing the page
    event.preventDefault();

    const username = document
        .getElementById("reset-username")
        .value.trim();

    const newPassword = document.getElementById("new-password").value;
    const confirmPassword = document.getElementById("confirm-password").value;

    // Check for empty fields
    if (!username || !newPassword || !confirmPassword) {
        showMessage(
            resetMessage,
            "Please complete all fields.",
            "error"
        );
        return;
    }

    // Check minimum password length
    if (newPassword.length < 8) {
        showMessage(
            resetMessage,
            "Your new password must be at least 8 characters long.",
            "error"
        );
        return;
    }

    // Check whether both passwords match
    if (newPassword !== confirmPassword) {
        showMessage(
            resetMessage,
            "The passwords do not match. Please try again.",
            "error"
        );
        return;
    }

    // No password is actually changed at this stage
    showMessage(
        resetMessage,
        "The form is valid, but password resetting requires backend account verification.",
        "success"
    );
});
