
"use strict";

import { apiClient } from "../api/apiClient.js";

/* =========================================
   CAFÉSENSE - LOGIN, REGISTRATION
   AND PASSWORD RECOVERY
========================================= */


/* =========================================
   1. DOM ELEMENTS
========================================= */

// FORM CARDS

const loginCard = document.getElementById("login-card");
const registerCard = document.getElementById("register-card");
const resetCard = document.getElementById("reset-card");

// FORMS

const loginForm = document.getElementById("login-form");
const registerForm = document.getElementById("register-form");
const resetForm = document.getElementById("reset-form");

// MESSAGES

const loginMessage = document.getElementById("login-message");
const registerMessage = document.getElementById("register-message");
const resetMessage = document.getElementById("reset-message");

// NAVIGATION BUTTONS

const showRegisterButton = document.getElementById("show-register");
const showLoginButton = document.getElementById("show-login");

const forgotPasswordButton = document.getElementById("forgot-password");
const backToLoginButton = document.getElementById("back-to-login");

// CUSTOM MODAL ELEMENTS

const modalOverlay = document.getElementById("confirmation-modal");
const modalContainer = modalOverlay?.querySelector(".confirmation-modal");

const modalIcon = document.getElementById("modal-icon");
const modalTitle = document.getElementById("modal-title");
const modalMessage = document.getElementById("modal-message");

const modalActions = document.getElementById("modal-actions");
const modalCancelButton = document.getElementById("modal-cancel");
const modalConfirmButton = document.getElementById("modal-confirm");


/* =========================================
   2. MESSAGE HELPER FUNCTIONS
========================================= */

// SHOW MESSAGE

function showMessage(element, message, type = "error") {

    if (!element) return;

    element.textContent = message;

    element.classList.toggle(
        "success",
        type === "success"
    );
}


// CLEAR MESSAGE

function clearMessage(element) {

    if (!element) return;

    element.textContent = "";
    element.classList.remove("success");
}


/* =========================================
   3. CUSTOM MODAL FUNCTIONS
========================================= */

// SHOW CUSTOM MODAL

function showModal({
    title = "Confirm Action",
    message = "Are you sure you want to continue?",
    type = "confirmation",
    confirmText = "Confirm",
    cancelText = "Cancel",
    showCancel = true
}) {

    if (
        !modalOverlay ||
        !modalContainer ||
        !modalTitle ||
        !modalMessage ||
        !modalIcon ||
        !modalCancelButton ||
        !modalConfirmButton
    ) {
        console.error("Custom modal elements are missing.");
        return Promise.resolve(false);
    }

    return new Promise(resolve => {

        // SET MODAL CONTENT

        modalTitle.textContent = title;
        modalMessage.textContent = message;

        modalConfirmButton.textContent = confirmText;
        modalCancelButton.textContent = cancelText;

        modalIcon.textContent =
            type === "success" ? "✓" :
            type === "error" ? "!" : "?";

        // SET MODAL STYLE

        modalContainer.classList.remove(
            "success",
            "error"
        );

        if (type === "success" || type === "error") {
            modalContainer.classList.add(type);
        }

        // SHOW OR HIDE CANCEL BUTTON

        modalCancelButton.hidden = !showCancel;

        if (modalActions) {
            modalActions.style.justifyContent = showCancel
                ? "center"
                : "center";
        }

        // SHOW MODAL

        modalOverlay.classList.remove("hidden");
        modalOverlay.setAttribute("aria-hidden", "false");

        // PREVENT MULTIPLE CLICKS

        let modalClosed = false;

        function closeModal(result) {

            if (modalClosed) return;

            modalClosed = true;

            modalOverlay.classList.add("hidden");
            modalOverlay.setAttribute("aria-hidden", "true");

            // REMOVE EVENT LISTENERS

            modalConfirmButton.removeEventListener(
                "click",
                handleConfirm
            );

            modalCancelButton.removeEventListener(
                "click",
                handleCancel
            );

            modalOverlay.removeEventListener(
                "click",
                handleOverlayClick
            );

            document.removeEventListener(
                "keydown",
                handleKeydown
            );

            resolve(result);
        }

        // CONFIRM BUTTON

        function handleConfirm() {
            closeModal(true);
        }

        // CANCEL BUTTON

        function handleCancel() {
            closeModal(false);
        }

        // CLOSE WHEN CLICKING OUTSIDE MODAL

        function handleOverlayClick(event) {

            if (event.target === modalOverlay) {
                closeModal(false);
            }

        }

        // ESCAPE KEY

        function handleKeydown(event) {

            if (event.key === "Escape") {
                closeModal(false);
            }

        }

        // ATTACH EVENT LISTENERS

        modalConfirmButton.addEventListener(
            "click",
            handleConfirm
        );

        modalCancelButton.addEventListener(
            "click",
            handleCancel
        );

        modalOverlay.addEventListener(
            "click",
            handleOverlayClick
        );

        document.addEventListener(
            "keydown",
            handleKeydown
        );

        // SET INITIAL FOCUS

        if (showCancel) {
            modalCancelButton.focus();
        } else {
            modalConfirmButton.focus();
        }

    });

}


