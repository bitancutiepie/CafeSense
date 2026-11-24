
/**
 * Product Business Validator
 */
class ProductValidator {

    // Validate new product creation
    static validateCreate(data) {
        const errors = [];

        if (
            !data.name ||
            typeof data.name !== 'string' ||
            !data.name.trim()
        ) {
            errors.push('Field "name" is required and cannot be empty.');
        }

        if (
            data.price === undefined ||
            !Number.isFinite(Number(data.price)) ||
            Number(data.price) <= 0
        ) {
            errors.push('Field "price" must be a positive number.');
        }

        if (
            !data.category ||
            typeof data.category !== 'string' ||
            !data.category.trim()
        ) {
            errors.push('Field "category" is required.');
        }

        if (
            data.stock !== undefined &&
            (
                !Number.isInteger(Number(data.stock)) ||
                Number(data.stock) < 0
            )
        ) {
            errors.push('Field "stock" must be a nonnegative whole number.');
        }

        return {
            isValid: errors.length === 0,
            errors
        };
    }

    // Validate product updates
    static validateUpdate(data) {
        const errors = [];
        const allowedFields = ['name', 'category', 'price', 'status'];

        const providedFields = Object.keys(data);

        if (providedFields.length === 0) {
            errors.push('At least one product field must be provided.');
        }

        for (const field of providedFields) {
            if (!allowedFields.includes(field)) {
                errors.push(`Field "${field}" cannot be updated.`);
            }
        }

        if (
            data.name !== undefined &&
            (
                typeof data.name !== 'string' ||
                !data.name.trim()
            )
        ) {
            errors.push('Field "name" cannot be empty.');
        }

        if (
            data.category !== undefined &&
            (
                typeof data.category !== 'string' ||
                !data.category.trim()
            )
        ) {
            errors.push('Field "category" cannot be empty.');
        }

        if (
            data.price !== undefined &&
            (
                !Number.isFinite(Number(data.price)) ||
                Number(data.price) <= 0
            )
        ) {
            errors.push('Field "price" must be a positive number.');
        }

        if (
            data.status !== undefined &&
            !['Available', 'Unavailable'].includes(data.status)
        ) {
            errors.push('Field "status" must be Available or Unavailable.');
        }

        return {
            isValid: errors.length === 0,
            errors
        };
    }
}

module.exports = ProductValidator;
