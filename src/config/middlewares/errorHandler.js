const ApiResponse = require('../utils/apiResponse');

function errorHandler(err, req, res, next) {
    const statusCode = err.statusCode || 500;
    const message = err.isOperational ? err.message : 'An unexpected internal server error occurred.';

    if (process.env.NODE_ENV === 'development') {
        console.error(`[Server Error] ${req.method} ${req.url}:`, err);
    }

    return ApiResponse.error(res, message, statusCode, err.details || null);
}

module.exports = errorHandler;
