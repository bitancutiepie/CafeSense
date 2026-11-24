// =========================================================
// CAFÉSENSE - DASHBOARD CONTROLLER
// =========================================================

import { transactionApi } from '../api/transactionApi.js';
import { productApi } from '../api/productApi.js';
import { apiClient } from '../api/apiClient.js';



// =========================================================
// 1. DASHBOARD DATA
// =========================================================

const SIDEBAR_STORAGE_KEY = "cafeSenseSidebarCollapsed";
const LOW_STOCK_LIMIT = 10;

let transactions = [];
let products = [];
let dashboardDataLoadError = false;


// =========================================================
// 2. CHART VARIABLES
// =========================================================

let hourlyChart;
let paymentChart;
let customerChart;


// Register Chart.js DataLabels plugin.

if (
    typeof Chart !== "undefined" &&
    typeof ChartDataLabels !== "undefined"
) {
    Chart.register(ChartDataLabels);
}


// =========================================================
// 3. AUTHENTICATION
// =========================================================

async function verifyAuthentication() {

    try {

        const response = await apiClient.get("/auth/me");

        if (!response.success || !response.data?.user) {
            throw new Error("Unable to verify your account.");
        }

        const user = response.data.user;

        updateUserProfile(user);

        return user;

    } catch (error) {

        console.error("Authentication failed:", error);

        // Redirect users with missing or invalid sessions.

        if (
            error.status === 401 ||
            error.status === 403 ||
            error.status === 404
        ) {

            window.location.replace("./login.html");

            return null;

        }

        // Show an error page if the server cannot be reached.

        document.body.innerHTML = `

            <main style="
                min-height: 100vh;
                display: flex;
                align-items: center;
                justify-content: center;
                padding: 24px;
                font-family: 'DM Sans', sans-serif;
                background: #f7f4ef;
                text-align: center;
            ">

                <section style="
                    max-width: 420px;
                    padding: 40px;
                    background: #ffffff;
                    border-radius: 16px;
                    box-shadow: 0 8px 30px rgba(0,0,0,0.06);
                ">

                    <h2 style="
                        color: #35231c;
                        margin-bottom: 12px;
                    ">
                        Unable to Verify Your Session
                    </h2>

                    <p style="
                        color: #8c7f77;
                        line-height: 1.6;
                        margin-bottom: 24px;
                    ">
                        We couldn't connect to the CaféSense server.
                        Please check your connection and try again.
                    </p>

                    <button
                        onclick="window.location.reload()"
                        style="
                            padding: 12px 24px;
                            border: none;
                            border-radius: 8px;
                            background: #b97845;
                            color: white;
                            font-weight: 600;
                            cursor: pointer;
                        "
                    >
                        Try Again
                    </button>

                </section>

            </main>

        `;

        return null;

    }

}


// =========================================================
// 4. UPDATE LOGGED-IN USER PROFILE AND ROLE VISIBILITY
// =========================================================

function updateUserProfile(user) {

    const fullName = user.fullName || user.username || "User";

    const role = String(user.role || "Staff").trim();

    const normalizedRole = role.toLowerCase();

    const isOwner = normalizedRole === "owner";

    const isManager = normalizedRole === "manager";

    const canViewAnalytics = isOwner || isManager;


    // UPDATE USER NAME

    setText("display-user-name", fullName);


    // UPDATE USER ROLE

    setText("display-user-role", role);


    // UPDATE ROLE BADGE

    setText("role-badge", `${role} Portal`);


    // GENERATE USER INITIALS

    const avatar = document.getElementById("display-user-avatar");

    if (avatar) {

        const initials = fullName
            .trim()
            .split(/\s+/)
            .filter(Boolean)
            .slice(0, 2)
            .map(name => name.charAt(0).toUpperCase())
            .join("");

        avatar.textContent = initials || "U";

    }


    // OWNER-ONLY ELEMENTS

    document.querySelectorAll(".owner-only").forEach(element => {

        element.style.display = isOwner ? "" : "none";

    });


    // OWNER AND MANAGER ELEMENTS

    document.querySelectorAll(".owner-manager-only").forEach(element => {

        element.style.display = canViewAnalytics ? "" : "none";

    });

}


// =========================================================
// 5. INITIALIZE DASHBOARD
// =========================================================

document.addEventListener("DOMContentLoaded", async function () {

    // VERIFY LOGIN BEFORE LOADING DASHBOARD.

    const currentUser = await verifyAuthentication();

    if (!currentUser) {
        return;
    }


    // LOAD DASHBOARD DATA AFTER AUTHENTICATION.

    await loadDashboardData();

    setCurrentDate();
    setupSidebar();
    setupAnalyticsDropdown();
    setupLogout();

    renderHourlySalesChart();
    renderPaymentMethodsChart();
    renderCustomerTypesChart();


    const filterBtn = document.getElementById("filterBtn");
    const resetBtn = document.getElementById("resetBtn");


    if (filterBtn) {
        filterBtn.addEventListener("click", applyFilters);
    }


    if (resetBtn) {

        resetBtn.addEventListener("click", function () {

            const dateFilter = document.getElementById("dateFilter");
            const customerFilter = document.getElementById("customerFilter");

            if (dateFilter) {
                dateFilter.value = "all";
            }

            if (customerFilter) {
                customerFilter.value = "all";
            }

            applyFilters();

        });

    }


    applyFilters();

});



