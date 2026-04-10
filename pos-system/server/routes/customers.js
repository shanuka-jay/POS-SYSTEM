const express = require('express');
const router = express.Router();
const { getCustomers, getCustomer, createCustomer, updateCustomer, deleteCustomer, getCustomerHistory } = require('../controllers/customerController');
const { protect, authorize } = require('../middleware/auth');

router.use(protect);

router.get('/', getCustomers);
router.get('/:id', getCustomer);
router.get('/:id/history', getCustomerHistory);
router.post('/', authorize('admin', 'manager', 'cashier'), createCustomer);
router.put('/:id', authorize('admin', 'manager'), updateCustomer);
router.delete('/:id', authorize('admin'), deleteCustomer);

module.exports = router;

