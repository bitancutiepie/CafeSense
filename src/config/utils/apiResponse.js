class ApiResponse {
    static success(res, data = null, message = 'Success', statusCode = 200) {
        return res.status(statusCode).json({
            success: true,
            message,
            data,
            timestamp: new Date().toISOString()
        });
    }

    static error(res, message = 'Internal Server Error', statusCode = 500, details = null) {
        return res.status(statusCode).json({
            success: false,
            message,
            details,
            timestamp: new Date().toISOString()
        });
    }
}

module.exports = ApiResponse;
