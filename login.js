"use strict";

/* =========================================
   CAFÉSENSE - LOGIN AND REGISTRATION
========================================= */


/* =========================================
   1. STORAGE CONFIGURATION
========================================= */

const USER_STORAGE_KEY = "cafesenseUsers";
const SESSION_STORAGE_KEY = "cafesense-current-user";


/* =========================================
   2. DEFAULT DEMO ACCOUNTS
========================================= */

const DEFAULT_USERS = [
    {
        fullname: "CaféSense Owner",
        username: "owner",
        email: "owner@cafesense.com",
        password: "Owner123",
        role: "Owner"
    },
    {
        fullname: "CaféSense Manager",
        username: "manager",
        email: "manager@cafesense.com",
        password: "Manager123",
        role: "Manager"
    },
    {
        fullname: "CaféSense Staff",
        username: "staff",
        email: "staff@cafesense.com",
        password: "Staff123",
        role: "Staff"
    }
];


/* =========================================
   3. DOM ELEMENTS
========================================= */

const loginCard = document.getElementById("login-card");
const registerCard = document.getElementById("register-card");

const loginForm = document.getElementById("login-form");
const registerForm = document.getElementById("register-form");

const loginMessage = document.getElementById("login-message");
const registerMessage = document.getElementById("register-message");

const showRegisterButton = document.getElementById("show-register");
const showLoginButton = document.getElementById("show-login");

const forgotPasswordButton = document.getElementById("forgot-password");


/* =========================================
   4. ACCOUNT STORAGE FUNCTIONS
========================================= */

// SAVE USERS

function saveUsers(users) {
    try {
        localStorage.setItem(
            USER_STORAGE_KEY,
            JSON.stringify(users)
        );

        return true;

    } catch (error) {
        console.error("Unable to save accounts:", error);
        return false;
    }
}


// LOAD USERS

function loadUsers() {
    try {
        const storedUsers = localStorage.getItem(USER_STORAGE_KEY);

        if (!storedUsers) {
            saveUsers(DEFAULT_USERS);
            return [...DEFAULT_USERS];
        }

        const users = JSON.parse(storedUsers);

        if (!Array.isArray(users)) {
            saveUsers(DEFAULT_USERS);
            return [...DEFAULT_USERS];
        }

        let updated = false;

        users.forEach(user => {

            if (user.role === "Pending" && user.requestedRole) {
                user.role = user.requestedRole;
                updated = true;
            }

            if (user.status) {
                delete user.status;
                updated = true;
            }

            if (user.requestedRole) {
                delete user.requestedRole;
                updated = true;
            }

            if (user.role === "Employee") {
                user.role = "Staff";
                updated = true;
            }

        });

        if (updated) {
            saveUsers(users);
        }

        return users;

    } catch (error) {
        console.error("Unable to load accounts:", error);
        return [];
    }
}


/* =========================================
   5. MESSAGE HELPER FUNCTIONS
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
   6. FORM NAVIGATION
========================================= */

// SHOW LOGIN FORM

function showLoginForm() {

    if (registerCard) {
        registerCard.classList.add("hidden");
    }

    if (loginCard) {
        loginCard.classList.remove("hidden");
    }

    clearMessage(registerMessage);
}


// SHOW REGISTRATION FORM

