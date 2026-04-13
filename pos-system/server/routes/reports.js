const express = require('express');
const router = express.Router();
const { getDashboard, getCashierDashboard, getDailySales, getMonthlySales } = require('../controllers/reportsController');
const { protect, authorize } = require('../middleware/auth');

router.use(protect);

// Dashboard accessible by all roles (cashier gets a simplified version)
router.get('/dashboard', getDashboard);
router.get('/cashier-dashboard', getCashierDashboard);

// Detailed reports restricted to admin/manager
router.get('/daily', authorize('admin', 'manager'), getDailySales);
router.get('/monthly', authorize('admin', 'manager'), getMonthlySales);

module.exports = router;

