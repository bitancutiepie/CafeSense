/* =========================================================
   CAFÉSENSE - PRODUCTS & INVENTORY
========================================================= */


/* =========================================================
   1. INITIAL PRODUCT DATA
========================================================= */

const LOW_STOCK_LIMIT = 10;

const STORAGE_KEY = "cafeSenseProducts";
const SIDEBAR_STORAGE_KEY = "cafeSenseSidebarCollapsed";

const defaultProducts = [
    { id: "P001", name: "Café Latte", category: "Coffee", price: 120, stock: 35 },
    { id: "P002", name: "Americano", category: "Coffee", price: 100, stock: 28 },
    { id: "P003", name: "Cappuccino", category: "Coffee", price: 130, stock: 22 },
    { id: "P004", name: "Caramel Macchiato", category: "Coffee", price: 145, stock: 18 },
    { id: "P005", name: "Spanish Latte", category: "Coffee", price: 140, stock: 30 },
    { id: "P006", name: "Matcha Latte", category: "Non-Coffee", price: 170, stock: 20 },
    { id: "P007", name: "Chocolate Milk", category: "Non-Coffee", price: 110, stock: 25 },
    { id: "P008", name: "Strawberry Milk", category: "Non-Coffee", price: 120, stock: 16 },
    { id: "P009", name: "Blueberry Cheesecake", category: "Pastry / Baked Good", price: 150, stock: 12 },
    { id: "P010", name: "Chocolate Muffin", category: "Pastry / Baked Good", price: 85, stock: 24 },
    { id: "P011", name: "Croissant", category: "Pastry / Baked Good", price: 95, stock: 20 },
    { id: "P012", name: "Chocolate Chip Cookie", category: "Pastry / Baked Good", price: 65, stock: 40 }
];

let products = loadProducts();


/* =========================================================
   2. LOAD PRODUCTS
========================================================= */

function loadProducts() {

    try {

        const savedProducts = localStorage.getItem(STORAGE_KEY);

        if (savedProducts !== null) {

            const parsedProducts = JSON.parse(savedProducts);

            if (Array.isArray(parsedProducts)) {

                const loadedProducts = parsedProducts.filter(function (product) {

                    return (
                        product &&
                        typeof product.id === "string" &&
                        typeof product.name === "string" &&
                        typeof product.category === "string" &&
                        Number.isFinite(Number(product.price)) &&
                        Number(product.price) > 0 &&
                        Number.isInteger(Number(product.stock)) &&
                        Number(product.stock) >= 0
                    );

                }).map(function (product) {

                    return {
                        id: product.id,
                        name: product.name,

                        category: product.category === "Pastries"
                            ? "Pastry / Baked Good"
                            : product.category,

                        price: Number(product.price),
                        stock: Number(product.stock)
                    };

                });

                // Save migrated categories to localStorage
                const hasOldCategory = parsedProducts.some(function (product) {
                    return product && product.category === "Pastries";
                });

                if (hasOldCategory) {

                    localStorage.setItem(
                        STORAGE_KEY,
                        JSON.stringify(loadedProducts)
                    );

                }

                return loadedProducts;

            }

            console.warn("Invalid product data. Loading default products.");

        }

    } catch (error) {

        console.error("Unable to load saved products:", error);

    }

    return defaultProducts.map(function (product) {
        return { ...product };
    });

}


/* =========================================================
   3. CUSTOM ALERT AND CONFIRMATION DIALOGS
========================================================= */

let activeAppDialog = null;


