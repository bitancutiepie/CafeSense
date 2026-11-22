/* =========================================================
   CAFÉSENSE - SALES REPORTS
   reports.js
========================================================= */
import { transactionApi } from '../api/transactionApi.js';

/* =========================
   1. STORAGE KEYS
========================= */

const TRANSACTIONS_STORAGE_KEY = "cafeSenseTransactions";
const SIDEBAR_STORAGE_KEY = "cafeSenseSidebarCollapsed";

let transactions = [];
let filteredTransactions = [];
let salesReportChart = null;


/* =========================
   2. DOM ELEMENTS
========================= */

// Sidebar
const sidebar = document.getElementById("sidebar");
const sidebarToggle = document.getElementById("sidebarToggle");
const sidebarClose = document.getElementById("sidebarClose");
const analyticsDropdownToggle = document.getElementById("analyticsDropdownToggle");
const analyticsNavList = document.getElementById("analyticsNavList");
const logoutButton = document.getElementById("logout-btn");

// Date filters
const reportStartDate = document.getElementById("reportStartDate");
const reportEndDate = document.getElementById("reportEndDate");
const reportInterval = document.getElementById("reportInterval");

// Filter buttons
const generateReportBtn = document.getElementById("generateReportBtn");
const resetReportBtn = document.getElementById("resetReportBtn");

// Summary cards
const grossSalesValue = document.getElementById("grossSalesValue");
const totalDiscountValue = document.getElementById("totalDiscountValue");
const netSalesValue = document.getElementById("netSalesValue");
const totalTransactionsValue = document.getElementById("totalTransactionsValue");
const totalCustomersValue = document.getElementById("totalCustomersValue");

// Chart
const salesReportChartCanvas = document.getElementById("salesReportChart");
const salesChartEmpty = document.getElementById("salesChartEmpty");

// Sales breakdown table
const salesSummaryBody = document.getElementById("salesSummaryBody");

// Product sales table
const productSalesBody = document.getElementById("productSalesBody");
const productSalesRecordCount = document.getElementById("productSalesRecordCount");

// Customer sales table
const customerSalesBody = document.getElementById("customerSalesBody");
const customerSalesRecordCount = document.getElementById("customerSalesRecordCount");

// Transaction records table
const transactionRecordsBody = document.getElementById("transactionRecordsBody");
const transactionRecordCount = document.getElementById("transactionRecordCount");

// Other elements
const reportPeriodLabel = document.getElementById("reportPeriodLabel");
const currentDateElement = document.getElementById("current-date");
const currentTimeElement = document.getElementById("current-time");

// Export and print buttons
const exportSalesSummaryCsvBtn = document.getElementById("exportSalesSummaryCsvBtn");
const exportCsvBtn = document.getElementById("exportCsvBtn");
const exportProductCsvBtn = document.getElementById("exportProductCsvBtn");
const exportCustomerCsvBtn = document.getElementById("exportCustomerCsvBtn");
const printReportBtn = document.getElementById("printReportBtn");


/* =========================
   3. CUSTOM SYSTEM DIALOG
========================= */

let activeDialogResolver = null;
let dialogEscapeHandler = null;
let dialogCanCloseOnBackdrop = false;


function createSystemDialog() {
    let dialog = document.getElementById("cafeSenseDialog");

    if (dialog) {
        return dialog;
    }

    dialog = document.createElement("div");
    dialog.id = "cafeSenseDialog";

    dialog.innerHTML = `
        <div class="cafe-dialog-box"
             role="dialog"
             aria-modal="true"
             aria-labelledby="cafeDialogTitle"
             aria-describedby="cafeDialogMessage"
             tabindex="-1">

            <div class="cafe-dialog-icon" id="cafeDialogIcon">
                <i class="fas fa-info-circle"></i>
            </div>

            <h2 class="cafe-dialog-title" id="cafeDialogTitle">
                Notification
            </h2>

            <p class="cafe-dialog-message" id="cafeDialogMessage"></p>

            <div class="cafe-dialog-actions" id="cafeDialogActions"></div>
        </div>
    `;

    document.body.appendChild(dialog);

    return dialog;
}


function closeSystemDialog(result = false) {
    const dialog = document.getElementById("cafeSenseDialog");

    if (!dialog || !dialog.classList.contains("active")) {
        return;
    }

    dialog.classList.remove("active");

    dialogCanCloseOnBackdrop = false;

    dialog.onclick = null;

    if (dialogEscapeHandler) {
        document.removeEventListener(
            "keydown",
            dialogEscapeHandler
        );

        dialogEscapeHandler = null;
    }

    if (activeDialogResolver) {
        const resolve = activeDialogResolver;

        activeDialogResolver = null;

        resolve(result);
    }
}


function setupSystemDialogBehavior(dialog, allowBackdropClose = true) {
    dialogCanCloseOnBackdrop = allowBackdropClose;

    // Close when clicking the backdrop.
    dialog.onclick = function (event) {
        if (
            event.target === dialog &&
            dialogCanCloseOnBackdrop
        ) {
            closeSystemDialog(false);
        }
    };

    // Escape key and keyboard focus management.
    dialogEscapeHandler = function (event) {
        if (!dialog.classList.contains("active")) {
            return;
        }

        if (event.key === "Escape") {
            event.preventDefault();
            closeSystemDialog(false);
            return;
        }

        if (event.key === "Tab") {
            const focusableElements = dialog.querySelectorAll(
                "button:not([disabled]), " +
                "[href], " +
                "input:not([disabled]), " +
                "select:not([disabled]), " +
                "textarea:not([disabled]), " +
                "[tabindex]:not([tabindex='-1'])"
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
            }

            else if (
                !event.shiftKey &&
                document.activeElement === lastElement
            ) {
                event.preventDefault();
                firstElement.focus();
            }
        }
    };

    document.addEventListener(
        "keydown",
        dialogEscapeHandler
    );
}


