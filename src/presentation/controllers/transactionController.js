const transactionService = require('../../business/services/transactionService');
const ApiResponse = require('../../config/utils/apiResponse');

class TransactionController {

    // Retrieve transaction history
    async getTransactions(req, res, next) {
        try {
            const transactions =
                await transactionService.getTransactions();

            return ApiResponse.success(
                res,
                transactions,
                'Transactions retrieved successfully'
            );

        } catch (error) {
            next(error);
        }
    }

    // Create a POS transaction
    async createTransaction(req, res, next) {
        try {
            const transaction =
                await transactionService.createTransaction(req.body);

            return ApiResponse.success(
                res,
                transaction,
                'Transaction completed successfully',
                201
            );

        } catch (error) {
            next(error);
        }
    }
}

module.exports = new TransactionController();