const express = require('express');
const transactionController = require('../controllers/transactionController');
const authMiddleware = require('../../config/middlewares/authMiddleware');

const router = express.Router();

// Require authentication for all transaction routes
router.use(authMiddleware);

// Retrieve transaction history
router.get(
    '/',
    (req, res, next) => transactionController.getTransactions(req, res, next)
);

// Create a POS transaction
router.post(
    '/',
    (req, res, next) => transactionController.createTransaction(req, res, next)
);

module.exports = router;