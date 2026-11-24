
const authService = require('../../business/services/authService');
const ApiResponse = require('../../config/utils/apiResponse');

/**
 * Authentication Controller (Layer 1: Presentation Layer)
 * Handles HTTP requests and responses for authentication.
 */
class AuthController {

    // POST /auth/login
    async login(req, res, next) {
        try {
            const { identifier, password } = req.body;

            const { token, user } = await authService.login(
                identifier,
                password
            );

            // Store JWT in an HTTP-only cookie
            res.cookie('cafeSenseToken', token, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'lax',
                maxAge: 8 * 60 * 60 * 1000,
                path: '/'
            });

            return ApiResponse.success(
                res,
                { user },
                'Login successful'
            );

        } catch (error) {
            next(error);
        }
    }

    // GET /auth/me
    async getCurrentUser(req, res, next) {
        try {
            const user = await authService.getCurrentUser(
                req.user.id
            );

            return ApiResponse.success(
                res,
                { user },
                'User information retrieved successfully'
            );

        } catch (error) {
            next(error);
        }
    }

    // POST /auth/reset-password
    async resetPassword(req, res, next) {
        try {
            const {
                identifier,
                newPassword,
                confirmPassword
            } = req.body;

            await authService.resetPassword(
                identifier,
                newPassword,
                confirmPassword
            );

            return ApiResponse.success(
                res,
                null,
                'Password reset successful. You can now log in using your new password.'
            );

        } catch (error) {
            next(error);
        }
    }

    // POST /auth/logout
    logout(req, res) {
        res.clearCookie('cafeSenseToken', {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            path: '/'
        });

        return ApiResponse.success(
            res,
            null,
            'Logout successful'
        );
    }
}

module.exports = new AuthController();
