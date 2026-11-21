/**
 * Product Business Validator
 */
class ProductValidator {
    static validate(data) {
        const errors = [];
        if (!data.name || typeof data.name !== 'string' || !data.name.trim()) {
            errors.push('Field "name" is required and cannot be empty.');
        }
        if (data.price === undefined || isNaN(Number(data.price)) || Number(data.price) <= 0) {
            errors.push('Field "price" must be a positive number.');
        }
        if (!data.category || typeof data.category !== 'string' || !data.category.trim()) {
            errors.push('Field "category" is required.');
        }
        return {
            isValid: errors.length === 0,
            errors
        };
    }
}

module.exports = ProductValidator;
