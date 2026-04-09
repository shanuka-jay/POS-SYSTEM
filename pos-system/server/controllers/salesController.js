const Sale = require('../models/Sale');
const Product = require('../models/Product');
const Customer = require('../models/Customer');

exports.createSale = async (req, res) => {
  try {
    const { items, customer, subtotal, taxRate, taxAmount, discount, total, paymentMethod, amountPaid, notes } = req.body;

    // Validate stock availability and reduce stock
    for (const item of items) {
      const product = await Product.findById(item.product);
      if (!product) {
        return res.status(404).json({ message: `Product ${item.name} not found` });
      }
      if (product.stock < item.quantity) {
        return res.status(400).json({ message: `Insufficient stock for ${product.name}. Available: ${product.stock}` });
      }
    }

    // Deduct stock
    for (const item of items) {
      await Product.findByIdAndUpdate(item.product, { $inc: { stock: -item.quantity } });
    }

    const change = paymentMethod === 'cash' && amountPaid ? amountPaid - total : 0;

    const sale = await Sale.create({
      items,
      customer: customer || null,
      cashier: req.user._id,
      subtotal,
      taxRate: taxRate || 0,
      taxAmount: taxAmount || 0,
      discount: discount || 0,
      total,
      paymentMethod,
      amountPaid,
      change,
      notes,
    });

    // Update customer stats
    if (customer) {
      await Customer.findByIdAndUpdate(customer, {
        $inc: { totalPurchases: 1, totalSpent: total },
      });
    }

    const populatedSale = await Sale.findById(sale._id)
      .populate('customer', 'name phone email')
      .populate('cashier', 'name email');

    res.status(201).json(populatedSale);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getSales = async (req, res) => {
  try {
    const { startDate, endDate, limit = 50, page = 1 } = req.query;
    const filter = {};
    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) filter.createdAt.$gte = new Date(startDate);
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        filter.createdAt.$lte = end;
      }
    }
    const skip = (page - 1) * limit;
    const total = await Sale.countDocuments(filter);
    const sales = await Sale.find(filter)
      .populate('customer', 'name phone')
      .populate('cashier', 'name')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit));

    res.json({ sales, total, page: Number(page), pages: Math.ceil(total / limit) });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getSale = async (req, res) => {
  try {
    const sale = await Sale.findById(req.params.id)
      .populate('customer', 'name phone email')
      .populate('cashier', 'name email')
      .populate('items.product', 'name sku');
    if (!sale) return res.status(404).json({ message: 'Sale not found' });
    res.json(sale);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getRecentSales = async (req, res) => {
  try {
    const sales = await Sale.find({ status: 'completed' })
      .populate('customer', 'name')
      .populate('cashier', 'name')
      .sort({ createdAt: -1 })
      .limit(10);
    res.json(sales);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
