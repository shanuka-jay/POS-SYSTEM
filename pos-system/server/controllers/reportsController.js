const Sale = require('../models/Sale');
const Product = require('../models/Product');

exports.getDashboard = async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);
    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);

    // For cashier: scope today's sales to their own transactions
    const isCashier = req.user.role === 'cashier';
    const cashierFilter = isCashier ? { cashier: req.user._id } : {};

    const [todaySales, monthSales, totalProducts, lowStockProducts, recentSales] = await Promise.all([
      Sale.aggregate([
        { $match: { ...cashierFilter, createdAt: { $gte: today, $lte: todayEnd }, status: 'completed' } },
        { $group: { _id: null, total: { $sum: '$total' }, count: { $sum: 1 } } },
      ]),
      Sale.aggregate([
        { $match: { ...cashierFilter, createdAt: { $gte: monthStart }, status: 'completed' } },
        { $group: { _id: null, total: { $sum: '$total' }, count: { $sum: 1 } } },
      ]),
      Product.countDocuments({ isActive: true }),
      Product.find({ isActive: true }).then((products) => products.filter((p) => p.stock <= p.lowStockThreshold).length),
      Sale.find({ ...cashierFilter, status: 'completed' })
        .populate('customer', 'name')
        .populate('cashier', 'name')
        .sort({ createdAt: -1 })
        .limit(10),
    ]);

    res.json({
      todaySales: todaySales[0] || { total: 0, count: 0 },
      monthSales: monthSales[0] || { total: 0, count: 0 },
      totalProducts,
      lowStockProducts,
      recentSales,
      role: req.user.role,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getCashierDashboard = async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);
    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);

    const [todaySales, monthSales, recentSales] = await Promise.all([
      Sale.aggregate([
        { $match: { cashier: req.user._id, createdAt: { $gte: today, $lte: todayEnd }, status: 'completed' } },
        { $group: { _id: null, total: { $sum: '$total' }, count: { $sum: 1 } } },
      ]),
      Sale.aggregate([
        { $match: { cashier: req.user._id, createdAt: { $gte: monthStart }, status: 'completed' } },
        { $group: { _id: null, total: { $sum: '$total' }, count: { $sum: 1 } } },
      ]),
      Sale.find({ cashier: req.user._id, status: 'completed' })
        .populate('customer', 'name')
        .sort({ createdAt: -1 })
        .limit(10),
    ]);

    res.json({
      todaySales: todaySales[0] || { total: 0, count: 0 },
      monthSales: monthSales[0] || { total: 0, count: 0 },
      recentSales,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getDailySales = async (req, res) => {
  try {
    const { date } = req.query;
    const targetDate = date ? new Date(date) : new Date();
    targetDate.setHours(0, 0, 0, 0);
    const endDate = new Date(targetDate);
    endDate.setHours(23, 59, 59, 999);

    const sales = await Sale.find({
      createdAt: { $gte: targetDate, $lte: endDate },
      status: 'completed',
    })
      .populate('customer', 'name')
      .populate('cashier', 'name')
      .sort({ createdAt: -1 });

    const summary = sales.reduce(
      (acc, sale) => {
        acc.totalSales += sale.total;
        acc.totalTransactions += 1;
        acc.totalTax += sale.taxAmount;
        acc.totalDiscount += sale.discount;
        const cost = sale.items.reduce((sum, item) => sum + item.cost * item.quantity, 0);
        acc.totalProfit += sale.total - cost;
        return acc;
      },
      { totalSales: 0, totalTransactions: 0, totalTax: 0, totalDiscount: 0, totalProfit: 0 }
    );

    res.json({ date: targetDate, summary, sales });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getMonthlySales = async (req, res) => {
  try {
    const { year = new Date().getFullYear(), month } = req.query;

    let matchStage;
    if (month) {
      const startDate = new Date(year, month - 1, 1);
      const endDate = new Date(year, month, 0, 23, 59, 59, 999);
      matchStage = { createdAt: { $gte: startDate, $lte: endDate }, status: 'completed' };
    } else {
      const startDate = new Date(year, 0, 1);
      const endDate = new Date(year, 11, 31, 23, 59, 59, 999);
      matchStage = { createdAt: { $gte: startDate, $lte: endDate }, status: 'completed' };
    }

    const dailyData = await Sale.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' },
            day: { $dayOfMonth: '$createdAt' },
          },
          totalSales: { $sum: '$total' },
          transactions: { $sum: 1 },
          totalTax: { $sum: '$taxAmount' },
          totalDiscount: { $sum: '$discount' },
        },
      },
      { $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 } },
    ]);

    const monthlyData = await Sale.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: { year: { $year: '$createdAt' }, month: { $month: '$createdAt' } },
          totalSales: { $sum: '$total' },
          transactions: { $sum: 1 },
        },
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } },
    ]);

    const topProducts = await Sale.aggregate([
      { $match: matchStage },
      { $unwind: '$items' },
      {
        $group: {
          _id: '$items.product',
          name: { $first: '$items.name' },
          totalQuantity: { $sum: '$items.quantity' },
          totalRevenue: { $sum: '$items.subtotal' },
        },
      },
      { $sort: { totalRevenue: -1 } },
      { $limit: 10 },
    ]);

    const summary = await Sale.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: null,
          totalSales: { $sum: '$total' },
          transactions: { $sum: 1 },
          totalTax: { $sum: '$taxAmount' },
          totalDiscount: { $sum: '$discount' },
          avgTransaction: { $avg: '$total' },
        },
      },
    ]);

    res.json({
      summary: summary[0] || { totalSales: 0, transactions: 0, totalTax: 0, totalDiscount: 0, avgTransaction: 0 },
      dailyData,
      monthlyData,
      topProducts,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