function showAppDialog(options) {

    if (activeAppDialog) {
        return Promise.resolve(false);
    }

    return new Promise(function (resolve) {

        const settings = {
            type: options.type || "alert",
            title: options.title || "Notice",
            message: options.message || "",
            icon: options.icon || "fa-circle-info",
            tone: options.tone || "default",
            confirmText: options.confirmText || "Okay",
            cancelText: options.cancelText || "Cancel",
            details: options.details || []
        };

        const overlay = document.createElement("div");
        overlay.className = "app-dialog-overlay";

        const dialog = document.createElement("section");
        dialog.className = "app-dialog";

        dialog.setAttribute(
            "role",
            settings.type === "confirm" ? "alertdialog" : "dialog"
        );

        dialog.setAttribute("aria-modal", "true");
        dialog.setAttribute("aria-labelledby", "app-dialog-title");
        dialog.setAttribute("aria-describedby", "app-dialog-message");
        dialog.setAttribute("tabindex", "-1");


        const iconContainer = document.createElement("div");
        iconContainer.className = "app-dialog-icon";

        if (settings.tone !== "default") {
            iconContainer.classList.add(settings.tone);
        }

        const icon = document.createElement("i");
        icon.className = `fa-solid ${settings.icon}`;

        iconContainer.appendChild(icon);


        const eyebrow = document.createElement("span");
        eyebrow.className = "app-dialog-eyebrow";
        eyebrow.textContent = "CAFÉSENSE INVENTORY";


        const title = document.createElement("h2");
        title.id = "app-dialog-title";
        title.textContent = settings.title;


        const message = document.createElement("p");
        message.id = "app-dialog-message";
        message.className = "app-dialog-message";
        message.textContent = settings.message;


        dialog.appendChild(iconContainer);
        dialog.appendChild(eyebrow);
        dialog.appendChild(title);
        dialog.appendChild(message);


        if (settings.details.length > 0) {

            const detailsContainer = document.createElement("div");
            detailsContainer.className = "app-dialog-details";

            settings.details.forEach(function (detail) {

                const detailRow = document.createElement("div");
                detailRow.className = "app-dialog-detail";

                const label = document.createElement("span");
                label.textContent = detail.label;

                const value = document.createElement("strong");
                value.textContent = detail.value;

                detailRow.appendChild(label);
                detailRow.appendChild(value);

                detailsContainer.appendChild(detailRow);

            });

            dialog.appendChild(detailsContainer);

        }


        const actions = document.createElement("div");
        actions.className = "app-dialog-actions";

        let cancelButton = null;

        if (settings.type === "confirm") {

            cancelButton = document.createElement("button");
            cancelButton.type = "button";
            cancelButton.className = "app-dialog-btn cancel";
            cancelButton.textContent = settings.cancelText;

            actions.appendChild(cancelButton);

        }


        const confirmButton = document.createElement("button");
        confirmButton.type = "button";
        confirmButton.className = "app-dialog-btn confirm";

        if (settings.tone === "danger") {
            confirmButton.classList.add("danger");
        }

        confirmButton.textContent = settings.confirmText;

        actions.appendChild(confirmButton);

        dialog.appendChild(actions);
        overlay.appendChild(dialog);

        document.body.appendChild(overlay);

        activeAppDialog = overlay;

        document.body.classList.add("app-dialog-open");


        let isClosing = false;


        function closeDialog(result) {

            if (isClosing) {
                return;
            }

            isClosing = true;

            overlay.classList.remove("show");

            document.body.classList.remove("app-dialog-open");

            document.removeEventListener(
                "keydown",
                handleDialogKeydown
            );

            activeAppDialog = null;

            setTimeout(function () {
                overlay.remove();
            }, 230);

            resolve(result);

        }


        function handleDialogKeydown(event) {

            if (event.key === "Escape") {

                event.preventDefault();
                event.stopImmediatePropagation();

                closeDialog(false);

                return;

            }

            if (event.key === "Tab") {

                const focusableElements = dialog.querySelectorAll(
                    'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
                );

                const firstElement = focusableElements[0];
                const lastElement = focusableElements[focusableElements.length - 1];

                if (!firstElement || !lastElement) {
                    event.preventDefault();
                    return;
                }

                if (event.shiftKey && document.activeElement === firstElement) {

                    event.preventDefault();
                    lastElement.focus();

                } else if (!event.shiftKey && document.activeElement === lastElement) {

                    event.preventDefault();
                    firstElement.focus();

                }

            }

        }


        if (cancelButton) {

            cancelButton.addEventListener("click", function () {
                closeDialog(false);
            });

        }


        confirmButton.addEventListener("click", function () {
            closeDialog(true);
        });


        overlay.addEventListener("click", function (event) {

            if (event.target === overlay) {
                closeDialog(false);
            }

        });


        document.addEventListener(
            "keydown",
            handleDialogKeydown
        );


        requestAnimationFrame(function () {

            overlay.classList.add("show");

            if (cancelButton) {
                cancelButton.focus();
            } else {
                confirmButton.focus();
            }

        });

    });

}


/* =========================================================
   4. SAVE PRODUCTS
========================================================= */

function saveProducts() {

    try {

        localStorage.setItem(
            STORAGE_KEY,
            JSON.stringify(products)
        );

        return true;

    } catch (error) {

        console.error("Unable to save products:", error);

        showAppDialog({
            type: "alert",
            title: "Unable to Save Changes",
            message: "Your product changes could not be saved in this browser. Your changes have been reverted.",
            icon: "fa-triangle-exclamation",
            tone: "danger"
        });

        return false;

    }

}


/* =========================================================
   5. GET HTML ELEMENTS
========================================================= */

// Sidebar
const sidebar = document.getElementById("sidebar");

// Desktop collapse button
const sidebarToggle = document.getElementById("sidebarToggle");

// Mobile hamburger button
const mobileSidebarToggle = document.getElementById("mobileSidebarToggle");

// Mobile close button
const sidebarClose = document.getElementById("sidebarClose");

// Optional overlay element
const sidebarOverlay = document.getElementById("sidebarOverlay");

// Analytics dropdown
const analyticsDropdownToggle = document.getElementById("analyticsDropdownToggle");
const analyticsNavList = document.getElementById("analyticsNavList");

// Header date time
const currentDateElement = document.getElementById("current-date");
const currentTimeElement = document.getElementById("current-time");

// Summary cards
const totalProducts = document.getElementById("totalProducts");
const inStockProducts = document.getElementById("inStockProducts");
const lowStockProducts = document.getElementById("lowStockProducts");
const outOfStockProducts = document.getElementById("outOfStockProducts");
const displayProductCount = document.getElementById("displayProductCount");

