
const productRepository = require('../../data/repositories/productRepository');
const ProductValidator = require('../validators/productValidator');
const AppError = require('../../config/utils/appError');

/**
 * Product Service (Layer 2: Business Logic Layer)
 * Handles business rules, validation, and calculations.
 * Independent of Express.
 */
class ProductService {

    // Retrieve all products
    async getAllProducts(filter = {}) {
        return await productRepository.findAll(filter);
    }

    // Retrieve one product
    async getProductById(id) {
        const product = await productRepository.findById(id);

        if (!product) {
            throw new AppError(`Product with ID '${id}' not found.`, 404);
        }

        return product;
    }

    // Create a new product
    async createProduct(productData) {
        const { isValid, errors } =
            ProductValidator.validateCreate(productData);

        if (!isValid) {
            throw new AppError('Validation Failed', 400, errors);
        }

        // Check for duplicate product names
        const existing = await productRepository.findAll();

        const duplicate = existing.find(
            product =>
                product.name.toLowerCase() ===
                productData.name.trim().toLowerCase()
        );

        if (duplicate) {
            throw new AppError(
                `Product '${productData.name}' already exists.`,
                409
            );
        }

        return await productRepository.create({
            ...productData,
            name: productData.name.trim(),
            category: productData.category.trim()
        });
    }

    // Update an existing product
    async updateProduct(id, updateData) {
        // Validate update fields
        const { isValid, errors } =
            ProductValidator.validateUpdate(updateData);

        if (!isValid) {
            throw new AppError('Validation Failed', 400, errors);
        }

        // Check whether the product exists
        await this.getProductById(id);

        // Check duplicate name only when name is being changed
        if (updateData.name !== undefined) {
            const existing = await productRepository.findAll();

            const duplicate = existing.find(
                product =>
                    Number(product.id) !== Number(id) &&
                    product.name.toLowerCase() ===
                    updateData.name.trim().toLowerCase()
            );

            if (duplicate) {
                throw new AppError(
                    `Product '${updateData.name}' already exists.`,
                    409
                );
            }
        }

        const cleanedData = {
            ...updateData
        };

        if (cleanedData.name !== undefined) {
            cleanedData.name = cleanedData.name.trim();
        }

        if (cleanedData.category !== undefined) {
            cleanedData.category = cleanedData.category.trim();
        }

        return await productRepository.update(id, cleanedData);
    }

    // Adjust product stock
    async adjustStock(id, adjustmentData, userId) {
        const { action, quantity, reason } = adjustmentData;

        // Validate authenticated user ID
        if (
            !Number.isInteger(Number(userId)) ||
            Number(userId) <= 0
        ) {
            throw new AppError(
                'Authenticated user is required for stock adjustment.',
                401
            );
        }

        // Validate adjustment action
        if (!['add', 'remove'].includes(action)) {
            throw new AppError(
                'Invalid stock adjustment action. Use "add" or "remove".',
                400
            );
        }

        // Validate quantity
        if (
            quantity === undefined ||
            !Number.isInteger(Number(quantity)) ||
            Number(quantity) <= 0
        ) {
            throw new AppError(
                'Adjustment quantity must be a positive whole number.',
                400
            );
        }

        // Validate reason
        if (typeof reason !== 'string' || !reason.trim()) {
            throw new AppError(
                'A reason for the stock adjustment is required.',
                400
            );
        }

        // Check whether the product exists
        const product = await this.getProductById(id);

        // Check available stock before removal
        if (
            action === 'remove' &&
            Number(quantity) > product.stock
        ) {
            throw new AppError(
                'Insufficient stock for this adjustment.',
                400
            );
        }

        return await productRepository.adjustStock(id, {
            action,
            quantity: Number(quantity),
            reason: reason.trim(),
            userId: Number(userId)
        });
    }

    // Retrieve inventory movement history
    async getInventoryMovements(filter = {}) {
        const { productId } = filter;

        if (productId !== undefined && productId !== '') {
            if (
                !Number.isInteger(Number(productId)) ||
                Number(productId) <= 0
            ) {
                throw new AppError('Invalid product ID.', 400);
            }

            await this.getProductById(productId);

            return await productRepository.getInventoryMovements({
                productId
            });
        }

        return await productRepository.getInventoryMovements();
    }

    // Deactivate a product instead of permanently deleting it
    async deleteProduct(id) {
        await this.getProductById(id);

        return await productRepository.update(id, {
            status: 'Unavailable'
        });
    }
}

module.exports = new ProductService();
