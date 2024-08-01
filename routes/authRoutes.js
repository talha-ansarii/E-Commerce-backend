const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { authenticate , isAdmin} = require('../middleware/authMiddleware');

router.post('/register', authController.register);
router.post('/login', authController.login);
router.post('/logout', authController.logout);
router.get('/profile', authenticate, authController.getProfile);
router.put('/profile/:id', authenticate, isAdmin, authController.updateProfile);

module.exports = router;
