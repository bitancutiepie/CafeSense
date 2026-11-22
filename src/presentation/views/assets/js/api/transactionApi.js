import { apiClient } from './apiClient.js';

export const transactionApi = {

    async getAll() {
        return await apiClient.get('/transactions');
    },

    async create(transactionData) {
        return await apiClient.post('/transactions', transactionData);
    }

};