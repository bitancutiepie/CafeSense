const transactionRepository = require('../../data/repositories/transactionRepository');
const transactionReferenceRepository = require('../../data/repositories/transactionReferenceRepository');
const productRepository = require('../../data/repositories/productRepository');
const AppError = require('../../config/utils/appError');

class TransactionService {

    roundMoney(amount) {
        return Math.round((Number(amount) + Number.EPSILON) * 100) / 100;
    }

    async createTransaction(transactionData) {

        if (!transactionData || typeof transactionData !== 'object') {
            throw new AppError('Invalid transaction data.', 400);
        }

        const {
            items,
            paymentMethod,
            customerCount,
            amountReceived
        } = transactionData;

        if (!Array.isArray(items) || items.length === 0) {
            throw new AppError('Your cart is empty.', 400);
        }

        if (
            !Number.isInteger(Number(customerCount)) ||
            Number(customerCount) <= 0
        ) {
            throw new AppError(
                'Customer count must be a positive whole number.',
                400
            );
        }

        if (
            typeof paymentMethod !== 'string' ||
            !paymentMethod.trim()
        ) {
            throw new AppError('Please select a payment method.', 400);
        }

        const received = Number(amountReceived);

        if (!Number.isFinite(received) || received < 0) {
            throw new AppError('Invalid payment amount.', 400);
        }

        const customerTypes =
            await transactionReferenceRepository.findAllCustomerTypes();

        const paymentMethods =
            await transactionReferenceRepository.findActivePaymentMethods();

        const selectedPayment = paymentMethods.find(
            method =>
                method.name.toLowerCase() ===
                paymentMethod.trim().toLowerCase()
        );

        if (!selectedPayment) {
            throw new AppError(
                'Invalid or inactive payment method.',
                400
            );
        }

        const processedItems = [];

        let subtotal = 0;
        let totalDiscount = 0;

        for (const item of items) {

            if (!item || typeof item !== 'object') {
                throw new AppError('Invalid cart item.', 400);
            }

            const productId = Number(item.productId);
            const quantity = Number(item.quantity);

            if (!Number.isInteger(productId) || productId <= 0) {
                throw new AppError('Invalid product ID.', 400);
            }

            if (!Number.isInteger(quantity) || quantity <= 0) {
                throw new AppError(
                    'Product quantity must be a positive whole number.',
                    400
                );
            }

            const product =
                await productRepository.findById(productId);

            if (!product) {
                throw new AppError(
                    `Product with ID ${productId} does not exist.`,
                    404
                );
            }

            if (product.status !== 'Available') {
                throw new AppError(
                    `${product.name} is unavailable.`,
                    400
                );
            }

            if (Number(product.stock) < quantity) {
                throw new AppError(
                    `Insufficient stock for ${product.name}.`,
                    400
                );
            }

            const customerType = customerTypes.find(
                type =>
                    type.name.toLowerCase() ===
                    String(item.customerType || '').trim().toLowerCase()
            );

            if (!customerType) {
                throw new AppError(
                    `Invalid customer type for ${product.name}.`,
                    400
                );
            }

            const unitPrice = Number(product.price);
            const discountRate = customerType.discountRate;

            const lineSubtotal = this.roundMoney(
                unitPrice * quantity
            );

            const lineDiscount = this.roundMoney(
                lineSubtotal * discountRate / 100
            );

            const lineTotal = this.roundMoney(
                lineSubtotal - lineDiscount
            );

            subtotal += lineSubtotal;
            totalDiscount += lineDiscount;

            processedItems.push({
                productId: product.id,
                name: product.name,
                category: product.category,
                price: unitPrice,
                quantity,
                customerType: customerType.name,
                customerTypeId: customerType.id,
                discountRate,
                lineSubtotal,
                lineDiscount,
                lineTotal
            });
        }

        subtotal = this.roundMoney(subtotal);
        totalDiscount = this.roundMoney(totalDiscount);

        const total = this.roundMoney(
            subtotal - totalDiscount
        );

        const receivedAmount = this.roundMoney(received);

        let changeAmount = 0;

        if (selectedPayment.name === 'Cash') {

            if (receivedAmount < total) {
                throw new AppError(
                    'Insufficient cash received.',
                    400
                );
            }

            changeAmount = this.roundMoney(
                receivedAmount - total
            );

        } else {

            if (receivedAmount !== total) {
                throw new AppError(
                    'Payment amount must match the transaction total.',
                    400
                );
            }
        }

        const savedTransaction =
            await transactionRepository.create({

                items: processedItems,

                paymentMethodId: selectedPayment.id,
                customerCount: Number(customerCount),

                subtotal,
                discount: totalDiscount,
                total,

                amountReceived: receivedAmount,
                changeAmount,

                userId: 1
            });

        const now = new Date();

        return {
            id: savedTransaction.transactionCode,
            transactionId: savedTransaction.transactionId,
            transactionCode: savedTransaction.transactionCode,

            date: now.toLocaleString('en-PH'),
            dateISO: now.toISOString(),

            customerCount: Number(customerCount),
            paymentMethod: selectedPayment.name,

            items: processedItems,

            customerTypes: [
                ...new Set(
                    processedItems.map(item => item.customerType)
                )
            ],

            subtotal,
            discount: totalDiscount,
            total,

            amountReceived: receivedAmount,
            changeAmount
        };
    }

    // Retrieve transaction history
    async getTransactions() {
        return await transactionRepository.findAll();
    }
}

module.exports = new TransactionService();