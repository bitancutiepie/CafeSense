const jwt = require('jsonwebtoken');
const AppError = require('../utils/appError');

/**
 * Authentication Middleware
 * Verifies the JWT cookie and identifies the logged-in user.
 */
function authMiddleware(req, res, next) {
    try {
        const token = req.cookies?.cafeSenseToken;

        // Check if the user has an authentication cookie
        if (!token) {
            throw new AppError('Authentication required.', 401);
        }

        // Check JWT secret configuration
        if (!process.env.JWT_SECRET) {
            throw new AppError(
                'Authentication configuration is missing.',
                500
            );
        }

        // Verify the JWT
        const decoded = jwt.verify(
            token,
            process.env.JWT_SECRET
        );

        // Attach authenticated user information to the request
        req.user = {
            id: Number(decoded.sub),
            roleId: decoded.roleId,
            role: decoded.role
        };

        next();

    } catch (error) {
        if (error instanceof AppError) {
            return next(error);
        }

        if (
            error.name === 'JsonWebTokenError' ||
            error.name === 'TokenExpiredError'
        ) {
            return next(
                new AppError('Invalid or expired session.', 401)
            );
        }

        next(error);
    }
}

module.exports = authMiddleware;