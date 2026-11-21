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

    async deleteProduct(id) {
        await this.getProductById(id);
        return await productRepository.delete(id);
    }
}

module.exports = new ProductService();
