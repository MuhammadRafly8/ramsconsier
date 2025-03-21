const { Router } = require('express');
const router = Router();
const { register, login, getCurrentUser } = require('../controllers/authController');
const { authenticate } = require('../middleware/authMiddleware');
const { body } = require('express-validator');

// Register validation
const registerValidation = [
  body('username')
    .isLength({ min: 3, max: 30 })
    .withMessage('Username must be between 3 and 30 characters')
    .matches(/^[a-zA-Z0-9_]+$/)
    .withMessage('Username can only contain letters, numbers, and underscores'),
  body('email')
    .isEmail()
    .withMessage('Must be a valid email address'),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long')
];

// Login validation
const loginValidation = [
  body('username')
    .notEmpty()
    .withMessage('Username is required'),
  body('password')
    .notEmpty()
    .withMessage('Password is required')
];

// Register route
router.post('/register', registerValidation, register);

// Login route
router.post('/login', loginValidation, login);

// Get current user route (protected)
router.get('/me', authenticate, getCurrentUser);

module.exports = router;