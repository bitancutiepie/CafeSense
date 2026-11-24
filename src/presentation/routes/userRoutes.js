
const express = require('express');
const userController = require('../controllers/userController');

const authMiddleware = require('../../config/middlewares/authMiddleware');
const roleMiddleware = require('../../config/middlewares/roleMiddleware');

const router = express.Router();

// Require authentication and Owner role for all User Management routes
router.use(authMiddleware);
router.use(roleMiddleware('Owner'));

// GET /users
router.get('/', (req, res, next) =>
    userController.getUsers(req, res, next)
);

// GET /users/:id
router.get('/:id', (req, res, next) =>
    userController.getUserById(req, res, next)
);

// POST /users
router.post('/', (req, res, next) =>
    userController.createUser(req, res, next)
);

// PUT /users/:id
router.put('/:id', (req, res, next) =>
    userController.updateUser(req, res, next)
);

// POST /users/:id/reactivate
router.post('/:id/reactivate', (req, res, next) =>
    userController.reactivateUser(req, res, next)
);

// DELETE /users/:id
router.delete('/:id', (req, res, next) =>
    userController.deleteUser(req, res, next)
);

module.exports = router;