function showSystemDialog(message, title = "Notification") {
    closeSystemDialog(false);

    const dialog = createSystemDialog();

    const titleElement = dialog.querySelector("#cafeDialogTitle");
    const messageElement = dialog.querySelector("#cafeDialogMessage");
    const iconElement = dialog.querySelector("#cafeDialogIcon");
    const actionsElement = dialog.querySelector("#cafeDialogActions");

    titleElement.textContent = title;
    messageElement.textContent = message;

    iconElement.innerHTML = '<i class="fas fa-info-circle"></i>';

    actionsElement.innerHTML = `
        <button type="button" class="cafe-dialog-btn primary">
            OK
        </button>
    `;

    dialog.classList.add("active");

    setupSystemDialogBehavior(dialog, true);

    const okButton = actionsElement.querySelector("button");

    okButton.addEventListener("click", function () {
        closeSystemDialog(true);
    });

    okButton.focus();
}


function showSystemConfirm(message, title = "Confirmation") {
    closeSystemDialog(false);

    const dialog = createSystemDialog();

    const titleElement = dialog.querySelector("#cafeDialogTitle");
    const messageElement = dialog.querySelector("#cafeDialogMessage");
    const iconElement = dialog.querySelector("#cafeDialogIcon");
    const actionsElement = dialog.querySelector("#cafeDialogActions");

    titleElement.textContent = title;
    messageElement.textContent = message;

    iconElement.innerHTML = '<i class="fas fa-question-circle"></i>';

    actionsElement.innerHTML = `
        <button type="button"
                class="cafe-dialog-btn secondary"
                id="cafeDialogCancel">
            Cancel
        </button>

        <button type="button"
                class="cafe-dialog-btn primary"
                id="cafeDialogConfirm">
            Confirm
        </button>
    `;

    dialog.classList.add("active");

    return new Promise(resolve => {
        activeDialogResolver = resolve;

        setupSystemDialogBehavior(dialog, true);

        const cancelButton = actionsElement.querySelector(
            "#cafeDialogCancel"
        );

        const confirmButton = actionsElement.querySelector(
            "#cafeDialogConfirm"
        );

        cancelButton.addEventListener("click", function () {
            closeSystemDialog(false);
        });

        confirmButton.addEventListener("click", function () {
            closeSystemDialog(true);
        });

        cancelButton.focus();
    });
}


/* =========================
   4. GENERAL HELPERS
========================= */

function formatCurrency(amount) {
    return new Intl.NumberFormat("en-PH", {
        style: "currency",
        currency: "PHP"
    }).format(Number(amount) || 0);
}


function formatNumber(number) {
    return new Intl.NumberFormat("en-PH").format(Number(number) || 0);
}


function formatDate(date) {
    return new Date(
        date.getFullYear(),
        date.getMonth(),
        date.getDate()
    ).toLocaleDateString("en-PH", {
        year: "numeric",
        month: "short",
        day: "numeric"
    });
}


// FORMAT TRANSACTION TIME
function formatTime(date) {
    return date.toLocaleTimeString("en-PH", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: true
    });
}


// FORMAT MINUTES AS 12-HOUR TIME
function formatMinutesAsTime(minutes) {
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;

    const date = new Date(2000, 0, 1, hours, remainingMinutes);

    return formatTime(date);
}


function getLocalDateString(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
}