function showRegisterForm() {

    if (loginCard) {
        loginCard.classList.add("hidden");
    }

    if (registerCard) {
        registerCard.classList.remove("hidden");
    }

    clearMessage(loginMessage);
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


/* =========================================
   7. PASSWORD VISIBILITY
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
   8. LOGIN FUNCTION
========================================= */

if (loginForm) {

    loginForm.addEventListener("submit", function(event) {

        event.preventDefault();

        clearMessage(loginMessage);


        // GET LOGIN INPUTS

        const identifier = document.getElementById("username")
            ?.value.trim().toLowerCase();

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


        // FIND ACCOUNT

        const users = loadUsers();

        const account = users.find(user => {

            const username = (user.username || "").toLowerCase();
            const email = (user.email || "").toLowerCase();

            return (
                (username === identifier || email === identifier) &&
                user.password === password
            );

        });


        // INVALID LOGIN

        if (!account) {

            showMessage(
                loginMessage,
                "Incorrect username/email or password. Please try again."
            );

            return;
        }


        // VALIDATE ACCOUNT ROLE

        const allowedRoles = [
            "Owner",
            "Manager",
            "Staff"
        ];

        if (!allowedRoles.includes(account.role)) {

            showMessage(
                loginMessage,
                "Invalid account role. Please contact your administrator."
            );

            return;
        }


        // CREATE USER SESSION

        const currentUser = {
            username: account.username,
            email: account.email,
            name: account.fullname,
            role: account.role
        };


        // SAVE SESSION

        try {

            sessionStorage.setItem(
                SESSION_STORAGE_KEY,
                JSON.stringify(currentUser)
            );

            sessionStorage.setItem(
                "loggedInUser",
                account.username
            );

            sessionStorage.setItem(
                "userRole",
                account.role
            );

            sessionStorage.setItem(
                "fullName",
                account.fullname
            );

        } catch (error) {

            console.error("Unable to create session:", error);

            showMessage(
                loginMessage,
                "Unable to start your session. Please try again."
            );

            return;
        }


        // LOGIN SUCCESSFUL

        showMessage(
            loginMessage,
            "Login successful! Redirecting...",
            "success"
        );

        window.location.href = "./dashboard.html";

    });

}


/* =========================================
   9. REGISTRATION FUNCTION
========================================= */

if (registerForm) {

    registerForm.addEventListener("submit", function(event) {

        event.preventDefault();

        clearMessage(registerMessage);


        // GET REGISTRATION INPUTS

        const fullname = document.getElementById("fullname")
            ?.value.trim();

        const username = document.getElementById("new-username")
            ?.value.trim();

        const email = document.getElementById("email")
            ?.value.trim().toLowerCase();

        const role = document.getElementById("role")
            ?.value;

        const password = document.getElementById("new-password")
            ?.value;

        const confirmPassword = document.getElementById("confirm-password")
            ?.value;


        // REQUIRED FIELD VALIDATION

        if (
            !fullname ||
            !username ||
            !email ||
            !role ||
            !password ||
            !confirmPassword
        ) {

            showMessage(
                registerMessage,
                "Please complete all required fields."
            );

            return;
        }


        // ROLE VALIDATION

        const allowedRoles = [
            "Owner",
            "Manager",
            "Staff"
        ];

        if (!allowedRoles.includes(role)) {

            showMessage(
                registerMessage,
                "Please select a valid account type."
            );

            return;
        }


        // EMAIL VALIDATION

        const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

        if (!emailPattern.test(email)) {

            showMessage(
                registerMessage,
                "Please enter a valid email address."
            );

            return;
        }


        // PASSWORD LENGTH VALIDATION

        if (password.length < 8) {

            showMessage(
                registerMessage,
                "Password must contain at least 8 characters."
            );

            return;
        }


        // PASSWORD MATCH VALIDATION

        if (password !== confirmPassword) {

            showMessage(
                registerMessage,
                "Passwords do not match."
            );

            return;
        }


        // LOAD EXISTING USERS

        const users = loadUsers();


        // CHECK EXISTING USERNAME

        const usernameExists = users.some(user =>
            (user.username || "").toLowerCase() ===
            username.toLowerCase()
        );


        // CHECK EXISTING EMAIL

        const emailExists = users.some(user =>
            (user.email || "").toLowerCase() === email
        );


        // CHECK FOR DUPLICATE ACCOUNTS

        if (usernameExists || emailExists) {

            showMessage(
                registerMessage,
                "Username or email is already registered."
            );

            return;
        }


        // CREATE NEW ACCOUNT

        const newUser = {
            fullname,
            username,
            email,
            password,
            role
        };

        users.push(newUser);


        // SAVE ACCOUNT

        if (!saveUsers(users)) {

            showMessage(
                registerMessage,
                "Unable to create your account. Please try again."
            );

            return;
        }


        // REGISTRATION SUCCESSFUL

        registerForm.reset();

        const loginUsername = document.getElementById("username");

        if (loginUsername) {
            loginUsername.value = email;
        }

        showMessage(
            registerMessage,
            `${role} account created successfully! You can now log in.`,
            "success"
        );


        // RETURN TO LOGIN FORM

        window.setTimeout(() => {
            showLoginForm();
        }, 1200);

    });

}


/* =========================================
   10. FORGOT PASSWORD
========================================= */

if (forgotPasswordButton) {

    forgotPasswordButton.addEventListener("click", event => {

        event.preventDefault();

        showMessage(
            loginMessage,
            "For password recovery, please contact your CaféSense administrator."
        );

    });

}


/* =========================================
   11. INITIALIZE LOGIN SYSTEM
========================================= */

loadUsers();