const AppError = require('../utils/appError');

/**
 * Role-Based Access Control Middleware
 * Restricts access based on the authenticated user's role.
 */
function roleMiddleware(...allowedRoles) {

    // Support both individual role arguments and arrays.
    const normalizedAllowedRoles = allowedRoles
        .flat()
        .map(role => String(role).trim().toLowerCase());

    return (req, res, next) => {

        // Ensure the user is authenticated first
        if (!req.user) {

            return next(
                new AppError('Authentication required.', 401)
            );

        }

        // Normalize the authenticated user's role
        const userRole = String(req.user.role || '')
            .trim()
            .toLowerCase();

        // Check whether the user's role is allowed
        if (!normalizedAllowedRoles.includes(userRole)) {

            return next(
                new AppError(
                    'You do not have permission to access this resource.',
                    403
                )
            );

        }

        next();

    };

}

module.exports = roleMiddleware;