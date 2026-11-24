
const express = require('express');

const authController = require('../controllers/authController');
const authMiddleware = require('../../config/middlewares/authMiddleware');

const router = express.Router();

// Login
router.post('/login', (req, res, next) => {
    authController.login(req, res, next);
});

// Reset password (public route)
router.post('/reset-password', (req, res, next) => {
    authController.resetPassword(req, res, next);
});

// Get currently authenticated user
router.get('/me', authMiddleware, (req, res, next) => {
    authController.getCurrentUser(req, res, next);
});

// Logout
router.post('/logout', (req, res) => {
    authController.logout(req, res);
});

module.exports = router;
