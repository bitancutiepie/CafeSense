const express = require('express');
const productController = require('../controllers/productController');

const router = express.Router();

router.get('/', (req, res, next) => productController.getProducts(req, res, next));
router.get('/:id', (req, res, next) => productController.getProductById(req, res, next));
router.post('/', (req, res, next) => productController.createProduct(req, res, next));
router.put('/:id', (req, res, next) => productController.updateProduct(req, res, next));
router.delete('/:id', (req, res, next) => productController.deleteProduct(req, res, next));

module.exports = router;
