const express = require('express');
const productRoutes = require('./productRoutes');
const ApiResponse = require('../../config/utils/apiResponse');

const router = express.Router();

router.get('/health', (req, res) => {
    return ApiResponse.success(res, { status: 'healthy', uptime: process.uptime() }, 'CaféSense API is running');
});

router.use('/products', productRoutes);

module.exports = router;