function escapeHTML(value) {
    return String(value ?? "").replace(/[&<>"']/g, function (character) {
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


/* =========================
   5. LOAD TRANSACTIONS
========================= */

async function loadTransactions() {
    try {
        const response = await transactionApi.getAll();
        const databaseTransactions = response.data;

        if (!Array.isArray(databaseTransactions)) {
            throw new Error("Invalid transaction data received from the API.");
        }

        transactions = databaseTransactions
            .filter(transaction =>
                transaction && typeof transaction === "object"
            )
            .map(transaction => ({
                ...transaction,
                items: Array.isArray(transaction.items)
                    ? transaction.items.map(item => ({
                        ...item,
                        category:
                            typeof item.category === "string" &&
                            item.category.trim().toLowerCase() === "pastries"
                                ? "Pastry / Baked Good"
                                : item.category
                    }))
                    : []
            }));

        return true;

    } catch (error) {
        console.error(
            "Unable to load transactions from database:",
            error
        );

        transactions = [];
        filteredTransactions = [];

        showSystemDialog(
            "Unable to retrieve sales records from the database. Please check your connection and try again.",
            "Sales Report Error"
        );

        return false;
    }
}


/* =========================
   6. TRANSACTION DATE
========================= */

function getTransactionDate(transaction) {

    if (transaction.dateISO) {
        const isoValue = String(transaction.dateISO).trim();

        // Date-only ISO values are interpreted as local dates.
        // This prevents timezone-related date shifting.
        const dateOnlyMatch = isoValue.match(
            /^(\d{4})-(\d{2})-(\d{2})$/
        );

        if (dateOnlyMatch) {
            const [, year, month, day] = dateOnlyMatch;

            const localDate = new Date(
                Number(year),
                Number(month) - 1,
                Number(day)
            );

            if (!Number.isNaN(localDate.getTime())) {
                return localDate;
            }
        }

        // Full ISO date-time values are parsed normally.
        const isoDate = new Date(isoValue);

        if (!Number.isNaN(isoDate.getTime())) {
            return isoDate;
        }
    }

    if (!transaction.date) {
        return null;
    }

    const readableDate = String(transaction.date)
        .trim()
        .replace(/\s+at\s+/i, ", ");

    const date = new Date(readableDate);

    if (Number.isNaN(date.getTime())) {
        console.warn("Invalid transaction date:", transaction.date);
        return null;
    }

    return date;
}


/* =========================
   7. TRANSACTION TOTALS
========================= */

function getTransactionGross(transaction) {
    if (Array.isArray(transaction.items)) {
        return transaction.items.reduce((sum, item) => {
            const lineSubtotal = Number(item.lineSubtotal);

            if (Number.isFinite(lineSubtotal)) {
                return sum + lineSubtotal;
            }

            return sum + (
                Number(item.price || 0) *
                Number(item.quantity || 0)
            );
        }, 0);
    }

    return Number(transaction.subtotal) || 0;
}


function getTransactionDiscount(transaction) {
    if (Array.isArray(transaction.items)) {
        return transaction.items.reduce((sum, item) => {
            return sum + (Number(item.lineDiscount) || 0);
        }, 0);
    }

    return Number(transaction.discount) || 0;
}


function getTransactionNet(transaction) {
    if (transaction.total !== undefined) {
        return Number(transaction.total) || 0;
    }

    if (Array.isArray(transaction.items)) {
        return transaction.items.reduce((sum, item) => {
            if (item.lineTotal !== undefined) {
                return sum + (Number(item.lineTotal) || 0);
            }

            const subtotal = Number(item.lineSubtotal) ||
                (Number(item.price) * Number(item.quantity));

            return sum + subtotal - (Number(item.lineDiscount) || 0);
        }, 0);
    }

    return (
        getTransactionGross(transaction) -
        getTransactionDiscount(transaction)
    );
}


/* =========================
   8. PRODUCT LINE TOTALS
========================= */

function getItemGross(item) {
    const lineSubtotal = Number(item.lineSubtotal);

    if (Number.isFinite(lineSubtotal)) {
        return lineSubtotal;
    }

    return (
        (Number(item.price) || 0) *
        (Number(item.quantity) || 0)
    );
}


function getItemDiscount(item) {
    return Number(item.lineDiscount) || 0;
}


function getItemNet(item) {
    if (item.lineTotal !== undefined) {
        return Number(item.lineTotal) || 0;
    }

    return getItemGross(item) - getItemDiscount(item);
}


function getItemCustomerType(item) {
    return item.customerType || "Unclassified";
}


/* =========================
   9. DATE FILTER DEFAULTS
========================= */

function setDefaultDateFilters() {
    const today = new Date();

    const firstDay = new Date(
        today.getFullYear(),
        today.getMonth(),
        1
    );

    reportStartDate.value = getLocalDateString(firstDay);
    reportEndDate.value = getLocalDateString(today);
    reportInterval.value = "daily";
}


/* =========================================================
   DISPLAY CURRENT DATE AND TIME
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


/* =========================
   10. FILTER TRANSACTIONS
========================= */

function generateReport() {
    const startValue = reportStartDate.value;
    const endValue = reportEndDate.value;

    if (!startValue || !endValue) {
        showSystemDialog(
            "Please select both a start date and an end date.",
            "Missing Date"
        );

        return;
    }

    const startDate = new Date(startValue + "T00:00:00");
    const endDate = new Date(endValue + "T23:59:59.999");

    if (startDate > endDate) {
        showSystemDialog(
            "Start date cannot be later than end date.",
            "Invalid Date Range"
        );

        return;
    }

    filteredTransactions = transactions.filter(transaction => {
        const transactionDate = getTransactionDate(transaction);

        if (!transactionDate) {
            return false;
        }

        return (
            transactionDate >= startDate &&
            transactionDate <= endDate
        );
    });

    updateReportPeriodLabel(startDate, endDate);

    updateSalesSummary();
    updateSalesChart();
    updateSalesSummaryTable();
    updateProductSalesSummary();
    updateCustomerSalesSummary();
    updateTransactionRecordsTable();
}


function updateReportPeriodLabel(startDate, endDate) {
    reportPeriodLabel.textContent =
        `Showing report from ${formatDate(startDate)} to ${formatDate(endDate)}`;
}


/* =========================
   11. SALES SUMMARY CARDS
========================= */

function updateSalesSummary() {
    const grossSales = filteredTransactions.reduce(
        (sum, transaction) => sum + getTransactionGross(transaction),
        0
    );

    const totalDiscounts = filteredTransactions.reduce(
        (sum, transaction) => sum + getTransactionDiscount(transaction),
        0
    );

    const netSales = filteredTransactions.reduce(
        (sum, transaction) => sum + getTransactionNet(transaction),
        0
    );

    const totalCustomers = filteredTransactions.reduce(
        (sum, transaction) => {
            return sum + (Number(transaction.customerCount) || 0);
        },
        0
    );

    grossSalesValue.textContent = formatCurrency(grossSales);
    totalDiscountValue.textContent = formatCurrency(totalDiscounts);
    netSalesValue.textContent = formatCurrency(netSales);

    totalTransactionsValue.textContent = formatNumber(
        filteredTransactions.length
    );

    totalCustomersValue.textContent = formatNumber(totalCustomers);
}


/* =========================
   12. GROUP SALES BY INTERVAL
========================= */

function getWeekStart(date) {
    const weekStart = new Date(date);

    const day = weekStart.getDay();
    const difference = day === 0 ? 6 : day - 1;

    weekStart.setDate(weekStart.getDate() - difference);
    weekStart.setHours(0, 0, 0, 0);

    return weekStart;
}


function getPeriodKey(date, interval) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");

    if (interval === "monthly") {
        return `${year}-${month}`;
    }

    if (interval === "weekly") {
        return getLocalDateString(getWeekStart(date));
    }

    return `${year}-${month}-${day}`;
}


function getPeriodLabel(key, interval) {
    if (interval === "monthly") {
        const [year, month] = key.split("-").map(Number);

        return new Date(year, month - 1, 1).toLocaleDateString(
            "en-PH",
            {
                month: "short",
                year: "numeric"
            }
        );
    }

    if (interval === "weekly") {
        const weekStart = new Date(key + "T00:00:00");
        const weekEnd = new Date(weekStart);

        weekEnd.setDate(weekEnd.getDate() + 6);

        return `${formatDate(weekStart)} - ${formatDate(weekEnd)}`;
    }

    return formatDate(new Date(key + "T00:00:00"));
}


function groupSalesByPeriod() {
    const interval = reportInterval.value;
    const groupedSales = {};

    filteredTransactions.forEach(transaction => {
        const date = getTransactionDate(transaction);

        if (!date) return;

        const key = getPeriodKey(date, interval);

        if (!groupedSales[key]) {
            groupedSales[key] = {
                key,
                label: getPeriodLabel(key, interval),
                transactions: 0,
                customers: 0,
                grossSales: 0,
                discounts: 0,
                netSales: 0,

                // Track the earliest and latest transaction
                // time of day within this reporting period.
                earliestTransactionMinute: Infinity,
                latestTransactionMinute: -Infinity
            };
        }

        groupedSales[key].transactions++;

        groupedSales[key].customers +=
            Number(transaction.customerCount) || 0;

        groupedSales[key].grossSales += getTransactionGross(transaction);
        groupedSales[key].discounts += getTransactionDiscount(transaction);
        groupedSales[key].netSales += getTransactionNet(transaction);

        // GET TRANSACTION TIME IN MINUTES AFTER MIDNIGHT
        const transactionMinute =
            (date.getHours() * 60) + date.getMinutes();

        // UPDATE EARLIEST TRANSACTION TIME
        groupedSales[key].earliestTransactionMinute = Math.min(
            groupedSales[key].earliestTransactionMinute,
            transactionMinute
        );

        // UPDATE LATEST TRANSACTION TIME
        groupedSales[key].latestTransactionMinute = Math.max(
            groupedSales[key].latestTransactionMinute,
            transactionMinute
        );
    });

    return Object.values(groupedSales).sort((a, b) =>
        a.key.localeCompare(b.key)
    );
}


// Shared data source for the Sales Summary table and CSV export.
function getSalesSummaryRecords() {
    return groupSalesByPeriod().map(item => {

        const hasTransactionTimes =
            Number.isFinite(item.earliestTransactionMinute) &&
            Number.isFinite(item.latestTransactionMinute);

        const timeRange = hasTransactionTimes
            ? `${formatMinutesAsTime(item.earliestTransactionMinute)} – ${formatMinutesAsTime(item.latestTransactionMinute)}`
            : "N/A";

        return {
            ...item,
            timeRange
        };
    });
}


/* =========================
   13. SALES PERFORMANCE CHART
========================= */

function updateSalesChart() {
    const groupedSales = groupSalesByPeriod();

    if (salesReportChart) {
        salesReportChart.destroy();
        salesReportChart = null;
    }

    if (!salesReportChartCanvas) return;

    const hasData = groupedSales.length > 0;

    salesChartEmpty.hidden = hasData;

    salesReportChartCanvas.parentElement.style.display = hasData
        ? "block"
        : "none";

    if (!hasData) {
        return;
    }

    const labels = groupedSales.map(item => item.label);
    const salesData = groupedSales.map(item => item.netSales);

    salesReportChart = new Chart(salesReportChartCanvas, {
        type: "line",

        data: {
            labels,

            datasets: [{
                label: "Net Sales",
                data: salesData,

                borderColor: "#b97845",
                backgroundColor: "rgba(185, 120, 69, 0.12)",

                borderWidth: 3,
                fill: true,
                tension: 0.35,

                pointBackgroundColor: "#986039",
                pointBorderColor: "#ffffff",
                pointBorderWidth: 2,
                pointRadius: 5,
                pointHoverRadius: 7
            }]
        },

        options: {
            responsive: true,
            maintainAspectRatio: false,

            interaction: {
                intersect: false,
                mode: "index"
            },

            plugins: {
                legend: {
                    display: false
                },

                tooltip: {
                    callbacks: {
                        label: function (context) {
                            return "Net Sales: " +
                                formatCurrency(context.parsed.y);
                        }
                    }
                }
            },

            scales: {
                y: {
                    beginAtZero: true,

                    ticks: {
                        callback: function (value) {
                            return "₱" + Number(value).toLocaleString("en-PH");
                        }
                    },

                    grid: {
                        color: "#eee8e2"
                    }
                },

                x: {
                    grid: {
                        display: false
                    },

                    ticks: {
                        maxRotation: 45,
                        minRotation: 0
                    }
                }
            }
        }
    });
}


/* =========================
   14. SALES BREAKDOWN TABLE
========================= */

function updateSalesSummaryTable() {
    const groupedSales = getSalesSummaryRecords();

    if (groupedSales.length === 0) {
        salesSummaryBody.innerHTML = `
            <tr>
                <td colspan="7" class="empty-table-message">
                    No sales summary records available for this period.
                </td>
            </tr>
        `;

        return;
    }

    salesSummaryBody.innerHTML = groupedSales.map(item => `
        <tr>
            <td>${escapeHTML(item.label)}</td>
            <td>${escapeHTML(item.timeRange)}</td>
            <td>${formatNumber(item.transactions)}</td>
            <td>${formatNumber(item.customers)}</td>
            <td>${formatCurrency(item.grossSales)}</td>
            <td>${formatCurrency(item.discounts)}</td>
            <td><strong>${formatCurrency(item.netSales)}</strong></td>
        </tr>
    `).join("");
}


/* =========================
   15. PRODUCT SALES SUMMARY
========================= */

function getProductSalesData() {
    const productMap = new Map();

    filteredTransactions.forEach(transaction => {
        if (!Array.isArray(transaction.items)) return;

        transaction.items.forEach(item => {
            const productId = item.productId || "";
            const productName = item.name || "Unknown Product";
            const category = item.category || "Uncategorized";

            const productKey = productId
                ? String(productId)
                : `${productName.toLowerCase()}-${category.toLowerCase()}`;

            if (!productMap.has(productKey)) {
                productMap.set(productKey, {
                    productId,
                    name: productName,
                    category,
                    quantity: 0,
                    grossSales: 0,
                    discounts: 0,
                    netSales: 0
                });
            }

            const product = productMap.get(productKey);

            product.quantity += Number(item.quantity) || 0;
            product.grossSales += getItemGross(item);
            product.discounts += getItemDiscount(item);
            product.netSales += getItemNet(item);
        });
    });

    return Array.from(productMap.values()).sort((a, b) =>
        b.quantity - a.quantity
    );
}


function updateProductSalesSummary() {
    const products = getProductSalesData();

    productSalesRecordCount.textContent =
        `${products.length} products found`;

    if (products.length === 0) {
        productSalesBody.innerHTML = `
            <tr>
                <td colspan="6" class="empty-table-message">
                    No product sales records available for this period.
                </td>
            </tr>
        `;

        return;
    }

    productSalesBody.innerHTML = products.map(product => `
        <tr>
            <td><strong>${escapeHTML(product.name)}</strong></td>
            <td>${escapeHTML(product.category)}</td>
            <td>${formatNumber(product.quantity)}</td>
            <td>${formatCurrency(product.grossSales)}</td>
            <td>${formatCurrency(product.discounts)}</td>
            <td><strong>${formatCurrency(product.netSales)}</strong></td>
        </tr>
    `).join("");
}


/* =========================
   16. CUSTOMER SALES SUMMARY
========================= */

function getTransactionCustomerTypeBreakdown(transaction) {
    const breakdown = new Map();

    if (Array.isArray(transaction.items) && transaction.items.length > 0) {
        transaction.items.forEach(item => {
            const customerType = getItemCustomerType(item);

            if (!breakdown.has(customerType)) {
                breakdown.set(customerType, {
                    customerType,
                    grossSales: 0,
                    discounts: 0,
                    netSales: 0
                });
            }

            const group = breakdown.get(customerType);

            group.grossSales += getItemGross(item);
            group.discounts += getItemDiscount(item);
            group.netSales += getItemNet(item);
        });

        return breakdown;
    }

    const savedTypes = Array.isArray(transaction.customerTypes)
        ? [...new Set(transaction.customerTypes)]
        : [];

    const customerType = savedTypes.length === 1
        ? savedTypes[0]
        : "Unclassified";

    breakdown.set(customerType, {
        customerType,
        grossSales: getTransactionGross(transaction),
        discounts: getTransactionDiscount(transaction),
        netSales: getTransactionNet(transaction)
    });

    return breakdown;
}


function getCustomerSalesData() {
    const customerMap = new Map();

    filteredTransactions.forEach((transaction, index) => {
        const transactionKey = transaction.id || `transaction-${index}`;

        const breakdown = getTransactionCustomerTypeBreakdown(transaction);

        breakdown.forEach(group => {
            const customerType = group.customerType;

            if (!customerMap.has(customerType)) {
                customerMap.set(customerType, {
                    customerType,
                    transactionIds: new Set(),
                    grossSales: 0,
                    discounts: 0,
                    netSales: 0
                });
            }

            const customer = customerMap.get(customerType);

            customer.transactionIds.add(transactionKey);

            customer.grossSales += group.grossSales;
            customer.discounts += group.discounts;
            customer.netSales += group.netSales;
        });
    });

    return Array.from(customerMap.values())
        .map(customer => ({
            customerType: customer.customerType,
            transactions: customer.transactionIds.size,
            grossSales: customer.grossSales,
            discounts: customer.discounts,
            netSales: customer.netSales
        }))
        .sort((a, b) => b.netSales - a.netSales);
}


function updateCustomerSalesSummary() {
    const customers = getCustomerSalesData();

    customerSalesRecordCount.textContent =
        `${customers.length} customer types found`;

    if (customers.length === 0) {
        customerSalesBody.innerHTML = `
            <tr>
                <td colspan="5" class="empty-table-message">
                    No customer sales records available for this period.
                </td>
            </tr>
        `;

        return;
    }

    customerSalesBody.innerHTML = customers.map(customer => `
        <tr>
            <td><strong>${escapeHTML(customer.customerType)}</strong></td>
            <td>${formatNumber(customer.transactions)}</td>
            <td>${formatCurrency(customer.grossSales)}</td>
            <td>${formatCurrency(customer.discounts)}</td>
            <td><strong>${formatCurrency(customer.netSales)}</strong></td>
        </tr>
    `).join("");
}


/* =========================
   17. TRANSACTION RECORDS TABLE
========================= */

function updateTransactionRecordsTable() {
    const sortedTransactions = [...filteredTransactions].sort((a, b) => {
        return getTransactionDate(b) - getTransactionDate(a);
    });

    transactionRecordCount.textContent =
        `${sortedTransactions.length} records found`;

    if (sortedTransactions.length === 0) {
        transactionRecordsBody.innerHTML = `
            <tr>
                <td colspan="8" class="empty-table-message">
                    No transaction records available for this period.
                </td>
            </tr>
        `;

        return;
    }

    transactionRecordsBody.innerHTML = sortedTransactions.map(transaction => {
        const date = getTransactionDate(transaction);

        const transactionId = transaction.transactionId || "N/A";
        const customerCount = Number(transaction.customerCount) || 0;
        const paymentMethod = transaction.paymentMethod || "N/A";

        const gross = getTransactionGross(transaction);
        const discount = getTransactionDiscount(transaction);
        const net = getTransactionNet(transaction);

        return `
            <tr>
                <td>${escapeHTML(transactionId)}</td>
                <td>${date ? escapeHTML(formatDate(date)) : "N/A"}</td>
                <td>${date ? escapeHTML(formatTime(date)) : "N/A"}</td>
                <td>${formatNumber(customerCount)}</td>
                <td>${escapeHTML(paymentMethod)}</td>
                <td>${formatCurrency(gross)}</td>
                <td>${formatCurrency(discount)}</td>
                <td><strong>${formatCurrency(net)}</strong></td>
            </tr>
        `;
    }).join("");
}


/* =========================
   18. RESET FILTERS
========================= */

function resetReportFilters() {
    setDefaultDateFilters();
    generateReport();
}


/* =========================
   19. CSV EXPORT HELPER
========================= */

function downloadCSV(headers, rows, filename) {
    const csvContent = [headers, ...rows]
        .map(row => row.map(value => {
            const safeValue = String(value ?? "").replace(/"/g, '""');
            return `"${safeValue}"`;
        }).join(","))
        .join("\r\n");

    const blob = new Blob(
        ["\uFEFF" + csvContent],
        { type: "text/csv;charset=utf-8;" }
    );

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = filename;

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    // Allow the browser time to process the download.
    window.setTimeout(function () {
        URL.revokeObjectURL(url);
    }, 1000);
}


function getExportDateSuffix() {
    return getLocalDateString(new Date());
}


/* =========================
   20. EXPORT SALES SUMMARY CSV
========================= */

async function exportSalesSummaryCSV() {

    // Uses the exact same records displayed in the Sales Summary table.
    const groupedSales = getSalesSummaryRecords();

    if (groupedSales.length === 0) {
        showSystemDialog(
            "There are no sales summary records to export.",
            "No Records Found"
        );

        return;
    }

    const confirmed = await showSystemConfirm(
        "Are you sure you want to export the Sales Summary for the selected date range?",
        "Confirm Sales Summary Export"
    );

    if (!confirmed) return;

    // Matches the Sales Summary Records table column order.
    const headers = [
        "Period",
        "Time Range",
        "Transactions",
        "Customers",
        "Gross Sales",
        "Discounts",
        "Net Sales"
    ];

    const rows = groupedSales.map(item => [
        item.label,
        item.timeRange,
        item.transactions,
        item.customers,
        item.grossSales.toFixed(2),
        item.discounts.toFixed(2),
        item.netSales.toFixed(2)
    ]);

    downloadCSV(
        headers,
        rows,
        `CafeSense_Sales_Summary_${getExportDateSuffix()}.csv`
    );
}


/* =========================
   21. EXPORT SALES TRANSACTIONS CSV
========================= */

async function exportTransactionsCSV() {
    if (filteredTransactions.length === 0) {
        showSystemDialog(
            "There are no transaction records to export.",
            "No Records Found"
        );

        return;
    }

    const confirmed = await showSystemConfirm(
        "Are you sure you want to export the Sales Transactions for the selected date range?",
        "Confirm Sales Transactions Export"
    );

    if (!confirmed) return;

    const headers = [
        "Transaction ID",
        "Date",
        "Time",
        "Customer Count",
        "Payment Method",
        "Gross Sales",
        "Discount",
        "Net Sales"
    ];

    const sortedTransactions = [...filteredTransactions].sort((a, b) => {
        return getTransactionDate(b) - getTransactionDate(a);
    });

    const rows = sortedTransactions.map(transaction => {
        const date = getTransactionDate(transaction);

        return [
            transaction.transactionId ?? "N/A",
            date ? getLocalDateString(date) : "N/A",
            date ? formatTime(date) : "N/A",
            Number(transaction.customerCount) || 0,
            transaction.paymentMethod || "N/A",
            getTransactionGross(transaction).toFixed(2),
            getTransactionDiscount(transaction).toFixed(2),
            getTransactionNet(transaction).toFixed(2)
        ];
    });

    downloadCSV(
        headers,
        rows,
        `CafeSense_Sales_Transactions_${getExportDateSuffix()}.csv`
    );
}


/* =========================
   22. EXPORT PRODUCT SALES CSV
========================= */

async function exportProductSalesCSV() {
    const rows = [];

    filteredTransactions.forEach(transaction => {
        if (!Array.isArray(transaction.items)) return;

        transaction.items.forEach(item => {
            const date = getTransactionDate(transaction);

            rows.push([
                transaction.transactionId ?? "N/A",
                date ? getLocalDateString(date) : "N/A",
                item.productId || "N/A",
                item.name || "Unknown Product",
                item.category || "Uncategorized",
                Number(item.quantity) || 0,
                (Number(item.price) || 0).toFixed(2),
                getItemGross(item).toFixed(2),
                getItemDiscount(item).toFixed(2),
                getItemNet(item).toFixed(2)
            ]);
        });
    });

    if (rows.length === 0) {
        showSystemDialog(
            "There are no product sales records to export.",
            "No Records Found"
        );

        return;
    }

    const confirmed = await showSystemConfirm(
        "Are you sure you want to export the Product Sales for the selected date range?",
        "Confirm Product Sales Export"
    );

    if (!confirmed) return;

    const headers = [
        "Transaction ID",
        "Date",
        "Product ID",
        "Product",
        "Category",
        "Quantity",
        "Unit Price",
        "Gross Sales",
        "Discount",
        "Net Sales"
    ];

    downloadCSV(
        headers,
        rows,
        `CafeSense_Product_Sales_${getExportDateSuffix()}.csv`
    );
}


/* =========================
   23. EXPORT CUSTOMER SALES CSV
========================= */

async function exportCustomerSalesCSV() {
    const rows = [];

    filteredTransactions.forEach(transaction => {
        const date = getTransactionDate(transaction);

        const breakdown = getTransactionCustomerTypeBreakdown(transaction);

        breakdown.forEach(group => {
            rows.push([
                transaction.transactionId ?? "N/A",
                date ? getLocalDateString(date) : "N/A",
                group.customerType,
                group.grossSales.toFixed(2),
                group.discounts.toFixed(2),
                group.netSales.toFixed(2)
            ]);
        });
    });

    if (rows.length === 0) {
        showSystemDialog(
            "There are no customer sales records to export.",
            "No Records Found"
        );

        return;
    }

    const confirmed = await showSystemConfirm(
        "Are you sure you want to export the Customer Sales for the selected date range?",
        "Confirm Customer Sales Export"
    );

    if (!confirmed) return;

    const headers = [
        "Transaction ID",
        "Date",
        "Customer Type",
        "Gross Sales",
        "Discount",
        "Net Sales"
    ];

    downloadCSV(
        headers,
        rows,
        `CafeSense_Customer_Sales_${getExportDateSuffix()}.csv`
    );
}


/* =========================
   24. PRINT REPORT
========================= */

async function printReport() {
    if (filteredTransactions.length === 0) {
        showSystemDialog(
            "There are no sales records to print.",
            "No Records Found"
        );

        return;
    }

    const confirmed = await showSystemConfirm(
        "Are you sure you want to print the sales report for the selected date range?",
        "Confirm Print"
    );

    if (!confirmed) return;

    window.print();
}


/* =========================
   25. SIDEBAR RESPONSIVENESS
========================= */

const MOBILE_BREAKPOINT = 850;

const mobileSidebarToggle = document.getElementById(
    "mobileSidebarToggle"
);


function isMobileView() {
    return window.innerWidth <= MOBILE_BREAKPOINT;
}


function closeMobileSidebar() {
    if (!sidebar) return;

    sidebar.classList.remove("mobile-open");
    document.body.classList.remove("sidebar-overlay-active");

    if (mobileSidebarToggle) {
        mobileSidebarToggle.setAttribute(
            "aria-expanded",
            "false"
        );

        mobileSidebarToggle.setAttribute(
            "title",
            "Open Sidebar"
        );

        mobileSidebarToggle.setAttribute(
            "aria-label",
            "Open Sidebar"
        );
    }
}


function openMobileSidebar() {
    if (!sidebar) return;

    sidebar.classList.add("mobile-open");
    document.body.classList.add("sidebar-overlay-active");

    if (mobileSidebarToggle) {
        mobileSidebarToggle.setAttribute(
            "aria-expanded",
            "true"
        );

        mobileSidebarToggle.setAttribute(
            "title",
            "Close Sidebar"
        );

        mobileSidebarToggle.setAttribute(
            "aria-label",
            "Close Sidebar"
        );
    }
}


function applySidebarState() {
    if (!sidebar) return;

    if (isMobileView()) {
        sidebar.classList.remove("collapsed");
        closeMobileSidebar();
        return;
    }

    closeMobileSidebar();

    const isCollapsed =
        localStorage.getItem(SIDEBAR_STORAGE_KEY) === "true";

    sidebar.classList.toggle("collapsed", isCollapsed);
}


function setupSidebar() {
    if (!sidebar) return;

    applySidebarState();


    /* DESKTOP SIDEBAR TOGGLE */

    if (sidebarToggle) {
        sidebarToggle.addEventListener("click", function () {

            if (isMobileView()) return;

            const isCollapsed = sidebar.classList.toggle(
                "collapsed"
            );

            localStorage.setItem(
                SIDEBAR_STORAGE_KEY,
                String(isCollapsed)
            );

            sidebarToggle.setAttribute(
                "aria-expanded",
                String(!isCollapsed)
            );

            sidebarToggle.setAttribute(
                "title",
                isCollapsed ? "Expand Sidebar" : "Collapse Sidebar"
            );

            sidebarToggle.setAttribute(
                "aria-label",
                isCollapsed ? "Expand Sidebar" : "Collapse Sidebar"
            );
        });
    }


    /* MOBILE SIDEBAR TOGGLE */

    if (mobileSidebarToggle) {
        mobileSidebarToggle.addEventListener("click", function () {

            if (!isMobileView()) return;

            const isOpen = sidebar.classList.contains(
                "mobile-open"
            );

            if (isOpen) {
                closeMobileSidebar();
            } else {
                openMobileSidebar();
            }
        });
    }


    /* SIDEBAR CLOSE BUTTON */

    if (sidebarClose) {
        sidebarClose.addEventListener("click", function () {

            if (isMobileView()) {
                closeMobileSidebar();
            }
        });
    }


    /* ANALYTICS DROPDOWN - MATCHES DASHBOARD */

    if (analyticsDropdownToggle && analyticsNavList) {
        analyticsDropdownToggle.addEventListener("click", function () {

            const isCurrentlyCollapsed =
                analyticsNavList.classList.contains("collapsed");

            analyticsNavList.classList.toggle("collapsed");

            analyticsDropdownToggle.setAttribute(
                "aria-expanded",
                String(isCurrentlyCollapsed)
            );
        });
    }


    /* CLOSE SIDEBAR WHEN CLICKING OUTSIDE */

    document.addEventListener("click", function (event) {

        if (
            isMobileView() &&
            sidebar.classList.contains("mobile-open") &&
            !sidebar.contains(event.target) &&
            (!mobileSidebarToggle ||
                !mobileSidebarToggle.contains(event.target))
        ) {
            closeMobileSidebar();
        }
    });


    /* ESCAPE KEY */

    document.addEventListener("keydown", function (event) {

        if (event.key === "Escape") {
            closeMobileSidebar();
        }
    });


    /* CLOSE AFTER SELECTING A NAVIGATION LINK */

    document.querySelectorAll(".sidebar-nav a").forEach(link => {

        link.addEventListener("click", function () {

            if (isMobileView()) {
                closeMobileSidebar();
            }
        });
    });


    /* RESPONSIVE SCREEN SIZE */

    window.addEventListener("resize", applySidebarState);
}


/* =========================
   26. LOGOUT MODAL
========================= */

function setupLogout() {
    if (!logoutButton) {
        return;
    }

    let logoutModal = null;


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
                "button:not([disabled]), " +
                "[href], " +
                "input:not([disabled]), " +
                "select:not([disabled]), " +
                "textarea:not([disabled]), " +
                "[tabindex]:not([tabindex='-1'])"
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
            }

            else if (
                !event.shiftKey &&
                document.activeElement === lastElement
            ) {
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

        cancelButton.addEventListener("click", function () {
            closeLogoutModal();
        });

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
            if (logoutModal) {
                logoutModal.classList.add("show");
                cancelButton.focus();
            }
        });
    }


    logoutButton.addEventListener("click", function (event) {
        event.preventDefault();
        openLogoutModal();
    });
}