// Search and filters
const productSearch = document.getElementById("productSearch");
const clearSearchBtn = document.getElementById("clearSearchBtn");

const categoryFilter = document.getElementById("categoryFilter");
const stockFilter = document.getElementById("stockFilter");

// Product table
const productTableBody = document.getElementById("productTableBody");
const emptyInventory = document.getElementById("emptyInventory");

// Product modal
const productModal = document.getElementById("productModal");
const addProductBtn = document.getElementById("addProductBtn");
const cancelProductBtn = document.getElementById("cancelProductBtn");

const productForm = document.getElementById("productForm");
const modalTitle = document.getElementById("modalTitle");

const editProductId = document.getElementById("editProductId");
const productName = document.getElementById("productName");
const productCategory = document.getElementById("productCategory");
const productPrice = document.getElementById("productPrice");
const productStock = document.getElementById("productStock");

// Stock modal
const stockModal = document.getElementById("stockModal");
const cancelStockBtn = document.getElementById("cancelStockBtn");

const stockForm = document.getElementById("stockForm");

const stockProductId = document.getElementById("stockProductId");
const stockProductName = document.getElementById("stockProductName");
const currentStockValue = document.getElementById("currentStockValue");

const stockAction = document.getElementById("stockAction");
const stockQuantity = document.getElementById("stockQuantity");
const stockReason = document.getElementById("stockReason");


/* =========================================================
   6. SIDEBAR RESPONSIVE BEHAVIOR
========================================================= */

const MOBILE_BREAKPOINT = 850;

const mobileMediaQuery = window.matchMedia(
    `(max-width: ${MOBILE_BREAKPOINT}px)`
);


function isMobileView() {
    return mobileMediaQuery.matches;
}


// Update accessibility attributes for both sidebar buttons
function updateSidebarAccessibility() {

    if (!sidebar) {
        return;
    }

    const isMobile = isMobileView();

    const isExpanded = isMobile
        ? sidebar.classList.contains("mobile-open")
        : !sidebar.classList.contains("collapsed");


    // Desktop toggle accessibility
    if (sidebarToggle) {

        sidebarToggle.setAttribute(
            "aria-expanded",
            String(!sidebar.classList.contains("collapsed"))
        );

        sidebarToggle.setAttribute(
            "aria-label",
            sidebar.classList.contains("collapsed")
                ? "Expand sidebar"
                : "Collapse sidebar"
        );

        sidebarToggle.setAttribute(
            "title",
            sidebar.classList.contains("collapsed")
                ? "Expand Sidebar"
                : "Collapse Sidebar"
        );

    }


    // Mobile toggle accessibility
    if (mobileSidebarToggle) {

        mobileSidebarToggle.setAttribute(
            "aria-expanded",
            String(isExpanded)
        );

        mobileSidebarToggle.setAttribute(
            "aria-label",
            isExpanded ? "Close navigation" : "Open navigation"
        );

        mobileSidebarToggle.setAttribute(
            "title",
            isExpanded ? "Close Navigation" : "Open Navigation"
        );

    }

}


// Open mobile sidebar
function openMobileSidebar() {

    if (!sidebar || !isMobileView()) {
        return;
    }

    sidebar.classList.remove("collapsed");
    sidebar.classList.add("mobile-open");

    document.body.classList.add("sidebar-overlay-active");

    if (sidebarOverlay) {
        sidebarOverlay.classList.add("active");
    }

    updateSidebarAccessibility();

}


// Close mobile sidebar
function closeMobileSidebar() {

    if (!sidebar) {
        return;
    }

    sidebar.classList.remove("mobile-open");

    document.body.classList.remove("sidebar-overlay-active");

    if (sidebarOverlay) {
        sidebarOverlay.classList.remove("active");
    }

    updateSidebarAccessibility();

}


// Apply the saved desktop state or reset the mobile state
function applySidebarState() {

    if (!sidebar) {
        return;
    }

    if (isMobileView()) {

        // Mobile sidebar starts closed
        sidebar.classList.remove("collapsed");
        sidebar.classList.remove("mobile-open");

        document.body.classList.remove("sidebar-overlay-active");

        if (sidebarOverlay) {
            sidebarOverlay.classList.remove("active");
        }

    } else {

        // Restore the saved desktop sidebar preference
        const isCollapsed =
            localStorage.getItem(SIDEBAR_STORAGE_KEY) === "true";

        sidebar.classList.remove("mobile-open");

        sidebar.classList.toggle(
            "collapsed",
            isCollapsed
        );

        document.body.classList.remove("sidebar-overlay-active");

        if (sidebarOverlay) {
            sidebarOverlay.classList.remove("active");
        }

    }

    updateSidebarAccessibility();

}


/* ---------------------------------------------------------
   DESKTOP SIDEBAR COLLAPSE
--------------------------------------------------------- */

