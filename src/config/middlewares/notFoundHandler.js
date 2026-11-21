const AppError = require('../utils/appError');

function notFoundHandler(req, res, next) {
    next(new AppError(`Endpoint '${req.originalUrl}' does not exist on this server.`, 404));
}

module.exports = notFoundHandler;
