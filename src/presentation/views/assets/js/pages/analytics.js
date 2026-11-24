import { productApi } from "../api/productApi.js";
import { apiClient } from "../api/apiClient.js";

document.addEventListener("DOMContentLoaded", () => {

    // ==========================================
    // 1. STORAGE AND PAGE ELEMENTS
    // ==========================================

    const TRANSACTIONS_STORAGE_KEY = "cafeSenseTransactions";
    const PRODUCTS_STORAGE_KEY = "cafeSenseProducts";
    const SIDEBAR_STORAGE_KEY = "cafeSenseSidebarCollapsed";

    const sidebar = document.getElementById("sidebar");
    const sidebarToggle = document.getElementById("sidebarToggle");
    const mobileSidebarToggle = document.getElementById("mobileSidebarToggle");
    const sidebarClose = document.getElementById("sidebarClose");
    const logoutButton = document.getElementById("logout-btn");

    const analyticsDropdownToggle = document.getElementById("analyticsDropdownToggle");
    const analyticsNavList = document.getElementById("analyticsNavList");
    const analyticsPageContent = document.querySelector(".analytics-page-content");

    const currentDateElement = document.getElementById("current-date");
    const currentTimeElement = document.getElementById("current-time");

    const mobileMediaQuery = window.matchMedia("(max-width: 850px)");

    const CUSTOMER_TYPES = [
        "Senior/PWD",
        "Student",
        "General Customer"
    ];

    const PAYMENT_METHODS = [
        "Cash",
        "GCash",
        "Maya",
        "Card"
    ];

    const pesoFormatter = new Intl.NumberFormat("en-PH", {
        style: "currency",
        currency: "PHP",
        minimumFractionDigits: 2
    });

    const DAY_NAMES = [
        "Sunday",
        "Monday",
        "Tuesday",
        "Wednesday",
        "Thursday",
        "Friday",
        "Saturday"
    ];

    let allTransactions = [];
    let allProducts = [];
    let chartInstances = {};
    let analyticsValueLabelsRegistered = false;


    // ==========================================
    // 2. GENERAL HELPERS
    // ==========================================

    function getElement(id) {
        return document.getElementById(id);
    }

    function setText(id, value) {
        const element = getElement(id);

        if (element) {
            element.textContent = value;
        }
    }

    function formatCurrency(amount) {
        return pesoFormatter.format(Number(amount) || 0);
    }

    function formatNumber(number) {
        return (Number(number) || 0).toLocaleString("en-PH");
    }

    function escapeHTML(value) {
        return String(value ?? "").replace(/[&<>"']/g, character => {
            const characters = {
                "&": "&amp;",
                "<": "&lt;",
                ">": "&gt;",
                '"': "&quot;",
                "'": "&#039;"
            };

            return characters[character];
        });
    }

    function getTransactionsFromStorage() {
        try {
            const storedTransactions = JSON.parse(
                localStorage.getItem(TRANSACTIONS_STORAGE_KEY)
            );

            if (!Array.isArray(storedTransactions)) {
                return [];
            }

            let hasCategoryChanges = false;

            const updatedTransactions = storedTransactions.map(transaction => {
                if (!Array.isArray(transaction.items)) {
                    return transaction;
                }

                const updatedItems = transaction.items.map(item => {
                    const normalizedCategory = normalizeProductCategory(
                        item.category
                    );

                    if (
                        item.category &&
                        item.category !== normalizedCategory
                    ) {
                        hasCategoryChanges = true;

                        return {
                            ...item,
                            category: normalizedCategory
                        };
                    }

                    return item;
                });

                return {
                    ...transaction,
                    items: updatedItems
                };
            });

            if (hasCategoryChanges) {
                localStorage.setItem(
                    TRANSACTIONS_STORAGE_KEY,
                    JSON.stringify(updatedTransactions)
                );
            }

            return updatedTransactions;

        } catch (error) {
            console.error("Unable to load transactions:", error);
            return [];
        }
    }

    function getProductsFromStorage() {
        try {
            const storedProducts = JSON.parse(
                localStorage.getItem(PRODUCTS_STORAGE_KEY)
            );

            if (!Array.isArray(storedProducts)) {
                return [];
            }

            let hasCategoryChanges = false;

            const updatedProducts = storedProducts.map(product => {
                const normalizedCategory = normalizeProductCategory(
                    product.category
                );

                if (
                    product.category &&
                    product.category !== normalizedCategory
                ) {
                    hasCategoryChanges = true;

                    return {
                        ...product,
                        category: normalizedCategory
                    };
                }

                return product;
            });

            if (hasCategoryChanges) {
                localStorage.setItem(
                    PRODUCTS_STORAGE_KEY,
                    JSON.stringify(updatedProducts)
                );
            }

            return updatedProducts;

        } catch (error) {
            console.error("Unable to load products:", error);
            return [];
        }
    }

    function normalizeProductCategory(category) {
        if (
            String(category || "").trim().toLowerCase() === "pastries"
        ) {
            return "Pastry / Baked Good";
        }

        return category || "Uncategorized";
    }


    // ==========================================
    // 3. DATE HELPERS
    // ==========================================

    function parseTransactionDate(dateValue) {
        if (!dateValue) return null;

        if (dateValue instanceof Date) {
            return Number.isNaN(dateValue.getTime()) ? null : dateValue;
        }

        if (typeof dateValue === "number") {
            const date = new Date(dateValue);
            return Number.isNaN(date.getTime()) ? null : date;
        }

        const value = String(dateValue).trim();

        // MySQL DATETIME has no timezone, so parse it as local time.
        const mysqlDateTime = value.match(
            /^(\d{4})-(\d{2})-(\d{2})[ T](\d{2}):(\d{2}):(\d{2})(?:\.(\d+))?$/
        );

        if (mysqlDateTime) {
            const [
                ,
                year,
                month,
                day,
                hour,
                minute,
                second,
                fraction
            ] = mysqlDateTime;

            const milliseconds = fraction
                ? Number(`0.${fraction}`) * 1000
                : 0;

            const date = new Date(
                Number(year),
                Number(month) - 1,
                Number(day),
                Number(hour),
                Number(minute),
                Number(second),
                Math.floor(milliseconds)
            );

            return Number.isNaN(date.getTime()) ? null : date;
        }

        // ISO timestamps with timezone information.
        const parsedDate = new Date(value);

        return Number.isNaN(parsedDate.getTime())
            ? null
            : parsedDate;
    }

    // Prefer dateISO because it contains the transaction timestamp.
    // Fall back to date for older transactions without dateISO.
    function getTransactionDate(transaction) {
        return parseTransactionDate(transaction.dateISO) ||
            parseTransactionDate(transaction.date);
    }

    function getStartOfWeek(date) {
        const start = new Date(date);

        const day = start.getDay();
        const difference = day === 0 ? 6 : day - 1;

        start.setDate(start.getDate() - difference);
        start.setHours(0, 0, 0, 0);

        return start;
    }

    function formatHour(hour) {
        const date = new Date();
        date.setHours(hour, 0, 0, 0);

        return date.toLocaleTimeString("en-PH", {
            hour: "numeric",
            hour12: true
        });
    }

    function getDateRangeLabel(range, selectedYear) {
        const labels = {
            all: "all recorded transactions",
            today: "today's transactions",
            week: "this week's transactions",
            month: "this month's transactions",
            year: selectedYear === "all"
                ? "transactions from all recorded years"
                : `transactions from ${selectedYear}`
        };

        return labels[range] || "selected transactions";
    }

    function filterTransactionsByDate(
        transactions,
        range,
        selectedYear = "all"
    ) {
        const now = new Date();

        return transactions.filter(transaction => {
            const transactionDate = getTransactionDate(transaction);

            if (!transactionDate) return false;

            if (range === "all") {
                return true;
            }

            if (range === "today") {
                return transactionDate.toDateString() === now.toDateString();
            }

            if (range === "week") {
                const startOfWeek = getStartOfWeek(now);

                const endOfWeek = new Date(startOfWeek);
                endOfWeek.setDate(endOfWeek.getDate() + 7);

                return transactionDate >= startOfWeek &&
                    transactionDate < endOfWeek;
            }

            if (range === "month") {
                return transactionDate.getMonth() === now.getMonth() &&
                    transactionDate.getFullYear() === now.getFullYear();
            }

            if (range === "year") {
                // "All Years" must include every recorded year.
                if (selectedYear === "all") {
                    return true;
                }

                return transactionDate.getFullYear() === Number(selectedYear);
            }

            return true;
        });
    }


    // ==========================================
    // 4. TRANSACTION DATA HELPERS
    // ==========================================

    function getTransactionItems(transactions) {
        return transactions.flatMap(transaction => {
            return Array.isArray(transaction.items)
                ? transaction.items
                : [];
        });
    }

    function getTransactionTotal(transaction) {
        return Number(transaction.total) || 0;
    }

    function getItemQuantity(item) {
        return Number(item.quantity) || 0;
    }

    function getItemGrossSubtotal(item) {
        if (item.lineSubtotal !== undefined) {
            return Number(item.lineSubtotal) || 0;
        }

        return (
            (Number(item.price) || 0) *
            getItemQuantity(item)
        );
    }

    function getItemNetSales(item) {
        if (item.lineTotal !== undefined) {
            return Number(item.lineTotal) || 0;
        }

        return (
            (Number(item.price) || 0) *
            getItemQuantity(item)
        );
    }

    function getItemDiscount(item) {
        if (item.lineDiscount !== undefined) {
            return Number(item.lineDiscount) || 0;
        }

        return getItemGrossSubtotal(item) - getItemNetSales(item);
    }


    // ==========================================
    // 5. CHART HELPERS
    // ==========================================

    const analyticsValueLabels = {
        id: "analyticsValueLabels",

        afterDatasetsDraw(chart, args, options) {
            if (options.display === false) return;

            const { ctx } = chart;

            ctx.save();

            ctx.font = "600 11px DM Sans, sans-serif";
            ctx.fillStyle = "#6f625b";
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";

            chart.data.datasets.forEach((dataset, datasetIndex) => {
                const meta = chart.getDatasetMeta(datasetIndex);

                if (meta.hidden) return;

                const values = dataset.data || [];

                // DOUGHNUT CHART PERCENTAGES
                if (chart.config.type === "doughnut") {
                    const total = values.reduce(
                        (sum, value) => sum + (Number(value) || 0),
                        0
                    );

                    if (!total) return;

                    meta.data.forEach((arc, index) => {
                        const value = Number(values[index]) || 0;
                        const percentage = (value / total) * 100;

                        // Avoid clutter on very small segments.
                        if (percentage < 5) return;

                        const position = arc.tooltipPosition();

                        ctx.fillStyle = "#ffffff";

                        ctx.fillText(
                            `${percentage.toFixed(1)}%`,
                            position.x,
                            position.y
                        );
                    });

                    return;
                }

                // NUMERICAL LABELS FOR BAR AND LINE CHARTS
                meta.data.forEach((element, index) => {
                    const value = Number(values[index]) || 0;

                    if (chart.config.options.indexAxis === "y") {
                        ctx.textAlign = "left";
                        ctx.fillStyle = "#6f625b";

                        ctx.fillText(
                            value.toLocaleString("en-PH"),
                            element.x + 7,
                            element.y
                        );

                    } else if (chart.config.type === "line") {
                        ctx.textAlign = "center";
                        ctx.fillStyle = "#6f625b";

                        ctx.fillText(
                            value.toLocaleString("en-PH"),
                            element.x,
                            element.y - 12
                        );

                    } else {
                        ctx.textAlign = "center";
                        ctx.fillStyle = "#6f625b";

                        ctx.fillText(
                            value.toLocaleString("en-PH"),
                            element.x,
                            element.y - 10
                        );
                    }
                });
            });

            ctx.restore();
        }
    };

    function createChart(canvasId, config) {
        const canvas = getElement(canvasId);

        if (!canvas || typeof Chart === "undefined") {
            return;
        }

        // Register the custom value-label plugin only once.
        if (!analyticsValueLabelsRegistered) {
            Chart.register(analyticsValueLabels);
            analyticsValueLabelsRegistered = true;
        }

        if (chartInstances[canvasId]) {
            chartInstances[canvasId].destroy();
        }

        chartInstances[canvasId] = new Chart(canvas, config);
    }

    function getChartOptions() {
        return {
            responsive: true,
            maintainAspectRatio: false,

            plugins: {
                legend: {
                    labels: {
                        font: {
                            family: "DM Sans"
                        },
                        color: "#6f625b",
                        padding: 16
                    }
                }
            }
        };
    }

    function getDoughnutOptions() {
        return {
            ...getChartOptions(),

            plugins: {
                ...getChartOptions().plugins,

                legend: {
                    position: "bottom",

                    labels: {
                        padding: 18,
                        color: "#6f625b",

                        font: {
                            family: "DM Sans"
                        }
                    }
                }
            }
        };
    }

    function showEmptyTable(bodyId, colspan, message) {
        const body = getElement(bodyId);

        if (!body) return;

        body.innerHTML = `
            <tr>
                <td colspan="${colspan}" class="empty-message">
                    ${escapeHTML(message)}
                </td>
            </tr>
        `;
    }


    // ==========================================
    // 6. FILTER HELPERS
    // ==========================================

    function getDateFilteredTransactions(dateFilterId) {
        const filter = getElement(dateFilterId);
        const range = filter ? filter.value : "all";

        const yearFilterId = dateFilterId.replace(
            "DateFilter",
            "YearFilter"
        );

        const yearFilter = getElement(yearFilterId);
        const selectedYear = yearFilter ? yearFilter.value : "all";

        return filterTransactionsByDate(
            allTransactions,
            range,
            selectedYear
        );
    }

    function updateFilterResult(elementId, transactions, range) {
        const dateFilterId = elementId.replace(
            "FilterResult",
            "DateFilter"
        );

        const yearFilterId = dateFilterId.replace(
            "DateFilter",
            "YearFilter"
        );

        const yearFilter = getElement(yearFilterId);
        const selectedYear = yearFilter ? yearFilter.value : "all";

        setText(
            elementId,
            `Showing ${formatNumber(transactions.length)} transaction(s) from ${getDateRangeLabel(range, selectedYear)}.`
        );
    }

    function populateYearFilters() {
        const yearFilterIds = [
            "salesYearFilter",
            "paymentYearFilter",
            "customerYearFilter",
            "productYearFilter",
            "peakYearFilter"
        ];

        const years = [
            ...new Set(
                allTransactions
                    .map(transaction => getTransactionDate(transaction))
                    .filter(Boolean)
                    .map(date => date.getFullYear())
            )
        ].sort((a, b) => b - a);

        const currentYear = new Date().getFullYear();

        yearFilterIds.forEach(id => {
            const filter = getElement(id);

            if (!filter) return;

            const previousValue = filter.value;

            filter.innerHTML = `
                <option value="all">All Years</option>
                ${years.map(year => `
                    <option value="${year}">${year}</option>
                `).join("")}
            `;

            if (years.includes(Number(previousValue))) {
                filter.value = previousValue;

            } else if (years.includes(currentYear)) {
                filter.value = String(currentYear);

            } else {
                filter.value = "all";
            }
        });
    }


    // ==========================================
    // 7. SALES ANALYTICS
    // ==========================================

    function renderSalesAnalytics() {
        const dateFilter = getElement("salesDateFilter");
        const groupFilter = getElement("salesGroupBy");

        const range = dateFilter.value;
        const groupBy = groupFilter.value;

        const transactions = getDateFilteredTransactions(
            "salesDateFilter"
        );

        updateFilterResult(
            "salesFilterResult",
            transactions,
            range
        );

        const items = getTransactionItems(transactions);

        const grossSubtotal = items.reduce(
            (sum, item) => sum + getItemGrossSubtotal(item),
            0
        );

        const totalDiscount = items.reduce(
            (sum, item) => sum + getItemDiscount(item),
            0
        );

        const netSales = transactions.reduce(
            (sum, transaction) => sum + getTransactionTotal(transaction),
            0
        );

        const averageOrder = transactions.length > 0
            ? netSales / transactions.length
            : 0;

        setText("salesGrossSubtotal", formatCurrency(grossSubtotal));
        setText("salesTotalDiscount", formatCurrency(totalDiscount));
        setText("salesNetTotal", formatCurrency(netSales));
        setText("salesAverageOrder", formatCurrency(averageOrder));

        const groupedSales = {};

        transactions.forEach(transaction => {
            const date = getTransactionDate(transaction);

            if (!date) return;

            let groupKey;
            let groupLabel;

            if (groupBy === "daily") {
                groupKey = [
                    date.getFullYear(),
                    date.getMonth(),
                    date.getDate()
                ].join("-");

                groupLabel = date.toLocaleDateString("en-PH", {
                    month: "short",
                    day: "numeric",
                    year: "numeric"
                });

            } else if (groupBy === "weekly") {
                const weekStart = getStartOfWeek(date);

                groupKey = [
                    weekStart.getFullYear(),
                    weekStart.getMonth(),
                    weekStart.getDate()
                ].join("-");

                groupLabel = `Week of ${weekStart.toLocaleDateString("en-PH", {
                    month: "short",
                    day: "numeric",
                    year: "numeric"
                })}`;

            } else {
                groupKey = [
                    date.getFullYear(),
                    date.getMonth()
                ].join("-");

                groupLabel = date.toLocaleDateString("en-PH", {
                    month: "long",
                    year: "numeric"
                });
            }

            if (!groupedSales[groupKey]) {
                groupedSales[groupKey] = {
                    label: groupLabel,
                    sales: 0,
                    sortDate: new Date(date)
                };
            }

            groupedSales[groupKey].sales += getTransactionTotal(
                transaction
            );
        });

        const sortedSales = Object.values(groupedSales).sort(
            (a, b) => a.sortDate - b.sortDate
        );

        createChart("salesTrendChart", {
            type: "line",

            data: {
                labels: sortedSales.map(group => group.label),

                datasets: [{
                    label: "Net Sales",
                    data: sortedSales.map(group => group.sales),
                    borderColor: "#b97845",
                    backgroundColor: "rgba(185, 120, 69, 0.12)",
                    fill: true,
                    tension: 0.35,
                    pointRadius: 4,
                    pointBackgroundColor: "#986039"
                }]
            },

            options: {
                ...getChartOptions(),

                scales: {
                    y: {
                        beginAtZero: true,

                        ticks: {
                            callback: value => "₱" + value
                        }
                    }
                }
            }
        });

        if (transactions.length === 0) {
            setText("salesInsightTitle", "No sales data available");

            setText(
                "salesInsightText",
                "Record transactions through the POS to generate sales performance insights."
            );

            return;
        }

        setText(
            "salesInsightTitle",
            `Your café recorded ${formatCurrency(netSales)} in net sales.`
        );

        setText(
            "salesInsightText",
            `Across ${formatNumber(transactions.length)} transaction(s), the average transaction value was ${formatCurrency(averageOrder)}. Total discounts amounted to ${formatCurrency(totalDiscount)}.`
        );
    }


    // ==========================================
    // 8. PAYMENT ANALYTICS
    // ==========================================

    function renderPaymentAnalytics() {
        const range = getElement("paymentDateFilter").value;

        const selectedMethod = getElement(
            "paymentMethodFilter"
        ).value;

        // Keep the complete date-filtered list for percentage calculations.
        const dateFilteredTransactions = getDateFilteredTransactions(
            "paymentDateFilter"
        );

        let transactions = [...dateFilteredTransactions];

        if (selectedMethod !== "all") {
            transactions = transactions.filter(transaction => {
                return transaction.paymentMethod === selectedMethod;
            });
        }

        updateFilterResult(
            "paymentFilterResult",
            transactions,
            range
        );

        const paymentData = {};

        PAYMENT_METHODS.forEach(method => {
            paymentData[method] = {
                transactions: 0,
                sales: 0
            };
        });

        transactions.forEach(transaction => {
            const method = transaction.paymentMethod;

            if (!method) return;

            if (!paymentData[method]) {
                paymentData[method] = {
                    transactions: 0,
                    sales: 0
                };
            }

            paymentData[method].transactions++;

            paymentData[method].sales += getTransactionTotal(
                transaction
            );
        });

        const methods = Object.keys(paymentData).filter(method => {
            return paymentData[method].transactions > 0;
        });

        createChart("paymentDistributionChart", {
            type: "doughnut",

            data: {
                labels: methods,

                datasets: [{
                    data: methods.map(method => {
                        return paymentData[method].transactions;
                    }),

                    backgroundColor: [
                        "#b97845",
                        "#d9a06f",
                        "#8d654d",
                        "#c7a58b"
                    ],

                    borderWidth: 2,
                    borderColor: "#ffffff"
                }]
            },

            options: getDoughnutOptions()
        });

        if (methods.length === 0) {
            showEmptyTable(
                "paymentBreakdownBody",
                3,
                "No payment data available."
            );

            setText("paymentInsightTitle", "No payment data available");

            setText(
                "paymentInsightText",
                "Payment insights will appear after transactions matching your selected filters are recorded."
            );

            return;
        }

        const tableBody = getElement("paymentBreakdownBody");

        tableBody.innerHTML = methods.map(method => {
            return `
                <tr>
                    <td>${escapeHTML(method)}</td>
                    <td>${formatNumber(paymentData[method].transactions)}</td>
                    <td>${formatCurrency(paymentData[method].sales)}</td>
                </tr>
            `;
        }).join("");

        const topMethod = methods.reduce((best, method) => {
            return paymentData[method].transactions >
                paymentData[best].transactions
                ? method
                : best;
        }, methods[0]);

        const topCount = paymentData[topMethod].transactions;

        // Compare against all transactions in the selected date range.
        const percentage = dateFilteredTransactions.length > 0
            ? (topCount / dateFilteredTransactions.length) * 100
            : 0;

        setText(
            "paymentInsightTitle",
            `${topMethod} is the most frequently used payment method.`
        );

        setText(
            "paymentInsightText",
            `It was used in ${formatNumber(topCount)} transaction(s), representing ${percentage.toFixed(1)}% of all transactions in the selected date range.`
        );
    }


    // ==========================================
    // 9. CUSTOMER ANALYTICS
    // ==========================================

    function renderCustomerAnalytics() {
        const range = getElement("customerDateFilter").value;

        const selectedType = getElement(
            "customerTypeFilter"
        ).value;

        const dateFilteredTransactions = getDateFilteredTransactions(
            "customerDateFilter"
        );

        const customerData = {};

        CUSTOMER_TYPES.forEach(type => {
            customerData[type] = {
                units: 0,
                sales: 0,
                discounts: 0
            };
        });

        const items = getTransactionItems(
            dateFilteredTransactions
        );

        items.forEach(item => {
            const type = item.customerType;

            if (!type) return;

            if (selectedType !== "all" && type !== selectedType) {
                return;
            }

            if (!customerData[type]) {
                customerData[type] = {
                    units: 0,
                    sales: 0,
                    discounts: 0
                };
            }

            customerData[type].units += getItemQuantity(item);
            customerData[type].sales += getItemNetSales(item);
            customerData[type].discounts += getItemDiscount(item);
        });

        const types = Object.keys(customerData).filter(type => {
            return customerData[type].units > 0;
        });

        const matchingTransactions = selectedType === "all"
            ? dateFilteredTransactions
            : dateFilteredTransactions.filter(transaction => {
                return Array.isArray(transaction.items) &&
                    transaction.items.some(item => {
                        return item.customerType === selectedType;
                    });
            });

        updateFilterResult(
            "customerFilterResult",
            matchingTransactions,
            range
        );

        createChart("customerDistributionChart", {
            type: "doughnut",

            data: {
                labels: types,

                datasets: [{
                    data: types.map(type => customerData[type].units),

                    backgroundColor: [
                        "#b97845",
                        "#d9a06f",
                        "#8d654d"
                    ],

                    borderWidth: 2,
                    borderColor: "#ffffff"
                }]
            },

            options: getDoughnutOptions()
        });

        if (types.length === 0) {
            showEmptyTable(
                "customerBreakdownBody",
                3,
                "No customer data available."
            );

            setText("customerInsightTitle", "No customer data available");

            setText(
                "customerInsightText",
                "Customer insights will appear after customer types are recorded in POS transactions."
            );

            return;
        }

        const tableBody = getElement("customerBreakdownBody");

        tableBody.innerHTML = types.map(type => {
            return `
                <tr>
                    <td>${escapeHTML(type)}</td>
                    <td>${formatNumber(customerData[type].units)}</td>
                    <td>${formatCurrency(customerData[type].sales)}</td>
                </tr>
            `;
        }).join("");

        const topType = types.reduce((best, type) => {
            return customerData[type].units >
                customerData[best].units
                ? type
                : best;
        }, types[0]);

        const totalUnits = types.reduce((sum, type) => {
            return sum + customerData[type].units;
        }, 0);

        const topPercentage = (
            customerData[topType].units / totalUnits
        ) * 100;

        setText(
            "customerInsightTitle",
            `${topType} accounts for the most product units purchased.`
        );

        setText(
            "customerInsightText",
            `${topType} accounts for ${topPercentage.toFixed(1)}% of the product units sold in the selected customer data. This is based on product-line customer types, not individual customer headcounts.`
        );
    }


    // ==========================================
    // 10. PRODUCT ANALYTICS
    // ==========================================

    function getProductCategory(item) {
        if (item.category) {
            return normalizeProductCategory(item.category);
        }

        const matchingProduct = allProducts.find(product => {
            return String(product.id) === String(item.productId) ||
                product.name === item.name;
        });

        return normalizeProductCategory(
            matchingProduct?.category
        );
    }

    function getProductIdentity(product) {
        if (product.id !== undefined && product.id !== null) {
            return String(product.id);
        }

        return String(product.name || "");
    }

    function populateProductFilters() {
        const categoryFilter = getElement("productCategoryFilter");
        const productFilter = getElement("productFilter");

        if (!categoryFilter || !productFilter) return;

        const previousCategory = categoryFilter.value;
        const previousProduct = productFilter.value;

        const categories = [
            ...new Set(
                allProducts
                    .map(product => normalizeProductCategory(product.category))
                    .filter(Boolean)
            )
        ].sort();

        categoryFilter.innerHTML = `
            <option value="all">All Categories</option>
            ${categories.map(category => `
                <option value="${escapeHTML(category)}">
                    ${escapeHTML(category)}
                </option>
            `).join("")}
        `;

        if (categories.includes(previousCategory)) {
            categoryFilter.value = previousCategory;
        }

        populateProductOptions(previousProduct);
    }

    function populateProductOptions(previousProduct = "all") {
        const categoryFilter = getElement("productCategoryFilter");
        const productFilter = getElement("productFilter");

        if (!categoryFilter || !productFilter) return;

        const selectedCategory = categoryFilter.value;

        const filteredProducts = allProducts.filter(product => {
            return selectedCategory === "all" ||
                normalizeProductCategory(product.category) === selectedCategory;
        });

        productFilter.innerHTML = `
            <option value="all">All Products</option>
            ${filteredProducts.map(product => `
                <option value="${escapeHTML(getProductIdentity(product))}">
                    ${escapeHTML(product.name || "Unnamed Product")}
                </option>
            `).join("")}
        `;

        const productExists = filteredProducts.some(product => {
            return getProductIdentity(product) === previousProduct;
        });

        productFilter.value = productExists
            ? previousProduct
            : "all";
    }

    function renderProductAnalytics() {
        const range = getElement("productDateFilter").value;

        const selectedCategory = getElement(
            "productCategoryFilter"
        ).value;

        const selectedProduct = getElement(
            "productFilter"
        ).value;

        const transactions = getDateFilteredTransactions(
            "productDateFilter"
        );

        const items = getTransactionItems(transactions);

        const productData = {};

        items.forEach(item => {
            const category = getProductCategory(item);

            const matchingProduct = allProducts.find(product => {
                return String(product.id) === String(item.productId) ||
                    product.name === item.name;
            });

            const identity = matchingProduct
                ? getProductIdentity(matchingProduct)
                : String(item.productId || item.name || "unknown");

            const productName = item.name ||
                matchingProduct?.name ||
                "Unnamed Product";

            if (
                selectedCategory !== "all" &&
                category !== selectedCategory
            ) {
                return;
            }

            if (
                selectedProduct !== "all" &&
                identity !== selectedProduct
            ) {
                return;
            }

            if (!productData[identity]) {
                productData[identity] = {
                    name: productName,
                    units: 0,
                    sales: 0
                };
            }

            productData[identity].units += getItemQuantity(item);
            productData[identity].sales += getItemNetSales(item);
        });

        const sortedProducts = Object.values(productData)
            .sort((a, b) => b.units - a.units);

        const topProducts = sortedProducts.slice(0, 5);

        const matchingTransactions = selectedProduct === "all" &&
            selectedCategory === "all"
            ? transactions
            : transactions.filter(transaction => {
                return Array.isArray(transaction.items) &&
                    transaction.items.some(item => {
                        const category = getProductCategory(item);

                        const matchingProduct = allProducts.find(product => {
                            return String(product.id) === String(item.productId) ||
                                product.name === item.name;
                        });

                        const identity = matchingProduct
                            ? getProductIdentity(matchingProduct)
                            : String(item.productId || item.name || "unknown");

                        const categoryMatches =
                            selectedCategory === "all" ||
                            category === selectedCategory;

                        const productMatches =
                            selectedProduct === "all" ||
                            identity === selectedProduct;

                        return categoryMatches && productMatches;
                    });
            });

        updateFilterResult(
            "productFilterResult",
            matchingTransactions,
            range
        );

        createChart("topProductsChart", {
            type: "bar",

            data: {
                labels: topProducts.map(product => product.name),

                datasets: [{
                    label: "Units Sold",
                    data: topProducts.map(product => product.units),
                    backgroundColor: "#b97845",
                    borderRadius: 6
                }]
            },

            options: {
                ...getChartOptions(),

                indexAxis: "y",

                scales: {
                    x: {
                        beginAtZero: true,

                        ticks: {
                            precision: 0
                        }
                    }
                },

                plugins: {
                    ...getChartOptions().plugins,

                    legend: {
                        display: false
                    }
                }
            }
        });

        if (sortedProducts.length === 0) {
            showEmptyTable(
                "productBreakdownBody",
                3,
                "No product data available."
            );

            setText("productInsightTitle", "No product data available");

            setText(
                "productInsightText",
                "Product performance insights will appear after products matching your selected filters are sold through the POS."
            );

            return;
        }

        const tableBody = getElement("productBreakdownBody");

        tableBody.innerHTML = sortedProducts.map(product => {
            return `
                <tr>
                    <td>${escapeHTML(product.name)}</td>
                    <td>${formatNumber(product.units)}</td>
                    <td>${formatCurrency(product.sales)}</td>
                </tr>
            `;
        }).join("");

        const bestProduct = sortedProducts[0];

        setText(
            "productInsightTitle",
            `${bestProduct.name} is the best-selling product.`
        );

        setText(
            "productInsightText",
            `It recorded ${formatNumber(bestProduct.units)} unit(s) sold and generated ${formatCurrency(bestProduct.sales)} in net sales during the selected period.`
        );
    }
    // ==========================================
    // 11. PEAK HOURS ANALYTICS
    // ==========================================

    function renderPeakHoursAnalytics() {
        const range = getElement("peakDateFilter").value;
        const selectedDay = getElement("peakDayFilter").value;

        let transactions = getDateFilteredTransactions(
            "peakDateFilter"
        );

        if (selectedDay !== "all") {
            transactions = transactions.filter(transaction => {
                const date = getTransactionDate(transaction);

                return date && date.getDay() === Number(selectedDay);
            });
        }

        updateFilterResult(
            "peakFilterResult",
            transactions,
            range
        );

        const hourlyData = {};

        for (let hour = 0; hour < 24; hour++) {
            hourlyData[hour] = {
                transactions: 0,
                sales: 0
            };
        }

        transactions.forEach(transaction => {
            const date = getTransactionDate(transaction);

            if (!date) return;

            const hour = date.getHours();

            hourlyData[hour].transactions++;

            hourlyData[hour].sales += getTransactionTotal(
                transaction
            );
        });

        const labels = Array.from({ length: 24 }, (_, hour) => {
            return formatHour(hour);
        });

        const transactionCounts = Array.from(
            { length: 24 },
            (_, hour) => hourlyData[hour].transactions
        );

        createChart("peakHoursChart", {
            type: "bar",

            data: {
                labels,

                datasets: [{
                    label: "Transactions",
                    data: transactionCounts,
                    backgroundColor: "#b97845",
                    borderRadius: 5
                }]
            },

            options: {
                ...getChartOptions(),

                scales: {
                    y: {
                        beginAtZero: true,

                        ticks: {
                            precision: 0
                        }
                    },

                    x: {
                        ticks: {
                            maxRotation: 45,
                            minRotation: 45
                        }
                    }
                }
            }
        });

        const activeHours = Object.keys(hourlyData).filter(hour => {
            return hourlyData[hour].transactions > 0;
        });

        if (activeHours.length === 0) {
            setText("peakHourValue", "N/A");

            setText(
                "peakHourTransactions",
                "No transactions recorded."
            );

            setText("peakHourSales", formatCurrency(0));

            setText("peakInsightTitle", "No hourly data available");

            setText(
                "peakInsightText",
                "Peak-hour insights will appear once transactions with valid date and time records are available."
            );

            return;
        }

        const peakHour = activeHours.reduce((best, hour) => {
            return hourlyData[hour].transactions >
                hourlyData[best].transactions
                ? hour
                : best;
        }, activeHours[0]);

        const peakData = hourlyData[peakHour];

        setText(
            "peakHourValue",
            formatHour(Number(peakHour))
        );

        setText(
            "peakHourTransactions",
            `${formatNumber(peakData.transactions)} transaction(s) recorded`
        );

        setText(
            "peakHourSales",
            formatCurrency(peakData.sales)
        );

        setText(
            "peakInsightTitle",
            `${formatHour(Number(peakHour))} is the busiest recorded hour.`
        );

        setText(
            "peakInsightText",
            `Your café recorded ${formatNumber(peakData.transactions)} transaction(s) during this hour, generating ${formatCurrency(peakData.sales)} in net sales.`
        );
    }


    // ==========================================
    // 12. UPDATE INDIVIDUAL ANALYTICS
    // ==========================================

    function updateSalesAnalytics() {
        renderSalesAnalytics();
    }

    function updatePaymentAnalytics() {
        renderPaymentAnalytics();
    }

    function updateCustomerAnalytics() {
        renderCustomerAnalytics();
    }

    function updateProductAnalytics() {
        renderProductAnalytics();
    }

    function updatePeakHoursAnalytics() {
        renderPeakHoursAnalytics();
    }


    // ==========================================
    // 13. FILTER BUTTONS
    // ==========================================

    function setupFilters() {

        // SALES

        getElement("applySalesFilter").addEventListener(
            "click",
            updateSalesAnalytics
        );

        getElement("resetSalesFilter").addEventListener("click", () => {
            getElement("salesDateFilter").value = "all";
            getElement("salesYearFilter").value = "all";
            getElement("salesGroupBy").value = "daily";

            updateSalesAnalytics();
        });


        // PAYMENT

        getElement("applyPaymentFilter").addEventListener(
            "click",
            updatePaymentAnalytics
        );

        getElement("resetPaymentFilter").addEventListener("click", () => {
            getElement("paymentDateFilter").value = "all";
            getElement("paymentYearFilter").value = "all";
            getElement("paymentMethodFilter").value = "all";

            updatePaymentAnalytics();
        });


        // CUSTOMER

        getElement("applyCustomerFilter").addEventListener(
            "click",
            updateCustomerAnalytics
        );

        getElement("resetCustomerFilter").addEventListener("click", () => {
            getElement("customerDateFilter").value = "all";
            getElement("customerYearFilter").value = "all";
            getElement("customerTypeFilter").value = "all";

            updateCustomerAnalytics();
        });


        // PRODUCT

        getElement("productCategoryFilter").addEventListener(
            "change",
            () => {
                populateProductOptions();
            }
        );

        getElement("applyProductFilter").addEventListener(
            "click",
            updateProductAnalytics
        );

        getElement("resetProductFilter").addEventListener("click", () => {
            getElement("productDateFilter").value = "all";
            getElement("productYearFilter").value = "all";
            getElement("productCategoryFilter").value = "all";

            populateProductOptions();

            getElement("productFilter").value = "all";

            updateProductAnalytics();
        });


        // PEAK HOURS

        getElement("applyPeakFilter").addEventListener(
            "click",
            updatePeakHoursAnalytics
        );

        getElement("resetPeakFilter").addEventListener("click", () => {
            getElement("peakDateFilter").value = "all";
            getElement("peakYearFilter").value = "all";
            getElement("peakDayFilter").value = "all";

            updatePeakHoursAnalytics();
        });
    }


    // ==========================================
    // 14. SIDEBAR STATE HELPERS
    // ==========================================

    function isMobileView() {
        return mobileMediaQuery.matches;
    }

    function updateDesktopSidebarToggle() {
        if (!sidebarToggle || !sidebar) return;

        const isCollapsed = sidebar.classList.contains("collapsed");

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
            isCollapsed ? "Expand sidebar" : "Collapse sidebar"
        );
    }

    function updateMobileSidebarToggle(isOpen) {
        if (!mobileSidebarToggle) return;

        mobileSidebarToggle.setAttribute(
            "aria-expanded",
            String(isOpen)
        );

        mobileSidebarToggle.setAttribute(
            "title",
            isOpen ? "Close Navigation" : "Open Navigation"
        );

        mobileSidebarToggle.setAttribute(
            "aria-label",
            isOpen ? "Close navigation" : "Open navigation"
        );
    }

    function openMobileSidebar() {
        if (!sidebar || !isMobileView()) return;

        sidebar.classList.add("mobile-open");

        document.body.classList.add("sidebar-overlay-active");

        updateMobileSidebarToggle(true);
    }

    function closeMobileSidebar() {
        if (!sidebar) return;

        sidebar.classList.remove("mobile-open");

        document.body.classList.remove("sidebar-overlay-active");

        updateMobileSidebarToggle(false);
    }


    // ==========================================
    // 15. ANALYTICS DROPDOWN
    // ==========================================

    function setupAnalyticsDropdown() {
        if (!analyticsDropdownToggle || !analyticsNavList) {
            return;
        }

        analyticsDropdownToggle.addEventListener("click", () => {
            analyticsDropdownToggle.classList.add("active");

            // Toggle the submenu without expanding the sidebar.
            const isExpanded =
                analyticsDropdownToggle.getAttribute("aria-expanded") === "true";

            analyticsDropdownToggle.setAttribute(
                "aria-expanded",
                String(!isExpanded)
            );

            analyticsNavList.classList.toggle(
                "collapsed",
                isExpanded
            );
        });
    }


    // ==========================================
    // 16. SIDEBAR TOGGLE
    // ==========================================

    function setupSidebar() {
        if (!sidebar) return;

        // Restore saved desktop sidebar state.
        let savedCollapsedState = false;

        try {
            savedCollapsedState =
                localStorage.getItem(SIDEBAR_STORAGE_KEY) === "true";
        } catch (error) {
            console.warn("Unable to load sidebar preference:", error);
        }

        function applySidebarState() {
            if (isMobileView()) {
                sidebar.classList.remove("collapsed");

                closeMobileSidebar();

            } else {
                closeMobileSidebar();

                sidebar.classList.toggle(
                    "collapsed",
                    savedCollapsedState
                );

                updateDesktopSidebarToggle();
            }
        }

        // DESKTOP COLLAPSE / EXPAND

        if (sidebarToggle) {
            sidebarToggle.addEventListener("click", () => {
                if (isMobileView()) {
                    return;
                }

                sidebar.classList.toggle("collapsed");

                savedCollapsedState =
                    sidebar.classList.contains("collapsed");

                try {
                    localStorage.setItem(
                        SIDEBAR_STORAGE_KEY,
                        String(savedCollapsedState)
                    );
                } catch (error) {
                    console.warn("Unable to save sidebar preference:", error);
                }

                updateDesktopSidebarToggle();
            });
        }

        // MOBILE OPEN

        if (mobileSidebarToggle) {
            mobileSidebarToggle.addEventListener("click", () => {
                if (!isMobileView()) return;

                if (sidebar.classList.contains("mobile-open")) {
                    closeMobileSidebar();
                } else {
                    openMobileSidebar();
                }
            });
        }

        // MOBILE CLOSE BUTTON

        if (sidebarClose) {
            sidebarClose.addEventListener("click", () => {
                closeMobileSidebar();
            });
        }

        // CLOSE WHEN CLICKING OUTSIDE THE SIDEBAR

        document.addEventListener("click", event => {
            if (
                isMobileView() &&
                sidebar.classList.contains("mobile-open") &&
                !sidebar.contains(event.target) &&
                !mobileSidebarToggle?.contains(event.target)
            ) {
                closeMobileSidebar();
            }
        });

        // CLOSE WHEN PRESSING ESCAPE

        document.addEventListener("keydown", event => {
            if (
                event.key === "Escape" &&
                isMobileView() &&
                sidebar.classList.contains("mobile-open")
            ) {
                closeMobileSidebar();

                if (mobileSidebarToggle) {
                    mobileSidebarToggle.focus();
                }
            }
        });

        // HANDLE SCREEN SIZE CHANGES

        function handleSidebarResize() {
            if (isMobileView()) {
                sidebar.classList.remove("collapsed");

                closeMobileSidebar();

            } else {
                closeMobileSidebar();

                sidebar.classList.toggle(
                    "collapsed",
                    savedCollapsedState
                );

                updateDesktopSidebarToggle();
            }
        }

        if (mobileMediaQuery.addEventListener) {
            mobileMediaQuery.addEventListener(
                "change",
                handleSidebarResize
            );
        } else {
            mobileMediaQuery.addListener(handleSidebarResize);
        }

        applySidebarState();
    }


    // ==========================================
    // 17. ANALYTICS SECTION NAVIGATION
    // ==========================================

    function setupAnalyticsNavigation() {
        const navigationLinks = document.querySelectorAll(
            ".analytics-nav-item"
        );

        const sections = document.querySelectorAll(
            ".analytics-section"
        );

        // Always highlight the parent Analytics & Insights item.
        if (analyticsDropdownToggle) {
            analyticsDropdownToggle.classList.add("active");
        }

        function updateActiveSubmenu(activeSectionId) {
            navigationLinks.forEach(link => {
                link.classList.toggle(
                    "active",
                    link.dataset.section === activeSectionId
                );
            });
        }

        navigationLinks.forEach(link => {
            link.addEventListener("click", event => {
                event.preventDefault();

                const sectionId = link.dataset.section;
                const targetSection = getElement(sectionId);

                if (!targetSection) return;

                updateActiveSubmenu(sectionId);

                if (analyticsNavList) {
                    analyticsNavList.classList.remove("collapsed");
                }

                if (analyticsDropdownToggle) {
                    analyticsDropdownToggle.setAttribute(
                        "aria-expanded",
                        "true"
                    );
                }

                targetSection.scrollIntoView({
                    behavior: "smooth",
                    block: "start"
                });

                if (isMobileView()) {
                    closeMobileSidebar();
                }
            });
        });

        const observer = new IntersectionObserver(entries => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    updateActiveSubmenu(entry.target.id);
                }
            });

        }, {
            root: analyticsPageContent,
            rootMargin: "-15% 0px -70% 0px",
            threshold: 0
        });

        sections.forEach(section => {
            observer.observe(section);
        });
    }


    // ==========================================
    // 18. LOGOUT CONFIRMATION MODAL
    // ==========================================

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

            confirmButton.addEventListener("click", async function () {
                confirmButton.disabled = true;

                try {
                    await apiClient.post("/auth/logout", {});

                    window.location.replace("./login.html");

                } catch (error) {
                    console.error("Logout failed:", error);

                    confirmButton.disabled = false;

                    alert("Unable to sign out. Please try again.");
                }
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


    // ==========================================
    // 19. CURRENT DATE
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

    updateCurrentDateTime();

    window.setInterval(updateCurrentDateTime, 1000);
    // ==========================================
    // 20. REFRESH DATA FROM MYSQL
    // ==========================================

    async function refreshAnalyticsData() {
        try {
            const [
                analyticsResponse,
                productResponse
            ] = await Promise.all([
                apiClient.get("/analytics"),
                productApi.getAll()
            ]);

            const analyticsData = analyticsResponse.data;
            const databaseProducts = productResponse.data;

            const databaseTransactions = analyticsData?.transactions;
            const databaseTransactionItems = analyticsData?.transactionItems;

            if (
                !Array.isArray(databaseTransactions) ||
                !Array.isArray(databaseTransactionItems) ||
                !Array.isArray(databaseProducts)
            ) {
                throw new Error("Invalid analytics data received from the server.");
            }

            // Group purchased items by transaction ID.
            const transactionItemsMap = new Map();

            databaseTransactionItems.forEach(item => {
                const transactionId = String(item.transactionId);

                if (!transactionItemsMap.has(transactionId)) {
                    transactionItemsMap.set(transactionId, []);
                }

                // Convert the API item structure
                // into the format expected by existing analytics functions.
                transactionItemsMap.get(transactionId).push({
                    productId: item.productId,
                    name: item.productName,
                    category: normalizeProductCategory(item.category),

                    quantity: item.quantity,
                    price: item.unitPrice,

                    lineSubtotal: item.subtotal,
                    lineDiscount: item.discount,
                    lineTotal: item.total,

                    customerType: item.customerType
                });
            });

            // Attach purchased items to their corresponding transactions.
            allTransactions = databaseTransactions.map(transaction => ({
                ...transaction,

                // Preserve the original transaction timestamp.
                dateISO: transaction.date,

                // Attach the corresponding purchased items.
                items: transactionItemsMap.get(
                    String(transaction.transactionId)
                ) || []
            }));

            allProducts = databaseProducts;

            console.log(
                "Analytics transactions loaded:",
                allTransactions.length
            );

            console.log(
                "Analytics transaction items loaded:",
                databaseTransactionItems.length
            );

            console.log(
                "Analytics products loaded:",
                allProducts.length
            );

            // Populate filters using the latest database data.
            populateYearFilters();

            populateProductFilters();

            // Refresh existing charts and tables.
            updateSalesAnalytics();
            updatePaymentAnalytics();
            updateCustomerAnalytics();
            updateProductAnalytics();
            updatePeakHoursAnalytics();

        } catch (error) {
            console.error("Unable to load analytics data:", error);

            setText(
                "salesInsightTitle",
                "Unable to load analytics data"
            );

            setText(
                "salesInsightText",
                "Please check your backend connection and try again."
            );

            alert("Unable to load Analytics data. Please try again.");
        }
    }


    // ==========================================
    // UPDATE LOGGED-IN USER PROFILE
    // ==========================================

    function updateUserProfile(user) {
        const fullName = user.fullName || user.username || "User";

        const role = String(user.role || "Staff").trim();

        // Update user name
        setText("display-user-name", fullName);

        // Update user role
        setText("display-user-role", role);

        // Update role badge
        setText("role-badge", `${role} Portal`);

        // Generate user initials
        const avatar = getElement("display-user-avatar");

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
    }


    // ==========================================
    // 21. AUTHENTICATION AND INITIALIZE ANALYTICS
    // ==========================================

    async function initializeAnalytics() {
        try {
            // VERIFY LOGIN SESSION
            const authResponse = await apiClient.get("/auth/me");

            if (!authResponse.success || !authResponse.data?.user) {
                window.location.replace("./login.html");
                return;
            }

            const currentUser = authResponse.data.user;

            updateUserProfile(currentUser);

            // ONLY OWNER AND MANAGER CAN ACCESS ANALYTICS
            const allowedRoles = ["owner", "manager"];

            const currentRole = String(currentUser.role || "")
                .trim()
                .toLowerCase();

            if (!allowedRoles.includes(currentRole)) {
                alert("You do not have permission to access Analytics.");

                window.location.replace("./dashboard.html");

                return;
            }

            // HIDE OWNER-ONLY NAVIGATION FOR MANAGERS
            document.querySelectorAll(".owner-only").forEach(element => {
                element.style.display =
                    currentRole === "owner" ? "" : "none";
            });

            // INITIALIZE PAGE FEATURES
            updateCurrentDateTime();

            setupSidebar();
            setupAnalyticsDropdown();
            setupAnalyticsNavigation();
            setupLogout();
            setupFilters();

            // LOAD MYSQL DATA
            await refreshAnalyticsData();

        } catch (error) {
            console.error(
                "Analytics authentication failed:",
                error
            );

            if ([401, 403, 404].includes(error.status)) {
                window.location.replace("./login.html");
                return;
            }

            document.body.innerHTML = `
                <main style="max-width:600px;margin:80px auto;padding:24px;text-align:center;font-family:Arial,sans-serif;">
                    <h2>Unable to Verify Your Session</h2>

                    <p>
                        Please make sure the CaféSense backend is running,
                        then try again.
                    </p>

                    <button onclick="window.location.reload()">
                        Retry
                    </button>
                </main>
            `;
        }
    }

    initializeAnalytics();

});