const productService = require('../../business/services/productService');
const ApiResponse = require('../../config/utils/apiResponse');

/**
 * Product Controller (Layer 1: Presentation Layer - HTTP req/res)
 */
class ProductController {
    async getProducts(req, res, next) {
        try {
            const { category } = req.query;
            const products = await productService.getAllProducts({ category });
            return ApiResponse.success(res, products, 'Products retrieved successfully');
        } catch (error) {
            next(error);
        }
    }

    async getProductById(req, res, next) {
        try {
            const { id } = req.params;
            const product = await productService.getProductById(id);
            return ApiResponse.success(res, product, 'Product retrieved successfully');
        } catch (error) {
            next(error);
        }
    }

    async createProduct(req, res, next) {
        try {
            const newProduct = await productService.createProduct(req.body);
            return ApiResponse.success(res, newProduct, 'Product created successfully', 201);
        } catch (error) {
            next(error);
        }
    }

    async updateProduct(req, res, next) {
        try {
            const { id } = req.params;
            const updated = await productService.updateProduct(id, req.body);
            return ApiResponse.success(res, updated, 'Product updated successfully');
        } catch (error) {
            next(error);
        }
    }

    async adjustStock(req, res, next) {
        try {
            const { id } = req.params;
            const updated = await productService.adjustStock(id, req.body);
            return ApiResponse.success(res, updated, 'Product stock adjusted successfully');
        } catch (error) {
            next(error);
        }
    }

    // Retrieve inventory movement history
    async getInventoryMovements(req, res, next) {
        try {
            const { productId } = req.query;

            const movements = await productService.getInventoryMovements({
                productId
            });

            return ApiResponse.success(
                res,
                movements,
                'Inventory movements retrieved successfully'
            );
        } catch (error) {
            next(error);
        }
    }

    async deleteProduct(req, res, next) {
        try {
            const { id } = req.params;
            await productService.deleteProduct(id);
            return ApiResponse.success(res, null, 'Product deleted successfully');
        } catch (error) {
            next(error);
        }
    }
}

module.exports = new ProductController();