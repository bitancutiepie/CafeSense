
const db = require('../../config/database');

/**
 * Analytics Repository
 * Layer 3: Data Access Layer
 *
 * Retrieves historical sales and customer data
 * directly from CafeSenseDB.
 */
class AnalyticsRepository {

    // 1. Retrieve all completed transactions
    async findAllTransactions() {
        const sql = `
            SELECT
                t.transaction_id,
                t.transaction_date,
                t.customer_count,
                t.subtotal,
                t.discount,
                t.total,
                pm.payment_method_name
            FROM transactions t
            INNER JOIN payment_methods pm
                ON t.payment_method_id = pm.payment_method_id
            WHERE t.transaction_status = 'Completed'
            ORDER BY t.transaction_date ASC
        `;

        const [rows] = await db.execute(sql);

        return rows;
    }

    // 2. Retrieve all purchased product items
    async findAllTransactionItems() {
        const sql = `
            SELECT
                ti.transaction_item_id,
                ti.transaction_id,
                ti.product_id,
                ti.product_name,
                ti.product_category,
                ti.quantity,
                ti.unit_price,
                ti.discount_rate,
                ti.line_subtotal,
                ti.line_discount,
                ti.line_total,
                ct.customer_type_name
            FROM transaction_items ti
            INNER JOIN transactions t
                ON ti.transaction_id = t.transaction_id
            INNER JOIN customer_types ct
                ON ti.customer_type_id = ct.customer_type_id
            WHERE t.transaction_status = 'Completed'
            ORDER BY ti.transaction_item_id ASC
        `;

        const [rows] = await db.execute(sql);

        return rows;
    }

}

module.exports = new AnalyticsRepository();
