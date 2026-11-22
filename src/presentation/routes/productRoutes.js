const express = require('express');
const productController = require('../controllers/productController');

const router = express.Router();

// Retrieve all inventory movements or filter by product ID
router.get(
    '/inventory-movements',
    (req, res, next) => productController.getInventoryMovements(req, res, next)
);

router.get('/', (req, res, next) => productController.getProducts(req, res, next));
router.get('/:id', (req, res, next) => productController.getProductById(req, res, next));
router.post('/', (req, res, next) => productController.createProduct(req, res, next));
router.put('/:id', (req, res, next) => productController.updateProduct(req, res, next));

// Adjust product stock
router.patch('/:id/stock', (req, res, next) => productController.adjustStock(req, res, next));

router.delete('/:id', (req, res, next) => productController.deleteProduct(req, res, next));

module.exports = router;