// =========================================================
// 6. LOAD DASHBOARD DATA FROM DATABASE
// =========================================================

async function loadDashboardData() {

    try {

        const [transactionResponse, productResponse] =
            await Promise.all([
                transactionApi.getAll(),
                productApi.getAll()
            ]);

        const databaseTransactions = transactionResponse.data;
        const databaseProducts = productResponse.data;

        if (
            !Array.isArray(databaseTransactions) ||
            !Array.isArray(databaseProducts)
        ) {
            throw new Error("Invalid data received from the API.");
        }

        transactions = databaseTransactions;
        products = databaseProducts;

        dashboardDataLoadError = false;

        console.log(
            "Dashboard transactions loaded:",
            transactions.length
        );

        console.log(
            "Dashboard products loaded:",
            products.length
        );

    } catch (error) {

        console.error("Unable to load Dashboard data:", error);

        transactions = [];
        products = [];

        dashboardDataLoadError = true;

    }

}



// =========================================================
// 7. CURRENT DATE AND TIME
// =========================================================

function setCurrentDate() {

    const dateElement = document.getElementById("current-date");
    const timeElement = document.getElementById("current-time");

    function updateDateTime() {

        const now = new Date();

        if (dateElement) {

            dateElement.textContent = now.toLocaleDateString("en-PH", {
                weekday: "long",
                month: "long",
                day: "numeric",
                year: "numeric"
            }).toUpperCase();

        }

        if (timeElement) {

            timeElement.textContent = now.toLocaleTimeString("en-PH", {
                hour: "numeric",
                minute: "2-digit",
                hour12: true
            });

        }

    }

    updateDateTime();

    window.setInterval(updateDateTime, 1000);

}



// =========================================================
// 8. TRANSACTION DATE HELPERS
// =========================================================

function parseTransactionDate(dateString) {

    if (!dateString) {
        return null;
    }

    let parsedDate = new Date(dateString);

    if (!isNaN(parsedDate.getTime())) {
        return parsedDate;
    }

    const normalizedDate = String(dateString)
        .replace(/\s+at\s+/i, ", ");

    parsedDate = new Date(normalizedDate);

    if (!isNaN(parsedDate.getTime())) {
        return parsedDate;
    }

    const numericMatch = normalizedDate.match(
        /^(\d{1,2})\/(\d{1,2})\/(\d{4}),?\s+(\d{1,2}):(\d{2})(?::(\d{2}))?\s*(AM|PM)$/i
    );

    if (numericMatch) {

        const month = Number(numericMatch[1]) - 1;
        const day = Number(numericMatch[2]);
        const year = Number(numericMatch[3]);

        let hour = Number(numericMatch[4]);

        const minute = Number(numericMatch[5]);
        const second = Number(numericMatch[6] || 0);

        const period = numericMatch[7].toUpperCase();

        if (period === "PM" && hour !== 12) {
            hour += 12;
        } else if (period === "AM" && hour === 12) {
            hour = 0;
        }

        parsedDate = new Date(
            year,
            month,
            day,
            hour,
            minute,
            second
        );

        if (!isNaN(parsedDate.getTime())) {
            return parsedDate;
        }

    }

    return null;

}


// Prioritize dateISO, then fall back to date.

function getTransactionDate(transaction) {

    if (!transaction) {
        return null;
    }

    return (
        parseTransactionDate(transaction.dateISO) ||
        parseTransactionDate(transaction.date)
    );

}


// Get local date in YYYY-MM-DD format.

function getLocalDateKey(date) {

    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;

}


// Get transaction hour.

function getTransactionHour(transaction) {

    const date = getTransactionDate(transaction);

    if (!date) {
        return null;
    }

    return date.getHours();

}


// Get customer types associated with a transaction.

function getTransactionCustomerTypes(transaction) {

    const customerTypes = new Set();

    if (Array.isArray(transaction.customerTypes)) {

        transaction.customerTypes.forEach(function (type) {

            if (type) {
                customerTypes.add(type);
            }

        });

    }

    if (Array.isArray(transaction.items)) {

        transaction.items.forEach(function (item) {

            if (item.customerType) {
                customerTypes.add(item.customerType);
            }

        });

    }

    return Array.from(customerTypes);

}



// =========================================================
// 9. FILTER TRANSACTIONS
// =========================================================

