
const userService = require('../../business/services/userService');
const ApiResponse = require('../../config/utils/apiResponse');

class UserController {

    // GET /users
    async getUsers(req, res, next) {
        try {
            const users = await userService.getAllUsers();

            return ApiResponse.success(
                res,
                users,
                'Users retrieved successfully'
            );

        } catch (error) {
            next(error);
        }
    }

    // GET /users/:id
    async getUserById(req, res, next) {
        try {
            const { id } = req.params;

            const user = await userService.getUserById(id);

            return ApiResponse.success(
                res,
                user,
                'User retrieved successfully'
            );

        } catch (error) {
            next(error);
        }
    }

    // POST /users
    async createUser(req, res, next) {
        try {
            const newUser = await userService.createUser(req.body);

            return ApiResponse.success(
                res,
                newUser,
                'User created successfully',
                201
            );

        } catch (error) {
            next(error);
        }
    }

    // PUT /users/:id
    async updateUser(req, res, next) {
        try {
            const { id } = req.params;

            const updatedUser = await userService.updateUser(
                id,
                req.body,
                req.user.id
            );

            return ApiResponse.success(
                res,
                updatedUser,
                'User updated successfully'
            );

        } catch (error) {
            next(error);
        }
    }

    // POST /users/:id/reactivate
    async reactivateUser(req, res, next) {
        try {
            const { id } = req.params;

            const reactivatedUser = await userService.reactivateUser(id);

            return ApiResponse.success(
                res,
                reactivatedUser,
                'User account reactivated successfully'
            );

        } catch (error) {
            next(error);
        }
    }

    // DELETE /users/:id
    async deleteUser(req, res, next) {
        try {
            const { id } = req.params;
            const currentUserId = req.user.id;

            await userService.deleteUser(id, currentUserId);

            return ApiResponse.success(
                res,
                null,
                'User account deactivated successfully'
            );

        } catch (error) {
            next(error);
        }
    }
}

module.exports = new UserController();
