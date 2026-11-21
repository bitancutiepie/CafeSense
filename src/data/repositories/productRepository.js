const Product = require('../../business/models/Product');

/**
 * Product Repository (Layer 3: Data Access Layer)
 * Persistence layer abstraction. Currently backed by mock storage.
 */
class ProductRepository {
    constructor() {
        this.products = [
            new Product({ id: 'prod_1', name: 'Caramel Macchiato', category: 'Coffee', price: 150.00, stock: 45 }),
            new Product({ id: 'prod_2', name: 'Spanish Latte', category: 'Coffee', price: 140.00, stock: 32 }),
            new Product({ id: 'prod_3', name: 'Matcha Green Tea', category: 'Non-Coffee', price: 160.00, stock: 20 }),
            new Product({ id: 'prod_4', name: 'Butter Croissant', category: 'Pastry', price: 85.00, stock: 15 })
        ];
    }

    async findAll(filter = {}) {
        let results = [...this.products];
        if (filter.category) {
            results = results.filter(p => p.category.toLowerCase() === filter.category.toLowerCase());
        }
        return results;
    }

    async findById(id) {
        return this.products.find(p => p.id === id) || null;
    }

    async create(productData) {
        const newProduct = new Product({
            id: `prod_${Date.now()}`,
            ...productData
        });
        this.products.push(newProduct);
        return newProduct;
    }

    async update(id, updateData) {
        const index = this.products.findIndex(p => p.id === id);
        if (index === -1) return null;

        this.products[index] = new Product({
            ...this.products[index],
            ...updateData,
            id
        });
        return this.products[index];
    }

    async delete(id) {
        const index = this.products.findIndex(p => p.id === id);
        if (index === -1) return false;
        this.products.splice(index, 1);
        return true;
    }
}

module.exports = new ProductRepository();