function applyFilters() {

    const dateFilter = document.getElementById("dateFilter");
    const customerFilter = document.getElementById("customerFilter");

    if (!dateFilter || !customerFilter) {
        return;
    }

    const selectedDate = dateFilter.value;
    const selectedCustomer = customerFilter.value;

    const now = new Date();
    const todayKey = getLocalDateKey(now);

    const todayStart = new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate()
    );

    const weekAgo = new Date(todayStart);
    weekAgo.setDate(weekAgo.getDate() - 6);

    const filteredData = transactions.flatMap(function (transaction) {

        const transactionDate = getTransactionDate(transaction);

        if (!transactionDate) {
            return [];
        }

        let dateMatch = true;

        if (selectedDate === "today") {

            dateMatch =
                getLocalDateKey(transactionDate) === todayKey;

        } else if (selectedDate === "week") {

            const transactionDay = new Date(
                transactionDate.getFullYear(),
                transactionDate.getMonth(),
                transactionDate.getDate()
            );

            dateMatch =
                transactionDay >= weekAgo &&
                transactionDay <= todayStart;

        } else if (selectedDate === "month") {

            dateMatch =
                transactionDate.getMonth() === now.getMonth() &&
                transactionDate.getFullYear() === now.getFullYear();

        }

        if (!dateMatch) {
            return [];
        }

        // Keep the complete transaction when All Customers is selected.

        if (selectedCustomer === "all") {
            return [transaction];
        }

        // Filter items belonging to the selected customer type.

        const matchingItems = Array.isArray(transaction.items)
            ? transaction.items.filter(function (item) {

                return String(item.customerType || "").trim() === selectedCustomer;

            })
            : [];

        if (matchingItems.length === 0) {
            return [];
        }

        // Recalculate subtotal, discount, and total for matching items.

        const customerTypeSubtotal = matchingItems.reduce(
            function (total, item) {

                const lineSubtotal =
                    item.lineSubtotal !== undefined &&
                    item.lineSubtotal !== null
                        ? Number(item.lineSubtotal)
                        : (Number(item.price) || 0) *
                          (Number(item.quantity) || 0);

                return total + lineSubtotal;

            },
            0
        );

        const customerTypeDiscount = matchingItems.reduce(
            function (total, item) {

                return total + (Number(item.lineDiscount) || 0);

            },
            0
        );

        const customerTypeTotal = matchingItems.reduce(
            function (total, item) {

                const lineSubtotal =
                    item.lineSubtotal !== undefined &&
                    item.lineSubtotal !== null
                        ? Number(item.lineSubtotal)
                        : (Number(item.price) || 0) *
                          (Number(item.quantity) || 0);

                const lineDiscount =
                    Number(item.lineDiscount) || 0;

                const lineTotal =
                    item.lineTotal !== undefined &&
                    item.lineTotal !== null
                        ? Number(item.lineTotal)
                        : lineSubtotal - lineDiscount;

                return total + lineTotal;

            },
            0
        );

        // Return a filtered copy without changing the original transaction.

        return [{
            ...transaction,
            items: matchingItems,
            customerTypes: [selectedCustomer],
            subtotal: customerTypeSubtotal,
            discount: customerTypeDiscount,
            total: customerTypeTotal
        }];

    });

    updateDashboard(filteredData);

}



// =========================================================
// 10. UPDATE DASHBOARD
// =========================================================