/* =========================================
   4. FORM NAVIGATION
========================================= */

// SHOW LOGIN FORM

function showLoginForm() {

    loginCard?.classList.remove("hidden");
    registerCard?.classList.add("hidden");
    resetCard?.classList.add("hidden");

    clearMessage(loginMessage);
    clearMessage(registerMessage);
    clearMessage(resetMessage);
}


// SHOW REGISTRATION FORM

function showRegisterForm() {

    loginCard?.classList.add("hidden");
    registerCard?.classList.remove("hidden");
    resetCard?.classList.add("hidden");

    clearMessage(loginMessage);
    clearMessage(resetMessage);
}


// SHOW PASSWORD RESET FORM

function showResetForm() {

    loginCard?.classList.add("hidden");
    registerCard?.classList.add("hidden");
    resetCard?.classList.remove("hidden");

    clearMessage(loginMessage);
    clearMessage(resetMessage);
}


// NAVIGATE TO REGISTRATION

if (showRegisterButton) {

    showRegisterButton.addEventListener("click", event => {

        event.preventDefault();

        showRegisterForm();

    });

}


// NAVIGATE TO LOGIN

if (showLoginButton) {

    showLoginButton.addEventListener("click", event => {

        event.preventDefault();

        showLoginForm();

    });

}


// BACK TO LOGIN FROM PASSWORD RESET

if (backToLoginButton) {

    backToLoginButton.addEventListener("click", event => {

        event.preventDefault();

        resetForm?.reset();

        showLoginForm();

    });

}


/* =========================================
   5. PASSWORD VISIBILITY
========================================= */

document.querySelectorAll(".toggle-password").forEach(button => {

    button.addEventListener("click", function() {

        const input = document.getElementById(
            this.dataset.target
        );

        if (!input) return;

        const showPassword = input.type === "password";

        input.type = showPassword ? "text" : "password";

        this.textContent = showPassword ? "Hide" : "Show";

    });

});


/* =========================================
   6. LOGIN FUNCTION
========================================= */

if (loginForm) {

    loginForm.addEventListener("submit", async function(event) {

        event.preventDefault();

        clearMessage(loginMessage);

        const identifier = document.getElementById("username")
            ?.value.trim();

        const password = document.getElementById("login-password")
            ?.value;

        // REQUIRED FIELD VALIDATION

        if (!identifier || !password) {

            showMessage(
                loginMessage,
                "Please enter your username/email and password."
            );

            return;
        }

        // PREVENT MULTIPLE SUBMISSIONS

        const submitButton = loginForm.querySelector(
            'button[type="submit"]'
        );

        if (submitButton) {
            submitButton.disabled = true;
        }

        try {

            // SEND LOGIN REQUEST

            const response = await apiClient.post(
                "/auth/login",
                {
                    identifier,
                    password
                }
            );

            if (!response.success || !response.data?.user) {

                throw new Error(
                    response.message || "Unable to log in."
                );

            }

            showMessage(
                loginMessage,
                "Login successful! Redirecting...",
                "success"
            );

            window.location.href = "./dashboard.html";

        } catch (error) {

            console.error("Login failed:", error);

            showMessage(
                loginMessage,
                error.message === "Failed to fetch"
                    ? "Unable to connect to the server. Please try again."
                    : error.message
            );

        } finally {

            if (submitButton) {
                submitButton.disabled = false;
            }

        }

    });

}


