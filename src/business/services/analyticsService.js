
const analyticsRepository = require('../../data/repositories/analyticsRepository');

/**
 * Analytics Service
 * Layer 2: Business Logic Layer
 *
 * Handles analytics data retrieval and calculations.
 */
class AnalyticsService {

    // Retrieve all analytics data
    async getAnalytics() {

        const [
            transactions,
            transactionItems
        ] = await Promise.all([
            analyticsRepository.findAllTransactions(),
            analyticsRepository.findAllTransactionItems()
        ]);

        return {
            transactions: transactions.map(transaction => ({
                transactionId: Number(transaction.transaction_id),
                date: transaction.transaction_date,
                customerCount: Number(transaction.customer_count),
                subtotal: Number(transaction.subtotal),
                discount: Number(transaction.discount),
                total: Number(transaction.total),
                paymentMethod: transaction.payment_method_name
            })),

            transactionItems: transactionItems.map(item => ({
                transactionItemId: Number(item.transaction_item_id),
                transactionId: Number(item.transaction_id),
                productId: Number(item.product_id),
                productName: item.product_name,
                category: item.product_category,
                quantity: Number(item.quantity),
                unitPrice: Number(item.unit_price),
                discountRate: Number(item.discount_rate),
                subtotal: Number(item.line_subtotal),
                discount: Number(item.line_discount),
                total: Number(item.line_total),
                customerType: item.customer_type_name
            }))
        };
    }

}

module.exports = new AnalyticsService();
