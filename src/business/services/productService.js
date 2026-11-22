const productRepository = require('../../data/repositories/productRepository');
const ProductValidator = require('../validators/productValidator');
const AppError = require('../../config/utils/appError');

/**
 * Product Service (Layer 2: Business Logic Layer)
 * Domain rules, validation, calculations, completely independent of Express.
 */
class ProductService {
    async getAllProducts(filter = {}) {
        return await productRepository.findAll(filter);
    }

    async getProductById(id) {
        const product = await productRepository.findById(id);
        if (!product) {
            throw new AppError(`Product with ID '${id}' not found.`, 404);
        }
        return product;
    }

    async createProduct(productData) {
        // Business logic: validator
        const { isValid, errors } = ProductValidator.validate(productData);
        if (!isValid) {
            throw new AppError('Validation Failed', 400, errors);
        }

        // Business logic: check duplicate name
        const existing = await productRepository.findAll();
        const duplicate = existing.find(
            p => p.name.toLowerCase() === productData.name.trim().toLowerCase()
        );
        if (duplicate) {
            throw new AppError(`Product '${productData.name}' already exists.`, 409);
        }

        return await productRepository.create(productData);
    }

    async updateProduct(id, updateData) {
        await this.getProductById(id);
        return await productRepository.update(id, updateData);
    }

    // Adjust product stock
    async adjustStock(id, adjustmentData) {
        const { action, quantity, reason } = adjustmentData;

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

        // Check if product exists
        const product = await this.getProductById(id);

        // Check available stock before removal
        if (action === 'remove' && Number(quantity) > product.stock) {
            throw new AppError(
                'Insufficient stock for this adjustment.',
                400
            );
        }

        return await productRepository.adjustStock(id, {
            action,
            quantity: Number(quantity),
            reason: reason.trim(),
            userId: 1
        });
    }

    // Retrieve inventory movement history
    async getInventoryMovements(filter = {}) {
        const { productId } = filter;

        // Validate product ID when a filter is provided
        if (productId !== undefined && productId !== '') {
            if (
                !Number.isInteger(Number(productId)) ||
                Number(productId) <= 0
            ) {
                throw new AppError('Invalid product ID.', 400);
            }

            // Check if the requested product exists
            await this.getProductById(productId);

            return await productRepository.getInventoryMovements({
                productId
            });
        }

        // Retrieve all inventory movements
        return await productRepository.getInventoryMovements();
    }

    async deleteProduct(id) {
        await this.getProductById(id);
        return await productRepository.delete(id);
    }
}

module.exports = new ProductService();