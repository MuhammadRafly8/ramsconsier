const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { authenticate, isAdmin } = require('../middleware/authMiddleware');

// Public routes
router.post('/register', authController.register);
router.post('/login', authController.login);

// Protected routes
router.get('/me', authenticate, authController.getCurrentUser);
router.post('/logout', authenticate, authController.logout);

// Admin routes
// Add these routes to your existing authRoutes.js file

// Get all users (admin only)
router.get('/users', authenticate, isAdmin, authController.getAllUsers);

// Create new user (admin only)
router.post('/users', authenticate, isAdmin, authController.createUser);

// Delete user (admin only)
router.delete('/users/:id', authenticate, isAdmin, authController.deleteUser);
router.put('/users/role', authenticate, authController.updateUserRole);

module.exports = router;