
const express = require('express');

const productRoutes = require('./productRoutes');
const transactionRoutes = require('./transactionRoutes');
const authRoutes = require('./authRoutes');
const analyticsRoutes = require('./analyticsRoutes');
const userRoutes = require('./userRoutes');

const ApiResponse = require('../../config/utils/apiResponse');

const router = express.Router();

// API Health Check
router.get('/health', (req, res) => {
    return ApiResponse.success(
        res,
        {
            status: 'healthy',
            uptime: process.uptime()
        },
        'CaféSense API is running'
    );
});

// Authentication Routes
router.use('/auth', authRoutes);

// Product Routes
router.use('/products', productRoutes);

// Transaction Routes
router.use('/transactions', transactionRoutes);

// Analytics Routes
router.use('/analytics', analyticsRoutes);

// User Management Routes
router.use('/users', userRoutes);

module.exports = router;
