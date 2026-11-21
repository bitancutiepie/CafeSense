"use strict";

document.addEventListener("DOMContentLoaded", () => {

    // ==========================================
    // 1. STORAGE KEYS AND CURRENT USER
    // ==========================================

    const USER_STORAGE_KEY = "cafesenseUsers";
    const SESSION_STORAGE_KEY = "cafesense-current-user";
    const SIDEBAR_STORAGE_KEY = "cafeSenseSidebarCollapsed";

    let currentUser;

    try {
        currentUser = JSON.parse(
            sessionStorage.getItem(SESSION_STORAGE_KEY)
        );
    } catch (error) {
        currentUser = null;
    }

    if (!currentUser) {
        window.location.replace("login.html");
        return;
    }

    const currentRole = String(currentUser.role || "")
        .trim()
        .toLowerCase();

    if (currentRole !== "owner") {
        window.location.replace("dashboard.html");
        return;
    }

    let users = [];

    try {
        users = JSON.parse(
            localStorage.getItem(USER_STORAGE_KEY)
        ) || [];
    } catch (error) {
        users = [];
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

    // Date and Time
    const currentDateElement = document.getElementById("current-date");
    const currentTimeElement = document.getElementById("current-time");

    // Sidebar
    const sidebar = document.getElementById("sidebar");
    const sidebarToggle = document.getElementById("sidebarToggle");
    const mobileSidebarToggle = document.getElementById("mobileSidebarToggle");
    const sidebarClose = document.getElementById("sidebarClose");

    const sidebarUserName = document.getElementById("sidebarUserName");
    const sidebarUserRole = document.getElementById("sidebarUserRole");
    const sidebarUserInitials = document.getElementById("display-user-initials");
    const sidebarRoleBadge = document.getElementById("sidebar-role-badge");

    const logoutBtn = document.getElementById("logout-btn");

    // Analytics dropdown
    const analyticsToggle = document.getElementById("analyticsDropdownToggle");
    const analyticsNavList = document.getElementById("analyticsNavList");

    // Custom CRUD dialog
    const dialogOverlay = document.getElementById("dialogOverlay");
    const dialogIcon = document.getElementById("dialogIcon");
    const dialogTitle = document.getElementById("dialogTitle");
    const dialogMessage = document.getElementById("dialogMessage");
    const dialogActions = document.getElementById("dialogActions");

    // ==========================================
    // 3. STORAGE FUNCTIONS
    // ==========================================

    function saveUsers() {
        localStorage.setItem(
            USER_STORAGE_KEY,
            JSON.stringify(users)
        );
    }

    // ==========================================
    // 4. HELPER FUNCTIONS
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

    function getCurrentUserIndex() {
        return users.findIndex(user =>
            user.username?.toLowerCase() ===
            currentUser.username?.toLowerCase()
        );
    }

    function isValidEmail(email) {
        const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailPattern.test(email);
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
    // 5. DATE AND TIME DISPLAY
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

        if (!dialogOverlay || !dialogIcon || !dialogTitle ||
            !dialogMessage || !dialogActions) {
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

            confirmBtn.addEventListener("click", () => {
                closeDialog();
                onConfirm();
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

        const owners = users.filter(user =>
            normalizeRole(user.role) === "Owner"
        ).length;

        const managers = users.filter(user =>
            normalizeRole(user.role) === "Manager"
        ).length;

        const staff = users.filter(user =>
            normalizeRole(user.role) === "Staff"
        ).length;

        if (totalUsers) totalUsers.textContent = users.length;
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

        const filteredUsers = users.filter(user => {

            const name = String(user.fullname || "").toLowerCase();
            const username = String(user.username || "").toLowerCase();
            const email = String(user.email || "").toLowerCase();

            const matchesSearch =
                name.includes(searchTerm) ||
                username.includes(searchTerm) ||
                email.includes(searchTerm);

            const matchesRole =
                selectedRole === "All" ||
                normalizeRole(user.role) === selectedRole;

            return matchesSearch && matchesRole;
        });

        if (filteredUsers.length === 0) {
            if (emptyState) emptyState.hidden = false;
            return;
        }

        if (emptyState) emptyState.hidden = true;

        filteredUsers.forEach(user => {

            const originalIndex = users.indexOf(user);

            const isCurrentUser =
                user.username?.toLowerCase() ===
                currentUser.username?.toLowerCase();

            const role = normalizeRole(user.role);

            const roleClass = {
                Owner: "role-owner",
                Manager: "role-manager",
                Staff: "role-staff"
            }[role] || "role-staff";

            const row = document.createElement("tr");

            row.innerHTML = `
                <td>
                    <div class="user-cell">
                        <div class="user-cell-avatar">
                            ${escapeHTML(getInitials(user.fullname))}
                        </div>

                        <div class="user-cell-info">
                            <strong>${escapeHTML(user.fullname)}</strong>
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
                    <div class="action-buttons">
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
                            title="Delete User"
                            aria-label="Delete User"
                            ${isCurrentUser ? "disabled" : ""}>
                            <i class="fa-solid fa-trash"></i>
                        </button>
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
    // 11. EDIT AND DELETE USERS
    // ==========================================

    if (usersTableBody) {

        usersTableBody.addEventListener("click", event => {

            const editButton = event.target.closest(".edit-btn");
            const deleteButton = event.target.closest(".delete-btn");

            // EDIT USER
            if (editButton) {

                const index = Number(editButton.dataset.index);
                const user = users[index];

                if (!user) return;

                userForm.reset();
                editUserIndex.value = index;

                fullNameInput.value = user.fullname || "";
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

            // DELETE USER
            if (deleteButton && !deleteButton.disabled) {

                const index = Number(deleteButton.dataset.index);
                const user = users[index];

                if (!user) return;

                const isCurrentUser =
                    user.username?.toLowerCase() ===
                    currentUser.username?.toLowerCase();

                if (isCurrentUser) {

                    showDialog(
                        "Action Not Allowed",
                        "You cannot delete your own account.",
                        "warning"
                    );

                    return;
                }

                const ownerCountNow = users.filter(account =>
                    normalizeRole(account.role) === "Owner"
                ).length;

                if (
                    normalizeRole(user.role) === "Owner" &&
                    ownerCountNow <= 1
                ) {

                    showDialog(
                        "Action Not Allowed",
                        "You cannot delete the last Owner account.",
                        "warning"
                    );

                    return;
                }

                showDialog(
                    "Delete User?",
                    `Are you sure you want to permanently delete ${user.fullname}?`,
                    "question",
                    () => {

                        users.splice(index, 1);

                        saveUsers();
                        updateSummary();
                        displayUsers();

                        showDialog(
                            "User Deleted",
                            "The user account has been successfully deleted.",
                            "success"
                        );
                    }
                );
            }
        });
    }

    // ==========================================
    // 12. ADD AND UPDATE USER
    // ==========================================

    if (userForm) {

        userForm.addEventListener("submit", event => {

            event.preventDefault();

            const fullname = fullNameInput.value.trim();
            const username = usernameInput.value.trim();
            const email = emailInput.value.trim().toLowerCase();
            const role = userRoleInput.value;

            const password = passwordInput.value;
            const confirmPassword = confirmPasswordInput.value;

            const editIndex = editUserIndex.value;
            const isEditing = editIndex !== "";

            if (!fullname || !username || !email || !role) {

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

            const duplicateUsername = users.some((user, index) =>
                index !== Number(editIndex) &&
                user.username?.toLowerCase() === username.toLowerCase()
            );

            if (duplicateUsername) {

                showDialog(
                    "Username Already Exists",
                    "Please choose another username.",
                    "warning"
                );

                return;
            }

            const duplicateEmail = users.some((user, index) =>
                index !== Number(editIndex) &&
                user.email?.toLowerCase() === email
            );

            if (duplicateEmail) {

                showDialog(
                    "Email Already Exists",
                    "This email address is already registered.",
                    "warning"
                );

                return;
            }

            const oldUser = isEditing
                ? users[Number(editIndex)]
                : null;

            if (isEditing && !oldUser) return;

            const isEditingCurrentUser =
                isEditing &&
                oldUser.username?.toLowerCase() ===
                currentUser.username?.toLowerCase();

            if (
                isEditingCurrentUser &&
                role !== "Owner"
            ) {

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
                    normalizeRole(user.role) === "Owner"
                ).length;

                if (currentOwnerCount <= 1) {

                    showDialog(
                        "Action Not Allowed",
                        "You cannot remove the role of the last Owner.",
                        "warning"
                    );

                    return;
                }
            }

            const updatedUser = {
                ...oldUser,
                fullname,
                username,
                email,
                password: password || (oldUser ? oldUser.password : ""),
                role
            };

            // UPDATE EXISTING USER
            if (isEditing) {

                users[Number(editIndex)] = updatedUser;

                if (isEditingCurrentUser) {

                    currentUser = {
                        ...currentUser,
                        username: updatedUser.username,
                        email: updatedUser.email,
                        name: updatedUser.fullname,
                        role: updatedUser.role
                    };

                    sessionStorage.setItem(
                        SESSION_STORAGE_KEY,
                        JSON.stringify(currentUser)
                    );

                    localStorage.setItem(
                        "loggedInUser",
                        updatedUser.username
                    );

                    localStorage.setItem(
                        "userRole",
                        updatedUser.role
                    );

                    localStorage.setItem(
                        "fullName",
                        updatedUser.fullname
                    );

                    updateSidebarProfile();
                }

                saveUsers();
                updateSummary();
                displayUsers();
                closeUserModal();

                showDialog(
                    "User Updated",
                    "User information has been successfully updated.",
                    "success"
                );

                return;
            }

            // ADD NEW USER
            users.push(updatedUser);

            saveUsers();
            updateSummary();
            displayUsers();
            closeUserModal();

            showDialog(
                "User Added",
                "The new user account has been successfully created.",
                "success"
            );
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
    // 14. SEARCH USERS
    // ==========================================

    if (userSearch) {
        userSearch.addEventListener("input", displayUsers);
    }

    // ==========================================
    // 15. FILTER USERS BY ROLE
    // ==========================================

    if (roleFilter) {
        roleFilter.addEventListener("change", displayUsers);
    }

    // ==========================================
    // 16. SIDEBAR NAVIGATION
    // ==========================================

    function isMobileView() {
        return window.innerWidth <= 850;
    }

    // Update sidebar button accessibility states
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

    // Close Analytics dropdown
    function closeAnalyticsDropdown() {
        if (!analyticsToggle || !analyticsNavList) return;

        analyticsNavList.classList.add("collapsed");

        analyticsToggle.setAttribute("aria-expanded", "false");
    }

    // Open Analytics dropdown
    function openAnalyticsDropdown() {
        if (!analyticsToggle || !analyticsNavList) return;

        analyticsNavList.classList.remove("collapsed");

        analyticsToggle.setAttribute("aria-expanded", "true");
    }

    // Close mobile sidebar
    function closeMobileSidebar() {
        if (!sidebar) return;

        sidebar.classList.remove("mobile-open");
        document.body.classList.remove("sidebar-overlay-active");

        updateSidebarButtonStates();
    }

    // Open mobile sidebar
    function openMobileSidebar() {
        if (!sidebar) return;

        sidebar.classList.add("mobile-open");
        document.body.classList.add("sidebar-overlay-active");

        updateSidebarButtonStates();
    }

    // Toggle desktop sidebar collapse
    function toggleDesktopSidebar() {
        if (!sidebar || isMobileView()) return;

        const willCollapse = !sidebar.classList.contains("collapsed");

        sidebar.classList.toggle("collapsed", willCollapse);

        // Close Analytics whenever the sidebar is collapsed
        if (willCollapse) {
            closeAnalyticsDropdown();
        }

        localStorage.setItem(
            SIDEBAR_STORAGE_KEY,
            String(willCollapse)
        );

        updateSidebarButtonStates();
    }

    // Restore saved desktop sidebar state
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

    // DESKTOP SIDEBAR TOGGLE
    if (sidebarToggle) {
        sidebarToggle.addEventListener("click", toggleDesktopSidebar);
    }

    // MOBILE HEADER HAMBURGER
    if (mobileSidebarToggle) {
        mobileSidebarToggle.addEventListener("click", () => {
            if (sidebar?.classList.contains("mobile-open")) {
                closeMobileSidebar();
            } else {
                openMobileSidebar();
            }
        });
    }

    // MOBILE SIDEBAR CLOSE BUTTON
    if (sidebarClose) {
        sidebarClose.addEventListener("click", closeMobileSidebar);
    }

    // Close mobile sidebar when clicking outside
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

    // Close mobile sidebar after selecting a navigation link
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
    // 17. ANALYTICS DROPDOWN
    // ==========================================

    function setupAnalyticsDropdown() {

        const sidebar = document.getElementById("sidebar");

        const dropdownToggle = document.getElementById(
            "analyticsDropdownToggle"
        );

        const analyticsNavList = document.getElementById(
            "analyticsNavList"
        );

        if (!sidebar || !dropdownToggle || !analyticsNavList) {
            return;
        }

        dropdownToggle.addEventListener("click", function (event) {

            event.preventDefault();

            const isCurrentlyCollapsed =
                analyticsNavList.classList.contains("collapsed");

            analyticsNavList.classList.toggle("collapsed");

            dropdownToggle.setAttribute(
                "aria-expanded",
                String(isCurrentlyCollapsed)
            );

        });

    }

    setupAnalyticsDropdown();

    // ==========================================
    // 18. LOGOUT CONFIRMATION MODAL
    // ==========================================

    let logoutModalOverlay = null;
    let previousLogoutFocus = null;

    // CLOSE LOGOUT MODAL
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

    // LOGOUT MODAL KEYBOARD CONTROLS
    function handleLogoutModalKeyboard(event) {

        if (!logoutModalOverlay) return;

        // Close modal using Escape
        if (event.key === "Escape") {

            event.preventDefault();
            closeLogoutModal();

            return;
        }

        // Keep keyboard focus inside the modal
        if (event.key === "Tab") {

            const focusableElements = logoutModalOverlay.querySelectorAll(
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

    // OPEN LOGOUT MODAL
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

        // Cancel logout
        cancelButton.addEventListener("click", closeLogoutModal);

        // Confirm logout
        confirmButton.addEventListener("click", () => {

            sessionStorage.removeItem(SESSION_STORAGE_KEY);

            localStorage.removeItem("loggedInUser");
            localStorage.removeItem("userRole");
            localStorage.removeItem("fullName");

            window.location.href = "login.html";
        });

        // Close when clicking outside the modal
        logoutModalOverlay.addEventListener("click", event => {

            if (event.target === logoutModalOverlay) {
                closeLogoutModal();
            }
        });

        // Register keyboard controls
        document.addEventListener(
            "keydown",
            handleLogoutModalKeyboard
        );

        // Show modal and focus Cancel button
        requestAnimationFrame(() => {

            logoutModalOverlay.classList.add("show");

            cancelButton.focus();
        });
    }

    // LOGOUT BUTTON EVENT
    if (logoutBtn) {
        logoutBtn.addEventListener("click", openLogoutModal);
    }

    // ==========================================
    // 19. GLOBAL ESCAPE KEY
    // ==========================================

    document.addEventListener("keydown", event => {

        if (event.key !== "Escape") return;

        // Logout modal handles its own Escape key
        if (logoutModalOverlay) return;

        closeUserModal();
        closeDialog();

        if (isMobileView()) {
            closeMobileSidebar();
        }
    });

    // ==========================================
    // 20. HANDLE SCREEN RESIZING
    // ==========================================

    window.addEventListener("resize", () => {

        if (!isMobileView()) {
            closeMobileSidebar();
        }

        updateSidebarButtonStates();
    });

    // ==========================================
    // 21. INITIAL DISPLAY
    // ==========================================

    users = users.map(user => ({
        ...user,
        role: normalizeRole(user.role)
    }));

    saveUsers();

    updateSidebarProfile();
    updateSummary();
    displayUsers();

    // Initialize current date and time
    updateCurrentDateTime();

    // Update the displayed time every second
    window.setInterval(updateCurrentDateTime, 1000);

});