
const analyticsService = require('../../business/services/analyticsService');
const ApiResponse = require('../../config/utils/apiResponse');

/**
 * Analytics Controller
 * Layer 1: Presentation Layer
 *
 * Handles HTTP requests for Analytics.
 */
class AnalyticsController {

    // Retrieve analytics data
    async getAnalytics(req, res, next) {
        try {

            const analytics =
                await analyticsService.getAnalytics();

            return ApiResponse.success(
                res,
                analytics,
                'Analytics data retrieved successfully'
            );

        } catch (error) {
            next(error);
        }
    }

}

module.exports = new AnalyticsController();