if (sidebarToggle && sidebar) {

    sidebarToggle.addEventListener("click", function () {

        // Desktop button only controls desktop sidebar
        if (isMobileView()) {
            return;
        }

        sidebar.classList.toggle("collapsed");

        const isCollapsed =
            sidebar.classList.contains("collapsed");

        localStorage.setItem(
            SIDEBAR_STORAGE_KEY,
            String(isCollapsed)
        );

        updateSidebarAccessibility();

    });

}


/* ---------------------------------------------------------
   MOBILE SIDEBAR OPEN
--------------------------------------------------------- */

if (mobileSidebarToggle) {

    mobileSidebarToggle.addEventListener("click", function () {

        if (!isMobileView()) {
            return;
        }

        if (sidebar && sidebar.classList.contains("mobile-open")) {
            closeMobileSidebar();
        } else {
            openMobileSidebar();
        }

    });

}


/* ---------------------------------------------------------
   MOBILE SIDEBAR CLOSE BUTTON
--------------------------------------------------------- */

if (sidebarClose) {

    sidebarClose.addEventListener("click", function () {

        if (isMobileView()) {
            closeMobileSidebar();
        }

    });

}


/* ---------------------------------------------------------
   SIDEBAR OVERLAY
--------------------------------------------------------- */

if (sidebarOverlay) {

    sidebarOverlay.addEventListener(
        "click",
        closeMobileSidebar
    );

}


/* ---------------------------------------------------------
   CLOSE SIDEBAR WHEN CLICKING OUTSIDE
--------------------------------------------------------- */

