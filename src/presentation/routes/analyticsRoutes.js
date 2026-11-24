
const express = require('express');
const analyticsController = require('../controllers/analyticsController');
const authMiddleware = require('../../config/middlewares/authMiddleware');
const roleMiddleware = require('../../config/middlewares/roleMiddleware');

const router = express.Router();

// Require authentication
router.use(authMiddleware);

// Retrieve analytics data (Owner and Manager only)
router.get(
    '/',
    roleMiddleware(['Owner', 'Manager']),
    (req, res, next) =>
        analyticsController.getAnalytics(req, res, next)
);

module.exports = router;
