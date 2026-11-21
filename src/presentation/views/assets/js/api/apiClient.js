/**
 * Centralized API Client (Frontend Data Access Layer)
 */
class ApiClient {
    constructor(baseURL = '/api/v1') {
        this.baseURL = baseURL;
    }

    async request(endpoint, options = {}) {
        const url = `${this.baseURL}${endpoint}`;
        const headers = {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            ...options.headers
        };

        const config = { ...options, headers };

        try {
            const response = await fetch(url, config);
            const data = await response.json().catch(() => ({}));

            if (!response.ok) {
                const errorMessage = data.message || `HTTP error! status: ${response.status}`;
                const error = new Error(errorMessage);
                error.status = response.status;
                error.data = data;
                throw error;
            }

            return data;
        } catch (error) {
            console.error(`[ApiClient Error] ${options.method || 'GET'} ${url}:`, error.message);
            throw error;
        }
    }

    get(endpoint, headers = {}) {
        return this.request(endpoint, { method: 'GET', headers });
    }

    post(endpoint, body, headers = {}) {
        return this.request(endpoint, { method: 'POST', body: JSON.stringify(body), headers });
    }

    put(endpoint, body, headers = {}) {
        return this.request(endpoint, { method: 'PUT', body: JSON.stringify(body), headers });
    }

    delete(endpoint, headers = {}) {
        return this.request(endpoint, { method: 'DELETE', headers });
    }
}

export const apiClient = new ApiClient();
if (typeof window !== 'undefined') {
    window.apiClient = apiClient;
}
