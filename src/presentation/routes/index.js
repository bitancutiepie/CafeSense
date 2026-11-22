const express = require('express');
const productRoutes = require('./productRoutes');
const transactionRoutes = require('./transactionRoutes');
const ApiResponse = require('../../config/utils/apiResponse');

const router = express.Router();

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

// Product routes
router.use('/products', productRoutes);

// Transaction routes
router.use('/transactions', transactionRoutes);

module.exports = router;