/* =========================
   27. EVENT LISTENERS
========================= */

function setupReportEvents() {
    generateReportBtn.addEventListener("click", generateReport);

    resetReportBtn.addEventListener("click", resetReportFilters);

    reportInterval.addEventListener("change", generateReport);

    exportSalesSummaryCsvBtn.addEventListener(
        "click",
        exportSalesSummaryCSV
    );

    exportCsvBtn.addEventListener(
        "click",
        exportTransactionsCSV
    );

    exportProductCsvBtn.addEventListener(
        "click",
        exportProductSalesCSV
    );

    exportCustomerCsvBtn.addEventListener(
        "click",
        exportCustomerSalesCSV
    );

    printReportBtn.addEventListener(
        "click",
        printReport
    );
}


/* =========================
   28. INITIALIZE PAGE
========================= */

async function initializeReportsPage() {
    updateCurrentDateTime();

    setDefaultDateFilters();

    setupReportEvents();
    setupSidebar();
    setupLogout();

    await loadTransactions();

    generateReport();
}

initializeReportsPage();


/* =========================
   29. REFRESH WHEN DATA CHANGES
========================= */

let reportRefreshInProgress = false;

async function refreshReportData() {

    if (reportRefreshInProgress) {
        return;
    }

    reportRefreshInProgress = true;

    try {

        await loadTransactions();

        const startValue = reportStartDate.value;
        const endValue = reportEndDate.value;

        if (!startValue || !endValue || startValue > endValue) {
            return;
        }

        generateReport();

    } finally {
        reportRefreshInProgress = false;
    }
}


// Refresh when returning to the Reports page.
window.addEventListener("pageshow", refreshReportData);

window.addEventListener("focus", refreshReportData);

document.addEventListener("visibilitychange", function () {
    if (!document.hidden) {
        refreshReportData();
    }
});