/* =========================================
   7. REGISTRATION FUNCTION
========================================= */

if (registerForm) {

    registerForm.addEventListener("submit", function(event) {

        event.preventDefault();

        clearMessage(registerMessage);

        showMessage(
            registerMessage,
            "Account registration is currently managed by the CaféSense administrator."
        );

    });

}


/* =========================================
   8. FORGOT PASSWORD NAVIGATION
========================================= */

if (forgotPasswordButton) {

    forgotPasswordButton.addEventListener("click", async event => {

        event.preventDefault();

        const confirmed = await showModal({

            title: "Reset Password?",
            message: "Are you sure you want to reset your password?",

            type: "confirmation",

            confirmText: "Continue",
            cancelText: "Cancel",

            showCancel: true

        });

        if (!confirmed) return;

        showResetForm();

    });

}


/* =========================================
   9. PASSWORD RESET FUNCTION
========================================= */

if (resetForm) {

    resetForm.addEventListener("submit", async function(event) {

        event.preventDefault();

        clearMessage(resetMessage);

        // GET RESET FORM INPUTS

        const identifier = document.getElementById(
            "reset-identifier"
        )?.value.trim();

        const newPassword = document.getElementById(
            "reset-new-password"
        )?.value;

        const confirmPassword = document.getElementById(
            "reset-confirm-password"
        )?.value;


        // REQUIRED FIELD VALIDATION

        if (!identifier || !newPassword || !confirmPassword) {

            showMessage(
                resetMessage,
                "Please complete all password reset fields."
            );

            return;
        }


        // PASSWORD LENGTH VALIDATION

        if (newPassword.length < 8) {

            showMessage(
                resetMessage,
                "Password must contain at least 8 characters."
            );

            return;
        }


        // PASSWORD CONFIRMATION VALIDATION

        if (newPassword !== confirmPassword) {

            showMessage(
                resetMessage,
                "New password and confirmation password do not match."
            );

            return;
        }


        // FINAL RESET CONFIRMATION

        const confirmed = await showModal({

            title: "Confirm Password Change",

            message: "Are you sure you want to change your password? This action cannot be undone.",

            type: "confirmation",

            confirmText: "Confirm",
            cancelText: "Cancel",

            showCancel: true

        });

        if (!confirmed) return;


        // PREVENT MULTIPLE SUBMISSIONS

        const submitButton = resetForm.querySelector(
            'button[type="submit"]'
        );

        if (submitButton) {
            submitButton.disabled = true;
        }


        try {

            // SEND PASSWORD RESET REQUEST

            const response = await apiClient.post(
                "/auth/reset-password",
                {
                    identifier,
                    newPassword,
                    confirmPassword
                }
            );


            // CHECK RESPONSE

            if (!response.success) {

                throw new Error(
                    response.message || "Unable to reset password."
                );

            }


            // RESET SUCCESSFUL

            await showModal({

                title: "Password Reset Successful",

                message: "Your password has been reset successfully. You can now log in using your new password.",

                type: "success",

                confirmText: "Back to Login",

                showCancel: false

            });

            resetForm.reset();

            showLoginForm();

        } catch (error) {

            console.error("Password reset failed:", error);

            const errorMessage = error.message === "Failed to fetch"
                ? "Unable to connect to the server. Please try again."
                : error.message;

            await showModal({

                title: "Password Reset Failed",

                message: errorMessage,

                type: "error",

                confirmText: "Okay",

                showCancel: false

            });

        } finally {

            if (submitButton) {
                submitButton.disabled = false;
            }

        }

    });

}
