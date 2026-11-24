
const express = require('express');

const productController = require('../controllers/productController');

const authMiddleware = require('../../config/middlewares/authMiddleware');
const roleMiddleware = require('../../config/middlewares/roleMiddleware');

const router = express.Router();


// =========================================================
// AUTHENTICATION
// All product routes require a logged-in user.
// =========================================================

router.use(authMiddleware);


// =========================================================
// VIEW PRODUCTS
// Owner, Manager, and Staff
// =========================================================

// Retrieve all inventory movements
// Owner and Manager only
router.get(
    '/inventory-movements',
    roleMiddleware(['Owner', 'Manager']),
    (req, res, next) =>
        productController.getInventoryMovements(req, res, next)
);


// Retrieve all products
router.get(
    '/',
    (req, res, next) =>
        productController.getProducts(req, res, next)
);


// Retrieve one product
router.get(
    '/:id',
    (req, res, next) =>
        productController.getProductById(req, res, next)
);


// =========================================================
// MANAGE PRODUCTS
// Owner and Manager only
// =========================================================

// Create product
router.post(
    '/',
    roleMiddleware(['Owner', 'Manager']),
    (req, res, next) =>
        productController.createProduct(req, res, next)
);


// Update product information or availability status
router.put(
    '/:id',
    roleMiddleware(['Owner', 'Manager']),
    (req, res, next) =>
        productController.updateProduct(req, res, next)
);


// Adjust product stock
router.patch(
    '/:id/stock',
    roleMiddleware(['Owner', 'Manager']),
    (req, res, next) =>
        productController.adjustStock(req, res, next)
);


// Soft-deactivate product (mark as Unavailable)
router.delete(
    '/:id',
    roleMiddleware(['Owner', 'Manager']),
    (req, res, next) =>
        productController.deleteProduct(req, res, next)
);


module.exports = router;
