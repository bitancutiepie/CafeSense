
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const userRepository = require('../../data/repositories/userRepository');
const AppError = require('../../config/utils/appError');

/**
 * Authentication Service (Layer 2: Business Logic Layer)
 * Handles login, password verification, JWT generation,
 * current-user retrieval, and password recovery.
 */
class AuthService {

    // Authenticate a user
    async login(identifier, password) {

        // Validate required fields
        if (
            typeof identifier !== 'string' ||
            !identifier.trim() ||
            typeof password !== 'string' ||
            !password
        ) {
            throw new AppError(
                'Username/email and password are required.',
                400
            );
        }

        // Find account using username or email
        const result = await userRepository.findByUsernameOrEmail(
            identifier.trim()
        );

        // Avoid revealing whether an account exists
        if (!result) {
            throw new AppError(
                'Invalid username/email or password.',
                401
            );
        }

        const { user, passwordHash } = result;

        // Check account status
        if (user.accountStatus !== 'Active') {
            throw new AppError('This account is inactive.', 403);
        }

        // Verify password using bcrypt
        const passwordMatches = await bcrypt.compare(
            password,
            passwordHash
        );

        if (!passwordMatches) {
            throw new AppError(
                'Invalid username/email or password.',
                401
            );
        }

        // Check JWT secret configuration
        if (!process.env.JWT_SECRET) {
            throw new AppError(
                'Authentication configuration is missing.',
                500
            );
        }

        // Generate JWT
        const token = jwt.sign(
            {
                role: user.role,
                roleId: user.roleId
            },
            process.env.JWT_SECRET,
            {
                subject: String(user.id),
                expiresIn: '8h'
            }
        );

        return {
            token,
            user
        };
    }

    // Retrieve the currently authenticated user
    async getCurrentUser(userId) {

        const user = await userRepository.findById(userId);

        if (!user) {
            throw new AppError('User account not found.', 404);
        }

        if (user.accountStatus !== 'Active') {
            throw new AppError('This account is inactive.', 403);
        }

        return user;
    }

    // Reset password using username or email
    async resetPassword(identifier, newPassword, confirmPassword) {

        // Validate account identifier
        if (
            typeof identifier !== 'string' ||
            !identifier.trim()
        ) {
            throw new AppError(
                'Username or email is required.',
                400
            );
        }

        // Validate new password
        if (
            typeof newPassword !== 'string' ||
            newPassword.length < 8
        ) {
            throw new AppError(
                'Password must contain at least 8 characters.',
                400
            );
        }

        // Validate password confirmation
        if (
            typeof confirmPassword !== 'string' ||
            !confirmPassword
        ) {
            throw new AppError(
                'Please confirm your new password.',
                400
            );
        }

        if (newPassword !== confirmPassword) {
            throw new AppError(
                'New password and confirmation password do not match.',
                400
            );
        }

        // Find account using username or email
        const result = await userRepository.findByUsernameOrEmail(
            identifier.trim()
        );

        if (!result) {
            throw new AppError(
                'No account found with that username or email.',
                404
            );
        }

        const { user } = result;

        // Prevent password reset for inactive accounts
        if (user.accountStatus !== 'Active') {
            throw new AppError(
                'This account is inactive.',
                403
            );
        }

        // Hash the new password using bcrypt
        const passwordHash = await bcrypt.hash(
            newPassword,
            12
        );

        // Update the password in the database
        const updated = await userRepository.updatePassword(
            user.id,
            passwordHash
        );

        if (!updated) {
            throw new AppError(
                'Unable to reset password. Please try again.',
                500
            );
        }

        return true;
    }
}

module.exports = new AuthService();
