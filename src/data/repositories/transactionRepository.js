
const db = require('../../config/database');
const { randomUUID } = require('crypto');

class TransactionRepository {

    async create(transactionData) {

        const connection = await db.getConnection();
        let transactionStarted = false;

        try {

            await connection.beginTransaction();
            transactionStarted = true;

            const {
                items,
                paymentMethodId,
                customerCount,
                subtotal,
                discount,
                total,
                amountReceived,
                changeAmount,
                userId
            } = transactionData;

            if (!Number.isInteger(Number(userId)) || Number(userId) <= 0) {
                throw new Error(
                    'A valid user ID is required to create a transaction.'
                );
            }

            // Temporary unique code while MySQL generates the ID
            const temporaryCode = `CS-${randomUUID()}`;

            // 1. Create the main transaction record
            const [transactionResult] = await connection.execute(
                `INSERT INTO transactions (
                    transaction_code,
                    user_id,
                    payment_method_id,
                    transaction_date,
                    customer_count,
                    subtotal,
                    discount,
                    total,
                    amount_received,
                    change_amount,
                    transaction_status
                )
                VALUES (?, ?, ?, NOW(), ?, ?, ?, ?, ?, ?, 'Completed')`,
                [
                    temporaryCode,
                    userId,
                    paymentMethodId,
                    customerCount,
                    subtotal,
                    discount,
                    total,
                    amountReceived,
                    changeAmount
                ]
            );

            // Retrieve the automatically generated Transaction ID
            const transactionId = transactionResult.insertId;

            // 2. Get the transaction month from MySQL
            const [[createdTransaction]] = await connection.execute(
                `SELECT DATE_FORMAT(transaction_date, '%Y%m') AS transactionMonth
                 FROM transactions
                 WHERE transaction_id = ?`,
                [transactionId]
            );

            // 3. Generate the standardized transaction code
            const transactionCode =
                `CS-${createdTransaction.transactionMonth}-${String(transactionId).padStart(3, '0')}`;

            // Update the temporary code
            await connection.execute(
                `UPDATE transactions
                 SET transaction_code = ?
                 WHERE transaction_id = ?`,
                [
                    transactionCode,
                    transactionId
                ]
            );

            // 4. Process every purchased product
            for (const item of items) {

                const [productRows] = await connection.execute(
                    `SELECT
                        p.product_id,
                        p.product_code,
                        p.product_name,
                        p.price,
                        p.stock_quantity,
                        p.availability,
                        pc.category_name
                    FROM products p
                    INNER JOIN product_categories pc
                        ON p.category_id = pc.category_id
                    WHERE p.product_id = ?
                    FOR UPDATE`,
                    [item.productId]
                );

                if (productRows.length === 0) {
                    throw new Error(
                        `Product with ID ${item.productId} not found.`
                    );
                }

                const product = productRows[0];

                if (product.availability !== 'Available') {
                    throw new Error(
                        `${product.product_name} is unavailable.`
                    );
                }

                // Verify that the product price has not changed
                if (
                    Number(product.price) !== Number(item.price)
                ) {
                    throw new Error(
                        `The price of ${product.product_name} has changed. Please refresh the POS and try again.`
                    );
                }

                const currentStock = Number(product.stock_quantity);
                const quantity = Number(item.quantity);

                if (currentStock < quantity) {
                    throw new Error(
                        `Insufficient stock for ${product.product_name}.`
                    );
                }

                const newStock = currentStock - quantity;

                // 5. Save the transaction item
                await connection.execute(
                    `INSERT INTO transaction_items (
                        transaction_id,
                        product_id,
                        customer_type_id,
                        product_code,
                        product_name,
                        product_category,
                        quantity,
                        unit_price,
                        discount_rate,
                        line_subtotal,
                        line_discount,
                        line_total
                    )
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                    [
                        transactionId,
                        product.product_id,
                        item.customerTypeId,
                        product.product_code,
                        product.product_name,
                        product.category_name,
                        quantity,
                        Number(product.price),
                        item.discountRate,
                        item.lineSubtotal,
                        item.lineDiscount,
                        item.lineTotal
                    ]
                );

                // 6. Deduct product stock
                await connection.execute(
                    `UPDATE products
                     SET stock_quantity = ?,
                         updated_at = CURRENT_TIMESTAMP
                     WHERE product_id = ?`,
                    [
                        newStock,
                        product.product_id
                    ]
                );

                // 7. Record the inventory movement
                await connection.execute(
                    `INSERT INTO inventory_movements (
                        product_id,
                        user_id,
                        transaction_id,
                        movement_type,
                        quantity_change,
                        stock_before,
                        stock_after,
                        reason
                    )
                    VALUES (?, ?, ?, 'Sale', ?, ?, ?, ?)`,
                    [
                        product.product_id,
                        userId,
                        transactionId,
                        -quantity,
                        currentStock,
                        newStock,
                        'POS Transaction'
                    ]
                );
            }

            // 8. Commit all database changes
            await connection.commit();
            transactionStarted = false;

            return {
                transactionId,
                transactionCode
            };

        } catch (error) {

            if (transactionStarted) {
                await connection.rollback();
            }

            throw error;

        } finally {
            connection.release();
        }
    }

    // 9. Retrieve transaction history
    async findAll() {

        // Retrieve the latest 100 transactions
        const [transactions] = await db.execute(
            `SELECT
                t.transaction_id,
                t.transaction_code,
                t.transaction_date,
                t.customer_count,
                t.subtotal,
                t.discount,
                t.total,
                t.amount_received,
                t.change_amount,
                t.transaction_status,
                pm.payment_method_name,
                u.full_name
            FROM transactions t
            INNER JOIN payment_methods pm
                ON t.payment_method_id = pm.payment_method_id
            INNER JOIN users u
                ON t.user_id = u.user_id
            ORDER BY t.transaction_date DESC,
                     t.transaction_id DESC
            LIMIT 100`
        );

        if (transactions.length === 0) {
            return [];
        }

        // Get the IDs of the retrieved transactions
        const transactionIds = transactions.map(
            transaction => transaction.transaction_id
        );

        const placeholders = transactionIds
            .map(() => '?')
            .join(', ');

        // Retrieve the purchased items
        const [items] = await db.execute(
            `SELECT
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
            INNER JOIN customer_types ct
                ON ti.customer_type_id = ct.customer_type_id
            WHERE ti.transaction_id IN (${placeholders})
            ORDER BY ti.transaction_item_id ASC`,
            transactionIds
        );

        // Group purchased items by transaction ID
        const groupedItems = {};

        for (const item of items) {

            if (!groupedItems[item.transaction_id]) {
                groupedItems[item.transaction_id] = [];
            }

            groupedItems[item.transaction_id].push({
                id: item.transaction_item_id,
                productId: item.product_id,
                name: item.product_name,
                category: item.product_category,
                quantity: Number(item.quantity),
                price: Number(item.unit_price),
                customerType: item.customer_type_name,
                discountRate: Number(item.discount_rate),
                lineSubtotal: Number(item.line_subtotal),
                lineDiscount: Number(item.line_discount),
                lineTotal: Number(item.line_total)
            });
        }

        // Return transactions with their corresponding items
        return transactions.map(transaction => {

            const transactionItems =
                groupedItems[transaction.transaction_id] || [];

            return {
                id: transaction.transaction_code,
                transactionId: transaction.transaction_id,
                transactionCode: transaction.transaction_code,
                date: new Date(
                    transaction.transaction_date
                ).toLocaleString('en-PH'),
                dateISO: new Date(
                    transaction.transaction_date
                ).toISOString(),
                customerCount: Number(transaction.customer_count),
                paymentMethod: transaction.payment_method_name,
                performedBy: transaction.full_name,
                status: transaction.transaction_status,
                items: transactionItems,
                customerTypes: [
                    ...new Set(
                        transactionItems.map(item => item.customerType)
                    )
                ],
                subtotal: Number(transaction.subtotal),
                discount: Number(transaction.discount),
                total: Number(transaction.total),
                amountReceived: Number(transaction.amount_received),
                changeAmount: Number(transaction.change_amount)
            };
        });
    }
}

module.exports = new TransactionRepository();
