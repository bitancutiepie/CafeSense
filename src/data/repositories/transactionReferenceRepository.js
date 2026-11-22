const db = require('../../config/database');

/**
 * Transaction Reference Repository
 * Layer 3: Data Access Layer
 *
 * Retrieves reference data needed for POS transactions:
 * - Customer types and discount rates
 * - Active payment methods
 */
class TransactionReferenceRepository {

    // Retrieve all customer types and their discount rates
    async findAllCustomerTypes() {

        const sql = `
            SELECT
                customer_type_id,
                customer_type_name,
                discount_rate
            FROM customer_types
            ORDER BY customer_type_id ASC
        `;

        const [rows] = await db.execute(sql);

        return rows.map(row => ({
            id: row.customer_type_id,
            name: row.customer_type_name,
            discountRate: Number(row.discount_rate)
        }));
    }

    // Retrieve all active payment methods
    async findActivePaymentMethods() {

        const sql = `
            SELECT
                payment_method_id,
                payment_method_name
            FROM payment_methods
            WHERE status = 'Active'
            ORDER BY payment_method_id ASC
        `;

        const [rows] = await db.execute(sql);

        return rows.map(row => ({
            id: row.payment_method_id,
            name: row.payment_method_name
        }));
    }

}

module.exports = new TransactionReferenceRepository();