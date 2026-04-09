const express = require('express');
const router = express.Router();
const { createSale, getSales, getSale, getRecentSales } = require('../controllers/salesController');
const { protect } = require('../middleware/auth');

router.use(protect);

router.post('/', createSale);
router.get('/', getSales);
router.get('/recent', getRecentSales);
router.get('/:id', getSale);

module.exports = router;
