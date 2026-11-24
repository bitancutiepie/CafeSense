import { apiClient } from './apiClient.js';

export const productApi = {

    async getAll() {
        return await apiClient.get('/products');
    },

    async getById(id) {
        return await apiClient.get(`/products/${id}`);
    },

    async create(productData) {
        return await apiClient.post('/products', productData);
    },

    async update(id, productData) {
        return await apiClient.put(`/products/${id}`, productData);
    },

    async adjustStock(id, adjustmentData) {
        return await apiClient.patch(`/products/${id}/stock`, adjustmentData);
    },

    // Retrieve inventory movement history
    async getInventoryMovements(productId = null) {

        const query = productId
            ? `?productId=${encodeURIComponent(productId)}`
            : '';

        return await apiClient.get(`/products/inventory-movements${query}`);
    },

    // Soft-deactivate product (mark as Unavailable)
    async deactivate(id) {
        return await apiClient.delete(`/products/${id}`);
    }

};