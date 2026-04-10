const express = require('express');
const router = express.Router();
const {
  register,
  login,
  getMe,
  getUsers,
  createUser,
  updateUser,
  toggleUserStatus,
  deleteUser,
} = require('../controllers/authController');
const { protect, authorize } = require('../middleware/auth');

// Public
router.post('/login', login);
router.post('/register', register);

// Authenticated
router.get('/me', protect, getMe);

// Admin-only user management
router.get('/users', protect, authorize('admin'), getUsers);
router.post('/users', protect, authorize('admin'), createUser);
router.put('/users/:id', protect, authorize('admin'), updateUser);
router.patch('/users/:id/toggle', protect, authorize('admin'), toggleUserStatus);
router.delete('/users/:id', protect, authorize('admin'), deleteUser);

module.exports = router;
