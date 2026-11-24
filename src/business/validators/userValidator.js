
/**
 * User Business Validator
 */
class UserValidator {

    static validate(data, isEditing = false) {

        const errors = [];

        // Full Name
        if (
            !data.fullName ||
            typeof data.fullName !== 'string' ||
            !data.fullName.trim()
        ) {
            errors.push('Field "fullName" is required and cannot be empty.');
        }

        // Username
        if (
            !data.username ||
            typeof data.username !== 'string' ||
            !data.username.trim()
        ) {
            errors.push('Field "username" is required and cannot be empty.');
        }

        // Email
        if (
            !data.email ||
            typeof data.email !== 'string' ||
            !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email.trim())
        ) {
            errors.push('A valid email address is required.');
        }

        // Role
        const allowedRoles = ['Owner', 'Manager', 'Staff'];

        if (
            !data.role ||
            !allowedRoles.includes(data.role)
        ) {
            errors.push('Role must be Owner, Manager, or Staff.');
        }

        // Password
        if (!isEditing || data.password) {

            if (
                typeof data.password !== 'string' ||
                data.password.length < 8
            ) {
                errors.push('Password must contain at least 8 characters.');
            }
        }

        return {
            isValid: errors.length === 0,
            errors
        };
    }
}

module.exports = UserValidator;
