
import { apiClient } from "../api/apiClient.js";

"use strict";

document.addEventListener("DOMContentLoaded", async () => {

    // ==========================================
    // 1. CURRENT USER AND AUTHENTICATION
    // ==========================================

    const SIDEBAR_STORAGE_KEY = "cafeSenseSidebarCollapsed";

    let currentUser;
    let users = [];

    try {
        const response = await apiClient.get("/auth/me");

        if (!response.success || !response.data?.user) {
            throw new Error("Unable to verify your CaféSense session.");
        }

        currentUser = response.data.user;

    } catch (error) {
        console.error("User Management authentication failed:", error);

        if ([401, 403, 404].includes(error.status)) {
            window.location.replace("login.html");
            return;
        }

        document.body.innerHTML = `
            <main style="
                max-width: 600px;
                margin: 80px auto;
                padding: 24px;
                text-align: center;
                font-family: Arial, sans-serif;
            ">
                <h2>Unable to Verify Your Session</h2>
                <p>
                    CaféSense could not connect to the server.
                    Please make sure the backend is running,
                    then try again.
                </p>
                <button onclick="window.location.reload()">Retry</button>
                <button onclick="window.location.replace('login.html')">
                    Back to Login
                </button>
            </main>
        `;

        return;
    }

    const currentRole = String(currentUser.role || "")
        .trim()
        .toLowerCase();

    if (currentRole !== "owner") {
        window.location.replace("dashboard.html");
        return;
    }

    // ==========================================
    // 2. DOM ELEMENTS
    // ==========================================

    const totalUsers = document.getElementById("totalUsers");
    const ownerCount = document.getElementById("ownerCount");
    const managerCount = document.getElementById("managerCount");
    const staffCount = document.getElementById("staffCount");

    const usersTableBody = document.getElementById("usersTableBody");
    const emptyState = document.getElementById("emptyState");

    const userSearch = document.getElementById("userSearch");
    const roleFilter = document.getElementById("roleFilter");
    const accountStatusFilter = document.getElementById("accountStatusFilter");

    const addUserBtn = document.getElementById("addUserBtn");

    const userModal = document.getElementById("userModal");
    const userForm = document.getElementById("userForm");

    const modalTitle = document.getElementById("modalTitle");
    const modalDescription = document.getElementById("modalDescription");

    const editUserIndex = document.getElementById("editUserIndex");
    const fullNameInput = document.getElementById("fullName");
    const usernameInput = document.getElementById("username");
    const emailInput = document.getElementById("email");
    const userRoleInput = document.getElementById("userRole");
    const passwordInput = document.getElementById("password");
    const confirmPasswordInput = document.getElementById("confirmPassword");

    const closeModalBtn = document.getElementById("closeModalBtn");
    const cancelUserBtn = document.getElementById("cancelUserBtn");

    const currentDateElement = document.getElementById("current-date");
    const currentTimeElement = document.getElementById("current-time");

    const sidebar = document.getElementById("sidebar");
    const sidebarToggle = document.getElementById("sidebarToggle");
    const mobileSidebarToggle = document.getElementById("mobileSidebarToggle");
    const sidebarClose = document.getElementById("sidebarClose");

    const sidebarUserName = document.getElementById("sidebarUserName");
    const sidebarUserRole = document.getElementById("sidebarUserRole");
    const sidebarUserInitials = document.getElementById("display-user-initials");
    const sidebarRoleBadge = document.getElementById("sidebar-role-badge");

    const logoutBtn = document.getElementById("logout-btn");

    const analyticsToggle = document.getElementById("analyticsDropdownToggle");
    const analyticsNavList = document.getElementById("analyticsNavList");

    const dialogOverlay = document.getElementById("dialogOverlay");
    const dialogIcon = document.getElementById("dialogIcon");
    const dialogTitle = document.getElementById("dialogTitle");
    const dialogMessage = document.getElementById("dialogMessage");
    const dialogActions = document.getElementById("dialogActions");

    // ==========================================
    // 3. HELPER FUNCTIONS
    // ==========================================

    function escapeHTML(value) {
        return String(value ?? "").replace(/[&<>"']/g, character => {
            const entities = {
                "&": "&amp;",
                "<": "&lt;",
                ">": "&gt;",
                '"': "&quot;",
                "'": "&#039;"
            };

            return entities[character];
        });
    }

    function getInitials(name) {
        return String(name || "User")
            .trim()
            .split(/\s+/)
            .slice(0, 2)
            .map(part => part.charAt(0).toUpperCase())
            .join("");
    }

    function normalizeRole(role) {
        const normalizedRole = String(role || "")
            .trim()
            .toLowerCase();

        if (normalizedRole === "employee") return "Staff";
        if (normalizedRole === "owner") return "Owner";
        if (normalizedRole === "manager") return "Manager";

        return "Staff";
    }

    function normalizeStatus(status) {
        return String(status || "Active").trim().toLowerCase() === "inactive"
            ? "Inactive"
            : "Active";
    }

    function isValidEmail(email) {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    }

    function getErrorMessage(error) {
        if (Array.isArray(error.data?.details)) {
            return error.data.details.join("\n");
        }

        return error.message || "An unexpected error occurred.";
    }

    function closeUserModal() {
        if (!userModal || !userForm) return;

        userModal.classList.remove("show");
        userForm.reset();
        editUserIndex.value = "";

        passwordInput.required = false;
        confirmPasswordInput.required = false;
    }

    function openUserModal() {
        if (userModal) {
            userModal.classList.add("show");
        }
    }

    // ==========================================
    // 4. API - LOAD USERS
    // ==========================================

    async function loadUsers() {
        const response = await apiClient.get("/users");

        if (!response.success || !Array.isArray(response.data)) {
            throw new Error("Unable to retrieve user records.");
        }

        // Keep both Active and Inactive accounts in memory.
        users = response.data.map(user => ({
            id: user.id,
            fullName: user.fullName,
            username: user.username,
            email: user.email,
            role: normalizeRole(user.role),
            accountStatus: normalizeStatus(user.accountStatus)
        }));
    }

    // ==========================================
    // 5. DATE AND TIME
    // ==========================================

    function updateCurrentDateTime() {
        const now = new Date();

        if (currentDateElement) {
            currentDateElement.textContent =
                now.toLocaleDateString("en-PH", {
                    weekday: "long",
                    year: "numeric",
                    month: "long",
                    day: "numeric"
                }).toUpperCase();
        }

        if (currentTimeElement) {
            currentTimeElement.textContent =
                now.toLocaleTimeString("en-PH", {
                    hour: "numeric",
                    minute: "2-digit",
                    hour12: true
                });
        }
    }

    // ==========================================
    // 6. CUSTOM CRUD DIALOG
    // ==========================================

    function closeDialog() {
        if (dialogOverlay) {
            dialogOverlay.classList.remove("show");
        }
    }

    function showDialog(title, message, type = "info", onConfirm = null) {
        if (
            !dialogOverlay ||
            !dialogIcon ||
            !dialogTitle ||
            !dialogMessage ||
            !dialogActions
        ) {
            console.error("Custom dialog elements are missing.");
            return;
        }

        dialogTitle.textContent = title;
        dialogMessage.textContent = message;

        const icons = {
            success: "fa-circle-check",
            warning: "fa-triangle-exclamation",
            error: "fa-circle-xmark",
            info: "fa-circle-info",
            question: "fa-circle-question"
        };

        dialogIcon.innerHTML = `
            <i class="fa-solid ${icons[type] || icons.info}"></i>
        `;

        dialogActions.innerHTML = "";

        if (onConfirm) {
            const cancelBtn = document.createElement("button");
            cancelBtn.type = "button";
            cancelBtn.textContent = "Cancel";
            cancelBtn.className = "secondary-btn";
            cancelBtn.addEventListener("click", closeDialog);

            const confirmBtn = document.createElement("button");
            confirmBtn.type = "button";
            confirmBtn.textContent = "Confirm";
            confirmBtn.className = "primary-btn";

            confirmBtn.addEventListener("click", async () => {
                confirmBtn.disabled = true;
                closeDialog();
                await onConfirm();
            });

            dialogActions.append(cancelBtn, confirmBtn);

        } else {
            const okBtn = document.createElement("button");
            okBtn.type = "button";
            okBtn.textContent = "Okay";
            okBtn.className = "primary-btn";
            okBtn.addEventListener("click", closeDialog);

            dialogActions.appendChild(okBtn);
        }

        dialogOverlay.classList.add("show");
    }

    if (dialogOverlay) {
        dialogOverlay.addEventListener("click", event => {
            if (event.target === dialogOverlay) {
                closeDialog();
            }
        });
    }

    // ==========================================
    // 7. SIDEBAR PROFILE
    // ==========================================

    function updateSidebarProfile() {
        const displayName =
            currentUser.fullName ||
            currentUser.name ||
            currentUser.fullname ||
            currentUser.username ||
            "User";

        const displayRole = currentUser.role || "Owner";

        if (sidebarUserName) {
            sidebarUserName.textContent = displayName;
        }

        if (sidebarUserRole) {
            sidebarUserRole.textContent = displayRole;
        }

        if (sidebarUserInitials) {
            sidebarUserInitials.textContent = getInitials(displayName);
        }

        if (sidebarRoleBadge) {
            sidebarRoleBadge.textContent = displayRole + " Portal";
        }
    }

    // ==========================================
    // 8. SUMMARY CARDS
    // ==========================================

    function updateSummary() {
        // Summary cards continue to count Active accounts only.
        const activeUsers = users.filter(user =>
            user.accountStatus === "Active"
        );

        const owners = activeUsers.filter(user =>
            normalizeRole(user.role) === "Owner"
        ).length;

        const managers = activeUsers.filter(user =>
            normalizeRole(user.role) === "Manager"
        ).length;

        const staff = activeUsers.filter(user =>
            normalizeRole(user.role) === "Staff"
        ).length;

        if (totalUsers) totalUsers.textContent = activeUsers.length;
        if (ownerCount) ownerCount.textContent = owners;
        if (managerCount) managerCount.textContent = managers;
        if (staffCount) staffCount.textContent = staff;
    }

    // ==========================================
    // 9. DISPLAY USERS
    // ==========================================

    function displayUsers() {
        if (!usersTableBody) return;

        usersTableBody.innerHTML = "";

        const searchTerm = userSearch
            ? userSearch.value.toLowerCase().trim()
            : "";

        const selectedRole = roleFilter
            ? roleFilter.value
            : "All";

        const selectedStatus = accountStatusFilter
            ? accountStatusFilter.value
            : "Active";

        const filteredUsers = users.filter(user => {
            const name = String(user.fullName || "").toLowerCase();
            const username = String(user.username || "").toLowerCase();
            const email = String(user.email || "").toLowerCase();

            const matchesSearch =
                name.includes(searchTerm) ||
                username.includes(searchTerm) ||
                email.includes(searchTerm);

            const matchesRole =
                selectedRole === "All" ||
                normalizeRole(user.role) === selectedRole;

            const matchesStatus =
                selectedStatus === "All" ||
                user.accountStatus === selectedStatus;

            return matchesSearch && matchesRole && matchesStatus;
        });

        if (filteredUsers.length === 0) {
            if (emptyState) emptyState.hidden = false;
            return;
        }

        if (emptyState) emptyState.hidden = true;

        filteredUsers.forEach(user => {
            const originalIndex = users.indexOf(user);

            const isCurrentUser =
                Number(user.id) === Number(currentUser.id);

            const isActive = user.accountStatus === "Active";
            const role = normalizeRole(user.role);

            const roleClass = {
                Owner: "role-owner",
                Manager: "role-manager",
                Staff: "role-staff"
            }[role] || "role-staff";

            const statusClass = isActive
                ? "account-status-active"
                : "account-status-inactive";

            const row = document.createElement("tr");

            const actions = isActive
                ? `
                    <button
                        type="button"
                        class="action-btn edit-btn"
                        data-index="${originalIndex}"
                        title="Edit User"
                        aria-label="Edit User">
                        <i class="fa-solid fa-pen"></i>
                    </button>

                    <button
                        type="button"
                        class="action-btn delete-btn"
                        data-index="${originalIndex}"
                        title="Deactivate User"
                        aria-label="Deactivate User"
                        ${isCurrentUser ? "disabled" : ""}>
                        <i class="fa-solid fa-trash"></i>
                    </button>
                `
                : `
                    <button
                        type="button"
                        class="action-btn reactivate-btn"
                        data-index="${originalIndex}"
                        title="Reactivate User"
                        aria-label="Reactivate User">
                        <i class="fa-solid fa-user-check"></i>
                    </button>
                `;

            row.innerHTML = `
                <td>
                    <div class="user-cell">
                        <div class="user-cell-avatar">
                            ${escapeHTML(getInitials(user.fullName))}
                        </div>

                        <div class="user-cell-info">
                            <strong>${escapeHTML(user.fullName)}</strong>
                            <small>@${escapeHTML(user.username)}</small>
                        </div>
                    </div>
                </td>

                <td>${escapeHTML(user.email)}</td>

                <td>
                    <span class="role-badge-table ${roleClass}">
                        ${escapeHTML(role)}
                    </span>
                </td>

                <td>
                    <span class="account-status-badge ${statusClass}">
                        ${escapeHTML(user.accountStatus)}
                    </span>
                </td>

                <td>
                    <div class="action-buttons">
                        ${actions}
                    </div>
                </td>
            `;

            usersTableBody.appendChild(row);
        });
    }

    // ==========================================
    // 10. OPEN ADD USER MODAL
    // ==========================================

    if (addUserBtn) {
        addUserBtn.addEventListener("click", () => {
            userForm.reset();
            editUserIndex.value = "";

            passwordInput.required = true;
            confirmPasswordInput.required = true;

            modalTitle.textContent = "Add New User";
            modalDescription.textContent =
                "Create a new CaféSense account.";

            openUserModal();
        });
    }

    // ==========================================
    // 11. EDIT, DEACTIVATE AND REACTIVATE USERS
    // ==========================================

    if (usersTableBody) {
        usersTableBody.addEventListener("click", event => {

            const editButton = event.target.closest(".edit-btn");
            const deleteButton = event.target.closest(".delete-btn");
            const reactivateButton = event.target.closest(".reactivate-btn");

            // EDIT USER
            if (editButton) {
                const index = Number(editButton.dataset.index);
                const user = users[index];

                if (!user || user.accountStatus !== "Active") return;

                userForm.reset();
                editUserIndex.value = String(user.id);

                fullNameInput.value = user.fullName || "";
                usernameInput.value = user.username || "";
                emailInput.value = user.email || "";
                userRoleInput.value = normalizeRole(user.role);

                passwordInput.value = "";
                confirmPasswordInput.value = "";

                passwordInput.required = false;
                confirmPasswordInput.required = false;

                modalTitle.textContent = "Edit User";
                modalDescription.textContent =
                    "Update the selected user's information.";

                openUserModal();
                return;
            }

            // DEACTIVATE USER
            if (deleteButton && !deleteButton.disabled) {
                const index = Number(deleteButton.dataset.index);
                const user = users[index];

                if (!user || user.accountStatus !== "Active") return;

                if (Number(user.id) === Number(currentUser.id)) {
                    showDialog(
                        "Action Not Allowed",
                        "You cannot deactivate your own account.",
                        "warning"
                    );
                    return;
                }

                const ownerCountNow = users.filter(account =>
                    account.accountStatus === "Active" &&
                    normalizeRole(account.role) === "Owner"
                ).length;

                if (
                    normalizeRole(user.role) === "Owner" &&
                    ownerCountNow <= 1
                ) {
                    showDialog(
                        "Action Not Allowed",
                        "You cannot deactivate the last active Owner account.",
                        "warning"
                    );
                    return;
                }

                showDialog(
                    "Deactivate User?",
                    `Are you sure you want to deactivate ${user.fullName}'s account?`,
                    "question",
                    async () => {
                        try {
                            await apiClient.delete(`/users/${user.id}`);

                            user.accountStatus = "Inactive";

                            updateSummary();
                            displayUsers();

                            showDialog(
                                "User Deactivated",
                                "The user account has been successfully deactivated.",
                                "success"
                            );

                        } catch (error) {
                            console.error("User deactivation failed:", error);

                            showDialog(
                                "Unable to Deactivate User",
                                getErrorMessage(error),
                                "error"
                            );
                        }
                    }
                );

                return;
            }

            // REACTIVATE USER
            if (reactivateButton) {
                const index = Number(reactivateButton.dataset.index);
                const user = users[index];

                if (!user || user.accountStatus !== "Inactive") return;

                showDialog(
                    "Reactivate User?",
                    `Are you sure you want to reactivate ${user.fullName}'s account? The user will be able to log in again using their existing password.`,
                    "question",
                    async () => {
                        try {
                            const response = await apiClient.post(
                                `/users/${user.id}/reactivate`,
                                {}
                            );

                            if (!response.success || !response.data) {
                                throw new Error(
                                    "Unable to reactivate the user account."
                                );
                            }

                            user.accountStatus = normalizeStatus(
                                response.data.accountStatus
                            );

                            updateSummary();
                            displayUsers();

                            showDialog(
                                "User Reactivated",
                                `${user.fullName}'s account has been successfully reactivated.`,
                                "success"
                            );

                        } catch (error) {
                            console.error("User reactivation failed:", error);

                            showDialog(
                                "Unable to Reactivate User",
                                getErrorMessage(error),
                                "error"
                            );
                        }
                    }
                );
            }
        });
    }

    // ==========================================
    // 12. ADD AND UPDATE USER
    // ==========================================

    if (userForm) {
        userForm.addEventListener("submit", async event => {
            event.preventDefault();

            const fullName = fullNameInput.value.trim();
            const username = usernameInput.value.trim();
            const email = emailInput.value.trim().toLowerCase();
            const role = userRoleInput.value;

            const password = passwordInput.value;
            const confirmPassword = confirmPasswordInput.value;

            const editId = editUserIndex.value;
            const isEditing = editId !== "";

            if (!fullName || !username || !email || !role) {
                showDialog(
                    "Missing Information",
                    "Please complete all required fields.",
                    "warning"
                );
                return;
            }

            if (!isValidEmail(email)) {
                showDialog(
                    "Invalid Email",
                    "Please enter a valid email address.",
                    "warning"
                );
                return;
            }

            if (!isEditing && !password) {
                showDialog(
                    "Missing Password",
                    "Please enter a password for the new user.",
                    "warning"
                );
                return;
            }

            if (password && password.length < 8) {
                showDialog(
                    "Weak Password",
                    "Password must contain at least 8 characters.",
                    "warning"
                );
                return;
            }

            if (password !== confirmPassword) {
                showDialog(
                    "Password Mismatch",
                    "Password and confirm password do not match.",
                    "warning"
                );
                return;
            }

            const oldUser = isEditing
                ? users.find(user => Number(user.id) === Number(editId))
                : null;

            if (isEditing && (!oldUser || oldUser.accountStatus !== "Active")) {
                showDialog(
                    "User Not Found",
                    "The selected active user could not be found.",
                    "error"
                );
                return;
            }

            // Check duplicates across both Active and Inactive accounts.
            const duplicateUsername = users.some(user =>
                Number(user.id) !== Number(editId) &&
                user.username?.toLowerCase() === username.toLowerCase()
            );

            if (duplicateUsername) {
                showDialog(
                    "Username Already Exists",
                    "This username is already registered, including by an inactive account.",
                    "warning"
                );
                return;
            }

            const duplicateEmail = users.some(user =>
                Number(user.id) !== Number(editId) &&
                user.email?.toLowerCase() === email
            );

            if (duplicateEmail) {
                showDialog(
                    "Email Already Exists",
                    "This email address is already registered, including by an inactive account.",
                    "warning"
                );
                return;
            }

            const isEditingCurrentUser =
                isEditing &&
                Number(oldUser.id) === Number(currentUser.id);

            if (isEditingCurrentUser && role !== "Owner") {
                showDialog(
                    "Action Not Allowed",
                    "You cannot change your own Owner role.",
                    "warning"
                );
                return;
            }

            if (
                isEditing &&
                normalizeRole(oldUser.role) === "Owner" &&
                role !== "Owner"
            ) {
                const currentOwnerCount = users.filter(user =>
                    user.accountStatus === "Active" &&
                    normalizeRole(user.role) === "Owner"
                ).length;

                if (currentOwnerCount <= 1) {
                    showDialog(
                        "Action Not Allowed",
                        "You cannot remove the role of the last active Owner.",
                        "warning"
                    );
                    return;
                }
            }

            const userData = {
                fullName,
                username,
                email,
                role,
                password
            };

            const submitButton = userForm.querySelector(
                'button[type="submit"]'
            );

            if (submitButton) {
                submitButton.disabled = true;
            }

            try {
                if (isEditing) {
                    const response = await apiClient.put(
                        `/users/${editId}`,
                        userData
                    );

                    if (!response.success || !response.data) {
                        throw new Error("Unable to update the user.");
                    }

                    const updatedUser = {
                        id: response.data.id,
                        fullName: response.data.fullName,
                        username: response.data.username,
                        email: response.data.email,
                        role: normalizeRole(response.data.role),
                        accountStatus: normalizeStatus(
                            response.data.accountStatus
                        )
                    };

                    users = users.map(user =>
                        Number(user.id) === Number(editId)
                            ? updatedUser
                            : user
                    );

                    if (isEditingCurrentUser) {
                        currentUser = {
                            ...currentUser,
                            fullName: updatedUser.fullName,
                            username: updatedUser.username,
                            email: updatedUser.email,
                            role: updatedUser.role
                        };

                        updateSidebarProfile();
                    }

                    updateSummary();
                    displayUsers();
                    closeUserModal();

                    showDialog(
                        "User Updated",
                        "User information has been successfully updated.",
                        "success"
                    );

                } else {
                    const response = await apiClient.post(
                        "/users",
                        userData
                    );

                    if (!response.success || !response.data) {
                        throw new Error("Unable to create the user.");
                    }

                    const newUser = {
                        id: response.data.id,
                        fullName: response.data.fullName,
                        username: response.data.username,
                        email: response.data.email,
                        role: normalizeRole(response.data.role),
                        accountStatus: normalizeStatus(
                            response.data.accountStatus
                        )
                    };

                    users.push(newUser);

                    updateSummary();
                    displayUsers();
                    closeUserModal();

                    showDialog(
                        "User Added",
                        "The new user account has been successfully created.",
                        "success"
                    );
                }

            } catch (error) {
                console.error("User save failed:", error);

                showDialog(
                    isEditing ? "Unable to Update User" : "Unable to Add User",
                    getErrorMessage(error),
                    "error"
                );

            } finally {
                if (submitButton) {
                    submitButton.disabled = false;
                }
            }
        });
    }

    // ==========================================
    // 13. MODAL CLOSE BUTTONS
    // ==========================================

    if (closeModalBtn) {
        closeModalBtn.addEventListener("click", closeUserModal);
    }

    if (cancelUserBtn) {
        cancelUserBtn.addEventListener("click", closeUserModal);
    }

    if (userModal) {
        userModal.addEventListener("click", event => {
            if (event.target === userModal) {
                closeUserModal();
            }
        });
    }

    // ==========================================
    // 14. SEARCH AND FILTERS
    // ==========================================

    if (userSearch) {
        userSearch.addEventListener("input", displayUsers);
    }

    if (roleFilter) {
        roleFilter.addEventListener("change", displayUsers);
    }

    if (accountStatusFilter) {
        accountStatusFilter.addEventListener("change", displayUsers);
    }

    // ==========================================
    // 15. SIDEBAR NAVIGATION
    // ==========================================

    function isMobileView() {
        return window.innerWidth <= 850;
    }

    function updateSidebarButtonStates() {
        if (!sidebar) return;

        const isCollapsed = sidebar.classList.contains("collapsed");
        const isMobileOpen = sidebar.classList.contains("mobile-open");

        if (sidebarToggle) {
            sidebarToggle.setAttribute(
                "aria-expanded",
                String(!isCollapsed)
            );
        }

        if (mobileSidebarToggle) {
            mobileSidebarToggle.setAttribute(
                "aria-expanded",
                String(isMobileOpen)
            );
        }
    }

    function closeAnalyticsDropdown() {
        if (!analyticsToggle || !analyticsNavList) return;

        analyticsNavList.classList.add("collapsed");
        analyticsToggle.setAttribute("aria-expanded", "false");
    }

    function closeMobileSidebar() {
        if (!sidebar) return;

        sidebar.classList.remove("mobile-open");
        document.body.classList.remove("sidebar-overlay-active");

        updateSidebarButtonStates();
    }

    function openMobileSidebar() {
        if (!sidebar) return;

        sidebar.classList.add("mobile-open");
        document.body.classList.add("sidebar-overlay-active");

        updateSidebarButtonStates();
    }

    function toggleDesktopSidebar() {
        if (!sidebar || isMobileView()) return;

        const willCollapse = !sidebar.classList.contains("collapsed");

        sidebar.classList.toggle("collapsed", willCollapse);

        if (willCollapse) {
            closeAnalyticsDropdown();
        }

        localStorage.setItem(
            SIDEBAR_STORAGE_KEY,
            String(willCollapse)
        );

        updateSidebarButtonStates();
    }

    if (sidebar) {
        const savedSidebarState = localStorage.getItem(
            SIDEBAR_STORAGE_KEY
        );

        if (!isMobileView() && savedSidebarState === "true") {
            sidebar.classList.add("collapsed");
            closeAnalyticsDropdown();
        }

        updateSidebarButtonStates();
    }

    if (sidebarToggle) {
        sidebarToggle.addEventListener("click", toggleDesktopSidebar);
    }

    if (mobileSidebarToggle) {
        mobileSidebarToggle.addEventListener("click", () => {
            if (sidebar?.classList.contains("mobile-open")) {
                closeMobileSidebar();
            } else {
                openMobileSidebar();
            }
        });
    }

    if (sidebarClose) {
        sidebarClose.addEventListener("click", closeMobileSidebar);
    }

    document.addEventListener("click", event => {
        if (
            !sidebar ||
            !isMobileView() ||
            !sidebar.classList.contains("mobile-open")
        ) {
            return;
        }

        const clickedInsideSidebar = sidebar.contains(event.target);

        const clickedMobileToggle =
            mobileSidebarToggle &&
            mobileSidebarToggle.contains(event.target);

        if (!clickedInsideSidebar && !clickedMobileToggle) {
            closeMobileSidebar();
        }
    });

    if (sidebar) {
        sidebar.querySelectorAll(".nav-item[href]").forEach(navLink => {
            navLink.addEventListener("click", () => {
                if (isMobileView()) {
                    closeMobileSidebar();
                }
            });
        });
    }

    // ==========================================
    // 16. ANALYTICS DROPDOWN
    // ==========================================

    if (analyticsToggle && analyticsNavList) {
        analyticsToggle.addEventListener("click", event => {
            event.preventDefault();

            const isCurrentlyCollapsed =
                analyticsNavList.classList.contains("collapsed");

            analyticsNavList.classList.toggle("collapsed");

            analyticsToggle.setAttribute(
                "aria-expanded",
                String(isCurrentlyCollapsed)
            );
        });
    }

    // ==========================================
    // 17. LOGOUT CONFIRMATION MODAL
    // ==========================================

    let logoutModalOverlay = null;
    let previousLogoutFocus = null;

    function closeLogoutModal() {
        if (!logoutModalOverlay) return;

        logoutModalOverlay.classList.remove("show");

        document.removeEventListener(
            "keydown",
            handleLogoutModalKeyboard
        );

        const modalToRemove = logoutModalOverlay;

        window.setTimeout(() => {
            modalToRemove.remove();

            if (logoutModalOverlay === modalToRemove) {
                logoutModalOverlay = null;
            }
        }, 250);

        if (previousLogoutFocus) {
            previousLogoutFocus.focus();
        }
    }

    function handleLogoutModalKeyboard(event) {
        if (!logoutModalOverlay) return;

        if (event.key === "Escape") {
            event.preventDefault();
            closeLogoutModal();
            return;
        }

        if (event.key === "Tab") {
            const focusableElements =
                logoutModalOverlay.querySelectorAll(
                    "button:not([disabled])"
                );

            if (!focusableElements.length) return;

            const firstElement = focusableElements[0];
            const lastElement =
                focusableElements[focusableElements.length - 1];

            if (
                event.shiftKey &&
                document.activeElement === firstElement
            ) {
                event.preventDefault();
                lastElement.focus();

            } else if (
                !event.shiftKey &&
                document.activeElement === lastElement
            ) {
                event.preventDefault();
                firstElement.focus();
            }
        }
    }

    function openLogoutModal() {
        if (logoutModalOverlay) return;

        previousLogoutFocus = document.activeElement;

        logoutModalOverlay = document.createElement("div");
        logoutModalOverlay.className = "logout-modal-overlay";

        logoutModalOverlay.innerHTML = `
            <div
                class="logout-modal"
                role="dialog"
                aria-modal="true"
                aria-labelledby="logoutModalTitle"
                aria-describedby="logoutModalMessage"
            >
                <div class="logout-modal-icon">
                    <i class="fa-solid fa-right-from-bracket"></i>
                </div>

                <div class="logout-modal-eyebrow">
                    CAFÉSENSE ACCOUNT
                </div>

                <h2 id="logoutModalTitle">
                    Confirm Logout
                </h2>

                <p id="logoutModalMessage">
                    Are you sure you want to log out of your CaféSense account?
                </p>

                <div class="logout-modal-actions">
                    <button
                        type="button"
                        class="logout-cancel-btn"
                    >
                        Cancel
                    </button>

                    <button
                        type="button"
                        class="logout-confirm-btn"
                    >
                        Yes Logout
                    </button>
                </div>
            </div>
        `;

        document.body.appendChild(logoutModalOverlay);

        const cancelButton = logoutModalOverlay.querySelector(
            ".logout-cancel-btn"
        );

        const confirmButton = logoutModalOverlay.querySelector(
            ".logout-confirm-btn"
        );

        cancelButton.addEventListener("click", closeLogoutModal);

        confirmButton.addEventListener("click", async () => {
            confirmButton.disabled = true;
            confirmButton.textContent = "Logging Out...";

            try {
                await apiClient.post("/auth/logout", {});
                window.location.replace("login.html");

            } catch (error) {
                console.error("Logout failed:", error);

                confirmButton.disabled = false;
                confirmButton.textContent = "Yes, Logout";

                const message = logoutModalOverlay?.querySelector(
                    "#logoutModalMessage"
                );

                if (message) {
                    message.textContent =
                        "Unable to log out. Please check your connection and try again.";
                }
            }
        });

        logoutModalOverlay.addEventListener("click", event => {
            if (event.target === logoutModalOverlay) {
                closeLogoutModal();
            }
        });

        document.addEventListener(
            "keydown",
            handleLogoutModalKeyboard
        );

        requestAnimationFrame(() => {
            logoutModalOverlay.classList.add("show");
            cancelButton.focus();
        });
    }

    if (logoutBtn) {
        logoutBtn.addEventListener("click", openLogoutModal);
    }

    // ==========================================
    // 18. GLOBAL ESCAPE KEY
    // ==========================================

    document.addEventListener("keydown", event => {
        if (event.key !== "Escape") return;

        if (logoutModalOverlay) return;

        closeUserModal();
        closeDialog();

        if (isMobileView()) {
            closeMobileSidebar();
        }
    });

    // ==========================================
    // 19. HANDLE SCREEN RESIZING
    // ==========================================

    window.addEventListener("resize", () => {
        if (!isMobileView()) {
            closeMobileSidebar();
        }

        updateSidebarButtonStates();
    });

    // ==========================================
    // 20. INITIALIZE USER MANAGEMENT
    // ==========================================

    updateSidebarProfile();
    updateCurrentDateTime();

    window.setInterval(updateCurrentDateTime, 1000);

    try {
        await loadUsers();

        updateSummary();
        displayUsers();

    } catch (error) {
        console.error("Unable to load users:", error);

        if (usersTableBody) {
            usersTableBody.innerHTML = `
                <tr>
                    <td colspan="5" style="text-align: center; padding: 30px;">
                        Unable to load users from the server.
                        Please refresh the page and try again.
                    </td>
                </tr>
            `;
        }

        showDialog(
            "Unable to Load Users",
            getErrorMessage(error),
            "error"
        );
    }

});