document.addEventListener("click", function (event) {

    if (!isMobileView() || !sidebar) {
        return;
    }

    if (!sidebar.classList.contains("mobile-open")) {
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


/* ---------------------------------------------------------
   CLOSE SIDEBAR AFTER NAVIGATION
--------------------------------------------------------- */

if (sidebar) {

    const sidebarLinks = sidebar.querySelectorAll("a[href]");

    sidebarLinks.forEach(function (link) {

        link.addEventListener("click", function () {

            if (isMobileView()) {
                closeMobileSidebar();
            }

        });

    });

}


/* ---------------------------------------------------------
   HANDLE SCREEN RESIZING
--------------------------------------------------------- */

window.addEventListener("resize", function () {

    applySidebarState();

});


applySidebarState();


/* =========================================================
   7. ANALYTICS DROPDOWN
   SUPPORTS EXPANDED AND COLLAPSED SIDEBAR
========================================================= */

function setupAnalyticsDropdown() {

    if (!analyticsDropdownToggle || !analyticsNavList) {
        return;
    }

    analyticsDropdownToggle.addEventListener("click", function () {

        // Toggle the Analytics submenu in both expanded
        // and collapsed desktop sidebar modes.

        const isCurrentlyExpanded =
            analyticsDropdownToggle.getAttribute("aria-expanded") === "true";

        const shouldExpand = !isCurrentlyExpanded;

        analyticsDropdownToggle.setAttribute(
            "aria-expanded",
            String(shouldExpand)
        );

        analyticsNavList.classList.toggle(
            "collapsed",
            !shouldExpand
        );

    });

}

setupAnalyticsDropdown();


/* =========================================================
   8. DISPLAY CURRENT DATE AND TIME
========================================================= */

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

updateCurrentDateTime();

window.setInterval(updateCurrentDateTime, 1000);


/* =========================================================
   9. GET PRODUCT STOCK STATUS
========================================================= */

function getStockStatus(stock) {

    if (stock === 0) {
        return "Out of Stock";
    }

    if (stock <= LOW_STOCK_LIMIT) {
        return "Low Stock";
    }

    return "In Stock";

}


/* =========================================================
   10. UPDATE INVENTORY SUMMARY
========================================================= */

function updateInventorySummary() {

    const total = products.length;

    const inStock = products.filter(function (product) {
        return getStockStatus(product.stock) === "In Stock";
    }).length;

    const lowStock = products.filter(function (product) {
        return getStockStatus(product.stock) === "Low Stock";
    }).length;

    const outOfStock = products.filter(function (product) {
        return getStockStatus(product.stock) === "Out of Stock";
    }).length;


    if (totalProducts) {
        totalProducts.textContent = total;
    }

    if (inStockProducts) {
        inStockProducts.textContent = inStock;
    }

    if (lowStockProducts) {
        lowStockProducts.textContent = lowStock;
    }

    if (outOfStockProducts) {
        outOfStockProducts.textContent = outOfStock;
    }

}


/* =========================================================
   11. DISPLAY PRODUCTS
========================================================= */

function displayProducts() {

    if (!productTableBody) {
        return;
    }

    productTableBody.innerHTML = "";

    const searchValue = productSearch
        ? productSearch.value.trim().toLowerCase()
        : "";

    const selectedCategory = categoryFilter
        ? categoryFilter.value
        : "all";

    const selectedStock = stockFilter
        ? stockFilter.value
        : "all";


    const filteredProducts = products.filter(function (product) {

        const matchesSearch =
            product.name.toLowerCase().includes(searchValue) ||
            product.id.toLowerCase().includes(searchValue);

        const matchesCategory =
            selectedCategory === "all" ||
            product.category === selectedCategory;

        const matchesStock =
            selectedStock === "all" ||
            getStockStatus(product.stock) === selectedStock;

        return matchesSearch && matchesCategory && matchesStock;

    });


    if (displayProductCount) {
        displayProductCount.textContent = filteredProducts.length;
    }


    if (filteredProducts.length === 0) {

        if (emptyInventory) {
            emptyInventory.style.display = "block";
        }

        return;

    }

    if (emptyInventory) {
        emptyInventory.style.display = "none";
    }


    filteredProducts.forEach(function (product) {

        const status = getStockStatus(product.stock);

        let statusClass = "";

        if (status === "In Stock") {
            statusClass = "in-stock";
        } else if (status === "Low Stock") {
            statusClass = "low-stock";
        } else {
            statusClass = "out-of-stock";
        }


        const row = document.createElement("tr");

        row.innerHTML = `

            <td>
                <span class="product-id">${escapeHTML(product.id)}</span>
            </td>

            <td>
                <span class="product-name">${escapeHTML(product.name)}</span>
            </td>

            <td>
                <span class="category-badge">
                    ${escapeHTML(product.category)}
                </span>
            </td>

            <td>
                <span class="product-price">
                    ₱${Number(product.price).toFixed(2)}
                </span>
            </td>

            <td>
                <span class="product-stock">
                    ${product.stock}
                </span>
            </td>

            <td>
                <span class="status-badge ${statusClass}">
                    ${status}
                </span>
            </td>

            <td>
                <div class="action-buttons">

                    <button
                        type="button"
                        class="action-btn edit-btn"
                        data-action="edit"
                        data-id="${escapeHTML(product.id)}"
                        title="Edit Product"
                        aria-label="Edit ${escapeHTML(product.name)}">

                        <i class="fa-solid fa-pen"></i>

                    </button>

                    <button
                        type="button"
                        class="action-btn stock-btn"
                        data-action="stock"
                        data-id="${escapeHTML(product.id)}"
                        title="Adjust Stock"
                        aria-label="Adjust stock for ${escapeHTML(product.name)}">

                        <i class="fa-solid fa-boxes-stacked"></i>

                    </button>

                    <button
                        type="button"
                        class="action-btn delete-btn"
                        data-action="delete"
                        data-id="${escapeHTML(product.id)}"
                        title="Delete Product"
                        aria-label="Delete ${escapeHTML(product.name)}">

                        <i class="fa-solid fa-trash"></i>

                    </button>

                </div>
            </td>

        `;

        productTableBody.appendChild(row);

    });

}


/* =========================================================
   12. ESCAPE HTML
========================================================= */

function escapeHTML(value) {

    return String(value).replace(/[&<>"']/g, function (character) {

        const entities = {
            "&": "&amp;",
            "<": "&lt;",
            ">": "&gt;",
            '"': "&quot;",
            "'": "&#39;"
        };

        return entities[character];

    });

}


/* =========================================================
   13. GENERATE PRODUCT ID
========================================================= */

function generateProductID() {

    let highestNumber = 0;

    products.forEach(function (product) {

        const number = parseInt(product.id.replace("P", ""), 10);

        if (!isNaN(number) && number > highestNumber) {
            highestNumber = number;
        }

    });

    return "P" + String(highestNumber + 1).padStart(3, "0");

}


/* =========================================================
   14. PRODUCT FORM CHANGE TRACKING
========================================================= */

let productFormInitialState = null;


function getProductFormState() {

    if (!productForm) {
        return "";
    }

    return JSON.stringify({
        id: editProductId.value,
        name: productName.value,
        category: productCategory.value,
        price: productPrice.value,
        stock: productStock.value
    });

}


function setProductFormInitialState() {
    productFormInitialState = getProductFormState();
}


function hasUnsavedProductChanges() {

    if (productFormInitialState === null) {
        return false;
    }

    return getProductFormState() !== productFormInitialState;

}


/* =========================================================
   15. OPEN ADD PRODUCT MODAL
========================================================= */

function openAddProductModal() {

    if (!productForm || !productModal) {
        return;
    }

    productForm.reset();

    editProductId.value = "";

    modalTitle.textContent = "Add New Product";

    setProductFormInitialState();

    productModal.classList.add("show");

    productName.focus();

}


if (addProductBtn) {
    addProductBtn.addEventListener("click", openAddProductModal);
}


/* =========================================================
   16. OPEN EDIT PRODUCT MODAL
========================================================= */

function openEditProductModal(id) {

    const product = products.find(function (item) {
        return item.id === id;
    });

    if (!product || !productForm || !productModal) {
        return;
    }

    editProductId.value = product.id;

    productName.value = product.name;
    productCategory.value = product.category;
    productPrice.value = product.price;
    productStock.value = product.stock;

    modalTitle.textContent = "Edit Product";

    setProductFormInitialState();

    productModal.classList.add("show");

    productName.focus();

}


/* =========================================================
   17. SAVE PRODUCT
========================================================= */

if (productForm) {

    productForm.addEventListener("submit", async function (event) {

        event.preventDefault();

        const id = editProductId.value;

        const name = productName.value.trim();
        const category = productCategory.value;

        const price = Number(productPrice.value);
        const stock = Number(productStock.value);


        if (
            name === "" ||
            category === "" ||
            !Number.isFinite(price) ||
            price <= 0 ||
            !Number.isInteger(stock) ||
            stock < 0
        ) {

            await showAppDialog({
                title: "Invalid Product Information",
                message: "Please enter a valid product name, category, price, and stock quantity.",
                icon: "fa-circle-exclamation",
                tone: "warning"
            });

            return;

        }


        const duplicateProduct = products.find(function (product) {

            return product.name.toLowerCase() === name.toLowerCase()
                && product.id !== id;

        });

        if (duplicateProduct) {

            await showAppDialog({
                title: "Duplicate Product",
                message: "A product with this name already exists. Please use a different product name.",
                icon: "fa-copy",
                tone: "warning"
            });

            return;

        }


        if (id) {

            const existingProduct = products.find(function (item) {
                return item.id === id;
            });

            if (!existingProduct) {

                await showAppDialog({
                    title: "Product Not Found",
                    message: "The product you are trying to update could not be found.",
                    icon: "fa-circle-exclamation",
                    tone: "danger"
                });

                return;

            }

        }


        const isEditing = Boolean(id);

        const confirmed = await showAppDialog({
            type: "confirm",
            title: isEditing ? "Confirm Product Update" : "Confirm New Product",
            message: isEditing
                ? "Are you sure you want to save the changes to this product?"
                : "Are you sure you want to add this product to your inventory?",
            icon: isEditing ? "fa-pen-to-square" : "fa-circle-plus",
            confirmText: isEditing ? "Yes, Update" : "Yes, Add Product"
        });

        if (!confirmed) {
            return;
        }


        if (isEditing) {

            const product = products.find(function (item) {
                return item.id === id;
            });

            if (!product) {
                return;
            }

            const originalProduct = { ...product };

            product.name = name;
            product.category = category;
            product.price = price;
            product.stock = stock;

            if (!saveProducts()) {

                Object.assign(product, originalProduct);

                return;

            }

        } else {

            const newProduct = {
                id: generateProductID(),
                name: name,
                category: category,
                price: price,
                stock: stock
            };

            products.push(newProduct);

            if (!saveProducts()) {

                products.pop();

                return;

            }

        }


        updateInventorySummary();

        displayProducts();

        closeProductFormModal();


        await showAppDialog({
            title: isEditing ? "Product Updated" : "Product Added",
            message: isEditing
                ? "The product information has been updated successfully."
                : "The new product has been added to your inventory successfully.",
            icon: "fa-circle-check",
            tone: "success"
        });

    });

}


/* =========================================================
   18. CLOSE PRODUCT MODAL
========================================================= */

function closeProductFormModal() {

    if (!productModal || !productForm) {
        return;
    }

    productModal.classList.remove("show");

    productForm.reset();

    editProductId.value = "";

    productFormInitialState = null;

}


async function requestCloseProductModal() {

    if (!productModal || !productModal.classList.contains("show")) {
        return;
    }

    if (!hasUnsavedProductChanges()) {

        closeProductFormModal();

        return;

    }


    const confirmed = await showAppDialog({
        type: "confirm",
        title: "Discard Product Changes",
        message: "You have unsaved changes. Are you sure you want to discard them?",
        icon: "fa-triangle-exclamation",
        tone: "warning",
        confirmText: "Yes, Discard",
        cancelText: "Keep Editing"
    });

    if (confirmed) {
        closeProductFormModal();
    }

}


if (cancelProductBtn) {
    cancelProductBtn.addEventListener("click", requestCloseProductModal);
}


/* =========================================================
   19. DELETE PRODUCT
========================================================= */

async function deleteProduct(id) {

    const product = products.find(function (item) {
        return item.id === id;
    });

    if (!product) {
        return;
    }


    const confirmed = await showAppDialog({
        type: "confirm",
        title: "Confirm Product Deletion",
        message: `Are you sure you want to permanently delete "${product.name}" from your inventory?`,
        icon: "fa-trash",
        tone: "danger",
        confirmText: "Yes, Delete",
        cancelText: "Cancel"
    });

    if (!confirmed) {
        return;
    }


    const originalProducts = products;

    products = products.filter(function (item) {
        return item.id !== id;
    });


    if (!saveProducts()) {

        products = originalProducts;

        return;

    }


    updateInventorySummary();

    displayProducts();


    await showAppDialog({
        title: "Product Deleted",
        message: `"${product.name}" has been successfully removed from your inventory.`,
        icon: "fa-circle-check",
        tone: "success"
    });

}


/* =========================================================
   20. OPEN STOCK ADJUSTMENT MODAL
========================================================= */

function openStockModal(id) {

    const product = products.find(function (item) {
        return item.id === id;
    });

    if (!product || !stockForm || !stockModal) {
        return;
    }

    stockForm.reset();

    stockProductId.value = product.id;
    stockProductName.value = product.name;
    currentStockValue.value = product.stock;

    stockAction.value = "add";

    stockModal.classList.add("show");

    stockAction.focus();

}


/* =========================================================
   21. SAVE STOCK ADJUSTMENT
========================================================= */

if (stockForm) {

    stockForm.addEventListener("submit", async function (event) {

        event.preventDefault();

        const id = stockProductId.value;

        const action = stockAction.value;

        const quantity = Number(stockQuantity.value);

        const reason = stockReason.value.trim();


        const product = products.find(function (item) {
            return item.id === id;
        });

        if (!product) {

            await showAppDialog({
                title: "Product Not Found",
                message: "The selected product could not be found in your inventory.",
                icon: "fa-circle-exclamation",
                tone: "danger"
            });

            return;

        }


        if (
            !Number.isInteger(quantity) ||
            quantity <= 0 ||
            reason === ""
        ) {

            await showAppDialog({
                title: "Invalid Stock Adjustment",
                message: "Please enter a valid quantity and provide a reason for the stock adjustment.",
                icon: "fa-circle-exclamation",
                tone: "warning"
            });

            return;

        }


        const originalStock = product.stock;

        let newStock;


        if (action === "add") {

            if (product.stock + quantity > Number.MAX_SAFE_INTEGER) {

                await showAppDialog({
                    title: "Stock Quantity Too Large",
                    message: "The resulting stock quantity is too large. Please enter a smaller quantity.",
                    icon: "fa-triangle-exclamation",
                    tone: "warning"
                });

                return;

            }

            newStock = product.stock + quantity;

        } else if (action === "remove") {

            if (quantity > product.stock) {

                await showAppDialog({
                    title: "Insufficient Stock",
                    message: "You cannot remove more items than the currently available stock.",
                    icon: "fa-box-open",
                    tone: "warning"
                });

                return;

            }

            newStock = product.stock - quantity;

        } else {

            await showAppDialog({
                title: "Invalid Adjustment Type",
                message: "Please select a valid stock adjustment type.",
                icon: "fa-circle-exclamation",
                tone: "warning"
            });

            return;

        }


        const confirmed = await showAppDialog({
            type: "confirm",
            title: "Confirm Stock Adjustment",
            message: "Please review the stock adjustment details before applying this change.",
            icon: "fa-boxes-stacked",
            confirmText: "Confirm Adjustment",
            details: [
                {
                    label: "Product",
                    value: product.name
                },
                {
                    label: "Adjustment Type",
                    value: action === "add" ? "Add Stock" : "Remove Stock"
                },
                {
                    label: "Quantity",
                    value: String(quantity)
                },
                {
                    label: "Reason",
                    value: reason
                },
                {
                    label: "Current Stock",
                    value: String(originalStock)
                },
                {
                    label: "Resulting Stock",
                    value: String(newStock)
                }
            ]
        });

        if (!confirmed) {
            return;
        }


        product.stock = newStock;


        if (!saveProducts()) {

            product.stock = originalStock;

            return;

        }


        updateInventorySummary();

        displayProducts();

        closeStockFormModal();


        await showAppDialog({
            title: "Stock Updated",
            message: `The stock quantity for "${product.name}" has been updated successfully.`,
            icon: "fa-circle-check",
            tone: "success"
        });

    });

}


/* =========================================================
   22. CLOSE STOCK MODAL
========================================================= */

function closeStockFormModal() {

    if (!stockModal || !stockForm) {
        return;
    }

    stockModal.classList.remove("show");

    stockForm.reset();

}


if (cancelStockBtn) {
    cancelStockBtn.addEventListener("click", closeStockFormModal);
}


/* =========================================================
   23. PRODUCT TABLE ACTIONS
========================================================= */

if (productTableBody) {

    productTableBody.addEventListener("click", function (event) {

        const button = event.target.closest("button[data-action]");

        if (!button) {
            return;
        }

        const action = button.dataset.action;
        const id = button.dataset.id;


        if (action === "edit") {

            openEditProductModal(id);

        } else if (action === "stock") {

            openStockModal(id);

        } else if (action === "delete") {

            deleteProduct(id);

        }

    });

}


/* =========================================================
   24. SEARCH PRODUCTS
========================================================= */

if (productSearch) {

    productSearch.addEventListener("input", function () {

        displayProducts();

        if (clearSearchBtn) {

            clearSearchBtn.style.display =
                productSearch.value.length > 0 ? "block" : "none";

        }

    });

}


if (clearSearchBtn) {

    clearSearchBtn.addEventListener("click", function () {

        if (productSearch) {
            productSearch.value = "";
        }

        clearSearchBtn.style.display = "none";

        displayProducts();

        if (productSearch) {
            productSearch.focus();
        }

    });

}


/* =========================================================
   25. CATEGORY FILTER
========================================================= */

if (categoryFilter) {

    categoryFilter.addEventListener("change", function () {
        displayProducts();
    });

}


/* =========================================================
   26. STOCK STATUS FILTER
========================================================= */

if (stockFilter) {

    stockFilter.addEventListener("change", function () {
        displayProducts();
    });

}


/* =========================================================
   27. CLOSE MODALS WHEN CLICKING OUTSIDE
========================================================= */

if (productModal) {

    productModal.addEventListener("click", function (event) {

        if (event.target === productModal) {
            requestCloseProductModal();
        }

    });

}


if (stockModal) {

    stockModal.addEventListener("click", function (event) {

        if (event.target === stockModal) {
            closeStockFormModal();
        }

    });

}


/* =========================================================
   28. DASHBOARD-MATCHING LOGOUT MODAL
========================================================= */

function setupLogout() {

    const logoutBtn = document.getElementById("logout-btn");

    if (!logoutBtn) {
        return;
    }

    let logoutModal = null;


    function closeLogoutModal() {

        if (!logoutModal) {
            return;
        }

        const modalToRemove = logoutModal;

        modalToRemove.classList.remove("show");

        document.body.classList.remove("logout-modal-open");

        document.removeEventListener(
            "keydown",
            handleLogoutModalKeydown
        );

        setTimeout(function () {

            modalToRemove.remove();

            if (logoutModal === modalToRemove) {
                logoutModal = null;
            }

            logoutBtn.focus();

        }, 200);

    }


    function handleLogoutModalKeydown(event) {

        if (!logoutModal) {
            return;
        }

        if (event.key === "Escape") {

            event.preventDefault();

            closeLogoutModal();

            return;

        }


        if (event.key === "Tab") {

            const focusableElements = logoutModal.querySelectorAll(
                'button, a[href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
            );

            const firstElement = focusableElements[0];
            const lastElement = focusableElements[focusableElements.length - 1];

            if (!firstElement || !lastElement) {
                return;
            }

            if (event.shiftKey && document.activeElement === firstElement) {

                event.preventDefault();

                lastElement.focus();

            } else if (!event.shiftKey && document.activeElement === lastElement) {

                event.preventDefault();

                firstElement.focus();

            }

        }

    }


    function openLogoutModal() {

        if (logoutModal) {
            return;
        }

        logoutModal = document.createElement("div");

        logoutModal.className = "logout-modal-overlay";

        logoutModal.innerHTML = `

            <section
                class="logout-modal"
                role="dialog"
                aria-modal="true"
                aria-labelledby="logout-modal-title"
                aria-describedby="logout-modal-description"
                tabindex="-1"
            >

                <div class="logout-modal-icon">
                    <i class="fa-solid fa-right-from-bracket"></i>
                </div>

                <span class="logout-modal-eyebrow">
                    CAFÉSENSE ACCOUNT
                </span>

                <h2 id="logout-modal-title">
                    Confirm Logout
                </h2>

                <p id="logout-modal-description">
                    Are you sure you want to log out of your CaféSense account?
                </p>

                <div class="logout-modal-actions">

                    <button
                        type="button"
                        class="logout-modal-btn cancel"
                        id="logout-modal-cancel"
                    >
                        Cancel
                    </button>

                    <button
                        type="button"
                        class="logout-modal-btn confirm"
                        id="logout-modal-confirm"
                    >
                        <i class="fa-solid fa-right-from-bracket"></i>
                        Yes, Logout
                    </button>

                </div>

            </section>

        `;


        document.body.appendChild(logoutModal);

        document.body.classList.add("logout-modal-open");


        const cancelButton = logoutModal.querySelector(
            "#logout-modal-cancel"
        );

        const confirmButton = logoutModal.querySelector(
            "#logout-modal-confirm"
        );


        cancelButton.addEventListener("click", closeLogoutModal);


        // CONFIRM LOGOUT

        confirmButton.addEventListener("click", function () {

            sessionStorage.clear();

            window.location.href = "./login.html";

        });


        logoutModal.addEventListener("click", function (event) {

            if (event.target === logoutModal) {
                closeLogoutModal();
            }

        });


        document.addEventListener(
            "keydown",
            handleLogoutModalKeydown
        );


        requestAnimationFrame(function () {

            logoutModal.classList.add("show");

            cancelButton.focus();

        });

    }


    logoutBtn.addEventListener("click", function (event) {

        event.preventDefault();

        openLogoutModal();

    });

}

setupLogout();


/* =========================================================
   29. CLOSE ACTIVE MODAL OR SIDEBAR USING ESCAPE
========================================================= */

document.addEventListener("keydown", function (event) {

    if (event.key !== "Escape") {
        return;
    }

    // Custom dialog handles its own Escape key
    if (activeAppDialog) {
        return;
    }

    // Close the product modal first
    if (productModal && productModal.classList.contains("show")) {

        requestCloseProductModal();

    }

    // Close stock modal
    else if (stockModal && stockModal.classList.contains("show")) {

        closeStockFormModal();

    }

    // Close mobile sidebar
    else if (
        isMobileView() &&
        sidebar &&
        sidebar.classList.contains("mobile-open")
    ) {

        closeMobileSidebar();

    }

});


/* =========================================================
   30. INITIALIZE PAGE
========================================================= */

function initializeProductsPage() {

    updateCurrentDateTime();

    updateInventorySummary();

    displayProducts();

}


initializeProductsPage();