function updateDashboard(data) {

    const totalRevenue = data.reduce(
        function (total, transaction) {

            return total + (Number(transaction.total) || 0);

        },
        0
    );

    const totalTransactions = data.length;

    const totalItemsSold = data.reduce(
        function (total, transaction) {

            if (!Array.isArray(transaction.items)) {
                return total;
            }

            const transactionQuantity = transaction.items.reduce(
                function (itemTotal, item) {

                    return itemTotal + (Number(item.quantity) || 0);

                },
                0
            );

            return total + transactionQuantity;

        },
        0
    );

    const averageOrderValue =
        totalTransactions > 0
            ? totalRevenue / totalTransactions
            : 0;


    // PRODUCT SUMMARY

    const productSummary = {};

    data.forEach(function (transaction) {

        if (!Array.isArray(transaction.items)) {
            return;
        }

        transaction.items.forEach(function (item) {

            const productName = item.name || "Unknown Product";
            const quantity = Number(item.quantity) || 0;

            productSummary[productName] =
                (productSummary[productName] || 0) + quantity;

        });

    });

    const topProduct = getTopEntry(productSummary);


    // CUSTOMER SUMMARY

    const customerSummary = {};

    data.forEach(function (transaction) {

        const customerTypes =
            getTransactionCustomerTypes(transaction);

        customerTypes.forEach(function (type) {

            customerSummary[type] =
                (customerSummary[type] || 0) + 1;

        });

    });

    const topCustomer = getTopEntry(customerSummary);


    // PAYMENT SUMMARY

    const paymentSummary = {};

    data.forEach(function (transaction) {

        const paymentMethod =
            transaction.paymentMethod || "Unknown";

        paymentSummary[paymentMethod] =
            (paymentSummary[paymentMethod] || 0) + 1;

    });

    const topPayment = getTopEntry(paymentSummary);


    // HOURLY SUMMARY

    const hourSummary = {};

    data.forEach(function (transaction) {

        const hour = getTransactionHour(transaction);

        if (hour === null) {
            return;
        }

        hourSummary[hour] =
            (hourSummary[hour] || 0) + 1;

    });

    const peakHour = getTopEntry(hourSummary);


    // UPDATE SUMMARY CARDS

    setText("totalRevenueValue", formatCurrency(totalRevenue));

    setText(
        "totalTransactionsValue",
        totalTransactions.toLocaleString("en-PH")
    );

    setText(
        "averageOrderValue",
        formatCurrency(averageOrderValue)
    );

    setText(
        "totalItemsSoldValue",
        totalItemsSold.toLocaleString("en-PH")
    );


    // UPDATE BUSINESS INSIGHTS

    setText(
        "glanceTopProduct",
        topProduct ? topProduct[0] : "N/A"
    );

    setText(
        "glanceTopProductCount",
        topProduct
            ? `${topProduct[1]} units sold`
            : "0 units sold"
    );

    setText(
        "glanceTopCustomer",
        topCustomer ? topCustomer[0] : "N/A"
    );

    setText(
        "glanceTopCustomerCount",
        topCustomer
            ? `${topCustomer[1]} transactions`
            : "0 transactions"
    );

    setText(
        "glanceTopPayment",
        topPayment ? topPayment[0] : "N/A"
    );

    setText(
        "glanceTopPaymentCount",
        topPayment
            ? `${topPayment[1]} transactions`
            : "0 transactions"
    );

    setText(
        "glancePeakHour",
        peakHour
            ? formatHour(Number(peakHour[0]))
            : "N/A"
    );


    // UPDATE DASHBOARD SECTIONS

    updateRecentTransactions(data);
    updateBusinessAlerts();
    updateHourlyChart(data);
    updatePaymentChart(data);
    updateCustomerChart(data);

}



// =========================================================
// 11. HELPER FUNCTIONS
// =========================================================

function getTopEntry(object) {

    const entries = Object.entries(object);

    if (entries.length === 0) {
        return null;
    }

    return entries.sort(function (a, b) {
        return b[1] - a[1];
    })[0];

}


function setText(elementId, value) {

    const element = document.getElementById(elementId);

    if (element) {
        element.textContent = value;
    }

}


function formatCurrency(amount) {

    return "₱" + Number(amount || 0).toLocaleString("en-PH", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    });

}


function formatHour(hour) {

    const start = new Date();
    start.setHours(hour, 0, 0, 0);

    const end = new Date();
    end.setHours((hour + 1) % 24, 0, 0, 0);

    return start.toLocaleTimeString("en-US", {
        hour: "numeric"
    }) + " – " + end.toLocaleTimeString("en-US", {
        hour: "numeric"
    });

}


// Format transaction date.

function formatTransactionDate(transaction) {

    const date = getTransactionDate(transaction);

    if (!date) {

        return escapeHTML(
            transaction.date || transaction.dateISO || "N/A"
        );

    }

    const formattedDate = date.toLocaleDateString("en-PH", {
        month: "short",
        day: "numeric",
        year: "numeric"
    });

    const formattedTime = date.toLocaleTimeString("en-PH", {
        hour: "numeric",
        minute: "2-digit"
    });

    return `${formattedDate} · ${formattedTime}`;

}


function escapeHTML(value) {

    return String(value).replace(/[&<>"']/g, function (character) {

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



// =========================================================
// 12. RECENT TRANSACTIONS
// =========================================================

function updateRecentTransactions(data) {

    const tableBody = document.getElementById("recentTransactionsBody");

    if (!tableBody) {
        return;
    }

    const recentTransactions = data
        .slice()
        .sort(function (a, b) {

            const dateA = getTransactionDate(a);
            const dateB = getTransactionDate(b);

            if (!dateA) {
                return 1;
            }

            if (!dateB) {
                return -1;
            }

            return dateB.getTime() - dateA.getTime();

        })
        .slice(0, 5);


    if (recentTransactions.length === 0) {

        tableBody.innerHTML = `
            <tr>
                <td colspan="5" class="empty-table-message">
                    No transactions found for the selected filters.
                </td>
            </tr>
        `;

        return;

    }


    tableBody.innerHTML = recentTransactions.map(function (transaction) {

        const transactionId = transaction.transactionId ?? "N/A";

        const customerTypes =
            getTransactionCustomerTypes(transaction);

        const customerDisplay = customerTypes.length > 0
            ? customerTypes.join(", ")
            : "N/A";

        const paymentMethod = transaction.paymentMethod || "N/A";
        const total = Number(transaction.total) || 0;

        return `
            <tr>
                <td>${escapeHTML(transactionId)}</td>
                <td>${formatTransactionDate(transaction)}</td>
                <td>${escapeHTML(customerDisplay)}</td>
                <td>${escapeHTML(paymentMethod)}</td>
                <td>${formatCurrency(total)}</td>
            </tr>
        `;

    }).join("");

}



// =========================================================
// 13. BUSINESS ALERTS
// =========================================================

function updateBusinessAlerts() {

    const alertsContainer = document.getElementById("businessAlertsList");

    if (!alertsContainer) {
        return;
    }

    const outOfStockProducts = products.filter(function (product) {
        return Number(product.stock) === 0;
    });

    const lowStockProducts = products.filter(function (product) {

        const stock = Number(product.stock);

        return stock > 0 && stock <= LOW_STOCK_LIMIT;

    });

    const alerts = [];


    outOfStockProducts.forEach(function (product) {

        alerts.push({
            type: "danger",
            title: `${product.name} is out of stock`,
            message: "Restock this product before accepting new orders."
        });

    });


    lowStockProducts.forEach(function (product) {

        alerts.push({
            type: "warning",
            title: `${product.name} has low stock`,
            message: `Only ${product.stock} units remaining.`
        });

    });


    if (alerts.length === 0) {

        if (products.length === 0) {

            alertsContainer.innerHTML = `
                <div class="alert-item">
                    <div class="alert-icon">
                        <i class="fa-solid fa-circle-info"></i>
                    </div>

                    <div class="alert-content">
                        <strong>Inventory Not Available</strong>
                        <p>
                            Product stock information will appear here
                            once products are added to Inventory.
                        </p>
                    </div>
                </div>
            `;

            return;

        }

        alertsContainer.innerHTML = `
            <div class="alert-item success">
                <div class="alert-icon">
                    <i class="fa-solid fa-circle-check"></i>
                </div>

                <div class="alert-content">
                    <strong>Inventory is in good condition</strong>
                    <p>
                        No low-stock or out-of-stock products detected.
                    </p>
                </div>
            </div>
        `;

        return;

    }


    alertsContainer.innerHTML = alerts.map(function (alert) {

        const icon = alert.type === "danger"
            ? "fa-circle-xmark"
            : "fa-triangle-exclamation";

        return `
            <div class="alert-item ${alert.type}">
                <div class="alert-icon">
                    <i class="fa-solid ${icon}"></i>
                </div>

                <div class="alert-content">
                    <strong>${escapeHTML(alert.title)}</strong>
                    <p>${escapeHTML(alert.message)}</p>
                </div>
            </div>
        `;

    }).join("");

}



// =========================================================
// 14. HOURLY SALES CHART
// =========================================================

function renderHourlySalesChart() {

    const canvas = document.getElementById("hourlySalesChart");

    if (!canvas || typeof Chart === "undefined") {
        return;
    }

    hourlyChart = new Chart(canvas, {

        type: "bar",

        data: {

            labels: [
                "8 AM", "9 AM", "10 AM", "11 AM",
                "12 PM", "1 PM", "2 PM", "3 PM",
                "4 PM", "5 PM", "6 PM"
            ],

            datasets: [{
                label: "Sales",
                data: [],
                backgroundColor: "#b97845",
                hoverBackgroundColor: "#35231c",
                borderRadius: 7,
                borderSkipped: false,
                maxBarThickness: 32
            }]

        },

        options: {

            responsive: true,
            maintainAspectRatio: false,

            plugins: {

                legend: {
                    display: false
                },

                // Peso labels above the bars.

                datalabels: {

                    display: function (context) {
                        return Number(context.dataset.data[context.dataIndex]) > 0;
                    },

                    anchor: "end",
                    align: "top",
                    clamp: true,

                    formatter: function (value) {
                        return formatCurrency(value);
                    },

                    color: "#35231c",

                    font: {
                        family: "DM Sans",
                        size: 10,
                        weight: "600"
                    }

                },

                tooltip: {

                    backgroundColor: "#35231c",
                    padding: 12,

                    callbacks: {

                        label: function (context) {
                            return " Sales: " +
                                formatCurrency(context.parsed.y);
                        }

                    }

                }

            },

            scales: {

                y: {

                    beginAtZero: true,

                    ticks: {

                        color: "#8c7f77",

                        font: {
                            family: "DM Sans",
                            size: 11
                        },

                        callback: function (value) {
                            return "₱" + value.toLocaleString("en-PH");
                        }

                    },

                    grid: {
                        color: "#f1ebe5",
                        drawBorder: false
                    }

                },

                x: {

                    grid: {
                        display: false
                    },

                    ticks: {

                        color: "#8c7f77",

                        font: {
                            family: "DM Sans",
                            size: 11
                        }

                    }

                }

            }

        }

    });

}


function updateHourlyChart(data) {

    if (!hourlyChart) {
        return;
    }

    const hourlySales = Array(11).fill(0);

    data.forEach(function (transaction) {

        const hour = getTransactionHour(transaction);

        if (hour !== null && hour >= 8 && hour <= 18) {

            hourlySales[hour - 8] +=
                Number(transaction.total) || 0;

        }

    });

    hourlyChart.data.datasets[0].data = hourlySales;

    hourlyChart.update();

}



// =========================================================
// 15. PAYMENT METHODS CHART
// =========================================================

function renderPaymentMethodsChart() {

    const canvas = document.getElementById("paymentMethodsChart");

    if (!canvas || typeof Chart === "undefined") {
        return;
    }

    paymentChart = new Chart(canvas, {

        type: "doughnut",

        data: {

            labels: ["Cash", "GCash", "Maya", "Card"],

            datasets: [{

                data: [0, 0, 0, 0],

                backgroundColor: [
                    "#35231c",
                    "#b97845",
                    "#d9a57b",
                    "#e8d9ca"
                ],

                borderWidth: 3,
                borderColor: "#ffffff",
                hoverOffset: 8,
                spacing: 3

            }]

        },

        options: {

            responsive: true,
            maintainAspectRatio: false,
            cutout: "70%",

            plugins: {

                legend: {

                    position: "bottom",

                    labels: {

                        usePointStyle: true,
                        pointStyle: "circle",
                        boxWidth: 8,
                        padding: 18,

                        font: {
                            family: "DM Sans",
                            size: 11
                        },

                        color: "#2b201b"

                    }

                },

                // Percentage labels inside the doughnut.

                datalabels: {

                    display: function (context) {

                        const values = context.dataset.data;

                        const total = values.reduce(
                            (sum, value) => sum + Number(value || 0),
                            0
                        );

                        return (
                            total > 0 &&
                            Number(context.dataset.data[context.dataIndex]) > 0
                        );

                    },

                    formatter: function (value, context) {

                        const values = context.dataset.data;

                        const total = values.reduce(
                            (sum, item) => sum + Number(item || 0),
                            0
                        );

                        if (total === 0) {
                            return "";
                        }

                        return `${(Number(value) / total * 100).toFixed(1)}%`;

                    },

                    color: "#ffffff",

                    font: {
                        family: "DM Sans",
                        size: 11,
                        weight: "600"
                    },

                    anchor: "center",
                    align: "center",
                    clamp: true

                },

                tooltip: {

                    callbacks: {

                        label: function (context) {

                            return context.label + ": " +
                                formatCurrency(context.parsed);

                        }

                    }

                }

            }

        }

    });

}


function updatePaymentChart(data) {

    if (!paymentChart) {
        return;
    }

    const paymentMethods = ["Cash", "GCash", "Maya", "Card"];

    const paymentTotals = paymentMethods.map(function (method) {

        return data
            .filter(function (transaction) {
                return transaction.paymentMethod === method;
            })
            .reduce(function (total, transaction) {
                return total + (Number(transaction.total) || 0);
            }, 0);

    });

    paymentChart.data.datasets[0].data = paymentTotals;

    paymentChart.update();

}



// =========================================================
// 16. CUSTOMER TYPE DISTRIBUTION CHART
// =========================================================

function renderCustomerTypesChart() {

    const canvas = document.getElementById("customerTypesChart");

    if (!canvas || typeof Chart === "undefined") {
        return;
    }

    customerChart = new Chart(canvas, {

        type: "doughnut",

        data: {

            labels: [
                "Senior/PWD",
                "Student",
                "General Customer"
            ],

            datasets: [{

                data: [0, 0, 0],

                backgroundColor: [
                    "#b97845",
                    "#82917b",
                    "#49352c"
                ],

                borderWidth: 3,
                borderColor: "#ffffff",
                hoverOffset: 8,
                spacing: 3

            }]

        },

        options: {

            responsive: true,
            maintainAspectRatio: false,
            cutout: "70%",

            plugins: {

                legend: {

                    position: "bottom",

                    labels: {

                        usePointStyle: true,
                        pointStyle: "circle",
                        boxWidth: 8,
                        padding: 15,

                        font: {
                            family: "DM Sans",
                            size: 11
                        },

                        color: "#2b201b"

                    }

                },

                // Percentage labels inside the doughnut.

                datalabels: {

                    display: function (context) {

                        const values = context.dataset.data;

                        const total = values.reduce(
                            (sum, value) => sum + Number(value || 0),
                            0
                        );

                        return (
                            total > 0 &&
                            Number(context.dataset.data[context.dataIndex]) > 0
                        );

                    },

                    formatter: function (value, context) {

                        const values = context.dataset.data;

                        const total = values.reduce(
                            (sum, item) => sum + Number(item || 0),
                            0
                        );

                        if (total === 0) {
                            return "";
                        }

                        return `${(Number(value) / total * 100).toFixed(1)}%`;

                    },

                    color: "#ffffff",

                    font: {
                        family: "DM Sans",
                        size: 11,
                        weight: "600"
                    },

                    anchor: "center",
                    align: "center",
                    clamp: true

                }

            }

        }

    });

}


function updateCustomerChart(data) {

    if (!customerChart) {
        return;
    }

    const customerTypes = [
        "Senior/PWD",
        "Student",
        "General Customer"
    ];

    const customerCounts = customerTypes.map(function (type) {

        return data.filter(function (transaction) {

            const transactionCustomerTypes =
                getTransactionCustomerTypes(transaction);

            return transactionCustomerTypes.includes(type);

        }).length;

    });

    customerChart.data.datasets[0].data = customerCounts;

    customerChart.update();

}



// =========================================================
// 17. SIDEBAR FUNCTIONALITY
// =========================================================

function setupSidebar() {

    const sidebar = document.getElementById("sidebar");

    const desktopToggleButton =
        document.getElementById("sidebarToggle");

    const mobileToggleButton =
        document.getElementById("mobileSidebarToggle");

    const closeButton =
        document.getElementById("sidebarClose");

    if (!sidebar) {
        return;
    }


    // GET SAVED DESKTOP SIDEBAR STATE

    function getSavedSidebarState() {

        try {

            return localStorage.getItem(SIDEBAR_STORAGE_KEY) === "true";

        } catch (error) {

            console.error("Unable to read sidebar state:", error);

            return false;

        }

    }


    // SAVE DESKTOP SIDEBAR STATE

    function saveSidebarState(isCollapsed) {

        try {

            localStorage.setItem(
                SIDEBAR_STORAGE_KEY,
                String(isCollapsed)
            );

        } catch (error) {

            console.error("Unable to save sidebar state:", error);

        }

    }


    // UPDATE DESKTOP HAMBURGER STATE

    function updateDesktopToggleState(isExpanded) {

        if (desktopToggleButton) {

            desktopToggleButton.setAttribute(
                "aria-expanded",
                String(isExpanded)
            );

            desktopToggleButton.setAttribute(
                "title",
                isExpanded ? "Collapse Sidebar" : "Expand Sidebar"
            );

        }

    }


    // UPDATE MOBILE HAMBURGER STATE

    function updateMobileToggleState(isExpanded) {

        if (mobileToggleButton) {

            mobileToggleButton.setAttribute(
                "aria-expanded",
                String(isExpanded)
            );

            mobileToggleButton.setAttribute(
                "title",
                isExpanded ? "Close Sidebar" : "Open Sidebar"
            );

        }

    }


    // INITIALIZE SIDEBAR BASED ON SCREEN SIZE

    function initializeSidebar() {

        if (window.innerWidth > 850) {

            const isCollapsed = getSavedSidebarState();

            sidebar.classList.remove("mobile-open");
            sidebar.classList.toggle("collapsed", isCollapsed);

            document.body.classList.remove("sidebar-overlay-active");

            updateDesktopToggleState(!isCollapsed);
            updateMobileToggleState(false);

        } else {

            sidebar.classList.remove("collapsed");
            sidebar.classList.remove("mobile-open");

            document.body.classList.remove("sidebar-overlay-active");

            updateDesktopToggleState(true);
            updateMobileToggleState(false);

        }

    }


    initializeSidebar();


    // DESKTOP HAMBURGER

    if (desktopToggleButton) {

        desktopToggleButton.addEventListener("click", function () {

            if (window.innerWidth <= 850) {
                return;
            }

            const shouldCollapse =
                !sidebar.classList.contains("collapsed");

            sidebar.classList.toggle("collapsed", shouldCollapse);

            saveSidebarState(shouldCollapse);

            updateDesktopToggleState(!shouldCollapse);

        });

    }


    // MOBILE HAMBURGER

    if (mobileToggleButton) {

        mobileToggleButton.addEventListener("click", function () {

            if (window.innerWidth > 850) {
                return;
            }

            const isOpening =
                !sidebar.classList.contains("mobile-open");

            sidebar.classList.toggle("mobile-open", isOpening);

            document.body.classList.toggle(
                "sidebar-overlay-active",
                isOpening
            );

            updateMobileToggleState(isOpening);

        });

    }


    // MOBILE X BUTTON

    if (closeButton) {

        closeButton.addEventListener("click", function () {

            if (window.innerWidth <= 850) {

                closeMobileSidebar(
                    sidebar,
                    mobileToggleButton
                );

            }

        });

    }


    // CLOSE WHEN CLICKING OUTSIDE THE SIDEBAR

    document.addEventListener("click", function (event) {

        if (
            window.innerWidth <= 850 &&
            sidebar.classList.contains("mobile-open") &&
            !sidebar.contains(event.target) &&
            !(mobileToggleButton &&
                mobileToggleButton.contains(event.target))
        ) {

            closeMobileSidebar(
                sidebar,
                mobileToggleButton
            );

        }

    });


    // CLOSE AFTER NAVIGATION ON MOBILE

    const navigationLinks = sidebar.querySelectorAll("a.nav-item");

    navigationLinks.forEach(function (link) {

        link.addEventListener("click", function () {

            if (window.innerWidth <= 850) {

                closeMobileSidebar(
                    sidebar,
                    mobileToggleButton
                );

            }

        });

    });


    // ESCAPE KEY

    document.addEventListener("keydown", function (event) {

        if (
            event.key === "Escape" &&
            window.innerWidth <= 850 &&
            sidebar.classList.contains("mobile-open")
        ) {

            closeMobileSidebar(
                sidebar,
                mobileToggleButton
            );

        }

    });


    // HANDLE SCREEN RESIZING

    window.addEventListener("resize", function () {
        initializeSidebar();
    });

}



// =========================================================
// 18. ANALYTICS DROPDOWN
// =========================================================

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

    dropdownToggle.addEventListener("click", function () {

        const isCurrentlyCollapsed =
            analyticsNavList.classList.contains("collapsed");

        analyticsNavList.classList.toggle("collapsed");

        dropdownToggle.setAttribute(
            "aria-expanded",
            String(isCurrentlyCollapsed)
        );

    });

}



// =========================================================
// 19. CLOSE MOBILE SIDEBAR
// =========================================================

function closeMobileSidebar(sidebar, toggleButton) {

    if (!sidebar) {
        return;
    }

    sidebar.classList.remove("mobile-open");

    document.body.classList.remove("sidebar-overlay-active");

    if (toggleButton) {

        toggleButton.setAttribute("aria-expanded", "false");
        toggleButton.setAttribute("title", "Open Sidebar");

    }

}



// =========================================================
// 20. LOGOUT CONFIRMATION MODAL
// =========================================================

function setupLogout() {

    const logoutButton = document.getElementById("logout-btn");

    if (!logoutButton) {
        return;
    }

    let logoutModal = null;


    // CLOSE THE CUSTOM LOGOUT MODAL

    function closeLogoutModal() {

        if (!logoutModal) {
            return;
        }

        const modalToClose = logoutModal;

        modalToClose.classList.remove("show");

        document.body.classList.remove("logout-modal-open");

        document.removeEventListener(
            "keydown",
            handleLogoutModalKeydown
        );

        window.setTimeout(function () {

            modalToClose.remove();

            if (logoutModal === modalToClose) {
                logoutModal = null;
            }

            logoutButton.focus();

        }, 200);

    }


    // HANDLE ESCAPE KEY AND FOCUS TRAP

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
                "button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex='-1'])"
            );

            if (focusableElements.length === 0) {
                return;
            }

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


    // CREATE AND OPEN THE CUSTOM MODAL

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
                tabindex="-1">

                <div class="logout-modal-icon" aria-hidden="true">
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
                        class="logout-modal-cancel"
                        id="logout-modal-cancel">
                        Cancel
                    </button>

                    <button
                        type="button"
                        class="logout-modal-confirm"
                        id="logout-modal-confirm">

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


        // CANCEL LOGOUT

        cancelButton.addEventListener("click", function () {
            closeLogoutModal();
        });


        // CONFIRM LOGOUT THROUGH THE BACKEND

        confirmButton.addEventListener("click", async function () {

            confirmButton.disabled = true;

            confirmButton.innerHTML = `
                <i class="fa-solid fa-spinner fa-spin"></i>
                Logging Out...
            `;

            try {

                await apiClient.post("/auth/logout", {});

                window.location.replace("./login.html");

            } catch (error) {

                console.error("Logout failed:", error);

                confirmButton.disabled = false;

                confirmButton.innerHTML = `
                    <i class="fa-solid fa-right-from-bracket"></i>
                    Yes, Logout
                `;

                const description = logoutModal.querySelector(
                    "#logout-modal-description"
                );

                if (description) {

                    description.textContent =
                        "Unable to log out. Please check your connection and try again.";

                }

            }

        });


        // CLOSE WHEN CLICKING THE DARK OVERLAY

        logoutModal.addEventListener("click", function (event) {

            if (event.target === logoutModal) {
                closeLogoutModal();
            }

        });


        // REGISTER KEYBOARD CONTROLS

        document.addEventListener(
            "keydown",
            handleLogoutModalKeydown
        );


        // SHOW MODAL ANIMATION

        requestAnimationFrame(function () {

            if (logoutModal) {

                logoutModal.classList.add("show");

                cancelButton.focus();

            }

        });

    }


    // OPEN MODAL WHEN LOGOUT BUTTON IS CLICKED

    logoutButton.addEventListener("click", function (event) {

        event.preventDefault();

        openLogoutModal();

    });

}